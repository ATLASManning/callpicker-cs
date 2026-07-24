import type { AuditoriaCase } from './types'

export const SAMALAB: AuditoriaCase = {
  id: 'samalab',
  asesor: 'Fátima',
  nombre: 'SAMALAB',
  sector: 'Salud – Centro Radiológico / Estudios de Imagen',
  fecha_periodo: 'Marzo 2024 – Junio 2026',
  fecha_auditoria: 'Jun 2026',
  tipo_cliente: 'Mid-Market – 10 sucursales · Mediana empresa (51-150 personas)',
  descripcion_contexto: 'CID 156135 · Auditoría Maestra Definitiva · AV pausado 11 jun · Convenio de pago activo $27,906.29',
  estado: 'en_riesgo',
  clasificacion: 'CONFIDENCIAL',
  version: 'MAESTRA — Incluye respuesta del cliente y convenio de pago',

  kpis: [
    { label: 'Monto en convenio',     value: '$27,906',   color: '#ef4444' },
    { label: 'Score del AV',          value: '6.3 / 10',  color: '#f59e0b' },
    { label: 'Tools bloqueadas',      value: '180',       color: '#ef4444' },
    { label: 'Estado del AV',         value: 'PAUSADO',   color: '#6366f1' },
  ],

  resumen_ejecutivo: 'SAMALAB (CID 156135) — Centro Radiológico con 10 sucursales — contrató el Agente Virtual de Callpicker en mayo 2025. El AV fue puesto en producción el 20 marzo 2026 y pausado el 11 junio 2026 tras la Opción A elegida por Ari (Araceli Vergara) el 9 jun.\n\nESTADO AL 19 JUNIO 2026: Convenio de pago activo por $27,906.29 MXN en 2 parcialidades + 1 abierta (ajuste de $3,480 aplicado por Toño el 16 jun). Pago 1: $13,953.15 antes del 30 jun. Pago 2: $13,953.14 antes del 31 jul.\n\nEXPOSICIÓN CONTRACTUAL CONFIRMADA el 17 jun por Monse: la propuesta de $38,280 (12 nov 2025) no menciona el costo operativo mensual del AV, el modelo de saldo ni los excedentes. La negociación comercial fue por WhatsApp — sin respaldo escrito. El cliente firmó entendiendo que su inversión era $38,280. El consumo en 3 meses superó ese monto.\n\nREUNIÓN INTERNA 19 JUN (Joaquín + Monse + Ignacio + José Manuel): postura acordada — el consumo es real, el convenio diferido es la solución correcta, la comunicación fue incompleta y se documenta como lección de proceso. La grabación de la llamada Monse-Ari del 21 abr es la única evidencia de comunicación comercial sobre el modelo de cobro.\n\nCUENTA BASE activa: $2,067/mes telefonía operando normalmente. La puerta de reactivación sigue abierta cuando el CRM del cliente esté listo.',

  resultado_positivo: 'El AV funcionó operativamente: tono alto, 0 fallas técnicas, 251 transferencias exitosas sin ninguna fallida. Ari sigue respondiendo con profesionalismo. El convenio de pago activo demuestra disposición a resolver. La reunión interna del 19 jun produjo postura unificada. "SAMALAB puede volver" — cuando el CRM esté listo, Callpicker tiene propuesta técnica lista y relación preservada.',

  hallazgos: [
    'CRÍTICO — Exposición contractual CONFIRMADA (17 jun 2026): la propuesta de $38,280 (Monse, 12 nov 2025) no menciona el costo operativo mensual del AV, la tarifa por minuto (~$3/min), el modelo de saldo ni la ausencia de tope automático. La negociación fue por WhatsApp — Monse lo confirma por correo. El cliente firmó sin saber que pagaría $14,500–$31,000 adicionales cada mes. El gasto total al cliente llegó a ~$89,430 MXN vs. $38,280 firmados (2.3x).',
    'CRÍTICO — La ÚNICA comunicación verbal del modelo de cobro fue la llamada Monse→Ari del 21 abr 2026 (día 32 de operación, AV ya al 206% del plan). Monse mencionó el plan $3K/1,000 min pero NO explicó el excedente ni el costo por minuto. Además afirmó incorrectamente: "Ahorita lo que ustedes están pagando solamente es el desarrollo" — inexacto, el AV ya consumía saldo desde el 20 mar. Ari entendió: "me indicó que nos esperáramos a terminar el mes para saber cuánto sería el total, sin saber exactamente cómo era la modalidad de pago."',
    'CRÍTICO — El dato para anticipar el escalamiento estaba en Zoho desde el 4 mar 2025: "1,895 llamadas de entrada en noviembre" — registrado por el propio ejecutivo comercial. 1,895 × 4 min × $3 = $22,740 MXN/mes estimado. Nadie conectó ese dato con el costo del servicio antes de venderlo. La comisión se calculó sobre $3,000. El problema lo absorbió SAC.',
    'ALTO — 180 tools bloqueadas (41.6% del total ATC) detectadas 11 semanas después del lanzamiento. El AV respondía "No encontramos el estudio solicitado" por sinónimos no registrados. Sin monitoreo activo post-lanzamiento. Score 6.3/10 — recuperable con correcciones del motor de búsqueda.',
    'ALTO — CRM del cliente en desarrollo no documentado como Fase 2 en la propuesta. Jonathan identificó el CRM en el Discovery (5 jun 2025) pero se implementó Google Calendar como "demostración" (explícitamente marcado así). El cliente nunca vio documentado que el AV colisionaría con su CRM.',
    'ALTO — Jorge Negrete (ejecutivo comercial original) no fue notificado ni involucrado durante 69 días de crisis activa. 0 registros en Zoho desde el cierre. La oportunidad pasó de "Cierre Perdido" 273 días a "Contrato Firmado - Cierre Logrado" directamente, sin etapas intermedias ni entregables.',
    'SISTÉMICO — El mismo patrón activo en Salud y Hogar, LABSUS y Finsus. David Avilés: "De todos los agentes virtuales que tenemos, por ninguno prevalece." — "A fin de año: ¿cuántos agentes hiciste? Veinte. ¿De esos veinte, cuántos están vivos? Dos."',
  ],

  cronologia: [
    { fecha: 'Mar 2024',       responsable: 'Jorge Negrete',              evento: 'Activación de cuenta SAMALAB en #ventas-activaciones.', tipo: 'ok' },
    { fecha: 'May 2024',       responsable: 'Enrique Gudiño',             evento: 'Ticket cerrado CID 156135. Manuel Díaz como contacto principal.', tipo: 'ok' },
    { fecha: 'Oct 2024',       responsable: 'Pablo Soto',                 evento: 'Portabilidad normal ID 15613. Estatus final desconocido.', tipo: 'neutral' },
    { fecha: 'Nov 2024',       responsable: 'Jorge Negrete',              evento: '1,895 llamadas entrantes registradas en Zoho — dato nunca usado para estimar consumo del AV ($22,740/mes estimable).', tipo: 'problema' },
    { fecha: 'Ene 2025',       responsable: 'Ignacio Rugerio',            evento: 'Registra objetivo de upsale en Zoho.', tipo: 'ok' },
    { fecha: 'Feb 2025',       responsable: 'Sistema Zoho',               evento: 'Oportunidad: Calificación → Cierre Perdido → Calificación en 14 minutos. Sin criterio de cambio de etapa.', tipo: 'problema' },
    { fecha: 'Mar 2025',       responsable: 'Jorge Negrete',              evento: 'Detecta que Manuel Díaz ya no labora en SAMALAB. Nuevo contacto: Faviola Sánchez.', tipo: 'neutral' },
    { fecha: 'May 2025',       responsable: 'Jorge Negrete',              evento: 'SAMALAB paga sesión de Discovery $5,000 MXN.', tipo: 'ok' },
    { fecha: '5 Jun 2025',     responsable: 'Jonathan / Guillermo',       evento: 'Sesión de Discovery: acuerdo Google Sheets + 10 calendarios. CRM del cliente en desarrollo. Sin estimación de consumo mensual.', tipo: 'ok' },
    { fecha: '3 Jul 2025',     responsable: 'Zoho',                       evento: 'Oportunidad en "Cierre Perdido" — 273 días sin actividad documentada.', tipo: 'problema' },
    { fecha: '10 Nov 2025',    responsable: 'David Avilés',               evento: 'Estimación técnica: 38 hrs, 2 semanas, Google Sheets + Google Calendar (demostración). Sin mención de costo mensual del AV.', tipo: 'ok' },
    { fecha: '12 Nov 2025',    responsable: 'Monse / Jorge',              evento: 'Propuesta comercial $38,280 enviada por WhatsApp. Sin mención de costo operativo mensual del AV ni modelo de saldo.', tipo: 'problema' },
    { fecha: 'Ene 2026',       responsable: 'David Avilés',               evento: 'Desarrollo iniciado. Retrasos previos por falta de información del cliente (6 meses).', tipo: 'neutral' },
    { fecha: '2 Abr 2026',     responsable: 'Monserrat / Jorge',          evento: 'Cierre Logrado en Zoho. Valor: $3,000. Sin documentar modelo de saldo.', tipo: 'problema' },
    { fecha: '20 Mar 2026',    responsable: 'David Avilés',               evento: 'AV Sama ATC puesto en producción. Etapa 1 entregada. Técnicamente correcta.', tipo: 'ok' },
    { fecha: '23 Mar 2026',    responsable: 'SAMALAB',                    evento: 'AV no identifica sucursales Texcoco. Error no resuelto antes de la suspensión.', tipo: 'problema' },
    { fecha: '21 Abr 2026',    responsable: 'Monse → Ari',               evento: 'Llamada telefónica: Monse menciona plan $3K/1,000 min. NO explica excedente ni costo por minuto. Afirma incorrectamente "solo están pagando el desarrollo". Única comunicación verbal sobre el modelo de cobro — cuando el AV ya estaba al 206%.', tipo: 'problema' },
    { fecha: '22 Abr 2026',    responsable: 'Ari',                        evento: 'Primera solicitud de baja de extensión adicional. Sin procesar — tardó casi 2 meses.', tipo: 'problema' },
    { fecha: '19 May 2026',    responsable: 'Ari',                        evento: 'Reporte de variaciones en factura: $3,480 → $10,819 → $20,044. Primera señal de alarma.', tipo: 'problema' },
    { fecha: '23 May 2026',    responsable: 'AV / Catálogo',              evento: 'Incidencia: AV cotizó $3,370 por "tomografía contrastada" inexistente. ID 3479054742. Resuelta.', tipo: 'problema' },
    { fecha: '28 May 2026',    responsable: 'Daniel / David',             evento: 'Reunión Ingeniería + Activaciones. Consumo real confirmado: 4,841 min/mes ≈ $14,500.', tipo: 'pivote' },
    { fecha: '29 May 2026',    responsable: 'David Avilés',               evento: 'Estimación formal 12 hrs para reconfiguración del AV. No aprobada — sin presupuesto del cliente.', tipo: 'problema' },
    { fecha: '3 Jun 2026',     responsable: 'Daniel / Fathom',            evento: 'Reporte ATC: 433 llamadas · 49% objetivo · 180 tools bloqueadas · Score 6.3. Datos revelados 11 semanas post-lanzamiento.', tipo: 'problema' },
    { fecha: '9 Jun AM',       responsable: 'José Manuel / David / Daniel', evento: 'Reunión interna SAC + Ingeniería: decisión de suspender el AV.', tipo: 'pivote' },
    { fecha: '9 Jun AM',       responsable: 'José Manuel / Daniel / Ari', evento: 'Reunión con Ari: AV choca con CRM en desarrollo. Sin presupuesto para mejoras. Se presentan Opción A (pausa) y Opción B.', tipo: 'pivote' },
    { fecha: '9 Jun PM',       responsable: 'Ari',                        evento: 'Confirma Opción A por correo: pausa del AV + baja de extensión adicional. Decisión escrita formal.', tipo: 'ok' },
    { fecha: '9 Jun PM',       responsable: 'Ari',                        evento: 'Reporta nueva factura $31,386.29 y que el contrato no menciona el modelo de saldo. Exposición contractual activada.', tipo: 'problema' },
    { fecha: '11 Jun 2026',    responsable: 'José Manuel',                evento: 'Confirma a Ari: AV pausado, baja registrada, factura "en revisión a la brevedad". Revisión no completada en 48 hrs comprometidas.', tipo: 'neutral' },
    { fecha: '16 Jun 2026',    responsable: 'Ari',                        evento: '7 días sin respuesta de Callpicker. Fecha límite de pago. Pide convenio urgente.', tipo: 'problema' },
    { fecha: '16 Jun 2026',    responsable: 'Toño del Río',               evento: 'Aplica ajuste: elimina cargo saldo AV base $3,480. Nuevo monto: $27,906.29. Genera liga de pago.', tipo: 'ok' },
    { fecha: '16 Jun 2026',    responsable: 'José Manuel',                evento: 'Envía desglose de consumo + convenio de pago 2+1 parcialidades a Ari.', tipo: 'ok' },
    { fecha: '17 Jun 2026',    responsable: 'Monse',                      evento: 'Confirma: negociación original fue por WhatsApp, sin correo. Adjunta propuesta $38,280 (12 nov 2025) y estimación técnica. Ningún documento menciona el costo mensual del AV.', tipo: 'problema' },
    { fecha: '19 Jun 2026',    responsable: 'Joaquín + Monse + Ignacio + JM', evento: 'Reunión interna: se revisa evidencia. Grabación llamada 21 abr como única prueba de comunicación comercial. Postura acordada: consumo real, convenio diferido es la solución, comunicación fue incompleta.', tipo: 'pivote' },
  ],

  perfil_campos: [
    { label: 'Razón social / RFC',    value: 'Laboratorios SAMALAB · RFC: CRS2301264SA · CID 156135' },
    { label: 'Actividad',             value: 'Centro Radiológico de Estudios Especiales · 10 sucursales' },
    { label: 'Segmento',              value: 'Mediana empresa (51-150 personas) · Sector salud' },
    { label: 'Sucursales',            value: 'Colón, Juárez, 2 Marzo, Teotihuacán, Otumba, Acolman, Calpulalpan, Nanacamilpa, Texmelucan, Chimalhuacán' },
    { label: 'Contacto principal',    value: 'Araceli Vergara (Ari) · servicioaclientes@lmsamalab.com.mx · +52 55 1329 1680' },
    { label: 'KAM asignada',          value: 'Fátima González — 0 registros post-cierre. Seguimiento mensual requerido.' },
    { label: 'MRR base activo',       value: '$2,067 MXN/mes · 3 Extensiones VyC IL (telefonía operando)' },
    { label: 'Monto en convenio',     value: '$27,906.29 MXN · Pago 1 antes 30 jun · Pago 2 antes 31 jul' },
    { label: 'Total pagado/proceso',  value: '~$89,430 MXN vs. $38,280 firmados (2.3× la propuesta)' },
    { label: 'Estado del AV',         value: 'PAUSADO desde 11 jun 2026 · Reactivación: cuando CRM del cliente esté listo' },
  ],

  necesidad_negocio: 'SAMALAB contrató el Agente Virtual para automatizar la atención telefónica en 10 sucursales: recibir solicitudes de estudios radiológicos, cotizar en tiempo real desde su catálogo y agendar citas. El objetivo implícito — identificado en el Discovery pero no documentado en el alcance — era la integración con el CRM interno del cliente (en desarrollo al momento de la venta).\n\nEl cliente tenía 1,895 llamadas/mes en noviembre 2024 — dato capturado en Zoho. Proyectado al modelo del AV: $22,740/mes. Nadie en el proceso comercial hizo ese cálculo. El plan base vendido fue $3,000/mes (~1,000 min). El consumo real del primer período analizado fue 7,838 min ≈ $23,514.',

  potencial_corto: [
    'Confirmar aceptación del convenio por Ari ($27,906.29 en 2+1 parcialidades)',
    'Generar ligas de pago formales cuando Ari confirme',
    'Joaquín autoriza no suspender el servicio base mientras el convenio esté activo',
    'Revisar contrato con Joaquín — posición ante exposición contractual confirmada',
    'Baja de extensión adicional — fecha exacta de aplicación confirmada a Ari',
  ],
  potencial_largo: [
    'Reactivación AV ↔ CRM cuando el sistema interno de SAMALAB esté listo',
    'Ejecutivo de Satisfacción post-lanzamiento implementado desde el día 1',
    'SAMALAB como caso de rescate documentado — retorno después de crisis de confianza',
    'Piloto del Ejecutivo de Satisfacción ya autorizado: Frisa + TEC de Monterrey',
  ],

  tacticas: [
    { nombre: 'Llamada Monse-Ari 21 abr 2026',      descripcion: 'La única evidencia de comunicación comercial sobre el modelo de cobro. Monse mencionó el plan $3K/1,000 min — pero NO explicó el excedente ni dijo que el consumo continúa sin tope. Además afirmó: "Ahorita lo que ustedes están pagando solamente es el desarrollo" — inexacto, el AV ya consumía desde el 20 mar.', impacto: 'Callpicker SÍ hizo comunicación verbal parcial. El excedente no fue explicado. La intervención fue reactiva (AV al 206%) y no preventiva. Sin correo de seguimiento post-llamada.' },
    { nombre: 'Postura acordada 19 jun (interna)',   descripcion: 'Joaquín + Monse + Ignacio + José Manuel acordaron: el consumo es real, está respaldado por datos (7,838 min × $3). La comunicación fue incompleta. El convenio de pago diferido es la forma correcta de resolver sin absorber un costo generado por uso real.', impacto: 'Postura unificada. Ningún actor de Callpicker contradice. La resolución es el convenio — no el descuento.' },
    { nombre: 'Paciencia histórica del cliente',     descripcion: 'Ari esperó 6 meses para que el cliente entregara información del catálogo. Nunca abandonó el diálogo ni durante la crisis. Eligió Opción A (pausa) no cancelación. Solicita convenio en lugar de disputa.', impacto: 'Alta tolerancia. Disposición a resolver. Señal: el cliente quiere que funcione — no quiere perder la inversión.' },
  ],
  senal_alarma: 'Si el convenio de pago no se formaliza con ligas concretas antes del 30 jun, Ari entra a su fecha límite sin instrumento de pago claro. La cuenta se pierde definitivamente. El silencio ya costó 7 días (11-16 jun) — no puede repetirse.',

  problema_raiz: 'Proceso comercial roto en 7 eslabones — desde la estimación de preventa hasta el seguimiento post-lanzamiento',
  problema_raiz_detalle: '"SAMALAB no se perdió porque el producto falle. Se perdió porque el proceso que lo rodea no tiene los filtros necesarios para asegurar que el cliente entienda lo que compra, que el contrato documente lo que se cobra, y que alguien en Callpicker esté al tanto de cómo va el servicio."\n\n7 eslabones rotos: (1) Estimación de consumo en preventa — el dato de 1,895 llamadas/mes estaba en Zoho y nunca se usó; (2) Comunicación del modelo incompleta y tardía — llamada 21 abr al día 32, sin explicar excedente; (3) CRM en desarrollo no documentado como Fase 2; (4) Sin seguimiento post-lanzamiento — 180 bloqueos detectados en semana 11; (5) Sin área de precios centralizada — Comercial es juez y parte; (6) Proceso Zoho sin criterio de etapas — "Cierre Perdido" 273 días → "Contrato Firmado" directamente; (7) Sin comunicación formal de cambios técnicos al cliente.',

  flujo_real: [
    { fase: '1. Preventa sin estimación de consumo',  area: 'Jorge Negrete (Ventas)',        accion: 'Vendió AV sin verificar volumen de llamadas (1,895/mes en Zoho) ni estimar costo mensual real', resultado: 'Plan $3K/mes para cliente con 4,841 min/mes de consumo real. Expectativa 10x menor al costo real.' },
    { fase: '2. Propuesta sin costo operativo',        area: 'Monse / Jorge (nov 2025)',      accion: 'Propuesta $38,280 enviada por WhatsApp sin mencionar consumo mensual del AV, modelo de saldo ni tarifa por minuto', resultado: 'Cliente firmó sin saber que pagaría $14,500–$31,000 adicionales cada mes. Exposición contractual activa.' },
    { fase: '3. CRM no contemplado en alcance',        area: 'Jonathan (Discovery)',           accion: 'CRM del cliente en desarrollo identificado en Discovery pero no documentado como Fase 2 en la propuesta comercial', resultado: 'AV implementado con Google Calendar ("demostración") colisionó con el objetivo real del cliente.' },
    { fase: '4. Comunicación tardía y parcial',        area: 'Monse (21 abr 2026)',           accion: 'Primera comunicación verbal del modelo de cobro cuando el AV ya estaba al 206%. Sin explicar excedente ni costo/min. Frase incorrecta: "solo están pagando el desarrollo."', resultado: 'Ari entendió "espera al fin de mes" — nunca comprendió el modelo de saldo ni el riesgo de excedentes.' },
    { fase: '5. Sin monitoreo post-lanzamiento',       area: 'Ingeniería / SAC / KAM',       accion: 'AV operó 11 semanas sin seguimiento activo. 180 bloqueos de catálogo acumulados sin detectarse.', resultado: 'Score 6.3/10. 49% de objetivo logrado. Problemas solucionables con proceso nunca se resolvieron.' },
    { fase: '6. Respuesta tardía a señales de alarma', area: 'SAC / Comercial',              accion: 'Baja de extensión (22 abr) no procesada 2 meses. Respuesta a Ari sobre contrato prometida en 48 hrs — tardó 7 días.', resultado: 'Acumulación de fricciones. Cliente que busca soluciones mientras Callpicker no responde.' },
    { fase: '7. Convenio activo — resolución en curso', area: 'Toño / José Manuel / Joaquín', accion: 'Ajuste $3,480 aplicado el 16 jun. Convenio 2+1 parcialidades enviado a Ari. Postura interna acordada el 19 jun.', resultado: 'Convenio pendiente de confirmación por Ari. Relación preservada. Puerta de reactivación abierta.' },
  ],

  comparativo: [
    { metrica: 'Consumo estimado en preventa',       real: 'No realizado — plan $3,000/mes',          ideal: 'Estimación con datos Zoho: 1,895 llamadas × 4 min × $3 = $22,740/mes' },
    { metrica: 'Costo total al cliente (3 meses)',   real: '~$89,430 MXN (pagado + en convenio)',     ideal: '$38,280 MXN — lo que el cliente firmó' },
    { metrica: 'Monto en convenio',                  real: '$27,906.29 MXN (ajuste ya aplicado)',     ideal: 'Comunicación del modelo desde el día 1 → sin sorpresa' },
    { metrica: 'Score del AV',                       real: '6.3 / 10 — 49% objetivo logrado',        ideal: 'Meta mínima 8.0 / 10 — 80% objetivo con Ejecutivo de Satisfacción' },
    { metrica: 'Tools bloqueadas',                   real: '180 — detectadas semana 11',              ideal: '0 en primeras 2 semanas con monitoreo activo post-lanzamiento' },
    { metrica: 'Modelo de saldo en propuesta',       real: 'No mencionado — exposición confirmada',   ideal: 'Cláusula explícita: tarifa ~$3/min, sin tope automático, con excedente documentado' },
  ],

  plan_inmediato: [
    { accion: 'Joaquín autoriza no suspender el servicio base mientras el convenio esté activo', responsable: 'Joaquín', criterio: 'Autorización hoy — sin esto, no hay marco de cobro activo.' },
    { accion: 'Ari confirma aceptación del convenio $27,906.29 (2+1 parcialidades)', responsable: 'Ari / José Manuel', criterio: 'Respuesta esperada esta semana. Si no confirma, contacto proactivo.' },
    { accion: 'Toño genera ligas de pago para las 2 parcialidades al confirmar Ari', responsable: 'Toño del Río', criterio: 'Ligas en < 24 hrs post-confirmación de Ari.' },
    { accion: 'Revisar contrato firmado — verificar cláusula de modelo de saldo', responsable: 'Joaquín + José Manuel', criterio: 'VENCIDO 7 días. Revisión y posición formal urgente.' },
    { accion: 'Confirmar baja de extensión adicional — fecha exacta de aplicación', responsable: 'Soporte / Toño', criterio: 'Confirmación a Ari esta semana.' },
  ],
  plan_mediano: [
    { accion: 'Sesión con Nacho y Ricardo: protocolo de ventas AV con puntos de control obligatorios', responsable: 'José Manuel + Joaquín', criterio: 'Sesión próxima semana. Protocolo firmado. Área de precios en diseño.' },
    { accion: 'Implementar piloto del Ejecutivo de Satisfacción — Frisa (chat) y TEC de Monterrey (Salesforce)', responsable: 'David + SAC', criterio: 'Piloto activo esta semana. Métricas definidas.' },
    { accion: 'Auditar todas las cuentas activas de AV — identificar casos similares a SAMALAB', responsable: 'Daniel Martínez + SAC', criterio: 'Auditoría esta semana. Salud y Hogar como prioritaria.' },
    { accion: 'Formalizar protocolo: verificar volumen de llamadas antes de vender AV (Ricardo ya incorporando)', responsable: 'Ricardo + Producto', criterio: 'Requisito no negociable en todas las ventas de AV desde esta semana.' },
  ],
  plan_estrategico: [
    { accion: 'Fátima González — contacto mensual con Ari: seguimiento del CRM interno de SAMALAB', responsable: 'Fátima González', criterio: 'Primera llamada semana post-resolución del convenio. SAMALAB no se abandona.' },
    { accion: 'Cuando el CRM de SAMALAB esté listo: propuesta de integración AV ↔ CRM con Ejecutivo de Satisfacción desde el día 1', responsable: 'David Avilés + Joaquín + SAC', criterio: 'Propuesta lista en < 5 días hábiles desde que el cliente notifique.' },
    { accion: 'Crear criterio centralizado de precios para AV — Comercial no puede seguir siendo juez y parte', responsable: 'Dirección + Finanzas', criterio: 'Propuesta de estructura de precios presentada a Dirección este trimestre.' },
    { accion: 'Documentar SAMALAB como caso de lecciones aprendidas y difundir a Ventas, Ingeniería y SAC', responsable: 'VP SAC + José Manuel', criterio: 'Documento distribuido en sesión de liderazgo próxima semana.' },
  ],

  areas_oportunidad: [
    { area: 'Ejecutivo de Satisfacción post-lanzamiento',              impacto: '180 bloqueos detectados en semana 11 → habrían sido detectados en semana 1. Previene el próximo SAMALAB.', responsable: 'David + SAC (piloto: Frisa y TEC)' },
    { area: 'Documentar modelo de saldo en todos los contratos de AV', impacto: 'Elimina la exposición contractual. El cliente no puede alegar que no lo sabía.', responsable: 'Legal + Comercial — revisión urgente' },
    { area: 'Reactivación SAMALAB cuando CRM esté listo',              impacto: 'Cliente con catálogo actualizado, CRM integrado y proceso mejorado = caso de éxito real.', responsable: 'Fátima + David + Joaquín' },
    { area: 'Área de precios centralizada para el AV',                  impacto: 'Elimina discrepancias entre vendedores. Alineación de expectativas desde la preventa.', responsable: 'Dirección + Finanzas (este trimestre)' },
  ],

  perfiles: [
    {
      nombre: 'Ari (Araceli Vergara)', rol: 'Cliente (SAMALAB) — Contacto principal · Decisora operativa', color: '#3b82f6',
      campos: [
        { label: 'Comportamiento',     value: 'Profesional y documentada. Eligió Opción A por correo. Usó el canal formal durante toda la crisis.' },
        { label: 'Motivación',         value: 'Un AV que funcione para cotizar y agendar en 10 sucursales. Quiere que la inversión tenga ROI.' },
        { label: 'Estado emocional',   value: 'Desilusionada, no hostil. No se negó a pagar — pidió claridad y esquemas accesibles.' },
        { label: 'Señal positiva',     value: 'Eligió pausar, no cancelar. Solicita convenio en lugar de disputa. La puerta no está cerrada.' },
        { label: 'Clave de gestión',   value: 'Formalizar el convenio antes del 30 jun. El silencio vuelve a costar.' },
      ],
    },
    {
      nombre: 'Jorge Negrete (EXT 927)', rol: 'Callpicker — Ejecutivo Comercial original · Cerró el deal', color: '#ef4444',
      campos: [
        { label: 'Rol en el caso',     value: 'Realizó las negociaciones originales. Cerró el deal a $3,000. No documentó el modelo de cobro.' },
        { label: 'Dato clave en Zoho', value: 'Registró 1,895 llamadas/mes en noviembre 2024 — dato nunca utilizado para estimar el consumo.' },
        { label: 'Hallazgo crítico',   value: 'Se le pagó comisión sobre $3,000. El consumo real llegó a $31,386. No fue involucrado en la crisis.' },
        { label: 'Estado',             value: '0 registros en Zoho post-cierre. No fue notificado ni involucrado en 69 días de crisis activa.' },
      ],
    },
    {
      nombre: 'Monserrat Valdéz (929)', rol: 'Callpicker — Ejecutiva de Ventas · Propietaria actual de la oportunidad', color: '#f97316',
      campos: [
        { label: 'Rol en el caso',     value: 'Recibió la cuenta de Jorge Negrete para Discovery. Sin briefing completo del acuerdo previo.' },
        { label: 'Hallazgo clave',     value: 'Propuesta de $38,280 (12 nov 2025) no menciona costo mensual del AV. Negociación fue por WhatsApp — sin correo.' },
        { label: 'Llamada 21 abr',     value: 'Explicó el plan $3K/1,000 min pero NO el excedente. Afirmó incorrectamente: "solo están pagando el desarrollo". Única comunicación verbal sobre el modelo.' },
        { label: 'Confirmado 17 jun',  value: 'Confirma por correo: negociación original fue por WhatsApp. Adjunta propuesta y estimación — ninguna menciona el costo mensual.' },
      ],
    },
    {
      nombre: 'Jonathan (Ingeniería)', rol: 'Callpicker — Discovery & Desarrollo AV Etapa 1', color: '#8b5cf6',
      campos: [
        { label: 'Acierto',            value: 'Discovery bien ejecutado en lo técnico. Documentó que el CRM del cliente estaba en desarrollo. Grabación existe en Drive.' },
        { label: 'Contexto',           value: 'No tenía información sobre el modelo de cobro — no era su responsabilidad. Acordó Google Sheets como solución provisional.' },
      ],
    },
    {
      nombre: 'David Avilés', rol: 'Callpicker — Director de Ingeniería · Responsable técnico del AV', color: '#8b5cf6',
      campos: [
        { label: 'Aciertos',           value: 'Producción técnicamente correcta (20 mar). Estimación 12 hrs bien fundamentada. Propuso suspender + esperar CRM + reactivar con integración nativa — decisión correcta.' },
        { label: 'Diagnóstico propio', value: '"De todos los agentes virtuales que tenemos, por ninguno prevalece." / "A fin de año: cuántos hiciste? Veinte. ¿Cuántos están vivos? Dos."' },
        { label: 'Pendiente',          value: 'Piloto del Ejecutivo de Satisfacción en Frisa esta semana.' },
      ],
    },
    {
      nombre: 'Daniel Martínez (904)', rol: 'Callpicker — Director de Customer Experience · Analista técnico del caso', color: '#22c55e',
      campos: [
        { label: 'Contribución',       value: 'Generó el reporte de consumo real (4,841 min/mes). Detectó anomalía de doble facturación. Propuso Ejecutivo de Satisfacción post-lanzamiento.' },
        { label: 'Pendiente urgente',  value: 'Auditar todas las cuentas activas de AV — identificar casos similares a SAMALAB esta semana.' },
      ],
    },
    {
      nombre: 'José Manuel López (920)', rol: 'Callpicker — Director de Satisfacción al Cliente · Liderazgo de crisis', color: '#f59e0b',
      campos: [
        { label: 'Liderazgo',          value: 'Lideró la reunión con el cliente con datos y transparencia. Generó el análisis forense completo. Coordinó convenio de pago.' },
        { label: 'Frase clave',        value: '"4 años operando sin área de precios centralizada está muy cañón." — señal de problema estructural, no puntual.' },
        { label: 'Postura 19 jun',     value: 'Coordinó reunión interna con Joaquín, Monse e Ignacio. Postura acordada: convenio diferido, reconocimiento de comunicación incompleta.' },
      ],
    },
    {
      nombre: 'Toño del Río (907)', rol: 'Callpicker — Director de Administración', color: '#64748b',
      campos: [
        { label: 'Acción ejecutada',   value: 'Aplicó ajuste $31,386 → $27,906.29 (elimina saldo AV base $3,480) el 16 jun. Generó liga de pago. Respuesta ágil y correcta.' },
        { label: 'Pendiente',          value: 'Generar ligas de pago para las 2 parcialidades cuando Ari confirme el convenio.' },
      ],
    },
    {
      nombre: 'Joaquín', rol: 'Callpicker — Director General · Tomador de decisiones final', color: '#1B3FCC',
      campos: [
        { label: 'Decisiones tomadas', value: 'Postura acordada en reunión 19 jun: convenio diferido es la solución. Subsidio de horas de integración futura por evaluar.' },
        { label: 'Pendientes críticos', value: '(1) Autorizar no suspensión del servicio base mientras convenio activo. (2) Revisión del contrato firmado — cláusula de modelo de saldo. (3) Sesión con Nacho y Ricardo sobre proceso de ventas.' },
      ],
    },
    {
      nombre: 'Fátima González', rol: 'Callpicker — KAM asignada para seguimiento post-pausa', color: '#22c55e',
      campos: [
        { label: 'Registro actual',    value: '0 registros en Zoho post-cierre. No hubo actividad documentada en 11 semanas de operación del AV.' },
        { label: 'Objetivo',           value: 'Contacto mensual con Ari. Detectar cuando el CRM de SAMALAB esté listo para reactivar.' },
        { label: 'Instrucción',        value: 'Primera llamada semana post-resolución del convenio. SAMALAB no se abandona.' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      'Convenio de pago activo $27,906.29 — Ari mantiene el diálogo abierto',
      'Cuenta base telefonía activa y pagando $2,067/mes sin fricción',
      'AV técnicamente funcional: 0 fallas en transferencias, 251 handoffs exitosos',
      'Postura interna unificada desde el 19 jun (Joaquín, Monse, Ignacio, José Manuel)',
      'Ajuste de $3,480 aplicado por Toño con agilidad — gesto visible al cliente',
      'Puerta de reactivación abierta cuando el CRM del cliente esté listo',
      'Grabación de la llamada Monse-Ari 21 abr — evidencia de comunicación parcial del modelo',
    ],
    oportunidades: [
      'Integración AV ↔ CRM cuando el sistema interno esté listo — objetivo original del cliente',
      'Ejecutivo de Satisfacción como diferenciador competitivo para la reactivación',
      'Catálogo de estudios actualizable por el cliente mientras espera — base sólida para Fase 2',
      'SAMALAB como caso de rescate documentado — retorno tras crisis de confianza',
      'Piloto del Ejecutivo de Satisfacción ya autorizado: Frisa + TEC de Monterrey',
    ],
    debilidades: [
      'Exposición contractual CONFIRMADA: propuesta $38,280 no menciona costo mensual del AV',
      'Única comunicación del modelo fue tardía (día 32, AV al 206%) e incompleta (sin excedente)',
      'Sin monitoreo post-lanzamiento: 180 bloqueos detectados 11 semanas después',
      'Sin área de precios centralizada — Comercial sigue siendo juez y parte',
      'Respuesta de 48 hrs prometida a Ari sobre el contrato tardó 7 días',
      'KAM con 0 registros en Zoho durante toda la operación del AV',
    ],
    amenazas: [
      'Si convenio no se formaliza antes del 30 jun, la cuenta se pierde definitivamente',
      'La competencia puede captar a SAMALAB durante la pausa del AV',
      'El mismo patrón activo en Salud y Hogar, LABSUS y Finsus — si no se corrige, hay más casos',
      'La afirmación incorrecta de Monse ("solo están pagando el desarrollo") puede ser usada por el cliente',
      '"De 20 agentes entregados, quedan vivos 2" — riesgo reputacional y económico de línea de producto',
    ],
  },

  conclusion: 'SAMALAB no se perdió porque el producto fallara. Se perdió porque el proceso que lo rodea no tiene los filtros necesarios para asegurar que el cliente entienda lo que compra, que el contrato documente lo que se cobra, y que alguien en Callpicker esté al tanto de cómo va el servicio.\n\nAl 19 de junio 2026: el convenio de pago está enviado ($27,906.29 en 2+1 parcialidades), la postura interna está acordada, el ajuste fue aplicado. Lo que falta es la confirmación formal de Ari antes del 30 jun.\n\nLa puerta de reactivación sigue abierta. Cuando el CRM del cliente esté listo, Callpicker tiene propuesta técnica clara y relación preservada para ejecutarla. Ese es el próximo capítulo de este caso.',

  pierde: [
    'Los $27,906.29 del convenio si Ari no confirma antes del 30 jun',
    'La oportunidad de reactivación cuando el CRM esté listo',
    'La credibilidad ante el cliente si el silencio se repite',
    'La línea de producto AV si el patrón sistémico (Salud y Hogar, LABSUS, Finsus) no se corrige',
  ],
  gana: [
    'Convenio formalizado antes del 30 jun = relación estabilizada y puerta de reactivación abierta',
    'Ejecutivo de Satisfacción implementado = nunca más un SAMALAB',
    'Modelo de saldo documentado en contratos = eliminación de sorpresas de precio',
    'SAMALAB reactivado con CRM integrado = caso de éxito real de rescate',
  ],
  recomendacion_central: 'Dos acciones no delegables esta semana: (1) Joaquín autoriza la no suspensión del servicio base mientras el convenio esté activo; (2) Toño genera las ligas de pago al momento en que Ari confirme. La relación está preservada — lo que la puede romper es un nuevo silencio.',
}
