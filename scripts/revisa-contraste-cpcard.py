# -*- coding: utf-8 -*-
"""Caza el bug de contraste nº1 del proyecto: el color semántico que se pierde.

   LA REGLA QUE LO CAUSA, en `app/globals.css`:

       .cp-card span:not([style*="background"]) { color: ... !important; }
       .cp-card p, .cp-card strong, .cp-card em, .cp-card small,
       .cp-card h1..h5, .cp-card td, .cp-card th  { color: ... !important; }

   O sea, dentro de una tarjeta oscura:

     · un <span> que declare SOLO `color` se pinta BLANCO. Para salvarlo hay
       que declarar también `background` —aunque sea `transparent`—, que es lo
       que lo saca del `:not([style*="background"])`.
     · un <strong>, <p>, <em>, <small>, <td> o <th> se pinta blanco SIEMPRE:
       esos selectores no llevan cláusula de escape. Ahí no hay `background`
       que valga — el color va en un <span> que sí la tenga.

   Van seis rondas de este mismo bug. Es un patrón fijo, así que se busca solo.

   ESTO ES UNA HEURÍSTICA, no un compilador de CSS: no sabe si la etiqueta está
   de verdad dentro de una `.cp-card`. Por eso solo mira archivos que mencionen
   `cp-card` y por eso imprime el contexto: la última palabra es de quien lee.
"""
import io
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# `<span ... style={{ ... }}>` con su objeto de estilo entero. El objeto puede
# ocupar varias líneas, así que se captura hasta el `}}` que lo cierra.
RX_SPAN = re.compile(r'<span\b([^>]*?)style=\{\{(.*?)\}\}', re.S)
# Las etiquetas que se fuerzan SIN escape posible. La lista sale de la regla de
# `app/globals.css` (lineas 104-114) y esta COMPLETA desde el 23 nov 2026: antes
# decia `strong|em|small|p` y se dejaba fuera `td`, `th`, `label` y los `h1`-`h5`,
# que esa misma regla tambien fuerza. Era ceguera medible, no criterio: el
# `<td style={{ color: '#ef4444' }}>` de la tabla de cortes —el rojo que avisa de
# CERO minutos consumidos— se publicaba blanco y este guion no lo contaba.
RX_DURAS = re.compile(
    r'<(strong|em|small|p|label|td|th|h1|h2|h3|h4|h5)\b([^>]*?)style=\{\{(.*?)\}\}',
    re.S)
RX_COLOR = re.compile(r'(?<![A-Za-z])color\s*:', re.I)
RX_BG    = re.compile(r'background', re.I)

# Un color que ya es blanco o casi no pierde nada al forzarse a blanco: esos no
# son el bug, son lo mismo escrito dos veces.
RX_YA_BLANCO = re.compile(
    r"""['"]\s*(?:#fff(?:fff)?|white|rgba?\(\s*255\s*,\s*255\s*,\s*255)""", re.I)


# `//[^\n]*` y no `(?m)//.*$`: desde Python 3.11 un flag en linea tiene que ir
# al principio de TODA la expresion, y ahi reventaba con «global flags not at
# the start». La version sin flag dice lo mismo y no depende de la version.
RX_COMENTARIO = re.compile(r'/\*[\s\S]*?\*/|//[^\n]*')

# ── LA LINEA BASE VIVE AQUI, Y DICE DE CUANDO ES ───────────────────────────
#
# Este guion escupia un numero pelado y ese numero acabo copiado en tres
# sitios con tres valores distintos: 162 en docs/AUDITORIA-ENTREGA-Y-RIESGO.md,
# 164 en la memoria del proyecto y 192 en la realidad. Ninguno estaba mal el
# dia que se escribio; los tres dejaron de valer sin avisar, y el 24 nov 2026
# costo una investigacion entera averiguar que NO habia ninguna deriva.
#
# LA CAUSA, y es la leccion que la arquitectura de contraste repite: UNA
# MEDICION CADUCA CUANDO CAMBIA LO QUE LA MIDE. El 23 nov (commit 6ef9864)
# este guion dejo de estar ciego a <td>, <th>, <label> y <h1>-<h5>, que
# `globals.css` fuerza exactamente igual que a los <p>. Medido en los dos
# arboles, con los dos detectores:
#
#                        arbol 12 nov (98c07e5)   arbol 24 nov (5908047)
#     detector viejo             164                      157
#     detector de hoy            203                      192
#
# O sea: el tablero MEJORO 11 bajo el lente de hoy, y el salto de 164 a 192
# es el detector viendo mas. Un 162 o un 164 escritos antes del 23 nov no son
# comparables con este numero, y por eso el guion lo dice el solo en cada
# corrida en vez de dejarlo a que alguien se acuerde.
LINEA_BASE = 192
LINEA_BASE_FECHA = u'24 nov 2026'
LINEA_BASE_COMMIT = u'6ef9864'


def en_ambito_oscuro(txt):
    """¿Este archivo DIBUJA una tarjeta oscura, o solo habla de ellas?

       La diferencia importa. La version anterior preguntaba `'cp-card' in txt`
       y eso casa tambien dentro de un comentario: `components/AsesorCard.tsx`
       solo la nombra al explicar la regla y aun asi se revisaba entero, y
       `components/CuentaVeredicto.tsx` sumo diecisiete avisos el dia que le
       escribi un comentario citando la arquitectura de contraste. Ninguno de
       los dos vive dentro de una `.cp-card` —la ficha de cuenta no tiene ni
       una—, asi que los veintiun avisos eran ruido.

       Y el ruido no es inocuo: un detector con falsos positivos se desactiva a
       la semana, y entonces deja de cazar los de verdad. Se miran las
       menciones que quedan DESPUES de quitar los comentarios.
    """
    return 'cp-card' in RX_COMENTARIO.sub(' ', txt)


# El color blanco dejo de escribirse en linea el 16 oct 2026: ahora viene del
# token compartido `TX_TENUE` de lib/contraste.ts, y de las constantes locales
# que valen ese token. `RX_YA_BLANCO` solo reconoce LITERALES entre comillas, asi
# que con la migracion este detector paso de 177 a 221 avisos: 44 falsos
# positivos de golpe, todos sobre texto que ya era blanco. Y un detector con
# falsos positivos deja de leerse, que es peor que no tenerlo.
#
# La salida NO es una excepcion por nombre —eso convierte el detector en algo
# que se calla diciendo la palabra magica—. Se RESUELVEN las constantes de
# modulo del archivo: una constante es blanca si su valor es un literal blanco,
# si es `TX_TENUE`, o si es otra constante ya resuelta como blanca. Si manana
# alguien le pone un ambar a `TX_LOW`, el detector vuelve a gritar, que es
# justo lo que se quiere.
RX_CONST = re.compile(r'(?:^|\n)\s*(?:export\s+)?const\s+(\w+)\s*(?::\s*[\w.<>\[\]]+\s*)?=\s*([^\n]+)')

# El token del modulo de contraste es blanco por definicion, y
# `scripts/mide-texto-tenue.py` falla si deja de serlo.
TOKENS_BLANCOS = {'TX_TENUE'}


def constantes_blancas(txt):
    """Nombres del archivo que resuelven a un blanco (translucido o no)."""
    crudas = {n: v.strip() for n, v in RX_CONST.findall(txt)}
    blancas = set(TOKENS_BLANCOS)
    for _ in range(4):                      # cierre transitivo, corto a proposito
        creci = False
        for nombre, valor in crudas.items():
            if nombre in blancas:
                continue
            if RX_YA_BLANCO.search(valor) or valor.rstrip(';') in blancas:
                blancas.add(nombre)
                creci = True
        if not creci:
            break
    return blancas


def es_blanco(estilo, blancas):
    """¿El `color:` de este style ya es blanco, por literal o por constante?"""
    if RX_YA_BLANCO.search(estilo):
        return True
    # El valor del `color:`, hasta la coma o el cierre que lo termina.
    for m in re.finditer(r'(?<![A-Za-z])color\s*:\s*([^,}\n]+)', estilo, re.I):
        valor = m.group(1).strip()
        # Un ternario lleva dos ramas: las dos tienen que ser blancas.
        ramas = re.split(r'\?|:', valor) if '?' in valor else [valor]
        ramas = [r.strip().rstrip(';') for r in ramas if r.strip()]
        ramas = [r for r in ramas if not re.fullmatch(r'[\w.\[\]]+\s*[=!><]=+.*', r)]
        if ramas and all(r in blancas or RX_YA_BLANCO.search(r) for r in ramas):
            return True
    return False


def veredicto(total):
    """El conteo de hoy contra la linea base, en palabras.

       Funcion aparte y pura para que la autoprueba pueda dispararle las TRES
       ramas. Una alarma que nadie ha visto sonar es una alarma de estado
       desconocido: el dia que de verdad suba, nadie sabra si el mensaje sale.
    """
    out = ['  LINEA BASE %d (%s, commit %s) · HOY %d'
           % (LINEA_BASE, LINEA_BASE_FECHA, LINEA_BASE_COMMIT, total)]
    if total > LINEA_BASE:
        out.append('  *** SUBIO %d: hay colores NUEVOS que se van a publicar '
                   'en' % (total - LINEA_BASE))
        out.append('      blanco. Eso si es una regresion y es lo que hay que '
                   'mirar.')
    elif total < LINEA_BASE:
        out.append('  BAJO %d. Actualiza LINEA_BASE a %d en este guion en el '
                   'mismo' % (LINEA_BASE - total, total))
        out.append('  commit que lo baja, o la proxima regresion pasa '
                   'inadvertida')
        out.append('  por quedar debajo de un techo viejo.')
    else:
        out.append('  Sin cambio. No es cero a proposito: el plan son DOS '
                   'pasos y el')
        out.append('  segundo —relajar el `!important` de globals.css— esta '
                   'pendiente')
        out.append('  y va medido y aparte. Ver el mensaje del commit %s.'
                   % LINEA_BASE_COMMIT)
    return out


def pinta(ruta, linea, etiqueta, fragmento, motivo):
    print('  %s:%d' % (ruta, linea))
    print('     <%s> %s' % (etiqueta, motivo))
    print('     %s' % fragmento.replace('\n', ' ')[:120].strip())


def revisar(ruta_abs, rel):
    txt = io.open(ruta_abs, encoding='utf-8-sig').read()
    # Solo tiene sentido donde se DIBUJA una tarjeta oscura.
    if not en_ambito_oscuro(txt):
        return []
    fallos = []
    blancas = constantes_blancas(txt)

    for m in RX_SPAN.finditer(txt):
        antes, estilo = m.group(1), m.group(2)
        if not RX_COLOR.search(estilo):
            continue
        if RX_BG.search(estilo) or RX_BG.search(antes):
            continue          # declara background: se salva del selector
        if es_blanco(estilo, blancas):
            continue          # ya era blanco, forzarlo no cambia nada
        if 'cp-light' in antes:
            continue          # va por la clase de escape
        fallos.append((txt[:m.start()].count('\n') + 1, 'span', m.group(0),
                       'declara color y NO background: globals.css lo pinta de blanco.'))

    for m in RX_DURAS.finditer(txt):
        etiqueta, estilo = m.group(1), m.group(3)
        if not RX_COLOR.search(estilo):
            continue
        if es_blanco(estilo, blancas):
            continue
        fallos.append((txt[:m.start()].count('\n') + 1, etiqueta, m.group(0),
                       'se fuerza a blanco SIEMPRE; el color va en un <span> con background.'))

    return fallos


AUTOPRUEBA = """
import { TX_TENUE } from '@/lib/contraste'
const AMBAR  = '#FBBF24'
const TENUE2 = TX_TENUE
const CASI   = 'rgba(255,255,255,0.45)'
export default function P() {
  return (
    <div className="cp-card">
      <span style={{ color: AMBAR }}>caza 1: constante de color</span>
      <p style={{ color: AMBAR }}>caza 2: p con color</p>
      <span style={{ color: '#EF4444' }}>caza 3: literal de color</span>
      <span style={{ color: TX_TENUE }}>calla 1: el token</span>
      <span style={{ color: TENUE2 }}>calla 2: constante que vale el token</span>
      <span style={{ color: CASI }}>calla 3: literal blanco</span>
      <span style={{ background: 'transparent', color: AMBAR }}>calla 4: con background</span>
    </div>
  )
}
"""


def autoprueba():
    """Las dos direcciones: lo que debe cazar y lo que debe callar.

    Existe porque el resolver de constantes (16 oct 2026) es la pieza que mas
    facil se rompe: si manana alguien amplia `TOKENS_BLANCOS` o toca el regex,
    el detector puede quedarse MUDO sin que nada falle. Un detector mudo es
    peor que ninguno, y esta prueba distingue «hay un bug en el tablero» de
    «rompi el detector».

    Las lineas 9, 10 y 11 del texto de prueba tienen que salir; las 12 a 15 no.
    """
    import tempfile
    debe_cazar = {9, 10, 11}
    debe_callar = {12, 13, 14, 15}
    with tempfile.NamedTemporaryFile('w', suffix='.tsx', delete=False,
                                     encoding='utf-8') as fh:
        fh.write(AUTOPRUEBA)
        ruta = fh.name
    try:
        lineas = {l for l, _, _, _ in revisar(ruta, 'autoprueba.tsx')}
    finally:
        os.unlink(ruta)

    faltan = sorted(debe_cazar - lineas)
    sobran = sorted(lineas & debe_callar)
    print('  cazadas  %s   (esperadas %s)' % (sorted(lineas & debe_cazar), sorted(debe_cazar)))
    if faltan:
        print('  *** NO CAZO las lineas %s: el detector esta MUDO ahi.' % faltan)
    if sobran:
        print('  *** FALSO POSITIVO en las lineas %s.' % sobran)
    if faltan or sobran:
        return 1
    print('  autoprueba OK: caza las 3 que debe y calla en las 4 que debe.')

    # Las TRES ramas de la comparacion con la linea base. Sin esto, la rama de
    # regresion —la unica que de verdad importa— nunca se habria visto correr.
    ramas = [
        (LINEA_BASE + 1, 'SUBIO', 'regresion'),
        (LINEA_BASE,     'Sin cambio', 'igual'),
        (max(0, LINEA_BASE - 1), 'BAJO', 'mejora'),
    ]
    malas = []
    for total, esperado, etiqueta in ramas:
        texto = '\n'.join(veredicto(total))
        if esperado not in texto:
            malas.append(etiqueta)
    if malas:
        print('  *** la comparacion con la linea base NO avisa en: %s'
              % ', '.join(malas))
        return 1
    print('  linea base OK: avisa en las tres ramas (sube, igual, baja).')
    return 0


def main():
    if '--autoprueba' in sys.argv:
        return autoprueba()
    revisados = 0
    total = 0
    for base, dirs, ficheros in os.walk(RAIZ):
        dirs[:] = [d for d in dirs if d not in ('node_modules', '.next', '.git', 'scripts')]
        for f in sorted(ficheros):
            if not f.endswith(('.tsx', '.jsx')):
                continue
            ruta = os.path.join(base, f)
            rel = os.path.relpath(ruta, RAIZ).replace('\\', '/')
            fallos = revisar(ruta, rel)
            if en_ambito_oscuro(io.open(ruta, encoding='utf-8-sig').read()):
                revisados += 1
            for linea, etiqueta, frag, motivo in fallos:
                pinta(rel, linea, etiqueta, frag, motivo)
                print()
                total += 1

    print('  %d archivo(s) con .cp-card revisados.' % revisados)
    if total == 0:
        print('  ningun color semantico en riesgo de perderse.')
        return 0
    print('  *** %d color(es) que globals.css pintaria de blanco. ***' % total)
    print('')

    # ── El numero, contra su linea base y con su fecha ─────────────────────
    # Un conteo a secas no se puede interpretar: no dice si subio, si bajo, ni
    # si es comparable con el que alguien anoto hace dos semanas.
    for linea in veredicto(total):
        print(linea)
    print('')
    print('  Y OJO CON LAS CIFRAS VIEJAS: hasta el 22 nov 2026 este guion solo')
    print('  miraba <span>, <strong>, <em>, <small> y <p>. Un 162 o un 164')
    print('  anotados antes de esa fecha NO son comparables con este numero.')
    print('  La tabla de las cuatro mediciones esta arriba, junto a LINEA_BASE.')
    print('')
    print('  ARREGLO, Y EL ORDEN IMPORTA — leer esto antes de mover nada:')
    print('')
    print('  1. PRIMERO medir si el color se LEE sobre la tarjeta, con')
    print('     `scripts/revisa-color-invisible-cpcard.py`. Si ese guion lo')
    print('     acusa, el color es marino sobre marino y sacarlo del pisado NO')
    print('     lo rescata: lo APAGA. Hay que aclararlo antes, con')
    print('     `tonoSobreOscuro()` de lib/contraste.ts.')
    print('  2. Si el color ya contrasta, entonces si: en un <span>, anadir')
    print('     `background` al style (vale `transparent`). En las demas')
    print('     etiquetas, mover el color a un <span> que lo declare.')
    print('  3. Si lo que hay de verdad es una isla CLARA dentro de la tarjeta,')
    print('     la clase de escape `.cp-light` — pero ojo: pasa a los hijos')
    print('     `color: inherit`, asi que tampoco preserva el color en linea.')
    print('')
    print('  El consejo 2 a secas estuvo publicado aqui hasta el 23 nov 2026 y')
    print('  es el que convierte una deuda latente en un texto invisible.')

    # EL CODIGO DE SALIDA AHORA DISTINGUE, Y ANTES NO.
    # Salia 1 tanto con avisos como al reventar, asi que no servia de puerta:
    # habia que leerle el resumen para saber si algo habia empeorado. Ahora
    # 1 es REGRESION —hay mas que en la linea base— y 0 es «igual o mejor»,
    # que NO quiere decir «sin deuda»: la deuda es la que dice el conteo de
    # arriba, y el paso 2 sigue pendiente.
    if total > LINEA_BASE:
        print('')
        print('  (salida 1 = REGRESION contra la linea base)')
        return 1
    print('')
    print('  (salida 0 = igual o mejor que la linea base; NO es «sin deuda»)')
    return 0


if __name__ == '__main__':
    sys.exit(main())
