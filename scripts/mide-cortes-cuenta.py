# -*- coding: utf-8 -*-
u"""POR QUE UNA CUENTA ES CIEGA AL CONSUMO.

   `sin_consumo_medible` es la alerta mas grave del tablero y la que encabeza
   la cola de 18 de las 25 cuentas TOP. Su texto de accion dice «La cuenta no
   aparece en el archivo de cortes», y eso puede ser FALSO: hay dos causas
   distintas y la alerta las cuenta igual.

       (a) NO HAY FILAS para el CID en `data/cortes-facturacion.xlsx`
       (b) SI HAY FILAS, pero `baseMinutos(plan, incl)` devuelve null, asi que
           el mes no da un % y no entra en la serie

   La diferencia decide a quien se le pide: (a) es Ingenieria metiendo la
   cuenta al corte; (b) es el NOMBRE DEL PLAN, que nuestro propio parser no
   entiende — y entonces el aviso le echa la culpa al archivo equivocado.

   Reproduce `baseMinutos` de `lib/plan-minutos.ts`. La primera version COPIO
   las constantes a mano y copio TRES mal: `BOLSA_MINIMA` 250 en vez de 3,
   `MIN_POR_EXT_PLAUSIBLE` 100 en vez de 50, y un `RX_SIN_VOZ` que incluia
   «agente virtual», que el de verdad NO trae. Imprimirlas para «poder
   cotejarlas» no es cotejarlas: nadie lo hizo. Ahora se LEEN del propio .ts y
   si no se encuentran, el guion se cae en vez de medir con un numero inventado.

   Es de SOLO LECTURA. [[feedback-cero-sin-medicion]]

   USO
       python scripts/mide-cortes-cuenta.py 168973
"""
import io
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

if len(sys.argv) < 2:
    print(__doc__); sys.exit(2)
CID = sys.argv[1].strip()

# ── Las constantes se LEEN de lib/plan-minutos.ts, no se copian ────────────
#
# Un espejo que se escribe a mano deja de ser un espejo en cuanto el original
# cambia — o en cuanto se teclea mal, que es lo que paso. Si alguna no aparece,
# esto NO sigue con un valor por omision: se cae. Un medidor que adivina una
# constante es peor que no tener medidor. [[feedback-verificar-antes-asegurar]]
TS = io.open(os.path.join(RAIZ, 'lib', 'plan-minutos.ts'), encoding='utf-8').read()


def const_num(nombre):
    m = re.search(r'\b' + nombre + r'\s*=\s*(\d+)', TS)
    if not m:
        print(u'  *** lib/plan-minutos.ts ya no define «%s». El guion no puede'
              u' medir sin ella.' % nombre)
        sys.exit(2)
    return int(m.group(1))


def const_rx(nombre):
    m = re.search(r'\b' + nombre + r'\s*=\s*/(.+)/([gimsuy]*)\s*$',
                  TS, re.MULTILINE)
    if not m:
        print(u'  *** lib/plan-minutos.ts ya no define «%s».' % nombre)
        sys.exit(2)
    cuerpo = m.group(1)
    señales = re.I if 'i' in m.group(2) else 0
    try:
        return re.compile(cuerpo, señales)
    except re.error as e:
        print(u'  *** «%s» no se puede traducir a Python: %s' % (nombre, e))
        sys.exit(2)


MINUTOS_POR_EXTENSION = const_num('MINUTOS_POR_EXTENSION')
BOLSA_MINIMA = const_num('BOLSA_MINIMA')
MIN_POR_EXT_PLAUSIBLE = const_num('MIN_POR_EXT_PLAUSIBLE')
RX_EXTENSIONES = const_rx('RX_EXTENSIONES')
RX_EXT_ABREVIADO = const_rx('RX_EXT_ABREVIADO')
RX_SIN_VOZ = const_rx('RX_SIN_VOZ')

# Control: los casos que el propio .ts documenta en sus comentarios tienen que
# dar lo que ahi dice. Si esto falla, el espejo esta roto y no se mide nada.
_C = [(u'13 Extensiones Ilimitadas', 1, 13 * MINUTOS_POR_EXTENSION, u'extensiones'),
      (u'50 Extensiones Visibilidad y Control IP', 12500, 12500, u'bolsa'),
      (u'AV 1,000 min Agente Virtual', 1, None, u'sin_medicion')]


def base_minutos(plan, incl):
    u"""Devuelve (base, origen). Espejo de `baseMinutos`, en su mismo orden."""
    nombre = plan or u''
    m = RX_EXTENSIONES.search(nombre) or RX_EXT_ABREVIADO.search(nombre)
    ext = int(m.group(1)) if m else None
    if RX_SIN_VOZ.search(nombre) and not ext and incl < BOLSA_MINIMA:
        return None, u'sin_medicion'
    if ext and ext > 0:
        por_ext = (incl / float(ext)) if incl > 0 else 0
        if por_ext >= MIN_POR_EXT_PLAUSIBLE:
            return incl, u'bolsa'
        return ext * MINUTOS_POR_EXTENSION, u'extensiones'
    if incl >= BOLSA_MINIMA:
        return incl, u'bolsa'
    return None, u'sin_medicion'


for _p, _i, _b, _o in _C:
    _rb, _ro = base_minutos(_p, _i)
    if (_rb, _ro) != (_b, _o):
        print(u'  *** EL ESPEJO ESTA ROTO. «%s» con %s incluidos deberia dar'
              u' (%s, %s) y da (%s, %s). No se mide nada hasta arreglarlo.'
              % (_p, _i, _b, _o, _rb, _ro))
        sys.exit(2)


def mes(v):
    import datetime
    if isinstance(v, datetime.datetime):
        return v.strftime('%Y-%m')
    if isinstance(v, datetime.date):
        return v.strftime('%Y-%m')
    if isinstance(v, (int, float)):
        d = datetime.date(1899, 12, 30) + datetime.timedelta(days=int(v))
        return d.strftime('%Y-%m')
    return str(v or u'')[:7]


def num(v):
    try:
        return float(v or 0)
    except Exception:
        try:
            return float(re.sub(r'[^0-9.\-]', '', str(v)) or 0)
        except Exception:
            return 0.0


from openpyxl import load_workbook

RUTA = os.path.join(RAIZ, 'data', 'cortes-facturacion.xlsx')
wb = load_workbook(RUTA, data_only=True, read_only=True)
ws = wb[wb.sheetnames[0]]
filas = ws.iter_rows(values_only=True)
cab = [str(x or u'').strip() for x in next(filas)]
ix = {c: i for i, c in enumerate(cab)}

for c in ('CID', 'Nombre del Plan', 'Minutos Incluidos', 'Minutos Consumidos',
          'Fecha de corte'):
    if c not in ix:
        print(u'  *** el archivo no trae la columna «%s». Columnas: %s'
              % (c, u', '.join(cab))); sys.exit(1)


def g(r, c):
    return r[ix[c]] if ix[c] < len(r) else None


mias, total = [], 0
for r in filas:
    total += 1
    if str(g(r, 'CID') or u'').strip() == CID:
        mias.append(r)

print(u'\n  ══ CORTES DE FACTURACION · CID %s ═══════════════════════' % CID)
print(u'  archivo: data/cortes-facturacion.xlsx · %s filas'
      % u'{:,}'.format(total))
print(u'  constantes: %s min/extension · bolsa minima %s · min/ext plausible %s'
      % (MINUTOS_POR_EXTENSION, BOLSA_MINIMA, MIN_POR_EXT_PLAUSIBLE))

if not mias:
    print(u'\n  *** CERO FILAS para el CID %s.' % CID)
    print(u'      Causa (a): la cuenta NO esta en el corte. El aviso de la')
    print(u'      alerta es correcto y la tarea es de Ingenieria.')
    sys.exit(0)

print(u'\n  %d fila(s). mes · plan · incluidos · consumidos · base · origen · %%'
      % len(mias))
medibles = 0
for r in sorted(mias, key=lambda x: mes(g(x, 'Fecha de corte'))):
    plan = str(g(r, 'Nombre del Plan') or u'').strip()
    incl, cons = num(g(r, 'Minutos Incluidos')), num(g(r, 'Minutos Consumidos'))
    base, origen = base_minutos(plan, incl)
    pct = (100.0 * cons / base) if base else None
    if pct is not None:
        medibles += 1
    print(u'    %-8s %-46s %9s %9s %9s %-12s %s'
          % (mes(g(r, 'Fecha de corte')), plan[:46],
             u'{:,.0f}'.format(incl), u'{:,.0f}'.format(cons),
             u'{:,.0f}'.format(base) if base else u'—', origen,
             u'%.1f%%' % pct if pct is not None else u'NO MEDIBLE'))

print(u'\n  %d de %d corte(s) dan un %% medible.' % (medibles, len(mias)))

# ── LO QUE EL CORTE SI MIDE AUNQUE NO HAYA MINUTOS ────────────────────────
#
# El archivo trae las visitas al panel y el uso principal. Eso NO depende de
# `baseMinutos`, asi que una cuenta «ciega al consumo» puede tener evidencia
# de adopcion perfectamente legible — y al reves: un registro de adopcion que
# dice «Panel: alto» se puede COMPROBAR contra estas columnas en vez de
# creerselo. [[feedback-fuente-unica-cuentas]]
COLS_PANEL = [u'Menú Configuracion', u'Reportes', u'Call History',
              u'Visit Inbound', u'Visit Outbound', u'My extension']
EXTRA = [u'Monto del plan', u'Uso Principal de llamadas', u'Desarrolladores',
         u'Pago exitoso', u'Total de interacciones', u'Clasificación de empresa']
hay_panel = [c for c in COLS_PANEL if c in ix]
print(u'\n  PANEL Y USO (no dependen de la base de minutos)')
print(u'    %-8s %10s %7s %-14s %6s %7s %s'
      % (u'mes', u'monto', u'panel', u'uso', u'desar', u'pago ok', u'interacc'))
tot_panel = 0
for r in sorted(mias, key=lambda x: mes(g(x, 'Fecha de corte'))):
    panel = sum(num(g(r, c)) for c in hay_panel)
    tot_panel += panel
    print(u'    %-8s %10s %7s %-14s %6s %7s %s'
          % (mes(g(r, 'Fecha de corte')),
             u'{:,.0f}'.format(num(g(r, u'Monto del plan'))) if u'Monto del plan' in ix else u'?',
             u'{:,.0f}'.format(panel),
             (str(g(r, u'Uso Principal de llamadas') or u'—'))[:14] if u'Uso Principal de llamadas' in ix else u'?',
             u'{:,.0f}'.format(num(g(r, u'Desarrolladores'))) if u'Desarrolladores' in ix else u'?',
             u'{:,.0f}'.format(num(g(r, u'Pago exitoso'))) if u'Pago exitoso' in ix else u'?',
             u'{:,.0f}'.format(num(g(r, u'Total de interacciones'))) if u'Total de interacciones' in ix else u'?'))
print(u'    visitas al panel en el periodo: %s' % u'{:,.0f}'.format(tot_panel))
if tot_panel == 0:
    print(u'    *** CERO visitas al panel en %d cortes. Si la ficha declara'
          % len(mias))
    print(u'        adopcion «alta» del Panel Administrador, no sale de aqui.')
for c in EXTRA:
    if c not in ix:
        print(u'    (el archivo no trae «%s»)' % c)
ultimos5 = sorted(mias, key=lambda x: mes(g(x, 'Fecha de corte')))[-5:]
med5 = sum(1 for r in ultimos5
           if base_minutos(str(g(r, 'Nombre del Plan') or u'').strip(),
                           num(g(r, 'Minutos Incluidos')))[0])
print(u'  de los ULTIMOS 5 (que es lo que mira el detector): %d medible(s).' % med5)
if med5 < 3:
    print(u'\n  *** LA ALERTA `sin_consumo_medible` SE ABRE, y con %d filas en el'
          % len(mias))
    print(u'      archivo la causa es (b): el plan existe pero `baseMinutos` no')
    print(u'      le saca una base. El texto de la alerta —«la cuenta no aparece')
    print(u'      en el archivo de cortes»— NO describe este caso: senala a')
    print(u'      Ingenieria cuando lo que hay que arreglar es el nombre del')
    print(u'      plan o el parser. HALLAZGO.')
else:
    print(u'\n  la alerta NO deberia abrirse por medicion.')
print(u'')
