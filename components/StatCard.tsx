import { LucideIcon } from 'lucide-react'
import { clsx } from 'clsx'

type Variant = 'primary' | 'teal' | 'warn' | 'danger' | 'success'

interface Props {
  label: string
  value: string | number
  sub?: string
  icon?: LucideIcon
  variant?: Variant
  trend?: { value: number; label: string }
}

const VARIANTS: Record<Variant, { border: string; icon: string; glow: string }> = {
  primary: { border: 'border-t-cp',     icon: 'text-cp',      glow: 'shadow-glow-cp' },
  teal:    { border: 'border-t-cpTeal', icon: 'text-cpTeal',  glow: 'shadow-glow-teal' },
  warn:    { border: 'border-t-amarillo', icon: 'text-amarillo', glow: '' },
  danger:  { border: 'border-t-rojo',   icon: 'text-rojo',    glow: '' },
  success: { border: 'border-t-verde',  icon: 'text-verde',   glow: '' },
}

export default function StatCard({ label, value, sub, icon: Icon, variant = 'primary', trend }: Props) {
  const v = VARIANTS[variant]
  return (
    <div className={clsx('cp-card border-t-2', v.border, v.glow)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-textMid uppercase tracking-wide font-medium mb-1">{label}</p>
          <p className="text-2xl font-bold text-textHi">{value}</p>
          {sub && <p className="text-xs text-textLow mt-1">{sub}</p>}
          {trend && (
            <p className={clsx('text-xs font-medium mt-1', trend.value >= 0 ? 'text-verde' : 'text-rojo')}>
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        {Icon && (
          <div className={clsx('p-2 rounded-lg bg-cp/10', v.icon)}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  )
}
