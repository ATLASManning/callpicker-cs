import PageHeader from '@/components/PageHeader'

export default function SettingsPage() {
  return (
    <div className="min-h-screen">
      <PageHeader title="Configuración" subtitle="Ajustes del sistema Callpicker CS" />

      <div className="px-6 pb-6 space-y-5">
        {/* App info */}
        <div className="cp-card">
          <h3 className="text-sm font-semibold text-textHi mb-4">Acerca de la Aplicación</h3>
          <div className="space-y-3">
            {[
              { label: 'Aplicación', value: 'Callpicker Customer Success' },
              { label: 'Versión', value: process.env.NEXT_PUBLIC_APP_VERSION ?? '1.0.0' },
              { label: 'Entorno', value: process.env.NODE_ENV },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <span className="text-xs text-textMid uppercase tracking-wide">{r.label}</span>
                <span className="text-sm text-textHi font-medium">{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Health Score model */}
        <div className="cp-card">
          <h3 className="text-sm font-semibold text-textHi mb-4">Modelo Health Score</h3>
          <div className="space-y-3">
            {[
              { bloque: 'A — Actividad', peso: '35%', desc: 'Días sin actividad, último contacto, seguimientos' },
              { bloque: 'B — Adopción', peso: '30%', desc: 'Uso del producto, funcionalidades activadas' },
              { bloque: 'C — Pago', peso: '20%', desc: 'Historial de pagos, facturas vencidas' },
              { bloque: 'D — Relacional', peso: '15%', desc: 'NPS, satisfacción, relación ejecutivo-cliente' },
            ].map(b => (
              <div key={b.bloque} className="flex items-start gap-4 py-2 border-b border-white/5 last:border-0">
                <div className="text-right min-w-[40px]">
                  <span className="text-base font-bold text-cp">{b.peso}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-textHi">{b.bloque}</p>
                  <p className="text-xs text-textLow mt-0.5">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Semáforo legend */}
        <div className="cp-card">
          <h3 className="text-sm font-semibold text-textHi mb-4">Semáforo — Rangos</h3>
          <div className="space-y-2">
            {[
              { label: 'Verde',    rango: '80 – 100', color: '#22C55E', accion: 'Cuenta saludable. Candidata a upsell.' },
              { label: 'Azul',     rango: '60 – 79',  color: '#3B82F6', accion: 'En buen estado. Mantener engagement.' },
              { label: 'Amarillo', rango: '40 – 59',  color: '#EAB308', accion: 'Alerta temprana. Agendar llamada.' },
              { label: 'Naranja',  rango: '20 – 39',  color: '#F97316', accion: 'En riesgo. Intervención en < 48 h.' },
              { label: 'Rojo',     rango: '0 – 19',   color: '#EF4444', accion: 'Crítico. Escalada inmediata.' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.color }} />
                <span className="text-sm font-medium text-textHi w-20">{s.label}</span>
                <span className="text-xs text-textMid w-16 font-mono">{s.rango}</span>
                <span className="text-xs text-textLow">{s.accion}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Supabase status */}
        <div className="cp-card">
          <h3 className="text-sm font-semibold text-textHi mb-3">Conexión Base de Datos</h3>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-verde animate-pulse" />
            <span className="text-sm text-textMid">Supabase PostgreSQL</span>
            <span className="ml-auto text-xs text-textLow font-mono truncate max-w-[200px]">
              {process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').split('.')[0] ?? 'No configurado'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
