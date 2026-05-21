interface Props {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  dark?: boolean
}

export default function PageHeader({ title, subtitle, actions, dark = false }: Props) {
  return (
    <div className="flex items-start justify-between px-6 pt-6 pb-4">
      <div>
        <h1
          className="text-2xl font-extrabold tracking-tight"
          style={{
            color: dark ? '#E8F4FF' : '#0F172A',
            letterSpacing: '-0.02em',
            textShadow: dark
              ? '0 0 30px rgba(0,180,255,0.25)'
              : '0 1px 0 rgba(255,255,255,0.8)',
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="text-sm mt-0.5"
            style={{ color: dark ? 'rgba(200,228,255,0.55)' : '#475569' }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
