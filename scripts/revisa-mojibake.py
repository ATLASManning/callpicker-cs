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

   LOS CINCO BYTES QUE DEJABAN PASAR MEDIA FAMILIA
   -----------------------------------------------
   cp1252 no define 0x81, 0x8D, 0x8F, 0x90 ni 0x9D, y la version anterior de
   este archivo concluia de ahi que «el round-trip no pudo haber producido
   esta secuencia». Es falso: Windows SI decodifica esos bytes, a los
   controles C1 invisibles del mismo numero. Python se niega, Windows no.

   La consecuencia era que `firma()` devolvia None para `Á` (C3 81) y para
   `Í` (C3 8D) — las DOS se caian de la tabla sin decirlo, y este detector
   daba por limpios archivos con `Á` e `Í` destrozadas. Que es exactamente lo
   que paso con las auditorias de octubre de 2026. Por eso ahora el mapa de
   bytes es explicito y completo: los 256.

   Y hay una tercera forma, mas sucia. Cuando el texto roto pasa por una
   consola, los controles C1 se PIERDEN y queda una `Ã` huerfana sin segundo
   caracter. Esa no se puede reparar sola —la misma `Ã` pudo venir de `Á` o
   de `Í`— asi que se REPORTA y no se toca. Un control C1 suelto si se
   borra: en codigo fuente no significa nada.

   POR QUE SE REVISA Y NO SOLO SE ARREGLA
   --------------------------------------
   Un detector que concluye «limpio» cuando en realidad no supo mirar es peor
   que no tenerlo, porque el siguiente que lo corra deja de revisar a mano.
   De ahi la autoprueba, que fabrica el daño en vez de describirlo.

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
#
# Las MAYUSCULAS acentuadas no son decoracion: los títulos de los hallazgos de
# Auditoría van en mayúsculas («ATENCIÓN —», «FACTURACIÓN —»), así que son las
# primeras que se rompen y las más visibles cuando se rompen.
#
# El guion corto `–` y la flecha `→` estaban FUERA de esta lista, y los dos
# viven en los docstrings y en las cabeceras de este repo. Por eso el detector
# daba limpio un archivo de auditoria con seis guiones cortos rotos dentro.
# (La secuencia rota NO se escribe aqui, por lo mismo que no se escribe en el
#  docstring: este archivo se revisa a si mismo.)
CARACTERES = (
    u'áéíóúüÁÉÍÓÚÜ'          # vocales acentuadas, ambas cajas
    u'ñÑçÇ'                   # eñe y cedilla
    u'àèìòùâêîôûäëïöÿ'        # acentos de otras lenguas (nombres, marcas)
    u'¿¡«»·°ºª'               # puntuación y ordinales del español
    u'—–‒―…‘’‚“”„'            # guiones largos, puntos suspensivos, comillas
    u'→←↑↓↔⇒'                 # flechas: tablas y docstrings de este repo
    u'✓✗✔✘•◦▸▪■□●○'           # viñetas y marcas de los reportes
    u'€£¥¢±×÷≈≠≤≥√∞∅'         # moneda y matemáticas
    u'²³¹½¼¾‰™©®§¶†‡'          # superíndices, símbolos legales
    u'─│┌┐└┘├┤┬┴┼━┃'           # cajas: los separadores de CADA encabezado de aqui
)
# `─` (U+2500) tampoco estaba, y es el caracter mas repetido de este repo
# despues de las letras: todos los encabezados de seccion de todos los
# docstrings son una fila de ellos. Lo encontre porque la linea 24 de
# `lib/alertas-movimiento.ts` seguia ilegible DESPUES de que este detector la
# diera por limpia — o sea que la leccion no era «faltaba un caracter» sino
# que la lista se escribio pensando en prosa y el repo escribe tablas.


# cp1252 completo y EXPLICITO, incluidos los cinco bytes que el estandar deja
# sin definir y que Windows resuelve a los controles C1 del mismo numero. Sin
# estos cinco, `Á` (C3 81) e `Í` (C3 8D) no tienen firma y se caen de la tabla.
CP1252 = {}
for _b in range(256):
    try:
        CP1252[_b] = _b.to_bytes(1, 'big').decode('cp1252')
    except UnicodeDecodeError:
        CP1252[_b] = chr(_b)       # 0x81 0x8D 0x8F 0x90 0x9D -> U+0081 ...

# Los controles C1. En codigo fuente NUNCA son legitimos: si hay uno es el
# residuo de un `Á` o un `Í` que paso por una consola que se comio la mitad.
CONTROLES_C1 = frozenset(chr(c) for c in range(0x80, 0xA0))


def firma(ch):
    """La forma doblemente codificada de `ch`.

       Los bytes UTF-8 de `ch`, cada uno interpretado como un carácter cp1252
       y vuelto a codificar. Eso es exactamente lo que hace el round-trip.

       Devuelve siempre una firma: `CP1252` cubre los 256 bytes. La versión
       anterior devolvía None para cinco de ellos y así perdía `Á` e `Í`.
    """
    return ''.join(CP1252[b] for b in ch.encode('utf-8'))


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


# Una `Ã`, `Â` o `â` seguida de espacio, de fin de linea o de MAYUSCULA no
# existe en ninguna de las lenguas que este repo escribe. Es el residuo de una
# firma a la que la consola le arranco el segundo caracter.
import re as _re
HUERFANA = _re.compile(u'[ÃÂâ](?=[\\s ]|[A-ZÁÉÍÓÚÑ]|$)', _re.MULTILINE)


def residuos(txt):
    """(texto sin controles C1, cuantos controles, [(linea, contexto)]).

       Se llama DESPUES de `repara`, cuando las firmas completas ya se
       sustituyeron. Lo que queda es residuo de verdad.

       Los controles C1 se borran: en código fuente no significan nada y
       estorban hasta para hacer un Edit, porque el texto que uno ve en
       pantalla no es el que está en el archivo.

       Las `Ã` huérfanas NO se tocan. La misma `Ã` pudo venir de `Á` o de `Í`
       y no hay forma de saberlo sin leer la palabra. Se reportan con su línea
       para que alguien las lea.
    """
    ctrl = sum(txt.count(c) for c in CONTROLES_C1)
    if ctrl:
        txt = u''.join(c for c in txt if c not in CONTROLES_C1)
    huerfanas = [(txt.count('\n', 0, m.start()) + 1,
                  txt[max(0, m.start() - 36):m.start() + 14].replace('\n', ' '))
                 for m in HUERFANA.finditer(txt)]
    return txt, ctrl, huerfanas


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


def fabrica_daño(orig):
    """El daño tal como lo produce Windows, no como Python lo permite.

       `orig.encode('utf-8').decode('cp1252')` falla en Python si aparece uno
       de los cinco bytes sin definir — y ese fallo es lo que ocultaba el
       agujero: las pruebas no podían ni fabricar el caso de `Á`. Se decodifica
       byte por byte con el mapa completo.
    """
    return u''.join(CP1252[b] for b in orig.encode('utf-8'))


if '--autoprueba' in sys.argv:
    fallos = []
    print(u'  DEBE CAZARLO Y DEJARLO IGUAL QUE EL ORIGINAL:')
    for orig in (u'la heurística no alcanza',
                 u'medía 4.31:1 —por debajo de AA—',
                 u'cierra con «otros» y un assert',
                 u'¿dónde está el año? puntos suspensivos…',
                 u'la señal del canvas · el núcleo',
                 # Las cinco que el detector anterior NO sabia cazar.
                 u'ATENCIÓN — Septiembre 2026',          # C3 93, ya pasaba
                 u'FACTURACIÓN — la cuenta SÍ aparece',  # `Í`: C3 8D
                 u'ÁREA de oportunidad: MÁS volumen',    # `Á`: C3 81
                 u'llamadas  → app/cuentas/datos.ts',    # flecha
                 u'Marzo 2021 – Octubre 2026'):          # guion corto
        roto = fabrica_daño(orig)
        vuelto, hechos = repara(roto)
        vuelto, ctrl, huerf = residuos(vuelto)
        ok = vuelto == orig
        if not ok:
            fallos.append(u'%r -> %r' % (orig, vuelto))
        print(u'    %-44s %s' % (orig[:44], u'repara' if ok else u'** NO LO DEVUELVE'))

    print(u'\n  DEBE DEJAR EN PAZ EL TEXTO SANO:')
    for sano in (u'la heurística no alcanza',
                 u'medía 4.31:1 —por debajo de AA—',
                 u'cierra con «otros» y un assert',
                 u'# -*- coding: utf-8 -*-',
                 u'const TX = "#0F172A"  // marino',
                 u'ATENCIÓN — 24,341 de 43,860 · 55.5%',
                 u'Grupo Torres Corzo · Nissan · Aguascalientes'):
        vuelto, hechos = repara(sano)
        vuelto, ctrl, huerf = residuos(vuelto)
        ok = vuelto == sano and not hechos and not ctrl and not huerf
        if not ok:
            fallos.append(u'toco texto sano: %r -> %r' % (sano, vuelto))
        print(u'    %-44s %s' % (sano[:44], u'intacto' if ok else u'** LO TOCA'))

    print(u'\n  DEBE REPORTAR LO QUE NO PUEDE REPARAR SOLO:')
    # El caso que se nos colo de verdad: el daño paso por una consola que se
    # comio el control C1 y quedo una `Ã` sin pareja. No hay forma de saber si
    # era `Á` o `Í`; lo unico inaceptable es dar el archivo por limpio.
    #
    # Los casos se FABRICAN por punto de codigo, no se escriben. Escribirlos
    # haria que este archivo se acusara a si mismo en cada corrida, y la salida
    # obvia a eso es una excepcion para `scripts/revisa-mojibake.py` — que es
    # justo el agujero por donde alguien lo calla de verdad el dia que el
    # archivo tenga daño real. Un detector no se exceptua: se fabrica el caso.
    _A = u'Ã'   # la `Ã` huerfana, sin su control C1
    for roto, etiqueta in ((u'la cuenta S' + _A + u' aparece en el GRC', u'+ espacio'),
                           (u'EST' + _A + u' ESCRITO y nadie lo capturo', u'+ mayuscula'),
                           (u'M' + _A + u'S de las que pierde', u'+ mayuscula pegada')):
        vuelto, hechos = repara(roto)
        vuelto, ctrl, huerf = residuos(vuelto)
        ok = bool(huerf)
        if not ok:
            fallos.append(u'da por limpio un residuo (%s): %r' % (etiqueta, roto))
        print(u'    %-44s %s' % (etiqueta, u'lo reporta' if ok else u'** LO DA POR LIMPIO'))

    print(u'\n  DEBE BORRAR EL CONTROL C1 SUELTO:')
    vuelto, _ = repara(u'ESTA' + u'\u0081' + u' escrito')
    vuelto, ctrl, huerf = residuos(vuelto)
    ok = ctrl == 1 and u'\u0081' not in vuelto
    if not ok:
        fallos.append(u'no borra el control C1 suelto: %r' % vuelto)
    print(u'    %-44s %s' % (u'U+0081 huerfano', u'lo borra' if ok else u'** LO DEJA'))

    print(u'\n  LA TABLA CUBRE %d caracteres (antes se caian `Á` e `Í`).' % len(TABLA))
    for _c in u'ÁÍ–→':
        print(u'    %s -> firma %r %s' % (_c, firma(_c),
                                          u'EN LA TABLA' if any(ch == _c for _, ch in TABLA)
                                          else u'*** FUERA'))

    print(u'\n  %s' % (u'la autoprueba pasa entera' if not fallos
                       else u'*** FALLA:\n    - ' + u'\n    - '.join(fallos)))
    sys.exit(1 if fallos else 0)


arregla = '--arregla' in sys.argv
sucios, con_residuo, n = [], [], 0
for ruta in archivos():
    n += 1
    txt = io.open(ruta, encoding='utf-8').read()
    nuevo, hechos = repara(txt)
    nuevo, ctrl, huerfanas = residuos(nuevo)
    if not hechos and not ctrl and not huerfanas:
        continue
    rel = os.path.relpath(ruta, RAIZ).replace('\\', '/')
    if hechos or ctrl:
        sucios.append((rel, hechos, ctrl))
    if huerfanas:
        con_residuo.append((rel, huerfanas))
    if arregla and nuevo != txt:
        # `newline=''` y `\n` explicito: sin eso Windows mete `\r\n` en un
        # archivo que estaba con `\n` y el diff sale entero.
        io.open(ruta, 'w', encoding='utf-8', newline='').write(nuevo)

print(u'  %d archivo(s) revisados.\n' % n)

if sucios:
    print(u'  *** ACENTOS DOBLEMENTE CODIFICADOS ***')
    print(u'  Vienen de un `Get-Content | Set-Content` de PowerShell. El archivo')
    print(u'  corre igual; lo que sale mal es lo que alguien tiene que leer.\n')
    total = 0
    for rel, hechos, ctrl in sucios:
        cuantas = sum(c for _, _, c in hechos) + ctrl
        total += cuantas
        print(u'  %s   %d secuencia(s)' % (rel, cuantas))
        if hechos:
            print(u'      %s' % u', '.join(u'%s->%s x%d' % (f, ch, c) for f, ch, c in hechos))
        if ctrl:
            print(u'      %d control(es) C1 invisible(s) borrado(s)' % ctrl)
    print(u'\n  %d secuencia(s) en %d archivo(s).' % (total, len(sucios)))

if con_residuo:
    print(u'\n  *** RESIDUOS QUE HAY QUE LEER A MANO ***')
    print(u'  Una `Ã` suelta: el daño paso por una consola que se comio su')
    print(u'  segundo caracter. Pudo ser `Á` o `Í` y nadie puede saberlo sin')
    print(u'  leer la palabra, asi que NO se repara sola.\n')
    for rel, huerfanas in con_residuo:
        print(u'  %s   %d residuo(s)' % (rel, len(huerfanas)))
        for ln, ctx in huerfanas[:8]:
            print(u'      linea %-5d …%s…' % (ln, ctx))

if not sucios and not con_residuo:
    print(u'  ningun acento doblemente codificado, ningun residuo.')
    sys.exit(0)

if arregla:
    print(u'\n  REESCRITOS%s.' % (u' — los residuos de arriba siguen pendientes'
                                  if con_residuo else u''))
else:
    print(u'\n  Arreglo: python scripts/revisa-mojibake.py --arregla')
sys.exit(1)
