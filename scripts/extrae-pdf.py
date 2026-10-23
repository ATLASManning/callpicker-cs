# -*- coding: utf-8 -*-
u"""SACA EL TEXTO DE UN PDF, pagina por pagina.

   El lector de PDF del entorno necesita `pdftoppm` (poppler) para rasterizar,
   y aqui no esta instalado. `pypdf` si, y para un PDF de texto —no escaneado—
   basta: extrae la capa de texto tal cual.

   Si un PDF viene ESCANEADO, esto devuelve paginas vacias. Eso NO es «el PDF
   no dice nada»: es que hace falta OCR. El guion lo dice con esas palabras en
   vez de entregar un vacio que se lea como ausencia de contenido.

   USO
       python scripts/extrae-pdf.py "C:\\ruta\\al.pdf"
       python scripts/extrae-pdf.py "C:\\ruta\\al.pdf" --pagina 3
"""
import io
import os
import sys

import pypdf

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)


def main():
    if len(sys.argv) < 2:
        print(u'  uso: python scripts/extrae-pdf.py <archivo.pdf> [--pagina N]')
        return 2
    ruta = sys.argv[1]
    if not os.path.exists(ruta):
        print(u'  *** no existe: %s' % ruta)
        return 2
    sola = None
    if '--pagina' in sys.argv:
        sola = int(sys.argv[sys.argv.index('--pagina') + 1])

    lector = pypdf.PdfReader(ruta)
    total = len(lector.pages)
    print(u'  %s · %d pagina(s)' % (os.path.basename(ruta), total))
    print(u'  ' + u'=' * 70)

    vacias = 0
    for i, pag in enumerate(lector.pages, 1):
        if sola and i != sola:
            continue
        txt = (pag.extract_text() or u'').strip()
        if not txt:
            vacias += 1
        print(u'\n────────── pagina %d/%d ──────────' % (i, total))
        print(txt if txt else u'(sin capa de texto)')

    if vacias:
        print(u'\n  *** %d de %d paginas NO traen capa de texto.' % (vacias, total))
        print(u'      El PDF esta escaneado: haria falta OCR. NO es que esas')
        print(u'      paginas no digan nada.')
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
