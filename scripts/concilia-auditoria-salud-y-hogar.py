# -*- coding: utf-8 -*-
u"""
CONCILIA LA AUDITORÍA FORENSE DE SALUD Y HOGAR (CID 946)
=========================================================

    python scripts/concilia-auditoria-salud-y-hogar.py

El documento entregado el 17 nov 2026 trae sus cifras repartidas en DOS sitios
del propio `.html`: las series de las gráficas, como arreglos de Chart.js, y
las tablas, como HTML. Este guion extrae los dos y comprueba que cada agregado
cierre contra sus partes ANTES de que una cifra entre al expediente del tablero
o al contexto de Atlas.

POR QUÉ ANTES DE PUBLICAR
--------------------------
La contradicción interna es el detector más barato que hay: no necesita una
segunda fuente, sólo sumar. [[feedback-auditorias-verificar]]
[[feedback-tablas-deben-cerrar]]

Y un hallazgo aquí **no impide publicar: impide publicar ESA cifra sin
marcarla**, con palabras, en el documento y en el expediente. Un hueco que se
calla lo rellena de invención quien lo lea después.
[[feedback-contexto-ia-sin-huecos]]

LO QUE SE COMPRUEBA
-------------------
 1. El total de llamadas contra sus cuatro categorías, y la tabla mensual
    columna por columna y fila por fila.
 2. La serie por HORA contra el total, y el bloque «fuera de horario» (20h–8h)
    contra esa misma serie.
 3. El reparto nocturno (atendidas / perdidas / self-service) contra su total.
 4. La tabla por DÍA DE SEMANA, con los porcentajes recalculados desde
    `perdidas`/`total`.
 5. La serie de MINUTOS contra el total declarado, y el promedio declarado
    contra el número de meses que el propio rótulo dice.
 6. La composición por tipo de destino: minutos contra el total, y llamadas
    contra el total.
 7. El desglose financiero: subtotal contra sus conceptos, IVA, y total.
 8. **El desglose financiero contra las fuentes VIVAS** — el MRR del GRC y la
    lista de servicios de Supabase. Aquí es donde aparece el MRR heredado del
    corte anterior. [[grc-fuente-zoho]]
 9. El contraste del volumen (−68%) contra la longitud del mes con el que se
    compara: noviembre son 17 días, no un mes.
10. Las contradicciones de conteo entre secciones (DIDs dados de baja, fallas
    del AV sin resolver).

Sale con 1 si algo no cierra, y DICE CUÁNTO falta — un verificador que sólo
dice «falla» obliga a rehacer su trabajo a mano.
"""
from __future__ import print_function
import io
import json
import os
import re
import sys
import urllib.error
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOC = os.path.join(RAIZ, 'public', 'auditorias',
                   'Salud_y_Hogar_Auditoria_Forense_2026-11-17.html')
# Se puede apuntar a otra copia: es como se PRUEBA que este guion sabe fallar,
# rompiendo una copia a propósito en vez de tocar el documento publicado.
if len(sys.argv) > 1:
    DOC = sys.argv[1]

# Noviembre 2026 está cortado: el documento lo rotula «(17 días)».
DIAS_NOV = 17
DIAS_ENE = 31

fallos = []
avisos = []
marcados = []

# Los desfases que el propio documento declara, por clave. Se leen de él, no se
# teclean aquí: así, quitar la declaración del documento vuelve a poner el guion
# en rojo. Un desfase declarado sigue siendo un desfase — lo que cambia es que
# nadie lo va a citar creyendo que cierra. Y un desfase NUEVO, que nadie haya
# declarado, deja el guion en rojo. Un candado que está rojo siempre se ignora.
DECLARADOS = set()


def falla(que, detalle, clave=None):
    if clave and clave in DECLARADOS:
        marcados.append((que, detalle))
        print(u'    %-50s  ~  NO CIERRA, Y EL DOCUMENTO LO DICE · %s'
              % (que, detalle))
        return
    fallos.append((que, detalle))
    print(u'    %-50s *** NO CIERRA ***  %s' % (que, detalle))


def pasa(que, detalle=u''):
    print(u'    %-50s ok  %s' % (que, detalle))


def aviso(que, detalle):
    avisos.append((que, detalle))
    print(u'    %-50s  !  %s' % (que, detalle))


def cierra(que, total, partes, tol=0, clave=None):
    s = sum(partes)
    if abs(s - total) <= tol:
        pasa(que, u'%s = %s' % (fmt(total), ' + '.join(fmt(p) for p in partes))
             if len(partes) <= 5 else u'%s' % fmt(total))
        return True
    falla(que, u'declarado %s · suma de las partes %s · diferencia %s'
          % (fmt(total), fmt(s), fmt(s - total)), clave=clave)
    return False


def fmt(x):
    if isinstance(x, float) and abs(x - round(x)) > 1e-9:
        return u'{:,.2f}'.format(x)
    return u'{:,}'.format(int(round(x)))


# ───────────────────────── extracción ─────────────────────────

if not os.path.exists(DOC):
    print(u'*** NO EXISTE EL DOCUMENTO: %s' % DOC)
    print(u'    Sin el documento no hay nada que conciliar. NO se concluye nada.')
    sys.exit(2)

HTML = io.open(DOC, encoding='utf-8').read()

_m = re.search(r'CONCILIACION:MARCADOS\s+([a-z0-9,\-]+)', HTML)
if _m:
    DECLARADOS.update(k for k in _m.group(1).split(',') if k)


def serie(nombre):
    u"""Un `const <nombre> = [...]` del guion embebido."""
    m = re.search(r'const\s+' + nombre + r'\s*=\s*\[([^\]]*)\]', HTML)
    if not m:
        raise SystemExit(u'*** no encontré la serie «%s» en el documento' % nombre)
    return [float(x) for x in re.findall(r'-?\d+(?:\.\d+)?', m.group(1))]


def dataset(etiqueta):
    u"""El `data: [...]` del dataset cuyo `label` es <etiqueta>."""
    m = re.search(r"label:\s*'" + re.escape(etiqueta) + r"'\s*,\s*data:\s*\[([^\]]*)\]", HTML)
    if not m:
        m = re.search(r"label:\s*'" + re.escape(etiqueta) + r"'[^\]]*?data:\s*\[([^\]]*)\]", HTML)
    if not m:
        raise SystemExit(u'*** no encontré el dataset «%s»' % etiqueta)
    return [float(x) for x in re.findall(r'-?\d+(?:\.\d+)?', m.group(1))]


def tablas():
    u"""Cada <table> como lista de filas, cada fila como lista de celdas en texto."""
    out = []
    for t in re.findall(r'<table.*?</table>', HTML, re.S):
        filas = []
        for tr in re.findall(r'<tr.*?</tr>', t, re.S):
            celdas = []
            for c in re.findall(r'<t[dh][^>]*>(.*?)</t[dh]>', tr, re.S):
                c = re.sub(r'<[^>]+>', ' ', c)
                c = c.replace('&nbsp;', ' ').replace('&amp;', '&')
                celdas.append(re.sub(r'\s+', ' ', c).strip())
            if celdas:
                filas.append(celdas)
        out.append(filas)
    return out


TABLAS = tablas()


def num(s):
    u"""«$4,554.00» → 4554.0 · «85.6%» → 85.6 · «—» → None"""
    s = (s or '').replace('−', '-')
    m = re.search(r'-?[\d,]+(?:\.\d+)?', s)
    if not m:
        return None
    return float(m.group(0).replace(',', ''))


def busca_tabla(*encabezados):
    u"""La primera tabla cuya cabecera contiene todos esos textos."""
    for filas in TABLAS:
        cab = u' '.join(filas[0]).lower() if filas else u''
        if all(h.lower() in cab for h in encabezados):
            return filas
    return None


print(u'')
print(u'  CONCILIACIÓN · Auditoría Forense Salud y Hogar (CID 946) · 17 nov 2026')
print(u'  ' + u'═' * 72)
print(u'  Documento: public/auditorias/%s' % os.path.basename(DOC))
print(u'  %s tabla(s) leída(s) del HTML' % len(TABLAS))

# ───────────────────────── 1. llamadas ─────────────────────────

print(u'\n  1 · LLAMADAS — total contra sus categorías')
TOTAL_DECL = 35743
atend = dataset('Atendidas')          # el de la tendencia mensual
self_ = dataset('Self-service AV')
vmail = dataset('Voicemail')
perd = dataset('Perdidas')
total_m = dataset('Total')

cierre_cat = cierra(u'total contra las 4 categorías', TOTAL_DECL,
                    [sum(atend), sum(perd), sum(self_), sum(vmail)])
cierra(u'serie «Total» mensual contra el total', TOTAL_DECL, [sum(total_m)])

print(u'\n  1.1 · la tabla mensual, fila por fila')
tm = busca_tabla('mes', 'self-svc', '% atención')
if not tm:
    falla(u'tabla mensual', u'no la encontré en el HTML')
else:
    malas = 0
    for f in tm[1:]:
        if not f or len(f) < 8:
            continue
        et = f[0]
        tot, at, pe, ss, vm = (num(f[1]), num(f[2]), num(f[3]), num(f[4]), num(f[5]))
        if None in (tot, at, pe, ss, vm):
            continue
        if abs((at + pe + ss + vm) - tot) > 0:
            malas += 1
            falla(u'fila «%s»' % et[:22],
                  u'%s vs %s en sus partes' % (fmt(tot), fmt(at + pe + ss + vm)))
        pct_at = num(f[7])
        if pct_at is not None and abs(at / tot * 100 - pct_at) > 0.11:
            malas += 1
            falla(u'%% atención de «%s»' % et[:20],
                  u'dice %.1f%%, sale %.1f%%' % (pct_at, at / tot * 100))
    if not malas:
        pasa(u'las %s filas cierran y sus %% salen de sus partes' % (len(tm) - 1))

# ───────────────────────── 2. horas ─────────────────────────

print(u'\n  2 · HORA DEL DÍA')
h = serie('hData')
cierra(u'las 24 horas contra el total', TOTAL_DECL, [sum(h)])
NOCTURNAS_DECL = 2527
noct = sum(h[20:24]) + sum(h[0:8])
cierra(u'fuera de horario (20h–8h) contra la serie', NOCTURNAS_DECL, [noct])

print(u'\n  3 · REPARTO NOCTURNO')
# Los cuatro números que el texto declara en §5.5.
NOC = {'atendidas': 1763, 'perdidas': 498, 'self': 231}
suma_noc = sum(NOC.values())
if suma_noc == NOCTURNAS_DECL:
    pasa(u'atendidas + perdidas + self-service', fmt(NOCTURNAS_DECL))
else:
    falla(u'reparto nocturno sin cubo «otros»',
          u'%s declaradas, las tres partes suman %s · faltan %s por nombrar '
          u'(serían buzón nocturno, que el documento no desglosa)'
          % (fmt(NOCTURNAS_DECL), fmt(suma_noc), fmt(NOCTURNAS_DECL - suma_noc)),
          clave='nocturno-sin-otros')
if abs(NOC['atendidas'] / float(NOCTURNAS_DECL) * 100 - 69.8) < 0.1:
    pasa(u'69.8% de atención nocturna', u'sale de 1,763/2,527')

# ───────────────────────── 4. día de semana ─────────────────────────

print(u'\n  4 · DÍA DE LA SEMANA')
dowT = serie('dowT')
dowA = serie('dowAtend')
dowP = serie('dowPerd')
cierra(u'totales por día contra el total', TOTAL_DECL, [sum(dowT)])
cierra(u'atendidas por día contra las atendidas', sum(atend), [sum(dowA)])
cierra(u'perdidas por día contra las perdidas', sum(perd), [sum(dowP)])

td = busca_tabla('día', 'riesgo')
if td:
    malas = 0
    for f in td[1:]:
        if len(f) < 6:
            continue
        tot, pe, pct = num(f[1]), num(f[3]), num(f[5])
        if None in (tot, pe, pct):
            continue
        if abs(pe / tot * 100 - pct) > 0.06:
            malas += 1
            falla(u'%% pérdida de «%s»' % f[0][:18],
                  u'dice %.1f%%, sale %.2f%%' % (pct, pe / tot * 100))
    if not malas:
        pasa(u'los 7 %% de pérdida salen de sus partes')

# ───────────────────────── 5. minutos ─────────────────────────

print(u'\n  5 · MINUTOS')
MIN_DECL = 74999
mm = serie('minMes')
cierra(u'serie mensual contra el total declarado', MIN_DECL, [sum(mm)])

# El promedio declarado se LEE del documento, no se teclea aquí: un espejo de
# constantes a mano deja de ser espejo en cuanto alguien edita el documento.
MESES_COMPLETOS = len(mm) - 1        # noviembre está cortado
prom_todos = sum(mm) / float(len(mm))
prom_comp = sum(mm[:MESES_COMPLETOS]) / float(MESES_COMPLETOS)

m = re.search(r'Prom\.\s*([\d,]+)\s*/mes', HTML)
prom_decl = num(m.group(1)) if m else None
m = re.search(r'([\d.]+)%\s*prom\.\s*\((\d+)\s*meses', HTML)
pct_decl = float(m.group(1)) if m else None
meses_rotulo = int(m.group(2)) if m else None

if prom_decl is None or pct_decl is None:
    falla(u'promedio de minutos', u'no pude leer el promedio declarado del documento')
else:
    print(u'      declarado: %s min/mes · %.1f%% del plan · rótulo «%s meses»'
          % (fmt(prom_decl), pct_decl, meses_rotulo))
    if abs(prom_decl - prom_comp) < 1 and meses_rotulo == MESES_COMPLETOS:
        pasa(u'el promedio sale de los %d meses COMPLETOS' % MESES_COMPLETOS,
             u'%s min · %.1f%% del plan' % (fmt(prom_comp), prom_comp / 100.0))
    elif abs(prom_decl - prom_todos) < 1:
        falla(u'el promedio mete un mes partido',
              u'declara %s/mes, que es dividir entre %d metiendo un noviembre '
              u'de %d días. Con los %d meses completos son %s min (%.1f%%)'
              % (fmt(prom_decl), len(mm), DIAS_NOV, MESES_COMPLETOS,
                 fmt(prom_comp), prom_comp / 100.0))
    else:
        falla(u'promedio de minutos',
              u'declara %s; con %d meses sale %s, con %d sale %s'
              % (fmt(prom_decl), len(mm), fmt(prom_todos),
                 MESES_COMPLETOS, fmt(prom_comp)))
    if abs(pct_decl - prom_comp / 100.0) > 0.15:
        falla(u'el %% del plan', u'declara %.1f%%, de los %d meses completos '
              u'sale %.1f%%' % (pct_decl, MESES_COMPLETOS, prom_comp / 100.0))
    else:
        pasa(u'el %% del plan sale del promedio de meses completos',
             u'%.1f%%' % pct_decl)

# «Ningún mes genera excedente»: se comprueba, no se cree.
if max(mm) < 10000:
    pasa(u'«ningún mes genera excedente»', u'el máximo es %s (enero)' % fmt(max(mm)))
else:
    falla(u'«ningún mes genera excedente»', u'el máximo es %s' % fmt(max(mm)))

# ───────────────────────── 6. composición por destino ─────────────────────────

print(u'\n  6 · COMPOSICIÓN POR TIPO DE DESTINO')
tc = busca_tabla('tipo de destino', 'regla')
if not tc:
    falla(u'tabla de reglas de contabilización', u'no la encontré')
else:
    lls, mins, pcts = [], [], []
    for f in tc[1:]:
        if len(f) < 5:
            continue
        lls.append(num(f[2]) or 0)
        mins.append(num(f[3]) or 0)
        pcts.append(num(f[4]) or 0)
    cierra(u'minutos por destino contra el total', MIN_DECL, mins,
           clave='destino-minutos')
    cierra(u'llamadas por destino contra el total', TOTAL_DECL, lls,
           clave='destino-llamadas')
    if abs(sum(pcts) - 100) > 0.35:
        falla(u'%% del consumo', u'suman %.1f%%' % sum(pcts))
    else:
        pasa(u'%% del consumo', u'%.1f%%' % sum(pcts))

# ───────────────────────── 7. desglose financiero ─────────────────────────

print(u'\n  7 · DESGLOSE FINANCIERO DE JUNIO — contra sí mismo')
print(u'      (el documento publica DOS tablas: la vigente y la foto de junio)')
tf = busca_tabla('junio 2026', 'monto')
SUB_DECL = IVA_DECL = TOT_DECL = None
conceptos = []
if not tf:
    falla(u'tabla de facturación de junio', u'no la encontré')
else:
    for f in tf[1:]:
        if len(f) < 3:
            continue
        et = f[0].lower()
        v = num(f[2])
        if v is None:
            continue
        if 'subtotal' in et:
            SUB_DECL = v
        elif et.startswith('iva'):
            IVA_DECL = v
        elif 'total con iva' in et:
            TOT_DECL = v
        else:
            conceptos.append((f[0], v))
    cierra(u'subtotal contra sus %d conceptos' % len(conceptos),
           SUB_DECL, [v for _, v in conceptos], tol=0.01)
    if abs(SUB_DECL * 0.16 - IVA_DECL) <= 0.01:
        pasa(u'IVA al 16% del subtotal', u'$%s' % fmt(IVA_DECL))
    else:
        falla(u'IVA', u'declara $%s, el 16%% de $%s es $%s'
              % (fmt(IVA_DECL), fmt(SUB_DECL), fmt(SUB_DECL * 0.16)))
    if abs((SUB_DECL + IVA_DECL) - TOT_DECL) <= 0.01:
        pasa(u'total = subtotal + IVA', u'$%s' % fmt(TOT_DECL))
    else:
        falla(u'TOTAL CON IVA de junio',
              u'declara $%s, pero subtotal + IVA = $%s · diferencia $%s '
              u'(= $%s antes de IVA, un DID de $99)'
              % (fmt(TOT_DECL), fmt(SUB_DECL + IVA_DECL),
                 fmt(TOT_DECL - SUB_DECL - IVA_DECL),
                 fmt((TOT_DECL - SUB_DECL - IVA_DECL) / 1.16)),
              clave='total-iva-junio')

# ───────────────────────── 8. contra las fuentes vivas ─────────────────────────

print(u'\n  8 · EL DESGLOSE CONTRA LAS FUENTES VIVAS')
print(u'      (el MRR institucional es el del GRC y nada más)')

grc_mrr = None
try:
    G = json.load(io.open(os.path.join(RAIZ, 'data', 'grc-zoho.json'), encoding='utf-8'))
    filas = G.get('filas') or G.get('cuentas') or []
    if isinstance(filas, dict):
        filas = list(filas.values())
    for r in filas:
        if str(r.get('cid')) == '946' and not r.get('agrupada'):
            grc_mrr = r.get('mrrFin')
            grc_mov = r.get('movimiento')
            grc_cl = r.get('clasif')
            break
except Exception as e:
    aviso(u'GRC', u'no se pudo leer: %s' % e)

# La tabla VIGENTE: la que el documento publica como lo que se factura hoy.
tv = busca_tabla('concepto', 'monto')
if tv is tf:
    tv = None                      # sólo encontró la de junio
mrr_decl = None
if tv:
    for f in tv[1:]:
        if len(f) >= 3 and 'vigente' in f[0].lower():
            mrr_decl = num(f[2])

if grc_mrr is None:
    aviso(u'MRR del GRC', u'no encontré la fila del CID 946 — NO se concluye '
                          u'que el desglose esté bien ni mal, se concluye que '
                          u'falta mirarlo')
else:
    print(u'      GRC: MRR $%s · %s · clasif %s' % (fmt(grc_mrr), grc_mov, grc_cl))
    if mrr_decl is None:
        falla(u'EL DOCUMENTO NO PUBLICA EL MRR VIGENTE',
              u'sólo trae el desglose de junio ($%s sin IVA, $%s con IVA) y el '
              u'GRC dice $%s «%s»: diferencia $%s/mes (%.0f%%). Un documento '
              u'que titula la factura de hace cinco meses hace que alguien le '
              u'cite al cliente una cifra que no existe'
              % (fmt(SUB_DECL), fmt(TOT_DECL), fmt(grc_mrr), grc_mov,
                 fmt(SUB_DECL - grc_mrr), (SUB_DECL - grc_mrr) / grc_mrr * 100))
    elif abs(mrr_decl - grc_mrr) <= 1:
        pasa(u'el MRR vigente que publica = MRR del GRC', u'$%s' % fmt(mrr_decl))
        # Y la tabla vigente tiene que cerrar contra ese MRR.
        lineas = [num(f[2]) for f in tv[1:]
                  if len(f) >= 3 and 'vigente' not in f[0].lower()
                  and num(f[2]) is not None]
        cierra(u'la tabla vigente contra su MRR', mrr_decl, lineas, tol=0.01)
        print(u'      la foto de junio ($%s sin IVA) queda rotulada como tal, '
              u'con $%s de diferencia contra el mes vigente'
              % (fmt(SUB_DECL), fmt(SUB_DECL - mrr_decl)))
    else:
        falla(u'el MRR que publica el documento',
              u'dice $%s y el GRC dice $%s' % (fmt(mrr_decl), fmt(grc_mrr)))

print(u'\n  8.1 · LÍNEA POR LÍNEA CONTRA LOS SERVICIOS VIVOS DE LA CUENTA')


def servicios_vivos():
    u"""`cuentas.servicios_json` del CID 946. Las credenciales NO se imprimen."""
    env = {}
    ruta = os.path.join(RAIZ, '.env.local')
    if not os.path.exists(ruta):
        return None, u'no hay .env.local'
    for linea in io.open(ruta, encoding='utf-8'):
        linea = linea.strip()
        if linea and not linea.startswith('#') and '=' in linea:
            k, v = linea.split('=', 1)
            env[k.strip()] = v.strip().strip('"').strip("'")
    base = env.get('NEXT_PUBLIC_SUPABASE_URL', '').rstrip('/')
    llave = (env.get('SUPABASE_SERVICE_ROLE_KEY')
             or env.get('NEXT_PUBLIC_SUPABASE_ANON_KEY'))
    if not base or not llave:
        return None, u'faltan credenciales en .env.local'
    url = u'%s/rest/v1/cuentas?cid=eq.946&select=servicios_json,facturacion,estado' % base
    pet = urllib.request.Request(url, headers={
        'apikey': llave, 'Authorization': 'Bearer %s' % llave,
        'Accept': 'application/json'})
    try:
        with urllib.request.urlopen(pet, timeout=25) as r:
            filas = json.loads(r.read().decode('utf-8'))
    except Exception as e:                                        # noqa: BLE001
        return None, u'%s' % e
    if not filas:
        return None, u'sin fila para el CID 946'
    return filas[0], None


viv, err = servicios_vivos()
if viv is None:
    aviso(u'servicios vivos de la cuenta',
          u'NO SE PUDIERON LEER (%s). Un hueco aquí no prueba que el desglose '
          u'esté bien: prueba que no se miró' % err)
else:
    vivos = []
    for s in (viv.get('servicios_json') or []):
        d = u'%s %s' % (s.get('nombre') or '', s.get('descripcion') or '')
        # El importe de la línea es el ÚLTIMO «= $n» de su descripción, o el
        # único importe si no trae multiplicación.
        ms = re.findall(r'=\s*\$([\d,]+(?:\.\d+)?)', d)
        if not ms:
            ms = re.findall(r'\$([\d,]+(?:\.\d+)?)', d)
        importe = float(ms[-1].replace(',', '')) if ms else 0.0
        vivos.append((s.get('nombre') or u'(sin nombre)', importe))
    suma_viva = sum(v for _, v in vivos)
    print(u'      %d línea(s) viva(s), suman $%s' % (len(vivos), fmt(suma_viva)))
    for n, v in vivos:
        print(u'        $%10s  %s' % (fmt(v), n[:58]))
    if grc_mrr is not None and abs(suma_viva - grc_mrr) <= 1:
        pasa(u'los servicios vivos = MRR del GRC',
             u'$%s · dos fuentes independientes dicen lo mismo' % fmt(suma_viva))

    # Los conceptos de la foto de junio que YA NO se facturan tienen que
    # llevarlo escrito en su propia fila. Que esté en la nota general no basta:
    # quien lee la tabla no lee la nota, y ahí es donde se arranca el cobro que
    # se le acaba planteando al cliente.
    vivos_txt = u' '.join(n.lower() for n, _ in vivos)
    CLAVES = {u'voicebot': u'voicebot', u'tokens chatbot': u'chatbot',
              u'whatsapp api': u'whatsapp'}
    sin_marcar, fuera = [], []
    for n, v in conceptos:
        clave = next((k for k in CLAVES if re.search(k, n, re.I)), None)
        if clave is None:
            continue
        if CLAVES[clave] in vivos_txt:
            continue                      # sigue vivo, nada que marcar
        fuera.append((n, v))
        if u'ya no se factura' not in n.lower():
            sin_marcar.append(n)
    if fuera:
        print(u'      conceptos de junio que ya no se facturan: %s = $%s/mes'
              % (u' + '.join(n.split(u'—')[0].strip() for n, _ in fuera),
                 fmt(sum(v for _, v in fuera))))
    if sin_marcar:
        falla(u'CONCEPTOS QUE EL DOCUMENTO COBRA Y YA NO SE FACTURAN',
              u'%s · no llevan «YA NO SE FACTURA» en su fila. El Voicebot es '
              u'el hallazgo 2 del documento («$3,000 con $0 de uso») y la baja '
              u'YA ESTÁ HECHA: sin marcarlo, alguien se lo plantea al cliente'
              % u' · '.join(sin_marcar))
    elif fuera:
        pasa(u'las líneas que ya no se facturan van marcadas en su fila',
             u'%d de %d' % (len(fuera), len(fuera)))
    # Y lo que SÍ sigue cobrándose sin uso documentado.
    if u'cp chat' in vivos_txt or u'agente cp chat' in vivos_txt:
        cp = next((v for n, v in vivos if 'cp chat' in n.lower()), 0)
        pasa(u'CP Chat sigue vivo y es la exposición real',
             u'$%s/mes · %.1f%% del MRR vigente' % (fmt(cp), cp / suma_viva * 100))


# ───────────────────────── 9. el −68% ─────────────────────────

print(u'\n  9 · EL CONTRASTE DE VOLUMEN')
ene, nov = total_m[0], total_m[-1]
oct_ = total_m[-2]
caida_cruda = (nov - ene) / ene * 100          # 17 días contra 31
nov_ritmo = nov / float(DIAS_NOV) * 30.0
caida_ritmo = (nov_ritmo - ene) / ene * 100
caida_oct = (oct_ - ene) / ene * 100           # meses completos
print(u'      enero %s (mes completo) · octubre %s (completo) · noviembre %s (%d días)'
      % (fmt(ene), fmt(oct_), fmt(nov), DIAS_NOV))
print(u'      posibles lecturas: cruda %.0f%% · al ritmo de nov %.0f%% · '
      u'meses completos %.0f%%' % (caida_cruda, caida_ritmo, caida_oct))

# La cifra que el documento declara se LEE del documento.
decl = [float(x) for x in re.findall(r'<div class="kval">−([\d.]+)%</div>', HTML)]
decl += [float(x) for x in re.findall(r'Contracción de −([\d.]+)%', HTML)]
decl = sorted(set(decl))
if not decl:
    aviso(u'contracción declarada', u'no la encontré en el documento')
else:
    print(u'      el documento declara: %s' % u', '.join(u'−%.0f%%' % d for d in decl))
    crudas = [d for d in decl if abs(-d - caida_cruda) < 1.5]
    if crudas:
        falla(u'una contracción que compara 17 días contra 31',
              u'el documento declara −%.0f%%, que es noviembre partido contra '
              u'enero completo. Al ritmo de noviembre serían %.0f%%, y entre '
              u'meses completos (ene→oct) son %.0f%%' % (crudas[0],
              caida_ritmo, caida_oct))
    elif all(abs(-d - caida_oct) < 1.5 for d in decl):
        pasa(u'la contracción se mide entre meses completos',
             u'−%.0f%% ene→oct, y noviembre queda rotulado como parcial'
             % abs(caida_oct))
    else:
        falla(u'contracción declarada',
              u'declara %s y las lecturas posibles son cruda %.0f%%, al ritmo '
              u'%.0f%%, completos %.0f%%'
              % (u'/'.join(u'−%.0f%%' % d for d in decl),
                 caida_cruda, caida_ritmo, caida_oct))

# ───────────────────────── 10. contradicciones de conteo ─────────────────────

print(u'\n 10 · CONTRADICCIONES DE CONTEO ENTRE SECCIONES')

# LAS NOTAS DE CORRECCIÓN SE RECORTAN ANTES DE BUSCAR EN EL TEXTO.
# Sin esto el guion se delata a sí mismo: la nota que avisa de «36 DIDs dados de
# baja» contiene esa frase, así que el detector se dispararía para siempre y un
# verificador que falla siempre deja de servir. Y al revés: si las notas NO
# están, es que nadie publicó la corrección, y ESO sí es un fallo.
NOTAS = len(re.findall(r'<!--NOTA:INICIO-->', HTML))
sin_notas = re.sub(r'<!--NOTA:INICIO-->.*?<!--NOTA:FIN-->', ' ', HTML, flags=re.S)
plano = re.sub(r'<[^>]+>', ' ', sin_notas)
plano = re.sub(r'\s+', ' ', plano)
if NOTAS == 0:
    falla(u'las notas de corrección',
          u'el documento no trae un solo bloque NOTA:INICIO. O nadie publicó '
          u'las correcciones, o alguien las borró: las cifras que no cerraban '
          u'quedan sin marcar')
else:
    pasa(u'notas de corrección publicadas en el documento',
         u'%d bloque(s), recortados antes de buscar contradicciones' % NOTAS)

# DIDs dados de baja: 72 → 46 son 26. El FODA dice 36.
if re.search(r'36 DIDs dados de baja', plano):
    falla(u'DIDs dados de baja',
          u'el FODA dice «36 DIDs dados de baja»; 72 → 46 son 26. '
          u'El 36 es el número de DIDs RASTREABLES, no de bajas')
else:
    pasa(u'DIDs dados de baja', u'26 en todas las secciones')

# Fallas del AV sin resolver.
tav = busca_tabla('falla identificada', 'estado')
if tav:
    estados = [f[3].upper() for f in tav[1:] if len(f) >= 4]
    sin_res = sum(1 for e in estados if 'SIN RESOLVER' in e)
    abiertas = len(estados)
    if re.search(r'7 sin resolver', plano):
        falla(u'fallas del AV sin resolver',
              u'el hallazgo 10 dice «7 sin resolver»; la tabla lista %d fallas, '
              u'de las que %d dicen literalmente SIN RESOLVER y las otras %d '
              u'(PENDIENTE, REQUIERE ING.) tampoco están cerradas. '
              u'Ni 7 ni 6: son %d abiertas de %d'
              % (abiertas, sin_res, abiertas - sin_res, abiertas, abiertas))
    else:
        pasa(u'fallas del AV', u'%d abiertas de %d' % (abiertas, abiertas))

# «Ninguno de los DIDs cancelados rastreables estaba inactivo» · la tabla es parcial.
tdid = busca_tabla('did / descripción', 'tipo')
if tdid:
    parciales = [num(f[1]) for f in tdid[1:] if len(f) > 1 and num(f[1])]
    tot_did = parciales[-1] if parciales else None
    listados = sum(parciales[:-1]) if parciales else 0
    if tot_did and listados < tot_did:
        aviso(u'tabla de DIDs cancelados',
              u'enseña %d de los 36 rastreables (%s de %s llamadas, %.0f%%). '
              u'El superlativo «ninguno estaba inactivo» cubre 36, la tabla '
              u'sostiene %d: está ROTULADO como total de 36, así que no es un '
              u'error, pero el resto no se puede comprobar en el documento'
              % (len(parciales) - 1, fmt(listados), fmt(tot_did),
                 listados / tot_did * 100, len(parciales) - 1))

# «$7,200 = 26.2% del subtotal»
m = re.search(r'26\.2% del subtotal', plano)
if m and SUB_DECL:
    r = 7200.0 / SUB_DECL * 100
    if abs(r - 26.2) < 0.1:
        pasa(u'«$7,200 = 26.2% del subtotal»', u'%.1f%% del subtotal declarado' % r)
    else:
        falla(u'«26.2% del subtotal»', u'7,200/%s = %.1f%%' % (fmt(SUB_DECL), r))

# ───────────────────────── cierre ─────────────────────────

print(u'\n  ' + u'═' * 72)
if fallos:
    print(u'  %d COSA(S) QUE NO CIERRAN:' % len(fallos))
    for q, d in fallos:
        print(u'    · %s — %s' % (q, d))
if avisos:
    print(u'  %d AVISO(S) — no son errores de suma, son cifras que hay que '
          u'leer con su letra chica:' % len(avisos))
    for q, d in avisos:
        print(u'    · %s — %s' % (q, d))
if marcados:
    print(u'  %d DESFASE(S) QUE NO CIERRAN Y EL DOCUMENTO LOS DECLARA — el '
          u'agregado se publica, la parte no se cita:' % len(marcados))
    for q, d in marcados:
        print(u'    ~ %s — %s' % (q, d))
if not fallos and not avisos and not marcados:
    print(u'  TODO CIERRA.')
elif not fallos:
    print(u'')
    print(u'  Nada queda sin marcar. El expediente se puede publicar.')
else:
    print(u'')
    print(u'  Un hallazgo aquí NO impide publicar el expediente: impide publicar')
    print(u'  esa cifra sin marcarla CON PALABRAS, en el documento y en el')
    print(u'  expediente. [[feedback-contexto-ia-sin-huecos]]')

sys.exit(1 if fallos else 0)
