# -*- coding: utf-8 -*-
"""
Alta de Universidad UniverMilenium (C69) como cuenta TOP, asesora Claudia.

Instruccion de direccion (10 oct 2026): alta como cuenta TOP con el consecutivo
que siga, asesor SAC Claudia Hernandez.

POR QUE C69
  El prefijo del consecutivo marca al asesor: C es Claudia (51 de 62), D es Dan
  (55 de 56), F es Fatima (53 de 62). El maximo vivo de C es C68, asi que el
  siguiente es C69. Hay huecos (52, 53, 55, 58, 59, 61, 64) de reasignaciones
  anteriores; NO se rellenan, se sigue la serie.

POR QUE ES TOP, MEDIDO Y NO AFIRMADO
  «TOP» no es una columna: lo deriva `topDeCartera()` con las 25 de mayor
  facturacion de la cartera. Con $18,514 esta cuenta queda en la POSICION 15 de
  192 cuentas vivas, y el corte del top 25 esta hoy en $15,404. O sea que entra
  por derecho propio y el tablero la marcara sola.

FUENTES DE LOS DATOS — cada dato trae la suya y no se mezclan
  1. Export Gross Revenue Facturacion (captura del 10 oct 2026): CID,
     clasificacion AAA, meses activo, MRR y acumulado.
  2. Tablero de Activaciones 2.0: ejecutivo, arranque de proceso, estatus.
  3. Zoho CRM: contacto, oportunidades, propietario, bitacora de notas.
  4. Ficha empresarial de inteligencia de cuenta (7 oct 2026): campus,
     domicilios, rector, perfil.
  5. PDF «Estimacion Automatizacion: Mejoras de Desarrollo UNIVER»
     (13 jul 2026): alcance, horas y riesgos de la Fase 2.
  6. Correo de Daniel Martinez a Claudia (7 oct 2026) reenviando la peticion de
     factura de Jose Galvan.

REGLA APLICADA: no se inventa ningun dato. Lo que no vino verificado se deja
vacio y se marca CON PALABRAS, para que el tablero lo pida en vez de que la IA
lo rellene. Ver [[feedback-contexto-ia-sin-huecos]].

Es idempotente: si C69 ya existe, actualiza en vez de duplicar. Verifica
primero con el simulacro (por defecto).

USO
    python scripts/alta-univer-milenium.py            # simulacro
    python scripts/alta-univer-milenium.py --aplicar  # escribe
"""
import io
import json
import os
import sys
import urllib.error
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DRY = '--aplicar' not in sys.argv

env = {}
for line in io.open(os.path.join(ROOT, '.env.local'), encoding='utf-8'):
    line = line.strip()
    if '=' in line and not line.startswith('#'):
        k, v = line.split('=', 1)
        env[k.strip()] = v.strip().strip('"')

URL = env['NEXT_PUBLIC_SUPABASE_URL']
KEY = env.get('SUPABASE_SERVICE_ROLE_KEY') or env['SUPABASE_SERVICE_KEY']
H = {'apikey': KEY, 'Authorization': 'Bearer ' + KEY,
     'Content-Type': 'application/json', 'Prefer': 'return=representation'}

CONSECUTIVO = 'C69'
CID = '178812'

# ── Contactos ────────────────────────────────────────────────────────────────
# Solo gente DEL CLIENTE. Los internos de Callpicker (Jose Galvan, Joaquin
# Martinez, Daniel Martinez) van en las observaciones, no aqui: este campo
# alimenta la ficha de contacto de la cuenta.
CONTACTOS = [
    {'nombre': 'Gustavo Rodriguez', 'cargo': 'Puesto SIN CAPTURAR — en Zoho el campo viene vacio',
     'tel': '55 8135 0956', 'email': 'cgrodriguez@univermilenium.edu.mx',
     'nota': 'ES EL CONTACTO QUE TRAJO LA CUENTA. Era supervisor en Estrella Blanca y '
             'nos recomendo en su nuevo trabajo (nota de Jose Galvan, 5 feb 2026). '
             'Interlocutor unico durante todo el ciclo: discovery, desarrollo Fase 1 y '
             'la validacion de HubSpot. Es un punto unico de falla — no hay un segundo '
             'contacto registrado en 8 meses de relacion.'},
    {'nombre': 'Agustin Alban', 'cargo': 'Rector de Universidad UniverMilenium',
     'tel': '', 'email': '',
     'nota': 'Mencionado en comunicacion institucional de 2026. NO se ha tenido contacto '
             'y no hay datos de contacto publicados. Se registra para que exista la via '
             'de escalamiento si la cuenta se complica.'},
    {'nombre': 'Paola Barcenas', 'cargo': 'Referidora (campo «Referer» del contacto en Zoho)',
     'tel': '', 'email': '',
     'nota': 'Figura como referidora de Gustavo Rodriguez en Zoho. NO esta confirmado si '
             'es personal de la universidad o externa: el campo no lo dice.'},
]

# ── Servicios ────────────────────────────────────────────────────────────────
# Lo que la FACTURA y las oportunidades cerradas dicen. No se infiere nada del
# patron de uso. Ver [[feedback-servicios-no-inferir]].
SERVICIOS = [
    {'nombre': 'Visibilidad y Control — 21 extensiones',
     'descripcion': 'Oportunidad «CP 178812 - 21 Extensiones VyC Univer Milenium», $14,469, '
                    'cerrada 11 ago 2026, fuente Upsale. Es el servicio recurrente vigente.'},
    {'nombre': 'Desarrollo Fase 1 — integracion HubSpot + Callpicker',
     'descripcion': 'Oportunidad «CP 178812 - Univer Milenium», $5,045, cerrada 28 abr 2026, '
                    'fuente Referencia. Motor automatico de marcacion contra HubSpot. '
                    'Pagado y entregado; de ahi arranca el recurrente.'},
    {'nombre': 'Desarrollo Fase 2 — COTIZADO, NO CONTRATADO',
     'descripcion': '48 horas por $55,100 MXN + IVA, 50% para iniciar y 50% al entregar. '
                    'Factura solicitada por Jose Galvan el 7 oct 2026. El PDF de estimacion '
                    '(13 jul 2026) estima 49 horas; el correo dice 48 «ya descontadas las '
                    'sesiones que se han tenido con ellos». NO confundir con el recurrente: '
                    'es un pago de proyecto, no MRR.'},
]

OBS_KAM = u"""INTELIGENCIA DE CUENTA — UNIVERSIDAD UNIVERMILENIUM (CID 178812)
Alta 10 oct 2026 por instruccion de direccion. Cuenta TOP, asesora Claudia.

— QUE ES
Institucion privada de educacion superior en el Estado de Mexico, fundada en
2004, con sede administrativa en Toluca. Siete campus fisicos en el directorio
oficial mas un Campus Online. Oferta presencial, ejecutiva y online.

— COMO LLEGA ESTA CUENTA
Por recomendacion personal. Gustavo Rodriguez era supervisor en Estrella Blanca,
cambio de trabajo y nos recomendo en la universidad (nota de Jose Galvan,
5 feb 2026). Es una cuenta de referido, no de prospeccion: el costo de perderla
incluye el capital de esa relacion.

— EL DATO QUE NO HAY QUE CONFUNDIR: CAMPUS vs COBERTURA
El directorio publica SIETE campus fisicos. El alcance del desarrollo nombra
TRES campanas por campus: Cuautitlan, Ecatepec y Rectoria. No son el mismo
numero y no deben mezclarse en ningun reporte. Cuantos de los siete campus
atiende Callpicker hoy NO esta verificado, y la diferencia es la oportunidad de
expansion mas concreta de la cuenta. Mismo patron que TATSA (D59).

— LOS SIETE CAMPUS DEL DIRECTORIO OFICIAL
  Toluca Rectoria — Ignacio Lopez Rayon 108, Centro, C.P. 50000 — 722 212 0595
  Toluca Av. Hidalgo — Av. Miguel Hidalgo 500, Col. 5 de Mayo, C.P. 50000 — 722 167 3030
  Toluca Ciencias de la Salud — Av. Miguel Hidalgo Ote. 805, C.P. 50070 — 722 167 9700
  Nezahualcoyotl — Av. Chimalhuacan 480, Col. Benito Juarez, C.P. 57000 — 55 5441 3864 / 3615 / 3664
  Ixtapaluca — Av. Acozac 11, Col. Santa Barbara, C.P. 56530 — 55 5972 7253 / 0726 / 5931
  Ecatepec — Camino Principal S/N, Santo Tomas Chiconautla, C.P. 55069 — 55 5931 6562 / 6563
  Cuautitlan — Av. Francisco I. Madero 28, C.C. Paseo la Joya, C.P. 54850 — 55 5870 6920 / 55 2611 4180 / 55 5870 6894
Atencion publicada: lunes a viernes 8:00-19:00, sabados 8:00-14:00.
Telefono y WhatsApp general: 56 1294 8457.

— LA HOMONIMIA, Y POR QUE AQUI YA NO ES UN RIESGO
La ficha de inteligencia advertia que existen instituciones de nombre parecido
(Universidad Millennium Internacional en Torreon, Centro Universitario Milenium
en Tehuacan) y que faltaba confirmar cual es la contratante. QUEDA RESUELTO por
dos vias que no dependen del nombre: el CID 178812, que es el que usan Zoho y
el export de facturacion, y el dominio del correo del contacto,
@univermilenium.edu.mx. La ambiguedad era del nombre, no del expediente.

— ESTA ES UNA CUENTA DE PRODUCTO A MEDIDA, NO DE TELEFONIA ESTANDAR
Es lo que la hace distinta del resto de la cartera y lo que define su riesgo.
Lo contratado no es solo VyC con 21 extensiones: es un MOTOR AUTOMATICO DE
MARCACION construido a medida sobre HubSpot. Dos consecuencias operativas:
  1. El valor percibido depende de que el desarrollo funcione, no de que la
     linea timbre. Una caida del marcador es una caida del servicio entero.
  2. La cuenta tiene dependencia tecnica de DOS plataformas de terceros
     —HubSpot y Google Sheets— que Callpicker no controla.

— FASE 2: QUE SE COTIZO Y QUE RIESGOS TRAE (PDF del 13 jul 2026)
Objetivo: gestion multi-campanas por campus, rediseno del marcador visual en
HubSpot con teclado numerico, e inversion de la logica del flujo para validar
la respuesta del usuario (filtrando buzones) antes de conectar al asesor.

DENTRO del alcance:
  - Modulo Multicampanas en Google Sheets: hasta 3 campanas simultaneas el mismo
    dia, segmentando por campus (Cuautitlan, Ecatepec, Rectoria).
  - Bitacora extendida: hora de primer contacto, tasa de contactacion, llamadas
    efectivas y tiempos de espera, por campana y por asesor.
  - Nueva UI/UX de transferencia en HubSpot: boton Transferir, extension de
    destino, selector Ciega/Asistida.
  - Transferencia WebRTC asistida y ciega (*2 + ext) por inyeccion de tonos DTMF.
  - Migracion de la propiedad del Sheets de control a la cuenta de Google
    institucional de UNIVER.
FUERA del alcance:
  - Cambio de asignacion de llamada (inversion de legs): se queda como esta.
  - Cualquier cambio visual de HubSpot ajeno al modulo de transferencia.

Plan: diseno 8 h, desarrollo 26 h, depuracion 12 h, migracion 3 h = 49 h en dos
semanas. El correo factura 48 h por $55,100 + IVA, 50/50.

LOS DOS RIESGOS QUE EL PROVEEDOR YA DECLARO — vigilar, no descubrir:
  1. Limites de concurrencia de la API de Google Sheets. Si el numero de
     asesores simultaneos escala de golpe, hay riesgo de latencias o bloqueos
     por cuota de Google. Es un techo que no depende de nosotros.
  2. Estabilidad de la sesion WebRTC. La inyeccion de tonos para transferir
     depende de que el socket se mantenga con latencia optima; un microcorte en
     el internet del asesor puede truncar la rafaga y producir transferencias
     fallidas. Esto va a aparecer como queja de usuario antes que como ticket
     de plataforma.
Prerrequisitos que el cliente debe entregar: documento de requerimientos y
acceso a ambiente de pruebas en HubSpot. Si no llegan, la fecha se mueve.

— EL CICLO COMERCIAL, EN CORTO (bitacora de Zoho, feb-ago 2026)
  5 feb    Entra por recomendacion. Sector educativo. Demo.
  10 feb   Contentos con la plataforma; piden integracion a medida con HubSpot.
           Se extiende demo al 20 feb.
  17-24 feb Tres notas seguidas «pendientes para programar Sesion Discovery».
  25 feb   Se paga la Sesion Discovery.
  5 mar    En espera de acceso a HubSpot para terminar la estimacion.
  13 mar   Se comparte estimacion.
  20 mar   Se actualiza la propuesta por funcionalidad Callcenter y proyeccion
           de 5, 15 y 25 usuarios.
  25 mar   Pagan el desarrollo. Pendiente definir si arrancan con 5 o mas usuarios.
  7-22 abr Facturacion y espera de pago; desarrollo en etapa final.
  28 abr   CIERRE de la primera oportunidad, $5,045.
  7 may    Conversacion en CP Chat.
  14 jul - 12 ago  Seis notas consecutivas de «en espera de confirmar pago».
  11 ago   CIERRE de la segunda oportunidad, 21 extensiones VyC, $14,469.
  25 ago   Cotejo de cuenta: factura del 1 jul 2026 localizada.

— LA SENAL QUE HAY QUE MIRAR: LA COBRANZA
Entre el 14 de julio y el 12 de agosto hay SEIS notas consecutivas de «en
espera de confirmar pago» sobre la misma oportunidad. No es un retraso puntual,
es un patron de un mes. Y la Fase 2 se cotiza con 50% por adelantado. Antes de
comprometer agenda de desarrollo conviene confirmar que el anticipo entro: el
historial dice que el cobro en esta cuenta tarda.

— QUIEN ES QUIEN DEL LADO CALLPICKER
  Jose Galvan — Asesor Tecnologico Sr., propietario de la cuenta y de las dos
    oportunidades en Zoho. Es quien lleva la relacion comercial y quien pidio la
    factura de la Fase 2.
  Joaquin Martinez — registra los cotejos de cuenta y los enlaces de CP Chat.
  Ricardo — ejecutivo en el Tablero de Activaciones 2.0.
  Daniel Martinez — reenvia el proyecto a Claudia el 7 oct 2026 pidiendole que
    lo estudie «para entender el objetivo y validar en el futuro sobre el
    alcance». Ese correo es el origen de esta alta.

— OPORTUNIDAD DE EXPANSION, CON SU CONDICIONAL
La propuesta de marzo ya se actualizo para funcionalidad Callcenter con
proyeccion de 5, 15 y 25 usuarios, y hoy operan 21 extensiones. Los cuatro
campus del directorio que NO aparecen en el alcance del desarrollo
(Av. Hidalgo, Ciencias de la Salud, Nezahualcoyotl, Ixtapaluca) son el camino
natural de crecimiento. CONDICIONAL: primero hay que verificar cuales atiende
Callpicker hoy — ese dato no lo tenemos."""

NOTAS = u"""[ALTA 10 oct 2026] Cuenta TOP C69, asesora Claudia, por instruccion de direccion.

CLASIFICACION AAA segun el export de Gross Revenue Facturacion. No hay columna
para eso en `cuentas`; queda aqui escrito.

CIFRAS DEL EXPORT DE FACTURACION, con su etiqueta exacta — no se mezclan:
  MRR Inicio Contrato (BCY)      $18,514
  Importe Acumulado Recurrente   $88,591
  Meses Activo                   7
  Movimiento MRR                 estable
  Rango MRR Fin Contrato         $10,001 - $20,000
  Ingreso Perdido Contrato Real  $0

DISCREPANCIA QUE HAY QUE ACLARAR, NO PROMEDIAR:
$88,591 entre 7 meses da $12,656 al mes, que NO es el MRR de inicio de $18,514.
Puede ser que el recurrente arrancara mas bajo y subiera con el upsale de
agosto, o que el acumulado no cubra los 7 meses completos. El campo
`facturacion` se sembro con los $18,514 del export por ser la unica cifra
etiquetada como MRR; la cifra que mande es la del cruce vivo de GRC por CID,
que es la fuente unica. Revisar en el proximo corte.
Ver [[feedback-metricas-derivadas-origen]] y [[grc-fuente-zoho]].

FECHA DE INICIO: se usa 2026-04-28, el cierre de la primera oportunidad, porque
cuadra con los 7 meses activos del export (abr-oct). NO se uso el 2026-02-05
del Tablero de Activaciones: esa es la apertura del ticket y el arranque del
proceso comercial, no el inicio del cobro.

DATOS QUE FALTAN Y POR QUE IMPORTAN — no se inventaron:
- PUESTO de Gustavo Rodriguez: SIN CAPTURAR. En Zoho los campos «Titulo» y
  «Puesto» vienen vacios. Sin el no sabemos si tiene facultad de compra, y es
  el unico contacto de la cuenta.
- SEGUNDO CONTACTO: NO EXISTE. Ocho meses de relacion con un solo interlocutor.
  Es el riesgo mas accionable de la cuenta y la primera tarea de Claudia.
- RFC y razon social: SIN CAPTURAR. No se inventan.
- CUANTOS DE LOS 7 CAMPUS ATIENDE CALLPICKER: SIN VERIFICAR. El desarrollo
  nombra 3 (Cuautitlan, Ecatepec, Rectoria); el directorio publica 7.
- TAMANO DE EMPRESA: hay tres cifras que no coinciden y ninguna es del cliente.
  Zoho (DENUE) dice «Empresa grande, 151-250»; LinkedIn institucional dice
  201-500; el Tablero de Activaciones trae «-». DENUE ademas devuelve un tamano
  distinto por plantel, de microempresa a corporativo. Se registra el rango con
  su fuente y no se elige uno a dedo.
- MATRICULA ACTIVA: no verificada publicamente.
- LLAMADAS: esta cuenta NO viene en las extracciones de llamadas (corte
  2026-09-14), asi que su modulo de Atencion de llamadas saldra «SIN LECTURA».
  No es que no tenga trafico: es que no se ha medido. Entra en la lista de
  cuentas a las que hay que pedir el Excel.
- DIDs: sin verificar cuales numeros del directorio pasan por Callpicker.

Health Score en 50 por omision: es el neutro del sistema para una cuenta sin
historial medido en el tablero, no una evaluacion."""

FILA = {
    'consecutivo':       CONSECUTIVO,
    'empresa':           'Universidad UniverMilenium',
    'grupo_empresarial': 'Alias en Zoho CRM: «Univer Milenium». Razon social y RFC SIN CAPTURAR.',
    'asesor':            'Claudia',
    'estado':            'activo',
    'cid':               CID,
    'facturacion':       18514,
    'activo_desde':      '2026-04-28',
    'giro':              'Educacion superior privada. Universidad multicampus en el Estado de '
                         'Mexico con oferta presencial, ejecutiva y online.',
    'servicio':          'Visibilidad y Control — 21 extensiones + motor automatico de marcacion '
                         'a medida integrado con HubSpot (Fase 1 entregada; Fase 2 cotizada)',
    'tamano_empresa':    'Entre 151 y 500 personas — las fuentes NO coinciden: Zoho/DENUE dice '
                         '«Empresa grande, 151-250», LinkedIn institucional dice 201-500, y el '
                         'Tablero de Activaciones trae «-». Sin cifra del propio cliente.',
    'num_oficinas':      '7 campus fisicos + 1 Campus Online segun el directorio oficial. '
                         'Callpicker aparece en 3 (Cuautitlan, Ecatepec, Rectoria) segun el '
                         'alcance del desarrollo. NO son el mismo numero.',
    'total_empleados':   '201-500 segun el perfil institucional de LinkedIn. Sin cifra '
                         'corporativa confirmada ni matricula verificada.',
    'pagina_web':        'https://univermilenium.edu.mx',
    'direccion_fiscal':  'Rectoria: Ignacio Lopez Rayon 108, Col. Centro, Toluca, Estado de '
                         'Mexico, C.P. 50000. Domicilio FISCAL sin confirmar — este es el '
                         'administrativo publicado.',
    'contacto_nombre':   'Gustavo Rodriguez',
    'contacto_cargo':    None,
    'contacto_tel':      '55 8135 0956',
    'contacto_email':    'cgrodriguez@univermilenium.edu.mx',
    'contactos_json':    CONTACTOS,
    'servicios_json':    SERVICIOS,
    'zoho_link':         'https://crm.zoho.com/crm/org5406171/tab/Accounts/346103000187586011',
    'tiene_integracion_api': True,
    'upsell_producto':   'Fase 2 del motor de marcacion: 48 h por $55,100 + IVA, 50/50. '
                         'Factura solicitada el 7 oct 2026, anticipo por confirmar.',
    'crossell_producto': 'Los 4 campus del directorio que NO aparecen en el alcance del '
                         'desarrollo (Av. Hidalgo, Ciencias de la Salud, Nezahualcoyotl, '
                         'Ixtapaluca) + funcionalidad Callcenter ya propuesta en marzo con '
                         'proyeccion de 5, 15 y 25 usuarios.',
    'observaciones_kam': OBS_KAM,
    'notas':             NOTAS,
    'score_actividad':   50,
    'score_adopcion':    50,
    'score_pago':        50,
    'score_relacional':  50,
}


def req(method, path, body=None):
    r = urllib.request.Request(URL + '/rest/v1/' + path, method=method, headers=H,
                               data=json.dumps(body).encode() if body is not None else None)
    try:
        with urllib.request.urlopen(r, timeout=90) as x:
            raw = x.read().decode('utf-8', 'replace')
            return x.status, (json.loads(raw) if raw.strip() else None)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8', 'replace')


# ── Comprobaciones ANTES de escribir ────────────────────────────────────────
st, ya = req('GET', 'cuentas?select=id,consecutivo,empresa,asesor,estado&consecutivo=eq.' + CONSECUTIVO)
existe = isinstance(ya, list) and len(ya) > 0
st2, porcid = req('GET', 'cuentas?select=id,consecutivo,empresa&cid=eq.' + CID)
dup_cid = isinstance(porcid, list) and len(porcid) > 0

print(u'=== ALTA UNIVERSIDAD UNIVERMILENIUM (%s) ===' % CONSECUTIVO)
print(u'  consecutivo libre : %s' % (u'NO — ya existe %s' % ya if existe else u'si'))
print(u'  CID %s libre      : %s' % (CID, u'NO — ya esta en %s' % porcid if dup_cid else u'si'))
for k in ('empresa', 'asesor', 'estado', 'cid', 'facturacion', 'activo_desde',
          'contacto_nombre', 'contacto_email', 'contacto_tel'):
    print(u'  %-18s %s' % (k, FILA[k]))
print(u'  %-18s %d' % ('contactos_json', len(CONTACTOS)))
print(u'  %-18s %d' % ('servicios_json', len(SERVICIOS)))
print(u'  %-18s %d caracteres' % ('observaciones_kam', len(OBS_KAM)))
print(u'  %-18s %d caracteres' % ('notas', len(NOTAS)))

# Ninguna columna inventada: se comprueba contra el esquema real.
st3, muestra = req('GET', 'cuentas?select=*&limit=1')
if isinstance(muestra, list) and muestra:
    reales = set(muestra[0].keys())
    sobran = [k for k in FILA if k not in reales]
    if sobran:
        print(u'\n  *** COLUMNAS QUE NO EXISTEN EN LA TABLA: %s' % ', '.join(sobran))
        raise SystemExit(1)
    print(u'\n  las %d columnas que se escriben existen en la tabla.' % len(FILA))

if dup_cid and not existe:
    print(u'\n  *** EL CID YA ESTA EN OTRA CUENTA. Se detiene: duplicar un CID')
    print(u'      rompe el cruce con facturacion y tickets.')
    raise SystemExit(1)

if DRY:
    print(u'\nSIMULACRO. Ejecuta con --aplicar para escribir.')
    raise SystemExit(0)

if existe:
    st, out = req('PATCH', 'cuentas?consecutivo=eq.' + CONSECUTIVO, FILA)
    print(u'\nPATCH -> HTTP %s' % st)
else:
    st, out = req('POST', 'cuentas', FILA)
    print(u'\nPOST -> HTTP %s' % st)

if st not in (200, 201):
    print(out)
    raise SystemExit(1)

fila = out[0] if isinstance(out, list) and out else out
print(u'id           : %s' % fila.get('id'))
print(u'consecutivo  : %s' % fila.get('consecutivo'))
print(u'health_score : %s  (columna generada)' % fila.get('health_score'))
print(u'\nOK. Falta capturar: puesto de Gustavo Rodriguez, un SEGUNDO contacto,')
print(u'RFC y razon social, cuantos de los 7 campus atiende Callpicker, y el')
print(u'Excel de llamadas (esta cuenta no viene en las extracciones).')
