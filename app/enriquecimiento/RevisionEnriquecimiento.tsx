'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'
import CustomSelect from '@/components/CustomSelect'

/**
 * Bandeja de revisión. Cada fila enfrenta el dato del KAM con el hallazgo y su
 * evidencia. Deliberadamente NO existe un botón de "reemplazar": las acciones
 * disponibles son aprobar como adicional, marcar incorrecto o posponer.
 */

interface Candidato {
  id: string
  cuenta_id: string
  asesor: string
  campo: string
  valor_original_snapshot: string | null
  valor_candidato: string
  confianza_score: number
  confianza_nivel: string
  estado_verificacion: string
  fuente_tipo: string
  fuente_nombre: string
  fuente_url: string | null
  evidencia: string
  consultado_en: string
  matching_status: string
  proposed_action: string
  review_status: string
  revisado_por: string | null
  cuentas?: { consecutivo: string | null; empresa: string; estado: string | null }
}

const ETIQUETA_CAMPO: Record<string, string> = {
  contacto_nombre: 'Contacto principal', contacto_cargo: 'Cargo del contacto',
  contacto_tel: 'Teléfono directo',      contacto_email: 'Correo del contacto',
  giro: 'Giro / Industria',              tamano_empresa: 'Tamaño de cuenta',
  total_empleados: 'No. de empleados',   num_oficinas: 'No. de sitios',
  pagina_web: 'Sitio web',               razon_social: 'Razón social',
  email_corporativo: 'Correo corporativo', telefono_corporativo: 'Teléfono corporativo',
  email_pattern_inferred: 'Patrón de correo (no verificado)',
  insight_sugerido: 'Insight sugerido',
}

const COLOR_MATCHING: Record<string, { bg: string; fg: string; label: string }> = {
  nuevo:        { bg: 'rgba(34,197,94,0.15)',  fg: '#22C55E', label: 'Nuevo' },
  complementa:  { bg: 'rgba(59,130,246,0.15)', fg: '#60A5FA', label: 'Complementa' },
  coincide:     { bg: 'rgba(148,163,184,0.15)',fg: '#94A3B8', label: 'Coincide' },
  conflicto:    { bg: 'rgba(239,68,68,0.15)',  fg: '#F87171', label: 'Conflicto' },
  sin_evidencia:{ bg: 'rgba(148,163,184,0.1)', fg: '#64748B', label: 'Sin evidencia' },
}

function colorConfianza(score: number): string {
  if (score >= 90) return '#22C55E'
  if (score >= 70) return '#3B82F6'
  if (score >= 40) return '#F59E0B'
  return '#94A3B8'
}

export default function RevisionEnriquecimiento(
  { esAdmin, asesorSesion }: { esAdmin: boolean; asesorSesion: string },
) {
  const [cands,   setCands]   = useState<Candidato[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [guardando, setGuardando] = useState<string | null>(null)

  const [fAsesor,   setFAsesor]   = useState(esAdmin ? 'Todos' : asesorSesion)
  const [fEstado,   setFEstado]   = useState('pendiente')
  const [fMatching, setFMatching] = useState('Todos')
  const [fCampo,    setFCampo]    = useState('Todos')
  const [fConf,     setFConf]     = useState('Todas')
  const [busqueda,  setBusqueda]  = useState('')

  const cargar = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const p = new URLSearchParams()
      if (esAdmin && fAsesor !== 'Todos') p.set('asesor', fAsesor)
      if (fEstado !== 'Todos')            p.set('estado', fEstado)
      const res  = await fetch(`/api/enriquecimiento/candidatos?${p}`, { cache: 'no-store' })
      const data = await res.json()
      if (data.error) setError(data.error)
      setCands(data.candidatos ?? [])
    } catch {
      setError('No se pudo cargar la cola de revisión.')
    } finally {
      setLoading(false)
    }
  }, [esAdmin, fAsesor, fEstado])

  useEffect(() => { void cargar() }, [cargar])

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return cands.filter(c =>
      (fMatching === 'Todos' || c.matching_status === fMatching) &&
      (fCampo    === 'Todos' || c.campo === fCampo) &&
      (fConf     === 'Todas' ||
        (fConf === '90+' && c.confianza_score >= 90) ||
        (fConf === '70-89' && c.confianza_score >= 70 && c.confianza_score < 90) ||
        (fConf === '<70' && c.confianza_score < 70)) &&
      (!q || c.cuentas?.empresa?.toLowerCase().includes(q) ||
             c.valor_candidato.toLowerCase().includes(q)),
    )
  }, [cands, fMatching, fCampo, fConf, busqueda])

  const camposDisponibles = useMemo(
    () => ['Todos', ...Array.from(new Set(cands.map(c => c.campo)))], [cands])

  const stats = useMemo(() => ({
    total:       visibles.length,
    conflictos:  visibles.filter(c => c.matching_status === 'conflicto').length,
    nuevos:      visibles.filter(c => c.matching_status === 'nuevo').length,
    altaConf:    visibles.filter(c => c.confianza_score >= 90).length,
  }), [visibles])

  async function revisar(id: string, accion: string) {
    setGuardando(id)
    try {
      const res = await fetch('/api/enriquecimiento/revisar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, accion }),
      })
      if (res.ok) setCands(prev => prev.filter(c => c.id !== id))
      else setError((await res.json()).error ?? 'No se pudo registrar la revisión')
    } finally {
      setGuardando(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Filtros — horizontales, con ancho fijo por control */}
      <div className="cp-card p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-56 flex-shrink-0">
            <input
              className="cp-input w-full" placeholder="Buscar cuenta o valor…"
              value={busqueda} onChange={e => setBusqueda(e.target.value)}
            />
          </div>
          {esAdmin && (
            <div className="w-44 flex-shrink-0">
              <CustomSelect value={fAsesor} onChange={setFAsesor}
                options={['Todos', 'Fátima', 'Dan', 'Claudia']} />
            </div>
          )}
          <div className="w-48 flex-shrink-0">
            <CustomSelect value={fEstado} onChange={setFEstado} options={[
              { value: 'pendiente',          label: 'Pendientes' },
              { value: 'aprobado_adicional', label: 'Aprobados' },
              { value: 'incorrecto',         label: 'Incorrectos' },
              { value: 'pospuesto',          label: 'Pospuestos' },
              { value: 'Todos',              label: 'Todos los estados' },
            ]} />
          </div>
          <div className="w-44 flex-shrink-0">
            <CustomSelect value={fMatching} onChange={setFMatching} options={[
              { value: 'Todos',       label: 'Todo tipo' },
              { value: 'nuevo',       label: 'Nuevos' },
              { value: 'complementa', label: 'Complementan' },
              { value: 'conflicto',   label: 'Conflictos' },
              { value: 'coincide',    label: 'Coinciden' },
            ]} />
          </div>
          <div className="w-52 flex-shrink-0">
            <CustomSelect value={fCampo} onChange={setFCampo} searchable
              options={camposDisponibles.map(c => ({ value: c, label: ETIQUETA_CAMPO[c] ?? c }))} />
          </div>
          <div className="w-40 flex-shrink-0">
            <CustomSelect value={fConf} onChange={setFConf} options={[
              { value: 'Todas', label: 'Toda confianza' },
              { value: '90+',   label: 'Confirmado (90+)' },
              { value: '70-89', label: 'Alta (70-89)' },
              { value: '<70',   label: 'Requiere revisión' },
            ]} />
          </div>
          <button className="cp-btn cp-btn-ghost flex-shrink-0" onClick={() => void cargar()}>
            Actualizar
          </button>
        </div>

        <div className="flex flex-wrap gap-4 mt-3 text-xs text-textMid">
          <span>{stats.total} candidatos</span>
          <span style={{ color: '#22C55E' }}>{stats.nuevos} campos vacíos por llenar</span>
          <span style={{ color: '#F87171' }}>{stats.conflictos} conflictos por resolver</span>
          <span style={{ color: '#60A5FA' }}>{stats.altaConf} con confianza confirmada</span>
        </div>
      </div>

      {error && (
        <div className="cp-card p-4" style={{ borderColor: 'rgba(239,68,68,0.4)' }}>
          <p className="text-sm" style={{ color: '#F87171' }}>{error}</p>
          <p className="text-xs text-textLow mt-1">
            Si la tabla aún no existe, corre <code>scripts/migracion-enriquecimiento.sql</code> en Supabase.
          </p>
        </div>
      )}

      {loading ? (
        <div className="cp-card p-8 text-center text-textMid">Cargando cola de revisión…</div>
      ) : visibles.length === 0 ? (
        <div className="cp-card p-8 text-center text-textMid">
          No hay candidatos con estos filtros.
        </div>
      ) : (
        <div className="space-y-2">
          {visibles.map(c => {
            const col = COLOR_MATCHING[c.matching_status] ?? COLOR_MATCHING.coincide
            return (
              <div key={c.id} className="cp-card p-4">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="font-mono text-xs text-cp font-bold">
                    {c.cuentas?.consecutivo ?? '—'}
                  </span>
                  <span className="font-semibold text-sm">{c.cuentas?.empresa}</span>
                  <span className="text-xs text-textLow">· {c.asesor}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: col.bg, color: col.fg }}>
                    {col.label}
                  </span>
                  <span className="text-xs font-bold ml-auto"
                        style={{ color: colorConfianza(c.confianza_score) }}>
                    {c.confianza_score}/100 · {c.confianza_nivel}
                  </span>
                </div>

                {/* Original vs hallazgo, siempre lado a lado */}
                <div className="grid gap-3 md:grid-cols-2 mb-3">
                  <div className="rounded-lg p-3" style={{ background: 'rgba(148,163,184,0.08)' }}>
                    <p className="text-[10px] uppercase tracking-wide text-textLow mb-1">
                      Registro del KAM — {ETIQUETA_CAMPO[c.campo] ?? c.campo}
                    </p>
                    <p className="text-sm break-words">
                      {c.valor_original_snapshot && c.valor_original_snapshot !== '0'
                        ? c.valor_original_snapshot
                        : <span className="text-textLow italic">vacío</span>}
                    </p>
                  </div>
                  <div className="rounded-lg p-3" style={{ background: col.bg }}>
                    <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: col.fg }}>
                      Hallazgo · {c.estado_verificacion.replace('_', ' ')}
                    </p>
                    <p className="text-sm break-words font-medium">{c.valor_candidato}</p>
                  </div>
                </div>

                <p className="text-xs text-textMid mb-1">
                  <span className="text-textLow">Evidencia:</span> {c.evidencia}
                </p>
                <p className="text-xs text-textLow mb-3">
                  {c.fuente_nombre}
                  {c.fuente_url && (
                    <>
                      {' · '}
                      <a href={c.fuente_url} target="_blank" rel="noopener noreferrer"
                         className="text-cp underline">ver fuente</a>
                    </>
                  )}
                  {' · consultado '}{new Date(c.consultado_en).toLocaleDateString('es-MX')}
                </p>

                <div className="flex flex-wrap gap-2">
                  <button className="cp-btn cp-btn-primary text-xs"
                          disabled={guardando === c.id}
                          onClick={() => void revisar(c.id, 'aprobado_adicional')}>
                    Aprobar como dato adicional
                  </button>
                  <button className="cp-btn cp-btn-ghost text-xs"
                          disabled={guardando === c.id}
                          onClick={() => void revisar(c.id, 'fusionado_manual')}>
                    Ya lo integré yo
                  </button>
                  <button className="cp-btn cp-btn-ghost text-xs"
                          disabled={guardando === c.id}
                          onClick={() => void revisar(c.id, 'pospuesto')}>
                    Conservar para después
                  </button>
                  <button className="cp-btn cp-btn-danger text-xs"
                          disabled={guardando === c.id}
                          onClick={() => void revisar(c.id, 'incorrecto')}>
                    Marcar incorrecto
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
