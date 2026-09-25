# -*- coding: utf-8 -*-
"""Comprueba que todo lo que un archivo IMPORTA existe de verdad en el otro lado.

   POR QUE EXISTE
   --------------
   No hay Node en esta maquina, asi que no hay `tsc --noEmit` ni build local. Y
   `next.config.js` lleva `typescript: { ignoreBuildErrors: true }`, que tapa los
   errores de TIPO pero NO los de modulo: un `import { algoQueNoExiste }` si
   tumba el build de Vercel.

   Ese es justo el hueco que dejaban los otros detectores:
     - revisa-jsx.py            -> comentarios JSX mal puestos
     - revisa-cadenas-adyacentes -> concatenacion estilo Python
     - revisa-zona-muerta.py    -> leer una const antes de declararla
     - ESTE                     -> importar algo que el otro archivo no exporta

   Nacio de un commit que renombro `ticketStatsCuenta` por `soporteDeCuenta` en
   nueve archivos: cualquier import que se quedara atras habria tumbado el
   despliegue, y no habia forma de saberlo sin desplegar.

   USO
   ---
       python scripts/revisa-imports.py            # todo el repo
       python scripts/revisa-imports.py --cambiados # solo lo que toca el commit
"""
import io
import os
import re
import subprocess
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IGNORA = {'node_modules', '.next', '.git', 'supabase', 'out', 'dist'}
EXTS = ('.ts', '.tsx')

# ── Exportaciones ────────────────────────────────────────────────────
RE_EXP_DECL = re.compile(
    r'^\s*export\s+(?:declare\s+)?(?:async\s+)?'
    r'(?:function\*?|const|let|var|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)',
    re.M)
# `export const A = 1, B = 2`
RE_EXP_MULTI = re.compile(r'^\s*export\s+(?:const|let|var)\s+(.+?)(?:=|$)', re.M)
# Admite `export { A }`, `export type { A }` y las dos con `from '...'`: sin el
# `type` opcional, `export type { Rol } from './permisos'` no se veia y el
# detector acusaba de roto un import que estaba bien.
RE_EXP_LLAVES = re.compile(r'^\s*export\s+(?:type\s+)?\{([^}]*)\}', re.M)
RE_EXP_ESTRELLA = re.compile(r'^\s*export\s*\*\s*(?:as\s+[\w$]+\s*)?from\s*[\'"]([^\'"]+)[\'"]', re.M)
RE_EXP_DEFAULT = re.compile(r'^\s*export\s+default\b', re.M)

# ── Importaciones ────────────────────────────────────────────────────
RE_IMPORT = re.compile(
    r'^\s*import\s+(?:type\s+)?([\s\S]*?)\s*from\s*[\'"]([^\'"]+)[\'"]', re.M)


def sin_comentarios(src):
    """Quita bloques /* */ y lineas //, respetando cadenas simples."""
    out = []
    i, n = 0, len(src)
    while i < n:
        c = src[i]
        if c in '"\'`':
            q = c
            out.append(c)
            i += 1
            while i < n:
                if src[i] == '\\':
                    out.append(src[i:i + 2])
                    i += 2
                    continue
                out.append(src[i])
                if src[i] == q:
                    i += 1
                    break
                i += 1
            continue
        if src.startswith('//', i):
            j = src.find('\n', i)
            i = n if j < 0 else j
            continue
        if src.startswith('/*', i):
            j = src.find('*/', i + 2)
            i = n if j < 0 else j + 2
            out.append(' ')
            continue
        out.append(c)
        i += 1
    return ''.join(out)


def exportaciones(ruta, cache):
    """Nombres que `ruta` exporta. Sigue los `export * from`."""
    if ruta in cache:
        return cache[ruta]
    cache[ruta] = set()          # corta ciclos
    try:
        src = sin_comentarios(io.open(ruta, encoding='utf-8').read())
    except Exception:
        return cache[ruta]

    nombres = set()
    for m in RE_EXP_DECL.finditer(src):
        nombres.add(m.group(1))
    for m in RE_EXP_MULTI.finditer(src):
        # `export const A = 1, B = 2` -> A, B (ignora destructuring)
        trozo = m.group(1)
        if trozo.strip().startswith(('{', '[')):
            for w in re.findall(r'([A-Za-z_$][\w$]*)\s*[,:}\]]', trozo):
                nombres.add(w)
            continue
        for parte in trozo.split(','):
            w = re.match(r'\s*([A-Za-z_$][\w$]*)', parte)
            if w:
                nombres.add(w.group(1))
    for m in RE_EXP_LLAVES.finditer(src):
        for parte in m.group(1).split(','):
            parte = parte.strip().replace('type ', '')
            if not parte:
                continue
            alias = re.search(r'\bas\s+([A-Za-z_$][\w$]*)', parte)
            nombres.add(alias.group(1) if alias else re.split(r'\s+', parte)[0])
    if RE_EXP_DEFAULT.search(src):
        nombres.add('default')
    # re-exportaciones
    for m in RE_EXP_ESTRELLA.finditer(src):
        d = resuelve(m.group(1), ruta)
        if d:
            nombres |= exportaciones(d, cache)

    cache[ruta] = nombres
    return nombres


def resuelve(espec, desde):
    """Ruta en disco de un especificador, o None si es un paquete de npm."""
    if espec.startswith('@/'):
        base = os.path.join(RAIZ, espec[2:])
    elif espec.startswith('.'):
        base = os.path.normpath(os.path.join(os.path.dirname(desde), espec))
    else:
        return None                     # paquete de node_modules
    for cand in (base, base + '.ts', base + '.tsx', base + '.d.ts',
                 os.path.join(base, 'index.ts'), os.path.join(base, 'index.tsx')):
        if os.path.isfile(cand):
            return cand
    if os.path.isfile(base + '.json'):
        return base + '.json'           # JSON: default + claves, no se valida
    return None


def importaciones(ruta):
    """[(nombre_local, nombre_original, especificador, es_default, es_ns)]"""
    try:
        src = sin_comentarios(io.open(ruta, encoding='utf-8').read())
    except Exception:
        return []
    out = []
    for m in RE_IMPORT.finditer(src):
        clausula, espec = m.group(1).strip(), m.group(2)
        if not clausula:
            continue                    # import 'algo' (efecto secundario)
        # separa la parte por defecto de las llaves
        llaves = re.search(r'\{([\s\S]*)\}', clausula)
        antes = clausula[:llaves.start()] if llaves else clausula
        for parte in antes.split(','):
            parte = parte.strip().rstrip(',')
            if not parte:
                continue
            ns = re.match(r'\*\s*as\s+([A-Za-z_$][\w$]*)', parte)
            if ns:
                out.append((ns.group(1), '*', espec, False, True))
            elif re.match(r'^[A-Za-z_$][\w$]*$', parte):
                out.append((parte, 'default', espec, True, False))
        if llaves:
            for parte in llaves.group(1).split(','):
                parte = parte.strip()
                if not parte:
                    continue
                parte = re.sub(r'^type\s+', '', parte).strip()
                alias = re.search(r'\bas\s+([A-Za-z_$][\w$]*)', parte)
                orig = re.split(r'\s+as\s+', parte)[0].strip()
                if not re.match(r'^[A-Za-z_$][\w$]*$', orig):
                    continue
                out.append((alias.group(1) if alias else orig, orig, espec, False, False))
    return out


def archivos(solo=None):
    if solo:
        return [os.path.join(RAIZ, f) for f in solo
                if f.endswith(EXTS) and os.path.isfile(os.path.join(RAIZ, f))]
    out = []
    for dp, dn, fn in os.walk(RAIZ):
        dn[:] = [d for d in dn if d not in IGNORA and not d.startswith('.')]
        for f in fn:
            if f.endswith(EXTS):
                out.append(os.path.join(dp, f))
    return out


def cambiados():
    try:
        r = subprocess.run(['git', 'status', '--porcelain'], cwd=RAIZ,
                           capture_output=True, text=True, timeout=30)
        out = []
        for ln in r.stdout.splitlines():
            p = ln[3:].strip().strip('"')
            if ' -> ' in p:
                p = p.split(' -> ')[-1]
            out.append(p)
        return out
    except Exception:
        return []


def main():
    solo = cambiados() if '--cambiados' in sys.argv else None
    lista = archivos(solo)
    cache = {}
    problemas = []
    revisados = 0

    for ruta in sorted(lista):
        rel = os.path.relpath(ruta, RAIZ).replace('\\', '/')
        revisados += 1
        for local, orig, espec, es_def, es_ns in importaciones(ruta):
            destino = resuelve(espec, ruta)
            if destino is None or destino.endswith('.json'):
                continue                # npm o JSON: fuera de alcance
            if es_ns:
                continue
            exps = exportaciones(destino, cache)
            if not exps:
                continue                # no se pudo leer: no se inventa un fallo
            if orig not in exps:
                problemas.append((rel, orig, os.path.relpath(destino, RAIZ).replace('\\', '/'),
                                  sorted(exps)[:8]))

    print('  %d archivo(s) revisados.' % revisados)
    if not problemas:
        print('  todos los imports apuntan a algo que existe.')
        return 0

    print()
    for rel, nombre, destino, muestra in problemas:
        print('  *** %s' % rel)
        print('      importa `%s` de %s, que NO lo exporta.' % (nombre, destino))
        print('      alli hay: %s%s' % (', '.join(muestra), ' ...' if len(muestra) >= 8 else ''))
        print()
    print('  *** %d import(s) roto(s). Cada uno tumba el build de Vercel.' % len(problemas))
    return 1


if __name__ == '__main__':
    sys.exit(main())
