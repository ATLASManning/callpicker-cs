'use client'
/**
 * La franja que dice QUÉ ESTÁ FILTRADO, para todo el Dashboard.
 *
 * Sin ella, elegir un asesor en una tarjeta cambia otras tres que están fuera
 * de la pantalla, y quien baja se encuentra cifras distintas sin saber por qué.
 * Va pegada arriba (`sticky`) para que se vea mientras se recorre la página, y
 * sólo aparece cuando hay algo filtrado: una franja vacía es ruido.
 *
 * Es una isla OSCURA sobre la página clara, así que usa `cp-card` y los tokens
 * de tarjeta. Ver [[atlas-dashboard-contrast-architecture]].
 */
import { Filter } from 'lucide-react'
import { useDashFiltros } from '@/lib/dash-filtros'
import { ChipsFiltro } from '@/components/charts/primitivos'
import { NAVY, BORDE, TX, FUENTE, ANCHO_MAX } from '@/lib/chart-theme'

export default function BarraFiltros() {
  const { filtros, quitar, limpiar } = useDashFiltros()
  if (filtros.length === 0) return null
  return (
    <div className="px-6" style={{
      position: 'sticky', top: 8, zIndex: 40, marginBottom: 12,
      maxWidth: ANCHO_MAX, marginLeft: 'auto', marginRight: 'auto',
    }}>
      <div className="cp-card" role="status" aria-live="polite" style={{
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        padding: '10px 16px', borderRadius: 12,
        background: NAVY[900], border: `1px solid ${BORDE}`,
        boxShadow: '0 8px 24px rgba(11,31,58,0.35)',
      }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
                       background: 'transparent', color: TX.low,
                       fontSize: FUENTE.etiqueta }}>
          {/* Dice QUÉ se filtra, no «todo»: la tabla de menor Health Score y
              la franja de tickets no se filtran por asesor, y prometer lo
              contrario es la clase de rótulo que enseña a desconfiar. */}
          <Filter size={14} /> Alertas, salud de la cartera, ranking y candidatos filtrados por
        </span>
        <ChipsFiltro filtros={filtros} onQuitar={(d, v) => quitar(d as never, v)}
          onLimpiar={limpiar} />
      </div>
    </div>
  )
}
