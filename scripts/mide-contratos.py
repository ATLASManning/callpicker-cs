# -*- coding: utf-8 -*-
u"""QUE TRAE LA HOJA DE CONTRATOS, Y CUANTO CRUZA CON LA CARTERA.

   Antes de construir el modulo hay que saber con que se cuenta: cuantos
   contratos hay, cuantos estan firmados de verdad, cuantos cruzan con una
   cuenta por CID, y cuantos traen fecha de fin con la que calcular un
   vencimiento. Un modulo que se diseña sobre lo que uno supone del archivo
   acaba pintando huecos.

   NO INVENTA NADA: lo que no se puede medir se dice. Las credenciales se leen
   de .env.local aqui dentro y nunca se imprimen.

   USO
       python scripts/mide-contratos.py "D:\\Archivos\\Contratos\\contratos.html"
"""
import datetime
import io
import json
import os
import re
import sys
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

MESES = {'ene': 1, 'feb': 2, 'mar': 3, 'abr': 4, 'may': 5, 'jun': 6,
         'jul': 7, 'ago': 8, 'sep': 9, 'sept': 9, 'oct': 10, 'nov': 11, 'dic': 12}

# «fima» es un dedazo de «firma» que aparece 16 veces en la hoja. Normalizar
# aqui y no en la pantalla: si cada vista lo arregla a su manera, dos pantallas
# cuentan distinto el mismo contrato.
# «fima» es «firma» SIN LA R, y asi esta escrito 16 veces en la hoja. Mi
# primera version ponia `f[ia]rma`, que cubre «firma» y «farma» pero NO
# «fima» — y dejaba 16 contratos firmados contados como «sin estatus».
# El dedazo que hay que cubrir es la letra que FALTA, no una que cambia.
FIRMADO = re.compile(r'f(ir|i)ma(do)?\s+(digital|aut[oó]grafa)'
                     r'|firmado\s+(digitalmente|en\s+f[ií]sico)', re.I)
EN_PROCESO = re.compile(r'enviado|pendiente|revisi[oó]n|ajustes|no\s+firmado', re.I)


def fecha(txt):
    """«28-feb-2027» -> date. None si no hay fecha (NA, vacio, guion)."""
    t = (txt or '').strip().lower()
    if not t or t in ('na', 'n/a', '-', '—', 'indefinido'):
        return None
    m = re.match(r'^(\d{1,2})-([a-záéíóú]+)-(\d{4})$', t)
    if m and m.group(2)[:4] in MESES or (m and m.group(2)[:3] in MESES):
        mes = MESES.get(m.group(2)[:4]) or MESES.get(m.group(2)[:3])
        try:
            return datetime.date(int(m.group(3)), mes, int(m.group(1)))
        except ValueError:
            return None
    return None


def env(clave):
    p = os.path.join(RAIZ, '.env.local')
    for ln in io.open(p, encoding='utf-8'):
        ln = ln.strip()
        if ln.startswith(clave + '='):
            return ln.split('=', 1)[1].strip().strip('"').strip("'")
    return None


def cartera():
    """Las cuentas de Supabase, por CID. Para cruzar y para sector/tamaño."""
    url = (env('NEXT_PUBLIC_SUPABASE_URL') or '').rstrip('/')
    key = env('SUPABASE_SERVICE_ROLE_KEY') or env('SUPABASE_SERVICE_KEY')
    if not url or not key:
        return None
    req = urllib.request.Request(
        url + '/rest/v1/cuentas?select=cid,empresa,consecutivo,asesor,estado,giro,tamano_empresa,facturacion&limit=2000',
        headers={'apikey': key, 'Authorization': 'Bearer ' + key})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode('utf-8'))


def main():
    if len(sys.argv) < 2:
        print(u'  uso: python scripts/mide-contratos.py <contratos.html>')
        return 2
    import subprocess
    tmp = os.path.join(os.environ.get('TEMP', '.'), '_contratos_medida.json')
    subprocess.run([sys.executable, '-I',
                    os.path.join(RAIZ, 'scripts', 'lee-contratos-html.py'),
                    sys.argv[1], '--json', tmp],
                   capture_output=True, check=True)
    f = json.load(io.open(tmp, encoding='utf-8'))
    cab = [c['t'] or '' for c in f[1]]
    idx = {n: i for i, n in enumerate(cab)}
    filas = f[2:]

    def v(fila, nombre):
        i = idx.get(nombre)
        return ((fila[i]['t'] if i is not None and i < len(fila) else '') or '').strip()

    hoy = datetime.date.today()
    print(u'\n  CONTRATOS — que hay')
    print(u'  ' + u'=' * 72)
    print(u'  %d fila(s) de contrato' % len(filas))

    firmados, proceso, sin_estatus = [], [], []
    for fila in filas:
        e = v(fila, 'Estatus')
        if FIRMADO.search(e):
            firmados.append(fila)
        elif EN_PROCESO.search(e):
            proceso.append(fila)
        else:
            sin_estatus.append(fila)
    print(u'    firmados ................ %3d' % len(firmados))
    print(u'    en proceso .............. %3d' % len(proceso))
    print(u'    sin estatus en la hoja .. %3d   (no es «no firmado»: es que no lo dice)'
          % len(sin_estatus))

    print(u'\n  FECHA DE FIN — con que se calcula un vencimiento')
    con_fin = [x for x in filas if fecha(v(x, 'Fin'))]
    libres = [x for x in filas if v(x, 'Plazo').lower() == 'libre']
    print(u'    con fecha de Fin ........ %3d' % len(con_fin))
    print(u'    plazo «libre» ........... %3d   (sin vencimiento por definicion)' % len(libres))
    print(u'    sin fin y sin «libre» ... %3d   NO MEDIBLE'
          % (len(filas) - len(con_fin) - len([x for x in libres if not fecha(v(x, 'Fin'))])))

    print(u'\n  PROXIMOS A VENCER (sobre los que tienen fecha)')
    for dias in (30, 60, 90):
        n = [x for x in con_fin
             if 0 <= (fecha(v(x, 'Fin')) - hoy).days <= dias]
        print(u'    en %3d dias ............. %3d' % (dias, len(n)))
    vencidos = [x for x in con_fin if (fecha(v(x, 'Fin')) - hoy).days < 0]
    print(u'    YA VENCIDOS ............. %3d' % len(vencidos))
    for x in sorted(vencidos, key=lambda y: fecha(v(y, 'Fin')))[:6]:
        print(u'        %-30s fin %s  (%d dias)'
              % (v(x, 'Cuenta')[:30], v(x, 'Fin'),
                 (hoy - fecha(v(x, 'Fin'))).days))

    print(u'\n  CRUCE CON LA CARTERA, por CID')
    cs = cartera()
    if cs is None:
        print(u'    *** sin credenciales: NO se pudo medir. Eso no es «no cruza».')
        return 1
    porCid = {str(c.get('cid') or '').strip(): c for c in cs if c.get('cid')}
    cruzan, no = [], []
    for fila in filas:
        cid = v(fila, 'Customer ID')
        (cruzan if cid and cid in porCid else no).append((fila, cid))
    print(u'    contratos que cruzan .... %3d de %d' % (len(cruzan), len(filas)))
    print(u'    sin CID util ............ %3d' % len(no))
    # EL TOP SE DERIVA, no es una columna: las 25 de mayor importe entre las
    # vivas. Misma regla que `topDeCartera()` en lib/facturacion-cuenta.ts.
    # Aqui se aproxima con `cuentas.facturacion` —que es promedio de vida, no
    # MRR— porque esta medicion es para DIMENSIONAR, no para publicar. El
    # modulo usara la funcion de verdad. [[grc-fuente-zoho]]
    vivas = [c for c in cs if c.get('estado') in ('activo', 'en_riesgo')]
    tops = sorted(vivas, key=lambda c: -(c.get('facturacion') or 0))[:25]
    print(u'\n    cuentas TOP en la cartera: %d' % len(tops))
    cids_firmados = {v(x, 'Customer ID') for x in firmados}
    top_con = [c for c in tops if str(c.get('cid') or '') in cids_firmados]
    print(u'    TOP con contrato FIRMADO: %d' % len(top_con))
    print(u'    TOP SIN contrato firmado: %d' % (len(tops) - len(top_con)))
    for c in top_con[:8]:
        print(u'        %-8s %s' % (c.get('consecutivo'), (c.get('empresa') or '')[:38]))

    print(u'\n  LO QUE LA HOJA NO TRAE, y por eso saldra de `cuentas`:')
    print(u'    sector/giro, tamaño, facturacion, asesor, estado.')
    print(u'    Para los %d contratos que NO cruzan, esas dimensiones NO existen.'
          % len(no))
    return 0


if __name__ == '__main__':
    sys.exit(main())
