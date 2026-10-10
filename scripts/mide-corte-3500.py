# -*- coding: utf-8 -*-
"""El corte de $3,500 en Activaciones, medido antes de construir el módulo.

   POR QUE EXISTE
   --------------
   Dirección, 10 oct 2026: «construye un módulo donde estén las cuentas que
   facturan arriba de $3,500». Antes de dibujarlo hay que saber a cuántas pega
   y cuánto dinero representan: un corte que deja 12 filas no merece módulo, y
   uno que deja 1,800 no es un corte.

   Y hay una ambigüedad que cambia el módulo entero: «facturan» puede ser el
   PRIMER PAGO de la activación —que es la única cifra de dinero que vive en
   este archivo— o el MRR VIGENTE de la cuenta, que vive en la cartera y se
   cruza por CID. Se miden las dos y se mira cuánto se solapan, porque la
   respuesta la decide el dato, no una preferencia.

   USO
   ---
       python scripts/mide-corte-3500.py
"""
import io
import os
import re
import sys
import unicodedata

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
from openpyxl import load_workbook

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
XLSX = os.path.join(RAIZ, 'data', 'activaciones.xlsx')
CORTE = 3500.0


def norm(s):
    s = unicodedata.normalize('NFD', str(s or ''))
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return ''.join(c for c in s.lower() if c.isalnum())


wb = load_workbook(XLSX, data_only=True, read_only=True)
ws = wb['Hoja1']
it = ws.iter_rows(values_only=True)
cab = [str(c).strip() if c is not None else '' for c in next(it)]
filas = []
for r in it:
    if all(v is None or str(v).strip() == '' for v in r):
        continue
    filas.append({cab[i]: r[i] for i in range(min(len(cab), len(r)))})
wb.close()


def num(v):
    if isinstance(v, (int, float)):
        return float(v)
    try:
        return float(re.sub(r'[$,\s]', '', str(v or '')))
    except ValueError:
        return 0.0


# Los mismos filtros del módulo: ID y Cliente, Año >= 2020, y un demo no es
# una activación.
regs = [f for f in filas
        if str(f.get('ID') or '').strip() and str(f.get('Cliente') or '').strip()]
regs = [f for f in regs if num(f.get('Año')) >= 2020]
act = [f for f in regs if str(f.get('Tipo') or '').strip().lower() != 'demo']
print(u'  %d registros · %d activaciones (sin demos)\n' % (len(regs), len(act)))

pagos = sorted(num(f.get('1er Pago')) for f in act)
n = len(pagos)
def q(p):
    return pagos[min(int(p * (n - 1)), n - 1)]
print(u'  PRIMER PAGO de las activaciones:')
print(u'      min $%s · p25 $%s · mediana $%s · p75 $%s · p90 $%s · max $%s'
      % tuple(format(int(q(x)), ',d') for x in (0, .25, .5, .75, .90, 1.0)))
print(u'      promedio $%s · suma $%s'
      % (format(int(sum(pagos) / n), ',d'), format(int(sum(pagos)), ',d')))

print(u'\n  ── DÓNDE CAE EL CORTE ────────────────────────────────────────')
print(u'      %9s %8s %8s %14s %8s' % (u'corte', u'cuentas', u'% del n', u'suma', u'% del $'))
total = sum(pagos)
for c in (1000, 2000, 3000, CORTE, 5000, 10000):
    arriba = [p for p in pagos if p > c]
    s = sum(arriba)
    print(u'      $%8s %8d %7.1f%% $%13s %7.1f%%'
          % (format(int(c), ',d'), len(arriba), 100.0 * len(arriba) / n,
             format(int(s), ',d'), 100.0 * s / total))

sel = [f for f in act if num(f.get('1er Pago')) > CORTE]
print(u'\n  ── LAS %d QUE PASAN $%s ───────────────────────────────────' % (len(sel), format(int(CORTE), ',d')))


def reparto(campo, etq, top=8):
    m = {}
    for f in sel:
        k = str(f.get(campo) or 'N/A').strip() or 'N/A'
        e = m.setdefault(k, [0, 0.0])
        e[0] += 1
        e[1] += num(f.get('1er Pago'))
    print(u'\n      por %s:' % etq)
    orden = sorted(m.items(), key=lambda kv: -kv[1][1])
    for k, (c, s) in orden[:top]:
        print(u'        %-30s %4d  $%s' % (k[:30], c, format(int(s), ',d')))
    if len(orden) > top:
        resto = orden[top:]
        print(u'        %-30s %4d  $%s  (otros %d)'
              % (u'…', sum(c for _, (c, _) in resto),
                 format(int(sum(s for _, (_, s) in resto)), ',d'), len(resto)))
    # CIERRA: los cubos tienen que sumar el total.
    assert sum(c for _, (c, _) in orden) == len(sel), 'el reparto por %s no cierra' % etq


for campo, etq in (('Año', 'año'), ('Ejecutivo', 'ejecutivo'), ('Giro', 'giro'),
                   ('Tipo', 'tipo'), ('Tamaño', 'tamaño'), ('Vendedor', 'vendedor')):
    if campo in cab:
        reparto(campo, etq)

print(u'\n      las 12 mayores:')
for f in sorted(sel, key=lambda x: -num(x.get('1er Pago')))[:12]:
    print(u'        %-30s $%-10s %-10s %-12s %s'
          % (str(f.get('Cliente') or '')[:30], format(int(num(f.get('1er Pago'))), ',d'),
             str(f.get('Mes 1er Pago') or '')[:10], str(f.get('Ejecutivo') or '')[:12],
             str(f.get('Tipo') or '')))

# ── ¿Se atiende distinto a una activación grande? ────────────────────────
#
# Esta es la pregunta que decide si el módulo lleva un bloque de operación o
# no. Si las 143 se parecen al resto en días, complejidad, contacto y encuesta,
# ese bloque no merece pantalla: sería un indicador que nunca cambia, y esos
# entrenan a no mirar. Se mide ANTES de dibujar.
print(u'\n  ── ¿SE ATIENDEN DISTINTO? las %d contra las otras %d ─────────'
      % (len(sel), len(act) - len(sel)))
resto = [f for f in act if num(f.get('1er Pago')) <= CORTE]


def dias(f):
    v = f.get('Dias activacion')
    # UN CERO SIN MEDICIÓN NO ES UN CERO: el módulo trata <= 0 como «no
    # medido» (`diasActivacion: null`), y aquí hay que hacer lo mismo o el
    # promedio sale hundido por los huecos.
    return float(v) if isinstance(v, (int, float)) and v > 0 else None


for etq, grupo in ((u'> $3,500', sel), (u'<= $3,500', resto)):
    ds = [d for d in (dias(f) for f in grupo) if d is not None]
    sinmedir = len(grupo) - len(ds)
    ds_ord = sorted(ds)
    print(u'\n      %s  (%d activaciones)' % (etq, len(grupo)))
    if ds:
        print(u'        días de activación: promedio %.1f · mediana %.0f · p90 %.0f'
              % (sum(ds) / len(ds), ds_ord[len(ds_ord) // 2],
                 ds_ord[min(int(.9 * (len(ds_ord) - 1)), len(ds_ord) - 1)]))
        print(u'        en 7 días o menos: %d de %d medidas (%.0f%%)'
              % (sum(1 for d in ds if d <= 7), len(ds),
                 100.0 * sum(1 for d in ds if d <= 7) / len(ds)))
    print(u'        SIN MEDIR los días: %d (%.0f%%)'
          % (sinmedir, 100.0 * sinmedir / max(len(grupo), 1)))
    for campo, nombre in (('Complejidad', u'complejidad'),
                          (u'¿Se tuvo contacto?', u'contacto'),
                          ('Encuesta Satisfaccion al cliente', u'encuesta')):
        if campo not in cab:
            print(u'        %s: LA COLUMNA NO EXISTE en el archivo' % nombre)
            continue
        m = {}
        for f in grupo:
            k = str(f.get(campo) or '').strip() or u'(vacío)'
            m[k] = m.get(k, 0) + 1
        orden = sorted(m.items(), key=lambda kv: -kv[1])
        assert sum(v for _, v in orden) == len(grupo), u'%s no cierra' % nombre
        print(u'        %-12s %s' % (nombre + ':', u' · '.join(
            u'%s %d (%.0f%%)' % (k[:18], v, 100.0 * v / len(grupo))
            for k, v in orden[:4])))

# ── ¿Y si «facturan» fuera el MRR vigente? ───────────────────────────────
print(u'\n  ── LA OTRA LECTURA: el MRR VIGENTE de la cuenta ──────────────')
foto = (r'C:\Users\manni\AppData\Local\Temp\claude\C--Users-manni--claude'
        r'\dd44f788-ee31-44b8-aaeb-7bdea535f8a3\scratchpad\foto-auditoria.json')
if not os.path.exists(foto):
    print(u'      (no hay foto de la cartera a mano; correr scripts/foto-auditoria.py)')
else:
    import json
    rows = json.load(io.open(foto, encoding='utf-8'))['fuentes']['veredictos']['rows']
    arriba_mrr = [r for r in rows if (r.get('mrr') or 0) > CORTE]
    print(u'      %d de las %d cuentas vivas facturan hoy más de $%s (%.0f%%)'
          % (len(arriba_mrr), len(rows), format(int(CORTE), ',d'),
             100.0 * len(arriba_mrr) / len(rows)))
    print(u'      — %.0f%% no es un corte: ese umbral no separa nada en la cartera'
          % (100.0 * len(arriba_mrr) / len(rows)))

    # EL CRUCE SE MIDE CON LA LLAVE FUERTE, NO CON EL NOMBRE.
    #
    # La primera versión cruzaba por nombre normalizado y daba 27%. Eso medía
    # mal: la columna `ID` del .xlsx ES el CID —la propia pantalla la usa así
    # en `/api/activaciones/detalle?cid=${r.id}`— y la foto de cartera trae
    # `cid`. Un porcentaje con el denominador equivocado no es un dato débil,
    # es un dato falso, y éste iba a sostener la decisión del módulo.
    def digitos(v):
        return re.sub(r'\D', '', str(v or ''))

    porCid = {digitos(r.get('cid')): r for r in rows if digitos(r.get('cid'))}
    porNom = {norm(r['empresa']): r for r in rows}
    cruzan_cid = [f for f in sel if digitos(f.get('ID')) in porCid]
    cruzan_nom = [f for f in sel if norm(f.get('Cliente')) in porNom]
    print(u'\n      de las %d activaciones que pasan el corte por PRIMER PAGO:' % len(sel))
    print(u'        por CID (la llave real):    %3d  (%.0f%%)'
          % (len(cruzan_cid), 100.0 * len(cruzan_cid) / max(len(sel), 1)))
    print(u'        por nombre normalizado:     %3d  (%.0f%%)'
          % (len(cruzan_nom), 100.0 * len(cruzan_nom) / max(len(sel), 1)))

    # ¿Y las que SÍ cruzan, cuánto facturan hoy contra lo que pagaron al entrar?
    # Si el primer pago no predice el MRR, entonces un módulo de primer pago NO
    # está midiendo valor de cuenta, y el título tiene que decirlo.
    pares = [(num(f.get('1er Pago')), porCid[digitos(f.get('ID'))].get('mrr') or 0)
             for f in cruzan_cid]
    conmrr = [(a, b) for a, b in pares if b > 0]
    if conmrr:
        sube = sum(1 for a, b in conmrr if b > a)
        print(u'\n      de las %d que cruzan por CID, %d traen MRR medible:'
              % (len(cruzan_cid), len(conmrr)))
        print(u'        %d facturan hoy MÁS que su primer pago, %d menos'
              % (sube, len(conmrr) - sube))
        print(u'        primer pago mediano $%s · MRR mediano $%s'
              % (format(int(sorted(a for a, _ in conmrr)[len(conmrr) // 2]), ',d'),
                 format(int(sorted(b for _, b in conmrr)[len(conmrr) // 2]), ',d')))
        print(u'      — el primer pago mide ORIGINACIÓN, no valor vigente.')
