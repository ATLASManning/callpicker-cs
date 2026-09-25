# -*- coding: utf-8 -*-
"""Compara el Informe de Cortes recien cargado contra el de git HEAD.

   POR QUE EXISTE
   --------------
   `carga-semanal.py` ya vigila la ESTRUCTURA: si una columna aparece, desaparece
   o se mueve, se planta y no carga. Esto vigila el CONTENIDO, que falla distinto
   y en silencio:

   1. QUE NADA DESAPAREZCA. El informe es acumulativo —cada semana suma el corte
      nuevo—, asi que un CID+fecha que estaba y ya no esta significa que el export
      cambio de criterio o se perdio algo. Es la misma trampa que mordio con GRC,
      donde un export nuevo REESCRIBIO meses cerrados (-$70,150 en mayo-agosto).

   2. QUE NINGUN PLAN NUEVO SE QUEDE SIN BASE DE MINUTOS. Es el fallo mas caro y
      el mas callado. `lib/plan-minutos.ts` decide contra que se mide el consumo:
      1,500 min por extension cuando el plan las declara, la bolsa del archivo
      cuando es plausible, y «sin medicion» cuando no hay nada que medir. Si
      llega un plan con un nombre que las reglas no contemplan, su consumo se
      mide contra nada y la pantalla lo pinta 0%.
      Ya paso: hasta el 18 sep 2026 la prueba de «sin voz» corria primero y
      mandaba 89 cortes CON consumo a «sin medicion». El sintoma no es un error:
      es un 0% que parece un cliente que dejo de usar el servicio.

   3. QUE EL % DEL ARCHIVO SIGA SIENDO BASURA. La columna «% Consumo» divide
      entre 1 en los planes por extensiones y publica cosas como 3,417,300%. Si
      algun dia deja de serlo, hay que enterarse.

   Es de SOLO LECTURA.

   USO
   ---
       python scripts/diff-cortes.py            # trabajo vs HEAD
       python scripts/diff-cortes.py HEAD~1
"""
import io
import os
import re
import subprocess
import sys
from collections import Counter, defaultdict
from datetime import datetime, timedelta

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
import openpyxl

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REL = 'data/cortes-facturacion.xlsx'

# ── Replica EXACTA de lib/plan-minutos.ts ────────────────────────────
MINUTOS_POR_EXTENSION = 1500
MIN_POR_EXT_PLAUSIBLE = 50
BOLSA_MINIMA = 3
RX_EXTENSIONES = re.compile(r'(\d+)\s*(?:extensi[oó]n(?:es)?|ext\b)', re.I)
RX_EXT_ABREVIADO = re.compile(r'^(\d+)\s+\S.*\bIL\b', re.I)
RX_SIN_VOZ = re.compile(r'\bchat\b|\bagentes?\s+cp\b|sin\s+saldo|n[uú]meros?\s+virtuales?|whatsapp', re.I)


def base_minutos(plan, incl):
    """Devuelve (base, extensiones, origen). Misma logica y mismo ORDEN que el TS."""
    nombre = str(plan or '')
    m = RX_EXTENSIONES.search(nombre) or RX_EXT_ABREVIADO.search(nombre)
    ext = int(m.group(1)) if m else None
    if RX_SIN_VOZ.search(nombre) and not ext and incl < BOLSA_MINIMA:
        return None, ext, 'sin_medicion'
    if ext and ext > 0:
        por_ext = (incl / ext) if incl > 0 else 0
        if por_ext >= MIN_POR_EXT_PLAUSIBLE:
            return incl, ext, 'bolsa'
        return ext * MINUTOS_POR_EXTENSION, ext, 'extensiones'
    if incl >= BOLSA_MINIMA:
        return incl, ext, 'bolsa'
    return None, ext, 'sin_medicion'


def num(v):
    if isinstance(v, (int, float)):
        return float(v)
    try:
        return float(str(v).replace(',', '').strip())
    except (TypeError, ValueError):
        return 0.0


def mes_de(v):
    """«Fecha de corte» llega como serial de Excel o como fecha."""
    if isinstance(v, datetime):
        return v.strftime('%Y-%m')
    if isinstance(v, (int, float)):
        return (datetime(1899, 12, 30) + timedelta(days=float(v))).strftime('%Y-%m')
    return str(v or '')[:7]


def lee(fuente):
    wb = openpyxl.load_workbook(fuente, data_only=True, read_only=True)
    ws = wb[wb.sheetnames[0]]
    it = ws.iter_rows(values_only=True)
    try:
        cab = [str(c).strip() if c is not None else '' for c in next(it)]
    except StopIteration:
        wb.close()
        return [], []
    idx = {c: i for i, c in enumerate(cab)}
    filas = []
    for r in it:
        if all(c is None or str(c).strip() == '' for c in r):
            continue
        filas.append({c: (r[i] if i < len(r) else None) for c, i in idx.items()})
    wb.close()
    return cab, filas


def de_git(rev):
    r = subprocess.run(['git', 'show', '%s:%s' % (rev, REL)], cwd=RAIZ,
                       capture_output=True, timeout=180)
    if r.returncode != 0:
        return None, None
    return lee(io.BytesIO(r.stdout))


def clave(f):
    return (str(f.get('CID') or '').strip(), mes_de(f.get('Fecha de corte')))


def main():
    rev = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('--') else 'HEAD'
    cabN, nuevo = lee(os.path.join(RAIZ, REL))
    cabV, viejo = de_git(rev)
    if viejo is None:
        print('  no se pudo leer %s en %s.' % (REL, rev))
        return 0

    print('=' * 76)
    print('  INFORME DE CORTES — %s  ->  archivo nuevo' % rev)
    print('=' * 76)
    print()
    print('  filas: %s  ->  %s   (%+d)' % (format(len(viejo), ','), format(len(nuevo), ','),
                                           len(nuevo) - len(viejo)))
    problemas = 0

    if cabV != cabN:
        problemas += 1
        print('  *** LAS COLUMNAS CAMBIARON. Los modulos leen por nombre: se planta aqui.')
        for i in range(max(len(cabV), len(cabN))):
            a = cabV[i] if i < len(cabV) else '(falta)'
            b = cabN[i] if i < len(cabN) else '(falta)'
            if a != b:
                print('      col %d: «%s» -> «%s»' % (i, a, b))
        return 1
    print('  columnas: las mismas %d' % len(cabN))

    # ── 1. Nada debe desaparecer ──────────────────────────────────────
    kv = Counter(clave(f) for f in viejo)
    kn = Counter(clave(f) for f in nuevo)
    bajas = [k for k in kv if k not in kn]
    altas = [k for k in kn if k not in kv]
    print('  claves CID+mes: %s -> %s   (%d nuevas, %d DESAPARECIDAS)'
          % (format(len(kv), ','), format(len(kn), ','), len(altas), len(bajas)))
    if bajas:
        problemas += 1
        print()
        print('  *** %d CORTES DESAPARECIERON. El informe deberia ser acumulativo.' % len(bajas))
        for k in bajas[:10]:
            print('      CID %-9s %s' % k)
        if len(bajas) > 10:
            print('      ... y %d mas' % (len(bajas) - 10))

    # ── 2. Que periodo se agrego ──────────────────────────────────────
    mv = Counter(mes_de(f.get('Fecha de corte')) for f in viejo)
    mn = Counter(mes_de(f.get('Fecha de corte')) for f in nuevo)
    print()
    print('  POR MES DE CORTE')
    print('    %-9s %9s %9s %9s' % ('MES', 'ANTES', 'AHORA', 'CAMBIO'))
    for m in sorted(set(mv) | set(mn)):
        a, b = mv.get(m, 0), mn.get(m, 0)
        print('    %-9s %9s %9s %9s'
              % (m, format(a, ','), format(b, ','), ('%+d' % (b - a)) if b != a else '='))

    # ── 3. Planes nuevos ──────────────────────────────────────────────
    pv = {str(f.get('Nombre del Plan') or '').strip() for f in viejo}
    pn = Counter(str(f.get('Nombre del Plan') or '').strip() for f in nuevo)
    planes_nuevos = sorted(set(pn) - pv)
    print()
    print('  PLANES: %d distintos -> %d   (%d nuevos)' % (len(pv), len(pn), len(planes_nuevos)))
    for p in planes_nuevos:
        b, ext, origen = base_minutos(p, 0)
        print('    NUEVO  %-52s %d corte(s)' % (p[:52], pn[p]))
        print('           base por nombre: %s (%s)' % (b if b is not None else 'sin medicion', origen))

    # ── 4. EL CHEQUEO QUE IMPORTA: consumo sin base contra la cual medir ──
    #
    # Se calcula sobre AMBOS archivos y solo FALLA por lo que esta carga
    # introduce. Un caso preexistente se informa, pero no tumba el despliegue:
    # si cada semana gritara por los mismos dos cortes de diciembre, en dos
    # semanas nadie leeria la salida — y el dia que apareciera uno de verdad
    # nuevo, tampoco.
    def sin_base_de(filas):
        fuera, origenes = {}, Counter()
        for f in filas:
            plan = str(f.get('Nombre del Plan') or '').strip()
            incl = num(f.get('Minutos Incluidos'))
            cons = num(f.get('Minutos Consumidos'))
            b, ext, origen = base_minutos(plan, incl)
            origenes[origen] += 1
            if b is None and cons > 0:
                fuera[clave(f)] = (plan, incl, cons)
        return fuera, origenes

    fuera_n, por_origen = sin_base_de(nuevo)
    fuera_v, _ = sin_base_de(viejo)
    nuevos_fuera = {k: v for k, v in fuera_n.items() if k not in fuera_v}
    viejos_fuera = {k: v for k, v in fuera_n.items() if k in fuera_v}

    print()
    print('  CONSUMO SIN BASE — cortes que gastan minutos y no se pueden medir')
    print('    origen de la base: %s' % dict(por_origen))

    def pinta(titulo, casos):
        agrupado = defaultdict(list)
        for (cid, mes), (plan, incl, cons) in casos.items():
            agrupado[plan].append((cid, mes, incl, cons))
        print('    %s: %d corte(s) en %d plan(es)' % (titulo, len(casos), len(agrupado)))
        for plan, filas in sorted(agrupado.items(), key=lambda x: -len(x[1]))[:8]:
            ej = sorted(filas)[0]
            print('      %-42s %4d corte(s)  ej: CID %s %s, incl %g, cons %g'
                  % (plan[:42], len(filas), ej[0], ej[1], ej[2], ej[3]))

    if nuevos_fuera:
        problemas += 1
        pinta('*** NUEVOS con esta carga', nuevos_fuera)
        print('    Eso se pinta como 0%% de consumo, que se lee como cliente que dejo de')
        print('    usar el servicio. Revisar RX_SIN_VOZ / BOLSA_MINIMA en plan-minutos.ts.')
    else:
        print('    nuevos con esta carga: ninguno.')
    if viejos_fuera:
        print('    (preexistentes, ya estaban antes de esta carga — no bloquean)')
        pinta('    conocidos', viejos_fuera)

    # ── 5. El % del archivo sigue siendo basura ───────────────────────
    absurdos = 0
    for f in nuevo:
        p = num(f.get('% Consumo'))
        if p > 1000:
            absurdos += 1
    print()
    print('  «%% Consumo» del archivo: %d corte(s) por encima de 1,000%%.' % absurdos)
    print('    Sigue siendo inservible, como se documento. El modulo lo recalcula.')

    # ── Cierre ────────────────────────────────────────────────────────
    print()
    if len(altas) - len(bajas) != len(kn) - len(kv):
        print('  *** el reparto de claves no cuadra.')
        problemas += 1
    else:
        print('  CUADRA: %d altas - %d bajas = %+d claves.'
              % (len(altas), len(bajas), len(kn) - len(kv)))
    if problemas:
        print()
        print('  *** %d problema(s). NO desplegar sin resolverlos.' % problemas)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
