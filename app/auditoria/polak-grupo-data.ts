import type { AuditoriaCase } from './types'

/**
 * Polak Grupo — auditoría v2.1 (10 sep 2026). CIERRE DEL EXPEDIENTE.
 *
 * La v2.0 se cerró con una instrucción explícita: "después de la reunión, esta
 * auditoría debe actualizarse a v2.1 con el motivo real declarado por el
 * cliente, el resultado de la negociación y la cifra reconciliada de tickets".
 * La reunión ocurrió el 10-sep a las 9:00 a.m. y esto es esa actualización.
 *
 * De esos tres pendientes, dos quedan resueltos y uno NO:
 *
 *  · Motivo real  → RESUELTO. Falla de servicio de ~4 meses (llamadas caídas y
 *    transferencias fallidas), con causa raíz INTERNA de Callpicker: la
 *    descontinuación de la plataforma Legacy y la migración a Atlas, que
 *    afectaron a clientes con configuración IP compleja en múltiples sitios.
 *  · Negociación  → NO HUBO. Contrato ya firmado con Zoom Phone; migración en
 *    1–2 meses. No existe ventana de retención.
 *  · Tickets      → SIGUE SIN RECONCILIAR. La reunión no aportó un total, así
 *    que las tres cifras (20/4, 14/2, extracto de 4 en 5 semanas) se mantienen
 *    tal cual, sin elegir una. Es el hallazgo 24 y sigue marcado [VACÍO].
 *
 * TRES DECISIONES DE FIDELIDAD AL DOCUMENTO:
 *
 *  1. Se conservan las etiquetas [VERIFICADO] / [HIPÓTESIS] / [VACÍO]. Ahora
 *     hay mucho más VERIFICADO que en la v2.0, pero lo que sigue sin confirmar
 *     —quién representó a Polak en la reunión, el total de tickets, el alcance
 *     real del problema en otras cuentas— sigue etiquetado como tal.
 *
 *  2. La fuente es un resumen automático (Fathom) de la reunión, no la
 *     transcripción ni el video. El documento lo declara y aquí también: es
 *     fuente secundaria de buena confiabilidad, no cita literal. Va escrito en
 *     el resumen ejecutivo porque condiciona cómo puede usarse este expediente.
 *
 *  3. `estado` pasa de 'en_riesgo' a 'perdido'. En la v2.0 se argumentó no usar
 *     'rescatable' porque se pinta VERDE y rebajaría una baja ya solicitada;
 *     ese razonamiento sigue vigente y ahora aplica con más fuerza: ya no hay
 *     nada que rescatar. 'perdido' se pinta GRIS (#6b7280), que es exactamente
 *     lo que corresponde a un expediente cerrado — ni alarma activa ni éxito.
 */
export const POLAK_GRUPO: AuditoriaCase = {
  id:                    'polak-grupo',
  asesor:                'Fátima',
  nombre:                'Polak Grupo',
  sector:                'Industria Química Industrial / Grupo Empresarial',
  fecha_periodo:         'Base ene–jul 2026 · Actualización 9-sep · Cierre 10-sep-2026',
  fecha_auditoria:       'Sep 2026',
  tipo_cliente:          'Mediana · 501–1,000 empleados · Planta Tlaxcala + oficinas',
  descripcion_contexto:  'BAJA CONFIRMADA — DECISIÓN DEFINITIVA, CONTRATO FIRMADO CON LA COMPETENCIA (10-sep-2026) · Migración a Zoom Phone en 1–2 meses · Causa raíz interna: migración Atlas / descontinuación Legacy · CID 74943 · 240 extensiones · Asesora: Fátima · Dueño de acción correctiva: Daniel Martínez',
  estado:                'perdido',
  clasificacion:         'CONFIDENCIAL',
  version:               '2.1',

  kpis: [
    { label: 'Falla activa sin resolver',              value: '~4 meses',        color: '#dc2626' },
    { label: 'Origen de la causa raíz',                value: 'Interno CP',      color: '#dc2626' },
    { label: 'MRR que se pierde',                      value: '~$24,020',        color: '#ef4444' },
    { label: 'Ventana de retención',                   value: '0 — ya firmó',    color: '#6b7280' },
    { label: 'Migración a Zoom Phone',                 value: '1–2 meses',       color: '#6b7280' },
  ],

  resumen_ejecutivo:
    'ESTADO: BAJA CONFIRMADA — DECISIÓN DEFINITIVA. La reunión del 10-sep-2026 cerró el caso: Polak Grupo ya firmó contrato con Zoom Phone y migrará en 1 a 2 meses. No hay ventana de retención. Queda pendiente el aviso formal de cancelación a 30 días y la corrección de la causa raíz interna.\n\n' +
    'NOTA SOBRE LA FUENTE DE ESTA ACTUALIZACIÓN. Esta versión se basa en el resumen automático (Fathom) de la reunión "Solicitud Polak - Callpicker" del 10-sep-2026, con marcas de tiempo por punto — no en la transcripción completa ni en el video revisado directamente. La grabación indica "No highlights". Se trata como fuente secundaria de buena confiabilidad (es un resumen generado del audio real, con timestamps verificables), no como transcripción literal. ' +
    'Si algún dato de este expediente se vuelve relevante para una negociación, disputa contractual o escalación formal —por ejemplo la fecha exacta del cambio de IP, o la redacción exacta con la que ingeniería atribuyó la causa—, debe verificarse contra la grabación completa antes de citarlo como definitivo. ' +
    'Tampoco se identifica en el resumen quién representó a Polak Grupo en la reunión: se asume continuidad con Gustavo Martínez Gutiérrez por ser quien inició el trámite, pero esta fuente no lo confirma. [VACÍO]\n\n' +
    'CORRECCIÓN RESPECTO A LA v2.0 — el diagnóstico previo no era la causa de la baja. Se reconoce explícitamente: el marco de las versiones v1.0 y v2.0 (uso interno vs. externo, cero módulos de adopción, percepción de plan sobredimensionado) NO fue lo que detonó la cancelación. ' +
    'La causa real, confirmada en la reunión, es una falla técnica de aproximadamente cuatro meses —llamadas caídas y transferencias fallidas del conmutador— originada en un cambio de infraestructura del propio Callpicker. ' +
    'La hipótesis 14 de la v2.0 ("la recurrencia técnica reciente pudo ser un factor contribuyente") apuntaba en la dirección correcta pero subestimó la magnitud: no fueron incidentes aislados de cinco semanas, sino un problema activo de cuatro meses con causa raíz confirmada por el propio equipo técnico de Callpicker.\n\n' +
    'Esto importa más allá de Polak: el diagnóstico de adopción y percepción de valor puede ser correcto como debilidad estructural y, al mismo tiempo, no ser la causa que finalmente detona la cancelación. Ambos diagnósticos coexisten sin invalidarse — pero solo uno explica la decisión final.\n\n' +
    'LO QUE DECLARÓ EL CLIENTE. Las fallas iniciaron hace ~4 meses (aproximadamente mayo 2026) y Polak las atribuye a un cambio de IP realizado por Callpicker. El cliente descartó explícitamente causas internas suyas con dos argumentos: el servicio funcionó bien durante años, y sus pruebas con otros proveedores fueron exitosas. Según su propio razonamiento, eso apunta a un origen del lado de Callpicker.\n\n' +
    'LO QUE CONFIRMÓ INGENIERÍA, EN LA MISMA REUNIÓN. El equipo técnico de Callpicker confirmó que las fallas se originaron en dos eventos internos: la descontinuación de la plataforma Legacy y la migración a la nueva plataforma Atlas, que afectaron a clientes con configuraciones IP complejas en múltiples sitios — exactamente el perfil de Polak Grupo (Planta Tlaxcala + Oficinas México + Almacén). ' +
    'Ingeniería atribuyó inicialmente el problema a la configuración del cliente, lo que generó sesiones de soporte prolongadas e ineficientes sin resolver la causa real durante meses.\n\n' +
    'CAMBIO DE OBJETIVO DE ESTE DOCUMENTO. Deja de ser "evitar la baja" y pasa a ser "cerrar bien, corregir la causa raíz y evitar que el mismo patrón se repita en otras cuentas". El valor que queda en este expediente ya no está en Polak — está en el cruce de cuentas con configuración IP multi-sitio que pasaron por la misma migración.\n\n' +
    'LO QUE NO SE RESOLVIÓ. La cifra total de tickets/fallas de la cuenta sigue sin reconciliar: la reunión no aportó un total y las tres fuentes internas siguen diciendo cosas distintas (Ficha CRM 20/4 · Auditoría v1.0 14/2 · Extracto reciente 4 incidentes en 5 semanas). No es crítico para el cierre administrativo, pero sí para cualquier lección aprendida que quiera cuantificarse. Se mantiene como [VACÍO], igual que en la v2.0.',

  resultado_positivo:
    'De una cuenta perdida sale un activo que no existía antes: la causa raíz técnica quedó identificada y verbalizada por dos partes independientes que llegaron a la misma conclusión por caminos distintos — el cliente, razonando desde su historial y sus pruebas con otros proveedores; e ingeniería de Callpicker, desde el registro de sus propios cambios de plataforma. Esa coincidencia es lo que convierte una hipótesis en un hallazgo utilizable.\n\n' +
    'Queda evidencia clara de que el problema no fue de percepción comercial sino de ejecución técnica interna. Eso protege la relación con otras cuentas si se actúa rápido: el problema es corregible y está localizado en un perfil técnico concreto (IP compleja, múltiples sitios, migración Atlas), no disperso.\n\n' +
    'Y queda base para una conversación de cierre profesional que puede dejar la puerta abierta a futuro: el propio cliente reconoce años de buen servicio antes de la falla. Una salida ordenada, sin fricción administrativa ni saldos en disputa, es lo que hace que esa puerta siga existiendo.',

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

    /* ── Del 9-sep, con su estado de resolución tras la reunión ─────────── */
    '9-sep · Solicitud formal de baja y portabilidad recibida vía correo, firmada por Gustavo Martínez Gutiérrez, Coordinador de Soporte Técnico de Polak Grupo — un contacto no mapeado previamente en la auditoría (los contactos registrados eran Luis Ángel Diego Acosta y Mario Bibbins). [VERIFICADO]',
    '9-sep · Se planteó que la baja confirmaba la amenaza de la v1.0 ("candidato a cambiar de proveedor si no percibe valor diferenciado"). → CORREGIDO EN v2.1: la amenaza de la v1.0 describía una debilidad estructural real, pero NO fue la causa de la cancelación. Ver hallazgo 20.',
    '9-sep · Discrepancia de tickets/fallas no reconciliada entre tres fuentes (20/4, 14/2, y un extracto reciente con 4 incidentes solo en 5 semanas). → SIGUE ABIERTO tras la reunión del 10-sep: no se aportó una cifra total. No debe presentarse ninguna como definitiva. [VACÍO]',
    '9-sep · El extracto de tickets muestra 4 incidentes técnicos de conectividad/audio entre el 5-ago y el 1-sep (#112462, #113481, #113879, #114378), con la hipótesis de que la recurrencia pudo influir en la baja. → CONFIRMADO Y AMPLIADO el 10-sep: no fueron 4 incidentes en 5 semanas, sino la parte visible de una falla activa de ~4 meses con causa raíz interna. [VERIFICADO]',
    '9-sep · Hallazgo colateral de seguridad de la información: el ticket #112752 documenta que credenciales de acceso se compartieron por correo en texto plano. No está vinculado a la baja, pero es una práctica de riesgo que debe corregirse independientemente del desenlace comercial. [VERIFICADO]',
    '9-sep · El contenido de la llamada de 79 segundos entre Fátima y Gustavo (ticket #114955) no estaba documentado; el motivo de la baja era un VACÍO. → RESUELTO el 10-sep: fallas de servicio de ~4 meses (llamadas caídas, transferencias fallidas) atribuidas por el cliente a un cambio de IP de Callpicker en mayo 2026. [VERIFICADO]',
    '9-sep · No había evidencia de un margen de negociación autorizado para la reunión del 10-sep. → YA NO APLICA: la decisión era definitiva y el contrato con el nuevo proveedor ya estaba firmado antes de la reunión. Ningún margen habría cambiado el desenlace.',

    /* ── Nuevos, reunión de cierre del 10-sep-2026 ──────────────────────── */
    'CIERRE 10-sep · 18. Las fallas reportadas por el cliente (llamadas caídas, transferencias fallidas del conmutador) llevan aproximadamente 4 meses activas al momento de la reunión — no son un evento reciente ni aislado. [VERIFICADO]',
    'CIERRE 10-sep · 19. El cliente descartó causas internas de forma razonada: años de operación estable previa y pruebas exitosas con proveedores alternos. Esto corrobora, desde el lado del cliente, la misma conclusión a la que llegó ingeniería de Callpicker por separado. [VERIFICADO]',
    'CIERRE 10-sep · 20. Causa raíz confirmada por el equipo técnico de Callpicker: descontinuación de la plataforma Legacy + migración a la plataforma Atlas, con impacto específico en clientes con configuraciones IP complejas multi-sitio. [VERIFICADO]',
    'CIERRE 10-sep · 21. Falla de proceso interno: ingeniería atribuyó inicialmente el problema a la configuración del cliente, generando múltiples rollbacks y sesiones de soporte prolongadas sin identificar la causa real durante meses. [VERIFICADO]',
    'CIERRE 10-sep · 22. La decisión de cancelación es definitiva: contrato ya firmado con Zoom Phone, migración estimada en 1–2 meses. No existe ventana de retención comercial. [VERIFICADO]',
    'CIERRE 10-sep · 23. Riesgo de portafolio no confirmado pero plausible: si la migración Atlas / descontinuación de Legacy afectó a Polak por su configuración IP multi-sitio, es razonable sospechar que otras cuentas con perfil similar (múltiples sitios, IP compleja) puedan tener el mismo problema sin haberlo reportado aún, o habiendo sido mal diagnosticadas de la misma forma ("configuración del cliente"). [HIPÓTESIS]',
    'CIERRE 10-sep · 24. No se reconcilió en esta reunión la cifra total de tickets/fallas de la cuenta (persiste la discrepancia de la v2.0). No es crítico para el cierre, pero sí para cualquier lección aprendida cuantificada. [VACÍO]',
  ],

  cronologia: [
    { fecha: 'Feb 2022',        responsable: 'Callpicker',                 evento: 'Alta de cuenta — 240 extensiones, bolsa 45,000 min/mes.', tipo: 'ok' },
    { fecha: '2022–2025',       responsable: 'Polak Grupo',                evento: 'Operación continua como central telefónica de planta. Servicio estable — el propio cliente lo reconoce en la reunión de cierre. Cero módulos de adopción activados.', tipo: 'neutral' },
    { fecha: 'Ene–Jun 2026',    responsable: 'Plataforma',                 evento: '180,923 registros generados. Pérdida saliente externa de 48.3% sin acciones correctivas documentadas.', tipo: 'problema' },
    { fecha: '~May 2026',       responsable: 'Callpicker (infraestructura)', evento: 'CAUSA RAÍZ · Descontinuación de la plataforma Legacy y migración a Atlas. El cliente lo percibe como "un cambio de IP". A partir de aquí inician las llamadas caídas y las transferencias fallidas del conmutador. [VERIFICADO 10-sep]', tipo: 'problema' },
    { fecha: 'May–Sep 2026',    responsable: 'Ingeniería Callpicker',      evento: 'Cuatro meses de falla activa. Ingeniería atribuye el problema a la configuración del cliente: múltiples rollbacks y sesiones de soporte prolongadas sin llegar a la causa real. [VERIFICADO 10-sep]', tipo: 'problema' },
    { fecha: '17 Jul 2026',     responsable: 'Fátima (KAM)',               evento: 'Llamada preventiva — única actividad de seguimiento KAM registrada en el histórico visible al corte de julio.', tipo: 'pivote' },
    { fecha: '24 Jul 2026',     responsable: 'Callpicker / ATLAS',         evento: 'Emisión de auditoría forense v1.0. Diagnóstico correcto como debilidad estructural (uso interno, cero adopción), pero ciego a la falla de plataforma que ya llevaba dos meses corriendo.', tipo: 'neutral' },
    { fecha: '05 Ago 2026',     responsable: 'Ticket #112462',             evento: 'Extensiones físicas 26xx de Tlaxcala cortaban llamadas — intermitencia de servidor SIP. Cliente confirmó estabilidad tras corrección.', tipo: 'problema' },
    { fecha: '10 Ago 2026',     responsable: 'Ticket #112752',             evento: 'Solicitud de acceso a extensión 601; credenciales compartidas por correo en texto plano (riesgo de seguridad de la información).', tipo: 'problema' },
    { fecha: '19 Ago 2026',     responsable: 'Ticket #113481',             evento: 'Llamadas cortadas entre extensiones 2617 y 2618. Cliente confirmó solución tras reinicio/ajuste de equipos.', tipo: 'problema' },
    { fecha: '25 Ago 2026',     responsable: 'Ticket #113879',             evento: 'Audio entrecortado y llamadas sin timbrar en extensiones 2109 y 2105. Revisión sin anomalías concluyentes.', tipo: 'problema' },
    { fecha: '01 Sep 2026',     responsable: 'Ticket #114378',             evento: 'Falla general de comunicación; intermitencia ~10:54–11:05 con recuperación posterior.', tipo: 'problema' },
    { fecha: '09 Sep 2026, mañana', responsable: 'Gustavo Martínez Gutiérrez', evento: 'Correo formal solicitando procedimiento de baja y portabilidad de líneas (Oficinas México, Almacén, Planta Tlaxcala).', tipo: 'problema' },
    { fecha: '09 Sep 2026',     responsable: 'Ticket #114955',             evento: 'Llamada de Fátima a Gustavo Martínez, ~79 segundos. Contenido no documentado en el sistema en ese momento.', tipo: 'pivote' },
    { fecha: '10 Sep 2026, 9:00 a.m.', responsable: 'Reunión "Solicitud Polak - Callpicker"', evento: 'REUNIÓN DE CIERRE · El cliente declara el motivo real (4 meses de fallas) y descarta causas propias. Ingeniería de Callpicker confirma la causa raíz interna: Atlas / Legacy sobre configuración IP multi-sitio.', tipo: 'pivote' },
    { fecha: '10 Sep 2026',     responsable: 'Polak Grupo',                evento: 'BAJA CONFIRMADA · Contrato ya firmado con Zoom Phone; migración en 1–2 meses. Sin ventana de retención. Se acuerda el aviso formal de cancelación a 30 días.', tipo: 'problema' },
  ],

  perfil_campos: [
    { label: 'Razón social',         value: 'Polak Grupo' },
    { label: 'CID Zoho',            value: '74943' },
    { label: 'Sector',               value: 'Industria Química Industrial · Grupo empresarial' },
    { label: 'Tamaño',              value: 'Mediana · 501–1,000 empleados · Múltiples sitios (Planta Tlaxcala + Oficinas México + Almacén)' },
    { label: 'Cliente desde',        value: 'Febrero 2022 — más de 4 años' },
    { label: 'Licencia',            value: '240 extensiones · Bolsa 45,000 min/mes · MRR ~$24,020' },
    { label: 'Asesora de cuenta',    value: 'Fátima' },
    { label: 'ESTADO AL 10-SEP-2026', value: 'BAJA CONFIRMADA — decisión definitiva. Contrato firmado con Zoom Phone; migración en 1–2 meses. Sin ventana de retención.' },
    { label: 'Causa raíz de la baja', value: 'Falla de servicio de ~4 meses (llamadas caídas, transferencias fallidas) originada en la descontinuación de Legacy y la migración a Atlas, sobre una configuración IP compleja multi-sitio. Confirmada por el cliente y por ingeniería de Callpicker en la misma reunión. [VERIFICADO]' },
    { label: 'Dueño de acción correctiva', value: 'Daniel Martínez' },
    { label: 'Perfil técnico de riesgo', value: 'IP compleja en múltiples sitios — el perfil exacto afectado por la migración Atlas. Es el criterio de cruce para revisar otras cuentas.' },
    { label: 'Tickets Zoho Desk',    value: 'NO RECONCILIADO — Ficha CRM: 20 tickets / 4 fallas · Auditoría v1.0: 14 / 2 · Extracto reciente: 4 incidentes solo entre 5-ago y 1-sep. La reunión del 10-sep no aportó un total. [VACÍO]' },
    { label: 'Adopción módulos',    value: '0 activos. Discrepancia: la ficha CRM dice 0 de 6; la auditoría y el perfil ampliado dicen 0 de 8. No reconciliado. Relevante como debilidad estructural, NO como causa de la baja.' },
    { label: 'Fuente de la v2.1',   value: 'Resumen automático (Fathom) de la reunión del 10-sep-2026, con marcas de tiempo. Fuente secundaria de buena confiabilidad; no es transcripción literal ni video revisado.' },
  ],

  necesidad_negocio:
    'La necesidad de negocio de Polak Grupo era la que siempre fue: comunicación operativa confiable en una planta de industria química que opera 24/7 en varios sitios. Durante más de tres años Callpicker la cubrió — el propio cliente lo reconoce. Lo que cambió no fue la necesidad, fue la capacidad de cubrirla.\n\n' +
    'Desde ~mayo 2026, con la descontinuación de Legacy y la migración a Atlas, el servicio dejó de sostener esa necesidad básica: llamadas que se caen y transferencias que fallan en un entorno donde la comunicación entre planta, vigilancia y oficinas es operación, no comodidad. Cuatro meses después, el cliente resolvió su necesidad con otro proveedor.\n\n' +
    'Las dos necesidades de fondo que identificó la v1.0 —comunicación interna confiable entre áreas de planta, y asegurar que las llamadas al exterior realmente conecten— siguen siendo diagnósticos válidos de la cuenta. Pero conviene ser precisos: describían una relación desaprovechada, no una relación rota. Lo que la rompió fue la falla de plataforma.',

  potencial_corto: [
    'Cerrar administrativamente sin fricción: aviso formal de cancelación a 30 días, última factura, portabilidad de los tres rangos (Oficinas México, Almacén, Planta Tlaxcala) y cero saldos en disputa.',
    'Documentar el RCA interno de la cuenta — qué se cambió en la migración, qué se rompió, y por qué el diagnóstico apuntó al cliente durante meses.',
    'Cruzar la cartera buscando cuentas con configuración IP multi-sitio que hayan pasado por la migración Atlas / descontinuación Legacy. Esta es la acción con mayor valor de todo el expediente.',
    'Corregir el hallazgo de seguridad del ticket #112752: prohibir el envío de credenciales por correo en texto plano, con independencia del desenlace comercial.',
  ],

  potencial_largo: [
    'Corregir el protocolo de diagnóstico de ingeniería: no atribuir por defecto al cliente sin haber descartado primero causas de plataforma.',
    'Comunicación proactiva a las cuentas del mismo perfil técnico, ANTES de que lleguen solas a la misma conclusión que Polak.',
    'Incorporar al playbook de auditorías SAC la lección de este caso: una falla de plataforma mal diagnosticada como falla de cliente no aparece en el Health Score de una cuenta individual.',
    'Dejar la puerta abierta con Polak: el cliente reconoce años de buen servicio previo. Un cierre profesional y la causa raíz corregida son la única base realista para un regreso futuro.',
  ],

  tacticas: [
    {
      nombre:      'Cerrar bien, no discutir la decisión',
      descripcion: 'El contrato con Zoom Phone ya está firmado. Insistir en retener después de eso destruye lo único que queda en juego, que es la calidad de la salida y la posibilidad de un regreso futuro. La postura correcta es ejecutar el aviso de 30 días y el cierre administrativo con precisión.',
      impacto:     'Alto — es lo único que todavía está bajo control de Callpicker en esta cuenta.',
    },
    {
      nombre:      'Tratar la causa raíz como hallazgo de portafolio, no de cuenta',
      descripcion: 'El valor de este expediente ya no está en Polak. Está en el cruce de cuentas con configuración IP multi-sitio que pasaron por la migración Atlas. Si aparecen dos o más con el mismo patrón, esto deja de ser un caso aislado y se convierte en un hallazgo sistémico que exige RCA formal y comunicación proactiva.',
      impacto:     'Crítico — determina si Polak fue la primera de varias o la única.',
    },
    {
      nombre:      'Corregir el sesgo de diagnóstico, no solo el incidente',
      descripcion: 'Arreglar la configuración de Polak ya no sirve de nada. Lo que sí sirve es corregir el reflejo que hizo que ingeniería atribuyera el problema al cliente durante cuatro meses. Ese sesgo, si no se corrige, se repite con el siguiente cliente afectado exactamente igual.',
      impacto:     'Alto — es la diferencia entre una lección aprendida y una lección repetida.',
    },
    {
      nombre:      'Separar el diagnóstico correcto de la causa real',
      descripcion: 'La v1.0 y la v2.0 diagnosticaron bien una debilidad estructural (cero adopción, plan percibido como sobredimensionado) y aun así no vieron lo que iba a matar la cuenta. Al leer cualquier otra auditoría, la pregunta obligada es: además de esta debilidad, ¿hay una falla técnica activa que nadie está contando?',
      impacto:     'Alto — corrige un punto ciego metodológico que afecta a toda la cartera auditada.',
    },
  ],

  senal_alarma:
    'CUATRO MESES DE FALLA ACTIVA SIN QUE NADIE LA CONTARA COMO TAL. La señal no fue que faltara información: fue que la información existía repartida en tickets individuales, cada uno cerrado como resuelto, y ninguna instancia la sumó. La auditoría v1.0 se emitió en julio, con la falla ya corriendo desde mayo, y no la vio. La v2.0 vio cuatro incidentes en cinco semanas y los trató como una hipótesis secundaria.\n\n' +
    'La segunda señal es de proceso: ingeniería atribuyó el problema a la configuración del cliente y esa atribución sobrevivió meses de rollbacks y sesiones de soporte. Un diagnóstico equivocado que nadie vuelve a cuestionar cuesta más que no tener diagnóstico.\n\n' +
    'La tercera es la que todavía está viva: si el patrón (Atlas/Legacy sobre IP multi-sitio) afecta a otras cuentas, se está repitiendo ahora mismo, en silencio, en cuentas que aún no han llamado. [HIPÓTESIS]',

  problema_raiz:        'Falla de plataforma interna (migración Atlas / descontinuación Legacy) sobre configuración IP multi-sitio, mal diagnosticada como falla del cliente durante ~4 meses',
  problema_raiz_detalle:
    'La causa raíz de la pérdida de Polak Grupo NO es comercial ni de adopción. Es técnica y es interna de Callpicker: la descontinuación de la plataforma Legacy y la migración a la plataforma Atlas, alrededor de mayo de 2026, degradaron el servicio de los clientes con configuraciones IP complejas en múltiples sitios. Polak es exactamente ese perfil — Planta Tlaxcala, Oficinas México y Almacén. El síntoma para el cliente fue concreto y cotidiano: llamadas que se caen y transferencias que no se completan. [VERIFICADO — confirmado por ingeniería de Callpicker en la reunión del 10-sep]\n\n' +
    'Sobre esa causa técnica se montó una segunda causa, de proceso, que es la que convirtió una falla corregible en una baja: ingeniería atribuyó inicialmente el problema a la configuración del cliente. Esa atribución dirigió meses de rollbacks y sesiones de soporte prolongadas hacia el lado equivocado. El cliente, mientras tanto, hacía su propia investigación: comprobó que el servicio había funcionado bien durante años y que sus pruebas con otros proveedores eran exitosas. Llegó a la conclusión correcta antes que Callpicker. [VERIFICADO]\n\n' +
    'El problema raíz identificado en las versiones v1.0 y v2.0 —cero módulos activos, sin visibilidad del propio tráfico, plan percibido como sobredimensionado— sigue siendo un diagnóstico válido de la cuenta, y explica por qué la relación no tenía profundidad suficiente para absorber una crisis técnica. Pero no explica la baja. Se conserva aquí como debilidad estructural, degradado de "causa" a "contexto". [CORRECCIÓN vs v2.0]\n\n' +
    'La pregunta abierta que queda no es sobre Polak: es cuántas cuentas más comparten el perfil técnico afectado y todavía no lo han reportado, o lo reportaron y fueron diagnosticadas de la misma forma equivocada. [HIPÓTESIS]',

  flujo_real: [
    { fase: '1 · Estado previo (2022–abr 2026)', area: 'Planta Tlaxcala + Oficinas México + Almacén', accion: 'Operación normal como central telefónica multi-sitio 24/7', resultado: 'Servicio estable durante más de 3 años — reconocido por el propio cliente en la reunión de cierre' },
    { fase: '2 · Cambio de infraestructura (~may 2026)', area: 'Plataforma Callpicker', accion: 'Descontinuación de Legacy y migración a Atlas', resultado: 'Degradación en clientes con configuración IP compleja multi-sitio. El cliente lo percibe como "un cambio de IP"' },
    { fase: '3 · Síntoma en el cliente', area: 'Conmutador y extensiones de Polak', accion: 'Personal intenta operar normalmente', resultado: 'Llamadas caídas y transferencias fallidas de forma recurrente durante ~4 meses' },
    { fase: '4 · Diagnóstico equivocado', area: 'Ingeniería Callpicker', accion: 'Se atribuye el problema a la configuración del cliente', resultado: 'Múltiples rollbacks y sesiones de soporte prolongadas sin tocar la causa real' },
    { fase: '5 · Investigación del cliente', area: 'Soporte Técnico de Polak', accion: 'Compara con su historial y prueba proveedores alternos', resultado: 'Concluye que el origen está del lado de Callpicker — y llega a esa conclusión antes que Callpicker' },
    { fase: '6 · Decisión', area: 'Polak Grupo', accion: 'Firma contrato con Zoom Phone y solicita baja y portabilidad', resultado: 'Baja confirmada. Migración en 1–2 meses. Sin ventana de retención' },
    { fase: '7 · Riesgo latente', area: 'Otras cuentas del mismo perfil técnico', accion: 'Pendiente de cruce con Ingeniería', resultado: 'Cuentas multi-sitio con IP compleja que pasaron por Atlas pueden estar en la fase 3 o 4 en este momento [HIPÓTESIS]' },
  ],

  comparativo: [
    { metrica: 'Tiempo hasta identificar la causa raíz', real: '~4 meses (may–sep 2026)',                 ideal: 'Días — con escalamiento a plataforma tras el 2º reporte del mismo síntoma' },
    { metrica: 'Atribución inicial del problema',       real: 'A la configuración del cliente (incorrecta)', ideal: 'Descartar causas de plataforma ANTES de atribuir al cliente' },
    { metrica: 'Quién llegó primero al diagnóstico',    real: 'El cliente, por su cuenta',                 ideal: 'El proveedor, con sus propios registros de cambio' },
    { metrica: 'Correlación de tickets del mismo síntoma', real: 'Cada ticket cerrado de forma aislada',   ideal: 'Patrón detectado y agregado en un solo caso de plataforma' },
    { metrica: 'Ventana de retención al momento de la reunión', real: '0 — contrato con la competencia ya firmado', ideal: 'Intervención antes de que el cliente evalúe alternativas' },
    { metrica: 'Cuentas del mismo perfil ya revisadas', real: '0 — cruce pendiente con Ingeniería',        ideal: 'Listado completo con estatus por cuenta' },
    { metrica: 'Tickets/fallas totales de la cuenta',   real: 'NO RECONCILIADO — 20/4 vs 14/2 vs extracto parcial', ideal: 'Una cifra única y verificable por cuenta' },
    { metrica: 'Módulos de adopción activos',           real: '0 (de 6 según CRM / de 8 según auditoría)',  ideal: '5+ módulos activos — debilidad estructural real, no causa de la baja' },
    { metrica: 'Actividad KAM registrada',              real: '1 actividad al corte de julio · 0 entre 17-jul y 9-sep', ideal: 'Revisión trimestral documentada' },
  ],

  plan_inmediato: [
    { accion: 'Enviar a Polak el aviso/solicitud formal de cancelación con 30 días de anticipación, según lo acordado en la reunión del 10-sep', responsable: 'Daniel Martínez', criterio: 'Correo enviado y acuse de recibo del cliente' },
    { accion: 'Revisar la cuenta de Polak para identificar y corregir formalmente la causa raíz — documentar el RCA interno', responsable: 'Daniel Martínez', criterio: 'RCA documentado y compartido con Ingeniería' },
    { accion: 'Cruzar cuentas con configuración IP multi-sitio afectadas por la migración Atlas / descontinuación Legacy, contra tickets de "falla de plataforma", "falla SIP" o similares de los últimos 4–6 meses', responsable: 'David Avilés (Ingeniería)', criterio: 'Listado de cuentas en riesgo similar, con estatus de cada una' },
    { accion: 'Confirmar cierre administrativo: última factura, portabilidad de los rangos solicitados (Oficinas México, Almacén, Planta Tlaxcala), sin cargos pendientes en disputa', responsable: 'Fátima + Facturación', criterio: 'Cierre administrativo sin saldos en disputa' },
  ],

  plan_mediano: [
    { accion: 'Corregir el protocolo de diagnóstico para que ingeniería no atribuya por defecto al cliente sin descartar primero causas de plataforma', responsable: 'David Avilés (Ingeniería)', criterio: 'Checklist de diagnóstico actualizado' },
    { accion: 'Registrar la lección aprendida en el expediente de cuentas: falla de plataforma mal diagnosticada como falla de cliente, en cuentas multi-sitio', responsable: 'Fátima / SAC', criterio: 'Nota incorporada al playbook de auditorías SAC' },
    { accion: 'SI EL CRUCE ARROJA 2 O MÁS CUENTAS · Elevar a hallazgo de causa raíz sistémica: RCA formal y comunicación proactiva a esas cuentas antes de que lleguen solas a la conclusión de Polak', responsable: 'Ingeniería + Dirección Callpicker', criterio: 'RCA formal emitido y cuentas contactadas de forma proactiva' },
    { accion: 'INDEPENDIENTE DEL DESENLACE · Corrección del hallazgo de seguridad: prohibir el envío de credenciales por correo en texto plano (ticket #112752)', responsable: 'Equipo técnico Callpicker', criterio: 'Procedimiento corregido y comunicado' },
  ],

  plan_estrategico: [
    { accion: 'Incorporar al ciclo de auditoría una revisión explícita de fallas técnicas activas: además de la debilidad estructural, preguntar siempre si hay una falla de plataforma en curso que los tickets individuales no estén agregando', responsable: 'SAC / ATLAS', criterio: 'Sección de continuidad técnica presente en toda auditoría nueva' },
    { accion: 'Instrumentar detección de patrones entre cuentas: correlacionar tickets del mismo síntoma en cuentas con el mismo perfil técnico, en vez de cerrarlos uno a uno', responsable: 'Ingeniería + Producto', criterio: 'Alerta por patrón de síntoma repetido entre cuentas' },
    { accion: 'Verificar si el mismo mecanismo aplica a otras correcciones parciales: una solución aplicada en un dominio que no se extendió a los dominios nuevos con la misma causa raíz', responsable: 'Ingeniería', criterio: 'Revisión documentada de correcciones aplicadas parcialmente' },
    { accion: 'Mantener la relación con Polak abierta a futuro, con la causa raíz corregida como argumento verificable de regreso', responsable: 'Fátima + Dirección Callpicker', criterio: 'Contacto de cortesía posterior a la migración, sin agenda comercial inmediata' },
  ],

  areas_oportunidad: [
    { area: 'Cruce de cuentas IP multi-sitio (Atlas/Legacy)', impacto: 'CRÍTICO — es la acción de mayor valor de todo el expediente; determina si Polak fue la primera de varias o la única', responsable: 'David Avilés (Ingeniería)' },
    { area: 'RCA interno de la causa raíz',                   impacto: 'CRÍTICO — sin documentarlo, la corrección depende de la memoria de quienes estuvieron en la reunión', responsable: 'Daniel Martínez' },
    { area: 'Protocolo de diagnóstico de ingeniería',         impacto: 'Alto — el sesgo de atribuir al cliente es lo que convirtió una falla corregible en una baja', responsable: 'David Avilés (Ingeniería)' },
    { area: 'Cierre administrativo sin fricción',             impacto: 'Alto — es lo único que todavía protege la posibilidad de un regreso futuro', responsable: 'Fátima + Facturación' },
    { area: 'Detección de patrones entre cuentas',            impacto: 'Alto — cada ticket se cerró como resuelto y nadie sumó los cuatro meses', responsable: 'Ingeniería + Producto' },
    { area: 'Seguridad: credenciales en texto plano',         impacto: 'Medio-Alto — riesgo que trasciende la relación comercial; debe corregirse aunque la cuenta ya esté perdida', responsable: 'Equipo técnico' },
    { area: 'Reconciliación de tickets de la cuenta',         impacto: 'Medio — no bloquea el cierre, pero sin ella no hay lección aprendida cuantificable', responsable: 'Equipo técnico' },
  ],

  perfiles: [
    {
      nombre: 'Gustavo Martínez Gutiérrez',
      rol:    'Coordinador de Soporte Técnico, Polak Grupo',
      color:  '#dc2626',
      campos: [
        { label: 'Rol en el evento',   value: 'Autor del correo de solicitud de baja y portabilidad (9-sep-2026)' },
        { label: 'Contacto',           value: 'gustavo.martinez@polakgrupo.com · +52 5519460500 ext. 2705 · +52 55 4455 9974' },
        { label: 'Participación en la reunión de cierre', value: 'NO CONFIRMADA. El resumen de la reunión del 10-sep no identifica a quién representó a Polak. Se asume continuidad con Gustavo por ser quien inició el trámite, pero esta fuente no lo confirma. [VACÍO]' },
        { label: 'Lectura del perfil', value: 'Su rol es técnico, no comercial — coherente con que la causa de la baja resultara ser técnica y no de percepción de valor. Que la baja la iniciara Soporte Técnico y no Compras era, en retrospectiva, la primera pista del motivo real' },
      ],
    },
    {
      nombre: 'Daniel Martínez',
      rol:    'Callpicker — Dueño de la acción correctiva (NUEVO en v2.1)',
      color:  '#0ea5e9',
      campos: [
        { label: 'Responsabilidad 1', value: 'Enviar el aviso/solicitud formal de cancelación con 30 días de anticipación, según lo acordado en la reunión' },
        { label: 'Responsabilidad 2', value: 'Revisar la cuenta de Polak para identificar y corregir formalmente la causa raíz, y documentar el RCA interno' },
        { label: 'Criterio de cierre', value: 'Acuse de recibo del cliente sobre el aviso + RCA documentado y compartido con Ingeniería' },
      ],
    },
    {
      nombre: 'David Avilés',
      rol:    'Ingeniería Callpicker — Cruce de portafolio (NUEVO en v2.1)',
      color:  '#f59e0b',
      campos: [
        { label: 'Responsabilidad 1', value: 'Cruzar cuentas con configuración IP multi-sitio que pasaron por la migración Atlas / descontinuación Legacy, contra tickets de "falla de plataforma" o "falla SIP" de los últimos 4–6 meses' },
        { label: 'Responsabilidad 2', value: 'Corregir el protocolo de diagnóstico: no atribuir por defecto al cliente sin descartar primero causas de plataforma' },
        { label: 'Umbral de escalamiento', value: 'Si aparecen 2 o más cuentas con el mismo patrón, deja de ser un caso aislado y pasa a hallazgo sistémico con RCA formal y comunicación proactiva' },
      ],
    },
    {
      nombre: 'Fátima',
      rol:    'Asesora de cuenta Callpicker (KAM)',
      color:  '#7c3aed',
      campos: [
        { label: 'Rol en el cierre',   value: 'Cierre administrativo junto con Facturación (última factura, portabilidad de los tres rangos, sin saldos en disputa) y registro de la lección aprendida en el playbook SAC' },
        { label: 'Actividad previa',   value: '1 llamada preventiva registrada (17-jul-2026); dos intentos de llamada a Gustavo el 9-sep, uno contestado ~79 s' },
        { label: 'Lectura de la brecha KAM', value: 'Entre el 17-jul y el 9-sep no hay seguimiento KAM registrado. Con la causa raíz ya confirmada, la lectura correcta es matizada: más seguimiento probablemente no habría evitado la baja —la falla era de plataforma— pero sí habría detectado antes los cuatro meses de fallas y elevado el caso a ingeniería por otra vía' },
      ],
    },
    {
      nombre: 'Luis Ángel Diego Acosta / Mario Bibbins',
      rol:    'Interlocutores previos registrados en la ficha',
      color:  '#64748b',
      campos: [
        { label: 'Situación',       value: 'Contactos originalmente registrados en la ficha de la cuenta. No participan en el evento de baja según la evidencia disponible' },
        { label: 'Pregunta abierta', value: '¿Siguen activos en Polak Grupo? Queda sin responder y ya no es determinante para el desenlace. [VACÍO]' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      'Causa raíz técnica identificada y verbalizada por dos partes independientes —el cliente y el equipo de ingeniería— que llegaron a la misma conclusión por caminos distintos.',
      'El problema está localizado en un perfil técnico concreto y acotable: IP compleja, múltiples sitios, migración Atlas. Es cruzable contra la cartera.',
      'El cliente reconoce explícitamente años de buen servicio previo — la relación no se rompió por desconfianza acumulada sino por una falla puntual y prolongada.',
      'Respuesta operativa relativamente rápida ticket por ticket (mismo día o días siguientes), aunque sin agregación del patrón.',
    ],
    oportunidades: [
      'El cruce de cuentas con el mismo perfil técnico puede evitar la repetición del ciclo —4 meses de fallas, diagnóstico equivocado, cancelación silenciosa— en cuentas que hoy están en curso.',
      'Corregir el protocolo de diagnóstico de ingeniería tiene efecto sobre toda la cartera, no solo sobre las cuentas afectadas por Atlas.',
      'Una salida ordenada y sin fricción administrativa deja abierta la puerta a un regreso, con la causa raíz corregida como argumento verificable.',
      'Lección metodológica para el ciclo de auditoría: preguntar siempre si hay una falla técnica activa además de la debilidad estructural.',
    ],
    debilidades: [
      'Cuatro meses de falla activa sin que ninguna instancia agregara los tickets individuales en un solo caso de plataforma.',
      'Ingeniería atribuyó el problema a la configuración del cliente y esa atribución sobrevivió meses de rollbacks sin volver a cuestionarse.',
      'El cliente llegó al diagnóstico correcto antes que el proveedor, usando solo su historial y pruebas con terceros.',
      'Las auditorías v1.0 y v2.0 no detectaron la falla en curso: diagnosticaron correctamente una debilidad estructural y trataron la señal técnica como hipótesis secundaria.',
      'Discrepancia de tickets/fallas todavía sin reconciliar — impide cuantificar la lección aprendida.',
    ],
    amenazas: [
      '🔴 MATERIALIZADA (10-sep-2026): baja confirmada, contrato firmado con Zoom Phone, migración en 1–2 meses. Se pierde una cuenta de 4+ años, 240 extensiones y MRR ~$24,020.',
      'Si el mismo patrón (Atlas/Legacy + IP multi-sitio) afecta a otras cuentas y no se revisa proactivamente, Callpicker puede perder más cuentas del mismo perfil de la misma forma: en silencio, durante meses, hasta que el cliente ya firmó con la competencia. [HIPÓTESIS]',
      'La atribución inicial de ingeniería al cliente, en vez de a la plataforma, es un patrón de proceso que se repetirá con el siguiente cliente afectado si no se corrige.',
      'Riesgo de continuidad no resuelto que se pierde con la cuenta: 43.3% de pérdida en llamadas hacia Vigilancia en una planta de industria química.',
    ],
  },

  conclusion:
    'Polak Grupo se fue por una falla nuestra. Esa es la conclusión de este expediente, y conviene escribirla sin suavizarla: la descontinuación de Legacy y la migración a Atlas degradaron el servicio de un cliente con configuración IP multi-sitio desde ~mayo de 2026, ingeniería atribuyó el problema a la configuración del cliente, y esa atribución dirigió cuatro meses de rollbacks y sesiones de soporte hacia el lado equivocado. El cliente llegó al diagnóstico correcto antes que nosotros, con nada más que su propio historial y unas pruebas con otros proveedores.\n\n' +
    'La segunda conclusión es metodológica y corrige a este mismo expediente. Las versiones v1.0 y v2.0 diagnosticaron cero adopción, uso mayoritariamente interno y un plan percibido como sobredimensionado. Ese diagnóstico era correcto como debilidad estructural, y sigue siéndolo. Pero no era la causa. Un análisis puede ser acertado y aun así no explicar la decisión del cliente — y aquí el punto ciego fue una falla técnica activa que ninguna de las dos versiones contó como tal, porque los tickets se habían cerrado uno a uno como resueltos.\n\n' +
    'La tercera es la única que todavía puede cambiar algo. Este hallazgo no debe quedarse dentro del expediente de una cuenta perdida. El patrón —migración Atlas + descontinuación Legacy sobre clientes con IP compleja multi-sitio, con ingeniería atribuyendo el problema al cliente— es exactamente el tipo de falla que no se ve en el Health Score de una cuenta individual, pero sí se ve al comparar varias cuentas con el mismo perfil técnico. Si el cruce con Ingeniería arroja dos o más cuentas con el mismo patrón, deja de ser el caso de Polak y se convierte en un hallazgo de causa raíz sistémica que exige RCA formal y comunicación proactiva antes de que esas cuentas lleguen solas a la misma conclusión.\n\n' +
    'Polak Grupo pasa de "en riesgo" a "baja confirmada, en proceso de salida". El valor de este expediente ya no está en retener la cuenta, sino en dos cosas: cerrar de forma ordenada y sin fricción administrativa adicional, y usar la causa raíz confirmada para revisar si el mismo patrón está latente en otras cuentas antes de que se repita el mismo ciclo de cuatro meses de fallas no resueltas seguido de una cancelación evitable.\n\n' +
    'Este documento se considera el cierre del expediente de auditoría de Polak Grupo, salvo que surja información adicional relevante — por ejemplo la respuesta del cliente al aviso de cancelación, o los hallazgos del cruce de cuentas.\n\n' +
    'LIMITACIONES DECLARADAS — no inferir más allá de lo que dicen las fuentes:\n' +
    '· La fuente de esta versión es el resumen automático (Fathom) de la reunión del 10-sep, con timestamps, no la transcripción completa ni el video. Fuente secundaria de buena confiabilidad, no cita literal.\n' +
    '· No se identifica quién representó a Polak Grupo en la reunión. Se asume continuidad con Gustavo Martínez Gutiérrez, sin confirmación. [VACÍO]\n' +
    '· No se cuenta con el total reconciliado de tickets/fallas de la cuenta — persisten tres cifras distintas (20/4, 14/2, y un extracto parcial reciente). [VACÍO]\n' +
    '· La fecha exacta del cambio de IP y la redacción exacta con que ingeniería atribuyó la causa deben verificarse contra la grabación completa antes de citarse en cualquier negociación, disputa contractual o escalación formal.\n' +
    '· El riesgo de que otras cuentas del mismo perfil estén afectadas es una HIPÓTESIS razonable, pendiente de confirmar mediante el cruce con Ingeniería.\n\n' +
    'FUENTES UTILIZADAS: resumen automático (Fathom) de la reunión "Solicitud Polak - Callpicker" del 10-sep-2026; auditoría v2.0 del 9-sep-2026; auditoría forense v1.0 (ene–jul 2026); ficha de cuenta CRM (Zoho); correo de Gustavo Martínez Gutiérrez del 9-sep-2026; extracto de los 10 tickets más recientes de Zoho Desk al 9-sep-2026.',

  pierde: [
    'La cuenta completa: 240 extensiones, bolsa de 45,000 min/mes, MRR ~$24,020 y una relación de más de cuatro años desde febrero de 2022. De las cuentas auditadas, una de las de mayor tamaño de licencia.',
    'La oportunidad de convertir a Polak en referencia de adopción (Panel Administrador, IA de Voz) que se planteó en la v1.0 — queda cerrada.',
    'La posibilidad de corregir el hallazgo de Vigilancia (43.3% de pérdida en salientes) en una planta de industria química: un riesgo de continuidad que trasciende lo comercial.',
    '~4,516 contactos salientes externos fallidos en 7 meses que nunca se diagnosticaron — clientes, proveedores y transportistas que no recibieron llamada.',
    'La confianza de un cliente que operó estable durante tres años y que se fue por una falla que era nuestra y que tardamos cuatro meses en reconocer.',
  ],

  gana: [
    'Una causa raíz técnica confirmada por dos fuentes independientes — insumo directo para prevenir la repetición del patrón en otras cuentas.',
    'Evidencia clara de que el problema no fue de percepción comercial sino de ejecución técnica interna: eso protege la relación con otras cuentas si se actúa rápido.',
    'Un criterio de cruce concreto y accionable para revisar la cartera: cuentas con IP compleja multi-sitio que pasaron por la migración Atlas / descontinuación Legacy.',
    'Una corrección de proceso identificada: no atribuir por defecto al cliente sin descartar primero causas de plataforma.',
    'Una lección metodológica para el ciclo de auditoría: un diagnóstico estructural correcto puede convivir con un punto ciego técnico que es el que realmente detona la baja.',
    'Base para un cierre profesional que deja la puerta abierta — el cliente reconoce años de buen servicio antes de la falla.',
  ],

  recomendacion_central:
    'Dejar de tratar esto como el expediente de una cuenta perdida y tratarlo como el primer caso de un patrón por confirmar. Polak ya no es recuperable —el contrato con Zoom Phone está firmado— y toda energía puesta en discutir esa decisión resta de lo único que todavía se puede cambiar.\n\n' +
    'La acción de mayor valor es una y es concreta: pedir a David Avilés el listado de cuentas con configuración IP multi-sitio que pasaron por la migración Atlas / descontinuación de Legacy, y cruzarlo contra tickets de "falla de plataforma" o "falla SIP" de los últimos 4 a 6 meses. Si aparecen dos o más cuentas con el mismo patrón, esto deja de ser el caso de Polak y se convierte en un hallazgo de causa raíz sistémica que exige RCA formal y contacto proactivo con esas cuentas — antes de que lleguen solas a la misma conclusión.\n\n' +
    'En paralelo, cerrar bien: aviso formal de cancelación a 30 días, cierre administrativo sin saldos en disputa y portabilidad de los tres rangos. Es lo único que todavía protege la posibilidad de un regreso futuro.\n\n' +
    'Y corregir el sesgo, no solo el incidente. Arreglar la configuración de Polak ya no sirve de nada; lo que sirve es que ingeniería no vuelva a atribuir por defecto al cliente sin haber descartado primero causas de plataforma. Ese reflejo, sin corregir, se repite idéntico con el siguiente cliente afectado.',
}
