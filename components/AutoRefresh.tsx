'use client'
/**
 * AutoRefresh — llama router.refresh() en intervalos para mantener
 * los datos del server component siempre actualizados sin recargar la página.
 * Default: cada 5 minutos.
 */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { HERO_LEAD } from '@/lib/paleta-cs'

interface Props {
  intervalMs?: number   // default 300_000 = 5 min
  showIndicator?: boolean
  /**
   * El indicador va sobre una superficie OSCURA que no es una `.cp-card`.
   *
   * POR QUÉ HACE FALTA DECIRLO. `text-textLow` vale `#6A7889` —tinta oscura— y
   * sólo se vuelve blanco translúcido DENTRO de una `.cp-card`, por la regla de
   * `globals.css:84`. El hero del Dashboard es un `<header>` con degradado
   * propio, no una `.cp-card`, así que esa clase se queda en su valor oscuro:
   * medido, **1.32:1 contra el extremo claro del degradado** y 3.11 contra el
   * oscuro. Invisible, y de las que sólo se leen seleccionando el texto.
   *
   * Es la Variante B del bug de contraste de este tablero: un panel oscuro que
   * usa tokens cuyo valor correcto depende de que algo más los sobreescriba.
   * La regla de la casa es que ese panel NO use `text-textHi/Mid/Low`.
   * [[atlas-dashboard-contrast-architecture]]
   */
  sobreOscuro?: boolean
}

export default function AutoRefresh({
  intervalMs = 300_000, showIndicator = true, sobreOscuro = false,
}: Props) {
  const router = useRouter()
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [refreshing, setRefreshing]   = useState(false)

  useEffect(() => {
    const id = setInterval(() => {
      setRefreshing(true)
      router.refresh()
      setLastRefresh(new Date())
      setTimeout(() => setRefreshing(false), 1000)
    }, intervalMs)
    return () => clearInterval(id)
  }, [router, intervalMs])

  if (!showIndicator) return null

  return (
    <div className={`flex items-center gap-1.5 text-[10px] select-none${sobreOscuro ? '' : ' text-textLow'}`}
         style={sobreOscuro ? { color: HERO_LEAD } : undefined}>
      {/* El aro al 40% sobre el degradado casi no se ve, y es decoración: el
          texto de al lado dice lo mismo. Aun así sube a 70% sobre oscuro para
          que el giro se note, que es su único trabajo. */}
      <RefreshCw size={9}
                 className={refreshing ? 'animate-spin text-cp' : (sobreOscuro ? 'opacity-70' : 'opacity-40')} />
      <span style={sobreOscuro ? { background: 'transparent', color: 'inherit' } : undefined}>
        Actualizado {lastRefresh.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
        {' · '}auto cada {Math.round(intervalMs / 60000)} min
      </span>
    </div>
  )
}
