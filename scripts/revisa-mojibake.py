# -*- coding: utf-8 -*-
"""Acentos destrozados por una doble codificacion.

   POR QUE EXISTE
   --------------
   `Get-Content | Set-Content` en PowerShell lee el archivo como cp1252 y lo
   reescribe como UTF-8. Cada acento sale con el doble de bytes y en pantalla
   aparece como dos caracteres raros. No rompe nada: el script sigue corriendo
   y escupiendo basura en la salida que alguien tiene que leer.

   (Este docstring NO trae un ejemplo escrito de la secuencia rota a proposito:
   lo traia, y el propio detector se acusaba a si mismo. Un detector que
   necesita una excepcion para no gritarse encima acaba teniendo la excepcion
   que alguien usa para callarlo de verdad. La firma se describe por bytes.)

   Y ES SILENCIOSO, que es lo peor. No hay error, no hay prueba que falle, y
   el daño solo se ve mirando la salida con atencion. Dos de los detectores de
   esta carpeta llevaban 48 secuencias entre los dos sin que nadie lo notara.

   COMO SE RECONOCE
   ----------------
   La doble codificacion deja una firma inequivoca. La letra i con acento se
   escribe en UTF-8 como `C3 AD`; doblemente codificada queda `C3 83 C2 AD`,
   o sea el `C3` y el `AD` originales vueltos a codificar cada uno por su
   cuenta. Asi que no hace falta adivinar nada: se busca la firma.

   POR QUE NO SE ARREGLA EL ARCHIVO ENTERO DE GOLPE
   ------------------------------------------------
   La tentacion es `texto.encode('cp1252').decode('utf-8')`. Eso funciona si
   TODO el archivo esta dañado, y en la practica no lo esta: el daño llega por
   los trozos que pasaron por PowerShell, y el resto de los acentos estan
   bien. Un round-trip global arregla unos y rompe los otros. Se sustituye
   secuencia por secuencia.

   USO
   ---
       python scripts/revisa-mojibake.py              # solo avisa
       python scripts/revisa-mojibake.py --arregla     # reescribe
       python scripts/revisa-mojibake.py --autoprueba
"""
import io
import os
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CARPETAS = ('app', 'components', 'lib', 'scripts')
SALTAR = ('node_modules', '.next', '.git')
EXTS = ('.py', '.ts', '.tsx', '.css', '.md', '.sql')

# Los caracteres que de verdad aparecen en este repo. Se genera la firma de
# cada uno en vez de escribirla a mano, que es como se cuela una mal.
CARACTERES = (
    u'áéíóúÁÉÍÓÚñÑüÜ¿¡«»·—…“”’°º€±×÷'
)


def firma(ch):
    """La forma doblemente codificada de `ch`.

       Los bytes UTF-8 de `ch`, cada uno interpretado como un carácter cp1252
       y vuelto a codificar. Eso es exactamente lo que hace el round-trip.
    """
    try:
        return ''.join(b.to_bytes(1, 'big').decode('cp1252')
                       for b in ch.encode('utf-8'))
    except UnicodeDecodeError:
        # Algunos bytes no son caracteres válidos en cp1252 (0x81, 0x8D, 0x8F,
        # 0x90, 0x9D). Si uno de ellos aparece, el round-trip no pudo haber
        # producido esta secuencia y no hay firma que buscar.
        return None


# Firma -> caracter correcto. Se ordena de MAS LARGA a mas corta: la de «—»
# tiene tres caracteres y la de «í» dos, y sustituir la corta primero puede
# comerse un trozo de la larga.
TABLA = []
for _ch in CARACTERES:
    _f = firma(_ch)
    if _f and _f != _ch:
        TABLA.append((_f, _ch))
TABLA.sort(key=lambda p: -len(p[0]))


def repara(txt):
    """(texto reparado, [(firma, caracter, cuantas)])."""
    hechos = []
    for f, ch in TABLA:
        n = txt.count(f)
        if n:
            txt = txt.replace(f, ch)
            hechos.append((f, ch, n))
    return txt, hechos


def archivos():
    for base in CARPETAS:
        d = os.path.join(RAIZ, base)
        if not os.path.isdir(d):
            continue
        for dp, dn, fn in os.walk(d):
            dn[:] = [x for x in dn if x not in SALTAR]
            for f in sorted(fn):
                if f.endswith(EXTS):
                    yield os.path.join(dp, f)


if '--autoprueba' in sys.argv:
    fallos = []
    print(u'  DEBE CAZARLO Y DEJARLO IGUAL QUE EL ORIGINAL:')
    for orig in (u'la heurística no alcanza',
                 u'medía 4.31:1 —por debajo de AA—',
                 u'cierra con «otros» y un assert',
                 u'¿dónde está el año? puntos suspensivos…',
                 u'la señal del canvas · el núcleo'):
        # Se fabrica el daño igual que lo fabrica PowerShell: los bytes UTF-8
        # leidos como cp1252.
        roto = orig.encode('utf-8').decode('cp1252')
        vuelto, hechos = repara(roto)
        ok = vuelto == orig
        if not ok:
            fallos.append(u'%r -> %r' % (orig, vuelto))
        print(u'    %-44s %s' % (orig[:44], u'repara' if ok else u'** NO LO DEVUELVE'))

    print(u'\n  DEBE DEJAR EN PAZ EL TEXTO SANO:')
    for sano in (u'la heurística no alcanza',
                 u'medía 4.31:1 —por debajo de AA—',
                 u'cierra con «otros» y un assert',
                 u'# -*- coding: utf-8 -*-',
                 u'const TX = "#0F172A"  // marino'):
        vuelto, hechos = repara(sano)
        ok = vuelto == sano and not hechos
        if not ok:
            fallos.append(u'toco texto sano: %r -> %r' % (sano, vuelto))
        print(u'    %-44s %s' % (sano[:44], u'intacto' if ok else u'** LO TOCA'))

    print(u'\n  %s' % (u'la autoprueba pasa entera' if not fallos
                       else u'*** FALLA:\n    - ' + u'\n    - '.join(fallos)))
    sys.exit(1 if fallos else 0)


arregla = '--arregla' in sys.argv
sucios, n = [], 0
for ruta in archivos():
    n += 1
    txt = io.open(ruta, encoding='utf-8').read()
    nuevo, hechos = repara(txt)
    if not hechos:
        continue
    rel = os.path.relpath(ruta, RAIZ).replace('\\', '/')
    sucios.append((rel, hechos))
    if arregla:
        # `newline=''` y `\n` explicito: sin eso Windows mete `\r\n` en un
        # archivo que estaba con `\n` y el diff sale entero.
        io.open(ruta, 'w', encoding='utf-8', newline='').write(nuevo)

print(u'  %d archivo(s) revisados.\n' % n)
if not sucios:
    print(u'  ningun acento doblemente codificado.')
    sys.exit(0)

print(u'  *** ACENTOS DOBLEMENTE CODIFICADOS ***')
print(u'  Vienen de un `Get-Content | Set-Content` de PowerShell. El archivo')
print(u'  corre igual; lo que sale mal es lo que alguien tiene que leer.\n')
total = 0
for rel, hechos in sucios:
    cuantas = sum(c for _, _, c in hechos)
    total += cuantas
    print(u'  %s   %d secuencia(s)' % (rel, cuantas))
    print(u'      %s' % u', '.join(u'%s->%s x%d' % (f, ch, c) for f, ch, c in hechos))
print(u'\n  %d secuencia(s) en %d archivo(s).' % (total, len(sucios)))
if arregla:
    print(u'  REESCRITOS.')
else:
    print(u'  Arreglo: python scripts/revisa-mojibake.py --arregla')
sys.exit(1)
