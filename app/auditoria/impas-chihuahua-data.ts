import type { AuditoriaCase } from './types'

/**
 * IMPAS · Instituto Municipal de Prevención y Atención a la Salud
 * (Z63 · CID 177810) — la cuenta que el tablero tenía en CERO.
 *
 * Auditoría del 13 oct 2026. Se escribe porque al reordenar el TOP 50 por el
 * importe BUENO apareció de la nada: su ficha dice $0 y su MRR real son
 * $65,640 al mes. Estaba hundida al fondo de todas las listas —de los
 * rankings, del TOP 25, de cualquier priorización por dinero— por un cero que
 * no era una medición sino una ausencia de captura.
 *
 * DOS FUENTES, Y LAS DOS HACÍAN FALTA
 * -----------------------------------
 * Lo interno: ficha, llamadas, tickets, GRC y alertas.
 * Lo externo: la ficha institucional que dirección compiló el 13 oct 2026 del
 * sitio del Municipio de Chihuahua —directorio de 14 funcionarios con nombre,
 * cargo, correo y extensión; ocho ubicaciones; los servicios del organismo—.
 *
 * Sin lo externo, esta auditoría habría repetido lo que ya decía la ficha: que
 * no se sabe quién es el cliente. Con lo externo, el hallazgo se da la vuelta:
 * **el contacto que el asesor no encontraba lleva meses publicado en un sitio
 * .gob.mx**, con correo institucional y extensión.
 *
 * v1.1 — LA INVESTIGACIÓN YA ESTÁ EN LA FICHA, NO SÓLO AQUÍ
 * ----------------------------------------------------------
 * La v1.0 cometió un error de alcance: escribió el expediente y dejó la ficha
 * de la cuenta igual que estaba, con el director equivocado, el teléfono en
 * ceros y la facturación en $0. **Una auditoría que vive sólo en su módulo no
 * le sirve al asesor que abre la cuenta** — el dato tiene que estar donde se
 * trabaja. Lo señaló dirección.
 *
 * El 13 oct 2026 se escribió en `cuentas` (Z63) con
 * `scripts/enriquece-impas.py`, que corre en simulacro por omisión y comprueba
 * leyendo de vuelta: importe $0 → $65,640 · director corregido · los 14
 * funcionarios del directorio público capturados como contactos · 8
 * ubicaciones · giro precisado · notas reescritas con el contexto del
 * organismo · y un addendum fechado en las observaciones del KAM que NO borra
 * lo que el asesor escribió, sino que desmiente sus tres afirmaciones caducas
 * al lado.
 *
 * Lo que NO se escribió, a propósito: `total_empleados` y `tamano_empresa`
 * siguen vacíos porque el personal no está validado públicamente, y los
 * correos de los 12 funcionarios sin correo publicado no se construyeron por
 * patrón aunque el patrón se vea.
 *
 * LAS CIFRAS, VERIFICADAS UNA POR UNA
 * -----------------------------------
 *   · importe   → GRC por CID: $65,640 «MRR estable», y CUADRA AL CENTAVO con
 *                 los servicios contratados ($63,450 Marcación Corta + $2,190
 *                 Extensión CE). 10 facturas en 10 meses.
 *   · llamadas  → app/cuentas/llamadas-data.ts, CID 177810. 352 entrantes,
 *                 TODAS al IVR, cero a una persona, cero minutos EN LAS
 *                 ENTRANTES. `sal` viene **null**: de las salientes de esta
 *                 cuenta NO hay lectura, y una ausencia no es un cero.
 *   · DIDs      → data/dids.json: CERO números para el CID 177810, de 16,534
 *                 números en 3,717 CIDs. Es una de sólo 9 cuentas sin DID
 *                 entre las 193 vivas. En eso la ficha tenía razón.
 *   · tickets   → lib/tickets-data.json, 1 fila: folio 116939, categoría
 *                 «Administrativo (voz)», SUBcategoría «Facturación y Pagos
 *                 (voz)». 611 de los 1,649 CIDs de la fuente traen UNO.
 *   · alertas   → alertas_episodios, 2 abiertas y se nombran las DOS:
 *                 `sin_consumo_medible` (crítica, 6 oct) y `silencio_30`
 *                 (media, 12 oct). La v1.1 sólo nombraba la primera y
 *                 afirmaba que no existía indicador anticipatorio.
 *   · radar     → radar_respuestas, 1 fila con las 12 preguntas
 *                 contestadas. UNA FILA NO ES UNA RESPUESTA.
 *   · el cliente → impas.mpiochih.gob.mx y el directorio municipal
 *
 * v1.2 — CUATRO TESIS DE LA v1.1 ERAN FALSAS
 * -------------------------------------------
 * Una verificación adversarial del 13 oct midió este expediente contra su
 * fuente y tiró diez afirmaciones: las cuatro tesis que siguen y los seis
 * menores de la v1.3. La v1.2 escribía «58 afirmaciones medidas y once
 * tiradas» y ninguna de las dos cifras se puede ir a comprobar —ver el punto 7
 * de la v1.4—. Cuatro no eran matices:
 *
 *   1. «EL TABLERO LA PINTA VERDE» — NO. `cerrado` viene null, así que
 *      `pctCerrado` es null y el KPI imprime «—», no «0%». El veredicto
 *      del módulo es `en_silencio` —236 días entre la última llamada y el
 *      corte— en ROJO, con la portada diciendo «es una cuenta que se está
 *      apagando», y es la #1 de la cola de riesgo de Dan. Encima
 *      `/seguimiento` ya grita «Solo 0% de llamadas atendidas». La v1.1
 *      construyó cinco secciones sobre una luz verde que no existe.
 *
 *   2. «NUNCA ENTRÓ A UN TOP 25» — NO. Entró el 6 oct 2026, una semana
 *      ANTES de esta auditoría, porque `topDeCartera` ordena por
 *      `importeDeCuenta`, que lee el GRC por CID ANTES que la ficha: el $0
 *      nunca llegó a esa lista. Lo dice con nombre el comentario de
 *      `lib/alertas-detectar.ts`. El daño del cero es REAL pero más
 *      estrecho: pega donde se lee `cuentas.facturacion` en crudo.
 *
 *   3. «1 DE 12 DEL RADAR» — NO. Está COMPLETO: 12 de 12, contestado el
 *      11 sep 2026, score_atlas 73. La v1.1 confundió UNA FILA con UNA
 *      RESPUESTA. Y lo que esa fila contesta es más grave que el hueco.
 *
 *   4. «EL ASESOR LEYÓ AL REVÉS» — NO. Lo registró bien dos veces: el 7
 *      sep («aparecen como perdidos O PERMANECEN EN MENÚ») y en el propio
 *      Radar del 11 sep («todas… en estancia en menú»).
 *
 * v1.3 — LOS SEIS MENORES, Y DOS DE ELLOS NO ERAN MENORES
 * -------------------------------------------------------
 * La misma verificación adversarial del 13 oct dejó seis hallazgos de segundo
 * orden. Se corrigen los seis, y dos cambian lo que el expediente AFIRMA:
 *
 *   1. «NO TIENE NÚMERO NI EXTENSIONES» NO ESTABA DESMENTIDO. La v1.2
 *      publicó como refutada una afirmación de la ficha que su propia fuente
 *      RESPALDA: `data/dids.json` no registra ni un número para el CID
 *      177810 —0 de 16,534 números repartidos en 3,717 CIDs—, y ésta es una
 *      de sólo 9 cuentas sin DID entre las 193 vivas, frente a 184 que sí lo
 *      tienen. Lo mismo escribieron el asesor el 7 sep y su propio Radar del
 *      11 sep: TRES fuentes coinciden con la ficha. Las catorce extensiones
 *      2251–2389 son del conmutador MUNICIPAL, no de Callpicker — lo
 *      contratado son 3 Extensiones CE. Queda en pie que ENTRA tráfico —352
 *      entrantes en enero— y queda abierta la pregunta de por dónde entra
 *      sin un DID registrado.
 *
 *   2. «CERO MINUTOS EN TOTAL» ERA UN CERO SIN MEDICIÓN. `sal` viene null:
 *      de las salientes de esta cuenta NO hay lectura. Los 0 minutos salen
 *      del único bucket de destino de las ENTRANTES, y ahí se quedan.
 *      [[feedback-cero-sin-medicion]]
 *
 *   3. «UN TICKET ES EXCEPCIONAL» — no lo es: 611 de los 1,649 CIDs de la
 *      fuente traen exactamente uno, y TRES cuentas ya auditadas traen CERO
 *      (Finsus Growth; ECODELI, con 289,238 entrantes medidas; y OOAPAS). La
 *      v1.3 escribió «dos» y se dejó fuera a Finsus — corregido en la v1.4.
 *
 *   4. LA CITA DEL 12 AGO IBA RECORTADA en el punto que le invierte el
 *      sentido: el asesor escribió que no hubo interacciones «QUE INCUMPLAN
 *      EL SLA por parte de SAC o CSM», no que no hubiera interacciones. La
 *      del 5 ago también iba cortada y se completa.
 *
 *   5. LA CITA DE `cuentas.notas` («Cuenta importada — pendiente capturar…»)
 *      se publicaba en PRESENTE sobre un campo que esta misma auditoría
 *      reescribió el 13 oct. El machote existe —sigue en 38 cuentas más, 37
 *      con la frase idéntica—, pero en Z63 es una versión anterior del campo
 *      y así queda dicho, en vez de sustituir la cita en silencio.
 *
 *   6. «CATEGORÍA Facturación y Pagos» es la SUBcategoría. La categoría del
 *      folio 116939 es «Administrativo (voz)».
 *
 * Y TRES RESTOS DE LA v1.2 QUE SE LE QUEDARON SIN BARRER, encontrados al
 * corregir lo anterior: `conclusion` seguía cerrando con «una luz verde
 * encendida sobre una cuenta ciega»; `foda.debilidades` seguía afirmando que
 * «el tablero lo reporta como 0% sin contestar»; y `problema_raiz_detalle`
 * seguía contando el TOP 25 entre las listas de las que el cero la sacó. Los
 * tres contradecían a la cabecera de la v1.2 dentro del mismo archivo, que es
 * la peor forma de equivocarse: la corrección publicada al lado del error.
 *
 * PENDIENTE FUERA DE ESTE ARCHIVO: el addendum que `enriquece-impas.py`
 * escribió en `cuentas.observaciones_kam` arrastra dos de estos defectos —el
 * desmentido del DID en su punto 1) y el «el tablero dice 0% sin contestar»
 * en su punto 3)—. Ese texto vive en Supabase y hay que corregirlo allí.
 *
 * v1.4 — DOS ENUMERACIONES QUE NO CERRABAN, Y CINCO CITAS MAL ATADAS
 * ------------------------------------------------------------------
 * Segunda verificación adversarial, 13 oct 2026. Lo que la v1.3 dijo mal y lo
 * que mide la fuente:
 *
 *   1. «DOS CUENTAS YA AUDITADAS CON CERO TICKETS» — SON TRES. Contando las
 *      6,676 filas de `lib/tickets-data.json` contra las 40 referencias de
 *      `registry.ts` que tienen cuenta en cartera con CID, traen CERO ECODELI
 *      (C2, 164581), OOAPAS (D2, 167954) y **Finsus Growth (F1, 139590)**. La
 *      v1.3 dejó a Finsus fuera aplicando el mapeo del registry a medias: es
 *      el mismo mapeo con el que ella contaba a Sección Amarilla (F3) entre
 *      las empatadas en uno. El empate en uno sí cerraba: Dental District,
 *      Sección Amarilla e IMPAS.
 *
 *   2. «LA ÚNICA DE SUS 47 CUENTAS CON LECTURA QUE PASA DE 30 DÍAS» — NO. El
 *      #1 de la cola de riesgo de Dan sí es verdad: 236 días, el más alto de
 *      su cola. El denominador y la unicidad, no. Replicando `colaDeRiesgo`
 *      tal como la llama `app/cuentas/[id]/page.tsx:184` —con
 *      `getCidsDeAsesor` sobre Dan, que NO filtra estado— son 76 cuentas con
 *      CID, 73 con lectura, y SIETE pasan de 30 días de silencio. El 47 es
 *      otro universo, el de sus cuentas ACTIVAS, y dentro de ése sí es la
 *      única. Ahora se nombran los dos en vez de mezclarlos.
 *
 *   3. LA CITA DE LÍNEA DE `topDeCartera` APUNTABA AL SITIO EQUIVOCADO: decía
 *      `lib/facturacion-cuenta.ts:252`, que cae dentro de `conImporteGrc`. Se
 *      declara en la 288. Una referencia existe justo para que el lector pueda
 *      ir a comprobarla.
 *
 *   4. LA EVIDENCIA DE `silencio_30` IBA ATADA A LA APERTURA Y ERA LA DEL
 *      ESTADO ACTUAL. En `alertas_episodios`, `evidencia_apertura` dice «hace
 *      31 días» —2026-09-11 más 31 es el 12 de octubre, la fecha de apertura—
 *      y el «hace 32» es `evidencia_actual`, la de hoy. La distinción entre
 *      apertura y actual es el corazón del módulo de movimiento de alertas.
 *
 *   5. `comparativo` SE CONTRADECÍA CONSIGO MISMO. Una fila publicaba «✓
 *      $65,640 desde el 13 oct 2026» y la de al lado seguía diciendo «pero $0
 *      en la ficha», con su ideal escrito como pendiente. `cuentas.facturacion`
 *      de Z63 vale 65,640 —leído hoy en Supabase—: la misma cifra arreglada en
 *      un campo y no en el de al lado, dentro de la misma tabla.
 *
 *   6. `senal_alarma` RECONSTITUÍA ENTRE COMILLAS, COMO TEXTO DE LA PANTALLA,
 *      la frase «0% sin contestar» que el cuarto punto de la v1.2 existe para
 *      desmentir. La etiqueta de la barra imprime sólo el porcentaje
 *      —`{Math.round(s.pct!)}%` en `components/CuentaLlamadasPanel.tsx:390`—,
 *      o sea «0%» y nada más; las palabras «Sin contestar» son el rótulo de la
 *      leyenda y el texto del tooltip.
 *
 *   7. «58 AFIRMACIONES MEDIDAS Y ONCE TIRADAS» NO SE PUEDE COMPROBAR: de esa
 *      verificación no quedó artefacto en el repositorio, y el once tampoco
 *      cerraba contra la enumeración de este archivo —cuatro tesis más seis
 *      menores son diez—. Se cuenta sólo lo que está escrito aquí y se puede
 *      ir a verificar.
 *
 * LO QUE SE CONSERVA COMO DUDA, PORQUE LA FUENTE LO DICE ASÍ
 * ----------------------------------------------------------
 * La investigación institucional marca sus propios límites y aquí se respetan
 * en vez de aplanarlos: el personal total y el presupuesto no están validados
 * documentalmente; las ocho ubicaciones son «de referencia», no un inventario
 * certificado; los teléfonos de las tres UBR vienen de un comunicado de
 * octubre de 2024 y hay que confirmar que sigan operativos; las clínicas
 * colaboradoras NO son oficinas del IMPAS; y el nombramiento de la
 * subdirección de Salud Mental difiere entre dos versiones del directorio.
 * Un dato con reserva se escribe con su reserva. [[feedback-cero-sin-medicion]]
 */
export const IMPAS_CHIHUAHUA: AuditoriaCase = {
  id: 'impas-chihuahua',
  asesor: 'Dan',
  nombre: 'IMPAS · Instituto Municipal de Prevención y Atención a la Salud',
  sector: 'Gobierno municipal · Salud pública — organismo público descentralizado del Municipio de Chihuahua',
  fecha_periodo: 'Diciembre 2025 – Octubre 2026',
  fecha_auditoria: 'Oct 2026',
  tipo_cliente: 'Cuenta AAA · 10 meses · gobierno municipal',
  descripcion_contexto: '$65,640 al mes y la ficha decía $0 · El 96.7% del contrato es UN producto: la Marcación Corta (el 072) · 352 llamadas medidas en enero, ninguna llegó a una persona, y desde el 21 de enero no hay ni una más',
  estado: 'en_riesgo',
  clasificacion: 'CONFIDENCIAL',
  version: '1.4',

  kpis: [
    { label: 'MRR real · la ficha decía $0',      value: '$65,640',    color: '#ef4444' },
    { label: 'Del contrato es la Marcación Corta', value: '96.7%',     color: '#f97316' },
    { label: 'De 352 llamadas llegaron a alguien', value: '0',         color: '#ef4444' },
    { label: 'Minutos en las 352 entrantes · salientes NO medidas', value: '0', color: '#ef4444' },
    { label: 'Sin una sola llamada desde',         value: '21 ene',    color: '#f59e0b' },
    { label: 'Facturas pagadas de 10 meses',       value: '10 de 10',  color: '#22c55e' },
  ],

  resumen_ejecutivo: 'EMPEZANDO POR LO QUE EXPLICA TODO LO DEMÁS: esta cuenta factura $65,640 al mes y el tablero la tenía en CERO. No es la cuarta cifra equivocada de esta serie de auditorías, es la más cara de todas, porque un cero no desplaza un puesto: hunde la cuenta al fondo de cada lista. IMPAS es la CUARTA cuenta de la cartera viva por la única puerta de importe de la casa, `importeDeCuenta` —detrás de GTC ($316,541), Tech People ($88,783) y Sección Amarilla ($84,254)—, y la SEGUNDA de todas las que cruzan por CID en Gross Revenue Facturación, sólo por detrás de Tech People. Las dos lecturas son ciertas y no son la misma: la v1.1 usaba «la número dos» a secas en cinco sitios, que es la calificada sin su calificativo.\n\nEl importe está verificado y cuadra al centavo contra lo contratado: $63,450 de «Renta de número de Marcación Corta» más $2,190 de tres Extensiones CE dan exactamente los $65,640 que publica el GRC. Y ahí está el segundo dato que ordena la cuenta: **el 96.7% de lo que paga este cliente es UN SOLO producto, el número de marcación corta**. No es una cuenta de telefonía con varios servicios: es un número, y todo lo demás es accesorio. Si ese número se va, se va la cuenta entera.\n\nLO QUE NO SE PUEDE VER, Y ES CASI TODO. Hay 352 llamadas entrantes medidas, todas entre el 1 y el 21 de enero de 2026. Después de esa fecha no hay ni una más, y el corte de la entrega llega hasta el 14 de septiembre: son casi ocho meses sin un solo registro. Tampoco hay consumo: cero de cinco meses con dato, con alerta crítica abierta desde el 6 de octubre. De la cuarta cuenta de la cartera no sabemos nada de su operación desde enero.\n\nY LAS 352 QUE SÍ SE MIDIERON DICEN ALGO INCÓMODO: ninguna llegó a una persona. Cero. Las 352 terminaron en el menú automático, con CERO minutos de conversación —cero EN LAS ENTRANTES, que es lo único medido: `sal` viene null en la entrega, así que de las salientes de esta cuenta no hay lectura y no se cuentan como cero—.\n\nAQUÍ LA v1.1 SE EQUIVOCÓ Y CONVIENE DECIRLO, porque sobre el error construyó cinco secciones: afirmaba que «el tablero lo pinta como 0% sin contestar, una luz verde falsa». NO LO HACE. En `llamadas-data.ts` el registro trae `cerrado: null`, así que `pctCerrado` queda null y el KPI «Sin contestar» imprime «—», con el subtítulo «sin entrantes en agosto 2026». El veredicto del módulo es el primero de su precedencia: 236 días entre la última llamada y el corte contra un umbral de 30 → `en_silencio`, etiqueta «EN SILENCIO» en ROJO, y la portada escribe «es una cuenta que se está apagando». Es además la #1 de la cola de riesgo de Dan —236 días, el silencio más largo de esa cola—, y conviene decir sobre qué universo, porque la v1.3 mezcló dos: `colaDeRiesgo` se arma con `getCidsDeAsesor` sobre Dan, que NO filtra estado, así que son sus 76 cuentas con CID, 73 de ellas con lectura, y ahí dentro SIETE pasan de 30 días de silencio —Z63 con 236, y detrás C65 con 202, F68 con 201, F55 con 187, Z43 con 177, Z62 con 156 y D16 con 40—. Las 47 son otra cosa: sus cuentas ACTIVAS, todas con lectura, y de ésas sí es la única que pasa de 30; entre sus 68 vivas con CID —67 con lectura— ya son dos, con D16. Publicar «la única de sus 47 cuentas con lectura» era llamar única a algo que su propia cola contradice seis veces. Y `/seguimiento` ya avisa, desde `llamadas_atendidas_pct` = 0.0: «Solo 0% de llamadas atendidas — revisar configuración de agentes y horarios».\n\nEl único «0%» que aparece es una etiqueta neutra sobre la barra de enero, y su tooltip lo dice entero: «352 entrantes · 0 sin contestar · 0 atendidas · 352 por el menú · 0 buzón». O sea que el sistema SÍ lo dijo. Lo que queda en pie del hallazgo es la semántica, y es real: una tasa de PERDIDAS del 0% no significa que se atendiera a nadie. Lo que no se sostiene es la historia de que nadie vio nada.\n\nEL CONTACTO QUE NADIE ENCONTRABA ESTÁ PUBLICADO. Las observaciones del asesor dicen que el único dato disponible es el del contratante, Luis Álvarez, y que no responde a los correos. Mientras tanto el Municipio de Chihuahua publica en su sitio el directorio completo del organismo: catorce funcionarios con nombre, cargo, correo institucional y extensión, incluidos el director general y —lo que importa aquí— el subdirector administrativo, que es exactamente quien lleva contratación y presupuesto. La ficha, además, tiene mal al director: registra a «Lic. Erick Lucero» cuando el directorio municipal nombra al Dr. Luis Antonio Arrieta Trevizo, y guarda su teléfono como «0000000000».\n\nY EL CLIENTE ESTÁ VIVO, CONTRA LO QUE LA FICHA SUGIERE. Ha pagado diez facturas en diez meses, sin una sola incidencia. En septiembre de 2026 el Municipio publicó una extensión NUEVA sobre este servicio —072, extensión 5495, para agendar consultas dentales, de 8:00 a 18:00—, y en octubre abrió un ticket con la mesa por un tema de facturación. Un cliente que publica extensiones nuevas y que llama para hablar de su factura no es un cliente ausente: es un cliente al que no estamos mirando.',

  resultado_positivo: 'El cliente paga, y paga completo. Diez facturas en diez meses desde el alta del 24 de diciembre de 2025, cero incidencias de pago, y el GRC lo clasifica «MRR estable» con pérdida cero y clasificación AAA. En una cartera donde esta misma semana hemos encontrado cuentas marcadas de baja por error, ésta no tiene una sola sombra en su historial de cobranza.\n\nEl servicio tampoco falla: UN solo ticket en toda la relación —folio 116939—, de categoría «Administrativo (voz)» y SUBcategoría «Facturación y Pagos (voz)»; la v1.2 llamaba categoría a la subcategoría. Sin falla técnica, resuelto en 42 horas. No hay un problema de producto que arreglar aquí.\n\nY hay una señal de uso que vale más que cualquier métrica interna: **el cliente está publicando extensiones nuevas sobre este servicio**. En septiembre de 2026 el Municipio difundió el 072 extensión 5495 para agendar consultas dentales, con horario de 8:00 a 18:00. Un organismo no publica un canal de atención ciudadana sobre una plataforma que no usa. El servicio está vivo; lo que no está es nuestra medición.\n\nEl trabajo del asesor además dejó rastro útil: tres actividades registradas y las tres completadas, con un análisis del 7 de septiembre que detectó por escrito «irregularidades que requieren validación directa con el cliente». La lectura era correcta; lo que faltó fue a quién preguntarle, y eso se resuelve hoy.',

  hallazgos: [
    'IMPORTE — LA FICHA DECÍA $0 Y SON $65,640 AL MES. Es la segunda cuenta más grande de todas las que cruzan por CID en Gross Revenue Facturación, sólo detrás de Tech People. CON UNA PRECISIÓN QUE LA v1.1 NO HIZO Y QUE CAMBIA EL ALCANCE DEL DAÑO: el cero NO la sacó de las listas que importan. `topDeCartera` (lib/facturacion-cuenta.ts:288 — la v1.3 citaba la 252, que cae dentro de `conImporteGrc`) ordena la cartera viva por `importeDeCuenta`, y esa función lee el GRC por CID ANTES que la ficha, así que el $0 nunca llegó a esa lista — IMPAS entró al TOP 25 el 6 de octubre de 2026 y el comentario de `lib/alertas-detectar.ts` la nombra: «Entran cuatro al TOP 25, y la mayor —IMPAS Municipio Chihuahua, $65,640 al mes— figuraba en CERO». El episodio de alerta de ese día trae `es_top_apertura: true` y `mrr_apertura: 65640`. Donde el cero SÍ hizo daño es en todo lo que lee `cuentas.facturacion` en crudo: la ficha de la cuenta, y la priorización de auditorías que se hacía a mano leyendo ese campo. Por eso llega a auditarse hoy, una semana después de que el motor ya la hubiera señalado.',
    'IMPORTE — Y CUADRA AL CENTAVO, lo cual confirma que el dato bueno es el del GRC y no el de la ficha: $63,450 de «Renta de número de Marcación Corta» más $2,190 de tres Extensiones CE dan exactamente $65,640. La reconciliación es exacta, no aproximada.',
    'ESTRUCTURA — EL 96.7% DEL CONTRATO ES UN SOLO PRODUCTO: la Marcación Corta, $63,450 de los $65,640. Las tres extensiones valen $2,190 entre las tres. Esto no es una cuenta de telefonía con varios servicios: es UN NÚMERO. Concentra todo el riesgo y todo el valor en una sola línea de contrato, y cualquier conversación de renovación es, en realidad, la conversación de esa línea.',
    'MEDICIÓN — NO HAY UNA SOLA LLAMADA DESDE EL 21 DE ENERO. Las 352 entrantes medidas caen entre el 1 y el 21 de enero de 2026; el corte de la entrega llega al 14 de septiembre. Son casi ocho meses sin un registro de una cuenta que paga $65,640 al mes. O la captura se rompió, o el tráfico dejó de pasar por donde lo medimos: las dos cosas hay que saberlas, y ninguna se puede suponer.',
    'MEDICIÓN — Cero de cinco meses con dato de consumo. Alerta `sin_consumo_medible` abierta desde el 6 de octubre, severidad crítica. De la cuarta cuenta de la cartera no se puede decir si usa el servicio.',
    'RIESGO — HAY UN SEGUNDO AVISO ABIERTO Y LA v1.1 NO LO NOMBRABA: `silencio_30`, familia riesgo, severidad media, dueño el asesor, abierta el 12 de octubre de 2026, con `evidencia_apertura` «Último contacto que llegó al cliente: 2026-09-11, hace 31 días» — el «hace 32 días» que publicaba la v1.3 es `evidencia_actual`, la de hoy, y apertura y actual son justo lo que distingue el módulo de movimiento de alertas. Importa porque desmiente lo que el propio expediente afirmaba —que sin llamadas ni consumo no hay forma de ver venir nada—: hay DOS alertas abiertas, el veredicto `en_silencio` del módulo de llamadas, la cuenta primera en la cola de riesgo de su asesor y un Radar que pide escalamiento. El sistema avisó por cuatro caminos distintos.',
    'ATENCIÓN — DE 352 LLAMADAS, NINGUNA LLEGÓ A UNA PERSONA. Las 352 terminaron en el menú automático: `redir` 0, `buzón` 0, y CERO minutos de conversación EN LAS ENTRANTES — que no es «en total», como publicaba la v1.2: `sal` viene **null** en `llamadas-data.ts`, o sea que de las salientes de esta cuenta NO hay lectura, y un no medido no se colapsa a cero. Los 0 minutos salen del único bucket de destino de las entrantes. El contraste con cuentas comparables es absoluto — CBS Compresores tiene 12,883 llamadas atendidas por personas y 36,798 minutos sobre 17,283 entrantes; GTC, 84,081 y 384,252 sobre 208,255.',
    'MEDICIÓN — EL TABLERO NO PINTA VERDE ESTA CUENTA, Y LA v1.1 DECÍA QUE SÍ. Era su tesis central y es falsa. `cerrado` viene null, de modo que `pctCerrado` es null y el KPI «Sin contestar» imprime «—»; el veredicto es `en_silencio` (236 días sin una llamada contra un umbral de 30) en ROJO; la cuenta es la #1 de la cola de riesgo de su asesor; y `/seguimiento` ya avisa «Solo 0% de llamadas atendidas». El «0%» existe sólo como etiqueta neutra en la barra de enero, cuyo tooltip dice «352 entrantes · 0 sin contestar · 0 atendidas · 352 por el menú · 0 buzón». Lo que SÍ vale del hallazgo original es la semántica: una tasa de perdidas del 0% no dice que alguien atendiera. Lo que no vale es la conclusión de que el sistema calló.',
    'MEDICIÓN — Y NO ES LA FIRMA DE OOAPAS. La v1.1 la presentaba como «la misma firma al revés». No lo es: en OOAPAS las 2,625 de 2,633 son perdidas DE VERDAD —`redir` 0, `ivr` 0, `buzon` 0— o sea el campo opuesto al de IMPAS, donde las 352 son `ivr` y las perdidas son cero. Y allí el módulo apaga la alarma por sí solo: se cumple `destinoPorConfirmar` y el veredicto es `por_confirmar` en gris, «la alarma queda apagada hasta que alguien confirme qué atiende ahí». La auditoría de OOAPAS lo escribe en condicional —«publicarlo como mal servicio SERÍA una falsa alarma»—, nunca dijo que se hubiera publicado.',
    'ATENCIÓN — EL ASESOR SÍ LO LEYÓ BIEN, Y LA v1.1 LE ATRIBUYÓ EL ERROR CONTRARIO. Lo dejó escrito dos veces: en la actividad del 7 sep 2026, «todos los registros aparecen como perdidos O PERMANECEN EN MENÚ, sin evidencia de llamadas atendidas, DID vinculado a la cuenta o número de contacto directo del titular»; y en su propia respuesta del Radar del 11 sep, «todas las llamadas entrantes se encuentran en estancia en menú». El «todas perdidas» de `observaciones_kam` es real, pero era su lectura abreviada, no su única lectura: el diagnóstico del menú estaba identificado y fechado. Lo que faltó no fue el análisis — fue a quién preguntarle, y eso se resuelve hoy.',
    'ATENCIÓN — EL TRÁFICO ENTRA A TODAS HORAS: 22 de las 24 horas del día tienen llamadas, incluidas las de madrugada, y los siete días de la semana (sábado 39, domingo 43). El horario administrativo publicado del organismo es de lunes a viernes de 8:00 a 15:00. O hay un canal 24/7 detrás —el organismo opera una línea de atención a crisis *800 «Hablar Salva Vidas», 24/7— o hay llamadas entrando a horas en las que no hay nadie. Es la primera pregunta técnica que hay que hacer.',
    'RIESGO — SI LA LÍNEA DE CRISIS PASA POR AQUÍ, ESTO DEJA DE SER UN TEMA DE SLA. El organismo opera una línea de atención a crisis 24/7 («Hablar Salva Vidas», *800). NO está confirmado que ese canal viaje sobre nuestro servicio, y no se debe suponer — pero confirmarlo o descartarlo es lo primero del plan, porque si viaja, una llamada que no llega a una persona no es una métrica: es una emergencia sin atender.',
    'RELACIÓN — EL CONTACTO QUE NADIE ENCONTRABA ESTÁ PUBLICADO EN UN SITIO .GOB.MX. Las observaciones KAM dicen que el único dato disponible es el del contratante, Luis Álvarez, y que no responde correos. El Municipio de Chihuahua publica el directorio completo del organismo con catorce funcionarios, cada uno con cargo, correo institucional y extensión. No era un dato difícil: era un dato que nadie fue a buscar.',
    'RELACIÓN — EL DECISOR ÚTIL TIENE NOMBRE, CORREO Y EXTENSIÓN: C.P. Miguel de los Santos Arévalo, subdirector administrativo (miguel.delossantos@mpiochih.gob.mx, 614 200-4800 ext. 2255). En un organismo público, contratación, renovación y presupuesto pasan por la subdirección administrativa, no por la dirección general. Es el contacto que esta cuenta necesitaba desde diciembre.',
    'FICHA — EL DIRECTOR REGISTRADO NO ERA EL DIRECTOR. La ficha guardaba «Lic. Erick Lucero — Director IMPAS» con teléfono «0000000000», cuando el directorio municipal nombra al Dr. Luis Antonio Arrieta Trevizo (ext. 2264). Un contacto equivocado es peor que ninguno: hace creer que la cuenta está mapeada. CORREGIDO el 13 oct 2026, junto con la captura del directorio completo — la ficha pasó de 2 contactos, uno de ellos falso, a 15.',
    'OPERACIÓN — EL CLIENTE PUBLICÓ UNA EXTENSIÓN NUEVA EN SEPTIEMBRE. El Municipio difundió el 072 extensión 5495 para agendar consultas dentales, de lunes a viernes de 8:00 a 18:00. Dos cosas se siguen de ahí: que el servicio está vivo y creciendo en usos, y que **hay flujos de atención diferenciados por servicio** — algo que nuestra medición no refleja en ninguna parte.',
    'OPERACIÓN — OCHO UBICACIONES DE REFERENCIA, Y NO SABEMOS CÓMO TELEFONEAN. Cuatro sedes principales, tres Unidades Básicas de Rehabilitación y un Centro de Equinoterapia. Las tres UBR tienen teléfonos propios publicados (614 434 4065, 614 424 5194, 614 446 0586) en un comunicado municipal de octubre de 2024. Si esas sedes marcan por fuera, hay tráfico del cliente que no pasa por nosotros — y es la conversación de crecimiento más concreta que tiene esta cuenta. (La cifra de ocho es de referencia, no un inventario certificado, y los teléfonos hay que confirmar que sigan operativos.)',
    'CONTRADICCIÓN — LA FUENTE DE DIDs RESPALDA A LA FICHA, Y LA v1.2 PUBLICÓ EL DESMENTIDO SIN CONSULTARLA. Las observaciones afirman que «no cuenta con un número Callpicker asignado ni con extensiones configuradas», y la v1.2 lo dio por refutado. NO lo está: `data/dids.json` —el inventario de los números que Callpicker entrega— no registra NI UN número para el CID 177810, de 16,534 números repartidos en 3,717 CIDs, y ésta es una de sólo 9 cuentas sin DID entre las 193 vivas, frente a 184 que sí lo tienen. Lo mismo escribieron el asesor el 7 sep —«sin evidencia de … DID vinculado a la cuenta»— y su propio Radar del 11 sep —«la cuenta no tiene un DID asociado»—: TRES fuentes coinciden con la ficha. Y las catorce extensiones del rango 2251–2389 son las del conmutador MUNICIPAL publicadas en el directorio —así están capturadas en `contactos_json`—, no extensiones configuradas en Callpicker: lo contratado son 3 Extensiones CE. QUÉ QUEDA EN PIE, que es la pregunta de verdad: 352 llamadas entraron en enero, así que tráfico sí llega. Por dónde entra sin un DID registrado, y si una Marcación Corta debe o no figurar en ese inventario, es lo que hay que ir a preguntar — no darlo por desmentido. AVISO: el addendum que `scripts/enriquece-impas.py` escribió en `cuentas.observaciones_kam` publica ese desmentido en su punto 1) como si fuera definitivo. Ese texto vive en Supabase, fuera de este archivo, y hay que corregirlo allí.',
    'SERVICIO — El cliente SÍ está en contacto: abrió un ticket en octubre de 2026 por «Facturación y Pagos (voz)», resuelto en 42 horas sin falla técnica. Es posterior a las observaciones del 11 de septiembre que lo daban por ilocalizable. La cuenta responde cuando le toca pagar: eso es una vía de contacto, y es la única que ha funcionado.',
    'RELACIÓN — CERO REUNIONES EN DIEZ MESES, con el Health Score en 47 y medido al 15%: tres de sus cuatro bloques traen 50, que es el marcador por omisión, y el único calculado es el relacional (27), cuyo peso es 0.15. El porcentaje es PONDERADO, no un conteo de bloques — la v1.1 publicaba «medido al 25%», que es 1 de 4 leído como si los cuatro pesaran igual. El 27 está verificado, pero NO es el más bajo de las auditorías escritas como decía la v1.1: es el 9.º más bajo de 40, y ocho están por debajo (Ancona 4, Probemedic 4, VAEO 10, OOAPAS 11, ClickBalance 13, Salud y Hogar 13, Azyco 13, Cintas Cove 15).',
    'RELACIÓN — EL RADAR ESTÁ COMPLETO, 12 DE 12, Y ESO ES PEOR QUE EL HUECO. La v1.1 decía «1 de 12» porque confundió UNA FILA de `radar_respuestas` con UNA respuesta: esa fila, del 11 de septiembre de 2026, trae las doce preguntas contestadas, score_atlas 73, nivel `optimize`. Y lo que contesta es una cuenta sin asidero: valor de negocio «no identificado», champion «no sabemos», responsable económico «no», dependencia «no», fricción «no», y en las dos preguntas de cierre —predictiva y acción— el propio asesor escribió RIESGO DE CANCELACIÓN y ESCALAMIENTO. Hace un mes. El Radar hizo su trabajo, dijo «esto se cancela» y pidió escalar; lo que no hubo fue el escalamiento.',
    'CONTEXTO — ES UN ORGANISMO PÚBLICO DESCENTRALIZADO, creado por acuerdo municipal en noviembre de 2021, y eso cambia el calendario de la cuenta: contratación y renovación van por ciclo presupuestal, y un cambio de administración municipal puede reabrir decisiones que un cliente privado no reabre. No es un riesgo hoy; es el reloj que esta cuenta tiene y que no está anotado en ninguna parte.',
    'FICHA — Quedan DOS campos sin capturar, no tres: `tamano_empresa` y `total_empleados`. `num_oficinas` vale 8 desde el 13 de octubre —lo escribió `scripts/enriquece-impas.py` con su reserva anotada en las notas— y la v1.1 seguía declarándolo vacío, contradiciendo a la fuente y a su propio encabezado. Los dos que faltan se quedan vacíos a propósito: el personal total no está validado documentalmente en ninguna fuente pública, y se anota como no medido en vez de estimarlo.',
  ],

  cronologia: [
    { fecha: 'Nov 2021',     responsable: 'Municipio de Chihuahua', evento: 'Se crea el IMPAS por acuerdo municipal, como organismo público descentralizado de prevención y atención a la salud.', tipo: 'neutral' },
    { fecha: '24 Dic 2025',  responsable: 'Callpicker',             evento: 'Alta de la cuenta. Servicios: renta de número de Marcación Corta ($63,450) y tres Extensiones CE ($2,190). El 96.7% del valor es el número.', tipo: 'ok' },
    { fecha: '01–21 Ene 2026', responsable: 'Operación IMPAS',      evento: '352 llamadas entrantes medidas. TODAS terminan en el menú automático: cero llegan a una persona y cero minutos de conversación EN ESAS 352 —de salientes no hay lectura, `sal` viene null—. Entran a 22 de las 24 horas y los siete días.', tipo: 'problema' },
    { fecha: '21 Ene 2026',  responsable: 'Medición',               evento: 'ÚLTIMA llamada registrada. A partir de aquí no hay un solo registro, y el corte de la entrega llega hasta el 14 de septiembre.', tipo: 'pivote' },
    { fecha: 'Ene–Oct 2026', responsable: 'Facturación',            evento: 'Diez facturas en diez meses, sin una sola incidencia. GRC «MRR estable», pérdida cero, clasificación AAA. El cliente paga puntualmente todo el periodo invisible.', tipo: 'ok' },
    { fecha: '05 Ago 2026',  responsable: 'Dan',                    evento: 'Análisis cerrado, con la cita COMPLETA: «No se ha detectado ningún SLA excedido ni interacciones mediante chat, se tiene mapeado al DM de la cuenta, sin embargo no se ha logrado establecer contacto directo con él para posicionamiento». La cola de la frase —tenía al decisor mapeado y no lograba hablarle— la v1.2 la dejaba fuera.', tipo: 'neutral' },
    { fecha: '12 Ago 2026',  responsable: 'Dan',                    evento: 'Análisis cerrado, y la cita va COMPLETA porque recortada dice lo contrario: «no se ha detectado interacciones relevantes de la cuenta QUE INCUMPLAN EL SLA POR PARTE DE SAC O CSM, la información pendiente ya está cargada en la cuenta, no tiene enlace en Zoho. Fecha de inicio: Diciembre 26, 2025». La v1.2 la cortaba en «…de la cuenta», y así se lee como que la cuenta no tuvo interacciones; lo que el asesor cerró es que no hubo INCUMPLIMIENTOS DE SLA. El recorte caía justo sobre la tesis del expediente.', tipo: 'neutral' },
    { fecha: '07 Sep 2026',  responsable: 'Dan',                    evento: 'Validación cerrada: «durante el análisis se detectaron irregularidades que requieren validación directa con el cliente». La lectura era correcta; faltaba a quién preguntarle.', tipo: 'problema' },
    { fecha: 'Sep 2026',     responsable: 'Municipio de Chihuahua', evento: 'Se publica el 072 extensión 5495 para agendar consultas dentales, de 8:00 a 18:00. El cliente está AMPLIANDO usos sobre el servicio mientras nosotros no vemos tráfico.', tipo: 'ok' },
    { fecha: '11 Sep 2026',  responsable: 'Dan',                    evento: 'Correo de seguimiento a ambos contactos (interacción #115235). Último contacto registrado. Las observaciones KAM quedan escritas: el contratante no responde correos.', tipo: 'problema' },
    { fecha: 'Oct 2026',     responsable: 'Mesa de ayuda',          evento: 'El cliente abre un ticket de «Facturación y Pagos (voz)», resuelto en 42 horas sin falla. Está localizable: responde por la vía de la factura.', tipo: 'neutral' },
    { fecha: '06 Oct 2026',  responsable: 'Motor de alertas',       evento: 'Se abre `sin_consumo_medible`, severidad crítica: cero de cinco meses con dato de consumo.', tipo: 'problema' },
    { fecha: '13 Oct 2026',  responsable: 'Callpicker',             evento: 'Al reordenar el TOP 50 por el importe bueno, la cuenta aparece: la ficha decía $0 y son $65,640. Y la investigación institucional localiza el directorio completo del organismo, con el decisor administrativo y su extensión.', tipo: 'pivote' },
  ],

  perfil_campos: [
    { label: 'Nombre',                value: 'Instituto Municipal de Prevención y Atención a la Salud (IMPAS)' },
    { label: 'Naturaleza',            value: 'Organismo público descentralizado del Municipio de Chihuahua, creado por acuerdo municipal en noviembre de 2021' },
    { label: 'Sector',                value: 'Gobierno municipal · Salud pública' },
    { label: 'Ciudad',                value: 'Chihuahua, Chihuahua' },
    { label: 'Sitio',                 value: 'impas.mpiochih.gob.mx · municipiochihuahua.gob.mx' },
    { label: 'Director general',      value: 'Dr. Luis Antonio Arrieta Trevizo — antonio.arrieta@mpiochih.gob.mx · ext. 2264. ✓ corregido en la ficha el 13 oct 2026.' },
    { label: 'Teléfono institucional',value: '(614) 200-4800 · línea municipal 072, extensiones 2259, 2260 y 2261' },
    { label: 'Horario administrativo',value: 'Lunes a viernes, 8:00–15:00 (publicado). La línea de crisis es 24/7 y la de citas dentales 8:00–18:00.' },
    { label: 'Ubicaciones',           value: '8 de referencia: 4 sedes + 3 Unidades Básicas de Rehabilitación + 1 Centro de Equinoterapia. NO es un inventario certificado.' },
    { label: 'Personal total',        value: 'NO MEDIDO — no identificado públicamente con certeza suficiente. No se estima.' },
    { label: 'Presupuesto',           value: 'NO MEDIDO — pendiente de validación documental.' },
    { label: 'Cliente desde',         value: '24 de diciembre de 2025 — 10 meses' },
    { label: 'Servicios contratados', value: 'Renta de número de Marcación Corta ($63,450) + 3 Extensiones CE ($2,190). Total $65,640 — cuadra al centavo con el GRC.' },
    { label: 'Facturación mensual',   value: '$65,640 MXN (GRC `mrrFin`, «MRR estable», AAA). ✓ corregido en la ficha el 13 oct 2026; decía $0.' },
    { label: 'Salud de pago',         value: 'Al corriente · 10 facturas en 10 meses · 0 incidencias' },
    { label: 'Health Score',          value: '47 · relacional 27, actividad 50, adopción 50, pago 50. MEDIDO AL 15%: el peso es ponderado y sólo el relacional está calculado' },
  ],

  necesidad_negocio: 'IMPAS no vende nada por teléfono: atiende a ciudadanos. Es un organismo público de salud que da consulta médica y dental, psicoterapia, rehabilitación física y ocupacional, atención metabólica y —esto es lo que cambia la conversación— una línea de atención a crisis abierta 24 horas, «Hablar Salva Vidas».\n\nEso define qué significa una llamada aquí. En una empresa, una llamada perdida es una venta que no ocurrió. En un organismo de salud pública, una llamada perdida es un ciudadano que no recibió atención, y en el caso de la línea de crisis puede ser bastante más que eso. El cliente no está comprando capacidad comercial: está comprando que el teléfono de un servicio público funcione.\n\nY la forma del contrato lo confirma: el 96.7% de lo que paga es el NÚMERO —la marcación corta, el 072 por el que un ciudadano de Chihuahua marca sin saberse un número largo—. Las extensiones son el accesorio. Lo que compró es el acceso.\n\nLa necesidad real que tiene hoy, y que nadie le ha ofrecido, es saber qué pasa con ese acceso: cuántos marcan, a qué horas, a qué servicio, cuántos esperan y cuántos cuelgan. Es un organismo que rinde cuentas públicas y que acaba de publicar una extensión nueva para citas dentales: el dato de atención telefónica por servicio es, para él, materia de informe. Hoy no lo tiene, y nosotros tampoco.',

  potencial_corto: [
    'Recuperar la medición: no hay una sola llamada desde el 21 de enero ni un mes de consumo. Sin eso no se puede hablar de nada más, y es lo único que vuelve gestionable una cuenta de $65,640 al mes.',
    'Averiguar por qué ninguna de las 352 llamadas llegó a una persona. O el enrutamiento termina en un menú sin salida, o la transferencia ocurre fuera de nuestra vista: las dos respuestas abren trabajo distinto.',
    'Reporte de atención por servicio: el cliente acaba de publicar una extensión para citas dentales con horario propio. Medir cada flujo por separado es lo que un organismo público necesita para informar.',
    '✓ Capturados el 13 oct: los 14 funcionarios del directorio público y el contratante, con el director corregido. Lo que queda es escribirle al subdirector administrativo, que es quien lleva contratación y presupuesto.',
  ],

  potencial_largo: [
    'Las tres Unidades Básicas de Rehabilitación tienen teléfonos propios publicados. Si marcan por fuera, hay tráfico del cliente que no pasa por nosotros: es la conversación de crecimiento más concreta de esta cuenta.',
    'IA de Voz para la línea de citas: un organismo con horario de 8:00 a 18:00 en citas dentales y tráfico a 22 de las 24 horas tiene una franja larga sin nadie detrás.',
    'Callpicker Chat: no lo tiene contratado, y un organismo de salud con atención psicológica tiene canales donde el texto sirve mejor que la voz.',
    'La puerta del Municipio: IMPAS es UN organismo descentralizado del Municipio de Chihuahua. Una cuenta bien llevada aquí es la referencia natural hacia las demás dependencias del mismo ayuntamiento.',
  ],

  tacticas: [
    { nombre: 'Entrar por la subdirección administrativa', descripcion: 'Escribir al C.P. Miguel de los Santos Arévalo (ext. 2255), no al director general. En un organismo público, contratación y presupuesto viven ahí.', impacto: 'Es el contacto que resuelve renovación y el único que puede explicar el ticket de facturación de octubre.' },
    { nombre: 'Llevar la pregunta técnica, no el reproche', descripcion: 'Abrir con «no estamos viendo su tráfico desde enero y queremos entender por qué»: es un problema nuestro de medición, no una acusación al cliente.', impacto: 'Un organismo público responde mejor a una petición de verificación técnica que a una llamada comercial.' },
    { nombre: 'Preguntar por la línea de crisis ANTES que por nada', descripcion: 'Confirmar si «Hablar Salva Vidas» viaja sobre este servicio. No suponerlo en ninguna dirección.', impacto: 'Si viaja, reordena todas las prioridades de la cuenta. Si no, se descarta en una frase y se sigue.' },
    { nombre: 'Ofrecer el reporte que necesita para informar', descripcion: 'Un organismo público rinde cuentas. El desglose de atención por servicio y por horario es material de informe, no una función de producto.', impacto: 'Convierte la conversación de «qué nos paga» a «qué le damos», con un entregable que nadie más le da.' },
  ],

  senal_alarma: 'La cuarta cuenta de la cartera —la segunda de las que cruzan por CID— estuvo diez meses con $0 en su ficha, pagando $65,640 cada mes sin que nadie fuera a verla, incluso después de que el motor la metiera al TOP 25 el 6 de octubre. En ese tiempo no hubo una reunión, no se registró una llamada desde el 21 de enero, no hubo un mes de consumo medible, y las 352 llamadas que sí se midieron no llegaron a una sola persona mientras la etiqueta de la barra de enero imprimía un «0%» a secas —sólo el porcentaje: las palabras «sin contestar» son el rótulo de la leyenda y el texto del tooltip, no la etiqueta, y el KPI, en cambio, imprime «—»—. El contacto que el asesor no conseguía estaba publicado en un sitio del gobierno municipal. Y lo que de verdad alarma: NO es que falten avisos. Hay dos alertas abiertas, el módulo la declara EN SILENCIO en rojo, es la primera de la cola de riesgo de su asesor y su propio Radar pide escalamiento por riesgo de cancelación desde el 11 de septiembre. Si esta cuenta no renueva, no será por falta de aviso: será porque ninguno de los cuatro movió a nadie.',

  problema_raiz: 'Nadie fue a ver una cuenta que el propio sistema ya había señalado. El motor la metió al TOP 25 el 6 de octubre y le abrió dos alertas; la ficha, que lee `cuentas.facturacion` en crudo, seguía diciendo $0. Diez meses sin una reunión, sin un registro de llamada desde enero y sin un mes de consumo medible.',

  problema_raiz_detalle: 'El origen es mecánico y por eso es tan caro: `cuentas.facturacion` quedó en cero cuando la cuenta se importó. LA CITA QUE LA v1.2 PUSO AQUÍ YA NO SE PUEDE COMPROBAR, y conviene decirlo en vez de sustituirla en silencio: afirmaba en presente «sus propias `notas` lo dicen: “Cuenta importada — pendiente capturar: activo_desde, contacto principal, giro, servicios contratados, MRR”», pero `cuentas.notas` de Z63 la reescribió `scripts/enriquece-impas.py` el 13 oct 2026 —esta misma auditoría— y hoy ese campo guarda el contexto institucional del organismo. El machote no es invención: sigue hoy en 38 cuentas más de la cartera, 37 de ellas con la frase idéntica (Z24, Z25, Z26, Z28, Z29, Z45…). Pero en ESTA cuenta es una versión anterior del campo, no lo que la fuente dice hoy. A partir de ahí, lo que lee `cuentas.facturacion` EN CRUDO la mandó al fondo: la ficha de la cuenta y la priorización de auditorías que se hacía a mano sobre ese campo. NO el TOP 25 — la v1.2 seguía contándolo en esta lista y es falso, como ya dice el primer hallazgo: `topDeCartera` pasa por `importeDeCuenta`, que lee el GRC por CID antes que la ficha, y el motor la metió al TOP 25 el 6 de octubre. Un cero no es un número pequeño en una lista ordenada: es la exclusión de las listas que se construyen leyendo ese campo a pelo.\n\nLa segunda capa es de medición, y tiene dos huecos distintos. El primero: no hay una sola llamada desde el 21 de enero y cero meses con dato de consumo, de modo que durante ocho meses no hubo absolutamente nada que mirar. El segundo es de semántica: de las 352 llamadas medidas ninguna llegó a una persona, y la palabra «contestada» no lo distingue. Aquí conviene ser exacto, porque la v1.1 no lo fue: el módulo NO publicó una luz verde. `cerrado` venía null, el KPI imprimió «—», el veredicto fue `en_silencio` en rojo y la cuenta quedó primera en la cola de riesgo de su asesor. El defecto de semántica es real y pega en las cuentas que SÍ traen tasa —Tech People publica 6.21% de perdidas con el 44.40% llegando a una persona—, no en ésta.\n\nLa tercera es de relación, y es la que más fácil se podía haber evitado. El asesor dejó escrito que no tenía a quién escribirle y que el contratante no respondía. El cliente es una dependencia de gobierno: su directorio es información pública y está publicado, con catorce funcionarios, sus cargos, sus correos institucionales y sus extensiones. No fue un problema de acceso ni de esfuerzo: fue que buscar en el sitio del cliente no es un paso del procedimiento. Las observaciones lo dicen con todas sus letras —«no se identificó presencia relevante en LinkedIn»— y ahí se detuvo la búsqueda. Para un cliente privado, LinkedIn es razonable; para una dependencia municipal, el directorio oficial es la fuente, y es mejor.\n\nY la cuarta no es la que la v1.1 escribió. Decía que el asesor había leído el dato al revés y que la contradicción se quedó sin pregunta. Falso: el asesor identificó el menú por escrito el 7 de septiembre —«aparecen como perdidos O PERMANECEN EN MENÚ, sin evidencia de llamadas atendidas»— y lo repitió en el Radar del 11. El diagnóstico existía, fechado y firmado. Lo que no existía era un interlocutor a quien llevárselo: con el contratante sin responder y el directorio oficial sin consultar, el análisis correcto se quedó sin destino. Eso es lo que falló, y es un problema de procedimiento, no de criterio.',

  flujo_real: [
    { fase: 'El ciudadano marca',        area: 'Ciudadano de Chihuahua', accion: 'Marca el 072, la marcación corta del Municipio', resultado: 'El acceso es el producto: el 96.7% del contrato es ese número' },
    { fase: 'Entra a la plataforma',     area: 'Callpicker',             accion: 'La llamada llega y la atiende el menú automático', resultado: '352 llamadas medidas, las 352 al IVR' },
    { fase: 'Debería pasar a alguien',   area: 'IMPAS',                  accion: 'Transferencia a la extensión del área que corresponda', resultado: 'CERO llegaron a una persona · CERO minutos en esas 352 entrantes · de salientes NO hay lectura (`sal` null)' },
    { fase: 'El tablero lo evalúa',      area: 'Dashboard',              accion: '`cerrado` es null, así que no calcula tasa', resultado: 'KPI «—», veredicto EN SILENCIO en rojo, #1 de la cola de riesgo. El sistema SÍ lo señaló.' },
    { fase: 'Se corta la medición',      area: 'Medición',               accion: '—', resultado: 'Ni una llamada desde el 21 ene · 0 de 5 meses de consumo · ocho meses sin nada' },
    { fase: 'La cuenta factura igual',   area: 'Facturación',            accion: 'Se emite la mensualidad', resultado: '10 facturas en 10 meses, $65,640, «MRR estable», sin incidencias' },
    { fase: 'La ficha pinta el importe', area: 'Dashboard',              accion: 'Lee `cuentas.facturacion` en crudo, sin pasar por `importeDeCuenta`', resultado: '$0 durante diez meses — mientras el TOP 25 y las alertas, que sí pasan por ahí, la veían en $65,640' },
    { fase: 'El asesor busca contacto',  area: 'SAC',                    accion: 'Correos al contratante · búsqueda en LinkedIn', resultado: 'Sin respuesta. El directorio oficial, con 14 funcionarios, no se consultó hasta el 13 oct 2026.' },
  ],

  comparativo: [
    { metrica: 'Importe en la ficha', real: '✓ $65,640 desde el 13 oct 2026 — estuvo en $0 diez meses', ideal: 'Alcanzado' },
    { metrica: 'Puesto por dinero en la cartera', real: 'La 4ª por `importeDeCuenta` · la 2ª de las que cruzan por CID · y desde el 13 oct 2026 la ficha dice lo mismo: $65,640, que estuvo en $0 diez meses', ideal: 'Alcanzado' },
    { metrica: 'Llamadas que llegaron a una persona', real: '0 de 352', ideal: 'Lo que el cliente haya definido; hoy no está definido' },
    { metrica: 'Minutos de conversación medidos', real: '0 en las 352 entrantes · de salientes NO hay lectura (`sal` null): ausencia, no cero', ideal: 'CBS Compresores: 36,798 sobre 17,283 entrantes' },
    { metrica: 'Lo que reporta el indicador', real: 'KPI «—» y veredicto EN SILENCIO · `/seguimiento`: «Solo 0% de llamadas atendidas»', ideal: 'Que además diga, donde sí haya tasa, contestada POR UNA PERSONA frente a contestada por el menú' },
    { metrica: 'Última llamada registrada', real: '21 de enero de 2026', ideal: 'El corte de la entrega: 14 de septiembre' },
    { metrica: 'Meses con dato de consumo', real: '0 de 5', ideal: '5 de 5' },
    { metrica: 'Reuniones en 10 meses', real: 'NINGUNA', ideal: 'Al menos una en el alta y otra trimestral' },
    { metrica: 'Decisores capturados', real: '15 desde el 13 oct 2026 — eran 2, y el principal estaba MAL', ideal: 'Alcanzado. Lo que falta es que alguien los llame' },
    { metrica: 'Radar de 12 preguntas', real: '12 de 12 — y pide ESCALAMIENTO por RIESGO DE CANCELACIÓN desde el 11 sep', ideal: 'Que alguien actúe sobre lo que el Radar ya dijo' },
    { metrica: 'Bloques del Health Score medidos', real: '1 de 4 (sólo el relacional)', ideal: '4 de 4' },
  ],

  plan_inmediato: [
    { accion: '✓ HECHO el 13 oct 2026 — Corregido el importe de la ficha: $0 → $65,640, el del GRC, que cuadra al centavo con los servicios contratados. Lo que esto arregla es la FICHA y todo lo que lee `cuentas.facturacion` en crudo; el TOP 25 y las alertas ya la veían, porque ésos pasan por `importeDeCuenta`', responsable: 'Facturación', criterio: 'Aplicado y comprobado leyendo de vuelta con `scripts/enriquece-impas.py`' },
    { accion: 'CONFIRMAR si la línea de atención a crisis 24/7 («Hablar Salva Vidas», *800) viaja sobre nuestro servicio. No suponerlo en ninguna dirección', responsable: 'Dan / Ingeniería', criterio: 'Respuesta escrita del cliente. Si es que sí, la cuenta se reprioriza entera ese mismo día.' },
    { accion: 'Escribir al C.P. Miguel de los Santos Arévalo, subdirector administrativo (miguel.delossantos@mpiochih.gob.mx, ext. 2255), y al Dr. Luis Antonio Arrieta Trevizo, director general (ext. 2264). Los dos ya están capturados en la ficha — lo que falta es la llamada', responsable: 'Dan', criterio: 'Respuesta de al menos uno, registrada en seguimiento' },
    { accion: 'Averiguar con Ingeniería por qué no hay una sola llamada desde el 21 de enero ni un mes de consumo, en una cuenta que factura $65,640', responsable: 'Ingeniería', criterio: 'O entra la lectura, o queda escrito por qué esta cuenta no se puede medir' },
    { accion: 'Averiguar por qué ninguna de las 352 llamadas llegó a una persona: revisar el enrutamiento del menú y a dónde transfiere', responsable: 'Ingeniería / Dan', criterio: 'Se explica el flujo completo de una llamada, desde el 072 hasta la extensión que la toma' },
    { accion: '✓ HECHO el 13 oct 2026 — Corregido el director de la ficha (registraba «Lic. Erick Lucero» con teléfono 0000000000) y capturado el DIRECTORIO COMPLETO: los 14 funcionarios publicados por el Municipio, con cargo y extensión, más el contratante histórico. Quince contactos donde había dos, y uno de los dos estaba mal', responsable: 'Dan', criterio: 'Aplicado y comprobado. Los correos de los 12 sin correo publicado NO se construyeron por patrón: sólo van los 2 verificados.' },
  ],

  plan_mediano: [
    { accion: 'Primera reunión en diez meses, con la subdirección administrativa y con quien opere el conmutador. El Radar ya está contestado —y pide escalamiento por riesgo de cancelación—: lo que toca es REVISARLO con el cliente delante, no volver a llenarlo', responsable: 'Dan', criterio: 'Reunión registrada con minuta, y las doce respuestas del Radar actualizadas contra lo que diga el cliente' },
    { accion: 'Mapear los flujos de atención por servicio: citas dentales (072 ext. 5495, 8:00–18:00), salud mental, rehabilitación y la línea de crisis. El cliente ya los tiene diferenciados; nuestra medición no', responsable: 'Dan / Ingeniería', criterio: 'Queda escrito qué extensión atiende qué servicio y en qué horario' },
    { accion: 'Confirmar si las tres Unidades Básicas de Rehabilitación telefonean por su cuenta: tienen números propios publicados en un comunicado municipal de octubre de 2024 y hay que verificar que sigan operativos', responsable: 'Dan', criterio: 'Se sabe cuántas sedes pasan por nosotros y cuántas no' },
    { accion: 'Capturar los dos campos que siguen vacíos —`tamano_empresa` y `total_empleados`— preguntándoselos al cliente, y dejar escrito que el personal total NO está validado públicamente en vez de estimarlo. `num_oficinas` ya vale 8', responsable: 'Dan', criterio: 'La ficha dice lo que se sabe y marca con palabras lo que no' },
  ],

  plan_estrategico: [
    { accion: 'QUE EL INDICADOR DISTINGA QUIÉN CONTESTÓ, dicho con precisión: en ESTA cuenta el módulo se portó bien —KPI «—» y veredicto EN SILENCIO en rojo— porque `cerrado` venía null. El riesgo está en las cuentas que SÍ traen tasa, donde una perdida baja se lee como atención alta: Tech People publica 6.21% de perdidas y sólo el 44.40% llega a una persona', responsable: 'Producto / Dirección', criterio: 'Donde haya tasa, la ficha muestra las dos cifras y el semáforo usa la de personas' },
    { accion: 'Reporte de atención telefónica por servicio, pensado para rendición de cuentas pública', responsable: 'Producto / Dan', criterio: 'El cliente recibe un informe mensual por línea de servicio y horario' },
    { accion: 'IA de Voz para la franja sin personal: el horario administrativo es 8:00–15:00 y entra tráfico a 22 de las 24 horas', responsable: 'Dan', criterio: 'Propuesta presentada con el perfil horario real de sus llamadas' },
    { accion: 'La puerta del Ayuntamiento: IMPAS es uno de los organismos descentralizados del Municipio de Chihuahua. Una cuenta bien llevada aquí abre las demás dependencias', responsable: 'Dirección / Dan', criterio: 'Caso de éxito documentado y presentado al Municipio' },
  ],

  areas_oportunidad: [
    { area: 'Recuperar la medición', impacto: 'Ocho meses sin un registro en la 4ª cuenta de la cartera', responsable: 'Ingeniería' },
    { area: 'El enrutamiento del 072', impacto: '0 de 352 llamadas llegaron a una persona', responsable: 'Ingeniería / IMPAS' },
    { area: 'Las tres UBR con teléfono propio', impacto: 'Tráfico del cliente que puede no estar pasando por nosotros', responsable: 'Dan' },
    { area: 'Reporte por servicio', impacto: 'Materia de informe para un organismo que rinde cuentas públicas', responsable: 'Producto' },
    { area: 'IA de Voz fuera de horario', impacto: 'Tráfico en 22 de 24 horas contra un horario administrativo de 8:00 a 15:00', responsable: 'Dan' },
    { area: 'El resto del Ayuntamiento', impacto: 'IMPAS es uno de varios organismos del mismo municipio', responsable: 'Dirección' },
  ],

  perfiles: [
    {
      nombre: 'C.P. Miguel de los Santos Arévalo', rol: 'Subdirector administrativo — IMPAS', color: '#22c55e',
      campos: [
        { label: 'Correo',     value: 'miguel.delossantos@mpiochih.gob.mx' },
        { label: 'Extensión',  value: '(614) 200-4800 ext. 2255' },
        { label: 'Por qué él', value: 'En un organismo público, contratación, renovación y presupuesto pasan por la subdirección administrativa' },
        { label: 'Estado',     value: '✓ CAPTURADO en `contactos_json` el 13 oct 2026, segundo de los 15 registros. Estuvo publicado en el directorio municipal desde antes del alta y nadie lo consultó en diez meses.' },
      ],
    },
    {
      nombre: 'Dr. Luis Antonio Arrieta Trevizo', rol: 'Director general — IMPAS', color: '#6366f1',
      campos: [
        { label: 'Correo',     value: 'antonio.arrieta@mpiochih.gob.mx' },
        { label: 'Extensión',  value: '(614) 200-4800 ext. 2264' },
        { label: 'Patrocinio', value: 'Es el patrocinador ejecutivo potencial de la cuenta' },
        { label: 'Corregido',  value: '✓ 13 oct 2026. La ficha registraba como director a «Lic. Erick Lucero» con teléfono 0000000000; hoy trae su nombre, «Director general», su correo institucional y la ext. 2264. No queda rastro del dato falso.' },
      ],
    },
    {
      nombre: 'Luis Álvarez', rol: 'Contratante — el único contacto que la ficha tenía útil', color: '#f59e0b',
      campos: [
        { label: 'Correo',  value: 'luisalvarez21@yahoo.com.mx (correo personal, no institucional)' },
        { label: 'Teléfono', value: '614 132 2909' },
        { label: 'Estado',  value: 'No responde a los correos, según las observaciones del 11 sep 2026' },
        { label: 'Lección', value: 'Un contratante con correo personal no es una vía de contacto institucional. El directorio oficial sí.' },
      ],
    },
    {
      nombre: 'Dan', rol: 'Asesor SAC de la cuenta — Callpicker', color: '#22c55e',
      campos: [
        { label: 'Actividades',  value: '3 registradas · 3 completadas' },
        { label: 'Lo que vio bien', value: 'Identificó el menú por escrito DOS veces: el 7 sep —«aparecen como perdidos O PERMANECEN EN MENÚ, sin evidencia de llamadas atendidas»— y en el Radar del 11 sep. La v1.1 le atribuía la lectura contraria.' },
        { label: 'Dónde se atascó', value: 'Buscó en LinkedIn y no halló nada. Para una dependencia de gobierno la fuente es el directorio oficial.' },
        { label: 'Con qué trabajaba', value: 'Con la facturación en $0, sin llamadas desde enero y sin consumo. El hueco no es suyo.' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      'Diez facturas en diez meses, cero incidencias de pago, GRC «MRR estable» y clasificación AAA',
      'El cliente está AMPLIANDO usos: publicó una extensión nueva para citas dentales en septiembre de 2026',
      'Un solo ticket en toda la relación, sin falla técnica, resuelto en 42 horas',
      'El directorio de decisores es información pública, completa y verificable',
      'Es un organismo del Municipio de Chihuahua: la referencia abre otras dependencias',
    ],
    oportunidades: [
      'Tres Unidades Básicas de Rehabilitación con teléfono propio publicado: posible tráfico fuera de nuestro servicio',
      'No tiene IA de Voz, Chat, IA de Chat ni integración API contratados',
      'Tráfico en 22 de 24 horas contra un horario administrativo de 8:00 a 15:00',
      'Un organismo que rinde cuentas públicas necesita reportes de atención por servicio, y hoy no los tiene',
    ],
    debilidades: [
      'La ficha tenía el importe en $0 durante diez meses, contradiciendo al propio motor de la casa, que la había puesto en el TOP 25',
      'Cero llamadas registradas desde el 21 de enero y cero meses de consumo medible',
      'De 352 llamadas medidas, ninguna llegó a una persona. El tablero no lo tapa —KPI «—» y veredicto EN SILENCIO en rojo—, pero la palabra «contestada» sigue sin distinguir quién contestó',
      'Ninguna reunión en diez meses · score relacional 27 (el 9.º más bajo de 40 auditorías) · y un Radar COMPLETO que desde el 11 de septiembre dice «riesgo de cancelación» y pide escalamiento, sin que nadie escalara',
      'El director registrado en la ficha NO era el director y su teléfono era 0000000000 — corregido el 13 oct 2026, diez meses después del alta',
      'El 96.7% del contrato depende de un solo producto',
    ],
    amenazas: [
      'EL 96.7% DEL CONTRATO ES UNA SOLA LÍNEA. Si el número de marcación corta se va, se va la cuenta completa: no hay nada que retenga al cliente por los lados.',
      'Es un organismo público: contratación y renovación van por ciclo presupuestal, y un cambio de administración municipal puede reabrir decisiones que un cliente privado no reabre',
      'Si la línea de crisis 24/7 viaja sobre este servicio, una llamada que no llega a una persona deja de ser una métrica de SLA',
      'El riesgo no es que no haya aviso —hay dos alertas abiertas, veredicto EN SILENCIO y un Radar que pide escalamiento— sino que los avisos no mueven a nadie',
      'Diez meses sin una reunión en una cuenta de $65,640 al mes: no hay relación que amortigüe una mala experiencia',
    ],
  },

  conclusion: 'IMPAS no es una cuenta en problemas: es una cuenta que no estábamos mirando, y el motivo es trivial y caro a la vez. Su facturación quedó en cero al importarla, y con el cero desapareció de todas las listas que el tablero ordena por dinero. Diez meses pagando $65,640 puntualmente, sin una reunión, sin una llamada registrada desde el 21 de enero y sin un mes de consumo medible.\n\nLo que sí se midió dice algo que hay que llevar a la conversación con cuidado: de 352 llamadas entrantes, ninguna llegó a una persona y no hubo un solo minuto de conversación. Puede ser un enrutamiento que termina en un menú sin salida, o puede ser que la transferencia ocurra fuera de nuestra vista. No lo sabemos, y es exactamente por eso que es la primera pregunta. Y hay que decirlo con la misma precisión que la v1.2 puso en el resto del expediente y aquí se le quedó sin barrer: el tablero NO encendió ninguna luz verde sobre esta cuenta. El KPI «Sin contestar» imprime «—» porque `cerrado` viene null, el veredicto del módulo es EN SILENCIO en rojo y la cuenta es la #1 de la cola de riesgo de su asesor. El «0%» existe sólo como etiqueta neutra en la barra de enero, con su tooltip entero al lado. Lo que sí hay que arreglar es la palabra: una tasa de perdidas del 0% no dice que alguien atendiera, y eso muerde en las cuentas que SÍ traen tasa.\n\nY hay una pregunta que va antes que todas las demás: si la línea de atención a crisis 24/7 del organismo viaja sobre este servicio, entonces esto no es un asunto de calidad de atención. Hay que confirmarlo o descartarlo esta semana, sin suponer ninguna de las dos cosas.\n\nLa parte alentadora es que el cliente está vivo y creciendo en usos —publicó una extensión nueva en septiembre— y que el camino para hablar con él estaba abierto todo el tiempo. El asesor dejó escrito que no encontraba a nadie después de buscar en LinkedIn; el cliente es una dependencia municipal y su directorio, con catorce funcionarios, sus cargos, sus correos y sus extensiones, lleva meses publicado en un sitio del gobierno. Esa es la lección que deja este expediente y no es sobre IMPAS: para un cliente privado, LinkedIn es una fuente razonable; para una dependencia de gobierno, el directorio oficial es la fuente, y es mejor.',

  pierde: [
    'Callpicker pierde $65,640 al mes si esta cuenta no renueva — la segunda mayor de las que cruzan por CID.',
    'Y lo perdería de golpe: el 96.7% del contrato es una sola línea, el número de marcación corta.',
    'Se pierde la puerta al resto del Ayuntamiento de Chihuahua, que tiene más organismos descentralizados.',
    'Y se perdería CON aviso, que es peor: dos alertas abiertas, veredicto EN SILENCIO y un Radar que desde el 11 de septiembre pide escalamiento por riesgo de cancelación.',
  ],

  gana: [
    'Corregir el importe pone la ficha de acuerdo con el resto del tablero: el motor ya la tenía en el TOP 25 desde el 6 de octubre, pero quien abría la cuenta leía $0.',
    'No tiene contratados IA de Voz, Chat, IA de Chat ni API: la base para crecer está entera.',
    'Las tres UBR con teléfono propio son una ampliación concreta y verificable, no una hipótesis.',
    'Un reporte de atención por servicio es, para un organismo que rinde cuentas, un entregable de valor directo que hoy nadie le da.',
  ],

  recomendacion_central: 'ESTA SEMANA, Y EN ESTE ORDEN.\n\nPRIMERO, UNA PREGUNTA QUE NO ADMITE ESPERA: ¿la línea de atención a crisis 24/7 del organismo —«Hablar Salva Vidas»— viaja sobre nuestro servicio? No está confirmado y no se debe suponer en ninguna dirección. Si la respuesta es que sí, que de 352 llamadas ninguna haya llegado a una persona deja de ser un indicador de SLA y pasa a ser lo primero de la agenda de toda la cuenta. Si es que no, se descarta en una frase y se sigue con lo demás.\n\nSEGUNDO, HACIA DENTRO: corregir el importe de la ficha, de $0 a $65,640. Es un campo, y es lo que ha hecho que quien abra la ficha de la cuarta cuenta de la cartera lea que no factura nada. En la misma pasada, averiguar con Ingeniería por qué no hay una sola llamada desde el 21 de enero ni un mes de consumo: hoy, de esta cuenta, no se puede afirmar nada sobre su operación.\n\nTERCERO, HACIA FUERA, Y POR LA PUERTA CORRECTA: escribir al subdirector administrativo, el C.P. Miguel de los Santos Arévalo (ext. 2255), que en un organismo público es quien lleva contratación y presupuesto, y al director general, el Dr. Luis Antonio Arrieta Trevizo (ext. 2264). Los dos están publicados con correo institucional en el directorio del Municipio. Y abrir con la pregunta técnica, no con el reproche: «no estamos viendo su tráfico desde enero y queremos entender por qué» es un problema nuestro, no una acusación al cliente — y es verdad.\n\nY UNA COSA QUE NO ES DE ESTA CUENTA pero que conviene dejar bien dicha, porque la v1.1 la dijo mal: la palabra «contestada» no distingue quién contestó. En ESTA cuenta el módulo se portó bien —`cerrado` null, KPI «—», veredicto EN SILENCIO en rojo, primera en la cola de riesgo— así que aquí no hubo ninguna luz verde. El defecto muerde donde sí hay tasa: Tech People publica 6.21% de perdidas y sólo el 44.40% de sus llamadas llega a una persona. Ahí es donde hay que separar «contestada por una persona» de «contestada por el menú».',

  auditoria_servicio: {
    fuente: 'Zoho Desk — 1 ticket de «IMPAS Municipio Chihuahua» (CID 177810) en lib/tickets-data.json',
    periodo: 'Octubre 2026 · la fuente trae SÓLO tickets CERRADOS, así que «abiertos» no es medible aquí',
    diagnostico: 'No hay nada que auditar en servicio, y eso es el hallazgo. UN ticket en diez meses —folio 116939—, de categoría «Administrativo (voz)» y subcategoría «Facturación y Pagos (voz)», sin falla técnica, resuelto en 42 horas. El producto no le ha fallado a este cliente. Pero el dato tiene una segunda lectura que importa más: ese ticket es de OCTUBRE, posterior a las observaciones del 11 de septiembre que daban al cliente por ilocalizable. O sea que el cliente SÍ responde — por la vía de la factura. Es la única vía de contacto que ha funcionado en toda la relación, y nadie la aprovechó para abrir una conversación.',
    metricas: [
      { metrica: 'Tickets totales',       valor: '1 (oct 2026)',          lectura: 'En diez meses de relación. No hay patrón que leer.' },
      { metrica: 'Fallas del servicio',   valor: '0 · 0.0%',              lectura: 'El producto no ha fallado' },
      { metrica: 'Subcategoría',          valor: 'Facturación y Pagos · 100%', lectura: 'El único contacto del cliente con la mesa fue por su factura' },
      { metrica: 'Tiempo de resolución',  valor: '42 horas',              lectura: 'Dentro de lo razonable. Con un solo caso no hay mediana que valga.' },
      { metrica: 'Tickets de más de 7 días', valor: '0 de 1',             lectura: 'Nada atascado' },
    ],
    reincidencias: [
      { patron: 'Facturación y Pagos (voz)', veces: '1 · 100%', causa: 'No es reincidencia, es el único caso. Importa por su fecha: es de octubre, posterior a las observaciones que daban al cliente por ilocalizable. El cliente responde cuando se trata de su factura.' },
    ],
    hallazgos: [
      'Un solo ticket en diez meses NO es un dato excepcional en esta cartera, y la v1.2 lo publicaba como si lo fuera. En `lib/tickets-data.json` hay 1,649 CIDs distintos y 611 de ellos —más de uno de cada tres— traen exactamente UN ticket. Entre las cuentas que ya tienen auditoría escrita —40 de las 42 referencias de `registry.ts` tienen cuenta en cartera con CID— hay TRES con MENOS, y la v1.3 publicó dos: ECODELI (C2, CID 164581) con CERO sobre 289,238 entrantes medidas, OOAPAS (D2, 167954) con CERO sobre 2,633, y Finsus Growth (F1, 139590) con CERO sobre una única entrante medida. Finsus faltaba por aplicar el mapeo del registry a medias: ese mapeo es el que ata el caso `finsus` a F1 —la ÚNICA cuenta Finsus que existe en `cuentas`, porque los CIDs que cita su expediente no están en cartera— y es el mismo con el que esta misma frase cuenta a Sección Amarilla. Usarlo para una y no para la otra era acomodar el método. Y dos más empatadas en uno con IMPAS: Dental District (Z54, 162151) y Sección Amarilla (F3, 12526). El conteo de esta cuenta sí está verificado —folio 116939, octubre de 2026—; lo que no se sostenía era el superlativo. Lo que el dato sí dice, sin adornarlo: no hay problema de servicio que auditar, y tampoco hay relación.',
      'El ticket es posterior a las observaciones KAM que declaraban al cliente ilocalizable. La contradicción entre las dos fuentes no se resolvió: se quedó escrita.',
      'Con un denominador de 1, ninguna métrica de servicio de esta cuenta es interpretable. Se publican para que conste que se miraron, no para concluir.',
    ],
  },
}
