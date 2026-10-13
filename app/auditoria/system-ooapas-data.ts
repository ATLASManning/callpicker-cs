import type { AuditoriaCase } from './types'

/**
 * GRUPO SYSTEM OOAPAS (D2 · CID 167954) — la cuenta que no opera.
 *
 * Auditoría del 12 oct 2026. Es el tercer caso del TOP 50 y el más corto a
 * propósito: aquí no hay una operación que auditar. Lo que hay es una cuenta
 * encendida que no consume, y un importe en la ficha que no cuadra con nada.
 *
 * LA TRAMPA QUE ESTE EXPEDIENTE NO PISA: marca 99.70% de llamadas sin
 * contestar, y eso NO es una falla de atención. Las 2,625 van íntegras a un
 * destino llamado «Agente Virtual OOAPAS» con cero contestadas y cero
 * minutos — la firma exacta de un destino automatizado, no de un teléfono
 * que nadie toma. El propio repositorio ya lo tenía documentado como falsa
 * alarma, y el 28 de septiembre Dan lo confirmó con el cliente.
 *
 * Cifras contra fuente:
 *   · llamadas → app/cuentas/llamadas-data.ts, CID 167954 (corte 14 sep 2026)
 *   · cortes   → data/cortes-facturacion.xlsx, 9 cortes del CID
 *   · GRC      → data/grc-zoho.json y el respaldo del 2 oct
 *   · ficha    → tabla `cuentas` · alertas → alertas_episodios
 */
export const SYSTEM_OOAPAS: AuditoriaCase = {
  id: 'system-ooapas',
  asesor: 'Dan',
  nombre: 'Grupo System OOAPAS (Estradata)',
  sector: 'Tratamiento de agua — organismo operador',
  fecha_periodo: 'Febrero 2025 – Octubre 2026',
  fecha_auditoria: 'Oct 2026',
  tipo_cliente: 'AAA por clasificación · sin operación activa',
  descripcion_contexto: '19 meses · plan «Visibilidad y Control 400 minutos» de $1,078 · CERO minutos consumidos en los 9 cortes disponibles · 2,633 entrantes, todas a un agente virtual · 0 salientes · 0 tickets · la ficha la valora en $38,123',
  estado: 'en_riesgo',
  clasificacion: 'CONFIDENCIAL',
  version: '1.0',

  kpis: [
    { label: 'Minutos consumidos',        value: '0 en 9 cortes seguidos',  color: '#ef4444' },
    { label: 'Plan contratado',           value: '$1,078 / mes',            color: '#6366f1' },
    { label: 'Lo que dice la ficha',      value: '$38,123 — 35× el plan',   color: '#f97316' },
    { label: 'Tickets en 19 meses',       value: '0',                       color: '#94a3b8' },
  ],

  resumen_ejecutivo: 'Grupo System OOAPAS no está operando, y el cliente ya lo dijo. El 28 de septiembre Dan registró por escrito lo que le contó Ricardo Medina: «la cuenta actualmente no se encuentra en operación, se mantiene únicamente como respaldo de información». Todo lo demás que mide el tablero confirma esa frase.\n\nNueve cortes de facturación consecutivos, de noviembre de 2025 a julio de 2026, con CERO minutos consumidos sobre un plan de 400. Cero llamadas salientes en toda la ventana medida. Cero tickets en la mesa de ayuda en 19 meses de relación. Y la interacción con el panel es prácticamente nula: 0, 4, 0, 0, 3 y 0 eventos en los cortes donde se midió.\n\nMarca 99.70% de llamadas entrantes sin contestar, y hay que decir de entrada que eso NO es una falla de atención. Las 2,625 perdidas van íntegras a un destino llamado «Agente Virtual OOAPAS», con cero contestadas y cero minutos en todo el periodo. Esa combinación es la firma de un destino automatizado, no la de un teléfono que nadie toma. Publicarlo como mal servicio sería una falsa alarma, y el propio repositorio ya lo tenía anotado como tal.\n\nLo que sí es un hallazgo está en el dinero. El plan contratado son $1,078 al mes — «Visibilidad y Control 400 minutos» ($979) más la renta del número 4431132200 ($99)—, y el GRC confirma ese mismo importe como su MRR de entrada. La ficha, en cambio, la valora en $38,123: treinta y cinco veces el plan. Esa cifra no coincide ni con el contrato ni con el GRC, y es la que usan el ranking de cartera y la propia alerta de consumo cero, que publica «paga $38,123 al mes».\n\nCon el importe real, esta cuenta no pertenece al TOP 50. Está ocupando un lugar que le corresponde a una cuenta que sí opera.',

  resultado_positivo: 'La relación está sana y documentada. Hay DOS contactos capturados con nombre, cargo, correo y teléfono —Rodrigo Medina, Director, y Osvel Chegizay, Full Stack Developer—, algo que ninguna de las otras dos cuentas auditadas tiene.\n\nEl seguimiento del 28 de septiembre es un buen trabajo de SAC: Dan contactó al titular, obtuvo la explicación real del comportamiento de las llamadas, dejó registrado que Ricardo ya tiene los canales para pedir apoyo si decide reactivar, y recomendó seguimiento preventivo. Eso es exactamente lo que debe hacerse con una cuenta en pausa.\n\nPaga al corriente, con cero incidencias en 19 meses, y su `score_pago` es 100 — el único bloque del Health Score que está medido al máximo. La conciliación ya revisó su línea del GRC y la marcó `sigue_viva`: el churn que aparece es del mes vivo, o sea cartera por cobrar, no una baja.',

  hallazgos: [
    'OPERACIÓN — La cuenta NO está en operación, y lo dice el cliente. Observaciones del 28 sep 2026, semana 40: «de acuerdo con lo comentado por Ricardo Medina, se mantiene únicamente como respaldo de información… este comportamiento no representa actualmente una afectación operativa debido a que la cuenta no está en producción».',
    'CONSUMO — CERO minutos consumidos en los 9 cortes disponibles, sobre un plan de 400 minutos. Todos los cortes, de 2025-12-19 a 2026-08, traen «Minutos Consumidos = 0» y «% Consumo = 0». No es una caída: nunca se usó.',
    'LLAMADAS — 99.70% sin contestar (2,625 de 2,633), pero NO es una falla de atención. Las 2,625 van a un solo destino, «Agente Virtual OOAPAS», con 0 contestadas y 0 minutos. Esa firma —cero conversación y concentración total— es la de un destino automatizado. Interpretarlo como mal servicio sería una falsa alarma.',
    'LLAMADAS — CERO salientes en toda la ventana (1 ene – 10 sep 2026). Una cuenta de Visibilidad y Control que no marca hacia fuera ni una vez.',
    'DINERO — El plan contratado son $1,078 al mes: «Visibilidad y Control 400 minutos» ($979) más la renta del número 4431132200 ($99). El GRC confirma exactamente ese importe como `mrrIni`. La ficha dice $38,123 — treinta y cinco veces más. La cifra no coincide con ninguna fuente.',
    'DINERO — La alerta de consumo cero publica «y paga $38,123 al mes», repitiendo el importe equivocado. El hallazgo es correcto —no consume— pero la cifra con la que se dimensiona no lo es.',
    'DINERO — Con $1,078 esta cuenta NO pertenece al TOP 50 por facturación. Hoy figura en el puesto 7 con $38,123 y está desplazando a cuentas que sí operan.',
    'DINERO — Histórico desigual: 9 facturas en 19 meses, $576,161 acumulados. No factura todos los meses, lo que explica que cualquier promedio de vida dé una cifra muy distinta al plan vigente.',
    'DATOS — Las `notas` de esta cuenta son las de OTRA cuenta: «Grupo automotriz (principalmente red de concesionarias Nissan) con operación multi-ciudad… fundación 1987». Eso es GRUPO TORRES CORZO. Su giro real es tratamiento de agua y su sitio es estradata.com. La nota está mal pegada.',
    'SERVICIO — CERO tickets en la mesa de ayuda en 19 meses de relación. No es un buen dato ni uno malo: es coherente con una cuenta que no opera.',
    'ADOPCIÓN — `score_adopcion` es 4 sobre 100, el más bajo de las cuentas auditadas. La evaluación automática del 31 de agosto lo dice sin rodeos: Voz VyC en nivel BAJO —«todas las llamadas perdidas alrededor del año»— y uso del panel BAJO —«no se muestran indicios de interacción con plataforma callpicker»—.',
    'ESTADO — La cuenta figura `en_riesgo`, no `dormida`. Si de verdad se mantiene sólo como respaldo de información, su estado debería reflejarlo — y esa es una decisión de dirección, no del tablero.',
    'CHURN — El GRC la marca «Churn confirmado» con pérdida de $1,078 en los DOS últimos cortes, pero la conciliación ya la verificó y la dejó como `sigue_viva`: es el mes vivo, o sea cartera por cobrar, no una baja. La regla de la casa se está aplicando bien aquí.',
    'CONTEXTO DE CARTERA — En el corte vigente del GRC hay 1,492 líneas marcadas churn y 1,396 de ellas están `sin_verificar`, con $2,528,125.71 de pérdida declarada. Esta cuenta es de las 90 que sí se verificaron. El resto es trabajo pendiente que excede este expediente.',
  ],

  cronologia: [
    { fecha: '11 Feb 2025', responsable: 'Callpicker',      evento: 'Alta de la cuenta. Plan «Visibilidad y Control 400 minutos» más renta del número 4431132200: $1,078 al mes.', tipo: 'neutral' },
    { fecha: '19 Dic 2025', responsable: 'Facturación',     evento: 'Primer corte disponible. Minutos consumidos: 0 de 400. Interacciones con el panel: 0.', tipo: 'problema' },
    { fecha: '19 Ene 2026', responsable: 'Cliente',         evento: 'Único corte con señal de vida en el panel: 4 interacciones (2 de configuración, 1 reporte, 1 historial de llamadas). Minutos consumidos: 0.', tipo: 'neutral' },
    { fecha: 'Feb–Jul 2026', responsable: 'Facturación',    evento: 'Siete cortes más, todos con 0 minutos consumidos. Sólo el de abril registra 3 interacciones con el panel; el resto, ninguna.', tipo: 'problema' },
    { fecha: '31 Ago 2026', responsable: 'Atlas (automático)', evento: 'Evaluación de adopción: Voz VyC BAJO —«todas las llamadas perdidas alrededor del año»— y panel BAJO —«no se muestran indicios de interacción»—.', tipo: 'problema' },
    { fecha: '10 Sep 2026', responsable: 'Operación',       evento: 'Última llamada registrada en el archivo. A partir de aquí no hay más tráfico medido.', tipo: 'neutral' },
    { fecha: '28 Sep 2026', responsable: 'Dan',             evento: 'CONTACTO CON EL TITULAR. Ricardo Medina confirma que la cuenta no está en operación y que se mantiene como respaldo de información. Dan deja registrado que Ricardo tiene los canales para pedir apoyo si decide reactivarla, y recomienda seguimiento preventivo.', tipo: 'pivote' },
    { fecha: '02 Oct 2026', responsable: 'Conciliación',    evento: 'El GRC la marca «Churn confirmado» y la conciliación la verifica como `sigue_viva`: mes vivo, cartera por cobrar.', tipo: 'neutral' },
    { fecha: '06 Oct 2026', responsable: 'Motor de alertas', evento: 'Se abre `consumo_cero` en severidad CRÍTICA: «cero minutos consumidos en los 5 meses medidos, y paga $38,123 al mes» — el hallazgo es correcto, la cifra no.', tipo: 'problema' },
  ],

  perfil_campos: [
    { label: 'Razón social / grupo', value: 'Grupo System OOAPAS — opera bajo Estradata' },
    { label: 'Giro',                 value: 'Tratamiento de agua — organismo operador' },
    { label: 'Sitio',                value: 'estradata.com' },
    { label: 'Domicilio fiscal',     value: 'Santa Cruz del Valle Int. 2, C.P. 45615, Tlaquepaque, Jalisco' },
    { label: 'Tamaño',               value: 'Mediana — 51 a 150 empleados · 9 oficinas' },
    { label: 'Contacto principal',   value: 'Rodrigo Medina — Director · rmedina@estradata.com · 33 2123 9755' },
    { label: 'Contacto técnico',     value: 'Osvel Chegizay — Full Stack Developer · odoubleg02@gmail.com' },
    { label: 'Quien dio la respuesta', value: 'Ricardo Medina, titular de la cuenta (28 sep 2026)' },
    { label: 'Cliente desde',        value: '11 de febrero de 2025 — 19 meses' },
    { label: 'Servicio contratado',  value: 'Visibilidad y Control 400 minutos ($979) + renta del número 4431132200 ($99)' },
    { label: 'MRR real',             value: '$1,078 al mes — confirmado por el GRC y por los 9 cortes' },
    { label: 'MRR en la ficha',      value: '$38,123 — no coincide con ninguna fuente' },
    { label: 'Histórico',            value: '9 facturas en 19 meses · $576,161 acumulados' },
    { label: 'Salud de pago',        value: 'Al corriente · 0 incidencias · score_pago 100' },
    { label: 'Health Score',         value: '47 · pago 100 · actividad 69 · relacional 11 · ADOPCIÓN 4' },
  ],

  necesidad_negocio: 'Grupo System OOAPAS contrató Visibilidad y Control con 400 minutos y un número rentado, presumiblemente para atender a los usuarios de un organismo operador de agua. Es un plan pequeño y acotado.\n\nLo que ocurrió es que esa operación no se puso en marcha, o se detuvo. El cliente lo describe hoy como un respaldo de información: la cuenta existe, el número está rentado, el agente virtual contesta — y nadie del lado del cliente la usa para hablar con nadie.\n\nPor eso su necesidad de negocio actual no es de producto sino de decisión. Hay dos caminos y los dos son legítimos: reactivar la operación, para lo cual Callpicker ya dejó los canales abiertos con Ricardo Medina; o reconocer formalmente que está en pausa y moverla al estado que le corresponde, liberando la atención del equipo. Lo que no tiene sentido es seguir tratándola como una cuenta de $38,123 al mes que está fallando en atención telefónica, porque ninguna de las dos cosas es cierta.',

  potencial_corto: [
    'Corregir el importe: $1,078 contra los $38,123 de la ficha. Es media hora de trabajo y reordena el TOP 50.',
    'Corregir las `notas`, que hoy describen a un grupo automotriz de concesionarias Nissan: son las de GRUPO TORRES CORZO.',
    'Llevar a dirección la decisión de estado: si es un respaldo de información, `en_riesgo` no la describe.',
    'Cobrar el mes vivo: el GRC marca $1,078 de pérdida que la conciliación dejó como `sigue_viva`.',
  ],

  potencial_largo: [
    'Si reactiva: el plan de 400 minutos es el piso de la escalera de producto, y la cuenta tiene nueve oficinas.',
    'Hay un contacto técnico capturado (Full Stack Developer): si vuelve a operar, es el interlocutor para una integración.',
    'El agente virtual ya está configurado y recibiendo tráfico: la infraestructura para reactivar está puesta.',
  ],

  tacticas: [
    { nombre: 'No llamar a vender', descripcion: 'El cliente ya explicó su situación hace dos semanas y Callpicker quedó en seguimiento preventivo. Volver con una propuesta ahora contradice lo acordado.', impacto: 'Conserva la credibilidad del acuerdo del 28 de septiembre.' },
    { nombre: 'Arreglar lo nuestro primero', descripcion: 'El importe inflado 35 veces y una nota que describe a otra empresa son errores de Callpicker, no del cliente. Se corrigen sin llamar a nadie.', impacto: 'Devuelve la cuenta a su tamaño real y libera un lugar del TOP 50.' },
    { nombre: 'Poner fecha al seguimiento preventivo', descripcion: 'Dan recomendó «validar cualquier cambio en el uso o necesidad de reactivación». Sin una fecha concreta eso no ocurre.', impacto: 'Convierte una recomendación en una actividad con dueño.' },
  ],

  senal_alarma: 'Una cuenta que no consume un solo minuto desde que hay registro, que el cliente describe como respaldo de información, y que el tablero valora en $38,123 al mes y coloca en el puesto 7 de la cartera. El riesgo no es perderla: es el tiempo del equipo que se desvía hacia ella.',

  problema_raiz: 'No hay un problema de servicio. Hay una cuenta en pausa que el tablero mide como si fuera treinta y cinco veces más grande de lo que es.',

  problema_raiz_detalle: 'Los tres indicadores que harían saltar esta cuenta —99.70% de llamadas sin contestar, consumo cero y churn en el GRC— describen la misma realidad: una cuenta que no está operando. Ninguno de los tres es un fallo de Callpicker ni un problema que resolver con el cliente.\n\nEl 99.70% tiene explicación estructural: las 2,625 llamadas van a un destino automatizado con cero minutos, que es exactamente la firma que el módulo de llamadas define como «destino por confirmar» y no como mala atención. El consumo cero es coherente con una cuenta fuera de producción. Y el churn del GRC está verificado como `sigue_viva`, o sea cartera por cobrar del mes vivo.\n\nLo que sí es un problema está del lado de Callpicker, y es de datos. El importe de $38,123 no sale ni del contrato ($1,078) ni del GRC ($1,078 de MRR inicial): es una cifra sin fuente que coloca a esta cuenta en el puesto 7 de la cartera y la mete en el TOP 50. Y las notas de la ficha describen un grupo automotriz de concesionarias Nissan fundado en 1987 — texto que pertenece a GRUPO TORRES CORZO y que alguien pegó aquí.\n\nUn expediente honesto sobre esta cuenta es necesariamente corto, porque no hay una operación que auditar. Lo útil que puede hacer es decir con precisión lo que no pasa, para que el equipo deje de buscar ahí.',

  flujo_real: [
    { fase: 'Entra la llamada',   area: 'Usuario final',          accion: 'Marca al número 4431132200', resultado: '2,633 entrantes de 1,237 números distintos en 8 meses' },
    { fase: 'Contesta el agente', area: 'Agente Virtual OOAPAS',  accion: 'El destino automatizado recibe la llamada', resultado: '2,625 registradas como no contestadas · 0 minutos de conversación' },
    { fase: 'Nadie toma',         area: '— (no hay operación)',   accion: 'No hay extensión humana detrás', resultado: 'El cliente confirma que la cuenta no está en producción' },
    { fase: 'Factura el plan',    area: 'Facturación',            accion: 'Se cobra «Visibilidad y Control 400 minutos»', resultado: '9 cortes con 400 minutos incluidos y 0 consumidos' },
    { fase: 'El tablero mide',    area: 'Callpicker',             accion: 'Lee `cuentas.facturacion`', resultado: 'La dimensiona en $38,123 y la coloca en el puesto 7 de la cartera' },
  ],

  comparativo: [
    { metrica: 'Minutos consumidos por corte', real: '0 de 400, en los 9 cortes', ideal: 'Un plan que se usa' },
    { metrica: 'Llamadas salientes',           real: '0 en toda la ventana',      ideal: 'Cualquier número > 0' },
    { metrica: 'Interacciones con el panel',   real: '0, 4, 0, 0, 3, 0 por corte', ideal: 'Uso regular' },
    { metrica: 'MRR según la ficha',           real: '$38,123',                    ideal: '$1,078 — el plan contratado y el del GRC' },
    { metrica: 'Puesto en la cartera',         real: '7 de 193',                   ideal: 'Fuera del TOP 50' },
    { metrica: 'Score de adopción',            real: '4 de 100',                   ideal: 'El más bajo de las cuentas auditadas' },
    { metrica: 'Tickets en 19 meses',          real: '0',                          ideal: 'Coherente con no operar' },
    { metrica: 'Exactitud de las notas',       real: 'Describen a otra empresa',   ideal: 'Las suyas' },
  ],

  plan_inmediato: [
    { accion: 'Corregir `cuentas.facturacion`: $1,078 según el contrato y el GRC, no $38,123', responsable: 'Dirección / Facturación', criterio: 'La ficha, el GRC y `servicios_json` dicen la misma cifra, y la cuenta sale del TOP 50' },
    { accion: 'Borrar de `notas` el texto de GRUPO TORRES CORZO y escribir el de esta cuenta', responsable: 'Dan', criterio: 'La nota describe tratamiento de agua, no concesionarias Nissan' },
    { accion: 'Llevar a dirección la decisión de estado: si es respaldo de información, no es `en_riesgo`', responsable: 'Dan → Dirección', criterio: 'Dirección resuelve. NINGUNA baja ni cambio de estado sin su autorización.' },
    { accion: 'Poner fecha al seguimiento preventivo que Dan recomendó el 28 de septiembre', responsable: 'Dan', criterio: 'Actividad agendada con fecha concreta de revalidación' },
  ],

  plan_mediano: [
    { accion: 'Cobrar el mes vivo: $1,078 marcados como pérdida en el GRC y verificados `sigue_viva`', responsable: 'Administración', criterio: 'La línea deja de aparecer como churn en el siguiente corte' },
    { accion: 'Documentar el destino «Agente Virtual OOAPAS» en la ficha, para que ningún análisis futuro lo lea como falla de atención', responsable: 'Dan', criterio: 'Queda escrito en observaciones, con la cifra y la explicación' },
    { accion: 'Revisar si el número 4431132200 debe seguir rentado mientras la cuenta no opera', responsable: 'Dan + cliente', criterio: 'Decisión del cliente registrada' },
  ],

  plan_estrategico: [
    { accion: 'Definir un criterio de cartera para cuentas en pausa: qué estado les corresponde y con qué cadencia se revisan', responsable: 'Dirección', criterio: 'Criterio escrito y aplicado a todas las que estén en la misma situación' },
    { accion: 'Si el cliente reactiva, entrar con la escalera de producto desde el plan de 400 minutos', responsable: 'Dan', criterio: 'Propuesta lista para el día que Ricardo Medina avise' },
  ],

  areas_oportunidad: [
    { area: 'Corrección del importe',        impacto: '$37,045 de diferencia que distorsionan el ranking de cartera', responsable: 'Facturación' },
    { area: 'Corrección de las notas',       impacto: 'La ficha describe a otra empresa',                              responsable: 'Dan' },
    { area: 'Decisión de estado',            impacto: 'Un lugar del TOP 50 ocupado por una cuenta que no opera',       responsable: 'Dirección' },
    { area: 'Cobro del mes vivo',            impacto: '$1,078',                                                        responsable: 'Administración' },
    { area: 'Reactivación, si ocurre',       impacto: 'Nueve oficinas y un contacto técnico ya capturado',             responsable: 'Dan' },
  ],

  perfiles: [
    {
      nombre: 'Rodrigo / Ricardo Medina', rol: 'Director y titular de la cuenta — Grupo System OOAPAS', color: '#6366f1',
      campos: [
        { label: 'Correo',    value: 'rmedina@estradata.com' },
        { label: 'Teléfono',  value: '33 2123 9755' },
        { label: 'Dijo',      value: '28 sep 2026 — la cuenta no está en operación, se mantiene como respaldo de información' },
        { label: 'Estado',    value: 'Tiene los canales de Callpicker por WhatsApp y correo para pedir apoyo si decide reactivar' },
        { label: 'Ojo',       value: 'La ficha lo registra como «Rodrigo» y las observaciones de Dan como «Ricardo». Conviene confirmar cuál es.' },
      ],
    },
    {
      nombre: 'Osvel Chegizay', rol: 'Full Stack Developer — Grupo System OOAPAS', color: '#22c55e',
      campos: [
        { label: 'Correo',  value: 'odoubleg02@gmail.com' },
        { label: 'Valor',   value: 'Contacto técnico capturado. Es el interlocutor para una integración el día que la cuenta vuelva a operar.' },
      ],
    },
    {
      nombre: 'Dan', rol: 'Asesor SAC de la cuenta — Callpicker', color: '#f59e0b',
      campos: [
        { label: 'Trabajo',   value: '28 sep 2026 — contactó al titular, obtuvo la explicación real y la dejó por escrito' },
        { label: 'Resultado', value: 'La única actividad registrada de la cuenta, y está COMPLETADA' },
        { label: 'Pendiente', value: 'El seguimiento preventivo que recomendó no tiene fecha' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      'DOS contactos capturados con nombre, cargo, correo y teléfono — más que ninguna otra cuenta auditada',
      'Pago al corriente, 0 incidencias en 19 meses, score_pago 100',
      'El asesor contactó al titular y documentó la situación real por escrito',
      'La infraestructura está puesta: el número rentado y el agente virtual recibiendo tráfico',
    ],
    oportunidades: [
      'Si reactiva, el plan de 400 minutos es el piso de la escalera de producto',
      'Nueve oficinas y un contacto técnico ya identificado',
      'Corregir el importe libera un lugar del TOP 50 para una cuenta que sí opera',
    ],
    debilidades: [
      'Cero minutos consumidos en los 9 cortes disponibles',
      'Cero salientes, cero tickets, score de adopción 4 sobre 100',
      'El importe de la ficha no coincide con ninguna fuente: $38,123 contra $1,078',
      'Las notas de la ficha describen a otra empresa',
      'El estado `en_riesgo` no describe lo que el cliente dice que es',
    ],
    amenazas: [
      'El tiempo del equipo desviado hacia una cuenta que no opera, por un importe 35 veces inflado',
      'Que el 99.70% se lea como falla de atención y genere una conversación que dañe la relación',
      'Que el mes vivo sin cobrar se consolide en churn real por falta de gestión',
    ],
  },

  conclusion: 'Esta auditoría es corta porque no hay una operación que auditar, y decirlo con precisión vale más que estirarla.\n\nGrupo System OOAPAS no está en producción. Lo dice el cliente, lo dicen los nueve cortes con cero minutos, lo dice la ausencia total de salientes y de tickets. Sus tres indicadores alarmantes —99.70% sin contestar, consumo cero y churn en el GRC— describen todos la misma realidad y ninguno es un fallo de servicio: el primero es un agente virtual, el segundo es coherente con no operar y el tercero ya está verificado como mes por cobrar.\n\nLo que sí hay que arreglar es de casa: un importe inflado treinta y cinco veces que la mete en el TOP 50, y unas notas que describen a un grupo de concesionarias Nissan. Las dos cosas se corrigen sin llamar al cliente.',

  pierde: [
    'Si se consolida el mes vivo sin cobrar, Callpicker pierde $1,078 — no los $38,123 que dice la ficha.',
    'Se pierde tiempo del equipo mientras la cuenta figure en el puesto 7 de la cartera.',
    'Se pierde credibilidad si se le llama al cliente a hablar de un 99.70% que ya explicó hace dos semanas.',
  ],

  gana: [
    'Corregir el importe devuelve un lugar del TOP 50 a una cuenta que sí opera.',
    'Un criterio escrito para cuentas en pausa sirve para todas las que estén igual, no sólo para ésta.',
    'Si Ricardo Medina reactiva, la relación está intacta y los canales abiertos.',
  ],

  recomendacion_central: 'No llamar al cliente. Se le contactó el 28 de septiembre, explicó su situación y se acordó seguimiento preventivo: volver ahora con una propuesta contradice lo acordado y gasta el único crédito que hará falta el día que decida reactivar.\n\nLo que hay que hacer es de puertas adentro y son tres cosas. Corregir el importe —$1,078 según el contrato y el GRC, no $38,123—, lo que saca a la cuenta del TOP 50. Borrar de sus notas el texto de GRUPO TORRES CORZO. Y llevar a dirección la pregunta de qué estado le corresponde a una cuenta que el cliente describe como respaldo de información, porque `en_riesgo` no lo describe y el cambio de estado no lo decide el tablero.',
}
