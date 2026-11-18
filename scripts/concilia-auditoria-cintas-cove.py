# -*- coding: utf-8 -*-
u"""
CONCILIA LA AUDITORÍA FORENSE DE CINTAS COVE (D14 · CID 23870)
===============================================================

    python scripts/concilia-auditoria-cintas-cove.py [ruta.html]

POR QUÉ ESTE ES DISTINTO AL DE SANTA ROSA Y AL DE SALUD Y HOGAR
----------------------------------------------------------------
Aquellos traían las cifras EMBEBIDAS en un `const D = {...}` y se recalculaban
contra sus propias series. **Este no tiene series: sus doce gráficas son PNG en
base64 de matplotlib.** Así que lo único recalculable son sus TABLAS contra sus
propios totales declarados, y el contraste contra nuestras fuentes vivas.

Eso cambia la lectura de un verde: aquí un verde dice «las tablas cuadran entre
sí», no «el dato de origen es correcto». Lo que de verdad ancla este documento
es el cruce de abajo contra `data/analisis-llamadas.json`.

LO QUE COMPRUEBA
----------------
  · la tabla mensual, columna por columna, contra los KPI de portada;
  · que las cuatro categorías de entrantes sumen el total;
  · cada porcentaje mensual recalculado desde sus partes;
  · la tabla horaria contra el total y contra las perdidas;
  · la tabla de minutos facturables, fila por fila y columna por columna;
  · la tabla de salientes por agente, fila por fila y sus porcentajes;
  · el ranking de agentes: minutos / llamadas;
  · los DIDs + los no identificados contra los totales;
  · **el cruce vivo**: mes por mes contra nuestro corte de llamadas, y el MRR
    contra el GRC, que es el institucional y nada más.

LAS DOS TRAMPAS QUE YA COSTARON UNA VEZ, HEREDADAS DE SALUD Y HOGAR
--------------------------------------------------------------------
1. **El guion se delata a sí mismo.** Las notas de corrección CONTIENEN las
   frases que el detector busca, así que el candado se dispararía para siempre
   y dejaría de servir. Las notas van entre `<!--NOTA:INICIO-->` y
   `<!--NOTA:FIN-->`, se RECORTAN antes de buscar, y **se exige que existan**.
2. **Lo que no se puede cerrar se declara POR CLAVE dentro del documento**
   (`<!-- CONCILIACION:MARCADOS clave1,clave2 -->`). Sale como «NO CIERRA, Y EL
   DOCUMENTO LO DICE» y no falla. Un desfase NUEVO que nadie declare sí lo deja
   en rojo. Un candado siempre rojo se ignora.

Acepta una ruta como argumento: así se PRUEBA que sabe fallar, rompiendo una
copia, sin tocar el documento publicado. [[feedback-probar-al-reves]]
"""
from __future__ import print_function
import io
import json
import os
import re
import sys
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
POR_DEFECTO = os.path.join(RAIZ, 'public', 'auditorias',
                           'Cintas_Cove_Auditoria_Forense_2026-11-17.html')
RUTA = sys.argv[1] if len(sys.argv) > 1 else POR_DEFECTO
CID = '23870'

HTML = io.open(RUTA, encoding='utf-8', errors='replace').read()

# ── Las notas, y los desfases declarados ─────────────────────────────────────
NOTAS = len(re.findall(r'<!--NOTA:INICIO-->', HTML))
SIN_NOTAS = re.sub(r'<!--NOTA:INICIO-->.*?<!--NOTA:FIN-->', u' ', HTML, flags=re.S)

DECLARADOS = set()
_m = re.search(r'CONCILIACION:MARCADOS\s+([a-z0-9,\-]+)', HTML)
if _m:
    DECLARADOS.update(k for k in _m.group(1).split(',') if k)

fallos, marcados, avisos = [], [], []


def falla(que, detalle, clave=None):
    if clave and clave in DECLARADOS:
        marcados.append((que, detalle))
        print(u'    %-46s  ~  NO CIERRA, Y EL DOCUMENTO LO DICE · %s' % (que, detalle))
        return
    fallos.append((que, detalle))
    print(u'    %-46s *** NO CIERRA ***  %s' % (que, detalle))


def ok(que, detalle=u''):
    print(u'    %-46s  ok   %s' % (que, detalle))


def aviso(que, detalle):
    avisos.append((que, detalle))
    print(u'    %-46s  !   %s' % (que, detalle))


def num(s):
    s = re.sub(r'<[^>]+>', u'', s)
    s = s.replace(u',', u'').replace(u'%', u'').replace(u'~', u'').strip()
    try:
        return float(s)
    except ValueError:
        return None


# ── Las tablas del documento ─────────────────────────────────────────────────

def tablas():
    u"""Cada `<table>` como lista de filas, y cada fila como lista de celdas en
       texto plano. Se guarda también el encabezado para poder buscarlas por lo
       que dicen y no por el orden en que aparecen: una tabla nueva mas arriba
       no debe mover la medición a otro sitio sin avisar."""
    out = []
    for t in re.findall(r'<table.*?</table>', HTML, re.S):
        filas = []
        for tr in re.findall(r'<tr.*?</tr>', t, re.S):
            celdas = [re.sub(r'\s+', u' ', re.sub(r'<[^>]+>', u' ', c)).strip()
                      for c in re.findall(r'<t[dh][^>]*>(.*?)</t[dh]>', tr, re.S)]
            if celdas:
                filas.append(celdas)
        if filas:
            out.append(filas)
    return out


TABLAS = tablas()


def busca_tabla(*pistas):
    u"""La tabla cuyo ENCABEZADO contiene todas las pistas."""
    for filas in TABLAS:
        cab = u' | '.join(filas[0]).lower()
        if all(p.lower() in cab for p in pistas):
            return filas
    return None


def kpi(etiqueta):
    u"""El valor de una tarjeta KPI de portada, buscado por su etiqueta."""
    m = re.search(r'<div class="value">([^<]+)</div>\s*<div class="label">\s*'
                  + re.escape(etiqueta), HTML)
    return num(m.group(1)) if m else None


print(u'')
print(u'  CONCILIACIÓN · CINTAS COVE (D14 · CID %s)' % CID)
print(u'  %s' % os.path.basename(RUTA))
print(u'  ' + u'═' * 74)

# ── 0 · las notas tienen que estar ───────────────────────────────────────────
print(u'\n  LAS NOTAS DE CORRECCIÓN')
if NOTAS == 0:
    falla(u'las notas de corrección',
          u'el documento no trae un solo bloque NOTA:INICIO: si se publican '
          u'correcciones, van VISIBLES dentro del documento')
else:
    ok(u'las notas de corrección', u'%d bloque(s) marcado(s)' % NOTAS)

# ── 1 · la tabla mensual ─────────────────────────────────────────────────────
print(u'\n  LA TABLA MENSUAL CONTRA LOS KPI DE PORTADA')
men = busca_tabla('mes', 'atendidas', 'perdidas')
if not men:
    falla(u'la tabla mensual', u'no la encuentro: el documento cambió de forma')
    MESES = []
else:
    MESES = []
    for f in men[1:]:
        if 'PROMEDIO' in f[0].upper():
            continue
        t, a, p = num(f[1]), num(f[2]), num(f[3])
        if None in (t, a, p):
            continue
        MESES.append((f[0], t, a, p, num(f[4]), num(f[5]), num(f[6])))
    st, sa, sp = (sum(x[1] for x in MESES), sum(x[2] for x in MESES),
                  sum(x[3] for x in MESES))
    for etq, suma, kpi_etq in ((u'total de entrantes', st, u'Entrantes totales'),
                               (u'atendidas por agente', sa, u'Atendidas por agente'),
                               (u'perdidas + voicemail', sp, u'Perdidas + Voicemail')):
        k = kpi(kpi_etq)
        if k is None:
            falla(u'el KPI «%s»' % kpi_etq, u'no está en la portada')
        elif abs(k - suma) > 0.5:
            falla(u'la columna «%s»' % etq,
                  u'las filas suman %d y la portada declara %d' % (suma, k))
        else:
            ok(u'la columna «%s»' % etq, u'%d filas suman %d' % (len(MESES), suma))

    # Las cuatro categorías de entrantes tienen que repartir el total.
    tot = kpi(u'Entrantes totales')
    aten = kpi(u'Atendidas por agente')
    auto = kpi(u'Autoservicio (IVR)')
    perd = kpi(u'Perdidas + Voicemail')
    if None not in (tot, aten, auto, perd):
        if abs((aten + auto + perd) - tot) > 0.5:
            falla(u'las cuatro categorías de entrantes',
                  u'%d + %d + %d = %d, y el total declarado es %d'
                  % (aten, auto, perd, aten + auto + perd, tot))
        else:
            ok(u'las cuatro categorías de entrantes',
               u'%d + %d + %d = %d' % (aten, auto, perd, tot))

    # Cada porcentaje mensual, recalculado desde sus propias partes.
    malos = []
    for nom, t, a, p, pct_p, pct_a, _min in MESES:
        if pct_p is not None and abs(100.0 * p / t - pct_p) > 0.06:
            malos.append(u'%s: %d/%d = %.2f%% y dice %.1f%%'
                         % (nom, p, t, 100.0 * p / t, pct_p))
        if pct_a is not None and abs(100.0 * a / t - pct_a) > 0.06:
            malos.append(u'%s atención: %d/%d = %.2f%% y dice %.1f%%'
                         % (nom, a, t, 100.0 * a / t, pct_a))
    if malos:
        falla(u'los porcentajes mensuales', u'; '.join(malos[:3]))
    else:
        ok(u'los porcentajes mensuales', u'%d meses × 2 recalculados' % len(MESES))

# ── 2 · noviembre es un mes PARCIAL ──────────────────────────────────────────
print(u'\n  EL MES PARTIDO')
parciales = [m for m in MESES if 'parcial' in m[0].lower()]
if not parciales:
    aviso(u'el mes parcial',
          u'ninguna fila se rotula «parcial»: si el corte acaba a mitad de mes, '
          u'tiene que decirlo o cualquier promedio miente')
else:
    ok(u'el mes parcial', u'rotulado: %s' % parciales[0][0])
    # Y lo que importa de verdad: que el TITULAR no apoye la tendencia en él.
    nom_parcial = re.sub(r'\s*\(.*', u'', parciales[0][0]).strip()
    pct_parcial = parciales[0][4]
    plano = re.sub(r'\s+', u' ', re.sub(r'<[^>]+>', u' ', SIN_NOTAS))
    patron = re.compile(r'a\s+%.1f%%\s+en\s+%s' % (pct_parcial, nom_parcial.split()[0]),
                        re.I)
    if patron.search(plano):
        falla(u'el titular de la tendencia',
              u'remata en %s, que es un mes PARCIAL. Entre meses completos la '
              u'serie acaba en %s' % (nom_parcial, MESES[-2][0] if len(MESES) > 1 else u'?'),
              clave='titular-mes-parcial')
    else:
        ok(u'el titular de la tendencia', u'no remata en el mes parcial')

# ── 3 · la tabla horaria ─────────────────────────────────────────────────────
print(u'\n  LA TABLA HORARIA')
hor = busca_tabla('hora', 'volumen', 'perdidas')
if not hor:
    falla(u'la tabla horaria', u'no la encuentro')
else:
    vol = sum(num(f[1]) or 0 for f in hor[1:])
    per = sum(num(f[2]) or 0 for f in hor[1:])
    malos = []
    for f in hor[1:]:
        v, p, pc = num(f[1]), num(f[2]), num(f[3])
        if None not in (v, p, pc) and abs(100.0 * p / v - pc) > 0.06:
            malos.append(u'%s: %.2f%% vs %.1f%%' % (f[0], 100.0 * p / v, pc))
    if malos:
        falla(u'los porcentajes por hora', u'; '.join(malos[:3]))
    else:
        ok(u'los porcentajes por hora', u'%d horas recalculadas' % (len(hor) - 1))

    tot = kpi(u'Entrantes totales')
    perd = kpi(u'Perdidas + Voicemail')
    if None not in (tot, perd):
        fuera_llam, fuera_perd = tot - vol, perd - per
        if abs(fuera_llam - fuera_perd) > 0.5:
            aviso(u'las horas fuera de la tabla',
                  u'quedan %d llamadas y %d perdidas fuera de 08–17h'
                  % (fuera_llam, fuera_perd))
        else:
            ok(u'las horas fuera de la tabla',
               u'%d llamadas fuera de 08–17h y las %d perdidas: '
               u'coherente con «fuera de horario se pierde el 100%%»'
               % (fuera_llam, fuera_perd))

        # El reparto dentro/fuera de horario contra la propia tabla horaria.
        md = re.search(r'de las [\d,]+ llamadas perdidas totales,?\s*<strong>\s*'
                       r'([\d,]+)\s*\(\d+%\)\s*ocurrieron dentro', SIN_NOTAS, re.I)
        if md:
            dentro = num(md.group(1))
            if abs(dentro - per) > 0.5:
                falla(u'el reparto dentro/fuera de horario',
                      u'declara %d perdidas dentro del horario y la tabla horaria '
                      u'suma %d en 08–17h' % (dentro, per),
                      clave='reparto-dentro-fuera')
            else:
                ok(u'el reparto dentro/fuera de horario')

# ── 4 · minutos facturables ──────────────────────────────────────────────────
print(u'\n  LA TABLA DE MINUTOS FACTURABLES')
fac = busca_tabla('min ent fact', 'min sal fact')
if not fac:
    falla(u'la tabla de facturables', u'no la encuentro')
else:
    se = ss = st2 = 0
    malas = []
    for f in fac[1:]:
        if 'PROMEDIO' in f[0].upper():
            continue
        e, s, t = num(f[2]), num(f[4]), num(f[5])
        if None in (e, s, t):
            continue
        se, ss, st2 = se + e, ss + s, st2 + t
        if abs((e + s) - t) > 0.5:
            malas.append(u'%s: %d+%d≠%d' % (f[0], e, s, t))
    if malas:
        falla(u'las filas de facturables', u'; '.join(malas[:3]))
    else:
        ok(u'las filas de facturables', u'cada fila cierra')
    k = kpi(u'Min. facturables')
    if k is not None and abs(k - st2) > 0.5:
        falla(u'el total de facturables',
              u'las filas suman %d y la portada declara %d' % (st2, k))
    elif k is not None:
        ok(u'el total de facturables', u'%d = %d entrantes + %d salientes'
           % (st2, se, ss))
    m = re.search(r'Entrantes\s*([\d,]+)\s*\+\s*Sal\s*([\d,]+)', SIN_NOTAS)
    if m:
        ke, ks = num(m.group(1)), num(m.group(2))
        if abs(ke - se) > 0.5 or abs(ks - ss) > 0.5:
            falla(u'el desglose ent/sal de la portada',
                  u'declara %d+%d y las filas dan %d+%d' % (ke, ks, se, ss))
        else:
            ok(u'el desglose ent/sal de la portada')
    # LOS MINUTOS ESTÁN DOS VECES, Y NADIE LOS CRUZABA.
    #
    # La tabla mensual (§7) trae una columna «Min facturables» y la de consumo
    # (§13) trae «Min Ent Fact»: son el mismo número escrito dos veces. Salió
    # rompiendo el documento a propósito — falsear un minuto de agosto pasaba
    # el conciliador entero sin una sola línea roja, porque cada tabla cerraba
    # consigo misma. La contradicción entre secciones es el detector más
    # barato que hay, y había que pedirlo. [[feedback-auditorias-verificar]]
    if MESES:
        porfila = {}
        for f in fac[1:]:
            if 'PROMEDIO' in f[0].upper():
                continue
            e = num(f[2])
            if e is not None:
                porfila[re.sub(r'\s*\(.*', u'', f[0]).strip().lower()] = e
        choca = []
        for nom, _t, _a, _p, _pp, _pa, mn in MESES:
            k = re.sub(r'\s*\(.*', u'', nom).strip().lower()
            if mn is None or k not in porfila:
                continue
            if abs(porfila[k] - mn) > 0.5:
                choca.append(u'%s: §7 dice %d y §13 dice %d' % (nom, mn, porfila[k]))
        if choca:
            falla(u'los minutos de §7 contra los de §13', u'; '.join(choca[:3]))
        else:
            ok(u'los minutos de §7 contra los de §13',
               u'%d meses, el mismo número en las dos tablas' % len(porfila))

    # Los salientes de esta tabla contra el KPI de salientes.
    ksal = kpi(u'Salientes totales')
    ssal = sum(num(f[3]) or 0 for f in fac[1:] if 'PROMEDIO' not in f[0].upper())
    if ksal is not None:
        if abs(ksal - ssal) > 0.5:
            falla(u'la columna de salientes',
                  u'las filas suman %d y la portada declara %d' % (ssal, ksal))
        else:
            ok(u'la columna de salientes', u'%d' % ssal)

# ── 5 · salientes por agente ─────────────────────────────────────────────────
print(u'\n  LOS SALIENTES POR AGENTE')
out = busca_tabla('conectadas', 'no conect')
if not out:
    falla(u'la tabla de salientes por agente', u'no la encuentro')
else:
    tot_a = con_a = nocon_a = 0
    malas = []
    for f in out[1:]:
        t, c, n, pc = num(f[1]), num(f[2]), num(f[3]), num(f[4])
        if None in (t, c, n):
            continue
        tot_a, con_a, nocon_a = tot_a + t, con_a + c, nocon_a + n
        if abs((c + n) - t) > 0.5:
            malas.append(u'%s: %d+%d≠%d' % (f[0][:22], c, n, t))
        if pc is not None and abs(100.0 * n / t - pc) > 0.06:
            malas.append(u'%s: %.2f%% vs %.1f%%' % (f[0][:22], 100.0 * n / t, pc))
    if malas:
        falla(u'las filas de salientes por agente', u'; '.join(malas[:3]))
    else:
        ok(u'las filas de salientes por agente', u'%d agentes, filas y %% cierran'
           % (len(out) - 1))
    ksal = kpi(u'Salientes totales')
    if ksal is not None and tot_a < ksal:
        falta = ksal - tot_a
        if falta > 0.05 * ksal:
            falla(u'la cobertura de la tabla de salientes',
                  u'los agentes suman %d de %d: faltan %d sin atribuir'
                  % (tot_a, ksal, falta), clave='salientes-sin-agente')
        else:
            aviso(u'la cobertura de la tabla de salientes',
                  u'los agentes suman %d de %d (%d sin atribuir, %.1f%%)'
                  % (tot_a, ksal, falta, 100.0 * falta / ksal))

# ── 6 · ranking de agentes entrantes ─────────────────────────────────────────
print(u'\n  EL RANKING DE AGENTES')
ran = busca_tabla('min facturables', 'min prom')
if not ran:
    falla(u'el ranking de agentes', u'no lo encuentro')
else:
    malas = []
    for f in ran[1:]:
        ll, mn, pr = num(f[1]), num(f[2]), num(f[3])
        if None in (ll, mn, pr):
            continue
        if abs(mn / ll - pr) > 0.06:
            malas.append(u'%s: %.2f vs %.1f' % (f[0][:24], mn / ll, pr))
    if malas:
        falla(u'los minutos por llamada', u'; '.join(malas[:3]))
    else:
        ok(u'los minutos por llamada', u'%d agentes recalculados' % (len(ran) - 1))

# ── 7 · DIDs + no identificados ──────────────────────────────────────────────
print(u'\n  LOS DIDs CONTRA LOS TOTALES')
did = busca_tabla('telephone_number_id', 'volumen')
if not did:
    aviso(u'la tabla de DIDs', u'no la encuentro: el cruce no se hizo')
else:
    ent = sal = 0
    for f in did[1:]:
        m = re.search(r'([\d,]+)\s*ent\s*·\s*([\d,]+)\s*sal', f[-1])
        if m:
            ent += num(m.group(1)) or 0
            sal += num(m.group(2)) or 0
    nul_e = re.search(r'(\d+)\s*llamadas en entrantes', SIN_NOTAS)
    nul_s = re.search(r'y\s*(\d+)\s*en salientes', SIN_NOTAS)
    ne = num(nul_e.group(1)) if nul_e else 0
    ns = num(nul_s.group(1)) if nul_s else 0
    for etq, suma, k in ((u'entrantes', ent + ne, kpi(u'Entrantes totales')),
                         (u'salientes', sal + ns, kpi(u'Salientes totales'))):
        if k is None:
            continue
        if abs(suma - k) > 0.5:
            falla(u'los DIDs de %s' % etq,
                  u'DIDs + no identificados = %d y el total es %d' % (suma, k))
        else:
            ok(u'los DIDs de %s' % etq, u'%d con los no identificados' % suma)

# ── 8 · el cruce vivo: nuestro corte de llamadas ─────────────────────────────
print(u'\n  CONTRA NUESTRO CORTE DE LLAMADAS (data/analisis-llamadas.json)')
MES_ES = {u'enero': '01', u'febrero': '02', u'marzo': '03', u'abril': '04',
          u'mayo': '05', u'junio': '06', u'julio': '07', u'agosto': '08',
          u'septiembre': '09', u'octubre': '10', u'noviembre': '11',
          u'diciembre': '12'}
try:
    cor = json.load(io.open(os.path.join(RAIZ, 'data', 'analisis-llamadas.json'),
                            encoding='utf-8'))
    nuestro = cor['cuentas'].get(CID)
except Exception as e:
    nuestro = None
    aviso(u'nuestro corte', u'no lo pude leer: %s' % str(e)[:60])

if nuestro:
    print(u'    corte %s · nuestro total %d'
          % (cor['meta'].get('corte'), nuestro['ent']['total']))
    casan, discrepan, nuestros_sin = 0, [], []
    for nom, t, a, p, _pp, _pa, _mn in MESES:
        mm = re.match(r'(\w+)\s+(\d{4})', nom)
        if not mm or mm.group(1).lower() not in MES_ES:
            continue
        clave = u'%s-%s' % (mm.group(2), MES_ES[mm.group(1).lower()])
        n = nuestro['ent']['meses'].get(clave)
        if not n:
            nuestros_sin.append(nom)
            continue
        nt = n.get('total', 0)
        na = n.get('Redirected', 0)
        np_ = n.get('Lost', 0) + n.get('Voicemail', 0)
        if (nt, na, np_) == (t, a, p):
            casan += 1
        else:
            # Nuestro corte puede estar TRUNCADO: eso no es que el reporte
            # mienta, es que nosotros tenemos menos mes. Se distingue.
            if nt < t:
                nuestros_sin.append(u'%s (nuestro corte trae %d de %d)' % (nom, nt, t))
            else:
                discrepan.append(u'%s: nuestro %d/%d/%d vs reporte %d/%d/%d'
                                 % (nom, nt, na, np_, t, a, p))
    if discrepan:
        falla(u'el cruce mes a mes', u'; '.join(discrepan[:3]))
    else:
        ok(u'el cruce mes a mes',
           u'%d mes(es) coinciden EXACTAMENTE en total, atendidas y perdidas' % casan)
    if nuestros_sin:
        aviso(u'los meses que nosotros no tenemos',
              u'%s — el reporte tiene MÁS dato que nuestro corte, no menos'
              % u'; '.join(nuestros_sin[:4]))

# ── 9 · el MRR institucional ─────────────────────────────────────────────────
print(u'\n  EL MRR: EL DEL GRC Y NADA MÁS')
try:
    g = json.load(io.open(os.path.join(RAIZ, 'data', 'grc-zoho.json'), encoding='utf-8'))
    # OJO: `serie` es la serie MENSUAL del institucional, no las cuentas. Las
    # cuentas están en `filas`. Usar la clave equivocada no daba error: daba
    # `None` y el bloque entero se saltaba en silencio, que es peor.
    fila = next((f for f in g['filas'] if str(f.get('cid') or '') == CID), None)
    if fila is None:
        aviso(u'el GRC', u'el CID %s no aparece en las %d filas del GRC'
              % (CID, len(g['filas'])))
except Exception as e:
    fila = None
    aviso(u'el GRC', u'no lo pude leer: %s' % str(e)[:60])

if fila:
    mrr = fila.get('mrrFin')
    print(u'    GRC: $%s · %s · %s · %d facturas'
          % (format(int(mrr), ','), fila.get('movimiento'), fila.get('clasif'),
             fila.get('facturas') or 0))
    # Que el documento NO cite otro MRR. La trampa de Salud y Hogar fue titular
    # la factura de un mes como si fuera el MRR institucional.
    otros = set(re.findall(r'MRR[^.$]{0,40}\$\s*([\d,]+)', SIN_NOTAS, re.I))
    malos = [x for x in otros if abs((num(x) or 0) - mrr) > 1]
    if malos:
        falla(u'el MRR citado en el documento',
              u'cita $%s y el GRC dice $%s' % (u', $'.join(malos), format(int(mrr), ',')))
    elif otros:
        ok(u'el MRR citado en el documento', u'coincide con el GRC')
    else:
        ok(u'el MRR en el documento',
           u'no cita ninguno — correcto: §18 declara que no tiene el plan vigente')

    # Y el expediente SÍ tiene que decirlo, porque es lo que ve Atlas.
    exp = os.path.join(RAIZ, 'app', 'auditoria', 'cintascove-data.ts')
    if os.path.exists(exp):
        t = io.open(exp, encoding='utf-8').read()
        esperado = u'$%s' % format(int(mrr), ',')
        if esperado not in t:
            falla(u'el MRR del expediente',
                  u'`cintascove-data.ts` no dice %s, que es el del GRC' % esperado)
        else:
            ok(u'el MRR del expediente', u'%s, el del GRC' % esperado)
        # La columna que NO sirve, por si alguien la espeja.
        #
        # OJO: aquí el guion se delataba a sí mismo, igual que en Salud y Hogar.
        # El expediente TIENE que nombrar los $13,965 — pero para prohibirlos,
        # porque Atlas solo ve los cuatro primeros hallazgos y necesita leer
        # cuál es la cifra que no debe citar. Lo que se vigila no es que la
        # cifra aparezca: es que aparezca NEGADA. Una mención sin negación sí
        # es el bug. [[feedback-verificar-antes-asegurar]]
        #
        # Y por el mismo motivo se RECORTAN los comentarios: la cabecera del
        # expediente documenta la corrección y cita la cifra vieja al
        # explicarla. Eso es la nota, no el dato — igual que `NOTA:INICIO` en
        # el HTML. Lo que se vigila es el CONTENIDO del `AuditoriaCase`.
        t = re.sub(r'/\*[\s\S]*?\*/|//[^\n]*', u' ', t)
        mala = re.search(r'cuentas\.facturacion', t) is None
        sueltas = [m.start() for m in re.finditer(r'\$13,965', t)
                   if not re.search(r'\b(no|NO)\s+(es\s+)?$',
                                    t[max(0, m.start() - 14):m.start()])]
        if sueltas:
            falla(u'el expediente cita `cuentas.facturacion`',
                  u'nombra $13,965 sin negarlo (%d vez/veces): esa es la columna '
                  u'que no sirve, y citarla sin decir que no sirve la convierte '
                  u'en dato' % len(sueltas))
        elif re.search(r'\$13,965', t):
            ok(u'los $13,965', u'aparece solo para prohibirlo, que es como debe estar')
        if mala:
            aviso(u'el expediente no nombra la fuente mala',
                  u'no dice `cuentas.facturacion`: conviene nombrarla para que se '
                  u'sepa de dónde salía la cifra vieja')

# ── 10 · contradicciones entre secciones ─────────────────────────────────────
print(u'\n  CONTRADICCIONES ENTRE SECCIONES')
plano = re.sub(r'\s+', u' ', re.sub(r'<[^>]+>', u' ', SIN_NOTAS))

# El total de entrantes atribuido al número PRINCIPAL, cuando son tres DIDs.
tot = kpi(u'Entrantes totales')
if tot and did:
    princ = None
    for f in did[1:]:
        if 'principal' in u' '.join(f).lower():
            m = re.search(r'([\d,]+)\s*ent', f[-1])
            if m:
                princ = num(m.group(1))
    if princ and re.search(r'%s llamadas al n[uú]mero principal' % format(int(tot), ','),
                           plano):
        falla(u'«N llamadas al número principal»',
              u'%d es el total de los TRES DIDs; al principal entraron %d'
              % (tot, princ), clave='total-al-numero-principal')
    else:
        ok(u'«N llamadas al número principal»')

# Recuperar más de lo que se pierde.
# `[^.]*?` NO sirve de separador aquí: entre medias hay un «10.5 meses» y el
# punto del decimal corta la expresión antes de llegar al dato. Pasó, y la
# comprobación se saltaba sin decir nada — un candado que no casa es un candado
# que no existe. Se separa por longitud, no por puntuación.
m8 = re.search(r'De las\s*([\d,]+)\s*llamadas que ingresaron en la hora 08:00.{0,80}?'
               r'([\d,]+)\s*se perdieron', plano, re.I)
mrec = re.search(r'Recuperaci[oó]n:\s*~?\s*([\d,]+)\s*llamadas/mes', plano, re.I)
mmes = re.search(r'·\s*([\d.]+)\s*meses', plano)
if m8 and mrec and mmes:
    perdidas8 = num(m8.group(2))
    pormes = num(mrec.group(1))
    meses = num(mmes.group(1))
    real = perdidas8 / meses
    if pormes > real * 1.15:
        falla(u'lo que promete recuperar la hora 08:00',
              u'promete ~%d/mes y en esa hora solo se pierden %.1f/mes '
              u'(%d en %.1f meses)' % (pormes, real, perdidas8, meses),
              clave='recuperacion-08')
    else:
        ok(u'lo que promete recuperar la hora 08:00', u'~%.1f/mes' % real)

print(u'')
print(u'  ' + u'═' * 74)
print(u'  %d fallo(s) · %d aviso(s) · %d marcado(s) en el documento'
      % (len(fallos), len(avisos), len(marcados)))
if fallos:
    print(u'')
    for q, d in fallos:
        print(u'  *** %s: %s' % (q, d))
    print(u'')
    print(u'  NO SE PUBLICA ASÍ. Un desfase se corrige o se MARCA con palabras')
    print(u'  dentro del documento; lo que no se puede cerrar se declara por')
    print(u'  clave en `CONCILIACION:MARCADOS`.')
    sys.exit(1)
print(u'  Nada queda sin marcar. El expediente se puede publicar.')
sys.exit(0)
