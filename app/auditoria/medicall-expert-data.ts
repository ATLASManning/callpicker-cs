import type { AuditoriaCase } from './types'

/**
 * MEDICALL EXPERT (C31 · CID 162474) — v2.0, corte del 17 nov 2026
 * ================================================================
 *
 * QUÉ CAMBIÓ Y POR QUÉ IMPORTA
 * -----------------------------
 * La v1.0 era de julio de 2026. El reporte de noviembre que el cliente iba a
 * recibir **copió de aquí, literalmente, el párrafo de alarma de julio**: «753
 * días activa con un solo ticket de soporte abierto, adopción en 25/100 sin
 * ningún módulo verificado». Ninguna de esas cifras se volvió a medir, y los
 * 753 días caían el 24 de julio de 2026 — la fecha de la v1.0.
 *
 * Una cifra NUESTRA citada en un documento de cliente caduca igual que
 * cualquier otra, y caduca en silencio: nada falla, la frase sigue leyéndose
 * bien y el asesor la repite en la llamada. Lo corregido:
 *
 *   MRR            $6,831  →  $8,067   (el del GRC; $6,831 no es de ninguna fuente)
 *   Antigüedad     753 d   →  869 d    (desde 2024-07-01, al 17 nov 2026)
 *   Health score   61      →  60
 *   Tickets        «1 en toda la relación»  →  3 en total, 1 abierto
 *   KAM            «cero»  →  última interacción 15 ago 2026, con observaciones
 *   Adopción       «ningún módulo verificado»  →  25/100, con VyC en nivel medio
 *
 * `scripts/veredicto-candidatura.py` publica `senal_alarma[:200]` como
 * `auditoria_alarma`, y ESO es lo que lee quien redacta el siguiente reporte.
 * Por eso `senal_alarma` empieza por las cifras: si se recorta, lo que
 * sobrevive tiene que ser correcto y bastarse solo.
 * [[feedback-contexto-ia-sin-huecos]] [[feedback-verificar-antes-asegurar]]
 *
 * EL ORDEN DE `hallazgos` NO ES ESTÉTICO
 * ---------------------------------------
 * `lib/atlas-context.ts` manda los 4 primeros recortados a 180 caracteres, y
 * `lib/seguimiento-auditoria.ts` mete los 3 primeros ENTEROS en la actividad
 * SAC que el asesor lee antes de llamar. Por eso el primero es la prohibición
 * de citar la ficha vieja: si cae del corte, se vuelve a decir «$6,831» y
 * «cero seguimiento KAM» delante del cliente. Verificar con
 * `node scripts/revisa-dossier-auditoria.mjs medicall-expert`.
 *
 * Y el canal de chat: el reporte decía «no se contó con datos». Sí los
 * tenemos — la cuenta está en la fuente como «Grupo Medexp», 18 bandejas, y la
 * recolección falló en todas con HTTP 500. «No usa el chat» es un argumento
 * contra el cliente; «no lo pudimos leer» es una tarea nuestra.
 * [[callpicker-chat-fuente]]
 */
export const MEDICALL_EXPERT: AuditoriaCase = {
  id:                    'medicall-expert',
  asesor:                'Dan',

  nombre:                'Medicall Expert',
  sector:                'Salud · Servicios Médicos Integrales · Naucalpan, EdoMx',
  fecha_periodo:         '02 Ene – 17 Nov 2026',
  fecha_auditoria:       'Nov 2026',
  tipo_cliente:          'SMB · Plan Ilimitado · CID 162474 · MRR $8,067 · HS 60',
  descripcion_contexto:  '54,585 llamadas analizadas (53,680 salientes + 905 entrantes) · Asesor: Dan Domínguez · 50 agentes activos en el canal saliente · Plan Visibilidad y Control + Chat (IL), llamadas ilimitadas sin bolsa de minutos · Cliente desde jul 2024 (869 días) · Operación outbound-first: 98.3% del tráfico es saliente · Noviembre es parcial (17 días) y no se usa como extremo de ninguna serie',
  estado:                'en_riesgo',
  clasificacion:         'CONFIDENCIAL',
  version:               '2.0',

  kpis: [
    { label: 'Pérdida saliente global',      value: '57.9%',  color: '#ef4444' },
    { label: 'Brecha entre asesores',        value: '38.3 pts', color: '#f97316' },
    { label: 'Volumen en 14:00–15:00',       value: '42.0%',  color: '#f59e0b' },
    { label: 'Adopción de producto',         value: '25/100', color: '#ef4444' },
  ],

  resumen_ejecutivo: 'Medicall Expert registró 53,680 llamadas salientes y 905 entrantes entre el 2 de enero y el 17 de noviembre de 2026. El hallazgo central se confirma con diez meses y medio de datos: una tasa de pérdida saliente de 57.9% (31,103 de 53,680 intentos), que de febrero a octubre no se movió de la banda 56–61% con independencia de si el volumen subía o bajaba. Enero es la única excepción, con 43.5% (428 de 984) — fue el mes de arranque. El volumen escaló de 984 llamadas en enero a 9,360 en julio y descendió hasta 5,998 en octubre, el último mes completo, con un repunte del 46% en octubre sobre septiembre: la caída existe, pero no es mes con mes y no es del 70% — entre meses completos es del 35.9%. La invariancia de la tasa es la evidencia más sólida de que el problema no es de saturación de volumen sino de proceso y desempeño por asesor: la brecha entre el mejor y el peor es de 38.3 puntos con la misma infraestructura. Al lado de eso, la cuenta lleva tres meses sin contacto comercial registrado (última interacción el 15 de agosto de 2026) y una adopción de 25/100.',

  resultado_positivo: 'La operación es real, intensiva y madura: 54,585 llamadas en diez meses y medio, 50 asesores activos y pago puntual en 28 meses de relación con MRR estable de $8,067 (clasificación AAA en el Gross Revenue Facturación). Hay asesores con desempeño claramente mejor dentro del mismo equipo y la misma infraestructura — el mejor cierra en 38.9% de pérdida frente al 77.2% del peor —, lo que prueba que el 57.9% no es un límite técnico sino un margen de mejora alcanzable con el personal que ya está contratado. El cliente no se está quejando: no hay escalamiento abierto ni ticket de queja, lo que deja la conversación en terreno de asesoría y no de reclamación.',

  hallazgos: [
    /* El ORDEN dentro de esta frase también está medido: Atlas recibe sólo sus
       primeros 180 caracteres, así que las cuatro prohibiciones que cambian lo
       que el asesor dice en la llamada van delante, y el detalle detrás. Si
       alguien la reescribe, correr `node scripts/revisa-dossier-auditoria.mjs
       medicall-expert` — con la redacción anterior «KAM no es cero» caía fuera
       del corte y el guion lo cazó. */
    'NO CITAR LA FICHA VIEJA: el MRR es $8,067, no $6,831; el seguimiento KAM no es cero (última interacción 15 ago 2026); son 869 días, no 753; y hay 3 tickets, 1 abierto, no «uno en toda la relación». Health score 60, no 61. Adopción 25/100 sí es correcto, pero «ningún módulo verificado» no: la ficha registra Visibilidad y Control en nivel medio. Las seis cifras se copiaron del corte de julio de 2026 sin volver a medirse.',
    'CRÍTICO — 57.9% de pérdida saliente: 31,103 de 53,680 intentos no conectaron, y la tasa se mantuvo entre 56% y 61% de febrero a octubre, nueve meses, con independencia del volumen. Enero fue la excepción con 43.5% (428 de 984), el mes de arranque. Un problema de saturación cedería cuando baja el volumen; este no cede.',
    'TAMPOCO DECIR «cayó 70%»: esa cifra comparaba julio completo contra 17 días de noviembre. Entre meses completos la caída es del 35.9% (julio 9,360 → octubre 5,998), y no es sostenida: octubre repuntó 46% sobre septiembre. Es una caída que hay que explicar, no una caída de ese tamaño.',
    'Brecha de 38.3 puntos entre el mejor asesor con volumen (38.9%) y el peor (77.2%), con la misma plataforma para los dos. Es la oportunidad de mejora más concreta y no cuesta nada: está en proceso y coaching.',
    'Ventana 14:00–15:00: concentra 22,540 llamadas, el 42.0% del volumen del periodo, con las peores tasas del día. Cuatro de cada diez llamadas del año caben en una sola hora.',
    'EL CHAT NO FALTA PORQUE EL CLIENTE NO LO USE: la cuenta está en la fuente de Callpicker Chat como «Grupo Medexp» con 18 bandejas observadas, y la recolección falló en TODAS con error operativo HTTP 500. Es una de las 45 cuentas que esa fuente no alcanza a medir. Lo tenemos contratado y no lo podemos leer.',
    '19 instancias de marcación repetida (8 o más llamadas al mismo número en una sola jornada) sobre 15 números distintos, repartidas en 8 meses del año. 19 son los episodios y 15 los números: lo que se audita son los episodios.',
    '88.6% del canal entrante se resuelve en IVR sin llegar a un asesor, 8.2% se transfiere, 2.1% se pierde y 1.1% va a buzón. Puede ser un IVR eficiente o abandono silencioso: sin el árbol de IVR no se puede decidir, y el reporte lo deja como hipótesis.',
    'La tasa de pérdida no se puede atribuir al plan: el cliente confirmó que tiene llamadas ilimitadas sin bolsa de minutos. REVISAR nuestra propia ficha, que modela una base de 15,000 minutos (10 extensiones × 1,500) y publica 18.3% de consumo con señal CONSUMO_CRITICO — si el plan es ilimitado, ese porcentaje y esa señal no significan nada en esta cuenta.',
    'Tres meses sin contacto comercial registrado: la última interacción con el cliente es del 15 de agosto de 2026, en una cuenta de $8,067 de MRR con casi 6 de cada 10 llamadas sin conectar. No es cero gestión — es gestión interrumpida, que es un hallazgo distinto y defendible.',
    'El contacto registrado es Catherine Reynoso, responsable de cuenta (tel. 5587920966). El reporte entregado no nombra a ningún interlocutor, y la ficha tiene su nombre mal capturado en el campo de correo electrónico — corregirlo antes de cualquier envío automatizado.',
  ],

  cronologia: [
    { fecha: 'Julio 2024',           responsable: 'Ventas Callpicker',             evento: 'Alta de cuenta Medicall Expert. Servicio Visibilidad y Control + Chat (IL), llamadas ilimitadas. MRR $8,067. Inicio de los 869 días de relación que se cumplen al 17 nov 2026.', tipo: 'neutral' },
    { fecha: 'Enero 2026',           responsable: 'Operación Medicall Expert',     evento: '984 salientes con 43.5% de pérdida (428) — el mejor mes del año y el único fuera de la banda 56–61%. Volumen bajo, operación en arranque.', tipo: 'neutral' },
    { fecha: 'Feb–Mar 2026',         responsable: 'Operación Medicall Expert',     evento: 'El volumen escala a 3,021 salientes en marzo y la tasa de pérdida sube a 61.1%. A partir de aquí la banda 56–61% ya no se mueve.', tipo: 'problema' },
    { fecha: '18 Mar 2026',          responsable: 'Operación (asesor sin identificar)', evento: 'Un mismo número recibe 22 llamadas en un solo día: el episodio más extremo de los 19 de marcación repetida del año.', tipo: 'problema' },
    { fecha: 'Julio 2026',           responsable: 'Operación Medicall Expert',     evento: 'Pico del año: 9,360 salientes. La tasa de pérdida no mejora con el volumen máximo ni empeora de forma proporcional — se queda en la misma banda.', tipo: 'problema' },
    { fecha: '24 Jul 2026',          responsable: 'Callpicker Equipo EaC',         evento: 'Primera auditoría de la cuenta (v1.0), con 753 días de relación. De aquí salieron las cifras que el reporte de noviembre reprodujo sin volver a medir.', tipo: 'pivote' },
    { fecha: '15 Ago 2026',          responsable: 'Dan Domínguez',                evento: 'Última interacción comercial registrada con el cliente. Desde esta fecha la cuenta lleva tres meses sin contacto documentado.', tipo: 'problema' },
    { fecha: 'Sep–Oct 2026',         responsable: 'Operación Medicall Expert',     evento: 'Septiembre baja a 4,103 salientes y octubre REPUNTA a 5,998, un 46% más. El descenso desde julio existe pero no es mes con mes.', tipo: 'neutral' },
    { fecha: '02 Oct 2026',          responsable: 'Fuente Callpicker Chat',        evento: 'La recolección de chat falla en las 18 bandejas de la cuenta «Grupo Medexp» con error operativo HTTP 500. El canal queda sin medición por causa nuestra.', tipo: 'problema' },
    { fecha: 'Nov 2026 (al día 17)', responsable: 'Operación Medicall Expert',     evento: '2,770 salientes en 17 días. Dato PARCIAL: no se usa como extremo de ninguna comparación mensual.', tipo: 'neutral' },
    { fecha: '18 Nov 2026',          responsable: 'SAC · Callpicker',              evento: 'Revisión del reporte de noviembre: nueve correcciones. Seis cifras nuestras estaban recicladas de julio y cuatro afirmaciones de tendencia se apoyaban en el mes parcial.', tipo: 'pivote' },
  ],

  perfil_campos: [
    { label: 'Razón social',         value: 'Medicall Expert' },
    { label: 'CID Zoho',             value: '162474' },
    { label: 'Consecutivo',          value: 'C31' },
    { label: 'Sector',               value: 'Servicios médicos integrales · Naucalpan de Juárez, Estado de México' },
    { label: 'Servicio contratado',  value: 'Visibilidad y Control + Chat (IL) · Llamadas ilimitadas, sin bolsa de minutos (confirmado por el cliente)' },
    { label: 'MRR',                  value: '$8,067 MXN — Gross Revenue Facturación, «MRR estable», clasificación AAA, 12 facturas. NO $6,831, que es la cifra que traía el corte de julio y no corresponde a ninguna fuente vigente' },
    { label: 'Antigüedad',           value: '869 días activos al 17 nov 2026 (desde 2024-07-01) · 28 meses de facturación' },
    { label: 'Equipo de atención',   value: '50 asesores activos en el canal saliente; 8–10 concentran cerca del 59% del volumen' },
    { label: 'Modelo de operación',  value: 'Outbound-first: 98.3% del tráfico es saliente (contacto proactivo con pacientes)' },
    { label: 'Health Score',         value: '60/100 (adopción 25/100 · pago puntual)' },
    { label: 'Soporte',              value: '3 tickets en total, 1 de ellos abierto' },
    { label: 'Último contacto',      value: '15 de agosto de 2026 — tres meses sin interacción comercial registrada' },
    { label: 'Interlocutor',         value: 'Catherine Reynoso · Responsable de cuenta · tel. 5587920966' },
    { label: 'Canal de chat',        value: 'SIN MEDICIÓN por fallo nuestro: 18 bandejas observadas en la cuenta «Grupo Medexp», recolección fallida en todas con HTTP 500' },
  ],

  necesidad_negocio: 'Medicall Expert necesita bajar su tasa de pérdida saliente del 57.9% a niveles operativamente aceptables para una operación de salud. El canal es contacto proactivo con pacientes — confirmaciones de cita, seguimiento clínico, recordatorios — y cada intento que no conecta es potencialmente una cita no confirmada o un seguimiento que no llegó. Con 50 agentes y entre 4,000 y 9,000 llamadas al mes, la escala ya exige proceso, monitoreo y automatización, no más marcación: la tasa no se movió ni cuando el volumen se multiplicó por nueve ni cuando cayó un 36%.',

  potencial_corto: [
    'Coaching dirigido a los asesores del extremo malo de la brecha de 38.3 puntos, con el mejor del propio equipo como referente interno: misma plataforma, misma lista, resultado muy distinto.',
    'Redistribuir carga de la ventana 14:00–15:00 (42.0% del volumen, 22,540 llamadas) a franjas con mejor tasa de conexión.',
    'Reanudar el seguimiento comercial, interrumpido desde el 15 de agosto de 2026 — no arrancarlo: reanudarlo.',
    'Auditar los 19 episodios de marcación repetida en 15 números para descartar un error sistemático de lista o de dialer.',
  ],
  potencial_largo: [
    'IA de Voz para absorber confirmaciones y recordatorios en la ventana de saturación: alivia el cuello de botella sin escalar headcount.',
    'Integración con Zoho CRM —que el cliente ya usa— para depurar listas de marcación y medir conversión real por campaña.',
    'Grabación y monitoreo de calidad para cerrar la brecha entre asesores de forma permanente, no por campaña de coaching.',
    'Reparar la recolección de chat de esta cuenta: hay 18 bandejas contratadas que no podemos medir, y sin medirlas no se puede proponer nada sobre ese canal.',
  ],

  tacticas: [
    {
      nombre:      'Cerrar la brecha de 38.3 puntos entre asesores',
      descripcion: 'El mejor asesor con volumen significativo cierra en 38.9% de pérdida y el peor en 77.2%, con la misma plataforma, el mismo plan y listas comparables. Sesiones de escucha y protocolo de marcación documentado a partir del referente interno.',
      impacto:     'Es la única palanca que no requiere inversión ni decisión del cliente sobre producto, y la brecha está medida y es defendible.',
    },
    {
      nombre:      'Descongestionar la ventana 14:00–15:00',
      descripcion: 'Una sola hora concentra 22,540 llamadas, el 42.0% del periodo, y es la que peores tasas tiene. Proponer al cliente un reparto horario basado en la tasa de conexión real por franja.',
      impacto:     'Mejora la conexión sin cambiar el volumen total y sin contratar a nadie.',
    },
    {
      nombre:      'Auditar los 19 episodios de marcación repetida',
      descripcion: '19 combinaciones número-día con 8 o más llamadas al mismo número en una jornada, sobre 15 números y repartidas en 8 meses. La recurrencia descarta la casualidad.',
      impacto:     'Si es error de lista o de dialer, se elimina volumen que infla los intentos sin producir contactos.',
    },
    {
      nombre:      'Corregir nuestra propia ficha antes de la llamada',
      descripcion: 'El MRR, la antigüedad, el health score, los tickets y el seguimiento KAM estaban desactualizados, y la base de minutos que modelamos (15,000) no aplica a un plan ilimitado. Revisar los cinco campos antes de presentar cualquier cifra.',
      impacto:     'Evita la peor pérdida posible de credibilidad: que el cliente corrija a Callpicker sobre los datos de Callpicker.',
    },
  ],

  senal_alarma: '869 días de relación, 3 tickets (1 abierto), health score 60, adopción 25/100 y la última interacción comercial registrada el 15 de agosto de 2026: tres meses de silencio sobre una pérdida saliente del 57.9% que el cliente probablemente no está midiendo. CIFRAS VIGENTES AL 17 NOV 2026 — el MRR es $8,067 del GRC, no $6,831; no son 753 días; y el seguimiento KAM no es cero sino interrumpido. La versión anterior de este campo se reprodujo literalmente en un reporte de cliente cuatro meses después de escribirse.',

  problema_raiz:        'Operación outbound de alto volumen escalada sin proceso, capacitación ni tecnología de soporte proporcionales — y, del lado de Callpicker, una cuenta de $8,067 que lleva tres meses sin contacto.',
  problema_raiz_detalle:'El problema no es de plan: el cliente tiene llamadas ilimitadas sin bolsa de minutos, así que no hay incentivo a racionar intentos. Tampoco es de saturación de volumen, y eso está medido: la tasa de pérdida se quedó entre 56% y 61% de febrero a octubre tanto en el pico de julio (9,360 llamadas) como en octubre, un 36% por debajo (5,998). Un cuello de botella de capacidad cedería al bajar la carga; este no cede. Lo que sí varía es el asesor: 38.3 puntos entre el mejor y el peor con la misma infraestructura. A eso se suma la concentración de 42.0% del volumen anual en la hora 14:00–15:00, que es además la de peores tasas. Del lado nuestro, la cuenta lleva tres meses sin interacción registrada y su adopción es 25/100, de modo que el cliente escala una operación crítica sobre una plataforma cuyo desempeño nadie le está midiendo ni reportando.',

  flujo_real: [
    { fase: 'Marcación',       area: '50 asesores',                       accion: 'El equipo marca de 8:00 a 19:00 con concentración extrema en 14:00–15:00 (42.0% del volumen)',             resultado: '57.9% de los intentos no conectan: 31,103 de 53,680.' },
    { fase: 'Hora pico',       area: 'Franja 14:00–15:00',                accion: '22,540 llamadas en una sola hora del día, a lo largo del periodo',                                        resultado: 'Las peores tasas del día coinciden con la mayor carga.' },
    { fase: 'Calidad asesor',  area: 'Asesores individuales',             accion: 'Todos marcan con la misma plataforma, el mismo plan y listas comparables',                               resultado: '38.3 puntos de brecha entre el mejor (38.9%) y el peor (77.2%): es proceso, no infraestructura.' },
    { fase: 'IVR entrantes',   area: 'Canal entrante (905 llamadas)',     accion: '88.6% se resuelve en IVR sin transferencia; 8.2% llega a un agente humano',                               resultado: 'Sin el árbol de IVR no se puede saber si resuelve o si abandona la necesidad del paciente.' },
    { fase: 'Chat',            area: 'Cuenta «Grupo Medexp», 18 bandejas', accion: 'La recolección falla en todas las bandejas con error operativo HTTP 500',                                 resultado: 'SIN MEDICIÓN por causa nuestra. No es que el cliente no use el chat: es que no lo leemos.' },
    { fase: 'Gestión',         area: 'Callpicker · Dan Domínguez',        accion: 'Última interacción comercial registrada el 15 de agosto de 2026; adopción 25/100',                        resultado: 'Tres meses sin contacto en una cuenta de $8,067 con 6 de cada 10 llamadas sin conectar.' },
  ],

  comparativo: [
    { metrica: 'Pérdida saliente',              real: '57.9% (31,103 de 53,680)',          ideal: '<30% para una operación de contacto proactivo' },
    { metrica: 'Brecha entre asesores',         real: '38.3 puntos (38.9% – 77.2%)',       ideal: '<10 puntos con protocolo uniforme' },
    { metrica: 'Volumen en la hora pico',       real: '42.0% del periodo en 14:00–15:00',  ideal: '<20% — reparto horario según tasa de conexión' },
    { metrica: 'Adopción de producto',          real: '25/100 (sólo VyC medido, en nivel medio)', ideal: '>60/100 con al menos 3 módulos con uso medido' },
    { metrica: 'Contacto comercial',            real: 'Última interacción 15 ago 2026 — 3 meses', ideal: 'Mínimo una revisión mensual documentada' },
    { metrica: 'Medición del canal de chat',    real: 'SIN MEDICIÓN: 18 bandejas, recolección fallida HTTP 500', ideal: 'Medido — es un canal contratado y facturado' },
  ],

  plan_inmediato: [
    { accion: 'Antes de llamar, corregir los cinco campos vencidos de la ficha (MRR, antigüedad, health score, tickets, último contacto) y revisar la base de minutos, que modela 15,000 para un plan ilimitado.', responsable: 'Dan Domínguez + SAC', criterio: 'Ficha con las cifras del 17 nov 2026. Ningún documento del cliente cita $6,831 ni 753 días.' },
    { accion: 'Agendar la revisión operativa con Catherine Reynoso, responsable de cuenta. Es la primera conversación documentada desde el 15 de agosto.', responsable: 'Dan Domínguez', criterio: 'Reunión agendada y registrada en el expediente de la cuenta.' },
    { accion: 'Sesión de escucha con los asesores del extremo malo de la brecha de 38.3 puntos, usando al mejor del propio equipo como referente.', responsable: 'Dan Domínguez', criterio: 'Sesión realizada y plan de coaching con tres acciones concretas documentado.' },
    { accion: 'Levantar el fallo de recolección del canal de chat: 18 bandejas de la cuenta «Grupo Medexp» devuelven HTTP 500 desde el corte del 2 de octubre.', responsable: 'SAC + Ingeniería', criterio: 'Incidencia abierta con el equipo de la fuente. El canal aparece medido en un corte posterior.' },
    { accion: 'Investigar con el cliente los 19 episodios de marcación repetida en 15 números — en particular las 22 llamadas al mismo número el 18 de marzo.', responsable: 'Dan Domínguez + Soporte', criterio: 'Caso aclarado: error de lista/dialer o caso de negocio legítimo.' },
  ],
  plan_mediano: [
    { accion: 'Proponer al cliente un reparto horario que descongestione la ventana 14:00–15:00, basado en la tasa de conexión real por franja.', responsable: 'Dan Domínguez + cliente', criterio: 'La tasa de pérdida de esa franja baja al menos 8 puntos en 60 días.' },
    { accion: 'Medir qué módulos del plan VyC + Chat tienen uso real y documentarlo: hoy sólo Visibilidad y Control está medido, en nivel medio.', responsable: 'Dan Domínguez + Ingeniería', criterio: 'Adopción sube de 25/100 a ≥50/100, con el uso medido y no declarado.' },
    { accion: 'Restablecer la cadencia de revisión mensual con agenda fija: tasa de conexión, desempeño por asesor y reparto horario.', responsable: 'Dan Domínguez', criterio: 'Tres revisiones consecutivas registradas sin hueco.' },
  ],
  plan_estrategico: [
    { accion: 'IA de Voz para absorber confirmaciones y recordatorios en la ventana de saturación, liberando al equipo humano para las llamadas que requieren criterio.', responsable: 'Dan + Producto', criterio: 'IA de Voz activa en la hora crítica. La pérdida global baja por debajo del 45%.' },
    { accion: 'Integrar Zoho CRM con Callpicker para depurar listas de marcación y medir conversión real por campaña.', responsable: 'Ingeniería + IT del cliente', criterio: 'Integración activa y primer reporte de conversión por campaña entregado.' },
  ],

  areas_oportunidad: [
    { area: 'Coaching sobre la brecha medida', impacto: 'La palanca de mayor efecto y la única sin costo ni decisión de producto', responsable: 'Dan Domínguez' },
    { area: 'Reparto de la hora pico',         impacto: 'Mejora la conexión sin cambiar volumen ni headcount',                     responsable: 'Dan + cliente' },
    { area: 'IA de Voz en la franja crítica',  impacto: 'Escala la operación sin escalar personas',                                responsable: 'Producto + Dan' },
    { area: 'Medición real de adopción',       impacto: 'Sube la adopción desde 25/100 y reduce el riesgo silencioso de churn',    responsable: 'Dan + Ingeniería' },
    { area: 'Reparar la lectura del chat',     impacto: '18 bandejas contratadas que hoy no podemos medir ni proponer',            responsable: 'SAC + Ingeniería' },
  ],

  perfiles: [
    {
      nombre: 'Catherine Reynoso',
      rol:    'Responsable de cuenta · interlocutor del cliente',
      color:  '#3b82f6',
      campos: [
        { label: 'Teléfono',  value: '5587920966' },
        { label: 'Nota',      value: 'El reporte entregado no nombra a ningún interlocutor. En la ficha su nombre está capturado en el campo de correo electrónico — corregirlo antes de cualquier envío automatizado.' },
      ],
    },
    {
      nombre: 'Mejor asesor con volumen',
      rol:    'Referente interno para el coaching',
      color:  '#22c55e',
      campos: [
        { label: 'Pérdida',   value: '38.9% — el extremo bueno de la brecha' },
        { label: 'Nota',      value: 'Su protocolo es lo que hay que documentar y replicar: misma plataforma y mismo plan que el resto del equipo.' },
      ],
    },
    {
      nombre: 'Asesor con mayor brecha',
      rol:    'Prioridad 1 para coaching',
      color:  '#ef4444',
      campos: [
        { label: 'Pérdida',   value: '77.2% — 38.3 puntos sobre el mejor' },
        { label: 'Nota',      value: 'La infraestructura no explica la diferencia: es proceso de marcación y ejecución individual.' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      'Operación saliente consolidada e intensiva: 54,585 llamadas en diez meses y medio.',
      'MRR estable de $8,067 con clasificación AAA y 28 meses de facturación puntual.',
      '50 asesores: base suficiente para repartir carga y replicar buenas prácticas internas.',
      'El cliente no está en reclamación: la conversación entra como asesoría, no como queja.',
    ],
    oportunidades: [
      'Brecha de 38.3 puntos entre asesores: mejora medible sin inversión tecnológica.',
      'IA de Voz para la ventana 14:00–15:00, que concentra el 42.0% del volumen.',
      'Integración con Zoho CRM, que el cliente ya usa.',
      'Un canal de chat contratado y hoy invisible: medirlo abre una conversación entera que no estamos teniendo.',
    ],
    debilidades: [
      '57.9% de pérdida saliente, estable entre 56% y 61% de febrero a octubre: casi 6 de cada 10 intentos de contacto con pacientes fallan.',
      'Adopción de producto en 25/100: el uso medido se limita a Visibilidad y Control en nivel medio; ningún otro módulo contratado aparece con uso.',
      'Seguimiento comercial interrumpido: la última interacción registrada es del 15 de agosto de 2026, hace tres meses.',
      'Nuestra propia ficha tenía seis cifras vencidas, y se reprodujeron en un documento dirigido al cliente.',
    ],
    amenazas: [
      'Riesgo clínico y reputacional del cliente: la pérdida de contacto afecta confirmaciones de cita y seguimiento de pacientes.',
      'Una cuenta de $8,067 con pago puntual y sin gestión visible es el perfil exacto de la fuga silenciosa.',
      'Si el cliente detecta antes que nosotros que nuestras cifras sobre su cuenta estaban vencidas, se pierde el terreno de asesoría.',
    ],
  },

  conclusion: 'Medicall Expert es una cuenta crítica que opera en silencio: 54,585 llamadas, $8,067 de MRR estable, 28 meses de pago puntual — y una tasa de pérdida saliente del 57.9% que no se movió en nueve meses y que el cliente probablemente no está midiendo. El problema está localizado y es defendible con datos: no es el plan (ilimitado), no es la infraestructura (idéntica para todos) y no es la saturación de volumen (la tasa no cedió cuando el volumen cayó un 36%). Es proceso y ejecución por asesor, con 38.3 puntos de brecha entre el mejor y el peor, agravado por concentrar el 42.0% del volumen anual en una sola hora del día. La conversación tiene un punto de partida sin fricción, porque el cliente no está reclamando. Lo que la pone en riesgo es nuestro propio lado: tres meses sin contacto, adopción en 25/100, un canal de chat contratado que no sabemos leer, y seis cifras de la ficha que llegaron vencidas a un documento dirigido al cliente. Antes de presentar el análisis hay que corregir eso: la peor forma de perder esta cuenta es que el cliente nos corrija los datos.',

  pierde: [
    'Contactar a casi 6 de cada 10 pacientes en su canal de trabajo principal.',
    'Confirmaciones de cita y seguimiento clínico que no llegan al paciente.',
    'Visibilidad de qué módulos contratados están realmente en uso — y del canal de chat, que ni nosotros medimos.',
  ],
  gana: [
    'Un plan de coaching con referente interno documentado y sin costo adicional.',
    'Un reparto horario que mejora la conexión sin cambiar volumen ni personal.',
    'La primera revisión operativa desde agosto, con la brecha entre asesores medida y presentable.',
  ],
  recomendacion_central: 'Agendar esta semana la revisión operativa con Catherine Reynoso — la primera desde el 15 de agosto — y llegar con la ficha corregida: $8,067 de MRR, 869 días de relación, health score 60, 3 tickets. Presentar los dos hallazgos que se sostienen solos: el 57.9% de pérdida que no cedió aunque el volumen cayera 36%, y los 38.3 puntos de brecha entre asesores con la misma plataforma. No usar la caída del 70% ni «cero seguimiento KAM»: la primera compara julio contra 17 días de noviembre y la segunda es falsa. En paralelo, levantar el fallo de recolección del canal de chat, porque son 18 bandejas contratadas que hoy no podemos medir.',

  documentos: [
    {
      nombre:      'Medicall Expert · Auditoría de Llamadas — 17 nov 2026 (con las correcciones SAC del 18 nov)',
      ruta:        '/auditorias/Medicall_Expert_Auditoria_Llamadas_2026-11-17.html',
      descripcion:
        'Reporte del corte del 17 nov 2026 sobre 53,680 llamadas salientes y 905 entrantes del CID ' +
        '162474 (02 ene – 17 nov 2026, noviembre parcial y rotulado como tal). Su análisis de ' +
        'llamadas cuadra con sus propios totales y sus meses coinciden exactamente con nuestro ' +
        'corte. Lleva NUEVE correcciones de SAC, cada una anotada en su párrafo con lo que decía ' +
        'antes: seis cifras nuestras estaban recicladas del corte de julio de 2026 (MRR, ' +
        'antigüedad, health score, tickets, adopción y seguimiento KAM) y cuatro afirmaciones de ' +
        'tendencia se apoyaban en el mes parcial o se contradecían con las cifras del propio ' +
        'reporte. Verificable con `python scripts/concilia-auditoria-medicall-expert.py`.',
    },
  ],
}
