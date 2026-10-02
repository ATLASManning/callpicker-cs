# -*- coding: utf-8 -*-
"""Comprueba que cada caso de Auditoria este completo y bien registrado.

   POR QUE EXISTE
   --------------
   No hay Node en la maquina, y `next.config.js` trae
   `typescript: { ignoreBuildErrors: true }`: un caso al que le falte un campo
   OBLIGATORIO de `AuditoriaCase` compila igual y revienta —o peor, se pinta
   vacio— hasta que alguien abre esa pantalla. Son 30+ archivos escritos a
   mano a lo largo de meses; el error natural es olvidar un campo al agregar
   el numero 35.

   QUE COMPRUEBA
   -------------
   1. Todo campo NO opcional de `types.ts` existe en cada `*-data.ts`.
   2. Ningun campo obligatorio quedo vacio ('' o []).
   3. Todo caso esta importado Y listado en `cases.ts` (son dos pasos y se
      olvida el segundo).
   4. El `id` del archivo coincide con el del registro en `registry.ts`, y
      `registry.ts` no apunta a ningun id inexistente.
   5. `estado` y los `tipo` de la cronologia usan valores del union de tipos.

   USO
   ---
       python scripts/revisa-casos-auditoria.py
"""
import io
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIR = os.path.join(RAIZ, 'app', 'auditoria')
fallas = []


def lee(nombre):
    with io.open(os.path.join(DIR, nombre), encoding='utf-8') as f:
        return f.read()


def campos_de_types():
    """Saca los campos de `AuditoriaCase`: los opcionales llevan `?:`."""
    t = lee('types.ts')
    cuerpo = t.split('export interface AuditoriaCase {', 1)[1]
    # Cortar en la llave de cierre de la interfaz, al nivel 0.
    nivel, fin = 1, 0
    for i, c in enumerate(cuerpo):
        if c == '{':
            nivel += 1
        elif c == '}':
            nivel -= 1
            if nivel == 0:
                fin = i
                break
    cuerpo = cuerpo[:fin]
    # Solo declaraciones al margen izquierdo de la interfaz (2 espacios).
    obliga, opc = [], []
    for m in re.finditer(r'^  (\w+)(\??)\s*:', cuerpo, re.M):
        (opc if m.group(2) else obliga).append(m.group(1))
    return obliga, opc


def main():
    obligatorios, opcionales = campos_de_types()
    print(f'  AuditoriaCase: {len(obligatorios)} campos obligatorios · '
          f'{len(opcionales)} opcionales\n')

    archivos = sorted(f for f in os.listdir(DIR) if f.endswith('-data.ts'))
    cases = lee('cases.ts')
    registry = lee('registry.ts')
    ids_registry = set(re.findall(r"\{\s*id:\s*'([^']+)'", registry))

    ids_vistos = {}
    for arch in archivos:
        s = lee(arch)
        m = re.search(r"export const (\w+)\s*:\s*AuditoriaCase\s*=\s*\{", s)
        if not m:
            fallas.append(f'{arch}: no exporta un AuditoriaCase')
            print(f'  {arch:<36} ** no exporta un AuditoriaCase')
            continue
        const = m.group(1)
        mid = re.search(r"^\s*id:\s*'([^']+)'", s, re.M)
        cid = mid.group(1) if mid else '(sin id)'
        ids_vistos[cid] = arch

        problemas = []
        for campo in obligatorios:
            if not re.search(r'^\s{2}' + campo + r'\s*:', s, re.M):
                problemas.append(f'falta `{campo}`')
                continue
            # Vacio evidente: '' o [] justo despues del campo
            if re.search(r'^\s{2}' + campo + r"\s*:\s*(''|\"\"|\[\s*\]),?\s*$", s, re.M):
                problemas.append(f'`{campo}` vacio')

        if f'import {{ {const} }}' not in cases and f'{{ {const} }}' not in cases:
            problemas.append('no esta importado en cases.ts')
        elif not re.search(r'\b' + const + r'\b\s*,', cases.split('STATIC_CASES')[1]):
            problemas.append('importado pero NO listado en STATIC_CASES')

        if cid not in ids_registry:
            problemas.append(f'id «{cid}» no esta en registry.ts')

        est = re.search(r"^\s{2}estado:\s*'([^']+)'", s, re.M)
        validos = {'rescatable', 'en_riesgo', 'recuperado', 'perdido', 'activo', 'en_recuperacion'}
        if est and est.group(1) not in validos:
            problemas.append(f'estado invalido «{est.group(1)}»')

        malos_tipo = {t for t in re.findall(r"tipo:\s*'([^']+)'", s)} - {
            'problema', 'pivote', 'ok', 'neutral'}
        if malos_tipo:
            problemas.append(f'tipo de evento invalido: {", ".join(sorted(malos_tipo))}')

        if problemas:
            fallas.extend(f'{arch}: {p}' for p in problemas)
            print(f'  {arch:<36} ** {" · ".join(problemas)}')
        else:
            print(f'  {arch:<36} ok')

    # registry.ts no debe apuntar a casos que no existen
    print()
    huerfanos = ids_registry - set(ids_vistos)
    if huerfanos:
        fallas.append(f'registry.ts apunta a ids inexistentes: {", ".join(sorted(huerfanos))}')
        print(f'  ** registry.ts apunta a ids que no existen: {", ".join(sorted(huerfanos))}')

    print(f'\n  {len(archivos)} casos revisados')
    if fallas:
        print(f'  {len(fallas)} FALLAS')
        return 1
    print('  todos completos y registrados')
    return 0


if __name__ == '__main__':
    sys.exit(main())
