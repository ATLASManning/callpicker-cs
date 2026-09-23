/**
 * Corte vigente de Gross Revenue Churn.
 *
 * Separado de `page.tsx` para que Atlas (servidor) y el módulo Churn (cliente)
 * lean exactamente las mismas cifras. Al cargar un corte nuevo, este archivo se
 * reemplaza y el anterior se archiva dentro de `page.tsx`.
 */
import type { ChurnReporte } from './tipos'

/* ═══════════════════════════════════════════════════════════════════════
   REPORTE SEMANAL — SEMANA 20 · SEPTIEMBRE 2026  (15 sep 2026)
   Cierre de agosto con escenario de recuperación y septiembre en curso.
   Remitente: Valeria Zepeda Hernández (equipo Data).

   CONCILIACIÓN DE ESTE CORTE. A diferencia del de la semana 19 —que traía un
   descuadre de $2,868.27 sin explicar entre la alerta y la tabla— éste cuadra
   en todo lo verificable:
     · Hard 17,811.98 + Soft 11,844.00 + Cancelados 0 = 29,655.98 ✓ y 10+17+0 = 27 ✓
     · los cinco tramos de antigüedad suman 425,458.20 ✓
     · los tramos vencidos (12,263.00 + 17,392.98) son EXACTAMENTE Hard + Soft ✓
     · los tres downgrades suman 6,530.00 ✓, y el detalle por artículo reconstruye
       cada pérdida: Elyon 99+90+490−99 = 580 ✓ · Dicap 2,779−570 = 2,209 ✓ ·
       IBC 5,800−2,059 = 3,741 ✓
     · escenario de agosto: 68,784.18 − 22,212.40 = 46,571.78 ✓
═══════════════════════════════════════════════════════════════════════ */
export const REPORTE_S20_SEPTIEMBRE_2026: ChurnReporte = {
  id:      's20-septiembre-2026',
  periodo: 'Semana 20 · Sep 2026',
  fecha:   '15/09/2026',
  notas:   'Gross Revenue Churn · Semana 20. Al 15 de septiembre del 2026. Cierra agosto con el escenario de recuperación de las cuentas en Hard Suspend y sigue septiembre en curso: Top 10 de cuentas Activas, resumen de Hard Suspend / Soft Suspend / Cancelados, antigüedad de la cartera por cobrar y los downgrades de la semana. Próxima revisión: miércoles 23 de septiembre.',
  notaRemitente: 'Valeria Zepeda Hernández — Equipo Data. Próxima revisión: miércoles 23 de septiembre.',

  grc: {
    evolucion: [
      { mes: 'Julio',  pct: 2.0, anterior: 2.1 },
      { mes: 'Agosto', pct: 2.4, anterior: 3.4 },
    ],
    acumulado: 17.4,
    anterior:  18.6,
    notaClave: 'Churn Q3: Julio corregido a la baja de 2.1% a 2.0% · Agosto corregido a la baja de 3.4% a 2.4% por el ajuste de reestructura de facturación de las subcuentas de GTC. Churn acumulado hasta agosto 2026: 17.4% — MES CORRIENDO, NO DEFINITIVO (ant. 18.6%).',
    notaEspecial:
      '🔴 CONCENTRACIÓN EN UN SOLO GRUPO: nueve de las diez cuentas del Top 10 son subcuentas de GTC y suman $230,154.22 — el 58.1% de TODA la cartera Activo de $395,802.22. La única cuenta del Top 10 que no es GTC es ADSA ($32,375.00, 92 meses activo). El Top 10 completo pesa $262,529.22, el 66.3% de la cartera; los $133,273.00 restantes se reparten entre el resto de las cuentas, cuyo número este corte no declara. Esto no es un dato del reporte: sale de sumar su propia tabla. Un impago o una renegociación de GTC no es un evento de cuenta, es un evento de cartera. ' +
      '⚠️ NO COMPARABLE CONTRA LA SEMANA 19: la cartera Activo pasó de $136,410.47 (90 cuentas) a $395,802.22 — un factor de 2.90x en una semana. El salto viene de que las subcuentas de GTC entran ahora con su facturación reestructurada, no de crecimiento comercial. Cualquier lectura de "la cartera casi se triplicó" es falsa. ' +
      '🔁 AGOSTO SE HA CORREGIDO DOS VECES POR LA MISMA CAUSA: 4.9% → 3.4% (semana 19) → 2.4% (semana 20), una corrección acumulada de 2.5 puntos, toda ella atribuida a la reestructura de facturación de GTC - CARRANZA y GTC - LOMAS. La nota del corte declara una reducción de 30k por ese ajuste. El número no termina de asentarse: conviene preguntarle al equipo Data si la revisión ya cerró o si agosto puede moverse otra vez. ' +
      '📌 DOS CIFRAS DISTINTAS DE HARD SUSPEND, Y NO SE CONTRADICEN: el escenario de cierre de agosto habla de 23 cuentas · $22,212.40, y la tabla de septiembre en curso de 10 cuentas · $17,811.98. Son periodos distintos —cierre de agosto contra mes corriendo— y no deben restarse ni compararse entre sí. ' +
      '✅ CERO CANCELADOS EN LA SEMANA: el corte no registra ningún cliente cancelado, contra 6 cuentas y $17,770.98 en la semana 19. Es la primera semana sin bajas del trimestre. ' +
      '💰 DINERO FUERA DE LA CARTERA: $29,655.98 en 27 cuentas — Hard Suspend 10 cuentas · $17,811.98 · 19.5 días promedio pendiente de pago · Soft Suspend 17 cuentas · $11,844.00 · 10.5 días · Cancelados 0 · $0.00. Ese monto es exactamente la suma de los tramos vencidos de la antigüedad de saldos. ' +
      '📉 DOWNGRADE POCO DINERO, MUCHA PROFUNDIDAD: los tres únicos downgrades de la semana suman $6,530.00 —poco contra el promedio mensual— pero los tres recortaron más del 40% de su facturación, y dos de ellos más del 79%. El riesgo aquí no es el monto de la semana: es que un cliente que corta el 85% de lo que paga rara vez se queda en el 15% restante.',
  },

  /* Top 10 · Cuentas Activo de septiembre — total cartera Activo $395,802.22.
     El corte NO declara cuántas cuentas componen ese total, así que no se
     inventa el número: la fila de cierre lleva el monto y dice que el conteo
     no viene en el reporte. */
  pendientesTotalReal: 395802.22,
  pendientes: [
    { cliente: '🔝 GTC - CENTRO MAX',     monto: 34601.46, mesesActivo: 6,  ultimaFactura: 'Activo' },
    { cliente: 'GTC - NAVA',              monto: 34189.46, mesesActivo: 6,  ultimaFactura: 'Activo' },
    { cliente: 'GTC - CARRANZA, LOMAS',   monto: 33021.73, mesesActivo: 0,  ultimaFactura: 'Activo' },
    { cliente: 'ADSA',                    monto: 32375.00, mesesActivo: 92, ultimaFactura: 'Activo' },
    { cliente: 'GTC - FORUM',             monto: 28484.81, mesesActivo: 6,  ultimaFactura: 'Activo' },
    { cliente: 'GTC - BMW',               monto: 26297.55, mesesActivo: 6,  ultimaFactura: 'Activo' },
    { cliente: 'GTC - SENDERO',           monto: 23255.06, mesesActivo: 6,  ultimaFactura: 'Activo' },
    { cliente: 'GTC - MG POLIFORUM',      monto: 19694.24, mesesActivo: 6,  ultimaFactura: 'Activo' },
    { cliente: 'GTC - MG LOMAS',          monto: 16626.24, mesesActivo: 6,  ultimaFactura: 'Activo' },
    { cliente: 'GTC - MATEHUALA',         monto: 13983.67, mesesActivo: 6,  ultimaFactura: 'Activo' },
    /* El «+» de arranque NO es decorativo: lib/atlas-context.ts filtra por él
       (`!p.cliente.startsWith('+')`) para no pasarle esta fila de cierre al
       modelo como si fuera un cliente. Sin el prefijo, Atlas reportaría un
       cliente llamado «Resto de la cartera Activo» con $133,273.00. */
    { cliente: '+ Resto de la cartera Activo — el corte no desglosa nombres ni declara cuántas cuentas son.', monto: 133273.00, mesesActivo: 0, ultimaFactura: 'Activo' },
  ],

  /* Cancelados: NINGUNO en la semana. El corte lo dice con todas sus letras
     —«No contamos con registros de clientes cancelados en la semana»— así que
     la lista va vacía a propósito. Vacío por ausencia de bajas, no por falta
     de dato: son cosas distintas y la de aquí es la buena. */
  cancelados: [],

  /* Downgrades de la semana — 3 clientes · $6,530.00, ordenados por % de
     reducción de mayor a menor. El detalle por artículo reconstruye exactamente
     la pérdida declarada de cada uno (ver la conciliación del encabezado). */
  downgradeTotalReal: 6530.00,
  downgrades: [
    { cliente: '🔝 Sellos de Seguridad Grupo Elyon', perdida: 580.00,  nota: '85% de baja — la mayor reducción porcentual de la semana. Quitó DiD Nacional ($99), paquete 800 ($90) y Paquete Min VyC ($490); adquirió DiD Internacional ($99). Neto $580. Se queda con una fracción mínima de lo que pagaba.' },
    { cliente: 'Dicap Desarrollos',                  perdida: 2209.00, nota: '79% de baja. Paquete Min VyC $2,779.00 → $570.00.' },
    { cliente: 'IBC SUITES',                         perdida: 3741.00, nota: '46% de baja — el mayor monto de la semana. Paquete Min VyC $5,800.00 → $2,059.00.' },
  ],

  downgradeArticulos: [
    { articulo: 'Paquete Min VyC',      vecesAfectado: 3, clientes: ['Sellos de Seguridad Grupo Elyon', 'Dicap Desarrollos', 'IBC SUITES'] },
    { articulo: 'DiD Nacional',         vecesAfectado: 1, clientes: ['Sellos de Seguridad Grupo Elyon'] },
    { articulo: 'Paquete 800',          vecesAfectado: 1, clientes: ['Sellos de Seguridad Grupo Elyon'] },
  ],

  /* Antigüedad de la cartera por cobrar — total $425,458.20.
     Incluye Activo + Hard Suspend + Soft Suspend; Cancelado no forma parte de
     la cartera por cobrar. «Por vencer» es el total Activo al corriente.
     Los dos tramos vencidos suman exactamente el dinero fuera de cartera. */
  antiguedadSaldos: [
    { rango: 'Por vencer',           monto: 395802.22 },
    { rango: '1 – 7 días vencido',   monto: 0.00 },
    { rango: '8 – 15 días vencido',  monto: 12263.00 },
    { rango: '16 – 30 días vencido', monto: 17392.98 },
    { rango: 'Más de 30 días',       monto: 0.00 },
  ],

  /* Fuera de cartera — Hard Suspend 10 cuentas · $17,811.98 · 19.5 días
     promedio y Soft Suspend 17 cuentas · $11,844.00 · 10.5 días. El reporte no
     desglosa nombres en ninguno de los dos estados. Total 27 cuentas ·
     $29,655.98. Ojo: el escenario de CIERRE DE AGOSTO habla de 23 cuentas en
     Hard Suspend por $22,212.40 — es otro periodo, no se compara con éste.

     Y un detalle que el corte no explica: el TOTAL de Hard + Soft empata exacto
     con los tramos vencidos, pero el reparto cruza por $419.00 — Hard tiene
     $419.00 MÁS que el tramo de 16 a 30 días y Soft exactamente $419.00 MENOS
     que el de 8 a 15. No se le inventa una correspondencia cuenta por cuenta:
     se deja anotado para preguntarlo. */
  suspendidosTotalReal:   29655.98,
  suspendidosCuentasReal: 27,
  suspendidos: [
    { cliente: 'Hard Suspend — 10 cuentas · 19.5 días promedio pendiente de pago. El reporte no desglosa nombres.', importe: 17811.98, mesesActivo: 0, estado: 'Suspendido' },
    { cliente: 'Soft Suspend — 17 cuentas · 10.5 días promedio pendiente de pago. El reporte no desglosa nombres.', importe: 11844.00, mesesActivo: 0, estado: 'Suspendido' },
  ],
}

/* ═══════════════════════════════════════════════════════════════════════
   REPORTE SEMANAL — SEMANA 21 · SEPTIEMBRE 2026  (22 sep 2026)
   Remitente: Valeria Zepeda Hernández (equipo Data).

   CONCILIACIÓN DE ESTE CORTE. Cuadra en casi todo, y donde no, se dice:
     · Hard: 15,917.98 (6 previas) + 16,079.00 (17 nuevas) = 31,996.98 ✓ y 6+17 = 23 ✓
     · Cancelados: los 7 importes suman 12,144.00 ✓
     · Fuera de cartera: 31,996.98 + 24,107.00 + 12,144.00 = 68,247.98 ✓ y 23+23+7 = 53 ✓
     · Antigüedad: los cinco tramos suman 249,215.25 ✓
     · Contempo BR se puede reconstruir: 1,959.00 → 1,029.00 = 930.00, el 47% ✓

   ✗ LOS DOWNGRADES NO CIERRAN. La tabla suma 8,115.55 y con Neruc (11,105.97)
     da 19,221.52, pero el corte declara 22,183.52: faltan $2,962.00. Y NO es
     un cliente sin listar —dice «6 clientes identificados» y hay 5 + Neruc = 6—,
     así que o una cifra publicada está mal o hay un importe sin desglosar.

   ✗ DOS IMPORTES CRUZADOS entre CAMPESTRE LOS VIVEROS y HOTEL REAL DE MINAS:
     CAMPESTRE quitó un artículo de $1,245 y se le carga una pérdida de $1,460;
     al HOTEL le pasa justo al revés. Cada uno lleva la cifra del otro. El total
     no cambia (2,705 de cualquier modo), pero los porcentajes sí.

   ⚠ LOS TRAMOS VENCIDOS VUELVEN A CRUZARSE, y ya van dos cortes seguidos: el
     de 8–15 días tiene $489.00 MÁS que Soft Suspend y el de 16–30 exactamente
     $489.00 MENOS que Hard. En la semana 20 el cruce fue de $419.00. El neto
     es cero y el total general no se mueve, así que no es un error de suma —
     parece que una cuenta se clasifica por fecha en un lado y por estado en el
     otro. Dos veces seguidas ya no es casualidad: hay que preguntarlo.

   ⚠ EL CORREO SE CONTRADICE EN EL NÚMERO DE SEMANA: el asunto dice «Semana 21»
     y el cuerpo dice «semana 13» dos veces (en la entrada y en el título de
     los downgrades). Por continuidad con el corte anterior —que fue la 20— se
     registra como 21, y queda dicho que el original no es consistente.
═══════════════════════════════════════════════════════════════════════ */
export const REPORTE_S21_SEPTIEMBRE_2026: ChurnReporte = {
  id:      's21-septiembre-2026',
  periodo: 'Semana 21 · Sep 2026',
  fecha:   '22/09/2026',
  notas:   'Gross Revenue Churn · Semana 21. Al 22 de septiembre del 2026. Top 10 de cuentas Activas, Hard Suspend / Soft Suspend / Cancelados con el seguimiento de quiénes escalaron de Soft a Hard, antigüedad de la cartera por cobrar y downgrades ordenados por % de reducción, incluido el caso especial de Neruc Sede Central. Próxima revisión: miércoles 30 de septiembre.',
  notaRemitente: 'Valeria Zepeda Hernández — Equipo Data. Próxima revisión: miércoles 30 de septiembre.',

  grc: {
    evolucion: [
      { mes: 'Julio',      pct: 1.9,  anterior: 2.0 },
      { mes: 'Agosto',     pct: 2.3,  anterior: 2.4 },
      { mes: 'Septiembre', pct: 23.6 },
    ],
    acumulado: 17.2,
    anterior:  17.4,
    notaClave: 'Churn Q3: Julio baja de 2.0% a 1.9% · Agosto baja de 2.4% a 2.3% · Septiembre 23.6%, MES CORRIENDO Y NO DEFINITIVO. Acumulado hasta agosto 2026: 17.2% (ant. 17.4%).',
    notaEspecial:
      '🔴 EL 23.6% DE SEPTIEMBRE NO ES UNA CAÍDA DEL NEGOCIO. Es el mes sin cerrar: Zoho marca como churn todo contrato que aún no se factura. Julio y agosto, ya cerrados, están en 1.9% y 2.3%. Leer el 23.6% como resultado sería el mismo error que ya documentamos en el corte de la semana 20 — el mes vivo mide retraso de cobranza, no bajas. '
      + '📉 TERCERA CORRECCIÓN A LA BAJA CONSECUTIVA de julio y agosto, ahora de una décima cada uno. Después de los vaivenes de agosto (4.9% → 3.4% → 2.4% → 2.3%) el número por fin se está asentando. '
      + '🟠 LA ESCALACIÓN ES EL DATO DE LA SEMANA: de las 17 cuentas que estaban en Soft Suspend, 11 pasaron a Hard — el 64%. No es una foto de morosidad, es una tendencia: quien entra en Soft acaba en Hard dos de cada tres veces. El Hard Suspend pasó de 10 cuentas y $17,811.98 (semana 20) a 23 cuentas y $31,996.98, y el promedio de días pendientes subió de 19.5 a 17.9 sobre una base mucho mayor. '
      + '💰 $68,247.98 EN 53 CUENTAS NO HAN ENTRADO A LA CARTERA — 27.4% de los $249,215.25 por cobrar. '
      + '⛽ TRES CUENTAS DE GRUPO PETROIL EN EL TOP 10 ACTIVO: Centro de Ayuda TI ($4,771), Colosio Mzt ($3,893) y Torre de Control ($3,839), $12,503 entre las tres. Coincide con lo que GRC ya marcaba como Churn confirmado para esas mismas tres líneas. '
      + '🆕 «Mi Hospedaje Travel» entra al Top 10 con $4,914.00 y CERO meses activo: una cuenta que nunca llegó a facturar un mes completo y ya está en cartera por cobrar. '
      + '📌 EL TOP 10 PESA EL 60.0% de la cartera Activo ($115,771.52 de $193,111.27). Ese porcentaje sale de sumar su propia tabla: el corte no declara cuántas cuentas tiene la cartera en total.',
  },

  /* Top 10 de cuentas Activo. `ultimaFactura` no viene en este corte. */
  pendientesTotalReal:   193111.27,
  pendientes: [
    { cliente: 'ADSA',                          monto: 32375.00, mesesActivo: 92, ultimaFactura: '—' },
    { cliente: 'Ancona Autopartes',             monto: 27707.00, mesesActivo: 83, ultimaFactura: '—' },
    { cliente: 'VAEO',                          monto: 15995.52, mesesActivo:  4, ultimaFactura: '—' },
    { cliente: 'HomiRent',                      monto: 11998.00, mesesActivo: 51, ultimaFactura: '—' },
    { cliente: 'KW - Pedregal',                 monto:  6481.00, mesesActivo: 93, ultimaFactura: '—' },
    { cliente: 'Mi Hospedaje Travel',           monto:  4914.00, mesesActivo:  0, ultimaFactura: '—' },
    { cliente: 'Petroil - Centro de Ayuda TI',  monto:  4771.00, mesesActivo: 36, ultimaFactura: '—' },
    { cliente: 'Petroil - Colosio Mzt',         monto:  3893.00, mesesActivo: 51, ultimaFactura: '—' },
    { cliente: 'Petroil - Torre de Control',    monto:  3839.00, mesesActivo: 50, ultimaFactura: '—' },
    { cliente: 'EKTARIS GRUPO INMOBILIARIO',    monto:  3798.00, mesesActivo:  9, ultimaFactura: '—' },
  ],

  /* El corte da el motivo de cada baja pero NO los meses activos ni el
     acumulado histórico: van en 0 porque no se miden, no porque valgan cero. */
  cancelados: [
    { cliente: 'VEMEPE — proyecto en pausa: es para un tercero que aún no tiene equipo de atención listo; posible reactivación en ~2 meses.', mrr: 6890.00, mesesActivo: 0, acumulado: 0 },
    { cliente: 'INBROTEK SERVICIOS — problema financiero: no puede seguir pagando y requiere capitalizarse; rechazó el plan de extensiones ilimitadas en CE.', mrr: 2801.00, mesesActivo: 0, acumulado: 0 },
    { cliente: 'Bodegard — cambios organizacionales internos.', mrr: 979.00, mesesActivo: 0, acumulado: 0 },
    { cliente: 'ISESA GENERADORES — falla técnica: la plataforma se desconectaba con frecuencia.', mrr: 967.00, mesesActivo: 0, acumulado: 0 },
    { cliente: 'Visium Supplies — falta de valor percibido, sin respuesta del cliente.', mrr: 169.00, mesesActivo: 0, acumulado: 0 },
    { cliente: 'GMG Inmuebles — reducción de operaciones: cliente en proceso de jubilación, ya no usaba el servicio.', mrr: 169.00, mesesActivo: 0, acumulado: 0 },
    { cliente: 'Espacio Mexico — motivo desconocido, sin respuesta del cliente.', mrr: 169.00, mesesActivo: 0, acumulado: 0 },
  ],

  downgradeTotalReal: 22183.52,
  downgrades: [
    { cliente: 'IML', perdida: 3699.55, nota: '23% de baja. Quitó CALLPICKER ($3,699.55) — artículo «PND Mensaje en Conversación Nov 25». Es la mayor pérdida de la tabla.' },
    { cliente: 'CAMPESTRE LOS VIVEROS', perdida: 1460.00, nota: '55% de baja. Quitó Agente CP Chat ($1,245). ⚠ La cifra de pérdida y la del artículo NO coinciden, y están cruzadas con las del Hotel Real de Minas: ese quitó $1,460 y se le carga $1,245. Cada uno lleva el importe del otro.' },
    { cliente: 'HOTEL REAL DE MINAS SAN MIGUEL DE ALLENDE', perdida: 1245.00, nota: '24% de baja. Quitó Extensión VyC ($1,460). ⚠ Mismo cruce que CAMPESTRE: el artículo vale más que la pérdida declarada.' },
    { cliente: 'Contempo BR', perdida: 930.00, nota: '47% de baja. Paquete Min VyC de $1,959.00 a $1,029.00. Es el único que se reconstruye al centavo desde sus propios datos.' },
    { cliente: 'Terralta Residencial', perdida: 781.00, nota: '79% de baja, la mayor en proporción. Quitó paquete Min VyC ($979) y adquirió DiD Nacional ($198): 979 − 198 = 781 ✓.' },
    { cliente: 'Neruc Sede Central — CASO ESPECIAL, NO ENTRA AL RANKING', perdida: 11105.97, nota: 'Facturaba Min Calltracking ($6,099.97) + DiD Nacional ($7,139.00) + DiD Internacional ($300.00) y ahora solo Min VyC ($475.00) + DiD Nacional ($1,958.00). El corte NO define si es un downgrade real por cambio de artículos o un upsell cuyos conceptos del mes anterior faltan por facturar. Requiere revisión antes de contarlo como pérdida.' },
    { cliente: '⚠ DESCUADRE DEL CORTE — $2,962.00 sin explicar', perdida: 0, nota: 'La tabla suma $8,115.55 y con Neruc $19,221.52, pero el corte declara $22,183.52. No es un cliente sin listar: dice «6 clientes identificados» y hay 5 + Neruc = 6. O una cifra publicada está mal, o hay un importe que no se desglosó. Se registra el total declarado ($22,183.52) y se deja el hueco a la vista en vez de cuadrarlo por la fuerza.' },
  ],

  suspendidosTotalReal:   56103.98,
  suspendidosCuentasReal: 46,
  suspendidos: [
    { cliente: 'Hard Suspend — 23 cuentas · 17.9 días promedio pendiente de pago. 6 vienen de la semana anterior ($15,917.98) y 17 son nuevas ($16,079.00); de ellas, 11 escalaron desde Soft Suspend.', importe: 31996.98, mesesActivo: 0, estado: 'Suspendido' },
    { cliente: 'Soft Suspend — 23 cuentas · 11.7 días promedio pendiente de pago. El corte solo desglosa las 5 mayores: iELO ($3,969), EM SOLUCIONES ($3,217), DOSATEC ($2,382), COTERRA AGROBSNSS ($2,356) y MUMBII ($1,745).', importe: 24107.00, mesesActivo: 0, estado: 'Suspendido' },
  ],

  antiguedadSaldos: [
    { rango: 'Por vencer (total Activo)', monto: 193111.27 },
    { rango: '1–7 días vencido',          monto: 0.00 },
    { rango: '8–15 días vencido',         monto: 24596.00 },
    { rango: '16–30 días vencido',        monto: 31507.98 },
    { rango: 'Más de 30 días',            monto: 0.00 },
  ],
}
