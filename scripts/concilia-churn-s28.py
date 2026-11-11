# -*- coding: utf-8 -*-
u"""CONCILIA EL CORTE S28 DE ANÁLISIS DATA ANTES DE PUBLICARLO.

   Patrón de `concilia-churn-s27.py`, no un script de un solo uso. Transcribe
   las cifras del correo y les exige que CIERREN; reconstruye los porcentajes
   DIVIDIENDO en vez de espejearlos; y mira HACIA ATRÁS, contra los cortes ya
   archivados del mismo mes — que es lo único que destapa una rebanada
   rotulada «el mes». [[churn-analisis-data]] [[feedback-tablas-deben-cerrar]]

   LO QUE ESTE CORTE TIENE DE RARO, y por lo que hace falta mirar dos veces:

     · LE FALTAN TRES BLOQUES que la S27 sí traía — cancelaciones, soft/hard
       suspend y top de clientes activos. Un bloque ausente NO es un cero:
       se publica «no reportado». [[feedback-cero-sin-medicion]]
     · LOS DOWNGRADES DEL MISMO OCTUBRE caen de $31,187.97 en 14 casos (S27) a
       $8,330.00 en 3. Ese es exactamente el perfil de la rebanada que la S27
       destapó en las cancelaciones... salvo que aquí el propio corte da una
       razón: dice que el mayor monto del tablero no son downgrades, son
       clientes que hicieron upsell antes de su fecha de corte. La sección 8
       NO se cree ni la una ni la otra: va a buscarlo al GRC.

   USO
       python -I scripts/concilia-churn-s28.py
"""
import io
import json
import os
import re
import sys
import unicodedata

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

fallos = []
avisos = []


def ok(cond, etiqueta, detalle=u''):
    print(u'  %-58s %s%s' % (etiqueta, u'OK' if cond else u'*** NO CIERRA',
                             (u'  ' + detalle) if detalle else u''))
    if not cond:
        fallos.append(etiqueta)
    return cond


def pesos(x):
    return u'$' + format(x, ',.2f')


def cerca(a, b, tol=0.01):
    return abs(a - b) <= tol


def norm(s):
    s = unicodedata.normalize('NFKD', str(s))
    s = u''.join(c for c in s if not unicodedata.combining(c))
    return re.sub(r'[^a-z0-9]+', '', s.lower())


# ════════════════════════════════════════════════════════════════════════════
# LO QUE DICE EL CORREO, transcrito. Nada aquí se calcula: se copia.
# «Análisis Seguimiento - Gross Revenue Churn · Semana 28», Valeria Zepeda
# Hernández (equipo Data). Cuerpo fechado «Al 10 de noviembre del 2026»;
# recibido el miércoles 11, que es la fecha que anunció la S27.
# ════════════════════════════════════════════════════════════════════════════
PCT = {
    'septiembre':       (2.5, 2.4),    # (anterior, nuevo)
    'octubre':          (7.4, 6.5),    # MES CORRIENDO · NO DEFINITIVO
    'acumulado_oct':   (26.8, 25.9),   # NO DEFINITIVO
}

CARTERA_TOTAL_DECL = 208994.05
CARTERA_CLIENTES_DECL = 172
CARTERA = [
    # (tramo, importe, clientes)
    (u'Por vencer',    519.00,     1),
    (u'1 - 7 dias',      0.00,     0),
    (u'8 - 15 dias',   714.00,     2),
    (u'16 - 30 dias', 196991.05, 153),
    (u'+30 dias',     10770.00,    16),
]

DOWN_TOTAL_DECL = 8330.00
DOWN_CLIENTES_DECL = 3
DOWN_POR_CLIENTE = [
    # (cliente, producto, ingreso perdido, % reduccion declarado)
    (u'Onilog',      u'Agente CP Chat (quita)',   3538.00, 56),
    (u'Grupo Guia',  u'paquete Min VyC (reduce)', 2400.00, 30),
    (u'Grupo SPH',   u'Agente CP Chat (quita)',   2392.00, 71),
]
DOWN_POR_PRODUCTO = [
    (u'Agente CP Chat',   5930.00, 2),
    (u'paquete Min VyC',  2400.00, 1),
]

# Bloques que la S27 traía y ESTE corte no publica.
BLOQUES_AUSENTES = [u'cancelaciones', u'soft / hard suspend', u'top de clientes activos']


def seccion(n, titulo):
    print(u'\n  %s %s' % (u'─' * 3, titulo))


print(u'\n  CONCILIACIÓN · GROSS REVENUE CHURN · SEMANA 28')
print(u'  Corte al 10 nov 2026 · recibido el 11 nov · Valeria Zepeda Hernández')
print(u'  ' + u'=' * 72)

# ─── 1 · CARTERA POR COBRAR ────────────────────────────────────────────────
seccion(1, u'CARTERA POR COBRAR · los cinco tramos contra su total')
suma_imp = sum(x[1] for x in CARTERA)
suma_cli = sum(x[2] for x in CARTERA)
for tramo, imp, cli in CARTERA:
    cuota = (imp / CARTERA_TOTAL_DECL * 100) if CARTERA_TOTAL_DECL else 0
    print(u'      %-14s %13s  %3d cliente(s)   %5.1f%% de la cartera' % (tramo, pesos(imp), cli, cuota))
ok(cerca(suma_imp, CARTERA_TOTAL_DECL), u'los tramos suman el total declarado',
   u'%s vs %s' % (pesos(suma_imp), pesos(CARTERA_TOTAL_DECL)))
ok(suma_cli == CARTERA_CLIENTES_DECL, u'los clientes suman el conteo declarado',
   u'%d vs %d' % (suma_cli, CARTERA_CLIENTES_DECL))

# «Por vencer» es un hueco de registro, no un tramo de deuda joven: el propio
# corte lo dice. Por eso la antigüedad se prueba SUMANDO y RESTANDO el tramo —
# restar siempre tumbaba un corte correcto. [[churn-analisis-data]]
sin_porvencer = suma_imp - CARTERA[0][1]
print(u'      (control) sin «Por vencer»: %s en %d cliente(s)'
      % (pesos(sin_porvencer), suma_cli - CARTERA[0][2]))

conc = CARTERA[3][1] / CARTERA_TOTAL_DECL * 100
print(u'      ⚠ el tramo 16-30 dias concentra el %.1f%% de la cartera' % conc)
if conc > 90:
    avisos.append(u'el %.1f%% de la cartera esta en 16-30 dias: a UN tramo del que '
                  u'antecede a la suspension' % conc)

# ─── 2 · DOWNGRADES, las dos tablas ────────────────────────────────────────
seccion(2, u'DOWNGRADES · por cliente y por producto')
suma_dc = sum(x[2] for x in DOWN_POR_CLIENTE)
ok(cerca(suma_dc, DOWN_TOTAL_DECL), u'por cliente suma el total declarado',
   u'%s vs %s' % (pesos(suma_dc), pesos(DOWN_TOTAL_DECL)))
ok(len(DOWN_POR_CLIENTE) == DOWN_CLIENTES_DECL, u'el conteo de clientes cuadra',
   u'%d vs %d' % (len(DOWN_POR_CLIENTE), DOWN_CLIENTES_DECL))
suma_dp = sum(x[1] for x in DOWN_POR_PRODUCTO)
suma_dp_cli = sum(x[2] for x in DOWN_POR_PRODUCTO)
ok(cerca(suma_dp, DOWN_TOTAL_DECL), u'por producto suma el total declarado',
   u'%s vs %s' % (pesos(suma_dp), pesos(DOWN_TOTAL_DECL)))
ok(suma_dp_cli == DOWN_CLIENTES_DECL, u'clientes afectados por producto cuadran',
   u'%d vs %d' % (suma_dp_cli, DOWN_CLIENTES_DECL))

# LA S27 TENÍA QUE ADVERTIR QUE ESTAS DOS TABLAS NO SE COMPARAN 1:1, porque la
# de productos era impacto BRUTO y la de clientes pérdida NETA ($38,225.97 vs
# $31,187.97). En la S28 coinciden al centavo, o sea que este corte NO trae
# ningún upsell neteado dentro de los tres casos. Es una diferencia de forma y
# hay que decirla, no heredar la advertencia vieja.
ok(cerca(suma_dc, suma_dp), u'bruto == neto (este corte no netea upsells)',
   u'%s = %s' % (pesos(suma_dc), pesos(suma_dp)))

# ─── 3 · LOS PORCENTAJES, RECONSTRUIDOS CONTRA EL GRC ──────────────────────
seccion(3, u'% DE REDUCCIÓN · reconstruidos dividiendo, no espejeados')
print(u'      El correo NO publica la base de MRR, así que con el correo solo no')
print(u'      se pueden verificar — es lo que la S27 dejó abierto. La base la')
print(u'      tiene el GRC (`data/grc-zoho.json`), que es fuente independiente.')
grc_path = os.path.join(RAIZ, 'data', 'grc-zoho.json')
G = json.load(io.open(grc_path, encoding='utf-8'))
FILAS = G['filas']
MES_VIVO_GRC = (G.get('meta') or {}).get('mesVivo')
print(u'      GRC: %d filas · mes vivo del export: %s' % (len(FILAS), MES_VIVO_GRC))

def fila_grc(nombre):
    c = norm(nombre)
    for f in FILAS:
        if c in norm(f.get('cliente') or ''):
            return f
    return None

for cliente, _prod, perdida, pct_decl in DOWN_POR_CLIENTE:
    f = fila_grc(cliente)
    if not f:
        fallos.append(u'%s no esta en el GRC' % cliente)
        print(u'      %-12s *** SIN FILA en el GRC: el %% no se puede reconstruir' % cliente)
        continue
    ini, fin, perd = f.get('mrrIni') or 0, f.get('mrrFin') or 0, f.get('perdida') or 0
    recon = (perd / ini * 100) if ini else None
    casa_imp = cerca(perd, perdida)
    casa_dif = cerca(ini - fin, perdida)
    casa_pct = recon is not None and abs(recon - pct_decl) <= 0.6
    print(u'      %-12s correo %s / %d%%   GRC ini %s fin %s perd %s   reconstruido %.1f%%'
          % (cliente, pesos(perdida), pct_decl, pesos(ini), pesos(fin), pesos(perd),
             recon if recon is not None else -1))
    ok(casa_imp, u'  %s · el importe casa con el GRC al centavo' % cliente)
    ok(casa_dif, u'  %s · mrrIni - mrrFin = la perdida' % cliente)
    ok(casa_pct, u'  %s · el %% declarado se reconstruye dividiendo' % cliente,
       u'%.2f%% vs %d%%' % (recon or 0, pct_decl))

# ─── 4 · LOS PORCENTAJES DE CHURN ──────────────────────────────────────────
seccion(4, u'CHURN % · el acumulado se reconstruye SUMANDO')
sep_ant, sep_new = PCT['septiembre']
oct_ant, oct_new = PCT['octubre']
acu_ant, acu_new = PCT['acumulado_oct']
base_ant = round(acu_ant - oct_ant, 1)
base_new = round(acu_new - oct_new, 1)
print(u'      septiembre %.1f%% -> %.1f%%   octubre %.1f%% -> %.1f%%   acumulado %.1f%% -> %.1f%%'
      % (sep_ant, sep_new, oct_ant, oct_new, acu_ant, acu_new))
print(u'      base implicita de meses anteriores: %.1f%% (antes) y %.1f%% (ahora)' % (base_ant, base_new))
ok(cerca(base_new, 19.4, 0.05), u'la base hasta septiembre sigue en 19.4%',
   u'%.1f%% = %.1f%% - %.1f%%' % (base_new, acu_new, oct_new))
ok(cerca(base_ant, base_new, 0.05), u'la base NO cambio entre las dos lecturas',
   u'%.1f%% -> %.1f%%' % (base_ant, base_new))

# EL DESCUADRE QUE NADIE DECLARA. Si septiembre baja 0.1 pp, el acumulado hasta
# septiembre tendría que bajar con él (19.4% -> 19.3%) y el acumulado de octubre
# saldría 25.8%, no 25.9%. La base se quedó quieta: el corte reexpresa el mes y
# NO reexpresa el acumulado. Es 0.1 pp, y se pregunta — no se corrige solo.
sep_delta = round(sep_new - sep_ant, 2)
acu_esperado = round(base_new + sep_delta + oct_new, 1)
if abs(acu_esperado - acu_new) > 0.05:
    avisos.append(u'septiembre baja %.1f pp (%.1f%% -> %.1f%%) pero la base de meses '
                  u'anteriores se queda en %.1f%%: propagandola, el acumulado seria '
                  u'%.1f%% y el corte declara %.1f%%. Diferencia de %.1f pp SIN declarar.'
                  % (sep_delta, sep_ant, sep_new, base_new, acu_esperado, acu_new,
                     abs(acu_esperado - acu_new)))
    print(u'      ⚠ propagando la revision de septiembre el acumulado seria %.1f%%, '
          u'no %.1f%%' % (acu_esperado, acu_new))

print(u'      (octubre sigue marcado MES CORRIENDO · NO DEFINITIVO por el propio corte)')
print(u'      (no se puede verificar dividiendo: el correo no publica la base de MRR'
      u' mensual) [[feedback-metricas-derivadas-origen]]')

# ─── 5 · BLOQUES AUSENTES: NO SON CEROS ────────────────────────────────────
seccion(5, u'BLOQUES QUE ESTE CORTE NO PUBLICA')
for b in BLOQUES_AUSENTES:
    print(u'      · %-26s -> «no reportado en este corte», NUNCA $0' % b)
avisos.append(u'faltan %d bloques que la S27 si traia (%s): se publican como NO '
              u'REPORTADO. Un bloque ausente no es un cero. [[feedback-cero-sin-medicion]]'
              % (len(BLOQUES_AUSENTES), u', '.join(BLOQUES_AUSENTES)))

# ─── 6 · HACIA ATRÁS · LA CARTERA DE LOS CORTES ANTERIORES ─────────────────
seccion(6, u'HACIA ATRÁS · trayectoria de la cartera por cobrar')
page = io.open(os.path.join(RAIZ, 'app', 'churn', 'page.tsx'), encoding='utf-8').read()
actual = io.open(os.path.join(RAIZ, 'app', 'churn', 'reporte-actual.ts'), encoding='utf-8').read()

def extrae(texto, simbolo, campo):
    u"""Lee un campo declarado dentro del bloque de un corte archivado.

       EL BLOQUE SE CORTA EN EL SIGUIENTE `const REPORTE_`, no a tantos
       caracteres. Mi primera versión usaba una ventana fija de 20,000 y el
       bloque de la S27 mide ~37,000: `downgradeTotalReal: 31187.97` caía
       FUERA y el script lo publicaba como «no reportado» — o sea que la
       comparación que decide este corte salía vacía y con cara de dato.
       Un verificador que recorta en silencio miente.
       [[feedback-contexto-ia-sin-huecos]] [[feedback-verificar-antes-asegurar]]
    """
    i = texto.find(u'const %s' % simbolo)
    if i < 0:
        return None
    sig = re.search(r'\n(?:export )?const REPORTE_', texto[i + 10:])
    fin = (i + 10 + sig.start()) if sig else len(texto)
    m = re.search(campo + r'\s*:\s*([0-9.]+)', texto[i:fin])
    return float(m.group(1)) if m else None

serie = []
for simbolo, etq, txt in ((u'REPORTE_S24_OCT_2026', u'S24', page),
                          (u'REPORTE_S25_OCT_2026', u'S25', page),
                          (u'REPORTE_S26_OCT_2026', u'S26', page),
                          (u'REPORTE_S27_OCT_2026', u'S27', actual)):
    tot = extrae(txt, simbolo, 'pendientesTotalReal')
    cue = extrae(txt, simbolo, 'pendientesCuentasReal')
    dtot = extrae(txt, simbolo, 'downgradeTotalReal')
    dcas = extrae(txt, simbolo, 'downgradeCasosReal')
    serie.append((etq, tot, cue, dtot, dcas))
    print(u'      %-4s cartera %-13s %-5s   downgrades %-12s %s casos'
          % (etq, pesos(tot) if tot else u'n/d', (u'%d cta' % cue) if cue else u'n/d',
             pesos(dtot) if dtot else u'no reportado', int(dcas) if dcas else u'n/d'))
print(u'      %-4s cartera %-13s %-5s   downgrades %-12s %d casos'
      % (u'S28', pesos(CARTERA_TOTAL_DECL), u'%d cta' % CARTERA_CLIENTES_DECL,
         pesos(DOWN_TOTAL_DECL), DOWN_CLIENTES_DECL))
ok(any(s[1] for s in serie), u'se leyeron los cortes archivados de octubre',
   u'%d de 4 con cartera declarada' % len([s for s in serie if s[1]]))

s27 = [s for s in serie if s[0] == u'S27'][0]
if s27[1]:
    d_din = CARTERA_TOTAL_DECL - s27[1]
    d_cta = CARTERA_CLIENTES_DECL - int(s27[2] or 0)
    print(u'      vs S27: %s (%+.1f%%) y %+d cuentas'
          % (pesos(d_din), d_din / s27[1] * 100, d_cta))

# ─── 7 · HACIA ATRÁS · LOS DOWNGRADES, NOMBRE POR NOMBRE ───────────────────
seccion(7, u'HACIA ATRÁS · ¿es una rebanada o una corrección?')
S27_TOP = [(u'Portalia', 9754.97), (u'TUNALI TEC', 5404.00),
           (u'Hotel Real de Minas', 2490.00), (u'Proseso Consultores', 2210.00),
           (u'Corporativo grupo funerario San Javier', 1959.00), (u'Grupo Guia', 1600.00)]
nuevos = [c for c, _p, _i, _x in DOWN_POR_CLIENTE
          if not any(norm(c) == norm(n) for n, _ in S27_TOP)]
repiten = [c for c, _p, _i, _x in DOWN_POR_CLIENTE
           if any(norm(c) == norm(n) for n, _ in S27_TOP)]
print(u'      nombres nuevos frente al top de la S27: %s' % (u', '.join(nuevos) or u'ninguno'))
print(u'      nombres que repiten:                    %s' % (u', '.join(repiten) or u'ninguno'))

# EL CASO QUE RESUELVE LA PREGUNTA. Si un nombre que la S27 publicó como
# downgrade está en el GRC como UPSELL, entonces la explicación del corte —«son
# clientes que hicieron upsell antes de su fecha de corte»— no es una
# afirmación suya: está corroborada por una segunda fuente, con nombre.
print(u'\n      los seis del top de la S27, como los ve el GRC:')
upsells, desaparecidos, reexpresados = [], [], []
for nom, imp27 in S27_TOP:
    f = fila_grc(nom)
    if not f:
        desaparecidos.append(nom)
        print(u'        %-38s S27 %-11s  SIN FILA en el GRC' % (nom[:38], pesos(imp27)))
        continue
    mov = f.get('movimiento') or u''
    perd = f.get('perdida') or 0
    print(u'        %-38s S27 %-11s  GRC %-34s perd %s'
          % (nom[:38], pesos(imp27), mov[:34], pesos(perd)))
    if u'Upsell' in mov:
        upsells.append((nom, imp27, f.get('mrrIni'), f.get('mrrFin')))
    elif mov == u'Downgrade' and not cerca(perd, imp27):
        reexpresados.append((nom, imp27, perd))

for nom, imp27, ini, fin in upsells:
    avisos.append(u'%s lo publico la S27 como downgrade de %s y en el GRC es «Upsell '
                  u'por confirmar»: MRR %s -> %s. O sea que SUBIO. Corrobora con una '
                  u'segunda fuente lo que avisa el corte: el monto mayor del tablero '
                  u'incluye upsells tomados antes de la fecha de corte.'
                  % (nom, pesos(imp27), pesos(ini or 0), pesos(fin or 0)))
for nom, imp27, perd in reexpresados:
    avisos.append(u'%s esta REEXPRESADO: la S27 publico %s y el GRC + la S28 dicen %s. '
                  u'La S28 corrige a la S27, y no es palabra contra palabra: hay dos '
                  u'fuentes del mismo lado.' % (nom, pesos(imp27), pesos(perd)))

# ─── 8 · EL UNIVERSO DE DOWNGRADES SEGÚN EL GRC ────────────────────────────
seccion(8, u'CONTROL · todos los «Downgrade» del GRC')
dg = sorted([f for f in FILAS if (f.get('movimiento') or '') == u'Downgrade'],
            key=lambda f: -(f.get('perdida') or 0))
tot_dg = sum(f.get('perdida') or 0 for f in dg)
print(u'      %d filas · %s' % (len(dg), pesos(tot_dg)))
en_correo = {norm(c) for c, _p, _i, _x in DOWN_POR_CLIENTE}
fuera = [f for f in dg if norm(f.get('cliente') or '') not in en_correo]
print(u'      de ellas, %d NO estan en el correo, por %s'
      % (len(fuera), pesos(sum(f.get('perdida') or 0 for f in fuera))))
for f in fuera[:6]:
    print(u'        %-34s %-11s enCartera=%s cid=%s'
          % ((f.get('cliente') or '')[:34], pesos(f.get('perdida') or 0),
             f.get('enCartera'), f.get('cid') or u'—'))
if fuera:
    avisos.append(u'el GRC lista %d downgrades que el correo no publica, por %s, y el '
                  u'mayor (%s, %s) supera al mayor del correo. PERO el export del repo '
                  u'tiene mes vivo «%s» y el correo habla de octubre: NO se puede '
                  u'afirmar que falten del mes sin el periodo por fila. Se pregunta.'
                  % (len(fuera), pesos(sum(f.get('perdida') or 0 for f in fuera)),
                     fuera[0].get('cliente'), pesos(fuera[0].get('perdida') or 0),
                     MES_VIVO_GRC))

# ¿Alguno toca la cartera CS? Es la pregunta que decide si esto es trabajo
# nuestro. OJO: el 94% de las filas del GRC no trae CID, así que un
# `enCartera=False` sin CID es evidencia DÉBIL. [[grc-fuente-zoho]]
tocan = [f for f in dg if f.get('enCartera')]
con_cid = [f for f in dg if f.get('cid')]
print(u'      en la cartera CS: %d de %d · con CID: %d de %d'
      % (len(tocan), len(dg), len(con_cid), len(dg)))
if not tocan:
    avisos.append(u'NINGUNO de los %d downgrades del GRC esta marcado en la cartera CS. '
                  u'Es un cero, pero DEBIL: solo %d de los %d traen CID, y sin CID el '
                  u'cruce es por nombre. No se concluye «no nos afecta».'
                  % (len(dg), len(con_cid), len(dg)))

# ════════════════════════════════════════════════════════════════════════════
print(u'\n  ' + u'=' * 72)
if avisos:
    print(u'  %d AVISO(S) PARA LA NOTA DEL CORTE:' % len(avisos))
    for i, a in enumerate(avisos, 1):
        print(u'    %d) %s' % (i, a))
print(u'')
if fallos:
    print(u'  *** %d COMPROBACION(ES) NO CIERRAN — NO PUBLICAR:' % len(fallos))
    for f in fallos:
        print(u'      - %s' % f)
    sys.exit(1)
print(u'  TODO LO INTERNO CIERRA. El corte se puede publicar con esos avisos en la nota.')
sys.exit(0)
