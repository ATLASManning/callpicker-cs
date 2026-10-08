# -*- coding: utf-8 -*-
"""Identificadores que un archivo USA y que no existen EN NINGUNA PARTE.

   POR QUE EXISTE â€” EL HUECO QUE DEJO SU HERMANO
   ----------------------------------------------
   `revisa-usados-sin-importar.py` solo marca un nombre si OTRO modulo del
   proyecto lo exporta. Esa condicion es la que lo hace fiable, y es tambien su
   agujero: un nombre que no exporta nadie se le escapa entero.

   El 8 de octubre de 2026 la portada entera dio 500 por ese agujero. Al mudar
   `computeFaltantes` a lib/candidatos-cartera.ts se borro su definicion y
   quedaron dos llamadas vivas en app/page.tsx. La funcion era LOCAL de ese
   archivo: no la exportaba nadie, asi que `u not in EXPORTA` la dejo pasar y
   los trece detectores dieron verde. El error aparecio en la cara del usuario
   â€”Â«Application error: a server-side exception has occurredÂ»â€” porque
   next.config.js lleva ignoreBuildErrors y el despliegue tambien dio verde.

   Este hace la pregunta complementaria y mas simple: el nombre que se usa,
   Â¿existe en algun sitio? Ni importado, ni declarado, ni global del lenguaje.

   POR QUE NO EXPLOTA EN FALSOS POSITIVOS
   --------------------------------------
   Ya se intento un analisis de ambito general y dio 2,696 falsos positivos.
   Esto no es eso. Mira SOLO dos formas de uso â€”la llamada `foo(` y el
   componente o tipo `<Foo`â€” y declara conocido CUALQUIER nombre que aparezca
   declarado en el archivo, sin importar el ambito. Ser permisivo con lo
   declarado es a proposito: prefiere callar un bug a inventarse diez.

   Es de SOLO LECTURA.

   USO
   ---
       python scripts/revisa-no-definidos.py
"""
import io
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CARPETAS = ('app', 'components', 'lib')
SALTAR = ('node_modules', '.next', '.git', 'scripts')

# Palabras del lenguaje que la expresion de llamada atrapa por su forma:
# `if (`, `for (`, `catch (` se parecen a una invocacion y no lo son.
PALABRAS = {
    'if', 'for', 'while', 'switch', 'catch', 'return', 'typeof', 'instanceof',
    'function', 'await', 'new', 'super', 'this', 'void', 'delete', 'in', 'of',
    'do', 'else', 'try', 'finally', 'throw', 'yield', 'import', 'export', 'as',
    'is', 'keyof', 'satisfies', 'async', 'case', 'default', 'const', 'let',
    'var', 'class', 'extends', 'implements', 'interface', 'type', 'enum',
    'declare', 'namespace', 'readonly', 'infer', 'asserts', 'out', 'using',
}

# Globales del lenguaje y de los dos entornos en que corre este codigo
# (servidor de Node y navegador). Un nombre de aqui no necesita importarse.
GLOBALES = {
    # ECMAScript
    'Array', 'Object', 'String', 'Number', 'Boolean', 'Symbol', 'BigInt',
    'Math', 'JSON', 'Date', 'RegExp', 'Function', 'Promise', 'Map', 'Set',
    'WeakMap', 'WeakSet', 'Proxy', 'Reflect', 'Intl', 'globalThis',
    'Error', 'TypeError', 'RangeError', 'SyntaxError', 'EvalError',
    'ReferenceError', 'URIError', 'AggregateError',
    'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'eval',
    'encodeURIComponent', 'decodeURIComponent', 'encodeURI', 'decodeURI',
    'structuredClone', 'queueMicrotask',
    'ArrayBuffer', 'SharedArrayBuffer', 'DataView', 'Atomics',
    'Uint8Array', 'Int8Array', 'Uint16Array', 'Int16Array', 'Uint32Array',
    'Int32Array', 'Float32Array', 'Float64Array', 'BigInt64Array',
    'BigUint64Array', 'Uint8ClampedArray',
    # Tipos de utilidad de TypeScript â€” se escriben como `<Foo>` y no se importan
    'Record', 'Partial', 'Required', 'Readonly', 'Pick', 'Omit', 'Exclude',
    'Extract', 'NonNullable', 'ReturnType', 'Parameters', 'ConstructorParameters',
    'InstanceType', 'Awaited', 'ThisType', 'Uppercase', 'Lowercase',
    'Capitalize', 'Uncapitalize', 'NoInfer', 'Iterable', 'Iterator',
    'AsyncIterable', 'ArrayLike', 'PromiseLike', 'Generator', 'AsyncGenerator',
    'JSX', 'React', 'NodeJS',
    # Web / fetch
    'fetch', 'Headers', 'Request', 'Response', 'FormData', 'Blob', 'File',
    'URL', 'URLSearchParams', 'AbortController', 'AbortSignal',
    'TextEncoder', 'TextDecoder', 'atob', 'btoa', 'crypto', 'console',
    'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
    'setImmediate', 'clearImmediate', 'requestAnimationFrame',
    'cancelAnimationFrame', 'performance', 'ReadableStream', 'WritableStream',
    'TransformStream', 'EventTarget', 'Event', 'CustomEvent', 'MessageChannel',
    # Navegador
    'window', 'document', 'navigator', 'location', 'history', 'localStorage',
    'sessionStorage', 'alert', 'confirm', 'prompt', 'matchMedia',
    'getComputedStyle', 'Image', 'Audio', 'Worker', 'WebSocket', 'EventSource',
    'MutationObserver', 'IntersectionObserver', 'ResizeObserver',
    'HTMLElement', 'HTMLInputElement', 'HTMLDivElement', 'HTMLFormElement',
    'HTMLCanvasElement', 'HTMLSelectElement', 'HTMLTextAreaElement',
    'HTMLButtonElement', 'HTMLAnchorElement', 'HTMLImageElement',
    'Element', 'Node', 'NodeList', 'DOMParser', 'SVGElement', 'KeyboardEvent',
    'MouseEvent', 'TouchEvent', 'FocusEvent', 'DragEvent', 'WheelEvent',
    'ClipboardEvent', 'PointerEvent', 'InputEvent', 'SubmitEvent',
    # Node
    'process', 'Buffer', 'require', 'module', 'exports', '__dirname',
    '__filename', 'global',
}

CONOCIDOS_SIEMPRE = PALABRAS | GLOBALES


def archivos():
    for base in CARPETAS:
        for dp, dn, fn in os.walk(os.path.join(RAIZ, base)):
            dn[:] = [d for d in dn if d not in SALTAR]
            for f in sorted(fn):
                if f.endswith(('.ts', '.tsx')):
                    yield os.path.join(dp, f)


# OJO con `<` y `>`: NO van aqui, y la razon es TSX.
#
# Si `<` cuenta como «aqui empieza una expresion regular», entonces un cierre
# de etiqueta `</div>` abre una regex falsa que se traga el codigo hasta la
# siguiente barra del archivo. Eso borro declaraciones enteras y hizo que
# TablaDetalle, TablaDesmentidas y stripNonDbFields salieran como «no
# definidos» estando a la vista en su propia linea.
#
# `>` solo vale cuando viene de una flecha —`x => /ab/.test(x)`— y eso se
# comprueba mirando el caracter anterior, no metiendolo en el conjunto.
ANTES_DE_REGEX = set('(,=:[!&|?{};+-*%^~') | {'\n'}
PALABRA_ANTES_REGEX = {'return', 'typeof', 'case', 'in', 'of', 'do', 'else',
                       'yield', 'await', 'new', 'throw', 'delete', 'void'}


def solo_codigo(s):
    """Deja el codigo y borra todo lo que es texto, conservando las posiciones.

       Cada caracter retirado se sustituye por un espacio y los saltos de linea
       se conservan, de modo que los indices y los numeros de linea del original
       siguen valiendo.

       Hace falta un recorredor y no cuatro expresiones regulares porque los
       cuatro casos se enredan entre si. Dos que lo demuestran:

         Â· Un literal de expresion regular como /(termin|cerr)(o|Ã³)/ deja un
           `termin(` que se lee igual que una llamada. Medido: 14 falsos
           positivos de un solo archivo, lib/actividades/cierre.ts.
         Â· Y no se puede borrar primero las cadenas y luego las regex, porque
           una regex puede CONTENER una comilla â€”/['"]/ es de lo mas comunâ€” y
           el borrador de cadenas se comeria el codigo que viene detras.

       La ambiguedad de `/` â€”division o inicio de regexâ€” se resuelve por lo que
       precede, que es como la resuelve el propio lenguaje.
    """
    out = []
    i, n = 0, len(s)
    ultimo = ''          # ultimo caracter significativo ya emitido
    penultimo = ''       # el anterior a ese, para distinguir `=>` de `>`
    ultima_palabra = ''  # la ultima palabra TERMINADA
    palabra_actual = ''  # la que se esta leyendo ahora mismo
    while i < n:
        c = s[i]
        dos = s[i:i + 2]
        if dos == '//':
            while i < n and s[i] != '\n':
                out.append(' ')
                i += 1
            continue
        if dos == '/*':
            while i < n and s[i:i + 2] != '*/':
                out.append('\n' if s[i] == '\n' else ' ')
                i += 1
            out.append('  ')
            i += 2
            continue
        if c in '\'"`':
            cierre = c
            # Los delimitadores se CONSERVAN. Borrarlos dejaba `from  x ` sin
            # comillas y la expresion que lee los imports —que las exige— dejo
            # de reconocerlos: 1,126 falsos positivos de golpe, con nombres
            # importados a la vista en la linea 1 del archivo. Vaciar el
            # contenido es el objetivo; borrar la forma, un daño colateral.
            out.append(c)
            i += 1
            while i < n:
                if s[i] == '\\':
                    out.append('  ')
                    i += 2
                    continue
                if s[i] == cierre:
                    out.append(cierre)
                    i += 1
                    break
                # En `${...}` de una plantilla hay codigo de verdad, asi que se
                # conserva — pero pasandolo por ESTE MISMO recorredor. Copiarlo
                # en crudo, que es lo que hacia antes, dejaba intactas las
                # cadenas de dentro: `${x ? 'rgba(1,2,3)' : y}` soltaba un
                # `rgba(` que se leia como una llamada a una funcion que no
                # existe. Cinco falsos positivos, uno por cada pantalla con
                # colores calculados.
                if cierre == '`' and s[i:i + 2] == '${':
                    prof, ini = 1, i + 2
                    out.append('  ')
                    i += 2
                    while i < n and prof:
                        if s[i] == '{':
                            prof += 1
                        elif s[i] == '}':
                            prof -= 1
                            if not prof:
                                break
                        i += 1
                    out.append(solo_codigo(s[ini:i]))
                    if i < n:
                        out.append(' ')
                        i += 1
                    continue
                out.append('\n' if s[i] == '\n' else ' ')
                i += 1
            ultimo = 'x'
            continue
        tras_flecha = (ultimo == '>' and penultimo == '=')
        if c == '/' and (ultimo in ANTES_DE_REGEX or ultimo == '' or tras_flecha
                         or ultima_palabra in PALABRA_ANTES_REGEX):
            j, clase = i + 1, False
            while j < n:
                if s[j] == '\\':
                    j += 2
                    continue
                if s[j] == '[':
                    clase = True
                elif s[j] == ']':
                    clase = False
                elif s[j] == '/' and not clase:
                    break
                elif s[j] == '\n':
                    j = i          # sin cerrar en la linea: no era regex
                    break
                j += 1
            if j > i and j < n:
                while j < n and s[j].isalpha():   # banderas: gimsuyd
                    j += 1
                out.append(' ' * (j - i))
                i = j
                ultimo = 'x'
                continue
        out.append(c)
        if not c.isspace():
            penultimo = ultimo
            ultimo = c
        # La ultima palabra COMPLETA, no la que se esta escribiendo. La primera
        # version acumulaba en `ultima_palabra` y la vaciaba al primer caracter
        # que no fuera de palabra, asi que al llegar al `/` de
        # `return /[",;\n]/.test(s)` el espacio ya la habia borrado: la regex no
        # se reconocia, su comilla abria una cadena y el recorredor se comia
        # TODO lo que venia detras. En app/facturacion/page.tsx eso borro desde
        # la linea 898 hasta el final y dos componentes declarados a la vista
        # salieron como inexistentes.
        if c.isalnum() or c in '_$':
            palabra_actual += c
        elif palabra_actual:
            ultima_palabra = palabra_actual
            palabra_actual = ''
        i += 1
    return ''.join(out)


# El `(?!\bimport\b)` no es adorno. Sin el, un import de efecto —`import
# './globals.css'`, que no lleva `from`— hacia que la busqueda perezosa saltara
# hasta el `from` del import SIGUIENTE y se tragara su nombre: en
# app/layout.tsx el bloque capturado era «'…'\nimport Sidebar» y `Sidebar`
# acababa reportado como inexistente estando importado dos lineas arriba.
RX_IMPORT = re.compile(r'\bimport\s+((?:(?!\bimport\b)[\s\S])*?)\s+from\s*[\'"]', re.M)
# OJO con el separador. La primera version ponia `(?:function\s*\*?|const|…)\s+`
# y `function\s*` ya se comia el espacio, de modo que el `\s+` final exigia un
# SEGUNDO espacio y ninguna declaracion `function Nombre(` se reconocia jamas.
# Salieron como «no definidos» TablaDetalle, TablaDesmentidas y
# stripNonDbFields, que estan declarados a la vista. Cada rama lleva ahora su
# propio separador.
# Y OJO TAMBIEN con juntarlas en una sola alternancia, que fue el segundo
# tropiezo. Con `(?:function|const|…)` en un unico patron, el texto
# `] as const\n\nfunction stripNonDbFields(` casaba tomando el `const` de
# «as const» —que es una asercion de tipo, no una declaracion— y capturando
# `function` como si fuera el nombre. Peor: al consumirlo, la declaracion de
# verdad quedaba fuera del siguiente intento, porque `findall` no solapa. El
# nombre salia como «no definido» con su `function` delante.
#
# Una expresion por familia: asi ninguna puede comerse la presa de otra.
RX_DECL = (
    re.compile(r'(?:^|[\s(,;{])(?:export\s+)?(?:default\s+)?(?:async\s+)?'
               r'function\s*\*?\s*([A-Za-z_$][\w$]*)'),
    re.compile(r'(?:^|[\s(,;{])(?:export\s+)?(?!as\s)'
               r'(?:const|let|var)\s+([A-Za-z_$][\w$]*)'),
    re.compile(r'(?:^|[\s(,;{])(?:export\s+)?(?:default\s+)?(?:abstract\s+)?'
               r'(?:class|interface|type|enum|namespace)\s+([A-Za-z_$][\w$]*)'),
)
# Cualquier cosa a la izquierda de un `=` esta siendo declarada o reasignada, y
# en los dos casos existe. Cubre el parametro con valor por defecto dentro de
# una desestructuracion —`function V({ fmtVal = (n) => ... })`— que la lectura
# de parametros no ve porque su valor trae parentesis propios.
RX_ASIGNA = re.compile(r'(?<![.\w$])([A-Za-z_$][\w$]*)\s*=(?![=>])')
# Cualquier nombre entre llaves o corchetes a la izquierda de un `=`, y los
# parametros. Se recogen a lo bruto y a proposito: sobra-conocer no produce
# falsos positivos, solo silencia alguno de verdad, que es el lado seguro.
RX_DESTR = re.compile(r'(?:const|let|var)\s*[{\[]([\s\S]{0,400}?)[}\]]\s*=')
RX_PARAMS = re.compile(r'\(([^()]{0,600}?)\)\s*(?:=>|\{|:)')
RX_PARAMS_TIPADOS = re.compile(r'([A-Za-z_$][\w$]*)\s*[?]?\s*:')
# Un parametro tipado donde sea, aunque su firma lleve parentesis propios y la
# lectura por bloques no la vea: `const f = <T,>(sel: (a: A) => T, dest: D) =>`.
# Ahi `sel` quedaba sin declarar y su uso `sel(a)` salia como inexistente.
RX_PARAM_SUELTO = re.compile(r'[(,]\s*\.{0,3}([A-Za-z_$][\w$]*)\s*\??\s*:')

# ── El texto de los nodos JSX ─────────────────────────────────────────────
#
# Es la ultima fuente de ruido, y la mas tozuda. En
# `{cuentas.length} de {totalCuentas} cuentas ({pct}%)` la palabra «cuentas»
# va seguida de un parentesis y precedida de un `}`, que en codigo es un
# predecesor legitimo de una llamada. Asi que se lee como `cuentas(...)`.
#
# Por definicion, en un nodo de texto JSX no hay codigo: todo lo ejecutable va
# dentro de `{}`. Vaciar esos nodos no pierde ni un hallazgo — solo quita
# prosa. El riesgo es confundir codigo con prosa, y contra eso van las
# condiciones: el tramo tiene que ir de un `>` o `}` a un `<` o `{`, no
# contener ningun operador, y traer al menos una palabra con un espacio al
# lado. Eso descarta `} foo()` y `=> x` y deja pasar la prosa en español.
RX_TEXTO_JSX = re.compile(r'(?<=[>}])([^<>{}=;`&|!\\]*?)(?=[<{])')
RX_ETIQUETA = re.compile(r'(?:^|\s)([A-Za-z_$][\w$]*)\s*:\s*(?:for|while)\b')
RX_CATCH = re.compile(r'catch\s*\(\s*([A-Za-z_$][\w$]*)')
RX_FOR_IN = re.compile(r'for\s*(?:await\s*)?\(\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)')
RX_GENERICO = re.compile(r'<\s*([A-Z][\w$]*)\s*(?:extends|,|>)')

RX_USO_LLAMADA = re.compile(r'(?<![.\w$?])([a-z_$][\w$]*)\s*\(')
RX_USO_JSX = re.compile(r'<([A-Z][\w$]*)[\s/>]')

# â”€â”€ Prosa del JSX: la trampa que hace inservible a este detector â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
#
# `sin_comentarios` quita cadenas y comentarios, pero el texto de un JSX no va
# entre comillas: `<p>Hay que ver la raÃ­z (del problema)</p>` deja un `raÃ­z (`
# suelto que se lee igual que una llamada. Medido en la primera version: de 71
# hallazgos, la inmensa mayoria eran palabras en espaÃ±ol â€”Â«eneroÂ», Â«solicitudÂ»,
# Â«contactosÂ»â€” delante de un parentesis de inciso.
#
# Lo que separa la prosa del codigo no es la palabra sino lo que viene ANTES.
# En codigo, una llamada va detras de un operador, de un signo de puntuacion o
# del principio de la linea; en prosa va detras de otra palabra. Esa es la
# regla, con una excepcion obligada: las palabras clave que SI pueden preceder
# a una llamada de verdad.
ANTES_VALE = set('=(,{};[&|!?:<>+-*/%^~')
PALABRA_ANTES_VALE = {
    'return', 'await', 'typeof', 'new', 'delete', 'void', 'yield', 'case',
    'in', 'of', 'do', 'else', 'throw', 'instanceof', 'extends',
}


def es_codigo(s, ini):
    """Â¿El uso que empieza en `ini` esta en posicion de codigo o de prosa?"""
    i = ini - 1
    while i >= 0 and s[i] in ' \t':
        i -= 1
    if i < 0 or s[i] == '\n':
        return True
    if s[i] in ANTES_VALE:
        return True
    if not (s[i].isalnum() or s[i] in '_$'):
        # `)` y `]` cierran una expresion: `foo()(x)` o `a[0](x)` son raros y
        # `.` ya lo excluye el lookbehind. Lo demas que no es palabra, vale.
        return s[i] not in ')]'
    j = i
    while j >= 0 and (s[j].isalnum() or s[j] in '_$'):
        j -= 1
    return s[j + 1:i + 1] in PALABRA_ANTES_VALE


def sin_texto_jsx(s):
    """Vacia los nodos de texto de un JSX, conservando las posiciones.

       SOLO se usa para recortar la lista de USOS, nunca la de nombres
       conocidos. Ese orden es deliberado: lo peor que puede hacer entonces
       este filtro es callar un hallazgo, jamas inventarse uno.

       La primera version no lo respetaba y ademas era demasiado golosa: un
       `import { X } from '…'` tambien es un tramo que va de `}` a `{`, asi que
       se comio los imports de todo el proyecto y solto 889 falsos positivos
       de golpe, con medio `lucide-react` incluido. De ahi las condiciones.
    """
    def vacia(m):
        t = m.group(1)
        if len(t) < 3:
            return t
        if "'" in t or '"' in t or 'from' in t or 'import' in t:
            return t                       # eso es un import, no prosa
        if not re.search(r'[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]\s+\S', t.strip()):
            return t                       # sin dos palabras, no es prosa
        # Los saltos de linea SE CONSERVAN, que es lo que mantiene alineados
        # los numeros de linea. Y el tramo puede cruzarlos: un nodo de texto
        # suele empezar en la linea siguiente a la etiqueta que lo abre, asi
        # que exigirle una sola linea dejaba fuera a casi todos.
        return re.sub(r'[^\n]', ' ', t)
    return RX_TEXTO_JSX.sub(vacia, s)


def usos_de(s):
    out = set()
    for m in RX_USO_LLAMADA.finditer(s):
        if es_codigo(s, m.start(1)):
            out.add(m.group(1))
    for m in RX_USO_JSX.finditer(s):
        out.add(m.group(1))
    return out


def nombres_importados(s):
    out = set()
    for m in RX_IMPORT.finditer(s):
        bloque = m.group(1)
        for x in re.findall(r'^\s*([A-Za-z_$][\w$]*)\s*(?:,|$)', bloque, re.M):
            out.add(x)
        for x in re.findall(r'\*\s+as\s+([A-Za-z_$][\w$]*)', bloque):
            out.add(x)
        llaves = re.search(r'\{([\s\S]*?)\}', bloque)
        if llaves:
            for parte in llaves.group(1).split(','):
                parte = parte.strip()
                if not parte:
                    continue
                nombre = parte.split(' as ')[-1].strip()
                nombre = re.sub(r'^type\s+', '', nombre).strip()
                if re.fullmatch(r'[A-Za-z_$][\w$]*', nombre):
                    out.add(nombre)
    # `import 'x'` sin nombres, y `import type {...}`: ya cubiertos arriba.
    return out


def declarados_en(s):
    out = set()
    for rx in RX_DECL:
        out |= set(rx.findall(s))
    out |= set(RX_ASIGNA.findall(s))
    out |= set(RX_CATCH.findall(s))
    out |= set(RX_FOR_IN.findall(s))
    out |= set(RX_ETIQUETA.findall(s))
    out |= set(RX_GENERICO.findall(s))
    for rx in (RX_DESTR, RX_PARAMS):
        for m in rx.finditer(s):
            bloque = m.group(1)
            # nombre, alias (`a: b`), valor por defecto (`a = 1`), resto (`...r`)
            for parte in re.split(r'[,\n]', bloque):
                parte = parte.strip()
                if not parte:
                    continue
                izq = parte.split('=')[0]
                for trozo in izq.split(':'):
                    # Los corchetes y llaves se quitan: un parametro puede
                    # venir desestructurado dentro de la propia firma, como en
                    # `.map(([k, lbl, Icon]) => …)`, y dejandolos pegados el
                    # nombre no casaba y `Icon` salia como inexistente.
                    trozo = trozo.strip().strip('.[]{}() ').strip()
                    if re.fullmatch(r'[A-Za-z_$][\w$]*', trozo):
                        out.add(trozo)
            # parametros tipados: `function f(ruta: string, n = 4)`
            for x in RX_PARAMS_TIPADOS.findall(bloque):
                out.add(x)
    out |= set(RX_PARAM_SUELTO.findall(s))
    # Propiedades de objeto con funcion: `{ saluda() {...} }` y `saluda: () =>`
    out |= set(re.findall(r'(?:^|[{,;\s])([A-Za-z_$][\w$]*)\s*(?:\([^()]{0,200}\)\s*\{|:\s*(?:async\s*)?\()', s))
    # Red de seguridad: una palabra del lenguaje nunca es un nombre declarado.
    # Si alguna se cuela es que un patron capturo de mas, y dejarla pasar
    # silenciaria el uso real que lleva ese nombre detras.
    return out - PALABRAS


# ── Autoprueba ────────────────────────────────────────────────────────────
# `python -I scripts/revisa-no-definidos.py --autoprueba`
#
# Un detector que devuelve cero puede estar limpio o estar ciego, y desde
# fuera se ven igual. Esto lo prueba AL REVES: le mete lo que NO debe pasar y
# comprueba que lo caza, y le mete lo que SI debe pasar y comprueba que calla.
#
# Los casos mudos no son inventados: cada uno es un falso positivo que esta
# version solto durante su construccion, desde 71 hasta 0. Si alguien toca una
# expresion y resucita uno, esto lo dice aqui y no en produccion.
CASOS_CAZA = [
    ('la funcion borrada que tiro la portada',
     "import { faltantesDeFicha } from '@/lib/x'\n"
     "export default function P() {\n  const f = computeFaltantes(c)\n  return f\n}\n",
     'computeFaltantes'),
    ('un componente que nadie importa',
     "export default function P() {\n  return <TablaFantasma filas={[]} />\n}\n",
     'TablaFantasma'),
    ('la vecina que no se importo',
     "import { ahoraEnMexico, fechaLocal } from '@/lib/fecha-local'\n"
     "const hoy = hoyEnMexico()\n",
     'hoyEnMexico'),
]
CASOS_MUDOS = [
    ('`as const` seguido de una funcion',
     "const S = ['a'] as const\n\nfunction stripNonDbFields(o) { return o }\n"
     "const p = stripNonDbFields({})\n"),
    ('una regex con comillas dentro',
     "function esc(v) {\n  const s = String(v)\n"
     "  return /[\",;\\n]/.test(s) ? '\"' + s + '\"' : s\n}\n"
     "function Luego() { return 1 }\nconst z = Luego()\n"),
    ('prosa en el JSX con un parentesis',
     "export default function P({ cuentas, total, pct }) {\n"
     "  return <p>{cuentas.length} de {total} cuentas ({pct}%) requieren captura</p>\n}\n"),
    ('prosa con guion que empieza en otra linea',
     "export default function P({ stats, fmtN }) {\n  return (\n    <p>\n"
     "      One-timers (1 sola factura) {fmtN(stats.oneTimers)}\n    </p>\n  )\n}\n"),
    ('un import de efecto antes de uno con nombre',
     "import './globals.css'\nimport Sidebar from '@/components/Sidebar'\n"
     "export default function L() { return <Sidebar /> }\n"),
    ('color calculado dentro de una plantilla',
     "export default function P({ hay }) {\n"
     "  return <div style={{ border: `1px solid ${hay ? 'rgba(252,1,1,.4)' : '#fff'}` }} />\n}\n"),
    ('un parametro tipado en una firma con parentesis',
     "const unicaPor = <T,>(sel: (a: A) => T, destino: D) => {\n"
     "  for (const a of []) { const k = sel(a); destino[k] = 1 }\n}\n"),
    ('un desestructurado dentro de los parametros',
     "export default function P() {\n"
     "  return <>{[['a', 'A', Uno]].map(([k, lbl, Icon]) => <Icon key={k} />)}</>\n}\n"),
    ('una etiqueta de cierre JSX, que no abre una regex',
     "export default function P() {\n"
     "  return <div><span>uno</span><b>dos</b></div>\n}\nfunction Tras() { return 2 }\n"
     "const q = Tras()\n"),
]

if '--autoprueba' in sys.argv:
    def analiza(src, tsx=True):
        s = solo_codigo(src)
        conocidos = nombres_importados(s) | declarados_en(s) | CONOCIDOS_SIEMPRE
        return usos_de(sin_texto_jsx(s) if tsx else s) - conocidos

    fallos = []
    print('  DEBE CAZARLOS:')
    for etq, src, esperado in CASOS_CAZA:
        got = analiza(src)
        ok = esperado in got
        if not ok:
            fallos.append('no cazo %s (%s)' % (esperado, etq))
        print('    %-46s %s' % (etq[:46], 'caza' if ok else '** SE LE ESCAPA'))
    print('\n  DEBE CALLAR:')
    for etq, src in CASOS_MUDOS:
        got = analiza(src)
        if got:
            fallos.append('%s -> %s' % (etq, ', '.join(sorted(got))))
        print('    %-46s %s' % (etq[:46], 'calla' if not got
                                else '** GRITA: ' + ', '.join(sorted(got))))
    print('\n  %s' % ('la autoprueba pasa entera' if not fallos
                      else '*** FALLA:\n    - ' + '\n    - '.join(fallos)))
    sys.exit(1 if fallos else 0)


# ── Modo depuracion ───────────────────────────────────────────────────────
# `python -I scripts/revisa-no-definidos.py --depura <archivo> <nombre>`
# Mantener un detector es depurar por que CALLA o por que GRITA, y eso no se
# hace razonando sobre la expresion regular: se hace mirando lo que el
# recorredor dejo. Existe porque tres hallazgos falsos resistieron dos
# correcciones «evidentes» seguidas.
if '--depura' in sys.argv:
    k = sys.argv.index('--depura')
    ruta = os.path.join(RAIZ, sys.argv[k + 1].replace('/', os.sep))
    nombre = sys.argv[k + 2] if len(sys.argv) > k + 2 else None
    crudo = io.open(ruta, encoding='utf-8').read()
    s = solo_codigo(crudo)
    if ruta.endswith('.tsx'):
        s = sin_texto_jsx(s)
    imp, dec = nombres_importados(s), declarados_en(s)
    print('  importados %d · declarados %d · usados %d'
          % (len(imp), len(dec), len(usos_de(s))))
    print('  lineas crudo %d · procesado %d'
          % (len(crudo.split('\n')), len(s.split('\n'))))
    for etq, rx in [('RX_DECL/func', RX_DECL[0]), ('RX_DECL/var', RX_DECL[1]),
                    ('RX_DECL/tipo', RX_DECL[2]), ('RX_ASIGNA', RX_ASIGNA)]:
        enc = rx.findall(s)
        print('  %-13s %4d coincidencias%s' % (etq, len(enc),
              ('  <- trae el nombre' if nombre and nombre in enc else '')))
        if etq.endswith('func'):
            print('      %s' % ', '.join(sorted(set(enc))))
    if nombre:
        for j in [m.start() for m in re.finditer(re.escape(nombre), s)][:3]:
            print('  contexto  %r' % s[max(0, j - 56):j + len(nombre) + 4])
    if nombre:
        print('  «%s»  importado=%s  declarado=%s  global=%s  usado=%s'
              % (nombre, nombre in imp, nombre in dec,
                 nombre in CONOCIDOS_SIEMPRE, nombre in usos_de(s)))
        for i, ln in enumerate(crudo.split('\n')):
            if re.search(r'(?<![.\w$])%s\b' % re.escape(nombre), ln):
                proc = s.split('\n')[i]
                print('\n  linea %d' % (i + 1))
                print('    crudo     %s' % ln.strip()[:92])
                print('    procesado %s' % proc.strip()[:92])
    sys.exit(0)

hallazgos = []
n_arch = 0
for ruta in archivos():
    n_arch += 1
    crudo = io.open(ruta, encoding='utf-8').read()
    s = solo_codigo(crudo)
    # Lo CONOCIDO se lee del codigo entero; los USOS, del codigo sin la prosa
    # del JSX. En ese orden el filtro de prosa solo puede callar un hallazgo,
    # nunca fabricarlo — que es el lado por el que conviene equivocarse.
    conocidos = nombres_importados(s) | declarados_en(s) | CONOCIDOS_SIEMPRE
    usados = usos_de(sin_texto_jsx(s) if ruta.endswith('.tsx') else s)
    for u in sorted(usados):
        if u in conocidos:
            continue
        linea = next((i + 1 for i, ln in enumerate(crudo.split('\n'))
                      if re.search(r'(?<![.\w$?])%s\s*[(<]' % re.escape(u), ln)), 0)
        hallazgos.append((os.path.relpath(ruta, RAIZ).replace('\\', '/'), linea, u))

print('  %d archivo(s) revisados.' % n_arch)
if not hallazgos:
    print('  todo lo que se usa existe en alguna parte.')
    sys.exit(0)

print()
print('  *** SE USAN Y NO ESTAN DEFINIDOS EN NINGUNA PARTE ***')
print('  Ni importados, ni declarados en el archivo, ni globales del entorno.')
print('  Esto es un ReferenceError en cuanto se ejecute esa linea.')
print()
for ruta, linea, nombre in hallazgos:
    print('  %s:%d' % (ruta, linea))
    print('      usa `%s` y no viene de ningun sitio.' % nombre)
sys.exit(1)
