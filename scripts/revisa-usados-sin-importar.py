# -*- coding: utf-8 -*-
"""Identificadores que un archivo USA y no importa, pero que otro modulo exporta.

   POR QUE EXISTE
   --------------
   El 28 de septiembre de 2026 la generacion semanal de actividades devolvio 500
   en los tres asesores: «ReferenceError: hoyEnMexico is not defined». La funcion
   existe en lib/fecha-local.ts y el archivo que la llamaba importaba sus
   vecinas —`ahoraEnMexico`, `fechaLocal`, `selloMexico`— pero no a ella.

   Es la SEGUNDA vez que pasa lo mismo. La primera fue `fechaVencimiento` usada
   fuera de su ambito, y entonces ya se comprobo que los cinco detectores no lo
   ven: `revisa-imports.py` verifica que lo importado EXISTA, no que lo usado
   este importado. Son preguntas inversas.

   Y no lo ve nadie mas: `next.config.js` lleva `typescript: { ignoreBuildErrors:
   true }`, asi que el build pasa limpio; el error solo aparece cuando alguien
   pulsa el boton en produccion.

   POR QUE ESTE SI FUNCIONA Y EL DE AMBITO NO
   ------------------------------------------
   Ya se intento un analisis de ambito general y se descarto: daba 2,696 falsos
   positivos porque sin un parser de verdad no se distinguen parametros, valores
   por defecto ni miembros de tipos. Esto es MUCHO mas estrecho y por eso es
   fiable: solo mira identificadores que (a) el archivo usa como llamada o como
   componente JSX, (b) OTRO modulo del proyecto exporta con ese mismo nombre, y
   (c) este archivo no importa ni declara. Un nombre que coincide con un export
   del propio proyecto y no viene de ningun lado es casi siempre el bug.

   Es de SOLO LECTURA.

   USO
   ---
       python scripts/revisa-usados-sin-importar.py
"""
import io
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CARPETAS = ('app', 'components', 'lib')
SALTAR = ('node_modules', '.next', '.git', 'scripts')

# Exports que NO valen como pista: nombres tan comunes que la coincidencia seria
# casual mas que reveladora.
RUIDO = {
    'default', 'GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'metadata', 'dynamic',
    'revalidate', 'runtime', 'maxDuration', 'config', 'generateMetadata',
}


def archivos():
    for base in CARPETAS:
        for dp, dn, fn in os.walk(os.path.join(RAIZ, base)):
            dn[:] = [d for d in dn if d not in SALTAR]
            for f in fn:
                if f.endswith(('.ts', '.tsx')):
                    yield os.path.join(dp, f)


def sin_comentarios(s):
    """Quita cadenas y comentarios para no leer codigo dentro de texto."""
    s = re.sub(r'/\*[\s\S]*?\*/', ' ', s)
    s = re.sub(r'(?m)//.*$', ' ', s)
    s = re.sub(r'`(?:[^`\\]|\\.)*`', '``', s)
    s = re.sub(r"'(?:[^'\\\n]|\\.)*'", "''", s)
    s = re.sub(r'"(?:[^"\\\n]|\\.)*"', '""', s)
    return s


# ── 1. Todo lo que el proyecto exporta ───────────────────────────────
EXPORTA = {}
RX_EXPORT = re.compile(
    r'^export\s+(?:async\s+)?(?:function|const|let|var|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)',
    re.M)
RX_EXPORT_LLAVES = re.compile(r'^export\s*\{([^}]*)\}', re.M)

for ruta in archivos():
    s = sin_comentarios(io.open(ruta, encoding='utf-8').read())
    for m in RX_EXPORT.finditer(s):
        EXPORTA.setdefault(m.group(1), set()).add(ruta)
    for m in RX_EXPORT_LLAVES.finditer(s):
        for parte in m.group(1).split(','):
            parte = parte.strip()
            if not parte:
                continue
            nombre = parte.split(' as ')[-1].strip().lstrip('type ').strip()
            if re.fullmatch(r'[A-Za-z_$][\w$]*', nombre):
                EXPORTA.setdefault(nombre, set()).add(ruta)

for k in RUIDO:
    EXPORTA.pop(k, None)


# ── 2. Por archivo: que importa, que declara, que usa ─────────────────
RX_IMPORT = re.compile(r'import\s+([\s\S]*?)\s+from\s+[\'"]', re.M)
RX_DECLARA = re.compile(
    r'(?:^|\s)(?:export\s+)?(?:async\s+)?'
    r'(?:function|const|let|var|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)')
# Desestructuracion: const { a, b } = ...  y  const [a, b] = ...
RX_DESTR = re.compile(r'(?:const|let|var)\s*[{\[]([^}\]]*)[}\]]\s*=')
# Uso: llamada `foo(` o componente JSX `<Foo`.
#
# El `(?<![.\w$?])` es lo que vuelve fiable al detector: sin el, `prov.buscar()`
# y `obj?.disponible()` se leian como llamadas sueltas y producian dos falsos
# positivos en lib/enriquecimiento/servicio.ts. Un METODO no tiene que
# importarse — viene con su objeto.
RX_USO_LLAMADA = re.compile(r'(?<![.\w$?])([a-z_$][\w$]*)\s*\(')
RX_USO_JSX = re.compile(r'<([A-Z][\w$]*)[\s/>]')


def nombres_importados(s):
    out = set()
    for m in RX_IMPORT.finditer(s):
        bloque = m.group(1)
        # default y namespace
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
    return out


hallazgos = []
n_arch = 0
for ruta in archivos():
    n_arch += 1
    crudo = io.open(ruta, encoding='utf-8').read()
    s = sin_comentarios(crudo)
    importados = nombres_importados(s)
    declarados = set(RX_DECLARA.findall(s))
    for m in RX_DESTR.finditer(s):
        for parte in m.group(1).split(','):
            nombre = parte.split(':')[-1].split('=')[0].strip().lstrip('.')
            if re.fullmatch(r'[A-Za-z_$][\w$]*', nombre):
                declarados.add(nombre)
    # parametros de funcion y de flecha, a lo bruto pero suficiente
    for m in re.finditer(r'\(([^)]*)\)\s*(?:=>|\{|:)', s):
        for parte in m.group(1).split(','):
            nombre = parte.split(':')[0].split('=')[0].strip().lstrip('.')
            if re.fullmatch(r'[A-Za-z_$][\w$]*', nombre):
                declarados.add(nombre)

    conocidos = importados | declarados
    usados = set(RX_USO_LLAMADA.findall(s)) | set(RX_USO_JSX.findall(s))
    for u in sorted(usados):
        if u in conocidos or u not in EXPORTA:
            continue
        # ¿el propio archivo es quien lo exporta?
        if ruta in EXPORTA[u]:
            continue
        linea = next((i + 1 for i, ln in enumerate(crudo.split('\n'))
                      if re.search(r'\b%s\s*[(<]' % re.escape(u), ln)), 0)
        donde = sorted(os.path.relpath(x, RAIZ).replace('\\', '/') for x in EXPORTA[u])
        hallazgos.append((os.path.relpath(ruta, RAIZ).replace('\\', '/'), linea, u, donde))

print('  %d archivo(s) revisados · %d nombres exportados en el proyecto.'
      % (n_arch, len(EXPORTA)))
if not hallazgos:
    print('  nada que se use sin importar.')
    sys.exit(0)

print()
print('  *** SE USAN SIN IMPORTAR — esto revienta en tiempo de ejecucion ***')
for ruta, linea, nombre, donde in hallazgos:
    print('  %s:%d' % (ruta, linea))
    print('      usa `%s()` y no lo importa. Lo exporta: %s' % (nombre, ', '.join(donde[:3])))
sys.exit(1)
