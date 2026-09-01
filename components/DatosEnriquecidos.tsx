import type { DatosEnriquecidos, SenalComercial } from '@/lib/enriquecimiento/cuenta'

/**
 * Sección "Localizado por Atlas" DENTRO de la tarjeta de Información.
 *
 * Por instrucción de dirección (1 Sep 2026) no vive en un módulo aparte: es
 * parte de la misma ficha, distinguida por color violeta para que se sepa de
 * un vistazo qué dato capturó el KAM y cuál localizó la investigación.
 * Sigue siendo información de apoyo: no sustituye ningún campo.
 */

/** Color de Atlas — no se usa para ningún estado del dashboard. */
const ATLAS = '#A855F7'

const ETIQUETA: Record<string, string> = {
  contacto_nombre: 'Contacto principal', contacto_cargo: 'Cargo del contacto',
  contacto_tel: 'Teléfono directo',      contacto_email: 'Correo del contacto',
  giro: 'Giro / Industria',              tamano_empresa: 'Tamaño de cuenta',
  total_empleados: 'No. de empleados',   num_oficinas: 'No. de sitios',
  pagina_web: 'Sitio web',               razon_social: 'Razón social',
  email_corporativo: 'Correo corporativo', telefono_corporativo: 'Teléfono corporativo',
  email_pattern_inferred: 'Patrón de correo (sin verificar)',
}

const ICONO_SENAL: Record<string, string> = { oportunidad: '↑', riesgo: '!', dato: '·' }
const COLOR_SENAL: Record<string, string> = {
  oportunidad: '#22C55E', riesgo: '#F87171', dato: ATLAS,
}

function Senal({ s }: { s: SenalComercial }) {
  const col = COLOR_SENAL[s.tipo] ?? ATLAS
  return (
    <div className="pl-2 border-l-2" style={{ borderColor: col }}>
      <p className="text-[11px] font-semibold" style={{ color: col }}>
        <span className="mr-1">{ICONO_SENAL[s.tipo]}</span>{s.titulo}
      </p>
      <p className="text-[10px] text-textMid leading-snug">{s.detalle}</p>
      {s.accion && <p className="text-[10px] text-textLow leading-snug mt-0.5">→ {s.accion}</p>}
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
    <div className="pt-3 mt-1 space-y-2.5" style={{ borderTop: `1px dashed ${ATLAS}55` }}>
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: ATLAS }}>
          ◆ Localizado por Atlas
        </p>
        <span className="text-[9px] text-textLow">
          {datos.total} dato{datos.total === 1 ? '' : 's'}{fecha && ` · ${fecha}`}
        </span>
      </div>

      {datos.senales.length > 0 && (
        <div className="space-y-2">
          {datos.senales.map((s, i) => <Senal key={i} s={s} />)}
        </div>
      )}

      {campos.length > 0 && (
        <div className="space-y-1.5">
          {campos.map(([campo, lista]) => (
            <div key={campo}>
              <p className="text-[10px] text-textLow">{ETIQUETA[campo] ?? campo}</p>
              {lista.map(c => {
                const difiere = c.matching_status === 'conflicto'
                return (
                  <div key={c.id} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs break-all" style={{ color: difiere ? '#F87171' : ATLAS }}>
                        {c.valor_candidato}
                      </p>
                      {difiere && c.valor_original_snapshot && (
                        <p className="text-[9px] text-textLow">
                          difiere de “{c.valor_original_snapshot.slice(0, 48)}” — validar
                        </p>
                      )}
                      {c.fuente_url && (
                        <a href={c.fuente_url} target="_blank" rel="noopener noreferrer"
                           className="text-[9px] text-textLow hover:text-cp underline">
                          {c.fuente_nombre.slice(0, 46)}
                        </a>
                      )}
                    </div>
                    <span className="text-[9px] font-bold flex-shrink-0 mt-0.5"
                          style={{ color: c.confianza_score >= 90 ? '#22C55E'
                                        : c.confianza_score >= 70 ? ATLAS : '#F59E0B' }}>
                      {c.confianza_score}
                    </span>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}

      <p className="text-[9px] text-textLow leading-snug">
        Investigación en fuentes públicas y en la propia ficha. Es material de apoyo:
        no sustituye lo que capturó el KAM.
      </p>
    </div>
  )
}
