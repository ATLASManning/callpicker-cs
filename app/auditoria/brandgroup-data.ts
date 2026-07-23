import type { AuditoriaCase } from './types'

export const BRANDGROUP: AuditoriaCase = {
  id: 'brandgroup',
  nombre: 'Brand-Kern-Liebers México, S.A. de C.V.',
  sector: 'Manufactura – Automotriz / Metalmecánica',
  fecha_periodo: 'Enero – Julio 2026',
  fecha_auditoria: 'Jul 2026',
  tipo_cliente: 'Grande · Auditoría Forense de Tráfico de Llamadas',
  descripcion_contexto: '185 registros · 79 entrantes · 106 salientes · 7 meses historial completo',
  estado: 'en_riesgo',
  clasificacion: 'CONFIDENCIAL',
  version: '1.0',

  kpis: [
    { label: 'Llamadas totales',    value: '185',    color: '#6366f1' },
    { label: 'Pérdida saliente',    value: '44.3%',  color: '#ef4444' },
    { label: 'Atención entrante',   value: '62%',    color: '#22c55e' },
    { label: 'Min. facturables/mes',value: '~16 min',color: '#f59e0b' },
  ],

  resumen_ejecutivo:
    'Brand-Kern-Liebers México (Brandgroup) es una cuenta activa desde diciembre de 2024, con planta de producción en Querétaro y ventas para Norteamérica, operando bajo el servicio "Visibilidad y Control con llamadas ilimitadas" e integración con Microsoft Teams. Esta auditoría amplía el análisis inicial (abril–julio, 132 registros) al histórico completo de 14/01/2026 – 20/07/2026 — 185 registros de tráfico real (79 entrantes, 106 salientes) — aplicando la regla oficial de facturación Callpicker sobre 7 meses de datos.\n\nEl diagnóstico central se confirma y refina: el plan ilimitado apenas genera 16 minutos facturables al mes, casi la mitad de los intentos salientes no conecta (44.3%), y la comunicación fallida con Alemania deja de ser un hallazgo puntual para convertirse en un patrón de 12 intentos a lo largo de casi 5 meses, con 4 agentes distintos involucrados y 66.7% de pérdida.\n\nEl patrón real no es "caída sostenida" sino algo más irregular: actividad casi nula en enero-febrero, un pico aislado concentrado en un solo agente en marzo (fernando hernandez, 37 salientes), estabilización baja de abril a junio, y caída marcada en julio (dato parcial). El problema real no es "poco tráfico"; es que el canal telefónico dejó de ser el punto de contacto confiable de la operación — una actividad intermitente que sugiere dependencia de personas específicas más que de un proceso institucionalizado.\n\nEl origen explica el estancamiento: la cuenta nació en diciembre de 2024 como un proyecto de intercomunicación entre 4 plantas (México, China, Polonia y Alemania) liderado por la Ing. Zayra Pulido. Cuando ella salió de la empresa sin transferir el mandato, el proyecto quedó reducido a su fracción mínima. El hallazgo de Alemania no es una curiosidad operativa — es el único resto visible de un proyecto de mayor alcance que nunca se completó.',

  resultado_positivo:
    'La cuenta permanece activa y pagando sin incidentes de cobranza desde su inicio. El contacto actual (Fabián Álvarez, IT Supervisor) está disponible y receptivo. La integración Teams está contratada y funcionando — activarla correctamente no requiere nueva inversión del cliente. Existe evidencia concreta de una necesidad de negocio internacional no resuelta (Alemania): 12 intentos en 5 meses con 4 agentes distintos involucrados. Este caso de uso nombrable es el punto de entrada más directo para una conversación de reactivación sin necesidad de vender un producto nuevo.',

  hallazgos: [
    'Subutilización crítica del plan ilimitado: 112 minutos facturables en 187 días (≈16 min/mes). Para una empresa de 5,000–10,000 empleados con planta activa, este volumen es incompatible con un canal telefónico primario.',
    'Tasa de pérdida saliente del 44.3%: 9 números fueron marcados más de una vez tras fallar — hasta 5 intentos al mismo número (4423606499) sin éxito registrado en el periodo. Patrón consistente con fricción en la marcación/enrutamiento, no solo indisponibilidad del destinatario.',
    'Comunicación fallida con Alemania — patrón recurrente, no aislado: 66.7% de pérdida en 12 intentos a lo largo de casi 5 meses (28-Feb a 03-Jul-2026), con 4 agentes distintos. Evidencia de necesidad de negocio internacional estructural sin resolver.',
    'Patrón de actividad intermitente (hallazgo corregido): el reporte inicial describía "caída sostenida". El histórico completo muestra actividad casi nula en enero-febrero, un pico aislado en marzo concentrado en un solo agente, estabilización baja de abril a junio, y caída en julio (dato parcial).',
    'Health Score estancado en 50/100: las cuatro dimensiones reportan exactamente el mismo valor, lo que sugiere calibración pendiente más que medición diferenciada. Validar con el equipo antes de presentarlo como diagnóstico al cliente.',
    'Concentración operativa en dos personas por flujo: giselle martinez atiende el 51% de llamadas entrantes (25 de 49) y karen perez origina el 50% de salientes (53 de 106). Sin evidencia de esquema de respaldo o rotación.',
    '20.3% de llamadas entrantes en autoservicio sin trazabilidad: imposible distinguir cuántas fueron resueltas por el IVR y cuántas fueron abandonos reales — punto ciego de medición.',
  ],

  cronologia: [
    { fecha: '17 dic 2024',    responsable: 'Ing. Zayra Pulido (Kern-Liebers)',   evento: 'Primer contacto. Solicita solución de intercomunicación entre 4 plantas: México, China, Polonia y Alemania. Integración a Microsoft Teams y esquema de marca blanca.', tipo: 'neutral' },
    { fecha: '17 dic 2024',    responsable: 'Kern-Liebers / Callpicker',          evento: 'Cliente declara no usar Teams en ese momento; cotizó con Cisco y competidor adicional. Solicita explorar marca blanca con Callpicker.', tipo: 'neutral' },
    { fecha: '20 dic 2024',    responsable: 'Callpicker (técnico)',               evento: 'Sesión técnica presencial en oficinas de Kern-Liebers, Querétaro, para aterrizar alcance y proyecto.', tipo: 'ok' },
    { fecha: 'Dic 2024',       responsable: 'Administración Callpicker',          evento: 'Cuenta registrada como cliente activo en CRM con alcance ya reducido: "Visibilidad y Control + Automatizaciones / llamadas ilimitadas + integración Teams" — sin marca blanca ni cobertura formal de China o Polonia.', tipo: 'problema' },
    { fecha: '28 ene 2025',    responsable: 'Zayra Pulido + Alois (Alemania)',    evento: 'Demo de 27 minutos. Se muestra enrutamiento de números locales (México, EE.UU., Alemania y China), timbrado simultáneo, grabación/monitoreo y conectividad con operadores globales (Deutsche Telekom, Vodafone).', tipo: 'ok' },
    { fecha: '28 ene 2025',    responsable: 'Zayra Pulido (cliente)',             evento: 'Zayra cuestiona la necesidad de Callpicker dado su "configuración actual de Teams". Indica que priorizan "proyecto BKL" antes de avanzar. El seguimiento queda en suspenso.', tipo: 'problema' },
    { fecha: 'Sin fecha',      responsable: 'Kern-Liebers',                       evento: 'Zayra Pulido sale de Kern-Liebers. El seguimiento del proyecto se pierde — sin evidencia de que alguien retomara el mandato original de intercomunicación de 4 países.', tipo: 'problema' },
    { fecha: '14 ene 2026',    responsable: 'Operación Brandgroup',              evento: 'Primer registro de llamadas del periodo auditado. Inicio de tráfico con 5 salientes y 1 entrante.', tipo: 'neutral' },
    { fecha: 'Mar 2026',       responsable: 'Fernando Hernandez (agente)',        evento: 'Pico aislado: 37 llamadas salientes — casi todas de un solo agente. Causa desconocida; se recomienda preguntar al cliente.', tipo: 'pivote' },
    { fecha: '28 feb – 3 jul 2026', responsable: '4 agentes distintos',          evento: 'Patrón de llamadas a Alemania (+49): 12 intentos, 66.7% de pérdida, incluyendo bloques de 3 intentos consecutivos en un solo día sin conexión.', tipo: 'problema' },
    { fecha: '21 jul 2026',    responsable: 'Claudia Hernández – SAC Callpicker', evento: 'Entrega de auditoría forense de tráfico. Nota "pendiente" en CRM: análisis de comportamiento para establecer plan de retención.', tipo: 'ok' },
  ],

  perfil_campos: [
    { label: 'Razón social',        value: 'Brand-Kern-Liebers México, S.A. de C.V.' },
    { label: 'Cliente desde',       value: 'Diciembre de 2024 (578 días al corte)' },
    { label: 'Servicio contratado', value: 'Visibilidad y Control + Automatizaciones · Llamadas ilimitadas + Integración MS Teams' },
    { label: 'Contacto principal',  value: 'Fabián Álvarez – IT Supervisor · 4681024508' },
    { label: 'Ex-champion interno', value: 'Zayra Pulido – salió de Kern-Liebers sin transferir el mandato del proyecto original' },
    { label: 'Sitio web',           value: 'brand-group.com' },
    { label: 'Dirección',           value: 'Av. El Tepeyac 11080, Parque Industrial O\'Donnell Aeropuerto, El Marqués, Querétaro' },
    { label: 'Tamaño declarado',    value: 'Grande · 5,001–10,000 empleados globales' },
    { label: 'Health Score CRM',    value: '50/100 (Actividad 50 · Adopción 50 · Pago 50 · Relacional 50)' },
    { label: 'Asesor SAC',          value: 'Claudia Hernández – SAC Satisfacción al Cliente' },
  ],

  necesidad_negocio:
    'Brand-Kern-Liebers México es la filial mexicana de un grupo manufacturero global. La necesidad original del proyecto era resolver la intercomunicación entre 4 plantas (México, China, Polonia y Alemania) — con integración a Microsoft Teams, enrutamiento de números locales por país y, potencialmente, un esquema de marca blanca de Callpicker.\n\nEsa necesidad nunca se cubrió: la planta en México opera a nivel mínimo, China y Polonia no tienen llamadas registradas en los 7 meses auditados, y Alemania muestra 12 intentos con 66.7% de pérdida. El contacto actual (Fabián Álvarez) probablemente no tiene contexto del alcance original cotizado por Zayra Pulido.',

  potencial_corto: [
    'Resolución del patrón de Alemania: enrutamiento con reglas de horario para eliminar intentos nocturnos fallidos',
    'Reactivación de integración Teams ya contratada y pagada — sin costo adicional para el cliente',
    'Alertas proactivas de reintentos fallidos: visibilidad operativa en tiempo real (encaja con "Visibilidad y Control" ya contratado)',
  ],

  potencial_largo: [
    'Retomar el proyecto original de intercomunicación entre 4 plantas (México, China, Polonia, Alemania)',
    'Identificar nuevo champion interno con mandato y autoridad en Kern-Liebers',
    'Expansión a marca blanca si existe perfil de decisión para ello',
    'Asistente Virtual / IA como respaldo de agentes concentradores y primer contacto',
  ],

  tacticas: [
    { nombre: 'Inercia organizacional', descripcion: 'Sin champion interno, la cuenta opera en automático a nivel mínimo — nadie presiona por expandirla', impacto: 'Riesgo de churn pasivo: no cancelan, pero no adoptan; el cliente puede no renovar si no percibe valor' },
    { nombre: 'Escudo de Teams', descripcion: 'Zayra cuestionó en enero 2025 la necesidad de Callpicker dado su "configuración actual de Teams" — argumento que puede reaparecer con Fabián Álvarez', impacto: 'Si Fabián percibe Teams como suficiente, la conversación de retención se complica; preparar diferenciadores concretos' },
    { nombre: 'Proyecto BKL', descripcion: 'Zayra mencionó priorizar un "proyecto BKL" interno antes de avanzar. No está documentado qué fue ni si terminó', impacto: 'Podría ser una señal de que la prioridad de Kern-Liebers para telecomunicaciones nunca se formalizó internamente' },
  ],

  senal_alarma: 'Si Fabián Álvarez menciona que "ya tienen Teams" o que "no necesitan ampliar el servicio", es señal de que el riesgo de churn es real. La baja adopción actual puede interpretarse internamente como evidencia de que el servicio no aporta valor. Contrarrestar con los datos concretos de Alemania y el alcance original de 4 países.',

  problema_raiz: 'Pérdida del champion interno (Zayra Pulido) sin transferencia de mandato',

  problema_raiz_detalle:
    'El estancamiento de esta cuenta no se origina en una evaluación negativa de la solución por parte del cliente, sino en la salida de la persona que definió el alcance y lo defendía internamente. Sin un responsable que heredara el mandato original de intercomunicación de 4 países, el proyecto nunca se retomó y sobrevivió únicamente la fracción mínima que ya estaba operando. Es probable que Fabián Álvarez (contacto actual) no tenga contexto completo del alcance cotizado originalmente, lo que explica por qué la cuenta opera en automático sin presión del lado del cliente para expandirla.',

  flujo_real: [
    { fase: '1. Venta (dic-2024)',          area: 'Callpicker Comercial',            accion: 'Proyecto ambicioso: 4 países + marca blanca + Teams', resultado: 'Alcance grande cotizado pero reducido en registro CRM sin documentar la diferencia' },
    { fase: '2. Registro reducido',          area: 'Administración Callpicker',       accion: 'Se activa "Visibilidad y Control + Automatizaciones" sin referencia a los 4 países', resultado: 'El alcance original queda fuera del CRM — no hay forma de rastrearlo sin reconstruir el historial' },
    { fase: '3. Demo sin cierre (ene-2025)', area: 'Callpicker + Zayra + Alois',     accion: 'Demo exitosa técnicamente, pero Zayra prioriza "proyecto BKL"', resultado: 'El seguimiento queda suspendido sin fecha, sin compromisos y sin alternativa interna clara' },
    { fase: '4. Pérdida de champion',        area: 'Kern-Liebers (Zayra Pulido)',     accion: 'Zayra sale de la empresa sin transferir el mandato', resultado: 'El proyecto de 4 países queda huérfano. Fabián Álvarez hereda la operación sin el contexto original' },
    { fase: '5. Modo automático (2026)',     area: 'Fabián Álvarez / agentes',        accion: 'Operación mínima: 185 llamadas en 7 meses, 16 min/mes facturables', resultado: 'El servicio sigue pagado pero sin expansión ni presión de adopción del lado del cliente' },
    { fase: '6. Auditoría (jul-2026)',        area: 'Claudia Hernández – SAC',         accion: 'Análisis forense del tráfico completo ene-jul 2026', resultado: 'Diagnóstico documentado: patrón de Alemania nombrable, causa raíz identificada, ruta de conversación definida' },
  ],

  comparativo: [
    { metrica: 'Alcance cotizado',           real: 'México + China + Polonia + Alemania',       ideal: 'Solo México activo · 0 llamadas a China y Polonia' },
    { metrica: 'Min. facturables/mes',       real: '≈16 min/mes (112 en 7 meses)',              ideal: '500+ min/mes para empresa de ese tamaño' },
    { metrica: 'Tasa de pérdida saliente',   real: '44.3% (47 de 106 no conectaron)',           ideal: '<15% en un canal telefónico primario' },
    { metrica: 'Comunicación con Alemania',  real: '66.7% de pérdida (8 de 12 fallaron)',       ideal: '<20% de pérdida con enrutamiento correcto' },
    { metrica: 'Agentes activos',            real: '2 personas concentran el 50% del tráfico',  ideal: 'Operación distribuida sin single point of failure' },
    { metrica: 'Integración Teams',          real: 'Contratada pero con uso muy bajo',           ideal: 'Activa como canal principal con trazabilidad' },
  ],

  plan_inmediato: [
    { accion: 'Conversación inicial con Fabián Álvarez: determinar si tiene contexto del proyecto original (4 países, Zayra Pulido)', responsable: 'Claudia Hernández – SAC', criterio: 'Documentar en CRM si Fabián conoce o no el alcance original cotizado' },
    { accion: 'Presentar el patrón de Alemania: 12 intentos, 66.7% de pérdida, 4 agentes en 5 meses — preguntar si esa necesidad sigue vigente', responsable: 'Claudia Hernández – SAC', criterio: 'Obtener confirmación de si el contacto con Alemania es una necesidad activa o cerrada' },
    { accion: 'Validar si la baja actividad telefónica se explica por migración real de tráfico a Teams (o por abandono del canal)', responsable: 'Claudia Hernández + Fabián Álvarez', criterio: 'Determinar el canal principal real de comunicación actual de la empresa' },
  ],

  plan_mediano: [
    { accion: 'Proponer enrutamiento internacional con reglas de horario para llamadas a Alemania', responsable: 'Callpicker – Ingeniería / SAC', criterio: 'Eliminar intentos nocturnos fallidos; reducir tasa de pérdida a <20%' },
    { accion: 'Sesión de reactivación de integración Teams ya contratada — mostrar capacidades no usadas', responsable: 'Callpicker – Activaciones', criterio: 'Al menos 1 agente adicional usando Teams activamente para el siguiente mes' },
    { accion: 'Identificar si existe en Kern-Liebers alguien con autoridad para retomar el mandato original de los 4 países', responsable: 'Claudia Hernández + Fabián Álvarez', criterio: 'Nombre y contacto de decisor con contexto del proyecto original o la confirmación de que ese alcance está descartado' },
  ],

  plan_estrategico: [
    { accion: 'Si existe nuevo champion interno: presentar propuesta de retoma del proyecto original (China, Polonia, Alemania)', responsable: 'Callpicker – Comercial + SAC', criterio: 'Propuesta formal entregada con alcance y calendario' },
    { accion: 'Asistente Virtual / IA como respaldo de agentes concentradores (giselle/karen) para llamadas entrantes', responsable: 'Callpicker – Producto', criterio: 'Demo presentada al cliente en sesión formal' },
    { accion: 'Caso de éxito: si se resuelve Alemania y se reactiva Teams, documentar como referencia para sector manufactura global', responsable: 'Callpicker – SAC + Marketing', criterio: 'Caso documentado y validado por el cliente' },
  ],

  areas_oportunidad: [
    { area: 'Enrutamiento internacional con reglas de horario', impacto: 'Resolver 66.7% de pérdida en llamadas a Alemania — caso de uso concreto y nombrable', responsable: 'Ingeniería / SAC' },
    { area: 'Asistente Virtual / IA como primer contacto', impacto: 'Respaldo de agentes concentradores; trazabilidad del 20.3% de llamadas en autoservicio', responsable: 'Producto / SAC' },
    { area: 'Activación real de integración Teams ya contratada', impacto: 'Impacto directo en dimensión Adopción del Health Score sin costo adicional para el cliente', responsable: 'Activaciones' },
    { area: 'Alertas proactivas de reintentos fallidos', impacto: 'Visibilidad operativa en tiempo real — encaja con "Visibilidad y Control" ya contratado', responsable: 'Producto / SAC' },
  ],

  perfiles: [
    {
      nombre: 'Fabián Álvarez',
      rol:    'IT Supervisor – Contacto principal actual',
      color:  '#6366f1',
      campos: [
        { label: 'Cargo',      value: 'IT Supervisor' },
        { label: 'Teléfono',   value: '4681024508' },
        { label: 'Contexto',   value: 'Probablemente sin información del proyecto original de 4 países liderado por Zayra Pulido' },
        { label: 'Perfil',     value: 'Técnico operativo — toma decisiones de TI pero posiblemente no tiene mandato de expansión de infraestructura de comunicaciones' },
        { label: 'Riesgo',     value: 'Puede percibir el servicio como de bajo valor si no conoce el potencial original; riesgo de no renovar' },
      ],
    },
    {
      nombre: 'Zayra Pulido',
      rol:    'Ex Kern-Liebers – Champion original del proyecto',
      color:  '#94a3b8',
      campos: [
        { label: 'Estado',     value: 'Ya no está en la empresa' },
        { label: 'Rol previo', value: 'Definió y defendió internamente el proyecto de intercomunicación de 4 plantas' },
        { label: 'Impacto',    value: 'Su salida sin transferencia de mandato es la causa raíz del estancamiento de la cuenta' },
        { label: 'Pendiente',  value: 'Confirmar qué fue el "proyecto BKL" que mencionó priorizar en enero 2025' },
      ],
    },
    {
      nombre: 'Alois (sin apellido confirmado)',
      rol:    'Participante de demo ene-2025 · Planta Alemania',
      color:  '#f59e0b',
      campos: [
        { label: 'Ubicación',  value: 'Presumiblemente planta en Alemania' },
        { label: 'Contexto',   value: 'Asistió a la demo de enero 2025; habla inglés' },
        { label: 'Relevancia', value: 'Podría ser el destino real de los 12 intentos de llamada a +49 detectados en la sección 8' },
        { label: 'Pendiente',  value: 'Confirmar si sigue en Kern-Liebers y si es el interlocutor detrás de los intentos a Alemania' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      'Cuenta activa sin cancelaciones ni incidentes de cobranza desde diciembre de 2024',
      'Integración Teams contratada y funcionando — capacidades disponibles sin nueva inversión',
      'Contacto directo disponible con Fabián Álvarez (IT Supervisor)',
      'Plan ilimitado sin techo de costo para el cliente — el servicio no encarece si aumenta el uso',
      'Auditoría con datos concretos y nombrable para iniciar conversación de reactivación',
    ],
    oportunidades: [
      'Proyecto original de 4 países (México, China, Polonia, Alemania) nunca completado — potencial de expansión documentado',
      'Caso de uso concreto y urgente: resolver la comunicación con Alemania (66.7% de pérdida en 5 meses)',
      'Activar integración Teams ya pagada → impacto directo en Health Score Adopción sin costo extra',
      'Identificar nuevo champion interno con mandato para retomar el alcance original',
      'Sector manufactura global: caso de éxito replicable si se resuelve la cobertura internacional',
    ],
    debilidades: [
      'Sin champion interno desde la salida de Zayra Pulido — nadie defiende la expansión del servicio',
      'Alcance real operado (~México solamente) es ~25% del proyecto cotizado originalmente',
      'Operación concentrada en 2 personas sin plan de respaldo documentado',
      'Health Score 50/100 con dimensiones sin calibrar — no refleja el riesgo real de churn',
      '20.3% de llamadas entrantes en autoservicio sin trazabilidad de resolución',
    ],
    amenazas: [
      'Churn pasivo: sin necesidad de cancelar activamente, la baja adopción puede llevar a no renovar',
      'Microsoft Teams nativo: si el cliente consolida en Teams, puede percibir a Callpicker como redundante',
      'Sin nuevo champion interno, cualquier propuesta de expansión corre el mismo riesgo que el proyecto original',
      'Patrón de dependencia en personas específicas: si Fabián Álvarez sale, se pierde el único hilo con la cuenta',
      '"Proyecto BKL" mencionado por Zayra podría indicar que Kern-Liebers evaluó soluciones internas alternativas',
    ],
  },

  conclusion:
    'El diagnóstico central no es "poco tráfico" — es que el canal telefónico Callpicker dejó de ser el punto de contacto confiable de la operación cuando el proyecto original perdió a su champion interno. La cuenta sobrevive pagando, pero opera al 5% de su alcance original.\n\nLa oportunidad de recuperación es concreta: hay un caso de uso sin resolver (comunicación con Alemania), una integración ya pagada sin activar (Teams), y un contacto disponible (Fabián Álvarez) que probablemente no conoce el potencial original. Una sola conversación bien preparada puede cambiar la trayectoria de esta cuenta.',

  pierde: [
    'Cuenta con potencial de 4 países que opera al ~5% de su alcance original',
    'Riesgo real de churn pasivo si Fabián Álvarez percibe el servicio como de bajo valor',
    'Oportunidad de ser el proveedor de telecomunicaciones de una empresa de manufactura global con presencia en 4 continentes',
    'Un caso de éxito de integración Teams + enrutamiento internacional en el sector automotriz',
  ],

  gana: [
    'Reactivación del proyecto original de 4 países si se identifica un nuevo champion interno',
    'Resolución del caso de Alemania como quick win que demuestra valor concreto al cliente',
    'Expansión orgánica del Health Score en la dimensión Adopción activando Teams ya contratado',
    'Referencia en sector manufactura global para ventas enterprise',
  ],

  recomendacion_central:
    'Antes de cualquier upsell, resolver el hallazgo de Alemania. Es el único caso de uso con evidencia sólida de necesidad real — 12 intentos, 4 agentes, 5 meses, 66.7% de pérdida. Una sesión de 20–30 minutos con Fabián Álvarez, mostrando la gráfica de Alemania y proponiendo enrutamiento con reglas de horario, es la ruta más corta hacia la reactivación. Primero: preguntar si Fabián conoce el proyecto original de Zayra Pulido — esa respuesta define si la conversación empieza desde cero o desde un contexto compartido.',
}
