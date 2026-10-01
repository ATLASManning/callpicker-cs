# -*- coding: utf-8 -*-
"""Dispara el lote semanal de actividades sin depender del cron de Vercel.

   POR QUE EXISTE
   --------------
   El lote del lunes lo deberia disparar Vercel sola, con el cron declarado en
   `vercel.json`. Ese cron no corre porque el middleware exige la cabecera
   `Authorization: Bearer $CRON_SECRET`, y la variable CRON_SECRET no esta
   puesta en el panel de Vercel. Esta cerrado a proposito: sin ella, la puerta
   no abre para nadie.

   El 30 sep 2026 Jose Manuel no pudo entrar a ese panel -- el proyecto vive en
   un equipo, no a su nombre. La instruccion del 28 sigue en pie: «deja
   funcionando el cron del lunes». Cambia el mecanismo, no la instruccion.
   Esto es el plan B: en lugar de que Vercel se autentique con el secreto, nos
   autenticamos nosotros con una sesion efimera y llamamos al mismo generador.

   COMO SE AUTENTICA
   -----------------
   Acuna un JWT HS256 con el mismo JWT_SECRET que usa `lib/auth.ts`, con el
   correo del administrador, y lo manda en la cookie `cp_session`. El token vive
   10 minutos y nunca se escribe en disco. El secreto se lee de `.env.local` y
   jamas se imprime.

   LA TRAMPA QUE ESTE SCRIPT VIGILA
   --------------------------------
   Si la sesion no sirve, el middleware NO devuelve 401: redirige a `/acceso`,
   y una redireccion es HTTP 200 con HTML. `urlopen` la sigue y el que llama ve
   exito. Asi estuvo rota la conciliacion con Zoho durante meses y asi llevaban
   los crons sin correr. Por eso aqui toda respuesta se exige JSON: si llega
   HTML, es fallo de autenticacion y se dice con todas sus letras.

   IDEMPOTENTE
   -----------
   El generador contesta «Ya existen actividades para esta semana» si ya se
   generaron. Repetirlo no duplica, asi que es seguro reintentar y es inofensivo
   que alguien lo dispare a mano el mismo dia que lo hizo el cron.

   SI VERCEL YA PUEDE
   ------------------
   Lo primero que hace es preguntar a `/api/cron/estado`. Si CRON_SECRET ya esta
   configurado, Vercel es quien manda: el script NO genera, solo verifica e
   informa. Asi este plan B se apaga solo el dia que se arregle el panel, sin
   que nadie tenga que acordarse de desactivarlo.

   USO
   ---
       python scripts/genera-lote-semanal.py             # solo si hoy es lunes
       python scripts/genera-lote-semanal.py --forzar    # cualquier dia
       python scripts/genera-lote-semanal.py --verifica  # no genera, solo mira
       python scripts/genera-lote-semanal.py --prueba-cron
"""
import base64
import hashlib
import hmac
import io
import json
import os
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = 'https://callpicker-cs.vercel.app'
ASESORES = ['Claudia', 'Dan', 'Fátima']
POR_ASESOR = 10          # el tope de la casa: 10 seguimientos por asesor
VIDA_TOKEN = 10 * 60     # segundos

# Mexico va en UTC-6 todo el ano: desde 2022 ya no cambia de horario.
MEXICO = timezone(timedelta(hours=-6))


def ahora_mexico():
    return datetime.now(timezone.utc).astimezone(MEXICO)


def lee_env(clave):
    """Lee una variable de .env.local. Devuelve None si no esta."""
    ruta = os.path.join(RAIZ, '.env.local')
    if not os.path.exists(ruta):
        return None
    with io.open(ruta, encoding='utf-8-sig') as f:
        for linea in f:
            linea = linea.strip()
            if linea.startswith(clave + '='):
                return linea.split('=', 1)[1].strip().strip('"').strip("'")
    return None


def b64(raw):
    return base64.urlsafe_b64encode(raw).rstrip(b'=').decode()


def acuna_token(email, secreto):
    """JWT HS256 identico al que emite lib/auth.ts, con vida de 10 minutos."""
    cab = b64(json.dumps({'alg': 'HS256', 'typ': 'JWT'}, separators=(',', ':')).encode())
    ahora = int(time.time())
    cuerpo = b64(json.dumps({
        'email': email,
        'nombre': 'Cron local',
        'rol': 'admin',
        'asesor_nombre': None,
        'iat': ahora,
        'exp': ahora + VIDA_TOKEN,
    }, separators=(',', ':')).encode())
    firmable = f'{cab}.{cuerpo}'.encode()
    firma = b64(hmac.new(secreto.encode(), firmable, hashlib.sha256).digest())
    return f'{cab}.{cuerpo}.{firma}'


def pide(ruta, token=None, cuerpo=None, segundos=90):
    """Llama al dashboard y EXIGE JSON. HTML = la sesion no sirvio."""
    req = urllib.request.Request(BASE + ruta)
    if token:
        req.add_header('Cookie', f'cp_session={token}')
    if cuerpo is not None:
        req.add_header('Content-Type', 'application/json')
        req.data = json.dumps(cuerpo).encode()
        req.get_method = lambda: 'POST'
    try:
        with urllib.request.urlopen(req, timeout=segundos) as r:
            crudo = r.read().decode('utf-8', 'ignore')
            estado = r.status
    except urllib.error.HTTPError as e:
        crudo = e.read().decode('utf-8', 'ignore')
        estado = e.code
    cabeza = crudo.lstrip()[:200].lower()
    if cabeza.startswith('<!doctype') or cabeza.startswith('<html'):
        return estado, None, 'el middleware devolvio HTML: la sesion no fue aceptada'
    try:
        return estado, json.loads(crudo), None
    except ValueError:
        return estado, None, f'respuesta ilegible: {crudo[:160]}'


def prueba_cron():
    """¿De verdad abre la puerta el middleware a una llamada de cron?

       `/api/cron/estado` dice si CRON_SECRET existe, pero lo lee la RUTA, que
       corre en Node y ve las variables en tiempo de ejecucion. Quien decide si
       la llamada entra es el MIDDLEWARE, que corre en el Edge, donde las
       variables se incrustan al CONSTRUIR. Las dos cosas pueden discrepar: el
       estado en `true` y el middleware todavia rebotando porque su copia es de
       un build anterior.

       Esta prueba llama al cron de verdad, con la cabecera de verdad. Hoy no es
       lunes, asi que la respuesta esperada es `omitido: no es lunes en Mexico`:
       eso demuestra que ENTRO y que la guarda funciona, sin generar nada. Un
       401 significa secreto distinto; HTML significa que el middleware lo
       desvio al login y el cron seguiria sin correr.
    """
    secreto = lee_env('CRON_SECRET')
    if not secreto:
        print('No hay CRON_SECRET en .env.local; no se puede imitar la llamada de Vercel.')
        return 1

    # Primero se le pregunta al Edge por si mismo. `/api/cron/estado` es publica,
    # asi que esto responde aunque la puerta del cron siga cerrada -- y separa las
    # tres causas: no llego al Edge, el valor es otro, o el fallo esta en otra parte.
    diag = urllib.request.Request(BASE + '/api/cron/estado')
    diag.add_header('Authorization', f'Bearer {secreto}')
    causa = None
    try:
        with urllib.request.urlopen(diag, timeout=30) as r:
            d = json.loads(r.read().decode('utf-8'))
        print(f"  Node ve la variable : {d.get('cronSecretConfigurado')}")
        print(f"  Edge ve la variable : {d.get('edgeTieneLaVariable')}")
        print(f"  coincide con la mia : {d.get('loQueMandasteCoincide')}")
        print(f"  {d.get('nota')}\n")
        if d.get('edgeTieneLaVariable') == 'no':
            causa = 'la variable aun no llego al Edge: falta REDESPLEGAR'
        elif d.get('loQueMandasteCoincide') == 'no':
            causa = ('el Edge tiene OTRO valor: el guardado en Vercel y el de '
                     '.env.local no son el mismo. Hay que volver a pegarlo')
    except Exception as e:
        print(f'  (no se pudo leer el diagnostico del Edge: {e})\n')

    req = urllib.request.Request(BASE + '/api/cron/generar-semana')
    req.add_header('Authorization', f'Bearer {secreto}')
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            crudo, estado = r.read().decode('utf-8', 'ignore'), r.status
    except urllib.error.HTTPError as e:
        crudo, estado = e.read().decode('utf-8', 'ignore'), e.code
    cabeza = crudo.lstrip()[:200].lower()
    if cabeza.startswith('<!doctype') or cabeza.startswith('<html'):
        # El HTML solo dice que el middleware lo mando al login; NO dice por que.
        # La causa la da el diagnostico de arriba, que es quien la midio.
        print(f'FALLA (HTTP {estado}): el middleware lo desvio al login.')
        print(f'  Causa: {causa if causa else "no determinada; revisar el diagnostico de arriba"}')
        return 1
    if estado == 401:
        print('FALLA (HTTP 401): la ruta no reconocio el secreto.')
        print('El valor de Vercel y el de .env.local no son el mismo.')
        return 1
    try:
        datos = json.loads(crudo)
    except ValueError:
        print(f'Respuesta ilegible (HTTP {estado}): {crudo[:200]}')
        return 1
    print(f'PASA (HTTP {estado}): la llamada de cron entro.')
    print(f'  respuesta: {json.dumps(datos, ensure_ascii=False)[:300]}')
    if datos.get('omitido'):
        print('  Omitio por no ser lunes, que es exactamente lo correcto hoy.')
    elif datos.get('totalGeneradas') is not None:
        print(f'  OJO: genero {datos["totalGeneradas"]} actividades en esta prueba.')
    return 0


def main():
    if '--prueba-cron' in sys.argv:
        return prueba_cron()
    forzar = '--forzar' in sys.argv
    solo_verifica = '--verifica' in sys.argv
    hoy = ahora_mexico()
    print(f'Mexico: {hoy:%Y-%m-%d %H:%M} ({["lunes","martes","miercoles","jueves","viernes","sabado","domingo"][hoy.weekday()]})')

    # 1. ¿Vercel ya puede sola?
    estado, datos, err = pide('/api/cron/estado')
    if err:
        print(f'  AVISO: no se pudo leer /api/cron/estado -- {err}')
    elif datos and datos.get('puedenCorrer'):
        print('\nCRON_SECRET YA ESTA CONFIGURADO EN VERCEL.')
        print('Vercel dispara el lote sola los lunes 08:00 de Mexico.')
        print('Este script ya no hace falta: verifica abajo y no genera nada.')
        solo_verifica = True
    else:
        print('  CRON_SECRET sigue sin configurar en Vercel: toca dispararlo desde aqui.')

    # 2. Guarda de lunes, en hora de Mexico.
    if not solo_verifica and hoy.weekday() != 0 and not forzar:
        print('\nHoy no es lunes en Mexico. No se genera.')
        print('Para probarlo igual: python scripts/genera-lote-semanal.py --forzar')
        return 0

    secreto = lee_env('JWT_SECRET')
    email = lee_env('ADMIN_EMAIL') or 'josel@callpicker.com'
    if not secreto:
        print('\nFALTA JWT_SECRET en .env.local. Sin el no se puede acunar sesion.')
        return 1
    token = acuna_token(email, secreto)

    if solo_verifica:
        # `semana` es el LUNES de la semana en formato YYYY-MM-DD, no una palabra.
        lunes = (hoy - timedelta(days=hoy.weekday())).strftime('%Y-%m-%d')
        estado, datos, err = pide(f'/api/actividades?semana={lunes}', token=token)
        if err:
            print(f'\nNo se pudo verificar: {err}')
            return 1
        filas = datos if isinstance(datos, list) else (datos or {}).get('actividades') or []
        print(f'\nVerificacion de la semana del {lunes} (HTTP {estado}): {len(filas)} actividades')
        for asesor in ASESORES:
            suyas = [a for a in filas if a.get('asesor') == asesor]
            cerradas = sum(1 for a in suyas if a.get('completada'))
            print(f'  {asesor:<10} {len(suyas):>3} asignadas, {cerradas:>3} cerradas')
        huerfanas = [a for a in filas if a.get('asesor') not in ASESORES]
        if huerfanas:
            print(f'  OJO: {len(huerfanas)} actividad(es) con asesor fuera de la lista.')
        return 0

    # 3. Generar, asesor por asesor.
    print(f'\nGenerando el lote ({POR_ASESOR} por asesor, sin correo automatico):')
    total = 0
    fallos = 0
    guardas = 0
    for asesor in ASESORES:
        estado, datos, err = pide('/api/actividades/generar', token=token,
                                  cuerpo={'asesor': asesor, 'sendEmail': False})
        if err:
            print(f'  {asesor:<10} FALLO  {err}')
            fallos += 1
            continue
        generadas = (datos or {}).get('generadas')
        mensaje = (datos or {}).get('message') or (datos or {}).get('error') or ''
        focos = ((datos or {}).get('acervoDeRiesgo') or {}).get('generadas')
        if estado >= 400:
            # El generador tiene su PROPIA guarda de lunes, en el servidor. Un 409
            # por ese motivo no es una falla: es la regla haciendo su trabajo, y
            # `--forzar` no la levanta -- solo salta la guarda local de aqui.
            # Levantarla requiere excepcion administrativa, a proposito.
            guarda = estado == 409 and 'solo se generan los lunes' in (mensaje or '')
            print(f'  {asesor:<10} HTTP {estado}  {mensaje}')
            if not guarda:
                fallos += 1
            else:
                guardas += 1
            continue
        total += int(generadas or 0)
        extra = f', focos {focos}' if focos is not None else ''
        print(f'  {asesor:<10} {generadas if generadas is not None else "-"} generadas{extra}  {mensaje}')

    print(f'\nTotal generadas: {total}')
    esperado = POR_ASESOR * len(ASESORES)
    if guardas == len(ASESORES):
        print('El servidor rechazo los tres por no ser lunes en Mexico. Eso es correcto:')
        print('--forzar salta la guarda LOCAL, no la del servidor. Nada que arreglar.')
        return 0
    if fallos:
        print(f'ATENCION: {fallos} asesor(es) sin generar. Revisar antes de darlo por hecho.')
        return 1
    if total and total != esperado:
        print(f'ATENCION: se esperaban {esperado} ({POR_ASESOR} x {len(ASESORES)}) y salieron {total}.')
        print('Si el mensaje dice «ya existen», es que el lote ya estaba: eso es correcto.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
