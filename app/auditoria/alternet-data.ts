import type { AuditoriaCase } from './types'

// ─────────────────────────────────────────────────────────────────────────────
// ALTERNET · C10 · CID 122421 · v2.0 · 26 nov 2026
//
// A · LO QUE EL DOCUMENTO NO SABE (y cambia todo)
//   El corte nuevo audita el desempeño telefónico de una cuenta que PIDIÓ LA
//   BAJA el 25 sep 2026 y cuya alerta `baja_declarada` lleva 62 días abierta en
//   severidad crítica. El documento no la menciona ni una vez, y cierra
//   prometiendo «70%+ de atención en los próximos 60 días».
//   El motivo que dio Anahí por escrito — «estamos en etapa de automatización e
//   integraciones de agentes IA, y buscamos mayor control de nuestras métricas»
//   — es EXACTAMENTE el portafolio que el documento recomienda venderle. La
//   causa del churn y la oportunidad de expansión son el mismo objeto.
//
// B · LO QUE EL DOCUMENTO LEE AL REVÉS
//   Presenta una curva de desempeño («mejora hasta agosto, rebrote en nov»)
//   sobre lo que en realidad es un desenganche. Contestadas: 1,166 en mayo →
//   471 en septiembre (−60%). Plan: nunca pasó del 19% y cayó 19% → 10% → 9%.
//   Agosto «mejora» a 30.3% porque entra menos, no porque atienda más — el
//   mismo patrón de [[cargo-lift]].
//
// C · LAS CIFRAS QUE NO CIERRAN (las midió scripts/concilia-auditoria-alternet.py)
//   Diez fallas y un aviso. Cierran bien: el universo (12,796), los 11 % de
//   pérdida mensuales, y los cortes por línea, día y evaluación. NO cierran:
//     1. KPI duración 1.31 min contra 0.84 del propio cuerpo (ponderada: 0.80).
//        1.31 es el valor de noviembre, no del periodo.
//     2. La tabla de agentes suma 12,712 de 12,796: 84 llamadas y 71 perdidas
//        sin cubo «otros».
//     3. «Acumulan 1,866 llamadas perdidas» usa el total ASIGNADO de las cinco
//        extensiones; sus perdidas son 1,772. Otro párrafo lo dice bien.
//     4. «El resto del equipo opera entre 48% y 55%»: Miriam Flores va en 37.8%
//        y Gerardo Ligorio en 55.6%.
//     5. «Lilian y Ximena son los únicos en zona aceptable» contra su propia
//        tabla, que marca TRES en verde (M. G. Fuentes, 26.0%).
//     6. «Ximena, el mayor volumen del equipo»: Lilian tiene 4,071 y Ximena 3,504.
//     7. «5,539 perdidas sin devolución» en el mismo renglón que dice que 531
//        sí se devolvieron. Sin devolución son 5,008.
//     8. Un renglón rotulado «Calificación neta positiva» con valor NETO
//        NEGATIVO: 101 positivas contra 119 negativas (−18).
//     9. Noviembre (479 llamadas, 39% de un mes típico) leído como mes cerrado
//        para construir el «rebrote» al 42.4%.
//    10. 34 llamadas que el menú RESOLVIÓ van rotuladas «abandonadas» y sumadas
//        a la pérdida. Mueve 43.3% a 43.0%: inmaterial en magnitud, equivocado
//        en etiqueta.
//   Aviso: «los mejores meses demuestran que el 70% es alcanzable» — ningún mes
//   del año llegó al 70%; el techo fue agosto con 69.7%.
//
// D · LO QUE CORREGIMOS DE NOSOTROS (v1.0, jun 2026)
//   - «Mejora entrante 65.8% → 28.8% (−37pp)»: el 28.8% era junio al día 16.
//     Junio CERRÓ en 32.5%, y el año termina en 34.8% (oct cerrado).
//   - «Junio supera a mayo (71.1% vs 68.9%)»: junio cerró en 67.5%, DEBAJO de
//     mayo. La afirmación se construyó sobre un mes en tránsito.
//   - «MRR $8,541 / grupo $10,722»: el institucional es $8,176 (GRC, mrrIni =
//     mrrFin, «MRR estable»). Ninguna de las dos cifras de v1.0 lo es.
//   - «Ximena, mayor volumen de la cuenta»: el mismo error que el corte nuevo.
//   - «Tres agentes con 0%»: la clase son CINCO (1,866 asignadas, 1,772 perdidas).
//   - Sábado 71.7% / domingo 75.4%: en el año cerrado son 51.9% y 47.3%.
//   - «Sub-cuenta inactiva sin factura en junio»: NO RE-MEDIBLE. El GRC trae una
//     sola fila para ALTERNET y ninguna por nombre. Se deja declarado, no borrado.
//
// E · HUECO DECLARADO
//   El corte nuevo mide SÓLO ENTRANTES. La mitad saliente la re-medimos contra
//   data/analisis-llamadas.json (ene–sep cerrados): 4,899 de 8,505 = 57.60%, con
//   8.3 pp de dispersión en 9 meses. El hallazgo estructural de v1.0 se confirma
//   y se extiende de 6 a 9 meses — y el documento nuevo no lo toca.
//
// Ver [[auditoria-modulo]] para los límites de Atlas (4 hallazgos × 180 chars).
// ─────────────────────────────────────────────────────────────────────────────

export const ALTERNET: AuditoriaCase = {
  id: 'alternet',
  asesor: 'Erick',
  nombre: 'ALTERNET',
  sector: 'Telecomunicaciones · ISP Fibra Óptica · Comunidades Rurales',
  fecha_periodo: '1 ene – 26 nov 2026 · noviembre EN TRÁNSITO',
  fecha_auditoria: 'Nov 2026 (v2.0) · corte previo Jun 2026 (v1.0)',
  tipo_cliente: 'Pequeña empresa · 11–50 empleados · CID 122421 · C10 · MRR $8,176 (GRC) · AAA · cliente desde jul 2022',
  descripcion_contexto: '12,796 llamadas entrantes + 8,505 salientes re-medidas · Asesor: Erick · Contacto: Anahí Santiago Vega · Pedro Escobedo, Querétaro · BAJA SOLICITADA el 25 sep 2026, sin resolver',
  estado: 'en_riesgo',
  clasificacion: 'CONFIDENCIAL',
  version: '2.0',

  documentos: [
    {
      nombre: 'Auditoría de llamadas · ALTERNET · ene–nov 2026',
      ruta: '/auditorias/Auditoria-ALTERNET-2026.html',
      descripcion: 'Corte entregado el 26 nov 2026. Mide SÓLO entrantes (12,796). Su universo, sus once porcentajes mensuales y sus cortes por línea, día y evaluación cierran; la tabla de agentes no (12,712 de 12,796). No menciona la solicitud de baja del 25 sep 2026 y la firma la asesora anterior. Leer junto con este expediente: seis cifras del documento no reconstruyen (duración 1.31 vs 0.84 min, «1,866 llamadas perdidas» por 1,772, la banda «48%–55%», «el mayor volumen» de Ximena, «5,539 perdidas sin devolución» por 5,008 y un renglón «Calificación neta positiva» con valor negativo), noviembre va en tránsito y la mitad saliente no se mide.',
    },
  ],

  kpis: [
    { label: 'Baja solicitada · sin cerrar', value: '25 sep 2026 · 62 días',          color: '#dc2626' },
    { label: 'Plan usado (tope del año)',    value: '≤19% · cayó a 9%',               color: '#ef4444' },
    { label: 'Pérdida entrante / saliente',  value: '43.3% / 57.6% · dos direcciones 49.7%', color: '#ef4444' },
    { label: 'Pérdida humana (sin las 5 ext.)', value: '34.1% · 3,696 de 10,846',     color: '#f59e0b' },
  ],

  resumen_ejecutivo: 'ALTERNET es un ISP de fibra óptica para comunidades rurales en Querétaro, cliente desde julio de 2022, con MRR institucional de $8,176 MXN (GRC: mrrIni = mrrFin, «MRR estable», clasificación AAA, 52 meses facturados, $549,149.75 acumulados, pérdida $0).\n\nEL DATO QUE FALTA EN EL DOCUMENTO: el 25 de septiembre de 2026 Anahí Santiago Vega solicitó por escrito la baja de la cuenta, y Arturo Morán (agente comercial) llamó el mismo día a confirmarla, con urgencia, para llevar respuestas a su Dirección. La alerta `baja_declarada` lleva 62 días abierta en severidad crítica. El corte de auditoría no la menciona ni una vez y cierra prometiendo «70%+ de atención en los próximos 60 días».\n\nEL MOTIVO DE LA BAJA ES NUESTRO CATÁLOGO. Textual de Anahí: «estamos en etapa de automatización e integraciones de agentes IA. Además que buscamos tener mayor control de nuestras métricas y estadísticas». Eso es IA de Voz, IA de Chat y Panel — exactamente lo que el documento recomienda venderle en su plan de acción. La causa del churn y la oportunidad de expansión son el mismo objeto: o la automatización es nuestra o es de otro.\n\nLA CURVA NO ES DE DESEMPEÑO, ES DE DESENGANCHE. El documento lee «mejora hasta agosto (30.3%) y rebrote en noviembre (42.4%)». Lo que las dos fuentes miden es otra cosa: las llamadas CONTESTADAS cayeron de 1,166 en mayo a 471 en septiembre (−60%), y el consumo del plan nunca pasó del 19% y bajó 19% → 10% → 9%. Agosto «mejora» porque entra menos, no porque atienda más.\n\nLA PÉRDIDA REAL TIENE DOS CORRECCIONES EN SENTIDOS OPUESTOS. Hacia abajo: cinco extensiones mal configuradas (1,866 asignadas, 1,772 perdidas, duraciones de 0 a 0.14 min) arrastran el índice; sin ellas la pérdida HUMANA es 34.1% y no 43.3% — el documento dice que «contaminan el índice» y nunca calcula el limpio. Hacia arriba: el «43.3% global» es sólo la mitad entrante; las salientes pierden 57.6% (ene–sep cerrados, 8.3 pp de dispersión en 9 meses) y el documento no las mide. Las dos direcciones juntas: 9,871 de 19,865 = 49.7%.',

  resultado_positivo: 'Hay dos cosas verdaderas y medibles que sí se pueden llevar a la mesa.\n\nLa capacidad existe y quedó demostrada: en mayo y junio la operación sostuvo ~1,690 llamadas al mes con 31.1% y 32.5% de pérdida — su mejor desempeño del año a volumen alto. No es un techo teórico: ya lo hicieron, con la misma plantilla y la misma plataforma.\n\nHay cultura de seguimiento: 531 devoluciones exitosas (4.15% del total) y 220 llamadas con calificación real. La mayoría de las cuentas auditadas no registra ninguna de las dos cosas. Y la cuenta paga al corriente, sin una sola incidencia de pago en 52 meses facturados.\n\nLo que NO se puede presentar como resultado positivo: la «mejora» de pérdida de enero a agosto. El denominador se movió más que el numerador, y presentarla como logro ante un cliente que pidió la baja por falta de automatización es el camino más corto a perder la conversación.',

  hallazgos: [
    'El cliente PIDIÓ LA BAJA el 25 sep 2026 y la alerta lleva 62 días abierta en crítica. El documento no la menciona: audita el desempeño de una cuenta que está pidiendo irse.',
    'El motivo de la baja es automatización e IA: exactamente lo que el documento propone venderle. La fuga y la oportunidad son lo mismo — o la automatización es nuestra o es de otro.',
    'No mejoró: contestó 1,166 llamadas en mayo y 471 en septiembre (−60%), y el plan cayó de 19% a 9%. Agosto «mejora» a 30.3% porque entra menos, no porque atienda más.',
    'El «43.3% global» es sólo la mitad entrante. Las salientes pierden 57.6% ene–sep, planas 9 meses. Las dos direcciones: 9,871 de 19,865 = 49.7%.',
    'La pérdida HUMANA es 34.1% (3,696 de 10,846), no 43.3%. Cinco extensiones mal configuradas arrastran 1,772 perdidas. El documento dice que «contaminan el índice» y nunca calcula el limpio.',
    'Las cinco extensiones: Maricruz Martínez (99.8%), Osiel Martínez (100%), Victor Marchán (100%), Ivan Moises (93.3%) y Diana Loza (86.7%). Duraciones de 0 a 0.14 min: no están contestando, no están fallando.',
    'La línea Ventas pierde 882 de 1,283 (68.7%) y es el DID 524482600000 de dids.json. Siete de cada diez intentos de hacer negocio con ALTERNET no conectan con nadie.',
    'Anahí Santiago Vega es a la vez la decisora de la cuenta (Jefa de Operaciones) y una de las agentes de la tabla: 245 llamadas, 53.1% de pérdida. Va a ver su propio número en el reporte.',
    'MARCADO — El Health Score del documento (51/100, con Adopción 48/100) no es el de la plataforma (56/100, con Adopción 2/100). El documento inventa un marco de cuatro dimensiones con pesos propios y publica 48 en la única dimensión que sostiene todo su argumento de expansión. La plataforma mide 2.',
    'MARCADO — `cuentas.facturacion` dice $16,548 y el GRC dice $8,176: exactamente 2.02×. El institucional es el del GRC. En septiembre Anahí ya preguntó por su facturación; si alguien le cita la cifra de la ficha, le cita el doble de lo que se le cobra.',
    'Seis alertas ABIERTAS hoy, tres críticas: baja_declarada (62 días), silencio_60 (último contacto que llegó al cliente: 25 sep, escaló el 25 nov) y llamadas_sin_contestar. Más plan_sobrado («le sobra el 81% de la bolsa que paga»), sin_radar (0 de 12 preguntas) y sin_contactos (cero capturados).',
    'CONTRADICCIÓN INTERNA — El encabezado declara 1.31 min de duración promedio y el cuerpo del mismo documento 0.84 min. La ponderada por contestadas es 0.80 min. 1.31 es el valor de noviembre, el mes en tránsito.',
    'CONTRADICCIÓN INTERNA — «Lilian y Ximena son los únicos agentes en zona de alerta aceptable», y su propia tabla marca TRES en verde: M. G. Fuentes Acosta va en 26.0%, mejor que Lilian.',
    'La tabla de agentes suma 12,712 de 12,796: 84 llamadas y 71 perdidas sin cubo «sin agente / otros». Es el único corte del documento que no cierra contra su universo.',
    '«Ximena Araujo, el mayor volumen del equipo» es falso: Lilian Araujo tiene 4,071 llamadas y Ximena 3,504. Ximena sigue siendo el mejor índice (23.4%), pero no el mayor volumen. v1.0 cometió el mismo error.',
    '«El resto del equipo opera entre 48% y 55%» deja fuera a Miriam Flores (37.8%) por debajo y a Gerardo Ligorio (55.6%) por arriba. La banda no describe al equipo que dice describir.',
    '«Acumulan 1,866 llamadas perdidas» usa el total ASIGNADO de las cinco extensiones; sus perdidas son 1,772. Otro párrafo del mismo documento lo dice bien. Dos cifras para el mismo hecho.',
    '«5,539 perdidas sin devolución» aparece en el mismo renglón que dice que 531 sí se devolvieron. Sin devolución son 5,008. Y un renglón rotulado «Calificación neta positiva» lleva un valor neto NEGATIVO: 101 positivas contra 119 negativas (−18).',
    'Noviembre trae 479 llamadas contra una media de 1,232 de los meses anteriores — el 39% de un mes típico. El «rebrote al 42.4%» se construyó sobre un mes en tránsito, cortado el 26 de noviembre.',
    'MARCADO — 34 llamadas que el menú RESOLVIÓ van rotuladas «abandonadas» y sumadas a la pérdida. Mueve 43.3% a 43.0%: inmaterial en magnitud, equivocado en etiqueta. El autoservicio es un acierto del IVR, no una llamada perdida.',
    'AVISO — «Los mejores meses demuestran que el 70% es alcanzable»: ningún mes del año llegó al 70% de atención. El techo fue agosto con 69.7%, y fue el segundo mes de menor volumen.',
    'ERROR DE GENERADOR — El documento lo firma «Claudia Hernández, Asesora de Cuenta». La cuenta es de Erick desde el 15 oct 2026. Es la misma falla en Hospital Santa Rosa y Grupo Neruc: tres documentos del mismo corte firmados por quien ya no lleva la cartera. Se corrige en el generador, no documento por documento.',
    'CORRECCIÓN DE v1.0 — La «mejora 65.8% → 28.8% (−37pp)» tomó junio al día 16. Junio CERRÓ en 32.5% y el año cerrado termina en 34.8% (octubre). Y «junio supera a mayo (71.1% vs 68.9%)» es falso: junio cerró en 67.5%, por debajo de mayo.',
    'CORRECCIÓN DE v1.0 — El MRR no es $8,541 ni $10,722 de grupo. Es $8,176 (GRC). Y el fin de semana del año cerrado es 51.9% el sábado y 47.3% el domingo, no 71.7% y 75.4%.',
    'HUECO DECLARADO — La «sub-cuenta inactiva sin factura de junio» de v1.0 NO ES RE-MEDIBLE: el GRC trae una sola fila para ALTERNET y ninguna por nombre. No se afirma que exista ni que no exista; queda abierta como pregunta para Erick.',
    'HUECO DECLARADO — `adopcion_producto` registra Voz VyC, Callpicker Chat y Pago Automático en nivel «alto» con fecha 10 jul 2026. Eso es INTERÉS en la escalera, no uso: `tiene_ia_voz`, `tiene_ia_chat` y `tiene_pago_automatico` están todos en false.',
  ],

  cronologia: [
    { fecha: 'Jul 2022',      responsable: 'Operación',               evento: 'ALTERNET inicia como cliente. Visibilidad y Control IL + CP Chat + DIDs. 52 meses facturados, $549,149.75 acumulados, cero incidencias de pago.', tipo: 'ok' },
    { fecha: 'Ene–Abr 2026',  responsable: 'Operación Alternet',      evento: 'La pérdida entrante baja de 66.0% a 48.7% mientras el volumen crece de 990 a 1,648 llamadas. Mejora real: más tráfico y mejor índice a la vez.', tipo: 'ok' },
    { fecha: 'May–Jun 2026',  responsable: 'Operación Alternet',      evento: 'El techo demostrado: ~1,690 llamadas al mes con 31.1% y 32.5% de pérdida. 1,166 contestadas en mayo — el máximo del año. La capacidad existe.', tipo: 'ok' },
    { fecha: '6 Jul 2026',    responsable: 'Claudia / SAC',           evento: 'Revisión preventiva de plataforma (ticket 1119960000022009658) sin incidencia abierta del cliente. Primer contacto proactivo documentado.', tipo: 'pivote' },
    { fecha: '17–21 Jul 2026', responsable: 'Anahí Santiago',          evento: 'Anahí pide una nueva evaluación: «se han presentado diversos cambios en la operación». Se muestra interesada en Agente Virtual, pero primero revisará sus configuraciones.', tipo: 'pivote' },
    { fecha: 'Jul–Sep 2026',  responsable: 'Operación Alternet',      evento: 'El desenganche: contestadas 1,140 (jun) → 646 → 531 → 471 (sep), −60% desde mayo. El plan nunca pasa del 19% y baja a 10% y 9%. Sale menos tráfico, no mejor atención.', tipo: 'problema' },
    { fecha: '8 Sep 2026',    responsable: 'Anahí / Claudia',         evento: 'Anahí pregunta por la facturación de septiembre. La ficha guarda $16,548 y el GRC cobra $8,176: 2.02× de diferencia sin resolver.', tipo: 'problema' },
    { fecha: '25 Sep 2026',   responsable: 'Anahí Santiago',          evento: 'SOLICITA LA BAJA por escrito: «estamos en etapa de automatización e integraciones de agentes IA. Además que buscamos tener mayor control de nuestras métricas y estadísticas».', tipo: 'problema' },
    { fecha: '25 Sep 2026',   responsable: 'Arturo Morán (Alternet)',  evento: 'El agente comercial llama a confirmar la baja. Acepta una reunión pero «le urge y requiere respuestas para pasar con Dirección». Último contacto que llegó al cliente.', tipo: 'problema' },
    { fecha: '28 Sep 2026',   responsable: 'Dir. SAC / Conciliación',  evento: 'La cuenta se devuelve a Activas: la señal de «2022-10» en Zoho no es Churn confirmado y una solicitud de baja NO EJECUTADA no basta para pasar a Dormida. Queda en «en riesgo». La regla se aplicó bien.', tipo: 'ok' },
    { fecha: '6–7 Oct 2026',  responsable: 'Sistema de Alertas',       evento: 'Abren baja_declarada (crítica), sin_radar y sin_contactos. El 12 oct abre caida_consumo (19% → 10% → 9%) y el 14 oct llamadas_sin_contestar (crítica).', tipo: 'problema' },
    { fecha: '20 Nov 2026',   responsable: 'Sistema de Alertas',       evento: 'Abre plan_sobrado: «Nunca pasó del 19% de su plan en 5 meses: le sobra el 81% de la bolsa que paga, y paga $8,176 al mes».', tipo: 'problema' },
    { fecha: '25 Nov 2026',   responsable: 'Sistema de Alertas',       evento: 'silencio_60 ESCALA a crítica: 62 días desde el último contacto que llegó al cliente, con una baja solicitada y sin responder.', tipo: 'problema' },
    { fecha: '26 Nov 2026',   responsable: 'Erick',                    evento: 'Retoma el seguimiento. Correo #121375 de presentación. Identifica los indicios de baja y el bajo uso, y plantea agentes virtuales / IA como oportunidad. Es la lectura correcta.', tipo: 'pivote' },
    { fecha: '26 Nov 2026',   responsable: 'Dir. SAC',                 evento: 'Auditoría v2.0. El corte nuevo mide sólo entrantes y omite la baja; se conciliaron sus seis tablas, se re-midió la mitad saliente y se corrigieron cinco afirmaciones de nuestro propio v1.0.', tipo: 'pivote' },
  ],

  perfil_campos: [
    { label: 'Razón social',           value: 'ALTERNET' },
    { label: 'CID Zoho / consecutivo', value: '122421 · C10' },
    { label: 'Giro',                   value: 'Telecomunicaciones / ISP Fibra Óptica (comunidades rurales)' },
    { label: 'Tamaño',                 value: 'Pequeña empresa · 11–50 empleados' },
    { label: 'Oficinas',               value: '1 punto físico · Pedro Escobedo, Querétaro' },
    { label: 'Asesor SAC',             value: 'Erick (desde el 15 oct 2026; el documento lo firma Claudia Hernández)' },
    { label: 'Contacto principal',     value: 'Anahí Santiago Vega — Jefa de Operaciones · anahi@alternet.io · 4482510220. También aparece como agente en la tabla del reporte: 245 llamadas, 53.1% de pérdida.' },
    { label: 'Otro interlocutor',      value: 'Arturo Morán — Agente comercial. Llamó el 25 sep a confirmar la baja. No está capturado en `contactos_json` (vacío).' },
    { label: 'Servicio contratado',    value: 'Visibilidad y Control IL + CP Chat + DIDs (4 DIDs: Ventas, Servicio al cliente, API, IFT)' },
    { label: 'Cliente desde',          value: 'Julio 2022 · 52 meses facturados · $549,149.75 acumulados' },
    { label: 'MRR institucional',      value: '$8,176 MXN (GRC: mrrIni = mrrFin, «MRR estable», AAA, pérdida $0). `cuentas.facturacion` dice $16,548 — 2.02× — y debe corregirse.' },
    { label: 'Consumo del plan',       value: 'Nunca pasó del 19% en 5 meses. Cayó 19% → 10% → 9%. Le sobra el 81% de la bolsa que paga.' },
    { label: 'Health Score',           value: '56 / 100 en plataforma — Actividad 80 · Adopción 2 · Pago 100 · Relacional 50. El documento publica 51/100 con Adopción 48/100: marco distinto, cifras distintas.' },
    { label: 'Estado',                 value: 'en_riesgo. Baja SOLICITADA el 25 sep 2026 y NO EJECUTADA. No es Churn confirmado: el GRC sigue facturando $8,176 con pérdida $0.' },
    { label: 'Alertas abiertas',       value: '6 (3 críticas): baja_declarada, silencio_60, llamadas_sin_contestar, plan_sobrado, sin_radar, sin_contactos' },
  ],

  necesidad_negocio: 'ALTERNET presta internet de fibra a comunidades rurales de Querétaro: una operación de siete días con reportes de falla que no esperan horario. Cada llamada perdida en fin de semana es un cliente final sin servicio, y quien pierde esa llamada no se queja con nosotros — se queja con ALTERNET. Por eso el 43.3% lleva un año sin escalar como incidencia.\n\nPero la necesidad que el cliente DIJO en voz alta el 25 de septiembre es más específica y más urgente: automatizar su atención con agentes de IA, y tener control propio de sus métricas y estadísticas. Esas son dos capacidades concretas de la plataforma que paga y no usa — y el motivo por el que está pidiendo irse. No hay que descubrirle la necesidad: hay que responderle la que ya escribió, con dos meses de retraso.',

  potencial_corto: [
    'RESPONDER LA BAJA. Lleva 62 días sin respuesta y Arturo Morán dijo que necesita llevar respuestas a su Dirección. La primera acción no es mejorar un KPI: es contestar.',
    'Llevar la respuesta en los términos que ellos pusieron: automatización, agentes de IA y control de métricas. Es nuestro catálogo, y nadie se lo ha presentado como respuesta a su planteamiento.',
    'Corregir las cinco extensiones mal configuradas (1,772 perdidas, duraciones de 0 a 0.14 min). Acción interna, sin costo, sin aprobación del cliente, y baja el índice publicado de 43.3% a 34.1%.',
    'Revisar la línea Ventas: 882 de 1,283 perdidas en el DID 524482600000. Horario, agentes asignados, desbordamiento y protocolo de devolución.',
    'Corregir `cuentas.facturacion` de $16,548 a $8,176 ANTES de la reunión. Anahí ya preguntó por su facturación en septiembre.',
    'Capturar los contactos (`contactos_json` está vacío) y responder el Radar (0 de 12). Dos alertas de ceguera abiertas en una cuenta que está pidiendo la baja.',
  ],
  potencial_largo: [
    'Agente Virtual / IA de Voz como respuesta formal al motivo de la baja: cobertura de sábado (1,320 llamadas, 51.9% de pérdida) y domingo sin plantilla adicional.',
    'IA de Chat para soporte de primer nivel: fallas de conectividad repetibles. El CP Chat ya está contratado y activo — es la base instalada para la siguiente grada.',
    'Panel y reportería propios: «mayor control de nuestras métricas y estadísticas» es textual del cliente. Si no se lo damos, se lo construye.',
    'Replanteo del plan a la baja o re-dimensionamiento: usa ≤19% de lo que paga. Un downgrade honesto conserva la cuenta mejor que un plan sobrado que sostiene la decisión de irse.',
    'Auditar la configuración saliente: 57.6% de pérdida plana durante 9 meses no es desempeño, es arquitectura de cola. Nadie la ha escalado al equipo técnico desde v1.0.',
  ],

  tacticas: [
    { nombre: 'El silencio es la amenaza, no el índice', descripcion: 'La cuenta pidió la baja y pasó 62 días sin respuesta. Para el cliente, el silencio ya contestó: confirma que no hay nadie del otro lado y vuelve razonable construir su propia solución.', impacto: 'Churn de $8,176 al mes ($98,112 al año) con 52 meses de relación detrás' },
    { nombre: 'El plan sobrado financia la salida',      descripcion: 'Paga $8,176 por una bolsa de la que usa ≤19%. Cada mes que pasa, el costo de irse es más fácil de justificar internamente: están pagando por capacidad que no consumen mientras construyen la alternativa.', impacto: 'El argumento de precio juega CONTRA nosotros mientras el plan no se re-dimensione' },
    { nombre: 'Presentar la «mejora» como logro',        descripcion: 'El documento invita a llevar la caída de 66% a 30.3% como resultado. El cliente sabe que su volumen bajó: le estaríamos presentando su propio desenganche como nuestro éxito.', impacto: 'Pérdida de credibilidad en la única reunión que queda' },
  ],
  senal_alarma: 'Si pasa otra semana sin respuesta a la baja del 25 de septiembre, la decisión deja de ser reversible: Arturo Morán ya la llevó a su Dirección y la ausencia de respuesta es, en sí misma, la respuesta. La señal más clara de que ya cruzó ese punto es que el consumo del plan se quede por debajo del 9% en el corte de diciembre: significaría que la operación ya migró y sólo queda el contrato.',

  problema_raiz: 'ALTERNET pidió la baja hace 62 días para construir por su cuenta la automatización y la reportería que ya paga y nunca se le activó, y nadie le ha contestado.',
  problema_raiz_detalle: 'Las dos mitades del problema son la misma. La cuenta usa ≤19% de su plan y tiene Adopción 2/100 tras 52 meses: nunca se le presentó el portafolio en el contexto de un ISP rural con demanda de siete días. Cuando el cliente finalmente definió lo que necesitaba — «automatización, agentes IA, control de nuestras métricas» —, lo hizo dentro de la carta en la que pedía irse.\n\nEl corte de auditoría llega dos meses después y audita el desempeño telefónico: pone el foco en el 43.3%, en los agentes y en la meta del 70%. Son problemas reales, y ninguno es la razón por la que la cuenta se va. Un documento que no menciona la baja no puede recomendar la acción correcta, y su conclusión — «70%+ en los próximos 60 días» — se escribe como si la cuenta no estuviera pidiendo irse.',

  flujo_real: [
    { fase: '1. 52 meses sin presentación de portafolio', area: 'SAC',                     accion: 'Adopción 2/100, consumo ≤19% del plan, cero actividades en el historial hasta jul 2026', resultado: 'El cliente no sabe que lo que necesita ya está contratado.' },
    { fase: '2. El cliente define su necesidad',          area: 'Anahí Santiago',          accion: 'Jul 2026: pide una nueva evaluación y se interesa en Agente Virtual, «primero revisamos configuraciones»', resultado: 'Ventana abierta durante dos meses. No se cerró con una propuesta.' },
    { fase: '3. Solicita la baja',                        area: 'Anahí + Arturo Morán',    accion: '25 sep: baja por escrito por automatización, IA y control de métricas. Arturo llama: le urge, lo lleva a Dirección', resultado: 'Alerta crítica abierta. Último contacto que llegó al cliente.' },
    { fase: '4. 62 días de silencio',                     area: 'SAC',                     accion: 'Sin respuesta a la solicitud. La cuenta se queda correctamente en Activas / en riesgo, pero nadie contesta', resultado: 'silencio_60 escala a crítica el 25 nov. El silencio contesta por nosotros.' },
    { fase: '5. Se audita el desempeño, no la baja',      area: 'Generador de auditoría',  accion: 'Corte entrantes-only firmado por la asesora anterior, sin una mención de la baja, con meta de 70%', resultado: 'El plan de acción apunta a un problema que no es el que mata la cuenta.' },
    { fase: '6. Erick retoma',                            area: 'Erick',                   accion: '26 nov: correo #121375, identifica los indicios de baja y plantea IA / agentes virtuales', resultado: 'Lectura correcta. Falta convertirla en respuesta formal a la carta de septiembre.' },
  ],

  comparativo: [
    { metrica: 'Solicitud de baja (25 sep)',    real: '62 días sin respuesta · alerta crítica abierta',        ideal: 'Respuesta formal y reunión con Dirección de Alternet esta semana' },
    { metrica: 'Pérdida entrante publicada',    real: '43.3% con las 5 extensiones mal configuradas dentro',   ideal: '34.1% real tras corregirlas — y publicar la cifra limpia' },
    { metrica: 'Pérdida saliente',              real: '57.6% plana durante 9 meses · no medida en el corte',   ideal: 'Auditoría de arquitectura de cola escalada al equipo técnico' },
    { metrica: 'Consumo del plan',              real: '≤19%, cayendo a 9% · le sobra el 81%',                  ideal: 'Plan re-dimensionado o bolsa consumida por canales automatizados' },
    { metrica: 'Adopción',                      real: '2/100 en plataforma (el documento publica 48/100)',     ideal: 'IA de Voz + IA de Chat activos: lo que el cliente pidió por escrito' },
    { metrica: 'Línea Ventas',                  real: '68.7% · 882 de 1,283 intentos de negocio sin conectar', ideal: '<35% con horario, overflow y devolución configurados' },
    { metrica: 'MRR en la ficha',               real: '$16,548 (2.02× el GRC)',                                ideal: '$8,176 corregido antes de cualquier conversación de facturación' },
    { metrica: 'Contactos y Radar',             real: '`contactos_json` vacío · 0 de 12 preguntas',            ideal: 'Anahí y Arturo Morán capturados · Radar respondido' },
  ],

  plan_inmediato: [
    { accion: 'Responder por escrito la solicitud de baja del 25 de septiembre, en los términos que el cliente puso: automatización, agentes de IA y control de métricas. Arturo Morán necesita llevar respuestas a su Dirección y lleva 62 días esperándolas. Esta acción no depende de ningún dato de la auditoría.', responsable: 'Erick + Dir. SAC', criterio: 'Respuesta enviada y reunión agendada con Anahí y Arturo Morán en los próximos 5 días hábiles' },
    { accion: 'Corregir la configuración de las cinco extensiones: Maricruz Martínez, Osiel Martínez, Victor Marchán, Ivan Moises y Diana Loza. 1,866 asignadas, 1,772 perdidas, duraciones de 0 a 0.14 min. Acción interna que baja el índice publicado de 43.3% a 34.1% sin tocar al personal.', responsable: 'Erick + Técnico Callpicker', criterio: 'Cinco extensiones verificadas y medición de atención a las 48 h' },
    { accion: 'Corregir `cuentas.facturacion` de $16,548 a $8,176 (GRC) y revisar si la duda de facturación de septiembre quedó resuelta. No se puede entrar a una reunión de retención con la ficha diciendo el doble de lo que se cobra.', responsable: 'Erick', criterio: 'Ficha corregida y la duda de septiembre cerrada por escrito' },
    { accion: 'Capturar contactos (Anahí Santiago y Arturo Morán) y responder las 12 preguntas del Radar. Dos alertas de ceguera abiertas en una cuenta de $8,176 que está pidiendo la baja.', responsable: 'Erick', criterio: '`contactos_json` con los dos interlocutores y Radar en 12 de 12' },
  ],

  plan_mediano: [
    { accion: 'Llevar a la reunión la propuesta de Agente Virtual / IA de Voz con el caso de negocio medido: sábado con 1,320 llamadas y 51.9% de pérdida, domingo 47.3%, y una bolsa de la que sobra el 81%. La capacidad ya está pagada.', responsable: 'Erick + Ventas', criterio: 'Propuesta formal entregada con el cálculo de cobertura de fin de semana' },
    { accion: 'Presentar el re-dimensionamiento del plan como opción honesta: usa ≤19% de lo que paga. Un downgrade documentado retiene mejor que un plan sobrado que le da la razón para irse. Registrar el movimiento como indicio de downgrade, no como baja.', responsable: 'Erick + Dir. SAC', criterio: 'Escenario de plan presentado y decisión del cliente registrada' },
    { accion: 'Escalar al equipo técnico la auditoría de configuración saliente: 57.6% de pérdida con 8.3 pp de dispersión en 9 meses es arquitectura, no desempeño. Es el hallazgo de v1.0 que sigue sin intervención en el quinto mes.', responsable: 'Erick + Técnico', criterio: 'Diagnóstico técnico entregado por escrito' },
    { accion: 'Revisión dedicada de la línea Ventas (DID 524482600000): 882 de 1,283 perdidas. Horario de operación, agentes asignados, overflow a buzón y protocolo de devolución.', responsable: 'Técnico + Erick', criterio: 'Configuración corregida y medición a 30 días' },
  ],

  plan_estrategico: [
    { accion: 'Si la cuenta se retiene: hoja de ruta de adopción a 6 meses con un hito medible por mes — IA de Voz, IA de Chat, reportería, pago automático. Adopción 2/100 tras 52 meses es la causa raíz, y sólo se resuelve con un calendario, no con una reunión.', responsable: 'Erick + Dir. SAC', criterio: 'Hoja de ruta firmada por Anahí con hitos y fechas' },
    { accion: 'Si la cuenta se pierde: documentar el churn con su causa real — «se construyó su propia automatización porque la que pagaba no se le activó» — y contarlo como clase, no como caso. Hay más cuentas con Adopción baja y plan sobrado en la misma trayectoria.', responsable: 'Dir. SAC', criterio: 'Churn registrado con causa y clase, y barrido de cuentas con el mismo patrón' },
    { accion: 'Corregir el generador de auditorías para que firme con el asesor vigente de `cuentas.asesor_nombre` y para que no publique un corte de una cuenta con alerta `baja_declarada` abierta sin mencionarla. Tres documentos del mismo lote firmados por quien ya no lleva la cartera.', responsable: 'Dir. SAC', criterio: 'Generador corregido y los tres documentos re-emitidos' },
  ],

  areas_oportunidad: [
    { area: 'Agente Virtual / IA de Voz',        impacto: 'Es literalmente el motivo que el cliente escribió para irse. Sábado 51.9% de pérdida sobre 1,320 llamadas y domingo 47.3%, sin plantilla adicional.', responsable: 'Erick + Ventas' },
    { area: 'IA de Chat sobre el CP Chat activo', impacto: 'El canal ya está contratado y activo. Soporte de primer nivel para fallas de conectividad repetibles es la siguiente grada natural de la escalera.', responsable: 'Erick + Ventas' },
    { area: 'Reportería y control de métricas',   impacto: '«Buscamos tener mayor control de nuestras métricas y estadísticas» — textual. Si no se lo damos, ya decidió construirlo.', responsable: 'Erick' },
    { area: 'Re-dimensionamiento del plan',       impacto: 'Le sobra el 81% de la bolsa. Un plan honesto quita el argumento de precio del lado del cliente y vuelve viable el gasto en los módulos que sí necesita.', responsable: 'Erick + Dir. SAC' },
  ],

  perfiles: [
    {
      nombre: 'Anahí Santiago Vega', rol: 'Jefa de Operaciones — Decisora principal · solicitó la baja', color: '#dc2626',
      campos: [
        { label: 'Contacto',          value: 'anahi@alternet.io · Tel. 4482510220. No está capturada en `contactos_json` (vacío).' },
        { label: 'Qué escribió',      value: '25 sep 2026: solicita la baja. «Lo que pasa que estamos en etapa de automatización e integraciones de agentes IA. Además que buscamos tener mayor control de nuestras métricas y estadísticas.»' },
        { label: 'Historial',         value: 'Jul 2026: pidió una nueva evaluación y se interesó en Agente Virtual. Sep 2026: preguntó por su facturación. Sep 2026: pidió la baja. Es una interlocutora que avisa antes de actuar.' },
        { label: 'Dato sensible',     value: 'Aparece en la tabla de agentes del reporte: 245 llamadas, 53.1% de pérdida. Va a ver su propio número. Mejor nombrarlo nosotros primero que dejar que lo descubra.' },
        { label: 'Apertura sugerida', value: '«Anahí, le debemos una respuesta de hace dos meses. Nos escribió que están automatizando con agentes de IA y que quieren control de sus métricas. Eso no es una razón para dejar Callpicker: es lo que lleva 52 meses contratado y nadie le activó. Vengo con eso, y con una propuesta de plan que refleje lo que realmente usan.»' },
      ],
    },
    {
      nombre: 'Arturo Morán', rol: 'Agente comercial — llamó a confirmar la baja', color: '#ef4444',
      campos: [
        { label: 'Qué dijo',          value: '25 sep 2026: llamó a confirmar la baja. Acepta una reunión para exponer el contexto, pero «le urge y requiere respuestas para pasar con Dirección».' },
        { label: 'Por qué importa',   value: 'Es el canal hacia la Dirección de Alternet y lleva 62 días sin las respuestas que pidió. No está capturado en el CRM.' },
        { label: 'Acción',            value: 'Capturarlo como contacto e incluirlo en la reunión. La decisión no se resuelve sólo con Operaciones.' },
      ],
    },
    {
      nombre: 'Lilian Araujo Eligio', rol: 'Mayor volumen del equipo — 4,071 llamadas, 31.0%', color: '#22c55e',
      campos: [
        { label: 'Relevancia',        value: 'El mayor volumen de la cuenta, no Ximena. El documento y nuestro propio v1.0 se lo atribuyeron a Ximena (3,504).' },
        { label: 'Lectura',           value: 'Sostiene casi un tercio del tráfico con 31.0% de pérdida. Junto con Ximena cubre el 59.6% de las llamadas de la cuenta.' },
      ],
    },
    {
      nombre: 'Ximena Araujo Bacilio', rol: 'Mejor índice del equipo — 3,504 llamadas, 23.4%', color: '#22c55e',
      campos: [
        { label: 'Relevancia',        value: 'El mejor índice a volumen alto: 2,683 contestadas de 3,504. Es el benchmark real de la cuenta, aunque no el mayor volumen.' },
        { label: 'Propuesta',         value: 'Sesión de transferencia con el equipo. Útil — pero es una acción para después de responder la baja, no en lugar de ella.' },
        { label: 'MARCADO',           value: 'M. G. Fuentes Acosta va en 26.0% sobre 262 llamadas y la tabla la marca en verde. El cuerpo del documento dice que sólo hay dos agentes en zona aceptable: son tres.' },
      ],
    },
    {
      nombre: 'Las cinco extensiones mal configuradas', rol: 'Maricruz 99.8% · Osiel 100% · Victor 100% · Ivan 93.3% · Diana 86.7%', color: '#f59e0b',
      campos: [
        { label: 'Situación',         value: '1,866 llamadas asignadas y 1,772 perdidas, con duraciones promedio de 0 a 0.14 min. No están contestando: no es desempeño, es configuración o disponibilidad.' },
        { label: 'Impacto medido',    value: 'Sin ellas, la pérdida humana es 34.1% (3,696 de 10,846) contra el 43.3% publicado. El documento dice que «contaminan el índice» y nunca calcula el limpio.' },
        { label: 'Cuidado',           value: 'v1.0 identificó tres de las cinco (Osiel, Maricruz, Víctor). La clase creció y sigue sin corregirse cinco meses después.' },
      ],
    },
    {
      nombre: 'Erick', rol: 'Asesor SAC — titular desde el 15 oct 2026', color: '#6366f1',
      campos: [
        { label: 'Prioridad única',   value: 'Responder la baja del 25 de septiembre. Todo lo demás —extensiones, Ventas, plan, Radar— se hace después o en paralelo, pero nada sustituye la respuesta.' },
        { label: 'Lo que ya hizo bien', value: 'Su nota del 26 nov identifica los indicios de baja, el bajo uso y la oportunidad de agentes virtuales / IA. Es exactamente la lectura correcta; falta formalizarla.' },
        { label: 'Lo que NO debe llevar', value: 'La «mejora de 66% a 30.3%» como logro. El cliente sabe que su volumen bajó 60%. Presentar su desenganche como nuestro éxito cuesta la reunión.' },
        { label: 'Ojo con el documento', value: 'El corte lo firma Claudia Hernández y no menciona la baja. Si se entrega al cliente tal cual, se entrega un reporte firmado por quien ya no lleva la cuenta y que ignora su solicitud.' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      '52 meses facturados, $549,149.75 acumulados, cero incidencias de pago — pagos al corriente en toda la relación',
      'GRC: clasificación AAA, «MRR estable», mrrIni = mrrFin $8,176, pérdida $0 — la cuenta sigue viva y facturando',
      'El techo está demostrado: mayo y junio sostuvieron ~1,690 llamadas al mes con 31.1% y 32.5% de pérdida',
      '531 devoluciones exitosas (4.15%) y 220 llamadas con calificación real — cultura de seguimiento que la mayoría de las cuentas no tiene',
      'El cliente avisa antes de actuar: pidió evaluación en julio, preguntó por facturación en septiembre y escribió la baja con su motivo explícito',
      'Interés registrado en Voz VyC, Callpicker Chat y Pago Automático (nivel «alto», 10 jul 2026) — la escalera ya tiene el primer peldaño identificado',
    ],
    oportunidades: [
      'El motivo de la baja es nuestro catálogo: automatización, agentes de IA y control de métricas, los tres contratables hoy',
      'CP Chat ya activo: base instalada para IA de Chat sin arranque desde cero',
      'Corregir cinco extensiones baja el índice publicado de 43.3% a 34.1% sin costo y sin tocar al personal',
      'Fin de semana descubierto: 1,320 llamadas el sábado con 51.9% de pérdida — caso de negocio medido para IA de Voz',
      'Le sobra el 81% de la bolsa: hay presupuesto dentro del mismo gasto para mover la mezcla hacia lo que sí necesita',
      'Línea Ventas con 882 intentos de negocio perdidos: el argumento comercial más directo que tiene la cuenta',
    ],
    debilidades: [
      'Baja solicitada el 25 sep 2026 y 62 días sin respuesta — la debilidad es nuestra, no del cliente',
      'Adopción 2/100 tras 52 meses de relación y consumo del plan que nunca pasó del 19%',
      'Contestadas en caída de 60% entre mayo y septiembre, y consumo 19% → 10% → 9%',
      'Pérdida saliente de 57.6% plana durante 9 meses, sin intervención técnica desde el corte de junio',
      'Seis alertas abiertas, tres críticas, incluidas sin_radar (0 de 12) y sin_contactos (cero capturados)',
      '`cuentas.facturacion` en $16,548 contra $8,176 del GRC, en una cuenta que ya preguntó por su facturación',
      'La auditoría entregada no menciona la baja, mide sólo entrantes y la firma la asesora anterior',
    ],
    amenazas: [
      'Churn de $8,176 al mes ($98,112 al año) con la decisión ya en la Dirección de Alternet',
      'El silencio de 62 días confirma al cliente que construir por su cuenta es lo razonable',
      'El plan sobrado vuelve el churn financieramente fácil de justificar internamente',
      'Si el consumo de diciembre baja del 9%, la operación ya migró y sólo queda el contrato',
      'Entregar el documento tal cual —sin la baja y firmado por Claudia— cuesta credibilidad en la única reunión que queda',
      'La misma clase de cuenta (Adopción baja + plan sobrado + silencio) está en otras carteras sin medir',
    ],
  },

  conclusion: 'El corte nuevo mide bien lo que mide: el universo de 12,796 entrantes cierra, los once porcentajes mensuales reconstruyen y los cortes por línea, día y evaluación cuadran contra el total. Y aun así no describe el problema de la cuenta, porque no menciona el hecho que lo define: ALTERNET pidió la baja el 25 de septiembre de 2026 y lleva 62 días esperando respuesta.\n\nLo que el documento lee como una curva de desempeño es un desenganche. Las llamadas contestadas cayeron 60% entre mayo y septiembre y el consumo del plan bajó de 19% a 9%: agosto «mejora» porque entra menos. Y la pérdida publicada necesita dos correcciones en sentidos opuestos — 34.1% si se quitan las cinco extensiones mal configuradas, 49.7% si se suma la mitad saliente que el corte no mide y que lleva nueve meses plana en 57.6%.\n\nLa acción no es una meta de atención. El cliente ya escribió qué necesita —automatización, agentes de IA, control de sus métricas— y es exactamente lo que paga desde julio de 2022 y nunca se le activó. Erick tiene que responder esa carta, con Arturo Morán en la mesa, antes de llevar un solo KPI.',

  pierde: [
    'Otra semana sin responder la baja → la decisión deja de ser reversible y la Dirección de Alternet cierra el tema',
    'Entregar el documento sin la baja y firmado por Claudia → el cliente ve que no leímos su carta',
    'Presentar la «mejora» de 66% a 30.3% como logro → le presentamos su propio desenganche como nuestro éxito',
    'Cinco extensiones sin corregir → el índice publicado seguirá 9 puntos peor que la realidad humana',
    'Plan sobrado sin re-dimensionar → el argumento de precio sigue jugando a favor de irse',
    'Saliente en 57.6% sin escalar → décimo mes de una falla estructural que v1.0 ya había señalado',
  ],
  gana: [
    'Respuesta formal a la baja esta semana → la conversación vuelve a existir y Arturo Morán tiene qué llevar a su Dirección',
    'Agente Virtual propuesto como respuesta al motivo escrito → la causa del churn se convierte en la vía de retención',
    'Cinco extensiones corregidas → 43.3% publicado baja a 34.1% con una acción interna sin costo',
    'Plan re-dimensionado → se retira el argumento de precio y queda presupuesto para los módulos que sí necesita',
    'Ficha corregida a $8,176 → se entra a la reunión sin una cifra que contradice la factura',
    'Contactos y Radar capturados → dos alertas de ceguera cerradas y la cuenta deja de ser invisible',
    'Saliente escalada a técnico → la primera intervención en nueve meses sobre la mitad que nadie mide',
  ],
  recomendacion_central: 'Una sola cosa primero: responder por escrito la solicitud de baja del 25 de septiembre, en los términos que el cliente puso —automatización, agentes de IA y control de sus métricas— y agendar la reunión con Anahí Santiago y Arturo Morán, que lleva 62 días pidiéndola para su Dirección. En paralelo y sin depender del cliente: corregir las cinco extensiones mal configuradas (baja el índice de 43.3% a 34.1%), corregir la ficha de $16,548 a $8,176 y escalar al equipo técnico la pérdida saliente de 57.6% que lleva nueve meses plana. Lo que NO se lleva a esa reunión es la meta del 70% ni la «mejora» de enero a agosto: el cliente sabe que su volumen bajó 60%, y su carta ya dijo cuál es el tema.',
}
