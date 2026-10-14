# -*- coding: utf-8 -*-
"""Comprueba que toda prop que se le pasa a un componente EXISTA en su interfaz.

   POR QUE EXISTE
   --------------
   `next.config.js` trae `typescript: { ignoreBuildErrors: true }` y
   `eslint: { ignoreDuringBuilds: true }`. Con eso, pasarle a un componente una
   prop que no existe NO rompe el build: React descarta la prop desconocida y el
   componente recibe `undefined` en la que si declara. No hay error, no hay
   warning, no hay pantalla roja. Hay un hueco.

   El 14 oct 2026 `/alertas` —el objetivo de trabajo de SAC— llevaba el `<h1>`
   VACIO en produccion porque las dos llamadas decian
   `<PageHeader titulo="Alertas de Cliente" />` y la interfaz declara `title`.
   La prop en espaniol se descartaba y `title` llegaba `undefined`. Nadie lo
   cazo porque no hay nada que lo cace: el build calla por configuracion.

   `tsc --noEmit` SI caza esta clase, y desde el 12 oct hay Node en
   `D:\\Tools\\node` para correrlo. Pero `tsc` no corre en el build ni en Vercel,
   y arrastra ~250 lineas de errores viejos (tipos de Supabase,
   `downlevelIteration`, `any` implicito) entre los que esta clase se pierde.
   Este detector mira SOLO esta clase y no necesita Node.

   QUE COMPRUEBA
   -------------
   1. Toda prop pasada en un JSX a un componente del repo esta declarada en su
      tipo de props. Si no, es una prop que se descarta en silencio.
   2. Cuando la prop desconocida es la palabra en espaniol de una prop que SI
      existe en ingles (`titulo`/`title`), lo dice con ese nombre: es el bug de
      `/alertas` y es el que mas se repite.
   3. Toda prop OBLIGATORIA del tipo se pasa en cada uso. Una obligatoria que
      falta llega `undefined` y pinta vacio, igual que el caso de arriba.

   LO QUE NO COMPRUEBA, Y LO DICE
   ------------------------------
   Solo revisa componentes cuyo tipo de props pudo LEER: los definidos en el
   mismo archivo y los que se importan por `@/components/...`. Los de
   `node_modules` (lucide, recharts, next/link) quedan fuera a proposito. Un
   componente cuyo tipo no se pudo parsear se cuenta y se IMPRIME como
   `sin verificar` — nunca se cuenta como aprobado. Un uso con `{...spread}`
   se exime del punto 3, porque el spread puede traer las obligatorias.

   USO
   ---
       python scripts/revisa-props-jsx.py
"""
import io
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
fallas = []
sin_verificar = []

# Prop en espaniol -> la que de verdad existe en ingles. Cuando una prop
# desconocida esta aqui Y su pareja inglesa esta declarada, el mensaje lo dice:
# es el error de `/alertas` y conviene nombrarlo para que se reconozca.
PAREJAS = {
    'titulo': 'title', 'subtitulo': 'subtitle', 'acciones': 'actions',
    'oscuro': 'dark', 'etiqueta': 'label', 'valor': 'value', 'nombre': 'name',
    'texto': 'text', 'cargando': 'loading', 'deshabilitado': 'disabled',
    'hijos': 'children', 'ancho': 'width', 'alto': 'height', 'icono': 'icon',
    'enlace': 'href', 'ruta': 'href', 'abierto': 'open', 'activo': 'active',
    'seleccionado': 'selected', 'requerido': 'required', 'tipo': 'type',
    'filas': 'rows', 'columnas': 'columns', 'datos': 'data', 'tamano': 'size',
    'marcador': 'placeholder', 'color': 'color', 'clase': 'className',
}

# Props que React/JSX acepta en cualquier elemento y no vienen del tipo.
PROPS_LIBRES = {'key', 'ref', 'children', 'suppressHydrationWarning'}

CIERRES = {'{': '}', '(': ')', '[': ']'}


def lee(ruta):
    with io.open(ruta, encoding='utf-8') as f:
        return f.read()


def archivos_tsx():
    """Todo .tsx del repo, menos node_modules/.next y el arnes local."""
    for base, dirs, files in os.walk(RAIZ):
        dirs[:] = [d for d in dirs
                   if d not in ('node_modules', '.next', '.git', 'public', 'data')]
        for f in files:
            if f.endswith('.tsx'):
                ruta = os.path.join(base, f)
                rel = os.path.relpath(ruta, RAIZ).replace('\\', '/')
                # `app/acceso/` es el arnes local de verificacion, fuera de git.
                if rel.startswith('app/acceso/'):
                    continue
                yield rel, ruta


# ─────────────────────────────────────────────────────────────────────────────
# Saltos: strings, templates, comentarios y pares de llaves. Sin esto, un
# identificador dentro de un string o de un tipo anidado se lee como prop.
# ─────────────────────────────────────────────────────────────────────────────

def salta_string(s, i):
    q = s[i]
    i += 1
    while i < len(s):
        if s[i] == '\\':
            i += 2
            continue
        if s[i] == q:
            return i + 1
        i += 1
    return i


def salta_template(s, i):
    i += 1
    while i < len(s):
        if s[i] == '\\':
            i += 2
            continue
        if s[i] == '`':
            return i + 1
        if s.startswith('${', i):
            i = salta_par(s, i + 1)
            continue
        i += 1
    return i


def salta_par(s, i):
    """`i` sobre un `{`, `(` o `[`; devuelve el indice DESPUES de su cierre."""
    pila = [CIERRES[s[i]]]
    i += 1
    while i < len(s) and pila:
        c = s[i]
        if c in '"\'':
            i = salta_string(s, i)
            continue
        if c == '`':
            i = salta_template(s, i)
            continue
        if s.startswith('//', i):
            n = s.find('\n', i)
            i = len(s) if n < 0 else n + 1
            continue
        if s.startswith('/*', i):
            n = s.find('*/', i)
            i = len(s) if n < 0 else n + 2
            continue
        if c in CIERRES:
            pila.append(CIERRES[c])
            i += 1
            continue
        if c == pila[-1]:
            pila.pop()
            i += 1
            continue
        i += 1
    return i


def sin_comentarios(s):
    """Blanquea comentarios dejando los saltos de linea en su sitio.

       Hace falta ANTES de buscar JSX: estos archivos llevan comentarios
       larguisimos y, sin esto, `<Tabla` dentro de un comentario se leia como
       un uso real y cada palabra del comentario como una prop («El», «renglon»,
       «que»…). La primera version del detector escupio 120 fallas y casi todas
       eran texto en prosa.

       Un `//` precedido de `:` es `http://`, no un comentario.
    """
    out = list(s)
    i, n = 0, len(s)
    while i < n:
        c = s[i]
        if c in '"\'':
            i = salta_string(s, i)
            continue
        if c == '`':
            i = salta_template(s, i)
            continue
        if s.startswith('//', i):
            if i > 0 and s[i - 1] == ':':
                i += 2
                continue
            while i < n and s[i] != '\n':
                out[i] = ' '
                i += 1
            continue
        if s.startswith('/*', i):
            fin = s.find('*/', i + 2)
            fin = n if fin < 0 else fin + 2
            for j in range(i, fin):
                if out[j] != '\n':
                    out[j] = ' '
            i = fin
            continue
        i += 1
    return ''.join(out)


def salta_trivial(s, i):
    """Avanza sobre espacios y comentarios. Devuelve el nuevo indice."""
    while i < len(s):
        if s[i] in ' \t\r\n':
            i += 1
            continue
        if s.startswith('//', i):
            n = s.find('\n', i)
            i = len(s) if n < 0 else n + 1
            continue
        if s.startswith('/*', i):
            n = s.find('*/', i)
            i = len(s) if n < 0 else n + 2
            continue
        break
    return i


# ─────────────────────────────────────────────────────────────────────────────
# Lectura de los tipos de props
# ─────────────────────────────────────────────────────────────────────────────

def campos_de_tipo(cuerpo):
    """Campos al nivel 0 del cuerpo de un tipo -> {nombre: obligatorio}."""
    campos = {}
    i, n = 0, len(cuerpo)
    while i < n:
        c = cuerpo[i]
        if c in '"\'':
            i = salta_string(cuerpo, i)
            continue
        if c == '`':
            i = salta_template(cuerpo, i)
            continue
        if cuerpo.startswith('//', i) or cuerpo.startswith('/*', i):
            i = salta_trivial(cuerpo, i)
            continue
        if c in CIERRES:
            i = salta_par(cuerpo, i)
            continue
        if c.isalpha() or c == '_' or c == '$':
            j = i
            while j < n and (cuerpo[j].isalnum() or cuerpo[j] in '_$'):
                j += 1
            nombre = cuerpo[i:j]
            k = salta_trivial(cuerpo, j)
            opcional = False
            if k < n and cuerpo[k] == '?':
                opcional = True
                k = salta_trivial(cuerpo, k + 1)
            if k < n and cuerpo[k] == ':':
                campos[nombre] = not opcional
                # Saltar el TIPO del campo hasta su cierre al nivel 0, para que
                # un identificador del tipo no se lea como otro campo.
                i = k + 1
                while i < n:
                    c2 = cuerpo[i]
                    if c2 in '"\'':
                        i = salta_string(cuerpo, i)
                        continue
                    if c2 == '`':
                        i = salta_template(cuerpo, i)
                        continue
                    if c2 in CIERRES:
                        i = salta_par(cuerpo, i)
                        continue
                    if c2 in ';,\n':
                        i += 1
                        break
                    i += 1
                continue
            i = j
            continue
        i += 1
    return campos


def tipos_del_archivo(s):
    """`interface X {...}` y `type X = {...}` -> {X: {campo: obligatorio}}."""
    tipos = {}
    pat = r'\b(?:export\s+)?(?:interface\s+(\w+)\s*(?:extends[^{]*?)?|type\s+(\w+)\s*=\s*)\{'
    for m in re.finditer(pat, s):
        nombre = m.group(1) or m.group(2)
        abre = m.end() - 1
        cierra = salta_par(s, abre)
        tipos[nombre] = campos_de_tipo(s[abre + 1:cierra - 1])
    return tipos


def params_de_componente(s, pos_parens):
    """Texto del parametro unico de un componente, desde el `(` de su firma."""
    cierra = salta_par(s, pos_parens)
    return s[pos_parens + 1:cierra - 1]


def props_de_params(params, tipos):
    """Del texto del parametro saca (props, permisivo, pudo_leerse).

       `props` es {nombre: obligatorio}. `permisivo` es True cuando el
       componente recibe `...rest` o props sin tipo util: ahi no se puede
       afirmar que una prop sea desconocida.
    """
    txt = params.strip()
    if not txt:
        return {}, False, True          # no recibe props: cualquiera es desconocida

    # El `:` que separa la desestructuracion de su tipo, al nivel 0.
    i, n, corte = 0, len(txt), -1
    while i < n:
        c = txt[i]
        if c in '"\'':
            i = salta_string(txt, i)
            continue
        if c == '`':
            i = salta_template(txt, i)
            continue
        if c in CIERRES:
            i = salta_par(txt, i)
            continue
        if c == ':':
            corte = i
            break
        i += 1
    if corte < 0:
        return {}, True, False          # parametro sin tipo: no se puede juzgar

    izq = txt[:corte].strip()
    der = txt[corte + 1:].strip()
    permisivo = '...' in izq

    # Defaults en la desestructuracion (`dark = false`) hacen opcional de hecho
    # una prop declarada obligatoria: no se le puede exigir al que la usa.
    con_default = set()
    if izq.startswith('{'):
        dentro = izq[1:salta_par(izq, 0) - 1]
        j = 0
        while j < len(dentro):
            c = dentro[j]
            if c in CIERRES:
                j = salta_par(dentro, j)
                continue
            if c in '"\'':
                j = salta_string(dentro, j)
                continue
            if c.isalpha() or c == '_':
                k = j
                while k < len(dentro) and (dentro[k].isalnum() or dentro[k] in '_$'):
                    k += 1
                m = salta_trivial(dentro, k)
                if m < len(dentro) and dentro[m] == '=':
                    con_default.add(dentro[j:k])
                j = k
                continue
            j += 1

    if der.startswith('{'):
        props = campos_de_tipo(der[1:salta_par(der, 0) - 1])
    else:
        m = re.match(r'([\w.]+)', der)
        if not m:
            return {}, True, False
        base = m.group(1).split('.')[-1]
        if base not in tipos:
            return {}, True, False      # tipo importado o generico: no se juzga
        props = dict(tipos[base])

    for p in con_default:
        if p in props:
            props[p] = False
        else:
            # Desestructura algo que el tipo no declara: no se puede juzgar.
            return props, True, False
    return props, permisivo, True


def componentes_del_archivo(s):
    """{Nombre: (props, permisivo, legible)} de los componentes del archivo."""
    tipos = tipos_del_archivo(s)
    comps = {}
    patrones = [
        r'\b(?:export\s+)?(?:export\s+default\s+)?(?:async\s+)?function\s+([A-Z]\w*)\s*\(',
        r'\b(?:export\s+)?const\s+([A-Z]\w*)\s*(?::[^=]*?)?=\s*(?:async\s*)?\(',
    ]
    for pat in patrones:
        for m in re.finditer(pat, s):
            nombre = m.group(1)
            if nombre in comps:
                continue
            params = params_de_componente(s, m.end() - 1)
            comps[nombre] = props_de_params(params, tipos)

    # `export default function ({...})` sin nombre: el archivo ES el componente.
    m = re.search(r'export\s+default\s+(?:async\s+)?function\s*\(', s)
    if m:
        comps['default'] = props_de_params(
            params_de_componente(s, m.end() - 1), tipos)
    return comps


# ─────────────────────────────────────────────────────────────────────────────
# Lectura de los usos en JSX
# ─────────────────────────────────────────────────────────────────────────────

def usos_jsx(s):
    """[(Nombre, [props], spread, linea)] de cada etiqueta de componente."""
    out = []
    for m in re.finditer(r'<([A-Z][\w.]*)[\s/>]', s):
        nombre = m.group(1)
        i = m.end() - 1
        n = len(s)
        cuerpo_ini = i
        while i < n:
            c = s[i]
            if c in '"\'':
                i = salta_string(s, i)
                continue
            if c == '`':
                i = salta_template(s, i)
                continue
            if c in CIERRES:
                i = salta_par(s, i)
                continue
            if c == '>':
                break
            i += 1
        cuerpo = s[cuerpo_ini:i]
        if cuerpo.endswith('/'):
            cuerpo = cuerpo[:-1]
        props, spread = atributos_de_cuerpo(cuerpo)
        out.append((nombre, props, spread, s.count('\n', 0, m.start()) + 1))
    return out


def atributos_de_cuerpo(cuerpo):
    """Nombres de prop al nivel 0 del cuerpo de una etiqueta, y si trae spread."""
    props, spread = [], False
    i, n = 0, len(cuerpo)
    while i < n:
        c = cuerpo[i]
        if c in '"\'':
            i = salta_string(cuerpo, i)
            continue
        if c == '`':
            i = salta_template(cuerpo, i)
            continue
        if c == '{':
            j = salta_trivial(cuerpo, i + 1)
            if cuerpo.startswith('...', j):
                spread = True
            i = salta_par(cuerpo, i)
            continue
        if c in '([':
            i = salta_par(cuerpo, i)
            continue
        if c.isalpha() or c == '_':
            j = i
            while j < n and (cuerpo[j].isalnum() or cuerpo[j] in '_-:$'):
                j += 1
            props.append(cuerpo[i:j])
            i = j
            continue
        i += 1
    return props, spread


def importaciones(s):
    """{nombre local: ruta '@/...'} de los imports del repo, no de node_modules."""
    mapa = {}
    # `[^;'"]` es lo que impide que la clausula cruce de un import al
    # siguiente: la ruta del anterior va entre comillas y las corta. Con
    # `[^;]` la clausula de `import Link from 'next/link'` se estiraba hasta
    # el `from '@/components/PageHeader'` de tres lineas mas abajo, y el
    # detector creia que `Link` ERA PageHeader — de ahi salian
    # «<Link> sin `title`, que es obligatoria».
    for m in re.finditer(r'import\s+([^;\'"]+?)\s+from\s+[\'"](@/[^\'"]+)[\'"]', s):
        clausula, ruta = m.group(1).strip(), m.group(2)
        md = re.match(r'([A-Za-z_]\w*)', clausula)
        if md:
            mapa[md.group(1)] = (ruta, 'default')
        for mn in re.finditer(r'\{([^}]*)\}', clausula):
            for parte in mn.group(1).split(','):
                parte = parte.strip()
                if not parte or parte.startswith('type '):
                    continue
                if ' as ' in parte:
                    orig, local = [x.strip() for x in parte.split(' as ')]
                else:
                    orig = local = parte
                if orig and orig[0].isupper():
                    mapa[local] = (ruta, orig)
    return mapa


def main():
    print('  Props de JSX contra la interfaz que las declara\n')

    fuentes, comps_por_archivo = {}, {}
    for rel, ruta in archivos_tsx():
        # Se trabaja SIEMPRE sobre la fuente sin comentarios, y por eso los
        # numeros de linea siguen siendo los del archivo: `sin_comentarios`
        # blanquea sin mover nada.
        s = sin_comentarios(lee(ruta))
        fuentes[rel] = s
        comps_por_archivo[rel] = componentes_del_archivo(s)

    def resuelve(rel, nombre):
        """(props, permisivo, legible) del componente, o None si no es del repo."""
        propio = comps_por_archivo.get(rel, {})
        if nombre in propio:
            return propio[nombre]
        ruta_exp = importaciones(fuentes[rel]).get(nombre)
        if not ruta_exp:
            return None
        ruta, exportado = ruta_exp
        destino = ruta[2:] + '.tsx'
        if destino not in comps_por_archivo:
            return None
        comps = comps_por_archivo[destino]
        if exportado == 'default':
            # El default puede llamarse como el archivo o ser anonimo.
            base = os.path.basename(ruta)
            for clave in (base, 'default'):
                if clave in comps:
                    return comps[clave]
            md = re.search(r'export\s+default\s+(?:async\s+)?function\s+(\w+)', fuentes[destino])
            if md and md.group(1) in comps:
                return comps[md.group(1)]
            return None
        return comps.get(exportado)

    revisados = usos_totales = 0
    for rel in sorted(fuentes):
        problemas = []
        for nombre, props, spread, linea in usos_jsx(fuentes[rel]):
            info = resuelve(rel, nombre)
            if info is None:
                continue                       # de node_modules: fuera de alcance
            declaradas, permisivo, legible = info
            usos_totales += 1
            if not legible:
                sin_verificar.append(f'{rel}:{linea} <{nombre}>')
                continue
            revisados += 1

            if not permisivo:
                for p in props:
                    if p in declaradas or p in PROPS_LIBRES:
                        continue
                    pareja = PAREJAS.get(p.lower())
                    if pareja and pareja in declaradas:
                        problemas.append(
                            f'linea {linea}: <{nombre} {p}=...> — la interfaz la '
                            f'declara `{pareja}`, en espaniol se DESCARTA')
                    else:
                        problemas.append(
                            f'linea {linea}: <{nombre} {p}=...> — `{p}` no existe '
                            f'en la interfaz')

            if not spread:
                faltan = [p for p, oblig in declaradas.items()
                          if oblig and p not in props and p not in PROPS_LIBRES]
                for p in faltan:
                    problemas.append(
                        f'linea {linea}: <{nombre}> sin `{p}`, que es obligatoria')

        if problemas:
            fallas.extend(f'{rel}: {p}' for p in problemas)
            print(f'  {rel}')
            for p in problemas:
                print(f'      ** {p}')

    print(f'\n  {usos_totales} usos de componentes del repo · '
          f'{revisados} verificados')
    if sin_verificar:
        print(f'  {len(sin_verificar)} SIN VERIFICAR (tipo de props no legible, '
              f'NO son aprobados):')
        for u in sin_verificar[:15]:
            print(f'      - {u}')
        if len(sin_verificar) > 15:
            print(f'      - … y {len(sin_verificar) - 15} mas')

    if revisados == 0:
        print('\n  ** NO SE VERIFICO NI UN USO: el detector no esta midiendo '
              'nada. Esto es una FALLA, no un exito.')
        return 1
    if fallas:
        print(f'\n  {len(fallas)} FALLAS')
        return 1
    print('  ninguna prop desconocida ni obligatoria faltante')
    return 0


if __name__ == '__main__':
    sys.exit(main())
