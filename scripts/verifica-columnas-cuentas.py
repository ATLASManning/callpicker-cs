"""Cuenta encabezados contra celdas en la tabla de Cuentas.

   Agregar una columna es donde se rompe una tabla en silencio: si el <thead>
   tiene una <th> mas que el <tbody> celdas, el navegador no protesta — solo
   desalinea todo a partir de ahi, y el numero de una columna aparece bajo el
   titulo de otra. Es peor que un error, porque se ve bien.
"""
import sys, io, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

P = r'D:\Windows\Projects\callpicker-cs\app\cuentas\page.tsx'
t = io.open(P, encoding='utf-8').read()

# Encabezados: los <Th label=...> MAS los <th /> pelones.
# La primera version de este script solo contaba los rotulados y daba falsa
# alarma: la tabla cierra con un <th /> sin titulo para la columna de la
# flecha que abre la ficha. Contar la mitad de una cosa no es verificar.
i = t.find('<thead')
cab = t[i:t.find('</thead>', i)] if i > 0 else ''
ths = re.findall(r'<Th\s+label="([^"]+)"', cab)
pelones = len(re.findall(r'<th\s*/>', cab))
print('=== ENCABEZADOS ===')
for k, h in enumerate(ths, 1):
    print('  %2d. %s' % (k, h))
for k in range(pelones):
    print('  %2d. (sin rótulo — columna de la flecha)' % (len(ths) + k + 1))

# Las celdas del cuerpo: <td> dentro del map de filas
i = t.find('{sorted.map(')
cuerpo = t[i:t.find('</tbody>', i)] if i > 0 else ''
tds = len(re.findall(r'<td[\s>]', cuerpo))
total = len(ths) + pelones
print()
print('=== CUERPO ===')
print('  <td> en la fila     : %d' % tds)
print('  columnas en el thead: %d  (%d rotuladas + %d sin rótulo)' % (total, len(ths), pelones))
print('  -> %s' % ('CUADRAN' if tds == total else '** DESALINEADO: la tabla mostraría datos bajo el título equivocado'))

print()
print('=== EL CAMPO mrr_zoho, DONDE SE USA ===')
for n, linea in enumerate(t.split('\n'), 1):
    if 'mrr_zoho' in linea:
        print('  %4d  %s' % (n, linea.strip()[:96]))

print()
print('=== QUE NINGUNA SUMA MENSUAL LO INCLUYA ===')
malas = [l.strip()[:90] for l in t.split('\n')
         if 'reduce' in l and 'mrr_zoho' in l]
print('  sumas que mezclan mensual y acumulado: %s' % (malas or 'ninguna'))

print()
print('=== ROTULOS ===')
print('  dice «MRR» a secas : %d  (debe ser 0)' % len(re.findall(r'>\s*MRR\s*<', t)))
print('  dice «Acumulado»   : %d' % t.count('Acumulado'))
