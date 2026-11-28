# -*- coding: utf-8 -*-
u"""ALTA DE AUTOCENTRO GUZMAN (D62) EN LA CARTERA DE DAN.

   Instruccion (27 nov 2026): construir la cuenta nueva con el consecutivo que
   sigue, asesor DAN, a partir de la ficha de cliente y del hilo de correo y
   WhatsApp del Ing. Manuel Favela.

   POR QUE D62
     El prefijo del consecutivo marca al asesor: D es Dan. El maximo vivo de D
     es D61 (EURO STERN, 19 nov 2026), asi que el siguiente es D62. Hay huecos
     en la serie D (35, 39, 41, 47) de reasignaciones anteriores y NO se
     rellenan: «el que siga» es el maximo + 1, no el primer hueco.

   DE DONDE SALE EL CID, PORQUE NO LO DIJO NADIE
     Ninguna fuente nuestra trae el CID de este cliente. Se derivo asi, y la
     derivacion queda escrita para que se confirme en Zoho:
       1. El correo de bienvenida del 26 nov dice «Tu numero asignado:
          (669) 454-0570» para el usuario `autocentroguzman`.
       2. En `data/dids.json` ese numero (526694540570) cuelga de UN solo CID,
          el 27954, y es el UNICO numero de ese CID.
       3. El 27954 no esta en `cuentas` ni en el GRC, consistente con una
          cuenta que nacio hace un dia.
     La etiqueta del numero dice «Available», que es lo normal en un numero
     recien dado: 865 de los 3,717 CIDs del archivo tienen todos sus numeros
     asi. La etiqueta es el nombre del NUMERO, no del cliente — por eso el
     cruce se hizo por numero y no por etiqueta.

   LO QUE ESTE GUION NO HACE
     No da por hecha la portabilidad, que al 27 nov esta DETENIDA por un
     desajuste de documentos, ni convierte la cotizacion en facturacion
     institucional: no hay una sola fila en el GRC todavia.

   USO
       python -I scripts/alta-d62-autocentro-guzman.py              # simulacro
       python -I scripts/alta-d62-autocentro-guzman.py --aplicar
       python -I scripts/alta-d62-autocentro-guzman.py --prueba-limite

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

CONSECUTIVO = 'D62'
CID = '27954'        # derivado del DID asignado. Ver el encabezado.
MRR = 2786           # COTIZACION del 24 nov 2026, NO una factura. El guardia
                     # del dinero mas abajo comprueba cada sumando.

# ── Contactos ────────────────────────────────────────────────────────────────
# UN SOLO interlocutor, y el unico que aparece en todo el expediente. El cargo
# NO viene escrito en ninguna parte: la firma dice «LSC. Juan Manuel Favela
# Garcia» y escribe desde soporte@, y lo que HACE en el hilo es disenar el
# arbol de extensiones y presentarlo a su Direccion. Describir eso es un dato;
# ponerle un titulo que nadie escribio seria inventarlo.
#
# LOS TRES NOMBRES DE LA FICHA NO SE CAPTURAN COMO CONTACTO: Jorge Chacon
# (taller Marina), Pablo Coronado (taller Pacifico) y Karina Lopez (Palos
# Prietos) salen de un directorio de talleres de King Long Mexico, no de
# nuestro expediente, y la propia ficha dice que para alcanzarlos hay que usar
# el canal publicado de su sucursal. Quedan en las notas como padron de
# sucursal, no como interlocutores.
CONTACTOS = [
    {'nombre': 'Juan Manuel Favela Garcia',
     # El cargo ESTABA sin confirmar y lo confirma su propia tarjeta de
     # presentacion, que el cliente adjunta al hilo. Se corrige en vez de
     # dejar un «SIN CONFIRMAR» en pantalla con la prueba ya en la mano.
     'cargo': 'Encargado de Desarrollo de Sistemas (su tarjeta de presentacion). '
              'En el hilo hace de responsable tecnico: disena el arbol de '
              'extensiones y lo presenta a su Direccion, y es quien junta la '
              'documentacion de portabilidad.',
     'tel': '6699251404',
     'email': 'soporte@autocentroguzman.com',
     'nota': 'ES EL UNICO INTERLOCUTOR DEL EXPEDIENTE. Canal real: correo y '
             'WhatsApp — Activaciones y direccion hablan con el por WhatsApp. '
             'Su tarjeta trae DOS numeros y NO son equivalentes: el '
             '(669) 985 1454 Ext. 14 cuelga del conmutador de la matriz, que es '
             'EXACTAMENTE una de las dos lineas TELMEX en portabilidad —cuando '
             'entre, el numero publico del cliente va a ser nuestro DID—, y el '
             '(669) 925 1404, que NO esta en la lista a portar. Por eso el '
             'telefono capturado es el 925 1404: es el unico que no va a '
             'cambiar de dueno con el tramite.'},
]

SERVICIOS = [
    {'nombre': 'Comunicacion Empresarial · 11 extensiones — $2,519/mes (COTIZADO)',
     'descripcion':
     'Cotizacion de Jose Manuel Lopez del 24 nov 2026, mas IVA. NO hay factura '
     'todavia. OJO AL CONCILIAR: el catalogo vigente (`data/planes-pago.json`, '
     'libro «Planes 2.0» generado el 4 nov 2026) NO tiene un escalon de CE de '
     '11 extensiones — el mayor es «CE 5 ext» a $939/$1,239/$1,549/$2,359 para '
     '1, 2, 3 y 5. Asi que este importe es precio de cotizacion y no se puede '
     'reconstruir desde el catalogo. (El que $2,519 coincida al peso con la '
     'bolsa «VyC 1900 min» es coincidencia de importe, no una hipotesis: son '
     'esquemas distintos.) Se confirma con el contrato o con la primera '
     'factura, no antes.'},
    {'nombre': '3 numeros — $267/mes (COTIZADO, y son 3 cobrados contra 2 documentados)',
     'descripcion':
     'La cotizacion del 24 nov cobra TRES numeros por portabilidad a $267 '
     '($89 cada uno). El correo del 25 nov con la documentacion lista DOS: '
     '669 985 14 54 y 669 985 12 91, las dos de TELMEX. El tercero podria ser '
     'el 669 454 0570 que ya quedo asignado el 26 nov, pero ESO NO LO DICE '
     'NINGUNA FUENTE y no se afirma: hay que confirmar si son tres '
     'portabilidades o dos mas un numero nuevo, porque cambia el tramite y '
     'cambia el cobro.'},
    {'nombre': 'DID activo hoy · 52 669 454 0570',
     'descripcion':
     'Unico numero vivo de la cuenta. Activo desde el 26 nov 2026 segun el '
     'correo de bienvenida (ticket 121340), usuario de administrador '
     '`autocentroguzman`. En `data/dids.json` aparece como 526694540570 y '
     'cuelga del CID 27954 con etiqueta «Available», es decir sin nombre '
     'asignado todavia. Se escribe aqui tambien en crudo porque esa es la '
     'forma con la que cruza contra el archivo de DIDs.'},
]

OBS_KAM = u"""[ALTA 27 nov 2026 · Dan] AUTOCENTRO GUZMAN — cadena de talleres y
llantas de Grupo Petroil.

— QUE ES
Cadena de talleres y venta de llantas: mantenimiento automotriz, atencion a
flotillas y servicio a transporte pesado. Es una unidad de negocio de GRUPO
PETROIL, con matriz en Palos Prietos, Mazatlan. El sitio publica NUEVE puntos
—cuatro en Mazatlan (Palos Prietos, Marina, Pacifico y Garage 55), uno en
Culiacan (Car Club), uno en Guasave y tres en Los Mochis (Los Mochis,
Guillermo Prieto y Centro Camionero)— y menciona Hermosillo en la seccion de
CrediGuzman sin domicilio ni contacto local. El proveedor que firma el sitio es
«Llanteras Guzman, S.A. de C.V.», RFC publicado LGU780408NM3.

— DONDE ESTA HOY, EN UNA LINEA
Cuenta recien vendida: cotizada el 24 nov, linea activa desde el 26 nov, con la
configuracion del flujo sin hacer y la portabilidad DETENIDA por documentos.
No es una cuenta que haya que diagnosticar: es una cuenta que hay que terminar
de montar, y el reloj corre.

— LO QUE ESTA DETENIDO, Y ES LO PRIMERO
El 27 nov, por WhatsApp, Callpicker le avisa al Ing. Favela: «revisando los
documentos que nos compartiste, la persona del INE no la encuentran en el
documento. Nos ayudas a validar si es el o el acta es la correcta». El tramite
de portabilidad no arranca hasta resolver eso. El mismo dia el Ing. envio el
ACTA PODER, que es justo el documento que faltaba. Hay que confirmar que con
eso quedo cerrado el requisito, porque nadie lo ha dicho por escrito.

— Y HAY UN RIESGO TECNICO ADVERTIDO QUE NADIE HA CONFIRMADO
Activaciones (Cecilia Ramirez) le advirtio: si las lineas a portar tienen algun
servicio de INTERNET asociado, hay que pedirle a TELMEX que lo desasocie ANTES,
o el cliente PIERDE EL INTERNET cuando entre la portabilidad. En una cadena de
talleres eso es la operacion de varias sucursales. No consta en ninguna parte
que se haya hecho la gestion. Es la pregunta que hay que hacerle al Ing. en la
reunion del lunes, antes de que el tramite avance.

— EL CLIENTE YA ESTA PREGUNTANDO LO CORRECTO, Y SIGUE SIN RESPUESTA
El 10 nov el Ing. Favela escribio que estaba armando el arbol de extensiones
para presentarlo a su Direccion, y dejo tres preguntas concretas:
  1. Que ventaja tiene la aplicacion en los celulares.
  2. Si una computadora necesita la aplicacion instalada para recibir llamadas.
  3. Su caso real: el area de atencion y servicios usa HOY dos extensiones en
     dos telefonos. Quiere DOS extensiones apuntando a los MISMOS equipos
     —telefono IP, computadora y celular— de modo que en cualquiera se puedan
     contestar las dos.
En el hilo que tenemos no aparece la respuesta. Son tres preguntas de diseno de
flujo, de alguien que esta vendiendo el proyecto hacia arriba en su empresa.
Llevarlas resueltas a la reunion del lunes vale mas que cualquier presentacion.

— LA REUNION YA ESTA PUESTA, CON UNA HORA QUE NO CUADRA
Lunes 30 de noviembre con Cecilia Ramirez, para cerrar la configuracion del
flujo. El texto del correo dice 4:30 pm de Mazatlan / 5:30 pm de CDMX; el
bloque de calendario del MISMO correo dice «5:30 – 6:30 am». Las dos cosas no
pueden ser: confirmar la hora antes del lunes. Liga:
https://meet.google.com/tqw-afip-ojv

— EL TELEFONO PUBLICO DEL CLIENTE VA A SER NUESTRO
El 669 985 1454 que el sitio publica como telefono de matriz es una de las dos
lineas TELMEX a portar. Cuando entre la portabilidad, el numero por el que el
publico llama a Autocentro Guzman va a ser un DID nuestro. Eso sube la apuesta
de la configuracion del flujo: lo que se arme el lunes es lo que va a contestar
el telefono principal de la empresa.

— EL GRUPO ES MUCHO MAS GRANDE DE LO QUE ENTRA HOY
Grupo Petroil factura 25 lineas en el export completo del GRC y solo tiene
cuentas en la cartera por una parte de eso. Con esta, son CUATRO: F32 Grupo
Petroil y Cias, C54 Oceanica, Z47 Petroil - Prebiem Oceanica y D62. Las cuatro
son de Dan por instruccion de direccion. Dato que NO hay que confundir: el
asesor de cartera es Dan y el KAM real del grupo es Jose Manuel —el vendio esta
cuenta y es quien esta en el hilo—. `cuentas` solo tiene columna para el asesor,
asi que el rol de KAM vive en la bitacora de F32. Asesor no es KAM y el campo no
se «corrige».

— COMO SE LEE ESTA CUENTA
Entrada por Comunicacion Empresarial con 11 extensiones: el primer peldano de la
escalera de producto, en un cliente de nueve sucursales cuyo grupo ya nos
factura por otras vias. El valor no esta en el importe de hoy ($2,786 cotizados,
posicion 131 de 145 cuentas con importe) sino en que es la cuarta puerta abierta
del mismo grupo y en que su numero principal va a pasar por nosotros."""

NOTAS = u"""[ALTA 27 nov 2026] D62, asesor Dan, por instruccion.

EL CONSECUTIVO: maximo vivo del prefijo D = D61, asi que el que sigue es D62.
Huecos en la serie D (35, 39, 41, 47) de reasignaciones anteriores: NO se
rellenan. El prefijo D es de Dan.

EL CID NO LO DIJO NINGUNA FUENTE Y SE DERIVO — CONFIRMAR EN ZOHO. Se sembro
27954 por este camino: el correo de bienvenida del 26 nov asigna el numero
(669) 454-0570 al usuario `autocentroguzman`; en `data/dids.json` ese numero
(526694540570) cuelga de un solo CID, el 27954, y es el unico numero de ese
CID; y el 27954 no esta en `cuentas` ni en el GRC, que es lo esperable en una
cuenta de un dia. La etiqueta del numero es «Available» —sin nombre asignado—,
lo normal en un numero recien dado: 865 de los 3,717 CIDs del archivo estan
igual. El cruce se hizo por NUMERO, no por etiqueta: la etiqueta es el nombre
del numero y cruzar por ahi mezcla cuentas.

EL DINERO ES UNA COTIZACION, NO FACTURACION. No hay una sola fila en el GRC
para este cliente —ni por CID ni por nombre—, asi que el MRR INSTITUCIONAL NO
ES MEDIBLE todavia. Lo sembrado son los $2,786 de la cotizacion del 24 nov
2026 de Jose Manuel Lopez, mas IVA:
  11 extensiones de Comunicacion Empresarial   $2,519
  3 numeros (portabilidad)                     $  267
  TOTAL                                        $2,786
Se siembra el total y no un cero porque un cero sin medicion se lee como cuenta
gratis; y se siembra el total y no el subtotal de extensiones porque el que se
cuela con mas facilidad es el de $2,519. Cuando salga la primera factura, el
importe que manda es el del GRC.

EL CATALOGO NO TIENE ESE ESCALON. `data/planes-pago.json` (libro «Planes 2.0»,
generado el 4 nov 2026) llega hasta «CE 5 ext» y cotiza CE a $939, $1,239,
$1,549 y $2,359 para 1, 2, 3 y 5 extensiones. No existe un CE de 11. Por eso
los $2,519 no se pueden reconstruir desde el catalogo y quedan como precio de
cotizacion. Que $2,519 sea identico a la bolsa «VyC 1900 min» es coincidencia
de importe entre dos esquemas distintos, y se escribe aqui precisamente para
que nadie la tome por explicacion.

TRES NUMEROS COBRADOS, DOS DOCUMENTADOS. La cotizacion cobra 3 numeros y el
correo del 25 nov con la documentacion lista 2: 669 985 14 54 y 669 985 12 91,
ambas TELMEX. El tercero PODRIA ser el 669 454 0570 ya asignado, pero ninguna
fuente lo dice y no se afirma. Ninguno de los dos numeros TELMEX esta todavia
en `data/dids.json`, que es lo coherente con una portabilidad sin completar.

ACTIVACIONES 2.0 DESCRIBE OTRA COSA — HAY QUE CORREGIR LA HOJA DE ORIGEN. La
fila ID 190629 «Autocentro Guzman» dice: tipo «demo», estatus 5, cierre el
13 nov 2026, «Portabilidad: no», «SIMs: no», «Vendedor: Sin vendedor»,
ejecutivo Pepe Tono, y de nota «Onboarding 09/11/2026. Sin primer pago
registrado al 10/11/2026. Demo sin respuesta». La realidad del expediente al
27 nov es: cotizada el 24, linea activa el 26, portabilidad EN TRAMITE y
reunion de configuracion agendada. O sea que la hoja describe el demo que fue
y no el cliente que es. Tres correcciones para la HOJA DE ORIGEN, no para el
.xlsx del repositorio: el tipo («demo» -> convertida/vendida), «Portabilidad:
no» -> si, y el vendedor, que es Jose Manuel Lopez y no «Sin vendedor». El
demo NO se borra: perder el demo es perder que lo hubo, su fecha y su
ejecutiva. Y la hoja es un snapshot semanal — puede venir corregida el viernes.

DE LA FICHA DE CLIENTE SE TOMO LO VERIFICABLE Y NADA MAS. La ficha cita como
fuente 9 un «tablero interno de pagos» con el nombre «Autocentro Guzman» y la
clave 165180000055049152. Esa clave tiene 18 digitos y forma de id de Zoho: NO
es un CID y no se uso como tal. El enlace de esa fuente apunta a una biblioteca
externa que no se puede verificar desde el repositorio, asi que la clave queda
anotada para cotejarla en Zoho y no se usa para cruzar nada.

LOS NUMEROS QUE VA A PORTAR VIVEN EN SU PROPIO ARCHIVO, NO EN dids.json. Son
el 669 985 14 54 y el 669 985 12 91, las dos de TELMEX, segun el correo del
25 nov. Se cargaron en `data/dids-portabilidad.json` porque `data/dids.json`
lo GENERA `scripts/gen-dids.py` desde el export: una fila escrita ahi a mano
se borra en la siguiente carga sin avisar. Y NO se suman al conteo de «Numeros
Callpicker», que responde a «que numeros tiene hoy»: un numero en tramite no
es uno de esos. Cuando la portabilidad entre, el numero aparecera solo en el
export y la ficha dejara de pintarlo como en tramite por si misma.

EL TELEFONO CAPTURADO ES EL 925 1404, Y LA ELECCION NO ES CASUAL. La tarjeta
del Ing. Favela trae dos: el (669) 985 1454 Ext. 14, que cuelga del conmutador
de la matriz y es una de las lineas en portabilidad, y el (669) 925 1404, que
no esta en la lista. Se captura el segundo porque es el unico que no va a
cambiar de dueno con el tramite; capturar el primero seria guardar como via al
cliente un numero que dentro de unos dias va a ser nuestro.

DATOS QUE FALTAN Y NO SE INVENTARON:
- CUANTAS SUCURSALES CUBRE EL CONTRATO: no lo dice ninguna fuente. El sitio
  publica 9 puntos y la cotizacion habla de 11 extensiones; no son la misma
  cosa y no se deduce una de la otra.
- DOMICILIO DE LOS MOCHIS (la sucursal homonima) y de HERMOSILLO: la propia
  ficha los deja «por confirmar».
- RAZON SOCIAL DEL CONTRATO: el sitio publica «Llanteras Guzman, S.A. de C.V.»
  como proveedor y RFC LGU780408NM3, de sus terminos y condiciones. No es el
  expediente contractual: no hay contrato en `data/contratos.json` —y ese
  archivo cubre solo parte de la cartera, asi que tampoco prueba que no exista.
- EMPLEADOS Y TAMANO: la hoja de activaciones trae «-» en Tamano. No se rellena.

QUE VA A SALIR VACIO EN EL TABLERO Y POR QUE — no es cero, es que no se ha medido:
- FACTURACION / GRC: sin fila. El MRR institucional no es medible hasta la
  primera factura.
- CORTES DE FACTURACION: la cuenta no puede estar en el archivo de cortes; la
  linea se activo hace un dia.
- LLAMADAS: el CID no esta en `data/analisis-llamadas.json`. Sin lectura de
  atencion, y es correcto: no ha habido trafico que medir.
- CHAT: sin fila. No esta contratado.
- TICKETS ABIERTOS: NO MEDIBLE — el export solo trae cerrados. El 121340 (la
  bienvenida) y el de activacion no estan en `data/mesa-ayuda`.
- CONTRATO: no aparece en `data/contratos.json`.
- DIDs: un solo numero, y sin etiqueta propia.

LOS TRES NOMBRES QUE NO SON CONTACTOS NUESTROS: Jorge Chacon (gerente del
taller Marina), Pablo Coronado (taller Pacifico) y Karina Lopez (Palos
Prietos). Salen del directorio de talleres de King Long Mexico, no de nuestro
expediente, y la propia ficha dice que se les llega por el canal publicado de
su sucursal. Quedan aqui como padron de sucursal. El corporativo del grupo
publica contactcenter@grupopetroil.com.mx y el 800 366 7336, que son del grupo
y no de esta cuenta.

Los `score_*` van en 50: es el neutro del sistema para una cuenta sin historial
medido, no una evaluacion."""

FILA = {
    'consecutivo':       CONSECUTIVO,
    'empresa':           'AUTOCENTRO GUZMAN',
    'grupo_empresarial': 'GRUPO PETROIL. Es la CUARTA cuenta del grupo en la cartera, '
                         'junto con F32 Grupo Petroil y Cias, C54 Oceanica y Z47 Petroil - '
                         'Prebiem Oceanica; las cuatro de Dan por instruccion de direccion. '
                         'El proveedor que firma el sitio es Llanteras Guzman, S.A. de C.V. '
                         '(RFC publicado LGU780408NM3). OJO: el asesor de cartera es Dan y '
                         'el KAM real del grupo es Jose Manuel, que vendio esta cuenta; el '
                         'rol de KAM vive en la bitacora de F32 y este campo no se corrige.',
    'asesor':            'Dan',
    'estado':            'activo',
    'cid':               CID,
    'facturacion':       MRR,
    'activo_desde':      '2026-11-26',
    'giro':              'Talleres de mantenimiento automotriz y venta de llantas, con '
                         'atencion a flotillas y servicio a transporte pesado. La hoja de '
                         'activaciones lo clasifica como «producto», que es la etiqueta de '
                         'la hoja y no el giro real.',
    'servicio':          'Comunicacion Empresarial, 11 extensiones = $2,519/mes + 3 numeros '
                         '$267/mes = $2,786 COTIZADOS el 24 nov 2026 (mas IVA). Sin factura '
                         'todavia: no hay fila en el GRC. Un solo DID vivo, 52 669 454 0570, '
                         'activo desde el 26 nov. Portabilidad de dos lineas TELMEX '
                         '(669 985 1454 y 669 985 1291) EN TRAMITE y detenida por documentos.',
    'tamano_empresa':    'SIN CONFIRMAR. La hoja de activaciones trae «-» en Tamano y ninguna '
                         'otra fuente da plantilla. No se rellena con una estimacion.',
    # varchar(255). El padron completo de las nueve sucursales va en
    # observaciones_kam, que es texto libre: aqui solo cabe el conteo.
    'num_oficinas':      'NUEVE publicadas: 4 en Mazatlan (Palos Prietos es la matriz), 1 en '
                         'Culiacan, 1 en Guasave y 3 en Los Mochis. Hermosillo se menciona sin '
                         'domicilio. Cuantas cubre el contrato: NO lo dice ninguna fuente.',
    'total_empleados':   'SIN CONFIRMAR. Ninguna fuente del expediente lo trae.',
    'pagina_web':        'https://autocentroguzman.com/',
    'direccion_fiscal':  'Carretera Internacional al Norte km 1199, Palos Prietos, C.P. 82010, '
                         'Mazatlan, Sinaloa (matriz publicada en su aviso de privacidad). NO '
                         'esta confirmado que sea el domicilio FISCAL del contrato.',
    'contacto_nombre':   'Juan Manuel Favela Garcia',
    'contacto_cargo':    'Encargado de Desarrollo de Sistemas — arma el arbol de extensiones '
                         'y junta la documentacion de portabilidad',
    # El otro numero de su tarjeta, el (669) 985 1454 Ext. 14, es una de las
    # lineas a portar: sembrarlo seria capturar como via al cliente un numero
    # que va a ser nuestro.
    'contacto_tel':      '6699251404',
    'contacto_email':    'soporte@autocentroguzman.com',
    'contactos_json':    CONTACTOS,
    'servicios_json':    SERVICIOS,
    'upsell_producto':   'NO ANTES DE DEJAR EL FLUJO FUNCIONANDO Y LA PORTABILIDAD DENTRO. '
                         'Despues, el camino es la escalera: entra por Comunicacion '
                         'Empresarial, y el salto natural es Visibilidad y Control, que es lo '
                         'que permite medir una red de nueve sucursales. Hoy no se propone.',
    'crossell_producto': 'SIN DEFINIR. La primera pregunta no es de producto: confirmar si las '
                         'lineas a portar tienen internet asociado, porque si lo tienen y no '
                         'se desasocia, el cliente pierde el internet al portar.',
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

print(u'=== ALTA AUTOCENTRO GUZMAN (%s) · asesor Dan ===' % CONSECUTIVO)
print(u'  consecutivo libre : %s' % (u'NO — ya existe %s' % ya if existe else u'si'))
print(u'  CID %s libre    : %s' % (CID, u'NO — ya esta en %s' % porcid if dup_cid else u'si'))
for k in ('empresa', 'asesor', 'estado', 'cid', 'facturacion', 'activo_desde'):
    print(u'  %-18s %s' % (k, FILA[k]))
print(u'  %-18s %s' % ('contacto_email', FILA['contacto_email']))
print(u'  %-18s %s  (no hay uno propio; el fijo del sitio es una linea a portar)'
      % ('contacto_tel', FILA['contacto_tel']))
print(u'  %-18s %d  (el unico del expediente; cargo SIN CONFIRMAR, descrito con palabras)'
      % ('contactos_json', len(CONTACTOS)))
print(u'  %-18s %d  (cotizacion + el DID vivo)' % ('servicios_json', len(SERVICIOS)))
print(u'  %-18s %d caracteres' % ('observaciones_kam', len(OBS_KAM)))
print(u'  %-18s %d caracteres' % ('notas', len(NOTAS)))

# ── EL DINERO: es una COTIZACION y cada sumando tiene fuente ─────────────────
EXTENSIONES, PRECIO_EXT_TOTAL = 11, 2519
NUMEROS_COBRADOS, PRECIO_NUMEROS = 3, 267
NUMEROS_DOCUMENTADOS = ['6699851454', '6699851291']      # correo del 25 nov
CE_CATALOGO = {1: 939, 2: 1239, 3: 1549, 5: 2359}        # data/planes-pago.json

if PRECIO_EXT_TOTAL + PRECIO_NUMEROS != FILA['facturacion']:
    print(u'\n  *** la cotizacion (%d + %d) no es el MRR sembrado (%s)'
          % (PRECIO_EXT_TOTAL, PRECIO_NUMEROS, FILA['facturacion']))
    raise SystemExit(1)
# CONTROL NEGATIVO 1: el subtotal de extensiones NO puede quedar como MRR. Es el
# sumando que se cuela con mas facilidad, y seria $267 de menos cada mes.
if FILA['facturacion'] == PRECIO_EXT_TOTAL:
    print(u'\n  *** se colo el subtotal de extensiones ($%d) como MRR. Faltan los '
          u'numeros.' % PRECIO_EXT_TOTAL)
    raise SystemExit(1)
# CONTROL NEGATIVO 2: si algun dia el catalogo SI trae un CE de 11 extensiones,
# esta nota deja de ser cierta y hay que reescribirla, no dejarla vieja.
if EXTENSIONES in CE_CATALOGO:
    print(u'\n  *** el catalogo ya tiene un CE de %d extensiones ($%d). La nota que '
          u'dice que no existe quedo vieja: reescribirla.'
          % (EXTENSIONES, CE_CATALOGO[EXTENSIONES]))
    raise SystemExit(1)
# CONTROL NEGATIVO 3: no afirmar que el tercer numero es el ya asignado.
if NUMEROS_COBRADOS == len(NUMEROS_DOCUMENTADOS):
    print(u'\n  *** ya coinciden los numeros cobrados y los documentados: la nota que '
          u'declara la diferencia quedo vieja.')
    raise SystemExit(1)
print(u'\n  ok  $%s COTIZADOS = %d extensiones $%s + %d numeros $%s (24 nov 2026, mas IVA)'
      % (format(MRR, ',d'), EXTENSIONES, format(PRECIO_EXT_TOTAL, ',d'),
         NUMEROS_COBRADOS, format(PRECIO_NUMEROS, ',d')))
print(u'  ok  el catalogo «Planes 2.0» NO tiene un CE de %d extensiones (llega a %d, $%s): '
      u'el importe es de cotizacion y no se reconstruye'
      % (EXTENSIONES, max(CE_CATALOGO), format(CE_CATALOGO[max(CE_CATALOGO)], ',d')))
print(u'  ok  %d numeros cobrados contra %d documentados — la diferencia queda declarada, '
      u'no resuelta' % (NUMEROS_COBRADOS, len(NUMEROS_DOCUMENTADOS)))

# ── El CID se derivo del DID: se vuelve a comprobar contra el archivo ───────
DID_ASIGNADO = '526694540570'
try:
    mapa = json.load(io.open(os.path.join(ROOT, 'data', 'dids.json'), encoding='utf-8'))['porCid']
except Exception as e:
    print(u'\n  *** no se pudo leer data/dids.json (%s). El CID de esta cuenta se '
          u'derivo de ahi: sin el archivo no se escribe.' % e)
    raise SystemExit(1)
duenos = [c for c, lst in mapa.items() if any(x.get('n') == DID_ASIGNADO for x in lst)]
if duenos != [CID]:
    print(u'\n  *** el DID %s ya NO cuelga solo del CID %s (ahora: %s). El CID de esta '
          u'cuenta se derivo de ese cruce: revisarlo antes de escribir.'
          % (DID_ASIGNADO, CID, duenos or u'ninguno'))
    raise SystemExit(1)
if len(mapa[CID]) != 1:
    print(u'\n  *** el CID %s ya tiene %d numeros. La derivacion se hizo cuando tenia '
          u'uno solo: confirmarla.' % (CID, len(mapa[CID])))
    raise SystemExit(1)
print(u'  ok  el DID %s cuelga del CID %s y es su unico numero — la derivacion del CID '
      u'se sostiene (y sigue pendiente de confirmar en Zoho)' % (DID_ASIGNADO, CID))
for n in NUMEROS_DOCUMENTADOS:
    if ('52' + n) in json.dumps(mapa):
        print(u'  ok  OJO: el numero %s YA aparece en dids.json — la portabilidad pudo '
              u'haber entrado. Revisar antes de publicar que esta «en tramite».' % n)

# ── El limite de caracteres, que ya tumbo una escritura antes ───────────────
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
print(u'  ok  los %d limites de longitud que declara la tabla se respetan (%s).'
      % (len(LIMITES), u', '.join(u'%s:%d' % (k, LIMITES[k]) for k in sorted(LIMITES))))

# Ninguna columna inventada: se comprueba contra el esquema real.
st3, muestra = req('GET', 'cuentas?select=*&limit=1')
if isinstance(muestra, list) and muestra:
    reales = set(muestra[0].keys())
    sobran = [k for k in FILA if k not in reales]
    if sobran:
        print(u'\n  *** COLUMNAS QUE NO EXISTEN EN LA TABLA: %s' % ', '.join(sobran))
        raise SystemExit(1)
    print(u'  ok  las %d columnas que se escriben existen en la tabla.' % len(FILA))

# Ningun [[enlace]] de memoria puede llegar a una pantalla.
for campo in ('notas', 'observaciones_kam', 'grupo_empresarial', 'servicio'):
    if '[[' in (FILA.get(campo) or ''):
        print(u'\n  *** `%s` lleva un [[enlace]] de memoria y ese texto se imprime tal '
              u'cual en la ficha del asesor. La regla va con palabras; el puntero, en '
              u'un comentario.' % campo)
        raise SystemExit(1)
print(u'  ok  ningun [[enlace]] de memoria en los textos que se publican.')

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
print(u'  1. DESBLOQUEAR LA PORTABILIDAD. El 27 nov se le aviso al Ing. Favela que')
print(u'     la persona del INE no aparece en el acta. El mismo dia mando el ACTA')
print(u'     PODER. Confirmar POR ESCRITO que con eso quedo cubierto el requisito.')
print(u'  2. PREGUNTAR SI LAS LINEAS A PORTAR TIENEN INTERNET ASOCIADO. Si lo')
print(u'     tienen y no se desasocia antes, el cliente PIERDE EL INTERNET al')
print(u'     portar. Activaciones lo advirtio y nadie ha confirmado la gestion.')
print(u'  3. LLEVAR RESUELTAS SUS TRES PREGUNTAS del 10 nov: la app en celulares,')
print(u'     si la computadora la necesita para recibir, y su caso real — dos')
print(u'     extensiones timbrando en los MISMOS equipos (IP, PC y celular).')
print(u'  4. CONFIRMAR LA HORA de la reunion del lunes 30: el correo dice 5:30 pm')
print(u'     CDMX en el texto y «5:30 am» en el bloque de calendario.')
print(u'  5. ACLARAR SI SON TRES PORTABILIDADES O DOS. Se cobran 3 numeros y el')
print(u'     correo documenta 2.')
print(u'  6. CORREGIR LA HOJA DE ORIGEN de Activaciones (ID 190629): sigue como')
print(u'     «demo sin respuesta», «portabilidad: no» y «Sin vendedor». El demo no')
print(u'     se borra.')
print(u'  7. CONFIRMAR EL CID EN ZOHO. El 27954 se derivo del DID asignado.')
print(u'\nEL DATO QUE MANDA: el 669 985 1454 que su sitio publica como telefono de')
print(u'  matriz es una de las dos lineas TELMEX a portar. Lo que se configure el')
print(u'  lunes es lo que va a contestar el telefono principal de la empresa.')
