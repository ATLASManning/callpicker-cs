export type EstadoAuditoria = 'rescatable' | 'en_riesgo' | 'recuperado' | 'perdido' | 'activo'
export type TipoEvento     = 'problema' | 'pivote' | 'ok' | 'neutral'

export interface AuditoriaCase {
  id: string

  /* ── Encabezado ──────────────────────────────────────────────── */
  nombre:              string
  sector:              string
  fecha_periodo:       string   // "Marzo – Abril 2026"
  fecha_auditoria:     string   // "Abr 2026"
  tipo_cliente:        string   // "Enterprise AAA"
  descripcion_contexto:string   // subtítulo debajo del nombre
  estado:              EstadoAuditoria
  clasificacion:       string   // "CONFIDENCIAL"
  version:             string   // "1.0"

  /* ── KPIs de crisis (max 4) ──────────────────────────────────── */
  kpis: { label: string; value: string; color: string }[]

  /* ── Resumen ─────────────────────────────────────────────────── */
  resumen_ejecutivo:   string
  resultado_positivo:  string
  hallazgos:           string[]

  /* ── Cronología ──────────────────────────────────────────────── */
  cronologia: {
    fecha:       string
    responsable: string
    evento:      string
    tipo:        TipoEvento
  }[]

  /* ── Comportamiento / Perfil del cliente ─────────────────────── */
  perfil_campos:     { label: string; value: string }[]
  necesidad_negocio: string
  potencial_corto:   string[]
  potencial_largo:   string[]
  tacticas: {
    nombre:      string
    descripcion: string
    impacto:     string
  }[]
  senal_alarma?: string

  /* ── Problema Raíz ───────────────────────────────────────────── */
  problema_raiz:        string
  problema_raiz_detalle:string
  flujo_real: {
    fase:       string
    area:       string
    accion:     string
    resultado:  string
  }[]
  comparativo: {
    metrica: string
    real:    string
    ideal:   string
  }[]

  /* ── Plan de Acción ──────────────────────────────────────────── */
  plan_inmediato:    { accion: string; responsable: string; criterio: string }[]
  plan_mediano:      { accion: string; responsable: string; criterio: string }[]
  plan_estrategico:  { accion: string; responsable: string; criterio: string }[]
  areas_oportunidad: { area: string; impacto: string; responsable: string }[]

  /* ── Perfiles de Actores ─────────────────────────────────────── */
  perfiles: {
    nombre: string
    rol:    string
    color:  string
    campos: { label: string; value: string }[]
  }[]

  /* ── FODA ────────────────────────────────────────────────────── */
  foda: {
    fortalezas:    string[]
    oportunidades: string[]
    debilidades:   string[]
    amenazas:      string[]
  }

  /* ── Conclusión ──────────────────────────────────────────────── */
  conclusion:           string
  pierde:               string[]
  gana:                 string[]
  recomendacion_central:string
}

/* ─── Valor inicial vacío para el formulario ────────────────────── */
export function emptyCase(): AuditoriaCase {
  return {
    id: '',
    nombre: '', sector: '', fecha_periodo: '', fecha_auditoria: '',
    tipo_cliente: '', descripcion_contexto: '', estado: 'en_riesgo',
    clasificacion: 'CONFIDENCIAL', version: '1.0',
    kpis: [
      { label: 'Duración de la crisis', value: '', color: '#ef4444' },
      { label: 'Pivotes técnicos',      value: '', color: '#f59e0b' },
      { label: 'Valor en riesgo',       value: '', color: '#6366f1' },
      { label: 'Estado actual',         value: '', color: '#22c55e' },
    ],
    resumen_ejecutivo: '', resultado_positivo: '', hallazgos: [''],
    cronologia: [{ fecha: '', responsable: '', evento: '', tipo: 'neutral' }],
    perfil_campos: [
      { label: 'Razón social',       value: '' },
      { label: 'Sector',             value: '' },
      { label: 'Contacto principal', value: '' },
      { label: 'Contacto técnico',   value: '' },
      { label: 'Plataforma anterior',value: '' },
      { label: 'Tipo de cliente',    value: '' },
    ],
    necesidad_negocio: '', potencial_corto: [''], potencial_largo: [''],
    tacticas: [{ nombre: '', descripcion: '', impacto: '' }],
    senal_alarma: '',
    problema_raiz: '', problema_raiz_detalle: '',
    flujo_real: [{ fase: '', area: '', accion: '', resultado: '' }],
    comparativo: [{ metrica: '', real: '', ideal: '' }],
    plan_inmediato:   [{ accion: '', responsable: '', criterio: '' }],
    plan_mediano:     [{ accion: '', responsable: '', criterio: '' }],
    plan_estrategico: [{ accion: '', responsable: '', criterio: '' }],
    areas_oportunidad:[{ area: '', impacto: '', responsable: '' }],
    perfiles: [{ nombre: '', rol: '', color: '#6366f1', campos: [{ label: '', value: '' }] }],
    foda: { fortalezas: [''], oportunidades: [''], debilidades: [''], amenazas: [''] },
    conclusion: '', pierde: [''], gana: [''], recomendacion_central: '',
  }
}
