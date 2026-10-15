# -*- coding: utf-8 -*-
u"""QUE DATA DE LA CUENTA NO LLEGA AL MOTOR DE ALERTAS.

   POR QUE EXISTE
   --------------
   Instruccion de direccion, 14 oct 2026: «tu objetivo es que nutras las
   alertas con toda la data que tiene cada cuenta y con la informacion que se
   les alimenta».

   El motor importa SEIS fuentes —contacto, cortes de consumo, facturacion,
   mesa de ayuda, plan de minutos y tickets— y el repositorio tiene al menos
   catorce modulos `lib/*-cuenta.ts`. La auditoria de PROBEMEDIC ya lo dejo
   escrito y vale la pena citarlo porque es el caso que da la medida:

       «El motor de alertas no evalua la atencion telefonica en absoluto.
       `lib/alertas-detectar.ts` ni siquiera importa el archivo de llamadas.
       La atencion telefonica se mide bien y se pinta bien, pero no tiene
       ningun detector que la saque de la ficha. Una cuenta asi solo se
       descubre si alguien la abre, y nadie abre una cuenta que no sale en
       ninguna lista.»

   Esa cuenta lleva nueve meses con cuatro de cada diez llamadas sin llegar a
   una persona y CERO alertas.

   QUE MIDE, Y POR QUE EN ESTE ORDEN
   ---------------------------------
   1. CUANTO VE EL MOTOR. Fuente por fuente: cuantas cuentas vivas tienen dato
      ahi y cuanto MRR institucional hay detras. Una fuente ausente que solo
      cubre tres cuentas no justifica un detector; una que cubre el 60% de la
      cartera y nada la mira, si.

   2. LOS UMBRALES DE ATENCION TELEFONICA, antes de escribir la alarma. Es el
      mismo procedimiento de `mide-alarmas-sac.py`: una alarma que salta en el
      80% de la cartera no es una alarma, es un color de fondo. Se imprime la
      curva completa para elegir con la cifra delante.

   3. QUE TAN LLENO SALDRIA EL EXPEDIENTE. Para cada dato que la alerta
      deberia llevar consigo, en que fraccion de la cartera existe. Un campo
      presente en el 15% nace hueco, y un hueco se rellena con invencion:
      [[feedback-contexto-ia-sin-huecos]] obliga a marcar la ausencia con
      palabras, no a dejarlo en blanco.

   EL MRR ES EL INSTITUCIONAL
   --------------------------
   El de Gross Revenue Facturacion, por instruccion. `cuentas.facturacion`
   guarda `acumulado / meses` —el promedio de vida— y no es MRR: entra como
   `solo_ficha`, separado, y las `sin_dato` nunca se suman como cero.
   Ver [[grc-fuente-zoho]] y [[feedback-cero-sin-medicion]].

   USO
   ---
       python scripts/mide-fuentes-sin-alerta.py
"""
import io
import json
import os
import sys
import urllib.error
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

VIVOS = ('activo', 'en_riesgo')
#: Por debajo de esto no se interpreta atencion telefonica. Es el mismo numero
#: que `VOLUMEN_MINIMO` de lib/llamadas-resumen.ts; si uno cambia, cambian los
#: dos o este medidor deja de medir lo que el tablero ensena.
VOLUMEN_MINIMO = 30


def entorno():
    """Las credenciales salen de .env.local y NO se imprimen nunca."""
    d = {}
    with io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8') as fh:
        for ln in fh:
            ln = ln.strip()
            if not ln or ln.startswith('#') or '=' not in ln:
                continue
            k, v = ln.split('=', 1)
            d[k.strip()] = v.strip().strip('"').strip("'")
    return d


def supabase(tabla, params):
    """Pagina de 1000 en 1000: con `limit` implicito se pierden filas en silencio."""
    E = entorno()
    url = E['NEXT_PUBLIC_SUPABASE_URL'].rstrip('/') + '/rest/v1/' + tabla
    key = E.get('SUPABASE_SERVICE_ROLE_KEY') or E['NEXT_PUBLIC_SUPABASE_ANON_KEY']
    out = []
    desde = 0
    while True:
        q = dict(params)
        q['offset'] = str(desde)
        q['limit'] = '1000'
        pide = urllib.request.Request(
            url + '?' + '&'.join('%s=%s' % (k, v) for k, v in q.items()),
            headers={'apikey': key, 'Authorization': 'Bearer ' + key,
                     'Accept': 'application/json'})
        try:
            crudo = urllib.request.urlopen(pide, timeout=60).read().decode('utf-8')
        except urllib.error.HTTPError as e:
            sys.stderr.write('HTTP %s en %s\n  %s\n'
                             % (e.code, tabla, e.read().decode('utf-8', 'replace')[:400]))
            raise
        lote = json.loads(crudo)
        out.extend(lote)
        if len(lote) < 1000:
            return out
        desde += 1000


def mrr_institucional(f):
    """El MRR de una linea del GRC. Replica lib/facturacion-cuenta.ts.

    `mrrFin` es el recurrente al cierre. Una linea marcada churn trae 0, pero
    si su `verificacion` dice `sigue_viva` —acumulado que siguio creciendo— el
    vigente es `mrrIni`. Un churn confirmado si vale cero: dejo de facturar.
    """
    fin = float(f.get('mrrFin') or 0)
    if fin > 0:
        return fin
    if f.get('verificacion') == 'sigue_viva':
        ini = float(f.get('mrrIni') or 0)
        if ini > 0:
            return ini
    return 0.0


def mapa_grc():
    p = os.path.join(RAIZ, 'data', 'grc-zoho.json')
    J = json.loads(io.open(p, encoding='utf-8').read())
    m = {}
    for f in J.get('filas', []):
        cid = f.get('cid')
        if cid is None:
            continue
        cid = str(cid).strip()
        if cid:
            m[cid] = m.get(cid, 0.0) + mrr_institucional(f)
    return m, (J.get('meta') or {}).get('mesVivo', '?')


def importe(c, grc):
    """(valor, origen). Solo `grc` es institucional; `sin_dato` nunca es 0."""
    cid = c.get('cid')
    cid = None if cid is None else str(cid).strip()
    g = grc.get(cid) if cid else None
    if g and g > 0:
        return g, 'grc'
    propio = float(c.get('facturacion') or 0)
    if propio > 0:
        return propio, 'solo_ficha'
    return 0.0, 'sin_dato'


def json_data(nombre):
    """Un archivo de data/, o None si no esta. Que falte no tumba la medicion:
    se dice que falta, que es informacion distinta de un cero."""
    p = os.path.join(RAIZ, 'data', nombre)
    if not os.path.exists(p):
        return None
    try:
        return json.loads(io.open(p, encoding='utf-8').read())
    except ValueError:
        return None


def contactos_con_nombre(c):
    """Cuantas personas REALES hay en contactos_json.

    No cuenta filas: cuenta personas con nombre. Es el defecto que encontro la
    auditoria de PROBEMEDIC —«`sin_contactos` mide si la lista esta vacia, no
    si tiene a la gente correcta»—, y medir filas lo repetiria aqui.
    """
    v = c.get('contactos_json')
    if not v:
        return 0
    if isinstance(v, str):
        try:
            v = json.loads(v)
        except ValueError:
            return 0
    if isinstance(v, dict):
        v = v.get('contactos') or v.get('items') or []
    if not isinstance(v, list):
        return 0
    n = 0
    for p in v:
        if not isinstance(p, dict):
            continue
        nom = str(p.get('nombre') or p.get('name') or '').strip()
        # Los marcadores de hueco cuentan como ausencia, no como persona.
        if nom and nom.lower() not in ('n/a', 'na', '-', '--', 'sin datos',
                                       'sin dato', 'pendiente', 'ninguno'):
            n += 1
    return n


def barra(n, total, ancho=28):
    if not total:
        return ''
    lleno = int(round(ancho * n / float(total)))
    return u'█' * lleno + u'·' * (ancho - lleno)


#: Las filas que se imprimen, para el assert de cierre del final.
_FILAS = []


def fila(etq, ids, pesos, origen, total_n, total_mrr, nota='', ancho=20):
    u"""Una linea del inventario: cuantas cuentas, que % y CUANTO INSTITUCIONAL.

    EL MRR DE LA FILA SUMA SOLO LAS CUENTAS CON ORIGEN `grc`, y las demas se
    cuentan aparte. La primera version de esta funcion sumaba `pesos` sin
    mirar el origen, y el resultado fue una tabla que no cerraba: la fila de
    llamadas daba $2,093,862 sobre un total institucional de $1,758,279 — un
    subconjunto por encima de su total, que es imposible. Mezclaba el MRR del
    GRC con el `acumulado / meses` de la ficha, que es el promedio de vida y
    no es MRR. [[grc-fuente-zoho]] [[feedback-tablas-deben-cerrar]]

    La contradiccion interna fue el delator, como siempre: no hizo falta otra
    fuente para ver que estaba mal, solo mirar dos cifras del mismo cuadro.
    """
    inst = sum(pesos.get(i, 0.0) for i in ids if origen.get(i) == 'grc')
    n_ficha = sum(1 for i in ids if origen.get(i) == 'solo_ficha')
    n_sin = sum(1 for i in ids if origen.get(i) == 'sin_dato')
    cola = u''
    if n_ficha or n_sin:
        trozos = []
        if n_ficha:
            trozos.append(u'%d solo ficha' % n_ficha)
        if n_sin:
            trozos.append(u'%d sin importe' % n_sin)
        cola = u' [+%s]' % u', '.join(trozos)
    print(u'  %-26s %4d  %5.1f%%  $%12s%-22s %s  %s'
          % (etq, len(ids), 100.0 * len(ids) / total_n if total_n else 0,
             format(int(round(inst)), ',d'), cola,
             barra(len(ids), total_n, ancho), nota))
    _FILAS.append((etq, len(ids), inst))
    # Un lector que apunta a la clave equivocada devuelve un universo correcto
    # con una medicion vacia, y el cero se lee como un dato. Ya paso con
    # `mide-frecuencia-grandes.py`: 0 de 143 cuentas por tomar `Fecha 1er Pago`
    # en lugar de `1er Pago`. Un cero aqui se acusa, no se imprime en silencio.
    if not ids:
        print(u'  %-26s   *** CERO CUENTAS: revisa el lector de esta fuente '
              u'antes de creer el cero ***' % u'')
    return inst


def main():
    grc, mes = mapa_grc()
    cuentas = supabase('cuentas', {
        'select': 'id,cid,consecutivo,empresa,asesor,estado,facturacion,'
                  'ultimo_contacto,observaciones_kam,notas,contactos_json,'
                  'giro,tamano_empresa,servicio,activo_desde'})
    vivas = [c for c in cuentas if c.get('estado') in VIVOS]

    pesos = {}
    origen = {}
    for c in vivas:
        v, o = importe(c, grc)
        pesos[c['id']] = v
        origen[c['id']] = o
    total_n = len(vivas)
    total_mrr = sum(v for i, v in pesos.items() if origen[i] == 'grc')
    n_inst = sum(1 for i in origen if origen[i] == 'grc')
    n_ficha = sum(1 for i in origen if origen[i] == 'solo_ficha')
    n_sin = sum(1 for i in origen if origen[i] == 'sin_dato')

    print(u'')
    print(u'  FUENTES DE CUENTA QUE EL MOTOR DE ALERTAS NO MIRA')
    print(u'  ' + u'=' * 76)
    # LOS TRES GRUPOS CIERRAN y se nombran por separado. El rotulo anterior
    # decia «$1,758,279 sobre 184 de ellas» juntando las 171 con MRR del GRC
    # con las 13 que solo tienen el promedio de vida de la ficha: el total era
    # de unas y el conteo de otras. [[feedback-metricas-derivadas-origen]]
    print(u'  GRC mesVivo=%s · cartera viva: %d cuentas' % (mes, total_n))
    print(u'    %3d con MRR institucional (GRC) ....... $%s'
          % (n_inst, format(int(round(total_mrr)), ',d')))
    print(u'    %3d solo con el promedio de vida de la ficha: NO es MRR, no se suma'
          % n_ficha)
    print(u'    %3d sin importe en ninguna fuente: no se suman como cero' % n_sin)
    assert n_inst + n_ficha + n_sin == total_n, u'la particion de origen no cierra'

    # ── 1. Cuanto ve el motor, fuente por fuente ────────────────────────────
    llam = json_data('analisis-llamadas.json') or {}
    cuentas_llam = (llam.get('cuentas') or {})
    # La clave es `porCid` —un diccionario cid -> lista de numeros—, no `dids`
    # ni `filas`. Buscando esas dos, esta fuente salia en 0 cuentas con 3,717
    # CIDs en el archivo. Se comprobo abriendo el archivo, no suponiendolo.
    dids = json_data('dids.json') or {}
    por_cid_did = {str(k).strip(): len(v or [])
                   for k, v in (dids.get('porCid') or {}).items()}

    adop = supabase('adopcion_producto', {'select': 'cuenta_id,producto,nivel'})
    reun = supabase('reuniones', {'select': 'cuenta_id,fecha,tipo'})
    con_adop = {str(r.get('cuenta_id')) for r in adop if r.get('cuenta_id')}
    con_reun = {str(r.get('cuenta_id')) for r in reun if r.get('cuenta_id')}

    def cid_de(c):
        v = c.get('cid')
        return None if v is None else str(v).strip() or None

    con_llamadas, con_volumen = set(), set()
    for c in vivas:
        k = cid_de(c)
        r = cuentas_llam.get(k) if k else None
        if r and (r.get('ent') or {}).get('total'):
            con_llamadas.add(c['id'])
            if (r['ent']['total'] or 0) >= VOLUMEN_MINIMO:
                con_volumen.add(c['id'])

    print(u'')
    print(u'  (1) LO QUE EXISTE Y EL MOTOR NO ABRE')
    print(u'  %-26s %4s  %6s  %13s' % (u'fuente', u'ctas', u'%', u'MRR inst.'))
    fila(u'llamadas (hay lectura)', con_llamadas, pesos, origen, total_n,
         total_mrr, u'<- NO la importa')
    fila(u'llamadas (>=%d, medible)' % VOLUMEN_MINIMO, con_volumen, pesos,
         origen, total_n, total_mrr, u'<- el universo de la alarma')
    fila(u'adopcion de producto', {i for i in con_adop if i in pesos}, pesos,
         origen, total_n, total_mrr, u'<- la escalera')
    fila(u'reuniones registradas', {i for i in con_reun if i in pesos}, pesos,
         origen, total_n, total_mrr, u'<- relacionamiento')
    fila(u'DIDs (numeros)', {c['id'] for c in vivas
                             if cid_de(c) and cid_de(c) in por_cid_did},
         pesos, origen, total_n, total_mrr, u'<- para que lo usan')

    # ── 2. Los umbrales de atencion telefonica ──────────────────────────────
    print(u'')
    print(u'  (2) ATENCION TELEFONICA — la curva, para elegir el umbral')
    print(u'      Universo: las %d cuentas con >=%d entrantes. Denominador = entrantes;'
          % (len(con_volumen), VOLUMEN_MINIMO))
    print(u'      `Self_service` va del lado ATENDIDO (el menu si resolvio) y')
    print(u'      la perdida saliente NO se suma: marcar y no conectar es normal.')
    medidas = []
    for c in vivas:
        if c['id'] not in con_volumen:
            continue
        r = cuentas_llam[cid_de(c)]
        t = (r['ent'].get('tipos') or {})
        tot = r['ent']['total'] or 0
        perd = t.get('Lost') or 0
        medidas.append((100.0 * perd / tot, c, tot, perd))
    medidas.sort(key=lambda x: -x[0])
    print(u'')
    print(u'      %-12s %4s  %6s  %13s   %s'
          % (u'umbral', u'ctas', u'% viva', u'MRR inst.', u'peor caso'))
    for u_ in (10, 15, 20, 25, 30, 40, 50):
        sel = [m for m in medidas if m[0] >= u_]
        ids = {m[1]['id'] for m in sel}
        mrr = sum(pesos.get(i, 0.0) for i in ids if origen.get(i) == 'grc')
        peor = sel[0] if sel else None
        print(u'      >= %-9s %4d  %5.1f%%  $%12s   %s'
              % (u'%d%%' % u_, len(sel), 100.0 * len(sel) / total_n if total_n else 0,
                 format(int(round(mrr)), ',d'),
                 (u'%s %.0f%% (%d de %d)'
                  % (peor[1]['empresa'][:26], peor[0], peor[3], peor[2])) if peor else u'—'))
    # ── LA SEGUNDA CONDICION: EL VOLUMEN ABSOLUTO ───────────────────────────
    #
    # La tasa sola no basta, y se ve en dos renglones de la lista de abajo:
    # OOAPAS pierde 2,625 llamadas con una tasa del 99.7% y Alianza Multimarca
    # pierde 40,935 con el 55.4%. Si el umbral fuera solo la tasa, una cuenta
    # grande que pierde veinte mil llamadas al 35% no saldria en ninguna lista,
    # y veinte mil personas que no consiguieron hablar con nadie son veinte mil
    # pase lo que pase con el porcentaje.
    #
    # Son dos condiciones porque son dos problemas: la tasa dice que la cuenta
    # atiende mal, el volumen dice cuanta gente se queda sin respuesta.
    print(u'')
    print(u'      Por VOLUMEN perdido, que es otra cosa que la tasa:')
    print(u'      %-12s %4s  %6s  %13s   %s'
          % (u'umbral', u'ctas', u'% viva', u'MRR inst.', u'añade sobre tasa>=40%'))
    base40 = {m[1]['id'] for m in medidas if m[0] >= 40}
    for v in (500, 1000, 2000, 5000, 10000):
        sel = [m for m in medidas if m[3] >= v]
        ids = {m[1]['id'] for m in sel}
        mrr = sum(pesos.get(i, 0.0) for i in ids if origen.get(i) == 'grc')
        nuevas = ids - base40
        print(u'      >= %-9s %4d  %5.1f%%  $%12s   +%d cuentas, $%s'
              % (u'%d' % v, len(sel), 100.0 * len(sel) / total_n if total_n else 0,
                 format(int(round(mrr)), ',d'), len(nuevas),
                 format(int(round(sum(pesos.get(i, 0.0) for i in nuevas
                                      if origen.get(i) == 'grc'))), ',d')))

    print(u'')
    print(u'      Las diez peores, que son las que hay que poder nombrar:')
    for pct, c, tot, perd in medidas[:10]:
        print(u'        %-30s %5.1f%%  %6d de %6d entrantes  $%s/mes%s'
              % (c['empresa'][:30], pct, perd, tot,
                 format(int(round(pesos.get(c['id'], 0))), ',d'),
                 u'' if origen[c['id']] == 'grc' else u' (%s)' % origen[c['id']]))

    # ── 3. Que tan lleno saldria el expediente ──────────────────────────────
    print(u'')
    print(u'  (3) EL EXPEDIENTE QUE LLEVARIA CADA ALERTA')
    print(u'      Un campo presente en el 15%% nace hueco, y un hueco se rellena')
    print(u'      con invencion: hay que marcar la ausencia con palabras.')
    print(u'')
    campos = [
        (u'interlocutor con nombre', lambda c: contactos_con_nombre(c) > 0),
        (u'  ... dos o mas', lambda c: contactos_con_nombre(c) >= 2),
        (u'giro o sector', lambda c: bool(str(c.get('giro') or '').strip())),
        (u'servicio contratado', lambda c: bool(str(c.get('servicio') or '').strip())),
        (u'tamano de empresa', lambda c: bool(str(c.get('tamano_empresa') or '').strip())),
        (u'antiguedad (activo_desde)', lambda c: bool(str(c.get('activo_desde') or '').strip())),
        (u'observaciones del KAM', lambda c: bool(str(c.get('observaciones_kam') or '').strip())),
        (u'notas', lambda c: bool(str(c.get('notas') or '').strip())),
        (u'CID (cruza con fuentes)', lambda c: bool(cid_de(c))),
        (u'MRR institucional', lambda c: origen[c['id']] == 'grc'),
    ]
    print(u'      %-26s %4s  %6s  %13s' % (u'dato', u'ctas', u'%', u'MRR inst.'))
    for etq, hay in campos:
        ids = {c['id'] for c in vivas if hay(c)}
        mrr = sum(pesos.get(i, 0.0) for i in ids if origen.get(i) == 'grc')
        print(u'      %-26s %4d  %5.1f%%  $%12s  %s'
              % (etq, len(ids), 100.0 * len(ids) / total_n if total_n else 0,
                 format(int(round(mrr)), ',d'), barra(len(ids), total_n, 22)))
        _FILAS.append((etq, len(ids), mrr))

    # ── EL CIERRE ───────────────────────────────────────────────────────────
    # Ninguna fila puede llevar mas cuentas ni mas dinero que la cartera: un
    # subconjunto por encima de su total es la contradiccion interna que
    # delato la primera version de este medidor. Se comprueba, no se confia.
    print(u'')
    print(u'  ' + u'=' * 76)
    malas = [(e, n, m) for e, n, m in _FILAS
             if n > total_n or m > total_mrr + 1.0]
    if malas:
        print(u'  *** %d FILA(S) NO CIERRAN contra la cartera (%d cuentas, $%s):'
              % (len(malas), total_n, format(int(round(total_mrr)), ',d')))
        for e, n, m in malas:
            print(u'      %-26s %4d cuentas  $%s' % (e, n, format(int(round(m)), ',d')))
        print(u'  No usar estas cifras: hay una mezcla de origenes o un lector roto.')
        sys.exit(1)
    print(u'  Cierre OK: las %d filas caben en la cartera (%d cuentas, $%s inst.).'
          % (len(_FILAS), total_n, format(int(round(total_mrr)), ',d')))
    print(u'  Leer esto ANTES de escribir un detector o un campo de expediente.')
    print(u'')


if __name__ == '__main__':
    main()
