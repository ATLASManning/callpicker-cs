'use client'
import { getSemaforo, SEMAFORO_CONFIG } from '@/lib/types'

interface Props {
  score: number
  size?: number
  strokeWidth?: number
  showLabel?: boolean
}

export default function HealthScoreRing({ score, size = 80, strokeWidth = 8, showLabel = true }: Props) {
  const semaforo = getSemaforo(score)
  const cfg = SEMAFORO_CONFIG[semaforo]
  const r = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke="#263352" strokeWidth={strokeWidth} />
        {/* Progress */}
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={cfg.color} strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-base font-bold leading-none" style={{ color: cfg.color }}>{score}</span>
          <span className="text-[9px] text-textLow mt-0.5">HS</span>
        </div>
      )}
    </div>
  )
}
