/**
 * app/auditoria/registry.ts
 * Mapeo entre cuentas y su caso de Auditoría.
 *
 * El detalle de cada cuenta (/cuentas/[id]) muestra un botón "Auditoría" cuando
 * su consecutivo aparece aquí, enlazando a /auditoria?caso=<id>.
 *
 * ➕ Al agregar una nueva auditoría al módulo (nuevo *-data.ts), añade su entrada
 *    aquí con el/los consecutivo(s) de la cuenta para que el botón aparezca solo.
 *    El `id` debe coincidir EXACTAMENTE con AuditoriaCase.id.
 */
export interface AuditoriaRef {
  id:           string    // = AuditoriaCase.id
  nombre:       string    // etiqueta legible del caso
  consecutivos: string[]  // cuentas (consecutivo) que abre este reporte
}

export const AUDITORIA_REFS: AuditoriaRef[] = [
  // ── Fátima ────────────────────────────────────────────────────────────────
  /* ESTABA EN F24, QUE ES CBS COMPRESORES. Corregido el 13 oct 2026: el
     expediente declara «VIP · CID 24924» y ese CID es F4, Ancona Autopartes.
     Una transposición F4 → F24 con dos efectos, y el feo es el primero: la
     ficha de CBS enseñaba un botón que abría el expediente CONFIDENCIAL de
     otro cliente, y Ancona —de quien habla— no tenía botón, así que parecía
     no tener auditoría y se habría vuelto a escribir.
     Lo caza `scripts/revisa-registro-auditorias.py`, que cruza por CID. */
  { id: 'ancona-autopartes', nombre: 'Ancona Autopartes',               consecutivos: ['F4']  },
  { id: 'arkansas',        nombre: 'Arkansas State University (ASUQ)', consecutivos: ['F45'] },
  { id: 'finsus',          nombre: 'FINSUS – Economía Móvil',          consecutivos: ['F1']  },
  { id: 'grupofrisa',      nombre: 'Grupo FRISA / ACISA',              consecutivos: ['F16'] },
  { id: 'samalab',         nombre: 'SAMALAB',                          consecutivos: ['F14'] },
  { id: 'azyco',           nombre: 'Azyco Guadalajara',                consecutivos: ['F6']  },
  { id: 'polak-grupo',     nombre: 'Polak Grupo',                      consecutivos: ['F5']  },
  { id: 'pubsa',           nombre: 'Publicidad en Buscadores (AdCentral)', consecutivos: ['F17'] },
  /* Pierde el 30.63% de sus llamadas desde enero y NO tiene una sola alerta:
     el motor compara contra la base propia y la suya ya es mala, así que lo
     crónico es invisible. El 93.4% de las pérdidas cabe en cuatro destinos.
     Y no nos usa para sus farmacias: opera líneas de programa de pacientes
     de AXA, AbbVie, Pint Farma, CIMESA y HOPE Medical Center. */
  { id: 'probemedic',      nombre: 'PROBEMEDIC · Farmacias Especializadas', consecutivos: ['F7'] },
  { id: 'li-financiera',   nombre: 'LI FINANCIERA',                    consecutivos: ['F61'] },
  { id: 'sofia',           nombre: 'Sofia',                            consecutivos: ['F66'] },
  /* En Gross Revenue Facturación se llama «ADSA» —Anuncios en Directorios, su
     razón social— sin CID y con `enCartera: false`, así que ningún cruce
     automático la ataba a esta ficha. Su factura real son $32,375 al mes, no
     los $84,254 de la ficha (que son su promedio de 93 meses), y el GRC la da
     por «Churn confirmado» sin verificar MIENTRAS emite facturas. */
  { id: 'seccion-amarilla', nombre: 'Sección Amarilla · ADSA',         consecutivos: ['F3']  },
  /* La ficha la tenía en $0 y factura $65,640 al mes: diez meses fuera de toda
     lista ordenada por dinero, porque un cero no baja un puesto — saca de la
     lista. El 96.7% del contrato es UN producto, la Marcación Corta (el 072
     del Municipio). Y el directorio de decisores que el asesor no encontraba
     lleva meses publicado en impas.mpiochih.gob.mx. */
  { id: 'impas-chihuahua',  nombre: 'IMPAS Municipio Chihuahua',       consecutivos: ['Z63'] },
  // ── Erick · la cartera que recibió el 15 oct 2026 ────────────────────
  //    (Era la cartera de Claudia Hernández. El rótulo decía su nombre
  //     hasta el 18 nov 2026, un mes después del relevo: `cuentas.asesor`
  //     ya decía Erick y este padrón no. Ver [[erick-sustituye-a-claudia]].)
  { id: 'agua-inmaculada', nombre: 'Agua Inmaculada',                  consecutivos: ['C17'] },
  { id: 'labsus',          nombre: 'LABSUS Centro Diagnóstico',        consecutivos: ['C37'] },
  /* La voz MEJORA sola (5.0% → 1.9% de pérdida mientras el volumen crece), y
     eso tapó dos cosas: que la mitad de las pérdidas caben en TRES destinos
     que son el 1.92% del tráfico, y que el cliente nos avisó el 22 jul de que
     su único interlocutor ya no está en la operación. Su importe real son
     $23,325 —DOS líneas del mismo CID—, no los $10,901 que decía la ficha. */
  { id: 'odontoprev',      nombre: 'ODONTOPREV México (Odontored)',    consecutivos: ['C13'] },
  { id: 'brandgroup',      nombre: 'Brand-Kern-Liebers México (Brandgroup)', consecutivos: ['C15'] },
  { id: 'clickbalance',    nombre: 'ClickBalance ERP',                 consecutivos: ['C43'] },
  { id: 'elerybrands',     nombre: 'Elery Brands · Clínicas del Hombre', consecutivos: ['C22'] },
  { id: 'alternet',        nombre: 'ALTERNET',                         consecutivos: ['C10'] },
  { id: 'hospital-santa-rosa', nombre: 'Hospital Santa Rosa',          consecutivos: ['C4']  },
  { id: 'travelling',      nombre: 'Travelling / Grupo Mundo Joven',   consecutivos: ['C16'] },
  { id: 'dental-district', nombre: 'Dental District',                  consecutivos: ['Z54'] },
  { id: 'grupo-2711',      nombre: 'GRUPO 2711',                       consecutivos: ['C26'] },
  /* La cuenta de MAYOR volumen de la cartera: 289,238 llamadas con 0.07% sin
     contestar. Pero no es una línea de atención — es una CHECADORA: 32.3% del
     día a las 08:00, 1.02 min por llamada y 177 números que repiten. Es una
     dependencia operativa con cero reuniones en 24 meses. */
  { id: 'ecodeli',         nombre: 'ECODELI (Grupo Ecodeli)',          consecutivos: ['C2']  },
  { id: 'mint-cargo',      nombre: 'MINT CARGO',                       consecutivos: ['Z58'] },
  /* 9.6 años de cliente y cero contactos por canal real. Su MRR real es
     $88,783 (GRC, dos líneas con este consecutivo), no los $59,423 de la
     ficha: con el correcto es la #2 de la cartera. */
  { id: 'tech-people',     nombre: 'Tech People (Servicios y Reparaciones TP)', consecutivos: ['C1'] },
  /* Alta del 26 nov 2026. 155,406 entrantes en once meses y el diagnóstico más
     limpio del lote: la capacidad está descartada por DOS vías —pico de 8
     simultáneas sobre 13 extensiones, y más pérdida con poca carga (12.3%) que
     con mucha (3.5%)—, así que son puestos sin persona. Bitácora 1 pasó de
     16.8% a 59.4% mientras su volumen caía de 3,785 a 310 llamadas. El
     incidente del 20 nov (172 de 223 en cinco horas) NO tiene ticket. */
  { id: 'easo',            nombre: 'EASO (Transportes EASO)',            consecutivos: ['C14'] },
  // ── Dan ───────────────────────────────────────────────────────────────────
  { id: 'salud-y-hogar',   nombre: 'Salud y Hogar',                    consecutivos: ['D3']  },
  { id: 'cintascove',      nombre: 'Cintas Cove S.A. de C.V.',         consecutivos: ['D14'] },
  { id: 'alianza',         nombre: 'Alianza Multimarca',               consecutivos: ['D4']  },
  { id: 'medicall-expert', nombre: 'Medicall Expert',                  consecutivos: ['C31'] },
  { id: 'vaeo-business-club', nombre: 'VAEO Business Club',           consecutivos: ['C51'] },
  { id: 'kombitec',           nombre: 'KOMBITEC S.A. DE C.V.',        consecutivos: ['D22'] },
  { id: 'neruc-sede-central', nombre: 'NERUC Sede Central',            consecutivos: ['C9']  },
  { id: 'jason-de-mexico',   nombre: 'Jason de México',               consecutivos: ['D7']  },
  { id: 'gwep',              nombre: 'GWEP (Grupo Gwep)',             consecutivos: ['D54'] },
  { id: 'cargo-lift',        nombre: 'Cargo Lift',                    consecutivos: ['D5']  },
  { id: 'casa-galvan',       nombre: 'CASA Galván',                  consecutivos: ['D23'] },
  { id: 'university-4-people', nombre: 'University 4 People (Tec de Monterrey)', consecutivos: ['D58'] },
  /* La MAYOR de la cartera: $272,436 al mes (GRC `mrrFin`), el 23.3% de las 132
     cuentas activas. El cliente pidió DESCENTRALIZAR y hoy cada agencia responde
     por su propia comunicación: son 19 líneas de facturación, ninguna con CID.
     v1.2 corrigió tres cifras que la v1.1 daba por buenas — el MRR venía de un
     promedio de vida, el peso en cartera de un denominador que ya no existe, y
     el giro decía «Nissan» cuando el dinero dice Nissan+BMW+MG+INFINITI. */
  { id: 'torres-corzo',      nombre: 'Grupo Torres Corzo Automotriz (GTC)', consecutivos: ['D1']  },
  /* No opera: el cliente la describe como respaldo de información. Su 99.70%
     de llamadas sin contestar NO es una falla —van todas a un agente
     virtual— y su MRR real es $1,078, no los $38,123 de la ficha. */
  { id: 'system-ooapas',     nombre: 'Grupo System OOAPAS (Estradata)',     consecutivos: ['D2']  },
  /* ── Altas del 26 nov 2026 ───────────────────────────────────────────────
     Cinco expedientes nuevos del mismo lote de reportes. Lo que los une no es
     el asesor: es que en los cinco el dato de nuestras fuentes contradijo algo
     que el documento entregado daba por bueno, y eso quedó declarado DENTRO de
     cada documento publicado ([[auditoria-modulo]]). */
  /* 66.8% de las entrantes no llega a una persona y CERO devoluciones en 782
     llamadas. El riesgo real lo declaró el cliente: pidió integración con
     GoHighLevel, que trae telefonía propia, y con 0 de 6 módulos el costo de
     salida es cero. Su MRR cuadra EXACTO con el GRC: $1,069. */
  { id: 'campestre-los-viveros', nombre: 'Campestre Los Viveros',         consecutivos: ['Z35'] },
  /* 10 sedes y 14 números, con Chapultepec 68 al 94.7% de atención contra
     Coffee Depot Guadalajara al 23.1% de pérdida: diez veces de diferencia en
     la misma plataforma. El 95% de las pérdidas ocurre con la extensión LIBRE.
     Y su MRR institucional NO ES MEDIBLE: el GRC no trae fila para el CID
     17297 ni por nombre, así que los $12,554 de la ficha no se pueden citar. */
  { id: 'san-son',           nombre: 'SAN-SON (Sanson · Coffee Depot)',   consecutivos: ['D10'] },
  /* Un solo número generaba el 20.6% del tráfico y el 60.8% de las perdidas:
     sin él, atiende 9 de cada 10. La fuga es que no devuelve (14 llamadas en
     todo el año). Y el GRC la marca «Churn confirmado» con mrrFin $0 mientras
     paga al corriente y usa el 66% del plan: contradicción abierta en
     dirección, NO autorización de baja. */
  { id: 'sellomatic',        nombre: 'Sellomatic Impresores',             consecutivos: ['D27'] },
  /* Una sola línea (la 0404) concentra el 86.8% de las pérdidas reales con el
     23.8% del tráfico, y la cola de Bitrix ya resuelve al 1.4% los siete días:
     el 69% de esas pérdidas cae en horas que Bitrix cubre. Un tercio de las
     pérdidas brutas son pruebas internas del TI del cliente. La caída de
     entrantes NO es deterioro: la entrada volvió a Telmex y el cliente quiere
     portarla de vuelta. */
  { id: 'ehi-global',        nombre: 'EHI Global (Grupo Antyr)',          consecutivos: ['D8']  },
  // ── Erick · altas posteriores al relevo ────────────────────────────────────
  //    (Dos expedientes del bloque «Dan» de arriba también son suyos según
  //     `cuentas.asesor`: VAEO Business Club (C51) y NERUC Sede Central
  //     (C9). No se movieron de sitio porque el orden de este arreglo no
  //     es el agrupamiento, y moverlos cambiaría algo que no se ha medido.
  //     Lo comprueba `scripts/mide-cartera-asesor.py` contra la tabla.)
  /* El apagón de entrantes del 30 oct: 76 llamadas en cuatro días hábiles y UNA
     atendida. Pero el hallazgo que el ticket no traía es estructural y anterior:
     la ruta «Disponible» recibió 334 llamadas en el año y perdió las 334 — el
     46.1% de todas las pérdidas de 2026 en un solo destino, ya perdiendo desde
     agosto. Descontándola, la caída real de los agentes en octubre fue 9.8%, no
     el 25.7% del indicador. El cliente ya cuestionó por escrito la continuidad. */
  { id: 'abrl',            nombre: 'ABRL Sistemas & Proyectos',       consecutivos: ['C11'] },
  /* OJO CON ESTE CONSECUTIVO: es «C» a secas, SIN número — la única así de las
     224 cuentas de cartera. No es un olvido de este padrón: es lo que guarda
     `cuentas.consecutivo`, y por eso aquí dice «C» y no «C71». El siguiente
     libre del prefijo es C71; el día que se complete hay que cambiarlo AQUÍ en
     el mismo movimiento, o el botón de Auditoría desaparece de la ficha sin que
     nada falle. Lo caza `scripts/revisa-registro-auditorias.py`, que cruza por
     CID y no por consecutivo.
     La cuenta marca lo mismo que en junio y conecta 19.6 puntos menos — pero el
     riesgo no está en el teléfono: la factura de noviembre son $37,222 contra
     los $13,802 que guardaba la ficha, y nadie ha hablado con el cliente desde
     el 8 de septiembre. */
  { id: 'lineacel',        nombre: 'LINEACEL (campañas BAIT / Movistar)', consecutivos: ['C'] },
  /* ── Sin cuenta en cartera ─────────────────────────────────────────────────
     `consecutivos: []` NO es un olvido. Son auditorias de cuentas que nunca
     entraron a `cuentas` y por tanto no tienen consecutivo ni KAM: se vendieron
     y se perdieron antes de asignarse. El caso vive en el modulo de Auditoria y
     no hay ficha de cuenta donde pintar el boton — que es exactamente lo que
     `findAuditoriaForConsecutivo` hace al no encontrar coincidencia. */
  { id: 'viajes-macull',   nombre: 'Viajes Macull / Viajo Mexico (CP 189846)', consecutivos: [] },
  /* CP 190196: mismo caso que Viajes Macull y por eso va junto a ella en la
     barra. No esta en `cuentas`, no tiene consecutivo y NO TIENE CID: en el
     GRC su fila se encuentra por NOMBRE, no por llave, asi que
     `revisa-registro-auditorias.py` la cuenta entre las que no puede cruzar.
     Eso no es un olvido: es el dato. */
  { id: 'cp-190196',       nombre: 'CP 190196 · Ingenieria Mantenimiento y Desarrollo Informatico', consecutivos: [] },
  /* RDS estaba en `cases.ts` pero NO aqui. No rompia nada —el boton de la ficha
     simplemente no existia, que es lo correcto para una cuenta sin consecutivo—
     pero dejaba el registro incompleto: `AUDITORIA_REFS` se usa tambien para
     saber que cuentas tienen auditoria documentada, y RDS no contaba. Lo
     encontro `scripts/revisa-casos-auditoria.py` al agregar Viajes Macull. */
  { id: 'rds-invest-vacay', nombre: 'RDS / Invest Vacay Group (CP 189168)',    consecutivos: [] },
]

/** Devuelve la auditoría asociada a un consecutivo de cuenta, o null si no existe. */
export function findAuditoriaForConsecutivo(consecutivo: string | null | undefined): AuditoriaRef | null {
  if (!consecutivo) return null
  const c = consecutivo.trim().toUpperCase()
  return AUDITORIA_REFS.find(ref => ref.consecutivos.some(x => x.toUpperCase() === c)) ?? null
}
