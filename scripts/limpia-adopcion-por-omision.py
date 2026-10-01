# -*- coding: utf-8 -*-
"""Borra los «No Aplica» que el modal escribio por omision, no por juicio.

   POR QUE EXISTE
   --------------
   El modal de Adopcion inicializaba los OCHO productos en `no_aplica` y los
   guardaba todos, tocara la asesora uno o cinco. «No aplica» es una AFIRMACION
   —este cliente no tiene este producto—, asi que el valor por omision convertia
   un campo en blanco en un juicio que nadie emitio.

   Y el dano era permanente por diseno: el candado de `/api/adopcion/auto`
   —«nunca sobrescribo lo que puso una persona»— no distingue un juicio
   deliberado de un valor por defecto, asi que esos pares (cuenta, producto)
   quedaban fuera de la evaluacion automatica para siempre.

   LA PRUEBA DE QUE SON POR OMISION, NO JUICIOS
   --------------------------------------------
   Medido el 1 de octubre de 2026 sobre las 1,121 filas:

     · 104 de 104 guardados de asesora tienen EXACTAMENTE 8 filas. Nunca 1,
       nunca 3. Los lotes de la evaluacion automatica, en cambio, van de 1 a 5
       filas, porque esa via escribe solo lo que evaluo.
     · De las 660 filas en `no_aplica`, 566 no llevan nota, y las 566 las
       escribieron las tres asesoras: Fatima 231, Claudia 225, Dan 110.
       NINGUNA es de la evaluacion automatica.
     · Las 94 que SI llevan nota son juicios de verdad —«En negociacion», «El
       plan facturado es …»— y 87 de ellas son de la evaluacion automatica.

   QUE BORRA, EXACTAMENTE
   ----------------------
   Filas con `nivel = 'no_aplica'` Y sin nota Y escritas por una persona. Las
   que llevan nota NO se tocan, aunque sean `no_aplica`: ahi hay un juicio.

   La ausencia de fila ES «sin evaluar»: el panel de la ficha pinta «—», y la
   portada y el Radar no la cuentan ni en el numerador ni en el denominador.

   SE PUEDE DESHACER
   -----------------
   Antes de borrar escribe las filas completas en D:/Archivos/salida. `--restaura`
   las vuelve a insertar desde ese archivo.

   USO
   ---
       python scripts/limpia-adopcion-por-omision.py            # solo simula
       python scripts/limpia-adopcion-por-omision.py --aplica
       python scripts/limpia-adopcion-por-omision.py --restaura <archivo.json>
"""
import collections
import datetime
import io
import json
import os
import sys
import urllib.error
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SALIDA = 'D:/Archivos/salida'
AUTOMATICA = 'Atlas'          # marca del asesor de la evaluacion automatica


def env(clave):
    ruta = os.path.join(RAIZ, '.env.local')
    with io.open(ruta, encoding='utf-8-sig') as f:
        for linea in f:
            if linea.strip().startswith(clave + '='):
                return linea.split('=', 1)[1].strip()
    return None


URL = env('NEXT_PUBLIC_SUPABASE_URL')
KEY = env('SUPABASE_SERVICE_ROLE_KEY')


def pide(metodo, ruta, cuerpo=None, prefer=None):
    r = urllib.request.Request(f'{URL}/rest/v1/{ruta}', method=metodo)
    r.add_header('apikey', KEY)
    r.add_header('Authorization', f'Bearer {KEY}')
    r.add_header('Content-Type', 'application/json')
    if prefer:
        r.add_header('Prefer', prefer)
    if cuerpo is not None:
        r.data = json.dumps(cuerpo).encode()
    with urllib.request.urlopen(r, timeout=90) as x:
        crudo = x.read().decode('utf-8', 'ignore')
    return json.loads(crudo) if crudo.strip() else []


def todas():
    out, desde = [], 0
    while True:
        r = urllib.request.Request(f'{URL}/rest/v1/adopcion_producto?select=*')
        r.add_header('apikey', KEY)
        r.add_header('Authorization', f'Bearer {KEY}')
        r.add_header('Range', f'{desde}-{desde + 999}')
        with urllib.request.urlopen(r, timeout=90) as x:
            lote = json.loads(x.read().decode())
        out += lote
        if len(lote) < 1000:
            return out
        desde += 1000


def por_omision(filas):
    """`no_aplica`, sin nota y escrita por una persona."""
    return [f for f in filas
            if f.get('nivel') == 'no_aplica'
            and not (f.get('notas') or '').strip()
            and AUTOMATICA not in (f.get('asesor') or '')]


def restaura(archivo):
    filas = json.load(io.open(archivo, encoding='utf-8'))
    print(f'  {len(filas)} filas en el respaldo')
    # Sin el `id`: la secuencia asigna uno nuevo y no choca con lo que exista.
    limpias = [{k: v for k, v in f.items() if k != 'id'} for f in filas]
    for i in range(0, len(limpias), 200):
        pide('POST', 'adopcion_producto', limpias[i:i + 200], prefer='return=minimal')
        print(f'    reinsertadas {min(i + 200, len(limpias))} de {len(limpias)}')
    print('  restauracion terminada')
    return 0


def main():
    if '--restaura' in sys.argv:
        return restaura(sys.argv[sys.argv.index('--restaura') + 1])

    aplica = '--aplica' in sys.argv
    filas = todas()
    print(f'  {len(filas)} filas en adopcion_producto\n')

    victimas = por_omision(filas)
    conNota = [f for f in filas
               if f.get('nivel') == 'no_aplica' and (f.get('notas') or '').strip()]
    automaticas = [f for f in filas
                   if f.get('nivel') == 'no_aplica' and AUTOMATICA in (f.get('asesor') or '')]

    print('  LAS QUE SE BORRAN — no_aplica, sin nota, escritas por una persona')
    for a, n in collections.Counter((f.get('asesor') or '(nulo)') for f in victimas).most_common():
        print(f'    {a[:36]:<38}{n:>5}')
    print(f'    {"TOTAL":<38}{len(victimas):>5}\n')
    # El desglose CIERRA: los dos renglones suman el total que queda. Las
    # automaticas son un subconjunto de las que llevan nota, no una tercera
    # categoria — sumarlas aparte daria 642 sobre un total de 555.
    conNivel = sum(1 for f in filas if f.get('nivel') != 'no_aplica')
    quedan = len(filas) - len(victimas)
    print('  LAS QUE SE QUEDAN')
    print(f'    alto / medio / bajo                  {conNivel:>5}')
    print(f'    no_aplica CON nota (hay un juicio)   {len(conNota):>5}'
          f'   de ellas, {len(automaticas)} de la evaluacion automatica')
    print(f'    {"TOTAL":<37}{conNivel + len(conNota):>5}')
    assert conNivel + len(conNota) == quedan, 'el desglose no cierra'
    print()
    print(f'  la tabla pasaria de {len(filas)} a {quedan} filas')

    cuentas = len({f['cuenta_id'] for f in victimas})
    vacias = 0
    porCuenta = collections.defaultdict(list)
    for f in filas:
        porCuenta[f['cuenta_id']].append(f)
    ids = {f['id'] for f in victimas}
    for cid, fs in porCuenta.items():
        if all(f['id'] in ids for f in fs):
            vacias += 1
    print(f'  afecta a {cuentas} cuentas · {vacias} se quedarian SIN NINGUNA fila')
    print('  (sin filas = «sin evaluar»: el panel pinta «—» y nadie la cuenta)\n')

    if not aplica:
        print('  SIMULACION. Para aplicarlo: --aplica')
        return 0

    os.makedirs(SALIDA, exist_ok=True)
    sello = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=-6))).strftime('%Y%m%d-%H%M')
    respaldo = os.path.join(SALIDA, f'adopcion-por-omision-{sello}.json')
    json.dump(victimas, io.open(respaldo, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'  respaldo escrito: {respaldo}')

    borradas = 0
    lista = [f['id'] for f in victimas]
    for i in range(0, len(lista), 100):
        trozo = lista[i:i + 100]
        pide('DELETE', 'adopcion_producto?id=in.(%s)' % ','.join(str(x) for x in trozo),
             prefer='return=minimal')
        borradas += len(trozo)
        print(f'    borradas {borradas} de {len(lista)}')

    despues = todas()
    print(f'\n  COMPROBACION: la tabla tiene ahora {len(despues)} filas (se esperaban {quedan})')
    sobrantes = por_omision(despues)
    print(f'  quedan {len(sobrantes)} filas por omision (se esperaban 0)')
    print(f'  deshacer: python scripts/limpia-adopcion-por-omision.py --restaura "{respaldo}"')
    return 0 if len(despues) == quedan and not sobrantes else 1


if __name__ == '__main__':
    sys.exit(main())
