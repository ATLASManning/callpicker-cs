import type { AuditoriaCase } from './types'

/**
 * Polak Grupo — auditoría v2.0 (9 sep 2026).
 *
 * Actualización sobre la v1.0 (ene–jul 2026) por un evento crítico: el 9 de
 * septiembre el cliente remitió SOLICITUD FORMAL DE BAJA y portabilidad de
 * todas sus líneas, con reunión de retención agendada para el 10-sep a las
 * 9:00 a.m.
 *
 * DOS DECISIONES DE FIDELIDAD AL DOCUMENTO, tomadas a propósito:
 *
 *  1. Se conservan las etiquetas [VERIFICADO] / [HIPÓTESIS] / [VACÍO] tal como
 *     vienen en el original. El documento insiste en no inferir más allá de las
 *     fuentes, y el motivo real de la baja es literalmente un VACÍO. Quitar las
 *     etiquetas convertiría suposiciones en hechos.
 *
 *  2. NO se elige una cifra de tickets sobre otra. Tres fuentes internas dicen
 *     cosas distintas (20/4, 14/2, y un extracto reciente con 4 incidentes en 5
 *     semanas) y el propio documento ordena presentarlas como no reconciliadas.
 *     Por eso el perfil dice las tres, en vez del "14 totales · 2 fallas" que
 *     traía la v1.0.
 *
 * El estado se mantiene en `en_riesgo` y no pasa a `rescatable`: ese estado se
 * pinta VERDE en el tablero y rebajaría visualmente una solicitud de baja ya
 * recibida. `en_riesgo` es el primero del orden de urgencia.
 */
export const POLAK_GRUPO: AuditoriaCase = {
  id:                    'polak-grupo',
  asesor:                'Fátima',
  nombre:                'Polak Grupo',
  sector:                'Industria Química Industrial / Grupo Empresarial',
  fecha_periodo:         'Base ene–jul 2026 · Actualización sep 2026',
  fecha_auditoria:       'Sep 2026',
  tipo_cliente:          'Mediana · 501–1,000 empleados · Planta Tlaxcala + oficinas',
  descripcion_contexto:  'SOLICITUD FORMAL DE BAJA RECIBIDA (9-sep-2026) · Reunión de retención 10-sep, 9:00 a.m. · CID 74943 · 240 extensiones · Bolsa 45,000 min/mes · Asesora: Fátima',
  estado:                'en_riesgo',
  clasificacion:         'CONFIDENCIAL',
  version:               '2.0',

  kpis: [
    { label: 'Pérdida salientes externas (base ene–jul)',   value: '48.3%',   color: '#ef4444' },
    { label: 'Pérdida Vigilancia — salientes (ene–jul)',    value: '43.3%',   color: '#f97316' },
    { label: 'Uso real de bolsa (base ene–jul)',            value: '19–26%',  color: '#f59e0b' },
    { label: 'Módulos activos — cifra con discrepancia *',  value: '0 / 8',   color: '#6366f1' },
    { label: 'Incidentes técnicos 5-ago a 1-sep',           value: '4',       color: '#dc2626' },
  ],

  resumen_ejecutivo:
    'ESTADO: CRÍTICO — SOLICITUD FORMAL DE BAJA RECIBIDA. Correo del 9-sep-2026 · Reunión de retención agendada para el 10-sep-2026 a las 9:00 a.m. (ventana menor a 24 horas al cierre de este documento).\n\n' +
    'El 9 de septiembre de 2026, Polak Grupo remitió una solicitud formal de baja del servicio y de portabilidad de todas sus líneas (Oficinas México, Almacén y Planta Tlaxcala). ' +
    'La solicitud no llegó de forma aislada: la auditoría v1.0 (enero–julio 2026) había anticipado textualmente este escenario como amenaza — "si el cliente percibe el plan como sobredimensionado sin propuesta de valor diferenciada, puede optar por reducir o cancelar" — y como debilidad de fondo — "solo 1 actividad de seguimiento KAM registrada en el historial visible". ' +
    'Ambas condiciones seguían presentes al momento de la solicitud de baja, sin evidencia documentada de que el plan de acción propuesto en julio (activación del Panel Administrador, diagnóstico de la pérdida saliente externa, revisión de Vigilancia) se haya ejecutado.\n\n' +
    'Esta actualización incorpora tres hechos nuevos que cambian la lectura de la cuenta: (1) la solicitud de baja proviene de un contacto no mapeado previamente — Gustavo Martínez Gutiérrez, Coordinador de Soporte Técnico —, lo que confirma que el mapa de decisores seguía incompleto; ' +
    '(2) un extracto reciente de tickets muestra cuatro incidentes técnicos de conectividad entre el 5 de agosto y el 1 de septiembre que no están reflejados en los conteos totales reportados en las dos versiones previas del expediente; ' +
    'y (3) existe una reunión de retención agendada para el 10 de septiembre a las 9:00 a.m., con menos de 24 horas de margen y sin que se conozca el motivo declarado por el cliente ni el margen de negociación autorizado.\n\n' +
    'Postura de este documento: se actualiza el expediente completo bajo el mismo formato (hallazgos, comportamiento, problema raíz, FODA, perfiles, plan), pero se marcan explícitamente los datos que no pudieron reconciliarse entre fuentes. ' +
    'No se elige arbitrariamente una cifra de tickets sobre otra — se documentan las tres versiones y se deja como acción inmediata su reconciliación antes de usar cualquier número frente al cliente.\n\n' +
    'NOTA METODOLÓGICA — DISCREPANCIAS DE DATOS NO RESUELTAS. Tres fuentes internas reportan cifras distintas para los mismos indicadores; ninguna se descarta sin confirmación:\n' +
    '· Ficha CRM (Zoho, vista de cuenta): 20 tickets · 4 fallas · 0 de 6 módulos · último ticket 19-ago-2026.\n' +
    '· Auditoría forense v1.0 (FODA / Perfil de Cliente): 14 tickets · 2 fallas · 0 de 8 módulos · corte 23-jul-2026.\n' +
    '· Extracto reciente (10 registros más recientes): no es el total, es una muestra — 4 incidentes técnicos solo entre 5-ago y 1-sep, hasta 9-sep-2026.\n\n' +
    'Lectura: el extracto más reciente por sí solo ya contiene tantas fallas técnicas (4) en cinco semanas como el doble de las reportadas en total (2) por la auditoría v1.0 sobre siete meses. ' +
    'Esto es una señal de alarma independientemente de cuál de los dos totales (14 o 20) sea el correcto: el ritmo de incidencias recientes parece haberse acelerado frente al periodo base.\n\n' +
    '* La ficha CRM original registra "0/6 módulos"; los documentos de auditoría y el perfil ampliado registran "0/8 módulos". No reconciliado.',

  resultado_positivo:
    'Aun con la solicitud de baja sobre la mesa, la cuenta conserva fortalezas reales que sostienen el argumento de retención: el sistema cubre 240 extensiones activas 24/7 y sostiene efectivamente la operación de planta. ' +
    'El consumo de bolsa se mantuvo dentro del plan en el 100% de los meses analizados. ' +
    'El 35.4% de las llamadas entrantes externas se resuelve por autoservicio (IVR) sin agente humano. ' +
    'Y la respuesta operativa ante los incidentes técnicos recientes fue relativamente rápida (mismo día o días siguientes, según el detalle de tickets).\n\n' +
    'La reunión del 10-sep, aunque motivada por una baja, es la primera interacción ejecutiva directa en meses: es una ventana real para presentar hallazgos que el cliente nunca tuvo.',

  hallazgos: [
    /* ── Base heredada de la v1.0, sin cambios ─────────────────────────── */
    'BASE v1.0 · 78.9% de las llamadas entrantes y 89.0% de las salientes son comunicación interna ext↔ext — el sistema se usa como intercomunicador de planta industrial, no como SAC comercial.',
    'BASE v1.0 · Pérdida salientes externas: 48.3% — casi 1 de cada 2 intentos de contactar a clientes, proveedores o transportistas no conecta.',
    'BASE v1.0 · Pérdida entrantes externas: 20.2% — 1 de cada 5 llamadas de clientes o proveedores no logra contacto. Conmutador de Oficinas: 1,950 llamadas con 32.7% de pérdida.',
    'BASE v1.0 · Riesgo de seguridad operativa: Vigilancia Tlaxcala pierde 43.3% de salientes y 10.1% de entrantes.',
    'BASE v1.0 · Consumo de bolsa: entre 19.1% y 26.4% del plan de 45,000 min/mes. Entre 56% y 77% del consumo estimado es tráfico interno.',
    'BASE v1.0 · 0 de 8 módulos de adopción activos en el panel Callpicker (cifra de auditoría; la ficha CRM reporta 0 de 6 — ver Nota Metodológica).',
    'BASE v1.0 · 37 llamadas con prefijo internacional no MX/EEUU/Canadá probablemente facturadas fuera de la bolsa contratada — pendiente de validar con el cliente.',
    'BASE v1.0 · 46 registros con números malformados — pendiente de revisión técnica.',
    'BASE v1.0 · Solo una actividad de seguimiento KAM registrada en el histórico visible al corte de julio.',
    'BASE v1.0 · Top 10 destinos concentra 37.5% del tráfico combinado (289 destinos distintos activos).',

    /* ── Nuevos, actualización 9-sep-2026 ──────────────────────────────── */
    'NUEVO 9-sep · Solicitud formal de baja y portabilidad recibida vía correo, firmada por Gustavo Martínez Gutiérrez, Coordinador de Soporte Técnico de Polak Grupo — un contacto no mapeado previamente en la auditoría (los contactos registrados eran Luis Ángel Diego Acosta y Mario Bibbins). [VERIFICADO]',
    'NUEVO 9-sep · La solicitud confirma, en los hechos, el escenario que la propia auditoría v1.0 había señalado como amenaza ("candidato a cambiar de proveedor o reducir el plan" si no percibía valor diferenciado). [VERIFICADO]',
    'NUEVO 9-sep · Persiste una discrepancia de tickets/fallas no reconciliada entre tres fuentes (20/4, 14/2, y un extracto reciente con 4 incidentes solo en 5 semanas). No se debe presentar ninguna de estas cifras como definitiva ante el cliente. [VACÍO]',
    'NUEVO 9-sep · El extracto más reciente de tickets muestra 4 incidentes técnicos de conectividad/audio entre el 5-ago y el 1-sep (#112462, #113481, #113879, #114378) — un ritmo que contrasta con la narrativa de "bajo nivel de incidencias técnicas" de la auditoría v1.0. Es plausible que esta recurrencia haya influido en la decisión de baja, pero el cliente no lo declaró explícitamente en el correo. [HIPÓTESIS]',
    'NUEVO 9-sep · Hallazgo colateral de seguridad de la información: el ticket #112752 documenta que credenciales de acceso se compartieron por correo en texto plano. No está vinculado de forma comprobada a la baja, pero es una práctica de riesgo que debe corregirse independientemente del desenlace comercial. [VERIFICADO]',
    'NUEVO 9-sep · El contenido de la llamada de 79 segundos entre Fátima y Gustavo (ticket #114955) no está documentado más allá de duración y que fue contestada. Se desconoce el motivo declarado de la baja. [VACÍO]',
    'NUEVO 9-sep · Reunión de retención agendada para el 10-sep-2026 a las 9:00 a.m. (ticket #114944), con menos de 24 horas de margen al momento de este documento. No hay evidencia de que se haya definido o autorizado un margen de negociación (descuento, ajuste de plan, migración de módulos) para esa reunión. [VACÍO]',
  ],

  cronologia: [
    { fecha: 'Feb 2022',        responsable: 'Callpicker',                 evento: 'Alta de cuenta — 240 extensiones, bolsa 45,000 min/mes.', tipo: 'ok' },
    { fecha: '2022–2025',       responsable: 'Polak Grupo',                evento: 'Operación continua como central telefónica de planta. Cero módulos de adopción activados.', tipo: 'neutral' },
    { fecha: 'Ene–Jun 2026',    responsable: 'Plataforma',                 evento: '180,923 registros generados. Pérdida saliente externa de 48.3% sin acciones correctivas documentadas.', tipo: 'problema' },
    { fecha: '17 Jul 2026',     responsable: 'Fátima (KAM)',               evento: 'Llamada preventiva — única actividad de seguimiento KAM registrada en el histórico visible al corte de julio.', tipo: 'pivote' },
    { fecha: '24 Jul 2026',     responsable: 'Callpicker / ATLAS',         evento: 'Emisión de auditoría forense v1.0. Hallazgo central: uso predominantemente interno y 48.3% de pérdida saliente externa.', tipo: 'ok' },
    { fecha: '05 Ago 2026',     responsable: 'Ticket #112462',             evento: 'Extensiones físicas 26xx de Tlaxcala cortaban llamadas — intermitencia de servidor SIP. Cliente confirmó estabilidad tras corrección.', tipo: 'problema' },
    { fecha: '10 Ago 2026',     responsable: 'Ticket #112752',             evento: 'Solicitud de acceso a extensión 601; credenciales compartidas por correo en texto plano (riesgo de seguridad de la información).', tipo: 'problema' },
    { fecha: '19 Ago 2026',     responsable: 'Ticket #113481',             evento: 'Llamadas cortadas entre extensiones 2617 y 2618. Cliente confirmó solución tras reinicio/ajuste de equipos.', tipo: 'problema' },
    { fecha: '25 Ago 2026',     responsable: 'Ticket #113879',             evento: 'Audio entrecortado y llamadas sin timbrar en extensiones 2109 y 2105. Revisión sin anomalías concluyentes.', tipo: 'problema' },
    { fecha: '01 Sep 2026',     responsable: 'Ticket #114378',             evento: 'Falla general de comunicación; intermitencia ~10:54–11:05 con recuperación posterior.', tipo: 'problema' },
    { fecha: '09 Sep 2026, mañana', responsable: 'Gustavo Martínez Gutiérrez', evento: 'Correo formal solicitando procedimiento de baja y portabilidad de líneas (Oficinas México, Almacén, Planta Tlaxcala).', tipo: 'problema' },
    { fecha: '09 Sep 2026',     responsable: 'Ticket #114954',             evento: 'Primer intento de llamada de Fátima a Gustavo Martínez — no contestada.', tipo: 'neutral' },
    { fecha: '09 Sep 2026',     responsable: 'Ticket #114955',             evento: 'Segundo intento — contestada, ~79 segundos. Contenido no documentado en el sistema.', tipo: 'pivote' },
    { fecha: '09 Sep 2026',     responsable: 'Ticket #114944',             evento: 'Reunión de retención agendada para el 10-sep-2026, 9:00 a.m.', tipo: 'pivote' },
  ],

  perfil_campos: [
    { label: 'Razón social',         value: 'Polak Grupo' },
    { label: 'CID Zoho',            value: '74943' },
    { label: 'Sector',               value: 'Industria Química Industrial · Grupo empresarial' },
    { label: 'Tamaño',              value: 'Mediana · 501–1,000 empleados · Múltiples sitios (Tlaxcala + oficinas)' },
    { label: 'Cliente desde',        value: 'Febrero 2022' },
    { label: 'Licencia',            value: '240 extensiones · Bolsa 45,000 min/mes' },
    { label: 'Asesora de cuenta',    value: 'Fátima' },
    { label: 'ESTADO AL 9-SEP-2026', value: 'CRÍTICO — solicitud formal de baja y portabilidad recibida. Reunión de retención el 10-sep, 9:00 a.m.' },
    { label: 'Contacto del evento',  value: 'Gustavo Martínez Gutiérrez — Coordinador de Soporte Técnico (contacto NO mapeado en la auditoría previa)' },
    { label: 'Health Score',        value: '50/100 (todos los componentes en 50)' },
    { label: 'Tickets Zoho Desk',    value: 'NO RECONCILIADO — Ficha CRM: 20 tickets / 4 fallas · Auditoría v1.0: 14 / 2 · Extracto reciente: 4 incidentes solo entre 5-ago y 1-sep. Ninguna cifra debe presentarse como definitiva al cliente.' },
    { label: 'Adopción módulos',    value: '0 activos. Discrepancia: la ficha CRM dice 0 de 6; la auditoría y el perfil ampliado dicen 0 de 8. No reconciliado.' },
    { label: 'Perfil operativo',    value: 'Central telefónica de planta industrial 24/7 — uso mayoritariamente interno' },
  ],

  necesidad_negocio:
    'Al 9 de septiembre la necesidad inmediata dejó de ser comercial y pasó a ser de retención: entender por qué Polak Grupo pidió la baja, algo que hoy NO se sabe — el contenido de la llamada de 79 segundos con Gustavo Martínez no quedó documentado. [VACÍO]\n\n' +
    'Debajo de ese evento siguen vivas las dos necesidades que identificó la v1.0 y que nunca se atendieron: (1) comunicación operativa interna confiable entre áreas de planta (vigilancia, supervisión, logística, mantenimiento), y (2) asegurarse de que las llamadas con clientes, proveedores y transportistas realmente conecten — que falla en 48.3% de los intentos salientes. ' +
    'El cliente nunca tuvo visibilidad de esta distinción porque ningún módulo de adopción está activo. Esa ceguera es, probablemente, parte de por qué el plan se percibe como sobredimensionado.',

  potencial_corto: [
    'Reconstruir el motivo real de la baja en la reunión del 10-sep — hoy es el dato más importante que falta y sin él no hay estrategia de retención posible.',
    'Presentar los hallazgos de la v1.0 que el cliente nunca recibió: el 82%+ de uso interno y el 48.3% de pérdida saliente externa son valor que ya se produjo y no se entregó.',
    'Diagnóstico técnico de fondo de los 4 incidentes recientes (5-ago a 1-sep) — validar si comparten causa común en la infraestructura SIP de Tlaxcala.',
    'Corregir el hallazgo de seguridad del ticket #112752: prohibir el envío de credenciales por correo en texto plano, con independencia del desenlace comercial.',
  ],

  potencial_largo: [
    'CONDICIONADO A RETENCIÓN — Activación guiada del Panel Administrador.',
    'CONDICIONADO A RETENCIÓN — Piloto de IA de Voz en Conmutador de Oficinas: 35.4% del tráfico externo ya usa autoservicio.',
    'CONDICIONADO A RETENCIÓN — Segmentación de reportes internos vs. externos en el panel del cliente.',
    'CONDICIONADO A RETENCIÓN — Revisión de dimensionamiento del plan (consumo real 19–26%).',
    'CONDICIONADO A RETENCIÓN — Programa trimestral de seguimiento KAM con Health Score documentado.',
  ],

  tacticas: [
    {
      nombre:      'Escuchar antes de argumentar',
      descripcion: 'El motivo declarado de la baja es un VACÍO. Entrar a la reunión del 10-sep con una defensa preparada sobre una causa supuesta es el mayor riesgo táctico: si la razón real es otra, se pierde la única ventana ejecutiva disponible. La primera parte de la reunión debe destinarse a que el cliente diga por qué.',
      impacto:     'Crítico — determina si el resto de la conversación es pertinente o irrelevante.',
    },
    {
      nombre:      'Abrir con el hallazgo estructural, no con la defensa',
      descripcion: 'Presentar el uso interno (82%+) y el 48.3% de pérdida saliente externa como evidencia de valor no aprovechado, no como argumento reactivo contra la baja. Es información que el cliente no podía generar por sí mismo y que nunca recibió.',
      impacto:     'Alto — cambia el marco de "proveedor que retiene" a "socio que ve lo que el cliente no ve".',
    },
    {
      nombre:      'No citar cifras de tickets sin reconciliar',
      descripcion: 'Tres fuentes internas dan números distintos (20/4, 14/2, extracto reciente). Presentar una cifra que el propio historial del cliente pueda contradecir destruiría la credibilidad en la reunión. Mientras no se reconcilie, hablar de "nuestro registro más reciente", nunca de una cifra cerrada.',
      impacto:     'Alto en sentido defensivo — evita un error que anularía el resto del argumento.',
    },
    {
      nombre:      'Margen de negociación decidido ANTES, no en la sala',
      descripcion: 'No hay evidencia de que exista un margen autorizado (descuento, ajuste de plan, migración de módulos). Improvisarlo en la reunión produce o una concesión excesiva o una negativa que cierra la puerta.',
      impacto:     'Alto — sin esto, la reunión puede quemarse sin posibilidad de una segunda oportunidad.',
    },
  ],

  senal_alarma:
    'AMENAZA MATERIALIZADA. La auditoría v1.0 escribió en julio: "si el cliente percibe el plan como sobredimensionado sin propuesta de valor diferenciada, puede optar por reducir o cancelar". El 9 de septiembre eso dejó de ser una amenaza y se convirtió en una solicitud formal de baja.\n\n' +
    'Entre el 17-jul y el 9-sep no hay seguimiento KAM adicional registrado: siete semanas sin contacto documentado antes de que llegara la solicitud. Y el plan de acción propuesto en julio no tiene evidencia de haberse ejecutado. ' +
    'La pregunta abierta para Fátima es directa: ¿hubo alguna acción entre esas fechas que no quedó registrada? Si la respuesta es no, el problema raíz no es solo técnico — es de ejecución del plan de cuentas.',

  problema_raiz:        'Nula visibilidad del cliente sobre su propio tráfico — y fricción no detectada con el exterior (vigente y NO corregido)',
  problema_raiz_detalle:
    'El problema raíz identificado en julio (0 de 8 módulos activos, sin panel propio, sin capacidad del cliente para distinguir tráfico interno de externo) sigue vigente al 9 de septiembre. ' +
    'No existe evidencia documentada de que el plan de acción propuesto en la auditoría v1.0 — activación guiada del Panel Administrador, diagnóstico de causa raíz de la pérdida saliente externa, revisión de cobertura de Vigilancia — se haya ejecutado en las siete semanas transcurridas entre la entrega del análisis y la solicitud de baja.\n\n' +
    'A ese problema estructural se suma un segundo factor aparecido en el periodo: cuatro incidentes técnicos de conectividad y audio entre el 5-ago y el 1-sep. Es plausible que esa recurrencia haya erosionado la confianza técnica en paralelo a la percepción de sobredimensionamiento comercial, pero el cliente no lo declaró. [HIPÓTESIS]\n\n' +
    'Pregunta abierta para Fátima: ¿hubo alguna acción de seguimiento entre el 17-jul y el 9-sep que no quedó registrada en el sistema?',

  flujo_real: [
    { fase: 'Uso predominante', area: 'Planta interna (Tlaxcala + edificios)', accion: 'Personal marca entre extensiones para coordinación de turnos, vigilancia, logística y supervisión', resultado: '78–89% del tráfico total · 38% de pérdida interna (aceptable para operación de planta)' },
    { fase: 'Contacto externo saliente', area: 'Clientes / proveedores / transportistas', accion: 'Personal de Polak marca a números externos de 10 dígitos', resultado: '48.3% de pérdida — casi 1 de cada 2 intentos no conecta' },
    { fase: 'Contacto externo entrante', area: 'Conmutador de Oficinas (punto de entrada principal)', accion: 'Cliente o proveedor llama al número de Polak', resultado: '20.2% de pérdida global · Conmutador de Oficinas: 32.7% de pérdida en 1,950 llamadas' },
    { fase: 'Vigilancia Tlaxcala', area: 'Seguridad patrimonial e industrial', accion: 'Personal interno intenta comunicarse con Vigilancia', resultado: '43.3% de pérdida en salientes — punto ciego de seguridad operativa' },
    { fase: 'Autoservicio (IVR)', area: 'Llamadas entrantes externas', accion: 'Llamada externa se resuelve sin agente humano', resultado: '35.4% del tráfico externo entrante — base demostrada para IA de Voz' },
    { fase: 'Incidencias técnicas 5-ago a 1-sep', area: 'Extensiones Tlaxcala y oficinas', accion: 'Cliente reporta cortes, audio entrecortado y falla general de comunicación', resultado: '4 tickets técnicos en 5 semanas (#112462, #113481, #113879, #114378) — ritmo superior al del periodo base' },
    { fase: 'Solicitud de baja', area: 'Coordinación de Soporte Técnico del cliente', accion: 'Gustavo Martínez Gutiérrez envía correo formal de baja y portabilidad de todas las líneas', resultado: 'Reunión de retención el 10-sep 9:00 a.m. · motivo declarado desconocido [VACÍO]' },
  ],

  comparativo: [
    { metrica: 'Pérdida salientes externas',       real: '48.3%',                            ideal: '< 20%' },
    { metrica: 'Pérdida entrantes externas',       real: '20.2% (Conmutador: 32.7%)',        ideal: '< 10%' },
    { metrica: 'Pérdida Vigilancia (salientes)',   real: '43.3%',                            ideal: '< 5% (función crítica de seguridad)' },
    { metrica: 'Módulos de adopción activos',     real: '0 (de 6 según CRM / de 8 según auditoría — sin reconciliar)', ideal: '5+ módulos activos (benchmark cuenta madura)' },
    { metrica: 'Uso de bolsa 45,000 min/mes',     real: '19.1%–26.4% promedio estimado',    ideal: 'Alineado al uso real — posible redimensionamiento' },
    { metrica: 'Actividad KAM registrada',        real: '1 actividad al corte de julio · 0 entre 17-jul y 9-sep', ideal: 'Revisión trimestral documentada' },
    { metrica: 'Incidentes técnicos',             real: '4 en 5 semanas (5-ago a 1-sep)',   ideal: 'Sin recurrencia; causa raíz identificada' },
    { metrica: 'Ejecución del plan de la v1.0',   real: 'Sin evidencia de ejecución en 7 semanas', ideal: 'Acciones cerradas con evidencia antes del siguiente corte' },
    { metrica: 'Mapa de decisores',               real: 'Incompleto — 4º contacto aparece con la baja', ideal: 'Decisor económico y técnico identificados y vigentes' },
  ],

  plan_inmediato: [
    { accion: 'ANTES DE LA REUNIÓN (< 24 h) · Confirmar con Fátima el contenido declarado por Gustavo en la llamada de 79 s (ticket #114955)', responsable: 'Fátima', criterio: 'Motivo de baja documentado, aunque sea de forma preliminar' },
    { accion: 'ANTES DE LA REUNIÓN (< 24 h) · Definir y autorizar internamente el margen de negociación disponible (ajuste de plan, descuento, migración de módulos) antes de entrar a la reunión', responsable: 'Dirección Callpicker + Fátima', criterio: 'Margen de negociación explícito, no improvisado en la reunión' },
    { accion: 'ANTES DE LA REUNIÓN (< 24 h) · Solicitar al equipo técnico un extracto fresco y completo de Zoho Desk para reconciliar tickets/fallas antes de citar cualquier cifra al cliente', responsable: 'Equipo técnico Callpicker', criterio: 'Una sola cifra verificada de tickets y fallas' },
    { accion: 'ANTES DE LA REUNIÓN (< 24 h) · Preparar apertura de la reunión con el hallazgo estructural (uso interno + 48.3% de pérdida saliente externa) como evidencia de valor no aprovechado, no como defensa reactiva', responsable: 'Fátima', criterio: 'Guion breve de apertura validado antes de la reunión' },
  ],

  plan_mediano: [
    { accion: 'SI LA CUENTA SE RETIENE · Diagnóstico de causa raíz del 48.3% de pérdida en salientes externas', responsable: 'Fátima + equipo técnico', criterio: 'Hipótesis principal identificada y comunicada al cliente' },
    { accion: 'SI LA CUENTA SE RETIENE · Diagnóstico técnico de fondo de los 4 incidentes recientes (5-ago a 1-sep) — validar si comparten causa común en la infraestructura SIP de Tlaxcala', responsable: 'Equipo técnico Callpicker', criterio: 'Causa raíz confirmada o descartada, con evidencia' },
    { accion: 'INDEPENDIENTE DEL DESENLACE · Corrección del hallazgo de seguridad: prohibir el envío de credenciales por correo en texto plano (ticket #112752)', responsable: 'Equipo técnico Callpicker', criterio: 'Procedimiento corregido y comunicado' },
    { accion: 'SI LA CUENTA SE RETIENE · Actualizar el mapa de decisores incluyendo a Gustavo Martínez y confirmando vigencia de Luis Ángel Diego Acosta y Mario Bibbins', responsable: 'Fátima', criterio: 'Mapa de decisores completo y verificado en la ficha' },
  ],

  plan_estrategico: [
    { accion: 'CONDICIONADO A RETENCIÓN · Activación guiada del Panel Administrador', responsable: 'Fátima + equipo técnico Callpicker', criterio: 'Al menos 1 usuario activo en panel administrador' },
    { accion: 'CONDICIONADO A RETENCIÓN · Piloto de IA de Voz en Conmutador de Oficinas', responsable: 'Equipo comercial + técnico Callpicker', criterio: 'Propuesta formal presentada y evaluada por el cliente' },
    { accion: 'CONDICIONADO A RETENCIÓN · Segmentación de reportes internos vs. externos en el panel del cliente', responsable: 'Equipo técnico Callpicker', criterio: 'Dashboard diferenciado disponible para Polak Grupo' },
    { accion: 'CONDICIONADO A RETENCIÓN · Revisión de dimensionamiento del plan (consumo real 19–26%)', responsable: 'Fátima + Dirección Callpicker', criterio: 'Propuesta de ajuste o reasignación presentada' },
    { accion: 'CONDICIONADO A RETENCIÓN · Programa trimestral de seguimiento KAM con Health Score documentado', responsable: 'Fátima', criterio: 'Revisión trimestral con evidencia registrada' },
  ],

  areas_oportunidad: [
    { area: 'Reunión de retención 10-sep, 9:00 a.m.', impacto: 'CRÍTICO — primera interacción ejecutiva directa en meses; ventana real para presentar hallazgos que el cliente no tenía', responsable: 'Fátima + Dirección' },
    { area: 'Reconciliación de datos internos',      impacto: 'Alto — sin una cifra única de tickets/fallas, cualquier número usado frente al cliente puede ser contradicho por su propio historial', responsable: 'Equipo técnico' },
    { area: 'Causa raíz de los 4 incidentes SIP',    impacto: 'Alto — si se resuelve de fondo, se convierte en argumento de mejora demostrable', responsable: 'Técnico' },
    { area: 'Seguridad: credenciales en texto plano', impacto: 'Alto — riesgo que trasciende la relación comercial; debe corregirse aunque la cuenta se pierda', responsable: 'Técnico' },
    { area: 'Módulos sin activar (6 a 8)',           impacto: 'Medio-Alto — siguen siendo palanca de valor si la cuenta se retiene', responsable: 'Fátima + técnico' },
    { area: 'Hallazgo de Vigilancia (43.3%)',        impacto: 'Medio-Alto — si la baja se concreta, se pierde también la posibilidad de corregirlo', responsable: 'Técnico + Fátima' },
  ],

  perfiles: [
    {
      nombre: 'Gustavo Martínez Gutiérrez',
      rol:    'Coordinador de Soporte Técnico, Polak Grupo — CONTACTO NUEVO',
      color:  '#dc2626',
      campos: [
        { label: 'Rol en el evento',   value: 'Autor del correo de solicitud de baja y portabilidad (9-sep-2026)' },
        { label: 'Contacto',           value: 'gustavo.martinez@polakgrupo.com · +52 5519460500 ext. 2705 · +52 55 4455 9974' },
        { label: 'Relevancia',         value: 'Su aparición confirma que el mapa de decisores seguía incompleto — la auditoría ya advertía en julio que "un solo contacto conocido en la cuenta" era un riesgo, y ahora aparece un cuarto contacto no previsto' },
        { label: 'Pregunta sin responder', value: '¿Gustavo decide la baja o transmite una decisión tomada por Dirección/Compras? No hay evidencia todavía. [VACÍO]' },
      ],
    },
    {
      nombre: 'Fátima',
      rol:    'Asesora de cuenta Callpicker (KAM)',
      color:  '#7c3aed',
      campos: [
        { label: 'Actividad al corte de julio', value: '1 llamada preventiva registrada (17-jul-2026)' },
        { label: 'Actividad del 9-sep-2026',    value: 'Dos intentos de llamada a Gustavo Martínez (uno sin respuesta, uno contestado ~79 s); reunión de retención agendada para el 10-sep, 9:00 a.m.' },
        { label: 'Brecha operativa',            value: 'Entre el 17-jul y el 9-sep no hay seguimiento KAM adicional registrado — siete semanas sin contacto documentado antes de que llegara la solicitud de baja' },
      ],
    },
    {
      nombre: 'Luis Ángel Diego Acosta / Mario Bibbins',
      rol:    'Interlocutores previos registrados en la ficha',
      color:  '#64748b',
      campos: [
        { label: 'Situación',       value: 'Contactos originalmente registrados en la ficha de la cuenta. No participan en el evento de baja según la evidencia disponible' },
        { label: 'Pregunta abierta', value: '¿Siguen activos en Polak Grupo? Si ya no, eso explicaría parte de la pérdida de relación consultiva. [VACÍO]' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      'Cobertura de 240 extensiones activas 24/7 — el sistema sostiene efectivamente la operación de planta.',
      'Consumo de bolsa dentro del plan en el 100% de los meses analizados.',
      '35.4% de las llamadas entrantes externas se resuelven por autoservicio (IVR) sin agente humano.',
      'Respuesta operativa relativamente rápida ante los incidentes técnicos recientes (mismo día o días siguientes, según el detalle de tickets).',
    ],
    oportunidades: [
      'La reunión del 10-sep, aunque motivada por una baja, es la primera interacción ejecutiva directa en meses — ventana real para presentar hallazgos que el cliente no tenía.',
      'Seis a ocho módulos sin activar siguen siendo palanca de valor si la cuenta se retiene.',
      'El patrón de incidentes técnicos recientes, si se resuelve de raíz (posible causa: infraestructura SIP en Tlaxcala), puede convertirse en argumento de mejora demostrable.',
    ],
    debilidades: [
      'Cero módulos de adopción activos siete semanas después de la auditoría — el plan de acción de julio no se ejecutó de forma verificable.',
      'Mapa de decisores incompleto: cuarto contacto (Gustavo) aparece sin que existiera relación previa con él.',
      'Discrepancia de datos internos (tickets/fallas/módulos) no reconciliada — reduce la credibilidad de cualquier cifra que se use frente al cliente.',
      'Siete semanas sin seguimiento KAM documentado entre el 17-jul y el 9-sep.',
    ],
    amenazas: [
      '🔴 MATERIALIZADA (9-sep-2026): "Si el cliente percibe el plan como sobredimensionado sin propuesta de valor diferenciada, puede optar por reducir o cancelar" — la auditoría v1.0 lo anticipó como amenaza; hoy es un hecho consumado en forma de solicitud de baja.',
      'Riesgo de continuidad/seguridad no resuelto: 43.3% de pérdida en llamadas hacia Vigilancia en una planta de industria química.',
      'Si la baja se concreta, se pierde también la posibilidad de corregir el hallazgo de Vigilancia y el de credenciales en texto plano — riesgos que trascienden la relación comercial.',
      'El ritmo reciente de incidentes técnicos (4 en 5 semanas) puede estar erosionando la confianza técnica del cliente en paralelo a la percepción de sobredimensionamiento comercial.',
    ],
  },

  conclusion:
    'Polak Grupo pidió la baja el 9 de septiembre, y la auditoría de julio ya había escrito que esto podía pasar. Esa es la conclusión incómoda de este expediente: la amenaza estaba identificada por nombre, el plan de acción estaba propuesto, y siete semanas después no hay evidencia de que se ejecutara ninguna de sus acciones ni de que hubiera un solo contacto KAM registrado.\n\n' +
    'Lo que este documento NO puede afirmar es por qué se fue el cliente. El motivo declarado es un VACÍO: la única conversación con Gustavo Martínez duró 79 segundos y su contenido no se documentó. La recurrencia de incidentes técnicos (4 entre el 5-ago y el 1-sep) es una hipótesis razonable, no un hecho confirmado por el cliente.\n\n' +
    'Por eso este expediente debe usarse para PREPARAR la reunión del 10-sep, no como reporte final de la cuenta. Después de la reunión debe actualizarse a v2.1 con el motivo real declarado por el cliente, el resultado de la negociación y la cifra reconciliada de tickets.\n\n' +
    'LIMITACIONES DECLARADAS — no inferir más allá de lo que dicen las fuentes:\n' +
    '· No se cuenta con el contenido de la llamada de 79 segundos entre Fátima y Gustavo Martínez — el motivo real de la baja es VACÍO.\n' +
    '· No se cuenta con confirmación de si Gustavo Martínez tiene autoridad de decisión o transmite una instrucción superior — VACÍO.\n' +
    '· No se cuenta con el total reconciliado de tickets/fallas de la cuenta — persisten tres cifras distintas (20/4, 14/2, y un extracto parcial reciente).\n' +
    '· No se cuenta con confirmación de que exista un margen de negociación autorizado (descuento, ajuste de plan) para la reunión del 10-sep.\n' +
    '· El vínculo entre los incidentes técnicos recientes y la decisión de baja es una HIPÓTESIS razonable, no un hecho confirmado por el cliente.\n\n' +
    'FUENTES UTILIZADAS: ficha de cuenta CRM (Zoho, vista en vivo); auditoría forense v1.0 (ene–jul 2026); perfil de cliente ampliado; correo de Gustavo Martínez Gutiérrez del 9-sep-2026; extracto de los 10 tickets más recientes de Zoho Desk al 9-sep-2026.',

  pierde: [
    'La cuenta completa si la baja se concreta: 240 extensiones, bolsa de 45,000 min/mes y una relación de más de cuatro años desde febrero de 2022.',
    'La posibilidad de corregir el hallazgo de Vigilancia (43.3% de pérdida en salientes) en una planta de industria química — un riesgo de continuidad que trasciende lo comercial.',
    'La posibilidad de corregir el hallazgo de credenciales compartidas por correo en texto plano (ticket #112752).',
    '~4,516 contactos salientes externos fallidos en 7 meses que nunca se diagnosticaron — clientes, proveedores y transportistas que no recibieron llamada.',
    'La credibilidad del ciclo de auditoría: se anticipó la amenaza por escrito y no se actuó sobre ella en siete semanas.',
  ],

  gana: [
    'Una ventana ejecutiva real: la reunión del 10-sep es la primera interacción directa en meses, con la atención del cliente garantizada.',
    'Un análisis que el cliente no podía generar por sí mismo y que todavía no ha recibido — el 82%+ de uso interno y el 48.3% de pérdida saliente externa siguen siendo valor sin entregar.',
    'Una lección de proceso aplicable a toda la cartera: una amenaza documentada sin plan ejecutado y sin seguimiento KAM termina en baja. Es exactamente el patrón que el ritual SAC existe para evitar.',
    'Si se retiene: una cuenta con seis a ocho módulos sin activar y margen amplio de valor por construir.',
  ],

  recomendacion_central:
    'Entrar a la reunión del 10-sep a escuchar, no a defender. El motivo real de la baja es hoy un VACÍO, y preparar una defensa sobre una causa supuesta es el mayor riesgo de la reunión: si la razón es otra, se quema la única ventana ejecutiva disponible.\n\n' +
    'Antes de entrar hay que tener resueltas tres cosas: el contenido de la llamada de 79 segundos con Gustavo, un margen de negociación autorizado por Dirección, y una cifra de tickets reconciliada — o el compromiso explícito de no citar ninguna. ' +
    'Ya en la sala, abrir con el hallazgo estructural (uso interno + 48.3% de pérdida saliente externa) como evidencia de valor que existía y no se entregó, no como argumento reactivo contra la baja.\n\n' +
    'Y con independencia del desenlace comercial, corregir el hallazgo de credenciales en texto plano y documentar el riesgo de Vigilancia: son riesgos del cliente, no argumentos de venta.',
}
