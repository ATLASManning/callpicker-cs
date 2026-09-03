"""
Conciliacion de cierre de semana: cruza los modulos de Churn contra `cuentas`.

Por que existe:
  El campo `cuentas.estado` no se entera de que una cuenta murio. GRC AAA 2026
  la marca "Churn confirmado" y el reporte de Zoho la manda a Dormido, pero en
  la cartera sigue apareciendo Activa, recibe Actividades SAC y suma a las
  metricas. Caso testigo: Global Digital, "Churn confirmado + Fraude" desde
  junio 2026, seguia como activa el 2 de septiembre.

Politica (instruccion de direccion, 2 sep 2026):
  - Evento hasta el 31 ago 2026  -> reclasificar a Dormida. Es limpieza de
    historico: no se le pide expediente a nadie.
  - Evento despues del 31 ago 2026 -> NO se reclasifica en automatico. Se exige
    expediente documentado (como se dio, que indicios hubo, que acciones) y el
    plan de recuperacion del ingreso, segun el Protocolo de baja del rol.

Uso:
  python scripts/conciliar-churn.py           # solo reporta (dry-run)
  python scripts/conciliar-churn.py --aplicar # escribe los cambios
"""
import json
import os
import re
import sys
import unicodedata
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CORTE = '2026-08-31'

# El GRC AAA trae el mes en texto; se traduce a la fecha de cierre del mes.
MES_FECHA = {
    'Enero': '2026-01-31', 'Febrero': '2026-02-28', 'Marzo': '2026-03-31',
    'Abril': '2026-04-30', 'Mayo': '2026-05-31', 'Junio': '2026-06-30',
    'Julio': '2026-07-31', 'Agosto': '2026-08-31', 'Septiembre': '2026-09-30',
    'Octubre': '2026-10-31', 'Noviembre': '2026-11-30', 'Diciembre': '2026-12-31',
}

ESTADOS_VIVOS = {'activo', 'en_riesgo'}
ESTADO_DORMIDA = 'hibernacion'


def norm(s):
    s = unicodedata.normalize('NFD', str(s or '')).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]', '', s)


def env():
    d = {}
    for line in open(os.path.join(ROOT, '.env.local'), encoding='utf-8'):
        if '=' in line and not line.strip().startswith('#'):
            k, v = line.strip().split('=', 1)
            d[k.strip()] = v.strip()
    return d


E = env()
SB = E['NEXT_PUBLIC_SUPABASE_URL']
KEY = E['SUPABASE_SERVICE_ROLE_KEY']
HDR = {'apikey': KEY, 'Authorization': 'Bearer ' + KEY}


def sb_get(q):
    r = urllib.request.Request(SB + '/rest/v1/' + q, headers=HDR)
    return json.load(urllib.request.urlopen(r))


def sb_patch(q, body):
    r = urllib.request.Request(
        SB + '/rest/v1/' + q,
        data=json.dumps(body).encode('utf-8'),
        headers={**HDR, 'Content-Type': 'application/json', 'Prefer': 'return=representation'},
        method='PATCH')
    return json.load(urllib.request.urlopen(r))


# ── Fuente 1: GRC AAA 2026 ──────────────────────────────────────────────────
def leer_grc():
    src = open(os.path.join(ROOT, 'app', 'churn', 'aaa-grc-data.ts'), encoding='utf-8').read()
    out = {}
    mes = None
    for linea in src.split('\n'):
        m = re.search(r"^\s*mes:\s*'([^']+)'", linea)
        if m:
            mes = m.group(1)
            continue
        c = re.search(r"cliente:\s*'(.*?)',\s*clas:", linea)
        v = re.search(r"movimiento:\s*'([^']*)'", linea)
        p = re.search(r"perdido:\s*([\d.]+),\s*perdido2:\s*([\d.]+)", linea)
        if not (c and v and mes):
            continue
        if 'Churn confirmado' not in v.group(1):
            continue          # Downgrade sigue siendo cartera viva: no se toca
        cli = c.group(1).replace("\\'", "'")
        k = norm(cli)
        if not k or k in out:
            continue
        perdido = (float(p.group(1)) + float(p.group(2))) if p else 0.0
        out[k] = {'cliente': cli, 'mes': mes, 'fecha': MES_FECHA.get(mes, ''),
                  'movimiento': v.group(1), 'perdido': perdido,
                  'fuente': 'GRC AAA 2026'}
    return out


# ── Fuente 2: cancelaciones de los cortes semanales ─────────────────────────
MES_TXT = {'ene': 'Enero', 'feb': 'Febrero', 'mar': 'Marzo', 'abr': 'Abril',
           'may': 'Mayo', 'jun': 'Junio', 'jul': 'Julio', 'ago': 'Agosto',
           'sep': 'Septiembre', 'oct': 'Octubre', 'nov': 'Noviembre', 'dic': 'Diciembre'}


def leer_cancelados():
    ruta = os.path.join(ROOT, 'lib', 'churn-cancelados-data.ts')
    src = open(ruta, encoding='utf-8').read()
    out = {}
    for m in re.finditer(r"\{ cliente: '(.*?)', periodo: '([^']*)' \}", src):
        cli, per = m.group(1).replace("\\'", "'"), m.group(2)
        k = norm(cli)
        if not k or k in out:
            continue
        mes = ''
        for abrev, nombre in MES_TXT.items():
            if abrev in per.lower():
                mes = nombre
                break
        out[k] = {'cliente': cli, 'mes': mes or per, 'fecha': MES_FECHA.get(mes, ''),
                  'movimiento': 'Cancelacion confirmada', 'perdido': 0.0,
                  'fuente': 'Churn > Analisis DATA (%s)' % per}
    return out


def main():
    aplicar = '--aplicar' in sys.argv
    grc = leer_grc()
    canc = leer_cancelados()
    cuentas = sb_get('cuentas?select=id,cid,consecutivo,empresa,asesor,estado,facturacion&limit=1000')

    print('GRC AAA con Churn confirmado : %d clientes' % len(grc))
    print('Cancelados en cortes semanales: %d clientes' % len(canc))
    print('Cuentas en cartera            : %d' % len(cuentas))
    print()

    reclasificar, exige_expediente, ya_correctas = [], [], []
    for c in cuentas:
        k = norm(c['empresa'])
        senal = grc.get(k) or canc.get(k)
        if not senal:
            continue
        vivo = (c['estado'] or '') in ESTADOS_VIVOS
        fecha = senal['fecha'] or '9999-12-31'
        destino = reclasificar if fecha <= CORTE else exige_expediente
        (destino if vivo else ya_correctas).append((c, senal))

    def fila(c, s):
        return '  %-6s %-33s %-8s %-11s $%-10s %s · %s' % (
            c['consecutivo'], (c['empresa'] or '')[:33], c['asesor'], c['estado'],
            f"{c['facturacion'] or 0:,.0f}", s['movimiento'], s['mes'])

    print('=== A RECLASIFICAR COMO DORMIDA (evento <= %s) ===' % CORTE)
    for c, s in sorted(reclasificar, key=lambda x: -(x[0]['facturacion'] or 0)):
        print(fila(c, s))
    mrr = sum(c['facturacion'] or 0 for c, _ in reclasificar)
    print('  -> %d cuentas · $%s de MRR fantasma en la cartera' % (len(reclasificar), f'{mrr:,.2f}'))

    print()
    print('=== EXIGEN EXPEDIENTE (evento posterior a %s) ===' % CORTE)
    if exige_expediente:
        for c, s in sorted(exige_expediente, key=lambda x: -(x[0]['facturacion'] or 0)):
            print(fila(c, s))
    else:
        print('  ninguna — no hay eventos posteriores al corte todavia')

    print()
    print('=== YA ESTABAN FUERA DE ACTIVAS (sin accion) ===')
    print('  %d cuentas' % len(ya_correctas))

    if not aplicar:
        print()
        print('DRY-RUN. Para escribir los cambios: python scripts/conciliar-churn.py --aplicar')
        return

    print()
    print('=== APLICANDO ===')
    for c, s in reclasificar:
        nota = ('[Conciliacion %s] %s en %s segun %s. Reclasificada a Dormida por '
                'politica de cierre de semana; el evento es anterior al %s.'
                % ('2026-09-02', s['movimiento'], s['mes'], s['fuente'], CORTE))
        prev = sb_get('cuentas?select=observaciones_kam&id=eq.%s' % c['id'])
        obs = (prev[0].get('observaciones_kam') or '').strip() if prev else ''
        nuevo = (obs + '\n\n' + nota).strip() if obs else nota
        sb_patch('cuentas?id=eq.%s' % c['id'],
                 {'estado': ESTADO_DORMIDA, 'observaciones_kam': nuevo})
        print('  %s %s -> %s' % (c['consecutivo'], c['empresa'], ESTADO_DORMIDA))
    print('Listo: %d cuentas reclasificadas.' % len(reclasificar))


if __name__ == '__main__':
    main()
