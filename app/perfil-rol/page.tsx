import PageHeader from '@/components/PageHeader'
import {
  OBJETIVO_PUESTO, POSTURA, RESPONSABILIDADES, CADENCIA,
  INDICADORES_ANCLA, INDICADORES_DISCIPLINA, COMPROMISOS, ANTI_PERFIL,
} from '@/lib/perfil-rol'

export const dynamic = 'force-dynamic'

/**
 * Perfil del rol — el eje del trabajo del área.
 *
 * No es un documento decorativo: cada responsabilidad muestra cómo se
 * materializa hoy en el dashboard, y lo que todavía no está instrumentado
 * queda dicho con todas sus letras. Sirve para que ningún asesor tenga que
 * preguntar qué se espera de él, y para que las actividades semanales puedan
 * rastrearse a una responsabilidad concreta.
 */
export default function PerfilRolPage() {
  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl">
      <PageHeader
        title="Perfil del rol — Customer Success Manager / KAM Senior"
        subtitle="El eje del trabajo del área. Cada actividad semanal debe poder rastrearse a una de estas responsabilidades."
      />

      {/* Objetivo y métrica ancla */}
      <div className="cp-card space-y-3">
        <h3 className="text-xs font-semibold text-textMid uppercase tracking-wide">Objetivo del puesto</h3>
        <p className="text-sm text-textHi leading-relaxed">{OBJETIVO_PUESTO.objetivo}</p>
        <p className="text-xs text-textMid leading-relaxed italic">{OBJETIVO_PUESTO.noEs}</p>
        <div className="rounded-lg p-3" style={{ background: 'rgba(0,87,255,0.08)', border: '1px solid rgba(0,87,255,0.25)' }}>
          <p className="text-[10px] uppercase tracking-wide text-cp font-bold mb-1">Métrica ancla del rol</p>
          <p className="text-sm text-textHi">{OBJETIVO_PUESTO.metricaAncla}</p>
        </div>
        <p className="text-[11px] text-textLow">
          Área: {OBJETIVO_PUESTO.area} · Reporta a: {OBJETIVO_PUESTO.reportaA}
        </p>
      </div>

      {/* Postura */}
      <div className="cp-card space-y-3">
        <h3 className="text-xs font-semibold text-textMid uppercase tracking-wide">
          Postura requerida — los tres desplazamientos
        </h3>
        <div className="grid gap-3 md:grid-cols-3">
          {POSTURA.map((p, i) => (
            <div key={i} className="rounded-lg p-3" style={{ background: 'rgba(148,163,184,0.08)' }}>
              <p className="text-xs font-bold mb-1.5">
                <span className="text-textLow line-through">{p.de}</span>
                <span className="text-cp mx-1.5">→</span>
                <span className="text-cpTeal">{p.a}</span>
              </p>
              <p className="text-[11px] text-textMid leading-relaxed">{p.texto}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Responsabilidades */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-textMid uppercase tracking-wide px-1">
          Responsabilidades y dónde viven en el dashboard
        </h3>
        {RESPONSABILIDADES.map(r => (
          <div key={r.clave} className="cp-card space-y-2.5">
            <p className="text-sm font-bold text-textHi">
              <span className="text-cp mr-2">{r.clave}</span>{r.titulo}
            </p>
            <ul className="space-y-1">
              {r.puntos.map((p, i) => (
                <li key={i} className="text-xs text-textMid leading-relaxed flex gap-2">
                  <span className="text-cp flex-shrink-0">·</span><span>{p}</span>
                </li>
              ))}
            </ul>
            <div className="pt-2" style={{ borderTop: '1px dashed rgba(148,163,184,0.3)' }}>
              <p className="text-[10px] uppercase tracking-wide text-textLow mb-1.5">En el dashboard</p>
              <div className="flex flex-wrap gap-1.5">
                {r.enDashboard.map((d, i) => {
                  const pendiente = d.toLowerCase().startsWith('pendiente')
                  return (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full"
                          style={pendiente
                            ? { background: 'rgba(245,158,11,0.12)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' }
                            : { background: 'rgba(34,197,94,0.12)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.3)' }}>
                      {d}
                    </span>
                  )
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cadencia */}
      <div className="cp-card space-y-2">
        <h3 className="text-xs font-semibold text-textMid uppercase tracking-wide">Cadencia esperada</h3>
        {CADENCIA.map((c, i) => (
          <div key={i} className="flex gap-3 items-start">
            <span className="text-[10px] font-bold text-cp uppercase w-20 flex-shrink-0 pt-0.5">{c.periodo}</span>
            <span className="text-xs text-textMid leading-relaxed">{c.detalle}</span>
          </div>
        ))}
      </div>

      {/* Indicadores */}
      <div className="cp-card space-y-3">
        <h3 className="text-xs font-semibold text-textMid uppercase tracking-wide">
          Cómo se mide el éxito del rol
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[10px] uppercase text-textLow">
                <th className="pb-2 pr-3">Indicador</th>
                <th className="pb-2 pr-3">Definición</th>
                <th className="pb-2">Meta</th>
              </tr>
            </thead>
            <tbody>
              {INDICADORES_ANCLA.map((ind, i) => (
                <tr key={i} className="border-t border-border/40">
                  <td className="py-2 pr-3 font-medium text-textHi align-top whitespace-nowrap">{ind.nombre}</td>
                  <td className="py-2 pr-3 text-textMid align-top">{ind.definicion}</td>
                  <td className="py-2 text-textLow align-top">{ind.meta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-textLow mb-1.5">Disciplina operativa</p>
          <div className="flex flex-wrap gap-1.5">
            {INDICADORES_DISCIPLINA.map((d, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(148,163,184,0.12)', color: '#94A3B8' }}>{d}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Compromisos y anti-perfil */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="cp-card space-y-2">
          <h3 className="text-xs font-semibold text-textMid uppercase tracking-wide">Compromiso al operar el rol</h3>
          <ul className="space-y-1.5">
            {COMPROMISOS.map((c, i) => (
              <li key={i} className="text-xs text-textMid leading-relaxed flex gap-2">
                <span style={{ color: '#22C55E' }} className="flex-shrink-0">✓</span><span>{c}</span>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-textLow italic pt-1">
            Este compromiso no es aspiracional. Es la base sobre la que opera el rol.
          </p>
        </div>

        <div className="cp-card space-y-2">
          <h3 className="text-xs font-semibold text-textMid uppercase tracking-wide">Anti-perfil</h3>
          <ul className="space-y-1.5">
            {ANTI_PERFIL.map((a, i) => (
              <li key={i} className="text-xs text-textMid leading-relaxed flex gap-2">
                <span style={{ color: '#F87171' }} className="flex-shrink-0">✕</span><span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
