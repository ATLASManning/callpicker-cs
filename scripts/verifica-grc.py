"""Comprueba el modulo Gross Revenue Churn: que el dato cierre y que no mienta.

   No hay Node en esta maquina y el dashboard esta tras login, asi que ninguna
   ruta se puede verificar por HTTP — /api/grc redirige a /acceso con 200. La
   sustitucion es replicar la logica del endpoint sobre EL MISMO
   data/grc-zoho.json que lee el servidor, y probar lo que tiene que ser cierto:

     1. el mes cierra: inicio - perdida - fraude + ganado = fin
     2. las tres canastas agotan el churn, y churn + downgrade agota la perdida
     3. TODO corte suma lo mismo que el mes (ningun top-N que tire filas)
     4. el GRC acumulado es la suma de los mensuales, como lo define Zoho
     5. la serie reproduce lo que publica el tablero en los meses cerrados
     6. ninguna cuenta desmentida se cuela en la perdida verificada
     7. el objetivo por rango reproduce el «tope de perdida» del tablero
     8. los meses cerrados NO declaran verificacion: su detalle no viene en el
        export, asi que no se cotejaron contra nada. Van en None, no en cero y
        no igualados al mensual.
     9. TODO corte cierra, incluido el de asesor con su bucket de lo que esta
        fuera de la cartera
"""
import sys, io, json, collections
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

D = json.load(io.open(r'D:\Windows\Projects\callpicker-cs\data\grc-zoho.json', encoding='utf-8'))
M, SER, F = D['meta'], D['serie'], D['filas']
f_ = lambda n: '$' + format(round(n or 0), ',')
ok = lambda b: 'OK' if b else '** FALLA'
fallas = []
corridas = [0]


def prueba(etq, cond, detalle=''):
    corridas[0] += 1
    if not cond:
        fallas.append(etq)
    print('  %-58s %s %s' % (etq, ok(cond), detalle))


print('=== EL CORTE ===')
print('  mes vivo %s · origen %s' % (M['mesVivo'], M['origen']))
print('  filas %s · clientes %s · de la cartera %d'
      % (format(M['filas'], ','), format(M['clientes'], ','), M['enCartera']))

vivo = [m for m in SER if not m['cerrado']][0]
ini = sum(f['mrrIni'] for f in F)
fin = sum(f['mrrFin'] for f in F)
per = sum(f['perdida'] for f in F)
fra = sum(f['fraude'] for f in F)
gan = sum(f['ganado'] for f in F)

print()
print('=== 1 · ARITMETICA DEL MES ===')
calc = ini - per - fra + gan
prueba('inicio - perdida - fraude + ganado = fin', abs(calc - fin) < 1,
       'descuadre %.2f' % (calc - fin))

print()
print('=== 2 · LAS TRES CANASTAS ===')
esChurn = lambda f: (f['movimiento'] or '').startswith('Churn')
esDown = lambda f: (f['movimiento'] or '').startswith('Downgrade')
S = lambda L: sum(x['perdida'] for x in L)
baja = S([f for f in F if esChurn(f) and f['verificacion'] == 'baja'])
viva = S([f for f in F if esChurn(f) and f['verificacion'] == 'sigue_viva'])
sinv = S([f for f in F if esChurn(f) and f['verificacion'] == 'sin_verificar'])
churn = S([f for f in F if esChurn(f)])
down = S([f for f in F if esDown(f)])
print('  baja verificada %14s · desmentida %14s · sin verificar %14s'
      % (f_(baja), f_(viva), f_(sinv)))
prueba('las tres canastas agotan el churn', abs(baja + viva + sinv - churn) < 0.01)
prueba('churn + downgrade agota la perdida', abs(churn + down - per) < 0.01)
prueba('ninguna fila de churn quedo sin clasificar',
       not [f for f in F if esChurn(f) and f['perdida'] > 0 and f['verificacion'] == 'na'])

print()
print('=== 3 · TODO CORTE TIENE QUE CERRAR ===')
for etq in ('porRango', 'porClasif', 'porMovimiento', 'porAsesor'):
    s = sum(x['perdida'] for x in D[etq])
    prueba('%-14s suma la perdida del mes' % etq, abs(s - per) < 0.01,
           '%s vs %s' % (f_(s), f_(per)))
    n = sum(x['n'] for x in D[etq])
    prueba('%-14s cuenta todas las filas' % etq, n == len(F), '%d vs %d' % (n, len(F)))

print()
print('=== 4 · EL GRC ACUMULADO ES SUMA DE LOS MENSUALES ===')
a = 0.0
malos = []
for m in SER:
    a += m['grcMensual']
    if abs(a - m['grcAcumulado']) > 0.01:
        malos.append(m['mes'])
prueba('acumulado = suma de mensuales en los %d meses' % len(SER), not malos, str(malos or ''))
ago = [m for m in SER if m['mes'] == 'Agosto'][0]
prueba('Agosto acumulado 17.3%% como publica Zoho', abs(ago['grcAcumulado'] - 17.3) < 0.1,
       '%.1f%%' % ago['grcAcumulado'])

print()
print('=== 5 · LA SERIE CONTRA LO QUE PUBLICA EL TABLERO ===')
PUB = {'Enero': (4650020.89, 74083.11, 20848.01), 'Febrero': (4696696.10, 65589.19, 34216.37),
       'Marzo': (4776920.30, 82546.00, 25734.97), 'Abril': (4857171.51, 58214.06, 26413.59),
       'Mayo': (5074882.09, 32586.00, 42283.26), 'Junio': (5103295.12, 87260.00, 81522.81),
       'Julio': (4943564.29, 74017.46, 25576.75), 'Agosto': (5006567.60, 68784.18, 49977.17),
       'Septiembre': (4905228.27, None, 48432.26)}
for m in SER:
    p = PUB.get(m['mes'])
    if not p:
        continue
    prueba('%-11s MRR inicio' % m['mes'], abs(m['mrrInicio'] - p[0]) < 1, f_(m['mrrInicio']))
    if p[1] is not None:
        prueba('%-11s churn' % m['mes'], abs(m['churn'] - p[1]) < 1, f_(m['churn']))
    prueba('%-11s downgrade' % m['mes'], abs(m['downgrade'] - p[2]) < 1, f_(m['downgrade']))

print()
print('=== 6 · NINGUNA DESMENTIDA DENTRO DE LO VERIFICADO ===')
coladas = [f for f in F if f['verificacion'] == 'baja'
           and f['enCartera'] and f['estadoBase'] in ('activo', 'en_riesgo') and f['firma']]
prueba('ninguna cuenta viva con la firma cuenta como baja', not coladas, '%d' % len(coladas))
bajas = [f for f in F if f['verificacion'] == 'baja' and esChurn(f)]
print('  las %d bajas verificadas, una por una:' % len(bajas))
for f in sorted(bajas, key=lambda x: -x['perdida']):
    print('    %-8s %-34s %-12s %3d meses  %s'
          % (f['consecutivo'] or '—', f['cliente'][:34], f['estadoBase'], f['meses'], f_(f['perdida'])))

print()
print('=== 8 · LOS MESES CERRADOS NO DECLARAN VERIFICACION ===')
cerr = [m for m in SER if m['cerrado']]
prueba('ningun mes cerrado declara grcVerificado',
       all(m['grcVerificado'] is None for m in cerr),
       '%d meses' % len(cerr))
prueba('ningun mes cerrado declara canastas en cero',
       all(m['churnBaja'] is None and m['churnViva'] is None
           and m['churnSinVerificar'] is None for m in cerr))
prueba('el mes vivo SI declara verificacion', vivo['grcVerificado'] is not None,
       '%.1f%%' % vivo['grcVerificado'])

print()
print('=== 9 · EL CORTE POR ASESOR CIERRA ===')
fuera = [x for x in D['porAsesor'] if x.get('fueraDeCartera')]
prueba('existe el renglon de lo que esta fuera de la cartera', len(fuera) == 1,
       '%s filas por %s' % (format(fuera[0]['n'], ',') if fuera else '?',
                            f_(fuera[0]['perdida']) if fuera else '?'))
prueba('ningun renglon quedo con la etiqueta cruda «(sin dato)»',
       not [x for x in D['porAsesor'] if x['clave'] == '(sin dato)'])

print()
print('=== 7 · EL OBJETIVO POR RANGO REPRODUCE EL TOPE ===')
for r in D['porRango']:
    if r['objetivo'] is None:
        continue
    esperado = r['mrrInicio'] * r['objetivo'] / 100.0
    prueba('%-21s tope = MRR x objetivo' % r['clave'], abs(esperado - r['montoMaximo']) < 0.01,
           f_(r['montoMaximo']))

print()
print('=== 10 · LAS DOCE COLUMNAS DEL EXPORT LLEGAN AL DETALLE ===')
# El detalle es el archivo que compartio direccion. Si una columna del export no
# viaja hasta la fila, la pestana «Detalle» deja de ser el detalle y vuelve a ser
# un resumen — que es justo lo que este modulo vino a dejar de ser.
DOCE = [('Cliente', 'cliente'), ('clasificacion_cliente', 'clasif'),
        ('Facturas_2026', 'facturas'), ('Meses Activo', 'meses'),
        ('Importe Acumulado Recurrente', 'acumulado'),
        ('MRR Inicio Contrato (BCY)', 'mrrIni'), ('MRR Fin Contrato (BCY)', 'mrrFin'),
        ('Ingreso Ganado Contrato (BCY)', 'ganado'), ('Movimiento MRR', 'movimiento'),
        ('Ingreso Perdido Contrato (BCY) Real', 'perdida'),
        ('Ingreso Perdido Contrato (BCY) Fraude-Reestructura', 'fraude'),
        ('Rango MRR Fin Contrato', 'rango')]
for etq, k in DOCE:
    presentes = sum(1 for f in F if k in f)
    conDato = sum(1 for f in F if f.get(k) not in (None, ''))
    prueba('%-50s en las %s filas' % (etq, format(len(F), ',')), presentes == len(F),
           '%s con dato' % format(conDato, ','))
prueba('el detalle NO se recorta: van las %s filas' % format(len(F), ','), len(F) == M['filas'])

print()
print('=== LO QUE VERA LA PANTALLA ===')
print('  MRR inicio            %14s' % f_(ini))
print('  GRC publicado         %13.1f%%   (%s de perdida)' % (vivo['grcMensual'], f_(per)))
print('  GRC sin desmentidas   %13.1f%%' % vivo['grcSinDesmentidas'])
print('  GRC verificado        %13.1f%%   (%s)' % (vivo['grcVerificado'], f_(baja + down)))
print('  promedio historico    %13.1f%%   (%d meses cerrados)'
      % (sum(m['grcMensual'] for m in cerr) / len(cerr), len(cerr)))

print()
if fallas:
    print('*** %d de %d PRUEBAS FALLARON ***' % (len(fallas), corridas[0]))
    for x in fallas:
        print('    -', x)
    raise SystemExit(1)
print('=== LAS %d PRUEBAS PASAN ===' % corridas[0])
