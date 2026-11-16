/* ═══════════════════════════════════════════════════════════════════════
   GROSS REVENUE CHURN · 2026 CONFIRMADO — cifras oficiales del reporte GRC

   Este archivo complementa a `aaa-grc-data.ts` (generado desde el Excel) con
   lo único que el Excel NO trae: la BASE de MRR de cada mes, que es el
   denominador del porcentaje de GRC.

   Por qué hace falta: el export de Zoho lista sólo los contratos afectados
   por churn o downgrade. La suma de su "MRR Inicio Contrato" da, por ejemplo,
   $257,972.65 en enero — pero la base del GRC de ese mes es $4,650,020.89,
   que es el MRR TOTAL de la compañía. Ese dato vive en el reporte GRC, no en
   el export, así que se captura aquí a mano desde el reporte.

   ➕ Al cerrar un mes nuevo: añade su base aquí. Si no se agrega, el mes
      aparece en la tabla sin porcentaje (no se inventa un denominador). Y
      corre `scripts/verifica-contra-tablero.py`, que es donde vive ahora el
      contraste contra el tablero oficial de Zoho.

   ── REEXPRESIÓN DEL 20-SEP-2026 ───────────────────────────────────────────
   El export `DT_Churn_etiquetas.xlsx` no sólo trajo septiembre: reescribió
   cuatro meses YA REPORTADOS. Un contrato marcado «Churn confirmado» que
   después se factura desaparece del corte, y Zoho reclasifica a fraude /
   reestructura sin avisar. Las cifras de mayo a agosto de este archivo se
   actualizaron a la nueva expresión; las anteriores quedan en
   GRC_REEXPRESION_2026_09_20 para que el cambio sea auditable y no una
   corrección silenciosa. Conciliado al centavo con
   `scripts/concilia-grc-export.py`.
═══════════════════════════════════════════════════════════════════════ */

/** MRR total de la compañía al inicio de cada mes — denominador del GRC %. */
/** MRR total de la compañía al inicio de cada mes — denominador del GRC %.
 *
 * SALE DEL EXPORT INSTITUCIONAL, ya no se captura a mano. Hasta el 2 oct 2026
 * el export de este módulo solo traía filas de pérdida, sin la base, así que
 * el denominador se transcribía del tablero — y se quedaba atrás: agosto decía
 * $5,006,567.60 cuando el corte nuevo da $5,013,222.60, y septiembre
 * $4,905,228.27 contra $4,949,144.17. Un denominador viejo con un numerador
 * nuevo da un porcentaje que no es ninguno de los dos.
 *
 * Regenerar junto con aaa-grc-data.ts, del MISMO archivo.
 */
/* YA NO SE TECLEA: lo calcula `scripts/mide-base-mrr.py` del export
   institucional y lo imprime listo para pegar (`--ts`). El comentario de arriba
   decía desde hace semanas que «sale del export institucional», pero ningún
   guion lo sacaba — se copiaba a mano, y un espejo tecleado a mano deja de ser
   espejo en cuanto la fuente se mueve. Aquí la fuente se mueve CADA SEMANA.

   Se CALCULA del archivo, no se copia del tablero. Que coincida al centavo con
   la transcripción de `verifica-contra-tablero.py` —que sí viene del tablero—
   es una comprobación de verdad; si se copiara de ahí, aquella pasaría por
   construcción. [[feedback-metricas-derivadas-origen]] */
/* Recalculada del export institucional `GRF.xlsx` el 16 nov 2026 con
   `mide-base-mrr.py --ts`. Se movieron DIEZ de los once meses: Abril
   −$1,476.00, Mayo −$1,469.00, Junio −$1,154.99, Julio −$1,476.00, Agosto
   +$2,242.94, Septiembre +$2,306.54, Octubre +$4,233.28 y Noviembre
   +$6,279.28; Enero, Febrero y Marzo no se movieron.
   Al centavo, nunca redondeado: lo escribí una vez como 4886743 y lo cazó
   `verifica-contra-tablero.py` — un denominador redondeado da un porcentaje
   que no es el del tablero. */
export const GRC_BASE_MRR: Record<string, number> = {
  Enero:      4650439.89,
  Febrero:    4697115.10,
  Marzo:      4777829.30,
  Abril:      4856114.51,
  Mayo:       5075266.09,
  Junio:      5105407.13,
  Julio:      4945057.29,
  Agosto:     5017300.54,
  Septiembre: 4984993.16,
  Octubre:    4921518.85,
  Noviembre:  4730305.05,
}

/** Las bases ANTES del export `GRF.xlsx`, para que el cambio sea auditable. */
export const GRC_BASE_MRR_ANTES_2026_11_16: Record<string, number> = {
  Abril:      4857590.51,
  Mayo:       5076735.09,
  Junio:      5106562.12,
  Julio:      4946533.29,
  Agosto:     5015057.60,
  Septiembre: 4982686.62,
  Octubre:    4917285.57,
  Noviembre:  4724025.77,
}

/**
 * REEXPRESIÓN DEL 6-NOV-2026 — del export institucional `CRF.xlsx`.
 *
 * Se movieron los DIEZ meses: SIETE de ellos +$169.00 exactos (Ene, Feb, Mar,
 * Abr, May, Jun y Ago) y tres más — Julio +$2,564.00, Octubre +$2,856.00 y
 * Septiembre +$26,763.00. Más Noviembre, que no existía.
 * Total de la base: $53,751,860.86.
 *
 * El mismo +$169.00 en siete meses distintos NO es redondeo, pero de dónde
 * sale NO ESTÁ MEDIDO y aquí no se inventa. Queda anotado por si vuelve a
 * aparecer: un importe idéntico repetido en meses cerrados es la firma de una
 * fila retroactiva, y conviene cazarla antes de que se vuelva costumbre.
 *
 * Las bases anteriores quedan abajo, en la reexpresión del 2-nov.
 */

/**
 * REEXPRESIÓN DEL 2-NOV-2026 — las bases que había antes del export
 * institucional `GRC (2).xlsx`, para que el cambio sea auditable.
 *
 * Se movieron seis meses: Marzo +$490, Junio +$2,398, Julio −$295, Agosto
 * +$966, Septiembre +$5,554.12 y Octubre +$27,686.72 — +$9,113.12 sobre los
 * nueve cerrados. Los contratos del mes pasaron de 3,635 a 3,644.
 *
 * OJO con el de septiembre: contra la tabla `PUB` de `verifica-grc.py` ese
 * mismo mes se mueve +$3,326.62, no +$5,554.12, porque las dos tablas venían
 * de cortes distintos. Son dos deltas correctos de la misma celda; el de aquí
 * es el que mide contra ESTA constante. Lo cazó `verifica-resumen-cerrados.py`
 * al no cuadrar la suma por $2,227.50.
 *
 * Los demás meses no están aquí porque no se movieron.
 */
export const GRC_BASE_MRR_ANTES_2026_11_02: Record<string, number> = {
  Marzo:      4777170.30,
  Junio:      5103995.12,
  Julio:      4944264.29,
  Agosto:     5013922.60,
  Septiembre: 4950369.50,
  Octubre:    4886742.85,
}

/**
 * REEXPRESIÓN DEL 11-OCT-2026 — las bases ANTERIORES, para que el cambio sea
 * auditable y no una corrección silenciosa.
 *
 * El export `Gross_Revenue_Facturación.xlsx` trajo OCTUBRE y de paso reexpresó
 * los nueve meses cerrados: +$250 de enero a abril, +$700 de mayo a agosto y
 * +$1,225.33 en septiembre. Son décimas sobre una base de cinco millones, pero
 * se registran porque un denominador viejo con un numerador nuevo da un
 * porcentaje que no es ninguno de los dos.
 *
 * OJO: el correo de Análisis DATA del cierre de T3 (6 oct) traía las bases
 * ANTERIORES y cuadraban al centavo con ellas. Desde este export ya no: la
 * diferencia es de +$700 en julio y agosto y +$1,225.33 en septiembre. No es
 * un error de nadie — es que el institucional reexpresó después de que Data
 * mandó su corte. Instrucción de dirección: «si cambió simplemente cambió, haz
 * una nota». Ésta es la nota.
 */
export const GRC_BASE_MRR_ANTES_2026_10_11: Record<string, number> = {
  Enero:      4650020.89,
  Febrero:    4696696.10,
  Marzo:      4776920.30,
  Abril:      4857171.51,
  Mayo:       5075866.09,
  Junio:      5103295.12,
  Julio:      4943564.29,
  Agosto:     5013222.60,
  Septiembre: 4949144.17,
}

/** Meses cuya base NO viene del reporte oficial. Se marcan en pantalla. */
export const GRC_BASE_PROVISIONAL: readonly string[] = []

/**
 * EL MES VIVO NO ES CHURN — ES CARTERA POR COBRAR.
 *
 * Regla de negocio, José Manuel López Delgadillo (20-sep-2026): «dentro del
 * Churn, hablando de septiembre, son clientes que tardan en pagar. El
 * verdadero churn es el mes vencido. Aún se están recibiendo pagos vencidos
 * de agosto, y eso juega en septiembre un papel importante porque existe
 * recuperación por pagos, y así cada mes.»
 *
 * Zoho marca «Churn confirmado» todo contrato que aún no factura, así que el
 * mes vivo mide retraso de cobranza, no bajas. El churn de un mes sólo madura
 * cuando ese mes vence y entran los pagos tardíos — y sigue bajando después.
 *
 * En septiembre 2026: 754 de 790 filas traen la firma «MRR fin en cero y
 * pérdida igual al MRR inicio», y de las que se pueden cotejar contra la
 * cartera el 95% sigue viva. Medido, no supuesto: ver GRC_RECUPERACION_PAGOS.
 *
 * Esta constante gobierna TRES cosas — no es sólo cosmética:
 *   1. la etiqueta y el sombreado del mes en la tabla;
 *   2. el renglón «Meses cerrados», que es la cifra comparable;
 *   3. que NO se generen aclaraciones de baja sobre este mes
 *      (ver lib/aclaraciones.ts).
 *
 * Al cerrar el mes: poner aquí el siguiente mes vivo. Sus bajas sobrevivientes
 * pasan a ser churn real y generan aclaración solas.
 */
/* ROTADA A NOVIEMBRE — 16 nov 2026, con el corte `GRC_AAA_2026.xlsx`.

   Dos cosas lo obligan y ninguna es el calendario:

   1. SÓLO PUEDE HABER UN MES EXCLUIDO. El corte trae noviembre (31 filas de
      Downgrade, $33,700.37, cero «Churn confirmado»), y el módulo ya lo
      publica. Dejar la constante en Octubre daría noviembre por cerrado
      —con un GRC de 0.5%, que es un mes recién empezado— y seguiría
      excluyendo el mes anterior. Es el error en el sentido contrario.

   2. EL CRITERIO DOCUMENTADO ABAJO SE CUMPLIÓ. Decía: «el criterio para rotar
      no es que el churn baje: es que aparezca una baja real que el cierre
      venga a capturar». `mide-cierre-de-mes-grc.py Octubre` al 16 nov:
      de 192 filas con «Churn confirmado», 11 cruzan con la cartera y
      CINCO ya figuran de baja o dormidas — Jason de México (D7, $17,225),
      IMAGEN DENTAL AMT (Z18, $8,988), KOMBITEC (D22, $8,539),
      Biolaboratorio Sadat (C29, $7,184) y SOBERANI (D15, $5,235).
      El 6 nov eran 13 cotejables y 13 vivas: cero capturas.

   EL COSTE SE DICE, NO SE ESCONDE: quedan SEIS cuentas que la base da por
   vivas y que entran a NOMBRES_CHURN_GRC — ATP Sofom (C8, en_riesgo,
   $14,848), ABRL SISTEMAS & PROYECTOS (C11, en_riesgo, $14,665), SW Sapien
   (C12, en_riesgo, $13,668), BATTERY MART (F40, activo, $7,024), Hairfix
   (C48, activo, $2,407) y Dental District (Z54, activo, $2,308). Atlas dirá
   de ellas «aparece como Churn confirmado». Cinco capturas buenas contra
   seis afirmaciones que hay que mirar una por una; antes era cero contra
   trece, y por eso antes no se rotaba. */

/* LO QUE DECÍA ANTES — 2 nov 2026, cuando la respuesta era NO.

   El corte nuevo se tomó dos días después del cierre y octubre bajó muchísimo:
   de 624 filas y $850,238.92 a 295 filas y $393,410.82, un GRC de 17.4% → 8.1%.
   Son $456,828.10 que nunca fueron churn: contratos marcados «Churn
   confirmado» por no haber facturado todavía, que facturaron.

   La tentación es rotar la constante a Noviembre y dar octubre por cerrado.
   NO, y está medido: `scripts/mide-cierre-de-mes-grc.py Octubre` dice que al
   rotarla entran 251 nombres a NOMBRES_CHURN_GRC, de los que 15 cruzan con la
   cartera — y los 15 están ACTIVOS o EN RIESGO, ninguno de baja. Atlas diría
   de Jason de México (D7, $17,225), ATP Sofom (C8, $14,848) o KOMBITEC (D22,
   $8,539) que «aparecen como Churn confirmado». Cero capturas correctas y
   quince afirmaciones falsas sobre clientes vivos.

   Dos días después del cierre la cobranza tardía sigue entrando, que es
   exactamente lo que describe la regla: septiembre 2026 tuvo TRES lecturas
   —23.6% → 6.9% → 3.14%— y ni el mes recién cerrado era definitivo. Octubre
   sale de «en curso» cuando esos 15 bajen, no cuando cambie el calendario.
   Ver [[regla-churn-mes-vencido]]. */
export const GRC_MES_EN_CURSO: string | null = 'Noviembre'

/**
 * POR QUÉ OCTUBRE SIGUE EXCLUIDO AUNQUE YA TERMINÓ.
 *
 * El 2-nov-2026 octubre ya es mes vencido y el tablero lo publica como un mes
 * normal (7.9%). La tentación es rotar `GRC_MES_EN_CURSO` a `null` y darlo por
 * cerrado. **Se midió antes de hacerlo y la medición lo desaconseja**, con
 * `scripts/mide-cierre-de-mes-grc.py Octubre`. Vuelto a medir con el corte del
 * 6-nov-2026:
 *
 *   · 219 filas de octubre traen «Churn confirmado» (eran 246 el 2 nov)
 *   · sólo 13 cruzan con una cuenta de la cartera — las únicas cotejables
 *   · **las 13 están VIVAS** (activo o en_riesgo). Ninguna de baja ni dormida.
 *
 * O sea: rotar captura CERO bajas reales y mete 13 cuentas vivas a
 * `NOMBRES_CHURN_GRC`, donde Atlas diría de ellas «aparece como Churn
 * confirmado». El coste es seguro y el beneficio es nulo.
 *
 * LA TENDENCIA VA EN LA DIRECCIÓN BUENA PERO NO HA LLEGADO: en cuatro días el
 * churn de octubre bajó de 246 a 219 filas y las cotejables de 15 a 13, o sea
 * que la cobranza sigue entrando. Lo que NO ha pasado todavía es que una sola
 * de las cotejables se convierta en baja de verdad — sigue siendo 13 de 13
 * vivas. El criterio para rotar no es que el churn baje: es que aparezca una
 * baja real que el cierre venga a capturar.
 *
 * Esto NO dice que octubre esté en curso —no lo está—: dice que su churn no ha
 * madurado. Es lo que el rótulo de la tabla tiene que decir, y por eso dejó de
 * poner «mes en curso». `lib/grc-cerrados.ts` ya lo llama por su nombre:
 * `GRC_MES_EXCLUIDO`.
 *
 * SE REVISA EN CADA CARGA: en cuanto las cotejables empiecen a salir de baja,
 * esto se rota y `GRC_RESUMEN_CERRADOS.hasta` pasa a 'Octubre'.
 */
/* Al 16 nov 2026 el mes sin madurar ya es NOVIEMBRE, y lo está de verdad:
   el corte le da 31 filas, todas Downgrade, y CERO «Churn confirmado».
   Las cifras de octubre quedan abajo como la medición que justificó cerrarlo. */
export const GRC_MES_SIN_MADURAR = {
  medido:        '2026-11-16',
  guion:         'scripts/mide-cierre-de-mes-grc.py',
  filasChurn:    0,
  cotejables:    0,
  cotejablesVivas: 0,
}

/** La medición de OCTUBRE el día que se cerró — lo que ya no hay que adivinar. */
export const GRC_CIERRE_OCTUBRE_2026_11_16 = {
  medido:          '2026-11-16',
  filasChurn:      192,     // eran 219 el 6 nov y 246 el 2 nov
  cotejables:      11,
  cotejablesVivas: 6,
  cotejablesDeBaja: 5,
}

/**
 * RECUPERACIÓN POR PAGOS — la prueba de que el mes vivo no es churn.
 *
 * Entre el corte del 17-sep-2026 y el del 20-sep-2026 —tres días— 26 cuentas
 * marcadas «Churn confirmado» facturaron y salieron del churn. Veintidós son
 * de AGOSTO, el mes vencido: es exactamente la cobranza tardía entrando.
 *
 * Esto NO incluye los $40,231.54 de GTC (CARRANZA y LOMAS), que no se
 * recuperaron sino que Zoho reclasificó a fraude / reestructura. Son cosas
 * distintas y mezclarlas inventaría una recuperación que no ocurrió.
 */
export const GRC_RECUPERACION_PAGOS = {
  entre:  ['2026-09-17', '2026-09-20'] as const,
  total:  29919.00,
  cuentas: 26,
  porMes: [
    { mes: 'Julio',  monto:  5092.00, cuentas:  4 },
    { mes: 'Agosto', monto: 24827.00, cuentas: 22 },
  ],
}

/* -- RETIRADO el 11 oct 2026 ---------------------------------------------
   Aqui vivian `GrcFilaReporte`, `GRC_VERIFICACION` y `GRC_RESUMEN_REPORTE`:
   una copia CONGELADA del reporte GRC que el modulo contrastaba contra el
   export, pintando en rojo cada diferencia.

   Se retiran por instruccion de direccion. El motivo no es que molestaran:
   es que comparar un reporte de un momento dado contra un tablero vivo
   DIVERGE SIEMPRE, porque el institucional reexpresa los meses cerrados
   conforme entran pagos tardios y Zoho reclasifica contratos entre tipos de
   churn. En el corte del 11 oct marcaba siete «descuadres» y ninguno era un
   error: eran el paso del tiempo. Una alarma encendida de forma permanente
   ensena a ignorar la pantalla.

   El contraste contra la fuente oficial NO se pierde: vive en
   `scripts/verifica-contra-tablero.py`, que compara celda por celda contra el
   tablero de Zoho y FALLA AL CARGAR, que es donde sirve, y no en la cara de
   quien lee el modulo.
   ----------------------------------------------------------------------- */


/**
 * Lo que este archivo decía ANTES del export del 20-sep-2026, con el porqué
 * de cada cambio. Informativo/auditable: que nadie tenga que adivinar por qué
 * un número que ya se presentó a dirección hoy es otro.
 *
 * Tres movimientos, y la conciliación cierra al centavo en -$59,064.54:
 *
 *   · -$40,231.54  GTC (CARRANZA y LOMAS) reclasificados de pérdida REAL a
 *                  fraude / reestructura. Como el GRC excluye el fraude
 *                  (ver GRC_EXCLUYE_FRAUDE), salen del porcentaje. Agosto se
 *                  lleva $34,066.99 de esos.
 *   · -$29,919.00  26 cuentas (4 de julio, 22 de agosto) marcadas «Churn
 *                  confirmado» que desde entonces facturaron. Nunca fueron
 *                  baja: es cobranza tardía entrando, lo que José Manuel llama
 *                  recuperación por pagos. Ver GRC_RECUPERACION_PAGOS.
 *   · +$11,086.00  TATSA vuelve al NÚMERO. No es un movimiento de Zoho: es que
 *                  la tabla oficial dejó de excluirla para poder cuadrar con
 *                  el reporte. Sigue fuera de la operación — ver
 *                  REACTIVADAS_FUERA_DEL_CHURN en lib/elegibilidad.ts.
 */
export const GRC_REEXPRESION_2026_09_20 = {
  fecha:  '2026-09-20',
  origen: 'DT_Churn_etiquetas.xlsx',
  delta:  -59064.54,
  anterior: [
    { mes: 'Mayo',   churn:  32586.00, downgrade: 44979.51, perdida:  77565.51 },
    { mes: 'Junio',  churn:  87260.00, downgrade: 82424.66, perdida: 169684.66 },
    { mes: 'Julio',  churn:  76624.46, downgrade: 28143.20, perdida: 104767.66 },
    { mes: 'Agosto', churn: 114612.17, downgrade: 49977.17, perdida: 164589.34 },
  /* El tipo que llevaba aquí (`GrcFilaReporte`) se retiró con el contraste
     congelado. Esto es un registro histórico y se describe solo. */
  ] as { mes: string; churn: number; downgrade: number; perdida: number }[],
  resumenAnterior: {
    base:      39109117.90,
    churn:       591514.99,
    downgrade:   312737.48,
    perdida:     904252.47,
    pct:               2.3,
  },
}


/**
 * El mismo resumen sin el mes en curso — la cifra comparable contra el
 * histórico.
 *
 * ESTÁ ESCRITO A MANO Y YA SE QUEDÓ VIEJO DOS VECES. La primera decía «hasta
 * Agosto» con septiembre cerrado; la segunda —descubierta el 2 nov 2026— traía
 * el churn inflado en $11,567.50 contra los datos que el propio módulo ya
 * publicaba, desde la carga del 11 oct. Un número plausible dentro de una
 * tabla no se audita solo.
 *
 * Desde el 2 nov lo comprueba `scripts/verifica-resumen-cerrados.py`, que lo
 * recalcula desde `aaa-grc-data.ts` + `GRC_BASE_MRR` leyendo las reglas de
 * clasificación del propio `GrcAaaSection.tsx`. CORRERLO AL CARGAR.
 *
 * TERCERA VEZ, y esta vez el verificador la cazó el mismo día (6 nov 2026): el
 * export movió a TROQUELADOS MODULARES de «Churn mensual» $4,790 (junio) a
 * «Downgrade» $2,395. El GRC no cuenta el churn mensual y SÍ el downgrade, así
 * que la pérdida real del mes BAJA $2,395 y la contada por el GRC SUBE $2,395.
 * Un mismo movimiento reclasificado empuja las dos cifras en sentidos
 * contrarios: por eso ninguna de las dos se deduce de la otra.
 */
/**
 * EL ÚNICO MES QUE GANÓ UNA FILA EN EL CORTE DEL 16-NOV-2026, y qué era.
 *
 * El conciliador vigila que un mes cerrado no gane filas: la cobranza tardía
 * sólo SACA del churn, así que un mes que gana significa reclasificación en los
 * dos sentidos y hay que mirarlo. Marcó agosto, +1 fila / $200.00.
 *
 * Mirado: es **la misma cantidad cambiando de dueño**. Desaparece el Downgrade
 * de agosto de TEMPRO MEXICO ($200.00) y aparece el de ARDE NAWI ($200.00). No
 * es pérdida nueva ni pérdida borrada — es una atribución corregida en el
 * origen, y en el neto del mes vale cero.
 *
 * Queda escrito porque el rasgo volverá a encenderse y la respuesta no se
 * deduce del conteo: dos importes idénticos intercambiando cliente es la firma
 * de una captura mal atribuida, no de un corte truncado. TEMPRO MEXICO aparece
 * además entre las cuentas de octubre que maduraron ($1,959.00 de «Churn
 * confirmado»), así que es el nombre a revisar si vuelve a salir.
 */
export const GRC_ATRIBUCION_AGOSTO_2026_11_16 = {
  medido:  '2026-11-16',
  mes:     'Agosto',
  importe: 200.00,
  salio:   'TEMPRO MEXICO',
  entro:   'ARDE NAWI',
  neto:    0,
}

export const GRC_RESUMEN_CERRADOS = {
  /* 16 nov 2026: pasa de Septiembre a OCTUBRE porque `GRC_MES_EN_CURSO` rotó a
     Noviembre. No es un ajuste cosmético — entra un mes entero: la base suma
     los $4,917,285.57 de octubre y la pérdida contada por el GRC sube
     $296,573.49, con lo que el promedio de meses cerrados pasa de 2.17% a
     2.55%. Las cuatro cifras las recalcula `verifica-resumen-cerrados.py`
     desde `aaa-grc-data.ts` + `GRC_BASE_MRR`; aquí no se teclea ninguna que él
     no confirme. QUINTA vez que esta constante se queda atrás en una carga. */
  hasta:     'Octubre',
  base:      49031041.86,
  churn:       853290.33,
  downgrade:   399288.90,
  perdida:    1252579.23,
  pct:               2.55,
}

/**
 * El fraude / reestructura queda FUERA del Gross Revenue Churn: la pérdida
 * real del periodo enero–**octubre** es $1,692,860.67 —los tres churns más el
 * downgrade—, sin los $457,716.65 de fraude-reestructura de los mismos diez
 * meses. Se reporta por separado.
 *
 * OJO al leer el salto desde los $1,327,044.73 que decía antes: **no es que la
 * pérdida creciera $365,815.94 en una carga**. Son dos cosas a la vez — entra
 * OCTUBRE entero al periodo (era enero–septiembre) y el corte del 16 nov trae
 * las filas de «Churn mensual» reales en vez de las conservadas de un corte
 * viejo (octubre pasa de 16 a 68). Comparar esta cifra con la anterior como si
 * fueran el mismo periodo es la trampa.
 *
 * Las dos cifras las imprime `scripts/verifica-resumen-cerrados.py` y hay que
 * releerlas en CADA carga: han pasado por $2,151,751.56 / $244,432.68, por
 * $1,349,098.73 / $457,271.65, por $1,329,439.73 / $457,271.65 y por
 * $1,327,044.73 / $457,271.65 antes de éstas.
 * El grueso del fraude-reestructura sigue siendo una sola fila: GTC - Oleksei,
 * febrero, $189,440.
 */
export const GRC_EXCLUYE_FRAUDE = true
