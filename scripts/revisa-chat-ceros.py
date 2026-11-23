# -*- coding: utf-8 -*-
u"""Que ningun cero del modulo Chat sea en realidad una lectura que fallo.

   ── POR QUE EXISTE ──────────────────────────────────────────────────────────
   El 17 nov 2026 el modulo paso de 1,427,007 a 473,416 mensajes entre dos
   cortes. No fue el negocio: fueron 45 de 159 cuentas cuya lectura de Chatwoot
   fallo y que aportaban cero al total sin que nada lo dijera.

   Y debajo habia algo peor: DOCE filas traian un `operational_error`
   registrado con `status = 'usage_alert'`. El generador solo miraba `status`,
   asi que esas cuentas salian como «Sin uso — cero mensajes en el periodo
   completo». Eso convierte «no pudimos leerla» en «el cliente dejo de usarlo»,
   que es un cero fabricado y ademas manda a un asesor a llamar a un cliente
   que puede estar perfectamente. [[feedback-cero-sin-medicion]]

   ── LAS CUATRO PREGUNTAS ────────────────────────────────────────────────────
   Se cruza el LIBRO de origen contra el TypeScript generado:

     1. Ninguna cuenta con lectura rota puede estar rotulada `sin_uso`.
     2. Si tiene un corte anterior con lectura buena, debe llevar su respaldo
        —fecha y mensajes—, porque si no la ficha calla sobre una cuenta de la
        que SI se sabe algo.
     3. El resumen debe declarar sobre cuantas cuentas esta hecho el total.
     4. AL REVES: tiene que seguir habiendo cuentas `sin_uso` legitimas —cero
        medido con lectura buena—, o este guion daria verde con un modulo que
        hubiera dejado de distinguir las dos cosas. [[feedback-probar-al-reves]]

   ── Y LAS CUATRO DEL RESCATE (23 nov 2026) ──────────────────────────────────
   Desde esa fecha, cuando falla la llamada de CUENTA pero las de BANDEJA
   contestan, el modulo publica lo que si se midio EN ESE MISMO PERIODO en vez
   de apuntar al mes anterior.

     5. Toda cuenta rota cuyo detalle de la MISMA corrida traiga trafico lleva
        su rescate. Se comprueba contra el LIBRO, no contra el .ts: comparar el
        modulo consigo mismo no prueba nada.
     6. El rescate NUNCA baja una cifra: `mensajesEfectivos >= mensajes`. Hay
        cuentas que publican un numero CON `operational_error` —Travelling trae
        172 con un HTTP 429—, y un rescate que las empeorara seria peor que no
        rescatar.
     7. `rescateExacto` solo con `measurement_scope = contracted_inboxes`, que
        es donde el detalle ES la medicion (cuadra 33 de 33 en el libro). Un
        piso rotulado como dato es la misma falta que un cero rotulado como
        desuso, solo que al reves.
     8. AL REVES, dos veces: tienen que seguir existiendo cuentas rotas SIN
        rescate —ninguna bandeja contesto— y rescates PISO rotulados como tales.
        Si todo fuera rescate exacto, las tres anteriores darian verde por
        vacuidad. [[feedback-probar-al-reves]]

   Es de SOLO LECTURA. Sale con 1 si alguna falla.

       python -I scripts/revisa-chat-ceros.py
"""
import glob
import io
import json
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SALIDA = os.path.join(RAIZ, 'app', 'callpicker-chat', 'chat-data.ts')
ACERVO = r'D:\Proyectos\CP\CallpickerChat'

fallos = []


def exige(ok, que, detalle=u''):
    print(u'  %s  %s%s' % (u'ok  ' if ok else u'FALLA', que,
                           (u'\n          ' + detalle) if detalle else u''))
    if not ok:
        fallos.append(que)


# ── el TypeScript generado ──────────────────────────────────────────────────
src = io.open(SALIDA, encoding='utf-8').read()


def bloque(nombre, patron):
    m = re.search(patron, src, re.S)
    if not m:
        raise SystemExit('No se encontro %s en %s' % (nombre, SALIDA))
    # El emisor deja comas finales, que son validas en TS y no en JSON.
    return json.loads(re.sub(r',(\s*[}\]])', r'\1', m.group(1)))


clientes = bloque('CHAT_CLIENTES',
                  r'export const CHAT_CLIENTES: ChatCliente\[\] = (\[.*?\n\])\n')
resumen = bloque('CHAT_RESUMEN', r'export const CHAT_RESUMEN = (\{.*?\}) as const')

cuentas = [x for c in clientes for x in c['cuentas']]
print(u'\n  modulo: %d clientes · %d cuentas Chatwoot · libro «%s»'
      % (len(clientes), len(cuentas), resumen.get('libro')))

# ── el libro de origen, que es contra lo que se compara ─────────────────────
libros = sorted(glob.glob(os.path.join(ACERVO, '*.xlsx')), key=os.path.getmtime)
if not libros:
    print(u'\n  *** No hay ningun libro en %s. SIN EL ORIGEN NO SE CONCLUYE NADA:' % ACERVO)
    print(u'      esto no es «todo bien», es que no se pudo comprobar.')
    sys.exit(1)
libro = libros[-1]
if os.path.basename(libro) != resumen.get('libro'):
    print(u'\n  *** El modulo se genero con «%s» y el libro mas reciente es «%s».'
          % (resumen.get('libro'), os.path.basename(libro)))
    print(u'      Comparar contra otro libro daria fallos que no son del modulo.')
    sys.exit(1)

import openpyxl
ws = openpyxl.load_workbook(libro, read_only=True, data_only=True)['Chat Usage Monthly']
filas = list(ws.iter_rows(values_only=True))
cab = [str(c).strip() if c is not None else '' for c in filas[0]]
I = {c: i for i, c in enumerate(cab)}


def t(f, k):
    i = I.get(k)
    return u'' if i is None or f[i] is None else str(f[i]).strip()


def cid_norm(s):
    u"""openpyxl entrega los CID numericos como «130723.0»."""
    try:
        return str(int(float(s)))
    except (TypeError, ValueError):
        return str(s or '').strip()


def rota_fila(f):
    return t(f, 'status') == 'operational_error' or t(f, 'operational_error') != ''


# El corte VIGENTE de cada cuenta en el origen, y si hay uno bueno detras.
origen = {}
for f in filas[1:]:
    cid, cta = cid_norm(t(f, 'cid')), t(f, 'chatwoot_account_name')
    if not cid or not cta:
        continue
    origen.setdefault((cid, cta), []).append(f)

vigente, tiene_bueno_atras = {}, {}
for k, fs in origen.items():
    fs.sort(key=lambda x: t(x, 'period_start'), reverse=True)
    vigente[k] = fs[0]
    tiene_bueno_atras[k] = any(not rota_fila(g) for g in fs[1:])

# ── 1 · ninguna lectura rota rotulada «sin uso» ─────────────────────────────
print(u'\n  1 · UNA LECTURA ROTA NUNCA ES «SIN USO»\n')
malas = []
for x in cuentas:
    k = (str(x['cid']), x['cuenta'])
    f = vigente.get(k)
    if f is None or not rota_fila(f):
        continue
    if x['semaforo'] == 'sin_uso':
        malas.append(u'%s · %s' % (x['cid'], x['cuenta']))
exige(not malas, u'ninguna cuenta con error de lectura sale como «Sin uso»',
      u'%d lo hacen: %s' % (len(malas), u'; '.join(malas[:6])) if malas else
      u'%d cuentas con lectura rota, todas en «Sin medición»'
      % sum(1 for x in cuentas if x['lecturaRota']))

# ── 2 · con corte bueno detras, el respaldo se publica ──────────────────────
print(u'\n  2 · SI HAY UN CORTE BUENO DETRAS, LA FICHA LO DICE\n')
sin_respaldo = []
for x in cuentas:
    k = (str(x['cid']), x['cuenta'])
    if not x['lecturaRota'] or not tiene_bueno_atras.get(k):
        continue
    if not x['respaldoPeriodo'] or x['respaldoMensajes'] is None:
        sin_respaldo.append(u'%s · %s' % (x['cid'], x['cuenta']))
conR = sum(1 for x in cuentas if x['lecturaRota'] and x['respaldoPeriodo'])
exige(not sin_respaldo, u'toda cuenta rota con corte bueno detrás lleva su respaldo',
      u'%d sin él: %s' % (len(sin_respaldo), u'; '.join(sin_respaldo[:6])) if sin_respaldo
      else u'%d llevan respaldo; %d no tienen ningún corte bueno en el libro'
           % (conR, resumen.get('cuentasSinRespaldo')))

# ── 3 · el resumen declara su cobertura ─────────────────────────────────────
print(u'\n  3 · EL TOTAL DICE SOBRE CUÁNTAS CUENTAS ESTÁ HECHO\n')
for campo in ('cuentasMedidas', 'cuentasLecturaRota', 'cuentasSinRespaldo', 'mensajesEnRespaldo'):
    exige(campo in resumen, u'CHAT_RESUMEN declara «%s»' % campo)
if all(c in resumen for c in ('cuentasMedidas', 'cuentasLecturaRota')):
    s = resumen['cuentasMedidas'] + resumen['cuentasLecturaRota']
    exige(s == resumen['cuentas'],
          u'medidas + rotas agotan el total de cuentas',
          u'%d + %d = %d, y hay %d cuentas'
          % (resumen['cuentasMedidas'], resumen['cuentasLecturaRota'], s, resumen['cuentas']))
    exige(resumen['cuentasLecturaRota'] == sum(1 for x in cuentas if x['lecturaRota']),
          u'el conteo del resumen coincide con las cuentas marcadas')

# ── 4 · al revés: los ceros legítimos siguen existiendo ─────────────────────
print(u'\n  4 · AL REVÉS: UN CERO MEDIDO SIGUE SIENDO «SIN USO»\n')
legitimos = [x for x in cuentas
             if x['semaforo'] == 'sin_uso' and not x['lecturaRota'] and x['mensajes'] == 0]
exige(len(legitimos) > 0,
      u'hay ceros medidos de verdad, rotulados «Sin uso»',
      u'%d cuentas: cero mensajes con lectura buena. Si esto fuera 0, el módulo '
      u'habría dejado de distinguir las dos cosas y los puntos 1 y 2 darían '
      u'verde por vacuidad.' % len(legitimos))
mal_rotulados = [x for x in legitimos if x['semaforo'] != 'sin_uso']
exige(not mal_rotulados, u'y ninguno de ellos se fue a «Sin medición»')

# ── 5..8 · EL RESCATE CON EL DETALLE DE LA MISMA CORRIDA ────────────────────
# El detalle del libro, agregado por (cuenta, periodo, corrida). `generated_at`
# forma parte de la llave porque las dos hojas NO siempre vienen de la misma
# corrida: el agosto de Medicall tiene el resumen de la re-corrida del 24 sep y
# el detalle de la fallida del 2 sep. Sin esa parte se cruzarian dias distintos.
wsi = openpyxl.load_workbook(libro, read_only=True, data_only=True)['Chat Inbox Usage Monthly']
fi = list(wsi.iter_rows(values_only=True))
cabi = [str(c).strip() if c is not None else '' for c in fi[0]]
J = {c: i for i, c in enumerate(cabi)}


def ti(f, k):
    i = J.get(k)
    return u'' if i is None or f[i] is None else str(f[i]).strip()


def ni(f, k):
    try:
        return int(float(ti(f, k)))
    except ValueError:
        return 0


detalle = {}
for f in fi[1:]:
    acct = ti(f, 'chatwoot_account_id')
    if not acct or ti(f, 'inbox_id') in ('', '0') or not ti(f, 'inbox_name'):
        continue
    k = (cid_norm(acct), ti(f, 'period_start')[:10], ti(f, 'generated_at')[:10])
    d = detalle.setdefault(k, {'msg': 0, 'scopes': set()})
    d['msg'] += ni(f, 'messages_count')
    d['scopes'].add(ti(f, 'measurement_scope'))

print(u'\n  5 · SI LAS BANDEJAS CONTESTARON, LA CUENTA LLEVA SU RESCATE\n')
faltan, revisadas = [], 0
for x in cuentas:
    f = vigente.get((str(x['cid']), x['cuenta']))
    if f is None or not rota_fila(f):
        continue
    k = (cid_norm(t(f, 'chatwoot_account_id')), t(f, 'period_start')[:10],
         t(f, 'generated_at')[:10])
    d = detalle.get(k)
    if not d or d['msg'] <= 0:
        continue
    revisadas += 1
    if x.get('rescateMensajes') != d['msg']:
        faltan.append(u'%s · %s: libro %s, módulo %s'
                      % (x['cid'], x['cuenta'], format(d['msg'], ','),
                         x.get('rescateMensajes')))
exige(revisadas > 0,
      u'el libro trae cuentas rotas con detalle medido (si no, nada que probar)',
      u'%d cuenta(s) rotas con tráfico en su detalle' % revisadas)

# LO QUE ESTA PRUEBA NO CUBRE HOY, y hay que decirlo en vez de dejarlo en verde.
# `generated_at` esta en la llave porque las dos hojas pueden venir de corridas
# distintas. Se probo quitandolo del generador: con ESTE corte da exactamente el
# mismo resultado, porque ninguna cuenta rota vigente tiene dos corridas en su
# periodo. O sea que el guardia es correcto pero NO ESTA EJERCIDO. En cuanto
# aparezca una re-corrida —el agosto de Medicall la tuvo— esta linea lo dira y
# la comprobacion pasara a valer. [[feedback-verificar-antes-asegurar]]
multi = 0
for x in cuentas:
    f = vigente.get((str(x['cid']), x['cuenta']))
    if f is None or not rota_fila(f):
        continue
    acct, per = cid_norm(t(f, 'chatwoot_account_id')), t(f, 'period_start')[:10]
    if len({k[2] for k in detalle if k[0] == acct and k[1] == per}) > 1:
        multi += 1
print(u'        %s'
      % (u'%d cuenta(s) rotas tienen MAS DE UNA corrida en su periodo: ahí la '
         u'llave por `generated_at` sí se está ejerciendo.' % multi if multi else
         u'AVISO · ninguna cuenta rota vigente tiene dos corridas en su periodo, '
         u'así que la parte `generated_at` de la llave NO está ejercida por este '
         u'corte. Correcta, pero sin probar: no cuenta como verificada.'))
exige(not faltan, u'todas llevan exactamente lo que midió el libro',
      u'%d no cuadran: %s' % (len(faltan), u'; '.join(faltan[:5])) if faltan
      else u'las %d coinciden al mensaje con el origen' % revisadas)

print(u'\n  6 · EL RESCATE NUNCA BAJA UNA CIFRA\n')
bajan = [u'%s · %s: %s -> %s' % (x['cid'], x['cuenta'],
                                 format(x['mensajes'], ','),
                                 format(x['mensajesEfectivos'], ','))
         for x in cuentas if x['mensajesEfectivos'] < x['mensajes']]
conCifra = [x for x in cuentas if x['lecturaRota'] and x['mensajes'] > 0]
exige(not bajan, u'`mensajesEfectivos` nunca queda por debajo de `mensajes`',
      u'%d bajan: %s' % (len(bajan), u'; '.join(bajan[:5])) if bajan
      else u'%d cuenta(s) rotas publican cifra propia y ninguna empeoró' % len(conCifra))

print(u'\n  7 · UN PISO NO SE ROTULA COMO DATO\n')
mal = []
for x in cuentas:
    if not x.get('rescateExacto'):
        continue
    f = vigente.get((str(x['cid']), x['cuenta']))
    k = (cid_norm(t(f, 'chatwoot_account_id')), t(f, 'period_start')[:10],
         t(f, 'generated_at')[:10]) if f is not None else None
    sc = {s for s in detalle.get(k, {}).get('scopes', set()) if s} if k else set()
    if sc != {'contracted_inboxes'}:
        mal.append(u'%s · %s: alcance %s' % (x['cid'], x['cuenta'],
                                             u'/'.join(sorted(sc)) or u'(vacío)'))
exige(not mal, u'`rescateExacto` solo donde el alcance es `contracted_inboxes`',
      u'%d mal rotulados: %s' % (len(mal), u'; '.join(mal[:5])) if mal
      else u'%d rescates exactos, todos con el alcance que lo justifica'
           % resumen.get('cuentasRescateExacto', 0))
pisos = [x for x in cuentas if x.get('rescateMensajes') and not x.get('rescateExacto')]
exige(all(x['semaforo'] == 'sin_medicion' for x in pisos),
      u'y todo PISO sigue en «Sin medición», que es lo que es',
      u'%d pisos, ninguno coloreado como si se supiera el total' % len(pisos))

print(u'\n  8 · AL REVÉS: NO TODO ES RESCATABLE, NI TODO ES EXACTO\n')
exige(resumen.get('cuentasSinRescate', 0) > 0,
      u'siguen existiendo cuentas rotas que ninguna bandeja pudo medir',
      u'%d cuentas mudas. Si fuera 0, el rescate estaría diciendo que lo cubre '
      u'todo y los puntos 5-7 darían verde por vacuidad.'
      % resumen.get('cuentasSinRescate', 0))
exige(len(pisos) > 0,
      u'y siguen existiendo rescates PISO, rotulados como cota',
      u'%d. Si todos fueran exactos, el punto 7 no probaría nada.' % len(pisos))
exige(resumen.get('mensajesEfectivos', 0) >= resumen.get('mensajes', 0),
      u'el total efectivo del portafolio no baja del publicado',
      u'%s publicados · %s afirmables'
      % (format(resumen.get('mensajes', 0), ','),
         format(resumen.get('mensajesEfectivos', 0), ',')))

#   9 · LAS POBLACIONES DEL AVISO CIERRAN
#
#   El aviso de la pantalla encadena restas: «46 rotas · en 18 se rescata · las
#   28 restantes siguen mudas · de ellas 8 no tienen ningun corte bueno». Cada
#   una de esas cifras es un campo distinto del resumen, y en la primera version
#   dos de ellas estaban calculadas sobre OTRA poblacion: la frase arrancaba con
#   `cuentasConError` (39) y seguia con «de esas 46», y el respaldo de las 46
#   (2,173,395) se le achacaba a las 28 mudas. La resta no cerraba y el lector no
#   tenia como notarlo. Esto lo mide. [[feedback-tablas-deben-cerrar]]
print(u'\n  9 · LAS POBLACIONES QUE ENCADENA EL AVISO CIERRAN\n')
rotas_r   = resumen.get('cuentasLecturaRota', 0)
resc_r    = resumen.get('cuentasRescatadas', 0)
mudas_r   = resumen.get('cuentasSinRescate', 0)
exacto_r  = resumen.get('cuentasRescateExacto', 0)
piso_r    = resumen.get('cuentasRescatePiso', 0)
exige(resc_r + mudas_r == rotas_r,
      u'rescatadas + mudas = rotas',
      u'%d + %d = %d' % (resc_r, mudas_r, rotas_r))
exige(exacto_r + piso_r == resc_r,
      u'exactas + piso = rescatadas',
      u'%d + %d = %d' % (exacto_r, piso_r, resc_r))
exige(resumen.get('mensajesRescateExacto', 0) + resumen.get('mensajesRescatePiso', 0)
      == resumen.get('mensajesRescatados', 0),
      u'y los mensajes del reparto exacto/piso suman el rescate',
      u'%s + %s = %s'
      % (format(resumen.get('mensajesRescateExacto', 0), ','),
         format(resumen.get('mensajesRescatePiso', 0), ','),
         format(resumen.get('mensajesRescatados', 0), ',')))
# los dos campos que el aviso cuelga de las MUDAS tienen que estar medidos sobre
# las mudas, no sobre las 46: si alguno se colara, seria mayor que su version
# de 46 o no cuadraria con el recuento directo sobre las cuentas.
mudas_dir = [x for x in cuentas
             if x.get('lecturaRota') and not x.get('rescateMensajes')]
exige(len(mudas_dir) == mudas_r,
      u'el conteo de mudas coincide con las cuentas marcadas',
      u'%d en las cuentas · %d en el resumen' % (len(mudas_dir), mudas_r))
exige(resumen.get('mensajesEnRespaldoMudas')
      == sum(x.get('respaldoMensajes') or 0 for x in mudas_dir),
      u'`mensajesEnRespaldoMudas` sale de las mudas y de nadie mas',
      u'%s mensajes, sobre %d cuentas'
      % (format(resumen.get('mensajesEnRespaldoMudas', 0), ','), len(mudas_dir)))
exige(resumen.get('cuentasSinRespaldoMudas')
      == sum(1 for x in mudas_dir if not x.get('respaldoPeriodo')),
      u'`cuentasSinRespaldoMudas` tambien, y no es el de las 46',
      u'%s mudas sin ningun corte bueno (el campo de las %d rotas dice %s)'
      % (resumen.get('cuentasSinRespaldoMudas'), rotas_r,
         resumen.get('cuentasSinRespaldo')))
exige(resumen.get('mensajesEnRespaldoMudas', 0)
      <= resumen.get('mensajesEnRespaldo', 0)
      and resumen.get('cuentasSinRespaldoMudas', 0)
      <= resumen.get('cuentasSinRespaldo', 0),
      u'y ningun subconjunto pesa mas que el conjunto del que sale',
      u'mudas ⊆ rotas en las dos cifras')

print(u'\n  ═══════════════════════════════════════════════════════════')
if fallos:
    print(u'  *** %d comprobación(es) fallan.' % len(fallos))
    print(u'      Un cero que en realidad es una lectura rota manda a un asesor')
    print(u'      a llamar a un cliente que no tiene el problema, y esconde al')
    print(u'      que sí lo tiene.')
    sys.exit(1)
print(u'  NINGÚN CERO DEL MÓDULO ES UNA LECTURA FALLIDA, y el total dice')
print(u'  sobre cuántas cuentas está hecho.')
