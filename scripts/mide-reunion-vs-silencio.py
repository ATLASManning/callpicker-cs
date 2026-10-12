# -*- coding: utf-8 -*-
u"""Reuniones capturadas que NO apagan el reloj del silencio.

   Hay DOS caminos para el mismo hecho de negocio «hablamos con el cliente»:

     1. El modulo Reuniones  -> tabla `reuniones`
     2. Un seguimiento con tipo='reunion' -> tabla `seguimientos`

   Solo el SEGUNDO cuenta. `lib/contacto-cuenta.ts` incluye 'reunion' en
   CANALES_CONTACTO, pero mira `seguimientos`, no `reuniones`; y
   `detectarAlertas` nunca abre la tabla `reuniones`.

   Consecuencia: alguien se sienta con el cliente, lo captura en Reuniones, y
   el tablero sigue diciendo que la cuenta lleva N dias en silencio.

   Este guion mide CUANTAS veces ha pasado eso de verdad: reuniones
   vinculadas a una cuenta, con fecha POSTERIOR al ultimo contacto que el
   motor reconoce. Cada una es un dia de silencio que el tablero cuenta de
   mas.

   Credenciales de `.env.local`, y NO se imprimen.
"""
import io
import os
import sys
import json
import datetime
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def env(clave):
    p = os.path.join(RAIZ, '.env.local')
    for linea in io.open(p, encoding='utf-8'):
        linea = linea.strip()
        if linea.startswith(clave + '='):
            return linea.split('=', 1)[1].strip().strip('"').strip("'")
    return None


URL = env('NEXT_PUBLIC_SUPABASE_URL')
KEY = env('SUPABASE_SERVICE_ROLE_KEY') or env('SUPABASE_SERVICE_KEY')
if not URL or not KEY:
    print(u'  *** faltan credenciales'); sys.exit(2)


def trae(tabla, select):
    filas, desde, paso = [], 0, 1000
    while True:
        u = u'%s/rest/v1/%s?select=%s&offset=%d&limit=%d' % (URL, tabla, select, desde, paso)
        r = urllib.request.Request(u, headers={'apikey': KEY, 'Authorization': 'Bearer ' + KEY})
        try:
            lote = json.loads(urllib.request.urlopen(r, timeout=60).read().decode('utf-8'))
        except Exception as e:
            print(u'  *** %s: %s' % (tabla, e)); sys.exit(2)
        filas.extend(lote)
        if len(lote) < paso:
            return filas
        desde += paso


# Los canales que SI cuentan como contacto, de lib/contacto-cuenta.ts.
CANALES = {'llamada', 'correo', 'whatsapp', 'reunion', 'visita'}

HOY = datetime.date(2026, 10, 12)


def dia(s):
    try:
        return datetime.date(*[int(x) for x in str(s)[:10].split('-')])
    except Exception:
        return None


cuentas = {c['id']: c for c in trae('cuentas', 'id,empresa,asesor,estado,facturacion')}
seg = trae('seguimientos', 'cuenta_id,fecha,tipo')
reu = trae('reuniones', 'id,fecha,tipo,titulo,cuenta_id,empresa')

# ── EL MOTOR CUENTA DOS FUENTES, NO UNA ────────────────────────────────────
# La primera version de esta sonda solo miraba `seguimientos` y por eso decia
# que GRUPO TORRES CORZO estaba en «nunca contactada». La pantalla decia 28
# dias. `ultimoContactoEfectivoPorCuenta` tambien lee `actividades`, y una
# actividad CERRADA de canal real es contacto con fecha igual que un
# seguimiento. Sin esa mitad, la sonda inventaba un silencio que no existe —
# justo el error que tiene prohibido cometer.
actos = trae('actividades', 'cuenta_id,tipo,completada,completada_en,fecha_programada')

ultimo = {}


def anota(cid, d):
    if not cid or not d:
        return
    if cid not in ultimo or d > ultimo[cid]:
        ultimo[cid] = d


for s in seg:
    if s.get('tipo') in CANALES:
        anota(s.get('cuenta_id'), dia(s.get('fecha')))

for a in actos:
    # Solo las cerradas, y solo de canal: una programada y no hecha es una
    # intencion, no un contacto.
    if not a.get('completada'):
        continue
    if a.get('tipo') not in CANALES:
        continue
    anota(a.get('cuenta_id'), dia(a.get('completada_en')) or dia(a.get('fecha_programada')))

print(u'\n  ── LO QUE EL MOTOR YA CUENTA ──────────────────────────────────')
print(u'  seguimientos de canal: %d'
      % sum(1 for s in seg if s.get('tipo') in CANALES and s.get('cuenta_id')))
print(u'  actividades cerradas de canal: %d'
      % sum(1 for a in actos if a.get('completada') and a.get('tipo') in CANALES
            and a.get('cuenta_id')))
print(u'  -> %d cuenta(s) con ultimo contacto reconocido' % len(ultimo))
reu_vinc = [r for r in reu if r.get('cuenta_id')]
print(u'  reuniones vinculadas  (NO cuentan): %d sobre %d cuentas'
      % (len(reu_vinc), len({r['cuenta_id'] for r in reu_vinc})))

print(u'\n  ── REUNIONES QUE EL MOTOR NO VE ───────────────────────────────')
print(u'  (vinculadas, y POSTERIORES al ultimo contacto reconocido:')
print(u'   cada una es silencio que el tablero cuenta de mas)\n')

casos = []
for r in reu_vinc:
    cid = r['cuenta_id']
    d = dia(r.get('fecha'))
    if not d:
        continue
    prev = ultimo.get(cid)
    if prev is None or d > prev:
        c = cuentas.get(cid, {})
        casos.append({
            'empresa': c.get('empresa') or r.get('empresa') or cid[:8],
            'asesor': c.get('asesor') or u'—',
            'estado': c.get('estado') or u'—',
            'mrr': float(c.get('facturacion') or 0),
            'reunion': d, 'prev': prev,
            'silencio_real': (HOY - d).days,
            'silencio_tablero': (HOY - prev).days if prev else None,
            'titulo': r.get('titulo') or u'',
            # SOLO `cliente` es contacto. Una de estrategia es SOBRE la
            # cuenta, no CON ella: `esConElCliente` en lib/reuniones-tipo.ts
            # lo dice, y confundirlo inflaria el relacionamiento igual que
            # ya paso el 1 oct. Mi primer conteo no lo separaba.
            'tipo': r.get('tipo') or u'—',
            'con_cliente': r.get('tipo') == 'cliente',
        })

casos.sort(key=lambda x: -x['mrr'])
if not casos:
    print(u'  ninguna: cada reunion vinculada tiene un seguimiento de canal')
    print(u'  igual o posterior. El hueco existe pero hoy no cuesta nada.')
else:
    print(u'  %-30s %-9s %-11s %7s %8s %7s'
          % (u'cuenta', u'asesor', u'tipo', u'reunion', u'tablero', u'real'))
    print(u'  ' + u'─' * 78)
    for c in casos:
        tab = u'%d d' % c['silencio_tablero'] if c['silencio_tablero'] is not None else u'nunca'
        print(u'  %-30s %-9s %-11s %7s %8s %6s %s'
              % (c['empresa'][:30], str(c['asesor'])[:9], c['tipo'][:11],
                 c['reunion'].isoformat()[5:], tab, u'%d d' % c['silencio_real'],
                 u'' if c['con_cliente'] else u'  (no es contacto)'))

    por_tipo = {}
    for c in casos:
        por_tipo[c['tipo']] = por_tipo.get(c['tipo'], 0) + 1
    print(u'\n  por tipo: %s' % u', '.join(
        u'%s %d' % (k, v) for k, v in sorted(por_tipo.items(), key=lambda x: -x[1])))

    # SOLO las de tipo `cliente` cuentan como contacto.
    casos = [c for c in casos if c['con_cliente']]
    if not casos:
        print(u'\n  NINGUNA es de tipo `cliente`: ninguna deberia apagar el')
        print(u'  reloj del silencio, y el motor hace bien en no verlas.')
        print(u'  El hueco de las reuniones NO es el que yo crei.')
        sys.exit(0)
    dinero = sum(c['mrr'] for c in casos)
    cuentas_afectadas = len({c['empresa'] for c in casos})
    print(u'\n  de tipo `cliente` —las unicas que son CONTACTO—:')
    print(u'  %d reunion(es) sobre %d cuenta(s) · $%s al mes'
          % (len(casos), cuentas_afectadas, u'{:,.0f}'.format(dinero)))
    # ¿Cuantas de esas cuentas tienen HOY una alerta de silencio que el
    # tablero no deberia estar enseñando?
    enganosas = [c for c in casos
                 if c['silencio_tablero'] is None or c['silencio_tablero'] >= 30]
    if enganosas:
        print(u'\n  *** %d de ellas cruzan el umbral de 30 dias EN EL TABLERO'
              % len(enganosas))
        print(u'      pero su reunion real es mas reciente. Son alertas de')
        print(u'      silencio que estan mintiendo ahora mismo:')
        for c in enganosas:
            tab = (u'nunca contactada' if c['silencio_tablero'] is None
                   else u'%d dias' % c['silencio_tablero'])
            print(u'        %-34s tablero dice «%s», reunion hace %d'
                  % (c['empresa'][:34], tab, c['silencio_real']))
