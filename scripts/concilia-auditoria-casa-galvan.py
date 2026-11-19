# -*- coding: utf-8 -*-
u"""RECALCULA LAS CIFRAS DEL REPORTE DE CASA GALVÁN ANTES DE PUBLICARLO.

   Mismo patrón que `concilia-auditoria-santa-rosa.py` y `...-salud-y-hogar.py`:
   el reporte llega con sus cifras EMBEBIDAS en un `const D = {...}` dentro del
   `.html`. Se extraen y se recalculan contra lo que el TEXTO afirma. Un número
   que el texto cita y la serie no sostiene no impide publicar: impide publicar
   ESA cifra sin marcarla con palabras. [[auditoria-modulo]]

   Y SE COMPRUEBA CONTRA NUESTRAS FUENTES, no sólo contra sí mismo: el MRR
   institucional es el del GRC y nada más, y el Health Score sale de `cuentas`.
   Las dos clases ya han aparecido de verdad en reportes entregados.
   [[grc-fuente-zoho]]

   USO
       python -I scripts/concilia-auditoria-casa-galvan.py [ruta.html]

   La ruta es opcional para poder PROBAR QUE SABE FALLAR sobre una copia rota
   sin tocar el documento publicado. [[feedback-probar-al-reves]]
"""
import io
import json
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFECTO = os.path.join(RAIZ, 'public', 'auditorias', 'Auditoria-CASA-Galvan-2026.html')
RUTA = sys.argv[1] if len(sys.argv) > 1 else DEFECTO

fallos = []
avisos = []


def ok(cond, etiqueta, detalle=u''):
    print(u'  %-56s %s%s' % (etiqueta, u'OK' if cond else u'*** NO CIERRA',
                             (u'  ' + detalle) if detalle else u''))
    if not cond:
        fallos.append(etiqueta)
    return cond


def cerca(a, b, tol=0.051):
    return abs(a - b) <= tol


def miles(n):
    return format(int(round(n)), ',')


if not os.path.exists(RUTA):
    print(u'  no existe: %s' % RUTA)
    sys.exit(1)

html = io.open(RUTA, encoding='utf-8').read()

# ── LAS NOTAS QUE NOSOTROS AÑADIMOS SE RECORTAN ANTES DE BUSCAR ────────────
# Si no, el guion se delata a sí mismo: una nota que dice «el documento decía
# Health Score 76» contiene la cifra vieja, el detector la encuentra para
# siempre y el candado deja de servir. Y se EXIGE que las marcas existan:
# borrarlas tiene que poner esto en rojo. [[auditoria-modulo]]
NOTA = re.compile(r'<!--NOTA:INICIO-->.*?<!--NOTA:FIN-->', re.S)
notas = NOTA.findall(html)
texto = NOTA.sub(u' ', html)

m = re.search(r'const D=(\{.*?\});', html, re.S)
if not m:
    print(u'  no se encontró el bloque `const D={...}` con las cifras embebidas.')
    sys.exit(1)
D = json.loads(m.group(1))

SERIES = ['Atendidas', 'Terminadas en menú (IVR)', 'Buzón', 'Perdidas']

print(u'\n  CONCILIACIÓN · AUDITORÍA DE TRÁFICO · CASA GALVÁN (CID 13885)')
print(u'  ' + u'=' * 72)
print(u'  documento: %s' % RUTA)
print(u'  notas nuestras marcadas en el documento: %d' % len(notas))

# ─── 1 · LAS TRES SERIES TIENEN QUE DAR EL MISMO TOTAL ─────────────────────
print(u'\n  --- 1 · EL TOTAL DE ENTRANTES, POR TRES CAMINOS DISTINTOS')
tot = {}
for clave, eje in (('mensual', 'meses'), ('hora', 'horas'), ('dia', 'dias')):
    b = D[clave]
    tot[clave] = {s: sum(b[s]) for s in SERIES}
    n = sum(tot[clave].values())
    print(u'      %-8s %s entrantes · atendidas %s · menú %s · buzón %s · perdidas %s'
          % (clave, miles(n), miles(tot[clave][SERIES[0]]), miles(tot[clave][SERIES[1]]),
             miles(tot[clave][SERIES[2]]), miles(tot[clave][SERIES[3]])))

ENTRANTES = sum(tot['mensual'].values())
# «hora» sólo cubre L-V y «dia» cubre la semana entera: el único que tiene que
# dar el total del periodo es «mensual». Lo que SÍ tiene que cerrar es `dia`.
ok(sum(tot['dia'].values()) == ENTRANTES,
   u'las series por mes y por día dan el mismo total',
   u'%s vs %s' % (miles(sum(tot['dia'].values())), miles(ENTRANTES)))
ok(ENTRANTES == 15169, u'el total coincide con las 15,169 que cita el texto',
   miles(ENTRANTES))

# La serie por hora es de LUNES A VIERNES: tiene que ser MENOR, y por la
# diferencia exacta del fin de semana. Comprobarlo contra el total sin más
# daría un falso «no cierra» cada semana.
finde = {s: D['dia'][s][5] + D['dia'][s][6] for s in SERIES}
cubierto = sum(tot['hora'].values()) + sum(finde.values())
hueco = ENTRANTES - cubierto
huecoPerd = tot['mensual'][SERIES[3]] - (sum(D['hora'][SERIES[3]]) + finde[SERIES[3]])
ok(cubierto <= ENTRANTES, u'la serie por hora + el fin de semana no pasan del total',
   u'%s de %s' % (miles(cubierto), miles(ENTRANTES)))
# LA VENTANA DEL GRÁFICO POR HORA NO ES TODO EL DÍA: va de las 7 a las 20 h, así
# que las llamadas de madrugada o de después de las 21 h en día hábil no se
# dibujan. No es un error de las cifras —la tabla de causas SÍ las cuenta—, pero
# un gráfico que se come llamadas sin decirlo se lee como el día entero.
# Un recorte que no se declara se lee como cobertura completa.
print(u'      la ventana 7–20 h deja fuera %s llamada(s) de día hábil (%.2f%%), '
      u'%s de ellas perdidas' % (miles(hueco), hueco / float(ENTRANTES) * 100, miles(huecoPerd)))
ok(hueco / float(ENTRANTES) < 0.01, u'lo que deja fuera la ventana horaria es < 1%',
   u'%.2f%%' % (hueco / float(ENTRANTES) * 100))
if hueco:
    avisos.append(u'EL GRÁFICO POR HORA NO CUBRE EL DÍA ENTERO: su ventana va de las 7 a las '
                  u'20 h, así que deja fuera %s llamadas de día hábil (%.2f%%), de las que %s '
                  u'son perdidas. La tabla de causas SÍ las cuenta —suma exactamente las '
                  u'3,230—, pero no se ven en las barras y el lector no lo puede saber. Se '
                  u'declara en el pie del gráfico.'
                  % (miles(hueco), hueco / float(ENTRANTES) * 100, miles(huecoPerd)))

# ─── 2 · EL REPARTO DEL DESENLACE QUE CITA EL TEXTO ────────────────────────
print(u'\n  --- 2 · EL REPARTO QUE EL TEXTO AFIRMA')
PERDIDAS = tot['mensual'][SERIES[3]]
MENU = tot['mensual'][SERIES[1]]
reparto = [(u'43.8% atendidas', tot['mensual'][SERIES[0]], 43.8),
           (u'32.7% menú',      MENU,                      32.7),
           (u'2.2% buzón',      tot['mensual'][SERIES[2]], 2.2),
           (u'21.3% perdidas',  PERDIDAS,                  21.3)]
for etq, n, pct in reparto:
    calc = n / float(ENTRANTES) * 100
    ok(cerca(calc, pct), u'%s' % etq, u'%s/%s = %.1f%%' % (miles(n), miles(ENTRANTES), calc))
ok(sum(x[2] for x in reparto) == 100.0, u'los cuatro desenlaces suman 100%',
   u'%.1f%%' % sum(x[2] for x in reparto))
ok(PERDIDAS == 3230, u'las perdidas son las 3,230 que cita el texto', miles(PERDIDAS))

# «31.6% sin contar el menú» — una tasa derivada que el texto publica en una
# tarjeta KPI. Se reconstruye dividiendo, nunca se espeja.
sinMenu = ENTRANTES - MENU
ok(cerca(PERDIDAS / float(sinMenu) * 100, 31.6),
   u'31.6% de perdidas sin contar el menú',
   u'%s/%s = %.1f%%' % (miles(PERDIDAS), miles(sinMenu), PERDIDAS / float(sinMenu) * 100))

# ─── 3 · LA ATRIBUCIÓN DE CAUSAS · LA TESIS DEL REPORTE ────────────────────
print(u'\n  --- 3 · LAS CAUSAS · es la tesis entera del documento')
c = D['causas']
for causa, n in zip(c['causa'], c['n']):
    print(u'      %-32s %6s  %5.1f%%' % (causa, miles(n), n / float(PERDIDAS) * 100))
sumaCausas = sum(c['n'])
ok(sumaCausas == PERDIDAS, u'las causas suman EXACTAMENTE las perdidas',
   u'%s vs %s' % (miles(sumaCausas), miles(PERDIDAS)))

# La tesis: «2 de cada 3 (65.6%) son estructurales». Estructural = todo menos
# la saturación en horario. Se SUMA de las filas, no se teclea.
satur = [n for causa, n in zip(c['causa'], c['n']) if causa.lower().startswith(u'satur')]
estructural = sumaCausas - sum(satur)
ok(estructural == 2120, u'las estructurales son las 2,120 que cita el texto', miles(estructural))
ok(cerca(estructural / float(PERDIDAS) * 100, 65.6),
   u'65.6% estructurales — LA TESIS',
   u'%s/%s = %.1f%%' % (miles(estructural), miles(PERDIDAS),
                        estructural / float(PERDIDAS) * 100))
ok(sum(satur) == 1110 and cerca(sum(satur) / float(PERDIDAS) * 100, 34.4),
   u'34.4% de saturación real · 1,110', miles(sum(satur)))

# ─── 4 · LA HORA DE LA COMIDA ──────────────────────────────────────────────
print(u'\n  --- 4 · LAS 14 h · el hallazgo H2')
h = D['hora']
i14 = h['horas'].index('14h')
t14 = sum(h[s][i14] for s in SERIES)
ok(t14 == 1047, u'a las 14 h entran las 1,047 que cita el texto', miles(t14))
ok(h[SERIES[0]][i14] == 88, u'88 atendidas a las 14 h')
ok(cerca(88 / float(t14) * 100, 8.4), u'8.4% de atención a las 14 h',
   u'88/%s = %.1f%%' % (miles(t14), 88 / float(t14) * 100))
ok(h[SERIES[3]][i14] == 432 and cerca(432 / float(t14) * 100, 41.3),
   u'432 perdidas = 41.3% a las 14 h')
ok(h[SERIES[0]][h['horas'].index('13h')] == 762
   and h[SERIES[0]][h['horas'].index('15h')] == 689,
   u'762 a las 13 h y 689 a las 15 h, como dice el texto')
# Las 432 perdidas de las 14 h son TAMBIÉN la fila «Hora de comida» de causas:
# si no fueran el mismo número, la atribución estaría contando otra cosa.
comida = [n for causa, n in zip(c['causa'], c['n']) if u'comida' in causa.lower()]
ok(comida and comida[0] == h[SERIES[3]][i14],
   u'la causa «hora de comida» es la MISMA cifra que las 14 h',
   u'%s' % miles(comida[0] if comida else 0))

# «En horario hábil L-V, sin las 14 h, la tasa baja a 15.1%» — el contrapunto
# de la tesis: si esto no sale, el documento no puede decir que el equipo
# atiende bien.
HABIL = [u'8h', u'9h', u'10h', u'11h', u'12h', u'13h', u'15h', u'16h', u'17h']
idx = [h['horas'].index(x) for x in HABIL]
habilTot = sum(sum(h[s][i] for s in SERIES) for i in idx)
habilPerd = sum(h[SERIES[3]][i] for i in idx)
pctHabil = habilPerd / float(habilTot) * 100
ok(cerca(pctHabil, 15.1, 0.3), u'15.1% en horario hábil sin las 14 h — el contrapunto',
   u'%s/%s = %.1f%%' % (miles(habilPerd), miles(habilTot), pctHabil))

# ─── 5 · FUERA DE HORARIO Y FIN DE SEMANA ──────────────────────────────────
print(u'\n  --- 5 · FUERA DE HORARIO Y FIN DE SEMANA · H3')
i7 = h['horas'].index('7h')
t7 = sum(h[s][i7] for s in SERIES)
ok(h[SERIES[3]][i7] == 37 and t7 == 38, u'«37 de 38» antes de las 8 h',
   u'%d de %d' % (h[SERIES[3]][i7], t7))
for hh, umbral in ((u'19h', 70), (u'20h', 65)):
    j = h['horas'].index(hh)
    tj = sum(h[s][j] for s in SERIES)
    p = h[SERIES[3]][j] / float(tj) * 100
    ok(p >= umbral, u'%s pierde al menos %d%%' % (hh, umbral), u'%.1f%%' % p)
d = D['dia']
for nom, j, decl in ((u'sábado', 5, 40.0), (u'domingo', 6, 54.1)):
    tj = sum(d[s][j] for s in SERIES)
    p = d[SERIES[3]][j] / float(tj) * 100
    ok(cerca(p, decl, 0.1), u'%s pierde el %.1f%%' % (nom, decl),
       u'%s/%s = %.1f%%' % (miles(d[SERIES[3]][j]), miles(tj), p))
findeTot = sum(finde.values())
ok(findeTot == 1045, u'«1,045 entrantes en sábado y domingo»', miles(findeTot))
ok(d[SERIES[1]][5] == 2 and d[SERIES[1]][6] == 0,
   u'«sólo 2 llamadas terminaron en menú en sábado»')

# ─── 6 · LOS DESTINOS ──────────────────────────────────────────────────────
print(u'\n  --- 6 · DESTINOS · cada fila tiene que cerrar sola')
de = D['destinos']
nombres = de['destination_data_1']
for i, n in enumerate(nombres):
    suma = de['aten'][i] + de['perd'][i] + de['bz'][i]
    if suma > de['total'][i]:
        fallos.append(u'%s: atendidas+perdidas+buzón (%s) pasan del total (%s)'
                      % (n, miles(suma), miles(de['total'][i])))
    pct = de['perd'][i] / float(de['total'][i]) * 100
    if not cerca(pct, de['pct'][i], 0.1):
        fallos.append(u'%s: %% de perdidas publicado %.1f y calculado %.1f'
                      % (n, de['pct'][i], pct))
ok(not [f for f in fallos if u'pasan del total' in f or u'% de perdidas' in f],
   u'las %d filas de destinos cierran y su %% se reconstruye' % len(nombres))

# Los nombres que el texto acusa de «destino fantasma» tienen que estar en la
# tabla con esas cifras, o el lector no puede comprobarlos.
FANTASMA = {u'Elena Corona': (194, 1), u'Bianca de la vega': (473, 2),
            u'Mostrador Herrajes 1': (427, 136)}
for nom, (tt, aa) in FANTASMA.items():
    if nom not in nombres:
        fallos.append(u'«%s» se acusa en el texto y NO está en la tabla de destinos' % nom)
        continue
    i = nombres.index(nom)
    ok(de['total'][i] == tt and de['aten'][i] == aa,
       u'%s: %s entrantes, %s atendidas' % (nom, miles(tt), miles(aa)),
       u'tabla: %s / %s' % (miles(de['total'][i]), miles(de['aten'][i])))

# Y LOS QUE EL TEXTO NOMBRA SIN TABLA SE DECLARAN. No son un error —el reporte
# puede citar un dato que no graficó—, pero el lector no los puede comprobar y
# eso hay que decirlo. [[feedback-contexto-ia-sin-huecos]]
SIN_TABLA = [u'Mostrador Querétaro', u'Guadalupe Becerril']
faltan = [x for x in SIN_TABLA if x not in nombres]
if faltan:
    avisos.append(u'EL TEXTO ACUSA A %d DESTINO(S) QUE NO SALEN EN NINGUNA TABLA: %s. Las '
                  u'cifras que da de ellos (Mostrador Querétaro 38 entrantes / 5 atendidas, '
                  u'Guadalupe Becerril 24 / 0) NO se pueden recalcular desde el documento, y '
                  u'los dos van en el plan de acción a 15 días. Se marcan como no '
                  u'verificables en el propio documento.' % (len(faltan), u', '.join(faltan)))

# ─── 7 · SALIENTES ─────────────────────────────────────────────────────────
print(u'\n  --- 7 · SALIENTES')
s = D['salientes']
SAL = sum(s['n'])
OKS = sum(s['ok'])
ok(SAL == 18157, u'las salientes externas son las 18,157 del texto', miles(SAL))
ok(cerca(OKS / float(SAL) * 100, 51.7, 0.1), u'51.7% conectadas',
   u'%s/%s = %.1f%%' % (miles(OKS), miles(SAL), OKS / float(SAL) * 100))
malos = [(s['meses'][i], s['pct'][i], s['ok'][i] / float(s['n'][i]) * 100)
         for i in range(len(s['n']))
         if not cerca(s['pct'][i], s['ok'][i] / float(s['n'][i]) * 100, 0.1)]
ok(not malos, u'el % de conexión de cada mes se reconstruye dividiendo',
   u'' if not malos else u'; '.join(u'%s %.1f vs %.1f' % x for x in malos))
ag = D['agentes_sal']
iAZ = ag['destination_data_1'].index(u'Arturo Zubiate')
ok(ag['n'][iAZ] == 6772 and cerca(ag['n'][iAZ] / float(SAL) * 100, 37.0, 0.4),
   u'Arturo Zubiate hace el 37% de las salientes',
   u'%s/%s = %.1f%%' % (miles(ag['n'][iAZ]), miles(SAL), ag['n'][iAZ] / float(SAL) * 100))
# La suma de los usuarios listados NO tiene que dar el total: es un top. Lo que
# NO puede pasar es que lo pase. [[feedback-tablas-deben-cerrar]]
sumaAg = sum(ag['n'])
ok(sumaAg <= SAL, u'el top de usuarios no pasa del total de salientes',
   u'%s de %s (%.0f%%)' % (miles(sumaAg), miles(SAL), sumaAg / float(SAL) * 100))
if sumaAg < SAL:
    print(u'      el top de usuarios cubre %s de %s: quedan %s salientes sin usuario listado'
          % (miles(sumaAg), miles(SAL), miles(SAL - sumaAg)))

# ─── 8 · EL ANEXO POR LÍNEA ────────────────────────────────────────────────
print(u'\n  --- 8 · ANEXO POR LÍNEA · está escrito a mano en el HTML')
filas = re.findall(
    r'<tr><td>(\d{4,5})</td><td>([\d,]+)</td><td>([\d,]+)</td><td>([\d,]+)</td>'
    r'<td>([\d,]+)</td><td>([\d,]+)</td><td>([\d.]+)%</td></tr>', texto)
num = lambda x: int(x.replace(',', ''))
print(u'      %d línea(s) leídas del anexo' % len(filas))
ok(len(filas) == 11, u'el anexo trae las 11 líneas que cita el método', u'%d' % len(filas))
anexoTot = anexoAten = anexoMenu = anexoBuz = anexoPerd = 0
for lid, tt, aa, mm, bb, pp, pc in filas:
    tt, aa, mm, bb, pp = num(tt), num(aa), num(mm), num(bb), num(pp)
    anexoTot += tt; anexoAten += aa; anexoMenu += mm; anexoBuz += bb; anexoPerd += pp
    if aa + mm + bb + pp != tt:
        fallos.append(u'línea %s: %s+%s+%s+%s = %s y declara %s'
                      % (lid, aa, mm, bb, pp, miles(aa + mm + bb + pp), miles(tt)))
    if not cerca(pp / float(tt) * 100, float(pc), 0.1):
        fallos.append(u'línea %s: %% publicado %s y calculado %.1f' % (lid, pc, pp / float(tt) * 100))
ok(not [f for f in fallos if f.startswith(u'línea ')],
   u'cada línea del anexo cierra y su % se reconstruye')
for etq, got, want in ((u'entrantes', anexoTot, ENTRANTES),
                       (u'atendidas', anexoAten, tot['mensual'][SERIES[0]]),
                       (u'menú',      anexoMenu, MENU),
                       (u'buzón',     anexoBuz,  tot['mensual'][SERIES[2]]),
                       (u'perdidas',  anexoPerd, PERDIDAS)):
    ok(got == want, u'el anexo suma las mismas %s que las series' % etq,
       u'%s vs %s' % (miles(got), miles(want)))

# ─── 9 · CONTRA NUESTRAS FUENTES, NO SÓLO CONTRA SÍ MISMO ──────────────────
print(u'\n  --- 9 · CONTRA LAS FUENTES DE LA CASA')
G = json.load(io.open(os.path.join(RAIZ, 'data', 'grc-zoho.json'), encoding='utf-8'))
fila = next((f for f in G['filas'] if str(f.get('cid') or '') == '13885'), None)
if fila is None:
    fallos.append(u'CASA Galván (cid 13885) no aparece en el GRC')
else:
    mrr = float(fila.get('mrrFin') or 0)
    print(u'      GRC: %s · banda %s · MRR %s · %s meses · %s'
          % (fila.get('cliente'), fila.get('clasif'), miles(mrr),
             fila.get('meses'), fila.get('movimiento')))
    citado = re.search(r'MRR \$([\d,]+)', texto)
    ok(citado is not None and num(citado.group(1)) == int(mrr),
       u'el MRR del documento es el del GRC',
       u'documento $%s vs GRC $%s' % (citado.group(1) if citado else u'—', miles(mrr)))
    # «7 años como cliente» contra los meses del GRC. Redondear a la baja casi
    # un año hace parecer la relación más corta de lo que es, y la antigüedad
    # es un argumento del propio reporte.
    anios = int(fila.get('meses') or 0) / 12.0
    citAnios = re.search(r'(\d+) años como cliente', texto)
    if citAnios:
        ok(abs(float(citAnios.group(1)) - anios) < 0.5,
           u'los «años como cliente» cuadran con los meses del GRC',
           u'documento %s vs GRC %.1f (%s meses)'
           % (citAnios.group(1), anios, fila.get('meses')))

# Health Score: sale de `cuentas`, y el documento lo cita. Se lee por REST
# porque `lib/supabase` crea el cliente al importar y revienta fuera de Next.
env = {}
pEnv = os.path.join(RAIZ, '.env.local')
if os.path.exists(pEnv):
    for ln in io.open(pEnv, encoding='utf-8'):
        if '=' in ln and not ln.strip().startswith('#'):
            k, v = ln.split('=', 1)
            env[k.strip()] = v.strip().strip('"').strip("'")
base = env.get('NEXT_PUBLIC_SUPABASE_URL')
key = env.get('SUPABASE_SERVICE_ROLE_KEY') or env.get('NEXT_PUBLIC_SUPABASE_ANON_KEY')
cuenta = None
if base and key:
    try:
        import urllib.request
        req = urllib.request.Request(
            u'%s/rest/v1/cuentas?select=empresa,consecutivo,asesor,health_score,estado,'
            u'facturacion,activo_desde&cid=eq.13885' % base.rstrip('/'),
            headers={'apikey': key, 'Authorization': 'Bearer %s' % key})
        cuenta = (json.loads(urllib.request.urlopen(req, timeout=25).read().decode('utf-8')) or [None])[0]
    except Exception as e:                                    # noqa: BLE001
        print(u'      *** NO SE PUDO LEER `cuentas`: %s' % e)
        avisos.append(u'NO se pudo leer `cuentas`: el Health Score del documento queda SIN '
                      u'comprobar. Eso no es «coincide»: es que no se midió.')
if cuenta:
    print(u'      cuentas: %s %s · asesor %s · Health Score %s · estado %s'
          % (cuenta.get('consecutivo'), cuenta.get('empresa'), cuenta.get('asesor'),
             cuenta.get('health_score'), cuenta.get('estado')))
    citHS = re.search(r'Health Score (\d+)', texto)
    ok(citHS is not None and int(citHS.group(1)) == int(cuenta.get('health_score') or -1),
       u'el Health Score del documento es el de `cuentas`',
       u'documento %s vs cuentas %s'
       % (citHS.group(1) if citHS else u'—', cuenta.get('health_score')))
    # El asesor del documento, si lo nombra. Una ficha con el asesor viejo ya
    # tumbó un tablero entero. [[erick-sustituye-a-claudia]]
    if re.search(r'\bClaudia\b', texto):
        fallos.append(u'el documento nombra a «Claudia», que ya no es asesora de cartera')

# ─── 10 · LA CONTRADICCIÓN INTERNA, QUE ES EL DETECTOR MÁS BARATO ──────────
print(u'\n  --- 10 · CONTRADICCIONES INTERNAS')
# El resumen publica «1,411 sin reintento ni devolución» y la sección de
# impacto calcula sobre «1,983 perdidas no recuperadas». Son dos poblaciones
# distintas y el documento no explica el salto: 572 llamadas de diferencia.
m1411 = re.search(r'1,411', texto)
m1983 = re.search(r'1,983 perdidas no recuperadas', texto)
if m1411 and m1983:
    avisos.append(u'DOS POBLACIONES DISTINTAS SIN PUENTE: el resumen publica «1,411 sin '
                  u'reintento ni devolución en 24 h (43.7%)» y la sección de Impacto calcula '
                  u'sobre «1,983 perdidas no recuperadas en 24 h» (61.4%). Son 572 llamadas '
                  u'de diferencia —probablemente las que reintentaron y tampoco entraron—, '
                  u'pero el documento no lo dice y un lector no puede reconstruirlo. Hay que '
                  u'explicar el salto DENTRO del documento. [[feedback-auditorias-verificar]]')
ok(cerca(1411 / float(PERDIDAS) * 100, 43.7, 0.1), u'43.7% = 1,411 sobre las perdidas',
   u'%.1f%%' % (1411 / float(PERDIDAS) * 100))
ok(cerca(1983 / float(PERDIDAS) * 100, 61.4, 0.1), u'1,983 es el 61.4% de las perdidas',
   u'%.1f%%' % (1983 / float(PERDIDAS) * 100))

# Los escenarios de impacto se reconstruyen multiplicando.
esc = re.findall(r'<tr><td>(\d+)%</td><td>(\d+)</td><td>≈ (\d+)</td></tr>', texto)
for pct, pedidos, anual in esc:
    calc = 1983 * int(pct) / 100.0
    ok(abs(calc - int(pedidos)) <= 1, u'escenario %s%%: %s pedidos' % (pct, pedidos),
       u'1,983 × %s%% = %.0f' % (pct, calc))
    calcA = int(pedidos) * 12 / 10.5
    ok(abs(calcA - int(anual)) <= 2, u'escenario %s%%: anualizado ≈%s' % (pct, anual),
       u'%s × 12/10.5 = %.0f' % (pedidos, calcA))

# «65.6%» y «2 de cada 3» tienen que ser la misma afirmación.
ok(abs(estructural / float(PERDIDAS) - 2 / 3.0) < 0.02,
   u'«2 de cada 3» y «65.6%» dicen lo mismo')

# ─── 11 · LAS MARCAS DE LA CONCILIACIÓN ────────────────────────────────────
marcados = re.findall(r'<!--\s*CONCILIACION:MARCADOS\s+([^>]+?)\s*-->', html)
claves = [k.strip() for g in marcados for k in g.split(',') if k.strip()]
print(u'\n  --- 11 · DESFASES DECLARADOS DENTRO DEL DOCUMENTO')
print(u'      %s' % (u', '.join(claves) if claves else u'ninguno'))
# BORRAR LAS NOTAS TIENE QUE PONER ESTO EN ROJO. Son las correcciones y los
# límites que el lector ve; si alguien las quita, el documento vuelve a afirmar
# lo que no puede sostener y el guion seguiría en verde porque las cifras
# siguen cuadrando entre sí. Un candado que no vigila su propio candado no
# sirve. [[auditoria-modulo]] [[feedback-probar-al-reves]]
ok(len(notas) >= 3, u'las notas de conciliación siguen DENTRO del documento',
   u'%d bloque(s) NOTA' % len(notas))
ok(len(claves) >= 4, u'los desfases que no cierran siguen DECLARADOS por clave',
   u'%d clave(s)' % len(claves))

print(u'\n  ' + u'=' * 72)
if avisos:
    print(u'  %d AVISO(S) — hay que dejarlos escritos DENTRO del documento:' % len(avisos))
    for i, a in enumerate(avisos, 1):
        print(u'    %d) %s' % (i, a))
print(u'')
if fallos:
    print(u'  *** %d COMPROBACIÓN(ES) NO CIERRAN:' % len(fallos))
    for f in fallos:
        print(u'      - %s' % f)
    sys.exit(1)
print(u'  TODO LO RECALCULABLE CIERRA.')
sys.exit(0)
