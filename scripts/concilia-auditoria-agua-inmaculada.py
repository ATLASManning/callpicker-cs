# -*- coding: utf-8 -*-
u"""RECALCULA LAS CIFRAS DEL REPORTE DE AGUA INMACULADA ANTES DE PUBLICARLO.

   Mismo patrón que `...-casa-galvan.py` y `...-cargo-lift.py`, con una
   diferencia que este reporte obligó a añadir: aquí el problema NO es que una
   cifra no cierre —casi todas cierran— sino que **la cifra titular mide otra
   cosa de la que dice medir**. El documento llama «no atendidas» a todo lo que
   no fue `Redirected`, metiendo en el mismo saco el autoservicio y el buzón, y
   con eso publica «más de la mitad de las llamadas no fueron atendidas». Las
   perdidas de verdad son 4,972 de 15,384 — una de cada tres.

   Un reparto que no cierra se ve sumando. Una definición inflada sólo se ve
   CONTRA LA FUENTE, así que este guion cruza obligatoriamente con
   `data/analisis-llamadas.json` (CID 333) y con el GRC, y si no puede leerlos
   lo dice en vez de concluir. [[feedback-metricas-derivadas-origen]]

   USO
       python -I scripts/concilia-auditoria-agua-inmaculada.py [ruta.html]

   La ruta es opcional para PROBAR QUE SABE FALLAR sobre una copia rota sin
   tocar el documento publicado. [[feedback-probar-al-reves]]
"""
from __future__ import division

import io
import json
import os
import re
import sys

try:
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
except Exception:                                                  # noqa: BLE001
    pass

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFECTO = os.path.join(RAIZ, 'public', 'auditorias',
                       'Auditoria-Agua-Inmaculada-2026.html')
RUTA = sys.argv[1] if len(sys.argv) > 1 else DEFECTO

CID = '333'
PLAN = 10000

fallos = []
avisos = []


def ok(cond, etiqueta, detalle=u''):
    print(u'  %-58s %s%s' % (etiqueta, u'OK' if cond else u'*** NO CIERRA',
                             (u'  ' + detalle) if detalle else u''))
    if not cond:
        fallos.append(etiqueta)
    return bool(cond)


def cerca(a, b, tol=0.051):
    return abs(a - b) <= tol


def miles(n):
    return format(int(round(n)), ',')


def bloque(txt, nombre):
    u"""El cuerpo de un `const <nombre> = { ... };` del script del reporte."""
    m = re.search(r'const\s+' + nombre + r'\s*=\s*\{(.*?)\n\}\s*;', txt, re.S)
    return m.group(1) if m else None


def arreglo(txt, nombre):
    u"""`nombre: [1, 2, 3]` -> [1, 2, 3]. None si no está: un hueco se dice."""
    m = re.search(r'\b' + nombre + r'\s*:\s*\[([^\]]*)\]', txt)
    if not m:
        return None
    return [int(x) for x in re.findall(r'-?\d+', m.group(1))]


def const_arreglo(txt, nombre):
    m = re.search(r'const\s+' + nombre + r'\s*=\s*\[([^\]]*)\]', txt)
    if not m:
        return None
    return [int(x) for x in re.findall(r'-?\d+', m.group(1))]


if not os.path.exists(RUTA):
    print(u'  no existe: %s' % RUTA)
    sys.exit(1)

html = io.open(RUTA, encoding='utf-8', errors='replace').read()

# ── LAS NOTAS QUE NOSOTROS AÑADIMOS SE RECORTAN ANTES DE BUSCAR ────────────
# Si no, el guion se delata a sí mismo: la nota que avisa de «el documento
# decía 51.3%» CONTIENE ese 51.3%, el detector lo encuentra para siempre y el
# candado deja de servir. Y se EXIGE que las marcas existan: borrarlas tiene
# que poner esto en rojo. [[auditoria-modulo]]
NOTA = re.compile(r'<!--NOTA:INICIO-->.*?<!--NOTA:FIN-->', re.S)
notas = NOTA.findall(html)
texto = NOTA.sub(u' ', html)

print(u'\n  CONCILIACIÓN · AUDITORÍA DE TELEFONÍA · AGUA INMACULADA (CID 333)')
print(u'  ' + u'=' * 72)
print(u'  documento: %s' % RUTA)
print(u'  notas nuestras marcadas en el documento: %d' % len(notas))

# ─── 0 · LAS SERIES EMBEBIDAS ──────────────────────────────────────────────
bEnt, bSal = bloque(html, 'ent'), bloque(html, 'sal')
bSalT, bEntT = bloque(html, 'salTipos'), bloque(html, 'entTipos')
if not all((bEnt, bSal, bSalT, bEntT)):
    print(u'  *** no encuentro los bloques `const ent/sal/salTipos/entTipos`. '
          u'Sin series no hay nada que recalcular, y eso NO es «todo bien».')
    sys.exit(1)

ENT = {k: arreglo(bEnt, k) for k in ('total', 'atend', 'perd', 'mf')}
SAL = {k: arreglo(bSal, k) for k in ('total', 'mf')}
SALT = {k: arreglo(bSalT, k) for k in ('celular', 'extension', 'fijo')}
ENTT = {k: arreglo(bEntT, k) for k in ('sip_pc', 'celular')}
HORA = const_arreglo(html, 'horaVals')
if HORA is None or any(v is None for v in list(ENT.values()) + list(SAL.values())
                       + list(SALT.values()) + list(ENTT.values())):
    print(u'  *** falta alguna serie dentro de los bloques. No se concluye nada.')
    sys.exit(1)

MESES = [u'Enero', u'Febrero', u'Marzo', u'Abril']
ok(len(HORA) == 24, u'la serie por hora trae las 24 horas', u'%d' % len(HORA))

# ─── 1 · LAS ENTRANTES CIERRAN POR DENTRO ──────────────────────────────────
print(u'\n  --- 1 · ENTRANTES · atendidas + «no atendidas» = total')
for i, m in enumerate(MESES):
    s = ENT['atend'][i] + ENT['perd'][i]
    if s != ENT['total'][i]:
        fallos.append(u'%s: %s + %s = %s y declara %s'
                      % (m, ENT['atend'][i], ENT['perd'][i], miles(s),
                         miles(ENT['total'][i])))
ok(not [f for f in fallos if f.split(':')[0] in MESES],
   u'los cuatro meses cierran atendidas + no atendidas')

TOT_ENT = sum(ENT['total'])
TOT_PERD = sum(ENT['perd'])
ok(TOT_ENT == 15384, u'el volumen entrante son las 15,384 que cita el KPI', miles(TOT_ENT))
ok(TOT_PERD == 7895, u'las «no atendidas» son las 7,895 que cita el KPI', miles(TOT_PERD))
ok(cerca(TOT_PERD / TOT_ENT * 100, 51.3, 0.06), u'la «tasa promedio 51.3%» es el agregado',
   u'%s/%s = %.2f%%' % (miles(TOT_PERD), miles(TOT_ENT), TOT_PERD / TOT_ENT * 100))

# El crecimiento ene→abr, que es el argumento del plan.
crec = ENT['total'][3] / ENT['total'][0] * 100 - 100
ok(cerca(crec, 17.8, 0.06), u'el crecimiento +17.8% ene→abr',
   u'%s→%s = +%.2f%%' % (miles(ENT['total'][0]), miles(ENT['total'][3]), crec))

# Las tasas mensuales que el documento publica en cuatro tarjetas.
for i, (m, decl) in enumerate(zip(MESES, (46.0, 49.6, 53.5, 55.2))):
    calc = ENT['perd'][i] / ENT['total'][i] * 100
    ok(cerca(calc, decl, 0.06), u'tasa publicada de %s: %.1f%%' % (m, decl),
       u'%s/%s = %.2f%%' % (miles(ENT['perd'][i]), miles(ENT['total'][i]), calc))

# ─── 2 · LOS MINUTOS FACTURABLES Y EL USO DEL PLAN ─────────────────────────
print(u'\n  --- 2 · MINUTOS FACTURABLES · la base de las dos propuestas')
totMF = [ENT['mf'][i] + SAL['mf'][i] for i in range(4)]
for i, m in enumerate(MESES):
    print(u'      %-8s ent %6s + sal %6s = %6s   %5.1f%% del plan'
          % (m, miles(ENT['mf'][i]), miles(SAL['mf'][i]), miles(totMF[i]),
             totMF[i] / PLAN * 100))
prom = sum(totMF) / 4.0
ok(cerca(round(prom), 9150, 0.6), u'el promedio facturable son los 9,150 del KPI',
   u'%.1f' % prom)
ok(cerca(prom / PLAN * 100, 91.5, 0.06), u'la utilización promedio 91.5%',
   u'%.2f%%' % (prom / PLAN * 100))
ok(totMF[3] == 9910, u'abril son los 9,910 min que cita el KPI', miles(totMF[3]))
ok(cerca(totMF[3] / PLAN * 100, 99.1, 0.06), u'abril al 99.1% del plan',
   u'%.2f%%' % (totMF[3] / PLAN * 100))
ok(totMF[3] == max(totMF), u'abril ES el pico del periodo, como afirma el texto',
   u'máximo %s' % miles(max(totMF)))

# ─── 3 · EL REPARTO POR TIPO · ENTRANTES CIERRA, SALIENTES NO ──────────────
print(u'\n  --- 3 · REPARTO POR TIPO DE DESTINO')
for i, m in enumerate(MESES):
    s = ENTT['sip_pc'][i] + ENTT['celular'][i]
    if s != ENT['mf'][i]:
        fallos.append(u'entrantes %s: los tipos suman %s y la serie declara %s'
                      % (m, miles(s), miles(ENT['mf'][i])))
ok(not [f for f in fallos if f.startswith(u'entrantes ')],
   u'los tipos ENTRANTES cierran mes a mes contra la serie')

huecos = []
for i, m in enumerate(MESES):
    s = SALT['celular'][i] + SALT['extension'][i] + SALT['fijo'][i]
    huecos.append(SAL['mf'][i] - s)
    print(u'      sal %-8s cel %6s + ext %5s + fijo %5s = %6s   serie %6s   hueco %s'
          % (m, miles(SALT['celular'][i]), miles(SALT['extension'][i]),
             miles(SALT['fijo'][i]), miles(s), miles(SAL['mf'][i]), miles(huecos[i])))
HUECO = sum(huecos)
TOT_SAL_MF = sum(SAL['mf'])
TOT_SAL_TIPOS = TOT_SAL_MF - HUECO
# El reparto de SALIENTES no cierra y NO hay cubo «otros»: la tabla publica su
# propio total al «100%», que es 322 minutos menor que el total de salientes de
# la tabla mensual. La misma cifra con dos valores en el mismo documento.
# [[feedback-tablas-deben-cerrar]]
print(u'      tipos %s · serie %s · faltan %s min (%.2f%%)'
      % (miles(TOT_SAL_TIPOS), miles(TOT_SAL_MF), miles(HUECO),
         HUECO / TOT_SAL_MF * 100))
ok(all(h >= 0 for h in huecos), u'ningún mes tiene más minutos por tipo que en total')
if HUECO:
    avisos.append(
        u'EL REPARTO DE MINUTOS SALIENTES NO CIERRA Y LA TABLA LO PUBLICA COMO «100%%»: '
        u'los tres tipos suman %s minutos y la tabla mensual declara %s salientes. '
        u'Faltan %s minutos (%.2f%%), repartidos %s. No hay cubo «otros», así que la '
        u'misma cifra aparece con dos valores en el mismo documento. El reparto es un '
        u'TECHO del %.1f%% del total saliente, no el total.'
        % (miles(TOT_SAL_TIPOS), miles(TOT_SAL_MF), miles(HUECO),
           HUECO / TOT_SAL_MF * 100,
           u' / '.join(u'%s %s' % (MESES[i], miles(huecos[i])) for i in range(4)),
           TOT_SAL_TIPOS / TOT_SAL_MF * 100))

# El 70–76% del celular: el rango que el texto afirma, contra la serie real.
pcts = [SALT['celular'][i] / SAL['mf'][i] * 100 for i in range(4)]
print(u'      celular sobre salientes: %s' % u', '.join(u'%.1f%%' % p for p in pcts))
ok(min(pcts) >= 70.0 and max(pcts) <= 76.5,
   u'el rango «70–76%» del celular se sostiene en las cuatro barras',
   u'%.1f–%.1f%%' % (min(pcts), max(pcts)))

# ─── 4 · LA SERIE POR HORA NO ES DEL MISMO PERIODO QUE EL RESTO ────────────
print(u'\n  --- 4 · LA SERIE POR HORA · su periodo NO es el del documento')
TOT_HORA = sum(HORA)
pico = max(range(24), key=lambda i: HORA[i])
franja = sum(HORA[9:14])
ok(TOT_HORA == 9486, u'la serie por hora suma las 9,486 que cita el pie', miles(TOT_HORA))
ok(pico == 9 and HORA[9] == 1101, u'la hora pico son las 09:00 con 1,101',
   u'%02d:00 con %s' % (pico, miles(HORA[pico])))
ok(cerca(franja / TOT_HORA * 100, 55.0, 0.5), u'09:00–13:00 concentran el 55%',
   u'%s/%s = %.1f%%' % (miles(franja), miles(TOT_HORA), franja / TOT_HORA * 100))
# Y el aviso: 9,486 no son las 7,895 del periodo. El propio pie dice «ene–abr»
# y «(incluye mayo parcial)» en la MISMA frase. Un recorte que se contradice en
# su propia etiqueta se lee como cobertura completa.
extra = TOT_HORA - TOT_PERD
ok(TOT_HORA > TOT_PERD, u'la serie por hora es MAYOR que el periodo, como su pie dice',
   u'%s vs %s' % (miles(TOT_HORA), miles(TOT_PERD)))
avisos.append(
    u'LA SERIE POR HORA NO ES DEL MISMO PERIODO QUE EL RESTO DEL DOCUMENTO: suma %s '
    u'llamadas y el periodo ene–abr tiene %s. Son %s de más —mayo parcial—, y el pie '
    u'del gráfico dice «ene–abr» y «(incluye mayo parcial)» en la misma frase. El '
    u'55%% de la franja 09:00–13:00 está calculado sobre esas %s, no sobre las %s.'
    % (miles(TOT_HORA), miles(TOT_PERD), miles(extra), miles(TOT_HORA), miles(TOT_PERD)))

# ─── 5 · LAS DOS PROPUESTAS DE PLAN ────────────────────────────────────────
print(u'\n  --- 5 · LAS PROPUESTAS · aritmética de las dos opciones')
OPCIONES = ((12000, 14500), (15000, 18500))
for mins, precio in OPCIONES:
    margen = mins - totMF[3]
    print(u'      %s min / $%s: margen %s min · pico %.1f%% · promedio %.1f%%'
          % (miles(mins), miles(precio), miles(margen),
             totMF[3] / mins * 100, prom / mins * 100))
ok(12000 - totMF[3] == 2090, u'«margen de 2,090 min» de la Opción A',
   miles(12000 - totMF[3]))
ok(cerca(totMF[3] / 12000 * 100, 82.6, 0.06) and cerca(prom / 12000 * 100, 76.3, 0.06),
   u'Opción A: pico 82.6% y promedio 76.3%')
ok(cerca(totMF[3] / 15000 * 100, 66.1, 0.06) and cerca(prom / 15000 * 100, 61.0, 0.06),
   u'Opción B: pico 66.1% y promedio 61.0%')

# EL MISMO CONCEPTO CON DOS VALORES. La tarjeta dice «21% de holgura sobre el
# pico histórico (9,910 min)» —que es 2,090/9,910— y la tabla dice «Margen real
# sobre pico 20.9%», que es 2,090/10,000: el denominador es el plan VIEJO, no el
# pico. Con la Opción B, 51% contra 50.9%.
for mins, decl_tarjeta, decl_tabla in ((12000, 21.0, 20.9), (15000, 51.0, 50.9)):
    margen = mins - totMF[3]
    sobre_pico = margen / totMF[3] * 100
    sobre_plan = margen / PLAN * 100
    # La tarjeta publica el porcentaje redondeado a ENTERO y la tabla con un
    # decimal: las tolerancias no pueden ser la misma.
    ok(cerca(sobre_pico, decl_tarjeta, 0.5) and cerca(sobre_plan, decl_tabla, 0.06),
       u'holgura de %s min: %.1f%% sobre pico y %.1f%% sobre el plan viejo'
       % (miles(mins), sobre_pico, sobre_plan),
       u'tarjeta %.0f%% / tabla %.1f%%' % (decl_tarjeta, decl_tabla))
avisos.append(
    u'LA MISMA HOLGURA SE PUBLICA CON DOS VALORES: la tarjeta de la Opción A dice «21% '
    u'de holgura sobre el pico histórico (9,910 min)» y la tabla comparativa dice '
    u'«Margen real sobre pico · 20.9%». El 21.1% es 2,090/9,910 —sobre el pico, como '
    u'dice la etiqueta— y el 20.9% es 2,090/10,000, o sea sobre el plan VIEJO, que no '
    u'es «sobre pico». Igual en la Opción B: 51.4% contra 50.9%.')

# ─── 6 · CONTRA NUESTRAS FUENTES, NO SÓLO CONTRA SÍ MISMO ──────────────────
print(u'\n  --- 6 · CONTRA LAS FUENTES DE LA CASA')
pLl = os.path.join(RAIZ, 'data', 'analisis-llamadas.json')
if not os.path.exists(pLl):
    fallos.append(u'no existe data/analisis-llamadas.json: la definición de '
                  u'«no atendidas» queda SIN comprobar, que no es «coincide»')
else:
    L = json.load(io.open(pLl, encoding='utf-8'))
    e = (L.get('cuentas') or {}).get(CID)
    if not e:
        fallos.append(u'el CID %s no está en data/analisis-llamadas.json' % CID)
    else:
        mes = e['ent']['meses']
        CLAVES = ('2026-01', '2026-02', '2026-03', '2026-04')
        print(u'      corte de la fuente: %s · hasta %s'
              % (L['meta'].get('corte'), e['ent'].get('hasta')))
        # (a) El total y las Redirected coinciden al récord: eso prueba que el
        #     reporte y nuestra fuente son LA MISMA exportación, así que la
        #     diferencia de la cifra titular no es «otro corte».
        igual_tot = all(mes[k]['total'] == ENT['total'][i] for i, k in enumerate(CLAVES))
        igual_red = all(mes[k]['Redirected'] == ENT['atend'][i] for i, k in enumerate(CLAVES))
        ok(igual_tot, u'los totales entrantes del reporte son los de nuestra fuente')
        ok(igual_red, u'las «atendidas» del reporte son exactamente las `Redirected`')
        # (b) Y entonces las «no atendidas» del reporte son todo lo que no fue
        #     Redirected: Lost + autoservicio + buzón.
        lost = sum(mes[k]['Lost'] for k in CLAVES)
        self_ = sum(mes[k].get('Self_service', 0) for k in CLAVES)
        buzon = sum(mes[k].get('Voicemail', 0) for k in CLAVES)
        print(u'      fuente ene–abr: perdidas %s · autoservicio %s · buzón %s · suma %s'
              % (miles(lost), miles(self_), miles(buzon), miles(lost + self_ + buzon)))
        ok(lost + self_ + buzon == TOT_PERD,
           u'las 7,895 del reporte = perdidas + autoservicio + buzón',
           u'%s = %s + %s + %s' % (miles(TOT_PERD), miles(lost), miles(self_), miles(buzon)))
        tasa_real = lost / TOT_ENT * 100
        print(u'      tasa de PERDIDA real ene–abr: %s/%s = %.1f%%'
              % (miles(lost), miles(TOT_ENT), tasa_real))
        avisos.append(
            u'LA CIFRA TITULAR MIDE OTRA COSA DE LA QUE DICE. El documento llama «no '
            u'atendidas» a todo lo que no fue `Redirected`, y ahí dentro van %s llamadas '
            u'que el AUTOSERVICIO resolvió y %s que dejaron RECADO en buzón. Las perdidas '
            u'de verdad son %s de %s: el %.1f%%, una de cada tres. La frase «más de la '
            u'mitad de las llamadas entrantes no fueron atendidas» no se sostiene contra '
            u'nuestra propia fuente, y es el ancla de las dos propuestas.'
            % (miles(self_), miles(buzon), miles(lost), miles(TOT_ENT), tasa_real))
        # (c) Y LO QUE PASÓ DESPUÉS, que el reporte no puede saber porque se
        #     corta en abril: el ajuste de timbrado se aplicó el 23 jun 2026.
        PRE = ('2026-01', '2026-02', '2026-03', '2026-04', '2026-05')
        POST = ('2026-07', '2026-08', '2026-09')
        if all(k in mes for k in PRE + POST):
            lp = sum(mes[k]['Lost'] for k in PRE)
            tp = sum(mes[k]['total'] for k in PRE)
            ld = sum(mes[k]['Lost'] for k in POST)
            td = sum(mes[k]['total'] for k in POST)
            print(u'      ANTES del ajuste (ene–may): %s/%s = %.1f%%'
                  % (miles(lp), miles(tp), lp / tp * 100))
            print(u'      DESPUÉS (jul–14 sep):       %s/%s = %.1f%%'
                  % (miles(ld), miles(td), ld / td * 100))
            avisos.append(
                u'EL AJUSTE QUE EL DOCUMENTO PROPONE YA SE APLICÓ, Y SE PUEDE MEDIR. El '
                u'ticket #107776 del 23 jun 2026 configuró todas las extensiones para '
                u'atender una sola llamada a la vez. La tasa de perdidas pasó del %.1f%% '
                u'(ene–may) al %.1f%% (jul al 14 sep): bajó %.1f puntos y sigue en %.1f%%. '
                u'El reporte se corta en abril, así que presenta como acción pendiente algo '
                u'hecho hace cinco meses y no mide lo único que importa: que no bastó.'
                % (lp / tp * 100, ld / td * 100, lp / tp * 100 - ld / td * 100,
                   ld / td * 100))
        else:
            avisos.append(u'LA FUENTE NO ALCANZA A MEDIR EL EFECTO DEL AJUSTE del 23 jun '
                          u'2026: faltan meses posteriores en analisis-llamadas.json.')

# El MRR institucional es el del GRC y nada más. [[grc-fuente-zoho]]
pG = os.path.join(RAIZ, 'data', 'grc-zoho.json')
if not os.path.exists(pG):
    fallos.append(u'no existe data/grc-zoho.json: el MRR queda SIN comprobar')
else:
    G = json.load(io.open(pG, encoding='utf-8'))
    fila = next((f for f in G['filas'] if str(f.get('cid') or '') == CID), None)
    if fila is None:
        fallos.append(u'el CID %s no aparece en el GRC' % CID)
    else:
        mrr = float(fila.get('mrrFin') or 0)
        print(u'      GRC: %s · banda %s · MRR %s · %s meses · %s'
              % (fila.get('cliente'), fila.get('clasif'), miles(mrr),
                 fila.get('meses'), fila.get('movimiento')))
        base = re.search(r'Plan actual.{0,80}?\$([\d,]+)', texto, re.S)
        declarado = int(base.group(1).replace(',', '')) if base else None
        ok(declarado is not None, u'el documento declara un precio de plan actual',
           u'$%s' % (base.group(1) if base else u'—'))
        if declarado is not None and declarado != int(mrr):
            avisos.append(
                u'LA BASE DE LOS INCREMENTOS NO ES EL MRR INSTITUCIONAL. El documento parte '
                u'de «Plan actual $%s/mes» y de ahí saca «+$%s» y «+$%s». El MRR de este CID '
                u'en Gross Revenue Facturación es de $%s (banda %s, %s). Contra el GRC los '
                u'incrementos serían +$%s y +$%s. O el $%s es sólo el componente de la bolsa '
                u'de minutos —y entonces no es «el plan actual»—, o los incrementos están '
                u'sobredimensionados; con lo que hay no se puede decidir, así que no se '
                u'publica ninguno de los dos como «lo que subiría su factura».'
                % (miles(declarado), miles(14500 - declarado), miles(18500 - declarado),
                   miles(mrr), fila.get('clasif'), fila.get('movimiento'),
                   miles(14500 - mrr), miles(18500 - mrr), miles(declarado)))

# Los minutos facturables NO salen de ninguna fuente nuestra: el CID no está en
# el corte de facturación, y hay una alerta crítica abierta que lo dice.
# Declararlo es obligatorio: un número sin fuente que no se marca se lee como medido.
avisos.append(
    u'LOS MINUTOS FACTURABLES NO SE PUEDEN VERIFICAR CONTRA NINGUNA FUENTE NUESTRA. El '
    u'plan de 10,000 minutos y los consumos de 9,150 y 9,910 vienen de la exportación de '
    u'la plataforma que acompaña al reporte; el CID %s no tiene filas en '
    u'`data/cortes-facturacion.xlsx` y la cuenta lleva abierta la alerta crítica '
    u'`sin_consumo_medible` («0 de 5 meses con dato de consumo»). Su aritmética interna '
    u'cierra —el promedio, el 91.5%% y el 99.1%% salen de las series—, pero el origen del '
    u'dato es el cliente, no nosotros. [[feedback-cero-sin-medicion]]' % CID)

# ─── 7 · LAS AFIRMACIONES SIN DENOMINADOR PUBLICADO ────────────────────────
print(u'\n  --- 7 · AFIRMACIONES QUE EL DOCUMENTO NO PUBLICA CÓMO COMPROBAR')
# El documento afirma repartos de LLAMADAS por tipo de destino y sólo publica
# repartos de MINUTOS. No es un error de cálculo: es que el lector no lo puede
# reconstruir. [[feedback-contexto-ia-sin-huecos]]
sin_base = []
if re.search(r'30-35%|30–35%', texto):
    sin_base.append(u'«son solo el 30-35% de las llamadas» (salientes a celular)')
if re.search(r'el 28% de sus llamadas salientes', texto):
    sin_base.append(u'«el 28% de sus llamadas salientes» (fijo y extensiones)')
for s in sin_base:
    print(u'      sin denominador publicado: %s' % s)
ok(True, u'%d afirmación(es) de reparto POR LLAMADAS sin tabla que las sostenga'
   % len(sin_base))
if sin_base:
    ext_fijo = (sum(SALT['extension']) + sum(SALT['fijo'])) / TOT_SAL_TIPOS * 100
    avisos.append(
        u'DOS REPARTOS POR LLAMADAS QUE EL DOCUMENTO NO GRAFICA. Afirma que el celular es '
        u'«el 30-35%% de las llamadas» y que «el 28%% de sus llamadas salientes» van a fijo '
        u'o extensión, pero todas sus tablas de tipo están en MINUTOS: no hay desglose de '
        u'llamadas por destino en ninguna parte. En minutos, fijo + extensión son el '
        u'%.1f%%. Las dos cifras pueden ser ciertas y el lector no las puede recalcular, '
        u'así que se marcan como no verificables desde el documento.' % ext_fijo)

# ─── 7b · LO QUE NO PUEDE VOLVER AL DOCUMENTO ──────────────────────────────
# Las notas se vigilan en el apartado 8, pero eso sólo caza que ALGUIEN las
# borre. Si alguien reinstala la frase falsa dejando las notas puestas, el
# documento se contradice a sí mismo y todas las cifras siguen cuadrando. La
# frase que se corrigió se vigila por su nombre. [[feedback-probar-al-reves]]
print(u'\n  --- 7b · FRASES QUE NO PUEDEN VOLVER')
PROHIBIDAS = [
    (u'más de la mitad de las llamadas entrantes no fueron atendidas',
     u'la frase corregida: las perdidas son una de cada tres, no una de cada dos'),
    (u'<div class="kpi-valor">7,895</div>',
     u'la tarjeta KPI que titulaba 7,895 como «llamadas no atendidas»'),
    (u'<div class="kpi-etiqueta">Llamadas no atendidas</div>',
     u'la etiqueta «Llamadas no atendidas» en la tarjeta KPI'),
    # Una ficha con la asesora vieja ya tumbó un tablero entero.
    # [[erick-sustituye-a-claudia]]
    (u'Claudia', u'la asesora que ya no lleva esta cartera'),
]
for aguja, porque in PROHIBIDAS:
    ok(aguja not in texto, u'no vuelve: %s' % porque,
       u'' if aguja not in texto else u'«%s»' % aguja[:40])

# ─── 7c · QUE LAS NOTAS NO ROMPAN EL HTML ──────────────────────────────────
# Las once aclaraciones se inyectan con `str.replace` sobre el documento
# entregado. Un `</div>` o un `</b>` de menos no da ningún error: el navegador
# recompone el árbol a su manera y lo que se ve es el documento DESMAQUETADO,
# que es peor que no haber anotado nada. Se cuentan las etiquetas.
print(u'\n  --- 7c · LAS NOTAS NO DESMAQUETAN EL DOCUMENTO')
for et in (u'div', u'b', u'span'):
    abre = len(re.findall(r'<%s[\s>]' % et, html))
    cierra = len(re.findall(r'</%s>' % et, html))
    ok(abre == cierra, u'las etiquetas <%s> abren y cierran igual' % et,
       u'%d abren / %d cierran' % (abre, cierra))
ok(html.count(u'<!--NOTA:INICIO-->') == html.count(u'<!--NOTA:FIN-->'),
   u'cada marca NOTA:INICIO tiene su NOTA:FIN',
   u'%d / %d' % (html.count(u'<!--NOTA:INICIO-->'), html.count(u'<!--NOTA:FIN-->')))
# Y que la hoja de estilo de las notas siga ahí: una nota sin su clase se
# pinta como texto suelto en medio del reporte y no se lee como aclaración.
ok(u'.corr{' in html, u'la clase .corr sigue declarada en la hoja de estilo')

# ─── 8 · LAS MARCAS DE LA CONCILIACIÓN ─────────────────────────────────────
marcados = re.findall(r'<!--\s*CONCILIACION:MARCADOS\s+([^>]+?)\s*-->', html)
claves = [k.strip() for g in marcados for k in g.split(',') if k.strip()]
print(u'\n  --- 8 · DESFASES DECLARADOS DENTRO DEL DOCUMENTO')
print(u'      %s' % (u', '.join(claves) if claves else u'ninguno'))
# BORRAR LAS NOTAS TIENE QUE PONER ESTO EN ROJO: son lo único que impide que el
# documento vuelva a afirmar «más de la mitad de las llamadas no se atendieron»,
# y las cifras seguirían cuadrando entre sí. Un candado que no vigila su propio
# candado no sirve. [[auditoria-modulo]]
ok(len(notas) >= 5, u'las notas de conciliación siguen DENTRO del documento',
   u'%d bloque(s) NOTA' % len(notas))
ok(len(claves) >= 6, u'los desfases que no cierran siguen DECLARADOS por clave',
   u'%d clave(s)' % len(claves))
if not notas or not claves:
    print(u'\n      Estos dos candados se exigen SIEMPRE, también sobre el reporte tal\n'
          u'      como se entregó: un documento sin las notas es exactamente lo que\n'
          u'      NO se puede publicar. Se generan con\n'
          u'      `python -I scripts/publica-auditoria-agua-inmaculada.py <entregado.html>`.')

print(u'\n  ' + u'=' * 72)
if avisos:
    print(u'  %d AVISO(S) — tienen que quedar escritos DENTRO del documento:' % len(avisos))
    for i, a in enumerate(avisos, 1):
        print(u'    %d) %s\n' % (i, a))
if fallos:
    print(u'  *** %d COMPROBACIÓN(ES) NO CIERRAN:' % len(fallos))
    for f in fallos:
        print(u'      - %s' % f)
    sys.exit(1)
print(u'  TODO LO RECALCULABLE CIERRA.')
sys.exit(0)
