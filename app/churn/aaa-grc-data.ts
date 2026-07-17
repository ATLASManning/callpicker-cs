export interface AAAGrcRow {
  cliente: string
  facturas: number
  meses: number
  acumulado: number
  mrrInicio: number
  mrrFin: number
  movimiento: string
  perdido: number
  perdido2: number  // Fraude / caso especial (segunda columna Ingreso Perdido)
}

export interface AAAGrcMes {
  mes: string
  clientes: AAAGrcRow[]
}

export const AAA_GRC_H1_2026: AAAGrcMes[] = [
  {
    mes: 'Enero',
    clientes: [
      { cliente: 'Velfare',                     facturas: 2,  meses: 14,  acumulado: 206700.17,   mrrInicio: 13780.17, mrrFin: 13780.00, movimiento: 'Downgrade',              perdido: 0.17,     perdido2: 0 },
      { cliente: 'GDA - BMR',                   facturas: 0,  meses: 37,  acumulado: 511605.00,   mrrInicio: 689.00,   mrrFin: 0,        movimiento: 'Churn confirmado',        perdido: 689.00,   perdido2: 0 },
      { cliente: 'El Surtidor',                 facturas: 7,  meses: 104, acumulado: 605108.84,   mrrInicio: 7840.00,  mrrFin: 6960.00,  movimiento: 'Downgrade',              perdido: 880.00,   perdido2: 0 },
      { cliente: 'MASH SEGUROS',                facturas: 8,  meses: 27,  acumulado: 138718.23,   mrrInicio: 6751.00,  mrrFin: 5635.00,  movimiento: 'Downgrade',              perdido: 1116.00,  perdido2: 0 },
      { cliente: 'GDA - Lister',                facturas: 0,  meses: 37,  acumulado: 512339.00,   mrrInicio: 689.00,   mrrFin: 0,        movimiento: 'Churn confirmado',        perdido: 689.00,   perdido2: 0 },
      { cliente: 'Global Trust Solutions EZQ',  facturas: 4,  meses: 6,   acumulado: 50866.00,    mrrInicio: 9974.00,  mrrFin: 7729.00,  movimiento: 'Downgrade + Fraude',     perdido: 0,        perdido2: 2245.00 },
      { cliente: 'Shai',                        facturas: 7,  meses: 123, acumulado: 1281806.31,  mrrInicio: 6650.00,  mrrFin: 6275.00,  movimiento: 'Downgrade',              perdido: 375.00,   perdido2: 0 },
      { cliente: 'Power Street',                facturas: 7,  meses: 148, acumulado: 2775101.10,  mrrInicio: 15500.00, mrrFin: 15490.00, movimiento: 'Downgrade',              perdido: 10.00,    perdido2: 0 },
      { cliente: 'WOLFTOWERS',                  facturas: 2,  meses: 42,  acumulado: 237213.90,   mrrInicio: 7876.00,  mrrFin: 5676.00,  movimiento: 'Downgrade',              perdido: 2200.00,  perdido2: 0 },
      { cliente: 'GDA - Family Labs',           facturas: 0,  meses: 38,  acumulado: 328957.00,   mrrInicio: 4580.00,  mrrFin: 0,        movimiento: 'Churn confirmado',        perdido: 4580.00,  perdido2: 0 },
      { cliente: 'GDA - Genética',              facturas: 0,  meses: 18,  acumulado: 288244.80,   mrrInicio: 12812.00, mrrFin: 0,        movimiento: 'Churn confirmado',        perdido: 12812.00, perdido2: 0 },
      { cliente: 'GDA - Polab',                 facturas: 0,  meses: 37,  acumulado: 514130.00,   mrrInicio: 5800.00,  mrrFin: 0,        movimiento: 'Churn confirmado',        perdido: 5800.00,  perdido2: 0 },
      { cliente: 'Virket - EnDigital',          facturas: 7,  meses: 124, acumulado: 3737325.18,  mrrInicio: 6730.57,  mrrFin: 6272.10,  movimiento: 'Downgrade',              perdido: 458.47,   perdido2: 0 },
      { cliente: 'Cargo Lift',                  facturas: 7,  meses: 129, acumulado: 1381896.40,  mrrInicio: 19729.40, mrrFin: 19699.40, movimiento: 'Downgrade',              perdido: 30.00,    perdido2: 0 },
    ],
  },
  {
    mes: 'Febrero',
    clientes: [
      { cliente: 'MB Signature Properties',          facturas: 1, meses: 16,  acumulado: 146931.98,  mrrInicio: 9697.03,  mrrFin: 0,        movimiento: 'Churn confirmado',          perdido: 9697.03,  perdido2: 0 },
      { cliente: 'Campus Residencias',               facturas: 2, meses: 4,   acumulado: 25836.00,   mrrInicio: 6459.00,  mrrFin: 0,        movimiento: 'Churn confirmado',          perdido: 6459.00,  perdido2: 0 },
      { cliente: 'Servidiesel',                      facturas: 1, meses: 0,   acumulado: 7065.00,    mrrInicio: 7065.00,  mrrFin: 0,        movimiento: 'Churn confirmado',          perdido: 7065.00,  perdido2: 0 },
      { cliente: 'ZIBAHOME',                         facturas: 6, meses: 21,  acumulado: 110700.00,  mrrInicio: 5300.00,  mrrFin: 1470.00,  movimiento: 'Downgrade',                perdido: 3830.00,  perdido2: 0 },
      { cliente: 'Power Street',                     facturas: 7, meses: 148, acumulado: 2775101.10, mrrInicio: 15490.00, mrrFin: 15461.50, movimiento: 'Downgrade',                perdido: 28.50,    perdido2: 0 },
      { cliente: 'Trustworthy Business Services',    facturas: 2, meses: 1,   acumulado: 13969.00,   mrrInicio: 7234.00,  mrrFin: 0,        movimiento: 'Churn confirmado + Fraude', perdido: 0,        perdido2: 7234.00 },
      { cliente: 'CENTRO DE ESTUDIOS DE POSGRADO',   facturas: 8, meses: 9,   acumulado: 71127.10,   mrrInicio: 8875.00,  mrrFin: 6075.10,  movimiento: 'Downgrade',                perdido: 2799.90,  perdido2: 0 },
      { cliente: 'Virket - EnDigital',               facturas: 7, meses: 124, acumulado: 3737325.18, mrrInicio: 6272.10,  mrrFin: 6215.63,  movimiento: 'Downgrade',                perdido: 56.47,    perdido2: 0 },
      { cliente: 'JAD Suministros',                  facturas: 3, meses: 75,  acumulado: 552266.81,  mrrInicio: 7555.00,  mrrFin: 4023.00,  movimiento: 'Downgrade',                perdido: 3532.00,  perdido2: 0 },
      { cliente: 'Cargo Lift',                       facturas: 7, meses: 129, acumulado: 1381896.40, mrrInicio: 19699.40, mrrFin: 18521.80, movimiento: 'Downgrade',                perdido: 1177.60,  perdido2: 0 },
    ],
  },
  {
    mes: 'Marzo',
    clientes: [
      { cliente: 'GTC - TLALPAN',       facturas: 1, meses: 0,   acumulado: 6760.00,    mrrInicio: 6760.00,  mrrFin: 0,        movimiento: 'Churn confirmado', perdido: 6760.00,  perdido2: 0 },
      { cliente: 'Velfare',             facturas: 2, meses: 14,  acumulado: 206700.17,  mrrInicio: 13780.00, mrrFin: 0,        movimiento: 'Churn confirmado', perdido: 13780.00, perdido2: 0 },
      { cliente: 'INBROTEK SERVICIOS',  facturas: 9, meses: 44,  acumulado: 259303.86,  mrrInicio: 12717.00, mrrFin: 9698.99,  movimiento: 'Downgrade',        perdido: 3018.01,  perdido2: 0 },
      { cliente: 'Salud y Hogar',       facturas: 9, meses: 115, acumulado: 1506842.33, mrrInicio: 29464.00, mrrFin: 28865.00, movimiento: 'Downgrade',        perdido: 599.00,   perdido2: 0 },
      { cliente: 'WOLFTOWERS',          facturas: 2, meses: 42,  acumulado: 237213.90,  mrrInicio: 7876.00,  mrrFin: 0,        movimiento: 'Churn confirmado', perdido: 7876.00,  perdido2: 0 },
      { cliente: 'Ancona Autopartes',   facturas: 7, meses: 82,  acumulado: 1262333.59, mrrInicio: 32952.00, mrrFin: 31274.00, movimiento: 'Downgrade',        perdido: 1678.00,  perdido2: 0 },
      { cliente: 'Pitahaya',            facturas: 7, meses: 14,  acumulado: 98614.98,   mrrInicio: 11483.02, mrrFin: 11383.97, movimiento: 'Downgrade',        perdido: 99.05,    perdido2: 0 },
      { cliente: 'GTC - LA JOYA',       facturas: 1, meses: 0,   acumulado: 5986.00,    mrrInicio: 5986.00,  mrrFin: 0,        movimiento: 'Churn confirmado', perdido: 5986.00,  perdido2: 0 },
    ],
  },
  {
    mes: 'Abril',
    clientes: [
      { cliente: 'TurboDays',          facturas: 1, meses: 0,   acumulado: 6890.00,    mrrInicio: 6890.00,  mrrFin: 0,        movimiento: 'Churn confirmado', perdido: 6890.00,  perdido2: 0 },
      { cliente: 'IBC SUITES',         facturas: 8, meses: 26,  acumulado: 225560.00,  mrrInicio: 8559.00,  mrrFin: 8025.00,  movimiento: 'Downgrade',        perdido: 534.00,   perdido2: 0 },
      { cliente: 'Finsus Cobranza',    facturas: 7, meses: 10,  acumulado: 126098.00,  mrrInicio: 14091.00, mrrFin: 11211.00, movimiento: 'Downgrade',        perdido: 2880.00,  perdido2: 0 },
      { cliente: 'Koltin',             facturas: 3, meses: 41,  acumulado: 325378.68,  mrrInicio: 979.00,   mrrFin: 0,        movimiento: 'Churn confirmado', perdido: 979.00,   perdido2: 0 },
      { cliente: 'Ancona Autopartes',  facturas: 7, meses: 82,  acumulado: 1262333.59, mrrInicio: 31274.00, mrrFin: 26691.00, movimiento: 'Downgrade',        perdido: 4583.00,  perdido2: 0 },
      { cliente: 'Power Street',       facturas: 7, meses: 148, acumulado: 2775101.10, mrrInicio: 15470.50, mrrFin: 15462.50, movimiento: 'Downgrade',        perdido: 8.00,     perdido2: 0 },
      { cliente: 'Pronto LATAM',       facturas: 9, meses: 24,  acumulado: 144800.04,  mrrInicio: 6797.00,  mrrFin: 5328.00,  movimiento: 'Downgrade',        perdido: 1469.00,  perdido2: 0 },
      { cliente: 'Virket - EnDigital', facturas: 7, meses: 124, acumulado: 3737325.18, mrrInicio: 6230.50,  mrrFin: 6217.61,  movimiento: 'Downgrade',        perdido: 12.89,    perdido2: 0 },
      { cliente: 'JAD Suministros',    facturas: 3, meses: 75,  acumulado: 552266.81,  mrrInicio: 4023.00,  mrrFin: 0,        movimiento: 'Churn confirmado', perdido: 4023.00,  perdido2: 0 },
      { cliente: 'Cargo Lift',         facturas: 7, meses: 129, acumulado: 1381896.40, mrrInicio: 19000.40, mrrFin: 18973.00, movimiento: 'Downgrade',        perdido: 27.40,    perdido2: 0 },
    ],
  },
  {
    mes: 'Mayo',
    clientes: [
      { cliente: 'Bliss crédito libre',          facturas: 13, meses: 24,  acumulado: 242183.09,  mrrInicio: 26215.00, mrrFin: 25587.21, movimiento: 'Downgrade',                perdido: 627.79,  perdido2: 0 },
      { cliente: 'Not Just',                     facturas: 5,  meses: 5,   acumulado: 27110.00,   mrrInicio: 5677.00,  mrrFin: 5089.00,  movimiento: 'Downgrade',                perdido: 588.00,  perdido2: 0 },
      { cliente: 'GTC - RIOVERDE',               facturas: 5,  meses: 4,   acumulado: 64270.97,   mrrInicio: 13584.14, mrrFin: 12684.67, movimiento: 'Downgrade',                perdido: 899.47,  perdido2: 0 },
      { cliente: 'GTC - MG LOMAS',               facturas: 5,  meses: 4,   acumulado: 90415.60,   mrrInicio: 19544.44, mrrFin: 17896.49, movimiento: 'Downgrade',                perdido: 1647.95, perdido2: 0 },
      { cliente: 'GTC - NAVA',                   facturas: 5,  meses: 4,   acumulado: 161322.05,  mrrInicio: 35107.85, mrrFin: 31811.95, movimiento: 'Downgrade',                perdido: 3295.90, perdido2: 0 },
      { cliente: 'MASH SEGUROS',                 facturas: 8,  meses: 27,  acumulado: 138718.23,  mrrInicio: 6293.00,  mrrFin: 5898.20,  movimiento: 'Downgrade',                perdido: 394.80,  perdido2: 0 },
      { cliente: 'GTC - MATEHUALA',              facturas: 5,  meses: 4,   acumulado: 66826.97,   mrrInicio: 14182.14, mrrFin: 13282.67, movimiento: 'Downgrade',                perdido: 899.47,  perdido2: 0 },
      { cliente: 'Grupo Premier',                facturas: 7,  meses: 46,  acumulado: 163845.00,  mrrInicio: 3185.00,  mrrFin: 2378.00,  movimiento: 'Downgrade',                perdido: 807.00,  perdido2: 0 },
      { cliente: 'Petroil - Prebiem Oceanica',   facturas: 7,  meses: 32,  acumulado: 231741.00,  mrrInicio: 7409.00,  mrrFin: 4978.00,  movimiento: 'Downgrade',                perdido: 2431.00, perdido2: 0 },
      { cliente: 'GTC - SENDERO',                facturas: 5,  meses: 4,   acumulado: 102697.83,  mrrInicio: 22065.02, mrrFin: 20268.24, movimiento: 'Downgrade',                perdido: 1796.78, perdido2: 0 },
      { cliente: 'GTC - CENTRO MAX',             facturas: 5,  meses: 4,   acumulado: 165043.05,  mrrInicio: 35804.85, mrrFin: 32508.95, movimiento: 'Downgrade',                perdido: 3295.90, perdido2: 0 },
      { cliente: 'Global Trust Solutions EZQ',   facturas: 4,  meses: 6,   acumulado: 50866.00,   mrrInicio: 7729.00,  mrrFin: 0,        movimiento: 'Churn confirmado + Fraude', perdido: 0,       perdido2: 7729.00 },
      { cliente: 'GTC - BMW',                    facturas: 5,  meses: 4,   acumulado: 149671.11,  mrrInicio: 31994.47, mrrFin: 29600.19, movimiento: 'Downgrade',                perdido: 2394.28, perdido2: 0 },
      { cliente: 'GTC - MG POLIFORUM',           facturas: 5,  meses: 4,   acumulado: 92362.60,   mrrInicio: 19882.44, mrrFin: 18234.49, movimiento: 'Downgrade',                perdido: 1647.95, perdido2: 0 },
      { cliente: 'SAMALAB',                      facturas: 9,  meses: 28,  acumulado: 156116.27,  mrrInicio: 8756.00,  mrrFin: 5756.00,  movimiento: 'Downgrade',                perdido: 3000.00, perdido2: 0 },
      { cliente: 'SG LOCALIZACION',              facturas: 9,  meses: 45,  acumulado: 300171.50,  mrrInicio: 9528.02,  mrrFin: 6385.00,  movimiento: 'Downgrade',                perdido: 3143.02, perdido2: 0 },
      { cliente: 'GTC - LOMAS',                  facturas: 5,  meses: 4,   acumulado: 69752.97,   mrrInicio: 14720.14, mrrFin: 13820.67, movimiento: 'Downgrade',                perdido: 899.47,  perdido2: 0 },
      { cliente: 'Power Street',                 facturas: 7,  meses: 148, acumulado: 2775101.10, mrrInicio: 15462.50, mrrFin: 15452.50, movimiento: 'Downgrade',                perdido: 10.00,   perdido2: 0 },
      { cliente: 'GTC - CARRANZA',               facturas: 5,  meses: 4,   acumulado: 106653.83,  mrrInicio: 22868.02, mrrFin: 21071.24, movimiento: 'Downgrade',                perdido: 1796.78, perdido2: 0 },
      { cliente: 'GTC - FORUM',                  facturas: 5,  meses: 4,   acumulado: 132301.26,  mrrInicio: 28380.74, mrrFin: 25984.31, movimiento: 'Downgrade',                perdido: 2396.43, perdido2: 0 },
      { cliente: 'Inverdental',                  facturas: 6,  meses: 72,  acumulado: 609298.97,  mrrInicio: 10384.00, mrrFin: 10186.00, movimiento: 'Downgrade',                perdido: 198.00,  perdido2: 0 },
      { cliente: 'Virket - EnDigital',           facturas: 7,  meses: 124, acumulado: 3737325.18, mrrInicio: 6217.61,  mrrFin: 6197.81,  movimiento: 'Downgrade',                perdido: 19.80,   perdido2: 0 },
      { cliente: 'Cargo Lift',                   facturas: 7,  meses: 129, acumulado: 1381896.40, mrrInicio: 18973.00, mrrFin: 17930.80, movimiento: 'Downgrade',                perdido: 1042.20, perdido2: 0 },
    ],
  },
  {
    mes: 'Junio',
    clientes: [
      { cliente: 'Mas clic',            facturas: 13, meses: 97,  acumulado: 679632.13,   mrrInicio: 9434.53,   mrrFin: 9426.60,  movimiento: 'Downgrade',                perdido: 7.93,     perdido2: 0 },
      { cliente: 'Bliss crédito libre', facturas: 13, meses: 24,  acumulado: 242183.09,   mrrInicio: 25587.21,  mrrFin: 16799.97, movimiento: 'Downgrade',                perdido: 8787.24,  perdido2: 0 },
      { cliente: 'Ecocentenario',       facturas: 7,  meses: 35,  acumulado: 203565.92,   mrrInicio: 4497.00,   mrrFin: 4407.00,  movimiento: 'Downgrade',                perdido: 90.00,    perdido2: 0 },
      { cliente: 'GTC - MG LOMAS',      facturas: 5,  meses: 4,   acumulado: 90415.60,    mrrInicio: 17896.49,  mrrFin: 17345.27, movimiento: 'Downgrade',                perdido: 551.22,   perdido2: 0 },
      { cliente: 'GTC - NAVA',          facturas: 5,  meses: 4,   acumulado: 161322.05,   mrrInicio: 31811.95,  mrrFin: 30709.51, movimiento: 'Downgrade',                perdido: 1102.44,  perdido2: 0 },
      { cliente: 'GTC - RIOVERDE',      facturas: 5,  meses: 4,   acumulado: 64270.97,    mrrInicio: 12684.67,  mrrFin: 12383.82, movimiento: 'Downgrade',                perdido: 300.85,   perdido2: 0 },
      { cliente: 'Salud y Hogar',       facturas: 9,  meses: 115, acumulado: 1506842.33,  mrrInicio: 29365.00,  mrrFin: 26791.04, movimiento: 'Downgrade',                perdido: 2573.96,  perdido2: 0 },
      { cliente: 'Finsus Cobranza',     facturas: 7,  meses: 10,  acumulado: 126098.00,   mrrInicio: 11211.00,  mrrFin: 4195.00,  movimiento: 'Downgrade',                perdido: 7016.00,  perdido2: 0 },
      { cliente: 'MKG',                 facturas: 6,  meses: 154, acumulado: 2123213.28,  mrrInicio: 17230.03,  mrrFin: 11283.03, movimiento: 'Downgrade',                perdido: 5947.00,  perdido2: 0 },
      { cliente: 'HomiRent',            facturas: 6,  meses: 49,  acumulado: 420476.42,   mrrInicio: 11998.00,  mrrFin: 11590.68, movimiento: 'Downgrade',                perdido: 407.32,   perdido2: 0 },
      { cliente: 'Madero Restaurante',  facturas: 5,  meses: 55,  acumulado: 485168.24,   mrrInicio: 3782.00,   mrrFin: 0,        movimiento: 'Churn confirmado',          perdido: 3782.00,  perdido2: 0 },
      { cliente: 'TURBODAYS',           facturas: 3,  meses: 0,   acumulado: 14018.00,    mrrInicio: 14018.00,  mrrFin: 0,        movimiento: 'Churn confirmado',          perdido: 14018.00, perdido2: 0 },
      { cliente: 'AJ PENNY BLINDS',     facturas: 7,  meses: 90,  acumulado: 1198913.73,  mrrInicio: 8847.00,   mrrFin: 6194.00,  movimiento: 'Downgrade',                perdido: 2653.00,  perdido2: 0 },
      { cliente: 'GBS Cuenta Maestra',  facturas: 7,  meses: 54,  acumulado: 865277.01,   mrrInicio: 16713.97,  mrrFin: 10840.00, movimiento: 'Downgrade',                perdido: 5873.97,  perdido2: 0 },
      { cliente: 'Polak Grupo',         facturas: 7,  meses: 54,  acumulado: 1291180.00,  mrrInicio: 30630.00,  mrrFin: 26980.00, movimiento: 'Downgrade',                perdido: 3650.00,  perdido2: 0 },
      { cliente: 'GTC - MATEHUALA',     facturas: 5,  meses: 4,   acumulado: 66826.97,    mrrInicio: 13282.67,  mrrFin: 12981.82, movimiento: 'Downgrade',                perdido: 300.85,   perdido2: 0 },
      { cliente: 'GTC - BMW',           facturas: 5,  meses: 4,   acumulado: 149671.11,   mrrInicio: 29600.19,  mrrFin: 28799.34, movimiento: 'Downgrade',                perdido: 800.85,   perdido2: 0 },
      { cliente: 'Global Digital',      facturas: 5,  meses: 20,  acumulado: 688599.98,   mrrInicio: 60517.14,  mrrFin: 0,        movimiento: 'Churn confirmado + Fraude', perdido: 0,        perdido2: 60517.14 },
      { cliente: 'GTC - MG POLIFORUM',  facturas: 5,  meses: 4,   acumulado: 92362.60,    mrrInicio: 18234.49,  mrrFin: 17683.27, movimiento: 'Downgrade',                perdido: 551.22,   perdido2: 0 },
      { cliente: 'Mas Suites',          facturas: 11, meses: 69,  acumulado: 386320.66,   mrrInicio: 7945.39,   mrrFin: 7372.98,  movimiento: 'Downgrade',                perdido: 572.41,   perdido2: 0 },
      { cliente: 'Pronto LATAM',        facturas: 9,  meses: 24,  acumulado: 144800.04,   mrrInicio: 5328.00,   mrrFin: 3689.00,  movimiento: 'Downgrade',                perdido: 1639.00,  perdido2: 0 },
      { cliente: 'GTC - SENDERO',       facturas: 5,  meses: 4,   acumulado: 102697.83,   mrrInicio: 20268.24,  mrrFin: 19667.24, movimiento: 'Downgrade',                perdido: 601.00,   perdido2: 0 },
      { cliente: 'GTC - CENTRO MAX',    facturas: 5,  meses: 4,   acumulado: 165043.05,   mrrInicio: 32508.95,  mrrFin: 31406.51, movimiento: 'Downgrade',                perdido: 1102.44,  perdido2: 0 },
      { cliente: 'SAMALAB',             facturas: 9,  meses: 28,  acumulado: 156116.27,   mrrInicio: 5756.00,   mrrFin: 2756.00,  movimiento: 'Downgrade',                perdido: 3000.00,  perdido2: 0 },
      { cliente: 'SG LOCALIZACION',     facturas: 9,  meses: 45,  acumulado: 300171.50,   mrrInicio: 6385.00,   mrrFin: 4491.00,  movimiento: 'Downgrade',                perdido: 1894.00,  perdido2: 0 },
      { cliente: 'Finsus Growth',       facturas: 8,  meses: 37,  acumulado: 2063349.41,  mrrInicio: 159715.00, mrrFin: 38215.00, movimiento: 'Downgrade',                perdido: 0,        perdido2: 121500.00 },
      { cliente: 'GTC - LOMAS',         facturas: 5,  meses: 4,   acumulado: 69752.97,    mrrInicio: 13820.67,  mrrFin: 13519.82, movimiento: 'Downgrade',                perdido: 300.85,   perdido2: 0 },
      { cliente: 'GTC - CARRANZA',      facturas: 5,  meses: 4,   acumulado: 106653.83,   mrrInicio: 21071.24,  mrrFin: 20470.24, movimiento: 'Downgrade',                perdido: 601.00,   perdido2: 0 },
      { cliente: 'GTC - FORUM',         facturas: 5,  meses: 4,   acumulado: 132301.26,   mrrInicio: 25984.31,  mrrFin: 25182.74, movimiento: 'Downgrade',                perdido: 801.57,   perdido2: 0 },
      { cliente: 'Latinx Revops',       facturas: 10, meses: 18,  acumulado: 131597.84,   mrrInicio: 9568.97,   mrrFin: 9470.01,  movimiento: 'Downgrade',                perdido: 98.96,    perdido2: 0 },
    ],
  },
]
