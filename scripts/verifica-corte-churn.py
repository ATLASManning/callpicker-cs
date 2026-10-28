"""Comprueba el cableado del corte de churn vigente y sus cifras.

   La cadena es: reporte-actual.ts exporta UN corte vigente, y lo leen
   app/churn/page.tsx (cliente) y lib/atlas-context.ts (servidor). Si esos dos
   apuntan a cortes distintos, la pantalla y Atlas dicen cosas diferentes del
   mismo mes — que es justo lo que este archivo separado vino a evitar.

   Tambien recalcula las sumas del corte para que ninguna cifra escrita a mano
   se quede sin verificar.
"""
import sys, io, os, re, json
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = r'D:\Windows\Projects\callpicker-cs'
leer = lambda p: io.open(os.path.join(RAIZ, p), encoding='utf-8').read()

actual = leer(r'app\churn\reporte-actual.ts')
page   = leer(r'app\churn\page.tsx')
atlas  = leer(r'lib\atlas-context.ts')

exportado = re.findall(r'export const (REPORTE_\w+): ChurnReporte', actual)
print('=== CABLEADO ===')
print('  reporte-actual.ts exporta : %s' % (exportado or '** ninguno'))
if len(exportado) != 1:
    print('  ** debe exportar exactamente uno')
vig = exportado[0]

importa_page  = re.search(r"import \{ (REPORTE_\w+) \} from '\./reporte-actual'", page)
importa_atlas = re.search(r"import \{ (REPORTE_\w+) \} from '@/app/churn/reporte-actual'", atlas)
print('  page.tsx importa          : %s' % (importa_page.group(1) if importa_page else '** ninguno'))
print('  atlas-context.ts importa  : %s' % (importa_atlas.group(1) if importa_atlas else '** ninguno'))
ok_cable = (importa_page and importa_page.group(1) == vig
            and importa_atlas and importa_atlas.group(1) == vig)
print('  -> %s' % ('los tres apuntan al mismo corte' if ok_cable else '** DESALINEADOS'))

print('  page.tsx lo registra en allReportes : %s'
      % ('si' if re.search(r'allReportes[^\n]*%s' % vig, page) else '** NO'))
print('  page.tsx lo usa por omision         : %s'
      % ('si' if ('?? ' + vig) in page else '** NO'))

# El archivado no debe dejar el simbolo anterior exportado ni duplicado
dobles = [n for n in set(re.findall(r'const (REPORTE_\w+): ChurnReporte', page))
          if page.count('const %s: ChurnReporte' % n) > 1]
print('  simbolos duplicados en page.tsx     : %s' % (dobles or 'ninguno'))
print('  el corte anterior quedo archivado   : %s'
      % ('si' if 'const REPORTE_S19_SEPTIEMBRE_2026: ChurnReporte' in page else '** NO'))

# ── Cifras del corte vigente ────────────────────────────────────────────────
def num(campo):
    m = re.search(campo + r':\s*([0-9.]+)', actual)
    return float(m.group(1)) if m else None

def suma(bloque, campo):
    m = re.search(bloque + r':\s*\[(.*?)\n  \]', actual, re.S)
    if not m:
        return None
    return round(sum(float(x) for x in re.findall(campo + r':\s*([0-9.]+)', m.group(1))), 2)

print()
print('=== CIFRAS DEL CORTE VIGENTE ===')
pruebas = [
    # El bloque `pendientes` es el que la pantalla rotula «Pendiente de
    # Facturar». Segun el corte lleva el Top de cartera ACTIVO (semanas 20-22) o
    # la cartera POR COBRAR (desde la 24): el nombre de la fila no se puede fijar
    # aqui, asi que se dice neutro y el reporte explica cual es.
    ('bloque pendientes', suma('pendientes', 'monto'),       num('pendientesTotalReal')),
    ('downgrades',      suma('downgrades', 'perdida'),      num('downgradeTotalReal')),
    ('suspendidos',     suma('suspendidos', 'importe'),     num('suspendidosTotalReal')),
]
# UNA TABLA PARCIAL NO ES UN DESCUADRE.
#
# Varios cortes publican un Top 10 de cartera o un Top 5 de downgrades y
# ADEMAS declaran el total general: la suma de las filas es MENOR que el
# declarado a proposito, y eso esta bien. Marcarlo «REVISAR» era gritar sobre
# un archivo correcto, que es la forma mas rapida de que nadie mire al
# verificador.
#
# Lo que si es un problema es que la suma SUPERE al declarado: ahi o sobra una
# fila o el total esta mal. Esa distincion es la que faltaba.
for etq, calc, decl in pruebas:
    if calc is None or decl is None:
        veredicto = '— sin dato'
    elif abs(calc - decl) < 0.01:
        veredicto = 'cuadra'
    elif calc < decl:
        veredicto = 'parcial: faltan %s sin desglosar' % format(round(decl - calc, 2), ',')
    else:
        veredicto = '** REVISAR: la suma SUPERA al declarado por %s' % format(round(calc - decl, 2), ',')
    print('  %-16s suma %14s   declarado %14s   %s'
          % (etq, format(calc, ',') if calc is not None else '—',
             format(decl, ',') if decl is not None else '—', veredicto))

# Las filas de CIERRE —las que agrupan «el resto de la cartera»— tienen que
# empezar con «+»: lib/atlas-context.ts filtra por ese prefijo para no pasarle
# un total al modelo como si fuera un cliente. Sin el «+», Atlas reporta un
# cliente llamado «Resto de la cartera» con el monto agregado. Paso por ahi el
# 15 sep 2026 y lo detecte antes de publicar; queda comprobado de aqui en
# adelante.
m = re.search(r'pendientes:\s*\[(.*?)\n  \]', actual, re.S)
sospechosas = []
if m:
    for cli in re.findall(r"cliente:\s*'([^']+)'", m.group(1)):
        esCierre = re.search(r'\brest\w|\badicional\w|\botras? cuentas\b|no desglosa', cli, re.I)
        if esCierre and not cli.startswith('+'):
            sospechosas.append(cli[:70])
print()
print('=== FILAS DE CIERRE (deben empezar con «+» para que Atlas las ignore) ===')
print('  sin el prefijo: %s' % (sospechosas or 'ninguna'))

ant = suma('antiguedadSaldos', 'monto')
# El tramo por vencer se etiqueta de dos formas segun el corte: «Por vencer» a
# secas o «Por vencer (total Activo)». Buscando solo la primera, el script
# REVENTABA con AttributeError en los cortes nuevos —y al reventar se saltaba
# esta comprobacion y todas las de abajo sin decir que se las saltaba, que es
# peor que fallar—. Ahora tolera el sufijo y, si de verdad no esta, lo dice.
mPV = re.search(r"'Por vencer[^']*',\s*monto:\s*([0-9.]+)", actual)
if mPV:
    porVencer = float(mPV.group(1))
    etqPV = format(porVencer, ',')
else:
    # NO TODOS LOS CORTES TRAEN ESA CASILLA, y que falte no impide cuadrar: si
    # el primer tramo es «1 a 7 dias vencido», lo que la tabla reporta esta
    # TODO vencido y el por vencer es cero POR AUSENCIA DE TRAMO, no por
    # medicion. La version anterior abortaba aqui con SystemExit(1) y se
    # saltaba la comprobacion de abajo —la que de verdad importa—, asi que un
    # corte legitimo como el de la semana 25 tumbaba el verificador entero.
    #
    # Lo que NO se hace es inventar un cero: si ademas hubiera un tramo que
    # pareciera «por vencer» sin llamarse asi, esto lo contaria como vencido y
    # la comprobacion de abajo lo delataria al no cuadrar con ningun bloque.
    porVencer = 0.0
    etqPV = 'sin tramo'
vencido = round(ant - porVencer, 2)
print('  %-16s tramos %12s   por vencer %13s   vencido %s'
      % ('antigüedad', format(ant, ','), etqPV, format(vencido, ',')))
# EL VENCIDO TIENE QUE SER EL MISMO DINERO QUE UN BLOQUE DECLARADO, pero NO
# siempre el mismo bloque: hasta la semana 22 la cartera por cobrar vivia en
# `suspendidos` (Hard + Soft) y desde la 24 vive en `pendientes`. Comparando
# solo contra `suspendidos`, el verificador decia «** no» en un corte correcto
# — y un «no» que se repite sin ser nada es como no tener verificador. Ahora
# dice CONTRA CUAL cuadra, y solo falla si no cuadra contra ninguno.
#
# Y «POR VENCER» NO SIEMPRE ES LO MISMO, que es lo que rompio esto en la semana
# 26. Hay DOS formas legitimas del rotulo y significan cosas distintas:
#   A) «Por vencer (total Activo)» — NO es parte de la cartera por cobrar, es
#      otra cifra puesta al lado. Ahi el bloque es tramos MENOS por vencer.
#   B) «Por vencer» a secas — SI es un tramo de la cartera, y el corte lo mete
#      dentro de su propio total (semana 26: 6 clientes, y los 363 declarados
#      los incluyen). Ahi el bloque es el total de tramos, sin restar nada.
# Restando siempre, la semana 26 daba 476,802.59 contra 497,941.00 declarados y
# el verificador fallaba en un corte correcto. Se prueban las DOS lecturas y se
# dice CUAL cuadra; si no cuadra ninguna, falla.
candidatos = [('pendientes', num('pendientesTotalReal')),
              ('suspendidos', num('suspendidosTotalReal'))]
# Control negativo: con --control se mete un peso de mas para comprobar que esta
# comprobacion TODAVIA sabe fallar. Un verificador que concluye exito por
# defecto es peor que no tenerlo. [[feedback-verificar-antes-asegurar]]
sesgo = 1.0 if '--control' in sys.argv else 0.0
lecturas = [('el total de tramos', round(ant + sesgo, 2)),
            ('los tramos menos «por vencer»', round(vencido + sesgo, 2))]
casa = [(etq, n) for etq, val in lecturas
        for n, v in candidatos
        if v is not None and abs(val - v) < 0.01]
if casa:
    for etq, n in casa:
        print('  %s ES el bloque declarado «%s»' % (etq, n))
    if sesgo:
        print('  *** CONTROL NEGATIVO FALLIDO: cuadro con un peso de mas.')
        raise SystemExit(1)
else:
    if sesgo:
        print('  control negativo ok: con un peso de mas, NO cuadra.')
    else:
        print('  *** la antigüedad no cuadra con ningun bloque declarado, ni')
        print('      sumando «por vencer» (%s) ni restandolo (%s). Bloques: %s'
              % (format(ant, ','), format(vencido, ','),
                 ' · '.join('%s %s' % (n, format(v, ',') if v is not None else '—')
                            for n, v in candidatos)))
        raise SystemExit(1)
