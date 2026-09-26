# -*- coding: utf-8 -*-
"""Reporte de desempeno de un asesor, con LO QUE QUEDO REGISTRADO.

   POR QUE EXISTE
   --------------
   Jose Manuel pidio el 25 sep 2026 un reporte de desempeno para una
   conversacion dificil. Un reporte asi se sostiene o se cae por su rigor, y el
   rigor aqui tiene tres reglas:

   1. SOLO HECHOS REGISTRADOS. Lo que hay en Supabase y en los archivos de
      datos. Nada de inferir intenciones.
   2. SIEMPRE CONTRA SUS PARES. Un numero suelto no dice si es mucho o poco.
      4 actividades no significan nada hasta saber que hicieron los otros dos.
   3. DECIR LO QUE NO SE PUEDE VER. El tablero mide el tablero. Una llamada que
      no se registro no existe para este reporte, y eso NO prueba que no
      ocurriera — prueba que no quedo registrada, que es otra cosa y hay que
      decirla con esas palabras.

   Es de SOLO LECTURA.

   USO
   ---
       python scripts/reporte-asesor.py Claudia
       python scripts/reporte-asesor.py --todos
"""
import io
import json
import os
import sys
import urllib.parse
import urllib.request
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASESORES = ['Claudia', 'Dan', 'Fátima']


def env():
    d = {}
    for ln in io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8'):
        if '=' in ln and not ln.strip().startswith('#'):
            k, v = ln.split('=', 1)
            d[k.strip()] = v.strip().strip('"').strip("'")
    return d


E = env()
BASE = E['NEXT_PUBLIC_SUPABASE_URL'] + '/rest/v1/'
H = {'apikey': E['SUPABASE_SERVICE_ROLE_KEY'],
     'Authorization': 'Bearer ' + E['SUPABASE_SERVICE_ROLE_KEY']}


def q(tabla, params):
    """Trae TODAS las filas, paginando.

       Supabase corta en 1,000 filas pase lo que pase el `limit`. La primera
       version de este script pedia 20,000 y se quedaba con 1,000 sin avisar:
       `uso_dashboard` tiene 2,198, asi que el reporte se construia sobre menos
       de la mitad de los datos y nadie lo notaba. Un limite silencioso es un
       dato falso con otra cara.
    """
    filas, desde, PASO = [], 0, 1000
    while True:
        url = BASE + tabla + '?' + params + '&offset=%d&limit=%d' % (desde, PASO)
        req = urllib.request.Request(url, headers=dict(H, **{'Range-Unit': 'items'}))
        lote = json.load(urllib.request.urlopen(req, timeout=60))
        filas.extend(lote)
        if len(lote) < PASO:
            return filas
        desde += PASO
        if desde > 100000:
            return filas


def hoy_mx():
    return (datetime.now(timezone.utc) - timedelta(hours=6)).date()


def lunes_de(d):
    return d - timedelta(days=d.weekday())


HOY = hoy_mx()
SEMANA = lunes_de(HOY)
MES = HOY.strftime('%Y-%m')

# ══ Carga unica ══════════════════════════════════════════════════════
CUENTAS = q('cuentas', 'select=id,consecutivo,empresa,cid,asesor,estado,health_score,'
                       'facturacion,ultimo_contacto,dias_sin_actividad&limit=2000')
ACTS = q('actividades', 'select=asesor,empresa,consecutivo,tipo,estado,completada,'
                        'semana_inicio,fecha_programada,completada_en,creado_en,'
                        'tiempo_medido_min,tiempo_reportado_min,resultado,motivo_pendiente'
                        '&order=semana_inicio.desc&limit=4000')
USO = q('uso_dashboard', 'select=asesor,email,ruta,seccion,duracion_seg,created_at'
                         '&order=created_at.desc&limit=20000')
SEG = q('seguimientos', 'select=asesor,cuenta_id,tipo,fecha,duracion_min,descripcion,resultado'
                        '&order=fecha.desc&limit=4000')

CTA_POR_ID = {c['id']: c for c in CUENTAS}

try:
    GRC = json.load(io.open(os.path.join(RAIZ, 'data', 'grc-zoho.json'), encoding='utf-8'))
except Exception:
    GRC = None


def dia(s):
    """El día en HORA DE MÉXICO, no en UTC.

       `created_at` viene en UTC. Cortar con `[:10]` mete la tarde de México en
       el día siguiente: las vistas de Claudia del lunes 18:37 a 20:25 salían
       como del martes, y por eso este reporte contaba 21 vistas el martes donde
       el tablero —que sí ancla a México— muestra 15. El tablero tenía razón.

       Es exactamente el defecto que se corrigió en el módulo de Tickets el 24 de
       septiembre, repetido aquí. La regla de la casa existe porque cuesta:
       ninguna fecha se compara sin anclarla.
    """
    s = str(s or '')
    if len(s) < 19:
        return s[:10]
    try:
        return (datetime.strptime(s[:19], '%Y-%m-%dT%H:%M:%S') - timedelta(hours=6)).strftime('%Y-%m-%d')
    except ValueError:
        return s[:10]


def semanas_recientes(n=6):
    return [(SEMANA - timedelta(weeks=i)).isoformat() for i in range(n)]


# ══ Bloques del reporte ══════════════════════════════════════════════
def bloque_cartera(a):
    mias = [c for c in CUENTAS if (c.get('asesor') or '') == a]
    est = Counter(c.get('estado') for c in mias)
    hs = [c['health_score'] for c in mias if isinstance(c.get('health_score'), (int, float))]
    fac = sum(float(c.get('facturacion') or 0) for c in mias)
    print('  CARTERA')
    print('    %d cuentas · $%s de facturación' % (len(mias), format(int(fac), ',')))
    print('    estados: %s' % dict(est.most_common()))
    if hs:
        hs_s = sorted(hs)
        print('    health score: mediana %d · min %d · max %d · %d por debajo de 60'
              % (hs_s[len(hs_s) // 2], hs_s[0], hs_s[-1], sum(1 for x in hs if x < 60)))
    sin_contacto = [c for c in mias if (c.get('dias_sin_actividad') or 0) > 30]
    print('    %d cuenta(s) con más de 30 días sin actividad registrada' % len(sin_contacto))
    return mias


def bloque_actividades(a):
    mias = [x for x in ACTS if (x.get('asesor') or '') == a]
    print('  ACTIVIDADES SAC')
    if not mias:
        print('    ninguna registrada.')
        return
    sem = semanas_recientes(6)
    print('    %-12s %5s %5s %5s %8s   %s' % ('SEMANA', 'ASIG', 'COMPL', 'PEND', '% COMPL', 'ESTADOS'))
    for s in sem:
        de_s = [x for x in mias if str(x.get('semana_inicio') or '')[:10] == s]
        if not de_s:
            print('    %-12s %5s %5s %5s %8s   —' % (s, 0, 0, 0, '—'))
            continue
        comp = sum(1 for x in de_s if x.get('completada'))
        pend = len(de_s) - comp
        pct = 100.0 * comp / len(de_s)
        marca = ' <-- semana en curso' if s == SEMANA.isoformat() else ''
        print('    %-12s %5d %5d %5d %7.0f%%   %s%s'
              % (s, len(de_s), comp, pend, pct,
                 dict(Counter(x.get('estado') for x in de_s)), marca))
    tot = len(mias)
    comp = sum(1 for x in mias if x.get('completada'))
    print('    histórico: %d asignadas · %d completadas (%.0f%%)'
          % (tot, comp, 100.0 * comp / tot if tot else 0))
    tm = [x['tiempo_medido_min'] for x in mias if isinstance(x.get('tiempo_medido_min'), (int, float)) and x['tiempo_medido_min'] > 0]
    tr = [x['tiempo_reportado_min'] for x in mias if isinstance(x.get('tiempo_reportado_min'), (int, float)) and x['tiempo_reportado_min'] > 0]
    if tm:
        print('    tiempo MEDIDO por el sistema: %d actividades, mediana %d min'
              % (len(tm), sorted(tm)[len(tm) // 2]))
    if tr:
        print('    tiempo REPORTADO por el asesor: %d actividades, mediana %d min'
              % (len(tr), sorted(tr)[len(tr) // 2]))
    motivos = Counter(x.get('motivo_pendiente') for x in mias
                      if not x.get('completada') and x.get('motivo_pendiente'))
    if motivos:
        print('    motivos de pendiente: %s' % dict(motivos.most_common(5)))


# El tope por vista. `duracion_seg` se sella cuando la pestana se cierra, asi
# que una dejada abierta toda la noche registra la noche entera: la vista mas
# larga del archivo son 71.5 HORAS, y 77 vistas de 1,000 (el 7.7%) concentran el
# 73% de todo el tiempo. Sumar esa columna en crudo no mide trabajo, mide
# pestanas olvidadas — y da dias de mas de 24 horas para los tres asesores.
#
# Acotar cada vista a 30 min convierte el numero en una COTA INFERIOR honesta:
# «al menos estuvo esto». No es el tiempo real y se dice con esas palabras.
TOPE_VISTA_SEG = 30 * 60


def acotado(filas):
    return sum(min(float(x.get('duracion_seg') or 0), TOPE_VISTA_SEG) for x in filas)


def bloque_uso(a):
    mias = [x for x in USO if (x.get('asesor') or '') == a]
    print('  USO DEL DASHBOARD')
    if not mias:
        print('    sin registros a su nombre. OJO: puede ser que no entre, o que sus')
        print('    visitas no se estén atribuyendo. Verificar antes de concluir.')
        return
    dias = Counter(dia(x.get('created_at')) for x in mias)
    esta_sem = [x for x in mias if dia(x.get('created_at')) >= SEMANA.isoformat()]
    durs = sorted(float(x['duracion_seg']) for x in mias
                  if isinstance(x.get('duracion_seg'), (int, float)))
    sin_dur = len(mias) - len(durs)

    print('    LO QUE SÍ SE PUEDE AFIRMAR (conteos, no tiempos):')
    print('      histórico: %d vistas en %d día(s) distintos' % (len(mias), len(dias)))
    print('      esta semana: %d vistas en %d día(s)'
          % (len(esta_sem), len({dia(x.get('created_at')) for x in esta_sem})))
    if durs:
        print('      duración MEDIANA de una vista: %.0f min' % (durs[len(durs) // 2] / 60))
    print('    tiempo acotado a %d min por vista (COTA INFERIOR, no el tiempo real):'
          % (TOPE_VISTA_SEG // 60))
    print('      histórico %.1f h · esta semana %.1f h'
          % (acotado(mias) / 3600, acotado(esta_sem) / 3600))
    largas = [x for x in mias if (x.get('duracion_seg') or 0) > 4 * 3600]
    if largas or sin_dur:
        print('    *** %d vista(s) de más de 4 h (pestaña olvidada) y %d sin duración.'
              % (len(largas), sin_dur))
        print('        Por eso NO se publica la suma en crudo de `duracion_seg`.')

    print('    últimos 7 días:')
    for i in range(7):
        d = (HOY - timedelta(days=6 - i)).isoformat()
        delD = [x for x in mias if dia(x.get('created_at')) == d]
        print('      %s  %3d vistas  %4.1f h acot.  %s'
              % (d, len(delD), acotado(delD) / 3600, '█' * min(40, len(delD))))
    secs = Counter(x.get('seccion') or x.get('ruta') for x in esta_sem)
    if secs:
        print('    secciones de esta semana: %s' % dict(secs.most_common(6)))


def bloque_seguimientos(a):
    mias = [x for x in SEG if (x.get('asesor') or '') == a]
    print('  SEGUIMIENTOS REGISTRADOS  (la proactividad que SÍ deja rastro)')
    if not mias:
        print('    ninguno registrado.')
        return
    este_mes = [x for x in mias if str(x.get('fecha') or '')[:7] == MES]
    esta_sem = [x for x in mias if dia(x.get('fecha')) >= SEMANA.isoformat()]
    print('    histórico %d · este mes %d · esta semana %d'
          % (len(mias), len(este_mes), len(esta_sem)))
    print('    tipos este mes: %s' % dict(Counter(x.get('tipo') for x in este_mes).most_common()))
    cuentas_tocadas = {x.get('cuenta_id') for x in este_mes}
    mias_cuentas = [c for c in CUENTAS if (c.get('asesor') or '') == a]
    print('    cuentas distintas tocadas este mes: %d de %d de su cartera'
          % (len(cuentas_tocadas), len(mias_cuentas)))
    if esta_sem:
        print('    de esta semana:')
        for x in esta_sem[:8]:
            c = CTA_POR_ID.get(x.get('cuenta_id')) or {}
            print('      %s  %-10s %-26s %s' % (dia(x.get('fecha')), x.get('tipo') or '—',
                                                (c.get('empresa') or '?')[:26],
                                                str(x.get('descripcion') or '')[:44]))


def bloque_churn(a, mias):
    print('  CHURN Y DOWNGRADE')
    if not GRC:
        print('    no pude leer data/grc-zoho.json.')
        return
    filas = GRC.get('filas') if isinstance(GRC, dict) else GRC
    if not isinstance(filas, list):
        print('    el archivo no trae la lista esperada.')
        return
    nombres = {(c.get('empresa') or '').strip().lower() for c in mias}
    campos = filas[0].keys() if filas else []
    ccli = next((k for k in campos if 'cliente' in k.lower() or 'empresa' in k.lower()), None)
    cmov = next((k for k in campos if 'movimiento' in k.lower()), None)
    cver = next((k for k in campos if 'verificacion' in k.lower()), None)
    cper = next((k for k in campos if 'perdido' in k.lower()), None)
    if not ccli:
        print('    no encuentro la columna de cliente en el archivo.')
        return
    suyas = [f for f in filas if str(f.get(ccli) or '').strip().lower() in nombres]
    print('    %d fila(s) de GRC cruzan con su cartera (por nombre exacto).' % len(suyas))
    if cmov:
        print('    movimientos: %s' % dict(Counter(str(f.get(cmov)) for f in suyas).most_common()))
    if cver:
        print('    verificación: %s' % dict(Counter(str(f.get(cver)) for f in suyas).most_common()))
    if cper:
        perdido = sum(float(f.get(cper) or 0) for f in suyas)
        print('    perdido acumulado en esas filas: $%s' % format(int(perdido), ','))
    print('    NOTA: el cruce es por NOMBRE exacto, no por CID — el archivo de GRC no')
    print('    trae CID. Puede quedarse corto. Ver [[grc_fuente_zoho]].')


def reporte(a):
    print()
    print('=' * 78)
    print('  %s — corte al %s (semana del %s)' % (a.upper(), HOY.isoformat(), SEMANA.isoformat()))
    print('=' * 78)
    mias = bloque_cartera(a)
    print()
    bloque_actividades(a)
    print()
    bloque_uso(a)
    print()
    bloque_seguimientos(a)
    print()
    bloque_churn(a, mias)


def comparativo():
    print()
    print('=' * 78)
    print('  COMPARATIVO — la misma vara para los tres')
    print('=' * 78)
    print('  %-10s %6s %7s %7s %7s %6s %7s %7s'
          % ('ASESOR', 'CTAS', 'ACT-SEM', 'COMPL', 'VISTAS', 'DÍAS', 'SEG-MES', 'SEG-SEM'))
    for a in ASESORES:
        mias = [c for c in CUENTAS if (c.get('asesor') or '') == a]
        acts = [x for x in ACTS if (x.get('asesor') or '') == a
                and str(x.get('semana_inicio') or '')[:10] == SEMANA.isoformat()]
        comp = sum(1 for x in acts if x.get('completada'))
        uso = [x for x in USO if (x.get('asesor') or '') == a
               and dia(x.get('created_at')) >= SEMANA.isoformat()]
        vistas = len(uso)
        dias_act = len({dia(x.get('created_at')) for x in uso})
        seg_m = [x for x in SEG if (x.get('asesor') or '') == a
                 and str(x.get('fecha') or '')[:7] == MES]
        seg_s = [x for x in SEG if (x.get('asesor') or '') == a
                 and dia(x.get('fecha')) >= SEMANA.isoformat()]
        print('  %-10s %6d %7d %7s %7d %6d %7d %7d'
              % (a, len(mias), len(acts), '%d/%d' % (comp, len(acts)),
                 vistas, dias_act, len(seg_m), len(seg_s)))
    print()
    print('  ACT-SEM = actividades SAC asignadas esta semana · COMPL = completadas')
    print('  VISTAS / DÍAS = vistas del tablero esta semana y en cuántos días distintos')
    print('  SEG-MES / SEG-SEM = seguimientos registrados este mes / esta semana')
    print()
    print('  NO hay columna de HORAS a propósito: `duracion_seg` se sella al cerrar la')
    print('  pestaña, así que una olvidada registra la noche entera. La vista más larga')
    print('  del archivo son 71.5 h y hay días de más de 24 h para los tres. Ese número')
    print('  no se puede usar para juzgar a nadie hasta que se arregle la medición.')


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    print('Datos: %d cuentas · %d actividades · %d vistas de tablero · %d seguimientos'
          % (len(CUENTAS), len(ACTS), len(USO), len(SEG)))
    quienes = args if args else ASESORES
    for a in quienes:
        reporte(a)
    if len(quienes) > 1:
        comparativo()
    print()
    print('  LO QUE ESTE REPORTE NO PUEDE VER: llamadas, correos y juntas que no se')
    print('  registraron en el sistema. Su ausencia aquí NO prueba que no ocurrieran;')
    print('  prueba que no quedaron registradas, que es otra cosa.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
