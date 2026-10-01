# -*- coding: utf-8 -*-
"""Mide las reuniones sin vinculo y vincula una, por id, a una cuenta.

   POR QUE EXISTE
   --------------
   El formulario de Reuniones muestra el combo de cliente en todos los tipos
   salvo One To One, y promete por escrito «Contara en el relacionamiento y en
   el Health Score de la cuenta». Pero `app/api/reuniones/route.ts` guardaba
   `cuenta_id: tipo === 'cliente' ? cuenta_id : null` y devolvia 200.

   O sea: se elegia la cuenta, se veia el mensaje verde, y el servidor tiraba
   el vinculo sin un solo error. Al 1 oct 2026 las 28 reuniones de tipo
   `cliente` estaban vinculadas y las 55 restantes NINGUNA.

   El codigo ya esta arreglado (lib/reuniones-tipo.ts es ahora la unica regla
   y la usan los dos lados). Esto repara las filas que se guardaron mal.

   NO ADIVINA
   ----------
   El modo de medicion solo SENALA las huerfanas cuyo titulo contiene el nombre
   de una cuenta — como pista para un humano, nunca como vinculo automatico.
   Un titulo no es una llave: «ARKANSAS» podria ser la universidad o un caso de
   otro cliente, y vincular por parecido es exactamente el error que la
   migracion de septiembre vino a corregir. Se vincula una por una, por id.

   USO
   ---
       python scripts/vincula-reunion-huerfana.py
       python scripts/vincula-reunion-huerfana.py --reunion <id> --cuenta <id>
       python scripts/vincula-reunion-huerfana.py --reunion <id> --desvincula
"""
import collections
import io
import json
import os
import re
import sys
import unicodedata
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# One To One es entre dos personas de la casa: no lleva cuenta ni deberia.
SIN_CUENTA = {'one_on_one'}


def env(clave):
    with io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8-sig') as f:
        for linea in f:
            if linea.strip().startswith(clave + '='):
                return linea.split('=', 1)[1].strip()
    return None


URL = env('NEXT_PUBLIC_SUPABASE_URL')
KEY = env('SUPABASE_SERVICE_ROLE_KEY')


def cab(r):
    r.add_header('apikey', KEY)
    r.add_header('Authorization', f'Bearer {KEY}')
    return r


def trae(tabla, query):
    out, desde = [], 0
    while True:
        r = cab(urllib.request.Request(f'{URL}/rest/v1/{tabla}?{query}'))
        r.add_header('Range', f'{desde}-{desde + 999}')
        with urllib.request.urlopen(r, timeout=90) as x:
            lote = json.loads(x.read().decode())
        out += lote
        if len(lote) < 1000:
            return out
        desde += 1000


def parche(tabla, filtro, cuerpo):
    r = cab(urllib.request.Request(f'{URL}/rest/v1/{tabla}?{filtro}', method='PATCH'))
    r.add_header('Content-Type', 'application/json')
    r.add_header('Prefer', 'return=representation')
    r.data = json.dumps(cuerpo).encode()
    with urllib.request.urlopen(r, timeout=60) as x:
        return json.loads(x.read().decode())


def arg(nombre):
    return sys.argv[sys.argv.index(nombre) + 1] if nombre in sys.argv else None


def norm(s):
    """Sin acentos, sin signos, minusculas. «Querétaro» y «Queretaro» cruzan."""
    s = ''.join(c for c in unicodedata.normalize('NFD', str(s or '').lower())
                if not (0x300 <= ord(c) <= 0x36f))
    return re.sub(r'[^a-z0-9]', '', s)


def main():
    reu = trae('reuniones', 'select=id,fecha,titulo,tipo,cuenta_id,cid,empresa')
    cuentas = trae('cuentas', 'select=id,cid,empresa,estado')
    porId = {c['id']: c for c in cuentas}

    idReunion = arg('--reunion')
    if idReunion:
        fila = next((r for r in reu if r['id'] == idReunion), None)
        if not fila:
            print(f'  no existe la reunion {idReunion}')
            return 1

        if '--desvincula' in sys.argv:
            nuevo = {'cuenta_id': None, 'cid': None, 'empresa': None}
        else:
            idCuenta = arg('--cuenta')
            cuenta = porId.get(idCuenta)
            if not cuenta:
                print(f'  no existe la cuenta {idCuenta}')
                return 1
            if fila['tipo'] in SIN_CUENTA:
                print(f"  la reunion es de tipo {fila['tipo']}, que no lleva cuenta. No se toca.")
                return 1
            nuevo = {'cuenta_id': cuenta['id'], 'cid': cuenta.get('cid'),
                     'empresa': cuenta.get('empresa')}

        print(f"  reunion : {fila['fecha']}  {fila['titulo']}")
        print(f"  tipo    : {fila['tipo']}")
        print(f"  antes   : cuenta_id={fila.get('cuenta_id')!r}  empresa={fila.get('empresa')!r}")
        print(f"  despues : cuenta_id={nuevo['cuenta_id']!r}  empresa={nuevo['empresa']!r}")

        if '--aplica' not in sys.argv:
            print('\n  SIMULACION. Para aplicarlo: --aplica')
            return 0

        parche('reuniones', f'id=eq.{idReunion}', nuevo)
        # Releer de la base: la respuesta del PATCH no prueba que quedo guardado
        # si otra cosa la pisa. Se comprueba con una lectura nueva.
        rev = trae('reuniones', f'select=id,cuenta_id,cid,empresa&id=eq.{idReunion}')
        ok = rev and rev[0].get('cuenta_id') == nuevo['cuenta_id']
        print(f"\n  COMPROBADO EN BASE: cuenta_id={rev[0].get('cuenta_id')!r}  "
              f"{'correcto' if ok else 'NO COINCIDE'}")
        return 0 if ok else 1

    # ── Modo medicion ───────────────────────────────────────────────────────
    c = collections.Counter()
    for r in reu:
        c[(r.get('tipo') or '(sin tipo)', r.get('cuenta_id') is not None)] += 1
    print(f'  {len(reu)} reuniones\n')
    print(f"  {'TIPO':<16} {'VINCULADAS':>11} {'SIN VINCULO':>12}")
    tipos = sorted({t for t, _ in c})
    for t in tipos:
        nota = '  (correcto: no lleva cuenta)' if t in SIN_CUENTA else ''
        print(f"  {t:<16} {c[(t, True)]:>11} {c[(t, False)]:>12}{nota}")
    huerfanas = [r for r in reu
                 if not r.get('cuenta_id') and (r.get('tipo') or '') not in SIN_CUENTA]
    print(f"\n  {len(huerfanas)} reuniones podrian llevar cuenta y no la tienen.")

    # ── Pistas por titulo ───────────────────────────────────────────────────
    #
    # NUNCA vinculo automatico, y el emparejador es DELIBERADAMENTE estricto:
    # exige que el nombre COMPLETO de la cuenta aparezca en el titulo, no su
    # primera palabra. Con la version laxa, «Revision de Dashboard Salud
    # Cliente» proponia «Salud y Hogar» y «Resumen y acciones Grupo 2711»
    # proponia tres «Grupo ...» distintos — tres formas de vincular mal.
    #
    # Una propuesta equivocada es peor que ninguna: se acepta de un vistazo y
    # mete una reunion en la ficha de un cliente que no estuvo ahi.
    print('\n  PROPUESTAS (nombre COMPLETO de la cuenta dentro del titulo):')
    vivas = [c2 for c2 in cuentas if (c2.get('estado') or '') in ('activo', 'en_riesgo')]
    propuestas, sinPista = [], []
    for r in sorted(huerfanas, key=lambda x: str(x.get('fecha') or ''), reverse=True):
        t = norm(r.get('titulo'))
        cands = [c2 for c2 in vivas
                 if len(norm(c2.get('empresa'))) >= 6 and norm(c2.get('empresa')) in t]
        if len(cands) == 1:
            propuestas.append((r, cands[0]))
        else:
            sinPista.append((r, cands))

    for r, c2 in propuestas:
        print(f"\n    {r['fecha']}  [{r['tipo']}]  {r['titulo'][:58]}")
        print(f"      -> {c2['empresa'][:50]}  CID {c2.get('cid')}")
        print(f"      --reunion {r['id']} --cuenta {c2['id']} --aplica")

    print(f'\n  {len(propuestas)} con una sola coincidencia exacta · '
          f'{len(sinPista)} sin pista fiable (hay que decir la cuenta a mano):')
    for r, cands in sinPista:
        motivo = f'{len(cands)} coincidencias ambiguas' if cands else 'el titulo no nombra ninguna cuenta'
        print(f"    {r['fecha']}  [{r['tipo']:<13}] {r['titulo'][:52]:<54} {motivo}")
    return 0


if __name__ == '__main__':
    sys.exit(main())
