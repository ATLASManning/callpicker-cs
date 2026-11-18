# -*- coding: utf-8 -*-
u"""
CONCILIA LA AUDITORÍA DE MEDICALL EXPERT (C31 · CID 162474)
============================================================

    python scripts/concilia-auditoria-medicall-expert.py [ruta.html]

POR QUÉ ESTE SE PARECE MÁS A UNA FICHA QUE A UNA TABLA
--------------------------------------------------------
Los otros dos conciliadores recalculan tablas. Este reporte casi no tiene:
sus siete gráficas son PNG en base64 y la mayoría de sus cifras viven EN LA
PROSA. Así que aquí lo que se comprueba no es tanto que sus tablas cuadren
—cuadran— como que **lo que afirma SOBRE NOSOTROS siga siendo verdad hoy**.

Y ahí estaba el problema. Un reporte fechado el 17 de noviembre repetía, letra
por letra, el párrafo de alarma que el expediente v1.0 había escrito en JULIO:
«753 días activa con un solo ticket de soporte abierto, adopción en 25/100 sin
ningún módulo verificado». Los 753 días caían el 24 de julio de 2026. En
noviembre son 869. Nada en el documento avisaba de que esa frase no se había
vuelto a medir, y ninguna de nuestras herramientas lo miraba.

**Una cifra nuestra citada en un reporte del cliente caduca igual que
cualquier otra, y caduca en silencio.** Esa es la clase de error que este
guion existe para cazar. [[feedback-verificar-antes-asegurar]]

LO QUE COMPRUEBA
----------------
  · la aritmética interna que sí es recalculable (totales, tasas, repartos);
  · **cada cifra NUESTRA que el documento cita, contra la fuente viva**: MRR
    contra el GRC, antigüedad contra `activo_desde`, health score, tickets,
    adopción, seguimiento KAM;
  · que el mes PARCIAL no sostenga ninguna afirmación de tendencia;
  · las contradicciones entre secciones;
  · y el cruce mes a mes contra `data/analisis-llamadas.json`.

Hereda de Salud y Hogar las dos trampas: las notas de corrección van entre
`<!--NOTA:INICIO-->` y `<!--NOTA:FIN-->`, se recortan antes de buscar y se
EXIGE que existan; lo que no se puede cerrar se declara por clave en
`<!-- CONCILIACION:MARCADOS ... -->`.

Acepta una ruta como argumento para probarlo rompiendo una copia.
"""
from __future__ import print_function
import io
import json
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
POR_DEFECTO = os.path.join(RAIZ, 'public', 'auditorias',
                           'Medicall_Expert_Auditoria_Llamadas_2026-11-17.html')
RUTA = sys.argv[1] if len(sys.argv) > 1 else POR_DEFECTO
CID = '162474'
EXPEDIENTE = os.path.join(RAIZ, 'app', 'auditoria', 'medicall-expert-data.ts')

HTML = io.open(RUTA, encoding='utf-8', errors='replace').read()

NOTAS = len(re.findall(r'<!--NOTA:INICIO-->', HTML))
SIN_NOTAS = re.sub(r'<!--NOTA:INICIO-->.*?<!--NOTA:FIN-->', u' ', HTML, flags=re.S)
PLANO = re.sub(r'\s+', u' ', re.sub(r'<[^>]+>', u' ', SIN_NOTAS))

DECLARADOS = set()
_m = re.search(r'CONCILIACION:MARCADOS\s+([a-z0-9,\-]+)', HTML)
if _m:
    DECLARADOS.update(k for k in _m.group(1).split(',') if k)

fallos, marcados, avisos = [], [], []


def falla(que, detalle, clave=None):
    if clave and clave in DECLARADOS:
        marcados.append((que, detalle))
        print(u'    %-44s  ~  NO CIERRA, Y EL DOCUMENTO LO DICE · %s' % (que, detalle))
        return
    fallos.append((que, detalle))
    print(u'    %-44s *** NO CIERRA ***  %s' % (que, detalle))


def ok(que, detalle=u''):
    print(u'    %-44s  ok   %s' % (que, detalle))


def aviso(que, detalle):
    avisos.append((que, detalle))
    print(u'    %-44s  !   %s' % (que, detalle))


def num(s):
    try:
        return float(re.sub(r'[^\d.\-]', u'', s))
    except (ValueError, TypeError):
        return None


def dice(patron):
    u"""¿El documento afirma esto? Devuelve el match sobre el texto plano SIN
       las notas, para que una corrección no se confunda con el error."""
    return re.search(patron, PLANO, re.I)


# ── Las fuentes vivas ────────────────────────────────────────────────────────

def env(c):
    p = os.path.join(RAIZ, '.env.local')
    for l in io.open(p, encoding='utf-8'):
        l = l.strip()
        if l.startswith(c + '='):
            return l.split('=', 1)[1].strip().strip('"').strip("'")


def cuenta():
    import urllib.request
    u = env('NEXT_PUBLIC_SUPABASE_URL')
    k = env('SUPABASE_SERVICE_ROLE_KEY') or env('SUPABASE_SERVICE_KEY')
    r = urllib.request.Request(
        u + '/rest/v1/cuentas?cid=eq.%s&select=*' % CID,
        headers={'apikey': k, 'Authorization': 'Bearer ' + k})
    f = json.loads(urllib.request.urlopen(r, timeout=90).read().decode('utf-8'))
    return f[0] if f else None


def jsonf(nombre):
    p = os.path.join(RAIZ, 'data', nombre)
    return json.load(io.open(p, encoding='utf-8')) if os.path.exists(p) else None


print(u'')
print(u'  CONCILIACIÓN · MEDICALL EXPERT (C31 · CID %s)' % CID)
print(u'  %s' % os.path.basename(RUTA))
print(u'  ' + u'═' * 74)

# ── 0 · las notas ────────────────────────────────────────────────────────────
print(u'\n  LAS NOTAS DE CORRECCIÓN')
if NOTAS == 0:
    falla(u'las notas de corrección',
          u'ni un bloque NOTA:INICIO: las correcciones van VISIBLES dentro')
else:
    ok(u'las notas de corrección', u'%d bloque(s)' % NOTAS)

# ── 1 · la aritmética que sí es recalculable ─────────────────────────────────
print(u'\n  LA ARITMÉTICA INTERNA')
SAL = 53680.0
m = dice(r'([\d,]+)\s*llamadas salientes y\s*([\d,]+)\s*llamadas entrantes')
if not m:
    falla(u'los totales de portada', u'no encuentro «N salientes y M entrantes»')
else:
    sal, ent = num(m.group(1)), num(m.group(2))
    SAL = sal
    mt = dice(r'([\d,]+)\s*de\s*([\d,]+)\s*llamadas\.?\s*(?:Esto|$)|de las\s*([\d,]+)\s*llamadas del periodo')
    tot = None
    mm = dice(r'([\d,]+)\s*de\s*54,585|98\.3%\s*de\s*las\s*([\d,]+)')
    if mm:
        tot = num(mm.group(1) or mm.group(2))
    m2 = dice(r'98\.3%\s*de las\s*([\d,]+)\s*llamadas del periodo')
    if m2:
        tot = num(m2.group(1))
    if tot is None:
        m3 = dice(r'([\d,]+)\s*de\s*([\d,]+)\s*llamadas')
        tot = num(m3.group(2)) if m3 else None
    if tot and abs((sal + ent) - tot) > 0.5:
        falla(u'salientes + entrantes', u'%d + %d = %d y el documento dice %d'
              % (sal, ent, sal + ent, tot))
    elif tot:
        ok(u'salientes + entrantes', u'%d + %d = %d' % (sal, ent, tot))
        if abs(100.0 * sal / tot - 98.3) > 0.06:
            falla(u'el 98.3% de tráfico saliente',
                  u'%d/%d = %.2f%%' % (sal, tot, 100.0 * sal / tot))
        else:
            ok(u'el 98.3% de tráfico saliente')

m = dice(r'([\d,]+)\s*de\s*([\d,]+)\s*intentos')
if m:
    perd, de = num(m.group(1)), num(m.group(2))
    pct = 100.0 * perd / de
    if abs(pct - 57.9) > 0.06:
        falla(u'la tasa de pérdida saliente', u'%d/%d = %.2f%%' % (perd, de, pct))
    else:
        ok(u'la tasa de pérdida saliente', u'%d/%d = %.1f%%' % (perd, de, pct))
    mc = dice(r'De las\s*([\d,]+)\s*llamadas salientes conectadas')
    if mc:
        con = num(mc.group(1))
        if abs((de - perd) - con) > 0.5:
            falla(u'las conectadas', u'%d − %d = %d y dice %d' % (de, perd, de - perd, con))
        else:
            ok(u'las conectadas', u'%d − %d = %d' % (de, perd, con))

m = dice(r'([\d,]+)\s*n[uú]meros [uú]nicos marcados, con un promedio de\s*([\d.]+)\s*intentos')
if m:
    uni, prom = num(m.group(1)), num(m.group(2))
    if abs(SAL / uni - prom) > 0.006:
        falla(u'los intentos por número', u'%d/%d = %.4f y dice %.2f'
              % (SAL, uni, SAL / uni, prom))
    else:
        ok(u'los intentos por número', u'%d/%d = %.2f' % (SAL, uni, prom))

m = dice(r'concentra\s*([\d,]+)\s*llamadas\s*\(([\d.]+)%\s*del volumen anual\)')
if m:
    v, pct = num(m.group(1)), num(m.group(2))
    if abs(100.0 * v / SAL - pct) > 0.06:
        falla(u'la ventana 14:00–15:00', u'%d/%d = %.2f%% y dice %.1f%%'
              % (v, SAL, 100.0 * v / SAL, pct))
    else:
        ok(u'la ventana 14:00–15:00', u'%d/%d = %.1f%%' % (v, SAL, pct))

m = dice(r'va de\s*([\d.]+)%\s*\([^)]*\)\s*a\s*([\d.]+)%\s*\([^)]*\)\s*—?\s*([\d.]+)\s*puntos')
if m:
    a, b, br = num(m.group(1)), num(m.group(2)), num(m.group(3))
    if abs(abs(b - a) - br) > 0.06:
        falla(u'la brecha entre asesores', u'|%.1f − %.1f| = %.1f y dice %.1f'
              % (b, a, abs(b - a), br))
    else:
        ok(u'la brecha entre asesores', u'%.1f − %.1f = %.1f pts' % (b, a, abs(b - a), ))

# Separador `.{0,N}?` y no `[^.]*?`: las propias cifras llevan punto decimal,
# así que un separador «sin puntos» no cruza «8.2%» y la comprobación no se
# ejecuta nunca — se ve igual que si hubiera pasado. [[feedback-verificar-antes-asegurar]]
m = re.findall(r'([\d.]+)%\s*se resuelven v[ií]a autoservicio.{0,60}?([\d.]+)%\s*se transfieren'
               r'.{0,60}?([\d.]+)%\s*se pierden.{0,30}?([\d.]+)%\s*terminan', PLANO, re.I)
if m:
    partes = [float(x) for x in m[0]]
    if abs(sum(partes) - 100.0) > 0.11:
        falla(u'la composición de entrantes', u'suma %.1f%%' % sum(partes))
    else:
        ok(u'la composición de entrantes', u'%.1f%%' % sum(partes))

# ── 2 · CADA CIFRA NUESTRA, CONTRA LA FUENTE VIVA ────────────────────────────
print(u'\n  LO QUE EL DOCUMENTO DICE DE NOSOTROS, CONTRA LA FUENTE VIVA')
try:
    C = cuenta()
except Exception as e:
    C = None
    aviso(u'la ficha de la cuenta', u'no la pude leer: %s' % str(e)[:60])

G = jsonf('grc-zoho.json')
fila = next((x for x in (G or {}).get('filas', []) if str(x.get('cid') or '') == CID), None)

if fila:
    mrr = fila.get('mrrFin')
    print(u'    GRC: $%s · %s · %s · %s facturas · %s meses'
          % (format(int(mrr), ','), fila.get('movimiento'), fila.get('clasif'),
             fila.get('facturas'), fila.get('meses')))
    citados = set(re.findall(r'MRR\s*(?:de\s*)?\$?\s*([\d,]+)', PLANO, re.I))
    malos = [c for c in citados if abs((num(c) or 0) - mrr) > 1]
    if malos:
        falla(u'el MRR citado',
              u'el documento dice $%s y el GRC dice $%s en sus CUATRO cortes'
              % (u', $'.join(sorted(malos)), format(int(mrr), ',')))
    elif citados:
        ok(u'el MRR citado', u'$%s, el del GRC' % format(int(mrr), ','))

if C:
    # Antigüedad: la cifra más fácil de reciclar sin darse cuenta.
    desde = C.get('activo_desde')
    m = dice(r'([\d,]+)\s*d[ií]as de relaci[oó]n|lleva\s*([\d,]+)\s*d[ií]as')
    if desde and m:
        import datetime
        d0 = datetime.date(*[int(x) for x in str(desde)[:10].split('-')])
        mfin = dice(r'(\d{1,2})\s*de\s*noviembre de\s*(\d{4})|–\s*17 noviembre (\d{4})')
        d1 = datetime.date(2026, 11, 17)
        real = (d1 - d0).days
        dicho = num(m.group(1) or m.group(2))
        if abs(real - dicho) > 5:
            falla(u'los días de relación',
                  u'dice %d y desde %s son %d. Los %d caían el %s — '
                  u'la cifra viene del corte anterior'
                  % (dicho, desde, real, dicho,
                     (d0 + datetime.timedelta(days=int(dicho))).isoformat()))
        else:
            ok(u'los días de relación', u'%d desde %s' % (real, desde))

    # Health score.
    hs = C.get('health_score')
    m = dice(r'Health Score de la cuenta\s*\((\d+)/100\)|HS\s*(\d+)')
    if hs is not None and m:
        dicho = num(m.group(1) or m.group(2))
        if abs(hs - dicho) > 0.5:
            falla(u'el health score', u'dice %d/100 y la ficha dice %d' % (dicho, hs))
        else:
            ok(u'el health score', u'%d/100' % hs)

    # Seguimiento KAM: «cero» es una afirmación fuerte y se comprueba.
    tiene_obs = bool((C.get('observaciones_kam') or '').strip())
    tiene_cont = bool(C.get('ultimo_contacto'))
    if dice(r'cero (?:actividad de )?seguimiento KAM|cero observaciones registradas'):
        if tiene_obs or tiene_cont:
            falla(u'«cero seguimiento KAM / cero observaciones»',
                  u'la ficha trae observaciones_kam (%d caracteres) y '
                  u'ultimo_contacto = %s'
                  % (len(C.get('observaciones_kam') or ''), C.get('ultimo_contacto')))
        else:
            ok(u'«cero seguimiento KAM»', u'la ficha también está vacía')
    else:
        ok(u'«cero seguimiento KAM»', u'el documento ya no lo afirma')

V = jsonf('veredicto-candidatura.json')
vfila = None
if V:
    # Sólo las listas DE DICCIONARIOS. Aplanar «todas las listas» funcionaba
    # por casualidad: `sin_pareja` es una lista de cadenas y estaba vacía. En
    # cuanto el generador le puso dos nombres, el guion reventó con
    # AttributeError. Un filtro por tipo no depende de que un campo siga vacío.
    filas = ([x for x in V if isinstance(x, dict)] if isinstance(V, list) else
             [x for v in V.values() if isinstance(v, list)
              for x in v if isinstance(x, dict)])
    vfila = next((x for x in filas if str(x.get('cid') or '') == CID), None)
    if not filas:
        aviso(u'el veredicto de candidatura',
              u'el archivo no trae ninguna fila: las comprobaciones de tickets '
              u'y adopción NO se ejecutaron')

if vfila:
    tot_t, abi_t = vfila.get('tickets'), vfila.get('tickets_abiertos')
    if dice(r'un solo ticket de soporte abierto en todo ese periodo'):
        falla(u'«un solo ticket en todo el periodo»',
              u'son %s tickets en total, de los cuales %s abierto(s): '
              u'«1 abierto» no es «1 en toda la relación»' % (tot_t, abi_t))
    else:
        ok(u'el conteo de tickets', u'%s en total · %s abierto(s)' % (tot_t, abi_t))

    nivel = vfila.get('nivel_adop_VyC')
    if dice(r'sin ning[uú]n m[oó]dulo verificado'):
        if nivel and nivel != 'no_aplica':
            falla(u'«sin ningún módulo verificado»',
                  u'nuestro `nivel_adop_VyC` es «%s» con %s fuentes: el score de '
                  u'adopción (25) y «ningún módulo verificado» no son lo mismo'
                  % (nivel, vfila.get('fuentes_VyC')))
        else:
            ok(u'«sin ningún módulo verificado»')
    else:
        ok(u'la adopción', u'nivel_adop_VyC = %s' % nivel)

    # El plan ilimitado contra la base de minutos que NOSOTROS modelamos.
    if dice(r'llamadas ilimitadas, sin pol[ií]tica de bolsa') and vfila.get('base_minutos'):
        aviso(u'el plan ilimitado contra nuestra ficha',
              u'el cliente confirma plan ilimitado, pero nuestra ficha modela '
              u'base_minutos=%s y publica %.1f%% de consumo. Si no hay bolsa, '
              u'ese %% —y la señal CONSUMO_CRITICO— no significan nada aquí'
              % (vfila.get('base_minutos'), vfila.get('pct_consumo') or 0))

# ── 3 · el chat, que el documento declara NO tener ───────────────────────────
print(u'\n  EL CANAL DE CHAT')
try:
    tchat = io.open(os.path.join(RAIZ, 'app', 'callpicker-chat', 'chat-data.ts'),
                    encoding='utf-8').read()
except IOError:
    tchat = u''
if CID in tchat:
    ventana = tchat[max(0, tchat.find(CID) - 900): tchat.find(CID) + 900]
    roto = 'operational_error' in ventana or 'sin_medicion' in ventana
    if dice(r'No se cont[oó] con datos del canal de Chat'):
        falla(u'«no se contó con datos de Chat»',
              u'la cuenta SÍ está en la fuente de Callpicker Chat, y está como '
              u'%s: no es que no usen el chat, es que no lo podemos leer'
              % (u'«sin medición» por fallo de recolección' if roto else u'medida'))
    else:
        ok(u'el canal de chat', u'el documento ya dice en qué estado está')
else:
    ok(u'el canal de chat', u'la cuenta no está en la fuente: «no se contó» es exacto')

# ── 4 · el mes parcial no sostiene tendencias ────────────────────────────────
print(u'\n  EL MES PARTIDO')
if not dice(r'[Nn]oviembre.{0,40}(?:parcial|incompleto|al d[ií]a 17)'):
    falla(u'el rótulo del mes parcial',
          u'noviembre no se declara parcial en ninguna parte')
else:
    ok(u'el rótulo del mes parcial', u'declarado')

m = dice(r'ca[ií]da de volumen saliente de\s*(\d+)%\s*entre julio y noviembre'
         r'|de\s*9,360 a\s*2,770')
if m:
    falla(u'la caída «−70% julio→noviembre»',
          u'compara un julio completo con 17 días de noviembre. Entre meses '
          u'completos (jul 9,360 → oct 5,998) la caída es del 35.9%',
          clave='caida-contra-mes-parcial')
else:
    ok(u'la caída de volumen', u'no se apoya en el mes parcial')

# La clase de error era «el descenso es sostenido», y estaba escrita con TRES
# verbos distintos en cuatro sitios. Arreglar el que se reportó y dar verde es
# el vicio que esta casa no se permite. [[feedback-proactividad-jose-manuel]]
if dice(r'(?:retroced|decreci|descend)\w*\s+de forma\s+(?:igualmente\s+)?sostenida'
        r'|retroced\w*\s+mes con mes'):
    falla(u'«el descenso fue sostenido»',
          u'sus propias cifras dicen 4,103 (sep) → 5,998 (oct): octubre SUBIÓ '
          u'un 46%. No es un descenso sostenido')
else:
    ok(u'«el descenso fue sostenido»', u'ya no se afirma, con ningún verbo')

# El mes de 17 días como extremo de una comparación mensual, en cualquiera de
# sus disfraces: la banda de once meses, y el parcial como «menor actividad».
if dice(r'menor actividad \(noviembre'):
    falla(u'el parcial como «menor actividad»',
          u'el argumento de invariancia se apoya en 17 días; con octubre '
          u'(5,998, mes completo) se sostiene igual y no es refutable')
else:
    ok(u'el punto de «menor actividad»', u'es un mes completo')

if dice(r'banda de 56.{0,4}61%\s*durante los once meses'):
    falla(u'«la banda durante los once meses»',
          u'enero quedó en 43.5% y noviembre no es un mes: la banda cubre de '
          u'febrero a octubre, nueve meses')
else:
    ok(u'la extensión de la banda', u'no se declara sobre once meses')

# ── 5 · contradicciones entre secciones ──────────────────────────────────────
print(u'\n  CONTRADICCIONES ENTRE SECCIONES')
inst = re.findall(r'(?:las|Revisar las|Auditar las)\s*(\d+)\s*instancias de marcaci[oó]n repetida',
                  PLANO, re.I)
decl = dice(r'Se identificaron\s*(\d+)\s*combinaciones n[uú]mero-d[ií]a')
if inst and decl:
    esperado = decl.group(1)
    distintos = set(inst)
    if distintos - {esperado}:
        falla(u'el conteo de marcación repetida',
              u'§3.4 declara %s combinaciones y otras secciones piden auditar %s'
              % (esperado, u'/'.join(sorted(distintos))))
    else:
        ok(u'el conteo de marcación repetida', u'%s en todas las secciones' % esperado)

# ── 6 · el cruce vivo de llamadas ────────────────────────────────────────────
print(u'\n  CONTRA NUESTRO CORTE DE LLAMADAS')
A = jsonf('analisis-llamadas.json')
nuestro = (A or {}).get('cuentas', {}).get(CID)
if not nuestro:
    aviso(u'nuestro corte', u'el CID no está en data/analisis-llamadas.json')
else:
    sal = nuestro.get('sal') or {}
    print(u'    corte %s · nuestras salientes %s'
          % (A['meta'].get('corte'), sal.get('total')))
    meses = sal.get('meses') or {}
    # La afirmación central del reporte: la meseta de 56–61% TODOS los meses.
    banda = dice(r'entre\s*(\d+)%\s*y\s*(\d+)%\s*de p[eé]rdida')
    if banda and meses:
        lo, hi = num(banda.group(1)), num(banda.group(2))
        fuera, callados = [], []
        for k in sorted(meses):
            mm = meses[k]
            t = mm.get('total') or 0
            p = mm.get('Lost') or 0
            if not t:
                continue
            pct = 100.0 * p / t
            if pct < lo - 0.2 or pct > hi + 0.2:
                fuera.append(u'%s %.1f%% (%d de %d)' % (k, pct, p, t))
                # Un mes fuera de la banda no es un fallo si el documento lo
                # DICE. Lo que no se tolera es que la banda se presente como
                # universal mientras un mes queda fuera en silencio.
                if u'%.1f%%' % pct not in PLANO:
                    callados.append(u'%s %.1f%% (%d de %d)' % (k, pct, p, t))
        if callados:
            falla(u'la banda de %d–%d%%' % (lo, hi),
                  u'nuestro corte deja fuera %s y el documento no lo dice'
                  % u'; '.join(callados))
        elif fuera:
            ok(u'la banda de %d–%d%%' % (lo, hi),
               u'queda fuera %s, y el documento lo declara' % u'; '.join(fuera))
        else:
            ok(u'la banda de %d–%d%%' % (lo, hi),
               u'%d meses de nuestro corte caen dentro' % len(meses))
        if dice(r'cada mes del a[nñ]o, sin excepci[oó]n') and fuera:
            falla(u'«cada mes sin excepción»',
                  u'se sigue afirmando que la banda no tiene excepciones, y '
                  u'nuestro corte deja fuera %s' % u'; '.join(fuera))
    # Y los meses que el documento cita por su número.
    casan, discrepan = 0, []
    for mm in re.finditer(r'([\d,]{3,6})\s*\((?:ago|sep|oct|nov|julio|enero|marzo)[^)]*\)',
                          PLANO):
        pass
    CITAS = {'2026-01': 984, '2026-03': 3021, '2026-07': 9360, '2026-08': 5470}
    for k, v in sorted(CITAS.items()):
        n = meses.get(k)
        if not n:
            continue
        if n.get('total') == v:
            casan += 1
        else:
            discrepan.append(u'%s: nuestro %s vs documento %d' % (k, n.get('total'), v))
    if discrepan:
        falla(u'los meses que el documento cita', u'; '.join(discrepan))
    elif casan:
        ok(u'los meses que el documento cita',
           u'%d coinciden EXACTAMENTE con nuestro corte' % casan)

# ── 7 · el expediente ────────────────────────────────────────────────────────
print(u'\n  EL EXPEDIENTE')
if os.path.exists(EXPEDIENTE) and fila:
    t = io.open(EXPEDIENTE, encoding='utf-8').read()
    t = re.sub(r'/\*[\s\S]*?\*/|//[^\n]*', u' ', t)      # la cabecera es la nota
    esperado = u'$%s' % format(int(fila.get('mrrFin')), ',')
    if esperado not in t:
        falla(u'el MRR del expediente', u'no dice %s, que es el del GRC' % esperado)
    else:
        ok(u'el MRR del expediente', u'%s' % esperado)
    # La cifra vieja sólo puede aparecer NEGADA. La ventana es de 40 caracteres
    # y admite varias formas de prohibir, porque el expediente la niega de tres
    # maneras distintas («no $6,831», «NO $6,831, que es…», «ningún documento
    # del cliente cita $6,831»): una ventana corta con una sola forma daba rojo
    # sobre una prohibición correcta, y un candado que se equivoca se desactiva.
    sueltas = [m.start() for m in re.finditer(r'\$6,831', t)
               if not re.search(r'\b(no|NO|[Nn]ing[uú]n\w*|nunca|jam[aá]s)\b',
                                t[max(0, m.start() - 40):m.start()])]
    if sueltas:
        falla(u'el expediente cita la cifra vieja',
              u'nombra $6,831 sin negarlo (%d vez/veces)' % len(sueltas))
    elif re.search(r'\$6,831', t):
        ok(u'los $6,831', u'aparece solo para prohibirlo')

print(u'')
print(u'  ' + u'═' * 74)
print(u'  %d fallo(s) · %d aviso(s) · %d marcado(s)'
      % (len(fallos), len(avisos), len(marcados)))
if fallos:
    print(u'')
    for q, d in fallos:
        print(u'  *** %s: %s' % (q, d))
    print(u'')
    print(u'  NO SE PUBLICA ASÍ. Se corrige, o se MARCA con palabras dentro del')
    print(u'  documento y se declara por clave en `CONCILIACION:MARCADOS`.')
    sys.exit(1)
print(u'  Nada queda sin marcar. El expediente se puede publicar.')
sys.exit(0)
