# -*- coding: utf-8 -*-
"""Alta de CBS Compresores (CID 134358, consecutivo F24) en `cuentas`.

   POR QUE HACIA FALTA
   -------------------
   CBS tiene ficha en Top Customer (hoja F24) desde el arranque del tablero y
   NUNCA tuvo fila en `cuentas`, que es de donde el modulo Cuentas saca todo.
   Un cliente clasificado AAA, que factura $4,939 al mes, levanta tickets cada
   mes y tiene doce numeros en cuatro plazas, era invisible: no salia en
   Cuentas, no recibia actividades SAC y quedaba fuera de todos los analisis.

   Es la UNICA de las 151 fichas de Top Customer sin cuenta. Las otras cuatro
   que parecian faltar (Medicall Expert, ICUSMEX, Transportes FEMA, KW-City) si
   estan: el consecutivo de su ficha no coincide con el de la tabla, y por eso
   una comparacion por consecutivo las daba por ausentes. La llave es el CID.

   DE DONDE SALE CADA DATO
   -----------------------
   Lo descriptivo, de su ficha F24. Lo economico y de comportamiento, de las
   fuentes vivas: cortes, tickets y DIDs. Cuando las dos discrepan manda la
   fuente viva, y la discrepancia se anota en vez de resolverse inventando.

   LO QUE NO SE INVENTO
   --------------------
   Los cuatro scores quedan en 50, su valor por omision, igual que en el alta de
   D60: no hay medicion propia todavia y `health_score` es columna GENERADA
   (0.35 act + 0.30 adop + 0.20 pago + 0.15 rel), asi que no se escribe.
   Y los seis primeros cortes traen consumo 0: ES UN HUECO DE LA FUENTE, no seis
   meses sin uso — la plataforma empezo a reportar esas columnas en julio. Queda
   dicho con palabras en `notas`.

   Instruccion de direccion (22 sep 2026): «no des de baja ninguna cuenta a
   menos que te lo autorice, y en todo caso seria pasarla a dormidas porque fue
   una baja». Este script solo DA DE ALTA; no borra ni desactiva nada.

   USO
   ---
       python scripts/alta-cbs-compresores.py            # diagnostica
       python scripts/alta-cbs-compresores.py --aplicar
"""
import datetime
import io
import json
import os
import sys
import urllib.request

import openpyxl

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RAIZ, 'scripts'))
from observaciones_kam import anteponer_entrada   # noqa: E402

APLICAR = '--aplicar' in sys.argv
CID = '134358'
CONSECUTIVO = 'F24'          # el de su propia ficha de Top Customer, y esta libre
ALTA = '2023-02-24'

_env = {}
for _ln in io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8'):
    _ln = _ln.strip()
    if _ln and not _ln.startswith('#') and '=' in _ln:
        _k, _v = _ln.split('=', 1)
        _env[_k.strip()] = _v.strip().strip('"').strip("'")
URL = _env['NEXT_PUBLIC_SUPABASE_URL'].rstrip('/')
KEY = _env['SUPABASE_SERVICE_ROLE_KEY']
H = {'apikey': KEY, 'Authorization': 'Bearer %s' % KEY,
     'Content-Type': 'application/json', 'Prefer': 'return=representation'}


def rest(ruta, metodo='GET', cuerpo=None):
    req = urllib.request.Request(
        URL + '/rest/v1/' + ruta,
        data=json.dumps(cuerpo).encode('utf-8') if cuerpo is not None else None,
        headers=H, method=metodo)
    with urllib.request.urlopen(req, timeout=60) as r:
        txt = r.read().decode('utf-8')
    return json.loads(txt) if txt.strip() else None


def norm(v):
    s = str(v if v is not None else '').strip()
    return s[:-2] if s.endswith('.0') else s


# ══════════════════════════════════════════════════════════════════════════
#  Compuertas: no dar de alta algo que ya existe
# ══════════════════════════════════════════════════════════════════════════
cuentas = rest('cuentas?select=id,consecutivo,cid,empresa,estado&limit=500')
print('Cartera actual: %d cuentas' % len(cuentas))

por_cid = dict((norm(c['cid']), c) for c in cuentas if norm(c['cid']))
if CID in por_cid:
    raise SystemExit('El CID %s YA existe: «%s». No se da de alta dos veces.'
                     % (CID, por_cid[CID]['empresa']))
if CONSECUTIVO in set(str(c.get('consecutivo') or '').strip().upper() for c in cuentas):
    raise SystemExit('El consecutivo %s ya esta ocupado. Elegir otro.' % CONSECUTIVO)
print('  CID %s libre · consecutivo %s libre  OK' % (CID, CONSECUTIVO))

# ══════════════════════════════════════════════════════════════════════════
#  Fuentes vivas: cortes, tickets, numeros
# ══════════════════════════════════════════════════════════════════════════
wb = openpyxl.load_workbook(os.path.join(RAIZ, 'data', 'cortes-facturacion.xlsx'),
                            data_only=True, read_only=True)
ws = wb[wb.sheetnames[0]]
_it = ws.iter_rows(values_only=True)
cab = [str(c).strip() if c is not None else '' for c in next(_it)]
I = dict((c, i) for i, c in enumerate(cab))
cortes = [r for r in _it if norm(r[I['CID']]) == CID]
wb.close()
cortes.sort(key=lambda r: (r[I['Fecha de corte']] is None, r[I['Fecha de corte']]))
u = cortes[-1]
plan, monto = str(u[I['Nombre del Plan']] or ''), float(u[I['Monto del plan']] or 0)
fecha_u = str(u[I['Fecha de corte']])[:10]
consumidos = u[I['Minutos Consumidos']]
pct = u[I['% Consumo']]
clasif = [str(r[I['Clasificación de empresa']]) for r in cortes
          if r[I['Clasificación de empresa']]]
print('\n  %d cortes · ultimo %s · %s · $%s · %s min (%s%%) · clasificacion %s'
      % (len(cortes), fecha_u, plan, monto, consumidos, pct,
         clasif[-1] if clasif else 'sin dato'))

TK = json.load(io.open(os.path.join(RAIZ, 'lib', 'tickets-data.json'), encoding='utf-8'))
TK = TK if isinstance(TK, list) else (TK.get('rows') or TK.get('tickets') or [])
tk = [t for t in TK if norm(t.get('cid')) == CID]
# OJO: `es_falla` es la cadena 'Si'/'No', no un booleano. Un `if t.get('es_falla')`
# cuenta las once, porque toda cadena no vacia es verdadera.
fallas = [t for t in tk if str(t.get('es_falla') or '').strip().lower() in ('si', 'sí', 'true')]
print('  %d tickets (%s a %s) · %d clasificados como falla'
      % (len(tk), min(str(t.get('mes')) for t in tk), max(str(t.get('mes')) for t in tk),
         len(fallas)))

DD = json.load(io.open(os.path.join(RAIZ, 'data', 'dids.json'), encoding='utf-8'))['porCid']
dids = DD.get(CID) or []
libres = [d for d in dids if str(d.get('e') or '').strip().lower() == 'available']
print('  %d numeros · %d sin asignar' % (len(dids), len(libres)))

dias_cliente = (datetime.date.today() - datetime.date(*[int(x) for x in ALTA.split('-')])).days

# ══════════════════════════════════════════════════════════════════════════
#  La cuenta
# ══════════════════════════════════════════════════════════════════════════
OBS = (
    'Alta de la cuenta, por instrucción de dirección. Tenía ficha en Top Customer (hoja F24) '
    'desde el arranque del tablero pero NUNCA tuvo fila en `cuentas`: no aparecía en el módulo '
    'Cuentas, no recibía actividades SAC y quedó fuera de todos los análisis de cartera, pese a '
    'estar clasificada AAA, facturar $%s al mes y levantar tickets cada mes desde marzo.\n\n'
    'QUÉ ES. Fabricante y distribuidor de compresores de aire, fundada en 1971. Grupo CBS '
    '(Integradora de Compresores en México + Compresores, Bombas y Servicios). Sede en '
    'Guadalajara, 5 sucursales y 1 planta de fabricación.\n\n'
    'CÓMO USA CALLPICKER. Doce números en una estructura deliberada: principal y secundario en '
    'CDMX, Guadalajara y León, principal en Monterrey, un 800 de Línea Nacional y un 800 de '
    'Servicio Técnico Nacional. Eso no es una PYME con un conmutador: es una red de atención '
    'nacional con postventa separada. Plan «%s», extensiones ilimitadas.\n\n'
    'LECTURA KAM. El corte de septiembre mide 63.22%% de llamadas entrantes y uso principal '
    '«entrantes» — con un 800 de servicio técnico, el patrón es de soporte, no de venta. '
    'Consume %s minutos de una bolsa de 16,500 (11 extensiones × 1,500): 11.45%%. Hay dos '
    'números en «Available», sin asignar. Y el corte de septiembre registra 1 visita a '
    'Desarrolladores, que es la señal de interés en integración.'
    % ('{:,.0f}'.format(monto), plan, '{:,}'.format(int(consumidos or 0)))
)

NOTAS = (
    '[ALTA 22 sep 2026] Creada por instrucción de dirección tras detectar que la ficha F24 de '
    'Top Customer no tenía cuenta. Asesora: Fátima.\n\n'
    'LO QUE ESTÁ MEDIDO:\n'
    '· CID %s, confirmado contra cortes, tickets y DIDs — las tres fuentes coinciden.\n'
    '· %d cortes. Plan vigente «%s», $%s/mes al %s. Clasificación de empresa: %s.\n'
    '· %d tickets de marzo a septiembre 2026, %d clasificado como falla. Todos de voz.\n'
    '· %d números activos; %d en «Available», sin asignar.\n'
    '· NO aparece en GRC ni en la lista de cancelados: sin señal de baja.\n\n'
    'LO QUE FALTA Y NO SE INVENTÓ:\n'
    '· CONSUMO DE ENERO A JUNIO: los seis primeros cortes traen 0 minutos y 0%% de consumo. '
    'ES UN HUECO DE LA FUENTE, NO SEIS MESES SIN USO — la plataforma empezó a poblar esas '
    'columnas en julio, y las de comportamiento (%% entrantes, Destinos, Desarrolladores) hasta '
    'septiembre. No afirmar que la cuenta estuvo inactiva.\n'
    '· FALTA EL CORTE DE AGOSTO: la serie salta del 4 de julio al 4 de septiembre. No se sabe '
    'si es un hueco del export o un mes sin facturar.\n'
    '· DISCREPANCIA DE PLAN A ACLARAR: la ficha F24 dice «30 Extensiones Visibilidad y Control» '
    'y facturación $11,998; el corte del %s dice «%s» y $%s. Se tomó el corte, que es lo que se '
    'factura hoy. Alguien tiene que decir cuál de las dos está vieja.\n'
    '· NO VIENE EN LA EXTRACCIÓN DE LLAMADAS (son 86 de 220 cuentas), así que no hay detalle de '
    'contestadas ni perdidas. El %% de entrantes del corte NO sustituye esa medición.\n'
    '· CARGOS Y CORREO: la ficha da un solo correo compartido para los dos contactos. No se '
    'atribuyó a uno en particular.\n'
    '· Los cuatro scores quedan en 50, su valor por omisión: no hay medición propia todavía. '
    'El Health Score que muestre la ficha es ese default, no una evaluación.\n'
    '· PAGO AUTOMÁTICO y estado de cobranza: sin capturar. La columna «Pago exitoso» del corte '
    'viene en 0 para los dos únicos meses que la reportan, y no se sabe si eso es un impago o '
    'un campo sin poblar. NO se marcó `pagos_al_corriente` por eso.'
    % (CID, len(cortes), plan, '{:,.0f}'.format(monto), fecha_u,
       clasif[-1] if clasif else 'sin dato', len(tk), len(fallas), len(dids), len(libres),
       fecha_u, plan, '{:,.0f}'.format(monto))
)

CONTACTOS = [
    {'nombre': 'Ing. Héctor Huerta', 'cargo': 'Ingeniería',
     'email': 'cmr@cbscompresores.com', 'tel': '33 2960 8631',
     'nota': 'Contacto principal según la ficha F24. El correo es el único que da la ficha y '
             'aparece compartido con el Ing. Ramsés: no se sabe cuál de los dos lo atiende.'},
    {'nombre': 'Ing. Ramsés', 'cargo': 'Contacto comercial-técnico',
     'tel': '33 1671 3866',
     'nota': 'Segundo contacto de la ficha F24. Teléfono celular. Correo propio NO capturado.'},
    {'nombre': 'Facturación', 'tel': '33 3584 0179',
     'nota': 'Línea de facturación de la empresa, no de una persona.'},
]

SERVICIOS = [
    {'nombre': plan,
     'descripcion': 'Plan vigente según el corte del %s. $%s/mes, extensiones ilimitadas. '
                    'Bolsa de 16,500 minutos (11 extensiones × 1,500); consumo %s%% en el '
                    'último corte. Sin Callpicker Chat, sin integración CRM y sin Asistente '
                    'Virtual, según la ficha F24.'
                    % (fecha_u, '{:,.0f}'.format(monto), pct)},
]

CUENTA = {
    'consecutivo': CONSECUTIVO,
    'cid': CID,
    'empresa': 'CBS Compresores',
    'asesor': 'Fátima',            # «EJECUTIVO POSTVENTA: Fátima González» en la ficha F24
    'estado': 'activo',
    'facturacion': monto,
    'servicio': plan,
    'servicios_json': SERVICIOS,
    'activo_desde': ALTA,
    'dias_como_cliente': dias_cliente,
    'dias_sin_actividad': 0,
    'giro': 'Fabricante y distribuidor de compresores de aire (pistón, tornillo, scroll, libres '
            'de aceite) y soluciones neumáticas industriales. Fundada en 1971.',
    'grupo_empresarial': 'Grupo CBS — Integradora de Compresores en México S.A. de C.V. y '
                         'Compresores, Bombas y Servicios S.A. de C.V.',
    'direccion_fiscal': 'Agustín Yáñez 1212, Col. Moderna, 44190 Guadalajara, Jalisco',
    'pagina_web': 'https://cbscompresores.com.mx/',
    'zoho_link': 'https://crm.zoho.com/crm/org5406171/tab/Contacts/346103000099896279',
    'tamano_empresa': 'Pequeña',
    'total_empleados': '10-19',
    'num_oficinas': '6',           # 5 sucursales + 1 planta; el desglose va en observaciones
    'contacto_nombre': 'Ing. Héctor Huerta',
    'contacto_cargo': 'Ingeniería',
    'contacto_email': 'cmr@cbscompresores.com',
    'contacto_tel': '33 2960 8631',
    'contactos_json': CONTACTOS,
    'observaciones_kam': anteponer_entrada(None, OBS, 'sistema'),
    'notas': NOTAS,
    # Ficha F24: CALLPICKER CHAT NO · INTEGRACIÓN CRM NO · ASISTENTE VIRTUAL NO
    'tiene_chat_activo': False, 'tiene_ia_chat': False, 'tiene_ia_voz': False,
    'tiene_integracion_api': False,
    # Sin capturar; se declara en notas en vez de afirmar que están al corriente.
    'tiene_pago_automatico': False, 'tiene_ticket_reincidente': False,
    'incidencias_pago': 0, 'tickets_abiertos': 0, 'dashboard_revisado': False,
    # Sin medición propia. health_score es GENERADA a partir de estos cuatro.
    'score_actividad': 50, 'score_adopcion': 50, 'score_pago': 50, 'score_relacional': 50,
}

print('\n=== LA CUENTA QUE SE DARIA DE ALTA ===')
for k, v in CUENTA.items():
    if isinstance(v, (list, dict)):
        print('  %-22s %d entrada(s)' % (k, len(v)))
    else:
        print('  %-22s %s' % (k, str(v)[:76].replace('\n', ' ⏎ ')))

if not APLICAR:
    print('\n  (diagnostico; no se escribio nada)')
    print('  Para aplicar:  python scripts/alta-cbs-compresores.py --aplicar')
    raise SystemExit(0)

print('\n=== DANDO DE ALTA ===')
res = rest('cuentas', 'POST', CUENTA)
assert len(res) == 1, 'se crearon %d filas y esperaba 1' % len(res)
print('  creada con id %s' % res[0]['id'])

print('\n=== COMPROBANDO, releyendo de la base ===')
f = rest('cuentas?cid=eq.%s&select=id,consecutivo,cid,empresa,asesor,estado,facturacion,'
         'health_score,servicio,activo_desde' % CID)
assert len(f) == 1, 'la busqueda por CID devuelve %d filas' % len(f)
c = f[0]
print('  %-18s %-5s CID %-8s %-8s %-9s $%-9s HS %s'
      % (c['empresa'], c['consecutivo'], c['cid'], c['estado'], c['asesor'],
         c['facturacion'], c['health_score']))
print('  servicio: %s · cliente desde %s' % (c['servicio'], c['activo_desde']))

todas = rest('cuentas?select=cid,consecutivo&limit=500')
cids = [norm(x['cid']) for x in todas if norm(x['cid'])]
cons = [str(x['consecutivo']).strip().upper() for x in todas if x.get('consecutivo')]
print('\n  cartera: %d cuentas (antes %d)' % (len(todas), len(cuentas)))
assert len(todas) == len(cuentas) + 1, 'el total no subio exactamente en 1'
assert len(cids) == len(set(cids)), 'hay CIDs duplicados'
assert len(cons) == len(set(cons)), 'hay consecutivos duplicados'
print('  sin CIDs ni consecutivos duplicados  OK')
print('\n  Alta correcta. CBS Compresores ya vive en el modulo Cuentas.')
print('  https://callpicker-cs.vercel.app/cuentas/%s' % c['id'])
