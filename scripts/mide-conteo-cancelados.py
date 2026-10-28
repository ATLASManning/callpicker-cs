# -*- coding: utf-8 -*-
u"""MIDE EL CONTEO DE CANCELACIONES DE CADA CORTE, ANTES Y DESPUES DEL CUBO.

   Contar filas de `cancelados` contaba los cubos de cierre («+ 21 cuentas
   canceladas en agosto…») como un cliente. Filtrarlos arregla el conteo en los
   cortes que detallan un top, PERO en los que SOLO traen cubo deja el conteo en
   CERO con dinero cancelado al lado — que es un cero peor que el error que
   venia a arreglar.

   Esto lista los dos conteos y, cuando el texto del cubo dice cuantas cuentas
   agrupa, lo extrae para poder declararlo a mano.

   Es de SOLO LECTURA. [[feedback-tablas-deben-cerrar]] [[feedback-cero-sin-medicion]]

   USO
       python scripts/mide-conteo-cancelados.py
"""
import io
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

RX_ID = re.compile(r"\bid:\s*'([^']+)'")
RX_CLI = re.compile(r"cliente:\s*'((?:[^'\\]|\\.)*)'")
RX_DECL = re.compile(r'canceladosCasosReal:\s*(\d+)')
# «+ 21 cuentas canceladas», «+ Resto … 6 clientes», «11 clientes»
RX_N = re.compile(r'(\d+)\s*(?:cuentas|clientes)', re.I)


def bloques(texto):
    out = []
    for m in re.finditer(r'\bcancelados:\s*\[', texto):
        ids = RX_ID.findall(texto[:m.start()])
        rid = ids[-1] if ids else u'(sin id)'
        decl = RX_DECL.findall(texto[max(0, m.start() - 400):m.start()])
        i, prof = m.end(), 1
        while i < len(texto) and prof:
            if texto[i] == '[':
                prof += 1
            elif texto[i] == ']':
                prof -= 1
            i += 1
        cuerpo = texto[m.end():i - 1]
        clientes = RX_CLI.findall(cuerpo)
        out.append((rid, int(decl[-1]) if decl else None, clientes))
    return out


def main():
    filas = []
    for rel in ('app/churn/page.tsx', 'app/churn/reporte-actual.ts'):
        ruta = os.path.join(RAIZ, rel)
        if os.path.exists(ruta):
            filas += bloques(io.open(ruta, encoding='utf-8').read())

    print(u'\n  CANCELACIONES — conteo por filas, sin cubos, y lo declarado')
    print(u'  ' + u'=' * 76)
    print(u'  %-24s %7s %7s %9s   %s'
          % (u'corte', u'filas', u's/cubo', u'declarado', u'veredicto'))
    print(u'  ' + u'-' * 76)

    ceros, cambian, faltan = [], [], []
    for rid, decl, clientes in filas:
        cubos = [c for c in clientes if c.lstrip().startswith('+')]
        sin = len(clientes) - len(cubos)
        if decl is not None:
            v = u'ok · declarado'
        elif not clientes:
            v = u'sin cancelaciones en el corte'
        elif sin == 0:
            v = u'<<< CERO FALSO: solo cubo(s), y hay dinero'
            ceros.append((rid, cubos))
        elif cubos:
            v = u'<<< subdeclara: %d con nombre + %d cubo(s)' % (sin, len(cubos))
            faltan.append((rid, sin, cubos))
        else:
            v = u'ok · lista completa'
        if cubos and decl is None:
            cambian.append(rid)
        print(u'  %-24s %7d %7d %9s   %s'
              % (rid[:24], len(clientes), sin,
                 decl if decl is not None else u'—', v))

    print(u'  ' + u'-' * 76)
    if ceros:
        print(u'\n  *** %d CORTE(S) QUEDARIAN EN «0 canc.» CON DINERO CANCELADO.' % len(ceros))
        print(u'      Hay que declararles `canceladosCasosReal`. El numero esta en el')
        print(u'      propio texto del cubo:')
        for rid, cubos in ceros:
            for c in cubos:
                n = RX_N.search(c)
                print(u'        %-22s -> %s   «%s…»'
                      % (rid[:22], n.group(1) if n else u'NO LO DICE', c[:62]))
    if faltan:
        print(u'\n  %d corte(s) detallan un top y agrupan el resto: el conteo sin cubo' % len(faltan))
        print(u'  es un PISO, no el total. Conviene declararlo tambien:')
        for rid, sin, cubos in faltan:
            for c in cubos:
                n = RX_N.search(c)
                tot = (sin + int(n.group(1))) if n else None
                print(u'        %-22s %d con nombre + %s agrupadas = %s'
                      % (rid[:22], sin, n.group(1) if n else u'?',
                         tot if tot is not None else u'no se sabe'))
    print(u'')
    return 1 if ceros else 0


if __name__ == '__main__':
    sys.exit(main())
