import type { AuditoriaCase } from './types'

export const ANCONA_AUTOPARTES: AuditoriaCase = {
  id:     'ancona-autopartes',
  asesor: 'Fátima',

  nombre:               'Ancona Autopartes',
  sector:               'Autopartes · Refaccionaria (gama alta y media) · Península de Yucatán',
  fecha_periodo:        '5 jul – 4 ago 2026',
  fecha_auditoria:      'Ago 2026',
  tipo_cliente:         'VIP · CID 24924 · Cadena 14 sucursales · MRR $15,543',
  descripcion_contexto: 'Reporte de Análisis Forense de Llamadas · 12,335 registros (12,104 entrantes + 231 salientes) · Incidente crítico identificado 20 jul 2026',
  estado:               'en_recuperacion',
  clasificacion:        'CONFIDENCIAL',
  version:              '1.0',

  /* ── KPIs ─────────────────────────────────────────────────────── */
  kpis: [
    { label: 'Llamadas entrantes (1 mes)',        value: '12,104',      color: '#6366f1' },
    { label: 'Tasa de pérdida (pre-corrección)',  value: '62.8%',       color: '#ef4444' },
    { label: 'Tasa de pérdida (post-corrección)', value: '3.9%',        color: '#22c55e' },
    { label: 'MRR',                               value: '$15,543/mes', color: '#f59e0b' },
  ],

  /* ── Resumen ejecutivo ────────────────────────────────────────── */
  resumen_ejecutivo: 'Ancona Autopartes (CID 24924), cadena de refaccionarias de gama alta y media con 14 sucursales en la península de Yucatán, es cliente de Callpicker desde septiembre de 2019 (6 años). El análisis de 12,335 llamadas del periodo 5 jul–4 ago 2026 identificó un evento discreto y verificable: un cambio de configuración de ruteo el 20 de julio que transformó la operación de golpe.\n\nAntes del 20 de julio (15 días), la tasa de pérdida promedio fue de 62.8%, impulsada casi en su totalidad por la sucursal CAM Talleres (73.5% de pérdida, 8,074 llamadas) donde 3,522 llamadas no tenían ningún destino de enrutamiento asignado. Después del 20 de julio, con el destino "Jorge QROO" activo, la pérdida promedio cayó a 3.9%. Esta es la evidencia técnica más sólida: no es una hipótesis, es un patrón visible en el 100% de los registros.\n\nHallazgo crítico: el incidente de 15 días con >4,000 llamadas perdidas no generó ningún ticket ni alerta en Callpicker — se identificó únicamente al procesar este CDR. Ancona tiene Health Score de 65/100 y 0 de 6 módulos digitales adoptados, lo que explica estructuralmente la ausencia de detección proactiva. La operación es reactiva, no preventiva.',

  resultado_positivo: 'La corrección del 20 de julio tuvo éxito inmediato: pérdida reducida de 62.8% a 3.9% en las sucursales beneficiadas. Operación post-corrección sana. Sin embargo, 5 sucursales pequeñas de mayor riesgo (Progreso, CD Carmen, Lakin, Playa1, Valladolid) siguen con pérdida de 20%–41% y no se beneficiaron de la corrección. Oportunidad clara de retención + expansión mediante IA de Voz como red de contención en sucursales de menor volumen.',

  hallazgos: [
    'Incidente de ruteo sin detección: 15 días, ~3,294 llamadas perdidas en CAM Talleres por falta de destino de enrutamiento. No generó ticket ni alerta.',
    'Punto único de falla nuevo: 98% del tráfico de CAM Talleres (después de la corrección) depende de un solo destino ("Jorge QROO") sin evidencia de ruta alterna. Naturaleza (extensión individual vs. grupo de timbrado) desconocida.',
    'Corrección puntual, no integral: la mejora del 20 de julio benefició CAM Talleres y CAM YUCAM pero no a Progreso (40.9% pérdida), CD Carmen (35.7%), Lakin (32.7%), Playa1 (26.5%) ni Valladolid (20.0%).',
    'Cero recuperación de contacto perdido: de 2,282 números únicos que sufrieron al menos una llamada perdida, solo 94 (4.1%) recibieron una devolución de llamada. 95.9% nunca fue contactado de vuelta.',
    'Concentración de tráfico extrema: 81% del volumen total (9,818 de 12,104 llamadas) proviene de solo 2 sucursales (CAM Talleres 66.7%, CAM YUCAM 14.4%). Las 12 restantes se reparten el 19%.',
    'Motivo de llamada altamente estructurado: 79.9% de las llamadas etiquetadas (muestra de 712 de 12,104) corresponden a "Cotización o Existencia". Es decir: 80% de la interacción es consulta de precio/disponibilidad, técnicamente automatizable.',
    'Cero adopción registrada: 6 años como cliente sin ningún módulo digital activo (Chat, IA de Voz, IA de Chat, Integración API, Pago Automático, Panel Administrador). Health Score 65/100 con 0/6 módulos.',
    'Patrón horario de pérdida: a pesar de la corrección, la apertura del día (7:00–8:00) sigue con 7–9.5% de pérdida — superior al promedio post-corrección de 3.9%. Sucursales pequeñas concentran proporcional mayor pérdida en estos horarios.',
    'Sin visibilidad propia del desempeño: el incidente de julio fue descubierto únicamente por análisis externo (este CDR), no por proceso interno de Ancona ni por alerta de Callpicker.',
  ],

  /* ── Cronología ───────────────────────────────────────────────── */
  cronologia: [
    { fecha: 'Sep 2019',     responsable: 'Fátima',            evento: 'Inicio de la relación. Ancona contrata servicio de 14 sucursales, plan base.',                   tipo: 'ok' },
    { fecha: 'Jul 2019–ago 2026', responsable: 'Sistema',      evento: 'Operación estable durante 6+ años. Sin registros de actividad KAM.',                         tipo: 'neutral' },
    { fecha: '5–19 jul 2026', responsable: 'Sistema/Ancona',  evento: 'Tasa de pérdida 62.8%. CAM Talleres pierde 73.5% de las llamadas (3,522 sin destino). Sin ticket ni alerta de Callpicker.',                                tipo: 'problema' },
    { fecha: '20 jul 2026',  responsable: 'Ancona/Técnico',   evento: 'Cambio de configuración de ruteo: nuevo destino "Jorge QROO" activo. Pérdida cae a 3.9% en sucursales beneficiadas. Correctivo implementado sin comunicación a Callpicker.',    tipo: 'pivote' },
    { fecha: '20 jul–4 ago 2026', responsable: 'Sistema',     evento: 'Operación post-corrección: 3.9% pérdida promedio. Pero 5 sucursales pequeñas siguen con 20%–41% sin beneficio de la corrección.',                       tipo: 'neutral' },
    { fecha: '14 ago 2026',  responsable: 'Equipo Experiencia al Cliente',   evento: 'Análisis forense completo. Identificación de incidente, riesgo de punto único de falla, oportunidad de expansión por IA de Voz.',  tipo: 'neutral' },
  ],

  /* ── Perfil del cliente ──────────────────────────────────────– */
  perfil_campos: [
    { label: 'Razón social',         value: 'Ancona Autopartes S.A. de C.V.' },
    { label: 'Giro',                  value: 'Comercio al por mayor y menor de refacciones automotrices — gama alta y media' },
    { label: 'Alcance geográfico',    value: 'Península de Yucatán: 14 sucursales en Quintana Roo (7), Yucatán (4), Campeche (3)' },
    { label: 'Plan contratado',       value: '14 Sucursales/Extensiones · Recepción de llamadas · MRR $15,543' },
    { label: 'CID Zoho Desk',         value: '24924' },
    { label: 'Antigüedad',            value: 'Cliente desde septiembre de 2019 (6 años)' },
    { label: 'KAM Callpicker',        value: 'Fátima' },
    { label: 'Health Score',          value: '65/100 · Información (✗) Pagos (✓) Adopción (0/6 módulos) Seguimiento (cero registros KAM)' },
    { label: 'Sucursales principales', value: 'CAM Talleres (66.7% tráfico), CAM YUCAM (14.4%), Progreso, CD Carmen, Lakin, Playa1, Valladolid (20%–41% pérdida residual)' },
    { label: 'Historial de pagos',    value: 'Regular — sin incidencias documentadas' },
    { label: 'Tickets de soporte',    value: 'Mínimo: incidente de julio descubierto por análisis externo, no por ticket interno' },
  ],

  necesidad_negocio: 'Centro de recepción de demanda (inbound) en cadena multilocal: 12,104 llamadas/mes en 14 puntos de venta. El negocio depende críticamente del teléfono como canal de originación de venta — 80% de las llamadas etiquetadas son consultas de precio/existencia de refacción, paso previo a la decisión de compra. La necesidad real es: (1) garantizar que no se pierdan llamadas de clientes/talleres en ningún punto de la cadena, (2) recuperar las llamadas hoy perdidas sin devolución, (3) automatizar el flujo de cotización/existencia que hoy depende 100% de agentes humanos.',

  potencial_corto: [
    'Confirmar naturaleza de "Jorge QROO" (extensión individual vs. grupo de timbrado) y mitigar riesgo de punto único de falla — 98% del tráfico concentrado sin respaldo evidente.',
    'Auditar configuración de ruteo en Progreso, CD Carmen, Lakin, Playa1, Valladolid — replicar la corrección que ya funcionó en CAM Talleres.',
    'Establecer alerta de umbral >15% pérdida diaria por sucursal — el próximo incidente debe detectarse en horas, no en 15 días.',
  ],
  potencial_largo: [
    'IA de Voz (Asistente Virtual) como red de contención en sucursales de menor volumen — respuesta automática a cotización/existencia (80% del motivo), liberando agentes para venta y atención especializada.',
    'Integración API con catálogo de Ancona — resolución de punta a punta de la consulta de existencia/precio (automatización completa del 80% de las interacciones).',
    'Panel Administrador con visibilidad propia de Ancona — autonomía del cliente para detectar anomalías sin depender de auditorías externas; reactivación de seguimiento KAM formal (6 años sin registros).',
    'Chat como canal complementario para consultas de existencia/precio desde clientes de taller/mecánico que prefieran texto a voz.',
  ],

  tacticas: [
    {
      nombre:      'Apertura con evidencia visual del incidente',
      descripcion: 'Presentar la Gráfica 1 (tendencia diaria del 5 jul–4 ago) — el quiebre vertical del 20 de julio es innegable y no necesita explicación. Es el argumento más fuerte del reporte.',
      impacto:     'Alto — construye credibilidad inmediata; el cliente ve que Callpicker conoce su operación mejor que ellos mismos.',
    },
    {
      nombre:      'Pregunta provocadora de retención',
      descripcion: '"¿Qué hubiera pasado si esas ~3,500 llamadas perdidas en CAM Talleres hubieran tenido un asistente de voz respondiendo mientras se resolvía el problema de ruteo?" Dejar que el cliente dimensione el costo, sin prometer cifra exacta.',
      impacto:     'Alto — el cliente cuantifica el valor del producto de forma propia; genera demanda de solución, no rechazo a propuesta no solicitada.',
    },
    {
      nombre:      'IA de Voz como piloto en sucursales pequeñas',
      descripcion: 'Anclar el cierre en Lakin, Progreso, CD Carmen — bajo volumen (178–220 llamadas/mes), bajo riesgo, bajo costo relativo, alto valor demostrativo. Éxito rápido con bajo budget antes de expansión a toda la cadena.',
      impacto:     'Medio-Alto — piloto de bajo riesgo, aprobación probable, base para expansión posterior a CAM Talleres + CAM YUCAM.',
    },
    {
      nombre:      'Activación de seguimiento KAM',
      descripcion: 'Reactivar contacto regular con registro en CRM. 6 años de relación sin actividad documentada es brecha de proceso, no reflejo del cliente. Proponer check-in mensual sobre desempeño de llamadas y adopción de nuevos módulos.',
      impacto:     'Bajo inmediato, alto a mediano plazo — construye base de confianza y captura de oportunidades de expansión.',
    },
  ],

  senal_alarma: 'INCIDENTE CONFIRMADO DE PÉRDIDA DE LLAMADAS. Periodo: 5–19 jul 2026. Magnitud: ~4,028 llamadas perdidas en 15 días, sin que Ancona ni Callpicker lo detectaran antes de este análisis. La corrección fue implementada por Ancona sin comunicación (20 jul), pero riesgo residual persiste en 5 sucursales pequeñas con 20%–41% de pérdida. Punto único de falla nuevo ("Jorge QROO") en sucursal de mayor volumen requiere mitigación inmediata. Madurez operativa actual: reactiva, no preventiva — cliente no tiene visibilidad propia de su desempeño.',

  /* ── Problema Raíz ───────────────────────────────────────────── */
  problema_raiz: 'Falta de visibilidad y monitoreo proactivo. El cliente (Ancona) tiene cero módulos de panel/reportes adoptados tras 6 años. Callpicker tiene alertas disponibles pero no configuradas para esta cuenta. Resultado: incidente de 15 días pasó desapercibido hasta este análisis.',
  problema_raiz_detalle: 'La estructura operativa de Ancona es reactiva, no preventiva. Sin adopción de módulos de visibilidad (Panel Admin, IA de Voz), no hay detección automática de anomalías. El incidente de julio fue un cambio brusco de ruteo que debería haber generado alerta en horas; en su lugar, se descubrió mediante análisis externo 15 días después. El riesgo residual persiste en 5 sucursales donde la pérdida oscila entre 20%–41%, sin evidencia de corrección pendiente.',

  flujo_real: [
    { fase: 'Pre-incidente (5–19 jul)', area: 'Operaciones', accion: 'Ruteo de CAM Talleres sin destino de enrutamiento asignado', resultado: '73.5% pérdida, 3,522 llamadas perdidas' },
    { fase: 'Incidente detectado', area: 'Técnica', accion: 'Cambio de ruteo: nuevo destino "Jorge QROO" activado', resultado: 'Pérdida cae a 3.9%, pero riesgo de punto único de falla' },
    { fase: 'Post-corrección (20 jul–4 ago)', area: 'Operaciones', accion: 'Operación con destino activo, pero 5 sucursales sin corrección', resultado: '20%–41% pérdida residual en Progreso, CD Carmen, Lakin, Playa1, Valladolid' },
  ],
  comparativo: [
    { metrica: 'Tasa de pérdida pre-corrección', real: '62.8%', ideal: '<5%' },
    { metrica: 'Tasa de pérdida post-corrección', real: '3.9%', ideal: '<2%' },
    { metrica: 'Concentración de tráfico', real: '81% en 2 sucursales', ideal: 'Distribuido <30% por sucursal' },
    { metrica: 'Recuperación de contacto perdido', real: '4.1% (94 de 2,282)', ideal: '>90%' },
    { metrica: 'Módulos digitales adoptados', real: '0 de 6', ideal: '≥3 (Panel, IA Voz, IA Chat)' },
  ],

  plan_inmediato: [
    { accion: 'Confirmar naturaleza de "Jorge QROO" (extensión vs. grupo de timbrado) y mitigar riesgo de punto único de falla', responsable: 'Fátima + Técnica', criterio: 'Confirmación documentada y plan de respaldo implementado' },
    { accion: 'Auditar configuración de ruteo en 5 sucursales con pérdida residual (Progreso, CD Carmen, Lakin, Playa1, Valladolid)', responsable: 'Técnica', criterio: 'Auditoría completada, correcciones aplicadas' },
    { accion: 'Establecer alerta de umbral >15% pérdida diaria por sucursal', responsable: 'Configuración', criterio: 'Alerta activa, al menos 2 incidentes detectados en <24h' },
  ],
  plan_mediano: [
    { accion: 'Presentar caso de negocio de IA de Voz para sucursales de menor volumen (piloto en Lakin, Progreso, CD Carmen)', responsable: 'Ventas', criterio: 'Propuesta aceptada, SOW firmado' },
    { accion: 'Activar recuperación de contacto perdido (sistema automático o manual de devolución de llamadas)', responsable: 'Operaciones', criterio: 'Tasa de recuperación >50%' },
    { accion: 'Reactivar seguimiento KAM formal — check-in mensual documentado', responsable: 'Fátima', criterio: 'Mínimo 3 check-ins completados con actas' },
  ],
  plan_estrategico: [
    { accion: 'Expansión de IA de Voz a toda la cadena (14 sucursales) como red de contención y canal de atención', responsable: 'Ventas + Implementación', criterio: 'Solución en producción en todas las sucursales' },
    { accion: 'Integración API con catálogo de Ancona para resolución automática de consultas de precio/existencia (80% del volumen)', responsable: 'Integraciones', criterio: 'API integrada, automatización de cotizaciones en marcha' },
    { accion: 'Implementación de Panel Administrador con reportería propia de Ancona', responsable: 'Implementación', criterio: 'Cliente con acceso autónomo a dashboards, alertas configuradas' },
  ],
  areas_oportunidad: [
    { area: 'IA de Voz (Asistente Virtual)', impacto: 'Muy Alto — puede responder 80% de las consultas de cotización/existencia automáticamente, liberando agentes', responsable: 'Ventas' },
    { area: 'Integración API con catálogo', impacto: 'Alto — cierra el 80% de la consulta sin intervención humana', responsable: 'Integraciones' },
    { area: 'Panel Administrador con visibilidad', impacto: 'Alto — permite a Ancona detectar incidentes en horas, no días', responsable: 'Implementación' },
    { area: 'Chat como canal complementario', impacto: 'Medio — alternativa para clientes que prefieren texto a voz', responsable: 'Producto' },
  ],

  perfiles: [
    { nombre: 'Fátima (KAM Callpicker)', rol: 'Gestor de cuenta y relación comercial', color: '#6366f1', campos: [ { label: 'Responsable de', value: 'Seguimiento de cuenta, identificación de oportunidades, cierre de nuevos módulos' } ] },
    { nombre: 'Gerente Operativo Ancona', rol: 'Propietario de la operación telefónica y toma de decisiones técnicas', color: '#f59e0b', campos: [ { label: 'Responsable de', value: 'Aprobación de cambios de ruteo, adopción de soluciones, inversión en módulos digitales' } ] },
    { nombre: 'Técnico responsable (CAM Talleres)', rol: 'Ejecución de configuraciones, soporte de incidentes', color: '#22c55e', campos: [ { label: 'Responsable de', value: 'Cambio de ruteo del 20 jul (correctivo sin comunicación previa)' } ] },
  ],

  foda: {
    fortalezas: [
      'Cliente de 6 años con relación estable y pagos al día',
      'MRR significativo ($15,543) — inversión justificada en soluciones personalizadas',
      'Operación concentrada (81% en 2 sucursales) facilita pilotos controlados',
      'Motivo de llamada altamente estructurado (80% cotización) — ideal para automatización con IA',
    ],
    oportunidades: [
      'IA de Voz como red de contención inmediata en sucursales de bajo volumen (piloto de bajo riesgo)',
      'Integración API para automatización de 80% de las consultas de precio/existencia',
      'Panel Administrador para que Ancona recupere visibilidad de su propia operación',
      'Expansión a toda la cadena post-piloto exitoso en Lakin/Progreso',
    ],
    debilidades: [
      'Cero adopción de módulos digitales tras 6 años — dependencia total de agentes humanos',
      'Operación reactiva, no preventiva — no hay alertas ni monitoreo automático configurados',
      'Incidente de 15 días pasó desapercibido por ambos lados (cliente y Callpicker)',
      'Riesgo de punto único de falla nuevo en CAM Talleres (destino "Jorge QROO" sin respaldo)',
    ],
    amenazas: [
      'Punto único de falla: si "Jorge QROO" falla, CAM Talleres (66.7% del tráfico) perdería el 98% de llamadas',
      'Pérdida de contacto sin recuperación: 95.9% de números con llamada perdida nunca son recontactados',
      'Concentración extrema: cambio en CAM Talleres o CAM YUCAM afecta la operación completa',
      'Competencia o cambio de proveedor en telecomunicaciones podría reducir dependencia de Callpicker si las soluciones digitales no se implementan',
    ],
  },

  conclusion: 'Ancona Autopartes es cliente de alto valor ($15,543 MRR, 6 años de relación) con operación estructuralmente vulnerable: 81% del tráfico en 2 sucursales, cero módulos digitales, incidentes no detectados, recuperación de contacto casi nula. El incidente de julio es una oportunidad para reactivar la relación y proponer IA de Voz como red de contención. Piloto en sucursales de bajo riesgo (Lakin, Progreso) debe cerrase en 90 días antes de expansión a toda la cadena.',
  pierde: [
    'Tráfico de 3,522 llamadas en 15 días (CAM Talleres, pre-corrección)',
    'Contacto con 2,282 clientes/talleres por llamadas perdidas (95.9% sin devolución)',
    'Eficiencia operativa: 80% de consultas de precio/existencia requieren agente humano (automatizable)',
  ],
  gana: [
    'Reducción de pérdida de 62.8% a 3.9% (post-corrección) + mitigación de sucursales residuales',
    'IA de Voz para respuesta automática a cotización/existencia (liberación de agentes)',
    'Recuperación de contacto perdido mediante llamadas automáticas o chat',
    'Panel Administrador con visibilidad propia — detección de incidentes en horas, no días',
  ],
  recomendacion_central: 'Cerrar IA de Voz en piloto de 90 días en Lakin + Progreso + CD Carmen como red de contención de pérdida y canal de cotización automática. Paralelo: auditar ruteo en 5 sucursales residuales. Meta: demostrar ROI en bajo riesgo antes de expansión a CAM Talleres + YUCAM (81% del volumen). Reactivar KAM mensual para asegurar adopción.',

  /* ── Contenido completo del reporte de auditoría ───────────────*/
  contenido_auditoria: `CALLPICKER · EXPERIENCIA AL CLIENTE
Reporte de Análisis de
Llamadas Entrantes y Salientes
ANCONA AUTOPARTES
Enfoque: diagnóstico forense de llamadas y caso de negocio — Asistente Virtual (IA de Voz)
Periodo analizado: 5 de julio – 4 de agosto de 2026
CID Zoho: 24924 · Asesor SAC: Fátima · MRR: $15,543 MXN
Elaborado por Equipo Experiencia al Cliente
14 de agosto de 2026

1. RESUMEN EJECUTIVO

Se analizaron 12,104 llamadas entrantes y 231 llamadas salientes de Ancona Autopartes correspondientes al periodo 5 de julio – 4 de agosto de 2026, distribuidas en 14 sucursales/extensiones de la península de Yucatán (Quintana Roo, Yucatán y Campeche). El hallazgo dominante del periodo no es un patrón de comportamiento gradual, sino un evento discreto y verificable: un cambio de configuración de ruteo el 20 de julio que transformó la operación de golpe.

Antes del 20 de julio (15 días), la tasa de pérdida promedio fue de 62.8%, impulsada casi en su totalidad por la sucursal CAM Talleres (73.5% de pérdida, 8,074 llamadas del total analizado), donde 3,522 llamadas no tenían ningún destino de enrutamiento asignado (campo Destination vacío). Después del 20 de julio, con el destino "Jorge QROO" activo, la pérdida promedio cayó a 3.9%. Esta es la evidencia técnica más sólida de todo el análisis: no es una hipótesis, es un patrón visible en el 100% de los registros.

Aun con la corrección, persiste pérdida relevante en sucursales de menor volumen: PROGRESO (40.9%), CD Carmen (35.7%), Lakin (32.7%), Playa1 (26.5%) y VALLADOLID (20.0%) no se beneficiaron de la misma corrección y siguen operando con una fracción significativa de llamadas no atendidas. Adicionalmente, de los 2,282 números distintos que sufrieron al menos una llamada perdida en el mes, sólo 94 (4.1%) recibieron una llamada de vuelta desde Ancona — no existe un proceso de recuperación de contacto perdido.

La ficha CS confirma un contexto de fondo: Ancona es cliente desde 2019 (6 años), con Health Score parcial de 65/100, y 0 de 6 módulos digitales adoptados — incluyendo IA de Voz e IA de Chat — y cero registros de seguimiento KAM. El incidente de julio no fue detectado por Callpicker ni reportado como ticket; se identificó únicamente al procesar este CDR.

RIESGOS PRIORITARIOS:
- Punto único de falla nuevo: el 98% del tráfico de CAM Talleres ahora depende de un solo destino ("Jorge QROO"). Si esa extensión/persona falla, no hay evidencia de una ruta alterna.
- Cero monitoreo proactivo: el incidente duró al menos 15 días sin alerta ni ticket — se descubrió por este análisis, no por seguimiento operativo.
- Recuperación de contacto casi nula: 95.9% de los números con llamada perdida no reciben devolución de llamada.
- Adopción de producto en cero: 6 años de relación sin ningún módulo digital activo, en una cuenta con MRR de $15,543 y alto volumen de tráfico.

RECOMENDACIONES PRIORITARIAS:
1. Confirmar con el cliente si "Jorge QROO" es un grupo de timbrado (ring group) o una extensión única, y mitigar el riesgo de punto único de falla.
2. Replicar la revisión de configuración de ruteo en las sucursales con pérdida residual alta (PROGRESO, CD Carmen, Lakin, Playa1).
3. Establecer una alerta de umbral de llamadas perdidas para detectar incidentes similares en horas, no en semanas.
4. Presentar el caso de negocio de IA de Voz (Asistente Virtual) como red de seguridad en sucursales de menor volumen y como canal de recuperación de las llamadas perdidas.
5. Reactivar seguimiento KAM formal — la cuenta no tiene ningún registro de actividad comercial en 6 años.

[Contenido completo del reporte disponible en: D:\\Proyectos\\Reportes\\Ancona_Autopartes_Reporte_Llamadas_1.docx]`,

  documentos: [
    {
      nombre: 'Ancona Autopartes - Reporte de Análisis de Llamadas',
      ruta: '/auditorias/Ancona_Autopartes_Reporte_Llamadas_1.docx',
      descripcion: 'Análisis forense de 12,335 registros de llamadas (5 jul - 4 ago 2026). Identificación de incidente de ruteo y oportunidades de expansión con IA de Voz.',
    },
  ],
}
