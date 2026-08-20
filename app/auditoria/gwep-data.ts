import type { AuditoriaCase } from './types'

export const GWEP: AuditoriaCase = {
  id:                    'gwep',
  asesor:                'Dan',
  nombre:                'GWEP (Grupo Gwep)',
  sector:                'Desarrollo inmobiliario residencial',
  fecha_periodo:         '2 Enero – 19 Agosto 2026',
  fecha_auditoria:       'Ago 2026',
  tipo_cliente:          'Multi-proyecto · 7 entidades facturadas bajo un mismo cliente',
  descripcion_contexto:  'CID 9332 · Consecutivo D54 · 100% llamadas entrantes · Asesor: Dan Domínguez',
  estado:                'activo',
  clasificacion:         'CONFIDENCIAL',
  version:               '1.0',

  kpis: [
    { label: 'Llamadas analizadas (8 meses)',            value: '1,300',   color: '#6366f1' },
    { label: 'Tasa de pérdida global',                    value: '19.6%',   color: '#f59e0b' },
    { label: 'Plan facturado vs. operado',                value: 'CE ≠ VyC', color: '#ef4444' },
    { label: 'Atendidas por celular (consumo real)',      value: '74%',     color: '#f59e0b' },
  ],

  resumen_ejecutivo:
    'GWEP es un desarrollador inmobiliario residencial, cliente de Callpicker desde marzo de 2018 (8 años), con una operación que se apoya casi por completo en llamadas entrantes para convertir tráfico de publicidad en visitas y cierres. ' +
    'El análisis de 1,300 llamadas registradas entre el 2 de enero y el 19 de agosto de 2026 confirma con datos duros lo discutido en la sesión informativa del 19 de agosto: la cuenta opera 100% con llamadas entrantes en Callpicker (las salientes se gestionan en CloudTalk, plataforma distinta), tiene una integración funcional con HubSpot y muestra una mejora sostenida en su tasa de pérdida de llamadas a lo largo del año.\n\n' +
    'El hallazgo de mayor impacto en volumen: la línea con más tráfico ("Rev 1292 Publicidad en sitio", 30% del total, ligada a campañas hacia el proyecto Revolución de 1992) pierde el 29.9% de sus llamadas — prácticamente 1 de cada 3 contactos generados por inversión publicitaria no llega a ser atendido. ' +
    'A esto se suma un hallazgo confirmado internamente después de la primera entrega de este análisis: GWEP está facturado bajo el plan Comunicación Empresarial (CE) pero opera funcionalmente con las capacidades de Visibilidad y Control (VyC) — confirmado por Daniel Martínez Loyola (KAM) — y el 74% de sus llamadas atendidas se contestan por celular en vez de extensión fija, consumiendo minuto real de la bolsa contratada en lugar del minuto plano que aplicaría por SIP/fijo.',

  resultado_positivo:
    'La tasa de pérdida global bajó de 28.5% en enero a 12.8% en agosto de 2026 (-15.7 puntos), con tendencia descendente consistente mes a mes — la operación responde bien cuando se le da atención. ' +
    'GWEP acumula 8 años de antigüedad (cliente desde marzo 2018) con pagos al corriente y sin incidencias. ' +
    'El cliente construyó por su cuenta una integración funcional con HubSpot usando la capacidad de API de su plan — señal de madurez técnica interna, no de abandono. ' +
    'El enrutamiento multi-proyecto ya está configurado y funcionando para la mayoría de las entidades facturadas.',

  hallazgos: [
    'Fuga de leads pagados: ~118 llamadas perdidas en 8 meses en la línea de mayor inversión publicitaria ("Rev 1292 Publicidad en sitio", 30% del tráfico total, 29.9% de pérdida), sin que exista hoy un mecanismo de alerta que lo visibilice para el cliente.',
    'Facturación incorrecta: la cuenta está facturada como Comunicación Empresarial (CE) pero opera funcionalmente como Visibilidad y Control (VyC) — confirmado internamente por el KAM Daniel Martínez Loyola. Impacto en la factura mensual aún sin cuantificar.',
    'Dos de las 7 entidades facturadas (GWEP Jardines AARU y GWEP Tepic/Magallanes) no registran una sola llamada en 8 meses — riesgo mayor que el de "Rev 1292": ahí no se pierde un porcentaje, no hay ningún registro de tráfico. Causa aún no determinada.',
    'Consumo ineficiente de bolsa de minutos: 650 minutos en 8 meses (~81/mes) se consumieron a tarifa de celular en llamadas que, contestadas vía SIP/fijo, habrían costado 1 minuto plano cada una.',
    'Cero visibilidad de calidad: 87% de las llamadas no tienen evaluación registrada y 100% carecen de nota o etiqueta — el cliente no tiene forma de saber qué pasó dentro de la llamada, solo si se perdió o no.',
  ],

  cronologia: [
    { fecha: 'Mar 2018',              responsable: 'Callpicker',                  evento: 'Alta de cuenta GWEP. Inicio de una relación de 8 años, hoy con 7 entidades facturadas bajo el mismo cliente.', tipo: 'ok' },
    { fecha: '2 Ene – 19 Ago 2026',   responsable: 'Callpicker / Análisis de datos', evento: 'Periodo analizado: 1,300 llamadas entrantes registradas (Report_2598.xls). 100% del tráfico es inbound — las salientes se gestionan en CloudTalk, fuera de Callpicker.', tipo: 'neutral' },
    { fecha: '19 Ago 2026',           responsable: 'GWEP / Dan Domínguez',         evento: 'Sesión informativa: el cliente propone activamente consolidar CloudTalk + Callpicker, adoptar IA de Voz fuera de horario y solicita monitoreo en tiempo real — demanda activa, no venta en frío.', tipo: 'pivote' },
    { fecha: '19 Ago 2026',           responsable: 'Daniel Martínez Loyola (KAM)', evento: 'Tras la entrega de la primera versión de este análisis, el KAM confirma internamente que la discrepancia de plan no es un CRM desactualizado: GWEP factura CE pero opera con capacidades de VyC.', tipo: 'problema' },
  ],

  perfil_campos: [
    { label: 'Razón social',        value: 'GWEP (Grupo Gwep) — 7 entidades: Cumbres Herradura, Jardines AARU, Reserva del Sur (SACSA), Parque Hacienda (Grupo WY), Tepic (Magallanes), Radiatas, Revolución 1292' },
    { label: 'CID Zoho',            value: '9332' },
    { label: 'Consecutivo',         value: 'D54' },
    { label: 'Sector',              value: 'Desarrollo inmobiliario residencial' },
    { label: 'Cliente desde',       value: 'Marzo 2018 (8 años)' },
    { label: 'Servicio facturado',  value: 'Comunicación Empresarial (CE) — opera funcionalmente como Visibilidad y Control (VyC)' },
    { label: 'Contacto principal (CRM)', value: 'Francisco Rojas' },
    { label: 'Asesor de cuenta',    value: 'Dan Domínguez' },
    { label: 'MRR reportado',       value: '$6,657 MXN/mes (suma de 7 facturas individuales, algunas en tarifas legacy)' },
    { label: 'Health Score CRM',    value: '60 / 100' },
    { label: 'Modalidad de operación', value: '100% llamadas entrantes en Callpicker · salientes gestionadas en CloudTalk (plataforma separada)' },
  ],

  necesidad_negocio:
    'GWEP necesita convertir el tráfico que genera su inversión publicitaria en visitas y citas — es una operación comercial de conversión de leads, no de soporte. ' +
    'Es altamente dependiente de la llamada telefónica: es el punto de conversión primario de su inversión en publicidad, no un canal secundario. ' +
    'Opera con picos de tráfico entre 11:00 y 15:00 h (46% del volumen diario) y actividad relevante también en fin de semana (148 llamadas en sábado, 110 en domingo), coherente con un negocio inmobiliario donde las visitas a showroom ocurren fuera del horario laboral típico.',

  potencial_corto: [
    'El cliente ya manifestó interés explícito, en la sesión del 19 de agosto, en consolidar su operación (hoy dividida entre CloudTalk para salientes y Callpicker para entrantes) — es demanda activa, no venta en frío.',
    'La conversación de corrección de plan (CE → VyC) es una puerta de entrada natural, ya identificada por José Manuel L. y confirmada por el KAM, para presentar en la misma mesa la propuesta de IA de Voz — un solo movimiento de "poner en orden y hacer crecer la cuenta".',
    'La tasa de pérdida global bajó -15.7 puntos en 8 meses (28.5% → 12.8%) — evidencia de que la operación responde bien a ajustes, argumento a favor de invertir en resolver lo que falta.',
  ],

  potencial_largo: [
    'IA de Voz para atención fuera de horario — ya validada técnicamente por el cliente en la sesión del 19 de agosto; capturaría leads en el 27% del tráfico que hoy ocurre en fin de semana.',
    'Plan Call Center con monitoreo en tiempo real — solicitado por el cliente, resuelve directamente la ausencia total de datos de calidad (87% de llamadas sin evaluación).',
    'Planes independientes con facturación separada por proyecto — solicitud explícita del cliente, además de vía natural de expansión de cuenta.',
    'Reporte recurrente de tasa de pérdida por línea/campaña — no discutido en la reunión pero derivado del análisis: es la única forma de que un hallazgo como "Rev 1292" no vuelva a tardar 8 meses en detectarse.',
  ],

  tacticas: [
    {
      nombre:      'Abrir con corrección de plan (CE → VyC)',
      descripcion: 'Enmarcar como "poner la cuenta en orden", respaldada por el dato de consumo por celular (74%) como evidencia de que el plan operado (VyC) encaja mejor que el facturado (CE). Presentar en la misma mesa la propuesta de IA.',
      impacto:     'Alto — palanca de negociación confirmada por el KAM; abre la conversación comercial completa.',
    },
    {
      nombre:      'Cerrar accesos y facturación por proyecto primero',
      descripcion: 'Regularización de accesos administrativos y separación de facturación por proyecto: bajo riesgo, ya solicitados por el cliente, generan confianza rápida antes de temas de mayor inversión.',
      impacto:     'Medio — cierre fácil que abre la puerta a la conversación de mayor valor.',
    },
    {
      nombre:      'Presentar Plan Call Center apoyado en el hallazgo "Rev 1292"',
      descripcion: 'Usar el dato de 118 llamadas perdidas en la línea de mayor inversión publicitaria como evidencia concreta del costo de no tener monitoreo en tiempo real.',
      impacto:     'Alto — resuelve directamente el hallazgo más costoso del análisis y no depende de que el cliente acepte un cambio grande como consolidar plataformas.',
    },
    {
      nombre:      'Avanzar sesión de descubrimiento de IA de Voz',
      descripcion: 'Como paso natural una vez el cliente esté "caliente" tras las conversaciones anteriores — ya validado técnicamente, pero requiere sesión de descubrimiento con costo adicional.',
      impacto:     'Alto — ya solicitado por el cliente, capitalizaría el pico de tráfico de fin de semana no atendido.',
    },
  ],

  senal_alarma:
    'No es una señal de riesgo de cancelación (Health Score 60/100, 8 años de antigüedad, pagos al corriente) — es una señal de fuga de valor no capturado: cada mes que pasa sin corregir la línea "Rev 1292" y sin visibilidad de calidad, el cliente sigue pagando marketing que no se convierte, sin saberlo con precisión. ' +
    'El verdadero riesgo es competitivo, no de churn: CloudTalk ya es una alternativa instalada en la operación del cliente — si Callpicker no propone primero la consolidación que el cliente ya está buscando activamente, puede perder esa expansión frente al competidor.',

  problema_raiz:        'Dos de 7 entidades facturadas sin ninguna llamada registrada en 8 meses',
  problema_raiz_detalle:
    'Es el hallazgo de mayor riesgo potencial del análisis: GWEP (Jardines AARU) y GWEP Tepic (Magallanes) no aparecen en ni una sola de las 1,300 llamadas del periodo. ' +
    'José Manuel L. ya había notado el síntoma ("en los DIDs no me salió Tepic"); el cruce con el histórico de llamadas confirma que el problema no es solo que el DID no apareciera en el listado — es que no hay tráfico registrado en absoluto. ' +
    'Hay tres explicaciones posibles, no determinables sin acceso al panel de configuración: (1) esas líneas no están enrutadas hacia Callpicker y viven en otro sistema, similar a las salientes en CloudTalk; (2) existe un error de configuración o enrutamiento que impide que las llamadas se registren; o (3) son desarrollos con actividad comercial baja o nula en el periodo. ' +
    'Si la causa es la opción 2, es la fuga de leads más grave de todo el análisis — mayor que la de "Rev 1292" — porque ahí no se pierde un porcentaje, se pierde el 100% del tráfico sin ni siquiera un registro de intento. ' +
    'No se debe presentar este hallazgo al cliente como "cuentas sin uso" sin verificarlo internamente primero: podría sonar a acusación de mala configuración de Callpicker cuando la causa real todavía no se conoce.',

  flujo_real: [
    { fase: 'GWEP (Cumbres Herradura)',        area: 'Líneas "Cher*"',                          accion: '448 llamadas · confianza: DID confirmado + patrón de nombre',           resultado: '11.4% de pérdida' },
    { fase: 'GWEP Revolución 1292',            area: 'Línea "Rev 1292*"',                        accion: '395 llamadas (30% del tráfico total) · confianza: inferido por nombre, sin DID confirmado', resultado: '29.9% de pérdida — 118 llamadas perdidas' },
    { fase: 'Ambiguo: "Tapial Revolución RDS"',area: '¿Revolución 1292 o Reserva del Sur?',      accion: '245 llamadas · confianza: no determinable con la información disponible', resultado: '10.6% de pérdida' },
    { fase: 'GWEP Reserva del Sur (SACSA)',    area: 'Líneas "RdS*"',                             accion: '79 llamadas · confianza: DID confirmado (3 de 4 líneas)',                resultado: '22.8% de pérdida' },
    { fase: 'GWEP Radiatas',                   area: 'Línea directa',                             accion: '65 llamadas · confianza: DID confirmado',                                resultado: '10.8% de pérdida' },
    { fase: 'GWEP Parque Hacienda (Grupo WY)', area: 'Línea "P Hda General"',                    accion: '27 llamadas · confianza: DID confirmado',                                resultado: '63.0% de pérdida — la peor tasa entre líneas con tráfico confirmado' },
    { fase: 'GWEP (Jardines AARU)',            area: 'Entidad facturada, sin línea identificada', accion: 'Cero llamadas en 8 meses de datos',                                      resultado: 'Sin tráfico visible — causa no determinada, hallazgo de mayor riesgo' },
    { fase: 'GWEP Tepic (Magallanes)',         area: 'Entidad facturada, sin línea identificada', accion: 'Cero llamadas en 8 meses de datos',                                      resultado: 'Sin tráfico visible — causa no determinada, hallazgo de mayor riesgo' },
  ],

  comparativo: [
    { metrica: 'Tasa de pérdida global',                            real: '19.6% promedio (28.5% ene → 12.8% ago)', ideal: '< 15% sostenido' },
    { metrica: 'Pérdida línea "Rev 1292" (30% del tráfico)',        real: '29.9%',                                   ideal: '< 15% — es la línea de mayor inversión publicitaria' },
    { metrica: 'Pérdida "P Hda General"',                           real: '63.0%',                                   ideal: '< 20%' },
    { metrica: 'Entidades facturadas sin tráfico',                  real: '2 de 7 (28.6%)',                          ideal: '0 de 7' },
    { metrica: 'Llamadas atendidas por celular (consumo real)',     real: '74.3% (455 de 612)',                      ideal: '< 25% — priorizar SIP/fijo (consumo plano)' },
    { metrica: 'Llamadas con evaluación de calidad registrada',     real: '12.8% (166 de 1,300)',                    ideal: '100%' },
    { metrica: 'Plan facturado vs. operado',                        real: 'CE facturado / VyC operado',              ideal: 'Coincidencia entre plan facturado y capacidades usadas' },
  ],

  plan_inmediato: [
    { accion: 'Verificar configuración y enrutamiento de GWEP (Jardines AARU) y GWEP Tepic (Magallanes) en el panel de Callpicker', responsable: 'Dan Domínguez + equipo técnico Callpicker', criterio: 'Confirmar si hay fuga total de leads por error de configuración o si son cuentas legítimamente de bajo tráfico' },
    { accion: 'Auditar dotación y horario de cobertura de la línea "Rev 1292 Publicidad en sitio" en el bloque de 11:00–15:00 h', responsable: 'Dan Domínguez + cliente', criterio: 'Reducción directa de la pérdida más costosa detectada en volumen' },
    { accion: 'Regularizar accesos administrativos (altas/bajas ya acordadas), migrando fuera del correo compartido actual', responsable: 'Dan Domínguez + cliente', criterio: 'Confirmar antes que los correos coincidan con los de convocatoria de la reunión — posible error de transcripción ("asapiro@web.com.mx"/"ysanchez@web.com.mx" vs. "ashapiro@gwep.com.mx"/"vsanchez@gwep.com.mx")' },
  ],

  plan_mediano: [
    { accion: 'Implementar Plan Call Center para monitoreo en tiempo real', responsable: 'Dan Domínguez + Comercial', criterio: 'Pasar de detección de problemas en meses (como este análisis) a días' },
    { accion: 'Activar sesión de descubrimiento para IA de Voz fuera de horario', responsable: 'Dan Domínguez + cliente', criterio: 'Captura de leads en el 27% del tráfico que ocurre en fin de semana; ya validado técnicamente por el cliente' },
    { accion: 'Cerrar la corrección de plan (CE → VyC) y cotizar formalmente el impacto en la factura mensual', responsable: 'Dan Domínguez + Comercial', criterio: 'Acuerdo firmado, presentado en la misma conversación que la propuesta de IA' },
  ],

  plan_estrategico: [
    { accion: 'Evaluar consolidación completa de llamadas salientes (migración de CloudTalk)', responsable: 'Dan Domínguez + cliente', criterio: 'Reporte unificado de todo el ciclo de llamada por proyecto; condicionado por el cliente a que Callpicker demuestre valor primero' },
    { accion: 'Establecer reporte recurrente de tasa de pérdida por línea/campaña como entregable periódico', responsable: 'Dan Domínguez', criterio: 'Conversación de ROI de marketing sostenida con datos propios, no con auditorías puntuales' },
    { accion: 'Formalizar planes independientes con facturación separada por proyecto, actualizando tarifas legacy a precios vigentes', responsable: 'Dan Domínguez + Comercial', criterio: 'Mayor claridad administrativa para el cliente y vía natural de expansión de cuenta' },
  ],

  areas_oportunidad: [
    { area: 'Corrección de plan (CE → VyC)',                    impacto: 'Alta — abre la conversación comercial',                        responsable: 'Confirmado por KAM (Daniel Martínez Loyola)' },
    { area: 'Revisión de enrutamiento SIP/fijo vs. celular',     impacto: 'Media-Alta — ahorro estimado 81 min/mes',                       responsable: 'Derivado del análisis de datos' },
    { area: 'IA de Voz — atención fuera de horario',             impacto: 'Alta',                                                          responsable: 'Solicitado por el cliente' },
    { area: 'Sesión de descubrimiento IA de Voz',                impacto: 'Alta — precede a la implementación',                            responsable: 'Requisito técnico (Callpicker)' },
    { area: 'Plan Call Center',                                  impacto: 'Alta',                                                          responsable: 'Solicitado por el cliente' },
    { area: 'Planes independientes por proyecto',                impacto: 'Media-Alta',                                                    responsable: 'Solicitado por el cliente' },
    { area: 'Regularización de accesos administrativos',         impacto: 'Media — gobernanza de cuenta',                                  responsable: 'Acordado en próximos pasos' },
    { area: 'Evaluación de consolidación de salientes',          impacto: 'Media — depende del cliente',                                   responsable: 'En evaluación por el cliente' },
    { area: 'Reporte recurrente por línea/campaña',              impacto: 'Alta — resuelve el hallazgo de mayor impacto económico',        responsable: 'Derivado del análisis de datos' },
  ],

  perfiles: [
    {
      nombre: 'Daniel Martínez Loyola',
      rol:    'KAM Callpicker — confirmó los hallazgos de facturación',
      color:  '#2563eb',
      campos: [
        { label: 'Confirmación clave', value: 'GWEP factura Comunicación Empresarial (CE) pero opera con capacidades de Visibilidad y Control (VyC)' },
        { label: 'Aporte adicional',   value: 'Confirmó que el MRR ($6,657 MXN/mes) es la suma de varias facturas separadas, algunas en tarifas legacy' },
        { label: 'Relevancia',         value: 'Convierte la discrepancia de plan de una hipótesis a un hallazgo confirmado internamente' },
      ],
    },
    {
      nombre: 'Dan Domínguez',
      rol:    'Asesor de cuenta Callpicker',
      color:  '#0EA5E9',
      campos: [
        { label: 'Sesión informativa', value: '19 de agosto de 2026 — recogió el interés del cliente en consolidación, IA de Voz y monitoreo en tiempo real' },
        { label: 'Dato aportado',      value: 'La IA de Voz requiere bolsa de minutos consumibles y sesión de descubrimiento con costo adicional (monto sin definir aún)' },
        { label: 'Acción inmediata',   value: 'Verificar Jardines AARU y Tepic, y abrir la conversación de corrección de plan como entrada a la propuesta de IA' },
      ],
    },
    {
      nombre: 'José Manuel L.',
      rol:    'Identificó los hallazgos iniciales — facturación y cobertura de líneas',
      color:  '#7c3aed',
      campos: [
        { label: 'Hallazgo 1',    value: 'Detectó primero la discrepancia entre plan facturado y plan operado, después confirmada por el KAM' },
        { label: 'Hallazgo 2',    value: 'Notó que Tepic no aparecía en el listado de DIDs — el cruce con el histórico de llamadas confirmó el problema' },
        { label: 'Aporte de datos', value: 'Compartió el listado de las 7 entidades y el DID list usado para el mapeo de líneas de este análisis' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      '8 años de antigüedad (cliente desde marzo 2018), pagos al corriente, sin incidencias.',
      'Tasa de pérdida global en mejora sostenida (28.5% → 12.8% en 8 meses).',
      'Integración con HubSpot construida por el propio cliente usando capacidad de API — señal de madurez técnica interna.',
      'Enrutamiento multi-proyecto ya configurado y funcionando para 5 de las 7 entidades.',
    ],
    oportunidades: [
      'Interés explícito y reciente en consolidar CloudTalk + Callpicker.',
      'Corrección de plan (CE → VyC) como puerta de entrada a la propuesta de IA, ya identificada por José Manuel L. y confirmada por el KAM.',
      'IA de Voz para fuera de horario, ya validada técnicamente por el cliente.',
      'Plan Call Center con monitoreo en tiempo real, solicitado por el cliente.',
    ],
    debilidades: [
      '2 de 7 entidades facturadas (Jardines AARU, Tepic) sin una sola llamada registrada en 8 meses — causa aún no determinada.',
      '29.9% de pérdida en la línea de mayor volumen e inversión publicitaria (Rev 1292).',
      'Facturación incorrecta: plan CE facturado vs. VyC operado, confirmado internamente.',
      '650 min/8 meses de consumo evitable de bolsa de minutos por enrutamiento a celular en vez de SIP/fijo.',
      '87% de llamadas sin evaluación de calidad y 100% sin nota o etiqueta de seguimiento.',
    ],
    amenazas: [
      'CloudTalk ya es una alternativa instalada: si Callpicker no propone primero, el cliente puede consolidar hacia el competidor.',
      'El ROI de marketing del cliente está comprometido por llamadas perdidas que hoy nadie está midiendo activamente.',
      'Corregir la facturación sin una propuesta de valor en la misma conversación puede leerse como "cobrar más" en vez de "ordenar la cuenta".',
    ],
  },

  conclusion:
    'GWEP es una cuenta madura en permanencia (8 años, pagos al corriente) pero inmadura en gobierno de datos: el cliente confía en la plataforma, pero la usa solo como tubería de llamadas, no para tomar decisiones. ' +
    'El riesgo no es de cancelación (Health Score 60/100, cliente estable), sino de fuga de valor no capturado: cada mes sin corregir "Rev 1292" y sin visibilidad de calidad, el cliente sigue pagando marketing que no se convierte, sin saberlo con precisión. ' +
    'El cliente ya trajo la mitad de la conversación a la mesa — consolidación, IA de voz, monitoreo — la oportunidad es cerrarla antes de que la abra un competidor.',

  pierde: [
    '~118 llamadas perdidas en 8 meses en la línea de mayor inversión publicitaria — gasto de marketing ya realizado que no se convierte ni en contacto.',
    'Hasta 650 minutos de bolsa de minutos en 8 meses por enrutamiento a celular en vez de SIP/fijo.',
    'Visibilidad de calidad: sin evaluación en 87% de las llamadas, el cliente no puede saber qué pasó dentro de cada conversación.',
    'La oportunidad de ser quien propone primero la consolidación, si CloudTalk se adelanta con una oferta competitiva.',
  ],

  gana: [
    'Credibilidad de Callpicker como partner estratégico al presentar un análisis que cuantifica lo que el cliente ya intuía en la sesión del 19 de agosto.',
    'Apertura para una conversación ampliada: corrección de plan + IA de Voz + Call Center en una sola mesa.',
    'Una cuenta con demanda activa — no venta en frío — que ya solicitó 3 de las soluciones del portafolio.',
    'Evidencia propia (mejora de -15.7 puntos en pérdida) para argumentar que invertir en resolver lo que falta funciona.',
  ],

  recomendacion_central:
    'Abrir con la corrección de plan (CE → VyC) enmarcada como "poner la cuenta en orden" — respaldada por el dato de consumo por celular (74%) — y usar esa misma conversación para presentar la propuesta de IA de Voz. ' +
    'Es la secuencia ya validada internamente por José Manuel L. y Daniel Martínez Loyola, y la palanca de mayor apalancamiento identificada en este ciclo.',

  documentos: [
    {
      nombre:      'GWEP - Reporte de Análisis de Llamadas Entrantes y Salientes',
      ruta:        '/auditorias/GWEP_Reporte_Analisis_Llamadas.docx',
      descripcion: 'Análisis de 1,300 llamadas entrantes (2 ene - 19 ago 2026). Fuga en línea de mayor inversión publicitaria, discrepancia de plan CE/VyC confirmada por KAM, y 2 de 7 entidades sin tráfico registrado.',
    },
  ],
}
