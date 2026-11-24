# -*- coding: utf-8 -*-
u"""GENERA `app/churn/cuenta-data.ts` DESDE EL INFORME «GRC por clasificación».

   QUÉ ES LA FUENTE
   ----------------
   Un HTML autocontenido —«Gross Revenue Churn por clasificación de cuenta ·
   Ene–Oct 2026»— que lleva TODO su dataset en un `const D = {…}` de unos 226 KB.
   Sale de `GRC_Segmentado.xlsx` (1,644 movimientos de pérdida) cruzado con la
   tabla «Gross Revenue Churn – 2026 confirmado».

   El HTML no se publica ni se enlaza: lo que vale es el dataset, y el dataset
   entra al repo para que el módulo se pueda regenerar sin depender de un
   archivo del escritorio de nadie. [[unidad-trabajo-d]]

   LAS DOS COSAS QUE ESTE GUIÓN HACE Y EL HTML NO
   ----------------------------------------------
   1. **PARTE EL AÑO POR EL MES VIVO.** Los totales por cuenta del HTML (`ch`,
      `dg`, `l`) van de ENERO A NOVIEMBRE. El periodo CERRADO es ene–oct, y
      noviembre es mes en tránsito —el propio informe lo dice y se niega a
      concluir sobre él—. Aquí cada cuenta sale con `lOct` y `lNov` separados,
      reconstruidos desde su lista de eventos. Sin esa partición, cualquier
      tarjeta del módulo sumaría $749,842 de un mes que todavía se mueve.
      [[regla-churn-mes-vencido]]
   2. **CRUZA CON LA CARTERA CS.** El informe trae 1,373 cuentas y no sabe
      cuáles son nuestras. Cruzando por nombre normalizado contra las filas
      `enCartera` de `data/grc-zoho.json` se les pega consecutivo, asesor y CID.
      Ése es el único trozo del módulo que un asesor puede accionar.

   USO
       python -I scripts/gen-churn-cuenta.py [ruta/al/informe.html]

   Sin argumento usa `data/grc-por-clasificacion-2026.html`, que es la copia
   que vive en el repo.
"""
import io
import json
import os
import re
import sys
import unicodedata

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8',
                              line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FUENTE_REPO = os.path.join(RAIZ, 'data', 'grc-por-clasificacion-2026.html')
SALIDA = os.path.join(RAIZ, 'app', 'churn', 'cuenta-data.ts')

# El periodo CERRADO llega hasta octubre. Los meses del dataset van 1..11 y el
# evento guarda su mes en `ev[0]`, así que el corte es `<= 10`.
MES_CERRADO = 10


def norm(s):
    s = unicodedata.normalize('NFKD', str(s or ''))
    s = u''.join(c for c in s if not unicodedata.combining(c))
    return re.sub(r'[^a-z0-9]+', '', s.lower())


def js_a_json(txt):
    u"""Convierte un literal JS del informe (comillas simples, claves sin
       comillas) en JSON.

       NO es un parser de JavaScript: sirve porque los cuatro bloques de prosa
       del informe no llevan ni una barra invertida, ni una comilla doble, ni
       un acento grave —se comprobó—, así que toda comilla simple es un
       delimitador. `extrae_literal()` vuelve a comprobarlo en cada corte:
       si el informe cambia y mete un escape, revienta ahí en vez de entregar
       un texto cortado a la mitad. [[feedback-verificar-antes-asegurar]]
    """
    out = []
    previo = u''          # último carácter emitido que no es espacio
    i = 0
    n = len(txt)
    while i < n:
        c = txt[i]
        if c == u"'":
            j = txt.index(u"'", i + 1)
            out.append(json.dumps(txt[i + 1:j], ensure_ascii=False))
            previo = u'"'
            i = j + 1
            continue
        # Una clave sólo puede abrir objeto o venir tras una coma.
        m = re.match(r'([A-Za-z_$][\w$]*)\s*:', txt[i:])
        if m and previo in (u'{', u','):
            out.append(u'"%s":' % m.group(1))
            previo = u':'
            i += m.end()
            continue
        out.append(c)
        if not c.isspace():
            previo = c
        i += 1
    return json.loads(u''.join(out))


RX_TAG = re.compile(r'<[^>]+>')


def extrae_literal(html, nombre):
    u"""Saca `const <nombre> = …;` del informe y lo devuelve ya en JSON."""
    m = re.search(r'^\s*const %s\s*=\s*([\[{].*?[\]}])\s*;\s*$' % nombre,
                  html, re.M | re.S)
    if not m:
        raise SystemExit(u'  *** no se encontro el bloque `%s` del informe'
                         % nombre)
    crudo = m.group(1)
    for mal, qué in ((u'\\', u'barra invertida'), (u'"', u'comilla doble'),
                     (u'`', u'acento grave')):
        if mal in crudo:
            raise SystemExit(
                u'  *** el bloque `%s` trae %s: el lector de literales de este '
                u'guion ya no sirve y hay que escribir uno de verdad.'
                % (nombre, qué))
    return js_a_json(crudo)


def sin_tags(s):
    u"""La prosa del informe lleva `<b>…</b>`. El módulo la pinta como texto.

       Y el rótulo «Lectura:» se quita del texto porque la pantalla ya lo pone
       como etiqueta: dejarlo da «Lectura del informe · Lectura: …».
    """
    t = RX_TAG.sub(u'', s).strip()
    return re.sub(r'^Lectura:\s*', u'', t).strip()


def pesos(x):
    return u'$' + format(x, ',.2f')


def main():
    ruta = sys.argv[1] if len(sys.argv) > 1 else FUENTE_REPO
    if not os.path.exists(ruta):
        print(u'  *** no existe %s' % ruta)
        return 2
    html = io.open(ruta, encoding='utf-8').read()

    m = re.search(r'^const D = (\{.*\});\s*$', html, re.M)
    if not m:
        print(u'  *** no se encontro el `const D = {...}` del informe')
        return 1
    D = json.loads(m.group(1))

    # Si la fuente vino de fuera, se copia al repo para que esto sea
    # reproducible mañana. Mover es borrar: se copia, no se mueve.
    if os.path.abspath(ruta) != os.path.abspath(FUENTE_REPO):
        with io.open(FUENTE_REPO, 'w', encoding='utf-8', newline='') as f:
            f.write(html)
        print(u'  fuente copiada al repo: data/grc-por-clasificacion-2026.html')

    MESES = D['months']
    CLASES = D['classes']
    CELL = D['cell']

    # ── cartera CS, del GRC ────────────────────────────────────────────────
    G = json.load(io.open(os.path.join(RAIZ, 'data', 'grc-zoho.json'),
                          encoding='utf-8'))
    cartera = {}
    for f in G['filas']:
        if f.get('enCartera'):
            cartera.setdefault(norm(f.get('cliente')), f)
    print(u'  cartera CS en el GRC: %d nombres' % len(cartera))

    # ── cuentas ────────────────────────────────────────────────────────────
    cuentas = []
    n_cart = 0
    for r in D['acc']:
        ev = [[int(e[0]), e[1], round(float(e[2]), 2)] for e in (r.get('ev') or [])]
        l_oct = round(sum(e[2] for e in ev if e[0] <= MES_CERRADO), 2)
        l_nov = round(sum(e[2] for e in ev if e[0] > MES_CERRADO), 2)
        c = {
            'n':    r['n'],
            'cl':   r.get('cl') or r.get('c') or u'—',
            'ten':  int(r.get('ten') or 0),
            'mrr':  round(float(r.get('mrr') or 0), 2),
            'ch':   round(float(r.get('ch') or 0), 2),
            'dg':   round(float(r.get('dg') or 0), 2),
            'fr':   round(float(r.get('fr') or 0), 2),
            'lOct': l_oct,
            'lNov': l_nov,
            'ev':   ev,
            'dgch': bool(r.get('dgch')),
            'ch2':  bool(r.get('ch2')),
        }
        f = cartera.get(norm(r['n']))
        if f:
            n_cart += 1
            c['cons'] = f.get('consecutivo') or None
            c['asesor'] = f.get('asesor') or None
            c['cid'] = f.get('cid')
        cuentas.append(c)

    cuentas.sort(key=lambda c: -c['lOct'])
    print(u'  cuentas del informe: %d · en cartera CS: %d' % (len(cuentas), n_cart))

    # ── agregados del periodo CERRADO ──────────────────────────────────────
    mrr_ini = D['mrrIni']
    ch_oct = sum(sum(CELL[c]['ch'][:MES_CERRADO]) for c in CLASES)
    dg_oct = sum(sum(CELL[c]['dg'][:MES_CERRADO]) for c in CLASES)
    fr_oct = sum(sum(CELL[c]['fr'][:MES_CERRADO]) for c in CLASES)
    base = sum(mrr_ini[:MES_CERRADO])

    # LA TASA MENSUAL SE CALCULA, NO SE COPIA. Y de ella salen las TRES
    # lecturas del acumulado, que es el corazón de este módulo:
    #   · suma aritmética  → el «24.7%» que publica la tabla de origen
    #   · GRC ponderado    → Σ pérdidas ÷ Σ bases
    #   · retención compuesta → 1 − Π(1 − tasa)
    # Publicar sólo la primera es lo que hace leer «perdimos un cuarto de la
    # cartera». [[feedback-metricas-derivadas-origen]]
    tasas = []
    for i in range(len(MESES)):
        perd = sum(CELL[c]['ch'][i] + CELL[c]['dg'][i] for c in CLASES)
        tasas.append(round(perd / mrr_ini[i] * 100, 4))
    suma_arit = round(sum(tasas[:MES_CERRADO]), 2)
    ponderado = round((ch_oct + dg_oct) / base * 100, 4)
    comp = 1.0
    for t in tasas[:MES_CERRADO]:
        comp *= (1 - t / 100)
    compuesta = round((1 - comp) * 100, 2)

    nov_perd = round(sum(CELL[c]['ch'][MES_CERRADO] + CELL[c]['dg'][MES_CERRADO]
                         for c in CLASES), 2)

    # ── la prosa del informe ───────────────────────────────────────────────
    # El informe no es sólo el dataset: trae las lecturas de cada gráfica, los
    # ocho hallazgos con su «sin confirmar», la tabla de decisión y el plan a
    # 30/60/90. Reteclear eso a mano es lo que convierte un espejo en una
    # versión. Se extrae. [[feedback-verificar-antes-asegurar]]
    read = extrae_literal(html, 'READ')
    lectura = dict((k, sin_tags(v)) for k, v in read.items())

    hall = extrae_literal(html, 'F')
    n_hall = sum(len(g['items']) for g in hall)
    # Misma clase que el «Lectura:» de arriba: algunos campos repiten dentro
    # del texto el rótulo que la pantalla ya pinta como etiqueta, y queda
    # «SIN CONFIRMAR · Sin confirmar: …». Se barre la clase entera, no el
    # caso que se vio. [[feedback-proactividad-jose-manuel]]
    RX_ROTULO = re.compile(
        u'^(sin confirmar|qu[eé] ocurri[oó]|d[oó]nde y cu[aá]ndo|magnitud'
        u'|patr[oó]n|decisi[oó]n)\\s*:\\s*', re.I)
    n_rotulos = 0
    for g in hall:
        for it in g['items']:
            for k in ('q', 'd', 'm', 'p', 'u', 'a'):
                nuevo = RX_ROTULO.sub(u'', it[k]).strip()
                if nuevo != it[k]:
                    n_rotulos += 1
                    it[k] = nuevo

    deci = extrae_literal(html, 'rowsD')
    COLS_D = ['hallazgo', 'evidencia', 'implicacion', 'accion', 'area',
              'prioridad', 'indicador']
    decision = []
    for fila in deci:
        if len(fila) != len(COLS_D):
            raise SystemExit(u'  *** la tabla de decision trae %d columnas y '
                             u'el guion espera %d' % (len(fila), len(COLS_D)))
        decision.append(dict(zip(COLS_D, fila)))

    FASE = {'prev': u'Prevención de cancelaciones',
            'cont': u'Contención de downgrades',
            'rec': u'Recuperación de cuentas',
            'dat': u'Calidad de datos'}
    plan = []
    for ph in extrae_literal(html, 'PLAN'):
        acts = []
        for a in ph['a']:
            if a[0] not in FASE:
                raise SystemExit(u'  *** familia de accion desconocida: %s'
                                 % a[0])
            acts.append({'familia': FASE[a[0]], 'titulo': a[2],
                         'detalle': a[3]})
        plan.append({'plazo': ph['p'], 'lema': ph['s'], 'acciones': acts})

    print(u'  prosa del informe: %d lecturas · %d hallazgos en %d grupos · '
          u'%d filas de decision · %d fases de plan · %d rotulos repetidos '
          u'quitados'
          % (len(lectura), n_hall, len(hall), len(decision), len(plan),
             n_rotulos))

    meta = {
        'fuente': u'GRC_Segmentado.xlsx (1,644 movimientos de pérdida) + tabla '
                  u'«Gross Revenue Churn – 2026 confirmado»',
        'informe': u'Gross Revenue Churn por clasificación de cuenta · Ene–Oct 2026',
        'corte': u'31 de octubre de 2026',
        'periodoCerrado': u'enero – octubre 2026',
        'mesEnTransito': u'Noviembre 2026',
        'meses': MESES,
        'mesesCerrados': MES_CERRADO,
        'clases': CLASES,
        'mrrIni': mrr_ini,
        'cell': CELL,
        'recon': D['recon'],
        'tenure': D['tenure'],
        'tasas': tasas,
        'movimientos': D['rows'],
        'cuentasFuente': D['clients'],
        'cuentasCartera': n_cart,
        'cerrado': {
            'cancelaciones': round(ch_oct, 2),
            'downgrades': round(dg_oct, 2),
            'bruta': round(ch_oct + dg_oct, 2),
            'fraude': round(fr_oct, 2),
            'base': round(base, 2),
            'sumaAritmetica': suma_arit,
            'ponderado': ponderado,
            'compuesta': compuesta,
            'bajas': sum(sum(CELL[c]['nch'][:MES_CERRADO]) for c in CLASES),
            'downgradesN': sum(sum(CELL[c]['ndg'][:MES_CERRADO]) for c in CLASES),
        },
        'transito': {
            'perdida': nov_perd,
            'tasa': tasas[MES_CERRADO],
            'base': mrr_ini[MES_CERRADO],
            'bajas': sum(CELL[c]['nch'][MES_CERRADO] for c in CLASES),
            'downgradesN': sum(CELL[c]['ndg'][MES_CERRADO] for c in CLASES),
        },
        'lectura': lectura,
        'hallazgos': hall,
        'decision': decision,
        'plan': plan,
    }

    print(u'  ene-oct CERRADO: %s brutos · ponderado %.2f%% · suma aritmetica %.2f%%'
          % (pesos(ch_oct + dg_oct), ponderado, suma_arit))
    print(u'  noviembre EN TRANSITO: %s · %.2f%% (NO se suma)'
          % (pesos(nov_perd), tasas[MES_CERRADO]))

    cab = u'''/* ═══════════════════════════════════════════════════════════════════════
   CHURN A NIVEL CUENTA — dataset del informe «GRC por clasificación»
   GENERADO — no editar a mano.
   Regenerar con: python -I scripts/gen-churn-cuenta.py

   Fuente: %s
   Corte: %s · periodo CERRADO %s
   Noviembre 2026 va APARTE: es mes en tránsito y no se suma a nada.

   Cada cuenta trae `lOct` (pérdida del periodo cerrado) y `lNov` (lo que va
   del mes vivo) por separado, reconstruidos desde sus eventos. Los campos
   `ch`/`dg`/`fr` son los totales ENE–NOV del informe y NO son comparables con
   `lOct`: están para no perder lo que la fuente publica.

   `cons`, `asesor` y `cid` NO vienen del informe: son el cruce por nombre
   normalizado contra las filas `enCartera` de data/grc-zoho.json.
   Un cruce por nombre es INDICATIVO: no mueve una cuenta sola.
═══════════════════════════════════════════════════════════════════════ */

export interface CuentaChurn {
  /** Nombre tal como lo publica el informe. */
  n: string
  /** Clasificación registrada en el movimiento (AAA, AA, A, B, C). */
  cl: string
  /** Meses activo al momento de la pérdida. */
  ten: number
  /** MRR inicial de la cuenta según el informe. */
  mrr: number
  /** Cancelación ENE–NOV (total del informe). */
  ch: number
  /** Downgrade ENE–NOV (total del informe). */
  dg: number
  /** Fraude / reestructura — EXCLUIDO del GRC confirmado. */
  fr: number
  /** Pérdida del periodo CERRADO (ene–oct). Es la cifra que se usa. */
  lOct: number
  /** Pérdida de NOVIEMBRE, mes en tránsito. Nunca se suma a lOct. */
  lNov: number
  /** Eventos: [mes 1-12, 'C' cancelación | 'D' downgrade, importe]. */
  ev: Array<[number, string, number]>
  /** Bajó de plan y DESPUÉS canceló. */
  dgch: boolean
  /** Dos bajas en el periodo — posible doble conteo. */
  ch2: boolean
  /** Consecutivo de cartera CS, si la cuenta es nuestra. */
  cons?: string | null
  /** Asesor asignado, si la cuenta es nuestra. */
  asesor?: string | null
  /** CID, si la cuenta es nuestra. El GRC lo guarda como texto. */
  cid?: string | null
}

export const CHURN_CUENTA_META = ''' % (
        meta['fuente'], meta['corte'], meta['periodoCerrado'])

    with io.open(SALIDA, 'w', encoding='utf-8', newline='') as f:
        f.write(cab)
        f.write(json.dumps(meta, ensure_ascii=False, indent=2))
        f.write(u' as const\n\nexport const CUENTAS_CHURN: CuentaChurn[] = ')
        f.write(json.dumps(cuentas, ensure_ascii=False, separators=(',', ':')))
        f.write(u'\n')

    kb = os.path.getsize(SALIDA) / 1024.0
    print(u'  escrito en app/churn/cuenta-data.ts (%.0f KB)' % kb)
    return 0


if __name__ == '__main__':
    sys.exit(main())
