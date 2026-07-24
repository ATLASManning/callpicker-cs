import type { AuditoriaCase } from './types'

export const CINTAS_COVE: AuditoriaCase = {
  id: 'cintascove',
  asesor: 'Dan',
  nombre: 'Cintas Cove S.A. de C.V.',
  sector: 'Fabricación y Comercialización de Cintas Adhesivas Industriales — B2B',
  fecha_periodo: '02 Ene – 02 Jul 2026',
  fecha_auditoria: 'Jul 2026',
  tipo_cliente: 'VIP · B2B Industrial · +3,000 clientes · 38 años de operación · CID 23870',
  descripcion_contexto: 'Auditoría Forense de Tráfico Telefónico · 3,468 llamadas entrantes + 299 salientes · 3 números Callpicker · 6 meses de operación',
  estado: 'activo',
  clasificacion: 'CONFIDENCIAL',
  version: '1.0',

  kpis: [
    { label: 'Llamadas entrantes',    value: '3,468 · 6 meses',    color: '#1B3FCC' },
    { label: 'Tasa de pérdida',       value: '23.9% → 20.5%*',     color: '#ef4444' },
    { label: 'Robocalls detectadas',  value: '576 · 16.6%',        color: '#f59e0b' },
    { label: 'Min. facturables/mes',  value: '~485 promedio',       color: '#6366f1' },
  ],

  resumen_ejecutivo: 'Cintas Cove publica un horario de atención lunes a viernes 08:00–17:00. Los datos indican que la operación real inicia cerca de las 09:30 y decae desde las 16:45. En la hora 08:00, el 47.2% de las llamadas se pierde. Esa es la primera lectura ejecutiva: no hay un problema de plataforma — hay una desalineación entre la promesa comercial y la ejecución operativa.\n\nEn 6 meses ingresaron 3,468 llamadas al número principal (55) 5864-2880 — el mismo número publicado como línea comercial en cintascove.com. De cada 4 llamadas, una se perdió. En un modelo B2B de cotización rápida con más de 3,000 clientes activos, cada llamada perdida es una cotización que no ocurrió.\n\nDistribución de entrantes: 33.3% atendidas por agente (Redirected) · 42.8% autoservicio IVR (Self_service) · 1.2% buzón (Voicemail) · 22.7% perdidas (Lost). Pérdida real (Lost + Voicemail): 830 llamadas · 23.9%. Con tráfico limpio (sin robocalls): 20.5%.\n\nLa tasa de pérdida ha mejorado progresivamente: enero 25.5% → mayo 18.1%. Junio marca ligero retroceso (20.9%). Meta alcanzable en Q3: 12–14%.',

  resultado_positivo: 'Cintas Cove es un cliente sano. Los datos revelan tensiones operativas concretas, no señales de estrés estructural. La empresa tiene 40 años de operación, base instalada declarada de +3,000 clientes, certificaciones ISO 9001 e ISO 14001, y un modelo comercial claro (cotización express, entrega nacional, recoge en 1 hora). La telefonía Callpicker está funcionando bien como infraestructura — simplemente puede rendir más.\n\nLa tendencia de mejora en tasa de pérdida (25.5% en enero → 18.1% en mayo) indica que la operación sí está corrigiendo. El perfil de Cynthia G. García Ramírez (6.1 min promedio) demuestra que hay capacidad consultiva dentro del equipo que puede replicarse. MRR activo: $13,965 con semáforo VIP.',

  hallazgos: [
    'Desalineación hora 08:00: 47.2% de pérdida en la primera hora operativa — la empresa promete atención desde esa hora en cintascove.com. El 75.4% del total de pérdidas ocurre dentro del horario laboral declarado.',
    'Campaña de robocalls: 576 llamadas (16.6% del volumen total de 6 meses) con firma técnica inequívocamente automatizada. El origen 5541530095 solo generó 377 llamadas en 26 días laborales (14.5/día). Los prefijos 5598-86xx y 5598-89xx concentran el resto. Distorsionaron enero (1,262 llamadas vs promedio real ~440).',
    'Outbound comercial subutilizado: solo 5 extensiones de más de 20 registradas usan el canal saliente. 299 llamadas en 6 meses = ~50/mes sobre base declarada de +3,000 clientes. Equivale a 0.1 llamadas por cliente por mes. El teléfono no está muerto — está apagado por decisión operativa.',
    'Concentración horaria 10:00–13:00 sin refuerzo: 46% del volumen diario en 4 horas con 22% de pérdida promedio. ~300 llamadas perdidas en 6 meses en la franja de mayor demanda.',
    'Autoservicio (Self_service) sin trazabilidad de resolución: 42.8% de llamadas resueltas en IVR sin métrica de "resolvió vs frustró". Sin esa métrica, el árbol de opciones no puede optimizarse.',
    'Bases de datos sucias en outbound: JOHAN LOPEZ (89.7% pérdida) y RODRIGUEZ BIBIANA (78.9% pérdida) tienen tasas desproporcionadamente altas — probable combinación de números desactualizados y/o cobranza dura con evasión.',
    'Concentración de atención en pocas agentes: REYES ORDUÑA ITZEL (186 llamadas) y CINDY NAVA (182) concentran el volumen. Alta dependencia de pocas personas sin protocolo documentado.',
    'Canal outbound sin programa estructurado: solo Cynthia G. García Ramírez (135 llamadas sal.) y GALLARDO CLAUDIA (90) generan el 75% del outbound. No hay piloto de programa con metas por extensión.',
    'Sin mecanismo de rescate para llamadas perdidas en horario: no hay callback automatizado activo ni captura de leads en fines de semana, donde el volumen es ~0 pero el WhatsApp comercial (55 3240 1825) está publicado.',
  ],

  cronologia: [
    { fecha: 'Ene 2026',              responsable: 'Callpicker / FRISA ext.',  evento: 'Pico anómalo: 1,262 llamadas entrantes (vs promedio ~440). Campaña de robocalls — 576 llamadas del origen 5541530095 y prefijos 5598-86xx/89xx concentradas en franjas horarias específicas.', tipo: 'problema' },
    { fecha: 'Feb 2026',              responsable: 'Operación Cintas Cove',     evento: '501 llamadas entrantes. Tasa de pérdida: 25.3%. Equipo en curva normal de operación post-pico enero.', tipo: 'neutral' },
    { fecha: 'Mar 2026',              responsable: 'Operación Cintas Cove',     evento: '468 llamadas entrantes. Tasa de pérdida: 26.9% — peor mes del periodo excluyendo enero. Probable impacto de falla operativa interna no documentada.', tipo: 'problema' },
    { fecha: 'Abr 2026',              responsable: 'Operación Cintas Cove',     evento: '365 llamadas entrantes. Tasa de pérdida: 21.4%. Primer mes bajo el promedio — indica corrección operativa en marcha.', tipo: 'neutral' },
    { fecha: 'May 2026',              responsable: 'Operación Cintas Cove',     evento: '364 llamadas entrantes. Tasa de pérdida: 18.1% — mejor mes del periodo. La operación está corrigiendo.', tipo: 'ok' },
    { fecha: 'Jun 2026',              responsable: 'Operación Cintas Cove',     evento: '425 llamadas entrantes. Tasa de pérdida: 20.9% — ligero retroceso. Línea base realista para objetivos de mejora: 20.0% promedio últimos 3 meses.', tipo: 'neutral' },
    { fecha: '02–03 Jul 2026',        responsable: 'Dir. Business Development', evento: 'Corte de datos. Generación de auditoría forense. 39 llamadas parciales jul (5.1% pérdida). Reporte preparado para sesión de validación con dirección comercial Cintas Cove.', tipo: 'ok' },
  ],

  perfil_campos: [
    { label: 'Razón social',        value: 'CINTAS COVE S.A. de C.V.' },
    { label: 'Origen',              value: '1983 — Distribuidora Barrueta S.A. de C.V. · Constituida 22 ago 1988' },
    { label: 'Sector',              value: 'Fabricación y comercialización de cintas adhesivas industriales, empaque y embalaje' },
    { label: 'Tamaño',              value: '51–200 empleados (LinkedIn) · ~206 registros Indeed' },
    { label: 'Sede',                value: 'Jacarandas 13, San Isidro, Cuautitlán Izcalli, EdoMex 54730' },
    { label: 'Clientes destacados', value: 'Mabe (Top Supplier), Grupo Concord, Televisa San Ángel, Grupo 4TREM' },
    { label: 'Portafolio',          value: 'Más de 70 tipos de cinta · más de 3,000 clientes activos' },
    { label: 'Certificaciones',     value: 'ISO 9001 · ISO 14001' },
    { label: 'Números Callpicker',  value: '(55) 5864-2880 (línea comercial principal) · (55) 4000-1898 (salientes) · (442) 454-5354 (Querétaro)' },
    { label: 'CID Callpicker',      value: 'CID 23870 · Consecutivo D14' },
    { label: 'MRR Callpicker',      value: '$13,965 · Semáforo VIP · Semáforo Zoho: Riesgo' },
    { label: 'Contacto web',        value: 'ventas@cintascove.com · (55) 5864-2880 · WhatsApp 55 3240 1825' },
    { label: 'Horario declarado',   value: 'Lunes a viernes, 08:00 a 17:00' },
  ],

  necesidad_negocio: 'Cintas Cove opera un modelo B2B industrial de cotización rápida: "recoge en 1 hora, entrega nacional, corte a la medida". Su canal comercial depende fuertemente del teléfono y WhatsApp — el número (55) 5864-2880 es la cara comercial digital visible en su sitio web, Facebook, Google Business y LinkedIn. Cada llamada perdida en esa línea es una cotización que no ocurrió.\n\nCon +3,000 clientes activos y 40 años de historia, la empresa tiene todo el volumen instalado para activar el teléfono como canal proactivo de fidelización y detección temprana de churn — actualmente está subexplotado (0.1 llamadas outbound por cliente por mes). La necesidad inmediata es operativa: reducir la tasa de pérdida del 20% actual al 12–14% en 90 días con acciones de costo cero o bajo.',

  potencial_corto: [
    'Bloqueo dinámico de robocalls en Callpicker: prefijos 5598-86xx/89xx + origen 5541530095 → elimina ~96 llamadas/mes de ruido. Costo: cero. ROI: inmediato.',
    'Alineación operativa hora 08:00 con al menos 2 agentes disponibles → recupera ~60 llamadas/6 meses con fricción técnica cero. ROI: primera semana.',
    'Callback automatizado en franja pico 10:00–13:00 (espera >30 seg) → +100 llamadas rescatadas cada 6 meses. Costo: configuración Callpicker incluida en plataforma.',
    'Validación de unidad de "Duracion" en exports (minutos vs segundos) — confirmar con equipo técnico Callpicker antes de propuesta comercial.',
    'Cruce de consumo facturable (~485 min/mes, pico 690 jun) con bolsa contratada vigente.',
  ],
  potencial_largo: [
    'Piloto outbound estructurado: 15 llamadas/día × 5 extensiones = 1,500 llamadas/mes vs 50 actuales. Pipeline nuevo detectable en 60 días.',
    'Asistente Virtual Callpicker para franjas pico y captura de leads fines de semana (WhatsApp) — propuesta comercial dedicada. ROI: 90 días desde arranque.',
    'Grabación y evaluación de agentes clave: replicar perfil consultivo de Cynthia G. García Ramírez (6.1 min promedio) en el resto del equipo.',
    'Programa de cuenta clave para clientes recurrentes: 5561692266 (46 llamadas), 5591580500 (22), 5610658772 (20) — candidatos identificados en los propios datos.',
    'Atención asíncrona sábado/domingo: flujo IA que capture consultas de cotización y las coloque en cola de agente el lunes.',
    'Connectivity Solutions: arquitectura Peplink MultiSIM + failover en Cuautitlán Izcalli (continuidad de la línea comercial) + Check Point (bloqueo perimetral de robocalls) + NOC 24/7 con alerta si la línea deja de recibir llamadas en horario laboral.',
  ],

  tacticas: [
    { nombre: 'Reescritura de horario', descripcion: 'El sitio web publica 08:00–17:00 pero la operación real arranca ~09:30 y decae desde 16:45. El cliente "promete" al mercado una disponibilidad que la operación no ejecuta consistentemente.', impacto: '47.2% de pérdida en hora 08:00 — primera impresión del prospecto es "empresa desorganizada"' },
    { nombre: 'Canal outbound apagado', descripcion: 'La base de +3,000 clientes existe pero no se activa vía teléfono. El outbound se percibe como "no necesario" cuando en realidad es el canal más directo de detección de churn y reactivación.', impacto: '0.1 llamadas por cliente por mes — contacto proactivo prácticamente nulo' },
    { nombre: 'IVR como embudo oscuro', descripcion: '42.8% del tráfico se "resuelve" en autoservicio sin saber si la necesidad quedó satisfecha o si el cliente simplemente colgó frustrado.', impacto: 'Sin métrica de resolución, el IVR puede estar generando churn silencioso' },
  ],
  senal_alarma: 'Si la tasa de pérdida en la hora 08:00 supera 50% en cualquier semana — señal de que la alineación operativa retrocedió. Si el volumen de enero se repite en cualquier mes sin una campaña conocida — nueva ola de robocalls, actuar de inmediato con bloqueo de prefijos. Si JOHAN LOPEZ o RODRIGUEZ BIBIANA siguen con >75% pérdida en outbound después de limpieza de base — escalar a cobranza dura o revisar numeración.',

  problema_raiz: 'Desalineación entre la promesa comercial (horario publicado) y la ejecución operativa real, combinada con ausencia de activación proactiva del canal telefónico sobre la base instalada',
  problema_raiz_detalle: 'No es un problema técnico de plataforma. La infraestructura Callpicker funciona. El problema es de orquestación en tres capas: (1) el horario publicado (08:00) no corresponde al horario operado real (~09:30), generando 47% de pérdida en la primera hora; (2) el canal outbound está inactivo para el 95% de la base de clientes, convirtiendo el teléfono en canal reactivo cuando podría ser proactivo; (3) el tráfico robocall (16.6% del volumen) nunca fue bloqueado, generando ruido operativo y distorsión estadística durante 6 meses. Los tres problemas tienen solución de costo cero o bajo con acciones de configuración en Callpicker y ajuste operativo interno.',

  flujo_real: [
    { fase: '1. Llamada entra (08:00)',             area: 'Llamante externo',       accion: 'Marca (55) 5864-2880 según horario publicado en web',              resultado: '47.2% se pierde — el equipo aún no ha arrancado operaciones a esa hora' },
    { fase: '2. IVR filtra (Self_service)',          area: 'Callpicker IVR',         accion: '42.8% de llamadas navegan el menú automático sin llegar a agente', resultado: 'Sin métrica de resolución — no sabemos si la necesidad quedó satisfecha' },
    { fase: '3. Robocalls saturan (ene)',            area: 'Origen fraudulento',     accion: '576 llamadas automatizadas con duración 0 golpean el IVR en ráfagas', resultado: 'IVR congestionado, métricas distorsionadas, enero inflado artificialmente' },
    { fase: '4. Pico 10:00–13:00',                  area: 'Equipo comercial',       accion: '46% del volumen diario se concentra en 4 horas',                  resultado: '22% de pérdida en el mismo bloque donde más nos buscan' },
    { fase: '5. Outbound residual',                  area: '5 extensiones activas',  accion: '50 llamadas salientes/mes sobre base de +3,000 clientes',         resultado: 'Pipeline proactivo prácticamente nulo; churn no detectable antes de que ocurra' },
    { fase: '6. Cierre 17:00',                       area: 'Operación',              accion: 'Llamadas entrantes continúan pero operación decae desde 16:45',   resultado: '41 llamadas perdidas en última hora oficial — mismo patrón que el inicio' },
  ],

  comparativo: [
    { metrica: 'Horario operativo',           real: 'Operación real: 09:30–16:45 (aprox.)',                                     ideal: 'Alinear operación al horario publicado 08:00–17:00 o actualizar la promesa web' },
    { metrica: 'Tasa de pérdida hora 08:00',  real: '47.2% — peor hora del día',                                               ideal: '≤20% con 2 agentes disponibles al arranque' },
    { metrica: 'Tasa de pérdida global',      real: '23.9% con robocalls · 20.5% limpio',                                      ideal: '12–14% en 90 días con acciones propuestas' },
    { metrica: 'Bloqueo de robocalls',        real: 'Sin lista negra activa — 576 llamadas fraudulentas en 6 meses',           ideal: 'Lista negra dinámica para prefijos 5598-86xx/89xx + origen 5541530095' },
    { metrica: 'Canal outbound',              real: '50 llamadas/mes · 5 extensiones activas · 0.1 llam/cliente/mes',         ideal: '1,500 llamadas/mes piloto con 5 extensiones · 15 llam/día/ext' },
    { metrica: 'Trazabilidad IVR',            real: 'Self_service sin métrica de resolución vs frustración',                  ideal: 'Evento de salida del IVR con categoría: "resolvió", "frustró", "esperando agente"' },
    { metrica: 'Rescate de llamadas perdidas',real: 'Sin callback automatizado registrado al corte',                           ideal: 'Callback automatizado activado en espera >30 seg en franja 10:00–13:00' },
    { metrica: 'Calidad outbound',            real: 'JOHAN: 89.7% pérdida · BIBIANA: 78.9% pérdida — bases sucias',          ideal: 'Validación/enriquecimiento de base antes de campaña + diferenciación cobranza vs prospección' },
  ],

  plan_inmediato: [
    { accion: 'Activar bloqueo por lista negra dinámica en Callpicker para prefijos 5598-86xx / 5598-89xx y origen 5541530095 (modo cuarentena 2 semanas antes de bloqueo permanente para evitar falsos positivos)', responsable: 'SAC Callpicker', criterio: 'Reducción de ~96 llamadas/mes de ruido · Validar con origen 5547458452 y formato 2215558642880' },
    { accion: 'Confirmar unidad de "Duracion" en exports Callpicker (minutos vs segundos) — supuesto crítico del reporte', responsable: 'SAC Callpicker + equipo técnico', criterio: 'Validación documentada antes de cualquier propuesta comercial derivada' },
    { accion: 'Alineación operativa hora 08:00: al menos 2 agentes disponibles al arranque del turno', responsable: 'Dirección comercial Cintas Cove', criterio: 'Tasa de pérdida hora 08:00 ≤20% en las primeras 2 semanas' },
    { accion: 'Reunión de validación con dirección comercial Cintas Cove: presentar 5 puntos de quiebre identificados y priorizar oportunidades en conjunto', responsable: 'JMLD + Cliente', criterio: 'Sesión realizada · acuerdos documentados en minuta' },
  ],

  plan_mediano: [
    { accion: 'Activar callback automatizado para llamadas en espera >30 seg en franja pico 10:00–13:00', responsable: 'SAC Callpicker', criterio: 'Reducción de tasa de pérdida en franja a ≤15% en 30 días' },
    { accion: 'Cruzar consumo facturable (~485 min/mes, pico 690 jun) con bolsa contratada vigente y emitir recomendación de plan (preliminar: 800–1,000 min/mes)', responsable: 'SAC Callpicker', criterio: 'Recomendación de bolsa validada y comunicada al cliente' },
    { accion: 'Piloto de outbound estructurado: 15 llamadas/día por 5 extensiones (75 llamadas/día × 20 días = 1,500 llam/mes vs 50 actuales)', responsable: 'Dirección comercial Cintas Cove', criterio: 'Tasa de contacto medida al mes 1 · Pipeline generado cuantificado al mes 2' },
    { accion: 'Validación y limpieza de bases de datos en extensiones JOHAN LOPEZ (89.7% pérdida) y RODRIGUEZ BIBIANA (78.9% pérdida)', responsable: 'Dirección comercial Cintas Cove', criterio: 'Tasa de pérdida outbound de esas extensiones ≤50% tras limpieza' },
    { accion: 'Activar grabación de llamadas y aplicar rúbrica de evaluación a muestra semanal — replicar perfil consultivo de Cynthia G. García Ramírez (6.1 min promedio)', responsable: 'SAC Callpicker + Cintas Cove', criterio: 'Primer reporte de evaluación en 30 días' },
  ],

  plan_estrategico: [
    { accion: 'Piloto de Asistente Virtual Callpicker para captura de leads en fines de semana y cotización preliminar automatizada — alcance y propuesta comercial dedicada', responsable: 'JMLD Producto', criterio: 'Propuesta presentada en mes 2 · Arranque en mes 3 · Captura del 100% de leads en horarios sin agente' },
    { accion: 'Programa de cuenta clave para clientes con alto volumen de contacto identificados: 5561692266 (46 llam), 5591580500 (22), 5610658772 (20)', responsable: 'Dirección comercial Cintas Cove', criterio: 'Programa activo con SLA de respuesta diferenciado en mes 3' },
    { accion: 'Propuesta Connectivity Solutions: Peplink MultiSIM en Cuautitlán Izcalli (failover línea comercial) + Check Point perimetral (bloqueo robocalls en capa de red) + NOC 24/7 con alerta de línea silenciosa', responsable: 'JMLD Connectivity Solutions', criterio: 'Propuesta presentada como conversación independiente post-primeros resultados medibles' },
    { accion: 'Reporte de retorno vs baseline a 90 días: tasa de pérdida global ≤14% · outbound ≥1,500 llam/mes · robocalls en cero', responsable: 'JMLD SAC', criterio: 'Reporte entregado a dirección de Cintas Cove mes 3' },
  ],

  areas_oportunidad: [
    { area: 'Bloqueo robocalls (costo cero)',          impacto: 'Elimina ~96 llamadas/mes de ruido · libera IVR · devuelve validez estadística a métricas de calidad',          responsable: 'SAC Callpicker' },
    { area: 'Alineación operativa hora 08:00',         impacto: '~60 llamadas rescatadas/6 meses · fricción técnica cero · quick win de primera semana',                       responsable: 'Cintas Cove operación' },
    { area: 'Callback franja pico 10:00–13:00',        impacto: '~100 llamadas rescatadas/6 meses · configuración incluida en Callpicker',                                    responsable: 'SAC Callpicker' },
    { area: 'Piloto outbound estructurado',            impacto: '1,500 llam/mes vs 50 actuales · pipeline nuevo detectable en 60 días · costo operativo cero',               responsable: 'Cintas Cove comercial' },
    { area: 'Asistente Virtual + captura fines de semana', impacto: 'Captura del 100% de leads fuera de horario · canal WhatsApp ya publicado y disponible',               responsable: 'JMLD Producto' },
    { area: 'Programa cuentas clave',                  impacto: 'Convertir volumen de llamadas recurrente en revenue predecible · retención activa de top clientes',         responsable: 'Cintas Cove + JMLD SAC' },
    { area: 'Connectivity Solutions (diferido)',       impacto: 'Continuidad de línea comercial + protección perimetral + NOC 24/7 · proponer post-primeros resultados',     responsable: 'JMLD Connectivity' },
  ],

  perfiles: [
    {
      nombre: 'Cynthia G. García Ramírez', rol: 'Agente comercial — Perfil consultivo · outbound activo', color: '#1B3FCC',
      campos: [
        { label: 'Perfil entrante',  value: '37 llamadas atendidas · 208 min facturables · 6.1 min promedio — conversaciones largas de venta consultiva. El único perfil que se aleja de la mediana de 2 min.' },
        { label: 'Perfil saliente',  value: '135 llamadas salientes (45% del total outbound) · 77 conectadas (57% éxito) — el agente con mayor volumen y mejor tasa de contacto outbound.' },
        { label: 'Palanca',          value: 'Estudiar sus grabaciones para replicar el patrón de cierre y upsell en el resto del equipo. Perfil ideal para liderar el piloto de outbound estructurado.' },
      ],
    },
    {
      nombre: 'REYES ORDUÑA ITZEL MARISOL', rol: 'Agente de mayor volumen — cotización express', color: '#22c55e',
      campos: [
        { label: 'Métricas',   value: '186 llamadas atendidas · 186 min facturables · 2.0 min promedio — el mayor volumen del equipo al ritmo más rápido.' },
        { label: 'Perfil',     value: 'Cotización relámpago o triage a WhatsApp/portal. Congruente con modelo "recoge en 1 hora".' },
        { label: 'Potencial',  value: 'Volumen alto + ritmo alto = candidata para recibir llamadas overflow de horas pico.' },
      ],
    },
    {
      nombre: 'GALLARDO CLAUDIA', rol: 'Outbound dedicada — cobranza / prospección', color: '#f59e0b',
      campos: [
        { label: 'Métricas',  value: '90 llamadas salientes · 51 conectadas (56.7% éxito) · 0 llamadas entrantes. Perfil exclusivamente outbound.' },
        { label: 'Función',   value: 'Cobranza o prospección activa. Tasa de éxito razonable — no presenta el problema de bases sucias.' },
        { label: 'Potencial', value: 'Escalar su modelo al piloto de 5 extensiones outbound estructurado.' },
      ],
    },
    {
      nombre: 'JOHAN LOPEZ GOMEZ', rol: 'Agente con alerta de bases sucias', color: '#ef4444',
      campos: [
        { label: 'Métricas',  value: '39 llamadas salientes · solo 4 conectadas (10.3% éxito) — 89.7% pérdida. El peor resultado del equipo en outbound.' },
        { label: 'Hipótesis', value: 'Bases de datos desactualizadas / obsoletas. Posible cobranza dura con evasión activa del llamante.' },
        { label: 'Acción',    value: 'Validar y enriquecer su base antes de próximas campañas. Diferenciar cobranza de prospección.' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      '40 años de historia y modelo comercial sólido: cotización express + entrega nacional + corte a medida',
      '+3,000 clientes activos documentados — base instalada con alto potencial de outbound proactivo',
      'ISO 9001 e ISO 14001 — clientes enterprise como Mabe (Top Supplier), Televisa San Ángel',
      'MRR $13,965 con clasificación VIP — cliente de alto valor para el portafolio Callpicker',
      'Tasa de pérdida con tendencia de mejora: 25.5% (ene) → 18.1% (may) sin intervención externa',
      'Cynthia G. García Ramírez como modelo de perfil consultivo replicable en el equipo',
      'Canal WhatsApp (55 3240 1825) ya publicado y activo — infraestructura para captura asíncrona ya lista',
    ],
    oportunidades: [
      'Quick wins de costo cero: bloqueo robocalls + alineación 08:00 + callback pico → tasa de pérdida ≤14% en 90 días',
      'Outbound estructurado sobre base instalada de 3,000 clientes — 30x el volumen actual sin costo adicional de plataforma',
      'Asistente Virtual para captura de leads en fines de semana (volumen actual ~0)',
      'Programa de cuenta clave para los 3 clientes de alto volumen identificados en los datos',
      'Connectivity Solutions como complemento natural (continuidad, protección, NOC) sin competir con Callpicker',
      'Grabación + evaluación de agentes → mejora de tasa de conversión en el modelo express',
    ],
    debilidades: [
      'Desalineación horario publicado vs operado — el mercado percibe 08:00, la operación entrega ~09:30',
      'Sin lista negra activa en Callpicker — 576 robocalls en 6 meses sin filtrado',
      'Canal outbound prácticamente inactivo: 0.1 llamadas por cliente por mes',
      'Sin trazabilidad de resolución en IVR (Self_service 42.8% sin métrica)',
      'Sin callback automatizado activo al corte del reporte',
      'Bases de datos sucias en al menos 2 extensiones outbound (>78% pérdida)',
      'Concentración de volumen en 2 agentes sin protocolo de distribución documentado',
    ],
    amenazas: [
      'Futuras campañas de robocall más agresivas pueden saturar el IVR y bloquear llamadas legítimas',
      'Cliente potencial marca al 08:00, no le contestan → percibe empresa desorganizada → busca competidor',
      'Clientes activos migrando a competidor sin señal previa detectable (sin outbound proactivo)',
      'Incidente de conectividad en Cuautitlán Izcalli deja la línea comercial muerta durante horas (sin failover documentado)',
      'Si el IVR frustra en lugar de resolver, 42.8% del tráfico es churn silencioso no cuantificado',
      'Bolsa contratada desconocida — posible excedente en meses de pico (jun: 689 min facturable) sin visibilidad del cliente',
    ],
  },

  conclusion: 'Cintas Cove es un cliente sano con una operación telefónica que funciona bien como infraestructura y que puede rendir significativamente más con ajustes de costo cero o bajo. La ruta correcta no empieza con una propuesta comercial nueva — empieza con una sesión de validación con dirección comercial sobre los 5 puntos de quiebre identificados, seguida de ejecución inmediata de OP1 (alineación 08:00) y OP2 (bloqueo robocalls) sin propuesta de por medio.\n\nEl punto de tensión no es la plataforma. Es la orquestación entre horario declarado, capacidad operativa, filtrado de tráfico ilegítimo, y activación del canal saliente sobre la base instalada. Callpicker tiene los componentes técnicos para cerrar cada uno de esos puntos. La confianza se construye con acción medible, no con presentación de catálogo.',

  pierde: [
    'Si el bloqueo de robocalls no se activa → nueva ola puede saturar el IVR y bloquear llamadas legítimas de clientes reales',
    'Si la alineación 08:00 no ocurre → el mercado sigue experimentando 47% de pérdida en la primera hora de la jornada',
    'Si el outbound no se activa → los 3,000 clientes no detectan el churn hasta que ya salieron',
    'Si la bolsa contratada es insuficiente para meses de pico (jun: 689 min) → excedentes no previstos deterioran la relación',
    'Si el IVR frustra en 42.8% del tráfico sin saberlo → churn silencioso no cuantificado',
    'Si la línea comercial cae por incidente de conectividad sin failover → "cara comercial digital" desaparece durante horas',
  ],
  gana: [
    'Bloqueo de robocalls activo → IVR limpio, métricas válidas, ~96 llamadas legítimas rescatadas por mes',
    'Alineación 08:00 → primera impresión del prospecto cambia de "desorganizada" a "confiable", ~60 llamadas rescatadas/6M',
    'Callback pico 10:00–13:00 → +100 llamadas rescatadas/6M · tasa de pérdida ≤15% en la franja más demandada',
    'Piloto outbound estructurado → de 50 a 1,500 llamadas/mes → pipeline proactivo detectable en 60 días',
    'Asistente Virtual fines de semana → captura del 100% de leads en horarios sin agente · mini pipeline recurrente desde cero',
    'Reporte de retorno a 90 días → cliente ve evidencia concreta → conversación de renovación y expansión',
    'Connectivity Solutions (diferido) → posicionamiento de Callpicker como ecosistema integral, no solo telefonía',
  ],
  recomendacion_central: 'Arrancar con los dos quick wins de costo cero esta semana — bloqueo de robocalls (OP2) y alineación operativa 08:00 (OP1) — sin presentar propuesta comercial de por medio. Esto construye confianza medible en 7 días. El segundo paso es la sesión de validación con dirección comercial de Cintas Cove para priorizar OP3–OP6 juntos. El Asistente Virtual y Connectivity Solutions son la conversación de mes 3, no de hoy. La secuencia correcta es: acción medible → resultados visibles → propuesta de expansión.',
}
