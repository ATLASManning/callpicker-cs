import type { AuditoriaCase } from './types'

/**
 * HOSPITAL SANTA ROSA · C4 · CID 81735
 *
 * v3.0 — ACTUALIZACIÓN DEL 26 NOV 2026. Tercer corte del año: 330 días y 89,238
 * registros (48,106 entrantes + 41,132 salientes), contra los 315 días y 85,467
 * del 12 nov y los 203 días y 55,638 de julio.
 *
 * ── LO QUE CAMBIA LA CONVERSACIÓN EN ESTE CORTE ─────────────────────────────
 *
 * A. **EL HALLAZGO CENTRAL VALE EL DOBLE DE LO QUE EL DOCUMENTO DICE.** El
 *    resumen ejecutivo afirma que «el 38.2% corresponde a comunicación interna
 *    entre extensiones». La comunicación interna real es el **73.98%** de las
 *    89,238 llamadas: 32,653 entrantes internas (36.59%) + 33,364 salientes
 *    internas (37.39%). El 38.2% es la cuota de las salientes internas más las
 *    inválidas — la mitad del fenómeno rotulada como el fenómeno entero. Casi
 *    tres cuartas partes de la telefonía de este hospital es tráfico interno, y
 *    ése es el tráfico que pierde ~24%.
 *
 * B. **OCTUBRE ES EL MEJOR MES CERRADO DEL AÑO EN AMBAS DIRECCIONES** (19.3%
 *    entrante y 20.2% saliente, contra 22.9% y 23.6% en enero), y el documento
 *    afirma «sin una tendencia de mejora ni de deterioro marcado» y fija el
 *    rango en «22% a 32%». El piso real de los meses cerrados es 19.3%. Un
 *    rango cuyo piso está 2.7 puntos por encima del mínimo real borra
 *    precisamente el único mes bueno del año — y es el dato con el que se
 *    entra a hablar con el hospital. [[feedback-cero-sin-medicion]]
 *
 * C. **EL GRC MARCA LA CUENTA «CHURN CONFIRMADO» CON MRR FINAL $0.** Fila del
 *    corte vigente: clasif AAA, 10 facturas, 61 meses, $1,270,317 acumulados,
 *    `mrrIni 18345`, `mrrFin 0.0`, `perdida 18345`, `movimiento 'Churn
 *    confirmado'` — y a la vez `verificacion 'sigue_viva'` verificada por
 *    cartera, con `cuentas.estado = 'activo'` y contacto el 26 nov 2026. Las
 *    dos cosas no pueden ser verdad. Una señal de churn en el GRC NO es
 *    autorización de baja: se declara y se sube a dirección, y no se toca el
 *    estado de la cuenta desde aquí. Es el mismo patrón que apareció el mismo
 *    día en Sellomatic (D27). [[feedback-conciliacion-churn]]
 *    [[regla-churn-mes-vencido]]
 *
 * ── CINCO CIFRAS QUE NO CIERRAN, MEDIDAS CON GUION ──────────────────────────
 * `python scripts/concilia-auditoria-santa-rosa-2026-11-26.py <ruta.html>`
 * (guion NUEVO: el del 12 nov sólo entiende la forma `const D` y este corte
 * embebe `const DATA`). Lo que reporta:
 *   1. «38.2% comunicación interna» → real 73.98%.
 *   2. «15.9% salientes externas» → real 7.93% (son 7,079 de 89,238).
 *   3. Las tres cuotas del resumen suman 108.0% porque LOS CUBOS SE SOLAPAN:
 *      las entrantes internas están contadas dentro de «entrantes» (53.9%, que
 *      sí es correcto) y otra vez dentro de «comunicación interna».
 *   4. «93,036 minutos reales conectados» → sus dos sumandos del propio objeto
 *      dan 92,349 (55,613 + 36,736). Difieren 687.
 *   5. El rango «22%–32%» → el piso real es 19.3%.
 * Y dos avisos de lectura, no de aritmética: el KPI «24.7% · promedio
 * entrante+saliente» no es ese promedio (23.89%), sino el total con los 689
 * marcados inválidos dentro (24.68%); y el «sin mejora observable» del punto B.
 *
 * TODO LO DEMÁS CIERRA AL DÍGITO, y es mucho: los dos totales contra sus tres
 * categorías, el desenlace de las entrantes, las perdidas por categoría, las
 * cuatro series mensuales, los dos repartos de perdidas, las 44 tasas
 * mensuales, las 50 filas de las dos tablas y las cuatro clases de evaluación.
 * La extracción de datos de este corte es sólida; lo que falla es el resumen.
 *
 * ── Y UN DEFECTO DE FORMA QUE ROMPE EL RENDER ───────────────────────────────
 * El documento trae `<h4">` (con una comilla suelta) en la sección 5. Corregido
 * al publicar.
 *
 * ── TRES COSAS QUE EL DOCUMENTO ENTREGADO TRAÍA MAL Y AQUÍ VAN CORREGIDAS ───
 *
 * 1. EL ASESOR, OTRA VEZ. El reporte del 26 nov vuelve a nombrar a «Claudia
 *    Hernández» como responsable, en el pie y en tres filas del plan de
 *    seguimiento más la propuesta de portafolio. **Erick la sustituyó el 15 oct
 *    2026** en 71 cuentas y ésta es una de ellas: `cuentas.asesor` y el GRC
 *    vigente dicen Erick, y el respaldo
 *    `data/respaldo-asesor-claudia.2026-10-15.json` la lista. Es el mismo
 *    defecto que el corte del 12 nov, no corregido en origen, y aparece también
 *    en los reportes de ALTERNET (C10) y Grupo Neruc (C9) del mismo lote: es
 *    una clase de error del generador de reportes, no un descuido de este
 *    documento. [[erick-sustituye-a-claudia]]
 *
 * 2. EL MRR. El reporte repite «MRR fijo de $20,953», que viene heredado del
 *    corte de julio. **El MRR institucional es el del GRC y nada más**:
 *    `mrrIni 18345`. `cuentas.facturacion` dice 20,999 y tampoco sirve, y ni
 *    siquiera coincide con el documento: son TRES cifras distintas para lo
 *    mismo. `servicios_json` trae el concepto sin importe, así que la ficha no
 *    puede arbitrar. [[grc-fuente-zoho]] [[feedback-fuente-unica-cuentas]]
 *
 * 3. EL AUTOSERVICIO, AHORA SÍ CIERRA. El corte del 12 nov declaraba 23.4% con
 *    un reparto por línea que sumaba 1,483 de las 3,467 implícitas, y por eso
 *    la v2.0 prohibía citar ese desglose. Este corte publica 7.5% y **cuadra
 *    exacto**: 3,629 de 48,106 entrantes = 7.544%. El desglose por línea ya no
 *    aparece en el documento, así que la prohibición de la v2.0 deja de
 *    aplicar — pero el salto de 23.4% a 7.5% es un cambio de DENOMINADOR
 *    (externas entrantes contra entrantes totales), no una caída del
 *    autoservicio, y los dos NO se presentan como serie.
 *    [[feedback-tablas-deben-cerrar]] [[feedback-metricas-derivadas-origen]]
 *
 * ── POR QUÉ ESTE CORTE NECESITÓ UN CONCILIADOR NUEVO ────────────────────────
 * Al pasarle este documento a `concilia-auditoria-santa-rosa.py`, el guion
 * **ignoró el argumento** —tenía la ruta clavada en una constante— y concilió
 * el documento del 12 NOV, imprimiendo «ok» siete veces sobre un archivo que
 * nadie le había pedido mirar. Un verificador que concilia el documento
 * equivocado y concluye éxito es peor que no tener verificador. Quedó
 * arreglado: ahora acepta la ruta, imprime SIEMPRE el archivo leído y, si le
 * dan la forma que no entiende, falla diciendo cuál usar. El corte del 26 nov
 * se concilia con `concilia-auditoria-santa-rosa-2026-11-26.py`.
 * [[feedback-verificar-antes-asegurar]]
 *
 * ── Y UNA CONTRADICCIÓN CON NUESTRO PROPIO MOTOR ────────────────────────────
 * La cuenta tiene CUATRO alertas abiertas, dos de ellas críticas — entre ellas
 * `sin_interlocutor`, en condición desde el 6 jul 2026. El reporte da por
 * resuelto el problema de contacto con la actualización a Ernesto del 21-jul.
 * **Las dos cosas no pueden ser verdad.** Va como hallazgo y como acción, no
 * como nota al pie. [[alertas-cliente]]
 */
export const HOSPITAL_SANTA_ROSA: AuditoriaCase = {
  id:                    'hospital-santa-rosa',
  asesor:                'Erick',
  nombre:                'Hospital Santa Rosa',
  sector:                'Salud / Hospitales Privados',
  fecha_periodo:         '1 ene – 26 nov 2026 (330 días) · nov en tránsito',
  fecha_auditoria:       'Nov 2026',
  tipo_cliente:          'Mediana · 51–200 empleados · 1 oficina · AAA · MRR $18,345 (GRC, marcado «Churn confirmado»)',
  descripcion_contexto:  'Unidad hospitalaria privada · Querétaro, Qro. · C4 · CID 81735 · Asesor: Erick Sánchez · 89,238 registros',
  estado:                'en_riesgo',
  clasificacion:         'CONFIDENCIAL',
  version:               '3.0',

  kpis: [
    { label: 'La telefonía es INTERNA',       value: '73.98% · 66,017 de 89,238', color: '#ef4444' },
    { label: 'Pérdida interna (ent / sal)',   value: '22.9% / 24.9%',             color: '#dc2626' },
    { label: 'Octubre, mejor mes cerrado',    value: '19.3% / 20.2%',             color: '#22c55e' },
    { label: 'Devolución de perdidas',        value: '0.9% · 78 de 8,309',        color: '#f59e0b' },
  ],

  resumen_ejecutivo:
    'Tercer corte del año: 330 días y 89,238 registros (48,106 entrantes y 41,132 salientes), contra los 85,467 del 12 de noviembre y los 55,638 de julio. Y el corte cambia dos cosas de fondo que el documento entregado no dice.\n\n' +
    'La primera es el tamaño del hallazgo central. El reporte afirma que la comunicación interna es el 38.2% de la telefonía del hospital; es el 73.98% — 32,653 entrantes internas más 33,364 salientes internas de las 89,238 llamadas. El 38.2% es sólo la mitad saliente del fenómeno, rotulada como el fenómeno completo. Casi tres cuartas partes del teléfono de este hospital es tráfico entre extensiones, y ése es el tráfico que pierde cerca de una cuarta parte de los intentos: 22.9% en entrantes y 24.9% en salientes (23.9% combinado extensión a extensión; 24.7% si se cuentan los 689 marcados inválidos, que es la cifra que el documento publica bajo la etiqueta equivocada de «promedio»).\n\n' +
    'La segunda es que octubre es el mejor mes cerrado del año EN AMBAS DIRECCIONES: 19.3% entrante y 20.2% saliente, contra 22.9% y 23.6% en enero. El documento afirma «sin una tendencia de mejora» y fija el rango en 22%–32%, un piso 2.7 puntos por encima del mínimo real, lo que borra el único mes bueno del año. Noviembre, en tránsito, va igual (19.5% y 20.2%). Hay algo que mejoró y nadie ha documentado qué cambió — y es precisamente el dato con el que se entra a hablar con el hospital.\n\n' +
    'Lo que no mejoró es la recuperación: de 8,309 llamadas entrantes perdidas, 78 (0.9%) fueron devueltas. En la práctica operativa una llamada perdida es una llamada cerrada. Y la atención al paciente externo sigue siendo el punto fuerte: 5.3% de pérdida en 15,349 llamadas.\n\n' +
    'Tres notas de rigor que hay que llevar a la conversación. El reporte vuelve a asignar la cuenta a Claudia Hernández, a quien Erick sustituyó el 15 de octubre. Cifra el MRR en $20,953, cuando el institucional del GRC es $18,345 y la ficha dice $20,999: tres cifras para lo mismo. Y el GRC marca esta cuenta como «Churn confirmado» con MRR final en $0 y pérdida de $18,345, mientras la declara a la vez `sigue_viva`, con estado activo y contacto el 26 de noviembre. Eso se sube a dirección; no se da de baja nada desde aquí.',

  resultado_positivo:
    'Octubre es el mejor mes cerrado del año en las dos direcciones internas (19.3% y 20.2%) y noviembre va igual. Es la primera señal de mejora real en tres cortes, y el documento la niega: hay algo que cambió en la operación del hospital y vale más averiguar qué fue que insistir en el problema.\n\n' +
    'La atención a pacientes externos sigue siendo sólida: 5.3% de pérdida en 15,349 llamadas entrantes, muy por debajo del promedio del sector y estable al crecer el volumen analizado por tercera vez.\n\n' +
    'Y la extracción de datos de este corte es la más limpia de los tres: cierran al dígito los dos totales contra sus tres categorías, el desenlace de las entrantes, las perdidas por categoría, las cuatro series mensuales, los dos repartos de perdidas, las 44 tasas mensuales, las 50 filas de las tablas de extensión y departamento, y las cuatro clases de evaluación. Lo que falla es el resumen ejecutivo, no el dato.',

  /* EL ORDEN DE ESTA LISTA NO ES ESTÉTICO.
   *
   * `lib/atlas-context.ts:321` mete en el dossier de la cuenta **sólo los
   * CUATRO primeros hallazgos, y recortados a 180 caracteres cada uno**. Lo
   * demás existe en la pantalla y no en lo que ve el modelo.
   *
   * Así que los cuatro primeros son los que CAMBIAN UNA DECISIÓN —no presentar
   * al cliente todavía, que nada mejoró en cuatro meses, que es estructural, y
   * qué cifra NO se puede citar— y cada uno dice lo suyo dentro de sus primeros
   * 180 caracteres, sin depender de la segunda mitad de la frase. El detalle
   * operativo (ext. 548, 502/509, el cruce) va después: eso se lee en la ficha.
   *
   * Si alguien reordena esto, mueve lo que Atlas sabe de esta cuenta sin que
   * falle nada. [[feedback-contexto-ia-sin-huecos]] */
  hallazgos: [
    'El hallazgo central vale el DOBLE: el reporte dice que la comunicación interna es 38.2% de la telefonía y es 73.98% (66,017 de 89,238). El 38.2% es sólo su mitad saliente.',
    'Octubre es el MEJOR mes cerrado del año en ambas direcciones (19.3% y 20.2%, contra 22.9% y 23.6% en enero). El reporte dice «sin mejora observable» y pone el piso en 22%. Sí hubo.',
    'El GRC marca la cuenta «Churn confirmado» con MRR final $0 y pérdida de $18,345, y a la vez la declara viva, con estado activo y contacto el 26 nov. Va a dirección; NO es baja.',
    'De 8,309 entrantes perdidas, sólo 78 (0.9%) se devolvieron. En la práctica una llamada perdida es una llamada cerrada: no hay recuperación que compense la pérdida interna.',
    'NO CITES el MRR del documento: dice «MRR fijo de $20,953», el GRC dice $18,345 y la ficha $20,999. Son TRES cifras para lo mismo y `servicios_json` trae el concepto sin importe, así que la ficha no puede arbitrar. La institucional es la del GRC.',
    'EL ASESOR ESTÁ MAL, OTRA VEZ: el reporte vuelve a nombrar a Claudia Hernández en el pie, en tres filas del plan de seguimiento y en la propuesta de portafolio. Erick la sustituyó el 15 oct 2026. Es el mismo defecto del corte del 12 nov sin corregir en origen, y aparece también en los reportes de ALTERNET (C10) y Grupo Neruc (C9) del mismo lote: es una clase de error del generador, no un descuido de este documento.',
    '4 alertas abiertas, dos críticas — `sin_interlocutor`, en condición desde el 6 jul, y `sin_consumo_medible`. El reporte da por cerrado el problema de contacto con la actualización a Ernesto del 21-jul y el motor dice que no: una de las dos lecturas está mal. Y `sin_consumo_medible` es ceguera NUESTRA sobre una cuenta de la que tenemos 89,238 registros: en `cuentas`, `llamadas_cambio_pct` y `llamadas_atendidas_pct` valen 0.0.',
    'El reparto que sí cierra al 100.00%, y que es el que hay que usar: entrantes internas 32,653 (36.59%), entrantes externas 15,349 (17.20%), entrantes anómalas 104 (0.12%), salientes internas 33,364 (37.39%), salientes externas 7,079 (7.93%) y salientes inválidas 689 (0.77%). Las tres cuotas del resumen ejecutivo del documento suman 108.0% porque los cubos se solapan: las entrantes internas están contadas dos veces.',
    'OTRA CIFRA DEL RESUMEN QUE NO CIERRA: «15.9% a llamadas salientes hacia teléfonos externos». Las salientes externas son 7,079 de 89,238, el 7.93%. El 15.9% no se reconstruye desde la propia clasificación del documento.',
    'MARCADO en el documento · «93,036 minutos reales conectados» no cuadra con sus dos sumandos del propio objeto de datos: 55,613 entrantes + 36,736 salientes = 92,349. Difieren 687. Con plan ilimitado los minutos son indicador de uso y no base de facturación, pero una cifra que no sale de sus partes no se publica sin marcarla.',
    'MARCADO en el documento · el KPI «24.7% · pérdida en comunicación interna (promedio entrante+saliente)» no es ese promedio, que da 23.89%. El 24.7% sale de meter los 689 marcados inválidos en numerador y denominador (24.68%). Las dos lecturas son defendibles; la etiqueta describe una y publica la otra.',
    '689 intentos de marcado inválido en el año, 100% perdidos — indicio de directorio interno desactualizado o mal comunicado al personal. Es la corrección más barata del reporte y no requiere nada de nuestra parte.',
    'Extensión 548: tercer corte consecutivo con 100% de pérdida, ahora con 96 intentos recibidos y 96 perdidos. De 36 a 94 a 96 intentos sin que la tasa se moviera un punto. Dejó de ser una anomalía de volumen bajo hace dos cortes: es una extensión que NUNCA conecta y nadie la ha apagado ni corregido. Le siguen la 599 (87.8%, 74 intentos) y la 534 (72.6%, 84 intentos).',
    'Jefatura de Enfermería (ext. 502): 3,313 intentos recibidos, 1,207 perdidos, 36.4% — es la extensión MÁS marcada del hospital. Enfermería de Urgencias (ext. 509): 3,126 intentos, 1,155 perdidos, 36.9%, la segunda. Siguen siendo los dos mayores puntos de riesgo combinado por volumen y tasa, y las dos están en áreas clínicas.',
    'Del lado de quién marca, las dos puertas de admisión concentran el volumen: Admisión principal 1 realiza 6,436 intentos internos con 29.6% de pérdida y Admisión principal 2 otros 2,800 con 30.6%. Agendar cirugía QX hace 5,380 con 24.0%. Son los tres departamentos que más dependen del teléfono interno, y los tres pierden entre uno de cada cuatro y uno de cada tres intentos.',
    'Validación cruzada nueva: el export de entrantes conserva la extensión de ORIGEN incluso en llamadas perdidas, lo que permite medir el mismo fenómeno desde dos fuentes independientes. Sistemas (48.8% destino / 52.2% origen) y Vigilancia (34.3% / 33.6%) aparecen altas en las dos; Talento Humano (31.7% / 26.5%) también. Admisión NO: principal 1 mide 13.3% como destino y 28.3% como origen, así que el documento la incluye en esa lista sin que las dos vistas coincidan.',
    'El export de entrantes PERDIÓ el campo de extensión receptora (destination_data_3) que permitía verificar nombres. Se reutilizó el directorio verificado en julio (30 extensiones); las extensiones 548, 511 y 537 quedan sin nombre confirmado y el documento no se lo inventa — correcto, y hay que recuperar el campo.',
    '92,349 minutos reales de conversación en el periodo según sus dos sumandos (55,613 entrantes + 36,736 salientes), contra los 33,640 del corte del 12 nov. Plan ilimitado: es indicador de uso, no base de facturación. El encabezado del documento publica 93,036 y ésa es la cifra marcada.',
    'La voz del paciente sigue sin medirse: sólo 579 de 36,029 llamadas entrantes contestadas (1.6%) recibieron calificación, 428 positivas y 151 negativas. En 29,845 casos el ejecutivo colgó antes de pasar la encuesta. El documento hace bien en no usarla como señal de riesgo — y hay que corregir el flujo, porque una muestra de 1.6% no sostiene ninguna conclusión.',
  ],

  cronologia: [
    { fecha: 'Sep 2021',     responsable: 'Callpicker',        evento: 'Alta de cuenta — Extensión VyC con SIM + Extensión VyC. Contacto registrado: Guillermo Peña.', tipo: 'ok' },
    { fecha: 'Circa 2022',   responsable: 'Hospital',           evento: 'Guillermo Peña deja de laborar en el hospital sin notificación a Callpicker — inicia la brecha KAM de ~4 años.', tipo: 'problema' },
    { fecha: '6 Jul 2026',   responsable: 'Claudia Hernández',  evento: 'Contacto por WhatsApp con Guillermo Peña, que confirma que dejó el hospital hace ~4 años. Queda pendiente identificar al responsable actual. Es la fecha desde la que el motor marca la condición `sin_interlocutor`.', tipo: 'problema' },
    { fecha: '21 Jul 2026',  responsable: 'Claudia Hernández',  evento: 'Actualización de contacto a Ernesto (Administrador de la cuenta) — primer interlocutor registrado en ~4 años.', tipo: 'pivote' },
    { fecha: '23 Jul 2026',  responsable: 'Callpicker / ATLAS', evento: 'Primer corte forense: 55,638 registros, 203 días. Hallazgo central: la crisis está en la comunicación interna, no en la atención al paciente.', tipo: 'ok' },
    { fecha: '6 Oct 2026',   responsable: 'Motor de alertas',   evento: 'Se abren cuatro alertas sobre la cuenta: `sin_interlocutor` y `sin_consumo_medible` (críticas), `sin_radar` y `sin_contactos` (altas). Asesor de apertura: Claudia.', tipo: 'problema' },
    { fecha: '15 Oct 2026',  responsable: 'Dirección',          evento: 'Erick sustituye a Claudia en la cartera; Hospital Santa Rosa es una de las 71 cuentas que cambian de responsable.', tipo: 'neutral' },
    { fecha: 'Ago–Oct 2026', responsable: 'Plataforma',         evento: 'Agosto marca el peor mes interno del año (31.7% salientes / 28.8% entrantes). Septiembre y octubre mejoran parcialmente sin normalizar el indicador — nadie ha documentado qué cambió.', tipo: 'problema' },
    { fecha: '12 Nov 2026',  responsable: 'Callpicker / ATLAS', evento: 'Actualización forense: 85,467 registros, 315 días. Ningún indicador de riesgo mejoró en cuatro meses. Las cuatro alertas se reconfirman el mismo día.', tipo: 'problema' },
    { fecha: 'Oct 2026',     responsable: 'Hospital',           evento: 'MEJOR MES CERRADO DEL AÑO en ambas direcciones internas: 19.3% de pérdida entrante y 20.2% saliente, contra 22.9% y 23.6% en enero. Nadie ha documentado qué cambió, y el reporte del 26 nov lo niega al fijar el rango en «22%–32%».', tipo: 'ok' },
    { fecha: '26 Nov 2026',  responsable: 'Callpicker / SAC',   evento: 'Tercer corte: 89,238 registros, 330 días. El conciliador nuevo encuentra cinco cifras del resumen ejecutivo que no cierran —entre ellas que la comunicación interna es 73.98% y no 38.2%— y confirma al dígito todo lo demás. Se detecta que el GRC marca la cuenta «Churn confirmado» con MRR final $0 mientras está activa: se sube a dirección sin tocar el estado.', tipo: 'pivote' },
  ],

  perfil_campos: [
    { label: 'Razón social',        value: 'Hospital Santa Rosa' },
    { label: 'Consecutivo · CID',   value: 'C4 · 81735' },
    { label: 'Sector',              value: 'Unidad hospitalaria privada — atención especializada, cirugía, maternidad, urgencias e imagenología' },
    { label: 'Tamaño',              value: 'Mediana · 51–200 empleados · 1 oficina' },
    { label: 'Cliente desde',       value: 'Septiembre 2021 — 61 meses facturados según el GRC' },
    { label: 'Servicio contratado', value: 'Extensión VyC con SIM + Extensión VyC (plan ilimitado)' },
    { label: 'MRR institucional',   value: '$18,345 — del GRC, clasificación AAA, 10 facturas y $1,270,317 acumulados en 61 meses. El reporte entregado dice $20,953 (heredado de julio) y `cuentas.facturacion` dice $20,999: ninguno de los dos es la fuente.' },
    { label: 'Señal de churn',      value: 'El GRC trae `movimiento: Churn confirmado`, `mrrFin 0.0` y `perdida 18345`, y a la vez `verificacion: sigue_viva` verificada por cartera, con `cuentas.estado = activo` y contacto el 26 nov 2026. CONTRADICCIÓN ABIERTA en dirección — no es autorización de baja.' },
    { label: 'Reparto del tráfico', value: '73.98% interno (36.59% entrante + 37.39% saliente) · 17.20% entrante externo · 7.93% saliente externo · 0.89% anómalo o inválido. Cierra al 100.00%.' },
    { label: 'Contacto principal',  value: 'Ernesto (Administrador) — actualizado 21-jul-2026, tel. 4425920061' },
    { label: 'Contacto anterior',   value: 'Guillermo Peña — ya no labora (~4 años)' },
    { label: 'Asesor de cuenta',    value: 'Erick Sánchez (desde el 15 oct 2026; antes Claudia Hernández)' },
    { label: 'Alertas abiertas',    value: '4, confirmadas el 12-nov-2026 — sin_interlocutor y sin_consumo_medible (críticas), sin_radar y sin_contactos (altas)' },
    { label: 'Adopción IA/Chat',    value: 'Sin IA de Voz, IA de Chat, Callpicker Chat ni integración API — desaprovechado pese a caso de uso validado' },
  ],

  necesidad_negocio:
    'El hospital requiere comunicación interna confiable entre departamentos críticos (urgencias, quirófano, enfermería, farmacia). ' +
    'La coordinación de la atención al paciente depende de que las llamadas entre extensiones conecten: una pérdida del 23–25% sostenida durante diez meses tiene costo clínico y operativo directo, no sólo de productividad. ' +
    'Con 3,174 y 2,983 intentos hacia Jefatura de Enfermería y Enfermería de Urgencias, la aritmética del periodo son 2,276 comunicaciones fallidas sólo hacia esas dos áreas.',

  potencial_corto: [
    'Cerrar primero las cuatro alertas abiertas: validar con Ernesto que sigue siendo el interlocutor, cargar contactos y radar, y usar los 85,467 registros de esta auditoría para cerrar `sin_consumo_medible`.',
    'Diagnóstico de configuración de extensiones, empezando por las que pierden todo: 548 (94 intentos, 100%) y 537 (20 intentos, 100%), seguidas de 599 (87.8%) y 534 (70.9%).',
    'Agente de Voz IA para atención externa de primer nivel — el 23.4% de autoservicio sostenido entre dos cortes es la base del caso de negocio, aunque el desglose por línea esté pendiente de confirmar.',
    'Reforzar cobertura de domingo: 8.9% de pérdida contra 3.7%–6.3% de lunes a viernes, casi el doble.',
  ],

  potencial_largo: [
    'Enrutamiento inteligente / directorio interno: colas con reintento automático o desvío a extensión alterna cuando la principal no contesta en N segundos. Es lo único que ataca de raíz el 23–25%.',
    'Callpicker Chat para confirmación de citas y resultados de laboratorio — reduce la dependencia de salientes externas, que pierden 38.6%.',
    'Upsell de IA de Chat sobre el volumen repetitivo de horarios, laboratorio y agenda de consulta externa.',
  ],

  tacticas: [
    {
      nombre:      'Resolver la contradicción de las alertas ANTES de hablar con el cliente',
      descripcion: 'El motor dice `sin_interlocutor` crítica desde el 6 jul; el reporte dice que Ernesto es contacto vigente desde el 21 jul. Confirmar cuál es cierta y cerrar o sostener la alerta con motivo escrito.',
      impacto:     'Alto — presentar una auditoría al cliente mientras el tablero dice que no tenemos interlocutor es exponer una incoherencia nuestra, no del hospital.',
    },
    {
      nombre:      'Sesión de hallazgos con Ernesto, con el argumento de los cuatro meses',
      descripcion: 'El gancho no es «tienen un problema», es «lo documentamos en julio, volvimos a medir con el doble de datos en noviembre y no se movió ni un indicador». La tabla de extensiones críticas y el comparativo julio→noviembre son el soporte.',
      impacto:     'Alto — crea urgencia genuina con evidencia propia y posiciona a Callpicker como quien detecta antes de que el cliente lo perciba.',
    },
    {
      nombre:      'Quick win: la extensión 548',
      descripcion: '94 intentos, 94 perdidos, cero excepciones, y el volumen creció 2.6× desde julio. Validar con TI del hospital si sigue en uso o es un residuo de configuración.',
      impacto:     'Medio — resuelve algo concreto y comprobable sin costo para el cliente; es la prueba más barata de que la auditoría sirve.',
    },
    {
      nombre:      'Recuperar el campo de extensión destino en el export',
      descripcion: 'El export de entrantes perdió `destination_data_3`, que es lo que permitía verificar nombres de extensión. Sin él, 548, 511 y 537 se quedan sin identificar y el próximo corte arrastra la misma ceguera.',
      impacto:     'Medio — es deuda de datos nuestra, y crece con cada corte que pasa sin corregirla.',
    },
  ],

  senal_alarma:
    'Cuatro meses entre dos cortes forenses sin que ningún indicador de riesgo se moviera, con cuatro alertas abiertas y dos críticas reconfirmadas el mismo día de la actualización. ' +
    'El riesgo no es que el hospital tenga un problema operativo: es que lo documentamos dos veces y el cliente sigue sin saberlo. Si lo descubre por su cuenta —o si atribuye el 38.6% de salientes a falla de plataforma— la conversación la abrimos desde atrás.',

  problema_raiz:        'Dos cortes forenses, cuatro meses, ningún hallazgo entregado al cliente',
  problema_raiz_detalle:
    'El 81% del tráfico saliente y el 68% del entrante es interno (ext↔ext). Sobre ese volumen, el 25.0% y el 23.0% no conecta, sostenido durante diez meses completos y sin una sola mejora que se mantenga. ' +
    'El problema no está en la infraestructura de Callpicker sino en la configuración de extensiones, la carga por área y la ausencia de supervisión del cliente — pero la causa de que siga abierto es nuestra: el corte de julio documentó exactamente esto y nadie lo convirtió en una conversación. ' +
    'Las cuatro alertas abiertas desde el 6 de octubre, tres de ellas con dueño «asesor», dicen lo mismo desde el otro lado del tablero.',

  flujo_real: [
    { fase: 'Llamada interna',   area: 'Cualquier extensión',    accion: 'Personal del hospital se comunica entre departamentos (ext↔ext)', resultado: '25.0% saliente / 23.0% entrante no conecta — sin notificación ni reintento automático' },
    { fase: 'Ext. críticas',     area: 'Enfermería / Urgencias', accion: 'Intentos de contacto hacia ext. 502 y 509',                       resultado: '36.6% y 37.3% de pérdida — 2,276 comunicaciones fallidas en el periodo' },
    { fase: 'Ext. muertas',      area: '548 y 537',              accion: 'Alguien marca esas extensiones',                                  resultado: '114 intentos, 114 perdidos. Nunca conectan y nadie las ha corregido' },
    { fase: 'Saliente externa',  area: 'Personal del hospital',  accion: 'Llama a pacientes, laboratorios o proveedores',                   resultado: '38.6% de pérdida — entre 33.0% y 44.8% mes a mes, sin tendencia de mejora' },
    { fase: 'Llamada entrante',  area: 'Recepción / Admisión',   accion: 'Paciente externo llama al hospital',                              resultado: '5.3% de pérdida — el punto fuerte, con ligera alza desde el 4.9% de julio' },
    { fase: 'Autoservicio',      area: 'IVR',                    accion: 'Paciente resuelve su consulta sin agente',                        resultado: '23.4% del tráfico externo entrante. El desglose por línea del reporte no cierra y no se cita' },
    { fase: 'Retroalimentación', area: 'Callpicker',             accion: 'Convertir los hallazgos de julio en una conversación con el cliente', resultado: 'No ocurrió. Cuatro meses después los mismos indicadores, más cuatro alertas abiertas' },
  ],

  comparativo: [
    { metrica: 'Pérdida interna (sal. / ent.)',   real: '25.0% / 23.0% — nunca bajó de 19.3% en 10 meses', ideal: '< 5%' },
    { metrica: 'Pérdida salientes externas',      real: '38.6% — rango mensual 33.0%–44.8%',               ideal: '< 15%' },
    { metrica: 'Pérdida entrantes externas',      real: '5.3%',                                            ideal: '< 8% — dentro de rango, vigilar el alza desde 4.9%' },
    { metrica: 'Ext. 548 y 537',                  real: '114 intentos, 114 perdidos (100%)',               ideal: '0 — corregir configuración o dar de baja' },
    { metrica: 'Mejora entre cortes (4 meses)',   real: 'Ninguna — los cuatro indicadores iguales o peores', ideal: 'Corrección medible tras el corte de julio' },
    { metrica: 'Alertas de cliente abiertas',     real: '4, dos críticas, reconfirmadas 12-nov-2026',       ideal: '0 antes de presentar al cliente' },
    { metrica: 'Adopción IA / Chat',              real: '0% — sin propuesta formal en 5 años de relación',  ideal: 'Propuesta presentada con el 23.4% como soporte' },
    { metrica: 'Campo destination_data_3',        real: 'Perdido en el export nuevo — 3 extensiones sin nombre', ideal: 'Restituido antes del próximo corte' },
  ],

  plan_inmediato: [
    { accion: 'Resolver la contradicción: confirmar con Ernesto si sigue siendo el interlocutor y cerrar o sostener la alerta `sin_interlocutor` con motivo escrito', responsable: 'Erick Sánchez', criterio: 'Alerta cerrada con motivo, o sostenida con la razón documentada' },
    { accion: 'Cerrar `sin_consumo_medible` cargando la medición de tráfico de esta auditoría — 85,467 registros del mismo CID, y en cuentas el consumo vale 0.0', responsable: 'Equipo técnico Callpicker (dueño: ingeniería)', criterio: 'llamadas_atendidas_pct y llamadas_cambio_pct con dato medido, no cero' },
    { accion: 'Agendar sesión de hallazgos con Ernesto apoyada en el comparativo julio→noviembre: dos cortes, cuatro meses, ningún indicador movido', responsable: 'Erick Sánchez', criterio: 'Reunión agendada y registrada en Reuniones antes del 30 nov 2026' },
    { accion: 'Validar con TI del hospital si las extensiones 548 y 537 siguen en uso: 114 intentos y 114 pérdidas entre las dos', responsable: 'Erick Sánchez + TI del cliente', criterio: 'Extensiones corregidas o confirmadas como inactivas' },
  ],

  plan_mediano: [
    { accion: 'Pedir a Análisis DATA que confirme el desglose de autoservicio por línea: el reparto suma 1,483 y el 23.4% implica 3,467', responsable: 'Análisis DATA', criterio: 'Desglose que cierre contra el total, o la razón documentada de por qué no cierra' },
    { accion: 'Solicitar que el export de entrantes vuelva a incluir el número de extensión destino (destination_data_3)', responsable: 'Equipo técnico Callpicker', criterio: 'Campo presente en el siguiente export; 548, 511 y 537 identificadas' },
    { accion: 'Propuesta formal de Agente de Voz IA usando el 23.4% de autoservicio sostenido entre dos cortes como caso de negocio', responsable: 'Comercial + Erick Sánchez', criterio: 'Propuesta enviada y apertura de conversación confirmada' },
    { accion: 'Documentar qué cambió entre agosto (31.7%) y octubre (20.3%) en la pérdida interna saliente: si hubo una acción puntual, es replicable', responsable: 'Erick Sánchez + TI del cliente', criterio: 'Causa identificada o descartada por escrito' },
  ],

  plan_estrategico: [
    { accion: 'Implementar enrutamiento inteligente interno: cola con reintento automático o desvío hacia ext. 502 y 509', responsable: 'Equipo técnico Callpicker', criterio: 'Pérdida interna de las extensiones críticas por debajo del 10%' },
    { accion: 'Piloto de Agente de Voz IA para primer nivel de atención externa', responsable: 'Comercial + Técnico Callpicker', criterio: 'Prueba piloto activa en 90 días' },
    { accion: 'Integrar Callpicker Chat para confirmación de citas y resultados, como canal alternativo a la saliente externa con 38.6% de pérdida', responsable: 'Erick Sánchez + Comercial', criterio: 'Propuesta presentada y evaluada por el cliente' },
    { accion: 'Establecer corte forense trimestral de la cuenta, para que no vuelvan a pasar cuatro meses sin que los hallazgos lleguen al cliente', responsable: 'SAC', criterio: 'Siguiente corte con fecha comprometida y dueño' },
  ],

  areas_oportunidad: [
    { area: 'Cierre de alertas abiertas',   impacto: 'Alto — cuatro abiertas y dos críticas: ninguna luz verde en esta cuenta mientras sigan así', responsable: 'Erick Sánchez + Ingeniería' },
    { area: 'Enrutamiento interno',         impacto: 'Alto — el 23–25% de pérdida interna tiene impacto clínico directo y es lo único que lo ataca de raíz', responsable: 'Técnico Callpicker' },
    { area: 'Agente de Voz IA',             impacto: 'Alto — 23.4% de autoservicio sostenido entre dos cortes, caso de uso demostrado por el propio comportamiento de sus pacientes', responsable: 'Comercial + Técnico' },
    { area: 'Extensiones muertas',          impacto: 'Medio — 114 intentos perdidos al 100% entre 548 y 537; corrección sin costo de plataforma', responsable: 'Cliente (TI) + Callpicker' },
    { area: 'Callpicker Chat',              impacto: 'Medio — alternativa a la saliente externa con 38.6% de pérdida para confirmaciones y recordatorios', responsable: 'KAM + Comercial' },
    { area: 'Cobertura de domingo',         impacto: 'Medio — 8.9% de pérdida contra 3.7%–6.3% entre semana', responsable: 'Cliente (operaciones)' },
    { area: 'Deuda de datos del export',    impacto: 'Medio — sin destination_data_3 cada corte arrastra tres extensiones sin identificar', responsable: 'Técnico Callpicker' },
  ],

  perfiles: [
    {
      nombre: 'Ernesto',
      rol:    'Administrador de la cuenta — contacto vigente en el CRM desde el 21-jul-2026',
      color:  '#2563eb',
      campos: [
        { label: 'Rol',            value: 'Administrador de la cuenta' },
        { label: 'Teléfono',       value: '4425920061' },
        { label: 'Contacto desde', value: '21 de julio de 2026' },
        { label: 'Institución',    value: 'Hospital Santa Rosa, Querétaro' },
        { label: 'Pendiente',      value: 'El motor mantiene `sin_interlocutor` crítica y abierta desde el 6 jul. Confirmar que Ernesto es el interlocutor real es la primera acción del plan.' },
      ],
    },
    {
      nombre: 'Erick Sánchez',
      rol:    'Asesor de cuenta Callpicker — responsable desde el 15 oct 2026',
      color:  '#7c3aed',
      campos: [
        { label: 'Responsabilidad', value: 'Seguimiento comercial y relacional de la cuenta' },
        { label: 'Recibió la cuenta', value: '15 de octubre de 2026, en la sustitución de Claudia Hernández (71 cuentas)' },
        { label: 'Acción inmediata', value: 'Resolver la contradicción de `sin_interlocutor` y agendar la sesión de hallazgos con Ernesto' },
        { label: 'Nota',            value: 'El reporte entregado le asigna cuatro de las seis acciones a Claudia Hernández. Corregido aquí contra la cartera y el GRC.' },
      ],
    },
    {
      nombre: 'Claudia Hernández',
      rol:    'Asesor de cuenta hasta el 15 oct 2026 — histórico',
      color:  '#6b7280',
      campos: [
        { label: 'Periodo',    value: 'Hasta el 15 de octubre de 2026' },
        { label: 'Trabajo registrado', value: '4 seguimientos entre el 4 y el 21 de julio de 2026: la llamada sin respuesta, el WhatsApp con Guillermo Peña y la actualización de contacto a Ernesto.' },
        { label: 'Por qué aparece', value: 'Las cuatro alertas abiertas se levantaron bajo su nombre el 6 oct, y el reporte entregado todavía la nombra como responsable. Queda como trazabilidad, no como asignación.' },
      ],
    },
    {
      nombre: 'Guillermo Peña',
      rol:    'Contacto histórico — ya no labora en el hospital',
      color:  '#9ca3af',
      campos: [
        { label: 'Rol original', value: 'Contacto principal registrado en Callpicker desde 2021' },
        { label: 'Status',       value: 'Confirmó por WhatsApp el 6-jul-2026 que dejó el hospital hace ~4 años' },
        { label: 'Impacto',      value: 'Brecha KAM de ~4 años durante la cual ningún hallazgo operativo se retroalimentó al cliente' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      'Atención a llamadas externas entrantes sólida: 94.7% de conexión sobre 14,817 llamadas, sostenida al triplicarse la base de datos analizada.',
      'Cliente de larga permanencia —61 meses facturados, clasificación AAA en el GRC— con adopción estable de Voz VyC y pago automático.',
      'Volumen de tráfico estable y predecible mes a mes: el comportamiento es estructural, lo que hace que cualquier mejora sea medible.',
      'La extracción de datos del corte es confiable: los dos repartos de entrantes externas cierran al número y las 54 tasas de extensión se recalculan exactas desde sus partes.',
      '23.4% de autoservicio sostenido entre dos cortes — base de uso real para el caso de negocio de IA de Voz, sin necesidad de hipótesis.',
    ],
    oportunidades: [
      'Agente de Voz IA para primer nivel de atención externa, capitalizando el 23.4% que ya resuelve sin agente.',
      'Enrutamiento interno inteligente para atacar de raíz el 23–25% de pérdida entre departamentos, empezando por ext. 502 y 509.',
      'La segunda fuente nueva (extensión de origen en entrantes) permite por primera vez cruzar el mismo fenómeno desde dos vistas independientes — ventaja de diagnóstico que ningún competidor puede ofrecer sin estos datos.',
      'Callpicker Chat como canal alternativo a la saliente externa con 38.6% de pérdida.',
      'El argumento de los cuatro meses sin cambio es el gancho más fuerte que ha tenido esta cuenta para abrir una conversación de valor.',
    ],
    debilidades: [
      'Comunicación interna estructuralmente frágil: 23–25% de pérdida durante diez meses completos, sin una sola mejora sostenida.',
      'Salientes externas con 38.6% de pérdida — el peor indicador cuantitativo de la cuenta, idéntico al de julio.',
      'Cuatro alertas abiertas y dos críticas, reconfirmadas el mismo día de esta actualización, con `sin_interlocutor` en condición desde el 6 de julio.',
      'Cero adopción de IA de Voz, IA de Chat, Callpicker Chat e integración API pese a un caso de uso validado por el comportamiento de sus propios pacientes.',
      'Deuda de datos propia: el export perdió el campo de extensión destino y tres extensiones con volumen relevante quedan sin identificar.',
      'El reporte entregado llegó con el asesor y el MRR desactualizados y con un desglose que no cierra: si se hubiera publicado tal cual, habría asignado seis acciones a quien ya no lleva la cuenta.',
    ],
    amenazas: [
      'Riesgo clínico y reputacional si la fricción de comunicación interna afecta tiempos de respuesta en urgencias o quirófano — 2,276 fallos hacia enfermería y urgencias en el periodo.',
      'Sin un interlocutor confirmado, el cliente puede atribuir el 38.6% de salientes a falla de plataforma en vez de a su dinámica interna, y eso convierte un diagnóstico en una objeción.',
      'Cuatro meses entre dos auditorías sin que el cliente supiera nada: si lo descubre por otra vía, la relación se abre desde atrás.',
      'La competencia puede posicionar IA de voz aprovechando que Callpicker aún no ha hecho la propuesta formal en cinco años de relación.',
    ],
  },

  conclusion:
    'La actualización confirma con el doble de datos lo que el corte de julio ya decía, y añade un hallazgo que no estaba: en cuatro meses no se movió un solo indicador de riesgo. ' +
    'El problema operativo del hospital —23–25% de pérdida interna, 38.6% en salientes externas— es tratable y no requiere infraestructura adicional, sino configuración y enrutamiento. ' +
    'El problema de Callpicker es otro: documentamos esto en julio, volvimos a medirlo en noviembre y el cliente sigue sin saberlo, con cuatro alertas abiertas en el tablero desde el 6 de octubre. ' +
    'La prioridad no es comercial: es resolver la contradicción de `sin_interlocutor`, cerrar la ceguera de medición que tenemos abierta sobre una cuenta de la que poseemos 85,467 registros de tráfico, y llevar los hallazgos a Ernesto. La conversación de IA de Voz viene después, y llega más fuerte.',

  pierde: [
    'Aproximadamente 15,700 comunicaciones internas fallidas en el periodo (25.0% de 31,880 salientes y 23.0% de 31,179 entrantes) — tiempo de personal y coordinación clínica comprometida.',
    '2,276 intentos fallidos hacia Jefatura de Enfermería y Enfermería de Urgencias, las dos áreas de mayor criticidad del hospital.',
    '2,606 intentos de contacto externo fallidos (38.6% de 6,751 salientes) — pacientes, laboratorios y proveedores sin respuesta.',
    '114 llamadas a las extensiones 548 y 537 que nunca podrían haber conectado, y que siguen sin corregirse desde julio.',
    'Cuatro meses de ventana para corregir lo que ya estaba documentado — el costo más caro de esta actualización no es del cliente, es nuestro.',
  ],

  gana: [
    'Segundo corte forense con 315 días y 85,467 registros: una serie, no una fotografía, que convierte «problema reciente» en «condición estructural» con evidencia.',
    'Una segunda fuente independiente —la extensión de origen en entrantes— que permite cruzar el mismo fenómeno desde dos vistas y reforzar el diagnóstico.',
    'El argumento comercial más fuerte que ha tenido la cuenta: dos mediciones, cuatro meses, cero movimiento.',
    'El dato para cerrar la alerta `sin_consumo_medible` que lleva abierta y crítica desde el 6 de octubre.',
    'Tres defectos del reporte entregado detectados antes de publicarse (asesor, MRR y un desglose que no cierra), y un conciliador que los vuelve a buscar en el próximo corte.',
  ],

  recomendacion_central:
    'No abrir la conversación comercial todavía. El orden correcto es: primero resolver `sin_interlocutor` y cerrar `sin_consumo_medible` —no se presenta una auditoría a un cliente mientras nuestro propio tablero dice que no tenemos interlocutor ni medición de su consumo—, después llevar a Ernesto el comparativo julio→noviembre con el quick win de la extensión 548 como prueba de que el diagnóstico sirve, y sólo entonces proponer el Agente de Voz IA sobre el 23.4% de autoservicio. ' +
    'El punto de entrada con más fuerza no es un indicador: es que medimos dos veces en cuatro meses y nada cambió.',

  documentos: [
    {
      nombre:      'Hospital Santa Rosa · Auditoría forense de tráfico telefónico — Corte 26 nov 2026',
      ruta:        '/auditorias/Hospital-Santa-Rosa-Auditoria-Forense-2026-11-26.html',
      descripcion:
        'Reporte completo e interactivo del corte del 26 nov 2026 sobre 89,238 registros del CID 81735 ' +
        '(48,106 entrantes + 41,132 salientes), 1 ene – 26 nov 2026, con noviembre marcado como mes en ' +
        'tránsito: tendencia mensual de las cuatro tasas de pérdida, comunicación interna extensión a ' +
        'extensión, riesgo por extensión destino y por departamento origen, mapa volumen-vs-tasa, ' +
        'atención a pacientes externos por hora, autoservicio y devolución, FODA, matriz de hallazgos y ' +
        'plan de seguimiento. DOCUMENTO INTERNO: no se comparte con el cliente tal cual. ' +
        'PUBLICADO CON SEIS CORRECCIONES VISIBLES DENTRO DEL PROPIO DOCUMENTO: la comunicación interna es ' +
        'el 73.98% del tráfico y no el 38.2% (el 38.2% es sólo su mitad saliente); las salientes externas ' +
        'son el 7.93% y no el 15.9%; las tres cuotas del resumen suman 108.0% porque los cubos se solapan, ' +
        'y se sustituyen por el reparto de seis clases que cierra al 100.00%; los minutos del encabezado ' +
        '(93,036) no cuadran con sus sumandos (92,349); el rango de la pérdida interna tiene piso en 19.3% ' +
        'y no en 22%, porque octubre es el mejor mes cerrado del año en ambas direcciones; y el asesor ' +
        'responsable es Erick Sánchez, no Claudia Hernández. Se declara además que el GRC marca la cuenta ' +
        '«Churn confirmado» con MRR final $0 mientras está activa y al corriente. ' +
        'Lo verifica `python scripts/concilia-auditoria-santa-rosa-2026-11-26.py <ruta>`, que recalcula ' +
        'las cifras embebidas en el archivo: todo lo demás cierra al dígito.',
    },
    {
      nombre:      'Hospital Santa Rosa · Auditoría forense — Corte anterior, 12 nov 2026',
      ruta:        '/auditorias/Hospital_Santa_Rosa_Auditoria_Forense_2026-11-12.html',
      descripcion:
        'Reporte completo e interactivo del corte del 12 nov 2026 sobre 85,467 registros del CID 81735 ' +
        '(39,371 salientes + 46,096 entrantes), 1 ene – 12 nov 2026, con la comparativa contra el corte de julio, ' +
        'la tendencia mensual de las cuatro tasas de pérdida, el mapa de riesgo volumen-vs-tasa, las tablas ' +
        'ordenables de extensiones por destino y por origen, y el reparto por hora y por día de la semana. ' +
        'DOCUMENTO INTERNO: no se comparte con el cliente tal cual. ' +
        'TRES CORRECCIONES APLICADAS SOBRE EL ORIGINAL, anotadas dentro del propio documento: el asesor responsable ' +
        'es Erick Sánchez y no Claudia Hernández (sustitución del 15 oct 2026); el MRR institucional es $18,345 según ' +
        'el GRC y no los $20,953 heredados del corte de julio; y el desglose de autoservicio por línea suma 1,483 ' +
        'frente a las 3,467 que implica el 23.4% declarado, así que ese desglose NO se cita. ' +
        'Lo verifica `python scripts/concilia-auditoria-santa-rosa.py`, que recalcula las cifras embebidas en el ' +
        'archivo: todo lo demás cierra al número.',
    },
  ],
}
