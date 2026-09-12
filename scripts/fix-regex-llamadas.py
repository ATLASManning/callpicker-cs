"""El rango de diacriticos escrito con caracteres literales se corrompe al
   copiar el archivo. Se reemplaza por escapes Unicode explicitos."""
import io, re, os
os.chdir(r"D:\Windows\Projects\callpicker-cs")
P = 'lib/llamadas-cuenta.ts'
s = io.open(P, encoding='utf-8').read()
B = chr(92)
NUEVO = ".normalize('NFD').replace(/[" + B + "u0300-" + B + "u036f]/g, '')"
m = re.search(r"\.normalize\('NFD'\)\.replace\(/\[[^/]*\]/g, ''\)", s)
if not m:
    raise SystemExit('no se encontro el patron')
print('antes  : %r' % m.group(0))
s = s.replace(m.group(0), NUEVO)
io.open(P, 'w', encoding='utf-8', newline='\n').write(s)
s2 = io.open(P, encoding='utf-8').read()
print('despues: %r' % re.search(r"\.normalize\('NFD'\)\.replace\([^)]*\)", s2).group(0))
print('contiene u0300: %s' % ('u0300' in s2))
