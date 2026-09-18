"""Decide «candidato a: SI / NO» para cada cuenta del reporte de crecimiento.

   LA REGLA NO SE INVENTA. Se toma de dos fuentes que ya existen y que deben
   coincidir, o el Excel diria una cosa y el tablero otra:

   1. La MATRIZ DEL PROPIO ARCHIVO. Ya cruza POTENCIAL (Alto/Bajo) contra
      PREPARACION PARA CRECER (Alta/Baja) y de ahi sale el TRATAMIENTO. Las dos
      celdas con preparacion Alta —«Plan de crecimiento activo» y «Atender
      oportunidades puntuales»— son las unicas donde el archivo mismo autoriza
      una oferta.

   2. La DOCTRINA de lib/candidato-a.ts, fijada por direccion: no se propone
      crecimiento sobre un problema sin resolver. Si hay ticket abierto, fallas
      con salud baja, o la cuenta no se usa, corresponde estabilizar o
      reactivar — no ofrecer mas producto.

   Este script comprueba que las dos coincidan y reporta donde NO, porque esa
   discrepancia es informacion, no ruido.

   OJO CON LAS UNIDADES: «% uso real» y «% Relacionamiento» vienen en FRACCION
   (0.4005 = 40.05%). Tratarlos como porcentaje pone a 116 de 152 cuentas en
   falso «sin uso».
"""
import sys, io, json, collections
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

D = json.load(io.open(r'D:\Windows\Projects\callpicker-cs\data\reporte-crecimiento.json', encoding='utf-8'))


def tabla(hoja):
    d = D[hoja]
    i = d['filaCabecera']
    cab = [str(c).strip() if c is not None else '' for c in d['filas'][i]]
    out = []
    for f in d['filas'][i + 1:]:
        if all(c is None or str(c).strip() == '' for c in f):
            continue
        out.append({cab[j]: f[j] for j in range(len(cab)) if cab[j]})
    return out


def num(v):
    try:
        return float(str(v).replace('%', '').replace(',', '').strip())
    except Exception:
        return None


cid = lambda v: str(v or '').strip().replace('.0', '')

base = tabla('Base AAA-AA-A')
matriz = {cid(r['CID']): r for r in tabla('Matriz del programa')}
sop = {cid(r['CID']): r for r in tabla('Soporte de datos')}

print('=== UNIDADES ===')
us = sorted(num(r.get('% uso real')) for r in sop.values() if num(r.get('% uso real')) is not None)
mediana = us[len(us) // 2]
print('  %% uso real: min %.4f · mediana %.4f · max %.4f' % (us[0], mediana, us[-1]))
print('  -> FRACCIÓN (0.4005 = 40.05%%). El máximo de %.2f no desmiente la escala:' % us[-1])
print('     es una cuenta que consume %.0f%% de su bolsa, coherente con los excedentes' % (us[-1] * 100))
print('     ya medidos en los cortes. Un umbral de «10%%» se escribe 0.10, no 10.')

# ── El veredicto ───────────────────────────────────────────────────────────
BLOQUEOS = []
filas = []
for r in base:
    k = cid(r['CID'])
    m, s = matriz.get(k, {}), sop.get(k, {})
    prep = str(m.get('PREPARACIÓN PARA CRECER') or '').strip()
    pot = str(m.get('POTENCIAL') or '').strip()
    trat = str(m.get('TRATAMIENTO SEGÚN LA MATRIZ') or '').strip()

    uso = num(s.get('% uso real'))
    abiertos = num(s.get('Tickets abiertos')) or 0
    fallas = num(s.get('Tickets con falla')) or 0
    hs = num(s.get('Health Score'))
    estado = str(s.get('Estado') or '').strip()
    contactos = num(s.get('Contactos registrados')) or 0

    # Doctrina de lib/candidato-a.ts, en su mismo orden
    bloqueo = None
    if estado in ('cancelado', 'hibernacion'):
        bloqueo = 'estado %s' % estado
    elif abiertos > 0:
        bloqueo = '%d ticket(s) abierto(s)' % abiertos
    elif fallas >= 2 and (hs is not None and hs < 60):
        bloqueo = '%d fallas con salud %d' % (fallas, hs)
    elif uso is not None and uso < 0.10:
        bloqueo = 'consume %.1f%% de su bolsa' % (uso * 100)
    # La ausencia de medición NO bloquea. La doctrina exige `consumo !== null`
    # para marcar sin-uso (lib/candidato-a.ts:181), y con razón: no medir no es
    # lo mismo que medir cero. Convertirlo en «NO» sería publicar un veredicto
    # donde solo hay un hueco de dato. Se marca aparte, en la razón.

    porMatriz = prep.lower() == 'alta'
    porDoctrina = bloqueo is None

    filas.append(dict(cid=k, cliente=str(r.get('NOMBRE CLIENTE') or ''), pot=pot, prep=prep,
                      trat=trat, uso=uso, abiertos=abiertos, fallas=fallas, hs=hs,
                      estado=estado, contactos=contactos, bloqueo=bloqueo,
                      porMatriz=porMatriz, porDoctrina=porDoctrina))

print()
print('=== ¿COINCIDEN LA MATRIZ DEL ARCHIVO Y LA DOCTRINA? ===')
cm = collections.Counter((f['porMatriz'], f['porDoctrina']) for f in filas)
print('  matriz SI · doctrina SI : %3d   <- candidato sin discusión' % cm[(True, True)])
print('  matriz SI · doctrina NO : %3d   <- el archivo lo autoriza pero hay un problema abierto' % cm[(True, False)])
print('  matriz NO · doctrina SI : %3d   <- sin problema, pero el archivo no lo preparó' % cm[(False, True)])
print('  matriz NO · doctrina NO : %3d   <- no es candidato por las dos vías' % cm[(False, False)])

print()
print('=== LAS QUE LA MATRIZ AUTORIZA PERO TIENEN UN PROBLEMA ABIERTO ===')
for f in [x for x in filas if x['porMatriz'] and not x['porDoctrina']]:
    print('  %-8s %-36s %-30s %s' % (f['cid'], f['cliente'][:36], f['trat'][:30], f['bloqueo']))

print()
print('=== MOTIVOS DE BLOQUEO (todas las cuentas) ===')
mb = collections.Counter(
    (f['bloqueo'].split(' ')[0] + ' ' + f['bloqueo'].split(' ')[1]) if f['bloqueo'] and len(f['bloqueo'].split(' ')) > 1
    else (f['bloqueo'] or 'sin bloqueo') for f in filas)
for k, n in mb.most_common():
    print('  %-34s %3d' % (k[:34], n))

print()
print('=== VEREDICTO PROPUESTO ===')
si = [f for f in filas if f['porMatriz'] and f['porDoctrina']]
print('  candidato a: SÍ  -> %d cuentas' % len(si))
print('  candidato a: NO  -> %d cuentas' % (len(filas) - len(si)))
print()
print('  Las SÍ:')
for f in sorted(si, key=lambda x: -(x['uso'] or 0)):
    print('    %-8s %-38s uso %5.1f%%  salud %3s  %s'
          % (f['cid'], f['cliente'][:38], (f['uso'] or 0) * 100, f['hs'], f['trat'][:32]))

with io.open(r'D:\Windows\Projects\callpicker-cs\data\crecimiento-veredicto.json', 'w', encoding='utf-8') as fh:
    json.dump(filas, fh, ensure_ascii=False)
print()
print('veredicto guardado en data/crecimiento-veredicto.json')
