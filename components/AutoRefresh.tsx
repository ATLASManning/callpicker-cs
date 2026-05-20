'use client'
/**
 * AutoRefresh — llama router.refresh() en intervalos para mantener
 * los datos del server component siempre actualizados sin recargar la página.
 * Default: cada 5 minutos.
 */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'

interface Props {
  intervalMs?: number   // default 300_000 = 5 min
  showIndicator?: boolean
}

export default function AutoRefresh({ intervalMs = 300_000, showIndicator = true }: Props) {
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
    <div className="flex items-center gap-1.5 text-[10px] text-textLow select-none">
      <RefreshCw size={9} className={refreshing ? 'animate-spin text-cp' : 'opacity-40'} />
      <span>
        Actualizado {lastRefresh.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
        {' · '}auto cada {Math.round(intervalMs / 60000)} min
      </span>
    </div>
  )
}
