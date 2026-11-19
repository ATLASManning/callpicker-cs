# -*- coding: utf-8 -*-
"""
Alta de ISHOP MIXUP (C71), asesor Erick.

Instruccion de direccion (19 nov 2026): el Dashboard la marcaba como cuenta de
mas de $3,500 SIN ASESOR. Se construye en la cartera de Erick Sanchez con el
consecutivo que sigue. Dirección añade un dato que nuestras fuentes confirman:
es HERMANA de Tech People.

POR QUE C71
  El prefijo del consecutivo marca a quien la dio de alta. El maximo vivo del
  prefijo C es C70 (GS Trackme, 28 oct 2026), asi que sigue C71. Hay huecos en
  la serie C —52, 53, 55, 58, 59, 61 y 64— y NO se rellenan. Ojo aparte: hay un
  consecutivo «C» a secas, SIN numero (LINEACEL), que no entra en el maximo.
  Ver [[altas-cuentas]] y [[lineacel]].

NO ES TOP, Y ESO SE MIDIO
  «TOP» no es una columna: lo deriva `topDeCartera()` con las 25 de mayor
  importe de la cartera viva. Con $5,512 esta cuenta cae en la POSICION 109 de
  142 con importe (189 vivas), y el corte del top 25 esta hoy en $15,607. No
  entra, y no se le pone. Sus vecinas: Perfiles y aceros Cuajimalpa ($5,525) y
  JAZAK TRUCKS ($5,512, el mismo importe al peso).

LA HERMANDAD CON TECH PEOPLE NO SE SUPONE: ESTA MEDIDA
  1. El expediente de auditoria de Tech People (C1) describe su sector como
     «Reparacion de dispositivos Apple — centros de servicio en TIENDAS ISHOP
     MIXUP». Lo dice nuestro propio repositorio, no una fuente externa.
  2. El telefono que iShop publica para TechPeople —55 7583 9999— es
     EXACTAMENTE el DID 525575839999 que `data/dids.json` asigna al CID 2094
     (Tech People) con la etiqueta «Tech People». Las dos cuentas se tocan en
     un numero que esta en nuestro archivo.
  No se perfila al corporativo: el sujeto de esta ficha es ISHOP MIXUP, CID
  189819. La hermandad se registra porque cambia a quien se llama y con que
  historia, no para traer aqui el expediente de la otra.

FUENTES — cada dato trae la suya y no se mezclan
  1. `data/activaciones.xlsx`, fila por CID 189819 (el CID SI es llave aqui).
  2. `data/grc-zoho.json`, corte vivo GRF.xlsx, mes vivo Noviembre: la fila
     «ISHOP MIXUP» se encuentra por NOMBRE — su `cid` viene vacio.
  3. `data/cortes-facturacion.xlsx`: dos cortes, octubre y noviembre 2026.
  4. `data/dids.json`, por CID: un solo numero.
  5. `lib/tickets-data.json`: CERO tickets (y el export solo trae CERRADOS).
  6. `data/analisis-llamadas.json`: la cuenta NO esta entre las 211 medidas.
  7. Ficha publica de iShop Mixup entregada por direccion el 19 nov 2026
     (sitio oficial, aviso de privacidad, LinkedIn, reporte de Grupo Carso).

REGLA APLICADA: no se inventa ningun dato. Lo que no vino verificado se deja
vacio y se marca CON PALABRAS. Los canales publicos de la ficha —el 800, el
correo de ARCO y el de reclutamiento— NO se capturan como contacto de la
cuenta: la propia ficha advierte que no son interlocutores de TI ni de
contratacion de telefonia. Ver [[feedback-contexto-ia-sin-huecos]].

Es idempotente: si C71 ya existe, actualiza en vez de duplicar.

USO
    python scripts/alta-c71-ishop-mixup.py            # simulacro
    python scripts/alta-c71-ishop-mixup.py --aplicar  # escribe
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

CONSECUTIVO = 'C71'
CID = '189819'
MRR = 5512

# ── Contactos ────────────────────────────────────────────────────────────────
# ACTUALIZADO EL 19 nov 2026, HORAS DESPUES DEL ALTA. La primera version iba
# VACIA porque ninguna fuente nuestra traia un interlocutor. Direccion paso el
# registro de la Oportunidad de Zoho CRM y si lo hay: Liz Flores, con correo y
# telefono. Se corrige aqui y se deja dicho en `notas`, no en silencio.
# Los canales publicos de la ficha —800 006 4987, arco@mixup.com,
# alejandra.chavez@mixup.com (reclutamiento)— SIGUEN sin capturarse: son
# corporativos y no son interlocutores de esta cuenta.
CONTACTOS = [
    {'nombre': 'Liz Flores', 'cargo': 'SIN CAPTURAR — en Zoho el «Nombre de rol» viene vacio',
     'tel': '5951219350', 'email': 'lizbeth.flores@mixup.com',
     'nota': 'ES EL UNICO INTERLOCUTOR REGISTRADO. Figura como «Persona de '
             'contacto» y en Roles de Contacto de la oportunidad CP 189819, '
             'con cuenta «iShop/Mixup». Su rol en la compra esta capturado '
             'como «Precio». NO es quien decide: a la pregunta de a quien hay '
             'que involucrar, el CRM responde «Direccion y ellos», y en otro '
             'campo «Jefe de departamento». Ninguno de los dos tiene nombre.'},
]

SERVICIOS = [
    {'nombre': '8 Extensiones visibilidad y control IL', 'descripcion':
     '$5,512 al mes. Es lo que dicen los cortes de facturacion de octubre y '
     'noviembre de 2026, los dos con el mismo monto. «IL» = ilimitadas: por eso '
     'no hay bolsa de minutos que rebasar ni excedente que cobrar.'},
    {'nombre': 'DID 525598187427', 'descripcion':
     'El UNICO numero del CID en `data/dids.json`, y su etiqueta es '
     '«Available» — o sea sin ruta con nombre. Ocho extensiones contratadas y '
     'un numero sin etiquetar: es la primera pregunta tecnica de la cuenta.'},
]

OBS_KAM = u"""[ALTA 19 nov 2026 · Erick] ISHOP MIXUP — CID 189819.

— QUE ES Y QUE NOS PAGA
Cadena mexicana de tiendas Apple (iShop) y Mixup, de Grupo Sanborns / Grupo
Carso. Con nosotros tiene OCHO extensiones Visibilidad y Control ilimitadas:
$5,512 al mes. Primer pago el 1 de septiembre de 2026, activada el 30 de
septiembre. Es cuenta AAA en el corte de facturacion y lleva tres facturas.

— LO PRIMERO: PAGA OCHO EXTENSIONES Y NO HA GASTADO UN MINUTO
Los dos cortes que existen —octubre y noviembre de 2026— dan CERO minutos
consumidos, los dos. Y el panel va en la misma direccion: 10 visitas en
octubre con perfil «entrantes» y 11 interacciones, contra CERO visitas y CERO
interacciones en noviembre. Medido con `scripts/mide-cortes-cuenta.py 189819`.
Son extensiones ILIMITADAS, asi que no hay rebase que avisarle: lo que hay es
una cuenta AAA de $5,512 al mes que todavia no ha empezado a usarse.

— Y HAY UNA EXPLICACION CANDIDATA, CON EVIDENCIA, QUE NO SE DA POR BUENA
El cierre de la activacion dice textualmente: «Despues de haber realizado meet
para aclaracion de dudas sobre recomendaciones de red, ya no se logro recibir
respuesta de cliente. Durante el meet cliente comenta que en ese momento no
estaba personal de sistemas para la validacion de parametros, indicando que
despues nos comentaba si hubo alguna duda, pero ya no se recibio respuesta.»
O sea: el ticket se cerro como entregado SIN que el area tecnica del cliente
validara los parametros de red, y el cliente dejo de contestar. El consumo cero
de los dos meses siguientes CUADRA con eso, pero cuadrar no es probar. Es la
primera pregunta de la primera llamada: ¿esta puesto en marcha o nunca se
termino de configurar?

— UN SOLO DID, Y SIN ETIQUETA
`data/dids.json` le da un numero al CID: el 525598187427, con etiqueta
«Available». Ocho extensiones y un numero sin ruta con nombre.

— LA HERMANA ES TECH PEOPLE (C1), Y ESO NO ES UN COMENTARIO
Tech People es la cuenta de MAYOR importe medido por CID de toda la cartera
($88,783.20 en el GRC, 116 meses) y la lleva el mismo asesor. Nuestro propio
expediente de auditoria describe a Tech People como «centros de servicio en
tiendas iShop Mixup», y el telefono que iShop publica para TechPeople —55 7583
9999— es exactamente el DID 525575839999 que el archivo asigna al CID 2094 con
la etiqueta «Tech People». Las dos cuentas se tocan en un numero que esta en
nuestro archivo.
Eso cambia la llamada: no se entra como proveedor nuevo de una cuenta de dos
meses, se entra como el proveedor que ya atiende a su hermana desde hace nueve
años y medio.

— EL INTERLOCUTOR ES LIZ FLORES, Y NO ES QUIEN DECIDE
lizbeth.flores@mixup.com · 5951219350. Es la «Persona de contacto» de la
oportunidad CP 189819 y el UNICO nombre del cliente en todo el expediente. Su
rol en la compra esta capturado como «Precio». A la pregunta de a quien hay que
involucrar para decidir, el CRM contesta «Direccion y ellos», y en otro campo
«Jefe de departamento»: DOS figuras de decision, ninguna con nombre. El
responsable de TI o de Telecomunicaciones tampoco esta identificado, y es quien
hace falta para resolver lo de arriba.

— COMO LLEGO: NOS REFIRIERON, Y VENIAMOS DE DETRAS
El lead entro el 3 de agosto de 2026 por «Formulario de Lead Nuevo», con el
origen marcado «Satisfaccion al cliente». Los primeros CINCO intentos de
contacto —llamada sin respuesta, buzon de voz y tres WhatsApp entre el 3 y el 5
de agosto— no sacaron una sola respuesta; el cliente contesto por CORREO el 10
de agosto. En la videollamada del 11 de agosto quedo escrito lo que importa:
«estaban evaluando CloudTalk pero LOS REFIRIERON CON NOSOTROS, les gusto mucho
el alcance y la reporteria que se puede generar».
Esta cuenta no se gano por precio ni por prospeccion: llego recomendada,
compitiendo contra CloudTalk. Quien recomendo no esta escrito — y la candidata
obvia es la hermana.

— LA PREGUNTA QUE EL PROPIO CRM DEJO ABIERTA Y SIGUE ABIERTA
En el motivo de prioridad de la oportunidad: «Aun estan pendientes datos
relevantes como usuarios, DIDs, fecha de implementacion y DEFINIR SI SE
UTILIZARA LA CUENTA DE TECHPEOPLE O UNA CUENTA INDEPENDIENTE».
Se cerro la venta sin resolverlo. Hoy existen las dos cosas —C1 Tech People y
esta C71— y el servicio no ha consumido un minuto. Es la segunda pregunta de la
primera llamada, justo detras de si arranco.

— EL CAMPO QUE DECIDE ESTAS VENTAS ESTA VACIO, OTRA VEZ
«¿Cuantas llamadas reciben y hacen al dia?»: vacio. Y con el, toda la seccion
de CONSUMO —dias laborados, duracion promedio, llamadas simultaneas, CP Chat,
integracion con Teams o CRM y «¿Tienen mas sucursales ademas de la
principal?»— en una cadena que el propio perfilamiento anoto con 116
sucursales. La seccion de PRUEBA, entera vacia: no hubo demo ni criterio de
exito acordado. Y en Budget: «¿Como operan hoy y cual es el costo de esto?» →
«Con telefonia convencional, no tenemos costo».
Es el mismo hueco que mato a CP 190196 — misma respuesta de costo cero, mismo
campo de consumo en blanco— en una cuenta que paga VEINTISEIS VECES MAS y que
lleva dos meses sin gastar un minuto. Ahi es donde esta el riesgo y tambien la
conversacion: nadie le ha preguntado nunca cuanto llama.

— LA PREGUNTA COMERCIAL DE LA CUENTA
El perfilamiento anoto «Tienen 116 sucursales en todo Mexico» y la ficha
publica reporta 132 tiendas iShop al cierre del 2T 2026 mas 48 Mixup. Las dos
cifras se registran con su etiqueta y NO se promedian. Lo que no cambia con
ninguna de las dos: nosotros tenemos OCHO extensiones y UN numero, y lo que se
vendio fue «presentar/cotizar Callpicker para las tiendas iShop/Mixup». Cuantas
sedes pasan hoy por Callpicker NO ESTA MEDIDO, y no se deduce del numero de
tiendas. El censo de sedes conectadas contra no conectadas es lo que convierte
esta cuenta en una conversacion de crecimiento — pero despues de resolver el
cero de consumo, no antes.

— COMO SE LEE ESTA CUENTA, EN UNA FRASE
Cuenta AAA de dos meses que paga puntual $5,512 por ocho extensiones y no ha
consumido un minuto, con el panel apagado en noviembre, con un unico
interlocutor que no es quien decide y con la activacion cerrada sin que su area
de sistemas validara nada. No es una cuenta tranquila: es una cuenta que
todavia no arranca."""

NOTAS = u"""[ALTA 19 nov 2026] C71, asesor Erick, por instruccion de direccion.

ORIGEN DEL ALTA: el Dashboard la señalaba entre los «2 clientes de mas de
$3,500 sin asesor», con $5,512 de primer pago.

CONSECUTIVO: el maximo del prefijo C es C70 (GS Trackme), asi que sigue C71.
Huecos de la serie C que NO se rellenan: 52, 53, 55, 58, 59, 61, 64. Aparte hay
un consecutivo «C» a secas, sin numero (LINEACEL), que no entra en el maximo.

NO ES TOP Y SE MIDIO: con $5,512 cae en la posicion 109 de 142 cuentas vivas
con importe (189 vivas). El corte del top 25 esta en $15,607. «TOP» se deriva,
no se escribe.

CLASIFICACION AAA segun el corte vivo del GRC. No hay columna para eso en
`cuentas`; queda aqui escrito. La banda del GRC y la clasificacion de la hoja
de activaciones son dos cosas distintas y no se sustituyen.

CUATRO FUENTES INDEPENDIENTES DAN $5,512, que es la razon por la que
`facturacion` se siembra con esa cifra y no con otra:
  1. Activaciones 2.0, columna «1er Pago»: 5512 (primer pago, 1 sep 2026).
  2. GRC vivo: mrrIni 5512 · mrrFin 5512 · movimiento «MRR estable» ·
     acumulado 16,536, que es 3 x 5,512 al peso, con 3 facturas y 2 meses.
  3. Cortes de facturacion: $5,512 en octubre y $5,512 en noviembre de 2026.
  4. Zoho CRM, oportunidad CP 189819: Importe e Ingresos esperados $5,512,
     fase «Contrato Firmado - Cierre Logrado» al 100%.
No hay discrepancia que resolver en el dinero de esta cuenta. Y ojo con el
matiz: la columna «1er Pago» es el primer cobro, NO el MRR — aqui coinciden
porque el GRC y los cortes lo confirman por separado, no porque se suponga.

*** LA FILA DEL GRC NO TRAE CID ***
En `data/grc-zoho.json` la fila «ISHOP MIXUP» tiene `cid: null`, y se encuentra
cruzando por NOMBRE. Como `importeDeCuenta` cruza por CID y cae a la ficha
cuando no lo encuentra, el importe de esta cuenta lo va a mandar
`cuentas.facturacion` —o sea este alta— y NO el cruce vivo del GRC. Mismo
problema que GS Trackme y que GTC: mientras el CID no se cargue en el export,
esta cifra hay que revisarla a mano en cada corte. Es la regla del GRC: el MRR
institucional sale de ese export y de nada mas, y sin la llave no se cruza solo.

FECHA DE INICIO: 2026-09-01, la «Fecha 1er Pago» de Activaciones. El ticket de
activacion se abrio el 2 de septiembre y cerro el 30, con 29 dias de
activacion y complejidad «sencillo».

LO QUE EL MOTOR ABRE DE VERDAD — leido, no supuesto (19 nov 2026, releido
despues de capturar a Liz Flores):
NUEVE hallazgos, y confirman la lectura de esta ficha por su cuenta:
  «Esta pagando por minutos que no usa — consume el 0% de su bolsa»
  «No podemos ver su consumo — el CID tiene 2 de 5 meses con dato»
  «Nunca se le ha contactado — cero contactos por un canal real»
  «Sin una sola respuesta de Radar — 0 de 12 preguntas»
  «No hay lectura de sus llamadas» · «Nunca se ha registrado una reunion»
  «No pasa por la mesa de ayuda — cero tickets: o no tiene incidencias, o se
   atienden por fuera y no se ven» · «La cuenta no tiene auditoria»
  «La relacion esta sin construir — 10% de relacionamiento»
Situacion: APAGANDOSE · luz NARANJA · esTop False.
El 10% es de relacionamiento, NO de consumo de voz: no contradice el cero.

*** ERAN DIEZ Y AHORA SON NUEVE, Y ESO ES LA PRUEBA DE QUE ENTRO EL CONTACTO ***
La primera lectura, con `contactos_json` vacio, traia DIEZ hallazgos e incluia
«Sin un solo contacto registrado» —que es `sin_contactos`, y en el motor
depende de `cuantosContactos(c.contactos_json) === 0`, o sea de que haya una
PERSONA capturada, no de que haya habido conversaciones. Al entrar Liz Flores
ese hallazgo SE APAGO y el relacionamiento subio de 4% a 10%.
Las dos cifras de la version anterior de esta nota —«diez hallazgos» y «4%»—
quedaron viejas en el mismo momento en que se capturo el contacto, y se
corrigen aqui. Lo que NO se apago, y hay que no confundir con lo anterior:
«Nunca se le ha contactado», que es `nunca_contactada` y mide CONVERSACIONES
por un canal real. Tener a quien marcarle no es haberle marcado.

*** CORRECCION DEL MISMO DIA, ANTES DE DAR EL ALTA POR TERMINADA ***
La primera version de esta nota afirmaba que se abriria `sin_consumo_medible`
con el texto «la cuenta no aparece en el archivo de cortes», y que la causa
seria que `baseMinutos` no le saca una base al nombre del plan. ERA FALSO EN
LAS DOS COSAS, y lo desmintio el propio motor al leer sus hallazgos:
  1. La alerta que abre dice «2 de 5 meses con dato de consumo», que describe
     este caso con exactitud — la cuenta tiene dos meses de vida.
  2. `baseMinutos` SI le saca base: el hallazgo «consume el 0% de su bolsa»
     no se puede calcular sin ella.
El aviso venia de `mide-cortes-cuenta.py`, que marca el caso como hallazgo; la
prediccion sobre el TEXTO de la alerta la puse yo y no la comprobe contra el
motor. Lo que si era cierto y sigue siendolo: el consumo esta MEDIDO y es CERO.
Se corrige aqui, dentro del texto publicado, y no en silencio. La regla que se
salto: en un alta hay que LEER los hallazgos que abre el motor, no predecirlos.

- LLAMADAS: `tieneLlamadas` sale falso. El CID no esta entre las 211 cuentas
  de `data/analisis-llamadas.json`, asi que el modulo de atencion va a salir
  SIN LECTURA hasta que se pida el Excel. Eso NO contradice los dos cortes de
  arriba: son DOS fuentes distintas —los cortes de facturacion y el reporte de
  llamadas— y confundirlas ya costo publicar dos cosas falsas.

- TICKETS: CERO en el export. Y cero no es «no ha tenido problemas»: el corte
  solo trae CERRADOS, asi que «tickets abiertos» es NO MEDIBLE.

- CHAT: no tiene fila en `app/callpicker-chat/chat-data.ts`. No esta medido.

*** SEGUNDA CORRECCION DEL MISMO DIA: SI HAY INTERLOCUTOR ***
El alta se escribio con `contactos_json` VACIO y los cuatro `contacto_*` en
nulo, diciendo que no existia ningun interlocutor en ninguna fuente. Era cierto
de las fuentes del repositorio —cartera, tickets, activaciones— y FALSO del
expediente completo: horas despues direccion paso el registro de la Oportunidad
de Zoho CRM, que trae a LIZ FLORES con correo y telefono. Queda capturada.
La leccion no es que faltara el dato: es que «no existe en ninguna fuente» solo
puede decirse de las fuentes que uno barrio, y ZOHO CRM NO ESTA EN EL
REPOSITORIO. Se dice con ese alcance o no se dice.

LO QUE APORTA EL REGISTRO DE ZOHO CRM (oportunidad CP 189819, 19 nov 2026):
  Propietario de la oportunidad   Jose Galvan
  Persona de contacto             Liz Flores · lizbeth.flores@mixup.com ·
                                  5951219350 · rol en la compra «Precio»
  Nombre de cuenta en Zoho        iShop/Mixup
  Callpicker_id                   189819  (confirma el CID por una tercera via)
  Lead creado                     03/08/2026 · «Formulario de Lead Nuevo» ·
                                  Referer «Satisfaccion al cliente»
  Oportunidad creada              11/08/2026
  Fase                            Contrato Firmado - Cierre Logrado · 100%
  Fecha de cierre                 01/09/2026 (= la «Fecha 1er Pago» de
                                  Activaciones: dos fuentes, misma fecha)
  Importe / Ingresos esperados    $5,512 (cuarta fuente del MRR)
  Plan a contratar                Visibilidad y Control
  Servicio contratado             8 Extensiones visibilidad y control IL
  Cotizacion adjunta              «Cotizacion Callpicker Conmutador
                                  iShop-Mixup VyC.pdf» (1 MB)
  Fecha estimada para resolver    30/09/2026
  Tamaño de la empresa            «Empresa grande (entre 151 y 250 personas)»
  Comentarios de Perfilamiento    «Tienen 116 sucursales en todo Mexico»
  Intentos de contacto            5 antes de la primera respuesta

EL EMBUDO SI SE RECORRIO, y conviene decirlo porque es lo contrario del otro
caso de este mismo dia (CP 190196, que salto de calificacion a cierre en un
dia). Historial de fases: Analisis de Necesidades 6 dias → Propuesta 3 →
Negociacion 5 → En espera de pago 7 → Cierre Logrado el 01/09. Veintiun dias.
Lo que NO se recorrio son los campos: CONSUMO entero vacio, PRUEBA entera
vacia, y en DIAGNOSTICO «Problema», «Impacto» y «¿Problema confirmado con el
cliente?» tambien vacios.

TRES DISCREPANCIAS QUE SE REGISTRAN CON SU ETIQUETA Y NO SE PROMEDIAN:
  1. VENDEDOR. Zoho CRM: Jose Galvan, propietario de la oportunidad.
     Activaciones 2.0: «Sin vendedor». No es contradiccion de un dato, son dos
     sistemas; pero el 29.4% de las activaciones pagadas estan igual, asi que
     medir «que vendedor trae cuentas que mueren» con esa columna no sirve.
  2. TAMAÑO. Zoho: «Empresa grande (151 a 250 personas)». Activaciones:
     «mediana». LinkedIn: «mas de 10,000 colaboradores». TRES cifras para lo
     mismo. Ninguna viene del cliente por escrito: se registran las tres.
  3. SUCURSALES. Perfilamiento: 116 en todo Mexico. Ficha publica: 132 iShop
     (2T 2026, reporte de Grupo Carso) + 48 Mixup. Son cortes distintos y
     universos distintos. Se dicen las dos, con fecha.
Y una cuarta, menor, de la misma familia que ya se vio en otras oportunidades:
el PRONOSTICO decia $3,000 y el importe cerro en $5,512.

FECHA PREVISTA DE ENTREGA: EXISTE, y se cumplio al dia. El CRM la captura como
«Fecha estimada para resolver: 30/09/2026», y Activaciones cerro el ticket el
30/09/2026. (La ficha de entrega que circulo antes decia que esa fecha no
existia en ninguna fuente: existia, en Zoho.)

DATOS QUE FALTAN Y NO SE INVENTARON:
- CARGO DE LIZ FLORES: SIN CAPTURAR. En «Roles de Contacto» el «Nombre de rol»
  viene vacio, y lo unico registrado es su rol en la compra, «Precio».
- QUIEN DECIDE: sin nombre. El CRM dice «Direccion y ellos» y «Jefe de
  departamento». Son dos figuras y ninguna esta identificada.
- RESPONSABLE DE TI / TELECOMUNICACIONES: no identificado — y es justo quien
  falto en la activacion, que cerro sin que su personal de sistemas validara
  los parametros de red.
- QUIEN NOS REFIRIO: la nota del 11 ago dice «los refirieron con nosotros» y no
  dice quien. La candidata obvia es Tech People, pero no esta escrito y no se
  da por hecho.
- MEDIO DE CONTACTO PREFERENTE: no existe como campo. Lo observado es que de
  cinco intentos por telefono y WhatsApp no salio ninguna respuesta y si
  contesto por CORREO. Es una observacion, no el dato: el preferente lo dice el
  cliente.
- Los canales publicos de la ficha corporativa —800 006 4987, WhatsApp
  55 1342 2310, arco@mixup.com y alejandra.chavez@mixup.com (reclutamiento)—
  NO se capturan: son corporativos y la propia ficha advierte que no deben
  tomarse como contacto de TI ni de contratacion de telefonia.
- RAZON SOCIAL: la ficha publica da «Promotora Musical, S.A. de C.V.
  (PROMUSA)», del aviso de privacidad de iShop. Es dato PUBLICO, SIN confirmar
  contra el expediente contractual. En `cuentas` no hay columna de razon
  social: `direccion_fiscal` es otra cosa.
- CONTRATO: el CID no aparece en `data/contratos.json`, que cubre 61 cuentas.
  Que no este NO prueba que no tenga contrato: son cosas distintas.
- CUANTAS SEDES PASAN POR CALLPICKER: SIN MEDIR. La ficha publica reporta 132
  tiendas iShop (cierre del 2T 2026, reporte de Grupo Carso) y 48 Mixup, pero
  eso NO son 132 sitios contratados. Tenemos ocho extensiones y un DID.
- PLANTILLA: LinkedIn declara «mas de 10,000 colaboradores». Es una cifra de
  perfil de empresa, no auditada, y se registra como tal.
- RESPONSABLES DE TI, TELECOMUNICACIONES Y CUSTOMER EXPERIENCE: la ficha dice
  expresamente que no se identificaron con verificacion suficiente y que no
  seria correcto atribuir esos cargos a perfiles de LinkedIn. Aqui tampoco.
- FECHA PREVISTA DE ENTREGA: no existe en ninguna fuente. Activaciones mide
  dias transcurridos, que es un resultado y no un compromiso.
- CAPACITACION, audio de recepcion conforme y ACEPTACION DE SAC: no existen
  como campo en ninguna parte. Y el audio NO puede ir en `public/`: el PWA
  precachea esa carpeta entera y lo serviria sin pasar por el middleware.

LA HERMANDAD CON TECH PEOPLE, MEDIDA (no es un comentario de pasillo):
  1. `data/auditorias-candidatura.json` recoge el expediente de Tech People
     (C1) con el sector «Reparacion de dispositivos Apple — centros de servicio
     en tiendas iShop Mixup». Lo dice nuestro repositorio.
  2. El telefono publicado por iShop para TechPeople, 55 7583 9999, es el DID
     525575839999 que `data/dids.json` asigna al CID 2094 con la etiqueta
     «Tech People».
Tech People factura $88,783.20 en el GRC (dos lineas, 116 meses) — y `cuentas`
guarda $59,423 en su ficha, que es otra cifra. Eso es de la OTRA cuenta y no se
toca aqui; se deja dicho porque quien lea esta nota va a mirar las dos.

Los `score_*` van en 50: es el neutro del sistema para una cuenta sin historial
medido en el tablero, no una evaluacion."""

FILA = {
    'consecutivo':       CONSECUTIVO,
    'empresa':           'ISHOP MIXUP',
    'grupo_empresarial': 'Grupo Sanborns / Grupo Carso. Razon social publica: Promotora Musical, '
                         'S.A. de C.V. (PROMUSA), del aviso de privacidad de iShop — SIN '
                         'confirmar contra el expediente contractual. HERMANA de Tech People '
                         '(C1, CID 2094), que opera sus centros de servicio.',
    'asesor':            'Erick',
    'estado':            'activo',
    'cid':               CID,
    'facturacion':       MRR,
    'activo_desde':      '2026-09-01',
    'giro':              'Retail tecnologico: venta de dispositivos Apple y accesorios (iShop), '
                         'musica y entretenimiento (Mixup) y soporte tecnico. La hoja de '
                         'activaciones la clasifica como «servicios».',
    'servicio':          '8 Extensiones visibilidad y control IL = $5,512 al mes (cortes de '
                         'octubre y noviembre 2026) + DID 525598187427, etiqueta «Available».',
    'tamano_empresa':    'TRES cifras distintas: Zoho CRM «Empresa grande (151 a 250)», '
                         'Activaciones «mediana», LinkedIn «+10,000». Ninguna la dio el cliente '
                         'por escrito. No se promedian.',
    'num_oficinas':      'Perfilamiento (Zoho): «116 sucursales en todo Mexico». Ficha publica: '
                         '132 iShop (2T 2026) + 48 Mixup. Cuantas pasan por Callpicker: SIN '
                         'MEDIR. Hoy tenemos 8 extensiones y 1 DID.',
    'total_empleados':   'SIN CONFIRMAR. Zoho captura «151 a 250 personas» y LinkedIn declara '
                         'mas de 10,000: ninguna auditada ni dicha por el cliente.',
    'pagina_web':        'https://www.ishopmixup.com/',
    'direccion_fiscal':  'Lago Zurich 245, Edificio Presa Falcon, piso 7, Ampliacion Granada, '
                         'Miguel Hidalgo, C.P. 11529, CDMX — domicilio PUBLICADO en el aviso de '
                         'privacidad de iShop. No confirmado como domicilio fiscal del contrato.',
    'contacto_nombre':   'Liz Flores',
    'contacto_cargo':    None,
    'contacto_tel':      '5951219350',
    'contacto_email':    'lizbeth.flores@mixup.com',
    'contactos_json':    CONTACTOS,
    'servicios_json':    SERVICIOS,
    'upsell_producto':   'NO SE PLANTEA TODAVIA. Consumo CERO en los dos cortes medidos y panel '
                         'apagado en noviembre: primero hay que saber si el servicio arranco. '
                         'Vender mas extensiones a quien no usa las ocho que paga es el camino '
                         'corto a la cancelacion.',
    'crossell_producto': 'SIN DEFINIR, y con DOS preguntas previas que el propio CRM dejo '
                         'abiertas al cerrar la venta: si se usa la cuenta de TechPeople o una '
                         'independiente, y cuantas de sus sedes pasan por Callpicker. El '
                         'perfilamiento anoto 116 sucursales y hoy tenemos 8 extensiones.',
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

print(u'=== ALTA ISHOP MIXUP (%s) · asesor Erick ===' % CONSECUTIVO)
print(u'  consecutivo libre : %s' % (u'NO — ya existe %s' % ya if existe else u'si'))
print(u'  CID %s libre   : %s' % (CID, u'NO — ya esta en %s' % porcid if dup_cid else u'si'))
for k in ('empresa', 'asesor', 'estado', 'cid', 'facturacion', 'activo_desde',
          'contacto_nombre', 'contacto_email', 'contacto_tel'):
    print(u'  %-18s %s' % (k, FILA[k]))
print(u'  %-18s %d  (el unico del expediente: Liz Flores, de Zoho CRM. Los canales '
      u'corporativos NO se capturan como contacto de la cuenta)'
      % ('contactos_json', len(CONTACTOS)))
print(u'  %-18s %d' % ('servicios_json', len(SERVICIOS)))
print(u'  %-18s %d caracteres' % ('observaciones_kam', len(OBS_KAM)))
print(u'  %-18s %d caracteres' % ('notas', len(NOTAS)))

# ── EL DINERO: tres fuentes tienen que seguir dando lo mismo ────────────────
# Si alguien cambia el MRR aqui y no en el resto, esto lo caza antes de
# escribir. El acumulado del GRC es la comprobacion mas barata que existe:
# 3 facturas x 5,512 = 16,536 al peso.
GRC_ACUMULADO, GRC_FACTURAS = 16536.0, 3
PRIMER_PAGO = 5512
CORTES = [5512, 5512]          # octubre y noviembre 2026
CRM_IMPORTE = 5512             # Zoho, oportunidad CP 189819 (cerrada al 100%)
if CRM_IMPORTE != FILA['facturacion']:
    print(u'\n  *** el importe de la oportunidad de Zoho no es el MRR sembrado')
    raise SystemExit(1)
if PRIMER_PAGO != FILA['facturacion']:
    print(u'\n  *** el «1er Pago» de Activaciones no es el MRR sembrado')
    raise SystemExit(1)
if abs(GRC_FACTURAS * FILA['facturacion'] - GRC_ACUMULADO) > 0.01:
    print(u'\n  *** el acumulado del GRC no es %d x %s' % (GRC_FACTURAS, FILA['facturacion']))
    raise SystemExit(1)
if set(CORTES) != {FILA['facturacion']}:
    print(u'\n  *** los cortes de facturacion no dan el MRR sembrado')
    raise SystemExit(1)
print(u'\n  ok  1er Pago = GRC mrrFin = los 2 cortes = la oportunidad de Zoho = $%s'
      % format(MRR, ',d'))
print(u'  ok  acumulado del GRC $%s = %d facturas x $%s'
      % (format(GRC_ACUMULADO, ',.0f'), GRC_FACTURAS, format(MRR, ',d')))

# ── El limite de caracteres, que ya tumbo una escritura antes ───────────────
# Los limites NO se copian a mano: los declara PostgREST en su especificacion.
# Un limite espejeado es un limite que se queda viejo.
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
    raise SystemExit(1)
# CONTROL NEGATIVO: una comprobacion que nunca ha fallado no es una
# comprobacion.
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
print(u'\nLO PRIMERO para Erick, en este orden:')
print(u'  1. ¿ARRANCO EL SERVICIO? Cero minutos en octubre y noviembre, y el')
print(u'     panel paso de 10 visitas a cero. La activacion cerro sin que su')
print(u'     area de sistemas validara los parametros de red.')
print(u'  2. ESCRIBIRLE A LIZ FLORES (lizbeth.flores@mixup.com). Ojo: de cinco')
print(u'     intentos por telefono y WhatsApp no salio ninguna respuesta, y si')
print(u'     contesto por CORREO. Y ella no decide: pedir el nombre de quien si.')
print(u'  3. RESOLVER LO QUE EL CRM DEJO ABIERTO AL CERRAR LA VENTA: si se usa')
print(u'     la cuenta de TechPeople o una independiente. Hoy existen las dos.')
print(u'  4. Preguntar por el DID 525598187427, que esta sin etiquetar.')
print(u'  5. Censo de sedes: 116 que anoto perfilamiento contra 8 extensiones.')
print(u'  6. Pedir que el export del GRC cargue el CID — hoy viene vacio y por')
print(u'     eso el importe lo manda esta ficha y no el cruce vivo.')
print(u'\nEL DATO QUE MANDA: cuenta AAA de $5,512 al mes con CERO minutos')
print(u'  consumidos en los dos cortes que existen. No es una cuenta tranquila:')
print(u'  es una cuenta que todavia no arranca.')
