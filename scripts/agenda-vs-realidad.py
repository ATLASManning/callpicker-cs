# -*- coding: utf-8 -*-
"""Cruza los bloques del calendario contra lo que de verdad quedo registrado.

   POR QUE EXISTE
   --------------
   Jose Manuel, 25 sep 2026: «pregunto que le vieron a los tickets, no hay nada
   registrado o que hayan aportado, lo mismo actualizacion Dashboard las tardes?
   eso no es tener un plan es tapar la agenda con lo que sea».

   Es una pregunta contestable, no una impresion: `uso_dashboard.created_at`
   guarda la hora exacta de cada vista. Si alguien bloquea «Revision de Tickets
   09:00-11:00» de lunes a viernes, se puede mirar que paso en esa franja.

   LO QUE ESTE SCRIPT NO PUEDE DECIR: si el trabajo se hizo FUERA del tablero.
   Revisar tickets se hace en Zoho Desk, no aqui, asi que cero vistas en la
   franja NO prueba que no revisara tickets. Lo que si prueba es que no quedo
   rastro en el sistema donde deberia quedar — y eso es lo que se reporta.

   Es de SOLO LECTURA.
"""
import io
import json
import os
import sys
import urllib.request
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASESORES = ['Claudia', 'Dan', 'Fátima']

E = {}
for ln in io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8'):
    if '=' in ln and not ln.strip().startswith('#'):
        k, v = ln.split('=', 1)
        E[k.strip()] = v.strip().strip('"').strip("'")
BASE = E['NEXT_PUBLIC_SUPABASE_URL'] + '/rest/v1/'
H = {'apikey': E['SUPABASE_SERVICE_ROLE_KEY'],
     'Authorization': 'Bearer ' + E['SUPABASE_SERVICE_ROLE_KEY']}


def q(tabla, params):
    filas, desde = [], 0
    while True:
        url = BASE + tabla + '?' + params + '&offset=%d&limit=1000' % desde
        lote = json.load(urllib.request.urlopen(urllib.request.Request(url, headers=H), timeout=60))
        filas.extend(lote)
        if len(lote) < 1000 or desde > 50000:
            return filas
        desde += 1000


def mx(iso):
    """UTC -> hora de Mexico. Sin esto, la tarde se va al dia siguiente."""
    try:
        return datetime.strptime(str(iso)[:19], '%Y-%m-%dT%H:%M:%S') - timedelta(hours=6)
    except (ValueError, TypeError):
        return None


HOY = (datetime.now(timezone.utc) - timedelta(hours=6)).date()
SEMANA = HOY - timedelta(days=HOY.weekday())

USO = q('uso_dashboard', 'select=asesor,seccion,ruta,duracion_seg,created_at&order=created_at.asc')
CUENTAS = q('cuentas', 'select=id,consecutivo,empresa,cid,asesor,estado,health_score,facturacion')
SEG = q('seguimientos', 'select=asesor,cuenta_id,tipo,fecha,descripcion&order=fecha.desc')
CTA = {c['id']: c for c in CUENTAS}
POR_CID = {str(c.get('cid') or '').strip(): c for c in CUENTAS if c.get('cid')}

# Los bloques que cada uno tiene puestos en su agenda, leidos de las capturas
# que compartio direccion. Se declaran aqui para poder contrastarlos; si la
# agenda cambia, se actualizan.
AGENDA = {
    'Claudia': [
        ('Revisión de Tickets', 9, 11, ['mié', 'jue', 'vie']),
        ('Actividades Dashboard', 16.75, 18.75, ['mié', 'jue', 'vie']),
    ],
    'Dan': [
        ('Revisión tickets', 9, 11.58, ['lun', 'mar', 'mié', 'jue', 'vie']),
        ('tareas dashboard', 17.75, 19.08, ['lun', 'mar', 'mié', 'jue', 'vie']),
    ],
    'Fátima': [],   # su agenda esta en «ocupado»: no hay bloques que contrastar
}
DIAS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom']


def franja(a, etiqueta):
    for nombre, ini, fin, dias in AGENDA.get(a, []):
        if etiqueta in nombre.lower():
            return nombre, ini, fin, dias
    return None


print('=' * 78)
print('  AGENDA CONTRA REGISTRO — semana del %s' % SEMANA.isoformat())
print('=' * 78)

# ══ 1. ¿Se abrió el módulo de Tickets? ═══════════════════════════════
print()
print('1) EL BLOQUE «REVISIÓN DE TICKETS»')
print('   Todos lo tienen puesto. ¿Se abrió el módulo de Tickets del tablero?')
print()
for a in ASESORES:
    sem = [x for x in USO if (x.get('asesor') or '') == a
           and mx(x['created_at']) and mx(x['created_at']).date() >= SEMANA]
    secs = Counter((x.get('seccion') or x.get('ruta') or '?') for x in sem)
    tick = sum(n for s, n in secs.items() if 'ticket' in str(s).lower())
    print('   %-9s %3d vistas esta semana · módulo Tickets: %s'
          % (a, len(sem), ('%d vistas' % tick) if tick else '**CERO**'))
    print('   %-9s secciones: %s' % ('', dict(secs.most_common(7))))
print()
print('   OJO, y es importante: revisar tickets se hace en Zoho Desk, no aquí.')
print('   Cero vistas NO prueba que no los revisaran. Prueba que no quedó rastro')
print('   en el tablero, que es donde el seguimiento se vuelve visible y cruzable.')

# ══ 2. ¿Qué pasó DENTRO de la franja del bloque? ═════════════════════
print()
print('2) ¿HUBO ACTIVIDAD EN LA FRANJA QUE TIENEN BLOQUEADA?')
for a in ASESORES:
    print()
    print('   --- %s ---' % a)
    if not AGENDA.get(a):
        print('       sin bloques declarados (su agenda está en «ocupado»).')
    for nombre, ini, fin, dias_b in AGENDA.get(a, []):
        print('       bloque «%s» %.2f–%.2f, días %s' % (nombre, ini, fin, ', '.join(dias_b)))
        for i in range(5):
            d = SEMANA + timedelta(days=i)
            if d > HOY:
                continue
            etiqueta = DIAS[i]
            vistas = [x for x in USO if (x.get('asesor') or '') == a
                      and mx(x['created_at']) and mx(x['created_at']).date() == d]
            dentro = [x for x in vistas
                      if ini <= (mx(x['created_at']).hour + mx(x['created_at']).minute / 60.0) < fin]
            tiene_bloque = etiqueta in dias_b
            marca = ''
            if tiene_bloque and not dentro:
                marca = '   <-- BLOQUE SIN NINGUNA VISTA'
            elif not tiene_bloque and dentro:
                marca = '   (trabajó sin tener el bloque)'
            print('         %s %s  bloque:%-3s  vistas en la franja: %2d%s'
                  % (etiqueta, d.isoformat(), 'sí' if tiene_bloque else 'no', len(dentro), marca))

# ══ 3. Reparto por hora ══════════════════════════════════════════════
print()
print('3) A QUÉ HORA TRABAJAN DE VERDAD EN EL TABLERO (esta semana, hora de México)')
print('   %-9s %s' % ('', ''.join('%3d' % h for h in range(7, 21))))
for a in ASESORES:
    sem = [x for x in USO if (x.get('asesor') or '') == a
           and mx(x['created_at']) and mx(x['created_at']).date() >= SEMANA]
    porh = Counter(mx(x['created_at']).hour for x in sem)
    print('   %-9s %s' % (a, ''.join(('%3d' % porh[h]) if porh.get(h) else '  ·' for h in range(7, 21))))
fuera = []
for a in ASESORES:
    sem = [x for x in USO if (x.get('asesor') or '') == a
           and mx(x['created_at']) and mx(x['created_at']).date() >= SEMANA]
    n = sum(1 for x in sem if not (9 <= mx(x['created_at']).hour < 19))
    fuera.append((a, n, len(sem)))
print('   fuera de 9–19 h: %s' % ', '.join('%s %d/%d' % f for f in fuera))

# ══ 4. Los tickets fuera de SLA: ¿de quién son y quién los tocó? ═════
print()
print('4) LOS TICKETS FUERA DE SLA — de quién es la cuenta y qué se registró')
import glob
cortes = sorted(glob.glob(os.path.join(RAIZ, 'data', 'mesa-ayuda', '*.json')))
if cortes:
    ult = json.load(io.open(cortes[-1], encoding='utf-8'))
    racha = Counter()
    for f in cortes:
        c = json.load(io.open(f, encoding='utf-8'))
        for cid in {t['cid'] for t in c['ticketsVencidos']}:
            racha[cid] += 1
    print('   corte del %s · %d folios' % (ult['fecha'], len(ult['ticketsVencidos'])))
    print('   %-9s %-26s %-9s %5s %7s  %s'
          % ('CID', 'CUENTA', 'ASESOR', 'DÍAS', 'CORTES', 'SEGUIMIENTOS DE ESA CUENTA'))
    vistos = set()
    for t in sorted(ult['ticketsVencidos'], key=lambda x: -(x['diasSLA'] or 0)):
        if t['cid'] in vistos:
            continue
        vistos.add(t['cid'])
        c = POR_CID.get(t['cid'])
        ases = (c or {}).get('asesor') or '[sin cuenta en cartera]'
        if c:
            segs = [s for s in SEG if s.get('cuenta_id') == c['id']]
            recientes = [s for s in segs if str(s.get('fecha') or '')[:10] >= '2026-09-01']
            det = '%d en total, %d en septiembre' % (len(segs), len(recientes))
        else:
            det = '—'
        print('   %-9s %-26s %-9s %5s %5d/%d  %s'
              % (t['cid'], (t['cuenta'] or '?')[:26], str(ases)[:9],
                 t['diasSLA'], racha[t['cid']], len(cortes), det))

# ══ 5. Las cuentas que dirección señala como próximas ════════════════
print()
print('5) LAS CUENTAS QUE DIRECCIÓN SEÑALA EN RIESGO')
for busca in ('alternet', 'salud', 'kombitec', 'hogar'):
    hits = [c for c in CUENTAS if busca in (c.get('empresa') or '').lower()]
    for c in hits:
        segs = [s for s in SEG if s.get('cuenta_id') == c['id']]
        sep = [s for s in segs if str(s.get('fecha') or '')[:10] >= '2026-09-01']
        ultimo = max((str(s.get('fecha') or '')[:10] for s in segs), default='—')
        print('   %-5s %-28s %-9s %-12s HS %-4s $%-9s seg: %d (sep %d) · último %s'
              % (c.get('consecutivo') or '?', (c.get('empresa') or '')[:28],
                 str(c.get('asesor'))[:9], c.get('estado'),
                 c.get('health_score'), format(int(float(c.get('facturacion') or 0)), ','),
                 len(segs), len(sep), ultimo))

print()
print('  Recordatorio: lo que no está registrado no se puede defender ante finanzas.')
