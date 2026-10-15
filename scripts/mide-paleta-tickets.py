# -*- coding: utf-8 -*-
u"""LOS PARES DE COLOR DE TICKETS, MEDIDOS ANTES DE ESCRIBIRLOS.

   Tickets no tiene ni una `.cp-card`, asi que es una ISLA CLARA: fondo claro,
   letra oscura. Eso fija contra que se mide cada tono y es la mitad de la
   arquitectura de contraste. [[atlas-dashboard-contrast-architecture]]

   Dos superficies claras conviven en la pantalla y NO son la misma:

       pagina   #F5F8FB   el lavado del tablero (`--wash`)
       tarjeta  #FFFFFF   las islas blancas dentro de la pagina

   La diferencia importa justo en el tono apagado: `#6A7889` pasa 4.5:1 sobre
   blanco y NO lo pasa sobre el lavado. Un texto secundario que se mueve de
   una tarjeta al fondo de la pagina cae por debajo del umbral sin que nadie
   toque su color.

   Y mide de paso el DESFASE DE `FONDO_PAGINA`: lib/contraste.ts la declara en
   `#EFF6FF`, que era el fondo de la paleta anterior. El fondo de hoy es
   `#F5F8FB`.

   USO
   ---
       python scripts/mide-paleta-tickets.py
"""
import io
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

# ── La paleta del documento, la misma de lib/chart-theme.ts ────────────────
NAVY_900, NAVY_700, BLUE = '#082742', '#10355D', '#1D6CAA'
CIAN_500, CIAN_400 = '#39ABD8', '#8AD7F8'
TINTA, APAGADO = '#202E3B', '#6A7889'
LINEA, PAGINA, TARJETA = '#DFE8EF', '#F5F8FB', '#FFFFFF'


def rgb(h):
    s = h.strip().lstrip('#')
    if len(s) == 3:
        s = ''.join(c * 2 for c in s)
    return [int(s[i:i + 2], 16) for i in (0, 2, 4)]


def canal(c):
    x = c / 255.0
    return x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4


def lum(c):
    r, g, b = [canal(v) for v in c]
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def ratio(a, b):
    la, lb = lum(rgb(a)), lum(rgb(b))
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)


def compone(fg, alfa, fondo):
    f, b = rgb(fg), rgb(fondo)
    return '#%02X%02X%02X' % tuple(
        int(round(f[i] * alfa + b[i] * (1 - alfa))) for i in range(3))


def linea(etq, fg, bg, minimo=4.5):
    r = ratio(fg, bg)
    print(u'  %-38s %s sobre %s  %5.2f:1  %s'
          % (etq, fg, bg, r, u'ok' if r >= minimo else u'*** FALLA (pide %.1f)' % minimo))
    return r >= minimo


fallos = []


def exige(ok, que):
    if not ok:
        fallos.append(que)


print(u'\n  TICKETS — isla clara: fondo claro, letra oscura')
print(u'  ' + u'=' * 78)

print(u'\n  (1) EL DESFASE DE `FONDO_PAGINA` EN lib/contraste.ts')
print(u'      declara #EFF6FF; el fondo real del tablero es #F5F8FB.')
for tono in (APAGADO, TINTA, BLUE):
    a, b = ratio(tono, '#EFF6FF'), ratio(tono, PAGINA)
    print(u'      %s  contra el declarado %5.2f:1   contra el real %5.2f:1   '
          u'diferencia %+.2f' % (tono, a, b, b - a))
print(u'      El real es un pelo MEJOR --#F5F8FB es mas claro-- asi que el')
print(u'      desfase no deja nada por debajo del umbral; pero la constante')
print(u'      miente y su comentario cita un globals.css que ya no dice eso.')

print(u'\n  (2) TEXTO SOBRE LAS DOS SUPERFICIES CLARAS')
exige(linea(u'tinta sobre la pagina', TINTA, PAGINA), u'tinta/pagina')
exige(linea(u'tinta sobre tarjeta blanca', TINTA, TARJETA), u'tinta/tarjeta')
exige(linea(u'marino sobre la pagina', NAVY_700, PAGINA), u'marino/pagina')
exige(linea(u'marino sobre tarjeta blanca', NAVY_700, TARJETA), u'marino/tarjeta')
exige(linea(u'azul acento sobre tarjeta', BLUE, TARJETA), u'azul/tarjeta')
exige(linea(u'azul acento sobre la pagina', BLUE, PAGINA), u'azul/pagina')
print(u'')
ok_tarjeta = linea(u'APAGADO sobre tarjeta blanca', APAGADO, TARJETA)
ok_pagina = ratio(APAGADO, PAGINA) >= 4.5
print(u'  %-38s %s sobre %s  %5.2f:1  %s'
      % (u'APAGADO sobre la pagina', APAGADO, PAGINA, ratio(APAGADO, PAGINA),
         u'ok' if ok_pagina else u'<- NO: por eso no se usa ahi'))
exige(ok_tarjeta, u'apagado/tarjeta')
if not ok_pagina:
    print(u'      ^ ESTE ES EL FILO. `#6A7889` vale DENTRO de una tarjeta')
    print(u'        blanca y NO sobre el lavado de la pagina. Un secundario')
    print(u'        que se mueva de una a otra cae sin que nadie lo toque.')
    print(u'        Para texto sobre la pagina va la tinta %s.' % TINTA)

print(u'\n  (2-BIS) EL SECUNDARIO QUE SIRVE EN LAS DOS SUPERFICIES')
print(u'      Tickets mezcla tarjetas blancas y el lavado de la pagina en la')
print(u'      misma pantalla, y un mismo tono de texto secundario cae en las')
print(u'      dos. Como `#6A7889` no pasa sobre el lavado, se OSCURECE hasta')
print(u'      que pase en la peor de las dos — que es exactamente lo que hace')
print(u'      `tonoSobreFondo` en lib/contraste.ts. Aqui se calcula el hex para')
print(u'      poder escribirlo como constante y que no haya que recordarlo:')
print(u'')


def oscurece_hasta(hex_, fondo, objetivo):
    """Replica `tonoSobreFondo`: baja el tono por pasos hasta llegar al ratio."""
    c = rgb(hex_)
    for _ in range(100):
        if ratio('#%02X%02X%02X' % tuple(int(round(v)) for v in c), fondo) >= objetivo:
            break
        c = [v * 0.96 for v in c]
    return '#%02X%02X%02X' % tuple(int(round(v)) for v in c)


SEC = oscurece_hasta(APAGADO, PAGINA, 4.5)
print(u'      apagado %s oscurecido hasta 4.5:1 sobre el lavado -> %s'
      % (APAGADO, SEC))
print(u'')
print(u'      LA ESCALA ES DE TRES NIVELES, y el medio NO se inventa aqui:')
print(u'      `#3D4B5C` ya es el secundario de Activaciones 2.0, que tomo esta')
print(u'      misma paleta el 14 oct. Dos secundarios distintos en el mismo')
print(u'      tablero es la trampa de las paletas gemelas — alguien lee uno y')
print(u'      asume que el otro significa algo.')
print(u'')
TX_MID = '#3D4B5C'
for etq, tono in ((u'alto   (titulos)', TINTA),
                  (u'medio  (cuerpo)', TX_MID),
                  (u'bajo   (secundario)', SEC)):
    for fondo, nf in ((PAGINA, u'pagina '), (TARJETA, u'tarjeta')):
        exige(linea(u'%s sobre %s' % (etq, nf), tono, fondo),
              u'%s/%s' % (etq.split()[0], nf.strip()))
print(u'      Los tres pasan en las DOS superficies, que es la condicion: en')
print(u'      Tickets conviven tarjetas blancas y el lavado en la misma vista.')

print(u'\n  (3) TEXTO BLANCO SOBRE LOS SOLIDOS DE MARCA')
print(u'      Las pestañas activas y los botones pintan #fff encima.')
exige(linea(u'blanco sobre marino 700', '#FFFFFF', NAVY_700), u'blanco/navy700')
exige(linea(u'blanco sobre marino 900', '#FFFFFF', NAVY_900), u'blanco/navy900')
exige(linea(u'blanco sobre azul acento', '#FFFFFF', BLUE), u'blanco/azul')

print(u'\n  (4) EL BLOQUE DE CODIGO, QUE ES LA UNICA ISLA OSCURA')
exige(linea(u'cian 400 sobre marino 900', CIAN_400, NAVY_900), u'cian400/navy900')
exige(linea(u'cian 500 sobre marino 900', CIAN_500, NAVY_900), u'cian500/navy900')

print(u'\n  (5) LOS TINTES AL 14%, QUE ES DONDE SE ESCONDEN LOS FALLOS')
print(u'      Un color sobre su PROPIO tinte es el bug que creo lib/contraste.ts.')
print(u'      Solo el marino aguanta plano. Los otros DOS hay que calcularlos')
print(u'      con `tonoSobreClaro` / `tonoSobrePagina`, que los oscurecen hasta')
print(u'      que miden — por eso esas funciones existen y por eso Tickets ya')
print(u'      las importa. Lo que sigue dice CUALES no se pueden poner planos:')
print(u'')
for c, nom in ((NAVY_700, u'marino'), (BLUE, u'azul'), (CIAN_500, u'cian')):
    for fondo, nf in ((TARJETA, u'tarjeta'), (PAGINA, u'pagina')):
        t = compone(c, 0.14, fondo)
        r = ratio(c, t)
        print(u'  %-38s %s sobre %s  %5.2f:1  %s'
              % (u'%s sobre su tinte en %s' % (nom, nf), c, t, r,
                 u'plano ok' if r >= 4.5 else u'<- PLANO NO: hay que calcularlo'))
# El marino es el unico que se puede poner plano, y de eso si depende el diseño.
exige(ratio(NAVY_700, compone(NAVY_700, 0.14, PAGINA)) >= 4.5, u'marino/tinte-pagina')

print(u'\n  (5-BIS) EL CIAN COMO RELLENO SOBRE CLARO — ni para objeto grafico')
print(u'      Un relleno de barra o un punto piden 3:1 contra el fondo.')
for fondo, nf in ((TARJETA, u'tarjeta'), (PAGINA, u'pagina')):
    r = ratio(CIAN_500, fondo)
    print(u'  %-38s %s sobre %s  %5.2f:1  %s'
          % (u'cian plano sobre %s' % nf, CIAN_500, fondo, r,
             u'ok' if r >= 3 else u'<- NO LLEGA NI A 3:1'))
print(u'      Por eso el acento de las islas claras es el azul %s y NO el' % BLUE)
print(u'      cian: el cian es el acento de las superficies OSCURAS.')

print(u'\n  (6) LINEAS Y BORDES — objeto grafico, pide 3:1')
exige(linea(u'linea sobre tarjeta', LINEA, TARJETA, 1.2), u'linea/tarjeta')
print(u'      (un separador no es un objeto informativo: con que se vea basta,')
print(u'       por eso aqui el minimo es 1.2 y no 3.)')

print(u'')
print(u'  ' + u'=' * 78)
if fallos:
    print(u'  *** %d PAR(ES) NO LLEGAN: %s' % (len(fallos), u', '.join(fallos)))
    sys.exit(1)
print(u'  Todos los pares que Tickets va a usar llegan al umbral.')
print(u'')
