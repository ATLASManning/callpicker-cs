# -*- coding: utf-8 -*-
"""Fechas formateadas en el SERVIDOR sin decir en que zona.

   POR QUE EXISTE
   --------------
   `toLocaleDateString('es-MX', ...)` sin `timeZone` usa la zona del proceso. En
   el navegador eso es Mexico y sale bien; en el servidor, Vercel va en UTC y
   sale mal. Medido en produccion el 30 de septiembre de 2026, a las 19:05 de
   Mexico, la portada y Seguimiento decian «jueves, 1 de octubre de 2026».

   Falla todos los dias de 18:00 a medianoche —una cuarta parte del dia— y nunca
   en horario de oficina. Por eso llevaba tanto sin notarse, y por eso hace falta
   un detector: no es la clase de fallo que alguien tropiece.

   LA SEGUNDA PASADA, QUE ES LA RAZON DE QUE ESTO SEA UN SCRIPT
   -----------------------------------------------------------
   La barrida de ese dia busco `toLocaleDateString` y arreglo once sitios. El
   pie de la portada usaba `toLocaleString` con `dateStyle`/`timeStyle` y quedo
   fuera: el encabezado y el pie de la MISMA pantalla daban dias distintos.
   Lo encontro una revision adversarial, no la barrida. Un detector no se cansa
   ni se acuerda a medias.

   QUE BUSCA
   ---------
   En archivos SIN 'use client' —o sea, los que corren en el servidor—, toda
   llamada a `toLocaleDateString`, `toLocaleTimeString` o `toLocaleString` con
   `dateStyle`/`timeStyle` que no lleve `timeZone`.

   Lo que NO marca: `n.toLocaleString('es-MX')` sobre un NUMERO, que es
   separador de miles y no tiene zona; y los componentes de cliente, donde el
   navegador del usuario ya esta en Mexico.

   COMO SE ARREGLA
   ---------------
   Con `textoFecha` / `hoyEnPalabras` / `selloMexico` de lib/fecha-local.ts.
   OJO: `textoFecha` distingue un instante de una fecha sin hora, y ponerle
   `timeZone` a mano a una fecha sin hora la corre al dia ANTERIOR. Leer su
   documentacion antes de inventar un atajo.

   USO
   ---
       python scripts/revisa-fechas-sin-zona.py
"""
import glob
import io
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Una llamada a toLocale* y lo que venga hasta cerrar su parentesis en la linea.
LLAMADA = re.compile(r'\.(toLocaleDateString|toLocaleTimeString|toLocaleString)\s*\(([^\n]*)')
# Un toLocaleString que solo formatea un numero: `(123).toLocaleString('es-MX')`
# o `n.toLocaleString('es-MX')`, sin opciones de fecha.
SOLO_IDIOMA = re.compile(r"^\s*['\"][\w-]+['\"]\s*\)")

# ── LA SEGUNDA FAMILIA, anadida el 6 oct 2026 ────────────────────────────────
#
# No todo se rompe al FORMATEAR. Tambien se rompe al preguntar «que dia es hoy».
#
# `hoyLocal()` esta documentada en lib/fecha-local.ts como «el dia de hoy donde
# esta el USUARIO», y en un componente de cliente es exactamente lo correcto.
# En el servidor es UTC, o sea manana a partir de las 18:00 de Mexico.
#
# Lo encontro una auditoria adversarial, no este detector: lib/alertas-detectar.ts
# calculaba la antiguedad de TODAS las alertas con `hoyLocal()`, asi que cada
# tarde, durante seis horas, los «hace N dias» salian un dia inflados y los
# umbrales de silencio se cruzaban una jornada antes de tiempo. El detector
# miraba el formateo y no el calculo, que es la mitad que importa.
#
# `fechaLocal(new Date())` es la misma trampa escrita a mano, y por eso tambien
# se busca.
RELOJ_LOCAL = re.compile(r'\b(hoyLocal\s*\(\s*\)|fechaLocal\s*\(\s*new\s+Date\s*\(\s*\)\s*\))')


def es_cliente(ruta):
    cabeza = io.open(ruta, encoding='utf-8-sig').read(200)
    return "'use client'" in cabeza or '"use client"' in cabeza


def main():
    archivos = []
    for carpeta in ('app', 'lib', 'components'):
        archivos += glob.glob(os.path.join(RAIZ, carpeta, '**', '*.ts'), recursive=True)
        archivos += glob.glob(os.path.join(RAIZ, carpeta, '**', '*.tsx'), recursive=True)

    hallazgos = []
    for arch in sorted(set(archivos)):
        rel = os.path.relpath(arch, RAIZ).replace('\\', '/')
        if es_cliente(arch):
            continue
        # El archivo que DEFINE los ayudantes de fecha no puede denunciarse a si
        # mismo: `hoyLocal` tiene que llamar a `fechaLocal(new Date())` por
        # fuerza, que es justo lo que se persigue en los demas.
        es_la_fuente = rel == 'lib/fecha-local.ts'

        en_bloque = False
        for n, linea in enumerate(io.open(arch, encoding='utf-8-sig'), 1):
            # Un comentario que NOMBRA el problema no es el problema. Y hay que
            # seguir los bloques `/* ... */` linea por linea: la primera lleva su
            # marca, pero las de en medio no, y ahi es donde se explica el bug.
            desnuda = linea.strip()
            if en_bloque:
                if '*/' in linea:
                    en_bloque = False
                continue
            if desnuda.startswith('/*') and '*/' not in desnuda:
                en_bloque = True
                continue
            if desnuda.startswith('*') or desnuda.startswith('//') or desnuda.startswith('/*'):
                continue
            for m in LLAMADA.finditer(linea):
                metodo, resto = m.group(1), m.group(2)
                if 'timeZone' in linea:
                    continue
                if metodo == 'toLocaleString':
                    # Numero con separador de miles: ni fecha ni hora.
                    if SOLO_IDIOMA.match(resto):
                        continue
                    if not any(x in resto for x in ('dateStyle', 'timeStyle', 'weekday',
                                                    'year', 'month', 'day', 'hour', 'minute')):
                        continue
                hallazgos.append(('formato', rel, n, desnuda[:110]))

            if not es_la_fuente and RELOJ_LOCAL.search(linea):
                hallazgos.append(('reloj', rel, n, desnuda[:110]))

    if not hallazgos:
        print('ninguna fecha de servidor sale del reloj equivocado.')
        return 0

    fmt = [h for h in hallazgos if h[0] == 'formato']
    rel_ = [h for h in hallazgos if h[0] == 'reloj']

    if fmt:
        print(f'{len(fmt)} fecha(s) formateadas en SERVIDOR sin `timeZone`:\n')
        for _, rel, n, texto in fmt:
            print(f'  {rel}:{n}')
            print(f'      {texto}')
        print('\nEn el servidor eso es UTC, no Mexico: de 18:00 a medianoche muestran el')
        print('dia siguiente. Usar textoFecha / hoyEnPalabras / selloMexico de')
        print('lib/fecha-local.ts — y leer por que textoFecha decide sola la zona.')

    if rel_:
        if fmt:
            print()
        print(f'{len(rel_)} vez/veces que el SERVIDOR pregunta el dia a su propio reloj:\n')
        for _, rel, n, texto in rel_:
            print(f'  {rel}:{n}')
            print(f'      {texto}')
        print('\n`hoyLocal()` es «hoy donde esta el USUARIO» y solo vale en componentes')
        print("con 'use client'. En el servidor es UTC: a partir de las 18:00 de Mexico")
        print('ya devuelve manana, y toda cuenta de dias sale inflada. Usar hoyEnMexico().')
    return 1


if __name__ == '__main__':
    sys.exit(main())
