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
import type { Dispatch, SetStateAction } from 'react'

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
  /** Deja UN solo valor en la dimensión (o ninguno, con `null`). Es lo que
   *  hace un combo: elegir otro asesor reemplaza al anterior, no lo suma. */
  fijar: (dim: DimFiltro, valor: string | null, etiqueta?: string) => void
  limpiar: () => void
  /** `false` fuera del proveedor: el componente debe usar su estado local. */
  disponible: boolean
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

  const fijar = useCallback((dim: DimFiltro, v: string | null, etiqueta?: string) => {
    setFiltros(prev => {
      const resto = prev.filter(x => x.dim !== dim)
      return v ? [...resto, { dim, valor: v, etiqueta: etiqueta ?? v }] : resto
    })
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
      fijar,
      limpiar,
      disponible: true,
      activo: (dim, v) => porDim.get(dim)?.has(v) ?? false,
      pasa: fila => {
        /* `Array.from` y no `for…of` sobre el Map: el `tsconfig` de este repo
           no tiene `downlevelIteration`. */
        for (const [dim, vals] of Array.from(porDim.entries())) {
          if (dim === 'asesor') {
            if (!fila.asesor || !vals.has(fila.asesor)) return false
          } else if (dim === 'situacion') {
            if (!fila.situacion || !vals.has(fila.situacion)) return false
          } else if (dim === 'fuente') {
            const f = fila.fuentes ?? []
            let alguna = false
            for (const v of Array.from(vals)) if (f.includes(v)) { alguna = true; break }
            if (!alguna) return false
          }
        }
        return true
      },
    }
  }, [filtros, alternar, quitar, fijar, limpiar])

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
  fijar: () => {},
  limpiar: () => {},
  disponible: false,
  pasa: () => true,
  activo: () => false,
}

export function useDashFiltros(): Ctx {
  return useContext(C) ?? INERTE
}

/**
 * EL ASESOR ELEGIDO, COMPARTIDO POR TODO EL DASHBOARD.
 *
 * Dirección pidió que elegir datos en una gráfica mueva las demás. Antes cada
 * tarjeta tenía su propio combo de asesor: elegir a Fátima en el análisis de
 * alertas dejaba el ranking, la salud y el resto enseñando a los tres, y la
 * pantalla se contradecía a sí misma.
 *
 * Devuelve la misma forma que `useState`, así que sustituye al combo local sin
 * tocar el resto del componente. Fuera del proveedor cae a estado local: la
 * gráfica sigue funcionando suelta, sólo que sin contagiar a nadie.
 */
export function useAsesorCompartido(): [string, Dispatch<SetStateAction<string>>] {
  const ctx = useDashFiltros()
  const [local, setLocal] = useState('')
  const compartido = ctx.filtros.find(f => f.dim === 'asesor')?.valor ?? ''
  const valor = ctx.disponible ? compartido : local
  const fijar = ctx.fijar
  /* El tipo va en el parámetro y no como genérico de `useCallback`: el `>>>(`
     de `useCallback<Dispatch<SetStateAction<string>>>(` despista a
     `revisa-no-definidos.py`, que lee el parámetro como un nombre suelto. */
  const set: Dispatch<SetStateAction<string>> = useCallback((sig: SetStateAction<string>) => {
    if (!ctx.disponible) { setLocal(sig); return }
    const v = typeof sig === 'function' ? sig(compartido) : sig
    fijar('asesor', v || null, v ? `Asesor: ${v}` : undefined)
  }, [ctx.disponible, compartido, fijar])
  return [valor, set]
}
