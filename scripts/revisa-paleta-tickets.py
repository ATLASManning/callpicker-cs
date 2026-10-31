# -*- coding: utf-8 -*-
u"""¿Queda en Tickets algun color que no sea de la paleta del documento?

   POR QUE EXISTE
   --------------
   `aplica-paleta-tickets.py` trabajo sobre una lista de hex que salio de un
   inventario de los 30 mas frecuentes. Eso dejo fuera los que aparecen UNA
   vez: `#DBEAFE` y `#BFDBFE` en la tarjeta activa, `#F9FAFB` y `#E5E7EB` en
   la inactiva. Se vieron mirando la pantalla, no leyendo el archivo — y lo
   que se ve una vez es justo lo que un inventario por frecuencia tira.

   Este guion no cuenta: BARRE. Lee todos los hex del archivo y marca el que
   no este ni en la paleta ni en la lista de semanticos. Asi el que escriba
   un color nuevo manana se entera en el acto.

   USO
   ---
       python scripts/revisa-paleta-tickets.py
"""
import io
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DESTINO = os.path.join(RAIZ, 'app', 'tickets', 'page.tsx')

#: La paleta del Customer Success Operating System, mas los tonos derivados
#: que `scripts/mide-paleta-tickets.py` midio contra el fondo real.
PALETA = {
    '#082742': u'--navy2, marino profundo',
    '#10355D': u'--navy, el solido de marca',
    '#1D6CAA': u'--blue, el acento de las islas claras',
    '#39ABD8': u'--cyan, acento SOLO sobre oscuro',
    '#8AD7F8': u'cian claro, para texto sobre marino',
    '#202E3B': u'--ink, texto alto',
    '#3D4B5C': u'texto medio (el mismo de Activaciones 2.0)',
    '#667384': u'texto bajo (--muted oscurecido para el lavado)',
    '#6A7889': u'--muted, SOLO sobre blanco',
    '#A8BACB': u'plata, texto secundario sobre marino',
    '#DFE8EF': u'--line',
    '#EDF2F7': u'linea suave',
    '#EAF0F5': u'superficie gris claro',
    '#EAF2F8': u'tinte azul claro',
    '#BBD4E6': u'borde azul claro',
    '#F5F8FB': u'--wash',
    '#FFFFFF': u'blanco',
    '#FFF': u'blanco corto',
    '#FFF7ED': u'fondo del aviso (semantico)',
}

#: Comunican ESTADO, no marca. Cambiarlos borraria la informacion que llevan.
SEMANTICOS = {
    '#EF4444': u'rojo', '#F59E0B': u'ambar', '#22C55E': u'verde',
    '#16A34A': u'verde oscuro', '#F97316': u'naranja',
    '#C2410C': u'naranja SLA', '#9A3412': u'naranja oscuro',
    '#B45309': u'ambar oscuro', '#B91C1C': u'rojo oscuro',
    '#7C2D12': u'marron SLA', '#FEE2E2': u'tinte rojo',
    '#FEF3C7': u'tinte ambar', '#FED7AA': u'tinte naranja',
    # Alta del 31 oct 2026, para la insignia «Cerro el …» de Fuera de SLA.
    # NO es un color suelto: es el ANALOGO EXACTO del par rojo que ya estaba
    # —tinte claro de fondo + tono oscuro de texto, como #FEE2E2/#B91C1C—,
    # que es el patron de insignia de este archivo. El verde que ya habia
    # (#22C55E / #16A34A) esta pensado para texto sobre oscuro: sobre el
    # lavado claro de la tabla da 3.1:1 y no alcanza. Este par da ~6:1.
    '#DCFCE7': u'tinte verde', '#166534': u'verde oscuro de texto',
}


def sin_comentarios(src):
    u"""Los comentarios se BLANQUEAN conservando los saltos de linea, para que
    los numeros de linea sigan siendo los del archivo.

    Hace falta porque un comentario que explica por que se quito un color lo
    MENCIONA, y el barrido lo leia como si siguiera en uso: la primera corrida
    acuso a `#DBEAFE` y `#BFDBFE` citandose a si misma. Un detector que se
    dispara con su propia documentacion entrena a ignorarlo.
    """
    def hueco(m):
        return re.sub(r'[^\n]', ' ', m.group(0))
    src = re.sub(r'/\*[\s\S]*?\*/', hueco, src)
    return re.sub(r'//[^\n]*', hueco, src)


def main():
    src = io.open(DESTINO, encoding='utf-8').read()
    lineas = sin_comentarios(src).split('\n')

    intrusos = {}
    for i, ln in enumerate(lineas, 1):
        # `&#123;` es la llave `{` escapada, no un color. Sin esta guarda el
        # ejemplo de correo del formulario sale como dos colores inventados.
        for m in re.finditer(r'(?<!&)#[0-9a-fA-F]{3,8}\b', ln):
            h = m.group(0)
            # Un hex de 8 es color + opacidad; se juzga por sus 6 primeros.
            base = ('#' + h[1:7]).upper() if len(h) >= 7 else h.upper()
            if base in PALETA or base in SEMANTICOS:
                continue
            if len(h) == 4:   # #fff y compañia
                corto = '#' + ''.join(c * 2 for c in h[1:]).upper()
                if corto in PALETA or corto in SEMANTICOS:
                    continue
            intrusos.setdefault(h, []).append((i, ln.strip()[:84]))

    print(u'\n  PALETA DE TICKETS — barrido completo del archivo')
    print(u'  ' + u'=' * 72)
    print(u'  %d hex distintos de la paleta · %d semanticos admitidos'
          % (len(PALETA), len(SEMANTICOS)))

    if not intrusos:
        print(u'\n  Ningun color fuera de la paleta.\n')
        return

    print(u'\n  *** %d COLOR(ES) QUE NO SON NI PALETA NI SEMANTICO:' % len(intrusos))
    for h, donde in sorted(intrusos.items()):
        print(u'\n    %s  (%d uso%s)' % (h, len(donde), u'' if len(donde) == 1 else u's'))
        for n, texto in donde[:4]:
            print(u'      %4d: %s' % (n, texto))
    print(u'')
    sys.exit(1)


if __name__ == '__main__':
    main()
