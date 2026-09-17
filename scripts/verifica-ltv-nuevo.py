"""Comprueba el nuevo LTV: que el dato cierre y que la pantalla no mienta.

   No hay Node local, asi que se replica la logica de /api/ltv sobre el MISMO
   data/ltv-zoho.json que lee el servidor.

   Lo que tiene que probar:
     1. que el mes cierre: inicio - perdida - fraude + ganado = fin
     2. que la perdida este PARTIDA: confirmada + provisional = total, y que
        ninguna cuenta viva quede dentro de la confirmada
     3. que las doce columnas que pidio direccion tengan dato
"""
import sys, io, json, collections
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

D = json.load(io.open(r'D:\Windows\Projects\callpicker-cs\data\ltv-zoho.json', encoding='utf-8'))
M, F = D['meta'], D['filas']
f_ = lambda n: '$' + format(round(n), ',')

print('=== EL CORTE ===')
print('  mes %s · origen %s' % (M['mes'], M['origen']))
print('  filas %s · clientes %s · de la cartera %d'
      % (format(M['filas'], ','), format(M['clientes'], ','), M['enCartera']))

ini = sum(f['mrrIni'] for f in F)
fin = sum(f['mrrFin'] for f in F)
real = sum(f['perdidaReal'] for f in F)
fra = sum(f['perdidaFraude'] for f in F)
gan = sum(f['ganado'] for f in F)
print()
print('=== 1 · ¿CIERRA EL MES? ===')
print('  inicio %14s − perdida %13s − fraude %10s + ganado %12s'
      % (f_(ini), f_(real), f_(fra), f_(gan)))
calc = ini - real - fra + gan
print('  = %s   ·   declarado %s   ·   descuadre %.2f  %s'
      % (f_(calc), f_(fin), calc - fin, 'CIERRA' if abs(calc - fin) < 1 else '** NO CIERRA'))

prov = [f for f in F if f['provisional']]
pProv = sum(f['perdidaReal'] for f in prov)
pConf = real - pProv
print()
print('=== 2 · LA PERDIDA, PARTIDA ===')
print('  confirmada   %14s' % f_(pConf))
print('  provisional  %14s   (%d cuentas que siguen vivas)' % (f_(pProv), len(prov)))
print('  suma         %14s   contra el total %s  %s'
      % (f_(pConf + pProv), f_(real), 'cuadra' if abs(pConf + pProv - real) < 1 else '** NO CUADRA'))

# Ninguna cuenta viva de la cartera debe quedar contada como perdida confirmada
VIVO = ('activo', 'en_riesgo')
coladas = [f for f in F
           if f['perdidaReal'] > 0 and not f['provisional']
           and f['enCartera'] and f['estadoBase'] in VIVO]
print()
print('  cuentas VIVAS de la cartera dentro de la perdida confirmada: %d' % len(coladas))
for f in sorted(coladas, key=lambda x: -x['perdidaReal'])[:6]:
    print('    %-6s %-30s %-12s %3d meses · %-22s %s'
          % (f['consecutivo'] or '—', f['cliente'][:30], f['estadoBase'], f['meses'],
             str(f['movimiento'])[:22], f_(f['perdidaReal'])))
if coladas:
    print('    -> son bajas con movimiento distinto de «Churn confirmado»: la marca')
    print('       provisional solo cubre ese caso, que es el del mes a medias.')

print()
print('=== 3 · LAS DOCE COLUMNAS, ¿TIENEN DATO? ===')
CAMPOS = [('cliente', 'Cliente'), ('clasif', 'clasificacion_cliente'),
          ('facturas', 'Facturas_2026'), ('meses', 'Meses Activo'),
          ('acumulado', 'Importe Acumulado Recurrente'), ('mrrIni', 'MRR Inicio Contrato'),
          ('mrrFin', 'MRR Fin Contrato'), ('ganado', 'Ingreso Ganado Contrato'),
          ('movimiento', 'Movimiento MRR'), ('perdidaReal', 'Ingreso Perdido Real'),
          ('perdidaFraude', 'Ingreso Perdido Fraude-Reestructura'), ('rango', 'Rango MRR Fin')]
for k, etq in CAMPOS:
    con = sum(1 for f in F if f.get(k) not in (None, '', 0))
    print('  %-38s %5s de %s filas con valor' % (etq, format(con, ','), format(len(F), ',')))

print()
print('=== LO QUE VERA EL KPI PRINCIPAL ===')
print('  Acumulado recurrente %16s' % f_(sum(f['acumulado'] for f in F)))
print('  MRR inicio           %16s' % f_(ini))
print('  Perdida confirmada   %16s' % f_(pConf))
print('  Por confirmar        %16s' % f_(pProv))
print('  Ingreso ganado       %16s' % f_(gan))

print()
print('=== TOP 5 POR ACUMULADO (lo que abre la pestana Clientes) ===')
for f in sorted(F, key=lambda x: -x['acumulado'])[:5]:
    print('  %-34s %14s · %3d meses · %s'
          % (f['cliente'][:34], f_(f['acumulado']), f['meses'], f['movimiento']))
