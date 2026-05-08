import type { Asesor } from '@/lib/types'
import { ASESOR_CONFIG } from '@/lib/types'

interface Props {
  asesor: Asesor
  size?: 'sm' | 'md'
}

export default function AsesorBadge({ asesor, size = 'sm' }: Props) {
  const cfg = ASESOR_CONFIG[asesor]
  const sz = size === 'sm' ? 'w-5 h-5 text-[10px]' : 'w-7 h-7 text-xs'
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`${sz} rounded-full flex items-center justify-center font-bold flex-shrink-0`}
        style={{ background: `${cfg.color}25`, color: cfg.color, border: `1px solid ${cfg.color}50` }}>
        {cfg.initial}
      </span>
      <span className="text-xs text-textMid">{asesor}</span>
    </span>
  )
}
