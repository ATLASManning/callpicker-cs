# -*- coding: utf-8 -*-
"""Retrospectiva del tablero: evolucion, cumplimiento de asesores y alertas.

   POR QUE EXISTE
   --------------
   Direccion pidio llevar a los fundadores la historia del tablero con DATOS:
   que se construyo, como se cumplieron las actividades por asesor, y cuanta
   atencion recibieron las alertas de las auditorias.

   Es de SOLO LECTURA y mide contra las fuentes vivas, nunca contra cifras
   escritas a mano. Cada reparto CIERRA: si una particion no suma el universo,
   se planta — una tabla que no cierra miente sin decirlo.

   USO
   ---
       python scripts/retrospectiva-tablero.py
"""
import collections
import datetime
import io
import json
import os
import sys
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def env(clave):
    with io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8-sig') as f:
        for linea in f:
            if linea.strip().startswith(clave + '='):
                return linea.split('=', 1)[1].strip().strip('"')
    return None


URL, KEY = env('NEXT_PUBLIC_SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY')


def trae(tabla, cols):
    """Por paginas: PostgREST corta en 1000 filas SIN avisar."""
    out, desde = [], 0
    while True:
        r = urllib.request.Request(f'{URL}/rest/v1/{tabla}?select={cols}')
        r.add_header('apikey', KEY)
        r.add_header('Authorization', f'Bearer {KEY}')
        r.add_header('Range', f'{desde}-{desde + 999}')
        with urllib.request.urlopen(r, timeout=90) as x:
            lote = json.loads(x.read().decode())
        out += lote
        if len(lote) < 1000:
            return out
        desde += 1000


def titulo(t):
    print()
    print('=' * 78)
    print('  ' + t)
    print('=' * 78)


# ══════════════════════════════════════════════════════════════════════════
titulo('1 · CUMPLIMIENTO DE ACTIVIDADES POR ASESOR')

act = trae('actividades', 'asesor,tipo,estado,completada,semana_inicio,creado_en,'
                          'completada_en,fecha_vencimiento,consecutivo,empresa,'
                          'tiempo_medido_min,tiempo_reportado_min,resultado')
print(f'  {len(act):,} actividades en total\n')

cerrada = lambda a: bool(a.get('completada')) or a.get('estado') == 'completada'

# Reparto por asesor, que tiene que cerrar.
por = collections.defaultdict(lambda: collections.Counter())
for a in act:
    por[a.get('asesor') or '(sin asesor)']['total'] += 1
    por[a.get('asesor') or '(sin asesor)']['cerradas' if cerrada(a) else 'abiertas'] += 1

print(f"  {'ASESOR':<22} {'ASIGNADAS':>10} {'CERRADAS':>9} {'ABIERTAS':>9} {'% CIERRE':>9}")
tot = collections.Counter()
for k in sorted(por, key=lambda x: -por[x]['total']):
    c = por[k]
    tot.update(c)
    pct = 100 * c['cerradas'] / c['total'] if c['total'] else 0
    print(f"  {k[:22]:<22} {c['total']:>10,} {c['cerradas']:>9,} {c['abiertas']:>9,} {pct:>8.0f}%")
print(f"  {'TOTAL':<22} {tot['total']:>10,} {tot['cerradas']:>9,} {tot['abiertas']:>9,} "
      f"{100*tot['cerradas']/tot['total']:>8.0f}%")
assert tot['cerradas'] + tot['abiertas'] == tot['total'], 'el reparto por asesor no cierra'
assert tot['total'] == len(act), 'faltan actividades en el reparto'
print('  (cerradas + abiertas = total: comprobado)')

# ── La evolucion semana a semana ─────────────────────────────────────────
titulo('2 · SEMANA A SEMANA: lo que se repartio y lo que se cerro')
sem = collections.defaultdict(lambda: collections.defaultdict(lambda: [0, 0]))
for a in act:
    s = a.get('semana_inicio')
    if not s:
        continue
    e = sem[s][a.get('asesor') or '(sin asesor)']
    e[0] += 1
    if cerrada(a):
        e[1] += 1

asesores = sorted({a.get('asesor') for a in act if a.get('asesor')})
print(f"  {'SEMANA':<12} " + ' '.join(f'{x[:9]:>12}' for x in asesores) + f" {'TOTAL':>12}")
for s in sorted(sem):
    fila = f'  {s:<12} '
    tA = tC = 0
    for x in asesores:
        asig, cer = sem[s][x]
        tA += asig; tC += cer
        fila += f'{(str(cer) + "/" + str(asig)) if asig else "—":>12} '
    fila += f'{(str(tC) + "/" + str(tA)) if tA else "—":>12}'
    print(fila)
print('\n  (cerradas / asignadas)')

# ── Cuanto tardan y si se mide el tiempo ─────────────────────────────────
titulo('3 · EL TIEMPO: cuanto se mide y cuanto se reporta')
conMed = [a for a in act if (a.get('tiempo_medido_min') or 0) > 0]
conRep = [a for a in act if (a.get('tiempo_reportado_min') or 0) > 0]
cerradas = [a for a in act if cerrada(a)]
print(f'  actividades cerradas            : {len(cerradas):,}')
print(f'  con cronometro (tiempo_medido)  : {len(conMed):,}  '
      f'({100*len(conMed)/max(len(cerradas),1):.0f}% de las cerradas)')
print(f'  con tiempo reportado a mano     : {len(conRep):,}  '
      f'({100*len(conRep)/max(len(cerradas),1):.0f}%)')
if conMed:
    v = sorted(a['tiempo_medido_min'] for a in conMed)
    print(f'  minutos medidos: mediana {v[len(v)//2]:.0f} · '
          f'promedio {sum(v)/len(v):.0f} · maximo {v[-1]:.0f}')
sinResultado = [a for a in cerradas if not (a.get('resultado') or '').strip()]
print(f'\n  CERRADAS SIN ESCRIBIR RESULTADO : {len(sinResultado):,} '
      f'({100*len(sinResultado)/max(len(cerradas),1):.0f}% de las cerradas)')
print('  Una actividad cerrada sin resultado no deja evidencia de que se hizo.')

# ── Las alertas: Radar y datos de la ficha ───────────────────────────────
titulo('4 · LAS ALERTAS DE LA AUDITORIA, Y CUANTA ATENCION RECIBEN')

cuentas = trae('cuentas', 'id,consecutivo,empresa,estado,asesor,health_score,'
                          'score_actividad,score_adopcion,score_pago,score_relacional,'
                          'observaciones_kam,notas,contactos_json,ultimo_contacto')
vivas = [c for c in cuentas if (c.get('estado') or '') in ('activo', 'en_riesgo')]
print(f'  {len(vivas)} cuentas vivas de {len(cuentas)} en la cartera\n')

radar = trae('radar_respuestas', 'cuenta_id')
porCuentaRadar = collections.Counter(r['cuenta_id'] for r in radar)
sinRadar = [c for c in vivas if porCuentaRadar.get(c['id'], 0) == 0]
parcial = [c for c in vivas if 0 < porCuentaRadar.get(c['id'], 0) < 12]
completo = [c for c in vivas if porCuentaRadar.get(c['id'], 0) >= 12]
print(f"  RADAR DE CUENTA (12 preguntas)")
print(f"    sin UNA sola respuesta : {len(sinRadar):>4}  ({100*len(sinRadar)/len(vivas):.0f}%)")
print(f"    empezado y sin cerrar  : {len(parcial):>4}  ({100*len(parcial)/len(vivas):.0f}%)")
print(f"    completo (12/12)       : {len(completo):>4}  ({100*len(completo)/len(vivas):.0f}%)")
assert len(sinRadar) + len(parcial) + len(completo) == len(vivas), 'el Radar no cierra'
print('    (las tres suman las cuentas vivas: comprobado)')

DEFAULT = 50
bloques = ['score_actividad', 'score_adopcion', 'score_pago', 'score_relacional']
print(f"\n  HEALTH SCORE — cuanto se apoya en dato capturado")
print(f"    {'BLOQUE':<20} {'EN 50 POR OMISION':>18} {'%':>6}")
for b in bloques:
    n = sum(1 for c in vivas if (c.get(b) or DEFAULT) == DEFAULT)
    print(f'    {b:<20} {n:>18} {100*n/len(vivas):>5.0f}%')
sinNada = sum(1 for c in vivas if all((c.get(b) or DEFAULT) == DEFAULT for b in bloques))
print(f'    cuentas con los CUATRO en 50: {sinNada} '
      f'({100*sinNada/len(vivas):.0f}%) — su Health Score no mide nada')

print(f"\n  FICHA DEL KAM")
sinObs = sum(1 for c in vivas if not (c.get('observaciones_kam') or '').strip())
sinNotas = sum(1 for c in vivas if not (c.get('notas') or '').strip())
sinCont = 0
for c in vivas:
    try:
        cj = c.get('contactos_json')
        arr = cj if isinstance(cj, list) else (json.loads(cj) if cj else [])
    except Exception:
        arr = []
    if not arr:
        sinCont += 1
print(f'    sin observaciones del KAM : {sinObs:>4}  ({100*sinObs/len(vivas):.0f}%)')
print(f'    sin notas                 : {sinNotas:>4}  ({100*sinNotas/len(vivas):.0f}%)')
print(f'    SIN UN SOLO CONTACTO      : {sinCont:>4}  ({100*sinCont/len(vivas):.0f}%)')
print('    Sin contactos no hay a quien llamar cuando la cuenta se cae.')

# ── Las auditorias documentadas y su seguimiento ─────────────────────────
titulo('5 · LOS CASOS DE AUDITORIA Y SU PLAN DE ACCION')
import re
dirAud = os.path.join(RAIZ, 'app', 'auditoria')
casos = [f for f in sorted(os.listdir(dirAud)) if f.endswith('-data.ts')]
tot_inm = tot_med = tot_est = 0
estados = collections.Counter()
for f in casos:
    s = io.open(os.path.join(dirAud, f), encoding='utf-8').read()
    m = re.search(r"^\s*estado:\s*'([^']+)'", s, re.M)
    estados[m.group(1) if m else '?'] += 1
    for campo, acc in (('plan_inmediato', 'inm'), ('plan_mediano', 'med'),
                       ('plan_estrategico', 'est')):
        b = re.search(campo + r':\s*\[(.*?)\n\s*\],', s, re.S)
        n = len(re.findall(r'\{\s*accion:', b.group(1))) if b else 0
        if acc == 'inm': tot_inm += n
        elif acc == 'med': tot_med += n
        else: tot_est += n
print(f'  {len(casos)} auditorias documentadas\n')
print(f"    {'ESTADO':<18} {'CASOS':>6}")
for k, v in estados.most_common():
    print(f'    {k:<18} {v:>6}')
print(f'\n  ACCIONES QUE DEJARON ESCRITAS')
print(f'    plan inmediato    : {tot_inm:>4}')
print(f'    plan mediano      : {tot_med:>4}')
print(f'    plan estrategico  : {tot_est:>4}')
print(f'    TOTAL             : {tot_inm + tot_med + tot_est:>4}')
print('\n  NO HAY CAMPO DE SEGUIMIENTO. Ninguna de esas acciones tiene estado,')
print('  responsable confirmado ni fecha de cierre en el sistema: se escriben')
print('  y nadie puede decir cuantas se hicieron. Ese es el hallazgo.')

# ── Las aclaraciones de baja, que son obligatorias ───────────────────────
titulo('6 · LAS ACLARACIONES DE BAJA (obligatorias, no vencen)')
acl = [a for a in act if (a.get('tipo') or '') == 'aclaracion'
       or 'aclarac' in (a.get('descripcion') or '').lower()]
if not acl:
    acl = [a for a in act if 'aclarac' in str(a.get('tipo') or '').lower()]
cerrAcl = [a for a in acl if cerrada(a)]
print(f'  {len(acl)} aclaraciones generadas · {len(cerrAcl)} cerradas '
      f'({100*len(cerrAcl)/max(len(acl),1):.0f}%)')
if acl:
    porA = collections.Counter(a.get('asesor') or '(sin asesor)' for a in acl if not cerrada(a))
    if porA:
        print('  ABIERTAS por asesor: ' + ' · '.join(f'{k} {v}' for k, v in porA.most_common()))

print()
print('=' * 78)
print('  Medido contra las fuentes vivas el ' +
      datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=-6)))
      .strftime('%d/%m/%Y %H:%M') + ' (hora de Mexico).')
print('=' * 78)
