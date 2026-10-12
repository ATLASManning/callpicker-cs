'use client'
/**
 * El estado de filtros que comparten las gráficas del Dashboard.
 *
 * POR QUÉ UN CONTEXTO Y NO PROPS
 * El cross-filtering que pidió dirección —clic en un segmento y el resto del
 * tablero se filtra— cruza componentes que no son hermanos: la apilada vive en
 * `DashAlertasGraficas` y el ranking en `TopCuentasVersatil`, y entre ellos hay
 * un servidor de por medio. Pasar props obligaría a subir el estado a
 * `app/page.tsx`, que es un componente de SERVIDOR y no puede tener estado.
 *
 * NO toca datos ni consultas: filtra en cliente lo que ya llegó. Es capa de
 * presentación, como pide el encargo.
 */
import { createContext, useCallback, useContext, useMemo, useState } from 'react'

/** Las dimensiones por las que se puede filtrar. Cerrado a propósito: un
 *  filtro por una dimensión que ninguna gráfica sabe aplicar es un chip que
 *  no hace nada, y eso enseña a desconfiar de los chips. */
export type DimFiltro = 'asesor' | 'situacion' | 'fuente'

export interface Filtro {
  dim: DimFiltro
  valor: string
  /** Lo que se escribe en el chip. Se guarda porque la clave suele ser un
   *  identificador (`no_la_vemos`) y el chip tiene que leerse. */
  etiqueta: string
}

interface Ctx {
  filtros: Filtro[]
  /** Alterna: si ya está el mismo, lo quita. Un clic que sólo añade obliga a
   *  ir al chip para deshacer, y la gente vuelve a hacer clic donde hizo. */
  alternar: (f: Filtro) => void
  quitar: (dim: DimFiltro, valor: string) => void
  limpiar: () => void
  /** `true` si la fila pasa TODOS los filtros activos. */
  pasa: (fila: { asesor?: string | null; situacion?: string; fuentes?: string[] }) => boolean
  activo: (dim: DimFiltro, valor: string) => boolean
}

const C = createContext<Ctx | null>(null)

export function DashFiltrosProvider({ children }: { children: React.ReactNode }) {
  const [filtros, setFiltros] = useState<Filtro[]>([])

  const alternar = useCallback((f: Filtro) => {
    setFiltros(prev => prev.some(x => x.dim === f.dim && x.valor === f.valor)
      ? prev.filter(x => !(x.dim === f.dim && x.valor === f.valor))
      : [...prev, f])
  }, [])

  const quitar = useCallback((dim: DimFiltro, valor: string) => {
    setFiltros(prev => prev.filter(x => !(x.dim === dim && x.valor === valor)))
  }, [])

  const limpiar = useCallback(() => setFiltros([]), [])

  const valor = useMemo<Ctx>(() => {
    /* Dentro de una dimensión, OR; entre dimensiones, AND. Es lo que la gente
       espera: elegir dos asesores muestra los dos, pero elegir un asesor y una
       situación muestra la intersección. Con AND en todo, dos clics en la
       misma dimensión dejaban la pantalla vacía y parecía un error. */
    const porDim = new Map<DimFiltro, Set<string>>()
    for (const f of filtros) {
      if (!porDim.has(f.dim)) porDim.set(f.dim, new Set())
      porDim.get(f.dim)!.add(f.valor)
    }
    return {
      filtros,
      alternar,
      quitar,
      limpiar,
      activo: (dim, v) => porDim.get(dim)?.has(v) ?? false,
      pasa: fila => {
        for (const [dim, vals] of porDim) {
          if (dim === 'asesor') {
            if (!fila.asesor || !vals.has(fila.asesor)) return false
          } else if (dim === 'situacion') {
            if (!fila.situacion || !vals.has(fila.situacion)) return false
          } else if (dim === 'fuente') {
            const f = fila.fuentes ?? []
            let alguna = false
            for (const v of vals) if (f.includes(v)) { alguna = true; break }
            if (!alguna) return false
          }
        }
        return true
      },
    }
  }, [filtros, alternar, quitar, limpiar])

  return <C.Provider value={valor}>{children}</C.Provider>
}

/**
 * Fuera del proveedor devuelve un contexto INERTE en vez de reventar.
 *
 * Así una gráfica se puede montar suelta —en una ficha, en una prueba— sin
 * arrastrar el proveedor. `pasa` siempre dice que sí, que es lo correcto: sin
 * filtros, todo pasa.
 */
const INERTE: Ctx = {
  filtros: [],
  alternar: () => {},
  quitar: () => {},
  limpiar: () => {},
  pasa: () => true,
  activo: () => false,
}

export function useDashFiltros(): Ctx {
  return useContext(C) ?? INERTE
}
