import type { AuditoriaCase } from './types'

/**
 * GRUPO TORRES CORZO (D1 · CID 130723) — la cuenta mayor de la cartera POR
 * UN CAMINO DE MEDICIÓN de los tres que hay. Cuál, y por qué importa, en la
 * v1.5: por CID la #1 es Tech People, y sumando grupos a mano es Finsus.
 *
 * Primera auditoría, 12 oct 2026. Se pudo escribir porque ese mismo día entró
 * la lectura de llamadas de esta cuenta: hasta entonces el tablero decía «no
 * tenemos sus llamadas» y mandaba al asesor a pedirle el Excel al cliente.
 *
 * v1.5 — LO QUE DIJO MAL LA v1.4 Y QUÉ MIDE LA FUENTE (13 oct 2026)
 * -----------------------------------------------------------------
 * Esta ronda tumba una TESIS CENTRAL del expediente —el superlativo «la cuenta
 * más grande de la cartera, y con diferencia»— y corrige once cifras más. Lo
 * que cambia no es el riesgo: es qué se puede AFIRMAR y por qué camino se mide.
 *
 *   1. «LA CUENTA MÁS GRANDE DE LA CARTERA, Y CON DIFERENCIA» · NO SE SOSTIENE
 *      TAL CUAL. Agrupadas las 3,608 filas de `data/grc-zoho.json` con la regla
 *      institucional, hay TRES lecturas y las tres son ciertas:
 *        · POR CID EN EL GRC —que es como cruza el tablero— la #1 es TECH
 *          PEOPLE (C1, cid 2094) con $88,783.20 en dos filas. Le siguen IMPAS
 *          (Z63) $65,640, University 4 People (D58) $54,060, Finsus Growth (F1)
 *          $38,215 y ECODELI (C2) $32,740. GTC no aparece: sus 19 líneas no
 *          traen CID y no cruzan.
 *        · SUMANDO A MANO LOS GRUPOS, la mayor es FINSUS con $278,154 — por
 *          encima de los $272,436 de GTC del corte del 2 de octubre.
 *        · LO QUE PUBLICA EL TABLERO para GTC son $316,541, que es su promedio
 *          de vida y no un MRR.
 *      Así que GTC es la mayor por el camino de sumar grupos a mano, y sólo
 *      tomando su última lectura institucional. El calificativo va ahora en
 *      TODOS los sitios donde estaba el superlativo pelado.
 *
 *   2. GTC SUMA $0 EN EL CORTE VIGENTE, Y LOS $272,436 SON SU ÚLTIMO MRR
 *      INSTITUCIONAL MEDIDO. La regla de dirección del 13 oct rescata con
 *      `mrrIni` las líneas marcadas churn cuya `verificacion` dice
 *      `sigue_viva`. Las 13 líneas vivas de GTC dicen `sin_verificar`, así que
 *      la regla NO las rescata: su MRR institucional del corte del 11 de
 *      octubre es CERO. Los $272,436 son el `mrrFin` del respaldo del 2 de
 *      octubre —la última lectura institucional que existe— y a la vez el
 *      `mrrIni` del vigente. Todo el 13.42% descansa en eso y en que el importe
 *      se suma A MANO, y así hay que nombrarlo.
 *
 *   3. LA BASE DEL 13.42% CONTABA A GTC DOS VECES. La v1.4 decía «172 cruzan
 *      por CID; 12 sólo tienen ficha ($171,999); GTC es una de esas 12»: las
 *      tres cosas no caben juntas. Medido con `scripts/mide-peso-cartera.py`:
 *      SIN forzar GTC son 171 cuentas con MRR del GRC ($1,758,279) y 13 sólo
 *      ficha ($488,540, de los que $316,541 son de GTC); FORZANDO su $272,436
 *      son 172 con MRR ($2,030,715) y 12 sólo ficha ($171,999 = 488,540 −
 *      316,541). O sea que GTC está DENTRO de las 172 y las 12 de $171,999 NO
 *      la incluyen. El 13.42% no cambia; la composición de la base sí, y es lo
 *      que la regla del MRR institucional obliga a declarar entera. La mayor de
 *      esas 12 es Sección Amarilla (F3, cid 12526), con $84,254 de promedio de
 *      vida — y su MRR institucional de verdad son $32,375, el `mrrIni` de su
 *      línea «ADSA», que llega sin CID y con `sigue_viva`.
 *
 *   4. «($1,531,795 + GTC)» · EL PARÉNTESIS DESCRIBE UNA SUMA YA HECHA. El
 *      denominador del estado `activo` ya lleva a GTC dentro: 132 cuentas, de
 *      las que 115 tienen MRR del GRC y suman $1,531,795 ($1,259,359 sin ella
 *      más $272,436). El 17.79% sale de ahí; sumarla otra vez daría 15.10%.
 *
 *   5. EL 17.2% NO ES EL MARTES: ES EL MIÉRCOLES, y no es cosmético porque la
 *      meta del plan del lunes se calculaba contra él. Medido en `dow`/`dowL`
 *      del CID 130723 (índice 0 = lunes, `weekday()` de Python): lunes 43.31%,
 *      martes 29.39%, miércoles 17.17%, jueves 17.50%, viernes 18.79%, sábado
 *      26.02%, domingo 33.91%. Las dos series cierran contra sus totales
 *      (208,255 entrantes y 57,274 perdidas). Llamar «martes» al 17.2% inflaba
 *      el volumen recuperable del lunes en unas 6,530 llamadas.
 *
 *   6. HALLAZGO NUEVO, Y ES EL MISMO DEFECTO QUE ESTA AUDITORÍA DENUNCIA: GTC
 *      NO ES EL ÚNICO GRUPO PARTIDO EN LÍNEAS SIN CID. SIETE líneas «Finsus …»
 *      suman $278,154 institucionales y sólo una trae CID; VEINTICINCO líneas
 *      «Petroil …» suman $80,049 y sólo una trae CID. Va al cuerpo como
 *      PREGUNTA PARA DIRECCIÓN y no como afirmación, porque la nota que lo
 *      confirmaría —`lib/grc-asesor-alias.ts`, 22 sep 2026— nombra sólo dos de
 *      las siete líneas de Finsus.
 *
 *   7. Y lo demás que no cerraba: la cita del 10 de julio dice «tiempo de
 *      respuesta» y se publicaba «tiempo de atención»; el `redir` del destino
 *      sin registrar es 5, no 0; «Carretera 57» es etiqueta de DID y no un
 *      destino de llamadas; la junta del 4 de septiembre tuvo CINCO
 *      participantes, no tres; el folio 106428 no está en el JSON de tickets
 *      sino en el corte de mesa del 5 de octubre; las agencias del GRC nombran
 *      un SEXTO estado, Querétaro, y no nombran Zacatecas ni Aguascalientes;
 *      hay DIEZ cuentas vivas con más sedes que las 32 de GTC, no cinco casos
 *      —y una de las cinco que citaba, Travelling, está en `hibernacion`—; y la
 *      debilidad del FODA seguía contando «19 interlocutores».
 *
 * v1.4 — LO QUE DIJO MAL LA v1.3 Y QUÉ MIDE LA FUENTE (13 oct 2026)
 * -----------------------------------------------------------------
 * Esta ronda cerró los hallazgos MENORES de la verificación adversarial. No
 * tumban la tesis del expediente —la descentralización sigue siendo el marco—
 * pero cambian cifras que ya se habían publicado y repartos que no cerraban:
 *
 *   A. «19 LÍNEAS, UNA POR AGENCIA» · NO. Son 19 líneas, de ellas TRECE vivas,
 *      y ni 19 ni 13 son un censo de agencias.
 *      Medido en el respaldo del 2 oct: 13 activas (`mrrIni` > 0) y SEIS
 *      «Desactivado». Y hay SOLAPE, que es lo que rompe el «una por agencia»:
 *      CARRANZA y LOMAS están desactivadas por separado porque su territorio
 *      lo cubre hoy la línea ACTIVA «CARRANZA, LOMAS». Además «GTC - Oleksei»
 *      no es una agencia: es una reestructura de facturación ($3,162,450
 *      acumulados en 17 meses, «Desactivado + Reestructura en facturacion»).
 *      En sentido contrario, los 386 DIDs del CID 130723 traen plazas que NO
 *      están entre las 19 —Carretera 57, Chapultepec, Distribuidores Nissan
 *      SLP, BMW Seminuevos, Mini, Corporativo—, así que las 19 líneas tampoco
 *      son el censo de sedes. Donde se leía «19 agencias» y «diecinueve
 *      decisiones» ahora se lee trece vivas de diecinueve líneas.
 *
 *   B. «SÓLO 3 DE 22 DOBLARON VOLUMEN» · NO, DOS. Medido sobre la entrega de
 *      oct-2026: son 67 cuentas, de las que 22 tienen septiembre medible con
 *      al menos 300 entrantes —recorte que la v1.3 usaba sin declararlo—. De
 *      esas 22 doblan DOS: el CID 164410 (2.75x) y Torres Corzo (2.21x); la
 *      tercera más alta se queda en 1.84x. La mediana 0.94x sí se reproduce.
 *
 *   C. «DOBLÓ EL VOLUMEN Y TRIPLICÓ LA PÉRDIDA» · NO TRIPLICÓ. La tasa pasó de
 *      20.29% a 55.50%: ×2.73. Contado en llamadas perdidas el múltiplo es
 *      ×6.05 (24,341 en septiembre contra una media previa de 4,024 al mes).
 *      Ninguna de las dos lecturas es «triplicar», y ahora van con su nombre.
 *
 *   D. «LOS $323,584 SALEN DE LAS 19 LÍNEAS» · NO: DE LAS 13 ACTIVAS. El
 *      promedio `acumulado ÷ meses` de las 19 líneas da $551,706. Los
 *      $323,584.5 son ese mismo promedio sobre las 13 de `mrrIni` > 0. El
 *      diagnóstico del error de la v1.1 seguía siendo bueno; el universo no.
 *
 *   E. «ESTA CUENTA ES INVISIBLE PARA EL TABLERO» · SÓLO EN EL GRC. Por CID la
 *      encuentran todas las demás fuentes de este mismo expediente: los 203
 *      tickets, los 20 cortes de mesa de ayuda (que `lib/mesa-ayuda.ts` cruza
 *      «POR CID, NUNCA POR NOMBRE»), la lectura entera de llamadas, los nueve
 *      cortes de consumo y los 386 DIDs. Lo invisible es su DINERO —que es
 *      justo lo que dimensiona el riesgo—, pero decirlo entero era un falso.
 *
 *   F. ALERTAS: SON TRES, NO DOS, y la que faltaba es la más grave. El cuerpo
 *      enumeraba sólo las dos de familia «ceguera» del 6 de octubre. La
 *      tercera es `sac_atraso_cronico`, condición «mesa», familia riesgo,
 *      severidad CRÍTICA, abierta el 12 de octubre. Ya está en la cronología,
 *      en los hallazgos y en la señal de alarma.
 *
 *   G. «UN TERCIO DEL VOLUMEN ES DE CHAT (69 + 9)» · SON 81 DE 203, el 39.9%,
 *      o sea DOS QUINTOS. El desglose de la v1.3 sumaba 78 y perdía tres
 *      tickets: activación, capacitación y administrativo, los tres «(chat)».
 *
 *   H. LA CITA DEL PLAN DE NUMERACIÓN NO ES DE LA REUNIÓN DEL 4 DE SEPTIEMBRE.
 *      «Después de ese bloque ya no podremos seguir ofreciendo nuevas
 *      asignaciones bajo este esquema» está en el SEGUIMIENTO del 14 de
 *      septiembre, el correo de Daniel Martínez. La reunión toca el tema con
 *      otras palabras: «la escasez de números disponibles en el plan nacional
 *      de numeración».
 *
 *   I. «EL CASO DE USO MULTI-SEDE MÁS GRANDE DE LA CARTERA» · NO LO ES. Las 32
 *      oficinas son correctas (`num_oficinas` = 32); el superlativo no. Y la
 *      lista de la v1.4 tampoco cerraba —lo corrige la v1.5—: medido sobre
 *      `cuentas.num_oficinas`, con 158 de las 193 vivas con el campo poblado
 *      y 35 vacío (que no se mide), son DIEZ las cuentas vivas que leen por
 *      encima de 32: Agua Inmaculada (C17) más de 1,800 sucursales y
 *      franquicias, Grupo Petroil (F32) 300 puntos en 24 estados, Tech People
 *      (C1) más de 100 ubicaciones operativas, EHI GLOBAL (D8) 73 oficinas,
 *      GRUPO FRISA (F16) 50, brandgroup (C15) más de 40, Alianza Multimarca
 *      (D4) 38, KIVA (F15) 38 sitios, Gas Económico Metropolitano (C3) 35
 *      estaciones y ECODELI (C2) al menos 33. Travelling (C16), con 43, está
 *      en `hibernacion`: NO es cartera viva y la v1.4 lo enumeraba como si
 *      lo fuera.
 *
 *   J. HALLAZGO NUEVO, que no venía en la lista: EL MES DE LOS 927 TAMBIÉN
 *      ESTABA CORRIDO. La regla de que un corte mide el MES ANTERIOR se aplicó
 *      a la serie de consumo y se dejó sin aplicar a la de visitas al panel.
 *      Los 927 son el promedio de los cortes del 1 de junio, 1 de julio y 1 de
 *      agosto (1,064 + 909 + 808), cuyo `Periodo` dice mayo, junio y julio. La
 *      v1.3 los llamaba «junio, julio y agosto». La ventana sí era la buena
 *      —927.0 exacto, y config+reportes de esos tres cortes da 122.0, que es
 *      la otra cifra que el expediente publica—: lo que estaba mal eran los
 *      meses con que se nombraba. Corregido en resultado_positivo y en
 *      foda.fortalezas.
 *
 * Lo que corrigió la v1.3 —los doce hallazgos graves— sigue en pie y no se
 * tocó: los 67 meses, el 13.42% sobre MRR institucional, las DOCE líneas que
 * venían creciendo, la serie de consumo corrida un mes, el 59.61%/61.08% de
 * los tres agentes, la fecha del folio 106428, Daniel Martínez del lado
 * Callpicker, los flags `tiene_*` que no son medición y los 927 de SEIS
 * secciones del panel.
 *
 * v1.2 — LO QUE CAMBIÓ Y POR QUÉ
 * ------------------------------
 * Dirección aportó el dato que reordena el expediente entero: el cliente pidió
 * DESCENTRALIZAR su cuenta, y hoy cada agencia responde por su propia
 * comunicación. La v1.1 leía los mismos números como un colapso de servicio.
 * Con la descentralización encima son la foto de una transición a medio hacer,
 * y tres hechos que estaban sueltos encajan: la capacidad de atender plana, las
 * 19 líneas de facturación sin CID, y el CID que desapareció del corte.
 *
 * Y se corrigieron TRES cifras que la v1.1 daba por buenas:
 *
 *   1. El MRR. La v1.1 decía «$316,541 según la ficha, $323,584 según el GRC,
 *      que es la fuente buena». Falso: los $323,584 salen de sumar
 *      `acumulado ÷ meses` de las TRECE LÍNEAS ACTIVAS —las de `mrrIni` > 0—,
 *      que dan $323,584.5 al centavo; sobre las 19 líneas ese mismo promedio
 *      da $551,706, así que el universo que citaba la v1.2 tampoco era el
 *      bueno (lo corrige la v1.4). Es el MISMO promedio de vida que la propia
 *      auditoría critica — refrescado, no corregido. El mes
 *      vigente de verdad son $272,436, y lo confirman DOS cortes: es el
 *      `mrrFin` del respaldo del 2 oct y el `mrrIni` del corte del 11 oct.
 *
 *   2. El peso en la cartera. Lo arregló la v1.3 y el error era de los que
 *      se esconden a la vista: la v1.2 publicaba «el 23.3%» con los
 *      $316,541 de la ficha —el promedio de vida que ella misma declaraba
 *      equivocado— mientras el párrafo de al lado decía que el MRR bueno
 *      son $272,436. La cifra mala y su corrección convivían en el mismo
 *      archivo y el porcentaje salía de la mala.
 *
 *      MEDIDO el 13 oct con `scripts/mide-peso-cartera.py`, y con el
 *      denominador que mandó dirección ese mismo día: **el MRR de Gross
 *      Revenue Facturación es el institucional**, nunca
 *      `cuentas.facturacion`, que guarda `acumulado ÷ meses`. La cartera
 *      viva —193 cuentas en `activo` o `en_riesgo`, la definición de
 *      `topDeCartera`— tiene un MRR institucional de $2,030,715, así que
 *      GTC con $272,436 es el 13.42%. Y sobre el estado `activo` es el
 *      17.79%: 132 cuentas, de las que 115 tienen MRR del GRC y suman
 *      $1,531,795 — con GTC YA DENTRO ($1,259,359 sin ella más $272,436).
 *      La v1.2 escribía «($1,531,795 + GTC)» y ese paréntesis describe una
 *      suma que ya está hecha; repetirla daría 15.10%.
 *
 *      Y la base hay que decirla ENTERA, porque no cubre a todos y porque
 *      la v1.4 contaba a GTC dos veces. Medido sin forzarla: 171 cuentas
 *      cruzan por CID con el GRC ($1,758,279) y 13 sólo tienen la cifra de
 *      la ficha ($488,540, de los que $316,541 son de GTC). Sumando a mano
 *      su $272,436 —sus 19 líneas no traen CID— son 172 con MRR
 *      institucional ($2,030,715) y 12 sólo ficha ($171,999 = 488,540 −
 *      316,541), más 9 que no tienen nada y no se suman como cero. O sea
 *      que GTC está DENTRO de las 172, y las 12 de $171,999 NO la
 *      incluyen. La mayor de esas 12 es Sección Amarilla (F3, cid 12526),
 *      con $84,254 de promedio de vida; su MRR institucional de verdad son
 *      $32,375 —el `mrrIni` de su línea «ADSA», que llega sin CID y con
 *      `sigue_viva`— y a ella nadie se lo ha sumado a mano.
 *
 *   3. El giro. «Red de concesionarias Nissan» se queda corto: las líneas de
 *      facturación nombran BMW, MG e INFINITI además de Nissan.
 *
 * TODAS las cifras salen de fuente y están verificadas una por una:
 *   · llamadas  → app/cuentas/llamadas-data.ts, CID 130723 (entrega oct-2026)
 *   · tickets   → lib/tickets-data.json, 203 filas de «GTC Contact Center»
 *   · alertas   → alertas_episodios, 3 abiertos
 *   · ficha     → tabla `cuentas`, registro completo
 *   · facturación → data/grc-zoho.json (11 oct) contra su respaldo del 2 oct,
 *                   19 líneas «GTC - …». Se leen las DOS: el corte vigente por
 *                   sí solo dice que esta cuenta paga cero.
 *   · el grupo  → gtc-mx.com y prensa de Nissan Mexicana
 *
 * NOTA DE MÉTODO, porque costó. El nombre de la ficha es «GRUPO TORRES CORZO»
 * y en el GRC se llama «GTC - <agencia>». No comparten UN SOLO token
 * distintivo: «corzo» aparece en CERO nombres del corte y «torres» en cuatro
 * que son de otras cuentas. Ningún cruce automático por nombre la encontrará
 * nunca, y el cruce por CID tampoco, porque las 19 líneas no traen CID. Su
 * FACTURACIÓN sólo se encuentra a mano — y hasta ahí llega el problema: por
 * CID la encuentran todas las demás fuentes de este expediente (los 203
 * tickets, los 20 cortes de mesa de ayuda, la lectura entera de llamadas, los
 * nueve cortes de consumo y los 386 DIDs). Es el hallazgo de facturación, no
 * una nota al pie; pero tampoco es que «la cuenta sea invisible»: lo invisible
 * es su dinero. La v1.3 lo decía de más y la v1.4 lo acota.
 */
export const TORRES_CORZO: AuditoriaCase = {
  id: 'torres-corzo',
  asesor: 'Dan',
  nombre: 'Grupo Torres Corzo Automotriz (GTC)',
  sector: 'Automotriz multimarca — Nissan, BMW, MG e INFINITI en al menos 6 estados',
  fecha_periodo: 'Marzo 2021 – Octubre 2026',
  fecha_auditoria: 'Oct 2026',
  tipo_cliente: 'Cuenta AAA — la mayor SUMANDO GRUPOS A MANO; por CID la #1 es Tech People · EN DESCENTRALIZACIÓN',
  descripcion_contexto: '67 meses de cliente · $272,436 al mes —su ÚLTIMO MRR institucional MEDIDO, el del corte del 2 oct; en el vigente suma $0 sin verificar—, el 13.42% de la cartera viva · DESCENTRALIZÁNDOSE a petición del cliente: 19 líneas de facturación por plaza —trece activas y seis ya apagadas— · 208,255 llamadas entrantes y 594,523 salientes medidas · 203 tickets',
  estado: 'en_riesgo',
  clasificacion: 'CONFIDENCIAL',
  version: '1.5',

  kpis: [
    { label: 'Decisión del cliente',       value: 'DESCENTRALIZAR · 13 líneas vivas de 19', color: '#8b5cf6' },
    { label: 'Las 13 líneas activas, hoy', value: '$272,436 → $0 sin verificar',  color: '#ef4444' },
    { label: 'Sin contestar · septiembre', value: '24,341 de 43,860 · 55.5%',     color: '#ef4444' },
    { label: 'Capacidad de atender',       value: '8,584 → 8,714 (+130)',         color: '#f97316' },
    { label: 'Línea de autos nuevos',      value: '372 de 13,177 · 2.8%',         color: '#f97316' },
    { label: 'Peso en la cartera viva',    value: '13.42% · $272,436 / mes',      color: '#6366f1' },
  ],

  resumen_ejecutivo: 'LA CLAVE DE TODO ESTE EXPEDIENTE ES UNA DECISIÓN DEL CLIENTE: GTC pidió DESCENTRALIZAR su cuenta, y hoy cada agencia es responsable de su propia comunicación. Sin ese dato, los números de esta cuenta parecen un colapso de servicio. Con él, son la foto de una transición a medio hacer — y la pregunta deja de ser «por qué se cayó la atención» para ser «de las trece líneas que seguían activas, cuántas siguen siendo nuestras» — trece, no diecinueve: las 19 son LÍNEAS del GRC y seis vienen ya «Desactivado», dos de ellas (CARRANZA y LOMAS) porque su territorio lo cubre hoy la línea activa «CARRANZA, LOMAS».\n\nGrupo Torres Corzo es la cuenta más grande de la cartera POR UN CAMINO DE MEDICIÓN, y hay que decir cuál porque hay TRES y las tres son ciertas. SUMANDO A MANO LOS GRUPOS que el GRC parte en líneas, GTC es la mayor con $272,436 — y aun así por poco: las siete líneas «Finsus …» suman $278,154. POR CID, que es como cruza el tablero, la #1 es TECH PEOPLE (C1) con $88,783.20, porque las 19 líneas de GTC no traen CID y no cruzan. Y LO QUE EL TABLERO PUBLICA para GTC son $316,541, que es su promedio de vida y no un MRR. Con el camino dicho: los $272,436 son el 13.42% del MRR institucional de la cartera viva —los $2,030,715 que suma Gross Revenue Facturación sobre 172 de las 193 cuentas activas o en riesgo, GTC incluida porque su importe se suma a mano; de las 21 restantes, 12 sólo tienen promedio de vida ($171,999, que no es MRR y no se mezcla) y 9 no tienen nada, y ni unas ni otras se suman como cero—. Una de cada ocho pesos de Customer Success depende de una sola conversación, y la que le sigue POR CID —Tech People, $88,783— factura tres veces menos. Cliente desde marzo de 2021 —67 meses— con 32 oficinas, unos 1,200 empleados y, contra lo que decía la versión anterior de este expediente, NO sólo Nissan: sus líneas de facturación nombran BMW, MG e INFINITI. Su contrato es de Agentes Virtuales, y su teléfono no es un servicio de soporte: es el canal por el que entra quien quiere comprar un coche.\n\nLO PRIMERO, PORQUE ES DE ESTA SEMANA. El corte de Gross Revenue Facturación del 11 de octubre pone las 13 líneas activas del grupo en CERO y las marca «Churn confirmado», así que con la regla institucional aplicada al pie de la letra GTC suma HOY $0: la regla rescata con `mrrIni` las líneas marcadas churn cuya `verificacion` dice `sigue_viva`, y las 13 dicen `sin_verificar`. Por eso los $272,436 de todo este expediente son su ÚLTIMO MRR INSTITUCIONAL MEDIDO, no una lectura del mes en curso. En el respaldo del 2 de octubre esas mismas 13 estaban vivas, sumaban $272,436 y DOCE de ellas venían CRECIENDO («Upsell temporal»); la decimotercera, GTC - INSUR, estaba plana («MRR estable»). Doce más una son las trece. Nueve días separan las dos lecturas y las 13 llevan verificación `sin_verificar`: nadie ha comprobado ninguna. Si la descentralización significa que cada agencia se recontrata por separado, esos ceros son un cambio de forma y no una pérdida. Si significa que se fueron, es el 13.42% de la cartera viva. Hoy el tablero no sabe cuál de las dos cosas es, y por omisión publicaría la segunda.\n\nEN SEPTIEMBRE EL NÚMERO CENTRAL SE ROMPIÓ. Entraron 43,860 llamadas —el doble de su media de enero a agosto— y 24,341 se quedaron sin contestar: 55 de cada 100, contra una base propia del 20.3%. Son 35.2 puntos en un solo mes, y no es efecto del volumen, con el recorte dicho entero: su entrega trae 67 cuentas, y de las 22 que tienen septiembre medible con al menos 300 entrantes —el mínimo que hace comparable la razón— la mediana se movió 0.94x, o sea que la cohorte BAJÓ. Doblaron DOS, y la otra —el CID 164410, 2.75x— mantuvo su pérdida en 17.2%.\n\nLo decisivo es CÓMO se rompió. La atención por una persona NO creció: 8,584 llamadas tomadas en agosto contra 8,714 en septiembre —ciento treinta más— mientras el volumen subía en 25,840. La capacidad de contestar se quedó exactamente donde estaba y todo el excedente cayó del lado perdido. El buzón se multiplicó por 5.5 contra su máximo previo. Eso no es un equipo que se satura: es un equipo que ya no está detrás de ese número. Y un equipo que ya no está detrás de un número es precisamente lo que deja una descentralización a medias.\n\nLas tres extensiones «Nuevos Asesor 1, 2 y 3 Forum» —la línea de venta de autos nuevos— recibieron 13,177 llamadas y sólo 372 las tomó una persona: el 2.8%. Detrás de las no contestadas hay 12,732 números distintos — con la salvedad de que el campo `n` de la fuente cuenta «números distintos que quedaron SIN CONTESTAR» y aquí es la suma de tres destinos, así que es una cota superior: un mismo número pudo marcar a más de uno. Si Forum pasó a responder por su propia comunicación, esas tres extensiones quedaron colgando del conmutador central sin nadie asignado del lado nuevo. El archivo no lo afirma; la secuencia lo sugiere y es la primera pregunta para el cliente.\n\nY HAY UNA COSA QUE EL TABLERO NO PUEDE ARREGLAR SOLO. Las 19 líneas «GTC - …» no traen CID, y el nombre de la ficha —«GRUPO TORRES CORZO»— no comparte un solo token distintivo con «GTC - FORUM»: «corzo» aparece en cero nombres del corte. O sea que la cuenta mayor de la cartera por el camino de sumar grupos a mano es, por CID, invisible para todo cruce automático, y seguirá siéndolo mientras facturación no le ponga CID a esas líneas. El CID central, 130723, además DESAPARECIÓ del Informe de Cortes del 1 de octubre, único de 104 que no reapareció.\n\nDebajo de todo esto hay una cuenta que Callpicker no ve: cero contactos capturados, cero de doce del Radar, una sola reunión y un solo seguimiento en 67 meses. El Health Score es 47 y está medido al 15%.',

  resultado_positivo: 'La cuenta paga y paga bien: 0 incidencias de pago, al corriente, y 67 meses de permanencia ininterrumpida desde marzo de 2021. El cliente no se está yendo por precio ni por cobranza.\n\nLa adopción del producto es real y está medida, aunque el número hay que decirlo con su letra pequeña: los 927 son un valor GUARDADO en `adopcion_producto`, generado el 2 de septiembre sobre los cortes del 1 de junio, 1 de julio y 1 de agosto —(1,064 + 909 + 808)/3— que, como cada corte mide el MES ANTERIOR y la columna `Periodo` lo dice, cubren MAYO, JUNIO Y JULIO (la v1.3 los llamaba «junio, julio y agosto»: es la misma corrección de un mes que ya se hizo en la serie de consumo, y que a ésta se le había quedado sin hacer) y su propia nota aclara que suma SEIS secciones del panel, no dos: configuración, reportes, historial de llamadas, entrantes, salientes y mi extensión. Configuración y reportes solas promedian 122. Y la serie va en caída libre: 3,091 → 1,730 → 1,916 → 1,909 → 1,757 → 1,064 → 909 → 808 → 633. Con eso dicho: la evaluación automática califica ALTO tanto en IA de Voz como en uso del panel, y el volumen sigue siendo alto. Es un cliente que SÍ usa lo que compró — lo cual significa que el problema de septiembre no es de desuso ni de desinterés, sino de capacidad.\n\nY hay un interlocutor activo y técnico: Jorge García, coordinador de desarrollo de proyectos, con correo y teléfono registrados. La reunión del 4 de septiembre fue sustantiva — se habló de incidencias, de una propuesta de ofuscador y de costos de desarrollo. Hay con quién hablar; lo que no hay es un mapa de quién decide.',

  hallazgos: [
    'ESTRUCTURA — EL CLIENTE PIDIÓ DESCENTRALIZAR: cada agencia responde hoy por su propia comunicación. Es el dato que reordena todo lo demás, y no estaba en el tablero: lo aportó dirección. Sin él, los números de esta cuenta se leen como un colapso de servicio; con él, son una transición a medio hacer. Toda conclusión de churn sobre esta cuenta tiene que pasar primero por esta pregunta: ¿de las TRECE líneas que seguían activas el 2 de octubre, cuántas siguen siendo nuestras? (Trece, no diecinueve: las 19 son líneas del GRC y seis ya vienen «Desactivado».)',
    'ESTRUCTURA — La descentralización YA ESTÁ EN EL DINERO, Y EL REPARTO HAY QUE CONTARLO BIEN: el GRC trae 19 líneas «GTC - …», pero NO son 19 agencias vivas. TRECE estaban activas en el respaldo del 2 de octubre —CENTRO MAX, NAVA, «CARRANZA, LOMAS», FORUM, BMW, SENDERO, MG POLIFORUM, MG LOMAS, MATEHUALA, RIOVERDE, INFINITI QRO, INSUR e INFINITI LEON— y SEIS vienen «Desactivado»: CARRANZA, LOMAS, CROSSING, LA JOYA, TLALPAN y «Oleksei». 13 + 6 cierran las 19. Dos cosas que el desglose dice y la v1.3 perdía: CARRANZA y LOMAS figuran desactivadas POR SEPARADO porque su territorio lo cubre hoy la línea activa «CARRANZA, LOMAS» —hay SOLAPE, no una línea por agencia—, y «GTC - Oleksei» no es una agencia sino una reestructura de facturación ($3,162,450 acumulados en 17 meses, movimiento «Desactivado + Reestructura en facturacion»). Y las 19 tampoco son el censo de sedes: los 386 DIDs del CID 130723 traen etiquetas de plazas que no aparecen en ninguna línea —«Carretera 57», «Chapultepec», «Distribuidores Nissan SLP», «BMW Seminuevos», «Mini», «Corporativo»—. NINGUNA de las 19 tiene CID asignado: facturación ya factura por plaza; el tablero sigue viendo una sola cuenta.',
    'ESTRUCTURA — LA CAPACIDAD DE ATENDER NO CRECIÓ CUANDO SE DOBLÓ EL VOLUMEN: 8,584 llamadas tomadas por una persona en agosto contra 8,714 en septiembre —130 más— mientras entraban 25,840 llamadas adicionales. Un equipo que se satura contesta más y falla más; éste contestó lo mismo. Es la firma de un número del que ya nadie se hizo cargo, que es exactamente lo que deja una descentralización sin cerrar.',
    'ESTRUCTURA — El grupo NO es sólo Nissan, y la ficha lo dice mal. Las líneas de facturación nombran BMW, MG (Poliforum y Lomas) e INFINITI (Querétaro y León) además de las agencias Nissan. La v1.1 de esta auditoría repetía «red de concesionarias Nissan» porque eso dicen las `notas` de la ficha; el dinero dice multimarca. Importa para la conversación: son cuatro marcas con cuatro áreas comerciales distintas.',
    'ATENCIÓN — Septiembre 2026: 24,341 de 43,860 entrantes sin contestar (55.5%), contra una base propia de 20.3% de enero a agosto. Deterioro de 35.2 puntos. Son 15,441 llamadas perdidas MÁS de las que esta cuenta normalmente pierde.',
    'ATENCIÓN — EL SALTO NO ES DEL ARCHIVO NI DEL MERCADO, Y LA COMPARACIÓN SE DECLARA ENTERA: la entrega de oct-2026 trae 67 cuentas, y de ellas 22 tienen septiembre medible con al menos 300 entrantes —el mínimo que hace comparable la razón, y que la v1.3 aplicaba sin decirlo—. Sobre esas 22, la razón mediana de septiembre contra su media de enero a agosto es 0.94x: la cohorte BAJÓ. Doblaron DOS, no tres —el CID 164410 con 2.75x y Torres Corzo con 2.21x—; la tercera más alta se queda en 1.84x. Y el contraste está justo ahí: 164410 dobló y su tasa de pérdida se quedó en 17.2% —de hecho bajó desde 19.3%—, mientras Torres Corzo dobló el volumen y su tasa se multiplicó por 2.73 (20.29% → 55.50%). TRIPLICAR NO ES: ni en tasa (×2.73) ni en llamadas perdidas, donde el múltiplo es mayor, ×6.05 —24,341 en septiembre contra una media previa de 4,024 al mes—. La v1.3 decía «triplicó» y no sale de ninguna de las dos lecturas.',
    'COMERCIAL — «Nuevos Asesor 1 Forum», «Nuevos Asesor 2 Forum» y «Nuevos Asesor 3 Forum» recibieron 13,177 llamadas y sólo 372 las tomó una persona. El 2.8%. Las no contestadas vienen de hasta 12,732 números distintos (`n` de los tres destinos, que cuenta números SIN CONTESTAR y se solapa entre destinos: es cota superior, no conteo). Es la línea de venta de autos nuevos de una concesionaria: cada llamada sin contestar es un comprador que llamó y colgó.',
    'ATENCIÓN — El lunes concentra 53,392 llamadas (el 25.6% de la semana) y pierde el 43.3%, contra el 27.5% de la cuenta. Es su día de mayor tráfico y el peor atendido a la vez, y concentra 23,125 de las 57,274 perdidas del año: el 40.4%. LA SEMANA ENTERA, medida sobre `dow`/`dowL` y cerrando las dos series contra sus totales: lunes 43.3%, martes 29.4%, miércoles 17.2%, jueves 17.5%, viernes 18.8%, sábado 26.0%, domingo 33.9%. Su MEJOR día es el miércoles, con 17.2% — y la v1.4 atribuía ese 17.2% al martes, que pierde el 29.4%. (Ojo con la coincidencia: el 17.2% del CID 164410 que cita el hallazgo de la cohorte es otra cosa, su tasa de pérdida de septiembre.) El domingo, con 3,589, es el más flojo en volumen — coherente con el horario de fin de semana de la red.',
    'MEDICIÓN — EL DESTINO SIN REGISTRAR ES MUCHO MÁS GRANDE DE LO QUE PARECE. Trae 72,763 llamadas —el 35% de todo el tráfico de la cuenta—, de las que 11,498 se pierden… y de las 61,265 restantes sólo CINCO llegan a una persona: `redir` es 5 —no 0, como publicaba la v1.4— y son precisamente las cinco que explican los 20 minutos de conversación de todo el bloque. Las otras 61,260 las resolvió el menú (`ivr` 60,867) o murieron en el buzón (393), y 5 + 60,867 + 393 cierran las 61,265. El indicador de perdidas sólo penaliza el 15.8% de ese bloque, así que las sesenta y un mil pasan por atendidas. El archivo no dice por qué. No se le puede atribuir causa sin revisarlo con soporte.',
    'MEDICIÓN — Y POR ESO LA CIFRA QUE DESCRIBE LA CUENTA NO ES EL 27.50%: sólo 84,081 de las 208,255 llamadas llegaron a una persona, el 40.37%. Las otras 124,174 —el 59.63%— las resolvió el menú (60,868), murieron en un buzón (6,032) o se perdieron. Medir la atención con la tasa de perdidas, en esta cuenta, la mejora en treinta y dos puntos.',
    'SERVICIO — 53 de 203 tickets (26.1%) son la MISMA subcategoría: «Ajuste en Flujo (voz)». El patrón está en los tickets, no en una cita: ocho meses pidiendo el mismo tipo de ajuste es una configuración que nunca quedó, o una capacitación que no se dio. AVISO DE MÉTODO, porque la v1.2 lo hizo mal: usaba como prueba de deterioro el análisis del 13 de agosto, cortando la frase a la mitad. El texto completo es «la cuenta muestra en todas sus interacciones solicitando ajustes, cambios o reportes a SAC DE MANERA FAVORABLE EL SLA, NO EXCEDIENDO LA HORA DE RESPUESTA Y SOLUCIÓN»: el asesor estaba VALORANDO BIEN el servicio. La cita se cortaba justo donde cambia de sentido.',
    'SERVICIO — Agosto 2026 cerró 53 tickets, el pico del año y el doble de julio (29). El mes siguiente la operación telefónica colapsó. La secuencia está en el registro; la causalidad no, y no se afirma.',
    'SERVICIO — El folio 106428, «Revisar apertura de conversación con plantilla», lo abrió Ariana Agundis García. Vencía el 3 de mayo de 2026 y su última actividad es del 2 de mayo: esa fecha está CONGELADA en los 20 cortes consecutivos, del 3 de septiembre al 5 de octubre. No es que se atienda despacio — es que al último corte, el del 5 de octubre, nadie lo había tocado en 156 días. Después de esa fecha nadie lo ha medido.',
    'SERVICIO — Es la cuenta que MÁS tickets levanta de toda la cartera: 203 de 6,394, el 3.17%, lugar 1 de 1,647 CIDs. Y aparece con vencidos en los 20 de 20 cortes de la mesa; en dos de ellos (18 y 21 de septiembre) concentró 4 de los 11 vencidos de TODA la mesa de ayuda: el 36%.',
    'SERVICIO — 39 de 203 tickets (19.2%) tardaron más de 7 días en cerrarse. La mediana real es de 42.2 horas, pero la media sube a 203.6 por casos extremos: el #104448 estuvo abierto 3,522 horas (147 días) y otros cuatro superaron los 96 días.',
    'SERVICIO — Sólo 17 de 203 tickets (8.4%) son fallas del servicio. El 91.6% restante es asistencia y ajustes. El problema de esta cuenta no es que el producto falle: es que requiere intervención constante para operar.',
    'RELACIÓN — EL MAPA DE DECISORES YA ESTÁ ESCRITO Y NADIE LO CAPTURÓ. `contactos_json` está vacío, pero en la prosa de la cuenta y de la mesa hay TRES nombres, dos de ellos marcados como decisores: Jorge García (coordinador de desarrollo de proyectos), Christian Torres (DM) y Ariana Agundis García (DM) — ésta última es quien abrió el folio 106428. El trabajo de capturarlos es de media hora y lleva meses sin hacerse.',
    'RELACIÓN — El Health Score 47 está medido AL 15%. Tres de sus cuatro bloques —actividad, adopción y pago— traen 50, que es el marcador por omisión, no una medición. Sólo el relacional (32) está calculado. Y `health_score_historial` tiene cero filas para esta cuenta: no hay con qué comparar si mejora o empeora.',
    'RIESGO ESTRUCTURAL — Hay por escrito un riesgo que no es de uso sino de OFERTA: el agotamiento del plan nacional de numeración. Y son DOS documentos, no uno, porque la v1.3 los confundió y atribuía la cita a la junta. La REUNIÓN del 4 de septiembre nombra el riesgo con sus propias palabras —«la escasez de números disponibles en el plan nacional de numeración y la alta tasa de bloqueo como spam»— y es el motivo de la propuesta de ofuscador. La frase tajante es del SEGUIMIENTO del 14 de septiembre, el correo de Daniel Martínez a Jorge y Christian: «después de ese bloque ya no podremos seguir ofreciendo nuevas asignaciones bajo este esquema». Una red de 32 oficinas que crece necesita números.',
    'COMERCIAL — De esa misma reunión quedó una decisión de inversión ABIERTA y sin fecha: $96,250 MXN + IVA por 77 horas de desarrollo en 4 semanas —el ofuscador, cotizado por Daniel Martínez—, con DIDs a $99 por número como alternativa, cifra que dio José Manuel López, de Callpicker, cuando Christian Torres pidió explorar un inventario propio de líneas. Se acordó preparar una comparativa de planes para que dirección decidiera. Cinco semanas después no hay registro de que se haya decidido.',
    'RELACIÓN — 0 de 12 preguntas del Radar respondidas. La alerta `sin_radar` está abierta desde el 6 de octubre, severidad alta, familia «ceguera». Y PARA QUE LA CUENTA DE ALERTAS CIERRE, porque la v1.3 enumeraba dos como si fueran todas: esta cuenta tiene TRES episodios abiertos en `alertas_episodios`, y el tercero es el MÁS SEVERO de los tres y no es de relación sino de la mesa — `sac_atraso_cronico`, condición «mesa», familia riesgo, severidad CRÍTICA, abierta el 12 de octubre, con esta evidencia: «Aparece con tickets vencidos en 20 de los 20 cortes de la mesa. Hoy el peor es el folio 106428 con 155 días fuera de SLA y 156 sin que nadie lo mueva (Escalado). Corte del 2026-10-05». Su `condicion_desde` dice 2026-05-10, que es la misma fecha retrocalculada que este expediente desmiente en el hallazgo del folio: la fuente no trae apertura. Nota de método sobre las tres: el motor las dimensiona con «$316,541 al mes», que es el promedio de vida de la ficha y no el MRR institucional de $272,436.',
    'RELACIÓN — UNA sola reunión y UN solo seguimiento en 67 meses de relación. El score relacional es 32 sobre 100, el componente más bajo del Health Score (47).',
    'TRABAJO — 4 de las 7 actividades registradas quedaron SIN COMPLETAR: dos llamadas (26 jun, 23 jul), una de tickets (16 jul) y una de KAM (3 jul). Las tres que sí se cerraron son de análisis, no de contacto.',
    'CONSUMO — SU CONSUMO CAYÓ 40.43%, Y EL MES DE CADA CIFRA NO ES EL QUE PARECE. En `data/cortes-facturacion.xlsx` cada corte mide el mes ANTERIOR y la columna `Periodo` lo dice, así que la v1.2 llevaba toda la serie corrida un mes. Leída bien: diciembre de 2025 son 63,898 minutos (127.8% de la bolsa de 50,000 del plan «AV Agentes Virtuales») y enero de 2026 son 50,993 (102.0%) — esos dos REBASARON, y el excedente se cobra. El último corte con este CID es el del 1 de septiembre y cubre AGOSTO: 38,063 minutos, 76.1%. De diciembre a agosto son ocho pasos, no nueve meses, y desde febrero no ha vuelto a acercarse a la bolsa. Y falta lo importante: EL CONSUMO DE SEPTIEMBRE DE 2026 —el mes del que trata toda esta auditoría— NO ESTÁ MEDIDO para este CID, porque no hay corte posterior. Es el mismo hecho que el hallazgo de que desapareció del Informe de Cortes del 1 de octubre. Ninguna alerta ve la caída: el detector mira los últimos cinco cortes y ocurrió antes.',
    'FACTURACIÓN — La cuenta SÍ aparece en Gross Revenue Facturación, en 19 líneas «GTC - …», pero NINGUNA tiene CID asignado. Por eso el cruce automático falla y la ficha dice que no aparece. No es que no esté: es que el tablero no la encuentra.',
    'FACTURACIÓN — NINGÚN CRUCE AUTOMÁTICO PUEDE ENCONTRARLA, Y NO ES POR EL CID SOLAMENTE. El nombre de la ficha es «GRUPO TORRES CORZO» y en el GRC se llama «GTC - <agencia>»: no comparten un solo token distintivo. Medido sobre los 3,608 nombres del corte, «corzo» aparece en CERO y «torres» en cuatro que son de otras cuentas (TorresCabel, Mudanzas Torres, Grupo Torresa, Torres Livet). Cruzar por nombre aquí no da poco: da MAL. Mientras facturación no le ponga CID a las 19 líneas, su IMPORTE EN EL GRC sólo se encuentra a mano. Y el alcance hay que acotarlo, porque la v1.3 lo decía de más: el resto del tablero SÍ la ve por CID —los 203 tickets, los 20 cortes de mesa de ayuda (que `lib/mesa-ayuda.ts` cruza «POR CID, NUNCA POR NOMBRE»), la lectura entera de llamadas, los nueve cortes de consumo y los 386 DIDs cruzan todos por 130723—. Lo que no la encuentra es el reporte de DINERO, que es justo el que dice cuánto está en juego.',
    'FACTURACIÓN — EL CORTE DEL 11 DE OCTUBRE LA DA DE BAJA ENTERA. Las 13 líneas activas pasan de $272,436 a CERO, marcadas «Churn confirmado», las 13 con verificación `sin_verificar`. Nueve días antes, en el respaldo del 2 de octubre, esas mismas 13 estaban vivas por los mismos $272,436 y DOCE venían creciendo («Upsell temporal»); la que faltaba, GTC - INSUR, venía plana («MRR estable»). Una cuenta no pasa de crecer a desaparecer en nueve días sin que haya ocurrido algo nombrable: o es la descentralización recontratando agencia por agencia, o es una baja real. Las dos explicaciones caben en el dato y el dato no distingue. Esto se resuelve ANTES de publicar cualquier churn.',
    'FACTURACIÓN — De los 104 CID que cortan el 1 de septiembre, 103 reaparecen el 1 de octubre. El único ausente es el 130723. La cuenta desapareció del último Informe de Cortes y es la única de su cohorte que lo hizo. Con la descentralización encima, la hipótesis razonable es que el consumo se movió a los contratos por agencia — pero sigue siendo hipótesis.',
    'FACTURACIÓN — EL MRR BUENO ES $272,436 Y LA COLUMNA IMPORTA. El GRC trae cuatro cifras por línea y sólo una contesta «cuánto paga este mes»: `mrrFin`, el recurrente al cierre del periodo. Los $316,541 de `cuentas.facturacion` son `acumulado ÷ meses`, o sea un PROMEDIO DE VIDA. Y OJO —la v1.1 de esta auditoría se equivocó aquí—: los «$323,584 del GRC» que citaba como la cifra buena salen de aplicar ESE MISMO promedio a las TRECE LÍNEAS ACTIVAS —las de `mrrIni` > 0—: $323,584.5 al centavo. Aplicado a las 19 líneas, el promedio da $551,706, de modo que ni la cifra ni el universo que citaba eran los buenos (la v1.2 y la v1.3 decían «las 19 líneas»; lo corrige la v1.4). Era el error refrescado, no corregido. Los $272,436 los confirman dos cortes independientes: es el `mrrFin` del 2 de octubre y el `mrrIni` del 11. Y falta una cosa que la v1.4 no decía: aplicando la regla institucional al CORTE VIGENTE, GTC suma $0. La regla rescata con `mrrIni` las líneas marcadas churn cuya `verificacion` dice `sigue_viva`, y las 13 de GTC dicen `sin_verificar`, así que no las rescata. Los $272,436 son su ÚLTIMO MRR institucional MEDIDO, no el del mes en curso — y así hay que nombrarlos en cualquier reporte de dirección.',
    'FACTURACIÓN — EL PESO EN LA CARTERA ESTABA MAL, Y EL ERROR ERA DE LOS QUE NO SE VEN. La v1.2 publicaba «el 23.3%» y esa cifra NO sale de los $272,436 que ella misma declara correctos: sale de los $316,541 de la ficha, el promedio de vida que la propia auditoría corrige dos párrafos antes. La cifra mala y su corrección convivían en el archivo, y el porcentaje se calculó con la mala. EL DENOMINADOR TAMBIÉN ESTABA MAL, y la regla la fijó dirección el 13 de octubre: el MRR institucional es el de Gross Revenue Facturación —`mrrFin`, o `mrrIni` cuando la línea viene marcada churn pero su `verificacion` dice `sigue_viva`— y nunca `cuentas.facturacion`. Medido así con `scripts/mide-peso-cartera.py`: la cartera viva (193 cuentas `activo` + `en_riesgo`, la definición de `topDeCartera`) suma $2,030,715, y GTC con $272,436 es el 13.42%. Sobre el estado `activo`, el 17.79%: 132 cuentas, de las que 115 tienen MRR del GRC y suman $1,531,795 con GTC YA DENTRO ($1,259,359 sin ella más $272,436) — la v1.2 escribía «$1,531,795 + GTC» y ese «+ GTC» describe una suma ya hecha; repetirla daría 15.10%. Y LA BASE HAY QUE DECIRLA ENTERA, porque la v1.4 contaba a GTC dos veces: sin forzarla son 171 cuentas con MRR del GRC ($1,758,279) y 13 sólo ficha ($488,540, de los que $316,541 son de GTC); sumando a mano su $272,436 son 172 con MRR ($2,030,715) y 12 sólo ficha ($171,999 = 488,540 − 316,541), más 9 sin nada que no se suman como cero. GTC está DENTRO de las 172 y las 12 de $171,999 NO la incluyen — la v1.4 la ponía en los dos lados. La mayor de esas 12 es Sección Amarilla (F3, cid 12526), con $84,254 de promedio de vida: su MRR institucional de verdad son $32,375, el `mrrIni` de su línea «ADSA», que llega sin CID y con `sigue_viva`, y a ella nadie se lo ha sumado a mano.',
    'FACTURACIÓN — PREGUNTA PARA DIRECCIÓN: GTC NO ES EL ÚNICO GRUPO PARTIDO EN LÍNEAS SIN CID, Y ESO LE CAMBIA EL DUEÑO AL SUPERLATIVO. Agrupadas a mano las 3,608 filas del corte vigente con la regla institucional, hay otros dos casos del MISMO defecto que esta auditoría denuncia. (1) SIETE líneas «Finsus …» suman $278,154 al mes —Finsus Producto $121,500, Finsus Crédito al Consumo $93,997, Finsus Growth $38,215, Finsus Cross Selling $17,335 (movimiento «Nuevo»), Finsus Cobranza $4,195, Finsus Crédito $2,912 y Finsus PyME $0; 121,500 + 93,997 + 38,215 + 17,335 + 4,195 + 2,912 + 0 = 278,154— y sólo UNA trae CID: Growth, el 139590, que es F1. El tablero ve $38,215 y no ve $239,939 al mes. (2) VEINTICINCO líneas «Petroil …» suman $80,049 y sólo una trae CID —Prebiem Oceanica, $4,978, que además cruza a Z47 y no a F32, cuya ficha dice $14,197—. Y «ADSA», que es Sección Amarilla (F3, cid 12526), llega sin CID con $32,375. ESTO SE ESCRIBE COMO PREGUNTA Y NO COMO HECHO, y el límite importa: lo único confirmado por dirección es la nota de `lib/grc-asesor-alias.ts` del 22 sep 2026 —«Finsus es Fátima»—, que menciona SÓLO dos líneas, «Growth» y «Cobranza»; las cuatro grandes no estaban en esa confirmación. Así que NO se puede afirmar que Finsus sea una cuenta de $278,154 como sí se afirma de GTC. La pregunta, concreta: ¿las siete líneas «Finsus …» son el mismo cliente, y las veinticinco «Petroil …» también? Si la respuesta es sí, Finsus pasa por delante de GTC —$278,154 contra $272,436— y el superlativo de este expediente cambia de dueño.',
    'CONTEXTO — El grupo opera en AL MENOS SEIS ESTADOS, y las dos fuentes no coinciden. La lista del grupo nombra Ciudad de México, San Luis Potosí, Guanajuato, Zacatecas y Aguascalientes — cinco. Pero sus propias líneas del GRC añaden QUERÉTARO («GTC - INFINITI QRO», que esta misma auditoría expande como «INFINITI (Querétaro y León)») y no nombran ni Zacatecas ni Aguascalientes, así que la lista de cinco no sale de los datos del expediente y la v1.4 la repetía en seis sitios sin reconciliarla. Más de 34 años de sociedad con Nissan y, según esas mismas líneas, también BMW, MG e INFINITI. Los destinos del archivo de llamadas son sus agencias: Forum (recepción, servicio, refacciones, seminuevos, hostess, APS y tres «Nuevos Asesor»), NIS INSUR RECEPCIÓN, Recepcion Insur CDMX, NIS TLPN RECEPCIÓN y Recepción Corporativo — son 16 destinos en `data/analisis-llamadas.json` y 11 ya agrupados en `llamadas-data.ts`. OJO: «Carretera 57» NO es uno de ellos, y la v1.4 lo publicaba como destino en cuatro sitios. Es una ETIQUETA DE DID —nueve números del CID 130723 la llevan: «Carretera 57 - Troncal», «- Facebook», «- Evento»…—, o sea una plaza del grupo, no un destino del conmutador. La operación telefónica era multi-sede y CENTRALIZADA — y es justo eso lo que el cliente pidió cambiar.',
  ],

  cronologia: [
    { fecha: '08 Mar 2021', responsable: 'Callpicker',            evento: 'Alta de la cuenta. Servicio contratado: AV Agentes Virtuales. 67 meses de relación ininterrumpida hasta hoy.', tipo: 'ok' },
    { fecha: 'Ene–Ago 2026', responsable: 'Operación GTC',        evento: 'Comportamiento estable: entre 16,493 y 22,609 entrantes al mes, con 16.5%–32.2% sin contestar. Base del periodo: 20.3%.', tipo: 'neutral' },
    { fecha: '≤ 02 May 2026', responsable: 'Mesa de ayuda',       evento: 'El folio 106428 ya existe: su última actividad es del 2 de mayo y vencía el 3. La fuente NO trae fecha de apertura, así que no se puede fechar — la v1.2 ponía «10 de mayo», que era 12 oct menos 155 días, retrocalculado y además posterior a su propio vencimiento. Al último corte disponible, el del 5 de octubre, lleva 155 días fuera de SLA y 156 sin movimiento, en estado Escalado.', tipo: 'problema' },
    { fecha: 'Jun 2026',    responsable: 'Dan',                   evento: 'Actividad de llamada programada para el 26 de junio. NO se completó.', tipo: 'problema' },
    { fecha: 'Jul 2026',    responsable: 'Dan',                   evento: 'Tres actividades programadas —KAM el 3, tickets el 16, llamada el 23— y ninguna se completó. La del 10 de julio, de análisis, sí: «llamadas únicamente informativas sobre los servicios automotrices que ofrecen, con buen tiempo de respuesta» — la v1.4 publicaba «tiempo de atención», que no es lo que dice el `resultado`. Y esa misma actividad trae un área de oportunidad que no se había recogido: «no se toman los datos del cliente para dar seguimiento».', tipo: 'problema' },
    { fecha: '06 Ago 2026', responsable: 'Dan',                   evento: 'Análisis cerrado: «SLA cumplido, no se ha detectado errores consistentes o faltos de atención en las solicitudes».', tipo: 'neutral' },
    { fecha: '13 Ago 2026', responsable: 'Dan',                   evento: 'Análisis cerrado, y es una lectura POSITIVA leída entera: «la cuenta muestra en todas sus interacciones solicitando ajustes, cambios o reportes a SAC DE MANERA FAVORABLE EL SLA, NO EXCEDIENDO LA HORA DE RESPUESTA Y SOLUCIÓN». La v1.2 la citaba cortada en «…reportes a SAC» y la presentaba como señal de deterioro. Es la última lectura positiva antes del colapso de septiembre.', tipo: 'neutral' },
    { fecha: 'Ago 2026',    responsable: 'Mesa de ayuda',         evento: '53 tickets cerrados, el pico del año y el doble de julio. El #104448 llevaba 147 días abierto.', tipo: 'problema' },
    { fecha: '14 Ago 2026', responsable: 'GTC / Callpicker',      evento: 'Último contacto registrado en la ficha antes de la reunión de septiembre.', tipo: 'neutral' },
    { fecha: '04 Sep 2026', responsable: 'Callpicker / GTC',      evento: 'Reunión «Callpicker <> GTC», y el reparto son CINCO personas, no tres: `participantes` trae «Invitado jorge.garcia@grupotorrescorzo.com Daniel Martinez christian.torres@grupotorrescorzo.com Alberto David Avilés Reyna José Manuel López». Por GTC, Jorge García y Christian Torres —los dos con correo @grupotorrescorzo.com—; por Callpicker, TRES: Daniel Martínez, Alberto David Avilés Reyna —que presenta el diseño automatizado del ofuscador— y José Manuel López, que es quien da el costo de $99 por DID. La v1.4 nombraba sólo a tres, y los dos omitidos actúan en los acuerdos que este expediente cita. Incidencia en el servicio de WhatsApp atribuida a Meta: error en mensajes salientes. ACUERDO: pausar las campañas de marketing. Se propone un ofuscador y se discuten costos de desarrollo.', tipo: 'pivote' },
    { fecha: 'Sep 2026',    responsable: 'Operación GTC',         evento: '43,860 entrantes —el doble de su media— y 24,341 sin contestar: 55.5%. El peor mes registrado, con diferencia.', tipo: 'problema' },
    { fecha: '14 Sep 2026', responsable: 'Callpicker',            evento: 'Seguimiento por correo de Daniel Martínez (Callpicker) a Jorge y Christian Torres: asignar números nuevos es costoso y lento por regulación IFT. Se recomienda una solución alterna.', tipo: 'neutral' },
    { fecha: '02 Oct 2026', responsable: 'Gross Revenue Fact.',   evento: 'Respaldo del corte: las 13 líneas activas del grupo suman $272,436 y DOCE vienen creciendo («Upsell temporal»), la restante plana. Es la última foto en la que la cuenta está entera.', tipo: 'ok' },
    { fecha: '06 Oct 2026', responsable: 'Motor de alertas',      evento: 'Se abren DOS de las tres alertas que esta cuenta tiene hoy abiertas, las dos de severidad alta y familia «ceguera»: `sin_contactos` (cero contactos capturados) y `sin_radar` (0 de 12 del Radar). La tercera —la más grave— no es de esta fecha: se abre el 12 de octubre.', tipo: 'problema' },
    { fecha: '11 Oct 2026', responsable: 'Gross Revenue Fact.',   evento: 'El corte vigente pone las 13 líneas en CERO y las marca «Churn confirmado», las 13 con verificación `sin_verificar`. Nueve días después del respaldo donde crecían. Nadie las ha comprobado.', tipo: 'problema' },
    { fecha: '12 Oct 2026', responsable: 'Motor de alertas',      evento: 'Se abre la TERCERA alerta de la cuenta, y es la más severa del expediente: `sac_atraso_cronico`, condición «mesa», familia riesgo, severidad CRÍTICA. Evidencia: «Aparece con tickets vencidos en 20 de los 20 cortes de la mesa. Hoy el peor es el folio 106428 con 155 días fuera de SLA y 156 sin que nadie lo mueva (Escalado). Corte del 2026-10-05». Su `condicion_desde` dice 2026-05-10, la misma fecha retrocalculada que este expediente desmiente. La v1.3 no la mencionaba en ninguna parte del cuerpo.', tipo: 'problema' },
    { fecha: '12 Oct 2026', responsable: 'Callpicker',            evento: 'Entra por primera vez la lectura de llamadas de esta cuenta. Hasta hoy el tablero no podía medir su atención telefónica y pedía el archivo al cliente.', tipo: 'pivote' },
    { fecha: '12 Oct 2026', responsable: 'Dirección',             evento: 'Dirección aporta el dato que faltaba: EL CLIENTE PIDIÓ DESCENTRALIZAR su cuenta y cada agencia responde ya por su propia comunicación. No estaba en ninguna fuente del tablero — ni en reuniones, ni en seguimientos, ni en observaciones. Es el marco de todo el expediente y llegó por fuera.', tipo: 'pivote' },
  ],

  perfil_campos: [
    { label: 'Razón social',          value: 'Grupo Torres Corzo Automotriz' },
    { label: 'Giro',                  value: 'Venta de vehículos — grupo MULTIMARCA: Nissan, BMW, MG e INFINITI' },
    { label: 'Fundación',             value: '1987 · más de 34 años de sociedad con Nissan Mexicana' },
    { label: 'Cobertura',             value: 'AL MENOS SEIS ESTADOS, y las dos fuentes no dicen lo mismo. La lista del grupo —CDMX, San Luis Potosí, Guanajuato, Zacatecas y Aguascalientes— son cinco; sus propias líneas del GRC añaden QUERÉTARO («GTC - INFINITI QRO») y no nombran ni Zacatecas ni Aguascalientes. La v1.4 publicaba «5 estados» en seis sitios mientras expandía «INFINITI (Querétaro y León)» en otros dos.' },
    { label: 'Modelo de cuenta',      value: 'EN DESCENTRALIZACIÓN a petición del cliente — cada agencia responde por su propia comunicación' },
    { label: 'Líneas del GRC · 13 vivas de 19',value: 'ACTIVAS el 2 oct (13): Centro Max, Nava, «Carranza, Lomas», Forum, BMW, Sendero, MG Poliforum, MG Lomas, Matehuala, Rioverde, Infiniti Querétaro, Insur, Infiniti León. DESACTIVADAS (6): Carranza, Lomas, Crossing, La Joya, Tlalpan y «Oleksei» —que no es una agencia sino una reestructura de facturación—. 13 + 6 = 19. Carranza y Lomas salen DOS veces porque su territorio lo cubre hoy la línea activa «Carranza, Lomas»: hay solape. Y NO son el censo de sedes —los 386 DIDs del CID traen plazas que no aparecen en ninguna línea: Carretera 57, Chapultepec, Distribuidores Nissan SLP, BMW Seminuevos, Mini, Corporativo' },
    { label: 'Tamaño',                value: 'Grande — 1,200 empleados, 32 oficinas' },
    { label: 'Domicilio fiscal',      value: 'Av. Dr. Salvador Nava Martínez #205, Col. Capricornio, San Luis Potosí, S.L.P., C.P. 78399' },
    { label: 'Sitio',                 value: 'gtc-mx.com — cotización en línea con respuesta por WhatsApp' },
    { label: 'Contacto registrado',   value: 'Jorge García — coordinador de desarrollo de proyectos · 55 9752 5075 · SIN correo en la ficha' },
    { label: 'Quién asistió · los CINCO',  value: 'Junta del 4 sep 2026, `participantes` completo. Por GTC, DOS: jorge.garcia@ y christian.torres@grupotorrescorzo.com. Por CALLPICKER, TRES: Daniel Martínez —que lleva el peso de la minuta; la v1.2 lo tenía como contacto del cliente y mandaba al asesor a llamarlo—, Alberto David Avilés Reyna, que presenta el diseño del ofuscador, y José Manuel López, que da el costo de $99 por DID. La v1.4 nombraba sólo a tres de los cinco.' },
    { label: 'Cliente desde',         value: '8 de marzo de 2021 — 67 meses' },
    { label: 'Servicio contratado',   value: 'AV Agentes Virtuales' },
    { label: 'Facturación mensual',   value: '$272,436 MXN, su ÚLTIMO MRR INSTITUCIONAL MEDIDO: el `mrrFin` del respaldo del 2 oct, igual al `mrrIni` del corte del 11. En el corte VIGENTE suma $0 —las 13 líneas vienen «Churn confirmado» con `verificacion` `sin_verificar`, y la regla sólo rescata con `mrrIni` las que dicen `sigue_viva`—, así que el 13.42% del MRR institucional de la cartera viva descansa en esa última lectura y en sumarla a mano. La ficha dice $316,541, que es su promedio de vida, y es la cifra que el tablero sigue mostrando porque las 19 líneas del GRC no traen CID.' },
    { label: 'Salud de pago',         value: 'Al corriente · 0 incidencias de pago' },
    { label: 'Health Score',          value: '47 · relacional 32, actividad 50, adopción 50, pago 50' },
  ],

  necesidad_negocio: 'GTC no usa telefonía como soporte: la usa para VENDER. Su sitio ofrece cotización en línea con respuesta por WhatsApp, y los destinos de su conmutador son las recepciones y las líneas de asesores de nuevos de cada agencia —Forum, NIS INSUR, Insur CDMX, NIS TLPN y Corporativo; «Carretera 57» NO está entre ellos, es etiqueta de DID—. Cada llamada entrante es, con alta probabilidad, alguien preguntando por un coche, por una refacción o por su servicio.\n\nEso cambia lo que significa una llamada no contestada. En una cuenta de soporte, perder una llamada es un cliente molesto; aquí es una unidad que no se vendió. Con 24,341 llamadas sin contestar en septiembre y un ticket promedio automotriz, la conversación con este cliente no es sobre calidad de servicio telefónico: es sobre cuánto dinero dejó de entrar por el teléfono.\n\nLa necesidad real que tiene hoy es capacidad y enrutamiento: que las llamadas lleguen a alguien que las tome, y que cuando el canal digital se caiga —como pasó con WhatsApp en septiembre— el teléfono aguante el desvío.',

  potencial_corto: [
    'Enrutamiento y desborde de las tres líneas «Nuevos Asesor» de Forum: hoy contestan el 2.8% de 13,177 llamadas. Cualquier mejora ahí se mide en unidades vendidas, no en puntos de SLA.',
    'Refuerzo del lunes: concentra el 25.6% del tráfico semanal y pierde el 43.3% — 23,125 llamadas, el 40.4% de todo lo que pierde la cuenta en el año. Es el día con mayor retorno por cada agente adicional, y el recuperable depende del punto de comparación, que hay que decir: llevarlo al 29.4% del martes recupera unas 7,430 llamadas; al 17.2% del miércoles, su mejor día, unas 13,960. La v1.4 llamaba «martes» al 17.2% —es el miércoles— e inflaba lo recuperable en unas 6,530.',
    'Cerrar el folio 106428 y los 39 tickets que pasaron de 7 días. La cuenta aparece con vencidos en los 20 de 20 cortes de la mesa.',
    'Resolver de raíz el «Ajuste en Flujo (voz)»: 53 tickets de la misma subcategoría en ocho meses. Una capacitación o una configuración definitiva cierra el 26% de su volumen de tickets.',
  ],

  potencial_largo: [
    'Callpicker Chat e IA de Chat: su canal de cotización es WhatsApp y la incidencia de septiembre demostró que no tiene respaldo. CUIDADO con afirmar que no los tiene contratados: eso saldría de los flags `tiene_chat_activo` y `tiene_ia_chat`, y `lib/adopcion-auto.ts` advierte que esos flags están en `false` para las 197 cuentas vivas —nunca se poblaron— y no distinguen «no contratado» de «sin capturar». Aquí hay prueba de lo contrario: 81 de sus 203 tickets (39.9%) son de canal chat, entre ellos 29 de «Plantillas Verificadas» y 22 de «Envío Masivo WhatsApp». Hay que confirmarlo con facturación antes de ofrecerlo como alta.',
    'Integración API con su CRM (usan Zoho). Cada llamada perdida es un lead que no queda registrado en ningún sitio. Que «hoy no la tienen» viene del flag `tiene_integracion_api`, que no es medición: hay que preguntarlo.',
    'Panel por agencia: operan 32 oficinas en al menos 6 estados contra una sola cuenta. Medir Forum contra Insur contra NIS TLPN contra Corporativo —los destinos que SÍ trae el archivo— convierte el dato en gestión para el cliente. «Carretera 57» no sirve de ejemplo: es etiqueta de DID, no destino.',
    'Pago automático: el flag `tiene_pago_automatico` dice que no, pero ese flag está en `false` para toda la cartera y no es medición. Vale la conversación de todos modos: 67 meses sin una sola incidencia de pago.',
  ],

  tacticas: [
    { nombre: 'Llevarle sus propios números', descripcion: 'Presentar el desglose por destino: cuántas llamadas recibió cada agencia y cuántas contestó. Son SUS datos, generados por nuestra plataforma, y hoy no los ve.', impacto: 'Convierte una conversación de servicio en una de negocio. El 2.8% de la línea de nuevos no se discute: se mira.' },
    { nombre: 'Anclar al septiembre', descripcion: 'Comparar septiembre contra su propia base de enero a agosto, no contra un estándar de la industria. 20.3% → 55.5% es su propio deterioro.', impacto: 'Evita la respuesta «así es este negocio»: el punto de comparación es la propia cuenta.' },
    { nombre: 'Preguntar por WhatsApp sin acusar', descripcion: 'La reunión del 4 de septiembre documenta que se pausaron las campañas. Preguntar si el tráfico se volcó al teléfono, no afirmarlo.', impacto: 'Si lo confirma, abre la conversación de respaldo de canal; si lo niega, hay otra causa que encontrar.' },
    { nombre: 'Cerrar el 106428 antes de la junta', descripcion: 'Llegar con un folio de 155 días fuera de SLA —medidos al corte del 5 de octubre— a hablar de calidad de atención le entrega al cliente el argumento.', impacto: 'Quita de la mesa la única objeción que no se puede contestar con datos.' },
  ],

  senal_alarma: 'EL CLIENTE REORGANIZÓ SU CUENTA Y EL TABLERO NO SE ENTERÓ POR NINGUNA DE SUS FUENTES. La descentralización no aparece en reuniones, ni en seguimientos, ni en observaciones, ni en actividades: llegó por dirección, de viva voz. Es una cuenta del 13.42% de la cartera viva, con 67 meses de permanencia, cero contactos capturados, cero de doce del Radar, una sola reunión en todo el historial y un folio escalado sin moverse desde mayo. Tiene TRES alertas abiertas, no dos, y la peor no es ninguna de las de relación: es `sac_atraso_cronico`, familia riesgo, severidad CRÍTICA, por aparecer con tickets vencidos en los 20 de 20 cortes de la mesa. Y mientras tanto el corte del 11 de octubre ya la da de baja entera, sin verificar. Si esta cuenta decide irse, Callpicker se entera el día que lo diga.',

  problema_raiz: 'El cliente cambió el modelo de su cuenta y Callpicker no tenía dónde registrarlo. Se la siguió gestionando como un servicio centralizado que funciona.',

  problema_raiz_detalle: 'EMPECEMOS POR LO QUE NO ES. No es que nadie hiciera su trabajo: es que el trabajo que había que hacer cambió y no hubo forma de saberlo. El cliente pidió descentralizar —cada agencia responde por su propia comunicación— y ese hecho, que reordena absolutamente todo lo demás, NO ESTÁ EN NINGUNA FUENTE DEL TABLERO. No hay una reunión que lo registre, ni un seguimiento, ni una observación KAM, ni una actividad. Llegó por dirección el 12 de octubre, de viva voz, cuando esta auditoría ya estaba escrita y la había interpretado al revés.\n\nEso es el problema raíz, y es de diseño: el tablero sabe medir consumo, tickets y llamadas, pero no tiene dónde anotar «esta cuenta cambió de modelo». Un cambio así deja huellas en todos los indicadores a la vez —el consumo baja, la atención se cae, la facturación se parte en líneas— y cada indicador por separado parece un deterioro. La ficha de una cuenta necesita un campo que diga qué está pasando con ella, porque sin él los números cuentan la historia equivocada con toda precisión.\n\nDurante 67 meses GTC pagó puntualmente, no abrió conflictos comerciales y usó el producto de forma intensiva —927 visitas al mes al panel, sumando sus seis secciones—. Eso produjo la lectura de una cuenta sana, y el 6 de agosto de 2026 quedó escrita: «SLA cumplido, no se ha detectado errores consistentes».\n\nPero el tablero no tenía su lectura de llamadas. Hasta el 12 de octubre de 2026, esta cuenta figuraba como «no la vemos»: la ficha pedía al asesor que le solicitara al cliente un Excel de llamadas entrantes y salientes. O sea que durante todo el deterioro de septiembre —43,860 llamadas, 24,341 sin contestar— el único indicador disponible era que la cuenta no se quejaba.\n\nEl segundo nivel del problema es que lo que SÍ se veía se leyó al revés. 203 tickets en ocho meses, con el 26.1% pidiendo el mismo ajuste de flujo, se interpretó como un cliente demandante y no como un cliente cuya configuración nunca quedó resuelta. El 13 de agosto el propio equipo escribió que «en todas sus interacciones» pedía ajustes —añadiendo que el SLA se cumplía—, y la acción que siguió fue una actividad de análisis, no una intervención técnica.\n\nEl tercero es de relación. Cero contactos capturados y cero del Radar significa que no hay mapa: no se sabe quién decide el presupuesto de telefonía, quién dirige a los asesores de nuevos ni quién respondería si Nissan Mexicana preguntara por el desempeño del contact center. Hay un interlocutor técnico capturado —Jorge García— y un decisor que estuvo en la junta de septiembre, Christian Torres, que existe en el expediente sólo como nombre en la prosa. (Nota de método: la v1.2 contaba aquí a Daniel Martínez como el contacto sin capturar. Es de CALLPICKER, y el plan terminaba mandando al asesor a llamar a su propio compañero.)',

  flujo_real: [
    { fase: 'Entra la llamada',        area: 'Cliente final',       accion: 'Marca a la agencia buscando un coche, una refacción o su servicio', resultado: '208,255 entrantes medidas de ene a oct 2026' },
    { fase: 'Enrutamiento',            area: 'Plataforma Callpicker', accion: 'La llamada se dirige al destino configurado: recepción o línea de asesores', resultado: '11,498 perdidas (20.1%) no llegan a ningún destino registrado' },
    { fase: 'Atención',                area: 'Agencia GTC',         accion: 'Un asesor toma la llamada', resultado: 'Las tres líneas «Nuevos Asesor Forum» contestan 372 de 13,177 — el 2.8%' },
    { fase: 'La llamada se pierde',    area: '—',                   accion: 'Nadie contesta; el cliente cuelga', resultado: 'No queda registro del lead: la cuenta no tiene integración con su CRM' },
    { fase: 'GTC pide un ajuste',      area: 'Mesa de ayuda',       accion: 'Se abre ticket «Ajuste en Flujo (voz)»', resultado: '53 veces en ocho meses — el 26.1% de todos sus tickets' },
    { fase: 'El ticket se atiende',    area: 'Mesa de ayuda',       accion: 'Se resuelve el caso puntual', resultado: 'Mediana de 42.2 h, pero 39 tickets (19.2%) pasan de 7 días; el 106428 lleva 155 al 5 oct' },
    { fase: 'Callpicker evalúa',       area: 'SAC',                 accion: 'Actividad de análisis sobre la cuenta', resultado: '«SLA cumplido» el 6 de agosto y otra vez el 13, seis semanas antes del colapso de septiembre' },
  ],

  comparativo: [
    { metrica: 'El modelo de la cuenta, registrado en el tablero', real: 'EN NINGUNA PARTE — la descentralización llegó por dirección', ideal: 'Un campo en la ficha que diga qué está pasando con la cuenta' },
    { metrica: 'Las 13 líneas activas · corte del 11 oct', real: '$0, «Churn confirmado», `sin_verificar` las 13', ideal: '$272,436 como el 2 oct, o 13 verificaciones una por una' },
    { metrica: 'Capacidad de atender vs. volumen (ago→sep)', real: '+130 contestadas contra +25,840 entrantes', ideal: 'Que crezcan juntas, o que se sepa quién dejó el número' },
    { metrica: 'Entrantes sin contestar · septiembre', real: '55.5% (24,341 de 43,860)', ideal: 'Su propia base ene–ago: 20.3%' },
    { metrica: 'Línea de venta de autos nuevos (3 destinos Forum)', real: '2.8% contestadas (372 de 13,177)', ideal: 'Una línea comercial atendida: >80%' },
    { metrica: 'Lunes — su día de mayor tráfico', real: '43.3% sin contestar (23,125 de 53,392)', ideal: 'Al nivel de su MEJOR día, el miércoles: 17.2%. Al del martes, que es el segundo en tráfico: 29.4% — la v1.4 llamaba «martes» al 17.2%' },
    { metrica: 'Contactos capturados', real: '0 en `contactos_json`', ideal: 'Quien decide, quien opera y quien paga: mínimo 3' },
    { metrica: 'Radar de 12 preguntas', real: '0 respondidas', ideal: '12 de 12 en una cuenta AAA' },
    { metrica: 'Reuniones en 67 meses', real: '1', ideal: 'Trimestral para una cuenta de este tamaño: 22' },
    { metrica: 'Tickets por encima de 7 días', real: '39 de 203 (19.2%)', ideal: '<5%' },
    { metrica: 'Folio más antiguo sin moverse', real: '156 días al corte del 5 oct (106428, Escalado)', ideal: 'Ninguno fuera de SLA' },
    { metrica: 'Consumo de su bolsa de 50,000 min', real: '38,063 min en AGOSTO (76.1%) — cayó 40.43% desde dic-2025. Septiembre 2026 NO está medido', ideal: 'Estable o creciendo; dic-2025 fue 63,898 (127.8%)' },
    { metrica: 'Presencia en el último Informe de Cortes', real: 'AUSENTE — única de 104 CID que no reapareció', ideal: 'Los 104 cortan cada mes' },
    { metrica: 'Líneas del grupo con CID asignado en el GRC', real: '0 de 19', ideal: '19 de 19 — sin CID el tablero no las cruza' },
    { metrica: 'Bloques del Health Score realmente medidos', real: '1 de 4 (sólo el relacional)', ideal: '4 de 4' },
  ],

  plan_inmediato: [
    { accion: 'MAPEAR LA DESCENTRALIZACIÓN: de las 19 líneas del GRC —trece vivas y seis ya desactivadas, así que la pregunta viva es sobre trece—, cuáles siguen con Callpicker, cuáles contratan aparte y cuáles se fueron. Es la pregunta de la que dependen todas las demás de este expediente', responsable: 'Dan / Dirección', criterio: 'Las 19 líneas con un estado escrito y un interlocutor con nombre, no un agregado' },
    { accion: 'PARAR el churn marcado sin verificar: el corte del 11 oct da de baja las 13 líneas activas —$272,436— con verificación `sin_verificar`, y nueve días antes doce de ellas venían creciendo', responsable: 'Dirección / Facturación', criterio: 'Las 13 líneas quedan verificadas una por una, confirmadas o revertidas, antes del siguiente corte' },
    { accion: 'Asignar CID a las 19 líneas «GTC - …» del GRC. Sin CID esta cuenta no la encuentra ningún cruce automático, y el nombre no sirve: «corzo» aparece en cero de los 3,608 nombres del corte', responsable: 'Facturación', criterio: 'Las 19 líneas con CID, y la ficha de D1 mostrando su facturación sin intervención manual' },
    { accion: 'PREGUNTAR A DIRECCIÓN SI FINSUS Y PETROIL SON UN SOLO CLIENTE CADA UNO, porque es el mismo defecto de GTC y nadie lo ha preguntado: siete líneas «Finsus …» suman $278,154 al mes y sólo una trae CID (Growth, F1, $38,215); veinticinco líneas «Petroil …» suman $80,049 y sólo una trae CID ($4,978, que cruza a Z47 y no a F32). Lo único confirmado es la nota del 22 sep, que nombra dos de las siete líneas de Finsus', responsable: 'Dirección / Facturación', criterio: 'Dirección dice por escrito qué líneas son el mismo cliente, y las que lo sean reciben CID. Si Finsus se confirma, la cuenta mayor de la cartera es Finsus y no GTC' },
    { accion: 'Cerrar o escalar formalmente el folio 106428 antes de cualquier contacto comercial', responsable: 'Mesa de ayuda / Dan', criterio: 'El folio cambia de estado o tiene fecha comprometida por escrito, antes de la llamada' },
    { accion: 'Llamar a Jorge García y a Christian Torres —los dos que asistieron por GTC el 4 de septiembre— con el desglose por destino en la mano y preguntar quién responde HOY por cada línea «Nuevos Asesor Forum» — preguntando, no señalando: si Forum ya se hace cargo de su comunicación, el 2.8% no es nuestra falla', responsable: 'Dan', criterio: 'Queda por escrito quién contesta esas tres extensiones, en qué horario y a qué agencia pertenecen ahora' },
    { accion: 'Preguntar si el tráfico de septiembre se volcó al teléfono al pausar las campañas de WhatsApp', responsable: 'Dan', criterio: 'Respuesta del cliente registrada en seguimiento, confirmando o descartando la relación' },
    { accion: 'Averiguar por qué el CID 130723 desapareció del Informe de Cortes del 1 de octubre, siendo el único de 104 que no reapareció — con la descentralización encima, la hipótesis es que el consumo se movió a los contratos por agencia', responsable: 'Facturación', criterio: 'Se confirma si cambió de CID, si se facturó por otro contrato o si quedó fuera del export' },
    { accion: 'Capturar los tres decisores que YA están escritos en la prosa de la cuenta: Jorge García, Christian Torres (DM) y Ariana Agundis García (DM)', responsable: 'Dan', criterio: 'Los tres en `contactos_json` con puesto, correo y teléfono' },
    { accion: 'Cerrar la decisión del ofuscador: $96,250 + IVA, 77 horas, 4 semanas — abierta desde el 4 de septiembre sin fecha', responsable: 'Dan', criterio: 'El cliente aprueba, rechaza o pone fecha, y queda registrado' },
  ],

  plan_mediano: [
    { accion: 'Resolver de raíz el «Ajuste en Flujo (voz)»: una sesión técnica que deje la configuración cerrada', responsable: 'Mesa de ayuda / Ingeniería', criterio: 'Cero tickets de esa subcategoría durante 60 días' },
    { accion: 'Contestar las 12 preguntas del Radar con el cliente, en una sola sesión', responsable: 'Dan', criterio: '12 de 12 respondidas en la ficha' },
    { accion: 'Revisar con soporte las 11,498 llamadas que no llegaron a ningún destino', responsable: 'Ingeniería', criterio: 'Se explica el origen de ese 20.1% o se descarta que sea un problema de configuración' },
    { accion: 'Proponer refuerzo de capacidad para el lunes y desborde para la línea de nuevos', responsable: 'Dan', criterio: 'Propuesta entregada con el cálculo de llamadas recuperables por agente' },
  ],

  plan_estrategico: [
    { accion: 'DARLE AL TABLERO DÓNDE ANOTAR UN CAMBIO DE MODELO. La descentralización de GTC no cabía en ninguna fuente: ni reunión, ni seguimiento, ni observación. Un cambio estructural mueve todos los indicadores a la vez y cada uno por separado parece un deterioro', responsable: 'Producto / Dirección', criterio: 'La ficha tiene un campo de situación estructural, y la auditoría y las alertas lo leen antes de concluir' },
    { accion: 'Panel de desempeño por agencia: Forum contra Insur contra NIS TLPN contra Corporativo —los destinos que trae el archivo; «Carretera 57» es etiqueta de DID, no destino—. Con la descentralización deja de ser un extra y pasa a ser el producto: es lo que cada agencia necesita para responder por su propia comunicación', responsable: 'Producto / Dan', criterio: 'El cliente recibe un reporte mensual por sede, no agregado' },
    { accion: 'Integración con su CRM Zoho para que la llamada perdida deje lead', responsable: 'Ingeniería / Dan', criterio: 'Propuesta técnica y costo entregados' },
    { accion: 'Respaldo de canal: Callpicker Chat e IA de Chat para que WhatsApp no sea un punto único de falla', responsable: 'Dan', criterio: 'Propuesta presentada citando la incidencia del 4 de septiembre' },
    { accion: 'Gobernanza de la cuenta: reunión trimestral fija con minuta y acuerdos', responsable: 'Dan / Dirección', criterio: 'Primera reunión agendada con fecha y asistentes confirmados' },
  ],

  areas_oportunidad: [
    { area: 'Recuperar la línea de venta de autos nuevos', impacto: '12,805 llamadas perdidas de ene a oct en la línea comercial de una concesionaria', responsable: 'Dan + GTC' },
    { area: 'Capacidad del lunes', impacto: '23,125 llamadas perdidas sólo ese día de la semana', responsable: 'GTC' },
    { area: 'Chat e IA de Chat (confirmar primero qué tiene)', impacto: 'Canal de cotización sin respaldo; ya falló una vez en septiembre', responsable: 'Dan' },
    { area: 'Integración API con Zoho CRM', impacto: 'Hoy ninguna llamada perdida genera lead', responsable: 'Ingeniería' },
    { area: 'Cierre estructural del ajuste de flujo', impacto: '26.1% del volumen de tickets de la cuenta', responsable: 'Mesa de ayuda' },
    { area: 'Pago automático (sin confirmar)', impacto: '67 meses sin una sola incidencia de pago', responsable: 'Administración' },
  ],

  perfiles: [
    {
      nombre: 'Jorge García', rol: 'Coordinador de desarrollo de proyectos — GTC', color: '#6366f1',
      campos: [
        { label: 'Teléfono',  value: '55 9752 5075' },
        { label: 'Correo',    value: 'jorge.garcia@grupotorrescorzo.com (en el campo de nombre, NO en el de correo — la ficha lo tiene mal capturado)' },
        { label: 'Rol real',  value: 'Es el único contacto registrado de la cuenta' },
        { label: 'Riesgo',    value: 'Punto único de contacto en una cuenta de $272,436 al mes que se está partiendo en 19 líneas de facturación, trece de ellas todavía vivas' },
      ],
    },
    {
      nombre: 'Christian Torres', rol: 'Decisor (DM) — GTC', color: '#ef4444',
      campos: [
        { label: 'Aparece en', value: 'Prosa de la cuenta, marcado «(DM)» — decision maker. Y en los `participantes` de la junta del 4 sep 2026.' },
        { label: 'Correo',     value: 'christian.torres@grupotorrescorzo.com — está en la minuta, no en la ficha' },
        { label: 'Estado',     value: 'NO capturado en `contactos_json`. Es el decisor de GTC que asistió a la única junta registrada, y el expediente lo tenía sólo «en la prosa».' },
      ],
    },
    {
      nombre: 'Ariana Agundis García', rol: 'Decisora (DM) — GTC · quien abrió el folio 106428', color: '#ef4444',
      campos: [
        { label: 'Abrió',      value: 'Folio 106428 «Revisar apertura de conversación con plantilla»' },
        { label: 'Sin mover',  value: 'Última actividad 2 may 2026 — congelada en los 20 cortes' },
        { label: 'Estado',     value: 'NO capturada en `contactos_json`. Es quien tiene el problema abierto.' },
      ],
    },
    {
      nombre: 'Daniel Martínez', rol: 'CALLPICKER — no es contacto de GTC', color: '#64748b',
      campos: [
        { label: 'Corrección', value: 'La v1.2 lo fichó como interlocutor DEL CLIENTE y lo metió en el plan de llamadas. Es de los nuestros: en `reuniones.acuerdos` es él quien informa que la incidencia «no reside en la plataforma propia», quien escala con Meta, quien cotiza las 77 horas en $96,250 y quien se compromete a enviar capturas A Christian Torres; el correo del 14 sep lo firma él, dirigido «para JORGE, christian.torres, mí».' },
        { label: 'Aparece en', value: 'Reunión «Callpicker <> GTC» del 4 sep y seguimiento del 14 sep — del lado Callpicker' },
        { label: 'Temas',      value: 'Incidencia de WhatsApp atribuida a Meta, pausa de campañas, ofuscador ($96,250 + IVA), regulación IFT' },
        { label: 'Lo que deja', value: 'El decisor de GTC que SÍ estuvo en esa junta es Christian Torres, y en el expediente seguía existiendo sólo «en la prosa».' },
      ],
    },
    {
      nombre: 'Dan', rol: 'Asesor SAC de la cuenta — Callpicker', color: '#22c55e',
      campos: [
        { label: 'Actividades',  value: '7 registradas · 3 completadas (todas de análisis) · 4 sin completar (2 llamadas, 1 tickets, 1 KAM)' },
        { label: 'Último análisis', value: '13 ago 2026 — nombró el patrón de ajustes constantes y a la vez dio el SLA por cumplido. La v1.2 citaba sólo la primera mitad.' },
        { label: 'Contexto',     value: 'Suspendido del tablero del 6 oct al 12 oct 2026 por instrucción de dirección' },
      ],
    },
  ],

  foda: {
    fortalezas: [
      '67 meses de permanencia ininterrumpida desde marzo de 2021',
      'Cero incidencias de pago y pagos al corriente',
      'Adopción ALTA medida: 927 visitas al mes al panel (SEIS secciones; promedio de los cortes del 1 jun, 1 jul y 1 ago, que cubren MAYO–JULIO porque cada corte mide el mes anterior), aunque la serie viene cayendo — 1,757 → 1,064 → 909 → 808 → 633',
      'Grupo consolidado: 1,200 empleados, 32 oficinas, al menos 6 estados —sus líneas del GRC añaden Querétaro a los cinco de su propia lista— y 34 años con Nissan',
      'Hay interlocutor técnico activo y una reunión sustantiva reciente',
    ],
    oportunidades: [
      'La línea de venta de nuevos contesta el 2.8%: el margen de mejora es casi todo el volumen',
      'Chat, IA de Chat, API y pago automático sin confirmar en la ficha — los flags `tiene_*` no distinguen «no contratado» de «sin capturar», y sus tickets de chat sugieren que algo sí tiene',
      'Operación multi-sede sin reporte por agencia',
      'Su canal de cotización es WhatsApp y no tiene respaldo',
    ],
    debilidades: [
      'El cambio de modelo que pidió el cliente no está registrado en ninguna fuente del tablero',
      'Cero contactos capturados en una cuenta que ahora se negocia agencia por agencia: TRECE decisiones vivas y ningún nombre. (No son 19: las 19 líneas del GRC no son un censo de agencias ni de interlocutores — seis vienen «Desactivado», dos de ellas solapadas con una línea activa, y «Oleksei» no es una agencia. La v1.4 ya lo decía en otras ocho secciones y en esta seguía diciendo 19.)',
      '55.5% de llamadas sin contestar en septiembre contra su base de 20.3%',
      'La capacidad de atender no se movió cuando el volumen se dobló: +130 contra +25,840',
      '0 de 12 del Radar en 67 meses · score relacional 32, el componente más bajo de su Health Score',
      '26.1% de sus tickets son el mismo ajuste sin resolver de raíz',
      'Las 19 líneas del GRC sin CID: invisible para todo cruce automático, y el nombre no la encuentra',
      'Desapareció del Informe de Cortes del 1 de octubre: su consumo dejó de ser medible por ahí',
    ],
    amenazas: [
      'LA DESCENTRALIZACIÓN PUEDE SER UNA SALIDA POR ETAPAS Y VERSE IGUAL QUE UNA REORGANIZACIÓN. Si cada agencia elige su proveedor, Callpicker no pierde una cuenta: pierde TRECE decisiones vivas —una por cada línea que seguía activa el 2 de octubre, y seis más ya se apagaron—, una por una, y cada una con un interlocutor que hoy no está capturado. Es la amenaza que ordena a todas las demás.',
      'EL GRC VIGENTE YA LA DA DE BAJA: 13 líneas en cero, $272,436 marcados «Churn confirmado» con verificación `sin_verificar`. Nueve días antes doce de ellas venían creciendo y la decimotercera estaba plana. Si eso se publica sin revisar, el 13.42% de la cartera viva aparece perdido en el reporte de dirección sin que nadie lo haya comprobado.',
      'Desapareció del Informe de Cortes del 1 de octubre, única de 104 CID. O el consumo se movió a los contratos por agencia, o se cayó del export: las dos cosas hay que saberlas.',
      'MIENTRAS LAS 19 LÍNEAS NO TENGAN CID, SU FACTURACIÓN ES INVISIBLE PARA EL TABLERO —y es justo la parte con la que se dimensiona el riesgo—. No hay cruce por nombre que la salve: «corzo» aparece en cero de los 3,608 nombres del corte. La cuenta NO es invisible entera, y la v1.3 lo decía de más: tickets, mesa de ayuda, llamadas, cortes de consumo y DIDs la encuentran por CID. Lo que seguirá saliendo mal es todo reporte que mida DINERO —hoy el tablero publica para ella el promedio de vida de la ficha, $316,541, en vez de su MRR de $272,436—.',
      'El consumo cayó 40.43% de dic-2025 a ago-2026 y ninguna alerta lo vio, porque el detector sólo mira los últimos cinco cortes. Y el de septiembre de 2026 no está medido: no hay corte posterior con este CID',
      'Folio escalado 156 días sin moverse al corte del 5 de octubre — argumento servido si el cliente cuestiona el servicio',
      'Nissan Mexicana es su socio de marca: un desempeño telefónico así es auditable por el fabricante',
      'Agotamiento del plan nacional de numeración: una red de 32 oficinas que crece y no podrá pedir números bajo el esquema actual',
    ],
  },

  conclusion: 'GTC no es una cuenta en riesgo de churn por insatisfacción. Es una cuenta que CAMBIÓ DE FORMA y que Callpicker siguió midiendo con la forma anterior. El cliente pidió descentralizar; cada agencia responde por su comunicación; la facturación ya se partió en 19 líneas y el teléfono central quedó atendido por el mismo número de personas que antes. Todos los indicadores se cayeron a la vez, y cada uno por separado parecía un deterioro del servicio.\n\nEso no vuelve inocuos los números de septiembre, y aquí está la parte incómoda: 24,341 llamadas sin contestar sólo en septiembre. Y en la ventana completa que mide el archivo —1 de enero al 12 de octubre— 12,805 sin contestar en las tres líneas de venta de autos nuevos, en un grupo que vive de vender coches. Son dos ventanas distintas y una no cabe dentro de la otra: el desglose por destino NO trae reparto mensual, así que no hay forma de saber cuántas de esas 12,805 cayeron en septiembre. Sobre la ventana entera, esos tres destinos son 12,805 de 57,274 perdidas: el 22.4%. Si esas llamadas iban a agencias que ya se hacen cargo de sí mismas, el problema es del cliente y nuestro trabajo es mostrárselo. Si seguían siendo nuestras, el problema es nuestro. Hoy no se sabe cuál de las dos, y ESA es la pregunta de la llamada — no el 55.5%.\n\nLa ventaja es que esos números los tiene Callpicker primero, y desde hoy. Una descentralización es el momento en que un proveedor se vuelve prescindible o indispensable, y se decide en las primeras conversaciones: llegar con el desglose por agencia convierte a Callpicker en quien le ordena la transición al cliente, en vez de en el conmutador que quedó atrás.\n\nY hay una lección de la casa que no es sobre GTC: el dato que reordenó este expediente entero no estaba en ninguna fuente del tablero. Llegó por dirección, de viva voz, con la auditoría ya escrita y leída al revés.',

  pierde: [
    'Callpicker pierde $272,436 al mes — el 13.42% del MRR institucional de la cartera viva — si el grupo entero se va. Y puede perderlo por partes: cada agencia es hoy una decisión aparte.',
    'GTC pierde las ventas de las 12,805 llamadas no contestadas en su línea de autos nuevos entre enero y octubre, más lo que se pierda cada mes que siga así.',
    'Se pierde la referencia: es socio de Nissan Mexicana con 34 años de relación de marca.',
    'Se pierde un caso de uso multi-sede grande y bien documentado: 32 oficinas en al menos 6 estados (`num_oficinas` = 32). Las 32 son correctas; el superlativo de la v1.3 no, y se retira. Y la lista de la v1.4 tampoco cerraba: medido sobre `cuentas.num_oficinas` —158 de las 193 vivas con el campo poblado y 35 vacío, que no se mide— son DIEZ las cuentas vivas que leen por encima de 32: Agua Inmaculada (C17) más de 1,800 sucursales y franquicias, Grupo Petroil (F32) 300 puntos en 24 estados, Tech People (C1) más de 100 ubicaciones operativas, EHI GLOBAL (D8) 73 oficinas, GRUPO FRISA (F16) 50, brandgroup (C15) más de 40 ubicaciones globales, Alianza Multimarca (D4) 38, KIVA (F15) 38 sitios, Gas Económico Metropolitano (C3) 35 estaciones y ECODELI (C2) al menos 33. Travelling (C16), con 43, está en `hibernacion`: la v1.4 lo contaba como cartera viva y no lo es. Lo que sí es único de GTC es el tamaño del contrato detrás de esas 32 sedes.',
  ],

  gana: [
    'Si se recupera la línea de nuevos, el retorno se mide en unidades vendidas y lo mide el cliente, no Callpicker.',
    'Si se confirma que Chat, IA de Chat, API y pago automático no están contratados, la base para crecer está entera. Los flags `tiene_*` de la ficha no sirven para afirmarlo: están en `false` para toda la cartera.',
    'Un panel por agencia convierte a Callpicker en herramienta de gestión del grupo, no en proveedor de conmutador.',
    'Es la cuenta donde una intervención bien hecha se nota más: cualquier mejora sobre 208,255 llamadas es visible desde el primer mes.',
  ],

  recomendacion_central: 'TODO SE ORDENA DETRÁS DE UNA PREGUNTA, Y NO ES SOBRE EL SERVICIO: de las TRECE líneas que seguían activas, ¿cuántas siguen siendo nuestras? (Trece y no diecinueve: de las 19 líneas del GRC, seis vienen ya «Desactivado».) El cliente pidió descentralizar y cada agencia responde ya por su propia comunicación. Hasta que esa pregunta tenga respuesta por escrito, agencia por agencia, no se sabe si esta cuenta vale $272,436 al mes o trece negociaciones distintas, una por cada línea que seguía viva — y toda conclusión de churn sobre ella es prematura.\n\nHay DOS urgencias y no son del mismo tipo.\n\nLA DE DENTRO, esta semana: el corte del 11 de octubre pone las 13 líneas activas en cero y las marca «Churn confirmado», las 13 `sin_verificar`, nueve días después de un respaldo donde doce venían creciendo. Eso NO puede llegar a un reporte de dirección sin verificar, porque hoy el tablero daría por perdido el 13.42% de la cartera viva sin que nadie lo haya comprobado. Y en la misma pasada, ponerle CID a las 19 líneas: mientras no lo tengan, esta cuenta no existe para ningún cruce automático y la siguiente persona que la busque volverá a concluir que no factura.\n\nLA DE FUERA: llamar con el desglose por destino en la mano y abrir con una sola pregunta — «¿quién contesta hoy las tres líneas de Nuevos Asesor de Forum?». No se abre con el 55.5% ni con el SLA, y sobre todo no se abre acusando: si Forum ya responde por su comunicación, el 2.8% no es una falla nuestra sino una extensión que quedó colgando del conmutador viejo, y decirlo al revés quema la conversación. Se abre mostrándole al cliente que de 13,177 llamadas de quien marcaba buscando un coche, 372 encontraron a alguien — y preguntando a quién debería llegarle ese número ahora.\n\nY antes de esa llamada, mover el folio 106428, que al corte del 5 de octubre llevaba 156 días con la misma fecha de última actividad — el 2 de mayo. Llegar a hablar de atención con eso abierto es entregarle al cliente el único argumento que no se puede contestar con datos.',

  auditoria_servicio: {
    fuente: 'Zoho Desk — 203 tickets de «GTC Contact Center» (CID 130723) en lib/tickets-data.json. OJO, SON DOS FUENTES y la v1.4 declaraba una: el folio 106428 NO está en ese JSON —que trae sólo CERRADOS— sino en los cortes de la mesa de ayuda, `data/mesa-ayuda/2026-10-05.json`, y así va rotulado en la tabla.',
    periodo: 'Febrero 2026 – Octubre 2026 · la fuente trae SÓLO tickets CERRADOS, así que «abiertos» no es medible aquí',
    diagnostico: 'El producto no le falla a GTC: sólo 17 de 203 tickets (8.4%) son fallas. Lo que ocurre es que su operación requiere intervención constante para funcionar. El 26.1% de todos sus tickets —53 de 203— son la misma subcategoría, «Ajuste en Flujo (voz)», repetida durante ocho meses. El 13 de agosto el propio equipo lo escribió —«en todas sus interacciones» pide ajustes— pero conviene leer la frase entera, porque sigue: «DE MANERA FAVORABLE EL SLA, NO EXCEDIENDO LA HORA DE RESPUESTA Y SOLUCIÓN». O sea que el asesor registraba el patrón y a la vez daba el servicio por bueno. Agosto cerró 53 tickets, el pico del año, y el mes siguiente su teléfono colapsó.',
    metricas: [
      { metrica: 'Tickets totales',          valor: '203 (feb–oct 2026)',   lectura: 'La cuenta con más volumen de la cartera, acorde a su tamaño' },
      { metrica: 'Fallas del servicio',      valor: '17 · 8.4%',            lectura: 'El producto responde. El problema no es estabilidad' },
      { metrica: 'Mediana de resolución',    valor: '42.2 horas',           lectura: 'Razonable. La media (203.6 h) está inflada por los casos extremos' },
      { metrica: 'Tickets de más de 7 días', valor: '39 · 19.2%',           lectura: 'Uno de cada cinco se queda semanas; ahí vive la insatisfacción' },
      { metrica: 'El más largo',             valor: '#104448 · 3,522 h (147 días)', lectura: 'Cerrado en agosto. Otros cuatro superaron los 96 días' },
      { metrica: 'Folio vencido más viejo · fuente: MESA DE AYUDA, no Zoho Desk',valor: '#106428 · 155 días fuera de SLA al 5 oct', lectura: 'Venció el 3 de may; sin movimiento desde el 2 —156 días—, Escalado, responsable Néstor C. Sale de `data/mesa-ayuda/2026-10-05.json`; en lib/tickets-data.json NO está, porque ahí sólo hay cerrados. La v1.4 lo listaba bajo la fuente equivocada, y la fuente no trae su apertura' },
      { metrica: 'Cortes con vencidos',      valor: '20 de 20',             lectura: 'No es un mal mes: es el comportamiento normal de esta cuenta' },
      { metrica: 'Pico mensual',             valor: 'Agosto · 53 tickets',  lectura: 'El doble de julio (29). El mes anterior al colapso telefónico' },
    ],
    reincidencias: [
      { patron: 'Ajuste en Flujo (voz)',       veces: '53 · 26.1%', causa: 'La configuración del flujo nunca quedó cerrada, o nadie en GTC fue capacitado para hacerla. Ocho meses del mismo pedido.' },
      { patron: 'Plantillas Verificadas (chat)', veces: '29 · 14.3%', causa: 'Mismo patrón que se documentó en FINSUS: una capacitación de WhatsApp que no se dio.' },
      { patron: 'Envío Masivo WhatsApp (chat)', veces: '22 · 10.8%', causa: 'Junto con las plantillas, el 25% de los tickets es WhatsApp — el canal que falló en septiembre.' },
      { patron: 'DiDs (voz)',                   veces: '17 · 8.4%',  causa: 'Coincide con el seguimiento del 14 sep: asignar números nuevos es lento y caro por regulación IFT.' },
    ],
    hallazgos: [
      'El 59.61% de los tickets recae en tres agentes: Pablo S. (53), Mario H. (37) y Paola B. (31) — 121 de 203. Néstor C. suma otros 31. Con la fusión de variantes que impone `lib/tickets-norm.ts` (Pablo S. + Pablo Soto = 55, Paola B. + Paola Bárcenas = 32) son 124 de 203: el 61.08%. La v1.2 publicaba 51.2%, que no sale de ningún criterio ni de sus propias partes.',
      'La prioridad declarada no refleja el impacto: 106 de 203 tickets están marcados «Low» en una cuenta cuyo teléfono perdió 24,341 llamadas en un mes.',
      'DOS QUINTOS del volumen son de chat, y el desglose cierra: 81 de 203 tickets, el 39.9% — 69 de «Asistencia (chat)», 9 de «Falla (chat)» y 3 sueltos que la v1.3 perdía («Activación (chat)», «Capacitación (chat)» y «Administrativo (chat)»). 69 + 9 + 3 = 81, y los 81 coinciden al ticket con `producto` = Chat. La v1.3 decía «un tercio» y sumaba 78. Mientras tanto los flags `tiene_chat_activo` y `tiene_ia_chat` de la ficha dicen que no tiene nada de chat. No es un misterio: `lib/adopcion-auto.ts` advierte que esos flags están en `false` para las 197 cuentas vivas porque nunca se poblaron. La prueba es la propia ficha, donde `tiene_ia_voz` también es false en una cuenta cuyo plan es «AV Agentes Virtuales». Lo que hay que confirmar con facturación es QUÉ tiene contratado de chat, no por qué levanta tickets.',
      'Entre los cinco tickets más largos hay uno de «Falla Web (chat)» de 97 días marcado como falla. Un problema reconocido que tardó tres meses en cerrarse.',
    ],
  },
}
