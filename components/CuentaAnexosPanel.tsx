import Link from 'next/link'
import {
  ETIQUETA_TEMA, COLOR_TEMA, etiquetaFormato, pesoLegible, TEMAS, type Anexo,
} from '@/lib/anexos'
import { textoFecha } from '@/lib/fecha-local'

/**
 * Documentos anexados a esta cuenta.
 *
 * ── POR QUÉ LOS COLORES VAN EN <C> Y NO EN EL ELEMENTO ─────────────────────
 * El panel vive en una `.cp-card` (fondo #0D1829), y globals.css fuerza a
 * blanco con `!important` todo `p`, `strong` y todo `span` que NO declare
 * `background` en su style. Sin el envoltorio, cada etiqueta de tema de este
 * panel se pintaría blanca y el color dejaría de decir nada — sin error y con
 * el panel viéndose «bien». Declarar el background, aunque sea transparente,
 * es la salida que el propio sistema dejó. Ver CuentaRelacionPanel.
 */

const TXT_HI  = 'rgba(255,255,255,0.92)'
const TXT_MID = 'rgba(255,255,255,0.72)'
const TENUE   = 'rgba(255,255,255,0.45)'

function C({ c, b, children }: { c: string; b?: boolean; children: React.ReactNode }) {
  return (
    <span style={{ background: 'transparent', color: c, fontWeight: b ? 700 : undefined }}>
      {children}
    </span>
  )
}

export default function CuentaAnexosPanel({
  anexos, tablaExiste,
}: {
  anexos: Anexo[]
  tablaExiste: boolean
}) {
  /* El reparto por tema CIERRA contra el total. Un resumen que enumera
     categorías sin sumar deja al lector sin saber si falta alguna. */
  const porTema = TEMAS
    .map(t => ({ t, n: anexos.filter(a => a.tema === t).length }))
    .filter(x => x.n > 0)
  const contados = porTema.reduce((s, x) => s + x.n, 0)
  const otros = anexos.length - contados

  return (
    <div className="cp-card" style={{ borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: 12, gap: 10, flexWrap: 'wrap' }}>
        <span style={{ background: 'transparent', fontSize: 11, fontWeight: 700, color: TXT_HI,
                       textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Anexos de la cuenta
        </span>
        <Link href="/reuniones/anexos" style={{
          fontSize: 10.5, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
          color: '#4ADE80', background: 'rgba(74,222,128,0.16)', border: '1px solid #4ADE8040',
        }}>
          {anexos.length} {anexos.length === 1 ? 'documento' : 'documentos'}
        </Link>
      </div>

      {!tablaExiste ? (
        <p style={{ fontSize: 11, margin: 0, lineHeight: 1.5 }}>
          <C c="#FDE68A">
            <C c="#FBBF24" b>Módulo de Anexos sin instalar.</C> Falta ejecutar
            {' '}<code style={{ fontSize: 10 }}>scripts/migracion-anexos.sql</code>. Se dice en vez
            de mostrar un «sin anexos», que parecería un dato.
          </C>
        </p>
      ) : anexos.length === 0 ? (
        <p style={{ fontSize: 11.5, margin: 0 }}>
          <C c={TENUE}>
            Sin documentos anexados. Se suben desde Reuniones → Anexos.
          </C>
        </p>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          <span style={{ background: 'transparent', fontSize: 10.5, fontWeight: 700,
                         color: TXT_MID, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {porTema.map(x => `${x.n} ${ETIQUETA_TEMA[x.t].toLowerCase()}`).join(' · ')}
            {otros > 0 ? ` · ${otros} sin clasificar` : ''}
          </span>

          {anexos.slice(0, 8).map(a => {
            const col = COLOR_TEMA[a.tema] ?? { fg: TENUE, bg: 'rgba(255,255,255,0.08)' }
            return (
              <div key={a.id} style={{ borderLeft: `2px solid ${col.fg}`, paddingLeft: 10 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: '1px 7px', borderRadius: 999,
                    color: col.fg, background: col.bg, border: `1px solid ${col.fg}40`,
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}>
                    {ETIQUETA_TEMA[a.tema] ?? a.tema}
                  </span>
                  {/* Sin extensión al final: el middleware deja pasar sin
                      sesión toda ruta que case con /\.\w+$/. */}
                  <a href={`/api/anexos/${a.id}/descargar`}
                     style={{ background: 'transparent', fontSize: 12, color: TXT_HI,
                              fontWeight: 600, textDecoration: 'underline' }}>
                    {a.nombre_documento}
                  </a>
                </div>
                <p style={{ fontSize: 10.5, margin: '2px 0 0', lineHeight: 1.45 }}>
                  <C c={TENUE}>
                    {etiquetaFormato(a.archivo_tipo)} · {pesoLegible(a.archivo_bytes)} ·{' '}
                    {textoFecha(a.creado_en) ?? '—'}
                    {a.subido_por ? ` · ${a.subido_por}` : ''}
                  </C>
                </p>
                {a.notas && (
                  <p style={{ fontSize: 11, margin: '2px 0 0', lineHeight: 1.45 }}>
                    <C c={TXT_MID}>{a.notas.slice(0, 220)}</C>
                  </p>
                )}
              </div>
            )
          })}

          {anexos.length > 8 && (
            <span style={{ background: 'transparent', fontSize: 10.5, color: TENUE }}>
              y {anexos.length - 8} {anexos.length - 8 === 1 ? 'documento' : 'documentos'} más
            </span>
          )}
        </div>
      )}
    </div>
  )
}
