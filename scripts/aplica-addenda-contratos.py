# -*- coding: utf-8 -*-
u"""APLICA `data/contratos-addenda.json` SOBRE `data/contratos.json`.

   ── EL PROBLEMA QUE RESUELVE ──────────────────────────────────────────────
   `data/contratos.json` se GENERA desde el export de la hoja de Direccion.
   Un contrato que nos llega por correo —un convenio firmado, un addendum—
   existe de verdad semanas antes de que la hoja lo traiga. Escribirlo a mano
   en el JSON generado parece funcionar y es una trampa: la siguiente corrida
   de `gen-contratos.py` lo borra, sin error y sin aviso. Es la misma clase de
   fallo que «lo desplegue» contra «lo estan viendo».
   [[incidente-atlas-oscuro]] · [[feedback-verificar-antes-asegurar]]

   Asi que el dato vive en una capa aparte y se vuelve a aplicar al final de
   cada carga de la hoja.

   ── POR QUE LA CAPA NO PUEDE TRAER CAMPOS DERIVADOS ───────────────────────
   `estado`, `plazoLibre`, `finMedible` y `sinVencimiento` NO se teclean: los
   calcula este script con las funciones del PROPIO generador. Si se pudieran
   escribir a mano, la capa podria afirmar «firmado» de un estatus que
   `estado_firma()` clasifica distinto, y el modulo contaria dos cosas de la
   misma fila. Un espejo tecleado a mano deja de ser espejo.

   ── POR QUE SABE RETIRARSE ────────────────────────────────────────────────
   Cuando la hoja se pone al dia trae la fila por su cuenta. Si esta capa
   siguiera anadiendola, el modulo publicaria el contrato DOS veces y las
   cajas de vencimiento sumarian de mas. Asi que antes de anadir busca la
   fila en la hoja por (cuenta, inicio, contenido): si ya esta, no la toca y
   GRITA que la entrada se puede borrar.

   Es idempotente: correrlo dos veces deja el archivo igual.

   USO
       python -I scripts/aplica-addenda-contratos.py
       python -I scripts/aplica-addenda-contratos.py --dry-run
"""
import importlib.util
import io
import json
import os
import sys

# OJO: aqui NO se envuelve `sys.stdout` en un TextIOWrapper nuevo, como hacen
# los demas guiones. Importar el generador crea el SUYO al cargar, el mio se
# queda sin referencias, el recolector lo cierra y al cerrarse CIERRA el buffer
# de debajo — el del generador escribe entonces sobre un archivo cerrado y el
# script muere con «I/O operation on closed file» antes de la primera linea.
# `reconfigure` cambia el que ya hay en vez de apilar otro.
sys.stdout.reconfigure(encoding='utf-8', line_buffering=True)
#: El envoltorio que crea el generador al importarlo, para que no se recoja.
_ENVOLTORIOS = []
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RUTA_DATOS = os.path.join(RAIZ, 'data', 'contratos.json')
RUTA_CAPA = os.path.join(RAIZ, 'data', 'contratos-addenda.json')

#: Lo unico que un humano puede escribir en la capa: lo que leyo en el papel.
CRUDOS = ('cuenta', 'cid', 'vendedor', 'solicitud', 'estatusHoja', 'plazo',
          'inicio', 'fin', 'contenido', 'solicitante', 'firmante',
          'emailFirmante', 'gdoc', 'firma', 'nota')

#: Lo que NADIE escribe a mano. Si aparece en la capa, el archivo se rechaza.
DERIVADOS = ('estado', 'plazoLibre', 'finMedible', 'sinVencimiento',
             'vigencia', 'colorHoja', 'origenLocal')


def generador():
    u"""Las funciones del generador, para no tener un segundo criterio."""
    ruta = os.path.join(RAIZ, 'scripts', 'gen-contratos.py')
    spec = importlib.util.spec_from_file_location('gen_contratos', ruta)
    mod = importlib.util.module_from_spec(spec)
    antes = sys.stdout
    spec.loader.exec_module(mod)          # tiene guarda `__main__`: no corre main()
    _ENVOLTORIOS.append(sys.stdout)       # el que creo el generador: que viva
    sys.stdout = antes
    return mod


def clave(fila):
    u"""Que hace UNICA a una fila de contrato. Un mismo cliente tiene varias."""
    return ((fila.get('cuenta') or '').strip().lower(),
            fila.get('inicio'),
            (fila.get('contenido') or '').strip().lower())


def construye(entrada, gen):
    u"""La fila completa, con los derivados calculados por el generador."""
    cruda = entrada['fila']

    sobrantes = [k for k in cruda if k not in CRUDOS]
    if sobrantes:
        prohibidos = [k for k in sobrantes if k in DERIVADOS]
        raise SystemExit(
            u'  *** la capa trae campos que NO se escriben a mano: %s\n'
            u'      los derivados los calcula este script con las funciones del\n'
            u'      generador, justo para que no puedan discrepar. Quitalos.'
            % (prohibidos or sobrantes))

    plazo = (cruda.get('plazo') or '').strip()
    fin = gen.fecha(cruda.get('fin') or '')
    libre = plazo.lower() == 'libre'

    fila = {
        'cuenta':      (cruda.get('cuenta') or '').strip(),
        'cid':         (cruda.get('cid') or None),
        'vendedor':    cruda.get('vendedor') or None,
        'solicitud':   gen.fecha(cruda.get('solicitud') or ''),
        'estatusHoja': cruda.get('estatusHoja') or None,
        'estado':      gen.estado_firma(cruda.get('estatusHoja') or ''),
        'plazo':       plazo or None,
        'plazoLibre':  libre,
        'inicio':      gen.fecha(cruda.get('inicio') or ''),
        'fin':         fin,
        'finMedible':  bool(fin),
        'sinVencimiento': libre and not fin,
        # La hoja calcula `vigencia` en una columna propia y la pantalla NO la
        # usa (recalcula los dias contra la hora de Mexico). Teclear aqui un
        # numero seria un espejo falso de un calculo ajeno: va vacio.
        'vigencia':    None,
        'contenido':   cruda.get('contenido') or None,
        'solicitante': cruda.get('solicitante') or None,
        'firmante':    cruda.get('firmante') or None,
        'emailFirmante': cruda.get('emailFirmante') or None,
        'gdoc':        cruda.get('gdoc') or None,
        'firma':       cruda.get('firma') or None,
        'nota':        cruda.get('nota') or None,
        # No hay celda en la hoja, asi que no hay color. Vacio, no negro.
        'colorHoja':   None,
        # La procedencia viaja CON la fila: la API la reparte con `...c` y la
        # pantalla la pinta. Una fila que no viene de la hoja y se ve igual que
        # las 60 que si vienen es una mentira de procedencia.
        'origenLocal': entrada['origenLocal'],
    }

    if not fila['cuenta']:
        raise SystemExit(u'  *** una entrada de la capa no trae cuenta.')
    if not fila['inicio'] and not fila['fin']:
        print(u'  AVISO  «%s / %s» no trae ni inicio ni fin: cae en NO MEDIBLE.'
              % (fila['cuenta'], fila['contenido']))
    # Una fecha escrita en un formato que `fecha()` no entiende se vuelve None
    # en silencio, y el contrato pasa a «no se sabe» pareciendo un hueco de
    # captura. Si habia texto y no salio fecha, se grita.
    for campo in ('inicio', 'fin', 'solicitud'):
        if (cruda.get(campo) or '').strip() and not fila[campo]:
            raise SystemExit(
                u'  *** «%s» de %s no se pudo leer como fecha: %r\n'
                u'      el formato es el de la hoja, p. ej. «1-nov-2026».'
                % (campo, fila['cuenta'], cruda.get(campo)))
    return fila


def rearma_meta(meta, filas):
    u"""La meta la recalculan las MISMAS cuentas del generador."""
    por = {}
    for c in filas:
        por[c['estado']] = por.get(c['estado'], 0) + 1
    m = dict(meta)
    m['total'] = len(filas)
    m['porEstado'] = por
    m['conFin'] = sum(1 for c in filas if c['finMedible'])
    m['sinVencimiento'] = sum(1 for c in filas if c['sinVencimiento'])
    m['noMedibles'] = sum(1 for c in filas
                          if not c['finMedible'] and not c['sinVencimiento'])
    m['conCid'] = sum(1 for c in filas if c['cid'])
    return m


def aplica(filas, addenda, gen, callado=False):
    u"""Mete la capa en `filas`, EN SITIO. Devuelve (anadidas, al dia, retiradas).

       La hoja manda: si una entrada ya esta en la hoja NO se anade, se avisa
       de que se puede borrar. Y si ya la puso esta capa, se reemplaza — por
       eso correrlo dos veces deja el archivo igual.
    """
    def di(txt):
        if not callado:
            print(txt)

    de_la_hoja = {clave(f): f for f in filas if not f.get('origenLocal')}
    anadidas, al_dia, retiradas = 0, 0, []

    for entrada in addenda:
        fila = construye(entrada, gen)
        k = clave(fila)
        etiqueta = u'%s / %s' % (fila['cuenta'], fila['contenido'])

        if k in de_la_hoja:
            retiradas.append(etiqueta)
            di(u'  YA ESTA EN LA HOJA  %s' % etiqueta)
            di(u'      la hoja ya trae esta fila, asi que NO se anade: duplicarla')
            di(u'      inflaria las cajas de vencimiento. Borra esta entrada de')
            di(u'      data/contratos-addenda.json.')
            continue

        previa = next((i for i, f in enumerate(filas)
                       if f.get('origenLocal') and clave(f) == k), None)
        if previa is None:
            filas.append(fila)
            anadidas += 1
            di(u'  ANADIDA  %s' % etiqueta)
        else:
            filas[previa] = fila
            al_dia += 1
            di(u'  AL DIA   %s' % etiqueta)
        di(u'      %s → %s · %s · %s'
           % (fila['inicio'] or u'sin inicio', fila['fin'] or u'sin fin',
              fila['plazo'], fila['estado']))
        di(u'      procedencia: %s' % fila['origenLocal'])
        for hueco in entrada.get('noVieneEnElDocumento', []):
            di(u'      vacio a proposito: %s' % hueco)

    return anadidas, al_dia, retiradas


def autoprueba(gen):
    u"""LAS DOS DIRECCIONES. Un mecanismo probado solo con lo que debe pasar no
       esta probado: lo que importa es que RECHACE lo que no debe entrar.
       [[feedback-probar-al-reves]]
    """
    print(u'\n  AUTOPRUEBA')
    print(u'  ' + u'=' * 68)
    fallos, hechas = [], []

    def exige(ok, que, detalle=u''):
        hechas.append(que)
        print(u'  %s  %s%s' % (u'ok  ' if ok else u'FALLA', que,
                               (u'\n          ' + detalle) if detalle else u''))
        if not ok:
            fallos.append(que)

    ENTRADA = {
        'origenLocal': 'documento de prueba',
        'fila': {'cuenta': 'Cuenta Prueba', 'cid': '999999',
                 'estatusHoja': 'firmado digitalmente', 'plazo': '24 meses',
                 'inicio': '1-nov-2026', 'fin': '31-oct-2028',
                 'contenido': 'Addendum de prueba'},
    }

    # 1 · entra cuando la hoja no lo trae
    filas = []
    a, d, r = aplica(filas, [ENTRADA], gen, callado=True)
    exige((a, d, len(r)) == (1, 0, 0) and len(filas) == 1,
          u'una entrada que la hoja no trae se anade', u'%s' % ((a, d, r),))
    exige(filas and filas[0]['estado'] == 'firmado',
          u'el estado lo CALCULA el generador, no la capa')
    exige(filas and filas[0]['fin'] == '2028-10-31' and filas[0]['vigencia'] is None,
          u'la fecha la convierte el generador y `vigencia` queda vacia')

    # 2 · idempotente: correrlo otra vez no duplica
    a, d, r = aplica(filas, [ENTRADA], gen, callado=True)
    exige((a, d) == (0, 1) and len(filas) == 1,
          u'correrlo dos veces reemplaza, NO duplica', u'quedaron %d' % len(filas))

    # 3 · CONTROL NEGATIVO: la hoja se pone al dia y la capa se retira
    hoja = [{'cuenta': 'Cuenta Prueba', 'inicio': '2026-11-01',
             'contenido': 'Addendum de prueba', 'estado': 'firmado',
             'cid': '999999', 'finMedible': True, 'sinVencimiento': False}]
    a, d, r = aplica(hoja, [ENTRADA], gen, callado=True)
    exige((a, d, len(r)) == (0, 0, 1) and len(hoja) == 1,
          u'si la HOJA ya trae la fila, la capa NO la anade otra vez',
          u'quedaron %d fila(s) — duplicaria el contrato' % len(hoja))

    # 4 · CONTROL NEGATIVO: un campo derivado tecleado a mano se rechaza
    sucia = {'origenLocal': 'x', 'fila': dict(ENTRADA['fila'], estado='firmado')}
    try:
        aplica([], [sucia], gen, callado=True)
        exige(False, u'un `estado` tecleado a mano se rechaza',
              u'lo acepto: la capa podria discrepar del generador')
    except SystemExit:
        exige(True, u'un `estado` tecleado a mano se rechaza')

    # 5 · CONTROL NEGATIVO: una fecha ilegible NO se vuelve `null` en silencio
    mala = {'origenLocal': 'x', 'fila': dict(ENTRADA['fila'], fin='2028-10-31')}
    try:
        aplica([], [mala], gen, callado=True)
        exige(False, u'una fecha en formato ajeno se rechaza',
              u'la acepto como vacia: el contrato pasaria a «no se sabe»')
    except SystemExit:
        exige(True, u'una fecha en formato ajeno se rechaza')

    print(u'  ' + u'=' * 68)
    if fallos:
        print(u'  *** LA AUTOPRUEBA FALLA: %s' % u' · '.join(fallos))
        return 1
    print(u'  Las %d comprobaciones pasan, las TRES negativas incluidas.' % len(hechas))
    return 0


def main():
    seco = '--dry-run' in sys.argv
    for r in (RUTA_DATOS, RUTA_CAPA):
        if not os.path.exists(r):
            print(u'  *** no existe %s' % r)
            return 2

    datos = json.load(io.open(RUTA_DATOS, encoding='utf-8'))
    capa = json.load(io.open(RUTA_CAPA, encoding='utf-8'))
    gen = generador()
    filas = datos['contratos']

    if '--autoprueba' in sys.argv:
        return autoprueba(gen)

    print(u'\n  CONTRATOS — capa local sobre la hoja')
    print(u'  ' + u'=' * 68)
    print(u'  hoja: %d fila(s) · origen %s · generado %s'
          % (len(filas), datos['meta'].get('origen'),
             datos['meta'].get('generado', '')[:16]))
    print(u'  capa: %d entrada(s)\n' % len(capa['addenda']))

    anadidas, reemplazadas, retiradas = aplica(filas, capa['addenda'], gen)

    # ── Las promesas del modulo, antes de escribir ─────────────────────────
    meta = rearma_meta(datos['meta'], filas)
    assert sum(meta['porEstado'].values()) == len(filas), \
        'los estados no agotan los contratos'
    assert meta['conFin'] + meta['sinVencimiento'] + meta['noMedibles'] == len(filas), \
        'las tres clases de vencimiento no agotan los contratos'
    assert len({id(f) for f in filas}) == len(filas), 'fila repetida por referencia'

    # El duplicado que ESTA capa podria causar, y solo ese: la hoja de
    # Direccion es suya y puede traer dos filas que compartan clave —dos sin
    # fecha ni contenido, por ejemplo—. Fallar por eso seria culpar a este
    # script de un dato ajeno; lo que aqui no se perdona es publicar dos veces
    # el mismo contrato por haberlo anadido nosotros.
    locales = [f for f in filas if f.get('origenLocal')]
    for f in locales:
        n = sum(1 for g in filas if clave(g) == clave(f))
        assert n == 1, (u'la capa duplica «%s / %s»: aparece %d veces'
                        % (f['cuenta'], f['contenido'], n))
    print(u'\n  ' + u'-' * 68)
    print(u'  %d anadida(s) · %d actualizada(s) · %d ya en la hoja'
          % (anadidas, reemplazadas, len(retiradas)))
    print(u'  total %d contrato(s), de los cuales %d NO vienen de la hoja:'
          % (len(filas), len(locales)))
    for f in locales:
        print(u'      %s / %s — %s' % (f['cuenta'], f['contenido'], f['origenLocal']))
    print(u'  por estado: ' + u' · '.join(
        u'%s %d' % (k, meta['porEstado'][k]) for k in sorted(meta['porEstado'])))
    print(u'  con fin %d · libre %d · NO MEDIBLE %d'
          % (meta['conFin'], meta['sinVencimiento'], meta['noMedibles']))

    if seco:
        print(u'\n  --dry-run: NO se escribio nada.')
        return 0

    io.open(RUTA_DATOS, 'w', encoding='utf-8', newline='\n').write(
        json.dumps({'meta': meta, 'contratos': filas},
                   ensure_ascii=False, indent=1) + '\n')
    print(u'\n  escrito %s' % RUTA_DATOS)
    print(u'  ahora: python -I scripts/verifica-contratos.py')
    return 0


if __name__ == '__main__':
    sys.exit(main())
