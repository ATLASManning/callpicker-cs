# -*- coding: utf-8 -*-
u"""Lleva los HEX SUELTOS de Tickets a la paleta del documento.

   Las 243 clases Tailwind las remapea la capa `.cp-tickets` de globals.css.
   Aqui van los hex escritos a mano en el JSX, que ninguna capa CSS alcanza.

   REEMPLAZO CONTADO: cada regla dice cuantas veces TIENE que aparecer. Si una
   no cuadra, NO SE ESCRIBE NADA y se dice cual. Un reemplazo ciego sobre un
   archivo de 1,808 lineas cambia de mas o de menos y nadie lo nota hasta que
   algo se ve mal en produccion.

   Los tonos salen de `scripts/mide-paleta-tickets.py`, que los mide contra el
   fondo REAL —y Tickets tiene dos: tarjeta blanca y el lavado de la pagina—.

   USO
   ---
       python scripts/aplica-paleta-tickets.py --simulacro   # dice que haria
       python scripts/aplica-paleta-tickets.py               # lo hace
"""
import io
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DESTINO = os.path.join(RAIZ, 'app', 'tickets', 'page.tsx')

#: (viejo, nuevo, veces_esperadas, por_que)
REGLAS = [
    # ── La marca ──────────────────────────────────────────────────────────
    ('#1B3FCC', '#10355D', 10,
     u'el azul electrico de la paleta anterior -> marino `--navy`. Pinta las '
     u'pestañas activas, los botones, la paginacion y la barra del formulario. '
     u'Con #fff encima da 12.43:1.'),
    # El tinte lleva su propia regla porque la frontera `(?![0-9a-fA-F])` lo
    # deja fuera de la de arriba — que es justo lo que se quiere: el `15` del
    # final es la opacidad, no parte del color, y cambia con el.
    ('#1B3FCC15', '#10355D14', 1,
     u'el tinte del aviso de «Nuevo Ticket» -> marino al 8%'),

    # ── Series y acentos ──────────────────────────────────────────────────
    ('#3b82f6', '#1D6CAA', 3,
     u'azul de series y del acento -> `--blue`, 5.56:1 sobre blanco'),
    ('#8b5cf6', '#10355D', 1,
     u'el morado de «chat». El documento no tiene morado; se distingue del '
     u'azul de «voz» por luminosidad (12.43 contra 5.56), no por matiz'),
    ('#6366f1', '#082742', 1,
     u'el indigo de las graficas -> marino profundo `--navy2`'),

    # ── La unica isla oscura: el bloque de codigo ─────────────────────────
    ('#0f172a', '#082742', 1, u'fondo del bloque de codigo -> `--navy2`'),
    ('#7dd3fc', '#8AD7F8', 1,
     u'su texto -> cian claro, 9.54:1 sobre el marino. Aqui el cian SI vale: '
     u'es la unica superficie oscura de la pantalla'),

    # ── Superficies y lineas ──────────────────────────────────────────────
    ('#E2E8F0', '#DFE8EF', 5, u'lineas -> `--line`'),
    ('#F8FAFC', '#F5F8FB', 3, u'superficie clara -> `--wash`'),
    ('#F1F5F9', '#F5F8FB', 1, u'idem'),
    ('#F3F4F6', '#F5F8FB', 2, u'idem'),

    # ── La escala de texto, los tres niveles medidos ──────────────────────
    ('#475569', '#202E3B', 8, u'texto alto -> `--ink`'),
    ('#374151', '#202E3B', 2, u'texto alto -> `--ink`'),
    ('#64748B', '#3D4B5C', 4, u'texto medio, el mismo de Activaciones 2.0'),
    ('#6b7280', '#667384', 6, u'texto bajo; `--muted` oscurecido para que pase '
                              u'tambien sobre el lavado (4.23 -> 4.53)'),
    ('#94a3b8', '#667384', 2, u'idem'),
    ('#9ca3af', '#667384', 4, u'idem; incluye el relleno de «sin producto»'),
]

#: Lo que NO se toca, y por que. Los semanticos comunican ESTADO, no marca:
#: cambiarlos por tonos de marca borraria la informacion que llevan.
INTOCABLES = ['#ef4444', '#f59e0b', '#22c55e', '#16a34a', '#f97316',
              '#C2410C', '#9A3412', '#B45309', '#B91C1C', '#7C2D12',
              '#FEE2E2', '#FEF3C7', '#FED7AA', '#FFFFFF']


def busca(src, hex_):
    u"""Todas las apariciones del hex, VENGA COMO VENGA LA CAJA.

    El primer intento conto con `str.count`, que es sensible a mayusculas, y
    cuatro reglas no cuadraron: el archivo mezcla `#F8FAFC` con `#f8fafc` y
    `#9ca3af` con `#9CA3AF`. Contar solo una forma deja la otra en pantalla con
    la paleta vieja — y como el archivo compila igual, no lo caza nada.

    Tampoco vale un `count` suelto sin frontera: `#10355D` es prefijo de
    `#10355D14`, el tinte. Con `(?![0-9a-fA-F])` se cuenta el color y no su
    tinte, y cada uno lleva su regla.
    """
    return list(re.finditer(re.escape(hex_) + r'(?![0-9a-fA-F])', src, re.I))


def main():
    simulacro = '--simulacro' in sys.argv
    src = io.open(DESTINO, encoding='utf-8').read()
    original = src

    if '--cuenta' in sys.argv:
        # Para fijar los esperados con el MISMO criterio con que se verifican.
        print(u'\n  conteos reales (insensible a la caja, sin tragarse tintes):')
        for viejo, _n, _e, _p in REGLAS:
            ms = busca(src, viejo)
            formas = sorted({m.group(0) for m in ms})
            print(u'    %-10s x%-3d  %s' % (viejo, len(ms), u' '.join(formas)))
        return

    print(u'\n  PALETA DEL DOCUMENTO -> app/tickets/page.tsx')
    print(u'  ' + u'=' * 74)
    print(u'  %s\n' % (u'SIMULACRO: no se escribe nada' if simulacro
                       else u'APLICANDO'))

    fallos = []
    hechos = 0
    for viejo, nuevo, esperadas, porque in REGLAS:
        if esperadas == 0:
            print(u'  %-9s            (cubierto por otra regla)' % viejo)
            continue
        ms = busca(src, viejo)
        n = len(ms)
        estado = u'ok' if n == esperadas else u'*** %d, se esperaban %d' % (n, esperadas)
        print(u'  %-9s -> %-9s x%-3d %s' % (viejo, nuevo, n, estado))
        print(u'      %s' % porque)
        if n != esperadas:
            fallos.append(u'%s (%d vs %d)' % (viejo, n, esperadas))
            continue
        src = re.sub(re.escape(viejo) + r'(?![0-9a-fA-F])', nuevo, src, flags=re.I)
        hechos += n

    if fallos:
        print(u'\n  *** %d REGLA(S) NO CUADRAN. NO SE ESCRIBE NADA:' % len(fallos))
        for f in fallos:
            print(u'      %s' % f)
        print(u'  El archivo cambio desde que se conto. Revisar antes de forzar.')
        sys.exit(1)

    print(u'\n  intocables (semanticos: comunican ESTADO, no marca):')
    print(u'      %s' % u', '.join(INTOCABLES))

    # La raiz tiene que llevar `cp-tickets` o la capa de globals.css no aplica.
    if 'cp-tickets' not in src:
        print(u'\n  *** la raiz NO lleva la clase `cp-tickets`: sin ella la capa')
        print(u'      de globals.css no alcanza ni una sola clase de Tailwind.')
        fallos.append('cp-tickets')

    print(u'\n  %d sustitucion(es) en %d regla(s)'
          % (hechos, len([r for r in REGLAS if r[2] > 0])))
    if simulacro:
        print(u'  (simulacro: el archivo queda igual)\n')
        return
    if src == original:
        print(u'  nada que cambiar.\n')
        return
    io.open(DESTINO, 'w', encoding='utf-8', newline='').write(src)
    print(u'  escrito.\n')
    if fallos:
        sys.exit(1)


if __name__ == '__main__':
    main()
