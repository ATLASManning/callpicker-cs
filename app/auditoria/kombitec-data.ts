import type { AuditoriaCase } from './types'

export const KOMBITEC: AuditoriaCase = {
  id:                   'kombitec',
  nombre:               'KOMBITEC S.A. DE C.V.',
  sector:               'Distribución Industrial',
  fecha_periodo:        'Enero – Julio 2026',
  fecha_auditoria:      'Jul 2026',
  tipo_cliente:         'Enterprise',
  descripcion_contexto: 'Distribuidor de equipo de control y automatización industrial · San Luis Potosí · 6 años como cliente Callpicker',
  estado:               'en_riesgo',
  clasificacion:        'CONFIDENCIAL',
  version:              '1.0',
  asesor:               'Dan',

  // ── KPIs ───────────────────────────────────────────────────────────────────
  kpis: [
    { label: 'MRR en riesgo',       value: '$8,659 MXN',    color: '#ef4444' },
    { label: 'Solicitud de baja',   value: 'Ticket #112044',color: '#dc2626' },
    { label: 'Excedente minutos',   value: '104% promedio', color: '#f97316' },
    { label: 'Health Score',        value: '70 / Pago 100%',color: '#22c55e' },
  ],

  // ── Resumen ─────────────────────────────────────────────────────────────────
  resumen_ejecutivo: 'Kombitec es distribuidor de equipo de control y automatización industrial (San Luis Potosí), cliente Callpicker desde junio de 2020 — plan Visibilidad y Control, 5,000 minutos compartidos entre 11 extensiones, MRR $8,659. El 31 de julio de 2026 solicitó la baja del servicio (ticket #112044), citando el límite de 5 extensiones simultáneas y percepción de deterioro en tiempo de respuesta. Se analizaron 18,750 eventos entrantes y 13,300 eventos salientes; de estos últimos, 2,761 son llamadas salientes reales a número externo. La lectura general: no tiene un problema de relación (antigüedad, pago) sino un problema de dimensionamiento y de calidad de enrutamiento, con evidencia dura en 5 de las 9 dimensiones críticas evaluadas.',

  resultado_positivo: 'Antigüedad de 6 años, pago 100% al corriente y Health Score 70. Mejora sostenida en pérdida entrante de enero a marzo (23.7%→8.7%). Tiempos de atención eficientes una vez conectado (AHT 2.7 min entrante / 4.4 min saliente). Solicitud de baja parcialmente fundamentada en datos — también revela oportunidades claras de venta consultiva.',

  hallazgos: [
    'Utilización de minutos: 104% promedio, pico 111.4% en junio — 5 de 7 meses en excedente de la bolsa de 5,000 minutos.',
    '11 extensiones contratadas vs. 68 destinos activos: la operación real es 6 veces mayor a la capacidad contratada.',
    'Pérdida en llamadas salientes: 42% promedio (rango 33.6%–50.4%) sostenido sin excepción en los 7 meses.',
    'Alta concentración saliente: 2 de 48 agentes generan el 57% del volumen total saliente.',
    'Variabilidad crítica de servicio por extensión: rango de 9% a 53% de pérdida entre ring groups.',
    'Pérdida entrante: 13.3% promedio; mínimo 8.7% en marzo, repunte a 17.0% en julio coincidente con la solicitud de baja.',
    'IVR inconsistente: uso entre 11.6% y 31.3% mensual, sin tendencia de adopción — absorbe picos de forma reactiva, no por diseño.',
    '64 días con reintentos múltiples sin conexión; 173 números con 2+ llamadas perdidas — fricción directa para los clientes de Kombitec.',
    '0% de adopción de canales digitales (IA de voz, chat, panel admin) registrada en CRM.',
  ],

  // ── Cronología ──────────────────────────────────────────────────────────────
  cronologia: [
    { fecha: 'Jun 2020',    responsable: 'Callpicker',    evento: 'Alta como cliente — plan Visibilidad y Control, 5,000 min, 11 extensiones, MRR $8,659.',             tipo: 'ok'      },
    { fecha: 'Ene 2026',    responsable: 'Análisis',      evento: 'Inicio del periodo analizado. Pérdida entrante en 23.7% — punto más alto del periodo.',                tipo: 'problema'},
    { fecha: 'Mar 2026',    responsable: 'Kombitec',      evento: 'Mínimo de pérdida entrante: 8.7%. Mejor mes de servicio entrante en el periodo.',                      tipo: 'ok'      },
    { fecha: 'Jun 2026',    responsable: 'Sistema',       evento: 'Pico de excedente de minutos: 111.4%. Pico de uso IVR: 31.3%. Máxima presión sobre la bolsa.',        tipo: 'problema'},
    { fecha: 'Jul 2026',    responsable: 'Kombitec',      evento: 'Mayor actividad saliente (516 llamadas). Repunte de pérdida entrante a 17.0%.',                        tipo: 'problema'},
    { fecha: '31 Jul 2026', responsable: 'Kombitec',      evento: 'Solicitud formal de baja del servicio — Ticket #112044. Razones declaradas: límite extensiones y tiempo de respuesta.', tipo: 'problema'},
  ],

  // ── Perfil ──────────────────────────────────────────────────────────────────
  perfil_campos: [
    { label: 'Razón social',       value: 'KOMBITEC S.A. DE C.V.' },
    { label: 'Sector',             value: 'Distribución de equipo de control y automatización industrial' },
    { label: 'Ubicación',          value: 'San Luis Potosí, México' },
    { label: 'Plan contratado',    value: 'Visibilidad y Control — 5,000 minutos · 11 extensiones' },
    { label: 'MRR',                value: '$8,659 MXN' },
    { label: 'Antigüedad',         value: '6 años (desde junio 2020)' },
    { label: 'CID Zoho',           value: '42184' },
    { label: 'Pago',               value: '100% al corriente' },
    { label: 'Health Score',       value: '70' },
  ],

  necesidad_negocio: 'Canal de voz como columna vertebral de soporte técnico, cotización y cobranza. Operación mixta: dominante entrante (8,313 llamadas en 7 meses) + activa saliente real (2,761 llamadas, seguimiento comercial o cobranza). Horario de oficina L-V 8:00–18:30; sin actividad relevante en fin de semana.',

  potencial_corto: [
    'Upgrade de plan a ~5,200-5,600 min/mes — argumento objetivo: 5 de 7 meses en excedente.',
    'Dimensionamiento a 68 extensiones activas reales vs. 11 contratadas.',
    'Redistribución de ring groups con peor nivel de servicio (Nelly 53%, Raquel 50%, Brenda 38.9%).',
  ],

  potencial_largo: [
    'Piloto Asistente Virtual de IA para triage en franjas 9h y 15h — mayor concentración de pérdida.',
    'Cola de marcación saliente para distribuir carga entre los 48 agentes.',
    'Dashboard de calidad compartido con dirección de Kombitec (detalle por extensión).',
    'Categorización de motivo de llamada (requiere grabaciones o transcripciones para dimensionar ROI).',
  ],

  tacticas: [
    {
      nombre:      'Argumento de excedente de minutos',
      descripcion: 'Verificar en facturación si el excedente de los 5 meses se cobró; presentar 104% promedio / pico 111.4% como justificación de upgrade, no como reclamo.',
      impacto:     'Cierre de upgrade de plan con argumento de datos objetivos ya documentados.',
    },
    {
      nombre:      'Redistribución de ring groups',
      descripcion: 'Identificar con Kombitec la carga de Nelly (53%), Raquel Loredo (50%) y Brenda Santana (38.9%) y redistribuir o dar respaldo — mejora de bajo costo y alto impacto inmediato.',
      impacto:     'Reducción de pérdida entrante por extensión de 53% a < 15% sin cambio de plan.',
    },
    {
      nombre:      'Piloto Asistente Virtual de IA (acotado)',
      descripcion: 'Proponer piloto en 2 franjas horarias (9h y 15h) y 3 ring groups críticos — bajo riesgo, alta probabilidad de impacto visible antes de pedir compromiso de upgrade completo.',
      impacto:     'Reducción de pérdida en horarios pico + argumento de valor diferencial frente a la competencia.',
    },
  ],

  senal_alarma: 'Solicitud formal de baja activa (Ticket #112044) presentada el 31 de julio. 64 días con reintentos múltiples sin conexión evidencian fricción directa para los clientes finales de Kombitec — posible pérdida de negocio para ellos, lo que amplifica el riesgo de cancelación. Repunte de pérdida entrante a 17.0% en julio coincide exactamente con la solicitud.',

  // ── Problema Raíz ───────────────────────────────────────────────────────────
  problema_raiz: 'Plan de 5,000 minutos y 11 extensiones desbordado por una operación real de 68 destinos activos — la solicitud de baja tiene base parcial en datos, pero el motivo declarado (límite de extensiones) oculta dos problemas más graves: excedente de minutos recurrente y variabilidad de servicio interna del 9% al 53% entre ring groups.',

  problema_raiz_detalle: 'Tres brechas simultáneas: (1) capacidad de minutos insuficiente — 5 de 7 meses en excedente, pico 111.4%; (2) extensiones contratadas vs. destinos activos — 11 vs. 68, ratio de 1:6; (3) distribución de carga desequilibrada — variabilidad de 9% a 53% entre ring groups que el cliente probablemente siente pero no sabe nombrar. La pérdida saliente del 42% promedio tiene causa raíz no identificable desde el CDR; requiere revisión técnica de troncal/ruteo.',

  flujo_real: [
    { fase: '1', area: 'Entrante',  accion: 'Llamada llega al IVR',             resultado: 'IVR absorbe entre 11.6% y 31.3% de llamadas — sin diseño consistente, reactivo a picos.' },
    { fase: '2', area: 'Enrutamiento', accion: 'Distribución a ring groups',    resultado: 'Alta variabilidad: 9% pérdida (mejor extensión) vs. 53% (Nelly) — mismo plan, resultados opuestos.' },
    { fase: '3', area: 'Saliente',  accion: 'Marcación a número externo',       resultado: '42% de pérdida promedio sostenida; 2 agentes generan 57% del volumen — concentración crítica.' },
    { fase: '4', area: 'Capacidad', accion: 'Consumo mensual de minutos',       resultado: '5 de 7 meses exceden la bolsa de 5,000 min; pico 111.4% en junio — excedente probablemente no comunicado.' },
  ],

  comparativo: [
    { metrica: 'Minutos mensuales',          real: '104% de bolsa (pico 111.4%)',        ideal: '≤ 90% con margen operativo' },
    { metrica: 'Extensiones vs. operación',  real: '11 contratadas / 68 activas',        ideal: 'Dimensionado a demanda real' },
    { metrica: 'Pérdida en salientes',       real: '42% promedio (33.6%–50.4%)',         ideal: '< 15%' },
    { metrica: 'Pérdida en entrantes',       real: '13.3% prom. (repunte 17.0% jul)',    ideal: '< 8%' },
    { metrica: 'Variabilidad por extensión', real: '9%–53% entre ring groups',           ideal: '< 10% de variabilidad' },
    { metrica: 'Adopción canales digitales', real: '0% registrada en CRM',               ideal: 'IVR + piloto IA activos' },
  ],

  // ── Plan de Acción ───────────────────────────────────────────────────────────
  plan_inmediato: [
    { accion: 'Verificar en facturación si el excedente de minutos de los 5 meses identificados se cobró correctamente.',                      responsable: 'Dan / Facturación', criterio: 'Cifra confirmada antes de la sesión con el cliente.' },
    { accion: 'Confirmar con producto si el límite de 5 extensiones simultáneas es ajustable y en qué condiciones.',                           responsable: 'Dan / Producto',    criterio: 'Respuesta técnica antes de la sesión del lunes.' },
    { accion: 'Preparar la cifra de excedente (104% promedio, pico 111.4% en junio) como argumento de upgrade — presentar como solución, no como cobro.', responsable: 'Dan',     criterio: 'Presentación lista antes de la sesión.' },
  ],

  plan_mediano: [
    { accion: 'Proponer plan dimensionado a ~5,200-5,600 min/mes y a los 68 destinos activos reales.',                       responsable: 'Dan',          criterio: 'Propuesta entregada en 2 semanas.' },
    { accion: 'Redistribuir o reforzar ring groups con peor nivel de servicio: Nelly (53%), Raquel Loredo (50%), Brenda Santana (38.9%).', responsable: 'Dan / Técnico', criterio: 'Configuración ajustada en < 15 días.' },
    { accion: 'Lanzar piloto de Asistente Virtual de IA para triage en franjas 9h y 15h.',                                    responsable: 'Dan / Producto', criterio: 'Piloto activo en 30 días.' },
  ],

  plan_estrategico: [
    { accion: 'Implementar cola de marcación saliente para distribuir carga entre los 48 agentes y reducir dependencia de 2.',  responsable: 'Producto / Dan', criterio: 'Reducción de pérdida saliente a < 20% en 90 días.' },
    { accion: 'Dashboard de calidad compartido con dirección de Kombitec — incluir detalle de pérdida por extensión y consumo de minutos.', responsable: 'Dan', criterio: 'Dashboard entregado en 60 días.' },
    { accion: 'Categorización de motivo de llamada (muestra de escucha o datos Zoho Desk) para dimensionar ROI de IA correctamente.', responsable: 'Producto / Dan', criterio: 'Informe de categorización en 90 días.' },
  ],

  areas_oportunidad: [
    { area: 'Upgrade de plan — minutos + extensiones', impacto: 'Resolución del motivo declarado de baja; argumento de datos objetivo ya documentado.',                       responsable: 'Dan'           },
    { area: 'Redistribución de ring groups',           impacto: 'Reducción de pérdida de 53% a < 15% sin cambio de plan — mejora de bajo costo y alto impacto inmediato.',   responsable: 'Técnico / Dan' },
    { area: 'Piloto Asistente Virtual de IA',          impacto: 'Triage en horarios pico (9h y 15h); valor diferencial frente a la competencia con riesgo acotado.',         responsable: 'Producto / Dan'},
    { area: 'Cola de marcación saliente',              impacto: 'Reduce dependencia de 2 agentes clave y distribuye carga entre los 48 disponibles.',                         responsable: 'Producto'      },
  ],

  // ── Perfiles ────────────────────────────────────────────────────────────────
  perfiles: [
    {
      nombre: 'Dan Domínguez',
      rol:    'Asesor Callpicker — cuenta asignada',
      color:  '#1B3FCC',
      campos: [
        { label: 'Rol',       value: 'Account Manager' },
        { label: 'Prioridad', value: 'Retención + upgrade antes de la sesión del lunes' },
        { label: 'Acción',    value: 'Verificar excedente, confirmar límite extensiones, preparar propuesta' },
      ],
    },
    {
      nombre: 'Ring Group — Nelly',
      rol:    'Extensión con mayor tasa de pérdida entrante',
      color:  '#ef4444',
      campos: [
        { label: 'Pérdida',          value: '53% de llamadas no atendidas' },
        { label: 'Benchmark cuenta', value: '13.3% promedio' },
        { label: 'Acción',           value: 'Redistribuir carga o añadir respaldo urgente' },
      ],
    },
    {
      nombre: 'Ring Group — Raquel Loredo',
      rol:    'Segunda extensión con mayor pérdida entrante',
      color:  '#f97316',
      campos: [
        { label: 'Pérdida',          value: '50% de llamadas no atendidas' },
        { label: 'Benchmark cuenta', value: '13.3% promedio' },
        { label: 'Acción',           value: 'Redistribuir carga o añadir respaldo' },
      ],
    },
    {
      nombre: 'Ring Group — Brenda Santana',
      rol:    'Tercera extensión con pérdida por encima del promedio',
      color:  '#f59e0b',
      campos: [
        { label: 'Pérdida',          value: '38.9% de llamadas no atendidas' },
        { label: 'Benchmark cuenta', value: '13.3% promedio' },
        { label: 'Acción',           value: 'Incluir en redistribución mediano plazo' },
      ],
    },
    {
      nombre: 'Top 2 agentes salientes',
      rol:    'Concentración crítica de volumen saliente',
      color:  '#8b5cf6',
      campos: [
        { label: 'Participación', value: '57% del total de 2,761 llamadas salientes' },
        { label: 'Riesgo',        value: 'Dependencia de 2 personas — cola de marcación recomendada' },
        { label: 'Acción',        value: 'Redistribuir con herramientas de distribución y calidad de marcación' },
      ],
    },
  ],

  // ── FODA ────────────────────────────────────────────────────────────────────
  foda: {
    fortalezas: [
      'Mejora sostenida en pérdida entrante de enero a marzo (23.7% → 8.7%).',
      'Operación saliente real y activa (2,761 llamadas): gestión comercial/cobranza, no solo soporte pasivo.',
      'Tiempos de atención eficientes una vez conectado (AHT 2.7 min entrante / 4.4 min saliente).',
      'Antigüedad de 6 años, Health Score 70, Pago 100% al corriente.',
    ],
    oportunidades: [
      'Excedente de minutos en 5 de 7 meses: argumento objetivo de upgrade de plan.',
      '68 destinos activos vs. 11 extensiones: mismo argumento reforzado para upgrade.',
      'Variabilidad de servicio por extensión (9%–53%): oportunidad de redistribución de bajo costo.',
      'IVR ya existente pero subutilizado: base para un Asistente Virtual de IA sin partir de cero.',
      '283 números con 5+ llamadas en 7 meses: candidatos directos a automatización.',
    ],
    debilidades: [
      'Pérdida saliente crítica y sostenida (33.6%–50.4%), sin causa raíz identificable desde el CDR.',
      'Repunte de pérdida entrante en julio (11.4% → 17.0%), coincidente con la solicitud de baja.',
      'Dependencia de 2 de 48 agentes para 57% del volumen saliente.',
      '0% de adopción de canales digitales registrada en CRM.',
    ],
    amenazas: [
      'Solicitud formal de baja activa (Ticket #112044) con 30 días sugeridos internamente.',
      '64 días de reintento sin conexión: riesgo directo de que Kombitec pierda negocio con sus propios clientes.',
      'Si el excedente de minutos no se ha facturado, exponerlo ahora puede percibirse como cobro sorpresa.',
      'Solo 4 tickets históricos: sin evidencia suficiente para contradecir la queja de soporte con datos.',
    ],
  },

  // ── Conclusión ──────────────────────────────────────────────────────────────
  conclusion: 'Kombitec no tiene un problema de relación — 6 años, pago impecable, Health Score 70 — sino un problema de dimensionamiento que se volvió visible para el cliente antes de que Callpicker pudiera nombrarlo. La solicitud de baja tiene base parcial en los datos pero también revela tres oportunidades de venta consultiva simultáneas: upgrade de plan, redistribución de carga y automatización. La ventana para actuar es la sesión del lunes.',

  pierde: [
    '$8,659 MRR mensual — ~$103,908 anualizados.',
    'Cliente de 6 años con pago 100% — perfil de bajo riesgo crediticio.',
    'Referencia de cuenta Enterprise en San Luis Potosí.',
    'Caso de éxito potencial con datos objetivos de mejora una vez resuelto el dimensionamiento.',
  ],

  gana: [
    'Upgrade de plan a ~5,200-5,600 min/mes — incremento de MRR estimado.',
    'Dimensionamiento real a 68 extensiones activas.',
    'Piloto de Asistente Virtual de IA con evidencia objetiva de candidatura (volumen, concentración horaria, frustración medible).',
    'Cola de marcación saliente para reducir dependencia de 2 agentes clave.',
    'Dashboard de calidad compartido — diferencial de valor percibido.',
  ],

  recomendacion_central: 'Abordar la sesión del lunes desde el análisis objetivo: el excedente de 104% de minutos en 5 de 7 meses y los 68 destinos activos vs. 11 extensiones contratadas son los dos argumentos de mayor peso para un upgrade integral — el cliente los desconoce, lo que los convierte en datos de alto impacto en negociación. El límite de extensiones simultáneas es verificable con producto; si es ajustable, elimina la queja más explícita. El Asistente Virtual de IA como piloto acotado (2 franjas horarias, 3 ring groups) tiene la mayor probabilidad de generar impacto visible antes de pedir un compromiso mayor. No prometer ajuste técnico sin confirmación de producto; no condonar excedente sin validar primero qué se cobró realmente.',
}
