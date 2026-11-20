# -*- coding: utf-8 -*-
u"""ALTA DE EURO STERN (D61) EN LA CARTERA DE DAN.

   Instruccion de direccion (19 nov 2026): dar de alta EURO STERN con el
   consecutivo que le corresponda, asesor DAN, cuenta AAA. Y el dato que lo
   cambia todo, tambien de direccion: **los CIDs 181577, 169341 y 164747 son
   servicios ACTIVOS DEL MISMO CLIENTE en agencias distintas**, con el mismo
   interlocutor. Eurostern S.A. de C.V., distribuidor Mercedes-Benz de
   Guadalajara desde 1999.

   POR QUE D61
     El prefijo del consecutivo marca al asesor: D es Dan (55 de 56 cuentas con
     prefijo D son suyas). El maximo vivo de D es D60, asi que el siguiente es
     D61. Hay huecos (35, 39, 41, 47) de reasignaciones anteriores y NO se
     rellenan: «el que siga» es el maximo + 1.

   LA CUENTA ES UNA Y LOS SERVICIOS SON TRES
     `cuentas` tiene UNA columna `cid`. Se siembra 181577 —el de la alerta del
     Dashboard, el alta mas reciente y el unico con consumo medido— y los otros
     dos quedan declarados CON PALABRAS en `servicios_json` y en las notas. No
     se inventa una columna que la tabla no tiene.

   LO QUE ESTE GUION NO HACE
     No da de baja nada ni toca OSPEM. Que el GRC rotule a OSPEM «Desactivado»
     es un dato que se deja escrito para que Dan lo confirme; un alta no
     consuma una baja, y una baja es pasar a Dormida, nunca borrar.

   USO
       python scripts/alta-d61-euro-stern.py              # simulacro
       python scripts/alta-d61-euro-stern.py --aplicar
       python scripts/alta-d61-euro-stern.py --prueba-limite   # control negativo

   Las credenciales se leen de `.env.local` y NO se imprimen.
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

CONSECUTIVO = 'D61'
CID = '181577'
MRR = 6463          # 3,320 (EURO STERN) + 3,143 (Zeekr) + 0 (OSPEM). Ver el
                    # guardia del dinero mas abajo: cada sumando sale del GRC.

# ── Contactos ────────────────────────────────────────────────────────────────
# VACIO, y esta vez con el alcance dicho: NINGUNA DE LAS FUENTES QUE SE
# BARRIERON trae un interlocutor de este cliente —cartera, Activaciones 2.0,
# tickets de Zoho Desk, DIDs, contratos, GRC, cortes, llamadas y chat—. Eso NO
# es «no existe»: en la cuenta anterior (C71) escribi «no existe en ninguna
# fuente» y horas despues aparecio el contacto en el registro de Zoho CRM, que
# NO esta en el repositorio. Aqui pasa lo mismo: las oportunidades de este
# cliente existen en Zoho CRM y ahi es donde hay que mirar.
#
# Lo que SI hay son canales y nombres publicos, y NO se capturan como contacto:
#   · callcenter@eurostern.com.mx — buzon corporativo, no un interlocutor.
#   · Oscar Martin del Campo, director general «identificado en 2023», y Oscar
#     Fernando Acosta Morones, gerente de BDC «segun perfil profesional». Los
#     dos llegan marcados «vigencia pendiente de confirmar» por quien los paso.
#     Publicar un cargo sin confirmar es inventar un interlocutor.
CONTACTOS = []

SERVICIOS = [
    {'nombre': 'CID 181577 · EURO STERN — Conmutador IP VyC 20 extensiones',
     'descripcion':
     '$3,320 al mes. Es lo que dicen los DOS cortes de facturacion que existen '
     '(septiembre y octubre de 2026) y coincide al peso con el `mrrIni` del '
     'GRC. Bolsa de 2,500 minutos: consumio el 65.4% en septiembre y el 69.8% '
     'en octubre. Primer pago 31 ago 2026 de $3,851, que NO es el MRR. '
     'Portabilidad: si. DID 523336304545 (33 3630 4545), la sede Minerva.'},
    {'nombre': 'CID 164747 · Zeekr Guadalajara — la que sostiene al cliente',
     'descripcion':
     '$3,143 al mes, «MRR estable» en el GRC, 11 facturas y 25 MESES de '
     'relacion: el acumulado es $67,656, casi siete veces el de EURO STERN. '
     'Banda A. Su unico ticket historico es de UPSALE, no de incidencia. DID '
     '523333322000. NO aparece en los cortes de facturacion, asi que su '
     'consumo no esta medido — eso es un hueco de la fuente, no un cero.'},
    {'nombre': 'CID 169341 · OSPEM AUTOMOTRIZ — el GRC la trae DESACTIVADA',
     'descripcion':
     'Direccion la declara ACTIVA como servicio del mismo cliente; el corte '
     'vivo del GRC la rotula «Desactivado» con mrrIni 0, mrrFin 0, 3 facturas '
     'y 11 meses, acumulado $11,748, banda B. LAS DOS COSAS ESTAN ESCRITAS '
     'PORQUE NO SE PUEDEN PROMEDIAR: es lo primero que hay que confirmar, y '
     'mientras tanto aporta $0 al MRR de esta ficha. Sus DOS unicos tickets, '
     'los dos del 12 may 2026, son de «Cancelacion (voz)». Su DID no esta '
     'bajo su CID en `data/dids.json`.'},
]

OBS_KAM = u"""[ALTA 19 nov 2026 · Dan] EURO STERN — Eurostern S.A. de C.V.

— QUE ES Y QUE NOS PAGA
Distribuidor autorizado de Mercedes-Benz con origen en Guadalajara, constituido
el 11 de marzo de 1999. Vende vehiculos premium, seminuevos certificados, vanes
comerciales, refacciones y posventa. Opera en Guadalajara, Zapopan, Puerto
Vallarta y Nuevo Nayarit. Con nosotros son TRES servicios en tres agencias:
EURO STERN $3,320, Zeekr Guadalajara $3,143 y OSPEM $0 segun el GRC. Total
sembrado: $6,463 al mes. NO es TOP: cae en la posicion 91 de 143 cuentas con
importe y el corte del TOP 25 esta en $15,607.

— LO PRIMERO, Y NO ESTABA EN NINGUN RESUMEN: TRES TICKETS DE CANCELACION
De los CINCO tickets del CID 181577, TRES son de subcategoria «Cancelacion
(voz)» y los tres son de JULIO Y AGOSTO de 2026 — es decir, ANTES de que la
cuenta pagara su primer peso el 31 de agosto. Folios 109900 (3-21 jul, 425 h,
propietario Dan D.), 110606 (13-16 jul, 71 h, Dan D.) y 113047 (13-19 ago,
160 h, Fatima G.). Los otros dos son el onboarding.
QUE SE CANCELABA NO SE PUEDE AFIRMAR: el export de Zoho Desk trae categoria y
subcategoria pero NO el asunto, y «Cancelacion (voz)» cubre tanto dar de baja
el servicio como cancelar un numero o una linea. Los enlaces de Zoho estan en
el expediente de tickets y hay que abrirlos. Lo que si es un hecho: Dan ya
trabajo dos de esos tickets, asi que no entra a esta cuenta de cero.

— Y EL MISMO ROTULO PRECEDIO A UNA BAJA EN LA CUENTA HERMANA
OSPEM (CID 169341) tiene exactamente DOS tickets en todo su historico, los dos
del 12 may 2026 y los dos de «Cancelacion (voz)». Hoy el GRC la rotula
«Desactivado». Es el MISMO cliente, el MISMO rotulo y a esa agencia le siguio
una baja. Eso convierte los tres tickets de EURO STERN en un indicio con
precedente dentro de la propia cuenta — no en una prueba, pero tampoco en
ruido.

— LA QUE SOSTIENE LA RELACION ES ZEEKR, NO LA QUE ACABA DE ENTRAR
Zeekr Guadalajara lleva 25 MESES y $67,656 acumulados con «MRR estable»; EURO
STERN lleva 2 meses y $9,960. El cliente no es nuevo: entro en octubre de 2024
y la agencia que acaba de activarse es la mas pequena de las tres en historia.
Y el unico ticket de Zeekr en todo el periodo es de UPSALE. Esa es la agencia
donde hay relacion construida y la puerta natural para hablar de las demas.

— EURO STERN SI USA EL SERVICIO, Y ESO LA SEPARA DEL PATRON DE RIESGO
20 extensiones de Conmutador IP VyC sobre una bolsa de 2,500 minutos:
1,636 consumidos en septiembre (65.4%) y 1,746 en octubre (69.8%). Panel: 7
visitas en septiembre y 4 en octubre, perfil «entrantes» los dos meses. No es
una cuenta que paga y no arranca; es una cuenta que arranco y que ademas tiene
tres tickets de cancelacion sin explicar. Las dos cosas a la vez.

— EL ONBOARDING TARDO CIEN DIAS
El ticket 107412 se abrio el 25 de mayo de 2026 y cerro el 2 de septiembre:
2,395 horas, 100 dias. La propia hoja de activaciones lo explica: «se tuvo
contacto desde Junio pero demoro mucho en responder». Medido desde el arranque
formal del proceso (31 ago) la activacion duro 2 dias y sale «dificil»; medida
desde que se abrio el ticket, duro cien. Las dos cifras son ciertas y miden
cosas distintas — la hoja mide el tramo corto.

— UN SOLO DID PARA DIEZ SEDES
El directorio que publica el cliente lista DIEZ puntos (Lopez Mateos, Minerva,
Valle Real, Country Club, Agustin Yanez, Gonzalez Gallo, Yanez seminuevos,
Puerto Vallarta, PV Express y Nuevo Nayarit). Se cruzaron los diez contra
`data/dids.json` y SOLO UNO es nuestro: 33 3630 4545 = DID 523336304545,
la sede MINERVA, bajo el CID 181577. Las otras nueve no estan.
OJO CON UN FALSO POSITIVO QUE SI APARECE: hay numeros etiquetados «Mercedes
Benz Minerva Euroste» y «Mercedes - Benz Lopez Mateos» en el archivo, pero
cuelgan del CID 499, que NO es un cliente — son 4,678 numeros con 2,631
etiquetas distintas («Available» 1,033 veces, «GTC Rotativo», «Main number for
demo»). Es un pool de inventario. La etiqueta es el nombre del NUMERO; el CID
es el del cliente. Cruzar por etiqueta mezcla cuentas.
Nueve sedes sin numero nuestro es, a la vez, el riesgo y la conversacion de
crecimiento de esta cuenta.

— LA BANDA: DIRECCION DICE AAA Y EL GRC DICE OTRA COSA
Se registra AAA por instruccion de direccion. El corte vivo del GRC clasifica
EURO STERN como AA, Zeekr como A y OSPEM como B, y `data/grc-reclasificaciones.json`
NO trae ninguna de las tres. Las dos cosas quedan escritas porque no se
promedian ni se eligen a dedo. Para que la banda AAA sobreviva al proximo
corte tiene que entrar en esa capa de reclasificaciones, que es la que se
reaplica sola; escrita solo aqui, el siguiente export la pisa.

— COMO SE LEE ESTA CUENTA, EN UNA FRASE
Cliente de 25 meses con tres agencias: una estable que nadie mira (Zeekr), una
que el GRC da por desactivada (OSPEM) y una recien activada que si usa el
servicio pero acumulo tres tickets de cancelacion antes de pagar su primera
factura. El trabajo no es retener la ultima: es entender por que dos de las
tres se mueven hacia la salida mientras la mayor sigue intacta."""

NOTAS = u"""[ALTA 19 nov 2026] D61, asesor Dan, por instruccion de direccion.
Banda AAA por instruccion de direccion (el GRC dice AA/A/B — ver arriba).

EL CONSECUTIVO: maximo vivo del prefijo D = D60, asi que el que sigue es D61.
Huecos en la serie D (35, 39, 41, 47) de reasignaciones anteriores: NO se
rellenan. El prefijo D reparte Dan 55 / Erick 1, asi que D es de Dan.

UNA CUENTA, TRES CIDs. `cuentas` tiene una sola columna `cid` y se siembra
181577: es el de la alerta del Dashboard, el alta mas reciente y el UNICO de
los tres con consumo medido en los cortes. Los otros dos van declarados en
`servicios_json`. Consecuencia practica que hay que tener presente: cualquier
cruce automatico por CID —tickets, cortes, DIDs— solo va a traer lo de 181577.
Lo de Zeekr y OSPEM hay que pedirlo a mano hasta que exista una forma de
colgar varios CIDs de una cuenta.

EL DINERO, SUMANDO POR SUMANDO (ninguna cifra tecleada sin fuente):
  EURO STERN   $3,320  GRC `mrrIni`; ademas el monto de los DOS cortes de
                       facturacion (sep y oct 2026) y el acumulado del GRC
                       $9,960 = 3 facturas x 3,320 AL PESO.
  Zeekr        $3,143  GRC `mrrIni` = `mrrFin`, movimiento «MRR estable».
  OSPEM            $0  GRC `mrrIni` = `mrrFin` = 0, movimiento «Desactivado».
  TOTAL        $6,463

EL PRIMER PAGO NO ES EL MRR, Y AQUI SE VE: la tarjeta del Dashboard dice
«$3,851 primer pago» y el MRR de esa linea es $3,320. La diferencia de $531 no
esta explicada en ninguna fuente nuestra —portabilidad, alta o prorrateo son
hipotesis, no dato— y por eso no se afirma. La columna «1er Pago» de la hoja
de activaciones es el primer cobro; el MRR institucional es el del GRC.

«POR CONFIRMAR (CORTE DE DATOS)» NO ES UNA BAJA. La fila de EURO STERN trae
mrrFin 0 con ese movimiento y una `perdida` escrita de $3,320. Ese rotulo es
FALTA DE DATO, no perdida: el cubo entero son 1,004 filas y $1,470,470 de
perdida escrita sin confirmar. Que la fila diga 0 este corte no contradice que
el cliente este activo, y los dos cortes de facturacion lo respaldan.

LO QUE ACTIVACIONES 2.0 TIENE MAL CON ESTE CLIENTE — cinco filas, tres grafias:
  181577  EURO STERN          pagada       31 ago 2026   $3,851
  169341  OSPEM               convertida    1 abr 2025     $979
  164747  Zeekr Guadalajara   convertida   21 oct 2024   $5,245
  161827  EUROSTERN           demo         sin fecha          —
  140159  Euro Stern          demo         sin fecha          —
Hay DOS demos y el nombre se escribe de TRES formas, asi que el cliente cruza
como clientes distintos. Y la fila 181577 esta marcada «pagada» cuando su
propia nota dice «se comenzo configuracion desde cuenta demo ID 140159»: por
la regla que direccion resolvio el 24 oct 2026 para CRISTAL SERVICIOS, eso es
«convertida». `data/correcciones-pendientes.json` ya cita a EURO STERN entre
los 23 clientes con ese patron. La correccion va en la HOJA DE ORIGEN, no en
el .xlsx del repositorio, y no se borra ningun demo: perder el demo es perder
que lo hubo, su fecha y su ejecutiva.

LAS OPORTUNIDADES DE ZOHO QUE PASO DIRECCION:
  «ZK MOTORS (EUROSTERN) Zeekr Guadalajara»  $2,245  cierre 14/10/2024
  «OSPEM - CP 169341»                          $979  cierre 01/04/2025
La primera confirma por una tercera via que Zeekr es de Eurostern. La segunda
cuadra al peso con el primer pago de OSPEM. La de Zeekr NO cuadra: la
oportunidad dice $2,245 y el primer pago $5,245, exactamente $3,000 de
diferencia. Se registra con su etiqueta y no se promedia.

LO QUE EL MOTOR ABRE DE VERDAD — leido, no supuesto (19 nov 2026):
NUEVE hallazgos. Situacion: NO LA VEMOS · luz AMARILLO · esTop False.
  «No podemos ver su consumo — el CID tiene 2 de 5 meses con dato»
  «Nunca se le ha contactado» · «Sin un solo contacto registrado»
  «Sin una sola respuesta de Radar — 0 de 12»
  «No hay lectura de sus llamadas» · «Nunca se ha registrado una reunion»
  «La cuenta no tiene auditoria» · «La relacion esta sin construir — 4%»
  «Lo que le hemos resuelto — 5 tickets atendidos»
El 4% es de RELACIONAMIENTO, no de consumo de voz: no contradice el 65.4%.

Y LAS DOS FRASES QUE PARECEN CONTRADECIRSE NO SE CONTRADICEN. El motor dice
«no podemos ver su consumo» y esta ficha dice que consumio el 65.4% y el
69.8%. Las dos son ciertas y miden cosas distintas: el detector pide CINCO
meses para dar una serie y esta cuenta tiene DOS, porque nacio en septiembre.
Lo que hay medido esta medido; lo que no hay es historia suficiente para una
tendencia. No es ceguera de la fuente, es juventud de la cuenta — y por eso la
tarea NO es de Ingenieria.
OJO: `scripts/mide-cortes-cuenta.py` avisa aqui que se abriria
`sin_consumo_medible` con el texto «la cuenta no aparece en el archivo de
cortes» y que eso senalaria mal a Ingenieria. El motor NO dice eso; dice
«2 de 5 meses con dato», que describe el caso con exactitud. Es la SEGUNDA vez
que ese aviso del guion de medicion no coincide con lo que publica el motor
(paso igual en C71). Queda anotado: el aviso se lee, no se copia.

QUE VA A SALIR VACIO EN EL TABLERO Y POR QUE — no es cero, es que no se ha medido:
- LLAMADAS: ninguno de los tres CIDs esta en `data/analisis-llamadas.json`
  (211 cuentas), asi que el modulo de atencion sale SIN LECTURA hasta que se
  pida el Excel. Eso NO contradice los dos cortes: son DOS fuentes distintas
  —los cortes de facturacion y el reporte de llamadas— y confundirlas ya costo
  publicar dos cosas falsas.
- CHAT: ningun CID ni nombre tiene fila en `app/callpicker-chat/chat-data.ts`.
  No esta medido.
- TICKETS ABIERTOS: NO MEDIBLE. El export solo trae cerrados, asi que
  «abiertos: 0» no seria una medicion. Los cinco de EURO STERN estan cerrados
  y ninguno es falla de servicio (0 de 5).
- CONTRATO: no aparece en `data/contratos.json`. Ese archivo cubre una parte de
  la cartera, asi que NO prueba que no haya contrato: hay que confirmarlo.

DATOS QUE FALTAN Y NO SE INVENTARON:
- INTERLOCUTOR: ninguna de las fuentes que se barrieron trae uno —cartera,
  Activaciones, tickets, DIDs, contratos, GRC, cortes, llamadas y chat—. Y eso
  NO es «no existe»: en la cuenta anterior escribi esa frase y horas despues
  aparecio el contacto en Zoho CRM, que no esta en el repositorio. Aqui el
  cliente tiene DOS oportunidades en Zoho (arriba): ahi es donde hay que
  mirar, y direccion dice que el interlocutor es el mismo en las tres agencias.
- CARGOS: Oscar Martin del Campo (director general, «identificado en 2023») y
  Oscar Fernando Acosta Morones (gerente de BDC, «segun perfil profesional»)
  llegan marcados como pendientes de confirmar por quien los paso. No se
  capturan como contacto. El area de BDC es la relevante para nosotros: es
  quien atiende prospectos, coordina contactos digitales y agenda citas.
- RAZON SOCIAL: «Eurostern S.A. de C.V.» viene de la ficha corporativa publica,
  no del expediente contractual. RFC: SIN CAPTURAR.
- EMPLEADOS: la propia ficha dice «No verificado para toda la organizacion».
  No se rellena.
- CUANTAS DE LAS DIEZ SEDES PASAN POR CALLPICKER: medido y es UNA (Minerva).
  Lo que NO esta medido es si las otras nueve usan otro proveedor o ninguno.

Los `score_*` van en 50: es el neutro del sistema para una cuenta sin historial
medido en el tablero, no una evaluacion."""

FILA = {
    'consecutivo':       CONSECUTIVO,
    'empresa':           'EURO STERN',
    'grupo_empresarial': 'Eurostern S.A. de C.V., distribuidor Mercedes-Benz (Guadalajara, '
                         '1999). MISMO CLIENTE en tres agencias con tres CIDs, por '
                         'instruccion de direccion: 181577 EURO STERN, 164747 Zeekr '
                         'Guadalajara (la de mas historia, 25 meses) y 169341 OSPEM '
                         'AUTOMOTRIZ, que el GRC rotula «Desactivado». La oportunidad de '
                         'Zoho «ZK MOTORS (EUROSTERN) Zeekr Guadalajara» confirma el '
                         'vinculo por una tercera via.',
    'asesor':            'Dan',
    'estado':            'activo',
    'cid':               CID,
    'facturacion':       MRR,
    'activo_desde':      '2024-10-21',
    'giro':              'Automotriz: distribucion y posventa de Mercedes-Benz — vehiculos '
                         'premium, seminuevos certificados, vanes comerciales, refacciones y '
                         'servicio. La hoja de activaciones lo clasifica como «servicios», '
                         'que es la etiqueta de la hoja y no el giro real.',
    'servicio':          'Conmutador IP VyC 20 extensiones = $3,320/mes (CID 181577, cortes '
                         'de sep y oct 2026) + Zeekr Guadalajara $3,143/mes (CID 164747, '
                         '«MRR estable») + OSPEM $0 segun el GRC (CID 169341). Un solo DID '
                         'nuestro: 523336304545, la sede Minerva.',
    'tamano_empresa':    'DOS etiquetas y ninguna auditada: Activaciones dice «mediana» para '
                         'EURO STERN y «mediana» para Zeekr, pero «pequena» para OSPEM, y la '
                         'ficha publica no da plantilla. No se promedian.',
    'num_oficinas':      'El directorio publico lista DIEZ puntos en Guadalajara, Zapopan, '
                         'Puerto Vallarta y Nuevo Nayarit. Cuantos pasan por Callpicker: '
                         'UNO medido (Minerva, DID 523336304545). Las otras nueve no tienen '
                         'numero nuestro en data/dids.json.',
    'total_empleados':   'SIN CONFIRMAR. La propia ficha corporativa dice «No verificado '
                         'para toda la organizacion». No se rellena con una estimacion.',
    'pagina_web':        'https://www.mercedes-benz-eurostern-guadalajara.com.mx/',
    'direccion_fiscal':  None,
    'contacto_nombre':   None,
    'contacto_cargo':    None,
    'contacto_tel':      None,
    'contacto_email':    None,
    'contactos_json':    CONTACTOS,
    'servicios_json':    SERVICIOS,
    'upsell_producto':   'NO ANTES DE EXPLICAR LOS TRES TICKETS DE CANCELACION. Despues, el '
                         'camino esta medido: nueve de sus diez sedes no tienen numero '
                         'nuestro, y el area de BDC —que atiende prospectos y agenda citas— '
                         'es justo donde Visibilidad y Control se justifica solo.',
    'crossell_producto': 'SIN DEFINIR. La primera pregunta es de cartera, no de producto: '
                         'confirmar si OSPEM sigue activa, porque el GRC la da por '
                         'desactivada y direccion la declara viva. Hasta resolver eso no se '
                         'propone nada nuevo.',
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

print(u'=== ALTA EURO STERN (%s) · asesor Dan ===' % CONSECUTIVO)
print(u'  consecutivo libre : %s' % (u'NO — ya existe %s' % ya if existe else u'si'))
print(u'  CID %s libre   : %s' % (CID, u'NO — ya esta en %s' % porcid if dup_cid else u'si'))
for k in ('empresa', 'asesor', 'estado', 'cid', 'facturacion', 'activo_desde'):
    print(u'  %-18s %s' % (k, FILA[k]))
print(u'  %-18s %d  (VACIO con el alcance dicho: ninguna de las fuentes BARRIDAS '
      u'trae interlocutor. Zoho CRM no esta en el repositorio y ahi hay que mirar)'
      % ('contactos_json', len(CONTACTOS)))
print(u'  %-18s %d  (los TRES CIDs del cliente)' % ('servicios_json', len(SERVICIOS)))
print(u'  %-18s %d caracteres' % ('observaciones_kam', len(OBS_KAM)))
print(u'  %-18s %d caracteres' % ('notas', len(NOTAS)))

# ── EL DINERO: el total es una SUMA y cada sumando tiene fuente ─────────────
# Si alguien toca MRR aqui y no en el resto, esto lo caza antes de escribir.
EUROSTERN_MRR, EUROSTERN_FACTURAS, EUROSTERN_ACUMULADO = 3320.0, 3, 9960.0
EUROSTERN_CORTES = [3320, 3320]      # septiembre y octubre de 2026
ZEEKR_MRR_INI, ZEEKR_MRR_FIN = 3143.0, 3143.0
OSPEM_MRR = 0.0
PRIMER_PAGO = 3851                   # «1er Pago» de Activaciones: NO es el MRR

suma = EUROSTERN_MRR + ZEEKR_MRR_FIN + OSPEM_MRR
if abs(suma - FILA['facturacion']) > 0.01:
    print(u'\n  *** la suma de los tres servicios (%s) no es el MRR sembrado (%s)'
          % (format(suma, ',.0f'), FILA['facturacion']))
    raise SystemExit(1)
if abs(EUROSTERN_FACTURAS * EUROSTERN_MRR - EUROSTERN_ACUMULADO) > 0.01:
    print(u'\n  *** el acumulado del GRC de EURO STERN no es %d x %s'
          % (EUROSTERN_FACTURAS, EUROSTERN_MRR))
    raise SystemExit(1)
if set(EUROSTERN_CORTES) != {int(EUROSTERN_MRR)}:
    print(u'\n  *** los cortes de facturacion no dan el MRR de EURO STERN')
    raise SystemExit(1)
if ZEEKR_MRR_INI != ZEEKR_MRR_FIN:
    print(u'\n  *** Zeekr ya no es «MRR estable»: mrrIni %s != mrrFin %s'
          % (ZEEKR_MRR_INI, ZEEKR_MRR_FIN))
    raise SystemExit(1)
# CONTROL NEGATIVO DEL DINERO: el primer pago NO puede ser el MRR. Si algun dia
# coinciden es que alguien sembro la columna «1er Pago», que es el error que
# esta ficha existe para no cometer.
if PRIMER_PAGO == FILA['facturacion'] or PRIMER_PAGO == EUROSTERN_MRR:
    print(u'\n  *** el «1er Pago» ($%s) se colo como MRR. Son cosas distintas.'
          % format(PRIMER_PAGO, ',d'))
    raise SystemExit(1)
print(u'\n  ok  $%s = EURO STERN $%s + Zeekr $%s + OSPEM $%s, cada uno del GRC'
      % (format(MRR, ',d'), format(EUROSTERN_MRR, ',.0f'),
         format(ZEEKR_MRR_FIN, ',.0f'), format(OSPEM_MRR, ',.0f')))
print(u'  ok  acumulado de EURO STERN $%s = %d facturas x $%s, y los DOS cortes '
      u'dan lo mismo' % (format(EUROSTERN_ACUMULADO, ',.0f'), EUROSTERN_FACTURAS,
                         format(EUROSTERN_MRR, ',.0f')))
print(u'  ok  el «1er Pago» de $%s NO se uso como MRR' % format(PRIMER_PAGO, ',d'))

# ── El limite de caracteres, que ya tumbo una escritura antes ───────────────
# Los limites NO se copian a mano: los declara PostgREST en su especificacion.
LIMITES = {}
try:
    r = urllib.request.Request(URL + '/rest/v1/', headers={'apikey': KEY,
                               'Authorization': 'Bearer ' + KEY,
                               'Accept': 'application/openapi+json'})
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
    raise SystemExit(1)
# CONTROL NEGATIVO: una comprobacion que nunca ha fallado no es una comprobacion.
if '--prueba-limite' in sys.argv:
    FILA['num_oficinas'] = 'x' * (LIMITES['num_oficinas'] + 1)
    print(u'  (control negativo: num_oficinas a %d caracteres a proposito)'
          % len(FILA['num_oficinas']))
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
print(u'\nLO PRIMERO para Dan, en este orden:')
print(u'  1. ABRIR LOS TRES TICKETS DE CANCELACION en Zoho (109900, 110606,')
print(u'     113047) y leer el asunto. El export no lo trae. Dos de los tres')
print(u'     los trabajaste tu: son de julio y agosto, ANTES del primer pago.')
print(u'  2. ¿OSPEM SIGUE ACTIVA? Direccion dice que si; el GRC la rotula')
print(u'     «Desactivado». Sus dos unicos tickets son de cancelacion.')
print(u'  3. ENTRAR POR ZEEKR, que lleva 25 meses y $67,656: ahi esta la')
print(u'     relacion construida y su unico ticket fue de UPSALE.')
print(u'  4. CAPTURAR UN INTERLOCUTOR. No hay NINGUNO en las fuentes barridas;')
print(u'     las dos oportunidades de Zoho CRM son el sitio donde mirar.')
print(u'  5. Censo de sedes: diez puntos publicados y UN solo DID nuestro.')
print(u'  6. Que la banda AAA entre en grc-reclasificaciones.json, o el')
print(u'     proximo corte la devuelve a AA.')
print(u'\nEL DATO QUE MANDA: tres tickets de «Cancelacion (voz)» en julio y')
print(u'  agosto de 2026, ANTES de que la cuenta pagara su primera factura el')
print(u'  31 de agosto. Y en la agencia hermana el mismo rotulo acabo en baja.')
