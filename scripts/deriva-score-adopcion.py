# -*- coding: utf-8 -*-
"""Calcula `score_adopcion` desde `adopcion_producto`, en vez de dejarlo en 50.

   POR QUE EXISTE
   --------------
   `health_score` es una columna GENERADA: 0.35 actividad + 0.30 adopcion +
   0.20 pago + 0.15 relacional. Los cuatro bloques se mueven a mano con
   deslizadores y arrancan en 50.

   Medido el 1 oct 2026 sobre las 192 cuentas vivas: 101 tienen
   `score_adopcion` clavado en 50, o sea el 30% del Health Score apoyado en un
   marcador. Y 80 cuentas tienen SOLO el 15% del peso medido — unicamente
   `score_relacional`, que es el unico bloque con derivacion viva.

   Este guion cierra el segundo de los cuatro.

   LA FORMULA NO ES NUEVA
   ----------------------
   Es la que la portada ya aplicaba en su matriz de adopcion: alto 100, medio
   50, bajo 0, promediado sobre los productos CONTRATADOS. `no_aplica` queda
   fuera del promedio — es un producto que el cliente no tiene, no una adopcion
   baja; la misma regla que el Radar aplica desde el 1 de octubre.

   Se apoya en que la tabla ya esta limpia: `limpia-adopcion-por-omision.py`
   borro las 566 filas `no_aplica` que el modal escribia por omision. Sin esa
   limpieza, este score estaria promediando afirmaciones que nadie hizo.

   NUNCA ESCRIBE UN 0 POR FALTA DE DATO
   ------------------------------------
   Una cuenta sin ningun producto contratado evaluado NO se toca: se queda como
   este. Un 0 ahi arrastraria el 30% del Health Score hacia abajo por falta de
   captura, que es lo contrario de lo que debe pasar.

   USO
   ---
       python scripts/deriva-score-adopcion.py            # solo simula
       python scripts/deriva-score-adopcion.py --aplica
       python scripts/deriva-score-adopcion.py --restaura <archivo.json>
"""
import collections
import datetime
import io
import json
import os
import sys
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SALIDA = 'D:/Archivos/salida'
VALOR_NIVEL = {'alto': 100, 'medio': 50, 'bajo': 0}
PESOS = {'score_actividad': 0.35, 'score_adopcion': 0.30,
         'score_pago': 0.20, 'score_relacional': 0.15}
DEFAULT = 50


def env(clave):
    with io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8-sig') as f:
        for linea in f:
            if linea.strip().startswith(clave + '='):
                return linea.split('=', 1)[1].strip()
    return None


URL = env('NEXT_PUBLIC_SUPABASE_URL')
KEY = env('SUPABASE_SERVICE_ROLE_KEY')


def trae(tabla, cols):
    out, desde = [], 0
    while True:
        r = urllib.request.Request(f'{URL}/rest/v1/{tabla}?select={cols}')
        r.add_header('apikey', KEY)
        r.add_header('Authorization', f'Bearer {KEY}')
        r.add_header('Range', f'{desde}-{desde + 999}')
        with urllib.request.urlopen(r, timeout=90) as x:
            lote = json.loads(x.read().decode())
        out += lote
        if len(lote) < 1000:
            return out
        desde += 1000


def escribe(cuenta_id, valor):
    r = urllib.request.Request(f'{URL}/rest/v1/cuentas?id=eq.{cuenta_id}', method='PATCH')
    r.add_header('apikey', KEY)
    r.add_header('Authorization', f'Bearer {KEY}')
    r.add_header('Content-Type', 'application/json')
    r.add_header('Prefer', 'return=minimal')
    r.data = json.dumps({'score_adopcion': valor}).encode()
    urllib.request.urlopen(r, timeout=60).read()


def vigentes(filas):
    """La ultima fila por producto: fecha mas reciente, y dentro de ella el
       `created_at` mayor. Mismo criterio que el panel, la portada y el Radar."""
    orden = sorted(filas, key=lambda f: (str(f.get('fecha') or ''),
                                         str(f.get('created_at') or '')), reverse=True)
    vistos, out = set(), []
    for f in orden:
        if f['producto'] in vistos:
            continue
        vistos.add(f['producto'])
        out.append(f)
    return out


def score_de(filas):
    v = [VALOR_NIVEL[f['nivel']] for f in filas if f['nivel'] in VALOR_NIVEL]
    return round(sum(v) / len(v)) if v else None


def peso_medido(c):
    return sum(w for k, w in PESOS.items()
               if c.get(k) is not None and c.get(k) != DEFAULT)


def restaura(archivo):
    filas = json.load(io.open(archivo, encoding='utf-8'))
    print(f'  {len(filas)} cuentas en el respaldo')
    for i, f in enumerate(filas, 1):
        escribe(f['id'], f['score_adopcion'])
        if i % 25 == 0:
            print(f'    restauradas {i} de {len(filas)}')
    print('  restauracion terminada')
    return 0


def main():
    if '--restaura' in sys.argv:
        return restaura(sys.argv[sys.argv.index('--restaura') + 1])
    aplica = '--aplica' in sys.argv

    cuentas = trae('cuentas', 'id,empresa,estado,health_score,score_actividad,'
                              'score_adopcion,score_pago,score_relacional')
    adop = trae('adopcion_producto', 'cuenta_id,producto,nivel,fecha,created_at')
    vivas = [c for c in cuentas if (c.get('estado') or '') in ('activo', 'en_riesgo')]
    porCuenta = collections.defaultdict(list)
    for a in adop:
        porCuenta[a['cuenta_id']].append(a)

    # DOS CANDADOS, y los dos salieron de medir antes de aplicar.
    #
    # 1. NO SE PISA UN VALOR PUESTO A MANO. Solo se escribe donde el bloque
    #    sigue en el 50 por omision, o sea donde nadie capturo nada. Una
    #    derivacion rellena huecos; no le enmienda la plana a quien evaluo.
    # 2. BASE MINIMA DE 3 PRODUCTOS. EASO tiene UNA sola fila de adopcion
    #    —«Uso del Panel Administrador», alto, de la evaluacion automatica— y
    #    el promedio daria 100 sobre n=1. Es el mismo defecto que el Radar
    #    corrigio el 1 de octubre exigiendo 3 contratados.
    MIN_PRODUCTOS = 3
    cambios, sinDato, pocos, aMano, iguales = [], [], [], [], 0
    for c in vivas:
        evaluados = [f for f in vigentes(porCuenta.get(c['id'], [])) if f['nivel'] in VALOR_NIVEL]
        if not evaluados:
            sinDato.append(c)
            continue
        if len(evaluados) < MIN_PRODUCTOS:
            pocos.append((c, len(evaluados)))
            continue
        if c.get('score_adopcion') != DEFAULT:
            aMano.append(c)
            continue
        nuevo = score_de(evaluados)
        if nuevo == c.get('score_adopcion'):
            iguales += 1
            continue
        cambios.append((c, nuevo))

    print(f'  {len(vivas)} cuentas vivas · {len(adop)} filas de adopcion\n')
    print(f'  SE ESCRIBEN                                    : {len(cambios)}')
    print(f'  iguales a lo que ya tenian                     : {iguales}')
    print(f'  NO se tocan, valor puesto a mano               : {len(aMano)}')
    print(f'  NO se tocan, menos de {MIN_PRODUCTOS} productos evaluados: {len(pocos)}')
    print(f'  NO se tocan, sin ningun producto evaluado      : {len(sinDato)}')
    total = len(cambios) + iguales + len(aMano) + len(pocos) + len(sinDato)
    print(f'  {"TOTAL":<46} : {total}')
    assert total == len(vivas), 'el reparto no cierra'
    print()

    antes = sum(c['health_score'] for c in vivas) / len(vivas)
    sim = {c['id']: n for c, n in cambios}
    def hsDe(c):
        a = sim.get(c['id'], c.get('score_adopcion') or DEFAULT)
        return round(c.get('score_actividad', DEFAULT) * 0.35 + a * 0.30
                     + c.get('score_pago', DEFAULT) * 0.20
                     + c.get('score_relacional', DEFAULT) * 0.15)
    despues = sum(hsDe(c) for c in vivas) / len(vivas)
    print(f'  Health Score promedio: {antes:.1f} -> {despues:.1f}')
    subenBajan = collections.Counter(
        'sube' if hsDe(c) > c['health_score'] else 'baja' if hsDe(c) < c['health_score'] else 'igual'
        for c in vivas)
    print(f'    sube {subenBajan["sube"]} · baja {subenBajan["baja"]} · igual {subenBajan["igual"]}'
          f'   (suman {sum(subenBajan.values())} de {len(vivas)})')
    pm = sum(peso_medido(c) for c in vivas) / len(vivas)
    pmN = sum(peso_medido({**c, 'score_adopcion': sim.get(c['id'], c.get('score_adopcion'))})
              for c in vivas) / len(vivas)
    print(f'  peso del score apoyado en dato capturado: {100*pm:.0f}% -> {100*pmN:.0f}%\n')

    print('  LOS DIEZ QUE MAS SE MUEVEN')
    for c, n in sorted(cambios, key=lambda x: -abs(hsDe(x[0]) - x[0]['health_score']))[:10]:
        print(f"    {c['empresa'][:30]:<32} adopcion {c.get('score_adopcion'):>3} -> {n:>3}"
              f"   HS {c['health_score']:>3} -> {hsDe(c):>3}")

    if not aplica:
        print('\n  SIMULACION. Para aplicarlo: --aplica')
        return 0

    os.makedirs(SALIDA, exist_ok=True)
    sello = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=-6))).strftime('%Y%m%d-%H%M')
    respaldo = os.path.join(SALIDA, f'score-adopcion-antes-{sello}.json')
    json.dump([{'id': c['id'], 'empresa': c['empresa'], 'score_adopcion': c.get('score_adopcion')}
               for c, _ in cambios], io.open(respaldo, 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)
    print(f'\n  respaldo escrito: {respaldo}')

    for i, (c, n) in enumerate(cambios, 1):
        escribe(c['id'], n)
        if i % 25 == 0 or i == len(cambios):
            print(f'    escritas {i} de {len(cambios)}')

    rev = {c['id']: c for c in trae('cuentas', 'id,score_adopcion,health_score')}
    mal = [c['empresa'] for c, n in cambios if rev.get(c['id'], {}).get('score_adopcion') != n]
    print(f'\n  COMPROBACION: {len(cambios) - len(mal)} de {len(cambios)} quedaron con el valor esperado')
    if mal:
        print('    no coinciden:', ', '.join(mal[:5]))
    print(f'  deshacer: python scripts/deriva-score-adopcion.py --restaura "{respaldo}"')
    return 1 if mal else 0


if __name__ == '__main__':
    sys.exit(main())
