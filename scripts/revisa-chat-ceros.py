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

print(u'\n  ═══════════════════════════════════════════════════════════')
if fallos:
    print(u'  *** %d comprobación(es) fallan.' % len(fallos))
    print(u'      Un cero que en realidad es una lectura rota manda a un asesor')
    print(u'      a llamar a un cliente que no tiene el problema, y esconde al')
    print(u'      que sí lo tiene.')
    sys.exit(1)
print(u'  NINGÚN CERO DEL MÓDULO ES UNA LECTURA FALLIDA, y el total dice')
print(u'  sobre cuántas cuentas está hecho.')
