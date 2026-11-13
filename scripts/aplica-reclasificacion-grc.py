# -*- coding: utf-8 -*-
u"""APLICA `data/grc-reclasificaciones.json` SOBRE `data/grc-zoho.json`.

   ── POR QUE EXISTE ────────────────────────────────────────────────────────
   `clasificacion_cliente` es una columna del export de Zoho, y
   `data/grc-zoho.json` se GENERA desde ese export. Editar el JSON a mano no
   dura: la carga del viernes lo reescribe entero, sin aviso. La decision de
   direccion tiene que vivir en una capa que se vuelva a aplicar sola — el
   mismo patron que `contratos-addenda.json`.

   ── LO QUE NO HACE ────────────────────────────────────────────────────────
   NO da de baja, NO pasa a Dormidas y NO toca `cuentas`. Reclasificar cambia
   el tamano con el que se lee una cuenta, no su vida. Pasar a Dormidas es
   escribir `estado = 'hibernacion'` con `pasa-a-dormidas.mjs`, que es otra
   cosa y lleva su propia autorizacion. [[feedback-conciliacion-churn]]

   ── EL CORTE TIENE QUE SEGUIR CERRANDO ────────────────────────────────────
   Mover una fila de canasta no es cambiar una celda: `porClasif` es un corte
   AGREGADO y si no se recalcula, el detalle dira «A» mientras la tabla de
   arriba sigue contando esa cuenta en AAA. Dos cifras para lo mismo es
   exactamente lo que este repo persigue en todas partes.
   [[feedback-tablas-deben-cerrar]]

   Recalcularlo aqui obliga a reproducir `corta()` del generador, y un espejo
   tecleado a mano deja de ser espejo en cuanto el original cambia. Por eso lo
   PRIMERO que hace este guion es recalcular `porClasif` SOBRE EL ARCHIVO SIN
   TOCAR y exigir que salga identico al que escribio el generador. Si no sale
   identico, no escribe nada: mi aritmetica ya no es la suya y cualquier cosa
   que publicara despues seria un invento con pinta de calculo.
   [[feedback-verificar-antes-asegurar]]

   USO
       python -I scripts/aplica-reclasificacion-grc.py
       python -I scripts/aplica-reclasificacion-grc.py --dry-run
       python -I scripts/aplica-reclasificacion-grc.py --autoprueba

   Devuelve 0 si quedo aplicada, 1 si alguna entrada no se pudo aplicar y 2 si
   el espejo de `corta()` no reproduce al generador.
"""
import collections
import io
import json
import os
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GRC = os.path.join(RAIZ, 'data', 'grc-zoho.json')
CAPA = os.path.join(RAIZ, 'data', 'grc-reclasificaciones.json')

# ── El espejo de `corta()` de gen-grc-zoho.py ────────────────────────────────
# Copiado a proposito, no importado: el generador corre todo en el cuerpo del
# modulo y no se puede importar sin rehacer la carga entera. La copia se
# COMPRUEBA en cada corrida contra el `porClasif` que escribio el original
# (ver `espeja_al_generador`), que es lo unico que la hace fiable.
es_churn = lambda m: m.startswith('Churn confirmado')
es_downgrade = lambda m: m.startswith('Downgrade')
pct = lambda a, b: round(100.0 * a / b, 4) if b else 0.0


def corta_por_clasif(filas):
    u"""Reproduce `corta('clasif')` del generador, con su mismo orden."""
    ag = collections.defaultdict(lambda: collections.defaultdict(float))
    cnt = collections.Counter()
    for f in filas:
        k = f.get('clasif') or '(sin dato)'
        e = ag[k]
        cnt[k] += 1
        e['mrrInicio'] += f['mrrIni']
        e['ganado'] += f['ganado']
        e['acumulado'] += f['acumulado']
        mov = f.get('movimiento') or ''
        if es_downgrade(mov):
            e['downgrade'] += f['perdida']
        elif es_churn(mov):
            e['churn'] += f['perdida']
            e[{'baja': 'churnBaja', 'sigue_viva': 'churnViva',
               'sin_verificar': 'churnSinVerificar'}.get(f.get('verificacion'),
                                                         'churnBaja')] += f['perdida']
    out = []
    for k, e in ag.items():
        per = e['churn'] + e['downgrade']
        out.append({
            'clave': k, 'n': cnt[k],
            'mrrInicio': round(e['mrrInicio'], 2), 'ganado': round(e['ganado'], 2),
            'acumulado': round(e['acumulado'], 2),
            'churn': round(e['churn'], 2), 'downgrade': round(e['downgrade'], 2),
            'perdida': round(per, 2),
            'churnBaja': round(e['churnBaja'], 2), 'churnViva': round(e['churnViva'], 2),
            'churnSinVerificar': round(e['churnSinVerificar'], 2),
            'grc': pct(per, e['mrrInicio']),
            'grcVerificado': pct(e['churnBaja'] + e['downgrade'], e['mrrInicio']),
        })
    out.sort(key=lambda x: -x['perdida'])
    return out


def espeja_al_generador(d):
    u"""True si mi `corta_por_clasif` reproduce el `porClasif` del archivo.

       Esta es la unica prueba de que la copia de arriba sigue siendo una
       copia. Se corre ANTES de tocar nada, sobre el archivo tal como lo
       escribio el generador.
    """
    mio = corta_por_clasif(d['filas'])
    suyo = d.get('porClasif') or []
    if len(mio) != len(suyo):
        print(u'  *** el espejo da %d canastas y el archivo trae %d'
              % (len(mio), len(suyo)))
        return False
    for a, b in zip(mio, suyo):
        for k in a:
            if a[k] != b.get(k):
                print(u'  *** canasta «%s», campo «%s»: el espejo dice %r y el'
                      u' archivo %r' % (a['clave'], k, a[k], b.get(k)))
                return False
    return True


def localiza(filas, e, di=print):
    u"""Las filas del export que son esta cuenta. CID manda, nombre atestigua."""
    cid = str(e.get('cid') or '').strip()
    nom = str(e.get('cliente') or '').strip()
    if cid:
        hall = [f for f in filas if str(f.get('cid') or '') == cid]
        # El nombre no elige la fila: comprueba que el CID siga siendo de quien
        # creemos. Un CID reasignado reclasificaria a otra empresa en silencio.
        malos = [f for f in hall if (f.get('cliente') or '').strip() != nom
                 and not (f.get('agrupada'))]
        if malos:
            di(u'  *** el CID %s ahora es «%s» en el export, no «%s».'
               % (cid, malos[0].get('cliente'), nom))
            di(u'      No se reclasifica: revisa a quien pertenece ese CID.')
            return None
        return hall
    return [f for f in filas if (f.get('cliente') or '').strip() == nom]


def aplica(d, entradas, callado=False):
    u"""Devuelve (aplicadas, retirables, fallos). Modifica `d['filas']`."""
    def di(*a):
        if not callado:
            print(*a)

    aplicadas = retirables = fallos = 0
    for e in entradas:
        etq = u'%s · %s' % (e.get('consecutivo') or u'—', e.get('cliente') or u'?')
        hall = localiza(d['filas'], e, di)
        if hall is None:
            fallos += 1
            continue
        if not hall:
            di(u'  AVISO  %s — no viene en este corte. La entrada se queda:' % etq)
            di(u'         una cuenta que no factura este mes vuelve el que viene.')
            continue
        for f in hall:
            # Si ya se aplico antes, el valor del export esta guardado aparte.
            actual = f.get('clasifExport') or f.get('clasif')
            if actual == e['a']:
                di(u'  RETIRA %s — el export YA dice «%s». Esta entrada sobra:'
                   % (etq, e['a']))
                di(u'         borrala de data/grc-reclasificaciones.json y pasala')
                di(u'         a «_retiradas_porque_el_export_ya_las_trae».')
                f['clasif'] = actual
                f.pop('clasifExport', None)
                retirables += 1
                continue
            if actual != e['de']:
                di(u'  *** %s — la entrada dice que el export trae «%s» y trae'
                   u' «%s».' % (etq, e['de'], actual))
                di(u'      Alguien la movio en Zoho y esa decision no la hemos')
                di(u'      visto. NO se pisa a ciegas: revisa y actualiza `de`.')
                fallos += 1
                continue
            f['clasifExport'] = actual
            f['clasif'] = e['a']
            di(u'  ok     %s — %s → %s  (el export sigue diciendo %s)'
               % (etq, actual, e['a'], actual))
            aplicadas += 1
    return aplicadas, retirables, fallos


def comprueba_corte(antes, despues, movidas):
    u"""El corte agregado tiene que seguir cerrando y sólo moverse donde toca."""
    ok = True
    ia = {x['clave']: x for x in antes}
    idd = {x['clave']: x for x in despues}

    for campo in ('perdida', 'mrrInicio', 'acumulado', 'ganado', 'n'):
        a = sum(x[campo] for x in antes)
        b = sum(x[campo] for x in despues)
        if abs(a - b) > 0.011:
            print(u'  *** el total de «%s» pasó de %.2f a %.2f: la'
                  u' reclasificación creó o perdió dinero.' % (campo, a, b))
            ok = False

    for k in set(ia) | set(idd):
        if k in movidas:
            continue
        if ia.get(k) != idd.get(k):
            print(u'  *** la canasta «%s» cambió y no debía: esta capa sólo'
                  u' mueve %s.' % (k, u' y '.join(sorted(movidas))))
            ok = False
    return ok


# ── Autoprueba ───────────────────────────────────────────────────────────────
# Las tres ramas que importan son las que NO se ven en una corrida buena: el
# tercer valor, la entrada ya cumplida y el CID reasignado. Un comprobador del
# que solo se ha visto el «ok» no esta probado. [[feedback-probar-al-reves]]
def _corte(filas):
    return {'filas': filas, 'porClasif': corta_por_clasif(filas)}


def _fila(cliente, cid, clasif, mrr=1000.0):
    return {'cliente': cliente, 'cid': cid, 'clasif': clasif, 'mrrIni': mrr,
            'ganado': 0.0, 'acumulado': mrr * 10, 'perdida': 0.0,
            'movimiento': 'MRR estable', 'verificacion': 'na', 'agrupada': False}


def autoprueba():
    print(u'\n  AUTOPRUEBA — las ramas que una corrida buena no enseña')
    print(u'  ' + u'─' * 68)
    fallos = 0

    def caso(nombre, filas, entrada, espera):
        nonlocal fallos
        d = _corte([dict(f) for f in filas])
        ap, ret, fal = aplica(d, [entrada], callado=True)
        got = ('aplicada' if ap else 'retirable' if ret else
               'rechazada' if fal else 'sin efecto')
        bien = got == espera
        if not bien:
            fallos += 1
        print(u'    %-46s %s (esperado %s)'
              % (nombre, u'ok' if bien else u'*** FALLA ***  dio ' + got, espera))

    base = [_fila(u'Grupo System ooapas', '167954', 'AAA')]
    ent = {'cid': '167954', 'cliente': u'Grupo System ooapas', 'de': 'AAA', 'a': 'A'}

    caso(u'el export trae el valor declarado', base, ent, 'aplicada')
    caso(u'el export YA trae el destino',
         [_fila(u'Grupo System ooapas', '167954', 'A')], ent, 'retirable')
    caso(u'el export trae un TERCER valor (AA)',
         [_fila(u'Grupo System ooapas', '167954', 'AA')], ent, 'rechazada')
    caso(u'el CID ahora es de otra empresa',
         [_fila(u'Otra Empresa SA', '167954', 'AAA')], ent, 'rechazada')
    caso(u'el CID no viene en este corte',
         [_fila(u'Alguien mas', '99999', 'B')], ent, 'sin efecto')

    # El espejo tiene que saber decir que NO. Se corrompe un dato del corte
    # guardado y se exige que lo detecte.
    d = _corte([_fila(u'X', '1', 'A'), _fila(u'Y', '2', 'B')])
    bien = espeja_al_generador(d)
    d['porClasif'][0]['mrrInicio'] += 0.01
    mal = espeja_al_generador(d)
    print(u'    %-46s %s' % (u'el espejo acepta un corte intacto',
                             u'ok' if bien else u'*** FALLA ***'))
    print(u'    %-46s %s' % (u'el espejo rechaza un corte manipulado',
                             u'ok' if not mal else u'*** FALLA ***'))
    if not bien or mal:
        fallos += 1

    # Y el cierre tiene que saber decir que no: una canasta que no debía
    # moverse, movida.
    a = corta_por_clasif([_fila(u'X', '1', 'A'), _fila(u'Y', '2', 'B')])
    b = [dict(x) for x in a]
    for x in b:
        if x['clave'] == 'B':
            x['mrrInicio'] += 5.0
    cerro = comprueba_corte(a, b, {'A', 'AAA'})
    print(u'    %-46s %s' % (u'el cierre rechaza una canasta ajena movida',
                             u'ok' if not cerro else u'*** FALLA ***'))
    if cerro:
        fallos += 1

    print(u'')
    print(u'  %s' % (u'las %d comprobaciones de la autoprueba pasan' % 8
                     if not fallos else
                     u'*** %d rama(s) de la autoprueba NO funcionan ***' % fallos))
    return 1 if fallos else 0


def main():
    if '--autoprueba' in sys.argv:
        return autoprueba()

    seco = '--dry-run' in sys.argv
    capa = json.load(io.open(CAPA, encoding='utf-8'))
    entradas = capa.get('reclasificaciones') or []
    d = json.load(io.open(GRC, encoding='utf-8'))

    print(u'')
    print(u'  RECLASIFICACIONES DE DIRECCIÓN SOBRE EL GRC')
    print(u'  ' + u'═' * 68)
    print(u'  corte: %s · mes vivo %s · %d filas'
          % ((d.get('meta') or {}).get('origen', u'?'),
             (d.get('meta') or {}).get('mesVivo', u'?'), len(d['filas'])))
    print(u'  capa:  %d entrada(s)' % len(entradas))
    print(u'')

    # 1. ¿Mi aritmética sigue siendo la del generador?
    if not espeja_al_generador(d):
        print(u'')
        print(u'  *** NO ESCRIBO NADA. Mi copia de `corta()` ya no reproduce la')
        print(u'      del generador, así que el corte que publicara después')
        print(u'      sería un número mío disfrazado del suyo. Alinea')
        print(u'      `corta_por_clasif` con `corta()` de gen-grc-zoho.py.')
        return 2
    print(u'  el espejo de corta() reproduce el corte del generador — sigo.')
    print(u'')

    antes = [dict(x) for x in d['porClasif']]
    aplicadas, retirables, fallos = aplica(d, entradas)

    movidas = set()
    for e in entradas:
        movidas.add(e['de'])
        movidas.add(e['a'])

    d['porClasif'] = corta_por_clasif(d['filas'])
    print(u'')
    if not comprueba_corte(antes, d['porClasif'], movidas):
        print(u'')
        print(u'  *** NO ESCRIBO NADA: el corte por clasificación no cierra.')
        return 2

    ia = {x['clave']: x for x in antes}
    print(u'  EL CORTE POR CLASIFICACIÓN, ANTES Y DESPUÉS')
    print(u'  %-8s %8s %8s %16s %16s' % (u'clasif', u'n antes', u'n desp',
                                         u'MRR ini antes', u'MRR ini desp'))
    for x in d['porClasif']:
        a = ia.get(x['clave'])
        marca = u'  ←' if (a is None or a['n'] != x['n']) else u''
        print(u'  %-8s %8s %8d %16s %16s%s'
              % (x['clave'], a['n'] if a else u'—', x['n'],
                 u'{:,.2f}'.format(a['mrrInicio']) if a else u'—',
                 u'{:,.2f}'.format(x['mrrInicio']), marca))

    print(u'')
    print(u'  aplicadas %d · retirables %d · fallos %d'
          % (aplicadas, retirables, fallos))

    if fallos:
        print(u'')
        print(u'  *** NO ESCRIBO NADA: %d entrada(s) no se pudieron aplicar.'
              % fallos)
        return 1

    if seco:
        print(u'\n  --dry-run: no se escribió nada.')
        return 0

    with io.open(GRC, 'w', encoding='utf-8') as fh:
        fh.write(json.dumps(d, ensure_ascii=False, separators=(',', ':')))
    print(u'\n  escrito %s (%.0f KB)' % (GRC, os.path.getsize(GRC) / 1024.0))
    if retirables:
        print(u'  OJO: %d entrada(s) ya las trae el export y se pueden borrar'
              u' de la capa.' % retirables)
    return 0


if __name__ == '__main__':
    sys.exit(main())
