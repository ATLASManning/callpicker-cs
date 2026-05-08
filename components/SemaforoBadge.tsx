import { clsx } from 'clsx'
import type { Semaforo } from '@/lib/types'
import { SEMAFORO_CONFIG } from '@/lib/types'

interface Props {
  semaforo: Semaforo
  score?: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

const DOT_SIZE = { sm: 'w-2 h-2', md: 'w-3 h-3', lg: 'w-4 h-4' }
const TEXT_SIZE = { sm: 'text-[11px]', md: 'text-xs', lg: 'text-sm' }

export default function SemaforoBadge({ semaforo, score, size = 'md', showLabel = true }: Props) {
  const cfg = SEMAFORO_CONFIG[semaforo]
  const isRojo = semaforo === 'rojo'

  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 px-2 py-1 rounded-full font-medium',
      cfg.bg, TEXT_SIZE[size]
    )} style={{ color: cfg.color, border: `1px solid ${cfg.color}30` }}>
      <span
        className={clsx('rounded-full flex-shrink-0', DOT_SIZE[size], isRojo && 'semaforo-rojo')}
        style={{ background: cfg.color }}
      />
      {showLabel && cfg.label}
      {score !== undefined && <span className="font-bold ml-0.5">{score}</span>}
    </span>
  )
}
