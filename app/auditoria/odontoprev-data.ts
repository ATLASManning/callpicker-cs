import type { AuditoriaCase } from './types'

/**
 * ODONTOPREV · Odontored Seguros Dentales (C13 · CID 162545) — la voz mejora
 * sola, el chat lleva 246 días atascado, y no sabemos quién decide.
 *
 * Séptima del TOP 50. Como en IMPAS, se escribe con DOS fuentes: lo interno
 * —ficha, llamadas, tickets, GRC, alertas— y la ficha institucional que
 * dirección compiló el 13 oct 2026. Y como en IMPAS, lo externo no fue un
 * adorno: resolvió una contradicción que yo tenía mal planteada.
 *
 * LA CONTRADICCIÓN QUE NO ERA TAL
 * -------------------------------
 * La ficha decía «pequeño-mediano, entre 11 y 50 empleados» y eso chocaba de
 * frente con 76,385 llamadas entrantes y 11,083 horas de conversación. Mi
 * primera lectura fue que el tamaño estaba mal capturado. **Estaba bien**:
 * OdontoPrev no es una cadena de clínicas, es una aseguradora que administra
 * coberturas a través de una RED DE PRESTADORES. Plantilla chica, operación
 * enorme — un millón de asegurados y 320 clientes corporativos. La
 * contradicción era mía.
 *
 * Y lo externo explicó además los destinos: entró a México en 2015 en joint
 * venture con **Grupo IKÉ**, y `CAT GENERAL ODONTOPREV IKE` es su segundo
 * destino de llamadas. Los demás —Bradescard, Zurich Santander, OCESA, Welbe—
 * son clientes corporativos, o sea parte de esos 320.
 *
 * LO QUE SE ESCRIBIÓ TAMBIÉN EN LA FICHA (no sólo aquí)
 * ------------------------------------------------------
 * `scripts/enriquece-odontoprev.py`, con simulacro y relectura: importe
 * $10,901 → $23,325 · el correo sacado del campo de nombre · 8 contactos donde
 * había cero · razón social, matriz, JV con IKÉ, tamaño real, sede y teléfonos
 * públicos · y un addendum fechado en las observaciones del KAM.
 *
 * TODAS las cifras salen de fuente y están verificadas:
 *   · llamadas  → app/cuentas/llamadas-data.ts, CID 162545
 *   · importe   → GRC por CID: DOS líneas, $19,820 + $3,505 = $23,325
 *   · tickets   → lib/tickets-data.json, 30 filas
 *   · alertas   → alertas_episodios, 5 abiertas (2 críticas)
 *   · la empresa → CNSF, AMIS, Cámara México-Brasil, LinkedIn, odontoprev.com.mx
 */
export const ODONTOPREV: AuditoriaCase = {
  id: 'odontoprev',
  asesor: 'Claudia',
  nombre: 'ODONTOPREV México (Odontored Seguros Dentales)',
  sector: 'Seguros dentales y salud bucal — administra coberturas vía red de prestadores',
  fecha_periodo: 'Julio 2024 – Octubre 2026',
  fecha_auditoria: 'Oct 2026',
  tipo_cliente: 'Cuenta AAA · 27 meses · 1 millón de asegurados, 320 clientes corporativos',
  descripcion_contexto: 'El importe real es $23,325, no los $10,901 de la ficha · La voz MEJORA sola: de 5.0% a 1.9% de pérdida, por debajo de su propia base · Pero la mitad de las pérdidas caben en 3 destinos que son el 1.92% del volumen, y el chat lleva un ticket 246 días abierto',
  estado: 'en_riesgo',
  clasificacion: 'CONFIDENCIAL',
  version: '1.0',

  kpis: [
    { label: 'MRR real · la ficha decía $10,901', value: '$23,325',  color: '#ef4444' },
    { label: 'Pérdida: enero → agosto',            value: '5.0→1.9%', color: '#22c55e' },
    { label: 'De las pérdidas, en 3 destinos',     value: '51.5%',   color: '#f97316' },
    { label: '…que son del volumen',               value: '1.92%',   color: '#f97316' },
    { label: 'El peor ticket lleva abierto',       value: '246 días', color: '#ef4444' },
    { label: 'Horas de conversación medidas',      value: '11,083',  color: '#6366f1' },
  ],

  resumen_ejecutivo: 'ODONTOPREV es la séptima del TOP 50 y la tercera seguida en la que `cuentas.facturacion` estaba mal: la ficha decía $10,901 y el GRC dice $23,325 — un 114% más. Y aquí el motivo es distinto de los anteriores: no es un promedio de vida, son DOS líneas con el mismo CID. «Odontoprev ATC» factura $19,820 y «Odontoprev» otros $3,505; la ficha sólo traía una parte. Conviene anotar además que la línea grande viene de un **Downgrade** —de $20,018 a $19,820— pequeño en pesos pero real.\n\nLO QUE ESTÁ BIEN, Y HAY QUE DECIRLO PRIMERO PORQUE ES LA TENDENCIA. El servicio de voz no sólo funciona: está MEJORANDO mes a mes sin que nadie haya intervenido. La pérdida pasó de 5.0% en enero a 1.9% en agosto y 1.6% en lo que va de septiembre, mientras el volumen crecía de 8,366 a 12,865 llamadas mensuales. El mes cerrado pierde 1.92% contra una base propia de 3.50%: son 163 llamadas perdidas MENOS de las que esta cuenta normalmente pierde. Y las líneas de negocio están impecables — Bradescard al 0.5%, Bradescard Asistencias al 0.4%, CAT IKÉ al 1.5%.\n\nPERO LA MITAD DE LAS PÉRDIDAS CABEN EN TRES DESTINOS QUE SON EL 2% DEL TRÁFICO. Un destino llamado «Rojas Chávez Carlos Alberto Octaviano» —el nombre de una persona— recibió 1,009 llamadas y perdió 918: el 91.0%. «(sin destino registrado)» perdió 322 de 450, el 71.6%. «WELBE», 7 de 8. Entre los tres suman 1,247 de las 2,420 pérdidas totales del periodo, sobre 1,467 llamadas que son el 1.92% del volumen. Arreglar esos tres enrutamientos vale más que cualquier otra cosa que se pueda hacer en la voz de esta cuenta.\n\nEL PROBLEMA DE VERDAD NO ESTÁ EN LA VOZ, ESTÁ EN EL CHAT. Los 30 tickets de la mesa son prácticamente todos de chat, y veinte de ellos sobre envíos masivos y campañas. Hay cinco fallas registradas —alerta `sac_fallas_recurrentes` abierta el 12 de octubre— y, sobre todo, un ticket de «Envío Masivo WhatsApp» que lleva **5,908 horas abierto: 246 días**. Otro de bandeja de entrada lleva 2,709 horas. La mediana de resolución son 70 horas, pero la media sube a 379 por esos dos.\n\nY NO SABEMOS QUIÉN DECIDE. El único contacto que nos ha respondido, Guillermo Cisneros, nos dijo el 22 de julio que «actualmente no participa de forma directa en la operación» y que validaría con su equipo. No hubo retroalimentación. Van 83 días de silencio, con `silencio_60` crítica abierta. La investigación pública tampoco identifica un responsable de telefonía: hay CEO con nombre —Mércia Leite Nagem— pero sin vía de contacto verificable. Cero contactos capturados en la ficha, cero reuniones en 27 meses, cero de doce del Radar.',

  resultado_positivo: 'Esta cuenta tiene más cosas bien que mal, y la lista es concreta.\n\nLA VOZ MEJORA SOLA Y SE PUEDE DEMOSTRAR. Enero 5.0%, febrero 4.0%, marzo 3.4%, junio 2.6%, julio 2.2%, agosto 1.9%, septiembre 1.6%. Es una curva descendente limpia y, mientras tanto, el volumen SUBIÓ: de 8,366 llamadas en enero a 12,865 en julio. Mejorar la tasa mientras crece el tráfico es lo difícil. Medido contra su propia base, el mes cerrado está 1.58 puntos por debajo: 163 llamadas perdidas menos de lo normal.\n\nLAS LÍNEAS DE NEGOCIO ESTÁN IMPECABLES. ASEGURADOS BRADESCARD: 17,960 llamadas con 0.5% de pérdida y 12.4 minutos de media. BRADESCARD ASISTENCIAS: 0.4%. DIRECTO ASEGURADOS BRADESCARD: 0.4% y 13.7 minutos. CAT GENERAL ODONTOPREV IKÉ: 1.5%. Son conversaciones largas y reales —9.0 minutos de media en toda la cuenta, 11,083 horas en el periodo— que es exactamente lo contrario de una cuenta automatizada.\n\nLA ADOPCIÓN ESTÁ MEDIDA Y ES ALTA. Tres registros, los tres en ALTO: Callpicker Chat, Pago Automático y Uso del Panel Administrador. Su Health Score es 72, el más alto de las siete auditorías escritas, con los bloques de adopción y pago en 100. Dos de cuatro bloques realmente medidos, que también es el mejor registro de la serie.\n\nY EL ANÁLISIS DEL ASESOR DEL 16 DE JULIO ACERTÓ EN EL DIAGNÓSTICO: «la categoría con mayor recurrencia es Asistencia en Chat… los tickets generados corresponden principalmente a solicitudes de creación de campañas, seguimiento y configuraciones… la demanda de soporte es de carácter operativo y no por fallas del servicio». Eso es correcto y es la lectura buena. Lo que faltó fue la consecuencia: si el soporte que el cliente consume es operativo y repetido, eso es una necesidad de producto o de capacitación, no una cola de tickets.',

  hallazgos: [
    'IMPORTE — LA FICHA DECÍA $10,901 Y SON $23,325. Un 114% más. Y el motivo es distinto de las auditorías anteriores: no es un promedio de vida, son DOS líneas con el mismo CID 162545 — «Odontoprev ATC» con $19,820 y «Odontoprev» con $3,505. La ficha traía sólo una parte. Es la tercera cuenta seguida donde `cuentas.facturacion` no sirve, por la tercera razón distinta.',
    'IMPORTE — LA LÍNEA GRANDE VIENE DE UN DOWNGRADE. «Odontoprev ATC» pasó de $20,018 a $19,820, con $198 de pérdida declarada y movimiento «Downgrade». Son $198 al mes, o sea poco dinero — pero es un movimiento a la baja en la línea que concentra el 85% del contrato, y nadie lo ha preguntado.',
    'ATENCIÓN — LA VOZ MEJORA SOLA, Y MIENTRAS EL VOLUMEN CRECE. De 5.0% de pérdida en enero a 1.9% en agosto y 1.6% en septiembre, con el volumen subiendo de 8,366 a 12,865 llamadas al mes. El mes cerrado está 1.58 puntos POR DEBAJO de su base propia: 163 llamadas perdidas menos de las que normalmente pierde. Es la única cuenta de la serie cuya curva va a mejor sin que hayamos intervenido.',
    'ATENCIÓN — LA MITAD DE LAS PÉRDIDAS CABEN EN TRES DESTINOS QUE SON EL 1.92% DEL VOLUMEN. «Rojas Chávez Carlos Alberto Octaviano» pierde 918 de 1,009 (91.0%), «(sin destino registrado)» pierde 322 de 450 (71.6%) y «WELBE» 7 de 8 (87.5%). Entre los tres: 1,247 de las 2,420 pérdidas del periodo. El resto de la cuenta pierde el 1.5% de media.',
    'ATENCIÓN — Y UNO DE ESOS DESTINOS ES EL NOMBRE DE UNA PERSONA. «Rojas Chávez Carlos Alberto Octaviano» recibió 1,009 llamadas de 102 números distintos y contestó 91. Una extensión personal que recibe mil llamadas y contesta noventa no es un problema de capacidad: o la persona ya no está, o el enrutamiento manda ahí lo que no debería. Las dos cosas se arreglan el mismo día en que alguien lo mire.',
    'MEDICIÓN — EL 51.4% DEL TRÁFICO NO TRAE DESTINO. 39,258 de las 76,385 llamadas caen en «(destino no venía en el archivo)». Tiene 2.2% de pérdida y 7.8 minutos de media, o sea que se comporta como las líneas de negocio — pero mientras la mitad del tráfico sea anónima, no se puede decirle al cliente qué línea suya funciona mejor.',
    'SERVICIO — EL PROBLEMA ESTÁ EN EL CHAT, NO EN LA VOZ. De 30 tickets, prácticamente todos son de chat y VEINTE son sobre envíos masivos y campañas: «Reporte de Campaña» 9, «Envío Masivo WhatsApp» 7, «Falla Envíos Masivos» 3, «Envío Masivo SMS» 1. La voz aparece una sola vez, en octubre, por DiDs.',
    'SERVICIO — UN TICKET LLEVA 246 DÍAS ABIERTO. «Envío Masivo WhatsApp (chat)», 5,908 horas. Otro de «Bandeja de entrada» lleva 2,709 horas (113 días). La mediana de resolución de la cuenta son 70 horas, razonable; la media sube a 379 por culpa de esos dos. Ocho de los 30 tickets (26.7%) pasaron de siete días.',
    'SERVICIO — CINCO FALLAS REGISTRADAS Y UNA ALERTA NUEVA. `sac_fallas_recurrentes` se abrió el 12 de octubre: 5 fallas sobre 30 tickets (16.7%), la última el 6 de octubre. Tres de las cinco son «Falla Envíos Masivos». El envío masivo no es un capricho del cliente: es el producto que le falla.',
    'RELACIÓN — EL ÚNICO CONTACTO NOS DIJO QUE YA NO ESTÁ EN LA OPERACIÓN. El 22 de julio, Guillermo Cisneros —Líder de Operaciones CAT— respondió que «actualmente no participa de forma directa en la operación» y que validaría con su equipo antes de darnos retroalimentación. Esa retroalimentación nunca llegó. Lo dijo él mismo hace casi tres meses y nadie buscó al sustituto.',
    'RELACIÓN — Y NO HAY RESPONSABLE DE TELEFONÍA EN NINGUNA FUENTE. Ni en la ficha ni en la investigación pública: no se identificó un CIO, un gerente de infraestructura ni un responsable del servicio. Hay CEO con nombre —Mércia Leite Nagem, identificada por la Cámara México-Brasil en 2026— pero sin teléfono ni correo verificable. El hueco es doble: no sabemos quién decide y no tenemos cómo preguntarlo.',
    'RELACIÓN — 83 días sin que nada llegue al cliente (`silencio_60` crítica), cero contactos en `contactos_json`, cero reuniones en 27 meses y 0 de 12 del Radar. Score relacional 31. Hay cinco alertas abiertas, dos de ellas críticas.',
    'FICHA — EL CORREO VIVÍA DENTRO DEL CAMPO DE NOMBRE. «Oscar Guillermo Cisneros Linares      olinares@odontoprev.com.mx» en `contacto_nombre`, con `contacto_email` VACÍO. Es el tercer caso idéntico de la serie, tras Torres Corzo y ECODELI: un dato que existe pero está en el campo equivocado es invisible para cualquier automatismo. Corregido el 13 oct 2026.',
    'CONTEXTO — LA CONTRADICCIÓN DE TAMAÑO NO EXISTÍA, Y ERA MÍA. La ficha decía «11 a 50 empleados» y eso parecía incompatible con 76,385 llamadas y 11,083 horas de conversación. No lo es: OdontoPrev administra coberturas a través de una RED DE PRESTADORES afiliados, no de clínicas propias. Plantilla pequeña, operación grande — un millón de asegurados y 320 clientes corporativos. La investigación lo advierte de forma explícita y hay que respetarlo: una red de odontólogos NO equivale a sucursales.',
    'CONTEXTO — LOS DESTINOS DE LLAMADAS SON SUS CLIENTES CORPORATIVOS, y eso explica la estructura. Bradescard (17,960 llamadas), CAT GENERAL ODONTOPREV IKÉ (12,779), Bradescard Asistencias, Directo Asegurados Bradescard, Zurich Santander, OCESA, Welbe. Es un modelo B2B2C: cada cliente corporativo tiene su línea y sus asegurados marcan ahí. De los 320 clientes corporativos que declara, siete tienen línea identificable con nosotros.',
    'CONTEXTO — Y EL SEGUNDO DESTINO MÁS GRANDE ES SU SOCIO DE ENTRADA AL PAÍS. OdontoPrev llegó a México en 2015 mediante joint venture con **Grupo IKÉ**, y `CAT GENERAL ODONTOPREV IKE` mueve 12,779 llamadas y 99,456 minutos. La alianza no es historia corporativa: está viva en el tráfico.',
    'FICHA — EL VÍNCULO CON BRADESCO QUE AFIRMABA LA FICHA NO ESTÁ CONFIRMADO. La ficha decía «Odontoprev está vinculada al Grupo Bradesco Seguros» y las notas lo repetían. La investigación institucional identifica como matriz a Odontoprev Brasil y como alianza de entrada a Grupo IKÉ, sin mencionar a Bradesco. Se reescribió como «por confirmar». Lo que SÍ está medido es otra cosa y es más útil: **Bradescard es su mayor destino de llamadas**, con 222,233 minutos. La relación comercial con ese grupo es un hecho aunque la societaria esté sin verificar.',
    'FICHA — CONTRADICCIÓN ABIERTA: `tiene_pago_automatico` está en FALSO mientras el registro de adopción dice «Pago Automático: ALTO». Una de las dos es falsa y la resuelve el cliente, no nosotros. Se deja señalada, no corregida a ojo.',
    'OPERACIÓN — EL CAT TRABAJA SÁBADO Y DOMINGO. 6,997 llamadas en sábado y 2,561 en domingo, contra unas 13,000 por día entre semana. Un centro de atención de seguros con cobertura de fin de semana es coherente con asistencias y urgencias dentales — y significa que la ventana de servicio es más ancha de lo que una ficha de «oficina corporativa» sugiere.',
  ],

  cronologia: [
    { fecha: '2015',          responsable: 'OdontoPrev',        evento: 'La matriz brasileña entra a México mediante joint venture con Grupo IKÉ. La razón social mexicana es Odontored Seguros Dentales, S.A. de C.V.', tipo: 'neutral' },
    { fecha: '03 Jul 2024',   responsable: 'Callpicker',        evento: 'Alta de la cuenta. Servicio: CP Chat + Paquete de SMS + Visibilidad y Control + DID. 27 meses de relación.', tipo: 'ok' },
    { fecha: 'Ene 2026',      responsable: 'Operación CAT',     evento: '8,366 llamadas con 421 perdidas: 5.0%. Es el peor mes del periodo medido y el punto de partida de una mejora sostenida.', tipo: 'problema' },
    { fecha: 'Mar–May 2026',  responsable: 'Mesa de ayuda',     evento: 'Empiezan a acumularse los tickets de chat: envíos masivos, reportes de campaña, plantillas verificadas. Nueve en tres meses.', tipo: 'problema' },
    { fecha: '26 Jun 2026',   responsable: 'Claudia',           evento: 'Actividad de llamada programada: NO se completó.', tipo: 'problema' },
    { fecha: '16 Jul 2026',   responsable: 'Claudia',           evento: 'Análisis de tickets cerrado, y el diagnóstico es correcto: «la categoría con mayor recurrencia es Asistencia en Chat… la demanda de soporte es de carácter operativo y no por fallas del servicio».', tipo: 'ok' },
    { fecha: '22 Jul 2026',   responsable: 'Claudia / Cisneros', evento: 'ÚLTIMO contacto efectivo. Cisneros responde que «actualmente no participa de forma directa en la operación» y que validará con su equipo. Desde aquí se cuentan los 83 días.', tipo: 'pivote' },
    { fecha: '24 Jul 2026',   responsable: 'Claudia',           evento: 'Se registra el seguimiento. La retroalimentación prometida por el cliente nunca llegó, y nadie buscó al sustituto.', tipo: 'problema' },
    { fecha: 'Ago 2026',      responsable: 'Mesa de ayuda',     evento: 'Siete tickets, el pico del año, con dos fallas. Entre ellos el de «Bandeja de entrada» que acabará llevando 2,709 horas.', tipo: 'problema' },
    { fecha: 'Ago 2026',      responsable: 'Operación CAT',     evento: 'Mes cerrado: 10,360 llamadas con 1.9% de pérdida, 1.58 puntos por DEBAJO de su base propia. La mejor lectura del periodo.', tipo: 'ok' },
    { fecha: 'Sep 2026',      responsable: 'Mesa de ayuda',     evento: 'Se abre el ticket de «Envío Masivo WhatsApp» que a la fecha de esta auditoría lleva 5,908 horas: 246 días.', tipo: 'problema' },
    { fecha: '06 Oct 2026',   responsable: 'Motor de alertas',  evento: 'Se abren cuatro alertas: `sin_consumo_medible` y `silencio_60` (críticas), `sin_radar` y `sin_contactos` (altas).', tipo: 'problema' },
    { fecha: '12 Oct 2026',   responsable: 'Motor de alertas',  evento: 'Se abre `sac_fallas_recurrentes`: 5 fallas sobre 30 tickets, la última el 6 de octubre.', tipo: 'problema' },
    { fecha: '13 Oct 2026',   responsable: 'Callpicker',        evento: 'Auditoría. Se corrige el importe ($10,901 → $23,325), se separa el correo del campo de nombre y se capturan 8 contactos donde había cero, con la investigación institucional de dirección.', tipo: 'pivote' },
  ],

  perfil_campos: [
    { label: 'Nombre comercial',      value: 'OdontoPrev México' },
    { label: 'Razón social',          value: 'Odontored Seguros Dentales, S.A. de C.V.' },
    { label: 'Sector',                value: 'Seguros / salud dental — B2B, B2C y colectivos' },
    { label: 'Modelo',                value: 'Administra coberturas a través de una RED DE PRESTADORES. NO es cadena de clínicas propias.' },
    { label: 'Entrada a México',      value: '2015, mediante joint venture con Grupo IKÉ' },
    { label: 'Matriz',                value: 'Odontoprev Brasil. El vínculo con Bradesco que registraba la ficha está POR CONFIRMAR.' },
    { label: 'Operación',             value: '~1 millón de asegurados · 320 clientes corporativos' },
    { label: 'Plantilla',             value: '11–50 en México (LinkedIn) · ~2,000 en el grupo global' },
    { label: 'Sede',                  value: 'UNA oficina corporativa: Av. Paseo de la Reforma 373, Piso 11, Col. Cuauhtémoc, CDMX 06500' },
    { label: 'Expansión mencionada',  value: 'Querétaro, Guanajuato y Nuevo León (Cámara México-Brasil, 2026). NO confirma oficinas físicas.' },
    { label: 'Teléfonos públicos',    value: '55 5480 0911 (directorio AMIS) · 55 5080 0200 y 55 5480 0777 (directorios comerciales, vigencia por comprobar)' },
    { label: 'Cliente desde',         value: '3 de julio de 2024 — 27 meses' },
    { label: 'Servicio contratado',   value: 'CP Chat + Paquete de SMS + Visibilidad y Control + DID' },
    { label: 'Facturación mensual',   value: '$23,325 MXN — DOS líneas del mismo CID: «Odontoprev ATC» $19,820 (en Downgrade) + «Odontoprev» $3,505. La ficha decía $10,901.' },
    { label: 'Uso real medido',       value: '76,385 llamadas · 664,956 minutos · 11,083 horas · 9.0 min por llamada' },
    { label: 'Health Score',          value: '72 — el más alto de las auditorías escritas · adopción 100, pago 100, actividad 50, relacional 31' },
  ],

  necesidad_negocio: 'OdontoPrev no atiende pacientes: administra coberturas. Vende seguros dentales a empresas y a personas, y cuando un asegurado necesita algo, lo resuelve a través de una red de odontólogos afiliados. Su plantilla en México es de 11 a 50 personas y su operación cubre a cerca de un millón de asegurados de 320 clientes corporativos. Esa desproporción es el negocio, no una anomalía.\n\nY por eso el teléfono es su operación entera. Cada cliente corporativo tiene su propia línea —Bradescard, IKÉ, Zurich Santander, OCESA, Welbe— y los asegurados de cada uno marcan ahí. Son 76,385 llamadas en ocho meses y medio con nueve minutos de conversación de media: once mil horas de gente resolviendo coberturas, autorizaciones y citas. Para una empresa de cincuenta personas como máximo, el centro de atención es casi todo lo que hace.\n\nEso define qué significa una llamada perdida aquí: es un asegurado de un cliente corporativo que no fue atendido, y la queja no llega a OdontoPrev — llega a Bradescard, a IKÉ o a Zurich. El servicio que nos compra es, literalmente, cómo cumple frente a sus propios clientes.\n\nLa necesidad que tiene hoy y que nadie ha puesto sobre la mesa es doble. Una: saber qué línea suya funciona mejor y cuál peor, que hoy no puede porque la mitad de su tráfico ni siquiera trae destino identificado en nuestro archivo. Y dos: que el envío masivo deje de fallarle, porque veinte de sus treinta tickets son eso y lleva uno abierto desde hace 246 días.',

  potencial_corto: [
    'Arreglar tres enrutamientos: «Rojas Chávez Carlos Alberto Octaviano» (91.0% de pérdida), «(sin destino registrado)» (71.6%) y «WELBE». Son el 1.92% del volumen y la mitad de todas las pérdidas de la cuenta.',
    'Cerrar el ticket de 246 días y el de 113. Llegar a hablar de crecimiento con eso abierto le entrega al cliente el argumento.',
    'Identificar al responsable de telefonía: nuestro único contacto dijo hace tres meses que ya no está en la operación, y no hay sustituto ni en la ficha ni en fuentes públicas.',
    'Etiquetar el 51.4% del tráfico que no trae destino, para poder darle al cliente el desglose por línea corporativa.',
  ],

  potencial_largo: [
    'Reporte por cliente corporativo: cada línea es un contrato suyo con Bradescard, IKÉ o Zurich. Un informe de atención por línea es material con el que él cumple frente a SUS clientes, no una función más.',
    'IA de Chat: no la tiene contratada, y el chat es justo donde se concentran todos sus tickets. Es el producto que resolvería su dolor conocido.',
    'IA de Voz: tampoco contratada. Con 11,083 horas de conversación y un CAT que trabaja fin de semana, hay franja para automatizar lo repetitivo.',
    'Integración API: `tiene_integracion_api` está en falso. Una aseguradora que valida coberturas por teléfono es el caso natural de una consulta automatizada contra su sistema.',
  ],

  tacticas: [
    { nombre: 'Abrir con la mejora, no con el problema', descripcion: 'Su pérdida bajó de 5.0% a 1.9% mientras el volumen subía. Es verdad, es suyo y es una buena noticia que nadie le ha dado.', impacto: 'Compra el derecho a hablar después de los tres destinos rotos y del ticket de 246 días.' },
    { nombre: 'Llevar los tres destinos con nombre y cifra', descripcion: '«Hay una extensión a nombre de Carlos Alberto Rojas Chávez que recibió 1,009 llamadas y contestó 91». Es específico, verificable y se arregla en un día.', impacto: 'Demuestra que miramos su operación al detalle, y resuelve la mitad de sus pérdidas.' },
    { nombre: 'Reconocer el ticket de 246 días antes de que lo saque él', descripcion: 'Llevarlo nosotros a la mesa, con fecha comprometida. Es nuestro, no suyo.', impacto: 'Quita de la conversación la única objeción que no se puede contestar con datos.' },
    { nombre: 'Buscar al sustituto por la vía corporativa', descripcion: 'Cisneros dijo que validaría con su equipo. Preguntarle directamente a quién hay que escribirle, en vez de seguir escribiéndole a él.', impacto: 'Convierte tres meses de silencio en un nombre.' },
  ],

  senal_alarma: 'Una cuenta de $23,325 al mes cuyo único contacto nos avisó hace tres meses de que ya no está en la operación, sin que nadie haya buscado al sustituto; con cero contactos capturados, cero reuniones en 27 meses, cero del Radar y cinco alertas abiertas; y con un ticket de envío masivo que lleva 246 días sin cerrarse. El servicio de voz mejora solo, lo cual es justamente lo que ha hecho que nadie mire la cuenta.',

  problema_raiz: 'El indicador que todos miran —la pérdida de llamadas— viene mejorando, y esa mejora tapó que el cliente nos avisó de que ya no teníamos interlocutor.',

  problema_raiz_detalle: 'El 22 de julio de 2026 el cliente nos dijo algo importante y quedó escrito en nuestra propia ficha: Guillermo Cisneros, el único contacto registrado, respondió que «actualmente no participa de forma directa en la operación» y que validaría la información con su equipo antes de darnos retroalimentación. Esa retroalimentación nunca llegó, y en los 83 días siguientes nadie buscó a quién la tenía. La frase estaba ahí, en el seguimiento, legible. Un cliente que te avisa de que has dejado de hablar con la persona correcta te está dando la oportunidad de corregirlo, y la dejamos pasar.\n\nLa primera capa de por qué pasó es que los números iban bien. La pérdida de llamadas bajó de 5.0% a 1.9% mientras el volumen crecía, y el Health Score es 72, el más alto de las siete cuentas auditadas. Cuando el semáforo mejora, la cuenta deja de subir a la cola de nadie. Es la misma mecánica que en ECODELI —una cuenta que no da problemas no es una cuenta atendida— sólo que aquí es más engañosa, porque la mejora era real.\n\nLa segunda es que se miró el canal equivocado. El servicio de voz, que es lo que el tablero mide con detalle, es justamente lo que funciona. El canal que falla es el chat: veinte de sus treinta tickets son sobre envíos masivos y campañas, hay cinco fallas registradas y un ticket lleva 246 días abierto. El propio asesor lo diagnosticó bien el 16 de julio —«la categoría con mayor recurrencia es Asistencia en Chat… la demanda de soporte es de carácter operativo»— pero la conclusión que se sacó fue que la cuenta estaba estable, cuando lo que ese patrón decía es que el cliente necesita del producto algo que el producto no le está dando solo.\n\nLa tercera es de agregación, y es la que esconde el hallazgo más accionable. La cuenta pierde el 3.17% de sus llamadas, que es una cifra aceptable y no invita a investigar. Pero ese promedio mezcla líneas impecables —Bradescard al 0.5%— con tres destinos que pierden entre el 71% y el 91%. Mirando sólo el total, los tres son invisibles; mirando por destino, son la mitad de todas las pérdidas sobre el 2% del tráfico. El promedio no mintió: ocultó.\n\nY la cuarta es de ficha. El importe estaba al 47% del real porque la cuenta tiene dos líneas en el GRC y sólo se traía una; el correo del contacto vivía dentro del campo de nombre, donde ningún automatismo lo ve; y `contactos_json` estaba vacío en una cuenta de 27 meses. Nada de eso es culpa de quien la atiende: es que la ficha no obliga a nada y nadie revisa si lo que guarda es cierto.',

  flujo_real: [
    { fase: 'El asegurado marca',      area: 'Cliente de Bradescard, IKÉ o Zurich', accion: 'Llama a la línea de su propio corporativo', resultado: '76,385 llamadas al periodo, 9.0 minutos de media' },
    { fase: 'Entra por su línea',      area: 'Callpicker',          accion: 'La llamada se dirige al destino de ese cliente corporativo', resultado: 'Bradescard 0.5% de pérdida · CAT IKÉ 1.5% — impecables' },
    { fase: '…salvo tres destinos',    area: 'Callpicker / OdontoPrev', accion: 'La llamada cae en una extensión personal o sin destino', resultado: '1,247 de las 2,420 pérdidas totales, sobre el 1.92% del volumen' },
    { fase: 'Un agente del CAT atiende', area: 'OdontoPrev',        accion: 'Resuelve cobertura, autorización o cita', resultado: '11,083 horas de conversación con una plantilla de 11–50 personas' },
    { fase: 'El tablero lo evalúa',    area: 'Dashboard',           accion: 'Publica el 3.17% de pérdida del total', resultado: 'Cifra aceptable que esconde tres destinos al 71–91%' },
    { fase: 'El cliente pide campañas',area: 'Mesa de ayuda',       accion: 'Abre ticket de envío masivo o reporte de campaña', resultado: '20 de 30 tickets · 5 fallas · uno lleva 246 días abierto' },
    { fase: 'SAC revisa',              area: 'SAC',                 accion: 'Análisis de tickets del 16 de julio', resultado: 'Diagnóstico correcto —«asistencia en chat, carácter operativo»— y conclusión de cuenta estable' },
    { fase: 'El cliente avisa',        area: 'OdontoPrev',          accion: '«Ya no participo de forma directa en la operación»', resultado: '83 días después, nadie ha buscado al sustituto' },
  ],

  comparativo: [
    { metrica: 'Importe en la ficha', real: '$10,901', ideal: '$23,325 — las DOS líneas del mismo CID' },
    { metrica: 'Pérdida de llamadas · tendencia', real: '5.0% → 1.9% mientras el volumen sube', ideal: 'Ya va bien. Es la única de la serie que mejora sola.' },
    { metrica: 'Las tres peores rutas', real: '91.0%, 71.6% y 87.5% de pérdida', ideal: 'Al nivel del resto de la cuenta: ~1.5%' },
    { metrica: 'Concentración de las pérdidas', real: '51.5% de ellas en el 1.92% del tráfico', ideal: 'Repartidas, o sea sin un cuello identificable' },
    { metrica: 'Tráfico con destino identificado', real: '48.6%', ideal: '100% — sin eso no hay reporte por cliente corporativo' },
    { metrica: 'Ticket más antiguo abierto', real: '5,908 horas · 246 días', ideal: 'Ninguno fuera de SLA' },
    { metrica: 'Tickets por encima de 7 días', real: '8 de 30 (26.7%)', ideal: '<5%' },
    { metrica: 'Contactos capturados', real: '0 en `contactos_json` (corregido a 8 el 13 oct)', ideal: 'Quien opera, quien decide y quien paga' },
    { metrica: 'Responsable de telefonía', real: 'SIN IDENTIFICAR en ninguna fuente', ideal: 'Un nombre con correo' },
    { metrica: 'Reuniones en 27 meses', real: 'NINGUNA', ideal: 'Trimestral: 9' },
    { metrica: 'Radar de 12 preguntas', real: '0 respondidas', ideal: '12 de 12' },
    { metrica: 'Días desde el último contacto', real: '83', ideal: '<30' },
  ],

  plan_inmediato: [
    { accion: '✓ HECHO el 13 oct 2026 — Corregido el importe de la ficha: $10,901 → $23,325, que son las DOS líneas del mismo CID. Y capturados 8 contactos donde había cero, con el correo sacado del campo de nombre', responsable: 'Claudia / Facturación', criterio: 'Aplicado y comprobado leyendo de vuelta con `scripts/enriquece-odontoprev.py`' },
    { accion: 'ARREGLAR LOS TRES ENRUTAMIENTOS ROTOS: la extensión «Rojas Chávez Carlos Alberto Octaviano» (918 perdidas de 1,009), «(sin destino registrado)» (322 de 450) y «WELBE». Son la mitad de las pérdidas de la cuenta sobre el 2% del tráfico', responsable: 'Ingeniería / Claudia', criterio: 'Los tres destinos por debajo del 5% de pérdida, o retirados si ya no deben existir' },
    { accion: 'CERRAR el ticket de «Envío Masivo WhatsApp» que lleva 5,908 horas (246 días) y el de «Bandeja de entrada» con 2,709 (113 días), antes de cualquier conversación comercial', responsable: 'Mesa de ayuda', criterio: 'Los dos cerrados o con fecha comprometida por escrito' },
    { accion: 'IDENTIFICAR AL RESPONSABLE DE LA OPERACIÓN. Cisneros avisó el 22 de julio de que ya no participa; preguntarle a él mismo a quién hay que escribirle, que es lo que no se hizo en 83 días', responsable: 'Claudia', criterio: 'Un nombre con cargo y correo, capturado en la ficha' },
    { accion: 'Preguntar por el Downgrade de la línea «Odontoprev ATC»: de $20,018 a $19,820. Son $198, pero es un movimiento a la baja en la línea que concentra el 85% del contrato', responsable: 'Claudia', criterio: 'Se sabe qué se redujo y por qué' },
    { accion: 'Resolver la contradicción de la ficha: `tiene_pago_automatico` en FALSO contra un registro de adopción que dice «Pago Automático: ALTO»', responsable: 'Claudia', criterio: 'Un solo valor, confirmado con el cliente' },
  ],

  plan_mediano: [
    { accion: 'Etiquetar el 51.4% del tráfico que llega sin destino identificado', responsable: 'Ingeniería', criterio: 'Todas las llamadas con su línea corporativa identificada' },
    { accion: 'Primera reunión en 27 meses, con quien opere el CAT y con quien decida sobre el servicio', responsable: 'Claudia', criterio: 'Reunión registrada con minuta, y el Radar contestado en la misma sesión' },
    { accion: 'Atacar de raíz el envío masivo: 20 de 30 tickets y 3 de las 5 fallas son eso. O es una capacitación que no se dio, o es una función que no cubre lo que el cliente necesita', responsable: 'Mesa de ayuda / Producto', criterio: 'Cero tickets de envío masivo durante 60 días' },
    { accion: 'Confirmar o descartar el vínculo con Bradesco que la ficha afirmaba y la investigación no respalda', responsable: 'Claudia', criterio: 'La ficha dice lo que se puede sostener, con su fuente' },
  ],

  plan_estrategico: [
    { accion: 'Reporte de atención por cliente corporativo. Cada destino es un contrato suyo con Bradescard, IKÉ o Zurich: un informe por línea es con lo que él cumple frente a SUS clientes', responsable: 'Producto / Claudia', criterio: 'El cliente recibe un reporte mensual por línea corporativa' },
    { accion: 'IA de Chat: es el canal donde se concentran todos sus tickets, y no la tiene contratada', responsable: 'Claudia', criterio: 'Propuesta presentada citando sus propios 20 tickets de campañas' },
    { accion: 'IA de Voz para la franja de fin de semana: el CAT atiende sábado (6,997 llamadas) y domingo (2,561)', responsable: 'Claudia', criterio: 'Propuesta con el perfil real de su tráfico de fin de semana' },
    { accion: 'QUE EL TABLERO MUESTRE LA PÉRDIDA POR DESTINO, NO SÓLO EL TOTAL. El 3.17% de esta cuenta es aceptable y esconde tres rutas al 71–91%. El promedio no mintió: ocultó', responsable: 'Producto / Dirección', criterio: 'La ficha de cuenta señala los destinos cuya pérdida se aparta del resto' },
  ],

  areas_oportunidad: [
    { area: 'Los tres enrutamientos rotos', impacto: '1,247 llamadas perdidas, la mitad del total de la cuenta', responsable: 'Ingeniería' },
    { area: 'El envío masivo de chat', impacto: '20 de 30 tickets y 3 de las 5 fallas', responsable: 'Mesa de ayuda / Producto' },
    { area: 'Reporte por cliente corporativo', impacto: 'Es con lo que el cliente cumple frente a Bradescard, IKÉ y Zurich', responsable: 'Producto' },
    { area: 'IA de Chat', impacto: 'El canal que le falla, sin producto que lo resuelva', responsable: 'Claudia' },
    { area: 'Identificar al decisor', impacto: 'Cuenta de $23,325 al mes sin interlocutor desde julio', responsable: 'Claudia' },
    { area: 'Integración API', impacto: 'Validación de coberturas por teléfono, hoy manual', responsable: 'Ingeniería' },
  ],

  perfiles: [
    {
      nombre: 'Oscar Guillermo Cisneros Linares', rol: 'Líder de Operaciones CAT — OdontoPrev', color: '#f59e0b',
      campos: [
        { label: 'Correo',    value: 'olinares@odontoprev.com.mx · 55 7112 6459' },
        { label: 'Lo que dijo', value: '22 jul 2026: «actualmente no participa de forma directa en la operación». Prometió validar con su equipo.' },
        { label: 'Qué pasó después', value: 'Nada. 83 días sin retroalimentación y sin que nadie buscara al sustituto.' },
        { label: 'Sigue siendo útil', value: 'Es el único que nos ha respondido. Preguntarle a QUIÉN escribirle es la vía más corta al decisor.' },
      ],
    },
    {
      nombre: 'Mércia Leite Nagem', rol: 'CEO / Directora General México — OdontoPrev', color: '#6366f1',
      campos: [
        { label: 'Fuente',    value: 'Identificada públicamente por la Cámara México-Brasil, 2026' },
        { label: 'Contacto',  value: 'SIN teléfono ni correo público verificable' },
        { label: 'Papel',     value: 'Patrocinador ejecutivo potencial en una plantilla de 11–50 personas, donde la dirección está cerca de la operación' },
      ],
    },
    {
      nombre: 'Responsable de telefonía', rol: 'SIN IDENTIFICAR — OdontoPrev', color: '#ef4444',
      campos: [
        { label: 'Qué sabemos', value: 'Nada. Ni la ficha ni la investigación pública identifican CIO, gerente de infraestructura o responsable del servicio.' },
        { label: 'Por qué importa', value: 'Es quien decide sobre un contrato de $23,325 al mes y quien sufre el ticket de 246 días' },
        { label: 'Dónde buscarlo', value: 'Por Cisneros, que ofreció validar con su equipo, o por la dirección general' },
      ],
    },
    {
      nombre: 'Claudia', rol: 'Asesora SAC de la cuenta — Callpicker', color: '#22c55e',
      campos: [
        { label: 'Actividades', value: '3 registradas · 2 completadas · 1 sin completar (llamada del 26 jun)' },
        { label: 'Lo que diagnosticó bien', value: '16 jul 2026: identificó que el grueso del soporte es asistencia en chat sobre campañas, «de carácter operativo y no por fallas del servicio». Correcto.' },
        { label: 'Lo que faltó', value: 'Sacar la consecuencia: un soporte operativo repetido es una necesidad de producto, no una cola de tickets. Y perseguir el aviso de Cisneros.' },
        { label: 'Contexto',    value: 'Suspendida del tablero del 6 al 12 oct 2026 por instrucción de dirección' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      'La pérdida de llamadas MEJORA sola: 5.0% en enero → 1.9% en agosto, con el volumen creciendo',
      'El mes cerrado está 1.58 puntos por debajo de su propia base: 163 llamadas perdidas menos de lo normal',
      'Las líneas de negocio son impecables: Bradescard 0.5%, Bradescard Asistencias 0.4%, CAT IKÉ 1.5%',
      'Health Score 72, el más alto de las auditorías escritas, con adopción y pago en 100',
      'Adopción medida y ALTA en los tres productos registrados',
      'Cero incidencias de pago en 27 meses',
    ],
    oportunidades: [
      'Tres enrutamientos rotos concentran la mitad de las pérdidas sobre el 2% del tráfico: arreglo barato y de efecto grande',
      'No tiene IA de Chat ni IA de Voz contratadas, y el chat es justo su canal problemático',
      'Siete clientes corporativos con línea propia: un reporte por línea es material con el que él cumple frente a ellos',
      '`tiene_integracion_api` en falso en una aseguradora que valida coberturas por teléfono',
    ],
    debilidades: [
      'El único contacto avisó hace tres meses de que ya no está en la operación, y no se buscó sustituto',
      'Un ticket de envío masivo lleva 246 días abierto; otro, 113',
      '20 de 30 tickets son sobre envíos masivos y campañas, con 5 fallas registradas',
      'El 51.4% del tráfico no trae destino identificado',
      'Cero reuniones en 27 meses, 0 de 12 del Radar, score relacional 31',
      'La ficha tenía el importe al 47% del real y el correo dentro del campo de nombre',
    ],
    amenazas: [
      'NO SABEMOS QUIÉN DECIDE SOBRE ESTE CONTRATO. En una cuenta de $23,325 al mes, con el interlocutor retirado desde julio y sin responsable de telefonía identificado en ninguna fuente, una decisión de renovación la tomaría alguien con quien nunca hemos hablado.',
      'Sus clientes corporativos son marcas grandes —Bradescard, IKÉ, Zurich Santander, OCESA—: una llamada perdida no se queja a OdontoPrev, se queja a ellos, y eso escala por encima de nuestro interlocutor',
      'El ticket de 246 días es el argumento servido para cualquier conversación de renovación',
      'La línea que concentra el 85% del contrato viene de un Downgrade sin explicar',
      'La mejora de la voz hace que la cuenta no se encienda en ningún semáforo, así que seguiría invisible otros 27 meses',
    ],
  },

  conclusion: 'ODONTOPREV es la primera cuenta de la serie donde lo que el tablero mide va a MEJOR. La pérdida de llamadas bajó de 5.0% a 1.9% mientras el volumen crecía de 8,366 a 12,865 al mes, y el mes cerrado está 1.58 puntos por debajo de su propia base. Las líneas de sus clientes corporativos funcionan a media décima de punto. El Health Score es 72, el más alto que hemos visto. Nada de eso es un espejismo.\n\nY aun así hay tres cosas que no se pueden dejar como están. La primera es que el promedio esconde: el 3.17% global de pérdida mezcla líneas impecables con tres destinos que pierden entre el 71% y el 91%, y esos tres —uno de ellos una extensión a nombre de una persona que recibió 1,009 llamadas y contestó 91— concentran la mitad de todas las pérdidas sobre el 2% del tráfico. Se arreglan en un día y nadie los ha mirado porque el total no invitaba a mirar.\n\nLa segunda es que el canal que falla no es el que medimos. La voz va bien; el chat lleva veinte tickets de envíos masivos, cinco fallas y un caso abierto desde hace 246 días. El asesor diagnosticó el patrón correctamente en julio —«asistencia en chat, de carácter operativo»— y la conclusión que se sacó fue «cuenta estable». Pero un soporte operativo que se repite veinte veces no es estabilidad: es una necesidad de producto que nadie ha convertido en propuesta.\n\nLa tercera es la que más pesa. El 22 de julio el cliente nos dijo, por escrito y en nuestra propia ficha, que la persona con la que hablábamos ya no participa en la operación. Prometió validar con su equipo y nunca volvió. Han pasado 83 días y no hemos buscado a quién. Hoy no sabemos quién decide sobre un contrato de $23,325 al mes, y la investigación pública tampoco lo sabe: hay CEO con nombre pero sin forma de contactarla, y ningún responsable de telefonía identificable.\n\nLa lección es la misma que en ECODELI, con un giro: allí una cuenta que no se quejaba nunca se volvió invisible; aquí una cuenta que MEJORABA se volvió invisible. Un indicador que va bien no es una razón para dejar de mirar — es exactamente cuando conviene mirar lo que ese indicador no cubre.',

  pierde: [
    'Callpicker pierde $23,325 al mes si la cuenta no renueva, y la decisión la tomaría alguien a quien no conocemos.',
    'Se pierde el acceso indirecto a siete marcas grandes —Bradescard, IKÉ, Zurich Santander, OCESA, Welbe— que son sus clientes corporativos.',
    'Se pierden 11,083 horas de conversación al periodo: uno de los mayores volúmenes reales de voz de la cartera.',
    'Y se pierde una cuenta que estaba mejorando, que es la peor forma de perder una.',
  ],

  gana: [
    'Arreglar tres enrutamientos elimina la mitad de las pérdidas de la cuenta: es el mejor retorno por esfuerzo de toda la serie.',
    'No tiene IA de Chat ni IA de Voz contratadas, y el chat es su dolor conocido y documentado en 20 tickets.',
    'Un reporte por cliente corporativo convierte nuestro dato en el instrumento con el que él cumple frente a Bradescard y Zurich.',
    'La curva de mejora es un argumento real y verificable para abrir la conversación en positivo.',
  ],

  recomendacion_central: 'BUSCAR AL DECISOR ESTA SEMANA, Y POR LA VÍA MÁS CORTA: preguntándole a Cisneros a quién hay que escribirle. Él mismo nos avisó el 22 de julio de que ya no participa en la operación y se ofreció a validar con su equipo; en 83 días nadie recogió esa pelota. Hoy no sabemos quién decide sobre un contrato de $23,325 al mes, y la investigación pública tampoco: hay CEO identificada —Mércia Leite Nagem— pero sin vía de contacto verificable, y ningún responsable de telefonía en ninguna fuente. Mientras eso siga así, todo lo demás que se haga en esta cuenta es trabajo sin destinatario.\n\nANTES DE LLAMAR, DOS COSAS DE CASA, Y LAS DOS SON NUESTRAS. Arreglar los tres enrutamientos rotos —«Rojas Chávez Carlos Alberto Octaviano» con 918 perdidas de 1,009, «(sin destino registrado)» con 322 de 450, y «WELBE»—, que son la mitad de las pérdidas de la cuenta sobre el 2% de su tráfico y se corrigen en un día. Y cerrar el ticket de «Envío Masivo WhatsApp» que lleva 246 días abierto, más el de bandeja de entrada con 113. Llegar a una conversación de renovación con eso abierto es entregarle al cliente el único argumento que no se puede contestar con datos.\n\nY CUANDO SE HABLE, ABRIR POR LA MEJORA. Su pérdida bajó de 5.0% a 1.9% mientras su volumen crecía: es verdad, es suyo, y nadie se lo ha dicho. Después de eso se puede llevar lo demás — el desglose por línea corporativa que hoy no podemos darle porque la mitad de su tráfico llega sin destino, y la propuesta de IA de Chat, que es el canal donde se concentran veinte de sus treinta tickets.\n\nLo que NO hay que hacer es leer la mejora de la voz como que la cuenta está atendida. Lo que mejora es el indicador que miramos; lo que falla es el canal que no miramos y la relación que no existe.',

  auditoria_servicio: {
    fuente: 'Zoho Desk — 30 tickets de «Odontoprev» (CID 162545) en lib/tickets-data.json',
    periodo: 'Marzo 2026 – Octubre 2026 · la fuente trae SÓLO tickets CERRADOS, así que «abiertos» no es medible aquí',
    diagnostico: 'El producto que le falla a OdontoPrev no es la voz: es el CHAT, y dentro del chat, el envío masivo. De 30 tickets, veinte son sobre campañas y envíos masivos —«Reporte de Campaña» 9, «Envío Masivo WhatsApp» 7, «Falla Envíos Masivos» 3, «Envío Masivo SMS» 1— y la voz aparece una sola vez, en octubre, por DiDs. El asesor lo diagnosticó bien en julio: «la demanda de soporte es de carácter operativo y no por fallas del servicio». Es cierto para 25 de los 30, pero las otras cinco SÍ son fallas, tres de ellas de envíos masivos, y la alerta `sac_fallas_recurrentes` se abrió el 12 de octubre por eso. Un cliente que pide veinte veces ayuda con lo mismo no es un cliente demandante: es una función que no se basta sola.',
    metricas: [
      { metrica: 'Tickets totales',          valor: '30 (mar–oct 2026)',      lectura: 'Concentrados en los últimos cuatro meses: 7 en agosto, 7 en septiembre' },
      { metrica: 'De chat',                  valor: '24 de 30 explícitos',    lectura: 'La voz aparece una vez. El canal problemático es el otro.' },
      { metrica: 'Sobre envíos masivos y campañas', valor: '20 · 66.7%',      lectura: 'El patrón dominante y la conversación de producto pendiente' },
      { metrica: 'Fallas del servicio',      valor: '5 · 16.7%',              lectura: '3 de ellas de envíos masivos. Alerta abierta el 12 oct.' },
      { metrica: 'Mediana de resolución',    valor: '70 horas',               lectura: 'Razonable. La media (379 h) está inflada por dos casos extremos.' },
      { metrica: 'El más largo',             valor: '5,908 h · 246 días',     lectura: '«Envío Masivo WhatsApp», abierto desde septiembre' },
      { metrica: 'Segundo más largo',        valor: '2,709 h · 113 días',     lectura: '«Bandeja de entrada», desde agosto' },
      { metrica: 'Tickets de más de 7 días', valor: '8 de 30 · 26.7%',        lectura: 'Uno de cada cuatro se queda semanas' },
    ],
    reincidencias: [
      { patron: 'Reporte de Campaña (chat)',     veces: '9 · 30.0%', causa: 'El cliente pide el reporte en vez de obtenerlo. Es una función que no se basta sola, o una capacitación que no se dio.' },
      { patron: 'Envío Masivo WhatsApp (chat)',  veces: '7 · 23.3%', causa: 'Mismo patrón documentado en FINSUS y Torres Corzo: el envío masivo de WhatsApp genera dependencia de la mesa.' },
      { patron: 'Falla Envíos Masivos (chat)',   veces: '3 · 10.0%', causa: 'Éstas SÍ son fallas, no asistencia. Son el núcleo de la alerta `sac_fallas_recurrentes`.' },
      { patron: 'Plantillas Verificadas (chat)', veces: '2 · 6.7%',  causa: 'El mismo trámite de WhatsApp que aparece en media cartera.' },
    ],
    hallazgos: [
      'El canal que el tablero mide con detalle (voz) es el que funciona; el que apenas se mira (chat) es el que acumula los 30 tickets y las 5 fallas.',
      'El ticket de 246 días es, con diferencia, el más antiguo de todas las auditorías escritas salvo el folio de Torres Corzo. Hay que cerrarlo antes de cualquier conversación comercial.',
      'Veinte tickets sobre campañas en ocho meses es una señal de producto, no de soporte: el cliente necesita algo que la función no le da sola, y eso es exactamente lo que resolvería IA de Chat.',
    ],
  },
}
