import type { AuditoriaCase } from './types'

export const LINEACEL: AuditoriaCase = {
  id:     'lineacel',
  asesor: 'Claudia',

  nombre:               'LINEACEL',
  sector:               'Telecomunicaciones · Distribución BAIT · Punto de Venta',
  fecha_periodo:        '07 may – 14 ago 2026',
  fecha_auditoria:      'Ago 2026',
  tipo_cliente:         'BAIT Distribuidor · CID 180969 · Consecutivo C52 · Expansión multisucursal',
  descripcion_contexto: 'Análisis de Cliente Nuevo · Implementación operativa · Propuesta de expansión Chat API',
  estado:               'en_crecimiento',
  clasificacion:        'CONFIDENCIAL',
  version:              '1.0',

  /* ── KPIs ─────────────────────────────────────────────────────── */
  kpis: [
    { label: 'Llamadas salientes (3.3 meses)',     value: '950',           color: '#6366f1' },
    { label: 'Llamadas entrantes',                 value: '20',            color: '#94a3b8' },
    { label: 'Extensiones activas',                value: '8',             color: '#22c55e' },
    { label: 'MRR estimado (base + propuesta)',    value: '$500–$3,000',   color: '#f59e0b' },
  ],

  /* ── Resumen ejecutivo ────────────────────────────────────────── */
  resumen_ejecutivo: 'LINEACEL (Lineacel, S.A.S. de C.V.), distribuidor autorizado de BAIT con base en Toluca, Estado de México, es cliente nuevo de Callpicker desde mayo de 2026 (3.3 meses). La implementación fue completada exitosamente: 8 extensiones, IVR/menú, softphone, capacitación realizada (3 participantes). La cuenta utiliza intensivamente la plataforma para campañas salientes hacia base de datos de clientes BAIT y Movistar, con 950 llamadas salientes en el período inicial.\n\nLa operación de LINEACEL responde a un modelo de distribución y expansión: Distribuidor Autorizado BAIT, patrocinador de Club Necaxa, y actualmente en fase de crecimiento de puntos de venta (vacancias publicadas para Gerente de POS, supervisión y administración de sucursales). Los datos públicos disponibles indican que está expandiendo su red comercial.\n\nOportunidad comercial identificada: propuesta de Chat API ($32,572 + IVA) para complementar campañas salientes. Propuesta canalizada a Perfilamiento. Siguiente acción: monitoreo de adopción y seguimiento de oportunidades de expansión conforme LINEACEL crezca sus puntos de venta.',

  resultado_positivo: 'Implementación 100% completada. Cliente demuestra conocimiento avanzado de la plataforma y uso constante. Adopción rápida de funcionalidades base. Potencial de expansión alto por modelo comercial multisucursal.',

  hallazgos: [
    'Modelo de operación: campañas salientes intensivas. 950 llamadas salientes vs. 20 entrantes — uso orientado a prospección/outreach, no a recepción pasiva.',
    'Conocimiento operativo avanzado: cliente sabe manipular el administrador de forma autónoma. Capacitación fue rápida y sin pendientes.',
    'Ciclo de vida potencialmente corto: cliente indica que el registro nacional de números reducirá su base de contactos a abordar. Requiere monitoreo de retención post-registro.',
    'Oportunidad de Chat API validada: propuesta $32,572 (Chat API $299 + 10K msg + 30K msg marketing) canalizada a Perfilamiento.',
    'Señales de expansión comercial: vacancias publicadas (Gerente POS, Supervisión, Compras, Inventarios, Proveedores) indican crecimiento de sucursales.',
    'Presencia digital desigual: sitio web lineacel.com no responde (502), pero Facebook muy activo (promociones BAIT/Necaxa). Email público es Gmail.',
    'Jurisdicción verificada: Toluca, Estado de México. Razón social confirmada via Dun & Bradstreet.',
    'Relación institucional con Club Necaxa verificada: LINEACEL es patrocinador oficial, mejora perfil de seriedad corporativa.',
  ],

  /* ── Cronología ───────────────────────────────────────────────── */
  cronologia: [
    { fecha: 'May 2024',    responsable: 'LINEACEL',         evento: 'Operación verificable mínimo. Perfil laboral indica Data Science en Toluca desde mayo 2024.',                       tipo: 'ok' },
    { fecha: '2025',        responsable: 'LINEACEL/Necaxa', evento: 'Aumento significativo de huella pública. Septiembre: LINEACEL anunciado como patrocinador de Club Necaxa.',           tipo: 'pivote' },
    { fecha: '07 May 2026', responsable: 'Claudia/Enrique',  evento: 'Activación en Callpicker. Implementación completa: 8 ext, IVR, softphone, capacitación (3 part).',                 tipo: 'ok' },
    { fecha: '14 Ago 2026', responsable: 'Monse/Toño/SLAK', evento: 'Propuesta Chat API: $299 + 10K msg $480 + 30K msg $29,700 = $32,572 + IVA. Canalizada a Perfilamiento.',             tipo: 'neutral' },
    { fecha: '14 Ago 2026', responsable: 'Sistema',          evento: 'Vacante vigente: Gerente de POS en Toluca ("base de datos lineacel", apertura de sucursales, inventarios).',       tipo: 'neutral' },
  ],

  /* ── Perfil del cliente ──────────────────────────────────────── */
  perfil_campos: [
    { label: 'Razón social',         value: 'Lineacel, S.A.S. de C.V.' },
    { label: 'Giro',                  value: 'Telecomunicaciones / Comercialización de servicios móviles (BAIT)' },
    { label: 'Modelo de negocio',     value: 'Distribuidor Autorizado BAIT · Revendedor de servicios móviles · Expansión de POS' },
    { label: 'Ubicación base',        value: 'Toluca, Estado de México (Rafael M. Hidalgo 510, Col. Cuauhtémoc, CP 50130)' },
    { label: 'Plan contratado',       value: 'Base Callpicker · 8 Extensiones · Softphone · IVR/Menú' },
    { label: 'CID Zoho Desk',         value: '180969' },
    { label: 'Consecutivo',           value: 'C52' },
    { label: 'Antigüedad',            value: 'Cliente desde mayo de 2026 (3.3 meses)' },
    { label: 'Ejecutivo SAC',         value: 'Claudia H.' },
    { label: 'Ejecutivo Activaciones', value: 'Enrique' },
    { label: 'Relación institucional', value: 'Patrocinador oficial de Club Necaxa (desde sep 2025)' },
    { label: 'Historial de pagos',    value: 'Activo — sin incidencias (pagos al día)' },
  ],

  necesidad_negocio: 'Operacionalización de campañas salientes de prospección/activación. LINEACEL depende de la plataforma para ejecutar outreach masivo hacia base de datos BAIT y Movistar. El modelo es 100% saliente (950 llamadas out vs. 20 inbound en 3.3 meses). Necesidad actual: continuar campañas de activación. Necesidad futura (conforme expanda POS): conectividad, seguridad y centralización de operación multisucursal.',

  potencial_corto: [
    'Cerrar propuesta Chat API ($32,572 + IVA): complemento natural para campañas salientes con seguimiento por mensaje.',
    'Ampliar a SMS/WhatsApp API si LINEACEL lo requiere para tracking de activaciones BAIT.',
    'Validar que las 8 extensiones actuales seguirán siendo suficientes conforme abran nuevos POS, o si requerirán más líneas/grupos.',
  ],
  potencial_largo: [
    'Soluciones de SD-WAN/conectividad centralizada cuando LINEACEL expanda a múltiples sucursales — integración de inventarios, POS, cajas, seguridad.',
    'Check Point para endpoint protection en sucursales (especialmente si manejan datos BAIT/transaccionales).',
    'Migración a plataforma cloud-native cuando la operación multisucursal requiera escalabilidad y redundancia.',
    'Dashboard de análisis de campañas: integración BI para medir ROI de outreach por región/POS.',
  ],

  tacticas: [
    {
      nombre:      'Validación de propuesta Chat API',
      descripcion: 'Presentar case study de cuenta BAIT similar que haya usado Chat API para follow-up post-llamada. Mostrar tasa de conversión. Para LINEACEL, seguimiento por SMS/chat a contactos de Movistar tras llamada de activación.',
      impacto:     'Alto — justifica por qué $32,572 es inversión en conversion rate, no costo marginal.',
    },
    {
      nombre:      'Monitoreo de expansión de POS',
      descripcion: 'Establecer check-in mensual (con Claudia/Enrique) sobre estado de apertura de sucursales. Cuando comiencen a abrir, proponer consultoría de infraestructura telefónica/conectividad para cada punto nuevo.',
      impacto:     'Medio — construye relación de advisor, no solo vendor. Abre puerta a Peplink/networking cuando expandan.',
    },
    {
      nombre:      'Preparar para post-registro nacional',
      descripcion: 'Cliente anticipó que el registro nacional de números reducirá su base de contactos. Antes de que eso ocurra, proponer segmentación: BAIT (continúa vigente), Movistar (revisar regulatory), usuarios propios (base interna). Chat API sería herramienta de retención de usuarios propios.',
      impacto:     'Medio — evita que cliente cancelar post-registro. Muestra que conocemos su ciclo de negocio.',
    },
  ],

  senal_alarma: 'CICLO DE VIDA POTENCIALMENTE CORTO. Cliente indicó que el registro nacional de números bajará significativamente su base de contactos a abordar. Esa es una fecha límite operativa que debe monitorearse: si llega sin propuesta de valor post-registro, riesgo de churn. No es una señal de problema financiero — es un punto de decisión comercial clara.',

  /* ── Problema Raíz ───────────────────────────────────────────── */
  problema_raiz: 'Dependencia de base de datos externa (Movistar/BAIT) para modelo de outreach. Una vez que el registro nacional de números restrinja esa base, el cliente necesitará modelo alternativo: base interna, Chat API para retención, integraciones con CRM.',
  problema_raiz_detalle: 'El ciclo de vida operativo de LINEACEL está vinculado al registro nacional de números. Sin una alternativa de retención (Chat API, CRM propio), el cliente enfrenta churn post-registro.',

  flujo_real: [
    { fase: 'Implementación', area: 'Operaciones', accion: 'Configurar extensiones y softphone', resultado: '8 extensiones activas, capacitación completada' },
    { fase: 'Campañas activas', area: 'Ventas', accion: 'Ejecutar outreach a base BAIT/Movistar', resultado: '950 llamadas salientes en 3.3 meses' },
    { fase: 'Post-registro', area: 'Estrategia', accion: 'Transitar a modelo de base propia + Chat API', resultado: 'Pendiente de negociación' },
  ],
  comparativo: [
    { metrica: 'Llamadas salientes', real: '950', ideal: '1,200+ con Chat API activo' },
    { metrica: 'Adopción plataforma', real: 'Avanzada (autónomo)', ideal: 'Seguir igual' },
    { metrica: 'Riesgo de churn', real: 'Alto (post-registro)', ideal: 'Mitigado con propuesta Chat API' },
  ],

  plan_inmediato: [
    { accion: 'Validar propuesta Chat API con Perfilamiento', responsable: 'Claudia / Enrique', criterio: 'Propuesta presentada y aprobada' },
    { accion: 'Check-in mensual sobre expansión de POS', responsable: 'Claudia', criterio: 'Hito de apertura de nueva sucursal registrado' },
  ],
  plan_mediano: [
    { accion: 'Cierre de Chat API + integración de seguimiento', responsable: 'Ventas + Implementación', criterio: '$32,572 facturado y en producción' },
    { accion: 'Propuesta de infraestructura telefónica para sucursales', responsable: 'Consultoría', criterio: 'Propuesta de SD-WAN/Peplink enviada' },
  ],
  plan_estrategico: [
    { accion: 'Solución integral multisucursal (SD-WAN + seguridad)', responsable: 'Dir. Ventas Empresarial', criterio: 'RFP recibido y propuesta en marcha' },
    { accion: 'Dashboard de análisis de ROI por región/POS', responsable: 'BI/Integraciones', criterio: 'Prototipo funcionando' },
  ],
  areas_oportunidad: [
    { area: 'Chat API + SMS/WhatsApp', impacto: 'Alto — complemento natural para outreach', responsable: 'Enrique / Perfilamiento' },
    { area: 'Conectividad centralizada (SD-WAN)', impacto: 'Muy Alto — conforme expandan POS', responsable: 'Dir. Empresarial' },
    { area: 'Seguridad de endpoint', impacto: 'Medio — si manejan datos transaccionales', responsable: 'Consultoría Seguridad' },
  ],

  perfiles: [
    { nombre: 'Gerente Operaciones LINEACEL', rol: 'Contacto principal — toma decisiones operativas', color: '#6366f1', campos: [ { label: 'Responsable de', value: 'Administrador de plataforma, configuración diaria' } ] },
    { nombre: 'Director Comercial', rol: 'Stakeholder estratégico — decisions de inversión IT', color: '#f59e0b', campos: [ { label: 'Responsable de', value: 'Aprobación de presupuesto Chat API / infraestructura' } ] },
  ],

  foda: {
    fortalezas: [
      'Cliente muy autónomo y técnico — requiere soporte mínimo',
      'Tasa de adopción rápida — conocimiento avanzado de plataforma',
      'Modelo de negocio alineado con nuestras capacidades (outreach masivo)',
    ],
    oportunidades: [
      'Chat API $32,572 identificada y canalizada',
      'Expansión a múltiples POS = oportunidad de infraestructura centralizada',
      'Patrocinio de Club Necaxa mejora perfil corporativo',
    ],
    debilidades: [
      'Ciclo de vida potencialmente corto (dependencia de registro nacional)',
      'MRR actual bajo $13,802 — alto valor si se cierra propuesta Chat API',
    ],
    amenazas: [
      'Registro Nacional de Números reducirá base de contactos público',
      'Sin propuesta post-registro, riesgo de churn antes de fin 2026',
    ],
  },

  conclusion: 'LINEACEL es cliente nuevo con implementación exitosa y adopción avanzada. El riesgo operativo es real pero manejable: propuesta de Chat API en marcha, y plan de contingencia multisucursal identificado. Monitoreo continuo recomendado.',
  pierde: [
    'Acceso a base de contactos público (post-registro nacional)',
    'Capacidad de outreach masivo sin segmentación propia',
  ],
  gana: [
    'Chat API para retención de usuarios post-llamada',
    'Infraestructura telefónica/conectividad centralizada conforme expanda POS',
    'Dashboard de análisis de ROI por región',
  ],
  recomendacion_central: 'Cerrar propuesta Chat API en próximas 2 semanas. Establecer check-in mensual sobre expansión de POS. Preparar plan B post-registro nacional: migración a modelo de base interna + retención vía Chat/SMS.',

  /* ── Observaciones operativas ────────────────────────────────── */
  contenido_auditoria: `LINEACEL — FICHA DE CLIENTE NUEVO
Resumen de Implementación y Oportunidades

INFORMACIÓN GENERAL
- Razón social: Lineacel, S.A.S. de C.V.
- CID: 180969
- Consecutivo: C52
- Activación: 07 de mayo de 2026 (3.3 meses)
- Asesor SAC: Claudia H.
- Ejecutivo Activaciones: Enrique
- Estado: Activa, en crecimiento

IMPLEMENTACIÓN REALIZADA
✓ Configuración completada
✓ 8 Extensiones
✓ Grupos
✓ IVR / Menú
✓ Softphone
✓ Capacitación realizada (3 participantes)
✗ Integraciones (no configuradas aún)

VALIDACIÓN OPERATIVA
- Llamadas entrantes: 20 (en 3.3 meses)
- Llamadas salientes: 950 (en 3.3 meses)
- IVR: 1 configurado
- Extensiones activas: 8
- Tipo de redirecciones: Softphone

PATRÓN DE USO
LINEACEL utiliza la plataforma primordialmente para campañas salientes dirigidas a:
- Base de datos de clientes BAIT
- Base de datos de clientes Movistar
- Prospección y activación de servicios móviles

Proporción: 97.9% saliente, 2.1% entrante.

Observación: El cliente es muy autónomo en el administrador y conoce la plataforma en profundidad. No ha requerido soporte de CAC post-capacitación.

CONSIDERACIÓN CLAVE: CICLO DE VIDA
El cliente ha señalado que el Registro Nacional de Números podría reducir significativamente su base de contactos "públicos" a abordar. Esto es una realidad operativa que afectará su modelo de negocio en algún punto dentro de 2026–2027.

Impacto: Es probable que el proyecto actual (campañas salientes puras) sea de mediano/corto plazo. Sin embargo, abre ventanas para ofrecer soluciones que le ayuden a:
a) Transitar a modelo de CRM/base propia
b) Retener usuarios actuales vía Chat/SMS
c) Expandir operación de POS (para lo cual requerirá infraestructura telefónica/conectividad descentralizada)

PROPUESTA PENDIENTE
Se propuso Chat API:
- Chat API: $299
- 10,000 mensajes: $480
- 30,000 mensajes marketing: $29,700
- TOTAL: $32,572 USD + IVA

Estado: Canalizada a Perfilamiento (14 agosto 2026).

Esta propuesta tiene lógica: si LINEACEL va a activar números Movistar/BAIT, Chat permitiría seguimiento post-llamada. Sin embargo, el valor debe validarse con Perfilamiento según caso de uso real.

SEÑALES DE EXPANSIÓN
Hay evidencia pública de que LINEACEL está en fase de expansión:
- Vacancias publicadas en Computrabajo (Gerente de Punto de Venta, Agente de Ventas)
- Mención explícita de "base de datos lineacel" y apertura de "puntos de venta"
- Requisitos de supervisión, inventarios, compras, proveedores

Esto abre una hipótesis comercial más grande: si abren múltiples POS, necesitarán:
- Conectividad centralizada (SD-WAN / Peplink)
- Seguridad de endpoint (Check Point)
- Panel centralizado de operación (administración remota)

SIGUIENTE ACCIÓN SAC
1. Monitoreo y seguimiento de adopción de Chat API (resultado del perfilamiento).
2. Check-in mensual sobre expansión de POS — cuando abran nuevos puntos, proponer consultoría de infraestructura.
3. Preparar plan de contingencia para "post-registro nacional" (alternativa a outreach puro).

SALUD DE CUENTA
- Implementación: ✓ Exitosa
- Capacitación: ✓ Completada
- Adopción: ✓ Muy activos
- Pagos: ✓ Al día
- Riesgo detectado: Ciclo potencialmente corto por cambio regulatorio (registro nacional)
- Oportunidad: Expansión a infraestructura multisucursal

Clasificación: CLIENTE EN CRECIMIENTO — Monitoreo recomendado.`,
}
