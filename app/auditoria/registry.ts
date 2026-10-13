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
  // ── Claudia ───────────────────────────────────────────────────────────────
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
  /* ── Sin cuenta en cartera ─────────────────────────────────────────────────
     `consecutivos: []` NO es un olvido. Son auditorias de cuentas que nunca
     entraron a `cuentas` y por tanto no tienen consecutivo ni KAM: se vendieron
     y se perdieron antes de asignarse. El caso vive en el modulo de Auditoria y
     no hay ficha de cuenta donde pintar el boton — que es exactamente lo que
     `findAuditoriaForConsecutivo` hace al no encontrar coincidencia. */
  { id: 'viajes-macull',   nombre: 'Viajes Macull / Viajo Mexico (CP 189846)', consecutivos: [] },
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
