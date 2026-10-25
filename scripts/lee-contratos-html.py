# -*- coding: utf-8 -*-
u"""LEE EL EXPORT HTML DE LA HOJA DE CONTRATOS.

   Direccion comparte «Contratos con Clientes.zip», que es un export de Google
   Sheets a HTML: una tabla con clases CSS por celda.

   SE LEE TAMBIEN EL COLOR, y no es un capricho. En una hoja de Google el
   color de la celda ES dato muy a menudo —rojo para vencido, azul para una
   nota, gris para dado de baja— y ese dato NO esta en el texto. Tirarlo al
   parsear es perder la mitad de lo que el equipo escribio, sin enterarse.

   Es de SOLO LECTURA: imprime lo que hay para poder decidir el esquema.

   USO
       python scripts/lee-contratos-html.py "D:\\Archivos\\Contratos\\contratos.html"
       python scripts/lee-contratos-html.py <ruta> --json <salida.json>
"""
import io
import json
import os
import re
import sys
from html.parser import HTMLParser

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)


def estilos(html):
    """clase -> {color, fondo, negrita}. Lo que el CSS del export declara."""
    fuera = {}
    for m in re.finditer(r'\.ritz \.waffle \.(\w+)\{([^}]*)\}', html):
        clase, cuerpo = m.group(1), m.group(2)
        d = {}
        c = re.search(r'(?<!-)\bcolor:(#[0-9a-fA-F]{6})', cuerpo)
        b = re.search(r'background-color:(#[0-9a-fA-F]{6})', cuerpo)
        if c:
            d['color'] = c.group(1).lower()
        if b:
            d['fondo'] = b.group(1).lower()
        if 'font-weight:bold' in cuerpo:
            d['negrita'] = True
        fuera[clase] = d
    return fuera


class Tabla(HTMLParser):
    def __init__(self):
        super().__init__()
        self.filas, self.fila, self.celda = [], None, None
        self.clase = None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'tr':
            self.fila = []
        elif tag in ('td', 'th') and self.fila is not None:
            self.celda = []
            self.clase = a.get('class')

    def handle_data(self, d):
        if self.celda is not None:
            self.celda.append(d)

    def handle_endtag(self, tag):
        if tag in ('td', 'th') and self.celda is not None:
            txt = re.sub(r'\s+', ' ', ''.join(self.celda)).strip()
            self.fila.append({'t': txt, 'c': self.clase})
            self.celda, self.clase = None, None
        elif tag == 'tr' and self.fila is not None:
            self.filas.append(self.fila)
            self.fila = None


def main():
    if len(sys.argv) < 2:
        print(u'  uso: python scripts/lee-contratos-html.py <archivo.html> [--json <salida>]')
        return 2
    ruta = sys.argv[1]
    if not os.path.exists(ruta):
        print(u'  *** no existe: %s' % ruta)
        return 2
    html = io.open(ruta, encoding='utf-8', errors='replace').read()
    css = estilos(html)
    p = Tabla()
    p.feed(html)

    # La primera columna del export de Sheets es el numero de fila: se tira.
    filas = []
    for f in p.filas:
        if f and re.fullmatch(r'\d+', f[0]['t'] or ''):
            f = f[1:]
        if any(c['t'] for c in f):
            filas.append(f)

    print(u'\n  %s' % os.path.basename(ruta))
    print(u'  ' + u'=' * 74)
    print(u'  %d fila(s) con contenido · %d clase(s) CSS' % (len(filas), len(css)))

    ancho = max(len(f) for f in filas)
    print(u'  ancho maximo: %d columnas\n' % ancho)

    for n, f in enumerate(filas[:14]):
        marca = u'  CAB' if n == 0 else u'  %3d' % n
        print(marca + u' | ' + u' | '.join((c['t'] or u'·')[:22] for c in f[:9]))

    print()
    print(u'  COLORES DE LETRA QUE APARECEN (el color puede ser dato):')
    usos = {}
    for f in filas:
        for c in f:
            d = css.get(c['c'] or '', {})
            col = d.get('color')
            if col and col not in ('#000000',):
                usos.setdefault(col, []).append(c['t'])
    for col, textos in sorted(usos.items(), key=lambda x: -len(x[1])):
        muestra = [t for t in textos if t][:4]
        print(u'    %-9s %4d celda(s)   ej: %s' % (col, len(textos), u' · '.join(muestra)))

    if '--json' in sys.argv:
        destino = sys.argv[sys.argv.index('--json') + 1]
        salida = [[{'t': c['t'], 'color': css.get(c['c'] or '', {}).get('color'),
                    'fondo': css.get(c['c'] or '', {}).get('fondo')} for c in f]
                  for f in filas]
        io.open(destino, 'w', encoding='utf-8', newline='\n').write(
            json.dumps(salida, ensure_ascii=False, indent=1))
        print(u'\n  escrito %s' % destino)
    return 0


if __name__ == '__main__':
    sys.exit(main())
