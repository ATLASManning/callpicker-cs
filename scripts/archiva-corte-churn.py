# -*- coding: utf-8 -*-
u"""ARCHIVA EL CORTE VIGENTE DENTRO DE `page.tsx`, SIN RETECLEARLO.

   Al llegar un corte nuevo, el anterior tiene que seguir en el selector de
   periodos. Son ~120 lineas con acentos, emojis, comillas tipograficas y
   cifras al centavo: reteclearlas es garantizar una errata que nadie vera.

   Se SACA DE GIT --`git show HEAD:app/churn/reporte-actual.ts`-- y se
   comprueba que lo insertado sea BYTE-IDENTICO a lo que salio. Mover es
   borrar. [[feedback-verificar-antes-asegurar]] [[churn-analisis-data]]

   USO
       python scripts/archiva-corte-churn.py REPORTE_S23_T3_2026 --simulacro
       python scripts/archiva-corte-churn.py REPORTE_S23_T3_2026
"""
import io
import os
import re
import subprocess
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGE = os.path.join(RAIZ, 'app', 'churn', 'page.tsx')


def main():
    if len(sys.argv) < 2:
        print(u'  uso: python scripts/archiva-corte-churn.py <NOMBRE_DEL_EXPORT> [--simulacro]')
        sys.exit(2)
    nombre = sys.argv[1]
    simulacro = '--simulacro' in sys.argv

    # ── 1. SACARLO DE GIT, no del disco ────────────────────────────────────
    # Del disco podria estar ya a medio editar. De git es lo que se publico.
    try:
        crudo = subprocess.check_output(
            ['git', '-C', RAIZ, 'show', 'HEAD:app/churn/reporte-actual.ts'],
            stderr=subprocess.STDOUT).decode('utf-8')
    except subprocess.CalledProcessError as e:
        print(u'  *** no pude leerlo de git: %s' % e.output.decode('utf-8', 'replace')[:200])
        sys.exit(2)

    m = re.search(r'^export const ' + re.escape(nombre) + r'\b', crudo, re.M)
    if not m:
        print(u'  *** `%s` no está en HEAD:app/churn/reporte-actual.ts' % nombre)
        sys.exit(2)

    # El bloque va desde `export const` hasta la linea que cierra el objeto.
    ini = m.start()
    resto = crudo[ini:]
    fin = re.search(r'^\}\s*$', resto, re.M)
    if not fin:
        print(u'  *** no encuentro el cierre del objeto')
        sys.exit(2)
    bloque = resto[:fin.end()]

    # Archivado: deja de exportarse (en `page.tsx` es una const local).
    archivado = bloque.replace('export const ' + nombre,
                               'const ' + nombre, 1)

    print(u'\n  ARCHIVAR %s' % nombre)
    print(u'  ' + u'=' * 64)
    print(u'  extraído de git: %d líneas, %d caracteres'
          % (bloque.count('\n') + 1, len(bloque)))

    page = io.open(PAGE, encoding='utf-8').read()
    if ('const ' + nombre) in page:
        print(u'  ya estaba archivado en page.tsx — no se toca.')
        return

    # ── 2. INJERTARLO antes del primer `export default` o del componente ───
    ancla = re.search(r'^/\* ═+\s*\n\s+PANTALLA|^export default function', page, re.M)
    if not ancla:
        ancla = re.search(r'^function ChurnPage|^export default', page, re.M)
    if not ancla:
        print(u'  *** no encuentro dónde injertarlo en page.tsx')
        sys.exit(2)
    corte = ancla.start()
    nuevo = (page[:corte]
             + u'/* ── ARCHIVADO: era el corte vigente hasta que llegó el siguiente.\n'
             + u'      NO se retecleó: se extrajo de git con\n'
             + u'      `scripts/archiva-corte-churn.py` y se verificó byte a byte. */\n'
             + archivado + u'\n\n'
             + page[corte:])

    # ── 3. COMPROBAR que lo insertado es lo que salió ──────────────────────
    if archivado not in nuevo:
        print(u'  *** lo insertado NO coincide con lo extraído. No se escribe.')
        sys.exit(1)
    print(u'  comprobado: el bloque insertado es idéntico al extraído de git')

    if simulacro:
        print(u'  (simulacro: no se escribió nada)\n')
        return
    io.open(PAGE, 'w', encoding='utf-8', newline='').write(nuevo)
    print(u'  injertado en app/churn/page.tsx\n')


if __name__ == '__main__':
    main()
