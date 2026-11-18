#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
QUÉ CUESTA HOY QUE `alertas_episodios` GUARDE FECHAS Y NO INSTANTES
====================================================================

    python scripts/mide-costo-fecha-episodios.py

POR QUÉ EXISTE
--------------
La decisión 3 de la auditoría propone migrar `alertas_episodios` de `DATE` a
`TIMESTAMPTZ` para poder expresar los SLA en horas que pide el §7 del prompt.
Es DDL sobre una tabla viva, «la operación más delicada de todo el plan».

Antes de pedirle a nadie que corra eso, hay que saber QUÉ se pierde hoy. La
lección del punto 4 es exactamente ésta: aquella decisión se contestó midiendo
—tres HTTP 504 en producción— en vez de repitiendo lo que decía el código.

LO QUE MIDE
-----------
1. El TIPO real de las columnas de fecha, deducido del formato que devuelve la
   API: `2026-11-18` es DATE; `2026-11-18T07:14:22+00:00` es TIMESTAMPTZ.
   Deducirlo del archivo de migración sería leer la intención, no el estado:
   esa tabla ya se alteró al menos una vez fuera de ese archivo.
2. Cuántos episodios abren y cierran EL MISMO DÍA. Son los que hoy duran
   «0 días», un número que no distingue veinte minutos de veintitrés horas.
3. Cuántos tienen `condicion_desde`, que es la fecha con la que se calcularía
   cualquier SLA.
4. La antigüedad de los abiertos, para saber si el reloj que ya existe se mide
   en días o si alguien necesitaría horas.

NO MIGRA NADA. Sólo lee.
"""
import json
import os
import sys
import urllib.error
import urllib.request
from collections import Counter
from datetime import date, datetime
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent


def env(clave: str) -> str:
    ruta = RAIZ / '.env.local'
    if not ruta.exists():
        sys.exit('FALTA .env.local')
    for linea in ruta.read_text(encoding='utf-8', errors='replace').splitlines():
        linea = linea.strip()
        if linea.startswith(clave + '='):
            v = linea.split('=', 1)[1].strip().strip('"').strip("'")
            if v:
                return v
    sys.exit(f'.env.local no declara {clave}')


def pide(url: str, key: str) -> list:
    req = urllib.request.Request(url, headers={
        'apikey': key, 'Authorization': 'Bearer ' + key,
    })
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode('utf-8'))


def tipo_de(valor) -> str:
    """DATE o TIMESTAMPTZ, deducido del formato. `None` no dice nada."""
    if valor is None:
        return 'sin dato en esta fila'
    s = str(valor)
    if len(s) == 10 and s[4] == '-' and s[7] == '-':
        return 'DATE'
    if 'T' in s or ':' in s:
        return 'TIMESTAMPTZ (ya tiene hora)'
    return f'desconocido ({s!r})'


def main() -> int:
    base = env('NEXT_PUBLIC_SUPABASE_URL').rstrip('/')
    key = env('SUPABASE_SERVICE_ROLE_KEY')

    print('')
    print('  QUÉ CUESTA HOY EL `DATE` EN alertas_episodios')
    print('  ' + '=' * 72)

    url = (f'{base}/rest/v1/alertas_episodios'
           '?select=id,estado,condicion,abierto_en,condicion_desde,cerrado_en,'
           'confirmada_el&limit=5000')
    try:
        filas = pide(url, key)
    except urllib.error.HTTPError as e:
        print(f'  NO SE PUDO LEER LA TABLA: HTTP {e.code}')
        print('  Eso NO es «no hay episodios»: es que no se midió.')
        return 1
    except urllib.error.URLError as e:
        print(f'  NO SE PUDO LEER LA TABLA: {e}')
        return 1

    if not filas:
        print('  La tabla respondió, y está VACÍA. Es un cero medido.')
        return 0

    print(f'\n  {len(filas)} episodios leídos')

    # ── 1 · EL TIPO REAL ────────────────────────────────────────────────────
    print('')
    print('  1 · EL TIPO REAL DE CADA COLUMNA DE FECHA')
    print('  ' + '-' * 72)
    for col in ('abierto_en', 'condicion_desde', 'cerrado_en', 'confirmada_el'):
        tipos = Counter(tipo_de(f.get(col)) for f in filas)
        # Se imprime el reparto entero: si una columna trajera DOS formatos,
        # quedarse con el más común escondería justo la anomalía.
        detalle = ' · '.join(f'{t}: {n}' for t, n in tipos.most_common())
        print(f'    {col:<18} {detalle}')

    # ── 2 · LOS QUE ABREN Y CIERRAN EL MISMO DÍA ────────────────────────────
    print('')
    print('  2 · EPISODIOS QUE HOY DURAN «0 DÍAS»')
    print('  ' + '-' * 72)
    cerrados = [f for f in filas if f.get('cerrado_en')]
    mismo_dia = [f for f in cerrados
                 if str(f.get('cerrado_en'))[:10] == str(f.get('abierto_en'))[:10]]
    print(f'    episodios cerrados ................... {len(cerrados)}')
    print(f'    abiertos y cerrados el MISMO día ..... {len(mismo_dia)}')
    if cerrados:
        pct = len(mismo_dia) / len(cerrados) * 100
        print(f'    o sea el {pct:.1f}% de los cerrados')
    print('    Ésos son los que un SLA en horas no puede medir hoy: su duración')
    print('    es 0 días, y 0 días no distingue veinte minutos de veintitrés horas.')

    # ── 3 · LA FECHA CON LA QUE SE CALCULARÍA EL SLA ────────────────────────
    print('')
    print('  3 · `condicion_desde`, QUE ES CONTRA LO QUE CORRE EL RELOJ')
    print('  ' + '-' * 72)
    con = sum(1 for f in filas if f.get('condicion_desde'))
    print(f'    episodios con condicion_desde ........ {con} de {len(filas)}'
          f' ({con / len(filas) * 100:.1f}%)')
    print(f'    sin ella ............................. {len(filas) - con}')
    print('    Sin `condicion_desde` no hay SLA que medir, ni en días ni en')
    print('    horas: migrar el tipo no la rellena.')

    # ── 4 · LA ANTIGÜEDAD DE LOS ABIERTOS ───────────────────────────────────
    print('')
    print('  4 · ANTIGÜEDAD DE LOS ABIERTOS')
    print('  ' + '-' * 72)
    hoy = date.today()
    abiertos = [f for f in filas if f.get('estado') == 'abierta' and f.get('abierto_en')]
    edades = []
    for f in abiertos:
        try:
            d = datetime.strptime(str(f['abierto_en'])[:10], '%Y-%m-%d').date()
            edades.append((hoy - d).days)
        except ValueError:
            pass
    if not edades:
        print('    NO MEDIDO: ningún abierto trae fecha legible.')
    else:
        edades.sort()
        menos_de_un_dia = sum(1 for d in edades if d < 1)
        print(f'    abiertos ............................. {len(abiertos)}')
        print(f'    con menos de 1 día ................... {menos_de_un_dia}')
        print(f'    mediana .............................. {edades[len(edades)//2]} días')
        print(f'    más antiguo .......................... {edades[-1]} días')
        print('    Si casi ninguno vive menos de un día, el reloj que existe se')
        print('    mide en días y la urgencia por las horas es del PROMPT, no de')
        print('    la operación de hoy. Es un dato para decidir, no una excusa.')

    print('')
    print('  Esto NO migró nada. Sólo leyó.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
