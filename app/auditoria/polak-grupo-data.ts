import type { AuditoriaCase } from './types'

export const POLAK_GRUPO: AuditoriaCase = {
  id:                    'polak-grupo',
  nombre:                'Polak Grupo',
  sector:                'Industria Química Industrial / Grupo Empresarial',
  fecha_periodo:         'Enero – Julio 2026',
  fecha_auditoria:       'Jul 2026',
  tipo_cliente:          'Mediana · 501–1,000 empleados · Planta Tlaxcala + oficinas',
  descripcion_contexto:  'Grupo empresarial · CID 74943 · 240 extensiones · Bolsa 45,000 min/mes · Asesora: Fátima',
  estado:                'en_riesgo',
  clasificacion:         'CONFIDENCIAL',
  version:               '1.0',

  kpis: [
    { label: 'Pérdida salientes externas',    value: '48.3%',      color: '#ef4444' },
    { label: 'Pérdida Vigilancia (salientes)', value: '43.3%',     color: '#f97316' },
    { label: 'Uso real de bolsa (promedio)',   value: '19–26%',    color: '#f59e0b' },
    { label: 'Módulos de adopción activos',   value: '0 / 8',     color: '#6366f1' },
  ],

  resumen_ejecutivo:
    'Este análisis procesó 180,923 registros de llamadas de Polak Grupo (95,798 entrantes y 85,125 salientes) correspondientes a 204 días de operación, del 1 de enero al 23 de julio de 2026.\n\n' +
    'El hallazgo estructural más importante reencuadra toda la lectura del informe: el 78.9% de las llamadas entrantes y el 89.0% de las salientes son marcaciones extensión-a-extensión (comunicación interna de planta), no tráfico con clientes o proveedores. ' +
    'El volumen real de interacción con el exterior es de apenas 20,244 llamadas entrantes y 9,351 salientes en 7 meses — el 21.1% y el 11.0% del total.\n\n' +
    'Sobre ese tráfico externo real, la tasa de pérdida es de 20.2% en entrantes y de 48.3% en salientes — casi 1 de cada 2 llamadas que Polak Grupo intenta hacer hacia el exterior no logra conectar.\n\n' +
    'Un segundo hallazgo con implicación de seguridad operativa: las llamadas hacia Vigilancia Tlaxcala muestran 43.3% de pérdida en salientes y 10.1% en entrantes. En una industria química, la falta de respuesta consistente de seguridad ante llamadas internas es un punto que Polak Grupo debe evaluar más allá del ámbito comercial de Callpicker.\n\n' +
    'La bolsa contratada (45,000 min/mes) se usa apenas entre 19.1% y 26.4% en promedio, con entre 56% y 77% de ese consumo correspondiente a tráfico interno. El sistema funciona como columna vertebral de comunicación de planta — no como un centro de contacto tradicional.',

  resultado_positivo:
    'El sistema telefónico sostiene efectivamente una operación industrial continua 24/7 con 240 extensiones activas, incluyendo turnos nocturnos y fines de semana. ' +
    '35.4% de las llamadas entrantes externas se resuelve por autoservicio (IVR) sin intervención humana — evidencia de apertura a automatización. ' +
    'El consumo de la bolsa no excede el plan en ningún mes bajo ningún escenario de tarificación.',

  hallazgos: [
    '78.9% de las llamadas entrantes y 89.0% de las salientes son comunicación interna ext↔ext — el sistema se usa como intercomunicador de planta industrial, no como SAC comercial.',
    'Pérdida salientes externas: 48.3% — casi 1 de cada 2 intentos de contactar a clientes, proveedores o transportistas no conecta.',
    'Pérdida entrantes externas: 20.2% — 1 de cada 5 llamadas de clientes o proveedores no logra contacto. Conmutador de Oficinas (punto de entrada principal): 1,950 llamadas con 32.7% de pérdida.',
    'Riesgo de seguridad operativa: Vigilancia Tlaxcala pierde 43.3% de salientes y 10.1% de entrantes. En industria química, la falta de respuesta de seguridad es un hallazgo crítico de continuidad operativa.',
    'Consumo de bolsa: entre 19.1% y 26.4% del plan de 45,000 min/mes — amplio margen sin agotar. Entre 56% y 77% del consumo estimado es tráfico interno.',
    '0 de 8 módulos de adopción activos en el panel Callpicker — el cliente no tiene visibilidad propia de ninguno de estos patrones de tráfico.',
    '37 llamadas con prefijo internacional no MX/EEUU/Canadá (ej. +34 España) probablemente facturadas fuera de la bolsa contratada — validar con el cliente.',
    '46 registros con números malformados (terminan en múltiples ceros) — pendiente de revisión con equipo técnico Callpicker.',
    'Solo una actividad de seguimiento KAM registrada en el histórico visible (llamada preventiva del 17 de julio).',
    'Top 10 destinos concentra 37.5% del tráfico combinado (289 destinos distintos activos) — operación distribuida, no centralizada.',
  ],

  cronologia: [
    { fecha: 'Feb 2022',    responsable: 'Callpicker',       evento: 'Alta de cuenta — 240 extensiones, bolsa 45,000 min/mes. Contacto y estructura inicial de la cuenta.', tipo: 'ok' },
    { fecha: '2022–2025',  responsable: 'Polak Grupo',       evento: 'Operación continua como central telefónica de planta. Cero módulos de adopción Callpicker registrados en todo el período.', tipo: 'neutral' },
    { fecha: 'Ene–Jun 2026',responsable: 'Plataforma',        evento: '180,923 registros generados. Tasa de pérdida en salientes externas de 48.3% sin acciones correctivas documentadas.', tipo: 'problema' },
    { fecha: '17 Jul 2026', responsable: 'Fátima (KAM)',      evento: 'Llamada preventiva — única actividad de seguimiento KAM registrada en el histórico visible de la cuenta.', tipo: 'pivote' },
    { fecha: '24 Jul 2026', responsable: 'Callpicker / ATLAS',evento: 'Emisión de análisis forense de 180,923 registros. Hallazgo central: uso predominantemente interno y 48.3% pérdida saliente externa. Oportunidad de reposicionamiento consultivo.', tipo: 'ok' },
  ],

  perfil_campos: [
    { label: 'Razón social',         value: 'Polak Grupo' },
    { label: 'CID Zoho',            value: '74943' },
    { label: 'Sector',               value: 'Industria Química Industrial · Grupo empresarial' },
    { label: 'Tamaño',              value: 'Mediana · 501–1,000 empleados · Múltiples sitios (Tlaxcala + oficinas)' },
    { label: 'Cliente desde',        value: 'Febrero 2022' },
    { label: 'Licencia',            value: '240 extensiones · Bolsa 45,000 min/mes' },
    { label: 'Asesora de cuenta',    value: 'Fátima' },
    { label: 'Health Score',        value: '50/100 (todos los componentes en 50)' },
    { label: 'Tickets Zoho Desk',    value: '14 totales · 2 marcados como falla — bajo nivel de incidencias técnicas' },
    { label: 'Adopción módulos',    value: '0 de 8 módulos activos (Chat, API, Pago Auto., IA Voz, IA Chat, Panel Admin…)' },
    { label: 'Perfil operativo',    value: 'Central telefónica de planta industrial 24/7 — uso mayoritariamente interno' },
  ],

  necesidad_negocio:
    'Polak Grupo necesita dos cosas distintas que hoy están mezcladas: (1) comunicación operativa interna confiable entre áreas de planta (vigilancia, supervisión, logística, mantenimiento) — que ya está cubierta, aunque con 38% de pérdida interna; y (2) asegurarse de que las llamadas con clientes, proveedores y transportistas realmente conecten — que hoy falla en 48.3% de los intentos salientes. ' +
    'El cliente no tiene visibilidad de esta distinción porque ningún módulo de adopción está activo.',

  potencial_corto: [
    'Activación guiada del Panel Administrador — puerta de entrada de menor fricción, parte de la adopción esperada de la licencia actual.',
    'Diagnóstico de causa raíz del 48.3% de pérdida en salientes externas: números desactualizados, intentos fuera de horario o errores de marcado.',
    'Revisión de cobertura de Vigilancia Tlaxcala en los horarios de mayor pérdida — mínima inversión, impacto de seguridad operativa inmediato.',
  ],

  potencial_largo: [
    'Piloto de IA de Voz en Conmutador de Oficinas — 35.4% del tráfico externo ya usa autoservicio; el salto a IA conversacional es el siguiente paso natural.',
    'Segmentación de reportes internos vs. externos en el panel del cliente para que Polak Grupo gestione sus dos tipos de tráfico por separado.',
    'Evaluación de dimensionamiento del plan: consumo real 19–26% del plan contratado, con mayoría de uso interno — posible ajuste de bolsa o reasignación hacia soluciones de valor (IA, integración).',
    'Integración API/CRM: grupo empresarial de este tamaño probablemente usa ERP o sistema de compras/logística — registro automático de contactos externos vinculado al CRM.',
  ],

  tacticas: [
    {
      nombre:      'Apertura con el hallazgo estructural',
      descripcion: '"El 82%+ del uso del sistema es comunicación interna de planta — eso no es un problema, es información valiosa que Polak Grupo probablemente no tenía cuantificada." Este reencuadre transforma la conversación de auditoría a consultoría.',
      impacto:     'Alto — posiciona a Callpicker como el único actor con visibilidad de estos datos, base para una relación consultiva de largo plazo.',
    },
    {
      nombre:      'Presentar 48.3% como ancla comercial',
      descripcion: 'La pérdida en salientes externas es concreta, verificable y accionable. Proponer grabación y reportes como primer diagnóstico de causa raíz — bajo costo, alto valor inmediato.',
      impacto:     'Alto — el cliente puede cuantificar los intentos de contacto fallidos con clientes/proveedores por primera vez.',
    },
    {
      nombre:      'Hallazgo de Vigilancia: valor agregado, no acusación',
      descripcion: '"Esto lo detectamos y creemos que les interesa saberlo." El hallazgo tiene peso emocional (seguridad industrial) que puede acelerar la disposición a invertir en sígueme/seguimiento inteligente.',
      impacto:     'Medio-Alto — puede abrir una conversación de urgencia que el canal de telefonía normal no habría generado.',
    },
  ],

  senal_alarma:
    'Health Score en 50/100 sostenido con 0 módulos de adopción activos y una sola actividad KAM registrada en el histórico visible: la cuenta opera de forma completamente autónoma sin relación consultiva. ' +
    'Si Polak Grupo no percibe valor diferenciado, es candidato a cambiar de proveedor o a reducir el plan al mínimo.',

  problema_raiz:        'Nula visibilidad del cliente sobre su propio tráfico — y fricción no detectada con el exterior',
  problema_raiz_detalle:
    'Polak Grupo tiene 0 de 8 módulos de adopción activos. Sin panel propio, el cliente no puede distinguir tráfico interno de externo, ni detectar que casi la mitad de sus intentos de contactar al exterior fallan. ' +
    'El 48.3% de pérdida en salientes externas y el 43.3% en Vigilancia son problemas reales que el cliente no sabía que tenía — lo que los convierte en una oportunidad genuina de valor para Callpicker, no en una crisis a resolver.',

  flujo_real: [
    { fase: 'Uso predominante', area: 'Planta interna (Tlaxcala + edificios)', accion: 'Personal marca entre extensiones para coordinación de turnos, vigilancia, logística y supervisión', resultado: '78–89% del tráfico total · 38% de pérdida interna (aceptable para operación de planta)' },
    { fase: 'Contacto externo saliente', area: 'Clientes / proveedores / transportistas', accion: 'Personal de Polak marca a números externos de 10 dígitos', resultado: '48.3% de pérdida — casi 1 de cada 2 intentos no conecta' },
    { fase: 'Contacto externo entrante', area: 'Conmutador de Oficinas (punto de entrada principal)', accion: 'Cliente o proveedor llama al número de Polak', resultado: '20.2% de pérdida global · Conmutador de Oficinas: 32.7% de pérdida en 1,950 llamadas' },
    { fase: 'Vigilancia Tlaxcala', area: 'Seguridad patrimonial e industrial', accion: 'Personal interno intenta comunicarse con Vigilancia', resultado: '43.3% de pérdida en salientes — punto ciego de seguridad operativa' },
    { fase: 'Autoservicio (IVR)', area: 'Llamadas entrantes externas', accion: 'Llamada externa se resuelve sin agente humano', resultado: '35.4% del tráfico externo entrante — base demostrada para IA de Voz' },
  ],

  comparativo: [
    { metrica: 'Pérdida salientes externas',       real: '48.3%',                            ideal: '< 20%' },
    { metrica: 'Pérdida entrantes externas',       real: '20.2% (Conmutador: 32.7%)',        ideal: '< 10%' },
    { metrica: 'Pérdida Vigilancia (salientes)',   real: '43.3%',                            ideal: '< 5% (función crítica de seguridad)' },
    { metrica: 'Módulos de adopción activos',     real: '0 de 8',                           ideal: '5+ módulos activos (benchmark cuenta madura)' },
    { metrica: 'Uso de bolsa 45,000 min/mes',     real: '19.1%–26.4% promedio estimado',    ideal: 'Alineado al uso real — posible redimensionamiento' },
    { metrica: 'Actividad KAM registrada',        real: '1 actividad en historial visible',  ideal: 'Revisión trimestral documentada' },
    { metrica: 'Seguimiento Health Score',        real: '50/100 sostenido sin plan de acción', ideal: '> 65/100 con acciones documentadas' },
  ],

  plan_inmediato: [
    { accion: 'Agendar sesión ejecutiva con el interlocutor de Polak Grupo para presentar los hallazgos antes del próximo ciclo de facturación', responsable: 'Fátima (KAM)', criterio: 'Sesión agendada en los próximos 10 días' },
    { accion: 'Diagnóstico de causa raíz del 48.3% de pérdida en salientes externas: ¿números desactualizados, intentos fuera de horario, o errores de marcado?', responsable: 'Fátima + cliente', criterio: 'Hipótesis principal identificada y comunicada al cliente' },
    { accion: 'Revisión de cobertura de Vigilancia Tlaxcala en horarios de mayor pérdida — presentarlo como hallazgo de continuidad operativa, no de telefonía', responsable: 'Fátima (KAM)', criterio: 'Polak Grupo confirma si tiene protocolo de respaldo cuando Vigilancia no contesta' },
    { accion: 'Confirmar con el cliente si las 37 llamadas con prefijo internacional (+34, etc.) están siendo facturadas fuera de la bolsa', responsable: 'Equipo técnico Callpicker + Fátima', criterio: 'Clarificación enviada al cliente' },
  ],

  plan_mediano: [
    { accion: 'Activación guiada del Panel Administrador — sesión de capacitación con el responsable interno de Polak Grupo', responsable: 'Fátima + equipo técnico Callpicker', criterio: 'Al menos 1 usuario activo en panel administrador y 3 módulos con revisión registrada' },
    { accion: 'Piloto de IA de Voz en Conmutador de Oficinas para reducir pérdida entrante externa (hoy 20.2%)', responsable: 'Equipo comercial + técnico Callpicker', criterio: 'Propuesta formal presentada y evaluada por el cliente' },
    { accion: 'Segmentación de reportes internos vs. externos en el panel del cliente', responsable: 'Equipo técnico Callpicker', criterio: 'Dashboard diferenciado disponible para Polak Grupo' },
  ],

  plan_estrategico: [
    { accion: 'Evaluación conjunta del dimensionamiento del plan (240 extensiones / 45,000 min) vs. uso real observado', responsable: 'Fátima + Dirección Callpicker', criterio: 'Propuesta de ajuste o reasignación de presupuesto presentada en Q4 2026' },
    { accion: 'Integración API/CRM para registro automático de contactos externos vinculado al sistema de compras/logística del cliente', responsable: 'Equipo técnico + Comercial', criterio: 'Diagnóstico de sistema ERP actual del cliente completado' },
    { accion: 'Programa trimestral de seguimiento KAM con revisión de Health Score documentada', responsable: 'Fátima', criterio: 'Health Score > 65/100 en 6 meses' },
  ],

  areas_oportunidad: [
    { area: 'Panel Administrador (activación)',    impacto: 'Alto — habilita al cliente para ver y gestionar sus propios datos; puerta de entrada a todas las demás soluciones', responsable: 'Fátima + técnico' },
    { area: 'IA de Voz — Conmutador de Oficinas', impacto: 'Alto — 35.4% ya usa autoservicio; el caso de uso está validado sin necesidad de hipótesis', responsable: 'Comercial + técnico' },
    { area: 'Sígueme / Seguimiento inteligente — Vigilancia', impacto: 'Medio-Alto — 43.3% de pérdida en función crítica de seguridad industrial', responsable: 'Técnico + Fátima' },
    { area: 'Grabación y reportes',               impacto: 'Medio — diagnóstico de causa raíz del 48.3% de pérdida en salientes externas', responsable: 'Técnico' },
    { area: 'Revisión de plan / redimensionamiento', impacto: 'Estratégico — consumo real 19–26% del plan contratado; espacio para reasignar a soluciones de valor', responsable: 'Fátima + Dirección' },
    { area: 'Integración API/CRM',               impacto: 'Medio — grupo empresarial con ERP probable; registro automático de contactos externos', responsable: 'Técnico + comercial' },
  ],

  perfiles: [
    {
      nombre: 'Interlocutor Polak Grupo',
      rol:    'Contacto principal (por identificar / confirmar)',
      color:  '#2563eb',
      campos: [
        { label: 'Status',             value: 'No especificado en el análisis — confirmar con Fátima antes de la sesión ejecutiva' },
        { label: 'Relevancia',         value: 'Receptor del análisis y de la propuesta de Panel Administrador + IA de Voz' },
        { label: 'Pregunta clave',     value: '¿Quién en Polak Grupo usaría el Panel Administrador de forma regular?' },
      ],
    },
    {
      nombre: 'Fátima',
      rol:    'Asesora de cuenta Callpicker',
      color:  '#7c3aed',
      campos: [
        { label: 'Actividad KAM',      value: '1 actividad registrada en historial visible (llamada preventiva 17-jul-2026)' },
        { label: 'Acción inmediata',   value: 'Agendar sesión ejecutiva con Polak Grupo para presentar los hallazgos antes del próximo ciclo de facturación' },
        { label: 'Ángulo de entrada', value: 'Abrir con el hallazgo estructural (82% uso interno) — reencuadra la conversación de auditoría a consultoría' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      'Cobertura de 240 extensiones activas 24/7 — el sistema sostiene efectivamente una operación industrial continua.',
      'Consumo de bolsa dentro del plan en el 100% de los meses analizados (19–26% de uso estimado, sin sobreconsumo).',
      'Apertura ya demostrada a IVR/autoservicio: 35.4% de las llamadas entrantes externas se resuelven sin agente humano.',
      'Bajo nivel de incidencias técnicas reales (2 fallas de 14 tickets Zoho Desk).',
      'Operación estable mes a mes — volumen externo entrante entre 2,400 y 3,600 llamadas/mes sin deterioro claro.',
    ],
    oportunidades: [
      'Entre 56% y 77% del consumo de minutos estimado es tráfico interno: espacio para revisar el plan o migrar ese tráfico a canal más eficiente.',
      'IVR existente como base para escalar hacia IA de Voz en el Conmutador de Oficinas.',
      'Seis módulos de adopción sin activar: oportunidad de reforzar valor percibido de la licencia actual antes de vender más.',
      'Health Score de 50/100 con margen amplio de mejora mediante seguimiento KAM más frecuente.',
      'El análisis forense es en sí mismo la oportunidad: el cliente no tenía visibilidad de estos datos, lo que posiciona a Callpicker como partner estratégico.',
    ],
    debilidades: [
      'Tasa de pérdida en salientes externas de 48.3% — casi 1 de cada 2 intentos de contacto con clientes o proveedores falla.',
      'Cero módulos de adopción activos: el cliente no tiene instrumentación propia sobre su tráfico.',
      'Conmutador de Oficinas (probable puerta de entrada comercial) con 32.7% de pérdida en llamadas entrantes.',
      'Solo 1 actividad de seguimiento KAM registrada en el historial visible — relación predominantemente reactiva.',
      'Sin distinción operativa interna/externa en el panel del cliente, la cuenta es inauditable sin apoyo externo.',
    ],
    amenazas: [
      'Riesgo de continuidad/seguridad: 43.3% de pérdida en llamadas hacia Vigilancia en una planta de industria química.',
      'Si la tasa de pérdida externa no se corrige, cada mes se pierden decenas de intentos de contacto con clientes o proveedores sin que Polak Grupo lo sepa.',
      'Health Score en 50/100 sostenido sin plan de acción documentado incrementa el riesgo de percepción de bajo valor.',
      'Alta dependencia de comunicación telefónica interna sin respaldo identificado en los datos.',
      'Si el cliente percibe el plan como sobredimensionado (19–26% de uso) sin propuesta de valor diferenciada, puede optar por reducir o cancelar.',
    ],
  },

  conclusion:
    'Polak Grupo es una cuenta donde el sistema Callpicker funciona — sostiene la operación continua de una planta industrial con 240 extensiones activas las 24 horas los 7 días de la semana. ' +
    'Pero esa fortaleza coexiste con una debilidad no detectada: casi la mitad de los intentos de contactar al exterior fallan, y el cliente no lo sabe porque tiene 0 módulos de adopción activos.\n\n' +
    'La oportunidad para Callpicker no está en vender más capacidad — el plan de 45,000 min/mes está usado apenas al 19–26%. ' +
    'Está en ayudar a Polak Grupo a ver y gestionar por separado su tráfico interno y externo, resolver los puntos de fricción documentados (salientes externas, Conmutador de Oficinas, Vigilancia), y construir una relación consultiva que hoy prácticamente no existe.',

  pierde: [
    '~4,516 contactos salientes externos fallidos en 7 meses — clientes, proveedores y transportistas que no recibieron llamada.',
    'Confianza del cliente si el bajo uso de bolsa se interpreta como señal de que el plan está sobredimensionado y nadie de Callpicker lo detectó.',
    'Oportunidades de upsell (IA de Voz, integración, reportes) que no se han propuesto formalmente en 4+ años de relación.',
  ],

  gana: [
    'Credibilidad como partner estratégico al presentar un análisis que el cliente no podía generar por sí mismo.',
    'Apertura genuina para proponer Panel Administrador + IA de Voz como soluciones inmediatas con ROI demostrable.',
    'Conversación ejecutiva de alto impacto: el hallazgo de Vigilancia tiene peso emocional (seguridad industrial) que trasciende la telefonía.',
    'Base de datos para institucionalizar revisiones trimestrales de Health Score y blindar la cuenta frente a churn.',
  ],

  recomendacion_central:
    'Abrir la sesión ejecutiva con el hallazgo estructural ("el 82% del uso es interno — eso no es un problema, es información que no tenían") y anclar la conversación en el 48.3% de pérdida en salientes externas como el punto de mayor prioridad comercial. ' +
    'La primera solución a proponer es el Panel Administrador — menor fricción, incluida en la licencia actual, y habilita al cliente para ver por sí mismo todos los demás hallazgos en el futuro.',
}
