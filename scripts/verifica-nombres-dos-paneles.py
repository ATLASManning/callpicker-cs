"""Comprueba que el panel global y la ficha de cuenta digan LO MISMO.

   La razon de no haber reparado la codificacion en un solo generador era esta:
   los dos publican los mismos nombres de destino y de empresa, y si cada uno
   reparara por su cuenta acabarian contradiciendose. Ahora ambos usan
   scripts/_texto_roto.py, asi que esto debe salir en cero.

   Tres comprobaciones:
     1. no queda ningun nombre con la firma de mojibake en ninguno de los dos
     2. los destinos que ambos conocen se escriben igual
     3. las empresas que ambos conocen se escriben igual
"""
import sys, io, os, re, json
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__))))
from _texto_roto import arregla

RAIZ = r'D:\Windows\Projects\callpicker-cs'

# ── Panel global ────────────────────────────────────────────────────────────
G = json.load(io.open(os.path.join(RAIZ, 'data', 'analisis-llamadas.json'), encoding='utf-8'))['cuentas']
gDest = {(c['cid'], x['d']) for c in G.values() if c.get('ent') for x in c['ent']['dest']}
gEmp = {c['cid']: c['empresa'] for c in G.values() if c.get('empresa')}

# ── Ficha de cuenta (un .ts con una linea JSON por CID) ─────────────────────
txt = io.open(os.path.join(RAIZ, 'app', 'cuentas', 'llamadas-data.ts'), encoding='utf-8').read()
fDest, fEmp = set(), {}
for m in re.finditer(r'^\s*"(\d+)":\s*(\{.*\}),\s*$', txt, re.M):
    cid, obj = m.group(1), json.loads(m.group(2))
    e = obj.get('e') or obj.get('empresa')
    if e:
        fEmp[cid] = e
    ent = obj.get('ent') or {}
    for x in (ent.get('dest') or []):
        fDest.add((cid, x['d']))

print('panel global : %d cuentas · %d pares (cid,destino)' % (len(gEmp), len(gDest)))
print('ficha cuenta : %d cuentas · %d pares (cid,destino)' % (len(fEmp), len(fDest)))

# ── 1. ¿queda mojibache? ────────────────────────────────────────────────────
def rotos(nombres):
    return sorted({n for n in nombres if arregla(n) != n})

g1 = rotos({d for _, d in gDest}) + rotos(gEmp.values())
f1 = rotos({d for _, d in fDest}) + rotos(fEmp.values())
print()
print('=== 1 · nombres que TODAVIA se pueden reparar (deberia ser 0) ===')
print('  panel global : %d  %s' % (len(g1), g1[:3]))
print('  ficha cuenta : %d  %s' % (len(f1), f1[:3]))

# ── 2 y 3. ¿coinciden? ──────────────────────────────────────────────────────
comunes = set(gEmp) & set(fEmp)
difEmp = [(c, gEmp[c], fEmp[c]) for c in comunes if gEmp[c] != fEmp[c]]
print()
print('=== 2 · empresas que ambos conocen (%d) ===' % len(comunes))
print('  se escriben distinto: %d' % len(difEmp))
for c, a, b in difEmp[:6]:
    print('    CID %-8s global=«%s»  ficha=«%s»' % (c, a[:32], b[:32]))

# Los destinos de la ficha son un top mas corto, asi que solo se comparan los
# nombres que aparecen en ambos lados para el mismo CID.
soloFicha = sorted({d for cid, d in fDest
                    if d not in ('otros destinos',)
                    and (cid, d) not in gDest and cid in gEmp})
print()
print('=== 3 · destinos de la ficha que el panel no reconoce igual ===')
print('  %d' % len(soloFicha))
for d in soloFicha[:10]:
    print('    %s' % d[:60])

print()
ok = not g1 and not f1 and not difEmp and not soloFicha
print('RESULTADO: %s' % ('los dos paneles dicen lo mismo' if ok else 'HAY DIVERGENCIA, revisar arriba'))
