import type { AuditoriaCase } from './types'

/**
 * NERUC SEDE CENTRAL · C9 · CID 73660 · Erick
 *
 * v2.0 — ACTUALIZACIÓN DEL 26 NOV 2026. La v1.0 auditaba 30 días (26 jun – 25
 * jul) y 8,355 registros de UNA cuenta. Este corte cubre once meses (1 ene –
 * 26 nov) y **las CINCO cuentas del grupo**: 107,386 llamadas (57,965
 * entrantes + 49,421 salientes) y 148,416 minutos.
 *
 * ── LA REESTRUCTURACIÓN QUE PEDÍA LA v1.0 ESTÁ EJECUTADA Y VERIFICADA ───────
 * La v1.0 cerraba con tres peticiones: separar Kia Corregidora en cuenta
 * propia, bajar los DIDs sin tráfico y dimensionar el plan al consumo real.
 * Las tres ocurrieron, y este corte las mide:
 *   · Las 5 cuentas son 5 CIDs reales en Zoho con fechas de migración
 *     verificables número por número.
 *   · El plan de Sede Central quedó en 500 minutos y va al 27.0% en octubre
 *     (135 min) con noviembre proyectado al 23.8%. Bien dimensionado: sin
 *     sobreconsumo y sin sobrepago.
 *   · La caída de minutos de Kia entre agosto y septiembre (8,832 → 3,630
 *     entrantes) es EFECTO DE LA MIGRACIÓN, no una caída de tráfico. Leerla
 *     como deterioro sería el error más fácil de cometer con este corte.
 * Por eso **el titular de la v1.0 —«127.6% de consumo, subestimado en
 * 30.7%»— es HISTÓRICO**. Se conserva en los hallazgos 6 a 10 porque explica
 * por qué se reestructuró, no porque siga vigente.
 *
 * ── TRES COSAS QUE EL DOCUMENTO ENTREGADO TRAE MAL ──────────────────────────
 *
 * 1. **«Fuera de horario / finde 19.5%» SUMA POBLACIONES QUE SE SOLAPAN.** Son
 *    7.7% fuera de 9:00–19:00 (4,438 llamadas) más 11.8% en fin de semana
 *    (6,852). Una llamada del sábado a las 20 h está en los dos cubos, así que
 *    la unión es **HASTA 19.5%**, no 19.5%. Un sábado por la tarde no se puede
 *    contar dos veces. [[feedback-metricas-derivadas-origen]]
 *
 * 2. **LAS 19,801 LLAMADAS NO ATENDIDAS ATRIBUIDAS A CUATRO CUENTAS SON DEL
 *    GRUPO ENTERO.** El documento dice: «De 19,801 llamadas no atendidas en
 *    Neruc One, Sede Central, Vehículos Japoneses Zapata y Automóviles Pro
 *    Snop combinadas, 0 recibieron un callback exitoso». Esas cuatro suman
 *    **1,952** (980 + 509 + 71 + 392); las 19,801 son las cuatro MÁS las
 *    17,849 de Kia, que sí tiene recuperación (789, el 4.4%). El hallazgo de
 *    fondo es cierto —cero recuperación en las cuatro— pero el número está
 *    inflado 10 veces, y con él la gravedad que se le presenta al cliente.
 *    [[feedback-tablas-deben-cerrar]]
 *
 * 3. **EL ASESOR.** El reporte vuelve a nombrar a Claudia Hernández. Erick la
 *    sustituyó el 15 oct 2026, y `cuentas.asesor` y el GRC vigente dicen
 *    Erick. Es el mismo defecto que traen los reportes de ALTERNET (C10) y
 *    Hospital Santa Rosa (C4) del mismo lote: clase de error del generador.
 *    [[erick-sustituye-a-claudia]]
 *
 * ── Y DOS DIFERENCIAS DE FICHA QUE IMPORTAN ────────────────────────────────
 *   · **MRR institucional: $2,433** (GRC, `movimiento 'MRR estable'`, AAA, 10
 *     facturas, 66 meses, $719,029 acumulados). La v1.0 citaba la factura de
 *     agosto, $15,705.21, que era el mundo ANTES de la reestructuración, y
 *     `cuentas.facturacion` sigue en $11,411. La reestructuración recortó el
 *     MRR de esta cuenta cerca del 79%: eso es lo que costó dimensionarla
 *     bien, y hay que decirlo en voz alta antes de celebrar el 27.0% de uso.
 *     [[grc-fuente-zoho]]
 *   · **`cuentas.servicio` sigue diciendo «Calltracking Co-Branding 10,000 min
 *     + 121 DIDs Nacionales + 2 DIDs Internacionales».** El plan real son 500
 *     minutos y el documento mide 23 DIDs activos en el CRM (19 vistos en
 *     oct–nov, 42 en todo el año). La ficha quedó en el mundo de julio.
 *     [[feedback-fuente-unica-cuentas]]
 */
export const NERUC_SEDE_CENTRAL: AuditoriaCase = {
  id:     'neruc-sede-central',
  asesor: 'Erick',

  nombre:               'NERUC Sede Central',
  sector:               'Agencia de Performance Marketing / Reseller Callpicker (Co-Branding)',
  fecha_periodo:        '1 ene – 26 nov 2026 · nov en tránsito',
  fecha_auditoria:      'Nov 2026',
  tipo_cliente:         'Reseller Co-Branding · CID 73660 · C9 · MRR $2,433 (GRC) · grupo de 5 cuentas',
  descripcion_contexto: 'Auditoría de llamadas del GRUPO NERUC · 5 cuentas y 5 CIDs · 107,386 llamadas (57,965 entrantes + 49,421 salientes) · 148,416 minutos · Asesor: Erick',
  estado:               'en_riesgo',
  clasificacion:        'CONFIDENCIAL',
  version:              '2.0',

  /* ── KPIs ─────────────────────────────────────────────────────── */
  kpis: [
    { label: 'Plan de Sede Central',        value: '27.0% de 500 min',       color: '#22c55e' },
    { label: 'Abandono en menú (Kia)',      value: '23.1% · 11,760 al año',  color: '#ef4444' },
    { label: 'Recuperación de perdidas',    value: '4.4% sólo en Kia · 0% en 4', color: '#dc2626' },
    { label: 'MRR institucional (GRC)',     value: '$2,433',                 color: '#6366f1' },
  ],

  /* ── Resumen ejecutivo ────────────────────────────────────────── */
  resumen_ejecutivo:
    'La reestructuración que pedía el corte de agosto está hecha, y este corte la valida: las cinco ' +
    'cuentas corresponden a cinco CIDs reales en Zoho con fechas de migración verificables número por ' +
    'número, y el plan de Sede Central quedó en 500 minutos con un uso del 27.0% en octubre (135 min) y ' +
    'una proyección del 23.8% para noviembre. Bien dimensionado: ni sobreconsumo ni sobrepago.\n\n' +
    'Eso obliga a una advertencia antes de leer cualquier gráfica: la caída de minutos de Kia Corregidora ' +
    'entre agosto y septiembre (8,832 a 3,630 minutos entrantes) es el efecto de la migración a su propio ' +
    'CID, no una caída de tráfico. Leerla como deterioro es el error más fácil de cometer con este ' +
    'documento.\n\n' +
    'El hallazgo que sí es nuevo y grande está en Kia Corregidora: 11,760 de sus 50,915 llamadas ' +
    'entrantes del año (23.1%) se perdieron DENTRO del menú telefónico, antes de llegar con un agente. Es ' +
    'más del doble de su tasa de perdida tradicional (12.0%) y, en volumen, la mayor pérdida de leads de ' +
    'las cinco cuentas juntas. El archivo no dice si es el diseño del IVR, los tiempos de espera o el ' +
    'volumen en horas pico: eso se pregunta.\n\n' +
    'Y hay una capacidad que existe y no está replicada: Kia recupera el 4.4% de sus llamadas no ' +
    'atendidas con callback (789 de 17,849), mientras las otras cuatro cuentas recuperan CERO de sus ' +
    '1,952. La función funciona; simplemente no está encendida en el resto del grupo.\n\n' +
    'Tres notas de rigor sobre el documento entregado. El «19.5% fuera de horario / fin de semana» suma ' +
    'dos poblaciones que se solapan (un sábado a las 20 h está en las dos), así que es HASTA 19.5%. Las ' +
    '«19,801 llamadas no atendidas» que atribuye a cuatro cuentas son del grupo entero: esas cuatro suman ' +
    '1,952. Y vuelve a nombrar a Claudia Hernández como responsable, cuando Erick la sustituyó el 15 de ' +
    'octubre.',

  resultado_positivo:
    'Esta es la cuenta del lote donde una recomendación nuestra se ejecutó y se puede medir. Las tres ' +
    'peticiones del corte de agosto —separar Kia en cuenta propia, bajar los DIDs sin tráfico y ' +
    'dimensionar el plan al consumo real— están cumplidas: cinco CIDs reales, 23 DIDs activos en el CRM ' +
    'contra los 123 contratados de julio, y un plan de 500 minutos al 27.0%. Es el mejor argumento de ' +
    'servicio que tenemos con este cliente.\n\n' +
    'El modelo de reseller sigue validado: sus clientes finales reconocen y confían en Callpicker, lo que ' +
    'hizo innecesario el co-branding. Y el proyecto Neruc Prime OS —CRM, SMS, IA y automatización propios, ' +
    'con Callpicker como motor de telefonía vía API— sigue siendo el upsell de mayor valor estratégico de ' +
    'la cartera: una integración de infraestructura que ningún competidor replica fácilmente.',

  hallazgos: [
    'La reestructuración está EJECUTADA y verificada: 5 CIDs reales en Zoho y el plan de Sede Central en 500 min al 27.0% en octubre. Bien dimensionado, sin sobreconsumo ni sobrepago.',
    'CUIDADO al leer las gráficas: la caída de minutos de Kia entre agosto y septiembre (8,832 → 3,630) es efecto de la migración a su propio CID, NO una caída de tráfico del cliente.',
    'Kia Corregidora pierde 11,760 de sus 50,915 entrantes del año DENTRO del menú (23.1%), más del doble de su tasa de perdida (12.0%). Es la mayor fuga de leads de las 5 cuentas.',
    'La recuperación de perdidas existe y no está replicada: Kia recupera 789 (4.4% de 17,849) y las otras CUATRO cuentas recuperan CERO de sus 1,952 llamadas no atendidas.',
    'MARCADO en el documento · «fuera de horario / finde 19.5%» suma dos poblaciones que SE SOLAPAN: 7.7% fuera de 9:00–19:00 (4,438 llamadas) más 11.8% en fin de semana (6,852). Un sábado a las 20 h está en los dos cubos, así que la unión es HASTA 19.5%. La oportunidad es real —1,351 perdidas fuera de horario y 1,323 en fin de semana— pero no se suma.',
    'MARCADO en el documento · «De 19,801 llamadas no atendidas en Neruc One, Sede Central, Vehículos Japoneses Zapata y Automóviles Pro Snop combinadas, 0 recibieron callback». Esas cuatro suman 1,952 (980 + 509 + 71 + 392); las 19,801 son el grupo ENTERO, incluyendo las 17,849 de Kia, que sí tiene recuperación. El hallazgo es cierto; el número está inflado diez veces.',
    'EL ASESOR ESTÁ MAL: el reporte vuelve a nombrar a Claudia Hernández. Erick la sustituyó el 15 oct 2026 y `cuentas.asesor` y el GRC vigente dicen Erick. Es el mismo defecto de los reportes de ALTERNET (C10) y Hospital Santa Rosa (C4) del mismo lote: una clase de error del generador, no un descuido de este documento.',
    'MRR institucional: $2,433 (GRC, «MRR estable», AAA, 10 facturas, 66 meses, $719,029 acumulados). NO los $15,705.21 de la factura de agosto que citaba el corte anterior —ése era el mundo previo a la reestructuración— ni los $11,411 que sigue guardando la ficha. La reestructuración recortó el MRR de esta cuenta cerca del 79%: eso es lo que costó dimensionarla bien, y hay que decirlo antes de celebrar el 27.0% de uso.',
    'LA FICHA QUEDÓ EN JULIO: `cuentas.servicio` sigue diciendo «Calltracking Co-Branding 10,000 min + 121 DIDs Nacionales + 2 DIDs Internacionales». El plan real son 500 minutos y el documento mide 23 DIDs activos en el CRM (19 vistos en oct–nov y 42 en todo el año). `servicios_json` está vacío, así que la ficha no puede arbitrar nada de esta cuenta.',
    'Concentración que no se movió con la separación: dos números de Kia —Kia Corregidora 1 (22,531 llamadas, 7,394 abandonadas en menú) y Stellantis Pro Snop Querétaro (9,656 llamadas, 3,215 abandonadas)— concentran la mayor parte del abandono del grupo. El problema del IVR vive en esos dos números.',
    'Las horas de mayor abandono son las de mayor demanda: de 9 a 13 h el menú pierde entre 1,131 y 1,475 llamadas por hora, y el pico de perdidas (794) cae a las 13 h. Eso apunta a tiempos de espera o capacidad en hora punta más que a un árbol mal diseñado — pero el archivo no lo separa, así que se pregunta.',
    'Seis agentes concentran las evaluaciones negativas de forma desproporcionada: Erick Alejandro Ramírez Mejía tiene 58 negativas contra 11 positivas en 457 contestadas, y Valeria Palencia 33 contra 7 en 114. No es muestra pequeña en el primer caso: es una señal de capacitación o de asignación de cola.',
    'La última evaluación negativa registrada es del 26 nov 2026, el mismo día del corte, y nueve de las veinte más recientes son de Changan Querétaro Norte y Hotel Villa Mexicana (Neruc One). El problema de calidad no es histórico: está ocurriendo.',
    'Sede Central casi no marca: 122 salientes en once meses con 52.5% de conexión y 1.97 min de promedio. La saliente del grupo es de Kia (49,298 llamadas, 62.2% de conexión). Es coherente con el nuevo rol de Sede Central como cuenta de administración, no de operación.',
    '─── LO QUE SIGUE ES HISTÓRICO: el corte de 30 días del 26 jun – 25 jul 2026, que motivó la reestructuración. Se conserva porque explica POR QUÉ se reestructuró, no porque siga vigente. El plan de 10,000 minutos ya no existe. ───',
    'HISTÓRICO (jul 2026) — Reporte subestimó el consumo en 30.7%: El Slack de Daniel/Mario reporta 8,850 min ("cercanos al plan"). Esa cifra coincide exactamente con la suma de la hoja Entrantes — el reporte de soporte no incorporó tráfico saliente. El archivo muestra 3,914 min salientes (4,016 llamadas), concentrados en Kia Corregidora 1 y Suzuki Campestre 2 con campañas de marcación activas. Consumo real: 12,764 min / 127.6%.',
    'HISTÓRICO (jul 2026) — Cifra "corregida" del CRM (11,794 min) no reconciliable: La nota del CRM registra "ent 7,880 min + sal 3,914 min = 11,794 min" aplicando fijo=1min/llamada. El componente saliente coincide exacto. El entrante (7,880) no se pudo reproducir: la hipótesis más cercana (600 llamadas tipo "fixed" facturadas a 1min en vez de su duración real) da 7,855 min, a 25 min del valor reportado. Pendiente confirmar con Claudia la regla exacta. Cifra verificable y defendible: 12,764 min.',
    'HISTÓRICO (jul 2026) — Concentración extrema: Kia Corregidora 1 = 56.1% del consumo: 7,160 min en el periodo (4,192 entrantes + 2,968 salientes). Las top 5 sub-cuentas concentran el 89.5% del tráfico; las otras 51 sub-cuentas activas se reparten solo el 10.5% restante. Esto valida de forma independiente la decisión de separar Kia en cuenta propia ya tomada en la reunión del 04 ago.',
    'HISTÓRICO (jul 2026) — Solo 45.5% del pool de DIDs contratado tuvo actividad: 123 DIDs contratados (121 nacionales + 2 internacionales). Solo 56 números (45.5%) registraron al menos una llamada en el periodo. Los 67 restantes (54.5%) no tuvieron tráfico alguno. Evidencia directa y objetiva que respalda la solicitud de baja de DIDs ya iniciada por el cliente.',
    'HISTÓRICO (jul 2026) — Marcación saliente con baja tasa de conexión: Kia Corregidora 1: 2,823 llamadas salientes, 69.1% de conexión, 1.52 min promedio. Suzuki Campestre 2: 1,163 llamadas, 44.8% de conexión, 1.68 min promedio. Patrón de alto volumen + baja conexión + llamadas cortas — requiere confirmar directamente con el cliente qué herramienta o campaña genera ese volumen saliente antes de la próxima reunión.',
  ],

  /* ── Cronología ──────────────────────────────────────────────── */
  cronologia: [
    { fecha: '26 Jun 2026',   responsable: 'Sistema Callpicker',          evento: 'Inicio del periodo auditado. 8,355 llamadas registradas en el mes (Entrantes + Salientes).', tipo: 'neutral' },
    { fecha: '22 Jul 2026',   responsable: 'Axél Moreno-Nesme',           evento: 'Ticket Zoho #111336 — Axél pregunta cuántos minutos usa de su bolsa de 10,000 distribuidos entre clientes. Señal de falta de visibilidad del consumo real.', tipo: 'problema' },
    { fecha: '31 Jul 2026',   responsable: 'Axél Moreno-Nesme',           evento: 'Solicitud formal de baja de 55 DIDs (15 Sede Central + 40 Neruc One) vía Ticket Zoho #111336. Mario H. ejecuta 39 bajas de inmediato.', tipo: 'problema' },
    { fecha: '02 Ago 2026',   responsable: 'Sistema bancario',            evento: 'Cuarto fallo de tarjeta en el periodo visible (TARJ541121FAIL $15,705.24). Patrón: 4 fallos con tarjeta, rescate vía PayPal.', tipo: 'problema' },
    { fecha: '03 Ago 2026',   responsable: 'Neruc / Axél Moreno-Nesme',   evento: 'Factura 192270 pagada ($15,705.21, TARJ421284PASS). Cuenta al corriente. Saldo $0.', tipo: 'ok' },
    { fecha: '04 Ago 2026',   responsable: 'Daniel M. / Claudia / JML',   evento: 'Reunión "Revisión de servicios Grupo NERUC" (Axél, Andrea, Pablo G., Alejandro F., Rodrigo S. por Neruc). Acuerdos: reestructuración de cuentas, eliminación de co-branding, Neruc Prime OS como upsell API. Axél estima consumo en ~9,300 min (27% menor al real verificado).', tipo: 'pivote' },
    { fecha: '04 Ago 2026',   responsable: 'ATLAS / KAM',                 evento: 'Generación de auditoría forense. Hallazgo crítico: reporte Slack subestimó consumo en 30.7%. Consumo real verificado: 12,764 min / 127.6%.', tipo: 'neutral' },
    { fecha: '18 Ago 2026',   responsable: 'Claudia (CS)',                 evento: 'Próxima reunión de seguimiento programada. Claudia retoma la cuenta.', tipo: 'neutral' },
  ],

  /* ── Perfil de la cuenta ─────────────────────────────────────── */
  perfil_campos: [
    { label: 'Razón social',         value: 'AXEL MORENO NESME · RFC MONA970305MVA' },
    { label: 'CID / Consecutivo',    value: 'CID 73660 · Consecutivo C9' },
    { label: 'Giro',                 value: 'Agencia de performance marketing · Reseller Callpicker con Co-Branding' },
    { label: 'Modelo de negocio',    value: 'Revenden Callpicker a sus clientes finales bajo su propia marca. Pagan plan alto para tener dominios propios (admin/my.voice.neruc.app).' },
    { label: 'Servicios (ago 2026)', value: 'Calltracking Co-Branding 10,000 min · 121 DIDs Nacionales MX · 2 DIDs Internacionales Zihuatanejo' },
    { label: 'MRR actual',           value: '$15,705.21 MXN (Factura 192270 — pagada 03 ago 2026)' },
    { label: 'Contacto principal',   value: 'Axél Moreno-Nesme — Director General · axel.nesme@gruponeruc.com' },
    { label: 'Contacto alternativo', value: 'Andrea Nesme — Directora actual · andrea.nesme@gruponeruc.com' },
    { label: 'Operaciones',          value: 'Alejandro Fuentes · alejandro.fuentes@gruponeruc.com' },
    { label: 'Dominios propios CP',  value: 'admin.voice.neruc.app · my.voice.neruc.app' },
    { label: 'Proyecto interno',     value: 'Neruc Prime OS — CRM + SMS + IA + automatización. Usarán Callpicker como motor de telefonía backend vía API/webhooks.' },
    { label: 'Asesor',               value: 'Erick Sánchez · Callpicker Customer Success' },
  ],

  necesidad_negocio: 'Neruc opera como agencia de performance marketing y reseller de Callpicker. Su negocio depende de la telefonía como pieza central del producto que venden a sus clientes finales (autos, hoteles, empresas). La necesidad inmediata es tener visibilidad real del consumo de minutos por sub-cuenta — el problema que causó toda esta auditoría: Axél no sabía cuántos minutos consumían y el reporte interno tampoco era completo.\n\nEl proyecto Neruc Prime OS eleva la relación: de "compra líneas a Callpicker" a "Callpicker es el motor de telefonía de mi plataforma empresarial propia." Esa transición es la apuesta de largo plazo del cliente y representa la mayor oportunidad de stickiness que existe en esta cuenta.',

  potencial_corto: [
    'Confirmar metodología "fijo=1min" y establecer cifra de consumo oficial: 12,764 min (127.6%). Elimina ambigüedad antes de la reunión del 18 ago.',
    'Usar evidencia de 67 DIDs sin actividad (54.5%) como argumento objetivo para el right-sizing del plan — no solo la percepción del cliente.',
    'Preguntar directamente sobre herramienta de marcación saliente (Kia 69.1%, Suzuki 44.8% conexión) antes del 18 ago para tener la respuesta lista.',
    'Alex Rendón: resolver líneas bloqueadas en Sembia/Sirena (WhatsApp API) — impacta directamente las bajas de DIDs pendientes.',
    'Confirmar bajo qué CID opera Montajes Mecánicos — no aparece en el archivo de Sede Central.',
  ],
  potencial_largo: [
    'Neruc Prime OS · API/Developer plan: posicionar Callpicker como infraestructura crítica del sistema propio de Neruc. Stickiness máxima — reemplazarlos tiene costo muy alto.',
    'Panel por sub-cuenta + alertas de consumo (API en tiempo real hacia Power BI, Make, n8n/Zapier): resuelve la causa raíz confirmada por el propio Axél en la reunión.',
    'Cuenta nueva Mazda EdoMex (5 agencias): call tracking + grabación + menús + extensiones. MRR incremental con bolsa de minutos propia y visibilidad desde el día uno.',
    'Kia Corregidora como cuenta independiente: su 56.1% del consumo actual se convierte en MRR propio medible; right-sizing del plan Sede Central posterior.',
    'Revisión de calidad de marcación saliente: IA de voz + análisis de grabaciones para Kia Corregidora y Suzuki Campestre 2 (tasas de conexión del 69.1% y 44.8%).',
  ],

  tacticas: [
    {
      nombre: 'Dashboard de consumo en tiempo real',
      descripcion: 'Integrar la API de Callpicker con Power BI, Make o n8n para mostrar consumo de minutos por sub-cuenta, con alertas de umbral. Daniel confirmó en la reunión que la API ya lo permite.',
      impacto: 'Elimina la causa raíz identificada: falta de visibilidad que generó el error de reporte y la incertidumbre del cliente sobre su propio consumo.',
    },
    {
      nombre: 'Right-sizing del plan post-reestructuración',
      descripcion: 'Una vez que Kia Corregidora (56.1% del consumo) migre a cuenta propia, el plan base de Sede Central se puede redimensionar a los ~4,000-5,000 min reales remanentes. Proponer plan adecuado con precio ajustado.',
      impacto: 'Retiene al cliente con un plan más racional, elimina la "situación financiera desafiante" como argumento de cancelación, y crea espacio para crecer de nuevo.',
    },
    {
      nombre: 'Propuesta Neruc Prime OS · Plan API',
      descripcion: 'Formalizar oferta de plan API/Developer para Neruc Prime OS: webhooks, consumo de minutos en tiempo real, integración de grabaciones y análisis. Esto eleva la relación de proveedor a infraestructura crítica.',
      impacto: 'Mayor stickiness, menor riesgo de churn, posible incremento de MRR por consumo de API.',
    },
    {
      nombre: 'Cotización Mazda EdoMex basada en datos reales',
      descripcion: 'Usar el patrón de Kia Corregidora (consumo real por concesionaria activa) como base para dimensionar el plan de las 5 agencias Mazda — no la proyección de 25,000 min que Axél y Daniel calificaron de excesiva.',
      impacto: 'Evita repetir el mismo problema de sub/sobreestimación que motivó esta auditoría. Propuesta credible y defendible con datos.',
    },
  ],
  senal_alarma: 'Axél declaró "situación financiera desafiante" como motivador de toda la reestructuración. Si la separación de Kia Corregidora y la eliminación de co-branding se ejecutan sin nuevas cuentas que compensen, el MRR puede bajar de $15,705 a ~$5,000-6,000. Monitorear que el crecimiento (Mazda + API) avance en paralelo a las bajas.',

  /* ── Problema raíz ───────────────────────────────────────────── */
  problema_raiz: 'Reporte de consumo incompleto — solo tráfico entrante',
  problema_raiz_detalle: 'El proceso de soporte (Mario) generó el reporte de consumo sumando únicamente la hoja "Entrantes" del Excel. Esa es exactamente la cifra (8,850 min) que Daniel comunicó al equipo y que Axél usó como referencia en la reunión (estimó ~9,300 min). El tráfico saliente (3,914 min, 30.7% del total) nunca fue incluido. Resultado: la cuenta lleva un mes sobre su plan de 10,000 min sin que nadie lo supiera — ni el cliente ni el equipo de CS.',

  flujo_real: [
    { fase: 'Reporte',      area: 'Soporte (Mario)',      accion: 'Suma solo hoja Entrantes del Excel',             resultado: '8,850 min — subestimación del 30.7%' },
    { fase: 'Comunicación', area: 'KAM (Daniel)',          accion: 'Reporta 8,850 min como "cercanos al plan"',      resultado: 'Todo el equipo opera con dato incorrecto' },
    { fase: 'Reunión',      area: 'Axél / Daniel',         accion: 'Axél estima ~9,300 min propios',                 resultado: 'Aún 27% por debajo del consumo real' },
    { fase: 'Auditoría',    area: 'ATLAS',                 accion: 'Cruza Entrantes + Salientes desde el raw',       resultado: '12,764 min real · 127.6% del plan' },
    { fase: 'CRM',          area: 'CS (Claudia)',          accion: 'Aplica corrección fijo=1min → 11,794 min',       resultado: 'Cifra intermedia no reconciliable con metodología disponible' },
  ],

  comparativo: [
    { metrica: 'Consumo reportado (Slack)',      real: '8,850 min',   ideal: '12,764 min (completo)' },
    { metrica: '% utilización comunicado',       real: '"cercanos al plan"', ideal: '127.6% — sobre el límite' },
    { metrica: 'DIDs activos en periodo',        real: '56 de 123',   ideal: 'Deberíamos saber esto antes de cualquier reunión de right-sizing' },
    { metrica: 'Estimación del cliente (Axél)',  real: '~9,300 min',  ideal: 'Dato real: 12,764 min (+37%)' },
    { metrica: 'Tasa conexión saliente Suzuki',  real: '44.8%',       ideal: '≥ 70%' },
  ],

  /* ── Plan de acción ──────────────────────────────────────────── */
  /* Las acciones de v1.0 (jul 2026) con criterio «antes del 18 ago» están
   * EJECUTADAS o vencidas, y se bajaron a la sección histórica del plan
   * mediano. Un plan inmediato con fecha de agosto en un expediente de
   * noviembre pide trabajo que ya se hizo. */
  plan_inmediato: [
    { accion: 'Kia Corregidora pierde 11,760 de sus 50,915 entrantes DENTRO del menú (23.1%), más del doble de su tasa de perdida. Es la mayor fuga de leads de las cinco cuentas y nadie la está trabajando: revisar el árbol del IVR y el destino de cada opción.', responsable: 'Erick + Técnico', criterio: 'Árbol revisado y medición del abandono en menú a 30 días' },
    { accion: 'Replicar en las otras cuatro cuentas la recuperación de perdidas que ya opera en Kia (789 llamadas, 4.4%). Las cuatro recuperan CERO de sus 1,952 no atendidas: es un proceso que existe adentro del grupo y no está extendido.', responsable: 'Erick', criterio: 'Protocolo de devolución activo en las cuatro cuentas y primera medición' },
    { accion: 'Corregir `cuentas.servicio` de C9: todavía describe el plan eliminado de 10,000 min y 123 DIDs. El plan vigente es de 500 min y el MRR institucional $2,433, no los $15,705 de la factura de agosto.', responsable: 'Erick', criterio: 'Ficha alineada al plan vigente y al GRC' },
    { accion: 'No citar el «19,801 llamadas no atendidas en cuatro cuentas» del reporte: es la cifra del grupo completo y esas cuatro suman 1,952. Si el dato llegó al cliente, corregirlo por escrito antes de la siguiente reunión.', responsable: 'Erick', criterio: 'Confirmado si se comunicó y corregido en su caso' },
  ],

  plan_mediano: [
    { accion: 'Medir el plan de 500 min de Sede Central dos meses más: octubre cerró en 27.0% y un plan al 27% invita al downgrade. Si se sostiene por debajo del 30%, proponer el ajuste nosotros antes de que lo pida el cliente.', responsable: 'Erick', criterio: 'Dos cortes medidos y decisión de plan documentada' },
    { accion: 'Retomar la oferta de API / Neruc Prime OS con el consumo real de cada CID ya separado: la reestructuración que la hacía imposible está ejecutada, y ahora cada agencia tiene su propia medición.', responsable: 'Erick + Producto', criterio: 'Propuesta API presentada con el consumo real por CID' },
    { accion: 'HISTÓRICO (jul–ago 2026) — EJECUTADO: la reestructuración acordada el 4 ago (Kia Corregidora en cuenta propia, co-branding eliminado, Sede Central reducida) está verificada: cinco CIDs reales en Zoho y plan de 500 min. No volver a pedirla.', responsable: 'Daniel / Axél', criterio: 'Verificado el 26 nov 2026 · cerrado' },
    { accion: 'HISTÓRICO (jul 2026) — La cifra "corregida" del CRM de 11,794 min nunca se pudo reconciliar (la hipótesis más cercana da 7,855 contra 7,880 entrantes). No usar 11,794 ni 8,850: la cifra defendible de ese periodo es 12,764 min. La regla exacta sigue sin confirmar con Claudia Hernández, que fue quien la aplicó.', responsable: 'Daniel / Erick', criterio: 'Vencido sin reconciliar · se deja declarado, no se cita la cifra' },
  ],

  plan_estrategico: [
    { accion: 'Panel por sub-cuenta + alertas de consumo: era la causa raíz que Axél confirmó en la reunión del 4 ago y sigue abierta. Con los cinco CIDs ya separados, cada agencia puede tener su propia vista.', responsable: 'Erick / Producto CP', criterio: 'Demo o acceso habilitado para Neruc' },
    { accion: 'Revisar la calidad de marcación saliente con el cliente (Kia 69.1%, Suzuki 44.8%): identificar la herramienta que marca, y proponer IA de voz o ajuste de campaña según lo que se encuentre.', responsable: 'Erick / Daniel', criterio: 'Pregunta planteada y respuesta documentada en la siguiente reunión' },
    { accion: 'Cotizar Mazda EdoMex (5 agencias) con el consumo real de Kia Corregidora como referencia, no con los 25,000 min que estimó Axél. La migración de Kia ya dio la base de comparación que faltaba.', responsable: 'Erick / Daniel', criterio: 'Propuesta formal enviada con el comparable medido' },
  ],

  areas_oportunidad: [
    { area: 'API / Neruc Prime OS',               impacto: 'Callpicker como infraestructura crítica del sistema propio del cliente — stickiness máxima',       responsable: 'Daniel' },
    { area: 'Cuenta nueva Mazda EdoMex (5 ags)',  impacto: 'MRR incremental estimado ~$7,500-$10,000 MXN/mes según consumo real comparable',                   responsable: 'Daniel' },
    { area: 'Panel de consumo en tiempo real',     impacto: 'Resuelve causa raíz confirmada en reunión — reduce riesgo de churn por opacidad de datos',          responsable: 'Erick' },
    { area: 'Right-sizing plan Sede Central',      impacto: 'Retención a precio justo post-reestructuración; elimina argumento de "costo innecesario"',          responsable: 'Daniel' },
  ],

  /* ── Actores ─────────────────────────────────────────────────── */
  perfiles: [
    {
      nombre: 'Axél Moreno-Nesme',
      rol:    'Director General · Razón Social · Callpicker CID 73660',
      color:  '#00B4FF',
      campos: [
        { label: 'Email',      value: 'axel.nesme@gruponeruc.com' },
        { label: 'RFC',        value: 'MONA970305MVA' },
        { label: 'Rol real',   value: 'Tomador de decisiones y contacto técnico-comercial principal. Su hermana Andrea aparece como directora pero Axél conduce las reuniones.' },
        { label: 'Contexto',   value: 'Declaró "situación financiera desafiante" — motivador de la reestructuración. Estima consumo en ~9,300 min (27% menor al real). Comprometió diagrama de reestructuración por WA.' },
      ],
    },
    {
      nombre: 'Andrea Nesme',
      rol:    'Directora (aparece como directora actual — cambio reciente)',
      color:  '#6366f1',
      campos: [
        { label: 'Email', value: 'andrea.nesme@gruponeruc.com' },
        { label: 'Nota',  value: 'Asistió a la reunión del 04 ago. Axél sigue siendo el interlocutor principal.' },
      ],
    },
    {
      nombre: 'Alejandro Fuentes / Rodrigo Saucedo',
      rol:    'Coordinación operativa Neruc',
      color:  '#f59e0b',
      campos: [
        { label: 'Alejandro', value: 'alejandro.fuentes@gruponeruc.com — espejo operativo en la reestructuración' },
        { label: 'Rodrigo',   value: 'rodrigo.saucedo@gruponeruc.com — coordinación operativa' },
      ],
    },
    {
      nombre: 'Daniel Martínez',
      rol:    'KAM Callpicker · Conducción del caso',
      color:  '#22C55E',
      campos: [
        { label: 'Acciones', value: 'Evaluar y enviar propuesta Mazda. Lista de números a cancelar + consumo estimado. Propuesta formal de reestructuración.' },
        { label: 'Nota',     value: 'Comunicó 8,850 min como consumo total basándose en el reporte de soporte (solo Entrantes).' },
      ],
    },
    {
      nombre: 'Erick Sánchez',
      rol:    'Asesora de cuenta · Seguimiento post-reunión',
      color:  '#a855f7',
      campos: [
        { label: 'Email',  value: 'claudia@callpicker.com' },
        { label: 'Acción', value: 'Dar seguimiento a la cuenta cuando regrese. Confirmar metodología "fijo=1min" (7,880 min entrantes) para reconciliar cifra CRM con datos del archivo.' },
      ],
    },
  ],

  /* ── FODA ────────────────────────────────────────────────────── */
  foda: {
    fortalezas: [
      'Relación de 5+ años; modelo reseller validado — sus clientes finales reconocen Callpicker sin necesitar el paquete co-branding.',
      'Factura de agosto pagada al corriente ($15,705.21). Los 4 fallos de tarjeta se resolvieron vía PayPal — no hay mora impaga.',
      'Pipeline de expansión concreto y no especulativo: Mazda EdoMex (5 agencias) + Kia Corregidora como cuenta independiente.',
      'Neruc Prime OS: posicionamiento estratégico donde Callpicker pasa de proveedor de líneas a infraestructura crítica del producto propio del cliente.',
    ],
    oportunidades: [
      'API/Developer plan para Neruc Prime OS: integración de telefonía backend con CRM, SMS, automatización e IA propios de Neruc.',
      'Panel de consumo en tiempo real (API → Power BI / Make / n8n): resuelve la causa raíz de falta de visibilidad que el propio Axél confirmó en reunión.',
      'Cuentas nuevas con bolsa propia: Kia Corregidora independiente + Mazda EdoMex = MRR incremental medible desde el día uno.',
      'Separación de cuentas = visibilidad real por cliente: elimina el problema estructural de consumo compartido no trazable.',
    ],
    debilidades: [
      'Reporte de consumo llegó incompleto a decisión (8,850 vs 12,764 min reales) — origen interno del proceso de soporte, no del cliente.',
      'Falta de trazabilidad de consumo en Neruc One reconocida por el propio Axél en la reunión — causa raíz confirmada del error de reporte.',
      'Inconsistencia entre la descripción del CRM ("Sede Central = uso interno") y la realidad del archivo (tráfico de clientes finales: Kia, Mazda, Stellantis).',
      'Cifra "corregida" del CRM (11,794 min) no reconciliable con metodología disponible — no usar hasta confirmar con Claudia.',
    ],
    amenazas: [
      'Situación financiera "desafiante" declarada por Axél — mayor sensibilidad al precio. Ya se ve en solicitud de baja de co-branding y de DIDs.',
      'Si la reestructuración reduce cuentas sin que crezcan las nuevas (Mazda, API), el MRR puede caer de $15,705 a ~$5,000-$6,000.',
      'Cotización de Mazda sobre 25,000 min (proyección excesiva) — riesgo de subvalorar el servicio y repetir el patrón de disputa de datos.',
      'Montajes Mecánicos (mencionado como estable en reunión) no aparece en el archivo auditado — no verificable desde esta fuente. Puede tener problemas no detectados.',
    ],
  },

  /* ── Conclusión ──────────────────────────────────────────────── */
  conclusion: 'La auditoría revela un problema de proceso interno más que un cliente perdido. El dato que llevó a la mesa de decisión estaba incompleto — no porque nadie mintiera, sino porque el reporte de soporte sumó solo un sentido de tráfico. Esa diferencia de 3,914 minutos (30.7%) cambió completamente la lectura: la cuenta no está "cerca del límite", lleva un mes sobre él.\n\nA pesar de eso, el cliente está pagando, tiene un proyecto estratégico en desarrollo (Neruc Prime OS) y un pipeline de nuevas cuentas concreto. El riesgo real es que la "situación financiera desafiante" que Axél declaró en la reunión genere reducciones de plan que no se compensen a tiempo con el crecimiento.',

  pierde: [
    'MRR de co-branding (~$6,100/mes) si se aprueba la eliminación del paquete',
    'Visión de Sede Central como cuenta estable — en realidad su consumo está distribuido en clientes finales que se van a separar',
    '16 DIDs pendientes de dar de baja (de los 55 solicitados, 39 ya ejecutados por Mario H.)',
    'Tiempo de CS: este caso requirió auditoría completa por un error de reporte que se puede sistematizar',
  ],
  gana: [
    'Neruc Prime OS: contrato de API como infraestructura backend — stickiness que ningún competidor puede replicar fácilmente',
    '5 cuentas Mazda EdoMex: MRR incremental estimado $7,500–$10,000 MXN/mes',
    'Kia Corregidora como cuenta independiente: la mayor sub-cuenta (56.1% del consumo) se convierte en MRR propio medible',
    'Confianza del cliente en datos: entregar esta auditoría directamente demuestra transparencia y diferencia al equipo de CS de cualquier proveedor estándar',
    'Proceso mejorado: establecer reporte de consumo bidireccional como estándar en todos los clientes con tráfico saliente activo',
  ],

  recomendacion_central:
    'Entrar reconociendo lo que se cumplió, porque es cierto y es nuestro mejor argumento con este ' +
    'cliente: las tres peticiones de agosto están ejecutadas y el plan de Sede Central va al 27.0% de sus ' +
    '500 minutos. Sobre esa base, poner el hallazgo nuevo: Kia pierde 11,760 llamadas al año dentro del ' +
    'menú, más del doble de lo que pierde por no contestar, y eso son leads de agencia automotriz. ' +
    'Proponer dos cosas concretas y medibles: encender el callback en las cuatro cuentas que hoy recuperan ' +
    'cero de sus 1,952 llamadas no atendidas —la función ya funciona en Kia al 4.4%—, y revisar el IVR de ' +
    'los dos números que concentran el abandono. Para la cobertura fuera de horario y fin de semana, ' +
    'hablar de HASTA 19.5% y no de 19.5%, porque el sábado por la tarde está en los dos cubos. Y una cosa ' +
    'de casa antes de la reunión: actualizar la ficha, que sigue diciendo 10,000 minutos y 123 DIDs, y ' +
    'llevar el MRR institucional correcto ($2,433) en lugar de la factura de agosto.',

  documentos: [
    {
      nombre: 'Auditoría de llamadas · Grupo NERUC (5 cuentas) · 2026',
      ruta: '/auditorias/Auditoria-Grupo-Neruc-2026.html',
      descripcion:
        'Reporte interactivo del GRUPO NERUC completo —Sede Central (CID 73660), Neruc One, Kia ' +
        'Corregidora, Vehículos Japoneses Zapata y Automóviles Pro Snop— sobre 107,386 llamadas (57,965 ' +
        'entrantes + 49,421 salientes) y 148,416 minutos, 1 ene – 26 nov 2026 con noviembre en tránsito: ' +
        'la reestructuración de agosto validada CID por CID, tendencia mensual, semanal y diaria, ' +
        'distribución por hora y por día, abandono en menú, los 25 números de mayor volumen, 30 agentes, ' +
        'evaluaciones negativas, recuperación por cuenta, calidad de saliente y dimensionamiento del plan. ' +
        'PUBLICADO CON TRES CORRECCIONES VISIBLES DENTRO DEL DOCUMENTO: el «19.5% fuera de horario / fin de ' +
        'semana» suma dos poblaciones que se solapan y se corrige a HASTA 19.5%; las «19,801 llamadas no ' +
        'atendidas» atribuidas a cuatro cuentas son del grupo entero y esas cuatro suman 1,952; y el asesor ' +
        'responsable es Erick, no Claudia Hernández. Se declara además que el MRR institucional es $2,433 ' +
        '(GRC) y que la ficha de la cuenta sigue describiendo el plan de 10,000 minutos y 123 DIDs que la ' +
        'propia reestructuración eliminó.',
    },
  ],
}
