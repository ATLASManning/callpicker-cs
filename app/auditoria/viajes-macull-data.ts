import type { AuditoriaCase } from './types'

/**
 * NACIÓ CANCELANDO. Venta del 3-sep-2026, baja pedida el 1-oct: 28 días.
 *
 * Fuentes: auditoría de Dirección SAC «CP 189846 · Viajes Macull / Viajo
 * México» (1 oct 2026), Zoho CRM (perfilamiento 02/09, oportunidad CP 189846),
 * Zoho Desk ticket #114564 (03/09–29/09), Slack, WhatsApp del 01/10 con Luis
 * Antonio Guerrero Kennedy, y correo interno José Manuel López / Daniel
 * Martínez del 29–30/09.
 *
 * ── LO QUE ESTE CASO AÑADE AL DOCUMENTO ──────────────────────────────────
 * Dos cosas salieron de cruzar la auditoría contra `data/activaciones.xlsx`,
 * y ninguna estaba en el documento original:
 *
 * 1. LA DEMO SÍ EXISTIÓ, bajo el OTRO nombre. El documento concluye «ciclo de
 *    1 día, sin demo». En Activaciones hay DOS filas: la 189827 «Viajo mexico»
 *    con Tipo = demo, abierta el 02/09 —el mismo día del lead—, y la 189846
 *    «Viajes Macull» con Tipo = pagada, del 03/09. La demo nunca activó
 *    («Días activación: -»). La identidad fragmentada de H1 no es sólo de
 *    nombre: son dos expedientes de activación que nadie unió.
 *
 * 2. EL CAMPO «Portabilidad» DE ESTA CUENTA DICE «no». Toda la pérdida gira
 *    sobre una portabilidad fallida. El campo se usa —220 «sí» y 5 «en
 *    proceso» en el archivo—, así que no es que no exista: está mal puesto.
 *    Una cuenta que murió por portar quedó registrada como que no portaba.
 *
 * ── DÓNDE CAE ESTA CUENTA, MEDIDO ────────────────────────────────────────
 * Sobre las 1,825 activaciones PAGADAS del corte del 1-oct-2026:
 *   · Complejidad «muy difícil»: 15 de 1,825 = 0.8%. Está en el peor 1%.
 *   · 26 días de activación contra una mediana de 14 y un promedio de 20.
 *   · $1,407 de primer pago = percentil 80. NO es cuenta TOP de cartera
 *     —nunca llegó a cartera—, pero no es un ticket chico en su cohorte.
 *
 * ── POR QUÉ NO TIENE CONSECUTIVO NI ASESOR ───────────────────────────────
 * No está en `cuentas`: se vendió el 3 de septiembre y pidió la baja el 1 de
 * octubre, así que nunca se asignó a un KAM ni entró a la cartera de nadie.
 * `asesor: null` es el dato, no un hueco. Mismo patrón que 'rds-invest-vacay'.
 *
 * ── ESTADO 'en_riesgo' Y NO 'perdido' ────────────────────────────────────
 * Al cierre de esta auditoría la baja está PEDIDA, no procesada, y el cliente
 * aceptó por escrito que le expliquen CP Chat. La fecha de corte es el
 * 02/Oct/2026. Darla por perdida hoy cerraría la única puerta que queda
 * abierta; darla por viva sería mentir. Las fechas van explícitas en cada
 * punto para que este caso no envejezca en silencio.
 */
export const VIAJES_MACULL: AuditoriaCase = {
  id:                    'viajes-macull',
  asesor:                null,
  nombre:                'Viajes Macull / Viajo México',
  sector:               'Turismo — agencia de viajes y operadora mayorista, Centro de Guadalajara',
  fecha_periodo:         '2 Septiembre – 2 Octubre 2026 (28 días de vida)',
  fecha_auditoria:       'Oct 2026',
  tipo_cliente:          'NACIÓ CANCELANDO · CP 189846 · sin consecutivo en cartera · baja pedida antes del primer mes',
  descripcion_contexto:  'Oportunidad CP 189846 · Vendida 03/Sep, baja solicitada 01/Oct · Fecha de corte 02/Oct/2026',
  estado:                'en_riesgo',
  clasificacion:         'CONFIDENCIAL',
  version:               '1.0',

  kpis: [
    { label: 'Vida de la cuenta',        value: '28 días',          color: '#ef4444' },
    { label: 'Ciclo de venta',           value: '1 día',            color: '#ef4444' },
    { label: 'CP Chat pagado sin activar', value: '28 días',        color: '#f59e0b' },
    { label: 'Señal de riesgo → escalamiento', value: '5 días',     color: '#6366f1' },
  ],

  resumen_ejecutivo:
    'La cuenta no se está perdiendo por Telmex. Telmex sólo hizo visibles tres fallas que ya existían desde el 2 de septiembre.\n\n' +
    'Comercial cerró en UN día una venta cuyo valor dependía de portar líneas, sin validar quién era el titular, quién decidía ni si existía un dolor económico: el propio cliente declaró «con telefonía analógica, no tenemos costo», y el campo de presupuesto quedó vacío. Activación tuvo desde el día 1 un número Callpicker funcionando (3345277405) y un agente de CP Chat ya pagado, y no convirtió ninguno de los dos en valor mientras la portabilidad se atoraba. El proceso cerró el ticket con un mensaje público de «activación finalizada» 38 minutos ANTES de escalar internamente el riesgo de pérdida.\n\n' +
    'Al 1 de octubre Luis Antonio Guerrero Kennedy pidió por WhatsApp la baja del conmutador porque «mi jefe me dijo que no nos van a apoyar como queremos los de Telmex y ya vio la opción con ellos». En el mismo mensaje aceptó que el equipo de CP Chat le explique el servicio. La fecha de corte es el 02/Oct/2026.\n\n' +
    'Decisión requerida en el corte: definir si se factura el plan completo, si se migra a un esquema sólo de CP Chat o si se procesa la baja ordenada. Facturar el plan completo a un cliente que ya pidió la baja pone en riesgo también la parte de CP Chat que sí quiere conservar.',

  resultado_positivo:
    'Queda una puerta abierta y está identificada: el cliente NO es un detractor. Luis responde rápido y cordial, y el 28/09 pidió él mismo que lo contactara el equipo de CP Chat; el 01/10 lo volvió a aceptar en el mismo mensaje en el que pedía la baja del conmutador. El agente de CP Chat ya está pagado dentro del plan. ' +
    'El negocio mayorista —atender por WhatsApp a las agencias que les compran— es donde CP Chat vale más, y no se ha ofrecido nunca. ' +
    'La nota privada de José Antonio Villaseñor del 29/09 es la lectura más honesta de toda la cadena: diagnosticó el riesgo con precisión. El problema fue de tiempo y de cierre, no de diagnóstico.',

  hallazgos: [
    'H1 · Identidad fragmentada, y no sólo de nombre. Zoho registra «Viajo México»; la plataforma y Slack, «Viajes Macull», con el mismo ID, teléfono y correo. Pero además hay DOS filas en Activaciones 2.0: la 189827 «Viajo mexico» Tipo = demo, abierta el 02/09, que nunca activó, y la 189846 «Viajes Macull» Tipo = pagada, del 03/09. El documento original concluye «sin demo»: la demo existió, bajo el otro nombre, y nadie unió los dos expedientes.',
    'H2 · Autoridad declarada y refutada. Zoho: «¿A quiénes hay que involucrar para tomar la decisión? Él mismo», puesto «Dirección». El análisis de IA del 02/09 señaló el mismo día que el ejecutivo no preguntó por autoridad ni presupuesto. El 01/10 el propio Luis lo desmiente: «mi jefe me dijo». Telmex le habló a quien decide —ofreció su promoción «a los titulares de la empresa»—; Callpicker nunca.',
    'H3 · No existía dolor económico. «¿Cómo operan hoy y cuál es el costo?»: «Con telefonía analógica, no tenemos costo». Presupuesto vacío. Los detonantes reales eran un conmutador analógico con fallas y un cambio de oficina. Sin ahorro demostrable, quedarse con Telmex cuesta cero y cualquier promoción gana por default.',
    'H4 · Reactivación de E3 a E4 sin evidencia anexa. Descartado a las 12:23 del 02/09 por «fuera de tiempo > 3 meses»; SQL a las 16:42 tras cambiar ese ÚNICO campo. El cambio puede ser legítimo —en la grabación el cliente dice «es micro y a corto plazo»— pero la conversación de chat de las 16:23 que lo justificó no está anexada. No es una acusación: es un hueco de control. El criterio mínimo de calificación depende de un campo editable sin evidencia obligatoria.',
    'H5 · Venta cerrada sin validar la factibilidad de portar. La información y los requisitos de portabilidad se enviaron DESPUÉS de la venta (03/09 12:30). Los documentos nunca llegaron: el cliente estaba fuera del estado el 08/09 y el 14/09. El componente del que dependía el valor de la venta se descubrió inviable cuando ya estaba cobrado.',
    'H6 · El Plan B existía desde el día 1 y no se usó. El 03/09 a las 11:37 se asignó el número 3345277405 y el softphone quedó explicado. «Sígueme» —desviar las líneas Telmex al número Callpicker— se ofreció hasta el 24/09, y ya como recurso de retención. El cliente pudo operar en Callpicker sin portar desde la primera semana: se perdieron tres semanas de uso real, que es lo que crea hábito.',
    'H7 · CP Chat pagado y sin activar durante 28 días. Pendiente desde el 03/09 «pero primero van a realizar portabilidad». El 28/09 el cliente pidió expresamente que lo contactara el equipo de CP Chat. Al 01/10 el contacto aún no ocurría; se ofreció «subir el ticket». El único componente que el cliente quiere conservar sigue sin dueño ni fecha.',
    'H8 · Cierre cosmético del ticket. 29/09 18:00: mensaje público a «Guillermo» informando que la activación finalizó. 29/09 18:38: nota privada calificando la cuenta en riesgo muy elevado de pérdida. Treinta y ocho minutos. El KPI de activación registra un éxito que no existe — y el mensaje se dirigió a una persona que ni siquiera es la administradora de la cuenta.',
    'H9 · Calidad de datos. `Callpicker_id` vacío en contacto y oportunidad: no hay vínculo entre CRM y plataforma. Teléfono y móvil vacíos en el contacto; Guillermo y «el jefe» no están registrados. Pronóstico $1,000 contra importe $1,407, y $1,407 / 1.16 = $1,213, que tampoco cuadra. El correo de alta trae «Fecha de finalización: 06/09/26» —tres días después de activar— con «Cuenta Demo: No». Notas firmadas «NT» registradas por Joaquín Martínez. La oportunidad se modificó el 30/09 sin saber qué campo cambió.',
    'H10 · El campo «Portabilidad» de esta cuenta dice «no». Hallazgo nuevo de esta auditoría: en `data/activaciones.xlsx` la fila 189846 tiene Portabilidad = «no», cuando la portabilidad fallida es la causa de toda la pérdida. El campo sí se usa —220 «sí» y 5 «en proceso» en el archivo—, así que no es que falte: está mal puesto. Cualquier medición de «qué tanto nos cuesta portar» excluye justo el caso que más lo demuestra.',
    'H11 · Está en el peor 1% de dificultad, y eso se sabía. La fila la marca Complejidad = «muy difícil»: son 15 de las 1,825 activaciones pagadas del corte, el 0.8%. Tardó 26 días contra una mediana de 14. La señal estaba en el sistema de activaciones desde antes del escalamiento, y no disparó nada.',
  ],

  cronologia: [
    { fecha: '02/09 12:00', responsable: 'Marketing (Adwords)',        evento: 'Lead por Adwords: «servicio de conmutador virtual», microempresa de 6 a 10 personas. Intención alta.', tipo: 'neutral' },
    { fecha: '02/09 12:17', responsable: 'Perfilamiento (NT)',          evento: 'Llamada de 8 min: sin fecha de implementación, muchas preguntas, quiere demo y presentación aunque no contrate. Perfil de evaluador.', tipo: 'neutral' },
    { fecha: '02/09 12:23', responsable: 'Perfilamiento',               evento: 'E3 · Descarte: «Fuera de tiempo > 3 meses». Con la evidencia de ese momento, el descarte era correcto.', tipo: 'neutral' },
    { fecha: '02/09 ~16:00', responsable: 'Activación',                 evento: 'Se abre la fila 189827 «Viajo mexico» en Activaciones 2.0 con Tipo = DEMO. Nunca activó. Es el otro nombre del mismo grupo y queda como expediente huérfano.', tipo: 'problema' },
    { fecha: '02/09 16:27', responsable: 'Perfilamiento',               evento: 'El campo Tiempo cambia a «Corto plazo (1 a 3 semanas)» y se agrega «Serían 2 empresas diferentes». Un solo campo reactiva el lead; la conversación que lo justifica no queda anexada.', tipo: 'problema' },
    { fecha: '02/09 16:40', responsable: 'José Galván',                 evento: 'Llamada de 23 min. El análisis de IA marca el mismo día: no preguntó presupuesto ni autoridad. La alerta no obliga a nada y se ignora.', tipo: 'problema' },
    { fecha: '02/09 16:42', responsable: 'Perfilamiento → Comercial',   evento: 'E4 · SQL transferido; propietario pasa a José Galván. Cuatro horas y 19 minutos entre el descarte y la transferencia.', tipo: 'pivote' },
    { fecha: '02/09 17:10', responsable: 'José Galván',                 evento: 'Campos capturados: decisor «Él mismo», costo actual «no tenemos costo». Autoridad no validada, dolor económico inexistente.', tipo: 'problema' },
    { fecha: '03/09',       responsable: 'Comercial',                   evento: 'Contrato firmado · Cierre logrado. $1,407 · VyC 400 min, 2 números, 1 agente de chat. Ciclo de un día. Vendedor: José. Fila 189846 en Activaciones, Tipo = pagada, Complejidad «muy difícil».', tipo: 'problema' },
    { fecha: '03/09 11:37', responsable: 'Activación (Pepe Toño)',      evento: 'Cuenta activada «Viajes Macull»; número asignado 3345277405. El servicio YA funcionaba desde este momento.', tipo: 'ok' },
    { fecha: '03/09 12:30', responsable: 'Activación',                  evento: 'Se envía la información de portabilidad: 8 a 10 días hábiles. La factibilidad se consulta después de haber vendido.', tipo: 'problema' },
    { fecha: '03/09 13:36', responsable: 'Activación',                  evento: 'Softphone explicado. CP Chat queda pendiente «pero primero van a realizar portabilidad». Aquí empieza el abandono del único componente que sobrevivirá.', tipo: 'problema' },
    { fecha: '08/09 y 14/09', responsable: 'Cliente',                   evento: 'Cliente fuera del estado; no envía los documentos de portabilidad. Dos semanas de retraso sin Plan B activado.', tipo: 'problema' },
    { fecha: '24/09 11:10', responsable: 'Activación',                  evento: 'Telmex impide el cambio; el cliente pide pausar. Se ofrece «Sígueme». PRIMERA señal clara de baja — y el Plan B aparece 21 días tarde.', tipo: 'problema' },
    { fecha: '28/09 13:18', responsable: 'Cliente',                     evento: 'Cuenta estancada. El cliente pide expresamente que el equipo de CP Chat lo contacte. Vía de retención identificada por el propio cliente.', tipo: 'pivote' },
    { fecha: '29/09 18:00', responsable: 'José A. Villaseñor',          evento: 'Mensaje PÚBLICO a «Guillermo»: activación finalizada, fecha de corte 02/Oct. Cierre cosmético, y dirigido a quien no administra la cuenta.', tipo: 'problema' },
    { fecha: '29/09 18:38', responsable: 'José A. Villaseñor',          evento: 'Nota PRIVADA escalando a Daniel Martínez y José Manuel López: riesgo muy elevado de pérdida. 38 minutos después del cierre público; 5 días después de la primera señal.', tipo: 'problema' },
    { fecha: '29/09',       responsable: 'Activación',                  evento: 'Cierre de ticket registrado en Activaciones 2.0. 26 días de activación contra una mediana de 14 en las cuentas pagadas.', tipo: 'neutral' },
    { fecha: '01/10 11:48', responsable: 'Luis A. Guerrero Kennedy',    evento: 'WhatsApp: pide la baja del conmutador —«mi jefe me dijo que no nos van a apoyar como queremos los de Telmex y ya vio la opción con ellos»— y en el mismo mensaje ACEPTA que le expliquen CP Chat.', tipo: 'problema' },
    { fecha: '02/10',       responsable: 'Facturación / Dirección',     evento: 'FECHA DE CORTE. Ventana de decisión: facturar el plan completo, migrar a sólo CP Chat, o procesar la baja ordenada.', tipo: 'pivote' },
  ],

  perfil_campos: [
    { label: 'Identificador',          value: 'CP 189846 · Activaciones 2.0 fila 189846 (pagada) + fila 189827 «Viajo mexico» (demo, nunca activó)' },
    { label: 'Nombres en uso',         value: '«Viajes Macull» en plataforma y Slack · «Viajo México» en Zoho. Mismo ID, teléfono y correo.' },
    { label: 'En cartera',             value: 'NO. Nunca se asignó a un KAM: se vendió el 03/Sep y pidió la baja el 01/Oct.' },
    { label: 'Giro',                   value: 'Turismo. El cliente se declaró «operador mayorista» con agencias como clientes; la ficha pública clasifica a Turismo Macull como agencia minorista.' },
    { label: 'Tamaño',                 value: 'Pequeña · microempresa de 6 a 10 personas (declarado en el lead)' },
    { label: 'Origen del lead',        value: 'Adwords · 02/Sep/2026 12:00 · «servicio de conmutador virtual»' },
    { label: 'Plan contratado',        value: 'VyC 400 min · 2 números · 1 agente de CP Chat · $1,407 (percentil 80 de los primeros pagos)' },
    { label: 'Número Callpicker',      value: '3345277405 — asignado y funcionando desde el 03/Sep 11:37' },
    { label: 'Vendedor / Activación',  value: 'José Galván (comercial) · Pepe Toño — José Antonio Villaseñor (activación)' },
    { label: 'Complejidad registrada', value: '«Muy difícil» — 15 de 1,825 activaciones pagadas (0.8%)' },
    { label: 'Días de activación',     value: '26 (mediana del corte: 14 · promedio: 20)' },
    { label: 'Portabilidad',           value: 'Registrada como «no» en Activaciones 2.0. ESTÁ MAL: la portabilidad fallida es la causa de la pérdida.' },
  ],

  necesidad_negocio:
    'Los detonantes reales no fueron el ahorro: un conmutador analógico con fallas y un cambio de oficina. El cliente declaró textualmente «con telefonía analógica, no tenemos costo», así que no había dolor económico que la venta pudiera resolver. ' +
    'La necesidad que SÍ queda viva, y que nadie ha trabajado, es la del negocio mayorista: atender por WhatsApp a las agencias que les compran. Ahí es donde CP Chat —ya pagado, con un agente en el plan— tiene valor propio, independiente de portar una sola línea.',

  potencial_corto: [
    'Migrar a un esquema sólo de CP Chat con efecto en el corte del 02/Oct, conservando el agente que ya está pagado y dando de baja el conmutador que el cliente no quiere.',
    'Sesión de CP Chat con fecha y hora comprometidas, enfocada en la atención a las agencias que les compran, no en una demo genérica de producto.',
    'Llevar al jefe a esa sesión aunque sean 15 minutos: es el decisor real y nunca ha escuchado a Callpicker.',
    'Dejar operando «Sígueme» sobre el número 3345277405 si se conserva cualquier parte del servicio: es uso real sin depender de Telmex.',
  ],

  potencial_largo: [
    'Recuperar el conmutador cuando la promoción de Telmex venza, con la relación mantenida por CP Chat como puente.',
    'La unidad mayorista (B2B con agencias) es un caso de uso de WhatsApp multiagente que no se exploró nunca y que no depende de portabilidad.',
    'Unificar los dos expedientes —Viajo México y Viajes Macull— en una sola cuenta con titularidad clara, que es condición para cualquier venta futura al grupo.',
  ],

  tacticas: [
    { nombre: 'Baja parcial en vez de baja total',
      descripcion: 'Dar de baja el conmutador antes del corte y conservar CP Chat como servicio propio, en lugar de facturar el plan completo a un cliente que ya pidió salirse.',
      impacto: 'Retiene el ingreso del agente de chat y la relación. Facturar todo arriesga perder también la parte que el cliente sí quiere.' },
    { nombre: 'Llegar al decisor, no al intermediario',
      descripcion: 'Pedirle a Luis que el jefe esté presente 10-15 minutos. Telmex le habló al titular; Callpicker nunca lo hizo.',
      impacto: 'Es la única forma de competir con una oferta que el decisor ya escuchó y nosotros no pudimos rebatir.' },
    { nombre: 'Valor sobre el negocio mayorista',
      descripcion: 'Enfocar CP Chat en atender por WhatsApp a las agencias que les compran, no en el conmutador que están perdiendo.',
      impacto: 'Cambia la conversación de «qué nos quitas» a «qué no estás usando de lo que ya pagaste».' },
  ],

  senal_alarma:
    'FECHA DE CORTE 02/OCT/2026. La baja está pedida, no procesada. El documento base se cerró el 01/Oct y la ventana de decisión es inmediata: facturar el plan completo sin haber hablado con el cliente arriesga también el CP Chat que sí quiere conservar. ' +
    'Antes de ofrecer un esquema sólo de CP Chat hay que CONFIRMAR que ese plan existe y a qué precio: la auditoría lo marca como [VACÍO] y no se debe ofrecer sin ese dato.',

  problema_raiz:
    'No existe una puerta de control para ventas que dependen de portabilidad, ni una regla de tiempo al primer valor en activación.',

  problema_raiz_detalle:
    'Cada área cumplió su paso y nadie fue dueño del resultado. Perfilamiento calificó, Comercial cerró, Activación tramitó y el ticket se cerró en tiempo — y la cuenta murió a los 28 días.\n\n' +
    'El patrón es el mismo en los tres puntos de falla: una señal apareció, quedó registrada, y no obligó a nada. La IA marcó los huecos de BANT el 02/09 y la venta siguió. La portabilidad se descubrió inviable el 08/09 y el Plan B esperó al 24/09. El cliente pidió CP Chat el 28/09 y al 01/10 nadie lo había contactado. La complejidad quedó marcada «muy difícil» —el peor 1% del corte— y eso no disparó ninguna revisión.\n\n' +
    'Una alerta que no obliga a nada es una alerta que entrena a no mirarla.',

  flujo_real: [
    { fase: 'Perfilamiento',  area: 'Perfilamiento', accion: 'Descarta a las 12:23 y reactiva a las 16:42 del mismo día cambiando un solo campo, sin anexar la evidencia', resultado: 'Lead calificado sobre un criterio editable y sin respaldo' },
    { fase: 'Calificación',   area: 'Comercial',     accion: 'Llamada de 23 min sin preguntar presupuesto ni autoridad; la IA lo señala el mismo día', resultado: 'Alerta registrada, ninguna acción obligatoria' },
    { fase: 'Cierre',         area: 'Comercial',     accion: 'Contrato firmado en un día, sin demo vinculada y sin validar titularidad de las líneas a portar', resultado: 'Venta cobrada cuyo valor dependía de algo no verificado' },
    { fase: 'Activación',     area: 'Activación',    accion: 'Número asignado y funcionando el día 1; se pospone CP Chat «hasta después de la portabilidad»', resultado: 'Dos componentes listos, cero uso real durante tres semanas' },
    { fase: 'Incidencia',     area: 'Activación',    accion: 'Telmex bloquea el 24/09; se ofrece «Sígueme» como retención, 21 días tarde', resultado: 'El Plan B llega cuando el cliente ya está decidiendo salirse' },
    { fase: 'Cierre de ticket', area: 'Activación',  accion: 'Mensaje público «activación finalizada» a las 18:00; escalamiento privado a las 18:38', resultado: 'KPI de activación en verde sobre una cuenta en riesgo crítico' },
    { fase: 'Decisión',       area: 'Cliente',       accion: 'El jefe —nunca contactado— acepta la promoción de Telmex', resultado: 'Baja solicitada el 01/10, corte el 02/10' },
  ],

  comparativo: [
    { metrica: 'Validación de titularidad antes de vender',  real: 'No se hizo',                       ideal: 'Titular identificado y documentos validados antes de «Cierre logrado»' },
    { metrica: 'Demo antes del cierre',                      real: 'Existe, bajo el otro nombre (189827), sin vincular', ideal: 'Un expediente por cliente, con la demo ligada a la oportunidad' },
    { metrica: 'Días al primer valor real',                  real: '21 días (Sígueme se ofrece el 24/09)', ideal: '72 horas para todo componente activable sin dependencias' },
    { metrica: 'CP Chat activado',                           real: '28 días sin activar, pagado',       ideal: 'Agendado dentro de la primera semana, con dueño y fecha' },
    { metrica: 'Señal de riesgo → escalamiento',             real: '5 días (24/09 → 29/09)',            ideal: '24 horas desde la primera señal de baja' },
    { metrica: 'Cierre del ticket',                          real: 'Cerrado en verde con nota de riesgo abierta', ideal: 'Ningún cierre con notas de riesgo sin resolver' },
    { metrica: 'Días de activación',                         real: '26',                                ideal: '14 (mediana del corte de 1,825 activaciones pagadas)' },
    { metrica: 'Campo Portabilidad en Activaciones',         real: '«no» — mal registrado',             ideal: '«sí» / «en proceso», para poder medir el costo real de portar' },
  ],

  plan_inmediato: [
    { accion: 'Validar en Facturación qué se cobra en el corte del 02/Oct y si el plan VyC tiene plazo forzoso o penalización', responsable: 'Facturación', criterio: 'Respuesta por escrito ANTES de hablar con el cliente' },
    { accion: 'Confirmar si existe un plan sólo de CP Chat y a qué precio. La auditoría lo marca [VACÍO]: no se ofrece sin este dato', responsable: 'Producto / Comercial', criterio: 'Plan y precio confirmados, o se descarta la opción' },
    { accion: 'Decidir el tratamiento del corte: migrar a sólo CP Chat, pausar, o baja ordenada. NO facturar el plan completo sin haber hablado con el cliente', responsable: 'Dirección SAC', criterio: 'Decisión tomada antes del corte del 02/Oct' },
    { accion: 'Agendar con Luis, con fecha y hora comprometidas, la sesión de CP Chat sobre el agente ya pagado, enfocada en atención por WhatsApp a las agencias', responsable: 'Equipo CP Chat', criterio: 'Invitación enviada y aceptada, no «se sube el ticket»' },
    { accion: 'Pedir a Luis que el jefe acompañe la sesión al menos 15 minutos', responsable: 'Quien agende', criterio: 'Nombre y cargo del decisor registrados en el CRM' },
  ],

  plan_mediano: [
    { accion: 'Puerta de portabilidad: ninguna venta que dependa de portar pasa a «Cierre logrado» sin titular identificado y documentos validados', responsable: 'Comercial + Dirección', criterio: 'Campo bloqueante en el CRM, no una recomendación' },
    { accion: 'Plan B obligatorio: toda activación con portabilidad arranca con «Sígueme» sobre el número Callpicker desde el día 1', responsable: 'Activación', criterio: 'Paso obligatorio del ticket, verificable' },
    { accion: 'Regla de primer valor: todo componente activable sin dependencias queda operando en 72 horas', responsable: 'Activación', criterio: 'Medido como «días al primer uso real», no al trámite' },
    { accion: 'Alerta de IA con tarea: si el análisis marca huecos de BANT, la conversión del lead exige completarlos', responsable: 'Proceso / Sistemas', criterio: 'La conversión se bloquea hasta cerrar los campos' },
    { accion: 'Cierre honesto: ningún ticket se cierra como «activación finalizada» con notas de riesgo abiertas', responsable: 'Activación', criterio: 'Validación automática al cerrar' },
    { accion: 'Corregir el campo Portabilidad de la fila 189846 y auditar cuántas más están mal clasificadas', responsable: 'Activaciones 2.0', criterio: 'Las cuentas con ticket de portabilidad coinciden con el campo' },
  ],

  plan_estrategico: [
    { accion: 'Revisar esta cuenta junto con Vemepe y las conversiones de los últimos 90 días para medir si el patrón es real', responsable: 'Dirección SAC', criterio: 'Cohorte con datos, no anécdotas cruzadas entre áreas' },
    { accion: 'Un expediente por cliente: unificar demo y cuenta pagada cuando son el mismo grupo bajo nombres distintos', responsable: 'Activaciones 2.0 + CRM', criterio: 'La fila 189827 y la 189846 quedan vinculadas' },
    { accion: 'Llenar `Callpicker_id` en contacto y oportunidad para que CRM y plataforma se puedan cruzar sin reconstrucción manual', responsable: 'Sistemas', criterio: 'Campo obligatorio al activar' },
    { accion: 'Indicadores de proceso en el tablero: % de ventas con portabilidad validada, días al primer valor, días entre señal y escalamiento, % de tickets cerrados con riesgo abierto, ingreso retenido por baja parcial', responsable: 'Dirección SAC', criterio: 'Los cinco visibles y con meta' },
  ],

  areas_oportunidad: [
    { area: 'Comercial',          impacto: 'Alto',  responsable: 'Cierre en un día sin validar titularidad, autoridad, dolor económico ni factibilidad de portar' },
    { area: 'Activación',         impacto: 'Alto',  responsable: 'Sin Plan B 21 días, CP Chat abandonado 28, escalamiento a los 5 días, cierre cosmético' },
    { area: 'Perfilamiento',      impacto: 'Medio', responsable: 'Reactivación sin evidencia anexa; «2 empresas» anotado y nunca desglosado' },
    { area: 'Proceso / sistema',  impacto: 'Raíz',  responsable: 'Alerta de BANT sin acción obligatoria; CRM sin vínculo a plataforma; campo de portabilidad mal puesto' },
  ],

  perfiles: [
    { nombre: 'Luis Antonio Guerrero Kennedy', rol: 'Administrador de la cuenta · contacto en Zoho', color: '#22c55e',
      campos: [
        { label: 'Evidencia',   value: 'WhatsApp 01/10: «Soy yo» (administra). La decisión de baja la tomó su jefe.' },
        { label: 'Lectura',     value: 'Responde rápido, corto y cordial. NO es un detractor: es quien ejecuta lo que decidió otro.' },
        { label: 'Qué hacer',   value: 'Es el aliado natural para llegar al decisor y para operar CP Chat. Comprometer fecha y hora, no «te contactamos».' },
        { label: 'Estado',      value: 'VERIFICADO' },
      ] },
    { nombre: '«Mi jefe» — sin identificar', rol: 'Decisor real de la baja', color: '#ef4444',
      campos: [
        { label: 'Evidencia',   value: 'WhatsApp 01/10. Nombre y cargo DESCONOCIDOS.' },
        { label: 'Lectura',     value: 'Decidió con base en la oferta de Telmex sin haber escuchado nunca a Callpicker.' },
        { label: 'Qué hacer',   value: 'Es la persona con quien hay que hablar, no a quien convencer por intermediario.' },
        { label: 'Estado',      value: 'VACÍO — es el hueco más caro de este caso' },
      ] },
    { nombre: 'José Alfredo Pérez León', rol: 'Registró la cuenta en Callpicker', color: '#6366f1',
      campos: [
        { label: 'Contacto',    value: 'alfredo.perez@viajomexico.com · 3331008344' },
        { label: 'Evidencia',   value: 'Correo de alta del 03/09; recibió la información de portabilidad.' },
        { label: 'Lectura',     value: 'Su correo es de «viajomexico.com» y la cuenta se llama «Viajes Macull»: confirma que el mismo grupo opera ambos nombres.' },
        { label: 'Estado',      value: 'VERIFICADO' },
      ] },
    { nombre: 'Guillermo', rol: 'Asistió a la activación · destinatario del cierre', color: '#f59e0b',
      campos: [
        { label: 'Evidencia',   value: 'Mensajes públicos del 03/09 y 29/09. NO aparece en Zoho.' },
        { label: 'Lectura',     value: 'El mensaje de «activación finalizada» se le mandó a él, que no administra la cuenta.' },
        { label: 'Estado',      value: 'VACÍO' },
      ] },
    { nombre: 'José Galván', rol: 'Ejecutivo comercial · propietario de la oportunidad', color: '#f59e0b',
      campos: [
        { label: 'Participación', value: 'Llamada de 23 min, conversión del lead y cierre el 03/09.' },
        { label: 'Lectura',       value: 'Cerró rápido y la IA le marcó los huecos de BANT el mismo día.' },
        { label: 'Qué hacer',     value: 'Escucharlo ANTES de concluir: puede haber información de la negociación que no quedó en el CRM.' },
      ] },
    { nombre: 'José Antonio Villaseñor (Pepe Toño)', rol: 'Activación · ext. 463', color: '#6366f1',
      campos: [
        { label: 'Participación', value: 'Softphone, portabilidad, «Sígueme», cierre del ticket y escalamiento.' },
        { label: 'Lectura',       value: 'Su nota del 29/09 es la lectura más honesta de toda la cadena. Diagnosticó bien.' },
        { label: 'Qué falló',     value: 'Tiempo y cierre, no diagnóstico: 5 días para escalar y un cierre público antes del escalamiento.' },
      ] },
    { nombre: 'Daniel Martínez', rol: 'Liderazgo de activación', color: '#f59e0b',
      campos: [
        { label: 'Postura',     value: '«Este tipo de clientes nos los pasan muertos». Atribuye el problema a Comercial.' },
        { label: 'Lectura',     value: 'Tiene razón en H2, H3 y H5. Su narrativa omite H6, H7 y H8, que son de su equipo.' },
        { label: 'Qué hacer',   value: 'Al sumar el caso Vemepe está construyendo un patrón contra Comercial: útil como hipótesis, insuficiente como conclusión. Medirlo con la cohorte de 90 días.' },
      ] },
  ],

  foda: {
    fortalezas: [
      'El número 3345277405 funciona desde el día 1: el servicio técnico nunca falló.',
      'El agente de CP Chat ya está pagado dentro del plan — el activo de retención está comprado.',
      'El cliente pidió él mismo, dos veces (28/09 y 01/10), que le expliquen CP Chat.',
      'La nota de escalamiento del 29/09 diagnosticó el riesgo con precisión: la capacidad de lectura existe en el equipo.',
    ],
    oportunidades: [
      'El negocio mayorista —atender por WhatsApp a las agencias que les compran— es donde CP Chat vale más y nunca se ofreció.',
      'La baja parcial retiene ingreso y relación donde la baja total pierde las dos.',
      'La promoción de Telmex vence: con la relación viva por CP Chat, el conmutador es recuperable.',
      'Es un caso con evidencia completa para justificar las cinco reglas de proceso ante Dirección.',
    ],
    debilidades: [
      'El decisor real nunca participó en el ciclo de venta ni en la activación, y hoy sigue sin nombre.',
      'No hay dolor económico: el cliente declaró costo cero con su telefonía analógica.',
      'Identidad partida en dos expedientes (189827 demo / 189846 pagada) que nadie unió.',
      '`Callpicker_id` vacío: CRM y plataforma no se cruzan sin reconstrucción manual.',
      'El KPI de activación marcó éxito 38 minutos antes del escalamiento de riesgo.',
    ],
    amenazas: [
      'Telmex habló con el titular y ofreció promoción; Callpicker nunca llegó a esa mesa.',
      'La fecha de corte es el 02/Oct: facturar el plan completo puede llevarse también el CP Chat.',
      'Sin la puerta de portabilidad, el mismo caso se repite con la siguiente venta que dependa de portar.',
      'El patrón «nos los pasan muertos» puede cerrar el análisis antes de medirlo y dejar intactas las fallas de activación.',
    ],
  },

  conclusion:
    'Esta cuenta nació cancelando. Se vendió en un día, el 3 de septiembre, sobre una promesa que dependía de portar líneas cuya titularidad nadie verificó, a un contacto que no decidía, sin un peso de ahorro que defender. Vivió 28 días y pidió la baja antes de su primer mes completo.\n\n' +
    'Telmex no ganó: Callpicker no compitió. La promoción llegó a quien decide porque Callpicker nunca supo quién era. Y mientras la portabilidad se atoraba, hubo un número funcionando desde el día 1 y un agente de chat pagado que pasaron 28 días sin convertirse en una sola hora de uso real.\n\n' +
    'No es una cuenta TOP y nunca entró a cartera. Pero vale documentarla precisamente por eso: $1,407 está en el percentil 80 de los primeros pagos y la complejidad quedó marcada en el peor 1% del corte. El sistema SABÍA que esta activación era «muy difícil» y ninguna señal disparó nada. Ese es el hallazgo que trasciende al caso.',

  pierde: [
    'El plan VyC de $1,407 si se procesa la baja total en el corte del 02/Oct.',
    'El agente de CP Chat pagado, si se factura el plan completo y el cliente decide salirse de todo.',
    'La relación con el grupo que opera Viajes Macull y Viajo México, para cualquier venta futura.',
    'La lectura real del KPI de activación mientras se permitan cierres cosméticos.',
  ],

  gana: [
    'El ingreso de CP Chat, si la baja es parcial y se agenda la sesión antes del corte.',
    'El nombre y el cargo del decisor real, que hoy es el hueco más caro del expediente.',
    'Un caso con evidencia completa para instalar las cinco reglas de proceso: puerta de portabilidad, Plan B obligatorio, primer valor en 72 h, alerta de BANT con tarea y cierre honesto.',
    'La corrección del campo Portabilidad y de los expedientes partidos, que hoy ensucian cualquier medición del costo de portar.',
  ],

  recomendacion_central:
    'ANTES DEL CORTE DEL 02/OCT: no facturar el plan completo. Confirmar primero si existe un plan sólo de CP Chat y a qué precio —hoy es un dato [VACÍO]—, y con eso ofrecer a Luis la baja del conmutador conservando el agente de chat que ya pagaron, en una sesión con fecha y hora, enfocada en atender por WhatsApp a las agencias que les compran, y con el jefe presente al menos quince minutos. ' +
    'Y después del corte, pase lo que pase con esta cuenta: instalar la puerta de portabilidad y la regla de primer valor. Esta auditoría no sirve si el próximo caso igual se descubre otra vez por WhatsApp, cinco días tarde.',
}
