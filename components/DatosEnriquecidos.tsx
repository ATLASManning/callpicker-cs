import type { DatosEnriquecidos, SenalComercial } from '@/lib/enriquecimiento/cuenta'

/**
 * Bloque de "Datos generales enriquecidos" en la ficha de cuenta.
 *
 * Es información ADICIONAL: aparece junto al registro del KAM, con su fuente y
 * su fecha, y en ningún caso lo sustituye. Cuando un hallazgo contradice al
 * dato capturado, se marca como diferencia a validar — no se corrige solo.
 */

const ETIQUETA: Record<string, string> = {
  contacto_nombre: 'Contacto principal', contacto_cargo: 'Cargo del contacto',
  contacto_tel: 'Teléfono directo',      contacto_email: 'Correo del contacto',
  giro: 'Giro / Industria',              tamano_empresa: 'Tamaño de cuenta',
  total_empleados: 'No. de empleados',   num_oficinas: 'No. de sitios',
  pagina_web: 'Sitio web',               razon_social: 'Razón social',
  email_corporativo: 'Correos corporativos', telefono_corporativo: 'Teléfonos corporativos',
  email_pattern_inferred: 'Patrón de correo (sin verificar)',
}

const COLOR_SENAL: Record<string, { bg: string; borde: string; fg: string; icono: string }> = {
  oportunidad: { bg: 'rgba(34,197,94,0.10)',  borde: 'rgba(34,197,94,0.35)',  fg: '#22C55E', icono: '↑' },
  riesgo:      { bg: 'rgba(239,68,68,0.10)',  borde: 'rgba(239,68,68,0.35)',  fg: '#F87171', icono: '!' },
  dato:        { bg: 'rgba(59,130,246,0.10)', borde: 'rgba(59,130,246,0.30)', fg: '#60A5FA', icono: '·' },
}

function Senal({ s }: { s: SenalComercial }) {
  const c = COLOR_SENAL[s.tipo] ?? COLOR_SENAL.dato
  return (
    <div className="rounded-lg p-3" style={{ background: c.bg, border: `1px solid ${c.borde}` }}>
      <p className="text-xs font-bold mb-1" style={{ color: c.fg }}>
        <span className="mr-1.5">{c.icono}</span>{s.titulo}
      </p>
      <p className="text-xs text-textMid leading-relaxed">{s.detalle}</p>
      {s.accion && (
        <p className="text-xs mt-1.5 leading-relaxed" style={{ color: c.fg }}>
          <span className="opacity-70">Siguiente paso: </span>{s.accion}
        </p>
      )}
    </div>
  )
}

export default function DatosEnriquecidosPanel({ datos }: { datos: DatosEnriquecidos }) {
  if (!datos.total && !datos.senales.length) return null

  const campos = Object.entries(datos.porCampo)
  const fecha = datos.ultimaConsulta
    ? new Date(datos.ultimaConsulta).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  return (
    <div className="cp-card space-y-4">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <h3 className="text-xs font-semibold text-textMid uppercase tracking-wide">
          Datos generales enriquecidos
        </h3>
        <span className="text-[10px] text-textLow">
          {datos.total} hallazgo{datos.total === 1 ? '' : 's'}
          {fecha && ` · investigado ${fecha}`}
        </span>
      </div>

      <p className="text-[11px] text-textLow leading-relaxed">
        Información localizada en fuentes públicas y en la propia ficha. Es material de apoyo:
        no sustituye lo que capturó el KAM.
      </p>

      {datos.senales.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-wide text-textLow">Lectura comercial</p>
          {datos.senales.map((s, i) => <Senal key={i} s={s} />)}
        </div>
      )}

      {campos.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] uppercase tracking-wide text-textLow">Hallazgos por campo</p>
          {campos.map(([campo, lista]) => (
            <div key={campo}>
              <p className="text-[11px] font-semibold text-textMid mb-1">
                {ETIQUETA[campo] ?? campo}
              </p>
              <div className="space-y-1.5">
                {lista.map(c => {
                  const difiere = c.matching_status === 'conflicto'
                  return (
                    <div key={c.id} className="rounded-md px-2.5 py-2"
                         style={{ background: difiere ? 'rgba(239,68,68,0.08)' : 'rgba(148,163,184,0.07)' }}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs break-all">{c.valor_candidato}</p>
                        <span className="text-[10px] font-bold flex-shrink-0"
                              style={{ color: c.confianza_score >= 90 ? '#22C55E'
                                            : c.confianza_score >= 70 ? '#60A5FA' : '#F59E0B' }}>
                          {c.confianza_score}
                        </span>
                      </div>
                      {difiere && c.valor_original_snapshot && (
                        <p className="text-[10px] mt-1" style={{ color: '#F87171' }}>
                          Difiere de lo registrado: “{c.valor_original_snapshot}” — validar con el cliente
                        </p>
                      )}
                      <p className="text-[10px] text-textLow mt-1 leading-snug">
                        {c.fuente_nombre}
                        {c.fuente_url && (
                          <>
                            {' · '}
                            <a href={c.fuente_url} target="_blank" rel="noopener noreferrer"
                               className="text-cp underline">fuente</a>
                          </>
                        )}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
