# -*- coding: utf-8 -*-
u"""Concilia el corte de Análisis DATA · SEMANA 27 (al 4 nov 2026) ANTES de
   publicarlo.

   POR QUE EXISTE
   --------------
   El corte llega por correo, con tablas que se transcriben A MANO. Teclear
   veinte cifras y publicarlas es exactamente como se cuela un número que no
   cuadra con el de al lado. Aquí se exige que CIERREN —las filas contra su
   total declarado, los conteos contra el suyo— y que los porcentajes se
   RECONSTRUYAN dividiendo en vez de espejearse.
   [[feedback-metricas-derivadas-origen]] [[feedback-tablas-deben-cerrar]]

   Es de SOLO LECTURA. Sale con 1 si algo no cierra.

   USO
   ---
       python scripts/concilia-churn-s27.py
"""
import io
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

fallos, avisos = [], []


def exige(ok, que, detalle=u''):
    print(u'    %s  %-54s %s' % (u'ok  ' if ok else u'FALLA', que, detalle))
    if not ok:
        fallos.append(que)


def avisa(txt):
    avisos.append(txt)


def pesos(n):
    return u'$%s' % format(round(n, 2), ',.2f')


def cierra(etq, filas, total_declarado, tol=0.005):
    s = round(sum(filas), 2)
    exige(abs(s - total_declarado) <= tol, etq,
          u'suma %s · declara %s' % (pesos(s), pesos(total_declarado)))
    return s


print(u'\n  ════ CORTE · SEMANA 27 · AVANCE DE OCTUBRE (al 4 nov 2026) ══════')
print(u'  Remite: Valeria Zepeda Hernández (equipo Data).')

# ── 1 · CHURN, VISTA GENERAL ────────────────────────────────────────────────
print(u'\n  1 · VISTA GENERAL — el acumulado se RECONSTRUYE, no se copia\n')
SEP = 2.5
OCT, OCT_ANT = 7.4, 12.4
ACUM, ACUM_ANT = 26.8, 31.8
# La base hasta septiembre es la misma que usó la S26 y que allí se verificó:
# 19.4% + 12.4% = 31.8%. Si esa base cambiara, este cálculo lo cazaría.
BASE_HASTA_SEP = 19.4
exige(abs((BASE_HASTA_SEP + OCT) - ACUM) < 0.051,
      u'acumulado = base hasta sep + octubre',
      u'%.1f + %.1f = %.1f · declara %.1f' % (BASE_HASTA_SEP, OCT, BASE_HASTA_SEP + OCT, ACUM))
exige(abs((BASE_HASTA_SEP + OCT_ANT) - ACUM_ANT) < 0.051,
      u'y la lectura ANTERIOR cuadra con la misma base',
      u'%.1f + %.1f = %.1f · declara %.1f' % (BASE_HASTA_SEP, OCT_ANT, BASE_HASTA_SEP + OCT_ANT, ACUM_ANT))
print(u'\n    Octubre baja de %.1f%% a %.1f%% (−%.1f pts, el %.1f%% de la lectura'
      % (OCT_ANT, OCT, OCT_ANT - OCT, (OCT_ANT - OCT) / OCT_ANT * 100))
print(u'    anterior) y el acumulado hereda entero ese desinflado. LAS DOS las')
print(u'    marca NO DEFINITIVAS el propio reporte. [[regla-churn-mes-vencido]]')

# ── 2 · TOP DE ACTIVOS ──────────────────────────────────────────────────────
print(u'\n  2 · TOP 5 DE CLIENTES ACTIVOS — no tiene slot, va en la nota\n')
ACTIVA_TOTAL = 120148.01
ACTIVOS = [
    (u'ATP Sofom', 14848.97, 27),
    (u'ABRL Sistemas & Proyectos', 14665.00, 83),
    (u'SW Sapien', 13668.02, 49),
    (u'Grupo Rizo', 9211.00, 26),
    (u'Imagen Dental AMT', 8988.02, 56),
]
sa = round(sum(m for _, m, _ in ACTIVOS), 2)
print(u'    los cinco suman %s sobre una cartera activa de %s = %.1f%%'
      % (pesos(sa), pesos(ACTIVA_TOTAL), sa / ACTIVA_TOTAL * 100))
print(u'    el resto, %s, NO se desglosa y el corte no dice cuántos son.'
      % pesos(ACTIVA_TOTAL - sa))
# La S26 observó que el top cambiaba ENTERO en tres cortes seguidos.
S26_ACTIVOS = {u'FabricAir Latin America', u'ATP Sofom', u'ABRL Sistemas & Proyectos',
               u'SW Sapien', u'Inverdental'}
repiten = [n for n, _, _ in ACTIVOS if n in S26_ACTIVOS]
print(u'\n    REPITEN DE LA S26: %d de 5 — %s' % (len(repiten), u', '.join(repiten)))
print(u'    Tras TRES cortes con cero repeticiones, esto es nuevo.')
avisa(u'La cartera ACTIVA cae de $206,983.42 (S26) a %s: −%.1f%%. Hay que '
      u'preguntar si es caída real o si la consulta volvió a cambiar de población.'
      % (pesos(ACTIVA_TOTAL), (206983.42 - ACTIVA_TOTAL) / 206983.42 * 100))

# ── 3 · SOFT / HARD SUSPEND ─────────────────────────────────────────────────
print(u'\n  3 · SOFT / HARD SUSPEND\n')
SOFT = (21, 10.7, 29852.00)
HARD = (12, 21.7, 20347.34)
TOT_SUSP, TOT_SUSP_N = 50199.34, 33
cierra(u'soft + hard contra su total', [SOFT[2], HARD[2]], TOT_SUSP)
exige(SOFT[0] + HARD[0] == TOT_SUSP_N, u'y los clientes contra el suyo',
      u'%d + %d = %d · declara %d' % (SOFT[0], HARD[0], SOFT[0] + HARD[0], TOT_SUSP_N))
print(u'\n    promedio por cuenta — soft %s · hard %s'
      % (pesos(SOFT[2] / SOFT[0]), pesos(HARD[2] / HARD[0])))
print(u'    Se MANTIENE el patrón de la S26: las cuentas que llegan a hard son')
print(u'    las más pequeñas y llevan el DOBLE de días paradas.')

# ── 4 · CANCELACIONES ───────────────────────────────────────────────────────
print(u'\n  4 · CANCELACIONES — el bloque que más pesa este corte\n')
CANC_TOTAL, CANC_N = 75295.50, 20
CANC_80, CANC_80_N, CANC_80_PCT = 60471.50, 11, 80.3
CANC = [
    (u'Jason de Mexico', 17225.00, 43),
    (u'KOMBITEC', 8539.00, 73),
    (u'Biolaboratorio Sadat', 7184.00, 56),
    (u'SOBERANI', 5235.00, 8),
    (u'Grupo Turistico Rumbo S de RL de CV', 4349.00, 6),
    (u'UAXI Tecnología', 4041.00, 8),
    (u'enMazatlan', 3480.00, 73),
    (u'WhatsHome', 3250.00, 71),
    (u'ZD - The Palms', 2454.00, 3),
    (u'PSI Division Latinoamérica', 2359.50, 21),
    (u'ZD - Grupo Gira', 2355.00, 5),
]
exige(len(CANC) == CANC_80_N, u'las filas detalladas son las que declara',
      u'%d filas · declara %d' % (len(CANC), CANC_80_N))
sc = cierra(u'las 11 filas contra el 80% declarado', [m for _, m, _ in CANC], CANC_80)
pct = sc / CANC_TOTAL * 100
exige(abs(pct - CANC_80_PCT) < 0.051, u'y el % se RECONSTRUYE dividiendo',
      u'%s / %s = %.2f%% · declara %.1f%%' % (pesos(sc), pesos(CANC_TOTAL), pct, CANC_80_PCT))
CUBO_N, CUBO_M = CANC_N - CANC_80_N, round(CANC_TOTAL - CANC_80, 2)
print(u'\n    CUBO DE CIERRE: %d clientes por %s que el corte NO desglosa.'
      % (CUBO_N, pesos(CUBO_M)))
print(u'    Sin esa fila la tabla publicaría 11 bajas donde hay %d.' % CANC_N)

print(u'\n    Contra la S26 ($20,234.00 en 11): +%.1f%% en dinero, +%d clientes.'
      % ((CANC_TOTAL - 20234.00) / 20234.00 * 100, CANC_N - 11))
# Las dos que la S26 echó de menos
VUELVEN = [n for n, _, _ in CANC
           if n.startswith(u'Grupo Turistico Rumbo') or n.startswith(u'PSI Division')]
print(u'\n    ⬅ VUELVEN LAS DOS QUE LA S26 ECHÓ DE MENOS: %s.' % u', '.join(VUELVEN))
print(u'      La observación ② de la S26 preguntaba por ellas —eran las dos')
print(u'      cancelaciones de la S25 que desaparecieron del top de octubre—.')
print(u'      Están aquí con el MISMO importe: $4,349.00 y $2,359.50. No se')
print(u'      habían recuperado: se habían caído del top por importe.')

# ── 5 · CARTERA POR COBRAR ──────────────────────────────────────────────────
print(u'\n  5 · CARTERA POR COBRAR — y el descuadre que el PROPIO corte declara\n')
TRAMOS = [
    (u'Por vencer (sin fecha de corte)',  5952.00,   5),
    (u'1 – 7 días vencido',                   0.00,   0),
    (u'8 – 15 días vencido',             208046.71, 145),
    (u'16 – 30 días vencido',             43568.34,  41),
    (u'Más de 30 días',                   11138.45,  17),
]
CART_TOTAL, CART_N = 268705.50, 208
CART_FUENTE = 272319.60   # lo que dice el «documento fuente», según el correo
cierra(u'los cinco tramos contra el total de los renglones',
       [m for _, m, _ in TRAMOS], CART_TOTAL)
exige(sum(n for _, _, n in TRAMOS) == CART_N, u'y los clientes contra los suyos',
      u'%d · declara %d' % (sum(n for _, _, n in TRAMOS), CART_N))
dif = round(CART_FUENTE - CART_TOTAL, 2)
print(u'\n    EL CORTE DECLARA SU PROPIO DESCUADRE: el documento fuente reporta')
print(u'    %s y los 208 renglones suman %s. Diferencia %s,'
      % (pesos(CART_FUENTE), pesos(CART_TOTAL), pesos(dif)))
print(u'    «no identificada tras revisión línea por línea».')
print(u'\n    Y ESO NO ES UN NÚMERO CUALQUIERA: %s es, AL CENTAVO, el total' % pesos(CART_FUENTE))
print(u'    de cartera por cobrar que publicó el corte de la SEMANA 25.')
print(u'    (La S26 lo cita literal: «contra $272,319.60 en 173 hace seis días».)')
print(u'    No parece un renglón perdido: parece un TOTAL ARRASTRADO de hace dos')
print(u'    semanas. Es lo primero que hay que cotejar con Data.')
avisa(u'El total «del documento fuente» (%s) coincide al centavo con la cartera '
      u'por cobrar de la SEMANA 25. Publicamos la suma de los 208 renglones '
      u'(%s) y se pregunta por el arrastre.' % (pesos(CART_FUENTE), pesos(CART_TOTAL)))

print(u'\n    EL MOVIMIENTO DE LA OLA, contra la S26:')
S26_TRAMOS = {u'Por vencer': (21138.41, 6), u'1 – 7': (307946.40, 218),
              u'8 – 15': (88958.84, 56), u'16 – 30': (74798.35, 76),
              u'+30': (5099.00, 7)}
print(u'      1–7 días:  %s / 218 cuentas  →  %s / 0'
      % (pesos(S26_TRAMOS[u'1 – 7'][0]), pesos(0.0)))
print(u'      8–15 días: %s / 56          →  %s / 145'
      % (pesos(S26_TRAMOS[u'8 – 15'][0]), pesos(208046.71)))
print(u'    La ola de hace seis días envejeció un tramo entero. Es coherente, no')
print(u'    es un dato nuevo: el mismo dinero, una semana más viejo.')
print(u'\n    ⚠️ Y EL TRAMO DE +30 DÍAS SE DUPLICA: %s en 7 cuentas → %s en 17.'
      % (pesos(5099.00), pesos(11138.45)))
print(u'    Es el tramo que antecede a la suspensión. Esas 17 son la lista.')
print(u'\n    «1 a 7 días = $0.00 en 0 clientes» SÍ es un cero medido aquí: hay')
print(u'    tabla, hay tramo y hay conteo. No es lo mismo que un hueco.')

# ── 6 · DOWNGRADES ──────────────────────────────────────────────────────────
print(u'\n  6 · DOWNGRADES — vuelven a medirse después de que la S26 no los midió\n')
DG_TOTAL, DG_N = 31187.97, 14
DG_TOP_DECL = 23417.97
DG = [
    (u'Portalia', 9754.97, 82.8),
    (u'TUNALI TEC', 5404.00, 64.4),
    (u'Hotel Real de Minas San Miguel de Allende', 2490.00, 48.0),
    (u'Proseso Consultores', 2210.00, 81.0),
    (u'Corporativo Grupo Funerario San Javier', 1959.00, 44.4),
    (u'Grupo Guía', 1600.00, 25.0),
]
cierra(u'el top 6 contra su suma declarada', [m for _, m, _ in DG], DG_TOP_DECL)
CUBO_DG_N, CUBO_DG_M = DG_N - len(DG), round(DG_TOTAL - DG_TOP_DECL, 2)
print(u'\n    CUBO DE CIERRE: %d clientes por %s. El top cubre el %.1f%% del mes.'
      % (CUBO_DG_N, pesos(CUBO_DG_M), DG_TOP_DECL / DG_TOTAL * 100))

ART = [
    (u'paquete Min VyC', 18664.00, 9),
    (u'Extension VyC', 12400.97, 3),
    (u'paquete Min CE', 3239.00, 2),
    (u'paquete Min Voicebot', 2000.00, 1),
    (u'DiD Nacional', 1796.00, 5),
    (u'DiD Internacional', 126.00, 1),
]
ART_TOTAL = 38225.97
cierra(u'los seis productos contra su total', [m for _, m, _ in ART], ART_TOTAL)
print(u'\n    LAS DOS TABLAS NO SE SUMAN NI SE COMPARAN 1:1. Los productos son')
print(u'    impacto BRUTO (sólo «Quita»/«Reduce»), %s, contra %s'
      % (pesos(ART_TOTAL), pesos(DG_TOTAL)))
print(u'    de pérdida NETA por cliente: %s de diferencia, que son los'
      % pesos(ART_TOTAL - DG_TOTAL))
print(u'    productos AÑADIDOS en el mismo evento. El corte lo dice. Es el mismo')
print(u'    patrón del cierre de T3. [[feedback-tablas-deben-cerrar]]')

print(u'\n    LOS % DE REDUCCIÓN NO SE PUEDEN RECONSTRUIR: haría falta la')
print(u'    facturación ANTERIOR de cada cliente y el corte no la publica. Se')
print(u'    citan como vienen. Lo que sí se puede es derivar la base implícita:')
for n, m, p in DG[:3]:
    print(u'      %-42s %s / %.1f%% ⇒ base ≈ %s' % (n[:42], pesos(m), p, pesos(m / (p / 100))))
print(u'    Ninguna sale absurda, pero son DERIVADAS: no se publican como dato.')
print(u'    [[feedback-metricas-derivadas-origen]]')

# ── 7 · LO QUE HAY QUE CONTAR BIEN EN EL TEXTO ──────────────────────────────
print(u'\n  7 · LOS CONTEOS QUE VAN AL TEXTO (contados, no recordados)\n')
largas = [(n, m, k) for n, m, k in CANC if k >= 60]
print(u'    cancelaciones con 60+ meses de relación: %d — %s'
      % (len(largas), u', '.join(u'%s (%d)' % (n, k) for n, m, k in largas)))
jovenes = [(n, m, k) for n, m, k in CANC if k <= 8]
print(u'    cancelaciones con 8 meses o menos:       %d — %s'
      % (len(jovenes), u', '.join(u'%s (%d)' % (n, k) for n, m, k in jovenes)))
zd = [n for n, _, _ in CANC if n.startswith(u'ZD')]
print(u'    cuentas «ZD · …» en la lista:            %d — %s' % (len(zd), u', '.join(zd)))
print(u'\n    La mayor baja, %s, pesa el %.1f%% de TODO lo cancelado del mes.'
      % (CANC[0][0], CANC[0][1] / CANC_TOTAL * 100))

# ── 8 · OCTUBRE CONTRA SUS CUATRO LECTURAS ──────────────────────────────────
print(u'\n  8 · EL MISMO OCTUBRE, LEÍDO CUATRO VECES\n')
print(u'    Octubre lleva cuatro cortes y los cuatro publican «las cancelaciones')
print(u'    del mes» con cifras que no se parecen:\n')
LECTURAS = [
    (u'S24 · 16 oct', 11, 35127.00, 31620.33, 10),
    (u'S25 · 21 oct',  2,  6708.50,  6038.00,  4),
    (u'S26 · 27 oct', 11, 20234.00,     None, None),
    (u'S27 ·  4 nov', 20, 75295.50, 31187.97, 14),
]
print(u'      corte          cancel.  importe        downgrades  casos')
for etq, n, m, dg, dgn in LECTURAS:
    print(u'      %-13s  %5d  %12s  %10s  %5s'
          % (etq, n, pesos(m),
             pesos(dg) if dg is not None else u'no medido',
             dgn if dgn is not None else u'—'))

# Los nombres que publicó cada corte, tomados de los bloques ya archivados en
# `page.tsx`. Si S27 es la UNIÓN de los cuatro, la cuenta tiene que salir.
S24_NOM = {  # los 11 de la semana 24
    u'Jason de Mexico': 17225.00, u'KOMBITEC': 8539.00, u'WhatsHome': 3250.00,
    u'ENCAMINO Chat': 1750.00, u'TP DIGITAL': 1300.00, u'LUNAH ECO-RESORTS': 588.00,
    u'FOBE': 519.00, u'Avezado Abogados Penales': 489.00, u'Schimer': 489.00,
    u'Cole Majzner arquitectos': 489.00, u'Annova Logistics': 489.00,
}
S25_NOM = {u'Grupo Turistico Rumbo S de RL de CV': 4349.00,
           u'PSI Division Latinoamérica': 2359.50}
S26_NOM = {u'Biolaboratorio Sadat': 7184.00, u'UAXI Tecnología': 4041.00,
           u'enMazatlan': 3480.00, u'ZD - Grupo Gira': 2355.00, u'Quality Orbi': 979.00}
S27_NOM = dict((n, m) for n, m, _ in CANC)

cierra(u'los 11 de la S24 contra su total declarado',
       list(S24_NOM.values()), 35127.00)
cierra(u'los 2 de la S25 contra su total declarado',
       list(S25_NOM.values()), 6708.50)

union = {}
for d in (S24_NOM, S25_NOM, S26_NOM, S27_NOM):
    for n, m in d.items():
        union[n] = m
exige(len(union) == CANC_N,
      u'la UNIÓN de los cuatro cortes son los %d que declara la S27' % CANC_N,
      u'%d nombres distintos · declara %d' % (len(union), CANC_N))

# Cada nombre que un corte anterior publicó y la S27 repite, ¿al mismo importe?
repetidos = [(n, S27_NOM[n], m) for d in (S24_NOM, S25_NOM, S26_NOM)
             for n, m in d.items() if n in S27_NOM]
discrepan = [(n, a, b) for n, a, b in repetidos if abs(a - b) > 0.005]
exige(not discrepan, u'y los repetidos vienen al MISMO importe',
      u'%d repetidos, %d con importe distinto' % (len(repetidos), len(discrepan)))
for n, a, b in discrepan:
    print(u'        · %-40s S27 %s · antes %s' % (n[:40], pesos(a), pesos(b)))

print(u'\n    La S27 NO trae nombres nuevos salvo dos: %s.'
      % u', '.join(sorted(n for n in S27_NOM if n not in S24_NOM
                          and n not in S25_NOM and n not in S26_NOM)))
print(u'    Todo lo demás ya estaba publicado. La S27 es la UNIÓN del mes;')
print(u'    la S25 y la S26 publicaron una REBANADA y la rotularon «el mes».')
print(u'\n    ESO ES EL HALLAZGO: la S26 declaró $20,234.00 en octubre cuando la')
print(u'    S24 ya había publicado $35,127.00 EN ESE MISMO MES, con Jason de')
print(u'    Mexico ($17,225.00) dentro. No es que la cifra creciera: es que la')
print(u'    S26 no incluía lo que la S24 ya tenía. [[regla-churn-mes-vencido]]')

# ¿Se puede identificar el cubo de la S27 con los que caen bajo su corte?
corte_min = min(m for _, m, _ in CANC)
bajo = dict((n, m) for n, m in union.items() if n not in S27_NOM)
print(u'\n    EL CUBO DE LA S27 — %d clientes por %s. Bajo su corte de %s'
      % (CUBO_N, pesos(CUBO_M), pesos(corte_min)))
print(u'    quedan %d nombres ya publicados por cortes anteriores:' % len(bajo))
for n in sorted(bajo, key=lambda k: -bajo[k]):
    print(u'      %-34s %s' % (n[:34], pesos(bajo[n])))
sb = round(sum(bajo.values()), 2)
exige(len(bajo) == CUBO_N, u'el CONTEO del cubo coincide con esos nombres',
      u'%d nombres · cubo de %d' % (len(bajo), CUBO_N))
if abs(sb - CUBO_M) > 0.005:
    print(u'\n    ⚠️ PERO EL DINERO NO: esos %d suman %s y el cubo vale %s.'
          % (len(bajo), pesos(sb), pesos(CUBO_M)))
    print(u'    Quedan %s sin explicar. El conteo cuadra y el importe no, así'
          % pesos(round(CUBO_M - sb, 2)))
    print(u'    que NO son los mismos nueve, o alguno se reexpresó. Se publica')
    print(u'    el cubo como lo declara el corte y se pregunta. NO se nombra a')
    print(u'    esos nueve en la pantalla: coincide el número, no la cifra.')
    avisa(u'El cubo de cancelaciones de la S27 (9 clientes, %s) tiene el MISMO '
          u'conteo que los 9 nombres de cortes anteriores que caen bajo su corte '
          u'de %s, pero esos nueve sumaban %s: faltan %s por explicar.'
          % (pesos(CUBO_M), pesos(corte_min), pesos(sb), pesos(round(CUBO_M - sb, 2))))
else:
    print(u'\n    Y el dinero también: %s. El cubo queda identificado.' % pesos(sb))

# Los downgrades del mes, también leídos dos veces
print(u'\n    DOWNGRADES — la S24 y la S27 comparten el top al centavo:')
S24_DG = {u'Portalia': 9754.97, u'TUNALI TEC': 5404.00,
          u'Corporativo Grupo Funerario San Javier': 1959.00, u'Grupo Guía': 1600.00}
dg27 = dict((n, m) for n, m, _ in DG)
dgdif = [(n, dg27[n], m) for n, m in S24_DG.items()
         if n in dg27 and abs(dg27[n] - m) > 0.005]
exige(not dgdif, u'los cuatro downgrades de la S24 repiten importe en la S27',
      u'%d coinciden, %d discrepan' % (len(S24_DG), len(dgdif)))
nuevos_dg = round(DG_TOP_DECL - sum(S24_DG.values()), 2)
print(u'      el top sube de %s (4 casos) a %s (6): +%s, que son'
      % (pesos(sum(S24_DG.values())), pesos(DG_TOP_DECL), pesos(nuevos_dg)))
print(u'      exactamente Hotel Real de Minas + Proseso Consultores.')
exige(abs(nuevos_dg - (2490.00 + 2210.00)) < 0.005,
      u'y ese incremento son esos dos, al centavo',
      u'%s · esperado %s' % (pesos(nuevos_dg), pesos(2490.00 + 2210.00)))
print(u'\n    ⚠️ PERO EL TOTAL DEL MES BAJA mientras los casos SUBEN: %s en 10'
      % pesos(31620.33))
print(u'    casos (S24) → %s en 14 (S27). El cubo se encoge de %s'
      % (pesos(DG_TOTAL), pesos(12902.36)))
print(u'    en 6 casos a %s en 8. Más casos y menos dinero sin desglosar:'
      % pesos(CUBO_DG_M))
print(u'    puede ser upsell neteado, pero el corte no lo dice.')
avisa(u'Los downgrades de octubre BAJAN de $31,620.33 (S24, 10 casos) a '
      u'%s (S27, 14 casos) mientras el detalle SUBE. Lo que cambió está todo '
      u'en el cubo, que pasa de $12,902.36 en 6 casos a %s en 8. Hay que pedir '
      u'el desglose.' % (pesos(DG_TOTAL), pesos(CUBO_DG_M)))

# ── CIERRE ──────────────────────────────────────────────────────────────────
print(u'\n  ─────────────────────────────────────────────────────────────────')
if avisos:
    print(u'\n  LO QUE HAY QUE PREGUNTARLE A DATA (%d):\n' % len(avisos))
    for a in avisos:
        print(u'    · %s' % a)
if fallos:
    print(u'\n  *** %d COMPROBACIÓN(ES) NO CIERRAN:\n' % len(fallos))
    for f in fallos:
        print(u'    · %s' % f)
    print(u'')
    sys.exit(1)
print(u'\n  Todo lo interno del corte CIERRA. Se puede publicar.')
print(u'  Esto concilia el CORTE consigo mismo; no verifica el dato contra')
print(u'  nuestra cartera. [[feedback-verificar-antes-asegurar]]\n')
