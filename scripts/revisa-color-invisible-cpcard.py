# -*- coding: utf-8 -*-
u"""La OTRA direccion del bug de contraste: el color que su propio fondo haria
   invisible, y que hoy no se nota porque `globals.css` lo esta pisando.

   `revisa-contraste-cpcard.py` caza el color que SE PIERDE: el ambar que se
   escribe y se publica blanco. Este caza el inverso, que nadie estaba mirando:

       <td style={{ color: '#10355D' }}>  dentro de una .cp-card

   Marino sobre marino mide 1.22:1 — invisible. No se ve asi porque la regla
   `.cp-card p, td, th, … { color: rgba(255,255,255,0.88) !important }` lo
   repinta de blanco. El texto se lee POR ACCIDENTE, no por como esta escrito.

   POR QUE IMPORTA, si hoy se ve bien:

     · Un elemento que se ve bien porque algo lo esta sobrescribiendo es una
       dependencia implicita — la misma «Variante B» que lleva seis rondas
       volviendo. [[atlas-dashboard-contrast-architecture]]
     · Un <span> que declare `background` NO se pisa, asi que ahi el color
       oscuro es invisible YA. Pasar un color de un <td> a un <span> para
       «salvarlo» —que es justo lo que recomienda el otro detector— lo APAGA.
     · Y mide cuanto costaria quitar el `!important` de esa regla: cada aviso
       de aqui es un texto que desapareceria ese dia.

   ── EL FONDO SE COMPONE, NO SE DEDUCE DE UNA CLASE ─────────────────────────

   La primera version decidia el ambito por ARCHIVO: «menciona cp-card, luego
   todo aqui es oscuro». Acuso 95 lineas y la mayoria eran correctas. En este
   repositorio `body` es CLARO (#F5F8FB) y la tarjeta oscura es la isla, asi
   que el encabezado de `/reuniones`, sus modales blancos y los paneles
   `background:'#fff'` de la ficha de cuenta llevan texto oscuro a proposito.

   Por eso aqui el fondo se compone hacia arriba, como lo hace la auditoria
   del DOM que cerro las rondas 5 y 8: el fondo de un texto es el `background`
   mas interno que se pueda resolver, empezando por el de `body`. Un fondo que
   no se puede resolver —un degradado, una plantilla `${k.color}10`, una
   variable que no esta en la tabla— NO se adivina: ese texto queda SIN
   DECIDIR. [[feedback-contexto-ia-sin-huecos]]

   USO
       python scripts/revisa-color-invisible-cpcard.py
       python scripts/revisa-color-invisible-cpcard.py --dudas
       python scripts/revisa-color-invisible-cpcard.py --autoprueba

   ESCOTILLA: `// @fondo-claro: <motivo de 25+ caracteres>` en la linea anterior
   o en la misma, para el color cuya superficie real no se puede leer del
   archivo. Exige NOMBRAR la superficie para que no sirva de interruptor.
"""
import io
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

RX_CONST = re.compile(
    r'(?:^|\n)\s*(?:export\s+)?const\s+(\w+)\s*(?::\s*[\w.<>\[\]]+\s*)?=\s*([^\n]+)')
RX_HEX = re.compile(r'^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$')
RX_RGBA = re.compile(r'^rgba?\(([^)]*)\)$')
RX_ESCOTILLA = re.compile(r'@fondo-claro:\s*(.{25,})')

# Las etiquetas que `globals.css` repinta dentro de `.cp-card`, copiadas de la
# regla de las lineas 104-114. En estas, un color oscuro HOY se salva: lo tapa
# el `!important`. Es la deuda LATENTE.
PISADAS = frozenset(
    ('p', 'label', 'strong', 'em', 'small', 'td', 'th',
     'h1', 'h2', 'h3', 'h4', 'h5'))

# Y las que NO repinta nadie. Aqui lo escrito es lo que se ve, asi que un
# color que no contrasta esta apagado HOY, no el dia que se quite la regla.
# Dos excepciones que la propia regla declara y que hay que respetar o el
# detector miente: el <span> solo se libra si DECLARA background, y el <a> solo
# si lleva className (`.cp-card a:not([class])` lo pasa a #60A5FA).
# `div` queda FUERA a proposito: su texto casi siempre vive en <p> o <span>
# hijos, que si se pisan, y meterlo llenaria el aviso de casos que no son.
NO_PISADAS = frozenset(
    ('li', 'button', 'code', 'b', 'i', 'dt', 'dd', 'caption', 'figcaption',
     'summary', 'blockquote', 'abbr'))

ETIQUETAS_TEXTO = PISADAS | NO_PISADAS | frozenset(('span', 'a'))

# El valor puede traer comas DENTRO de parentesis. Con `[^,}\n]+` el detector
# cortaba `rgba(255,255,255,0.4)` en `'rgba(255`, no resolvia el color y
# callaba: toda la familia rgba() estuvo invisible para el guion, que es justo
# la que mas se usa para el texto tenue sobre la tarjeta. Un verificador que
# concluye «bien» por no haber entendido el dato es peor que no tenerlo.
# [[feedback-verificar-antes-asegurar]]
_VALOR = r'((?:[^,}\n()]|\([^()]*\))+)'
RX_COLOR_VAL = re.compile(r'(?<![A-Za-z])color\s*:\s*' + _VALOR, re.I)
RX_BG_VAL = re.compile(r'(?<![A-Za-z])background(?:Color)?\s*:\s*' + _VALOR, re.I)

# Modulos de paleta de los que se resuelven constantes importadas. Un color que
# vive en `lib/` y se usa en diez pantallas es justo el que no se puede leer de
# un solo archivo. [[atlas-dashboard-contrast-architecture]] 13a ronda.
MODULOS_PALETA = ('lib/paleta-cs.ts', 'lib/contraste.ts', 'lib/chart-theme.ts')

MINIMO = 4.5          # umbral de TEXTO. Un objeto grafico se conforma con 3.
DESCONOCIDO = '?'     # fondo que no se puede resolver: no se adivina
HEREDA = None         # la etiqueta no cambia el fondo

# Este detector solo opina sobre SUPERFICIE OSCURA. En superficie clara el
# mismo calculo caza otra clase de bug —letra clara sobre fondo claro— que ya
# tiene su propio guion y su propia linea base: `revisa-letra-clara-en-claro.py`.
# Mezclarlas en un solo numero haria que mover uno tapara el otro.
LUM_OSCURA = 0.18


# ── color ───────────────────────────────────────────────────────────────────

def a_rgba(valor):
    u"""'#082742', '#10355D15' o 'rgba(255,255,255,0.4)' -> (r, g, b, a).

       El hex de 8 digitos importa: `#10355D15` es la pastilla translucida con
       la que este repositorio pinta casi todos sus fondos de relleno, y
       leerla como opaca da un fondo marino donde en realidad hay un velo.
    """
    v = valor.strip().strip('\'"`').strip()
    if RX_HEX.match(v):
        h = v[1:]
        if len(h) in (3, 4):
            h = ''.join(c * 2 for c in h)
        a = int(h[6:8], 16) / 255.0 if len(h) == 8 else 1.0
        return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)
    m = RX_RGBA.match(v)
    if m:
        partes = [p.strip() for p in m.group(1).split(',')]
        if len(partes) < 3:
            return None
        try:
            r, g, b = (int(float(p)) for p in partes[:3])
            a = float(partes[3]) if len(partes) > 3 else 1.0
        except ValueError:
            return None
        return (r, g, b, a)
    return None


def compone(frente, fondo):
    u"""Un color translucido NO es su hex: es lo que resulta sobre su fondo."""
    r, g, b, a = frente
    fr, fg, fb, _ = fondo
    return (r * a + fr * (1 - a), g * a + fg * (1 - a), b * a + fb * (1 - a), 1.0)


def luminancia(c):
    def f(v):
        v = v / 255.0
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2])


def contraste(a, b):
    la, lb = luminancia(a), luminancia(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)


# ── los fondos se LEEN, no se teclean ───────────────────────────────────────

def revisa_el_espejo(hex_css):
    u"""`FONDO_TARJETA` de `lib/contraste.ts` tiene que decir lo que dice el CSS.

       Es la unica forma de que un valor tecleado siga siendo un espejo: lo
       compara alguien. Sin esto, el dia que `.cp-card` vuelva a cambiar de tono
       —ya paso el 13 oct 2026— `tonoSobreOscuro` seguiria midiendo contra el
       fondo viejo y devolveria tonos que no contrastan, sin que nada falle.
    """
    ruta = os.path.join(RAIZ, 'lib', 'contraste.ts')
    txt = io.open(ruta, encoding='utf-8-sig').read()
    m = re.search(r'FONDO_TARJETA\s*=\s*[\'"](#[0-9a-fA-F]{3,8})[\'"]', txt)
    if not m:
        return [u'lib/contraste.ts ya no exporta `FONDO_TARJETA`: '
                u'`tonoSobreOscuro` esta midiendo contra algo que no se puede '
                u'comprobar.']
    if m.group(1).lower() != hex_css.lower():
        return [u'ESPEJO ROTO · `.cp-card` en globals.css es %s y '
                u'`FONDO_TARJETA` en lib/contraste.ts dice %s. Todos los tonos '
                u'calculados con `tonoSobreOscuro` estan medidos contra un '
                u'fondo que ya no existe.' % (hex_css, m.group(1))]
    return []


def fondos_por_clase(ruta='app/globals.css'):
    u"""Dos tablas de clase -> (orden en el CSS, rgba), leidas del CSS.

       La primera es para los selectores de UNA sola clase. Sin ella el
       detector acusaba el `#EF4444` de un `<button className="cp-btn
       cp-btn-ghost">` como texto sobre la tarjeta oscura, cuando `.cp-btn-ghost`
       trae `background: #FFFFFF` y el boton es BLANCO. El fondo de un elemento
       no esta solo en su `style`: tambien lo ponen sus clases, y leer solo la
       mitad del fondo es medir contra un fondo que no existe.

       La segunda es para `.cp-card .X`, que es el caso que se escapo: el tema
       de Tailwind dice `surface: '#FFFFFF'`, pero `globals.css` repinta
       `.cp-card .bg-surface` con `rgba(255,255,255,0.07)`. O sea que una caja
       `bg-surface` DENTRO de la tarjeta no es blanca: es la tarjeta un pelo mas
       clara. Por no leer esa regla, el detector no vio el `#ef4444` de «Fallas»
       de `CuentaTicketsPanel` —3.32:1, medido el 23 nov 2026 en la pagina
       servida—: el fondo le quedaba sin resolver y el color caia en el saco de
       «sin decidir». Dos tablas y no una porque el fondo depende de donde
       cuelgue el elemento. [[feedback-verificar-antes-asegurar]]

       Se queda a proposito sin `:hover` ni los compuestos tipo
       `.cp-card .cp-light.cp-light .bg-surface`: no se pueden resolver sin un
       motor de cascada, y fingir que si llevaria al mismo error por el otro lado.
    """
    css = io.open(os.path.join(RAIZ, ruta.replace('/', os.sep)),
                  encoding='utf-8-sig', errors='replace').read()
    css = re.sub(r'/\*[\s\S]*?\*/', ' ', css)     # un comentario con llaves
    simples, en_card = {}, {}                     # descuadra el troceado
    for orden, m in enumerate(re.finditer(r'([^{}]+)\{([^}]*)\}', css)):
        sel, cuerpo = m.group(1), m.group(2)
        bg = re.search(r'background(?:-color)?\s*:\s*'
                       r'(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\))', cuerpo)
        if not bg:
            continue
        col = a_rgba(bg.group(1))
        if col is None:
            continue
        for parte in sel.split(','):
            # el grupo del selector arrastra todo lo que hay desde la llave
            # anterior; el selector de verdad es su ULTIMA linea
            parte = parte.strip().split('\n')[-1].strip()
            if re.fullmatch(r'\.[\w-]+', parte):
                simples[parte[1:]] = (orden, col)
            else:
                d = re.fullmatch(r'\.cp-card\s+\.([\w-]+)', parte)
                if d:
                    en_card[d.group(1)] = (orden, col)
    return simples, en_card


def regla_pisado(ruta='app/globals.css'):
    u"""Los DOS colores con los que `.cp-card` repinta a sus hijos.

       Se leen, no se teclean, por lo mismo que `FONDO_TARJETA`: son la pantalla
       de verdad. Devuelve (blanco_forzado, azul_de_liga).
    """
    css = io.open(os.path.join(RAIZ, ruta.replace('/', os.sep)),
                  encoding='utf-8-sig', errors='replace').read()
    css = re.sub(r'/\*[\s\S]*?\*/', ' ', css)
    blanco = azul = None
    for m in re.finditer(r'([^{}]+)\{([^}]*)\}', css):
        sel = m.group(1)
        ult = sel.strip().split('\n')[-1].strip()
        col = re.search(r'color\s*:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\))',
                        m.group(2))
        if not col:
            continue
        if blanco is None and '.cp-card p' in sel and 'cp-light' not in sel:
            blanco = a_rgba(col.group(1))
        if azul is None and ult.startswith('.cp-card a:not([class])'):
            azul = a_rgba(col.group(1))
    if blanco is None or azul is None:
        raise SystemExit(u'  *** `globals.css` ya no repinta `.cp-card p` o '
                         u'`.cp-card a:not([class])` como este guion supone. '
                         u'Releer la arquitectura antes de medir.')
    return blanco, azul


def clases_de(attrs):
    u"""Los nombres de clase literales de `className`, incluso dentro de una
       plantilla: lo interpolado no se puede leer, lo escrito si."""
    m = re.search(r'className\s*=\s*', attrs)
    if not m:
        return []
    resto = attrs[m.end():]
    if resto[:1] in ('"', "'"):
        fin = resto.find(resto[0], 1)
        crudo = resto[1:fin] if fin > 0 else ''
    else:
        prof, p = 0, 0
        while p < len(resto):
            if resto[p] == '{':
                prof += 1
            elif resto[p] == '}':
                prof -= 1
                if prof == 0:
                    break
            p += 1
        crudo = resto[:p]
    return re.findall(r'[A-Za-z][\w-]*', crudo)


def fondo_css(selector, ruta='app/globals.css'):
    u"""El `background` de una regla, leido de `app/globals.css`.

       Tecleado aqui seria un espejo, y un espejo se desincroniza en silencio:
       el 13 oct 2026 la tarjeta paso de #0D1829 a #082742 —mas CLARA— y ocho
       colores dejaron de servir sin que nadie tocara una linea de color.
    """
    css = io.open(os.path.join(RAIZ, ruta.replace('/', os.sep)),
                  encoding='utf-8-sig', errors='replace').read()
    m = re.search(re.escape(selector) + r'\s*\{([^}]*)\}', css)
    if not m:
        raise SystemExit(u'  *** no encuentro la regla `%s` en %s' % (selector, ruta))
    c = re.search(r'background\s*:\s*(#[0-9a-fA-F]{3,8})', m.group(1))
    if not c:
        raise SystemExit(u'  *** `%s` ya no declara un background hex; hay que '
                         u'releer la arquitectura antes de medir.' % selector)
    return a_rgba(c.group(1)), c.group(1)


# ── resolucion de constantes ────────────────────────────────────────────────

def paleta_compartida():
    u"""Constantes de color exportadas por los modulos de paleta."""
    fuera = {}
    for rel in MODULOS_PALETA:
        ruta = os.path.join(RAIZ, rel.replace('/', os.sep))
        if not os.path.exists(ruta):
            continue
        txt = sin_comentarios(io.open(ruta, encoding='utf-8-sig').read())
        for nombre, valor in declaradores(txt).items():
            col = a_rgba(valor)
            if col:
                fuera[nombre] = col
    return fuera


def declaradores(txt):
    u"""Nombre -> valor crudo, incluyendo los `const A = x, B = y` de una linea.

       `RX_CONST` se queda con el PRIMER declarador y mete el resto dentro del
       valor, asi que `const RED = '#ef4444', BLU = '#60A5FA'` dejaba cinco de
       seis colores sin resolver — y asi se escondieron los seis de
       `CuentaLlamadasPanel`, que luego aparecieron midiendo 3.3:1 en la pagina
       servida. El guion no fallaba: callaba. [[feedback-verificar-antes-asegurar]]
    """
    fuera = {}
    for nombre, valor in RX_CONST.findall(txt):
        valor = valor.strip().rstrip(';')
        trozos, prof, act = [], 0, ''
        for ch in valor:
            if ch in '([{':
                prof += 1
            elif ch in ')]}':
                prof -= 1
            if ch == ',' and prof <= 0:
                trozos.append(act)
                act = ''
                continue
            act += ch
        trozos.append(act)
        fuera[nombre] = trozos[0].strip()
        for extra in trozos[1:]:
            m = re.match(r'\s*(\w+)\s*(?::\s*[\w.<>\[\]|\' ]+\s*)?=\s*(.+)$',
                         extra)
            if m:
                fuera[m.group(1)] = m.group(2).strip()
    return fuera


RX_REGISTRO = re.compile(
    r'(?:^|\n)\s*(?:export\s+)?const\s+(\w+)\s*:\s*Record<[^>]*>\s*=\s*\{')


def registros(txt):
    u"""Nombre -> [colores] para los `const X: Record<string,string> = {…}`.

       Un `PRIOR_COLOR[p]` no se puede resolver a UN color, pero si al conjunto
       de los que puede tomar, y con eso ya se puede decidir: si alguno de ellos
       no contrasta, la pantalla lo pintara alguna vez. Sin esto la pastilla de
       prioridad de tickets quedaba «ciega» y medía 3.78:1 con el rojo.
    """
    fuera = {}
    for m in RX_REGISTRO.finditer(txt):
        p, prof = m.end(), 1
        while p < len(txt) and prof > 0:
            if txt[p] == '{':
                prof += 1
            elif txt[p] == '}':
                prof -= 1
            p += 1
        cuerpo = txt[m.end():p - 1]
        cols = []
        for lit in re.findall(r'[\'"](#[0-9a-fA-F]{3,8})[\'"]', cuerpo):
            col = a_rgba(lit)
            if col:
                cols.append(col)
        if cols:
            fuera[m.group(1)] = cols
    return fuera


def colores_de(rama, tabla, regs):
    u"""Todos los colores que una expresion puede tomar, o [] si no se sabe."""
    rama = rama.strip()
    col = a_rgba(rama)
    if col:
        return [col]
    if rama in tabla:
        return [tabla[rama]]
    # `MAPA[x]`, `MAPA[x] ?? '#hex'`, `MAPA[x] || FALLBACK`
    m = re.match(r'^(\w+)\s*\[[^\]]*\]\s*(?:(?:\?\?|\|\|)\s*(\S+?))?\s*$', rama)
    if m and m.group(1) in regs:
        cols = list(regs[m.group(1)])
        if m.group(2):
            extra = a_rgba(m.group(2)) or tabla.get(m.group(2).strip())
            if extra:
                cols.append(extra)
        return cols
    return []


def constantes(txt, compartidas):
    u"""Nombre -> color, resolviendo literales, alias y la paleta importada."""
    tabla = dict(compartidas)
    crudas = declaradores(txt)
    for _ in range(4):                       # cierre transitivo, corto a proposito
        creci = False
        for nombre, valor in crudas.items():
            if nombre in tabla:
                continue
            col = a_rgba(valor)
            if col is None and valor in tabla:
                col = tabla[valor]
            if col is not None:
                tabla[nombre] = col
                creci = True
        if not creci:
            break
    return tabla


def ramas(valor):
    u"""Las dos ramas de un ternario cuentan las dos: la invisible puede ser
       cualquiera de ellas, y mirar solo una deja el detector medio ciego."""
    valor = valor.strip().rstrip(';')
    if '?' not in valor:
        return [valor]
    salida = []
    for p in re.split(r'\?|:', valor):
        p = p.strip()
        if not p:
            continue
        # la condicion no es un color
        if re.fullmatch(r'[\w.\[\]\(\)]+\s*[=!><]=+.*', p) or p.endswith('('):
            continue
        salida.append(p)
    return salida


# ── lectura del JSX ─────────────────────────────────────────────────────────

def sin_comentarios(txt):
    u"""Blanquea comentarios SIN tocar las comillas, conservando posiciones.

       Con una expresion regular, el `//` de `'https://…'` se comia media
       cadena, y el detector media un color que ya no estaba completo.
    """
    fuera = list(txt)
    i, n, comilla = 0, len(txt), None
    while i < n:
        c = txt[i]
        if comilla:
            if c == '\\':
                i += 2
                continue
            if c == comilla:
                comilla = None
            i += 1
            continue
        if c in '\'"`':
            comilla = c
            i += 1
            continue
        if c == '/' and i + 1 < n and txt[i + 1] == '/':
            j = txt.find('\n', i)
            j = n if j < 0 else j
            for k in range(i, j):
                fuera[k] = ' '
            i = j
            continue
        if c == '/' and i + 1 < n and txt[i + 1] == '*':
            j = txt.find('*/', i + 2)
            j = n if j < 0 else j + 2
            for k in range(i, j):
                if fuera[k] != '\n':
                    fuera[k] = ' '
            i = j
            continue
        i += 1
    return ''.join(fuera)


VACIAS = frozenset(
    ('br', 'hr', 'img', 'input', 'meta', 'link', 'source', 'path', 'circle',
     'rect', 'line', 'polyline', 'polygon', 'ellipse', 'use', 'stop', 'col'))


def etiquetas(txt):
    u"""Recorre el JSX etiqueta por etiqueta respetando comillas y llaves.

       Hace falta un recorrido de verdad y no una expresion regular `[^>]*`:
       un `onClick={() => f()}` lleva un `>` DENTRO de los atributos, y con
       `[^>]*` la etiqueta se cortaba ahi. Se perdia el `style` que venia
       despues —o sea, el fondo— y la pila de anidamiento quedaba descuadrada
       en silencio a partir de ese punto.

       Devuelve ('abre'|'cierra', ini, fin, nombre, atributos).
    """
    i, n = 0, len(txt)
    while True:
        i = txt.find('<', i)
        if i < 0 or i + 1 >= n:
            return
        j = i + 1
        if txt[j] == '/':
            k = txt.find('>', j)
            if k < 0:
                return
            yield ('cierra', i, k + 1, txt[j + 1:k].strip(), '')
            i = k + 1
            continue
        if not (txt[j].isalpha() or txt[j] == '_'):
            i = j
            continue
        k = j
        while k < n and (txt[k].isalnum() or txt[k] in '._-'):
            k += 1
        nombre = txt[j:k]
        p, prof, comilla = k, 0, None
        while p < n:
            c = txt[p]
            if comilla:
                if c == '\\':
                    p += 2
                    continue
                if c == comilla:
                    comilla = None
                p += 1
                continue
            if c in '\'"`':
                comilla = c
            elif c == '{':
                prof += 1
            elif c == '}':
                prof -= 1
            elif c == '>' and prof <= 0:
                break
            p += 1
        if p >= n:
            return
        attrs = txt[k:p]
        yield ('abre', i, p + 1, nombre, attrs)
        if attrs.rstrip().endswith('/') or nombre.lower() in VACIAS:
            yield ('cierra', p, p + 1, nombre, '')
        i = p + 1


def estilo_de(attrs):
    u"""El contenido de `style={{ … }}`, con las llaves equilibradas."""
    m = re.search(r'style\s*=\s*\{\{', attrs)
    if not m:
        return ''
    p, prof = m.end(), 2
    while p < len(attrs) and prof > 0:
        if attrs[p] == '{':
            prof += 1
        elif attrs[p] == '}':
            prof -= 1
        p += 1
    return attrs[m.end():p - 2]


def fondo_declarado(attrs, estilo, tabla, fondo_actual, por_clase,
                    por_clase_card=None, en_card=False):
    u"""Que fondo impone esta etiqueta: un rgba, DESCONOCIDO, o HEREDA.

       Se mira el `style` en linea Y las clases, porque las dos cosas pintan.
       Un `background` translucido se COMPONE sobre el fondo que ya habia. Lo
       que no se pueda resolver se declara desconocido en vez de suponerlo: un
       degradado o un `${k.color}10` no tienen color legible desde aqui.
    """
    clases = clases_de(attrs)
    # `.cp-card` declara su fondo con `!important`, asi que gana al `style` en
    # linea. Es la unica clase del juego que lo hace, y no mirarlo dejaria que
    # un `background` inline en la propia tarjeta moviera el fondo de medicion.
    if 'cp-card' in clases and 'cp-card' in por_clase:
        return por_clase['cp-card'][1]
    m = RX_BG_VAL.search(estilo)
    if not m:
        # el `style` no manda nada: deciden las clases, por orden de cascada.
        # Dentro de una `.cp-card`, `.cp-card .X` gana a `.X` por especificidad
        # —es la regla que repinta `bg-surface` de blanco a un velo claro—.
        gana = None
        for cl in clases:
            if en_card and por_clase_card and cl in por_clase_card:
                velo = por_clase_card[cl][1]
                if velo[3] < 1:
                    if fondo_actual is DESCONOCIDO:
                        return DESCONOCIDO
                    return compone(velo, fondo_actual)
                return velo
            if cl in por_clase and (gana is None or por_clase[cl][0] > gana[0]):
                gana = por_clase[cl]
        return gana[1] if gana else HEREDA
    crudo = m.group(1).strip()
    if re.match(r'^[\'"`]?(transparent|none|inherit|unset)[\'"`]?$', crudo, re.I):
        return HEREDA
    candidatos = []
    for rama in ramas(crudo):
        col = a_rgba(rama)
        if col is None:
            col = tabla.get(rama.strip())
        if col is None:
            return DESCONOCIDO          # plantilla, variable o degradado
        candidatos.append(col)
    if not candidatos:
        return DESCONOCIDO
    if fondo_actual is DESCONOCIDO and any(c[3] < 1 for c in candidatos):
        return DESCONOCIDO              # velo sobre un fondo que no conozco
    base = fondo_actual if fondo_actual is not DESCONOCIDO else None
    compuestos = [compone(c, base) if c[3] < 1 else (c[0], c[1], c[2], 1.0)
                  for c in candidatos]
    # Dos ramas que no coinciden en claridad dejan el fondo indeterminado: el
    # mismo color de texto seria correcto en una y invisible en la otra.
    if len(compuestos) > 1:
        lums = [luminancia(c) for c in compuestos]
        if max(lums) > 0.18 > min(lums):
            return DESCONOCIDO
    return compuestos[0]


def es_claro_por_clase(attrs):
    u"""`.cp-light` pasa a sus hijos `color: inherit !important`, asi que el
       color en linea se pierde igual — pero se pierde hacia la tinta del
       contenedor, que SI contrasta. No es un hallazgo de este detector."""
    return bool(re.search(r'className\s*=\s*[\'"{][^\'"}]*\bcp-light\b', attrs))


# ── revision ────────────────────────────────────────────────────────────────

def revisar(ruta_abs, fondo_card, fondo_pagina, compartidas, por_clase,
            por_clase_card=None, pisado=None):
    u"""(fallos, sin_decidir, opacos) para un archivo."""
    bruto = io.open(ruta_abs, encoding='utf-8-sig').read()
    limpio = sin_comentarios(bruto)
    tabla = constantes(limpio, compartidas)
    regs = registros(limpio)
    lineas = bruto.split('\n')
    fallos, sin_decidir, opacos = [], [], []
    blanco_forzado, azul_liga = pisado if pisado else (None, None)

    # pila de fondos: cada marco guarda el fondo vigente dentro de esa etiqueta
    pila = []           # [(nombre, fondo, claro_por_clase, es_card)]
    fondo = fondo_pagina
    en_claro = 0
    en_card = 0

    for clase, ini, fin, nombre, attrs in etiquetas(limpio):
        if clase == 'cierra':
            # Un `</>` de fragmento llega sin nombre, y una etiqueta que cierra
            # algo que no esta en la pila es un desajuste de lectura. En los dos
            # casos el bucle de abajo VACIABA la pila y el detector se quedaba
            # midiendo contra el fondo de la pagina el resto del archivo: por
            # eso solo veia 1 de los 4 `rgba(255,255,255,0.4)` de
            # HealthScoreDiagnostico. Fallaba hacia el silencio, que es la
            # forma mas cara de fallar. [[feedback-verificar-antes-asegurar]]
            if not nombre or not any(n == nombre for n, _f, _c, _k in pila):
                continue
            while pila:
                tope, fondo_previo, claro, era_card = pila.pop()
                fondo = fondo_previo
                if claro:
                    en_claro -= 1
                if era_card:
                    en_card -= 1
                if tope == nombre:
                    break
            continue

        estilo = estilo_de(attrs)
        claro = es_claro_por_clase(attrs)
        es_card = 'cp-card' in clases_de(attrs)
        nuevo = fondo_declarado(attrs, estilo, tabla, fondo, por_clase,
                                por_clase_card, bool(en_card) or es_card)
        pila.append((nombre, fondo, claro, es_card))
        if claro:
            en_claro += 1
        if es_card:
            en_card += 1
        if nuevo is not HEREDA:
            fondo = nuevo

        if nombre not in ETIQUETAS_TEXTO or en_claro:
            continue
        nlinea = limpio[:ini].count('\n') + 1
        ventana = '\n'.join(lineas[max(0, nlinea - 3):nlinea + 2])
        if RX_ESCOTILLA.search(ventana):
            continue
        declara_bg = nuevo is not HEREDA
        frag = bruto[ini:fin].replace('\n', ' ')[:110].strip()
        # Lo pisa `globals.css`, o no. De eso depende si el aviso es de hoy o
        # de el dia que se quite el `!important`.
        pisada = (nombre in PISADAS
                  or (nombre == 'span' and not declara_bg)
                  or (nombre == 'a' and 'className' not in attrs))

        # ── LA OTRA MITAD: el color que el PISADO pone, no el que se escribio
        # Las reglas de `.cp-card` aplican por ANCESTRIA, no por oscuridad: un
        # hijo con `background` CLARO recibe igual el blanco al 88%. Es el caso
        # de la pastilla de numero Callpicker —blanco al 88% sobre `#0284C7`,
        # 3.51:1 medido el 23 nov 2026—, que este guion se saltaba porque la
        # superficie era «clara» y daba por hecho que ahi la letra la decide
        # otro. No la decide nadie: la decide el `!important`.
        if en_card and pisada and fondo is not DESCONOCIDO and blanco_forzado:
            puesto = blanco_forzado if nombre != 'a' else azul_liga
            c = contraste(compone(puesto, fondo), fondo)
            if c < MINIMO:
                fallos.append((nlinea, nombre,
                               u'(lo pone globals.css)', round(c, 2), True, frag))

        if not estilo:
            continue
        if fondo is not DESCONOCIDO and luminancia(fondo) >= LUM_OSCURA:
            continue                      # superficie clara: la vigila el otro

        # Una expresion puede dar VARIOS colores —un `Record` tiene cuatro— y
        # basta que uno falle para que la pantalla lo pinte alguna vez. Se
        # aplanan a pares para no anidar un tercer bucle.
        pares = []
        for mv in RX_COLOR_VAL.finditer(estilo):
            for rama in ramas(mv.group(1)):
                cols = colores_de(rama, tabla, regs)
                if cols:
                    pares.extend((rama, c) for c in cols)
                else:
                    pares.append((rama, None))

        for rama, col in pares:
            if col is None:
                # El color viene de una expresion que no se puede resolver
                # leyendo el archivo: `cfg.color`, una llamada, un campo. NO se
                # adivina — pero se CUENTA, porque si no, un cero de hallazgos
                # parece cobertura total cuando es ceguera. Fue real:
                # `RadarCuenta` llevaba dos `<strong>` a 4.34:1 pintados con
                # `cfg.color`, y el guion no los veia ni los declaraba.
                # [[feedback-contexto-ia-sin-huecos]]
                opacos.append((nlinea, nombre, rama.strip()[:40]))
                continue
            if fondo is DESCONOCIDO:
                # No se puede decidir leyendo el archivo: el fondo real lo pone
                # un degradado, una plantilla o un componente envoltorio. Pero
                # la duda solo IMPORTA si el color fallaria sobre superficie
                # oscura: un `#fff` o un `TX_TENUE` se leen bien sobre la
                # tarjeta pase lo que pase, y arrastrarlos a la lista convierte
                # el aviso en ruido —200 lineas que nadie revisa— y eso es como
                # apagarlo. La referencia oscura es la `.cp-card`; una pastilla
                # mas negra que ella seguiria sin decidirse, y queda dicho aqui
                # para no fingir cobertura.
                if contraste(compone(col, fondo_card), fondo_card) < MINIMO:
                    sin_decidir.append((nlinea, nombre, rama, None, frag))
                continue
            c = contraste(compone(col, fondo), fondo)
            if c >= MINIMO:
                continue
            fallos.append((nlinea, nombre, rama, round(c, 2), not pisada, frag))
    return fallos, sin_decidir, opacos


AUTOPRUEBA = u"""
import { MARINO } from '@/lib/paleta-cs'
const AMBAR = '#FBBF24'
const OSCURO = '#10355D'
const ALIAS = OSCURO
const PRIOR: Record<string, string> = { alta: '#FBBF24', baja: '#10355D' }
export default function P() {
  return (
    <>
    <div className="cp-card">
      <td style={{ color: OSCURO }}>caza 1: constante oscura</td>
      <p style={{ color: '#082742' }}>caza 2: literal del propio fondo</p>
      <span style={{ background: '#10355D15', color: ALIAS }}>caza 3 (hoy): velo marino, ya apagado</span>
      <td style={{ color: cond ? AMBAR : MARINO }}>caza 4: rama oscura del ternario</td>
      <div onClick={() => abre(a > b)} style={{ background: '#0B1220' }}>
        <p style={{ color: OSCURO }}>caza 5: pastilla oscura declarada tras un `=>`</p>
      </div>
      <div style={{ background: '#DFE8EF' }}>
        <li style={{ color: AMBAR }}>calla 8: ambar sobre claro — lo vigila el otro guion</li>
        <p style={{ color: AMBAR }}>caza 13 (hoy): a este &lt;p&gt; la tarjeta le pone blanco sobre claro</p>
      </div>
      <p style={{ color: 'rgba(255,255,255,0.4)' }}>caza 6: el blanco al 40% mide 3.5:1</p>
      <p style={{ color: AMBAR }}>calla 1: ambar, 10.4:1</p>
      <span style={{ color: 'rgba(255,255,255,0.55)' }}>calla 2: el tenue, 5.5:1</span>
      <p style={{ color: '#A8BACB' }}>calla 3: plata</p>
      {/* @fondo-claro: esta celda vive dentro del modal blanco de edicion */}
      <td style={{ color: OSCURO }}>calla 4: con escotilla</td>
      <div className="cp-light" style={{ color: '#0F172A' }}>
        <label style={{ color: '#202E3B' }}>calla 5: dentro de un tramo claro</label>
      </div>
      <div style={{ background: '#fff', borderRadius: 12 }}>
        <li style={{ color: '#082742' }}>calla 6: panel blanco en linea — al &lt;li&gt; no lo pisa nadie</li>
        <p style={{ color: '#082742' }}>caza 14 (hoy): el mismo panel blanco, pero el &lt;p&gt; sale BLANCO</p>
      </div>
      <div style={{ background: `${k.color}10` }}>
        <p style={{ color: '#082742' }}>duda 1: el velo no se puede resolver</p>
      </div>
      <ul>
        <li style={{ color: 'rgba(255,255,255,0.4)' }}>caza 7 (hoy): a un &lt;li&gt; no lo pisa nadie</li>
      </ul>
      <a className="x" style={{ color: '#10355D' }}>caza 8 (hoy): el &lt;a&gt; con clase tampoco</a>
      <a style={{ color: '#10355D' }}>caza 9: sin clase, hoy lo salva el #60A5FA de la regla</a>
      <button className="cp-btn cp-btn-ghost" style={{ color: '#EF4444' }}>calla 10: el boton es BLANCO por su clase</button>
      <div style={{ background: '#0284C7' }}>
        <p style={{ color: '#FFFFFF' }}>caza 10 (hoy): el blanco PISADO al 88% mide 3.5:1 sobre este azul</p>
      </div>
      <div style={{ background: '#0369A1' }}>
        <p style={{ color: '#FFFFFF' }}>calla 11: el mismo blanco pisado sobre el azul mudado si pasa</p>
      </div>
      <div style={{ background: 'rgba(74,222,128,0.16)' }}>
        <a style={{ color: '#4ADE80' }}>caza 11 (hoy): el #60A5FA que la regla le pone mide 4.2:1 aqui</a>
      </div>
      <div className="bg-surface">
        <p style={{ color: PRIOR[p] }}>caza 12: una rama del Record no contrasta</p>
      </div>
    </div>
    <label style={{ color: '#202E3B' }}>calla 7: fuera de la tarjeta, sobre el body claro</label>
    </>
  )
}
"""


def autoprueba(fondo_card, fondo_pagina):
    u"""Las tres direcciones. Sin los «calla», un resolver roto dejaria el
       detector MUDO y daria verde con la pantalla rota; sin el «sin decidir»,
       volveria a suponer un fondo que no puede leer."""
    import tempfile
    # Las expectativas se LEEN del propio guion de prueba, por sus rotulos
    # `caza` / `calla` / `duda`. Tecleadas como numeros de linea ya me fallaron
    # dos veces al insertar un caso en medio, y una expectativa mal contada
    # hace que la autoprueba apruebe lo que no debe. [[feedback-verificar-antes-asegurar]]
    debe_cazar, debe_callar, debe_dudar, debe_hoy = set(), set(), set(), set()
    for i, linea in enumerate(AUTOPRUEBA.split('\n'), start=1):
        if re.search(r'>\s*caza \d', linea):
            debe_cazar.add(i)
            if '(hoy)' in linea:
                debe_hoy.add(i)
        elif re.search(r'>\s*calla \d', linea):
            debe_callar.add(i)
        elif re.search(r'>\s*duda \d', linea):
            debe_dudar.add(i)
    if not (debe_cazar and debe_callar and debe_dudar):
        print(u'  *** el guion de prueba perdio sus rotulos: no prueba nada.')
        return 1
    with tempfile.NamedTemporaryFile('w', suffix='.tsx', delete=False,
                                     encoding='utf-8') as fh:
        fh.write(AUTOPRUEBA)
        ruta = fh.name
    try:
        simples, en_card = fondos_por_clase()
        hallados, dudosos, _opacos = revisar(ruta, fondo_card, fondo_pagina,
                                             paleta_compartida(), simples,
                                             en_card, regla_pisado())
    finally:
        os.unlink(ruta)
    lineas = {f[0] for f in hallados}
    hoy = {f[0] for f in hallados if f[4]}
    dudas = {f[0] for f in dudosos}
    mal_clasificadas = sorted((hoy - debe_hoy) | (debe_hoy - hoy))
    faltan = sorted(debe_cazar - lineas)
    # EXACTO, no interseccion con la lista de «calla»: asi una clase nueva de
    # falso positivo revienta la autoprueba aunque yo no la haya previsto.
    sobran = sorted(lineas - debe_cazar)
    sin_duda = sorted(debe_dudar - dudas)
    duda_de_mas = sorted(dudas - debe_dudar)
    print(u'  cazadas  %s   (esperadas %s)'
          % (sorted(lineas & debe_cazar), sorted(debe_cazar)))
    print(u'  dudosas  %s   (esperadas %s)' % (sorted(dudas), sorted(debe_dudar)))
    if faltan:
        print(u'  *** NO CAZO las lineas %s: el detector esta MUDO ahi.' % faltan)
    if sobran:
        print(u'  *** FALSO POSITIVO en las lineas %s.' % sobran)
    if sin_duda:
        print(u'  *** las lineas %s debian quedar SIN DECIDIR y se perdieron.'
              % sin_duda)
    if duda_de_mas:
        print(u'  *** duda de mas en las lineas %s.' % duda_de_mas)
    if mal_clasificadas:
        print(u'  *** mal clasificadas en «apagado hoy» vs «latente»: %s.'
              % mal_clasificadas)
    if faltan or sobran or sin_duda or duda_de_mas or mal_clasificadas:
        return 1
    print(u'  autoprueba OK: caza las %d que debe, calla en las %d que debe y'
          % (len(debe_cazar), len(debe_callar)))
    print(u'  deja %d sin decidir en vez de suponerle un fondo.' % len(debe_dudar))
    return 0


def main():
    fondo_card, hex_card = fondo_css('.cp-card')
    fondo_pagina, hex_pagina = fondo_css('body')
    print(u'')
    print(u'  COLOR QUE SU PROPIO FONDO HARIA INVISIBLE')
    print(u'  leidos de app/globals.css:  .cp-card %s · body %s'
          % (hex_card, hex_pagina))
    print(u'  umbral: %.1f:1 (texto)' % MINIMO)
    print(u'  ' + u'─' * 70)

    if '--autoprueba' in sys.argv:
        return autoprueba(fondo_card, fondo_pagina)

    roto = revisa_el_espejo(hex_card)
    if roto:
        print(u'')
        for linea in roto:
            print(u'  *** %s' % linea)
        return 1

    compartidas = paleta_compartida()
    por_clase, por_clase_card = fondos_por_clase()
    pisado = regla_pisado()
    ahora, latentes, dudosos, ciegos, archivos = [], [], [], [], 0
    for base, dirs, ficheros in os.walk(RAIZ):
        dirs[:] = [d for d in dirs if d not in ('node_modules', '.next', '.git', 'scripts')]
        for f in sorted(ficheros):
            if not f.endswith(('.tsx', '.jsx')):
                continue
            ruta = os.path.join(base, f)
            rel = os.path.relpath(ruta, RAIZ).replace('\\', '/')
            fallos, dudas, opacos = revisar(ruta, fondo_card, fondo_pagina,
                                            compartidas, por_clase,
                                            por_clase_card, pisado)
            if fallos:
                archivos += 1
            for nlinea, etiqueta, expr in opacos:
                ciegos.append((rel, nlinea, etiqueta, expr))
            for nlinea, etiqueta, valor, c, es_ahora, frag in fallos:
                (ahora if es_ahora else latentes).append(
                    (rel, nlinea, etiqueta, valor, c, frag))
            for nlinea, etiqueta, valor, _c, frag in dudas:
                dudosos.append((rel, nlinea, etiqueta, valor))

    if ahora:
        print(u'')
        print(u'  APAGADO HOY — etiquetas que `globals.css` NO repinta: <li>,')
        print(u'  <button>, <a class>, <span> con `background`. Aqui lo escrito')
        print(u'  es lo que se ve, asi que el bajo contraste es de HOY.')
        for rel, n, et, v, c, frag in ahora:
            print(u'    %s:%d  <%s> %s  %.2f:1' % (rel, n, et, v, c))
            print(u'       %s' % frag)
    if latentes:
        print(u'')
        print(u'  LATENTE — hoy lo salva el `!important`; sin el, desaparece')
        for rel, n, et, v, c, frag in latentes:
            print(u'    %s:%d  <%s> %s  %.2f:1' % (rel, n, et, v, c))

    if dudosos:
        print(u'')
        print(u'  SIN DECIDIR — el fondo real no se puede leer del archivo')
        print(u'  (un degradado, una plantilla `${x}10`, un componente que')
        print(u'  envuelve). NO cuenta como hallazgo: se decide midiendo la')
        print(u'  pagina servida.')
        porarch = {}
        for rel, n, et, v in dudosos:
            porarch[rel] = porarch.get(rel, 0) + 1
        for rel in sorted(porarch, key=lambda r: (-porarch[r], r)):
            print(u'    %-46s %d' % (rel, porarch[rel]))
        if '--dudas' in sys.argv:
            for rel, n, et, v in dudosos:
                print(u'      %s:%d  <%s> %s' % (rel, n, et, v))
        else:
            print(u'    (con --dudas se listan una por una)')

    if ciegos and '--ciegos' in sys.argv:
        print(u'')
        print(u'  COLOR QUE NO SE PUEDE RESOLVER LEYENDO EL ARCHIVO')
        for rel, n, et, expr in ciegos:
            print(u'      %s:%d  <%s> %s' % (rel, n, et, expr))

    print(u'')
    print(u'  %d archivo(s) con hallazgos · %d apagados hoy · %d latentes'
          u' · %d sin decidir'
          % (archivos, len(ahora), len(latentes), len(dudosos)))
    print(u'  LO QUE ESTE GUION NO VE: %d color(es) vienen de una expresion que'
          % len(ciegos))
    print(u'  no se resuelve aqui (`cfg.color`, `map[val]`, una llamada), y %d'
          % len(dudosos))
    print(u'  estan sobre un fondo que tampoco. Un cero de hallazgos NO es')
    print(u'  cobertura total. Con --ciegos y --dudas se listan.')
    if not ahora and not latentes:
        print(u'  ningun color depende del pisado para verse.')
        return 0
    print(u'')
    print(u'  Arreglo, por orden: `TX_TENUE` si es texto secundario;')
    print(u'  `tonoSobreOscuro(color)` de lib/contraste.ts si el tono COMUNICA')
    print(u'  algo y hay que conservarlo; los tokens `_D` si el modulo ya tiene')
    print(u'  juego oscuro. Nunca un hex nuevo a ojo. Si el fondo real no se')
    print(u'  puede leer aqui, declararlo con `// @fondo-claro: <motivo>`.')
    return 1


if __name__ == '__main__':
    sys.exit(main())
