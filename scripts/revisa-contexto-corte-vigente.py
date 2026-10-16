# -*- coding: utf-8 -*-
u"""EL CONTEXTO DEL CORTE VIGENTE NO PUEDE TRAER CIFRAS NI MESES A MANO.

   `lib/atlas-context.ts` arma la seccion «CHURN — CORTE VIGENTE» a partir del
   corte importado de `app/churn/reporte-actual.ts`. Ese corte ROTA cada semana;
   el texto de alrededor no rotaba. Durante meses le dijo al modelo:

       «ESTA es la fuente para agosto 2026»
       «la seccion GRC AAA cubre enero-julio»
       «Dinero fuera de cartera: $72,631 en 71 cuentas»
       «Antiguedad de saldos (total $177,156.62)»
       «Proxima revision: martes 8 de septiembre de 2026»

   ...mientras el modulo ya iba por el cierre de T3 y luego por octubre. Atlas
   respondia octubre con rotulos de agosto, y sonaba igual de seguro. Recortarle
   o desactualizarle el dato en silencio cambia una fuga por una mentira.
   [[feedback-contexto-ia-sin-huecos]] [[churn-analisis-data]]

   ESTE DETECTOR mira SOLO la seccion del corte vigente y marca:
     · nombres de mes y anios dentro de literales de plantilla
     · importes con $ y digitos escritos a mano
   Lo que venga de `rep.…`, de una variable o de un comentario, no cuenta.

   USO
       python scripts/revisa-contexto-corte-vigente.py
"""
import io
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARCHIVO = os.path.join(RAIZ, 'lib', 'atlas-context.ts')

MESES = (u'enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|'
         u'octubre|noviembre|diciembre')


def main():
    src = io.open(ARCHIVO, encoding='utf-8').read()

    # ── 1. AISLAR LA SECCION ──────────────────────────────────────────────
    # Del `const rep = REPORTE_...` hasta el `modulos.push('churn-corte-vigente')`.
    ini = re.search(r'^\s*const rep = REPORTE_\w+', src, re.M)
    fin = re.search(r"modulos\.push\('churn-corte-vigente'\)", src)
    if not ini or not fin:
        print(u'\n  *** no encuentro la seccion del corte vigente en lib/atlas-context.ts.')
        print(u'      Si se renombro, hay que actualizar este detector: un verificador')
        print(u'      que no encuentra lo que vigila NO puede concluir que todo esta bien.')
        return 2
    bloque = src[ini.start():fin.end()]
    lineas = bloque.split('\n')
    base = src[:ini.start()].count('\n') + 1

    print(u'\n  CONTEXTO DEL CORTE VIGENTE — cifras y fechas escritas a mano')
    print(u'  ' + u'=' * 68)
    print(u'  lib/atlas-context.ts, lineas %d a %d (%d lineas)'
          % (base, base + len(lineas) - 1, len(lineas)))

    hallazgos = []
    for i, ln in enumerate(lineas):
        crudo = ln.strip()
        # Los comentarios documentan el POR QUE y pueden citar el texto viejo.
        if crudo.startswith(('//', '*', '/*')):
            continue
        # Solo interesa lo que viaja dentro de un literal de plantilla: lo que
        # el modelo acaba leyendo. Se extrae el texto entre backticks.
        for trozo in re.findall(r'`([^`]*)`', ln):
            # Lo interpolado (${...}) SI se deriva del corte: se quita.
            plano = re.sub(r'\$\{[^}]*\}', u'', trozo)
            mes = re.search(MESES, plano, re.I)
            anio = re.search(r'\b20\d\d\b', plano)
            plata = re.search(r'\$\s?\d[\d,\.]*', plano)
            if mes or anio or plata:
                que = []
                if mes:
                    que.append(u'mes «%s»' % mes.group(0))
                if anio:
                    que.append(u'año «%s»' % anio.group(0))
                if plata:
                    que.append(u'importe «%s»' % plata.group(0))
                hallazgos.append((base + i, u' · '.join(que), plano.strip()[:90]))

    print()
    if not hallazgos:
        print(u'  Ninguna. Todo lo que el modelo lee de este bloque sale del corte.')
        print(u'')
        return 0

    for ln, que, txt in hallazgos:
        print(u'  linea %-5d %s' % (ln, que))
        print(u'              %s' % txt)
    print()
    print(u'  *** %d literal(es) con dato fijo. Derivarlo de `rep` —`rep.periodo`,'
          % len(hallazgos))
    print(u'      `rep.fecha`, `rep.notaRemitente`, los totales declarados— o,')
    print(u'      si el corte no lo trae, DECIR que no lo trae.')
    return 1


if __name__ == '__main__':
    sys.exit(main())
