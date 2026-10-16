# -*- coding: utf-8 -*-
u"""¿LLEGAN A ATLAS LOS ENLACES DE LA BASE DE CONOCIMIENTO?

   POR QUE EXISTE
   --------------
   `kbToText()` en `app/api/chat/route.ts` serializa la Base para el contexto
   de Atlas, y durante meses TIRO los enlaces: pasaba el titulo, la
   descripcion, la ubicacion y las consideraciones, pero no el `pdfUrl` ni el
   `linkUrl`. Resultado: 31 recursos --24 PDFs y 7 herramientas-- que Atlas
   conocia de oidas y no podia ofrecer. Describia la guia de campañas sin
   poder decir donde esta.

   Se destapo el 15 oct 2026, cuando direccion pidio cargar el consultor de
   DIDs «y que ATLAS IA lo conozca y lo ofrezca». Conocerlo ya lo hacia.

   QUE COMPRUEBA
   -------------
   Que CADA articulo con `pdfUrl` o `linkUrl` en `kb-data.ts` tenga su linea
   correspondiente en el serializador. No mira si el enlace «esta en el
   archivo»: mira si la funcion que arma el contexto lo EMITE.

   USO
       python scripts/revisa-recursos-atlas.py
"""
import io
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

KB = os.path.join(RAIZ, 'app', 'base-cs', 'kb-data.ts')
RUTA = os.path.join(RAIZ, 'app', 'api', 'chat', 'route.ts')


def main():
    kb = io.open(KB, encoding='utf-8').read()
    ruta = io.open(RUTA, encoding='utf-8').read()

    pdfs = re.findall(r"^\s*pdfUrl:\s*'([^']+)'", kb, re.M)
    links = re.findall(r"^\s*linkUrl:\s*'([^']+)'", kb, re.M)

    print(u'\n  RECURSOS DE LA BASE -> CONTEXTO DE ATLAS')
    print(u'  ' + u'=' * 70)
    print(u'  en kb-data.ts: %d documento(s) y %d enlace(s)' % (len(pdfs), len(links)))

    # ¿El serializador los emite? Se busca dentro de `kbToText`.
    m = re.search(r'function kbToText\(\)[\s\S]*?\n\}', ruta)
    if not m:
        print(u'  *** no encuentro kbToText() en app/api/chat/route.ts')
        sys.exit(2)
    cuerpo = m.group(0)

    fallos = []
    emite_pdf = 'art.pdfUrl' in cuerpo
    emite_link = 'art.linkUrl' in cuerpo
    print(u'')
    print(u'  %-34s %s' % (u'emite `pdfUrl`',
                           u'si' if emite_pdf else u'*** NO: %d PDFs mudos' % len(pdfs)))
    print(u'  %-34s %s' % (u'emite `linkUrl`',
                           u'si' if emite_link else u'*** NO: %d enlaces mudos' % len(links)))
    if pdfs and not emite_pdf:
        fallos.append(u'pdfUrl')
    if links and not emite_link:
        fallos.append(u'linkUrl')

    # Y que el prompt diga que hay que OFRECERLOS: tenerlos no es darlos.
    ofrece = 'SE OFRECEN' in ruta or 'se ofrece' in ruta
    print(u'  %-34s %s' % (u'el prompt manda ofrecerlos',
                           u'si' if ofrece else u'*** NO: los tendria y no los daria'))
    if not ofrece:
        fallos.append(u'conducta')

    # El consultor de DIDs, por su nombre, porque es el que se pidio.
    dids = [l for l in links if 'script.google.com' in l]
    print(u'  %-34s %s' % (u'consultor de DIDs en la Base',
                           u'si' if dids else u'*** NO esta'))
    if not dids:
        fallos.append(u'dids')

    # ── EL DOCUMENTO MARCO, QUE ES OTRO RECURSO Y FALLABA IGUAL ────────────
    #
    # Direccion pregunto DOS VECES por «el mensaje de la direccion» y las dos
    # veces Atlas recito los siete principios sin decir de donde salian ni dar
    # el enlace. El resumen del marco SI estaba en su contexto --por eso los
    # sabia-- y SI nombra su ruta; lo que faltaba era la instruccion de
    # ofrecerlo. Tenerlo no es darlo, igual que con los 31 recursos de la Base.
    marco = os.path.join(RAIZ, 'lib', 'marco-atlas.ts')
    tiene_ruta = False
    if os.path.exists(marco):
        tiene_ruta = 'MARCO_RUTA' in io.open(marco, encoding='utf-8').read()
    manda_citar = 'EL DOCUMENTO MARCO SE CITA' in ruta
    print(u'  %-34s %s' % (u'el marco nombra su ruta',
                           u'si' if tiene_ruta else u'*** NO'))
    print(u'  %-34s %s' % (u'el prompt manda citarlo y enlazarlo',
                           u'si' if manda_citar else u'*** NO: recitaria sin fuente'))
    if not tiene_ruta:
        fallos.append(u'marco-ruta')
    if not manda_citar:
        fallos.append(u'marco-conducta')

    print(u'')
    print(u'  ' + u'=' * 70)
    if fallos:
        print(u'  *** FALTA: %s' % u', '.join(fallos))
        print(u'      Un recurso que el serializador no emite, Atlas no lo puede dar.')
        sys.exit(1)
    print(u'  Los %d recursos llegan al contexto, y el prompt manda ofrecerlos.'
          % (len(pdfs) + len(links)))
    print(u'')


if __name__ == '__main__':
    main()
