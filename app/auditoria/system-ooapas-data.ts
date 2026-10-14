import type { AuditoriaCase } from './types'

/**
 * GRUPO SYSTEM OOAPAS (D2 · CID 167954) — la cuenta que no opera.
 *
 * Auditoría del 12 oct 2026. Es el TERCERO que se escribió de los OCHO
 * expedientes del TOP 50 que hay a la fecha —la serie se numera en sus
 * propias cabeceras hasta la Octava: ECODELI «Sexta», OdontoPrev «Séptima»,
 * PROBEMEDIC «Octava», más Sección Amarilla e IMPAS, que nacieron del
 * reorden del TOP 50—, y es el más corto a propósito: aquí no hay una
 * operación que auditar. Lo que hay es una cuenta encendida que no consume, y
 * una ficha que publica su promedio de vida en el lugar donde debería ir su
 * MRR.
 *
 * LA TRAMPA QUE ESTE EXPEDIENTE NO PISA: marca 99.70% de llamadas sin
 * contestar, y eso NO es una falla de atención. Las 2,625 van íntegras a un
 * destino llamado «Agente Virtual OOAPAS» con cero minutos y `c` = 0 — y `c`
 * NO es «contestadas», es «no perdidas»: ahí dentro irían las que resuelve el
 * menú y las que caen al buzón, y aquí no hay ninguna. `redir` = 0 en los dos
 * destinos de la cuenta, así que ninguna persona tomó ninguna llamada. Es la
 * firma exacta de un destino automatizado, no de un teléfono que nadie toma.
 * El propio repositorio ya lo tenía documentado como falsa alarma, y el 28 de
 * septiembre Dan lo confirmó con el cliente.
 *
 * ── v2.0 · LO QUE LA v1.0 DIJO MAL Y LO QUE MIDE LA FUENTE ─────────────────
 *
 * Una verificación adversarial del 13 oct 2026 midió cada afirmación contra su
 * fuente. Estas son las once que salieron falsas, con lo que dice la fuente.
 * Dos de ellas tumban una tesis del expediente y por eso se narran además
 * DENTRO del cuerpo, no sólo aquí.
 *
 *   1. TESIS TUMBADA · «$38,123 es una cifra sin fuente que no coincide con
 *      ninguna». NO lo es. Es `cuentas.facturacion`, que guarda
 *      `acumulado ÷ meses` —el PROMEDIO DE VIDA— congelado cuando `meses`
 *      valía 15: $571,849 / 15 = $38,123.27, al peso. Y $576,161 − 4 × $1,078
 *      = $571,849, o sea que desde entonces han entrado cuatro cortes de
 *      $1,078. La recomendación de no publicar $38,123 SE SOSTIENE, pero por
 *      el motivo correcto: es un promedio de vida, no una cifra huérfana.
 *      Instrucción de dirección del 13 oct 2026: «lo que debes tomar como
 *      institucional financiero es el MRR de facturación Gross Revenue
 *      Facturación». Por esa regla (lib/facturacion-cuenta.ts) el MRR
 *      institucional de esta cuenta son $1,078 — su `mrrIni`, porque su
 *      `mrrFin` es 0 y su `verificacion` dice `sigue_viva`.
 *
 *   2. TESIS TUMBADA · «Histórico desigual: 9 facturas en 19 meses. No factura
 *      todos los meses». FALSO, y era aritméticamente imposible: una
 *      facturación irregular de $1,078 no suma $576,161. El campo `facturas`
 *      es la columna «Facturas_2026» del export (scripts/gen-grc-zoho.py), o
 *      sea 9 facturas en los NUEVE meses cerrados de 2026: factura TODOS los
 *      meses. `meses` es «Meses Activo» = 19. Lo que queda abierto es otra
 *      cosa y es grande: de los $576,161 acumulados sólo ~$9,702 caben en las
 *      nueve FACTURAS de 2026 a $1,078 —son facturas, no cortes: de los nueve
 *      cortes sólo OCHO están fechados en 2026 y el noveno es del 19 dic
 *      2025—; los ~$566,459 restantes son anteriores e implican un nivel del
 *      orden de $56,000 al mes que se cayó sin que nada en el tablero lo
 *      registre. Eso NO valida los $38,123: es un hueco que
 *      hay que reconciliar con facturación, y va como tarea con dueño.
 *
 *   3. «CERO salientes en toda la ventana (1 ene – 10 sep 2026)». NO.
 *      `llamadas-data.ts` trae `sal: null` para este CID, y el generador
 *      escribe null cuando el export de salientes no trajo NI UNA fila suya
 *      (scripts/gen-llamadas-data.py: `'sal': (… if s['total'] else None)`).
 *      Es ausencia de LECTURA, no un cero, y colapsarla es justo lo que
 *      prohíbe [[feedback-cero-sin-medicion]]. La ventana 1 ene – 10 sep 2026
 *      es la de las ENTRANTES. Tampoco es un hueco del archivo entero: 75 de
 *      las 84 cuentas del corte «0-40» sí tienen salientes.
 *
 *   4. «0, 4, 0, 0, 3 y 0 eventos en los cortes donde se midió» / «único corte
 *      con señal de vida» / «sólo el de abril». NO. Las seis columnas de panel
 *      (COLS_PANEL de lib/cortes-cuenta.ts) vienen medidas con 0 explícito en
 *      los NUEVE cortes. La serie completa es 0, 4, 0, 0, 3, 0, 1, 2, 0 — diez
 *      eventos en tres cortes, no siete en dos. El desglose de la v1.0
 *      publicaba sólo los seis primeros cortes y omitía justo los dos con
 *      actividad.
 *
 *   5. «Nueve cortes consecutivos, de noviembre de 2025 a julio de 2026». NO.
 *      Son el 2025-12-19, 2026-01-19, -02-19, -03-19, -04-19, -05-19, -07-19,
 *      -08-19 y -09-19: falta JUNIO, y el último es de septiembre, dos meses
 *      después de lo que decía el resumen. El propio motor de alertas lo
 *      confirma al revés («5 meses medidos, 2026-04 a 2026-09» = cinco cortes
 *      en seis meses). Y cada corte mide el mes ANTERIOR: lo dice su columna
 *      «Periodo».
 *
 *   6. «1,396 de las 1,492 líneas churn están `sin_verificar`, con
 *      $2,528,125.71 de pérdida». Esas dos cifras salen del respaldo
 *      `grc-zoho.2026-10-13-antes-desmentidos.bak.json`, que está SUPERADO. En
 *      el corte vigente el reparto es 1,023 `sigue_viva`, 463 `sin_verificar`,
 *      5 `na` y 1 `baja`. Y los $2,528,125.71 son la pérdida de las 1,492
 *      completas, no la del subconjunto: la del subconjunto vigente son
 *      $777,686.50.
 *
 *   7. «CERO tickets en 19 meses». Es un cero sin medición. lib/tickets-norm.ts
 *      lo declara: «el export SOLO trae tickets cerrados… así que “abiertos”
 *      no es cero — es NO MEDIBLE». El eje de cierre de la fuente va de feb a
 *      oct 2026, así que del alta (11 feb 2025) a enero de 2026 no hay nada
 *      medido: doce meses.
 *
 *   8. «Marca al número 4431132200» / «renta del número 4431132200». El 443
 *      113 2200 NO existe en data/dids.json (16,534 números, 3,717 CIDs); sólo
 *      aparece en `cuentas.servicios_json`, que es la descripción del COBRO.
 *      El único número que la fuente de DIDs atribuye al CID 167954 es el
 *      524434542005, etiquetado «Morelia».
 *
 *   9. «DOS contactos… más que ninguna otra cuenta auditada». Falso contra las
 *      40 cuentas con auditoría: quince tienen dos o más contactos con los
 *      cuatro campos llenos, y University 4 People (D58) llega a cinco.
 *
 *  10. «`score_adopcion` es 4 sobre 100, el más bajo de las cuentas
 *      auditadas». Las dos mitades fallan. El 4 no se reproduce con la fórmula
 *      de la casa (scripts/deriva-score-adopcion.py: alto 100, medio 50, bajo
 *      0, promediado sobre los productos contratados): sobre sus tres
 *      productos vigentes da 33. Y no es el más bajo: ALTERNET (C10), NERUC
 *      (C9) y Jason de México (D7) traen 2.
 *
 *  11. «MRR real $1,078 — confirmado por el GRC y por los 9 cortes». Los nueve
 *      cortes traen «Monto del plan = 979», sin excepción. El $1,078 sale de
 *      `servicios_json` ($979 + $99) y del `mrrIni` del GRC, nunca del archivo
 *      de cortes.
 *
 * ── v2.1 · LO QUE LA v2.0 DIJO MAL Y LO QUE MIDE LA FUENTE ─────────────────
 *
 * Una segunda verificación adversarial, también del 13 oct 2026, midió la
 * v2.0. Seis afirmaciones más no resistieron su fuente. DOS son errores de
 * ATRIBUCIÓN —un dato leído en el campo equivocado, que es exactamente lo que
 * este expediente le reprocha a la ficha— y por eso se narran además dentro
 * del cuerpo.
 *
 *   A. ATRIBUCIÓN TUMBADA · La cronología firmaba la evaluación de adopción
 *      del 31 ago 2026 como «Atlas (automático)» y el hallazgo de ADOPCIÓN la
 *      llamaba «la evaluación». NO lo es: las CUATRO filas de
 *      `adopcion_producto` traen `asesor: "Dan"`. Es una captura MANUAL, y el
 *      evaluador de la casa no pudo haberla escrito: firma
 *      `Atlas (evaluación automática)` —constante AUTOR en
 *      app/api/adopcion/auto/route.ts— y SIEMPRE adjunta su evidencia en
 *      `notas` (lib/adopcion-auto.ts, regla 3), mientras aquí las dos filas de
 *      Pago Automático traen `notas: null`; con Visibilidad y Control
 *      contratado emite SIEMPRE una fila «Voz CE» = no_aplica que no está; y
 *      nunca habría emitido «Pago Automático», que exige «Pago exitoso» > 0 y
 *      esa columna viene 0 o vacía en los nueve cortes. El expediente
 *      convertía el trabajo de una persona de Callpicker en un veredicto de
 *      máquina, y se contradecía dos renglones más abajo al decir que el
 *      score 4 está puesto a mano con el deslizador.
 *
 *   B. ATRIBUCIÓN TUMBADA, Y ES EL HALLAZGO BUENO · «El 6 oct la alerta abrió
 *      con $38,123; el hallazgo es correcto, la cifra no». El motor NO cometió
 *      ese error: su `evidencia_apertura` dice «y paga $1,078 al mes», con
 *      `mrr_apertura: 1078` y `es_top_apertura: false` — la cifra CORRECTA.
 *      Los $38,123 están en `evidencia_actual`, con `mrr_actual: 38123`,
 *      `es_top_actual: true` y `actualizado_en: 2026-10-13T12:00`. Lo que
 *      rompió la cifra fue el EXPORT DEL 11 DE OCTUBRE: la versión de
 *      data/grc-zoho.json vigente el 6 de octubre —la del export del 2 oct—
 *      traía esta línea como «MRR estable» con `mrrFin` 1,078 y pérdida 0, y
 *      el export del 11 oct la volvió a marcar «Churn confirmado» con `mrrFin`
 *      en 0. Con `mrrFin` en cero `importeDeCuenta` ya no encuentra MRR en el
 *      GRC y cae a `cuentas.facturacion` (lib/facturacion-cuenta.ts), o sea al
 *      promedio de vida; el 13 oct el motor reescribió el episodio con esa
 *      cifra y además lo subió a «TOP». O sea: el marcado de churn de esta
 *      semana le metió un promedio de vida a una alerta que había nacido bien.
 *      La v2.0 le colgaba al motor de alertas un error que no cometió, y con
 *      eso perdía el hallazgo.
 *
 *   C. «Contra las otras dos auditorías del TOP 50 la ventaja es real». NO: la
 *      serie ya son OCHO expedientes y DOS superan a esta cuenta en contactos
 *      completos —PROBEMEDIC (F7) con 4 de 11 e IMPAS (Z63) con 3 de 15—.
 *      Torres Corzo (D1) y ECODELI (C2) no tienen ninguno; Tech People (C1),
 *      Sección Amarilla (F3) y OdontoPrev (C13) tienen uno. Era el mismo
 *      superlativo que el punto 9 ya había retirado, reintroducido con el
 *      universo recortado a tres.
 *
 *   D. «los nueve cortes de 2026». Los cortes son nueve pero sólo OCHO caen en
 *      2026: el primero es del 19 dic 2025, como dice el propio archivo dos
 *      renglones antes. Los nueve que sostienen los ~$9,702 son las nueve
 *      FACTURAS de 2026 —columna «Facturas_2026» contra los nueve meses
 *      cerrados de `meta.mesesCerrados`—. La aritmética no cambia; la unidad
 *      sí, y el archivo las separa en todos los demás sitios.
 *
 *   E. «el puesto 165 de las 172 cuentas vivas que cruzan con el GRC». Cruzan
 *      por CID 171 de las 193 vivas ($1,758,279, medido con
 *      scripts/mide-peso-cartera.py). La 172 es Torres Corzo (D1), que NO
 *      cruza —sus 19 líneas del GRC no traen CID— y entra porque sus $272,436
 *      se suman A MANO: $1,758,279 + $272,436 = $2,030,715. La distinción no
 *      es menor: es la misma de la que depende todo este expediente.
 *
 *   F. «aquí no falta ningún campo» se publicaba sin decir que un campo está
 *      SUCIO: `contacto_nombre` vale «Rodrigo Medina     rmedina@estradata.com»
 *      —el correo pegado DENTRO del nombre, y `contactos_json[0].nombre`
 *      repite el defecto— y el segundo contacto trae `tel: " 7297388969"` y
 *      `cargo: "Full Stack Developer "`. Un expediente que dedica un hallazgo
 *      entero a que las `notas` son de otra empresa no puede callar esto.
 *
 * Cifras contra fuente, todas remedidas el 13 oct 2026:
 *   · llamadas → app/cuentas/llamadas-data.ts, CID 167954 (corte 14 sep 2026)
 *   · cortes   → data/cortes-facturacion.xlsx, 9 cortes del CID, con sus
 *                columnas «Periodo» y COLS_PANEL leídas una por una
 *   · GRC      → data/grc-zoho.json (vigente) contra sus respaldos del 2 y del
 *                13 de octubre, Y contra sus versiones committeadas del 17 sep,
 *                del 2 oct y del 11 oct — que son las que prueban qué cifra
 *                tenía el archivo el día que se abrió la alerta; la regla del
 *                MRR institucional en lib/facturacion-cuenta.ts
 *   · peso en cartera → scripts/mide-peso-cartera.py
 *   · tickets  → lib/tickets-data.json (6,676 filas) y lib/tickets-norm.ts
 *   · DIDs     → data/dids.json
 *   · ficha    → tabla `cuentas` · alertas → alertas_episodios
 *   · adopción → tabla `adopcion_producto`, 4 filas del 31 ago 2026, las
 *                cuatro con `asesor: "Dan"`; el autor del evaluador
 *                automático en app/api/adopcion/auto/route.ts y sus reglas en
 *                lib/adopcion-auto.ts
 */
export const SYSTEM_OOAPAS: AuditoriaCase = {
  id: 'system-ooapas',
  asesor: 'Dan',
  nombre: 'Grupo System OOAPAS (Estradata)',
  sector: 'Tratamiento de agua — organismo operador',
  fecha_periodo: 'Febrero 2025 – Octubre 2026',
  fecha_auditoria: 'Oct 2026',
  tipo_cliente: 'AAA por clasificación · sin operación activa',
  descripcion_contexto: 'Cliente desde feb 2025 · plan «Visibilidad y Control 400 minutos» ($979) más renta de número ($99) = $1,078 de MRR institucional · CERO minutos consumidos en los 9 cortes disponibles · 2,633 entrantes, 2,625 de ellas a un agente virtual · SIN LECTURA de salientes · 0 tickets cerrados en los 9 meses que trae la fuente · la ficha publica $38,123, que es su promedio de vida',
  estado: 'en_riesgo',
  clasificacion: 'CONFIDENCIAL',
  version: '2.1',

  kpis: [
    { label: 'Minutos consumidos',        value: '0 en los 9 cortes',       color: '#ef4444' },
    { label: 'MRR institucional (GRC)',   value: '$1,078 / mes',            color: '#6366f1' },
    { label: 'Lo que publica la ficha',   value: '$38,123 — promedio de vida', color: '#f97316' },
    { label: 'Tickets cerrados',          value: '0 en los 9 meses medidos', color: '#94a3b8' },
  ],

  resumen_ejecutivo: 'Grupo System OOAPAS no está operando, y el cliente ya lo dijo. El 28 de septiembre Dan registró por escrito lo que le contó Ricardo Medina: «la cuenta actualmente no se encuentra en operación, se mantiene únicamente como respaldo de información». Lo que mide el tablero es coherente con esa frase, aunque no todo lo que el tablero parecía decir estaba medido.\n\nNueve cortes de facturación con CERO minutos consumidos sobre un plan de 400, del 19 dic 2025 al 19 sep 2026. NO son consecutivos: falta el del 19 jun 2026, y ese hueco es el que explica que la alerta hable de «5 meses medidos» en un tramo de seis. Cada corte mide el mes anterior —lo dice su columna «Periodo»—, así que los nueve cubren del 19 nov 2025 al 18 sep 2026.\n\nDe salientes NO HAY LECTURA: el archivo trae `sal: null`, que significa que el export no trajo ni una fila de este CID. No es un cero y no se publica como cero. En la mesa de ayuda hay cero tickets CERRADOS en los nueve meses que trae la fuente —el export de Zoho Desk sólo trae cerrados, y su eje va de febrero a octubre de 2026—, así que desde el alta (11 feb 2025) hasta enero de 2026 —doce meses— no hay ninguna medición, y «tickets abiertos» es NO MEDIBLE. Y la interacción con el panel es casi nula pero no inexistente: las seis columnas del panel vienen medidas en los nueve cortes y la serie completa es 0, 4, 0, 0, 3, 0, 1, 2 y 0 — diez eventos repartidos en tres cortes.\n\nMarca 99.70% de llamadas entrantes sin contestar, y hay que decir de entrada que eso NO es una falla de atención. Las 2,625 perdidas van íntegras a un destino llamado «Agente Virtual OOAPAS», con cero minutos y cero llamadas no perdidas en todo el periodo; las otras 8 las resolvió el menú. En los dos destinos `redir` es 0: ninguna persona tomó ninguna llamada. Esa combinación es la firma de un destino automatizado, no la de un teléfono que nadie toma. Publicarlo como mal servicio sería una falsa alarma, y el propio repositorio ya lo tenía anotado como tal.\n\nLo que sí es un hallazgo está en el dinero, y la v1.0 lo contaba mal. Su MRR institucional —el de Gross Revenue Facturación, que es el que mandó dirección el 13 de octubre— son $1,078 al mes: el `mrrIni` del GRC, válido porque su `mrrFin` en cero está desmentido por la verificación `sigue_viva`. Coincide al peso con el contrato: «Visibilidad y Control 400 minutos» ($979) más la renta de un número ($99). La ficha publica $38,123, y esa cifra SÍ tiene fuente: es `cuentas.facturacion`, o sea `acumulado ÷ meses`, el promedio de vida, congelado cuando `meses` valía 15 ($571,849 / 15 = $38,123.27). No es el MRR y no debe publicarse como tal — la recomendación se sostiene, el motivo era otro.\n\nY hay un hallazgo que la v2.0 no vio porque le echó la culpa al sitio equivocado: la alerta de consumo cero NACIÓ BIEN. Cuando se abrió, el 6 de octubre, publicó «y paga $1,078 al mes» —`evidencia_apertura`, `mrr_apertura: 1078`, `es_top_apertura: false`—, porque la versión del GRC vigente ese día traía su línea como «MRR estable» con `mrrFin` 1,078. El export del 11 de octubre la volvió a marcar «Churn confirmado» con `mrrFin` 0, y con `mrrFin` en cero `importeDeCuenta` cae a `cuentas.facturacion`: el 13 de octubre el motor reescribió el episodio con los $38,123 del promedio de vida y lo subió además a «TOP» (`es_top_actual: true`). No fue un error del motor de alertas — fue el marcado de churn de esta semana metiéndole un promedio de vida a una alerta correcta.\n\nY queda un hueco mayor que la cuenta. De los $576,161 acumulados, sólo ~$9,702 caben en las nueve FACTURAS de 2026 a $1,078 —nueve facturas en los nueve meses cerrados; los cortes son otra unidad, y de los nueve sólo ocho están fechados en 2026—. Los ~$566,459 restantes son anteriores e implican un nivel del orden de $56,000 al mes que se cayó sin que nada en el tablero lo registre. Eso no valida los $38,123: es una reconciliación pendiente con facturación, y aquí va con dueño.\n\nCon su MRR institucional esta cuenta es el 0.05% de la cartera viva y el puesto 165 de las 172 cuentas vivas con MRR institucional medible: 171 que cruzan por CID con el GRC ($1,758,279) más Torres Corzo (D1), que NO cruza —sus 19 líneas del GRC no traen CID— y cuyos $272,436 se suman a mano. No pertenece al TOP 50: está ahí por un promedio de vida.',

  resultado_positivo: 'La relación está sana y documentada. Hay DOS contactos capturados con los cuatro campos llenos —nombre, cargo, correo y teléfono—: Rodrigo Medina, Director, y Osvel Chegizay, Full Stack Developer. Dentro de la serie del TOP 50 —OCHO expedientes al 13 oct 2026— dos la superan: PROBEMEDIC (F7) tiene 4 contactos completos de 11 e IMPAS (Z63) 3 de 15; Torres Corzo (D1) y ECODELI (C2) no tienen ninguno, y Tech People (C1), Sección Amarilla (F3) y OdontoPrev (C13) tienen uno. Contra las 40 cuentas con auditoría tampoco es un récord —quince tienen dos o más completos y University 4 People (D58) llega a cinco—, pero aquí no falta ningún campo, que es lo que importa para trabajar la cuenta.\n\nCon una advertencia que hay que escribir, porque la fortaleza se apoya precisamente en la calidad de la captura: dos campos están SUCIOS. `contacto_nombre` vale «Rodrigo Medina     rmedina@estradata.com» —el correo pegado dentro del campo del nombre, y `contactos_json[0].nombre` repite el defecto— y el segundo contacto trae `tel: " 7297388969"` y `cargo: "Full Stack Developer "` con espacios colgando. Aquí el dato no se pierde, porque `contacto_email` trae el correo por separado; en Torres Corzo (D1) y en ECODELI (C2), que traen el mismo defecto, `contacto_email` viene VACÍO y el correo queda invisible para cualquier automatismo. Medido el 13 oct 2026: lo traen CUATRO de los ocho expedientes del TOP 50 y DOCE de las 40 cuentas auditadas, así que no es un descuido de esta cuenta sino un patrón de captura.\n\nEl seguimiento del 28 de septiembre es un buen trabajo de SAC: Dan contactó al titular, obtuvo la explicación real del comportamiento de las llamadas, dejó registrado que Ricardo ya tiene los canales para pedir apoyo si decide reactivar, y recomendó seguimiento preventivo. Eso es exactamente lo que debe hacerse con una cuenta en pausa.\n\nPaga al corriente, con `incidencias_pago` en cero —el campo es un entero sin ventana, así que no se le puede poner «en 19 meses»—, y su `score_pago` es 100 — el único bloque del Health Score que está medido al máximo. La conciliación ya revisó su línea del GRC y la marcó `sigue_viva`: el churn que aparece es del mes vivo, o sea cartera por cobrar, no una baja.',

  hallazgos: [
    'OPERACIÓN — La cuenta NO está en operación, y lo dice el cliente. Observaciones del 28 sep 2026, semana 40: «de acuerdo con lo comentado por Ricardo Medina, se mantiene únicamente como respaldo de información… este comportamiento no representa actualmente una afectación operativa debido a que la cuenta no está en producción».',
    'CONSUMO — CERO minutos consumidos en los 9 cortes disponibles, sobre un plan de 400 minutos. Los nueve —del 2025-12-19 al 2026-09-19— traen «Minutos Consumidos = 0» y «% Consumo = 0». No es una caída: nunca se usó. Y NO son consecutivos: falta el corte del 2026-06-19. Cada corte mide el mes ANTERIOR, lo dice su columna «Periodo», así que los nueve cubren del 19 nov 2025 al 18 sep 2026.',
    'LLAMADAS — 99.70% sin contestar (2,625 de 2,633), pero NO es una falla de atención. Las 2,625 van a un solo destino, «Agente Virtual OOAPAS», con 0 minutos y `c` = 0 — y `c` no es «contestadas» sino «no perdidas»: ahí dentro irían las que resuelve el menú y las que caen al buzón, y aquí no hay ninguna. Las otras 8 cayeron en el cubo «destinos sin ninguna perdida» y las resolvió el menú (`ivr` = 8). En los DOS destinos `redir` es 0, así que ninguna persona tomó ninguna. Esa firma —cero conversación y concentración total— es la de un destino automatizado. Interpretarlo como mal servicio sería una falsa alarma.',
    'LLAMADAS — SIN LECTURA de salientes, que no es lo mismo que cero salientes. `llamadas-data.ts` trae `sal: null` para este CID, y el generador escribe null cuando el export no trajo NI UNA fila suya: la cuenta no tiene ventana de salientes porque no tiene medición. La ventana 1 ene – 10 sep 2026 es la de las ENTRANTES. Tampoco es un hueco del archivo entero —75 de las 84 cuentas del corte «0-40» sí tienen salientes—, así que no se puede afirmar ni que marque ni que no marque: sobre marcación saliente esta cuenta NO ESTÁ MEDIDA, y pedir el tramo es la tarea.',
    'DINERO — El MRR institucional son $1,078 al mes, y lo dicen dos fuentes que coinciden al peso: el contrato en `servicios_json` —«Visibilidad y Control 400 minutos» ($979) más la renta de un número ($99)— y el `mrrIni` del GRC. Se usa `mrrIni` y no `mrrFin` porque el `mrrFin` en cero viene de un «Churn confirmado» que la conciliación ya DESMINTIÓ (`verificacion: sigue_viva`, `verificadoPor: cartera`), que es exactamente la regla de lib/facturacion-cuenta.ts. La ficha publica $38,123 — treinta y cinco veces más—, y esa cifra SÍ tiene fuente: es `cuentas.facturacion`, que guarda `acumulado ÷ meses`, o sea el PROMEDIO DE VIDA, congelado cuando `meses` valía 15 ($571,849 / 15 = $38,123.27). No es MRR y no se mezcla con él.',
    'DINERO — La alerta de consumo cero publica HOY «y paga $38,123 al mes», que es el promedio de vida de la ficha y no lo que paga: paga $1,078. Pero el motor de alertas NO cometió ese error al abrirla, y aquí está el hallazgo: su `evidencia_apertura` del 6 oct 2026 dice «y paga $1,078 al mes», con `mrr_apertura: 1078` y `es_top_apertura: false` — la cifra CORRECTA, porque la versión del GRC vigente ese día traía su línea como «MRR estable» con `mrrFin` 1,078 y pérdida 0. El export del 11 de octubre la volvió a marcar «Churn confirmado» con `mrrFin` 0, y con `mrrFin` en cero `importeDeCuenta` cae a `cuentas.facturacion` (lib/facturacion-cuenta.ts): el 13 oct 2026 a las 12:00 el motor reescribió el episodio —`evidencia_actual`, `mrr_actual: 38123`, `es_top_actual: true`— y con eso la subió a «TOP». Lo que rompió la cifra fue el marcado de churn de esta semana, no el detector. El hallazgo de fondo sigue en pie —no consume— pero la cifra con la que se dimensiona hoy es 35 veces su MRR. La misma alerta dice «los 5 meses medidos (2026-04 a 2026-09)»: son cinco cortes en un tramo de seis meses, y la diferencia es el corte de junio que falta.',
    'DINERO — Con su MRR institucional de $1,078 esta cuenta NO pertenece al TOP 50 por facturación: es el 0.05% del MRR institucional de la cartera viva —$2,030,715 sobre 172 de las 193 cuentas vivas: 171 que cruzan por CID con el GRC ($1,758,279) más Torres Corzo (D1), cuyos $272,436 se suman a mano porque sus líneas no traen CID; medido con scripts/mide-peso-cartera.py— y queda en el puesto 165 de esas 172. Con los $38,123 de la ficha figura en el puesto 7 de las 169 cuentas vivas a las que el tablero le pone cifra, y desplaza a cuentas que sí operan. Es una cuenta PEQUEÑA: cualquier lectura que la trate como grande viene del promedio de vida, no del MRR.',
    'DINERO — El histórico NO es desigual, y aquí hay un hueco sin dueño. `facturas` es la columna «Facturas_2026» del export (scripts/gen-grc-zoho.py): son 9 facturas en los NUEVE meses cerrados de 2026, o sea que factura TODOS los meses; `meses` es «Meses Activo» = 19. Medido, el acumulado crece EXACTAMENTE $1,078 por corte: $575,083 en el respaldo del 2 oct (18 meses, 8 facturas) contra $576,161 en el vigente (19 meses, 9 facturas), y el `rango` que trae el propio GRC —«$1,001 - $3,000»— es coherente con eso. El problema es el total: de los $576,161 acumulados sólo ~$9,702 caben en las nueve FACTURAS de 2026 a $1,078 —son facturas, no cortes: de los nueve cortes sólo ocho están fechados en 2026, porque el primero es del 19 dic 2025—, y los ~$566,459 restantes son anteriores e implican un nivel del orden de $56,000 al mes que se cayó sin que nada en el tablero lo registre. Eso NO valida los $38,123: es una reconciliación pendiente con facturación.',
    'DATOS — Las `notas` de esta cuenta son las de OTRA cuenta: «Grupo automotriz (principalmente red de concesionarias Nissan) con operación multi-ciudad… fundación 1987». Eso es GRUPO TORRES CORZO. Su giro real es tratamiento de agua y su sitio es estradata.com. La nota está mal pegada.',
    'DATOS — El correo del contacto principal vive DENTRO del campo del nombre. `contacto_nombre` vale «Rodrigo Medina     rmedina@estradata.com» y `contactos_json[0].nombre` repite el defecto; el segundo contacto trae `tel: " 7297388969"` y `cargo: "Full Stack Developer "` con espacios colgando. Aquí el dato no se pierde —`contacto_email` trae el correo por separado—, pero es el mismo defecto que la serie ya documentó en Torres Corzo (D1) y ECODELI (C2), donde `contacto_email` viene VACÍO y el correo queda invisible para cualquier automatismo. Medido el 13 oct 2026: lo traen CUATRO de los ocho expedientes del TOP 50 y DOCE de las 40 cuentas auditadas. Es captura, no criterio: se limpia sin preguntarle a nadie.',
    'DATOS — El número 4431132200 no está en el inventario de DIDs. data/dids.json trae 16,534 números de 3,717 CIDs y ninguno es ése; el único que la fuente de DIDs atribuye al CID 167954 es el 524434542005, etiquetado «Morelia». El 4431132200 sólo aparece en `cuentas.servicios_json` («Renta de número 4431132200 — $99.00»), que es la descripción del COBRO, no el inventario. Así que el cobro de $99 está documentado pero el número que la plataforma tiene dado de alta es otro, y ninguna fuente sostiene que las 2,633 entrantes lleguen al 4431132200. Hay que cuadrar las dos cosas antes de decidir si se mantiene la renta.',
    'SERVICIO — CERO tickets CERRADOS en los nueve meses que trae la fuente, sobre 6,676 filas. No son 19 meses: lib/tickets-norm.ts lo declara —«el export SOLO trae tickets cerrados… así que “abiertos” no es cero, es NO MEDIBLE»— y su eje de cierre va de feb a oct 2026 (sus aperturas más antiguas son tres filas de ago, oct y nov de 2025). Desde el alta (11 feb 2025) hasta enero de 2026 —doce meses— no hay ninguna medición. Lo medido es coherente con una cuenta que no opera, pero no autoriza a decir «cero en 19 meses».',
    'ADOPCIÓN — `score_adopcion` es 4 en la ficha, y ese 4 NO es una medición: no se reproduce con la fórmula de la casa (scripts/deriva-score-adopcion.py: alto 100, medio 50, bajo 0, promediado sobre los productos CONTRATADOS). `adopcion_producto` trae CUATRO filas, todas del 31 ago 2026 y todas con `asesor: "Dan"` — Pago Automático «alto» duplicada, Voz VyC «bajo» y Uso del Panel Administrador «bajo»—, y el promedio da 33 sobre los tres productos vigentes, 50 con las cuatro filas, y 0 si se excluye Pago Automático. Que ese producto no esté contratado NO lo dice el flag `tiene_pago_automatico`: los flags `tiene_*` de `cuentas` están en false para las 197 cuentas vivas, nunca se poblaron y no distinguen «no contratado» de «sin capturar» (lib/adopcion-auto.ts). Lo que sí está medido es que la columna «Pago exitoso» de los nueve cortes viene 0 o vacía. Ninguno de los tres caminos da 4: es un valor puesto a mano con el deslizador. Tampoco es el más bajo de las cuentas auditadas: ALTERNET (C10), NERUC (C9) y Jason de México (D7) traen 2. Y esas cuatro filas NO son una evaluación automática: son la captura MANUAL de Dan. El evaluador de la casa firma `Atlas (evaluación automática)` —constante AUTOR en app/api/adopcion/auto/route.ts— y SIEMPRE adjunta su evidencia en `notas`, mientras aquí las dos filas de Pago Automático traen `notas: null`; con Visibilidad y Control contratado emite SIEMPRE una fila «Voz CE» = no_aplica, que no existe; y jamás habría emitido «Pago Automático», que exige «Pago exitoso» > 0. Lo que sí dice la captura de Dan del 31 de agosto, en dos de sus cuatro filas, es Voz VyC BAJO —«todas las llamadas perdidas alrededor del año»— y uso del panel BAJO —«no se muestran indicios de interacción con plataforma callpicker»—; las otras dos filas dicen Pago Automático ALTO.',
    'ESTADO — La cuenta figura `en_riesgo`, no `dormida`. Si de verdad se mantiene sólo como respaldo de información, su estado debería reflejarlo — y esa es una decisión de dirección, no del tablero.',
    'CHURN — El GRC vigente la marca «Churn confirmado» con pérdida de $1,078, pero la conciliación ya la verificó y la dejó como `sigue_viva` (`verificadoPor: cartera`): es el mes vivo, o sea cartera por cobrar, no una baja. La regla de la casa se está aplicando bien aquí. Y la marca VA Y VIENE entre cortes, que es justo lo que describe la regla del mes vivo: el export del 17 sep la traía «Churn confirmado», el del 2 oct la pasó a «MRR estable» con `mrrFin` 1,078 y pérdida 0, y el del 11 oct la volvió a marcar con `mrrFin` en 0. Ese vaivén no es inocuo: es lo que le cambió la cifra a la alerta de consumo cero.',
    'CONTEXTO DE CARTERA — En el corte vigente del GRC hay 1,492 líneas marcadas churn y $2,528,125.71 de pérdida declarada ENTRE LAS 1,492 — no entre un subconjunto. El reparto cierra: 1,023 `sigue_viva` ($1,746,939.21), 463 `sin_verificar` ($777,686.50), 1 `baja` ($3,500) y 5 `na` ($0). Esta cuenta es una de las 90 desmentidas CONTRA LA CARTERA (`verificadoPor: cartera`); las otras 933 se desmintieron solas, porque su acumulado creció entre dos cortes. El trabajo pendiente son las 463 sin verificar, y excede este expediente. Ojo al leer versiones viejas de este informe: el «1,396 sin_verificar / 90 vivas» sale del respaldo `grc-zoho.2026-10-13-antes-desmentidos.bak.json`, que está superado y además no cerraba (1,396 + 90 = 1,486, faltaban las 5 `na` y la `baja`).',
  ],

  cronologia: [
    { fecha: '11 Feb 2025', responsable: 'Callpicker',      evento: 'Alta de la cuenta. Plan «Visibilidad y Control 400 minutos» ($979) más la renta de un número ($99): $1,078 al mes. El cobro nombra el 4431132200, pero el DID que la plataforma tiene dado de alta para este CID es el 524434542005 («Morelia»).', tipo: 'neutral' },
    { fecha: '19 Dic 2025', responsable: 'Facturación',     evento: 'Primer corte disponible, y mide el mes anterior: su «Periodo» es 19 nov – 18 dic 2025. Minutos consumidos: 0 de 400. Interacciones con el panel: 0.', tipo: 'problema' },
    { fecha: '19 Ene 2026', responsable: 'Cliente',         evento: 'El corte con MÁS actividad de panel de los nueve —no el único—: 4 interacciones (2 de configuración, 1 reporte, 1 historial de llamadas). Minutos consumidos: 0.', tipo: 'neutral' },
    { fecha: 'Feb–Sep 2026', responsable: 'Facturación',    evento: 'Siete cortes más, todos con 0 minutos consumidos, y FALTA el de junio: no hay corte del 19 jun 2026 en el archivo. Tres de los siete registran panel —abril 3 (1 reporte, 2 historial de llamadas), julio 1 y agosto 2 (historial las dos veces)— y los otros cuatro, ninguna.', tipo: 'problema' },
    { fecha: '31 Ago 2026', responsable: 'Dan',             evento: 'CAPTURA MANUAL de adopción, CUATRO filas: Voz VyC BAJO —«todas las llamadas perdidas alrededor del año»—, panel BAJO —«no se muestran indicios de interacción»— y Pago Automático ALTO, repetida. Las cuatro traen `asesor: "Dan"`, así que NO es una evaluación automática: el evaluador de la casa firma `Atlas (evaluación automática)`, SIEMPRE adjunta `notas` —y las dos filas de Pago Automático traen `notas: null`—, habría emitido además una fila «Voz CE» = no_aplica que no está, y no habría emitido Pago Automático, porque «Pago exitoso» viene 0 o vacía en los nueve cortes. Lo del panel lo contradicen los dos cortes anteriores a esa fecha: el del 19 jul registra 1 visita al historial de llamadas y el del 19 ago registra 2.', tipo: 'problema' },
    { fecha: '10 Sep 2026', responsable: 'Operación',       evento: 'Última llamada registrada en el archivo. A partir de aquí no hay más tráfico medido.', tipo: 'neutral' },
    { fecha: '28 Sep 2026', responsable: 'Dan',             evento: 'CONTACTO CON EL TITULAR. Ricardo Medina confirma que la cuenta no está en operación y que se mantiene como respaldo de información. Dan deja registrado que Ricardo tiene los canales para pedir apoyo si decide reactivarla, y recomienda seguimiento preventivo.', tipo: 'pivote' },
    { fecha: '02 Oct 2026', responsable: 'Facturación',     evento: 'Entra un export del GRC que NO la marca churn: su línea pasa a «MRR estable», con `mrrIni` y `mrrFin` en 1,078 y pérdida 0 —el export del 17 sep sí la traía como «Churn confirmado»—. Es la versión del archivo que estará vigente el 6 de octubre, y la razón de que la alerta nazca con la cifra correcta.', tipo: 'neutral' },
    { fecha: '06 Oct 2026', responsable: 'Motor de alertas', evento: 'Se abre `consumo_cero` en severidad CRÍTICA, y se abre BIEN: su `evidencia_apertura` dice «cero minutos consumidos en los 5 meses medidos (2026-04 a 2026-09), y paga $1,078 al mes», con `mrr_apertura: 1078` y `es_top_apertura: false`. La cifra era la CORRECTA. Los «5 meses» son cinco cortes en un tramo de seis, porque falta el de junio.', tipo: 'problema' },
    { fecha: '11 Oct 2026', responsable: 'Facturación',     evento: 'Entra el export del 11 oct y vuelve a marcar la línea «Churn confirmado» con `mrrFin` 0. Con `mrrFin` en cero `importeDeCuenta` deja de encontrar MRR en el GRC y cae a `cuentas.facturacion`, que guarda el promedio de vida. Nadie tocó la alerta: le cambiaron la fuente por debajo.', tipo: 'problema' },
    { fecha: '13 Oct 2026', responsable: 'Motor de alertas', evento: 'El motor reescribe el episodio con el importe vigente y hereda el promedio de vida: `evidencia_actual` pasa a «…y paga $38,123 al mes», con `mrr_actual: 38123`, `es_top_actual: true` y `actualizado_en: 2026-10-13T12:00`. La conciliación desmiente el churn el mismo día (`verificacion: sigue_viva`, `verificadoPor: cartera`), pero la alerta ya había heredado la cifra: por eso hoy publica $38,123 una alerta que nació publicando $1,078.', tipo: 'problema' },
  ],

  perfil_campos: [
    { label: 'Razón social / grupo', value: 'Grupo System OOAPAS — opera bajo Estradata' },
    { label: 'Giro',                 value: 'Tratamiento de agua — organismo operador' },
    { label: 'Sitio',                value: 'estradata.com' },
    { label: 'Domicilio fiscal',     value: 'Santa Cruz del Valle Int. 2, C.P. 45615, Tlaquepaque, Jalisco' },
    { label: 'Tamaño',               value: 'Mediana — 51 a 150 empleados · 9 oficinas' },
    { label: 'Contacto principal',   value: 'Rodrigo Medina — Director · rmedina@estradata.com · 33 2123 9755. Los cuatro campos están llenos, pero uno está SUCIO: `contacto_nombre` guarda «Rodrigo Medina     rmedina@estradata.com», con el correo dentro del nombre' },
    { label: 'Contacto técnico',     value: 'Osvel Chegizay — Full Stack Developer · odoubleg02@gmail.com · 7297388969. En la fuente, con espacios colgando: `tel: " 7297388969"` y `cargo: "Full Stack Developer "`' },
    { label: 'Quien dio la respuesta', value: 'Ricardo Medina, titular de la cuenta (28 sep 2026)' },
    { label: 'Cliente desde',        value: '11 de febrero de 2025 — 20 meses corridos al corte; el GRC cuenta 19 en «Meses Activo» y es ese el que usan sus cifras' },
    { label: 'Servicio contratado',  value: 'Visibilidad y Control 400 minutos ($979) + renta de número ($99). El cobro nombra el 4431132200; el DID de alta es el 524434542005' },
    { label: 'MRR institucional',    value: '$1,078 al mes — `mrrIni` del GRC, con su `mrrFin` en 0 desmentido por `verificacion: sigue_viva`. Los 9 cortes NO lo confirman: los nueve traen «Monto del plan = 979»; el $1,078 sale de `servicios_json` ($979 + $99) y del GRC' },
    { label: 'MRR en la ficha',      value: '$38,123 — NO es MRR: es `acumulado ÷ meses` (promedio de vida) congelado cuando `meses` valía 15 · $571,849 / 15 = $38,123.27' },
    { label: 'Histórico',            value: '$576,161 acumulados en 19 «Meses Activo» · 9 facturas en los 9 meses cerrados de 2026, o sea TODOS · pero sólo ~$9,702 de ese acumulado caben a $1,078: faltan ~$566,459 por reconciliar' },
    { label: 'Salud de pago',        value: 'Al corriente · `incidencias_pago` = 0, un entero sin ventana: la columna no dice sobre cuánto tiempo cuenta · score_pago 100' },
    { label: 'Health Score',         value: '47 · pago 100 · actividad 69 · relacional 11 · adopción 4. La aritmética cuadra (0.35×69 + 0.30×4 + 0.20×100 + 0.15×11 = 47.0), pero el 4 está puesto a mano: la fórmula de la casa da 33 sobre sus tres productos vigentes' },
  ],

  necesidad_negocio: 'Grupo System OOAPAS contrató Visibilidad y Control con 400 minutos y un número rentado, presumiblemente para atender a los usuarios de un organismo operador de agua. Es un plan pequeño y acotado.\n\nLo que ocurrió es que esa operación no se puso en marcha, o se detuvo. El cliente lo describe hoy como un respaldo de información: la cuenta existe, el número está rentado, el agente virtual contesta — y nadie del lado del cliente la usa para hablar con nadie.\n\nPor eso su necesidad de negocio actual no es de producto sino de decisión. Hay dos caminos y los dos son legítimos: reactivar la operación, para lo cual Callpicker ya dejó los canales abiertos con Ricardo Medina; o reconocer formalmente que está en pausa y moverla al estado que le corresponde, liberando la atención del equipo. Lo que no tiene sentido es seguir tratándola como una cuenta de $38,123 al mes que está fallando en atención telefónica, porque ninguna de las dos cosas es cierta.',

  potencial_corto: [
    'Corregir el renglón del importe: $1,078 de MRR institucional contra los $38,123 de promedio de vida que publica la ficha. Es media hora de trabajo y reordena el TOP 50.',
    'Corregir las `notas`, que hoy describen a un grupo automotriz de concesionarias Nissan: son las de GRUPO TORRES CORZO.',
    'Llevar a dirección la decisión de estado: si es un respaldo de información, `en_riesgo` no la describe.',
    'Cobrar el mes vivo: el GRC marca $1,078 de pérdida que la conciliación dejó como `sigue_viva`.',
  ],

  potencial_largo: [
    'Si reactiva: el plan de 400 minutos es el piso de la escalera de producto, y la cuenta tiene nueve oficinas.',
    'Hay un contacto técnico capturado (Full Stack Developer): si vuelve a operar, es el interlocutor para una integración.',
    'El agente virtual ya está configurado y recibiendo tráfico: la infraestructura para reactivar está puesta.',
  ],

  tacticas: [
    { nombre: 'No llamar a vender', descripcion: 'El cliente ya explicó su situación hace dos semanas y Callpicker quedó en seguimiento preventivo. Volver con una propuesta ahora contradice lo acordado.', impacto: 'Conserva la credibilidad del acuerdo del 28 de septiembre.' },
    { nombre: 'Arreglar lo nuestro primero', descripcion: 'Un promedio de vida publicado como MRR —35 veces el importe real— y una nota que describe a otra empresa son errores de Callpicker, no del cliente. Se corrigen sin llamar a nadie.', impacto: 'Devuelve la cuenta a su tamaño real y libera un lugar del TOP 50.' },
    { nombre: 'Poner fecha al seguimiento preventivo', descripcion: 'Dan recomendó «validar cualquier cambio en el uso o necesidad de reactivación». Sin una fecha concreta eso no ocurre.', impacto: 'Convierte una recomendación en una actividad con dueño.' },
  ],

  senal_alarma: 'Una cuenta que no consume un solo minuto desde que hay registro, que el cliente describe como respaldo de información, y que el tablero valora en $38,123 al mes —su promedio de vida, no su MRR— y coloca en el puesto 7 de las 169 cuentas vivas con cifra. Con su MRR institucional es el puesto 165 de 172. El riesgo no es perderla: es el tiempo del equipo que se desvía hacia ella.',

  problema_raiz: 'No hay un problema de servicio. Hay una cuenta en pausa que el tablero mide como si fuera treinta y cinco veces más grande de lo que es.',

  problema_raiz_detalle: 'Los tres indicadores que harían saltar esta cuenta —99.70% de llamadas sin contestar, consumo cero y churn en el GRC— describen la misma realidad: una cuenta que no está operando. Ninguno de los tres es un fallo de Callpicker ni un problema que resolver con el cliente.\n\nEl 99.70% tiene explicación estructural: las 2,625 llamadas van a un destino automatizado con cero minutos, que es exactamente la firma que el módulo de llamadas define como «destino por confirmar» y no como mala atención. El consumo cero es coherente con una cuenta fuera de producción. Y el churn del GRC está verificado como `sigue_viva`, o sea cartera por cobrar del mes vivo.\n\nLo que sí es un problema está del lado de Callpicker, y es de datos. Los $38,123 que publica la ficha no son una cifra sin fuente —la v1.0 de este expediente lo decía y era falso—: son `cuentas.facturacion`, o sea `acumulado ÷ meses`, el promedio de vida, congelado cuando `meses` valía 15 ($571,849 / 15 = $38,123.27). El error no es que la cifra no exista: es que se publica en el renglón del MRR, y el MRR institucional son $1,078. Eso coloca a la cuenta en el puesto 7 de las 169 a las que el tablero le pone cifra y la mete en el TOP 50, cuando con su MRR es el puesto 165 de 172 y el 0.05% de la cartera viva. Debajo queda un hueco mayor y sin dueño: de los $576,161 acumulados sólo ~$9,702 caben en las nueve FACTURAS de 2026 a $1,078 —de los nueve cortes, ocho—, y los ~$566,459 restantes apuntan a un nivel del orden de $56,000 al mes que se cayó sin que nada en el tablero lo registre. Y las notas de la ficha describen un grupo automotriz de concesionarias Nissan fundado en 1987 — texto que pertenece a GRUPO TORRES CORZO y que alguien pegó aquí.\n\nUn expediente honesto sobre esta cuenta es necesariamente corto, porque no hay una operación que auditar. Lo útil que puede hacer es decir con precisión lo que no pasa, para que el equipo deje de buscar ahí.',

  flujo_real: [
    { fase: 'Entra la llamada',   area: 'Usuario final',          accion: 'Marca a un número de la cuenta. Qué número, no lo dice ninguna fuente: el 4431132200 sólo está en la descripción del cobro y el DID de alta es el 524434542005', resultado: '2,633 entrantes en los nueve meses con tráfico (ene–sep 2026); de ellas 2,625 sin contestar, desde 1,237 números distintos' },
    { fase: 'Contesta el agente', area: 'Agente Virtual OOAPAS',  accion: 'El destino automatizado recibe la llamada', resultado: '2,625 registradas como no contestadas · 0 minutos de conversación' },
    { fase: 'Nadie toma',         area: '— (no hay operación)',   accion: 'No hay extensión humana detrás', resultado: 'El cliente confirma que la cuenta no está en producción' },
    { fase: 'Factura el plan',    area: 'Facturación',            accion: 'Se cobra «Visibilidad y Control 400 minutos»', resultado: '9 cortes con 400 minutos incluidos y 0 consumidos' },
    { fase: 'El tablero mide',    area: 'Callpicker',             accion: 'Lee `cuentas.facturacion`, que guarda `acumulado ÷ meses` — el promedio de vida, no el MRR', resultado: 'La dimensiona en $38,123 y la coloca en el puesto 7 de las 169 con cifra. Con su MRR institucional ($1,078) es el puesto 165 de 172' },
  ],

  comparativo: [
    { metrica: 'Minutos consumidos por corte', real: '0 de 400, en los 9 cortes', ideal: 'Un plan que se usa' },
    { metrica: 'Llamadas salientes',           real: 'SIN LECTURA · `sal: null`',  ideal: 'Una lectura de salientes para este CID' },
    { metrica: 'Interacciones con el panel',   real: '0, 4, 0, 0, 3, 0, 1, 2, 0 — los nueve cortes', ideal: 'Uso regular' },
    { metrica: 'MRR según la ficha',           real: '$38,123 — promedio de vida',  ideal: '$1,078 — contrato y `mrrIni` del GRC' },
    { metrica: 'Puesto en la cartera',         real: '7 de las 169 con cifra',      ideal: '165 de 172, con el MRR institucional' },
    { metrica: 'Score de adopción',            real: '4 en la ficha, puesto a mano', ideal: '33 — lo que da la fórmula sobre sus 3 productos' },
    { metrica: 'Tickets cerrados',             real: '0 en los 9 meses medidos',    ideal: 'Coherente con no operar; los doce meses anteriores a feb 2026 no están medidos' },
    { metrica: 'Exactitud de las notas',       real: 'Describen a otra empresa',   ideal: 'Las suyas' },
  ],

  plan_inmediato: [
    { accion: 'Dejar de publicar los $38,123 como MRR: el institucional son $1,078 (contrato y `mrrIni` del GRC). Los $38,123 son `acumulado ÷ meses`, el promedio de vida', responsable: 'Dirección / Facturación', criterio: 'La ficha, el GRC y `servicios_json` dicen la misma cifra, la cuenta sale del TOP 50 y la alerta de consumo cero vuelve a decir $1,078, como el 6 de octubre' },
    { accion: 'Reconciliar el acumulado del GRC: $576,161 en 19 meses contra $1,078 al mes deja ~$566,459 sin explicación, del orden de $56,000 al mes que se cayó sin registro en el tablero', responsable: 'Facturación → Dirección', criterio: 'Escrito de dónde salió ese acumulado, o corregido el dato en el export. Mientras no cierre, el expediente lo declara abierto y NO lo usa para dimensionar la cuenta' },
    { accion: 'Borrar de `notas` el texto de GRUPO TORRES CORZO y escribir el de esta cuenta', responsable: 'Dan', criterio: 'La nota describe tratamiento de agua, no concesionarias Nissan' },
    { accion: 'Llevar a dirección la decisión de estado: si es respaldo de información, no es `en_riesgo`', responsable: 'Dan → Dirección', criterio: 'Dirección resuelve. NINGUNA baja ni cambio de estado sin su autorización.' },
    { accion: 'Poner fecha al seguimiento preventivo que Dan recomendó el 28 de septiembre', responsable: 'Dan', criterio: 'Actividad agendada con fecha concreta de revalidación' },
  ],

  plan_mediano: [
    { accion: 'Cobrar el mes vivo: $1,078 marcados como pérdida en el GRC y verificados `sigue_viva`', responsable: 'Administración', criterio: 'La línea deja de aparecer como churn en el siguiente corte' },
    { accion: 'Documentar el destino «Agente Virtual OOAPAS» en la ficha, para que ningún análisis futuro lo lea como falla de atención', responsable: 'Dan', criterio: 'Queda escrito en observaciones, con la cifra y la explicación' },
    { accion: 'Cuadrar el número rentado antes de preguntarle al cliente: el cobro nombra el 4431132200 y el inventario de DIDs sólo tiene el 524434542005 («Morelia») para este CID', responsable: 'Dan + Facturación', criterio: 'Un solo número, el mismo en el cobro y en la plataforma. Con eso resuelto se le pregunta al cliente si lo mantiene' },
  ],

  plan_estrategico: [
    { accion: 'Definir un criterio de cartera para cuentas en pausa: qué estado les corresponde y con qué cadencia se revisan', responsable: 'Dirección', criterio: 'Criterio escrito y aplicado a todas las que estén en la misma situación' },
    { accion: 'Si el cliente reactiva, entrar con la escalera de producto desde el plan de 400 minutos', responsable: 'Dan', criterio: 'Propuesta lista para el día que Ricardo Medina avise' },
  ],

  areas_oportunidad: [
    { area: 'Corrección del importe',        impacto: '$37,045 de diferencia entre el promedio de vida y el MRR, que distorsionan el ranking de cartera', responsable: 'Facturación' },
    { area: 'Reconciliación del acumulado',  impacto: '~$566,459 del acumulado del GRC sin explicación',               responsable: 'Facturación' },
    { area: 'Corrección de las notas',       impacto: 'La ficha describe a otra empresa',                              responsable: 'Dan' },
    { area: 'Decisión de estado',            impacto: 'Un lugar del TOP 50 ocupado por una cuenta que no opera',       responsable: 'Dirección' },
    { area: 'Cobro del mes vivo',            impacto: '$1,078',                                                        responsable: 'Administración' },
    { area: 'Reactivación, si ocurre',       impacto: 'Nueve oficinas y un contacto técnico ya capturado',             responsable: 'Dan' },
  ],

  perfiles: [
    {
      nombre: 'Rodrigo / Ricardo Medina', rol: 'Director y titular de la cuenta — Grupo System OOAPAS', color: '#6366f1',
      campos: [
        { label: 'Correo',    value: 'rmedina@estradata.com' },
        { label: 'Teléfono',  value: '33 2123 9755' },
        { label: 'Dijo',      value: '28 sep 2026 — la cuenta no está en operación, se mantiene como respaldo de información' },
        { label: 'Estado',    value: 'Tiene los canales de Callpicker por WhatsApp y correo para pedir apoyo si decide reactivar' },
        { label: 'Ojo',       value: 'La ficha lo registra como «Rodrigo» y las observaciones de Dan como «Ricardo». Conviene confirmar cuál es.' },
      ],
    },
    {
      nombre: 'Osvel Chegizay', rol: 'Full Stack Developer — Grupo System OOAPAS', color: '#22c55e',
      campos: [
        { label: 'Correo',   value: 'odoubleg02@gmail.com' },
        { label: 'Teléfono', value: '7297388969' },
        { label: 'Valor',    value: 'Contacto técnico capturado. Es el interlocutor para una integración el día que la cuenta vuelva a operar.' },
      ],
    },
    {
      nombre: 'Dan', rol: 'Asesor SAC de la cuenta — Callpicker', color: '#f59e0b',
      campos: [
        { label: 'Trabajo',   value: '28 sep 2026 — contactó al titular, obtuvo la explicación real y la dejó por escrito' },
        { label: 'Resultado', value: 'La única actividad registrada de la cuenta, y está COMPLETADA' },
        { label: 'Pendiente', value: 'El seguimiento preventivo que recomendó no tiene fecha' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      'DOS contactos capturados con los cuatro campos llenos: nombre, cargo, correo y teléfono. No es un récord —quince de las 40 cuentas auditadas tienen dos o más así, y dentro de la serie del TOP 50 la superan PROBEMEDIC (4 de 11) e IMPAS (3 de 15)— pero aquí no falta ninguno. Con una salvedad: uno de esos campos viene sucio, con el correo pegado dentro del nombre',
      'Pago al corriente, cero incidencias de pago registradas, score_pago 100',
      'El asesor contactó al titular y documentó la situación real por escrito',
      'La infraestructura está puesta: el número rentado y el agente virtual recibiendo tráfico',
    ],
    oportunidades: [
      'Si reactiva, el plan de 400 minutos es el piso de la escalera de producto',
      'Nueve oficinas y un contacto técnico ya identificado',
      'Corregir el importe libera un lugar del TOP 50 para una cuenta que sí opera',
    ],
    debilidades: [
      'Cero minutos consumidos en los 9 cortes disponibles, y falta el corte de junio de 2026',
      'Cero tickets cerrados en los nueve meses que trae la fuente, y sin lectura de salientes: dos cosas que NO están medidas y no se pueden publicar como ceros',
      'La ficha publica $38,123 en el renglón del MRR, y son `acumulado ÷ meses` — promedio de vida, no MRR. El institucional son $1,078',
      'Su `score_adopcion` de 4 está puesto a mano: la fórmula de la casa da 33 sobre sus tres productos',
      'Las notas de la ficha describen a otra empresa',
      'El correo del contacto principal está pegado dentro del campo del nombre, y el segundo contacto trae espacios colgando en `tel` y en `cargo`',
      'El estado `en_riesgo` no describe lo que el cliente dice que es',
    ],
    amenazas: [
      'El tiempo del equipo desviado hacia una cuenta que no opera, por un importe 35 veces inflado',
      'Que el 99.70% se lea como falla de atención y genere una conversación que dañe la relación',
      'Que el mes vivo sin cobrar se consolide en churn real por falta de gestión',
    ],
  },

  conclusion: 'Esta auditoría es corta porque no hay una operación que auditar, y decirlo con precisión vale más que estirarla. Y es además más corta en afirmaciones: once de las que sostenían la v1.0 no resistieron su fuente —dos de ellas eran tesis— y la v2.1 retiró seis más de la v2.0, DOS de ellas errores de ATRIBUCIÓN, que es la misma clase de defecto que este expediente le reprocha a la ficha: un dato leído en el campo equivocado. La captura de adopción del 31 de agosto es de Dan y no de una máquina, y la alerta de consumo cero nació con la cifra correcta.\n\nGrupo System OOAPAS no está en producción. Lo dice el cliente y lo dicen los nueve cortes con cero minutos sobre un plan de 400. Lo que NO se puede decir, y la v1.0 decía, es que no marque hacia fuera ni que no haya tenido tickets en 19 meses: de salientes no hay lectura y la mesa de ayuda sólo trae nueve meses de cierres. Sus tres indicadores alarmantes —99.70% sin contestar, consumo cero y churn en el GRC— describen todos la misma realidad y ninguno es un fallo de servicio: el primero es un agente virtual con `redir` en cero, el segundo es coherente con no operar y el tercero ya está verificado como mes por cobrar.\n\nLo que sí hay que arreglar es de casa, y son tres cosas. Que la ficha publique su promedio de vida ($38,123) en el renglón del MRR ($1,078), que es lo que la mete en el TOP 50 cuando su peso real es el 0.05% de la cartera viva. Que sus notas describan a un grupo de concesionarias Nissan. Y un acumulado de $576,161 del que sólo ~$9,702 caben en lo que factura hoy: ese hueco de ~$566,459 no lo explica nadie todavía, y queda abierto con dueño. Las tres se trabajan sin llamar al cliente. Y hay una cuarta que es consecuencia de la primera: mientras `importeDeCuenta` conserve `cuentas.facturacion` como respaldo, cada vez que el GRC marque churn esta cuenta volverá a publicar su promedio de vida — ya le pasó a su alerta de consumo cero, que nació diciendo $1,078 el 6 de octubre y hoy dice $38,123.',

  pierde: [
    'Si se consolida el mes vivo sin cobrar, Callpicker pierde $1,078 — no los $38,123 que publica la ficha, que son su promedio de vida.',
    'Se pierde tiempo del equipo mientras la cuenta figure en el puesto 7 de las 169 cuentas vivas con cifra, cuando por MRR es el 165 de 172.',
    'Se pierde credibilidad si se le llama al cliente a hablar de un 99.70% que ya explicó hace dos semanas.',
  ],

  gana: [
    'Corregir el importe devuelve un lugar del TOP 50 a una cuenta que sí opera.',
    'Un criterio escrito para cuentas en pausa sirve para todas las que estén igual, no sólo para ésta.',
    'Si Ricardo Medina reactiva, la relación está intacta y los canales abiertos.',
  ],

  recomendacion_central: 'No llamar al cliente. Se le contactó el 28 de septiembre, explicó su situación y se acordó seguimiento preventivo: volver ahora con una propuesta contradice lo acordado y gasta el único crédito que hará falta el día que decida reactivar.\n\nLo que hay que hacer es de puertas adentro y son cuatro cosas. Dejar de publicar los $38,123 como MRR —son `acumulado ÷ meses`, el promedio de vida; el institucional son $1,078 según el contrato y el `mrrIni` del GRC—, lo que saca a la cuenta del TOP 50. Reconciliar con facturación los ~$566,459 del acumulado que no caben en lo que factura hoy. Borrar de sus notas el texto de GRUPO TORRES CORZO. Y llevar a dirección la pregunta de qué estado le corresponde a una cuenta que el cliente describe como respaldo de información, porque `en_riesgo` no lo describe y el cambio de estado no lo decide el tablero.',
}
