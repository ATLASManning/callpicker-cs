# -*- coding: utf-8 -*-
u"""¿Cuales de las bajas `sin_verificar` siguen FACTURANDO? La prueba mas barata.

   EL PROBLEMA
   -----------
   El corte vigente trae 1,396 lineas marcadas «Churn confirmado» con
   verificacion `sin_verificar`: $2.5M declarados como perdida que nadie ha
   comprobado. No se pueden cotejar contra la cartera porque no estan en ella
   —o llegan sin CID, o con otro nombre— y comprobarlas a mano es inviable.

   LA PRUEBA, Y ES ARITMETICA
   --------------------------
   El GRC trae por linea su importe ACUMULADO y su contador de FACTURAS. Si
   entre dos cortes el acumulado de una linea CRECIO, esa linea facturo en el
   periodo. **Una cuenta dada de baja no factura.** No hace falta saber quien
   es, ni cruzarla con nada: la propia fuente se desmiente sola.

   Salio de Seccion Amarilla (ADSA) el 13 oct 2026: marcada «Churn confirmado»
   en los dos cortes y su acumulado subio de $7,647,513 a $7,679,888 —$32,375
   exactos, su mensualidad— con las facturas pasando de 8 a 9.

   Y SIRVE EN LAS DOS DIRECCIONES, que es lo que la hace util
   ----------------------------------------------------------
   Una linea cuyo acumulado NO se movio no queda probada como baja —puede que
   simplemente no tocara facturar en esos dias— pero deja de ser un candidato a
   desmentido. Eso tambien es informacion: aplicada a GTC, cuyas 13 lineas
   activas valen $272,436, dice que NO facturaron entre los dos cortes, mientras
   que ADSA si. Las dos estaban en la misma canasta y no estan en la misma
   situacion. [[grupo-gtc-torres-corzo]]

   LO QUE **NO** PRUEBA, y hay que decirlo
   ---------------------------------------
   Que el acumulado no crezca NO prueba que la cuenta este muerta. Dos cortes
   separados por nueve dias no cubren un ciclo de facturacion completo, asi que
   una cuenta viva que factura el dia 15 no aparece aqui. Esto solo produce
   DESMENTIDOS, nunca confirmaciones de baja. [[feedback-cero-sin-medicion]]

   USO
       python scripts/desmiente-churn-por-acumulado.py
       python scripts/desmiente-churn-por-acumulado.py <nuevo.json> <viejo.json>
       python scripts/desmiente-churn-por-acumulado.py --autoprueba
"""
import io
import os
import sys
import json

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(RAIZ, 'data')


def num(v):
    try:
        return float(v or 0)
    except Exception:
        return 0.0


def veredicto(nueva, vieja):
    u"""(estado, delta_acumulado, delta_facturas).

       'facturo'     el acumulado crecio -> la baja esta DESMENTIDA
       'sin_cambio'  no se movio -> no se puede decir nada
       'retrocedio'  el acumulado BAJO -> el export se reexpreso; mirar aparte
    """
    da = num(nueva.get('acumulado')) - num(vieja.get('acumulado'))
    df = num(nueva.get('facturas')) - num(vieja.get('facturas'))
    if da > 0.005:
        return 'facturo', da, df
    if da < -0.005:
        return 'retrocedio', da, df
    return 'sin_cambio', da, df


if '--autoprueba' in sys.argv:
    fallos = []
    print(u'  LOS TRES VEREDICTOS, con los casos reales que los motivaron:')
    casos = [
        (u'ADSA: acumulado +32,375 y facturas 8->9',
         {'acumulado': 7679888.0, 'facturas': 9}, {'acumulado': 7647513.0, 'facturas': 8},
         'facturo'),
        (u'GTC - CENTRO MAX: acumulado identico',
         {'acumulado': 271586.0, 'facturas': 7}, {'acumulado': 271586.0, 'facturas': 7},
         'sin_cambio'),
        (u'una linea reexpresada a la baja',
         {'acumulado': 100.0, 'facturas': 3}, {'acumulado': 150.0, 'facturas': 3},
         'retrocedio'),
        (u'un centavo de diferencia NO es facturar',
         {'acumulado': 1000.001, 'facturas': 2}, {'acumulado': 1000.0, 'facturas': 2},
         'sin_cambio'),
    ]
    for etq, a, b, esp in casos:
        got = veredicto(a, b)[0]
        ok = got == esp
        if not ok:
            fallos.append(u'%s -> %s, esperaba %s' % (etq, got, esp))
        print(u'    %-48s %s' % (etq[:48], u'OK' if ok else u'** %s' % got))
    print(u'\n  %s' % (u'la autoprueba pasa entera' if not fallos
                       else u'*** FALLA:\n    - ' + u'\n    - '.join(fallos)))
    sys.exit(1 if fallos else 0)


args = [a for a in sys.argv[1:] if not a.startswith('--')]
f_nuevo = args[0] if args else os.path.join(DATA, 'grc-zoho.json')
if len(args) > 1:
    f_viejo = args[1]
else:
    # El respaldo mas reciente que NO sea el vigente.
    bks = sorted(x for x in os.listdir(DATA)
                 if x.startswith('grc-zoho.') and x.endswith('.bak.json'))
    if not bks:
        print(u'  *** no hay respaldo `grc-zoho.*.bak.json` contra el que comparar.')
        print(u'      Sin dos cortes esta prueba no existe. NO se concluye nada.')
        sys.exit(2)
    f_viejo = os.path.join(DATA, bks[-1])

N = json.load(io.open(f_nuevo, encoding='utf-8'))['filas']
V = json.load(io.open(f_viejo, encoding='utf-8'))['filas']
print(u'  nuevo:  %s  (%s lineas)' % (os.path.basename(f_nuevo), u'{:,}'.format(len(N))))
print(u'  viejo:  %s  (%s lineas)' % (os.path.basename(f_viejo), u'{:,}'.format(len(V))))

# Se cruza por nombre porque es la unica llave que estas lineas tienen. Los
# nombres repetidos se agregan para no emparejar la fila equivocada.
def agrupa(filas):
    d = {}
    for f in filas:
        k = str(f.get('cliente') or '').strip()
        if not k:
            continue
        p = d.setdefault(k, {'acumulado': 0.0, 'facturas': 0.0, 'perdida': 0.0,
                             'mrrIni': 0.0, 'n': 0, 'verificacion': set(),
                             'movimiento': set(), 'clasif': set()})
        p['acumulado'] += num(f.get('acumulado'))
        p['facturas'] += num(f.get('facturas'))
        p['perdida'] += num(f.get('perdida'))
        p['mrrIni'] += num(f.get('mrrIni'))
        p['n'] += 1
        p['verificacion'].add(f.get('verificacion'))
        p['movimiento'].add(f.get('movimiento'))
        p['clasif'].add(f.get('clasif'))
    return d


gn, gv = agrupa(N), agrupa(V)
sinver = {k: v for k, v in gn.items() if 'sin_verificar' in v['verificacion']}
print(u'\n  %s cliente(s) con al menos una linea `sin_verificar`'
      % u'{:,}'.format(len(sinver)))
print(u'  $%s de perdida declarada entre todos\n'
      % u'{:,.2f}'.format(sum(v['perdida'] for v in sinver.values())))

desmentidos, sin_cambio, retro, sin_par = [], [], [], []
for k, v in sinver.items():
    if k not in gv:
        sin_par.append(k)
        continue
    est, da, df = veredicto(v, gv[k])
    if est == 'facturo':
        desmentidos.append((k, v, da, df))
    elif est == 'retrocedio':
        retro.append((k, v, da, df))
    else:
        sin_cambio.append((k, v))

print(u'  ══ DESMENTIDOS · facturaron entre los dos cortes ══════════')
if not desmentidos:
    print(u'  ninguno.')
else:
    print(u'  %d cliente(s) marcados de baja que SI facturaron.' % len(desmentidos))
    print(u'  Una cuenta dada de baja no factura: estas bajas son FALSAS.\n')
    print(u'  %-34s %>12s %8s %14s %s'.replace(u'%>12s', u'%12s')
          % (u'cliente', u'facturo', u'facturas', u'perdida decl.', u'clasif'))
    tot = 0.0
    for k, v, da, df in sorted(desmentidos, key=lambda x: -x[2]):
        tot += v['perdida']
        print(u'  %-34s %12s %+8.0f %14s %s'
              % (k[:34], u'{:,.2f}'.format(da), df,
                 u'{:,.2f}'.format(v['perdida']),
                 u'/'.join(sorted(str(x) for x in v['clasif'] if x))))
    print(u'\n  $%s de perdida declarada que hay que REVERTIR.' % u'{:,.2f}'.format(tot))

print(u'\n  ══ SIN MOVIMIENTO · no se puede decir nada ════════════════')
print(u'  %d cliente(s). Su acumulado no cambio, lo que NO prueba que esten'
      % len(sin_cambio))
print(u'  muertos: dos cortes de pocos dias no cubren un ciclo de facturacion.')
print(u'  Siguen `sin_verificar`, que es la respuesta honesta.')
mayores = sorted(sin_cambio, key=lambda x: -x[1]['perdida'])[:10]
if mayores:
    print(u'\n  los 10 de mayor perdida declarada:')
    for k, v in mayores:
        print(u'    %-36s %14s  (%d linea(s))'
              % (k[:36], u'{:,.2f}'.format(v['perdida']), v['n']))

if retro:
    print(u'\n  ══ ACUMULADO A LA BAJA · %d ═══════════════════════════════' % len(retro))
    print(u'  El export reexpreso estas lineas hacia atras. No es un desmentido')
    print(u'  ni una confirmacion: es un cambio de la fuente que hay que mirar.')
    for k, v, da, df in sorted(retro, key=lambda x: x[2])[:10]:
        print(u'    %-36s %14s' % (k[:36], u'{:,.2f}'.format(da)))

if sin_par:
    print(u'\n  ══ SIN PAREJA EN EL CORTE VIEJO · %d ══════════════════════' % len(sin_par))
    print(u'  Son nuevas en el corte vigente: no hay contra que compararlas.')
    for k in sorted(sin_par)[:10]:
        print(u'    %s' % k)

# La tabla tiene que CERRAR: cada cliente `sin_verificar` cae en una y solo una
# de las cuatro canastas. [[feedback-tablas-deben-cerrar]]
assert len(desmentidos) + len(sin_cambio) + len(retro) + len(sin_par) == len(sinver), \
    u'el reparto no agota los `sin_verificar`'
print(u'\n  %d = %d desmentidos + %d sin cambio + %d a la baja + %d sin pareja'
      % (len(sinver), len(desmentidos), len(sin_cambio), len(retro), len(sin_par)))
sys.exit(0)
