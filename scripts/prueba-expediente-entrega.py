#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
PRUEBA EL EXPEDIENTE DE ENTREGA CONTRA EL SERVIDOR, NO CONTRA MI CABEZA
=======================================================================

Pide `/api/entregas/expediente?id=<ID>` al servidor que esté corriendo y
comprueba que la respuesta cierra: que trae los 20 apartados, que las cinco
cuentas del resumen suman 20, y que ningún apartado sale con un estado que el
catálogo no declara.

POR QUÉ HACE FALTA UN GUION Y NO BASTA ABRIR LA PÁGINA
------------------------------------------------------
La ruta vive detrás del middleware, así que un navegador sin sesión recibe la
pantalla de login —con HTTP 200, que es la trampa de siempre—. El camino de
máquina documentado del proyecto es el bearer `CRON_SECRET`, que este guion LEE
de `.env.local` y NO imprime nunca.

Uso:
    python scripts/prueba-expediente-entrega.py 162474
    python scripts/prueba-expediente-entrega.py 162474 --puerto 3100 --guarda ruta.json

`--guarda` escribe la respuesta tal cual para poder mirar el render con datos
de verdad. El archivo lleva datos de cliente: va al scratchpad, nunca a
`public/`.
"""
import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
ESTADOS = {'completo', 'falta', 'otra_fuente', 'sin_fuente', 'no_medible'}


def secreto() -> str:
    """Lee CRON_SECRET de .env.local. No se imprime, ni completo ni en trozos."""
    env = RAIZ / '.env.local'
    if not env.exists():
        sys.exit('FALTA .env.local — sin el bearer no se puede pasar el middleware.')
    for linea in env.read_text(encoding='utf-8', errors='replace').splitlines():
        linea = linea.strip()
        if linea.startswith('CRON_SECRET='):
            v = linea.split('=', 1)[1].strip().strip('"').strip("'")
            if v:
                return v
    sys.exit('.env.local no declara CRON_SECRET.')


def prueba_busqueda(texto: str, puerto: str) -> int:
    """El buscador tiene que alcanzar las 2,820, no sólo el año vivo."""
    url = (f'http://localhost:{puerto}/api/entregas/buscar'
           f'?q={urllib.parse.quote(texto)}')
    req = urllib.request.Request(url, headers={'Authorization': f'Bearer {secreto()}'})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            tipo = (r.headers.get('content-type') or '').lower()
            cuerpo = r.read().decode('utf-8', errors='replace')
    except urllib.error.URLError as e:
        print(f'NO SE PUDO LLAMAR AL SERVIDOR: {e}')
        return 1
    if 'json' not in tipo:
        print(f'EL SERVIDOR NO RESPONDIÓ JSON sino «{tipo or "sin tipo"}».')
        return 1

    d = json.loads(cuerpo)
    if 'error' in d:
        print(f'EL ENDPOINT DEVOLVIÓ UN ERROR: {d["error"]}')
        return 1

    print(f'«{texto}» -> {d["coincidencias"]} coincidencia(s) '
          f'de {d["totalEnLaHoja"]} activaciones · se devuelven {d["devueltos"]}'
          + (' (RECORTADO)' if d.get('recortado') else ''))
    if d.get('cuentasError'):
        print(f'  EL APARTADO CUENTAS NO SE PUDO LEER: {d["cuentasError"]}')
        print('  (el distintivo de estos resultados NO está medido)')

    por_distintivo = {}
    anos = set()
    for r in d['resultados'][:200]:
        c = r['clasificacion']
        clave = c['distintivo'] + (f' · {c["motivo"]}' if c['motivo'] else '')
        por_distintivo[clave] = por_distintivo.get(clave, 0) + 1
        if r['ano']:
            anos.add(r['ano'])
    for k, n in sorted(por_distintivo.items()):
        print(f'  {n:>4}  {k}')
    if anos:
        print(f'  años presentes: {", ".join(sorted(anos))}')
    for r in d['resultados'][:8]:
        c = r['clasificacion']
        falta = ', '.join(x['etiqueta'] for x in c['faltan'])
        print(f'    [{c["distintivo"]:<7}] {r["cliente"][:38]:<38} {r["id"]} '
              f'{r["ano"]}{("  falta: " + falta) if falta else ""}')
    return 0


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument('id', help='ID de la activación, tal como viene en la hoja')
    p.add_argument('--puerto', default='3100')
    p.add_argument('--guarda', default=None)
    p.add_argument('--buscar', default=None,
                   help='En vez del expediente, prueba /api/entregas/buscar con este texto')
    a = p.parse_args()

    if a.buscar is not None:
        return prueba_busqueda(a.buscar, a.puerto)

    url = f'http://localhost:{a.puerto}/api/entregas/expediente?id={a.id}'
    req = urllib.request.Request(url, headers={'Authorization': f'Bearer {secreto()}'})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            tipo = (r.headers.get('content-type') or '').lower()
            cuerpo = r.read().decode('utf-8', errors='replace')
    except urllib.error.URLError as e:
        return int(bool(print(f'NO SE PUDO LLAMAR AL SERVIDOR: {e}\n'
                              f'  ¿Está corriendo `next dev` en el puerto {a.puerto}?')))

    # El login llega con 200 y text/html: no es «la cuenta no existe».
    if 'json' not in tipo:
        print(f'EL SERVIDOR NO RESPONDIÓ JSON sino «{tipo or "sin tipo"}».')
        print('  Con HTML esto es la pantalla de acceso: el bearer no fue aceptado.')
        return 1

    d = json.loads(cuerpo)
    if 'error' in d:
        print(f'EL ENDPOINT DEVOLVIÓ UN ERROR: {d["error"]}')
        return 1

    aps = d.get('apartados') or []
    r = d.get('resumen') or {}
    fallos = []

    if len(aps) != 20:
        fallos.append(f'llegaron {len(aps)} apartados, no 20')

    malos = sorted({x.get('estado') for x in aps} - ESTADOS)
    if malos:
        fallos.append(f'estados que el catálogo no declara: {malos}')

    suma = sum(int(r.get(k, 0)) for k in
               ('completos', 'faltan', 'otraFuente', 'sinFuente', 'noMedibles'))
    if suma != len(aps):
        fallos.append(f'el resumen suma {suma} y hay {len(aps)} apartados')

    # Un apartado sin título o sin fuente declarada es un hueco silencioso.
    mudos = [x.get('clave') for x in aps if not x.get('titulo') or not x.get('fuente')]
    if mudos:
        fallos.append(f'apartados sin título o sin fuente: {mudos}')

    # El distintivo viaja en la MISMA respuesta que los apartados, porque la
    # ficha del cliente lo pinta junto a ellos. Si faltara, la etiqueta de la
    # ficha se quedaría muda y nadie se enteraría mirando la pantalla.
    cla = d.get('clasificacion')
    if not isinstance(cla, dict):
        fallos.append('la respuesta no trae `clasificacion`: la ficha no podría '
                      'pintar la etiqueta Cliente/Cuenta')
    else:
        if cla.get('distintivo') not in ('cliente', 'cuenta'):
            fallos.append(f'distintivo que no existe: {cla.get("distintivo")!r}')
        if not (cla.get('porque') or '').strip():
            fallos.append('la clasificación no dice POR QUÉ')
        # Un «cuenta» sin motivo no se puede explicar a quien la capturó.
        if cla.get('distintivo') == 'cuenta' and not cla.get('motivo'):
            fallos.append('sale «cuenta» y no declara motivo')
        if cla.get('motivo') == 'incompleta' and not cla.get('faltan'):
            fallos.append('dice «incompleta» y no nombra qué falta')

    print(f'{d.get("cliente", "?")} — ID {d.get("id")} · CID {d.get("cid") or "(sin CID)"}')
    print(f'  {len(aps)} apartados · completos {r.get("completos")} · faltan {r.get("faltan")} '
          f'· otra fuente {r.get("otraFuente")} · sin fuente {r.get("sinFuente")} '
          f'· no medibles {r.get("noMedibles")}')
    f = d.get('fuentes') or {}
    print(f'  cartera CS: {"sí" if f.get("cuentaEnCartera") else "no"}'
          f' · GRC: {"sí" if f.get("enGrc") else "no"}'
          f' · contrato: {"sí" if f.get("conContrato") else "no"}'
          f' · DIDs: {f.get("didsEncontrados")}')
    if f.get('cuentaError'):
        print(f'  LA FICHA DE LA CUENTA NO SE PUDO LEER: {f["cuentaError"]}')
        print('  (eso NO es «la cuenta no tiene datos»)')
    if isinstance(cla, dict):
        etiqueta = ('CLIENTE' if cla.get('distintivo') == 'cliente'
                    else 'SIN MEDIR' if cla.get('motivo') == 'no_medido' else 'CUENTA')
        print(f'  etiqueta de la ficha: [{etiqueta}] motivo {cla.get("motivo") or "-"}')
        print(f'    {cla.get("porque")}')
        for x in cla.get('faltan') or []:
            print(f'    falta: {x.get("etiqueta")} ({x.get("dueno")})')

    for x in aps:
        print(f'  {x.get("clave")} [{x.get("estado"):<11}] {x.get("titulo")}')
        if x.get('valor'):
            print(f'       {x["valor"][:160]}')

    if a.guarda:
        Path(a.guarda).write_text(cuerpo, encoding='utf-8')
        print(f'\nRespuesta guardada en {a.guarda}')

    if fallos:
        print('\nLA RESPUESTA NO CIERRA:')
        for x in fallos:
            print(f'  - {x}')
        return 1

    print('\nLa respuesta cierra: 20 apartados, estados declarados, resumen cuadrado.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
