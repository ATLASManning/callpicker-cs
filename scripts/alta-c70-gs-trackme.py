# -*- coding: utf-8 -*-
"""
Alta de GS Trackme (C70), asesor Erick.

Instruccion de direccion (28 oct 2026): construir la cuenta, asesor asignado
Erick Sanchez, con el consecutivo que sigue.

POR QUE C70
  El prefijo del consecutivo marca a quien la dio de alta. Erick lleva hoy 71
  cuentas y 52 de ellas son `C` — las que heredo de Claudia. El maximo vivo del
  prefijo C es C69 (UniverMilenium, 10 oct 2026), asi que el que sigue es C70.
  Hay huecos en la serie C y NO se rellenan. Ver [[altas-cuentas]].

NO ES TOP, Y ESO SE MIDIO
  «TOP» no es una columna: lo deriva `topDeCartera()` con las 25 de mayor
  importe de la cartera viva. Con $2,488 esta cuenta cae en la POSICION 160 de
  194, y el corte del top 25 esta hoy en $16,245. No entra, y no se le pone.

FUENTES — cada dato trae la suya y no se mezclan
  1. Export Gross Revenue Facturacion (captura del 28 oct 2026): clasificacion
     AA, 71 Meses Activo, $233,214 acumulados, MRR $2,488, «MRR estable».
  2. Mensaje de Daniel Martinez a Erick (28 oct 2026, 11:57): el desglose de lo
     contratado, linea por linea.
  3. Zoho CRM — Posible cliente «Enrique Gomez» y Oportunidad «CP 56655 GS
     Trackme SA de CV»: contacto, cierre, y 60+ notas de pagos y llamadas.
  4. Zoho Desk — ticket #118633 (28 oct 2026) y la fuente de tickets cerrados.
  5. `data/dids.json`, por CID.
  6. gstrackme.com, el sitio del propio cliente, consultado el 28 oct 2026.

EL SUJETO ES EL CLIENTE, no su grupo (instruccion de direccion, 28 oct 2026).
Lo que se escribe aqui es de GS Trackme: lo que contrata, lo que paga, quien
escribe y que nos pidio. No se perfila al corporativo ni a sus hermanas.

REGLA APLICADA: no se inventa ningun dato. Lo que no vino verificado se deja
vacio y se marca CON PALABRAS. Y donde dos fuentes dan cifras distintas se
registran LAS DOS con su etiqueta. Ver [[feedback-contexto-ia-sin-huecos]] y
[[feedback-metricas-derivadas-origen]].

Es idempotente: si C70 ya existe, actualiza en vez de duplicar.

USO
    python scripts/alta-c70-gs-trackme.py            # simulacro
    python scripts/alta-c70-gs-trackme.py --aplicar  # escribe
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

CONSECUTIVO = 'C70'
CID = '56655'

# ── Contactos ────────────────────────────────────────────────────────────────
# Solo gente DEL CLIENTE. Daniel Martinez y Alexis G. son de Callpicker y van
# en las observaciones.
CONTACTOS = [
    {'nombre': 'Enrique Gomez', 'cargo': 'SIN CAPTURAR — en Zoho los campos de puesto vienen vacios',
     'tel': '999 331 7133', 'email': 'egomez@gruposisprovisa.com',
     'nota': 'ES EL CONTACTO DE ORIGEN. Figura como «Persona de contacto» de la '
             'oportunidad que cerro el 11 nov 2020 y aparece en toda la bitacora '
             'de Zoho desde octubre de 2020. Segundo telefono registrado: '
             '999 700 3334. En 2020 el vendedor anoto que «le marque a su director '
             'comercial» — o sea que hay un director comercial que NO esta '
             'capturado. Durante casi seis anos fue el unico interlocutor.'},
    {'nombre': 'Ian Abdala Iza', 'cargo': 'Gerente Comercial',
     'tel': '999 333 3036', 'email': 'iabdala@gruposisprovisa.com',
     'nota': 'SEGUNDO INTERLOCUTOR, aparecio el 28 oct 2026 abriendo el ticket '
             '#118633 desde la cuenta de Zoho Desk «56655 - Trackme». Es quien '
             'pide hacer llamadas de Mexico a Espana con el numero de Barcelona. '
             'Datos tomados de su firma de correo. Es la primera vez en el '
             'expediente que escribe alguien distinto de Enrique Gomez.'},
]

SERVICIOS = [
    {'nombre': '3 Extensiones Visibilidad y Control IL', 'descripcion':
     '$2,189 al mes. Desglose de Daniel Martinez (28 oct 2026). «IL» = '
     'ilimitadas: por eso el Informe de Cortes no les saca una bolsa de minutos.'},
    {'nombre': 'DID Nacional 9994540582', 'descripcion':
     '$99 al mes. Numero de Merida. Desglose de Daniel Martinez (28 oct 2026).'},
    {'nombre': 'DID Internacional Barcelona', 'descripcion':
     '$200 al mes. En `data/dids.json` el numero de Espana del CID es el '
     '34930523603 (+34 93 = Barcelona). Desglose de Daniel Martinez (28 oct 2026).'},
]

OBS_KAM = u"""[ALTA 28 oct 2026 · Erick] GS TRACKME — CID 56655.

— QUE ES Y QUE NOS PAGA
GS Trackme da rastreo satelital GPS para flotillas y maquinaria desde Merida.
Con nosotros tiene TRES extensiones Visibilidad y Control ilimitadas, un DID
nacional y un DID de Barcelona: $2,488 + IVA al mes. Es cliente desde el 11 de
noviembre de 2020 — setenta y un meses — y paga puntual todos los meses.

— PAGA TRES EXTENSIONES Y NO LLAMA: ESTO ES LO PRIMERO
Nueve cortes medidos de enero a octubre de 2026 (falta agosto). La bolsa son
4,500 minutos al mes y el consumo fue 0, 0, 0, 3, 0, 0, 26, 23 y 55 minutos.
El mes mas alto es el 1.2% del plan. Son extensiones ILIMITADAS, asi que no hay
excedente que cobrarle ni rebase que avisarle: lo que hay es un cliente que
paga $2,189 al mes por capacidad de voz que no ocupa. Al panel SI entra —31
visitas en el periodo, con perfil «entrantes» en abril, septiembre y octubre—,
o sea que mira el servicio y no lo usa para llamar.
Medido con `scripts/mide-cortes-cuenta.py 56655`.

— LA SENAL QUE HAY QUE MIRAR PRIMERO: YA HUBO UN TICKET DE CANCELACION
El 11 de agosto de 2026 se abrio el ticket #112819, subcategoria
«Cancelacion (voz)», propietario Fatima G., cerrado el 20 de agosto tras 226
horas. Nadie en el expediente dice que se cancelara nada, y la cuenta sigue
facturando — pero una peticion de cancelacion a dos meses y medio no se hereda
en silencio. HAY QUE LEER ESE TICKET antes de la primera llamada.

Y no esta solo. El export de facturacion trae DOS filas a nombre del cliente:
  «GS Trackme»              AA · 71 meses · $2,488 · MRR estable
  «GS Trackme - Sercurezza»  B · 58 meses · $0 · movimiento «Desactivado»
La segunda acumulo $32,337 en su vida y hoy esta en cero, sin registrarse como
perdida. Es una linea del cliente que ya se apago. Eso, mas el ticket de
cancelacion de agosto, hace que esta cuenta no se trate como una cuenta
tranquila de $2,488.

— LA OPORTUNIDAD ESTA ABIERTA HOY, CON FOLIO
Ticket #118633, 28 oct 2026, propietario Alexis G., en espera. Ian Abdala
(Gerente Comercial) escribe: «me gustaria hacer llamadas desde Mexico a Espana
desde mi numero que adquirimos de Espana. Me gustaria que se contacten conmigo
para ver el tema de costos.» Hay un adjunto de Tarifas Internacionales.
Es una peticion de SALIENTES INTERNACIONALES sobre un DID que ya nos pagan.

Y no es nueva. En marzo de 2026 el cliente ya habia preguntado por CP Chat:
«tienen el servicio para recibir llamadas en Barcelona?» y «cuanto me costaria
otra linea». Siete meses despues vuelve la misma necesidad, ahora con el numero
ya contratado y pagandolo. La peticion es real y lleva siete meses esperando.

— TRES DIDs EN EL ARCHIVO, DOS EN LA FACTURA
`data/dids.json` da tres numeros al CID 56655: 529994540582 («Available»),
529994541949 («Merida») y 34930523603 («Available», Barcelona). El desglose de
Daniel nombra DOS: el nacional 9994540582 y el internacional de Barcelona. El
529994541949 no aparece en el desglose. No se concluye nada: puede ser un
numero incluido, uno heredado de la demo de 2020, o uno sin facturar. Es una
pregunta para administracion, y cuesta un correo.

— QUIEN ES QUIEN DEL LADO CALLPICKER
  Daniel Martinez — arma el desglose de lo contratado y lo pasa a Erick el
    28 oct 2026. Ese mensaje es el origen de esta alta.
  Alexis G. — propietario del ticket abierto #118633.
  Fatima G. — propietaria del ticket de cancelacion #112819 (agosto).
  Ignacio Rugerio — vendedor que cerro la cuenta en noviembre de 2020.
  Joaquin Martinez — registra los cotejos de pago y los enlaces de CP Chat.

— EL HISTORIAL DE PAGO ES EL ACTIVO DE ESTA CUENTA
Seis anos de pagos mensuales aprobados sin interrupcion en la bitacora de Zoho,
de enero de 2021 a octubre de 2026, metodo STP. El importe fue subiendo con el
servicio: $7,686.16 en 2021-2022, $2,539.24 de 2022 a 2023, $2,654.08 de 2023 a
marzo de 2026, y $2,886.08 desde mayo de 2026 — que es exactamente $2,488 + IVA.
El salto de marzo a mayo cuadra con el alta del DID de Barcelona.

— COMO SE LEE ESTA CUENTA, EN UNA FRASE
Paga puntual desde hace setenta y un meses y no usa el servicio: 1.2% de la
bolsa en su mejor mes. Las dos cosas a la vez. Un pago puntual no es lealtad
cuando lo que se paga no se ocupa — es un renglon esperando la proxima revision
de gastos, y ya hubo un ticket de cancelacion en agosto. Lo que la sostiene es
la peticion ABIERTA del DID de Barcelona: es la unica cosa de esta cuenta para
la que el cliente dice que si tiene un uso. Ahi esta la conversacion."""

NOTAS = u"""[ALTA 28 oct 2026] C70, asesor Erick, por instruccion de direccion.

CONSECUTIVO: el maximo del prefijo C es C69, asi que sigue C70. Erick lleva 52
cuentas con prefijo C (las de Claudia), 15 Z, 3 F y 1 D.

NO ES TOP Y SE MIDIO: con $2,488 cae en el lugar 160 de 194 cuentas vivas. El
corte del top 25 esta en $16,245. «TOP» se deriva, no se escribe.

CLASIFICACION AA segun el export de Gross Revenue Facturacion. No hay columna
para eso en `cuentas`; queda aqui escrito.

CIFRAS DEL EXPORT, con su etiqueta exacta — no se mezclan:
  MRR Inicio Contrato (BCY)      $2,488
  MRR Fin Contrato (BCY)         $2,488
  Importe Acumulado Recurrente   $233,213.84
  Meses Activo                   71
  Facturas_2026                  10
  Movimiento MRR                 MRR estable
  Rango MRR Fin Contrato         $1,001 - $3,000
  Ingreso Perdido Contrato Real  $0

TRES FUENTES INDEPENDIENTES DAN LA MISMA CIFRA, que es la razon por la que
`facturacion` se siembra con 2488 y no con otra cosa:
  1. El export: `mrrFin` = 2,488.
  2. El desglose de Daniel Martinez: 2,189 + 99 + 200 = 2,488.
  3. Los pagos de Zoho desde mayo 2026: $2,886.08 = 2,488 x 1.16 (IVA).
No hay discrepancia que resolver en el dinero de esta cuenta.

*** LA FILA DEL EXPORT NO TRAE CID ***
Las dos filas de este cliente en `data/grc-zoho.json` tienen `cid: null`. Como
`importeDeCuenta` cruza por CID y cae a la ficha cuando no lo encuentra, el
importe de esta cuenta lo va a mandar `cuentas.facturacion` — o sea este alta —
y NO el cruce vivo del GRC. Es el mismo problema que GTC. Mientras el CID no se
cargue en el export, esta cifra hay que revisarla a mano en cada corte.
Ver [[grc-fuente-zoho]] y [[grupo-gtc-torres-corzo]].

LA SEGUNDA LINEA DEL CLIENTE, que NO se suma a esta cuenta:
«GS Trackme - Sercurezza», clasificacion B, 58 Meses Activo, $32,337.18
acumulados, MRR 0, movimiento «Desactivado», 6 facturas. Es una linea apagada
del mismo cliente. No se integra aqui porque es otra razon social y otro
movimiento; se deja escrito porque cambia como se lee el riesgo de la cuenta.

FECHA DE INICIO: 2020-11-11, el cierre de la oportunidad «CP 56655 GS Trackme
SA de CV» en fase «Contrato Firmado - Cierre Logrado». Cuadra con los 71 Meses
Activo del export: de noviembre de 2020 a octubre de 2026 son 71 meses exactos.

*** CORRECCION DEL MISMO DIA: EL CONSUMO SI SE MIDE, Y ES CASI CERO ***
La primera version de esta nota decia que el CID 56655 no aparecia en
`data/cortes-facturacion.xlsx` y que la cuenta abriria `sin_consumo_medible`.
ERA FALSO, y se desmintio corriendo `scripts/mide-cortes-cuenta.py 56655`
antes de dar el alta por terminada. La realidad medida:

  NUEVE cortes, de 2026-01 a 2026-10 (falta agosto), los nueve MEDIBLES.
  Base 4,500 minutos al mes = 3 extensiones x 1,500, derivada del nombre del
  plan. Minutos consumidos por mes: 0, 0, 0, 3, 0, 0, 26, 23, 55.
  El maximo de los NUEVE meses es el 1.2% de la bolsa.
  Monto en el corte: $2,189 — las extensiones solas, sin los DIDs.

  La alerta en pantalla dice «nunca paso del 1% de su plan en 5 meses» y esta
  nota dice 1.2% en nueve. NO SE CONTRADICEN: el detector mira los ULTIMOS
  CINCO cortes y esta nota mira la serie entera. Cada cifra con su ventana.

Por eso el motor NO abre ceguera de medicion: abre `uso_bajo` («Paga mucho
mas de lo que usa»), y tiene razon. Son extensiones ILIMITADAS, de modo que
el cliente no esta rebasando nada ni pagando excedentes: esta pagando $2,189
al mes por capacidad de voz que practicamente no ocupa. Leido junto al ticket
de cancelacion de agosto y a la linea Sercurezza ya apagada, ES LA SENAL MAS
FUERTE DE LA CUENTA. Y falta justo el corte de agosto de 2026, el mes del
ticket de cancelacion: se deja dicho, no se concluye nada de un hueco.

Lo que SI usa es el panel: 31 visitas en el periodo, y el perfil de uso sale
«entrantes» en abril, septiembre y octubre. Entra a ver, no a llamar.

QUE VA A SALIR VACIO EN EL TABLERO Y POR QUE — no es cero, es que no se ha medido:
- LLAMADAS: `tieneLlamadas` sale falso y el motor lo dice con palabras («No
  hay lectura de sus llamadas»). El modulo de atencion va a salir SIN LECTURA
  hasta que se pida el Excel. Ojo: esto NO contradice los 9 cortes de arriba,
  son DOS fuentes distintas ([[llamadas-fuente]]).
- TICKETS: la fuente solo trae CERRADOS, asi que «tickets abiertos» es NO
  MEDIBLE. El #118633 abierto HOY no va a aparecer en ninguna cifra.
  Ver [[tickets-fuente]].

DATOS QUE FALTAN Y NO SE INVENTARON:
- PUESTO de Enrique Gomez: SIN CAPTURAR. En Zoho los campos de titulo y puesto
  vienen vacios despues de seis anos de relacion.
- EL DIRECTOR COMERCIAL que menciona la nota del 12 oct 2020 («le marque a su
  director comercial») no esta identificado. Puede ser Ian Abdala, puede no
  serlo. No se asume.
- RFC: SIN CAPTURAR. La razon social que trae el CRM es «GS Trackme SA de CV»
  y es la que se usa aqui. El RFC nunca se pidio.
- CODIGO POSTAL: la firma de correo de Ian Abdala dice C.P. 97130 y es la que
  se registra, por venir del propio cliente. Una fuente corporativa consultada
  el 28 oct 2026 daba 97138 — se deja dicho para que nadie lo vuelva a
  descubrir, pero el domicilio FISCAL sigue sin confirmar con el cliente.
- TAMANO DE EMPRESA Y PLANTILLA: SIN CAPTURAR. No hay ninguna cifra que venga
  del cliente. Lo unico declarado por el son los «3 turnos, 1 linea y 3
  extensiones» de 2020, y hoy sigue en 3 extensiones. Se pregunta, no se deduce.
- CUANTAS SEDES PASAN POR CALLPICKER: solo se sabe que hay numeros en Merida y
  en Barcelona. Cuantos sitios opera y cuales tienen telefonia nuestra, sin
  medir.

Los `score_*` van en 50: es el neutro del sistema para una cuenta sin historial
medido en el tablero, no una evaluacion."""

FILA = {
    'consecutivo':       CONSECUTIVO,
    'empresa':           'GS Trackme',
    'grupo_empresarial': 'Grupo Sisprovisa. Razon social: «GS Trackme SA de CV» (Zoho CRM).',
    'asesor':            'Erick',
    'estado':            'activo',
    'cid':               CID,
    'facturacion':       2488,
    'activo_desde':      '2020-11-11',
    'giro':              'Rastreo satelital GPS para flotillas y maquinaria: camaras con IA, '
                         'geocercas, reportes historicos, sensores de combustible y temperatura.',
    'servicio':          '3 Extensiones Visibilidad y Control IL + DID Nacional 9994540582 + '
                         'DID Internacional Barcelona = $2,488 + IVA',
    'tamano_empresa':    'SIN CAPTURAR. En 2020 el cliente declaro «3 turnos, 1 linea y 3 '
                         'extensiones»; hoy sigue en 3 extensiones. No hay cifra de plantilla.',
    'num_oficinas':      'SIN VERIFICAR. Con nosotros tiene numeros en Merida y en Barcelona; '
                         'cuantas sedes opera y cuales pasan por Callpicker no esta medido.',
    'total_empleados':   'SIN CAPTURAR. No se pidio al cliente.',
    'pagina_web':        'https://gstrackme.com/es-mx/',
    'direccion_fiscal':  'Calle 20 #151, Col. Altabrisa, Merida, Yucatan, C.P. 97130, segun la '
                         'firma de correo de Ian Abdala (28 oct 2026). Otra fuente corporativa '
                         'da 97138. Domicilio FISCAL sin confirmar con el cliente.',
    'contacto_nombre':   'Enrique Gomez',
    'contacto_cargo':    None,
    'contacto_tel':      '999 331 7133',
    'contacto_email':    'egomez@gruposisprovisa.com',
    'contactos_json':    CONTACTOS,
    'servicios_json':    SERVICIOS,
    'upsell_producto':   'ABIERTO HOY CON FOLIO — ticket #118633 (28 oct 2026): llamadas '
                         'SALIENTES de Mexico a Espana desde el DID de Barcelona que ya nos '
                         'pagan. El cliente pide costos. Ya lo habia preguntado en marzo de '
                         '2026 por CP Chat: lleva siete meses esperando respuesta.',
    'crossell_producto': 'SIN DEFINIR. En marzo de 2026 pregunto por CP Chat y por «cuanto me '
                         'costaria otra linea», y no consta que se le cotizara.',
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

print(u'=== ALTA GS TRACKME (%s) · asesor Erick ===' % CONSECUTIVO)
print(u'  consecutivo libre : %s' % (u'NO — ya existe %s' % ya if existe else u'si'))
print(u'  CID %s libre      : %s' % (CID, u'NO — ya esta en %s' % porcid if dup_cid else u'si'))
for k in ('empresa', 'asesor', 'estado', 'cid', 'facturacion', 'activo_desde',
          'contacto_nombre', 'contacto_email', 'contacto_tel'):
    print(u'  %-18s %s' % (k, FILA[k]))
print(u'  %-18s %d' % ('contactos_json', len(CONTACTOS)))
print(u'  %-18s %d' % ('servicios_json', len(SERVICIOS)))
print(u'  %-18s %d caracteres' % ('observaciones_kam', len(OBS_KAM)))
print(u'  %-18s %d caracteres' % ('notas', len(NOTAS)))

# El desglose tiene que sumar el MRR que se siembra. Si alguien cambia una
# cifra y no la otra, esto lo caza antes de escribir.
if 2189 + 99 + 200 != FILA['facturacion']:
    print(u'\n  *** EL DESGLOSE NO SUMA EL MRR: 2189+99+200 != %s' % FILA['facturacion'])
    raise SystemExit(1)
print(u'\n  ok  2,189 + 99 + 200 = %s, que es el MRR sembrado' % FILA['facturacion'])
if abs(FILA['facturacion'] * 1.16 - 2886.08) > 0.01:
    print(u'  *** el pago de Zoho ($2,886.08) no cuadra con el MRR + IVA')
    raise SystemExit(1)
print(u'  ok  %s x 1.16 = $2,886.08, que es lo que paga desde mayo 2026'
      % FILA['facturacion'])

# ── El limite de caracteres, que ya tumbo una escritura ─────────────────────
# El primer intento de esta alta murio con HTTP 400 «value too long for type
# character varying(255)» y el error NO dice que columna. Mejor cazarlo aqui,
# con el nombre de la columna. Los limites NO se copian a mano: los da el
# propio PostgREST en su especificacion OpenAPI, que es la tabla de verdad.
# Un limite mirrored es un limite que se queda viejo. [[feedback-verificar-antes-asegurar]]
LIMITES = {}
try:
    r = urllib.request.Request(URL + '/rest/v1/', headers={'apikey': KEY,
                               'Authorization': 'Bearer ' + KEY, 'Accept': 'application/openapi+json'})
    with urllib.request.urlopen(r, timeout=90) as x:
        spec = json.loads(x.read().decode('utf-8', 'replace'))
    for col, d in spec['definitions']['cuentas']['properties'].items():
        if isinstance(d.get('maxLength'), int):
            LIMITES[col] = d['maxLength']
except Exception as e:
    print(u'\n  *** no se pudo leer la especificacion de PostgREST (%s).' % e)
    print(u'      Sin los limites reales no se escribe: un 400 por longitud no')
    print(u'      dice que columna lo causo.')
    raise SystemExit(1)
if not LIMITES:
    print(u'\n  *** la especificacion no declara ningun maxLength en `cuentas`.')
    print(u'      Antes habia al menos tres varchar(255). Revisar a mano.')
    raise SystemExit(1)
# CONTROL NEGATIVO: una comprobacion que nunca ha fallado no es una
# comprobacion. Con --prueba-limite se alarga a proposito la columna que
# tumbo el primer intento; tiene que morir con el nombre de esa columna.
if '--prueba-limite' in sys.argv:
    FILA['tamano_empresa'] = 'x' * (LIMITES['tamano_empresa'] + 1)
    print(u'  (control negativo: tamano_empresa a %d caracteres a proposito)'
          % len(FILA['tamano_empresa']))
largos = [(k, n, len(FILA[k])) for k, n in sorted(LIMITES.items())
          if isinstance(FILA.get(k), str) and len(FILA[k]) > n]
if largos:
    print(u'\n  *** TEXTO MAS LARGO QUE LA COLUMNA — Postgres lo rechaza con un 400')
    print(u'      que no dice el nombre. Recortar:')
    for k, n, hay in largos:
        print(u'      %-18s varchar(%d), trae %d' % (k, n, hay))
    raise SystemExit(1)
print(u'  ok  los %d limites de longitud que declara la tabla se respetan '
      u'(%s).' % (len(LIMITES),
                  u', '.join(u'%s:%d' % (k, LIMITES[k]) for k in sorted(LIMITES))))

# Ninguna columna inventada: se comprueba contra el esquema real.
st3, muestra = req('GET', 'cuentas?select=*&limit=1')
if isinstance(muestra, list) and muestra:
    reales = set(muestra[0].keys())
    sobran = [k for k in FILA if k not in reales]
    if sobran:
        print(u'\n  *** COLUMNAS QUE NO EXISTEN EN LA TABLA: %s' % ', '.join(sobran))
        raise SystemExit(1)
    print(u'  ok  las %d columnas que se escriben existen en la tabla.' % len(FILA))

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
print(u'\nLO PRIMERO para Erick, en este orden:')
print(u'  1. LEER EL TICKET #112819 — «Cancelacion (voz)», 11 ago 2026, Fatima G.')
print(u'  2. Contestar el #118633: costos de salientes Mexico->Espana.')
print(u'  3. Preguntar por el tercer DID (529994541949), que no esta en la factura.')
print(u'  4. Pedir a Ingenieria el corte de AGOSTO 2026, el unico que falta de los')
print(u'     diez meses — y es el mes del ticket de cancelacion.')
print(u'  5. Pedir que el export de facturacion cargue el CID — hoy viene vacio.')
print(u'\nEL DATO QUE MANDA: 1.2% de la bolsa en su mejor mes de nueve medidos.')
print(u'  Paga tres extensiones ilimitadas y no llama. No se le vende mas voz:')
print(u'  se le resuelve el DID de Barcelona, que es lo que si pidio.')
