/**
 * Corte vigente de Gross Revenue Churn.
 *
 * Separado de `page.tsx` para que Atlas (servidor) y el módulo Churn (cliente)
 * lean exactamente las mismas cifras. Al cargar un corte nuevo, este archivo se
 * reemplaza y el anterior se archiva dentro de `page.tsx`.
 */
import type { ChurnReporte } from './tipos'

/* ═══════════════════════════════════════════════════════════════════════
   REPORTE SEMANAL — SEMANA 23 · CIERRE DE TRIMESTRE T3 2026  (6 oct 2026)
   Remitente: Valeria Zepeda Hernández (equipo Data). Recibido el 7 oct.

   NO ES UN CORTE SEMANAL NORMAL: es el consolidado del trimestre. No trae Top
   10 de Activo, ni Hard/Soft Suspend, ni antigüedad de saldos. Esos campos van
   VACÍOS a propósito — no se rellenan con los de la semana 22.

   CONCILIADO CON `scripts/concilia-churn-t3.py`. Cierra todo lo verificable:
     · las tres filas mensuales suman el TOTAL T3 en las CUATRO columnas ✓
     · Downgrade + Churn = Baja Total en cada mes ✓
     · los tres porcentajes se reconstruyen desde sus propias cifras ✓
       (1.91% · 2.12% · 3.14%, no se espejan del origen)
     · las 24 salidas tempranas suman $26,808.00 ✓ — 18 con CERO meses
     · los 14 downgrades de más del 60% suman $22,399.83 ✓
     · los 4 artículos de CP Chat cierran su categoría en $45,452.51 ✓
     · CP Chat + CP Voz = la «pérdida total» del resumen amplio ✓
     · las TRES bases de MRR coinciden al centavo con `GRC_BASE_MRR`, que sale
       del export institucional — dos fuentes independientes ✓

   LO QUE NO CIERRA, Y ESTÁ EN LA NOTA ESPECIAL: el Top 5 de CP Voz deja fuera
   $99,642.28 (22.8% de su categoría), y las dos bases de MRR del mismo
   trimestre difieren en $623,324.30 sin explicación.
═══════════════════════════════════════════════════════════════════════ */
export const REPORTE_S23_T3_2026: ChurnReporte = {
  id:      's23-t3-2026',
  periodo: 'Semana 23 · Cierre T3 2026',
  fecha:   '06/10/2026',
  notas:   'Gross Revenue Churn · Semana 23. Cierre de trimestre T3 al 6 de octubre del 2026. '
         + 'Consolidado de julio, agosto y septiembre; Top 5 de cancelaciones del trimestre, '
         + 'pérdida por producto en CP Chat y CP Voz, las 24 salidas tempranas con 0 o 1 mes '
         + 'activo y los 14 downgrades de más del 60%. Por ser cierre de trimestre NO trae Top 10 '
         + 'de Activo, ni Hard/Soft Suspend, ni antigüedad de saldos: esos bloques salen vacíos '
         + 'porque el corte no los reporta, no porque valgan cero. Próxima revisión: miércoles '
         + 'próximo, por la mañana.',
  notaRemitente: 'Valeria Zepeda Hernández — Equipo Data. Próxima revisión: miércoles próximo, por la mañana.',

  grc: {
    evolucion: [
      { mes: 'Julio',      pct: 1.91 },
      { mes: 'Agosto',     pct: 2.12 },
      { mes: 'Septiembre', pct: 3.14, anterior: 6.9 },
    ],
    acumulado: 2.39,
    /* El 2.39% es del TRIMESTRE, no del año. Sin esta etiqueta la tarjeta
       diría «GRC Acumulado Septiembre 2.39%» y se leería como que el año se
       desplomó desde el 23.7% de la semana 22, que es otra cosa. */
    acumuladoEtiqueta: 'T3 2026 · Jul–Sep (ponderado)',
    notaClave:
      'Cierre de T3 2026: Julio 1.91% · Agosto 2.12% · Septiembre 3.14%. Baja total del trimestre '
      + '$356,494.79 sobre $14,905,931.06 de MRR. El trimestre EMPEORA mes a mes y lo que crece es '
      + 'el churn confirmado ($69,086.46 → $100,567.96), no el downgrade. El 2.39% es el promedio '
      + 'PONDERADO de los tres meses: el corte deja esa casilla en blanco y lo reconstruye '
      + 'Customer Success dividiendo la baja total entre la suma de las tres bases.',
    notaEspecial:
      '🔵 SEPTIEMBRE CIERRA EN 3.14%, Y ES LA TERCERA LECTURA DEL MISMO MES: 23.6% el 22 de '
      + 'septiembre, 6.9% el 29, y 3.14% ya cerrado. De la primera cifra a la definitiva se '
      + 'desinfló a UNA SÉPTIMA PARTE. Quien haya reportado el 23.6% como resultado de septiembre '
      + 'reportó un número siete veces mayor que el real. Es exactamente lo que este módulo lleva '
      + 'tres cortes advirtiendo: el mes vivo mide retraso de cobranza, no bajas, porque Zoho marca '
      + 'como churn todo contrato que aún no factura. '
      + '📌 EL ACUMULADO DEL AÑO QUEDA VENCIDO Y SIN SUSTITUTO. La semana 22 publicó 23.7% acumulado '
      + '2026; este corte reexpresa septiembre a la baja y NO vuelve a publicar el acumulado anual. '
      + 'O sea que el 23.7% ya no es cierto y no hay cifra nueva — no se inventa una. El 2.39% de la '
      + 'tarjeta es del TRIMESTRE. '
      + '⏱️ VEINTICUATRO CUENTAS SE FUERON CON 0 O 1 MES DE VIDA ($26,808.00), y DIECIOCHO de ellas '
      + 'con CERO meses ($13,740.00): nunca llegaron a facturar un mes completo. Dos ni siquiera '
      + 'tienen nombre en el sistema (cp188899, cp189204) — entraron y se fueron sin que nadie las '
      + 'bautizara. '
      + '🔻 EL TOP 5 DE CANCELACIONES SUMA $53,095.93 de los $225,867.20 de churn confirmado del '
      + 'trimestre: el 23.5%. Los otros $172,771.27 no se desglosan en este corte. '
      + '\n\n━━ OBSERVACIONES DE CUSTOMER SUCCESS ━━ '
      + 'Lo que sigue lo detectamos NOSOTROS al conciliar el corte contra sus propias tablas con '
      + '`scripts/concilia-churn-t3.py`. Queda registrado de nuestra parte, no se consultó al equipo '
      + 'Data y no se corrige ninguna cifra publicada. '
      + '① EL TOP 5 DE CP VOZ DEJA FUERA $99,642.28, el 22.8% de su categoría. Los cinco artículos '
      + 'suman $337,904.27 y la categoría vale $437,546.55. Citar el Top 5 como «la pérdida de voz» '
      + 'se equivoca por casi un cuarto. El de CP Chat sí cierra: son los cuatro artículos completos. '
      + '② LAS DOS BASES DE MRR DEL MISMO TRIMESTRE NO COINCIDEN. El resumen mensual usa '
      + '$14,905,931.06 y el resumen amplio $14,282,606.76 — $623,324.30 de diferencia que el corte '
      + 'no explica. Preguntarlo antes de citar cualquiera de los dos como «el MRR del T3». '
      + '③ LA PÉRDIDA POR PRODUCTO ($482,999.06) SUPERA A LA BAJA TOTAL ($356,494.79) EN $126,504.27, '
      + 'y eso NO es un descuadre: la tabla de productos es impacto BRUTO, sin netear contra los '
      + 'upsells dentro de la misma cuenta. Es el mismo aviso de la semana 22. No sumar las dos tablas. '
      + '④ TATSA (D59) ES LA SEGUNDA CANCELACIÓN MÁS GRANDE DEL TRIMESTRE —$11,086 en agosto, 4 meses '
      + 'activa— Y LA DIMOS DE ALTA COMO CUENTA TOP EL 9 DE SEPTIEMBRE, un mes DESPUÉS de su baja. '
      + 'Hoy figura en hibernación, así que ya se corrigió; lo que conviene saber es cómo entró: el '
      + 'alta se hizo desde una ficha de dirección y SIN CID, así que no cruzaba con facturación y '
      + 'ninguna fuente pudo avisar. Es el argumento más concreto para exigir CID en toda alta. '
      + '⑤ CINCO CLIENTES DE ESTE CORTE ESTÁN EN NUESTRA CARTERA: Bliss crédito libre (C28, '
      + 'cancelado), TATSA (D59, hibernación), Mas Suites (C32, hibernación), INBROTEK SERVICIOS '
      + '(C66, en riesgo) y Hound Express (D30, en riesgo). Los tres primeros ya están movidos; los '
      + 'dos últimos siguen vivos con downgrades del 71.17% y 64.01%. El cruce es POR NOMBRE —el '
      + 'correo no trae CIDs— así que es indicativo y no obliga a mover nada por sí solo. '
      + '⑥ INBROTEK CAMBIA DE CLASIFICACIÓN ENTRE CORTES: la semana 22 la listaba como Cancelado '
      + '($2,801) y ésta como downgrade del 71.17% ($6,915.96) en agosto. Dos lecturas distintas del '
      + 'mismo cliente en la misma familia de reportes. Hoy está en nuestra cartera como en riesgo '
      + 'con $5,510, que es coherente con el downgrade y no con la cancelación. Vale preguntarlo. '
      + '⑦ LO QUE SÍ CUADRA, al centavo: las tres filas mensuales contra el TOTAL T3 en las cuatro '
      + 'columnas; Downgrade + Churn = Baja Total en cada mes; los tres porcentajes reconstruidos '
      + 'desde sus propias cifras; las 24 salidas tempranas ($26,808.00); los 14 downgrades '
      + '($22,399.83); los 4 artículos de CP Chat ($45,452.51); CP Chat + CP Voz = la pérdida total '
      + 'del resumen amplio ($482,999.06); y las TRES bases de MRR del correo coinciden al centavo '
      + 'con las del export institucional que ya vive en el repo.',
  },

  /* El cierre de trimestre NO reporta Top 10 de cuentas Activo. Va vacío
     porque el corte no lo trae, no porque no haya cartera por cobrar. */
  pendientes: [],

  /* Top 5 de cancelaciones de TODO el trimestre. Suman $53,095.93 de los
     $225,867.20 de churn confirmado: el 23.5%. El resto no se desglosa.
     `acumulado` (histórico facturado) sólo lo traía el corte de la semana 22
     para tres de ellos; para Bliss y TATSA NO hay dato y queda en 0 dicho con
     palabras — un cero sin medición no es un cero. */
  cancelados: [
    { cliente: 'Bliss crédito libre — la mayor cancelación del trimestre, 24 meses activa, baja en julio. ACUMULADO HISTÓRICO NO DISPONIBLE: ningún corte lo ha publicado. En nuestra cartera es C28 y ya figura como cancelado.', mrr: 16799.97, mesesActivo: 24, acumulado: 0 },
    { cliente: 'TATSA — baja en agosto con 4 meses activa. ACUMULADO HISTÓRICO NO DISPONIBLE. ⚠ Es D59 en nuestra cartera: se dio de alta como cuenta TOP el 9 de septiembre, un mes DESPUÉS de esta baja, con ficha de dirección y sin CID. Hoy está en hibernación.', mrr: 11086.00, mesesActivo: 4, acumulado: 0 },
    { cliente: 'Hoteles y Servicios — contratado en junio 2026, llegó por Adwords tras cambiar de proveedor. Empezó con 16 extensiones y terminó con 6 antes de cancelar en septiembre. Acumulado del corte de la semana 22.', mrr: 10946.98, mesesActivo: 2, acumulado: 32742.00 },
    { cliente: 'Mas Suites — 70 meses activo, el cliente más antiguo de los que se fueron en el trimestre. El corte no da motivo. Es C32 en nuestra cartera, ya en hibernación. Acumulado del corte de la semana 22.', mrr: 7372.98, mesesActivo: 70, acumulado: 393693.64 },
    { cliente: 'VEMEPE — 1 mes activo. También encabeza las salidas tempranas del trimestre. Acumulado del corte de la semana 22.', mrr: 6890.00, mesesActivo: 1, acumulado: 13780.00 },
  ],

  /* El total del trimestre es $130,627.59; los 14 de abajo son SÓLO el
     subconjunto de reducciones mayores al 60%, que suman $22,399.83. */
  downgradeTotalReal: 130627.59,
  downgrades: [
    { cliente: 'MEGAVIAL ABOGADOS', perdida: 1407.00, nota: '93.43% de reducción — la mayor en proporción del trimestre. Septiembre.' },
    { cliente: 'CiberZion',          perdida:  421.87, nota: '86.27% de reducción. Julio. Ojo: la semana 22 reportó para este cliente $1,926.74 de pérdida con 49% de baja — es otro evento, no el mismo.' },
    { cliente: 'MIRA DIAMANTE SOLUCLOUD', perdida: 1122.00, nota: '82.26% de reducción. Julio.' },
    { cliente: 'DUNA',               perdida:  784.00, nota: '80.08% de reducción. Agosto.' },
    { cliente: 'Artesanal.com.mx',   perdida:  784.00, nota: '80.08% de reducción. Septiembre. Mismo importe y mismo porcentaje que DUNA en agosto.' },
    { cliente: 'DATA SMART INFORMATIC', perdida: 604.00, nota: '75.59% de reducción. Septiembre.' },
    { cliente: 'INBROTEK SERVICIOS', perdida: 6915.96, nota: '71.17% de reducción y la MAYOR pérdida de este subconjunto. Agosto. ⚠ Es C66 en nuestra cartera, de Fátima, hoy en riesgo con $5,510. La semana 22 la listaba como Cancelado ($2,801): dos clasificaciones distintas del mismo cliente.' },
    { cliente: 'Zuhma',              perdida:  340.00, nota: '69.53% de reducción. Agosto.' },
    { cliente: 'Soluciones Textiles del Norte', perdida: 1350.00, nota: '68.91% de reducción. Julio.' },
    { cliente: 'BAKELGROUP',         perdida:  320.00, nota: '65.44% de reducción. Julio.' },
    { cliente: 'Hound Express',      perdida: 4481.00, nota: '64.01% de reducción. Septiembre. Es D30 en nuestra cartera, de Dan, hoy en riesgo. La semana 22 reportó el mismo importe ($4,481, paquete Min VyC de $7,000 a $2,519): es el mismo evento visto dos veces, no dos bajas.' },
    { cliente: 'Embler Autopartes',  perdida: 3281.00, nota: '61.44% de reducción. Agosto.' },
    { cliente: 'Visualizza',         perdida:  295.00, nota: '60.20% de reducción. Julio.' },
    { cliente: 'CASBA Consultoría, Seguridad e Higiene Laboral y Salud Ocupacional', perdida: 294.00, nota: '60.12% de reducción. Julio. El menor del subconjunto, justo en el umbral.' },
  ],

  /* Pérdida por producto del trimestre. El importe va en el nombre porque el
     corte NO publica en cuántos casos se perdió cada artículo: `vecesAfectado`
     se queda en 0 y eso significa «no reportado», no «ninguno». */
  downgradeArticulos: [
    { articulo: 'CP VOZ · paquete Min VyC — $118,684.52',             vecesAfectado: 0, clientes: ['(el corte no publica cuántos casos)'] },
    { articulo: 'CP VOZ · Extension Callcenter — $78,481.64',         vecesAfectado: 0, clientes: ['(el corte no publica cuántos casos)'] },
    { articulo: 'CP VOZ · paquete Min CE — $63,561.10',               vecesAfectado: 0, clientes: ['(el corte no publica cuántos casos)'] },
    { articulo: 'CP VOZ · Extension VyC — $48,689.44',                vecesAfectado: 0, clientes: ['(el corte no publica cuántos casos)'] },
    { articulo: 'CP VOZ · DiD Nacional — $28,487.57',                 vecesAfectado: 0, clientes: ['(el corte no publica cuántos casos)'] },
    { articulo: 'CP VOZ · el resto de la categoría — $99,642.28',     vecesAfectado: 0, clientes: ['⚠ CUBO DE CIERRE. El corte sólo publica el Top 5 ($337,904.27) de una categoría que vale $437,546.55. Sin esta fila el Top 5 se leería como toda la pérdida de voz, y deja fuera el 22.8%.'] },
    { articulo: 'CP CHAT · Agente CP Chat — $34,079.14',              vecesAfectado: 0, clientes: ['(el corte no publica cuántos casos)'] },
    { articulo: 'CP CHAT · Agente CP Chat Callcenter — $10,313.37',   vecesAfectado: 0, clientes: ['(el corte no publica cuántos casos)'] },
    { articulo: 'CP CHAT · paquete Chatbot — $1,000.00',              vecesAfectado: 0, clientes: ['(el corte no publica cuántos casos)'] },
    { articulo: 'CP CHAT · paquete Whatsapp API — $60.00',            vecesAfectado: 0, clientes: ['CP Chat SÍ cierra: estos cuatro artículos son la categoría completa, $45,452.51.'] },
  ],

  /* Las 24 salidas tempranas del trimestre: cuentas que se cayeron con 0 o 1
     mes activo. 18 con CERO meses ($13,740.00) y 6 con uno ($13,068.00). */
  desactivadosTotalReal:   26808.00,
  desactivadosCuentasReal: 24,
  desactivados: [
    { cliente: 'VEMEPE — septiembre',                              importe: 6890.00, mesesActivo: 1 },
    { cliente: 'GRUPO GEVHE — julio. Pedía un plan más grande: no le avisaron al contratar que los minutos se tarifican distinto. Se le ofrecieron alternativas y decidió no continuar.', importe: 3817.00, mesesActivo: 1 },
    { cliente: 'RDS ELITE CONDOS PDC SA DE CV — agosto. Se fue por la caída de las tasas de respuesta telefónica, que bajaron al 6–10%. Descartó ajustar plan o migrar a chat y contrató a un competidor externo con mensajería integrada.', importe: 2387.00, mesesActivo: 0 },
    { cliente: 'Delta Capital & Holding Street — julio',           importe: 2377.00, mesesActivo: 0 },
    { cliente: 'Alamo Seguros — julio',                            importe: 1959.00, mesesActivo: 0 },
    { cliente: 'syndeX — agosto',                                  importe: 1318.00, mesesActivo: 1 },
    { cliente: 'IMAGINA SER — septiembre',                         importe: 1080.00, mesesActivo: 0 },
    { cliente: 'BLACKNET — septiembre',                            importe:  668.00, mesesActivo: 0 },
    { cliente: 'INTERHOME GJ — septiembre',                        importe:  519.00, mesesActivo: 0 },
    { cliente: 'Grupo Altiora — septiembre',                       importe:  519.00, mesesActivo: 0 },
    { cliente: 'Dios Del Aire CLN — julio',                        importe:  489.00, mesesActivo: 0 },
    { cliente: 'Torre Himalaya 24 — julio',                        importe:  489.00, mesesActivo: 1 },
    { cliente: 'MA-AR TRANSPORTE LOGISTICO — julio',               importe:  489.00, mesesActivo: 0 },
    { cliente: 'DISENSA FC — agosto',                              importe:  489.00, mesesActivo: 0 },
    { cliente: 'Sistemas Secuencia — agosto',                      importe:  489.00, mesesActivo: 0 },
    { cliente: 'Sport and Therapy — agosto',                       importe:  489.00, mesesActivo: 0 },
    { cliente: 'cp188899 — agosto. SIN NOMBRE en el sistema: entró y se fue sin que nadie la bautizara.', importe: 489.00, mesesActivo: 0 },
    { cliente: 'COMERCIALIZADORA SIN FRONTERAS — agosto',          importe:  489.00, mesesActivo: 0 },
    { cliente: 'cp189204 — septiembre. SIN NOMBRE en el sistema.', importe:  359.00, mesesActivo: 1 },
    { cliente: 'SMUM México — septiembre',                         importe:  209.00, mesesActivo: 0 },
    { cliente: 'Rentería Flow& Axis Consulting — septiembre. Aparecía como Hard Suspend en la semana 22 por el mismo importe.', importe: 209.00, mesesActivo: 0 },
    { cliente: 'Inmobiliaria Gess 2.17 — agosto',                  importe:  195.00, mesesActivo: 1 },
    { cliente: 'SGI MEXICO — agosto',                              importe:  195.00, mesesActivo: 0 },
    { cliente: 'Denver Medical — agosto',                          importe:  195.00, mesesActivo: 0 },
  ],
}
