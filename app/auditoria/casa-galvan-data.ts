import type { AuditoriaCase } from './types'

/**
 * CASA GALVÁN · D23 · CID 13885
 *
 * Auditoría de tráfico telefónico del 2 ene al 17 nov 2026: 15,169 llamadas
 * entrantes externas y 18,157 salientes externas, sobre un registro de 22,013
 * y 25,592 del que se separó el tráfico entre extensiones.
 *
 * ── LO QUE EL BORRADOR TRAÍA MAL Y AQUÍ VA CORREGIDO ────────────────────────
 *
 * 1. EL HEALTH SCORE. El documento decía 76; la cuenta D23 tiene **50**. No es
 *    redondeo: 76 se lee como cuenta sana y 50 como cuenta a vigilar, y 50 es
 *    justo lo que sostiene el resto del reporte. Corregido y anotado DENTRO del
 *    documento entregado. [[auditoria-modulo]]
 *
 * 2. LA ANTIGÜEDAD. Decía «7 años»; el GRC da **95 meses** (alta 4 dic 2018),
 *    o sea 7 años y 11 meses. Quitaba casi un año a un argumento que el propio
 *    reporte usa para pedir la reunión.
 *
 * 3. EL MRR SÍ ESTABA BIEN: $6,378, que es el del GRC —banda AAA, MRR estable,
 *    13 facturas—. Se deja dicho porque en esta clase de reporte el MRR
 *    heredado del corte anterior ya ha aparecido dos veces. [[grc-fuente-zoho]]
 *
 * ── Y TRES COSAS QUE NO SE PUEDEN CERRAR, DECLARADAS EN EL DOCUMENTO ────────
 *
 * a. **Mostrador Querétaro (38/5) y Guadalupe Becerril (24/0) no están en
 *    ninguna tabla** del documento: salen del registro pero no se graficaron, y
 *    los dos van en el plan a 15 días. No se le pide a un cliente que depure
 *    una extensión con una cifra que no puede recalcular.
 * b. **El salto de 1,411 a 1,983.** El resumen publica 1,411 perdidas sin
 *    reintento ni devolución (43.7%) y el impacto calcula sobre 1,983 (61.4%).
 *    Son 572 llamadas y el documento no define la segunda población. Marcado
 *    como HIPÓTESIS: hasta confirmarlo, los escenarios son el techo del rango.
 * c. **La ventana del gráfico por hora va de 7 a 20 h** y deja fuera 30
 *    llamadas de día hábil (0.20%), 22 de ellas perdidas. La atribución de
 *    causas sí las cuenta —suma exactamente 3,230—, pero no se ven en las
 *    barras. Un recorte que no se declara se lee como cobertura completa.
 *    [[feedback-contexto-ia-sin-huecos]]
 *
 * Lo verifica `python -I scripts/concilia-auditoria-casa-galvan.py`, que lee el
 * `const D = {...}` embebido y recalcula: los totales por tres caminos, el
 * reparto de desenlaces, la atribución de causas, las 14 h, el fin de semana,
 * las 12 filas de destinos, las salientes, las 11 líneas del anexo, el MRR
 * contra el GRC y el Health Score contra `cuentas`. Se probó al revés con
 * NUEVE roturas deliberadas y las cazó las nueve. [[feedback-probar-al-reves]]
 *
 * ── LA CONTRADICCIÓN CON NUESTRO PROPIO MOTOR ──────────────────────────────
 * El documento publica «Radar: OPTIMIZE» a secas. Ese veredicto lo CALCULA
 * `lib/radar.ts` por penalizaciones; el Radar de 12 preguntas está en **0 de
 * 12 respondidas**, con alerta `sin_radar` ABIERTA y confirmada el 19 nov 2026.
 * Son dos cosas distintas con el mismo nombre, y leído a secas un asesor
 * entiende que la cuenta se evaluó. Va como hallazgo, no como nota al pie.
 *
 * Además sigue ABIERTA `sin_consumo_medible` (crítica): 0 de 5 meses con dato
 * de consumo en una cuenta que factura $6,378. O sea que esta auditoría cubre
 * un hueco que nuestra propia medición tiene. [[alertas-cliente]]
 *
 * Y el riesgo de interlocutor único NO es de esta semana: la alerta
 * `riesgo_escrito` cita una nota del **15 ago 2026** que ya decía «riesgo total
 * de pérdida» por no haber identificado a otras personas con poder de decisión.
 *
 * ── EL ORDEN DE `hallazgos` ES UNA DECISIÓN, NO ESTILO ─────────────────────
 * Atlas sólo recibe los CUATRO primeros recortados a 180 caracteres, y la
 * actividad SAC que el asesor lee antes de llamar se lleva los TRES primeros
 * enteros. Por eso los cuatro primeros son los que cambian una decisión y cada
 * uno dice lo suyo dentro de sus primeros 180 caracteres.
 * Comprobado con `node scripts/revisa-dossier-auditoria.mjs casa-galvan`.
 * [[auditoria-modulo]]
 */
export const CASA_GALVAN: AuditoriaCase = {
  id:                    'casa-galvan',
  asesor:                'Dan',
  nombre:                'CASA Galván',
  sector:                'Distribución especializada de herrajes',
  fecha_periodo:         '2 enero – 17 noviembre 2026 (321 días)',
  fecha_auditoria:       'Nov 2026',
  tipo_cliente:          'Mediana · 50–200 empleados · 5 oficinas · AAA',
  descripcion_contexto:  'Distribuidor de herrajes multisede · Guadalajara, Jal. · D23 · CID 13885 · Asesor: Dan',
  estado:                'en_riesgo',
  clasificacion:         'CONFIDENCIAL',
  version:               '1.0',

  kpis: [
    { label: 'Perdidas de causa estructural', value: '65.6% · 2,120', color: '#ef4444' },
    { label: 'Sin respuesta ni devolución',   value: '1,411 · 43.7%', color: '#f97316' },
    { label: 'MRR institucional (GRC)',       value: '$6,378 · AAA',  color: '#6366f1' },
    { label: 'Alertas abiertas',              value: '2 · 1 crítica', color: '#dc2626' },
  ],

  resumen_ejecutivo:
    'Auditoría de tráfico telefónico sobre 321 días: 15,169 llamadas entrantes externas de 6,035 números distintos y 18,157 salientes externas, tras separar 6,842 entrantes y 7,435 salientes que son tráfico entre extensiones. ' +
    'Se perdieron 3,230 llamadas entrantes (21.3%, y 31.6% si no se cuenta el menú). La tesis de la auditoría es que CASA Galván NO tiene un problema de capacidad: 2,120 de esas 3,230 —el 65.6%, dos de cada tres— caen en ventanas donde la configuración entrega la llamada a nadie, y sólo 1,110 (34.4%) son saturación real con el equipo presente. En horario hábil de lunes a viernes, quitando la hora de la comida, la tasa de perdidas baja a 15.1%: el equipo atiende razonablemente cuando está. ' +
    'Las tres ventanas son la hora de la comida (432 perdidas y 8.4% de atención a las 14 h, contra 762 atendidas a las 13 h y 689 a las 15 h), el fuera de horario y el fin de semana (475 + 449, con sábado al 40.0% y domingo al 54.1% de perdidas) y los destinos que reciben llamadas sin que nadie las tome (764). ' +
    'El agravante no es la tasa sino lo que pasa después: de las 3,228 perdidas con número identificable, sólo el 7.6% recibió una devolución conectada en menos de una hora y el 13.1% en 24 h, con una mediana de 67 horas para el primer intento. En 1,411 casos (43.7%) el cliente no volvió a llamar y nadie lo llamó. ' +
    'En paralelo el volumen entrante cayó un 35% desde junio y las salientes casi se triplicaron de agosto a octubre: la empresa salió a buscar la demanda que dejó de llegarle, mientras 1,411 personas que sí la buscaron se quedaron sin respuesta.',

  resultado_positivo:
    'Las tres ventanas se cierran con configuración y una rutina de devolución, sin contratar a nadie: respaldo para las 14 h, destino alterno fuera de horario y fin de semana, y depuración de los destinos sin atención. El universo atacable son 1,160 perdidas por horario y 764 por destinos sin atención. Y el documento entrega un argumento de reunión que no es un recordatorio de seguimiento: 1,411 clientes de CASA Galván llamaron este año y nadie los atendió ni los devolvió.',

  /* EL ORDEN IMPORTA: los cuatro primeros son lo único que ve Atlas (recortados
     a 180) y los tres primeros enteros son lo que un asesor lee antes de
     llamar. Cada uno dice lo suyo en sus primeros 180 caracteres. */
  hallazgos: [
    'NO es falta de gente, es configuración: 2,120 de las 3,230 perdidas (65.6%) caen en ventanas sin destino, y en horario hábil sin la comida el equipo pierde sólo 15.1%. Se cierra configurando, sin contratar. Las cuatro ventanas son las 14 h, el fuera de horario, el fin de semana y los destinos que ya no atiende nadie: Bianca de la vega, Mostrador Herrajes 1, Elena Corona y Tláhuac.',
    '1,411 clientes llamaron este año, nadie los atendió y nadie los devolvió: el 43.7% de las perdidas. Sólo el 7.6% recibe devolución conectada en menos de 1 h. Ése es el dato de la reunión. La mediana del primer intento de devolución es de 67 horas, y en distribución quien no consigue cotización por teléfono le compra al siguiente de la lista.',
    'Interlocutor ÚNICO y mudo: Berenice Almeraya (CIO) es el único contacto capturado y no responde en seis registros desde el 11 nov. El riesgo está escrito desde el 15 ago 2026. Esa nota decía «riesgo total de pérdida» por no haber identificado a otras personas con poder de decisión; si la cuenta pide baja hoy, no hay segundo interlocutor a quien llamar.',
    'Cuenta AAA de $6,378 de MRR y 95 meses de relación, con 0 de 6 módulos adicionales activados: el costo de salida es casi nulo. Health Score 50, no 76 como decía el borrador. El volumen entrante cayó 35% desde junio mientras la proporción de perdidas subía, que es la combinación que más erosiona el valor percibido.',
    'La hora de la comida es el hueco más grande y el más barato de cerrar: de lunes a viernes entran 1,047 llamadas a las 14 h y se atienden 88 (8.4%); 432 se pierden. No es un retraso, es un horario: ocupa los cuatro cuartos de hora. Las salientes lo confirman — 83 a las 14 h contra más de 2,000 por hora el resto del día.',
    'Cuatro destinos reciben llamadas que casi nadie toma: Bianca de la vega (473 entrantes, 2 atendidas, 371 perdidas), Mostrador Herrajes 1 (427 y 68.1% perdidas, con cinco meses sin una sola atendida), Elena Corona (194 y 1 atendida, aunque sí marcó 221 salientes) y Tláhuac, que pasó de 15% a 50% de perdidas entre febrero y octubre.',
    'Una sola persona sostiene el canal: Arturo Zubiate recibe el 29% de todas las atendidas y hace el 37% de las salientes (6,772, con picos de 109 marcaciones al día), y es el único usuario de click-to-call. Si falta, el canal comercial pierde un tercio de su capacidad y no hay grupo de respaldo definido.',
    'El menú (IVR) parece filtrar en vez de resolver: 4,958 entrantes (32.7%) terminan en él con 0 minutos, y el 24.3% de esas remarca en menos de 10 minutos, contra el 11.9% de las atendidas. Tres líneas viven casi sólo del menú —la 9153 atiende 3 de 405—. El cliente reporta además que la opción 4 no lleva al área indicada.',
    'Las salientes casi se triplicaron de agosto a octubre (1,114 en julio, 3,215 en agosto, 3,378 en septiembre) mientras la conexión caía del 58% al 43-45%, y se activaron usuarios que antes casi no marcaban. El patrón es el de una campaña de prospección en paralelo a la caída del 35% en entrantes: hay que confirmar qué fue y qué resultado tuvo.',
    'CONTRADICCIÓN CON NUESTRO PROPIO MOTOR: el documento publica «Radar: OPTIMIZE», que es un veredicto CALCULADO por penalizaciones, mientras el Radar de 12 preguntas está en 0 de 12 respondidas con alerta abierta. Leído a secas, un asesor entiende que la cuenta se evaluó y no se ha evaluado.',
    'Y SIGUE ABIERTA `sin_consumo_medible`, crítica: el CID 13885 tiene 0 de 5 meses con dato de consumo en nuestra medición, facturando $6,378 al mes. Esta auditoría se hizo sobre el registro de llamadas en crudo, así que cubre un hueco que nuestro propio tablero tiene — y que sigue sin taparse.',
    'TRES CIFRAS DEL DOCUMENTO NO SE PUEDEN RECALCULAR Y VAN MARCADAS DENTRO DE ÉL: Mostrador Querétaro (38 entrantes / 5 atendidas) y Guadalupe Becerril (24 / 0) no aparecen en ninguna tabla aunque van en el plan a 15 días; y el impacto económico se calcula sobre 1,983 perdidas «no recuperadas» que el documento no define, 572 más que las 1,411 del resumen.',
  ],

  cronologia: [
    { fecha: '4 dic 2018',  responsable: 'Callpicker',       evento: 'Alta de la cuenta. 95 meses de relación al cierre de esta auditoría.', tipo: 'ok' },
    { fecha: 'Ene–Jun 2026', responsable: 'CASA Galván',     evento: 'El volumen entrante sube de 1,183 llamadas en enero a 1,897 en junio, el máximo del año.', tipo: 'ok' },
    { fecha: '15 ago 2026', responsable: 'SAC',              evento: 'Se deja escrito el riesgo: no se han identificado otras personas con poder de decisión; «riesgo total de pérdida». Es el último contacto que llegó al cliente.', tipo: 'problema' },
    { fecha: 'Ago–Oct 2026', responsable: 'CASA Galván',     evento: 'Las salientes casi se triplican (1,114 → 3,215 → 3,378) y la conexión cae del 58% al 43-45%. En paralelo el entrante cae un 35% contra junio.', tipo: 'pivote' },
    { fecha: '6 oct 2026',  responsable: 'Motor de alertas', evento: 'Se abren cuatro alertas: sin interlocutor, sin consumo medible, sin contactos y sin radar.', tipo: 'problema' },
    { fecha: 'Oct 2026',    responsable: 'CASA Galván',      evento: 'Reporte de robo del chip de la línea 5580486329; la reposición se concreta correctamente.', tipo: 'ok' },
    { fecha: '2 nov 2026',  responsable: 'Motor de alertas', evento: 'Se abre y se cierra `riesgo_escrito` (crítica), citando la nota del 15 de agosto.', tipo: 'problema' },
    { fecha: '11 nov 2026', responsable: 'SAC',              evento: 'Se captura el contacto de Berenice Almeraya (CIO) y se cierra `sin_contactos`. Empiezan los seis intentos sin respuesta.', tipo: 'neutral' },
    { fecha: '13 nov 2026', responsable: 'Motor de alertas', evento: '`sin_interlocutor` escala a crítica —90 días sin que nadie responda— y se cierra el mismo día por remisión.', tipo: 'problema' },
    { fecha: '17 nov 2026', responsable: 'SAC',              evento: 'Último registro de contacto. Cierre del periodo auditado.', tipo: 'neutral' },
    { fecha: '19 nov 2026', responsable: 'SAC',              evento: 'Se entrega la auditoría de tráfico. Siguen abiertas `sin_consumo_medible` (crítica) y `sin_radar` (alta).', tipo: 'pivote' },
  ],

  perfil_campos: [
    { label: 'Razón social',        value: 'CASA Galván · D23 · CID 13885' },
    { label: 'Sector',              value: 'Distribución especializada de herrajes' },
    { label: 'Contacto principal',  value: 'Berenice Almeraya · CIO · ÚNICO contacto capturado' },
    { label: 'Asesor',              value: 'Dan' },
    { label: 'MRR institucional',   value: '$6,378 (GRC, banda AAA, MRR estable, 13 facturas)' },
    { label: 'Health Score',        value: '50 — el borrador decía 76' },
    { label: 'Antigüedad',          value: '95 meses · alta 4 dic 2018' },
    { label: 'Servicio contratado', value: 'Extensión CE con SIM + Adicionales · 6 DIDs' },
    { label: 'Sedes',               value: 'Tláhuac, Puebla, Querétaro, Villa, San Mateo y GDL' },
    { label: 'Módulos adicionales', value: '0 de 6 en 95 meses' },
    { label: 'Radar ATLAS',         value: 'OPTIMIZE calculado · el Radar de 12 preguntas está en 0 de 12' },
    { label: 'Alertas',             value: '2 abiertas (sin_consumo_medible crítica · sin_radar alta) · 3 cerradas en noviembre' },
  ],

  necesidad_negocio:
    'CASA Galván vende herrajes por teléfono desde seis sedes. Cada llamada entrante es una cotización o un pedido potencial, y el canal telefónico es el que sostiene la operación comercial: 15,169 llamadas de 6,035 números distintos en once meses. Lo que necesita de la plataforma no es más capacidad, sino que ninguna llamada caiga en una ventana sin destino y que lo que se pierda vuelva a tocarse el mismo día.',

  potencial_corto: [
    'Destino de respaldo para las 14 h: comida escalonada o grupo de desborde. 432 perdidas directas.',
    'Regla de fuera de horario y fin de semana con buzón con aviso o IA de Voz. 728 perdidas entre las dos ventanas.',
    'Depuración de los cuatro destinos sin atención. 764 perdidas en horario hábil.',
    'Lista diaria de perdidas con dueño y meta de devolución en menos de una hora.',
    'Corrección de la opción 4 del menú y revisión del árbol completo del IVR.',
  ],

  potencial_largo: [
    'IA de Voz para cubrir las 14 h, el fuera de horario y el fin de semana: universo de 1,160 perdidas.',
    'Callpicker Chat / WhatsApp para desviar del teléfono la consulta simple y repetitiva.',
    'Calltracking por sucursal: medir qué sede pierde y cuál vende, sobre una operación de seis sedes.',
    'Integración API con su CRM o ERP para listas de devolución y para campañas como la de agosto a octubre.',
    'Grupo de atención de respaldo para Arturo Zubiate, que hoy concentra el 29% de las atendidas y el 37% de las salientes.',
  ],

  tacticas: [
    { nombre: 'Entregar el dato antes de pedir la reunión',
      descripcion: 'Dejar de pedir llamada de seguimiento y mandar el hallazgo: 1,411 clientes llamaron este año y nadie los atendió ni los devolvió. El entregable es el motivo de la reunión.',
      impacto: 'Rompe el silencio de un interlocutor único que no responde desde el 11 nov.' },
    { nombre: 'Multihilo por las vías alternas',
      descripcion: 'Usar +52 55 8048 6329 y casagalvanmexico@casagalvan.com, y pedir que a la reunión entren quien opera ventas telefónicas (por volumen, Arturo Zubiate) y un gerente de sucursal (GteQuerétaro).',
      impacto: 'Hoy una decisión de baja llegaría sin que nadie la viera venir.' },
    { nombre: 'Proponer módulo como respuesta a un hallazgo, nunca como catálogo',
      descripcion: 'IA de Voz contra las 1,160 perdidas de horario; Calltracking contra la ceguera por sucursal; API contra la campaña manual de agosto-octubre. Cada uno con su cifra medida en esta cuenta.',
      impacto: '0 de 6 módulos en 95 meses: la conversación de expansión nunca ha tenido un dato detrás.' },
    { nombre: 'Cerrar el hueco de medición que es nuestro',
      descripcion: 'La alerta `sin_consumo_medible` lleva abierta desde el 6 oct: 0 de 5 meses con dato de consumo. Esta auditoría lo cubre una vez, a mano; hay que arreglar la fuente.',
      impacto: 'Sin consumo medido no hay señal temprana de caída en una cuenta de $6,378.' },
  ],

  senal_alarma:
    'El volumen entrante cae un 35% desde junio mientras la proporción de perdidas sube (21.8% en septiembre, 23.5% en octubre, 27.9% en noviembre al día 17). Menos llamadas y peor atención, en una cuenta con interlocutor único silencioso, cero módulos adicionales y por tanto costo de salida casi nulo.',

  problema_raiz:
    'La configuración entrega llamadas a destinos que no pueden atenderlas, y lo que se pierde no se devuelve.',

  problema_raiz_detalle:
    'No es un problema de capacidad ni de personal. Las 3,230 perdidas se reparten en 1,110 de saturación real con el equipo presente (34.4%) y 2,120 estructurales (65.6%): 432 en la hora de la comida, 475 fuera de horario de lunes a viernes, 449 en fin de semana y 764 en destinos que reciben llamadas sin que nadie las tome. En horario hábil sin las 14 h la tasa baja a 15.1%, así que el equipo atiende bien cuando está. Encima no hay segunda oportunidad: la devolución conectada en menos de una hora ocurre en el 7.6% de los casos y la mediana del primer intento es de 67 horas, de modo que la recuperación depende de que el cliente insista — y el 43.7% no insiste.',

  flujo_real: [
    { fase: '14:00 a 14:59, L-V', area: 'Todas las sedes', accion: 'Entra la llamada y el equipo completo está en comida', resultado: '1,047 llamadas: 88 atendidas, 512 al menú, 432 perdidas' },
    { fase: 'Después de las 18:30', area: 'Conmutador', accion: 'La atención cae a cero y entra el buzón «Fuera de Horario»', resultado: 'De 19 a 20 h se pierden 7 de cada 10; antes de las 8 h, 37 de 38' },
    { fase: 'Sábado y domingo', area: 'Conmutador', accion: 'El menú no opera y no hay destino alterno', resultado: '1,045 entrantes, 40.0% y 54.1% de perdidas, y cero salientes de devolución' },
    { fase: 'Horario hábil', area: 'Destinos heredados', accion: 'La ruta entrega la llamada a extensiones que ya no atienden ese canal', resultado: '764 perdidas; Bianca de la vega atiende 2 de 473 y Elena Corona 1 de 194' },
    { fase: 'Después de perder', area: 'Comercial', accion: 'No hay lista de devolución ni dueño asignado', resultado: '7.6% devueltas con éxito en 1 h · 1,411 sin reintento ni devolución' },
  ],

  comparativo: [
    { metrica: 'Perdidas entrantes externas',           real: '21.3% (31.6% sin el menú)', ideal: '< 10%' },
    { metrica: 'Atención a las 14 h, L-V',              real: '8.4% (88 de 1,047)',        ideal: '> 40%' },
    { metrica: 'Perdidas en horario hábil sin las 14 h', real: '15.1%',                    ideal: '< 10%' },
    { metrica: 'Perdidas en sábado / domingo',          real: '40.0% / 54.1%',             ideal: 'destino alterno declarado' },
    { metrica: 'Devolución conectada en menos de 1 h',  real: '7.6%',                      ideal: '> 50%' },
    { metrica: 'Perdidas sin reintento ni devolución',  real: '1,411 (43.7%)',             ideal: '0 sin tocar en 24 h' },
    { metrica: 'Concentración en una persona',          real: '29% atendidas · 37% salientes', ideal: 'grupo de respaldo de 2-3' },
    { metrica: 'Remarcación tras terminar en el menú',  real: '24.3% en 10 min',           ideal: '< 15%' },
    { metrica: 'Módulos adicionales activados',         real: '0 de 6 en 95 meses',        ideal: '≥ 1 con caso de uso medido' },
  ],

  plan_inmediato: [
    { accion: 'Destino de respaldo para las 14 h: dos turnos de comida o grupo de desborde', responsable: 'Cliente (gerencia) + Ingeniería Callpicker', criterio: 'Atendidas a las 14 h > 40%' },
    { accion: 'Depurar los destinos sin atención: Elena Corona, Bianca de la vega, Mostrador Herrajes 1, Mostrador Querétaro y Guadalupe Becerril, revisando el registro de SIM o app de cada extensión', responsable: 'Cliente (sistemas) + SAC', criterio: '764 perdidas por destino → menos de 150' },
    { accion: 'Confirmar contra el registro las cifras de Mostrador Querétaro y Guadalupe Becerril antes de pedir su depuración: no están en ninguna tabla del documento', responsable: 'SAC', criterio: 'Las dos cifras verificadas o retiradas del plan' },
    { accion: 'Corregir la opción 4 del menú y documentar destino por opción en las 11 líneas', responsable: 'SAC + Ingeniería', criterio: 'Remarcación en 10 min por debajo del 15%' },
    { accion: 'Romper el silencio con el entregable, no con un recordatorio, y por las vías alternas', responsable: 'Dan (asesor)', criterio: 'Reunión agendada con un segundo interlocutor presente' },
  ],

  plan_mediano: [
    { accion: 'Lista diaria de perdidas con dueño y meta de devolución en menos de 1 h', responsable: 'Cliente (supervisores) + SAC', criterio: 'Devolución exitosa en 1 h > 50%' },
    { accion: 'Regla de fuera de horario y fin de semana: buzón con aviso o piloto de IA de Voz', responsable: 'Comercial Callpicker + cliente', criterio: 'Perdidas fuera de horario −70%' },
    { accion: 'Grupo de atención de respaldo para Arturo Zubiate, de 2 a 3 usuarios', responsable: 'Cliente', criterio: 'Perdidas por saturación −50%' },
    { accion: 'Confirmar qué fue la campaña de salientes de agosto a octubre y qué resultado tuvo', responsable: 'Dan (asesor)', criterio: 'Respuesta registrada en la bitácora KAM' },
    { accion: 'Cerrar la alerta `sin_consumo_medible`: arreglar la fuente de consumo del CID 13885', responsable: 'Ingeniería Callpicker', criterio: 'Al menos 3 de 5 meses con dato' },
  ],

  plan_estrategico: [
    { accion: 'Calltracking por sucursal y tablero mensual de atención sobre las seis sedes', responsable: 'SAC', criterio: 'Revisión registrada 12 de 12 meses' },
    { accion: 'Integración API con su CRM o ERP para listas de devolución y campañas', responsable: 'Comercial + Ingeniería', criterio: 'Devolución alimentada desde el CRM' },
    { accion: 'Responder el Radar de 12 preguntas, hoy en 0 de 12, y capturar un segundo contacto', responsable: 'Dan (asesor)', criterio: 'Radar completo y ≥ 2 contactos capturados' },
    { accion: 'Callpicker Chat / WhatsApp para desviar del teléfono la consulta repetitiva', responsable: 'Comercial Callpicker', criterio: 'Caída medible del volumen entrante simple' },
  ],

  areas_oportunidad: [
    { area: 'IA de Voz para 14 h, fuera de horario y fin de semana', impacto: 'Universo de 1,160 perdidas', responsable: 'Comercial Callpicker' },
    { area: 'Reglas de desborde a grupo o sucursal',                 impacto: '764 destinos sin atención + 1,110 por saturación', responsable: 'Ingeniería' },
    { area: 'Calltracking por sucursal',                             impacto: 'Seis sedes sin medición propia', responsable: 'SAC' },
    { area: 'Integración API',                                       impacto: 'Campaña de 9,188 salientes en tres meses hecha a mano', responsable: 'Ingeniería' },
    { area: 'Callpicker Chat',                                       impacto: '4,958 llamadas terminan en el menú sin llegar a nadie', responsable: 'Comercial Callpicker' },
  ],

  perfiles: [
    { nombre: 'Berenice Almeraya', rol: 'CIO · único contacto capturado', color: '#dc2626',
      campos: [
        { label: 'Posición',  value: 'Decide sobre sistemas; no está confirmado que autorice presupuesto' },
        { label: 'Estado',    value: 'Sin respuesta en seis registros entre el 11 y el 17 nov 2026' },
        { label: 'Historia',  value: 'El riesgo de interlocutor único está escrito desde el 15 ago 2026' },
        { label: 'Vías',      value: '+52 55 8048 6329 · casagalvanmexico@casagalvan.com' },
      ] },
    { nombre: 'Arturo Zubiate', rol: 'Operación comercial telefónica', color: '#f97316',
      campos: [
        { label: 'Peso',      value: '29% de todas las atendidas · 37% de las salientes (6,772)' },
        { label: 'Ritmo',     value: '34 marcaciones al día de media, con picos de 109' },
        { label: 'Señal',     value: 'Único usuario de click-to-call (2,444 por web)' },
        { label: 'Riesgo',    value: 'Sin grupo de respaldo: si falta, el canal pierde un tercio de su capacidad' },
      ] },
    { nombre: 'GteQuerétaro', rol: 'Gerencia de sucursal', color: '#16a34a',
      campos: [
        { label: 'Desempeño', value: '1.4% de perdidas: el mejor referente interno de la cuenta' },
        { label: 'Uso',       value: 'Candidato natural para la reunión y para probar el desborde' },
      ] },
    { nombre: 'Dan', rol: 'Asesor SAC de la cuenta', color: '#6366f1',
      campos: [
        { label: 'Pendiente', value: 'Segundo contacto capturado y Radar de 12 preguntas respondido' },
        { label: 'Alertas',   value: '2 abiertas al 19 nov 2026, una crítica' },
      ] },
  ],

  foda: {
    fortalezas: [
      'Volumen sostenido: 15,169 entrantes externas de 6,035 llamantes únicos en 321 días.',
      'En horario hábil L-V el núcleo atiende bien: 15.1% de perdidas sin contar las 14 h.',
      'Referentes internos medidos: GteQuerétaro 1.4%, Mostrador Puebla 1 4% y Mostrador Herrajes 11%.',
      'Uso intensivo y avanzado: 18,157 salientes, click-to-call web y extensiones móviles con SIM.',
      '95 meses de relación, pagos al corriente y cero tickets de falla de plataforma.',
      'Operación multisede ya montada en seis ubicaciones.',
    ],
    oportunidades: [
      'IA de Voz para las 14 h, el fuera de horario y el fin de semana: universo de 1,160 perdidas.',
      'Reglas de desborde a grupo o sucursal para los destinos saturados y los sin atención.',
      'Callpicker Chat o WhatsApp para desviar del teléfono la consulta simple.',
      'Calltracking por sucursal: hoy nadie puede decir qué sede pierde y cuál vende.',
      'Integración API con su CRM o ERP para listas de devolución y para campañas.',
      'Los nombres del registro abren el mapa de decisores más allá del contacto único.',
    ],
    debilidades: [
      '65.6% de las perdidas son de diseño: comida, fuera de horario, fin de semana y destinos sin atención.',
      'Sin disciplina de devolución: 7.6% conectadas en 1 h y mediana de 67 horas al primer intento.',
      'Dependencia de una persona: 29% de las atendidas y 37% de las salientes.',
      'IVR con señales de fuga —24.3% de remarcación en 10 minutos— y una opción mal dirigida.',
      '0 de 6 módulos adicionales activados en 95 meses.',
      'Un solo contacto capturado, sin respuesta desde el 11 nov.',
      'Health Score 50, no 76: el borrador de este mismo reporte lo traía mal.',
    ],
    amenazas: [
      'Volumen entrante −35% desde junio mientras la proporción de perdidas sube.',
      '1,411 llamantes sin respuesta ni reintento: demanda que se va a la competencia.',
      'Contacto único silencioso: una decisión de baja llegaría sin contexto previo.',
      'Costo de salida bajo por los 0 de 6 módulos: cambiar de proveedor es fácil.',
      'Salida de usuarios y sucursales sin plan de reemplazo (Mostrador GDL y Lourdes Martinez desde mayo).',
      'Nuestra propia medición está ciega: `sin_consumo_medible` abierta y crítica desde el 6 oct.',
    ],
  },

  conclusion:
    'CASA Galván no tiene un problema de capacidad: tiene un problema de diseño de atención, y lo tiene junto a un problema de relación. Dos de cada tres llamadas perdidas caen en ventanas que se cierran con configuración, y el equipo atiende razonablemente cuando está presente. Lo que convierte eso en riesgo de cuenta es lo que viene después: 1,411 personas llamaron, nadie las atendió, nadie las devolvió, y no volvieron. En paralelo, la cuenta lleva 95 meses con cero módulos adicionales, un solo contacto capturado que no responde desde el 11 de noviembre y un riesgo de interlocutor único escrito desde agosto. La conversación correcta no es un módulo más del catálogo: es enseñar cuánta demanda se está yendo y traer el plan para recuperarla en 30 días.',

  pierde: [
    'Las llamadas de 1,411 clientes al año que ya no volvieron a intentarlo.',
    'La demanda del fin de semana y del fuera de horario: 1,045 entrantes sin ninguna devolución.',
    'La capacidad de ver qué sucursal vende y cuál pierde, sobre seis sedes.',
    'La señal temprana de caída: nuestra propia medición de consumo lleva cinco meses en blanco.',
    'El interlocutor, si Berenice Almeraya sale y no hay un segundo contacto capturado.',
  ],

  gana: [
    'Cerrar las 14 h, el fuera de horario y el fin de semana sin contratar a nadie.',
    'Recuperar un universo de 1,924 perdidas entre las ventanas de horario y los destinos sin atención.',
    'Una rutina de devolución diaria que convierte una perdida en una segunda oportunidad.',
    'Un argumento de expansión con la cifra de esta cuenta detrás, en vez de un catálogo.',
    'Un segundo interlocutor y un Radar respondido, que es lo que hoy no existe.',
  ],

  recomendacion_central:
    'Entregar la auditoría como motivo de reunión, no pedir una llamada de seguimiento: «este año entraron 15,169 llamadas de sus clientes, 3,230 no las tomó nadie y 1,411 de esas personas no volvieron a llamar ni recibieron devolución; no es falta de gente y lo podemos cerrar en 30 días con configuración». Exigir que a la reunión entre un segundo interlocutor además de sistemas.',

  documentos: [
    { nombre: 'Auditoría de tráfico telefónico · CASA Galván 2026',
      ruta: '/auditorias/Auditoria-CASA-Galvan-2026.html',
      descripcion: 'Reporte completo con gráficas interactivas y vista cliente. Incluye las correcciones y los límites marcados dentro del documento (Health Score, antigüedad, cifras no recalculables y ventana del gráfico horario).' },
  ],
}
