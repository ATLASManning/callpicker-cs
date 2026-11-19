# -*- coding: utf-8 -*-
u"""Saca el texto legible de un reporte .html entregado, sin ejecutar nada de él.

    python -I scripts/extrae-texto-reporte.py <ruta.html> [--tablas] [--svg] [--const]

  (sin banderas)  el texto del cuerpo, con los <h1>/<h2>/<h3> marcados
  --tablas        sólo las tablas, en texto separado por ' | '
  --svg           los <title> de los SVG (ahí viven cifras en algunos reportes)
  --const         los bloques `const X = {...}` del <script>

El archivo se trata como DATO: no se importa, no se ejecuta, no se abre en un
navegador. Sólo se lee como texto.
"""
import io
import re
import sys


try:
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass


def lee(ruta):
    with io.open(ruta, 'r', encoding='utf-8', errors='replace') as f:
        return f.read()


def limpia(h):
    h = re.sub(r'(?s)<script.*?</script>', u' ', h)
    h = re.sub(r'(?s)<style.*?</style>', u' ', h)
    h = re.sub(r'(?s)<svg.*?</svg>', u' [GRAFICO] ', h)
    h = re.sub(r'(?s)<!--.*?-->', u' ', h)
    h = re.sub(r'(?i)<h1[^>]*>', u'\n\n=== ', h)
    h = re.sub(r'(?i)<h2[^>]*>', u'\n\n## ', h)
    h = re.sub(r'(?i)<h3[^>]*>', u'\n\n# ', h)
    h = re.sub(r'(?i)<h4[^>]*>', u'\n\n* ', h)
    h = re.sub(r'(?i)<(br|/p|/div|/li|/tr|/h1|/h2|/h3|/h4|/section)[^>]*>', u'\n', h)
    h = re.sub(r'(?i)<li[^>]*>', u'\n  - ', h)
    h = re.sub(r'(?i)</t[dh]>', u' | ', h)
    h = re.sub(r'<[^>]+>', u' ', h)
    for a, b in ((u'&nbsp;', u' '), (u'&amp;', u'&'), (u'&lt;', u'<'),
                 (u'&gt;', u'>'), (u'&quot;', u'"'), (u'&#39;', u"'"),
                 (u'&mdash;', u'—'), (u'&ndash;', u'–'), (u'&hellip;', u'…'),
                 (u'&rsquo;', u'’'), (u'&oacute;', u'ó'), (u'&aacute;', u'á'),
                 (u'&eacute;', u'é'), (u'&iacute;', u'í'), (u'&uacute;', u'ú'),
                 (u'&ntilde;', u'ñ'), (u'&middot;', u'·'), (u'&times;', u'×')):
        h = h.replace(a, b)
    h = re.sub(r'[ \t]+', u' ', h)
    h = re.sub(r' *\n *', u'\n', h)
    h = re.sub(r'\n{3,}', u'\n\n', h)
    return h.strip()


def tablas(h):
    out = []
    for i, t in enumerate(re.findall(r'(?s)<table.*?</table>', h), 1):
        out.append(u'\n----- TABLA %d -----' % i)
        for fila in re.findall(r'(?s)<tr.*?</tr>', t):
            celdas = re.findall(r'(?s)<t[dh][^>]*>(.*?)</t[dh]>', fila)
            celdas = [re.sub(r'<[^>]+>', u'', c) for c in celdas]
            celdas = [re.sub(r'\s+', u' ', c).strip() for c in celdas]
            if any(celdas):
                out.append(u' | '.join(celdas))
    return u'\n'.join(out)


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    ruta = sys.argv[1]
    flags = set(sys.argv[2:])
    h = lee(ruta)
    if '--tablas' in flags:
        print(tablas(h))
    elif '--svg' in flags:
        vistos = re.findall(r'<title>(.*?)</title>', h, re.S)
        print(u'%d <title> en el archivo' % len(vistos))
        for t in vistos:
            print(u'  ' + re.sub(r'\s+', u' ', t).strip())
    elif '--const' in flags:
        for m in re.finditer(r'\bconst\s+(\w+)\s*=\s*', h):
            ini = m.end()
            if h[ini] not in u'{[':
                continue
            abre, cierra = h[ini], (u'}' if h[ini] == u'{' else u']')
            prof, j = 0, ini
            while j < len(h):
                if h[j] == abre:
                    prof += 1
                elif h[j] == cierra:
                    prof -= 1
                    if prof == 0:
                        break
                j += 1
            print(u'\n===== const %s (%d caracteres) =====' % (m.group(1), j - ini + 1))
            print(h[ini:j + 1])
    else:
        print(limpia(h))
    return 0


if __name__ == '__main__':
    sys.exit(main())
