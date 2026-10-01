# -*- coding: utf-8 -*-
"""Que lecturas de Supabase estan a punto de perder filas en silencio.

   POR QUE EXISTE
   --------------
   PostgREST devuelve MIL FILAS COMO MAXIMO por peticion, pase lo que pase: no
   hay error, no hay bandera, simplemente llegan menos datos de los que hay y el
   calculo sigue adelante como si estuviera completo. Ya mordio tres veces:

     · `uso_dashboard` en un reporte (mil de 2,198 filas), sep 2026
     · `adopcion_producto` en el tablero: 1,121 filas, llegaban 1,000 — 121
       perdidas en cada carga, 84 pares cuenta x producto invisibles
     · `uso_dashboard` otra vez, en la API de Uso: el correo del administrador
       tiene 1,240 registros y llegaban 1,000

   POR QUE NO ES UN DETECTOR ESTATICO
   ----------------------------------
   El riesgo no vive en el codigo, vive en los datos. Una lectura sin paginar de
   una tabla de 80 filas esta perfectamente bien hoy y sera un fallo silencioso
   el dia que la tabla pase de mil. Un detector que mire solo el texto tendria
   que gritar por las ~50 lecturas sin `.range()` que hay, y un detector que
   grita siempre no lo lee nadie.

   Asi que esto MIDE: cuenta las filas reales de cada tabla contra produccion y
   solo nombra las lecturas cuya tabla ya paso el tope, o se le acerca.

   USO
   ---
       python scripts/mide-topes-postgrest.py

   Sale en 1 si alguna tabla YA perdia filas. Correrlo antes de publicar algo
   que toque una consulta.
"""
import glob
import io
import json
import os
import re
import sys
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TOPE = 1000
CERCA = 700          # a partir de aqui conviene paginar antes de que duela


def env(clave):
    ruta = os.path.join(RAIZ, '.env.local')
    if not os.path.exists(ruta):
        return None
    with io.open(ruta, encoding='utf-8-sig') as f:
        for linea in f:
            if linea.strip().startswith(clave + '='):
                return linea.split('=', 1)[1].strip()
    return None


FILTROS = ('.eq(', '.in(', '.neq(', '.gt(', '.gte(', '.lt(', '.lte(', '.contains(', '.ilike(')


def lecturas_sin_tope():
    """Cada `.from('tabla')` cuya cadena hace `.select()` y no acota el tamano.

       Devuelve (tabla, archivo, linea, filtrada). `filtrada` importa: una
       lectura acotada por `.in('cuenta_id', lote)` esta limitada por el lote y
       casi nunca es el problema, mientras que un `.eq('asesor', X)` sobre una
       tabla que crece si lo sera algun dia. Se reportan las dos, separadas,
       porque la primera casi siempre se puede descartar de un vistazo y la
       segunda no.
    """
    halladas = []
    patron = re.compile(r"\.from\('([a-z_]+)'\)((?:\s*\.\w+\([^\n]*\))*)")
    for arch in (glob.glob(os.path.join(RAIZ, 'app', '**', '*.ts'), recursive=True)
                 + glob.glob(os.path.join(RAIZ, 'lib', '*.ts'))):
        rel = os.path.relpath(arch, RAIZ).replace('\\', '/')
        texto = io.open(arch, encoding='utf-8-sig').read()
        lineas = texto.splitlines()
        for m in patron.finditer(texto):
            tabla, cola = m.group(1), m.group(2)
            if '.select(' not in cola:
                continue
            # Acotadas a proposito, o que devuelven una sola fila.
            if any(x in cola for x in ('.range(', '.limit(', '.single(', '.maybeSingle(')):
                continue
            # Un INSERT/UPDATE con `.select()` devuelve solo lo que escribio.
            if any(x in cola for x in ('.insert(', '.update(', '.upsert(', '.delete(')):
                continue
            n = texto[:m.start()].count('\n') + 1
            # La cadena puede partirse en dos sentencias —`const q = …` y luego
            # `q.order(…).range(…)`—, y entonces el patron no ve el `.range`.
            # Se mira la vecindad antes de acusar: es la diferencia entre un
            # medidor que se lee y uno al que se le pierde el respeto.
            vecindad = '\n'.join(lineas[max(0, n - 4): n + 6])
            if '.range(' in vecindad or 'traerPorPaginas' in vecindad:
                continue
            halladas.append((tabla, rel, n, any(f in cola for f in FILTROS)))
    return halladas


def cuenta_filas(url, key, tabla):
    pet = urllib.request.Request(f'{url}/rest/v1/{tabla}?select=*&limit=1')
    pet.add_header('apikey', key)
    pet.add_header('Authorization', f'Bearer {key}')
    pet.add_header('Prefer', 'count=exact')
    pet.add_header('Range', '0-0')
    with urllib.request.urlopen(pet, timeout=40) as r:
        return int(r.headers.get('Content-Range', '*/0').split('/')[-1])


def main():
    url, key = env('NEXT_PUBLIC_SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY')
    if not url or not key:
        print('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local.')
        return 1

    halladas = lecturas_sin_tope()
    porTabla = {}
    for tabla, arch, linea, filtrada in halladas:
        porTabla.setdefault(tabla, []).append((arch, linea, filtrada))

    print(f'{len(halladas)} lectura(s) sin paginar, en {len(porTabla)} tabla(s).\n')
    rojas, ambar = [], []
    for tabla in sorted(porTabla):
        try:
            n = cuenta_filas(url, key, tabla)
        except Exception as e:
            print(f'  {tabla:<28}   no se pudo contar: {e}')
            continue
        if n > TOPE:
            rojas.append((tabla, n, porTabla[tabla]))
        elif n > CERCA:
            ambar.append((tabla, n, porTabla[tabla]))

    def imprime(titulo, grupo, nota):
        print(titulo)
        for tabla, n, sitios in grupo:
            print(f'  {tabla} — {n} filas; {nota(n)}')
            sueltas = [s for s in sitios if not s[2]]
            filtradas = [s for s in sitios if s[2]]
            for arch, linea, _ in sueltas:
                print(f'      {arch}:{linea}   <-- lee la tabla ENTERA')
            for arch, linea, _ in filtradas:
                print(f'      {arch}:{linea}   (con filtro: trunca solo si un grupo pasa de {TOPE})')
        print()

    if rojas:
        imprime('YA PIERDEN FILAS HOY', rojas,
                lambda n: f'llegan {TOPE}, se pierden {n - TOPE}')
    if ambar:
        imprime('CERCA DEL TOPE — paginar antes de que duela', ambar,
                lambda n: f'faltan {TOPE - n} para truncar')
    if not rojas and not ambar:
        print('Ninguna tabla leida sin paginar se acerca a las mil filas.')

    print('Para arreglar una: envolverla en `traerPorPaginas` de lib/supabase.ts.')
    print('Las marcadas «con filtro» hay que mirarlas una por una: el filtro puede')
    print('acotarlas de sobra (un lote de cuentas) o no acotarlas nada (un asesor).')

    # Solo falla por una lectura de tabla ENTERA sobre una tabla que ya paso el
    # tope. Fallar tambien por las filtradas convertiria esto en un semaforo
    # siempre en rojo, y un aviso que suena siempre deja de ser un aviso — que
    # es exactamente el defecto que este guion vino a ayudar a corregir.
    rotas = [(t, a, l) for t, n, sitios in rojas for a, l, f in sitios if not f]
    if rotas:
        print('\nFALLA: hay lectura de tabla entera sobre una tabla que ya trunca.')
        for t, a, l in rotas:
            print(f'  {t} en {a}:{l}')
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
