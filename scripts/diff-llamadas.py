"""Compara la salida ANTERIOR de llamadas contra la recién generada.

   POR QUÉ NO BASTA `git diff`. Son 2 MB de JSON en una línea: el diff de git
   dice «la línea 1 cambió» y no sirve para decidir nada. Lo que hace falta es
   saber QUÉ cifra se movió, en cuántas cuentas, y si el movimiento se explica.

   LA PREDICCIÓN QUE ESTO PRUEBA. Las fechas de los archivos fuente contra la
   fecha de la última generación (14 sep 2026 19:17):

       Llamadas_entrantes_..._Actualizado.xlsx      12 sep   ANTES
       Entrantes Mayor consumo 40 Parte 1.xlsx      14 sep 12:49   ANTES
       Entrantes Mayor consumo 40 Parte 2/3.xlsx    14 sep 11:04   ANTES
       Llamadas Salientes ... Poco Consumo.xlsx     17 sep 15:37   DESPUÉS  ←
       Salientes Mayor consumo 40 Parte 1.xlsx      14 sep 11:26   ANTES

   O sea: **las entrantes tienen que salir idénticas y sólo deben moverse las
   salientes.** Si una cifra de entrantes cambia, no es dato nuevo — es mi
   edición del generador, y hay que pararlo antes de publicar. Esa es la
   diferencia entre un diff y una comprobación.

   Uso:  python scripts/diff-llamadas.py <antes.json> <despues.json>
"""
import collections
import io
import json
import os
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

ANTES = sys.argv[1] if len(sys.argv) > 1 else None
DESPUES = sys.argv[2] if len(sys.argv) > 2 else None
if not ANTES or not DESPUES:
    raise SystemExit('uso: diff-llamadas.py <antes.json> <despues.json>')

A = json.load(io.open(ANTES, encoding='utf-8-sig'))
B = json.load(io.open(DESPUES, encoding='utf-8-sig'))
fallos = []


def marca(ok, texto):
    """Imprime el veredicto y acumula los fallos para el resumen final."""
    print('  %s %s' % ('ok  ' if ok else '*** ', texto))
    if not ok:
        fallos.append(texto)


def nf(x):
    return format(x, ',') if isinstance(x, int) else format(x, ',.0f')


def delta(a, b):
    if a == b:
        return '='
    d = b - a
    pct = (100.0 * d / a) if a else float('inf')
    return '%+s (%+.1f%%)' % (nf(d), pct)


# ── 1. META ─────────────────────────────────────────────────────────────────
print('\n' + '=' * 78)
print('  1. CABECERA')
print('=' * 78)
ma, mb = A.get('meta', {}), B.get('meta', {})
claves = ['corte', 'desde', 'cuentas', 'entTotal', 'salTotal', 'entLost',
          'salNoCon', 'sinCol', 'generado']
print('  %-12s %>18s %18s   %s' % ('', 'ANTES', 'DESPUES', 'DELTA')
      if False else '  %-12s %18s %18s   %s' % ('', 'ANTES', 'DESPUES', 'DELTA'))
print('  ' + '-' * 74)
for k in claves:
    va, vb = ma.get(k), mb.get(k)
    d = delta(va, vb) if isinstance(va, int) and isinstance(vb, int) else (
        '=' if va == vb else 'CAMBIO')
    print('  %-12s %18s %18s   %s'
          % (k, nf(va) if isinstance(va, int) else va,
             nf(vb) if isinstance(vb, int) else vb, d))
mesesA, mesesB = ma.get('meses') or [], mb.get('meses') or []
if mesesA != mesesB:
    print('  meses        %18s %18s   CAMBIO'
          % ('%d (%s..%s)' % (len(mesesA), mesesA[0], mesesA[-1]),
             '%d (%s..%s)' % (len(mesesB), mesesB[0], mesesB[-1])))
else:
    print('  meses        %18s %18s   =' % (len(mesesA), len(mesesB)))

# ── 2. LA PREDICCIÓN: ENTRANTES QUIETAS, SALIENTES EN MOVIMIENTO ────────────
print('\n' + '=' * 78)
print('  2. LA PREDICCION — entrantes identicas, solo salientes se mueven')
print('=' * 78)
marca(ma.get('entTotal') == mb.get('entTotal'),
      'entTotal igual (%s vs %s)' % (nf(ma.get('entTotal') or 0), nf(mb.get('entTotal') or 0)))
marca(ma.get('entLost') == mb.get('entLost'),
      'entLost igual (%s vs %s)' % (nf(ma.get('entLost') or 0), nf(mb.get('entLost') or 0)))
marca(ma.get('sinCol') == mb.get('sinCol'),
      'sinCol igual (%s vs %s)' % (nf(ma.get('sinCol') or 0), nf(mb.get('sinCol') or 0)))
if ma.get('salTotal') == mb.get('salTotal'):
    print('  ??   salTotal NO se movio (%s). El archivo de salientes es 3 dias mas'
          % nf(ma.get('salTotal') or 0))
    print('       nuevo que la ultima corrida: o el cambio no toco filas, o no se leyo.')
else:
    print('  ok   salTotal se movio: %s' % delta(ma.get('salTotal') or 0, mb.get('salTotal') or 0))

# ── 3. CUENTAS ──────────────────────────────────────────────────────────────
print('\n' + '=' * 78)
print('  3. CUENTAS')
print('=' * 78)
ca, cb = A.get('cuentas') or {}, B.get('cuentas') or {}
solo_a = sorted(set(ca) - set(cb))
solo_b = sorted(set(cb) - set(ca))
print('  antes %d · despues %d · en ambas %d' % (len(ca), len(cb), len(set(ca) & set(cb))))
if solo_a:
    print('  *** %d DESAPARECIERON:' % len(solo_a))
    for k in solo_a[:12]:
        print('        %-10s %s' % (k, (ca[k].get('empresa') or '?')[:44]))
    fallos.append('%d cuenta(s) desaparecieron de la lectura' % len(solo_a))
if solo_b:
    print('  +++ %d NUEVAS:' % len(solo_b))
    for k in solo_b[:12]:
        print('        %-10s %s' % (k, (cb[k].get('empresa') or '?')[:44]))
if not solo_a and not solo_b:
    print('  ok   el mismo conjunto de cuentas en las dos')


def tipos(d, dire):
    return ((d.get(dire) or {}).get('tipos') or {})


def total(d, dire):
    return (d.get(dire) or {}).get('total') or 0


# ── 4. QUÉ CUENTAS SE MOVIERON, Y EN QUÉ ────────────────────────────────────
print('\n' + '=' * 78)
print('  4. MOVIMIENTO POR CUENTA')
print('=' * 78)
movEnt, movSal = [], []
for k in sorted(set(ca) & set(cb)):
    ea, eb = total(ca[k], 'ent'), total(cb[k], 'ent')
    sa, sb = total(ca[k], 'sal'), total(cb[k], 'sal')
    if ea != eb:
        movEnt.append((k, cb[k].get('empresa') or '?', ea, eb))
    if sa != sb:
        movSal.append((k, cb[k].get('empresa') or '?', sa, sb))

marca(not movEnt, 'ninguna cuenta movio sus ENTRANTES (%d movidas)' % len(movEnt))
for k, e, x, y in movEnt[:20]:
    print('        %-10s %-34s %10s -> %-10s %s' % (k, e[:34], nf(x), nf(y), delta(x, y)))
if len(movEnt) > 20:
    print('        ... y %d mas' % (len(movEnt) - 20))

print('\n  SALIENTES movidas: %d de %d cuentas' % (len(movSal), len(set(ca) & set(cb))))
movSal.sort(key=lambda r: -abs(r[3] - r[2]))
for k, e, x, y in movSal[:20]:
    print('        %-10s %-34s %10s -> %-10s %s' % (k, e[:34], nf(x), nf(y), delta(x, y)))
if len(movSal) > 20:
    print('        ... y %d mas (mostradas las 20 de mayor movimiento)' % (len(movSal) - 20))

# ── 5. LOS CUATRO DESENLACES, EN TOTAL ──────────────────────────────────────
print('\n' + '=' * 78)
print('  5. DESENLACES DE ENTRADA, EN TODA LA CARTERA')
print('=' * 78)
TA, TB = collections.Counter(), collections.Counter()
for k, v in ca.items():
    TA.update(tipos(v, 'ent'))
for k, v in cb.items():
    TB.update(tipos(v, 'ent'))
print('  %-16s %14s %14s   %s' % ('TIPO', 'ANTES', 'DESPUES', 'DELTA'))
print('  ' + '-' * 70)
for t in sorted(set(TA) | set(TB), key=lambda x: -TB.get(x, 0)):
    print('  %-16s %14s %14s   %s'
          % (t, nf(TA.get(t, 0)), nf(TB.get(t, 0)), delta(TA.get(t, 0), TB.get(t, 0))))

# ── 6. LOS CAMPOS NUEVOS, Y SI PARTEN `c` DE VERDAD ─────────────────────────
print('\n' + '=' * 78)
print('  6. LOS CAMPOS NUEVOS: redir + ivr + buzon tienen que ser EXACTAMENTE c')
print('=' * 78)
print('  Si no cierran, la columna no se puede volver a llamar «Atendidas» —')
print('  que es para lo que se agregaron. Se revisa destino por destino.')
sinCampos, malos, revisados = [], [], 0
sumR = sumI = sumBz = sumC = 0
for k, v in cb.items():
    for dire in ('ent', 'sal'):
        for x in ((v.get(dire) or {}).get('dest') or []):
            if 'redir' not in x:
                sinCampos.append((k, dire, x.get('d')))
                continue
            revisados += 1
            r, i, bz, c = (x.get('redir') or 0), (x.get('ivr') or 0), (x.get('buzon') or 0), (x.get('c') or 0)
            if dire == 'ent':
                sumR += r; sumI += i; sumBz += bz; sumC += c
            if r + i + bz != c:
                malos.append((k, dire, x.get('d'), r, i, bz, c))
print('\n  destinos con los campos nuevos : %d' % revisados)
marca(not sinCampos, 'todos los destinos traen redir/ivr/buzon (%d sin ellos)' % len(sinCampos))
for k, dire, d in sinCampos[:6]:
    print('        %-10s %-4s %s' % (k, dire, str(d)[:44]))
marca(not malos, 'redir+ivr+buzon == c en todos los destinos (%d fallan)' % len(malos))
for k, dire, d, r, i, bz, c in malos[:8]:
    print('        %-10s %-4s %-30s %d+%d+%d=%d != c=%d' % (k, dire, str(d)[:30], r, i, bz, r + i + bz, c))
print('\n  ENTRANTES, sumado sobre destinos:')
print('    atendidas por persona (redir) : %12s' % nf(sumR))
print('    resueltas por el menu (ivr)   : %12s' % nf(sumI))
print('    buzon                         : %12s' % nf(sumBz))
print('    ---------------------------------------------')
print('    «no perdidas» (c)             : %12s' % nf(sumC))
marca(sumR + sumI + sumBz == sumC, 'la particion cierra en el agregado de la cartera')
if sumC:
    print('\n    el buzon es el %.2f%% de lo que se publicaba como «Contestadas»'
          % (100.0 * sumBz / sumC))
    print('    el menu  es el %.2f%%' % (100.0 * sumI / sumC))

# ── 7. INVARIANTE DE SIEMPRE: LOS TIPOS SUMAN EL TOTAL ──────────────────────
print('\n' + '=' * 78)
print('  7. INVARIANTE: los tipos de cada cuenta suman su total')
print('=' * 78)
rotas = []
for k, v in cb.items():
    for dire in ('ent', 'sal'):
        d = v.get(dire)
        if not d:
            continue
        s = sum((d.get('tipos') or {}).values())
        if s != (d.get('total') or 0):
            rotas.append((k, dire, s, d.get('total')))
marca(not rotas, 'los tipos suman el total en todas las cuentas (%d rotas)' % len(rotas))
for k, dire, s, t in rotas[:8]:
    print('        %-10s %-4s tipos=%s  total=%s' % (k, dire, nf(s), nf(t)))

# ── RESUMEN ─────────────────────────────────────────────────────────────────
print('\n' + '=' * 78)
if fallos:
    print('  RESULTADO: %d COMPROBACION(ES) FALLIDA(S) — no publicar sin resolver' % len(fallos))
    for f in fallos:
        print('    *** %s' % f)
else:
    print('  RESULTADO: todas las comprobaciones pasan.')
print('=' * 78)
sys.exit(1 if fallos else 0)
