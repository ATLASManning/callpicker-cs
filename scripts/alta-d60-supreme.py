"""Alta de D60 — Supreme Resources México, por instrucción de dirección.

   Regla de la casa: lo verificado va como dato; lo que no se sabe se marca con
   palabras, no se rellena. Dirección fue explícita sobre esto en la ficha que
   entregó ("no voy a inventarlo" sobre los cargos), así que los siete
   empleados identificados van con su nivel de evidencia y SIN cargo inventado.

   De dónde sale cada cosa:
     · CID 31510, plan, monto y consumo → data/cortes-facturacion.xlsx (9 cortes)
     · 2 tickets, 0 fallas → lib/tickets-data.json
     · Meses activo, MRR y segmento → Zoho, vía la vista de LTV
     · Identidad fiscal, domicilios, giro y personas → ficha de dirección

   Los contacto_* quedan NULL a propósito: no tenemos una persona con nombre,
   cargo y correo. Poner ahí el conmutador general haría que el detector de
   huecos creyera que la cuenta tiene contacto cuando no lo tiene. El dato
   general no se pierde: vive en contactos_json con su nota.
"""
import sys, io, os, json, urllib.request
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
ESCRIBIR = '--escribir' in sys.argv

env = {}
for l in io.open(r'D:\Windows\Projects\callpicker-cs\.env.local', encoding='utf-8'):
    l = l.strip()
    if '=' in l and not l.startswith('#'):
        k, v = l.split('=', 1); env[k.strip()] = v.strip().strip('"')
URL = env['NEXT_PUBLIC_SUPABASE_URL']
KEY = env.get('SUPABASE_SERVICE_ROLE_KEY') or env['NEXT_PUBLIC_SUPABASE_ANON_KEY']
H = {'apikey': KEY, 'Authorization': 'Bearer ' + KEY, 'Content-Type': 'application/json'}


def rest(path, metodo='GET', cuerpo=None, extra=None):
    h = dict(H)
    if extra:
        h.update(extra)
    r = urllib.request.Request(URL + '/rest/v1/' + path,
                               data=json.dumps(cuerpo).encode() if cuerpo is not None else None,
                               headers=h, method=metodo)
    with urllib.request.urlopen(r, timeout=60) as x:
        t = x.read().decode()
    return json.loads(t) if t.strip() else None


OBS = """INTELIGENCIA DE CUENTA — SUPREME RESOURCES MÉXICO (actualizada 14 sep 2026)

QUÉ HACE REALMENTE. No es una empresa logística sin más: es distribuidor e
importador especializado + operador de cadena de suministro + proveedor de
químicos y materias primas. Importa desde plantas en Suiza, Bélgica y Gran
Bretaña, mantiene inventario local y distribuye en México y Centroamérica.

RELACIÓN ESTRATÉGICA. Distribuidor EXCLUSIVO de las moléculas aromáticas de
Givaudan para México y Centroamérica. Es el activo comercial más fuerte de la
cuenta y la razón por la que su operación pesa más que su tamaño.

MERCADOS QUE ATIENDE. Cuidado personal, resinas, adhesivos, construcción,
tintas, alimentos, farmacéutica, perfumería, cosmética, cuidado del hogar y
fragancias.

IDENTIDAD FISCAL (confianza alta). SUPREME RESOURCES MEXICO, S.A. DE C.V. ·
RFC SRM150506K25 · sector SAT: Productos Químicos · en el Padrón de
Importadores de Sectores Específicos, sector 1, desde el 29 oct 2018.

POR QUÉ IMPORTA PARA CALLPICKER. Su head count declarado (11–50 en LinkedIn)
subestima la complejidad: su propia bolsa de trabajo recibe candidatos para
almacén, atención a clientes, compras, contabilidad, facturación, calidad,
laboratorio de aplicaciones, mercadotecnia, planeación de demanda, RR.HH.,
sistemas, tesorería, tráfico y ventas. Comercio internacional, químicos
regulados, inventarios y dos sitios operativos. El potencial de comunicaciones
NO debe medirse por número de empleados.

LECTURA KAM. PYME especializada por head count, pero con complejidad
operacional superior a su tamaño. Y hoy consume 39 de 400 minutos incluidos
(9.75% en el corte de agosto): paga por una capacidad que su operación no está
usando. Esa es la conversación, y no es de recorte — es de por qué catorce
áreas distintas no están pasando por el conmutador.

LO QUE NO SE SABE Y NO SE INVENTÓ. El head count exacto no está publicado. De
las siete personas identificadas públicamente, LinkedIn no expone el cargo
actual de ninguna de forma fiable: van registradas con su evidencia y sin
puesto atribuido. Tampoco hay mapa de decisores ni se sabe quién autoriza el
gasto."""

NOTAS = """[FALTA_TC] Alta 14 sep 2026 por instrucción de dirección. Asesor: Dan.

DATOS QUE FALTAN Y POR QUÉ IMPORTAN — no se inventaron:
· CONTACTO PRINCIPAL con nombre, cargo y correo: SIN CAPTURAR. Hay siete
  personas identificadas públicamente (ver contactos_json) pero de ninguna se
  pudo confirmar el cargo actual. Sin un interlocutor con nombre, la cuenta
  depende de un conmutador general.
· MAPA DE DECISORES: SIN CAPTURAR. No se sabe quién autoriza el gasto ni quién
  puede cancelar el servicio.
· HEAD COUNT EXACTO: no publicado. LinkedIn declara el rango 11–50. No usar
  "20", "30" ni "40" como cifra.
· ACTIVO_DESDE: sin fecha capturada. Zoho reporta 77 meses activo al corte del
  17 ago 2026; `dias_como_cliente` se deriva de ahí y es aproximado.
· Los cuatro scores quedan en su valor por omisión (50) porque no hay medición
  propia todavía. El Health Score que muestre la ficha es ese default, no una
  evaluación.

LO QUE SÍ ESTÁ MEDIDO:
· CID 31510, confirmado contra los cortes de facturación y contra sus tickets.
· 9 cortes de facturación. Plan vigente «Visibilidad y Control 400 minutos»,
  $979/mes. Consumo: 12% en junio, 13.5% en julio, 9.75% en agosto.
· 2 tickets registrados, ninguno clasificado como falla.
· NO aparece en GRC ni en la lista de cancelados: sin señal de baja.
· NO viene en la lectura de llamadas, pese a que su consumo (<40%) debería
  haberla incluido en esa extracción. Es un hueco del archivo, no una cuenta
  sin llamadas: no afirmar nada sobre su tráfico."""

CONTACTOS = [
    {'nombre': 'Conmutador general', 'tel': '55 8854 4330',
     'email': 'info@supremeresources.com.mx',
     'nota': 'Línea y correo generales de la empresa, no de una persona. Verificados en supremeresources.com.mx.'},
    {'nombre': 'Eduardo Díaz Landa',      'nota': 'Empleado listado por Supreme Resources México. Cargo actual NO visible públicamente.'},
    {'nombre': 'Marielle Ruiz Olivera',   'nota': 'Supreme Resources México, CDMX. Cargo actual NO visible públicamente.'},
    {'nombre': 'Fernando Vidauri Díaz',   'nota': 'Empleado listado por Supreme Resources México. Cargo actual NO visible públicamente.'},
    {'nombre': 'Sandra Patricia de Paz Miguel',
     'nota': 'Aparece en el registro mercantil CDMX 2025 del establecimiento de Ana Bolena 63 B. Cargo NO confirmado.'},
    {'nombre': 'Juan Luis Scarpio',       'nota': 'Supreme Resources, área metropolitana CDMX. Perfil orientado a desarrollo de negocio; cargo exacto NO visible.'},
    {'nombre': 'Itzel CE',                'nota': 'Supreme Resources, CDMX. Cargo actual NO visible públicamente.'},
    {'nombre': 'Javier Martínez',         'nota': 'Supreme Resources México, CDMX. Perfil relacionado con Supply Chain; cargo exacto NO visible.'},
]

SERVICIOS = [
    {'nombre': 'Visibilidad y Control 400 minutos',
     'nota': 'Plan vigente según el corte del 17 ago 2026. $979/mes. Consumo 9.75% (39 de 400 minutos).'},
]

CUENTA = {
    'consecutivo': 'D60',
    'empresa': 'Supreme Resources México',
    'asesor': 'Dan',
    'cid': '31510',
    'estado': 'activo',
    'giro': 'Distribución e importación de materias primas y químicos especializados; operación de cadena de suministro. Distribuidor exclusivo de moléculas aromáticas Givaudan en México y Centroamérica.',
    'grupo_empresarial': 'SUPREME RESOURCES MEXICO, S.A. DE C.V. — RFC SRM150506K25',
    'direccion_fiscal': 'Ana Bolena No. 63, Interior B, Col. La Nopalera, Alcaldía Tláhuac, C.P. 13220, Ciudad de México',
    'pagina_web': 'https://supremeresources.com.mx',
    'num_oficinas': '2 sitios operativos confirmados públicamente: CDMX (sede, Ana Bolena 63-B, Tláhuac) y El Marqués, Querétaro (Carretera Estatal 431 Km 1, Nave 20 N, Conjunto Industrial PKCo, El Colorado, C.P. 76246). No hay evidencia pública de más oficinas.',
    'total_empleados': 'Rango 11–50 declarado en LinkedIn. Head count exacto NO publicado — no usar una cifra puntual.',
    'tamano_empresa': 'PYME especializada por head count, con complejidad operacional superior a su tamaño: comercio internacional, químicos regulados, inventarios y dos sitios.',
    'servicio': 'Visibilidad y Control 400 minutos — $979/mes (corte 17 ago 2026)',
    'servicios_json': SERVICIOS,
    'contactos_json': CONTACTOS,
    'observaciones_kam': OBS,
    'notas': NOTAS,
    # Zoho: 77 meses activo al 17 ago 2026. Derivado y aproximado — no hay
    # fecha de alta capturada, por eso activo_desde se queda en null.
    'dias_como_cliente': 2343,
    'dias_sin_actividad': 0,
    'pagos_al_corriente': True,
    'incidencias_pago': 0,
    # Sin medición propia todavía: se dejan los valores por omisión y se declara
    # en notas. Inventar un score sería peor que no tenerlo.
    'score_actividad': 50, 'score_adopcion': 50, 'score_pago': 50, 'score_relacional': 50,
    'tiene_chat_activo': False, 'tiene_ia_chat': False, 'tiene_ia_voz': False,
    'tiene_integracion_api': False, 'tiene_pago_automatico': False,
    'tiene_ticket_reincidente': False, 'dashboard_revisado': False,
    'tickets_abiertos': 0,
}

print('=== ALTA D60 — Supreme Resources México ===')
ya = rest('cuentas?select=id,consecutivo,empresa&or=(consecutivo.eq.D60,cid.eq.31510)')
if ya:
    print('  !! YA EXISTE: %s' % ya)
    raise SystemExit(1)
for k, v in CUENTA.items():
    if isinstance(v, (list, dict)):
        print('  %-22s %d entrada(s)' % (k, len(v)))
    else:
        print('  %-22s %s' % (k, str(v)[:74].replace('\n', ' ')))

if not ESCRIBIR:
    print()
    print('SIMULACION. Nada escrito. Correr con --escribir para dar de alta.')
    raise SystemExit(0)

nuevo = rest('cuentas', 'POST', CUENTA, {'Prefer': 'return=representation'})
print()
print('=== CREADA ===')
c = nuevo[0] if isinstance(nuevo, list) else nuevo
print('  id          : %s' % c['id'])
print('  consecutivo : %s' % c['consecutivo'])
print('  empresa     : %s' % c['empresa'])
print('  asesor      : %s' % c['asesor'])
print('  cid         : %s' % c['cid'])
print('  health_score: %s  (columna GENERATED: 0.35·act + 0.30·adop + 0.20·pago + 0.15·rel)' % c['health_score'])
print('  url         : https://callpicker-cs.vercel.app/cuentas/%s' % c['id'])
