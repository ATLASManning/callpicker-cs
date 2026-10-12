# -*- coding: utf-8 -*-
u"""¿A cuantas cuentas les pedimos un Excel de llamadas que YA TENEMOS?

   `lib/alertas-veredicto.ts` entraba en «no la vemos» con un O:

       if (!e.tieneLlamadas || e.consumoPct === null)

   …pero la accion era FIJA: «Pedir el Excel de llamadas entrantes y
   salientes». Asi que a una cuenta con lectura de llamadas y sin consumo se
   le pedia igual el archivo. Y el consumo no sale del cliente: sale de
   NUESTRO Informe de Cortes.

   Lo detecto Jose Manuel en GRUPO FRISA el 12 oct 2026, viendo que el modulo
   de Analisis de Llamadas traia 1,827 entrantes y 6,803 salientes de esa
   cuenta mientras la ficha le pedia el Excel.

   ── POR QUE SE CUENTA ANCLANDO AL ROTULO ───────────────────────────────
   La pantalla serializa cada tarjeta DOS veces: la visible y la copia del
   payload de React. Contar el texto del `porque` a secas DUPLICA todo — la
   primera version de este guion reporto 56 cuentas y $1.1M cuando eran la
   mitad. Se ancla al rotulo «No la vemos» seguido de la ACCION, que es la
   forma que solo tiene la tarjeta visible.

   USO
       python scripts/mide-pedido-llamadas.py [base]
"""
import io
import re
import sys
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:3100'
RUTA = '/acceso/vista-alertas'

print(u'\n  leyendo %s%s' % (BASE, RUTA))
try:
    html = urllib.request.urlopen(BASE + RUTA, timeout=300).read().decode('utf-8', 'replace')
except Exception as e:
    print(u'  *** no respondio: %s' % e); sys.exit(2)

texto = u' '.join(re.sub(u'<[^>]+>', u' ', html).split())

# Las TRES acciones que puede llevar una tarjeta «No la vemos», ancladas al
# rotulo. El importe viene en el `porque`, dentro de las ~320 letras que
# siguen.
RAMAS = [
    (u'pide el EXCEL al cliente',
     u'Pedir el Excel de llamadas entrantes y salientes', u'AL CLIENTE'),
    (u'gestion INTERNA (solo falta consumo)',
     u'Revisar por qu[eé] esta cuenta no aparece en el Informe de Cortes', u'INTERNA'),
    (u'pocas fuentes · sin llamadas',
     u'Pedir el Excel de llamadas y completar la ficha', u'AL CLIENTE'),
    (u'pocas fuentes · CON llamadas',
     u'Completar la ficha: hoy no alcanza para opinar', u'INTERNA'),
]

filas = []
for etq, accion, quien in RAMAS:
    # CONTAR LA TARJETA NO PUEDE DEPENDER DE ENCONTRARLE EL DINERO.
    #
    # La primera version pedia accion + importe en un solo patron y perdia 11
    # tarjetas: unas porque su `porque` es mas largo que la ventana, otras
    # porque `dinero()` escribe «sin importe» cuando la cuenta no aparece en
    # ninguna fuente de facturacion. Y perderlas no se notaba en el resultado,
    # solo en el cuadre contra el mosaico. Asi que primero se cuenta la
    # tarjeta por su ACCION —que es lo que decide si la peticion esta bien— y
    # el importe se busca despues, y puede faltar.
    rx = re.compile(u'No la vemos\\s+' + accion)
    casos = []
    for m in rx.finditer(texto):
        cola = texto[m.end():m.end() + 600]
        d = re.search(u'Son (\\$[\\d,]+|sin importe)', cola)
        if not d or d.group(1) == u'sin importe':
            casos.append(None)
        else:
            casos.append(float(d.group(1).lstrip(u'$').replace(',', '')))
    filas.append((etq, quien, casos))

total = sum(len(c) for _, _, c in filas)
if total == 0:
    print(u'  *** no encontre ninguna tarjeta de este cubo.')
    print(u'      ¿Cambio la redaccion de `accion` en lib/alertas-veredicto.ts?')
    print(u'      Revisalo antes de concluir que no hay casos.')
    sys.exit(2)

print(u'\n  TARJETAS «No la vemos»: %d\n' % total)
for etq, quien, casos in filas:
    # El dinero es el de las MEDIBLES, y se dice cuantas no lo son. Sumar un
    # `sin importe` como cero diria que esas cuentas no valen nada.
    medibles = [c for c in casos if c is not None]
    mudas = len(casos) - len(medibles)
    print(u'  %-40s %3d cuenta(s)  $%9s al mes%s   se pide %s'
          % (etq, len(casos), u'{:,.0f}'.format(sum(medibles)),
             u' (+%d sin importe)' % mudas if mudas else u'            ', quien))

# ── EL INVARIANTE ─────────────────────────────────────────────────────────
#
# Ninguna tarjeta puede decir a la vez que SI tenemos sus llamadas y pedir el
# Excel de llamadas. Se comprueba por el texto, no por un conteo.
contradice = len(re.findall(
    u'De esta cuenta s[ií] tenemos sus llamadas[\\s\\S]{0,400}?'
    u'Pedir el Excel de llamadas', texto))

# ── Y QUE CUADRE CONTRA EL MOSAICO DE LA PANTALLA ─────────────────────────
#
# La pantalla publica su propio conteo por situacion. Si las tres ramas no
# suman eso, hay una redaccion que este guion no reconoce — que es como se
# encontro la rama de «menos de tres fuentes», y como se descubrio que el
# payload de React duplicaba todo.
# El mosaico rotula «72 cuentas No la vemos»: el conteo va DELANTE.
mosaico = re.search(u'(\\d+)\\s+cuentas\\s+No la vemos', texto)
print(u'')
fallos = []
if contradice:
    fallos.append(u'%d tarjeta(s) dicen tener las llamadas Y piden el Excel' % contradice)
if mosaico:
    n = int(mosaico.group(1))
    if n != total:
        fallos.append(u'el mosaico marca %d cuentas «No la vemos» y las ramas '
                      u'suman %d: hay una redaccion sin clasificar' % (n, total))
    else:
        print(u'  cuadra con el mosaico de la pantalla: %d.' % n)
else:
    fallos.append(u'no encontre el conteo del mosaico — sin el, este guion no '
                  u'puede saber si se le escapa una rama')

for f in fallos:
    print(u'  *** %s' % f)
print(u'\n  %s' % (u'ninguna cuenta con llamadas recibe la peticion del Excel.'
                   if not fallos else u'*** %d cosa(s) que mirar' % len(fallos)))
sys.exit(1 if fallos else 0)
