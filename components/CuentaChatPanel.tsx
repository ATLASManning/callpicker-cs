/**
 * Módulo de Callpicker Chat en la ficha de cuenta.
 *
 * Solo se renderiza donde hay chat. La voz de la ficha no cambia: este panel
 * se suma, no sustituye. Muestra el nombre del plan tal como lo dicta la
 * factura, lo que la hoja de chat reporta como contratado, y cuánto mueve ese
 * chat la salud del cliente.
 *
 * Server component: recibe el módulo ya resuelto desde la página.
 */
import Link from 'next/link'
import { MessageCircle, AlertTriangle, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react'
import type { ChatDeCuenta } from '@/lib/chat-cuenta'

const SEMAFORO: Record<string, { label: string; color: string }> = {
  intenso:      { label: 'Uso intenso',  color: '#22C55E' },
  saludable:    { label: 'Saludable',    color: '#22C55E' },
  bajo:         { label: 'Uso bajo',     color: '#F97316' },
  sin_uso:      { label: 'Sin uso',      color: '#EF4444' },
  suspendida:   { label: 'Suspendida',   color: '#EF4444' },
  sin_medicion: { label: 'Sin medición', color: '#64748B' },
}

const num = (n: number) => n.toLocaleString('es-MX')

export default function CuentaChatPanel({ chat }: { chat: ChatDeCuenta }) {
  const sem = SEMAFORO[chat.semaforo] ?? SEMAFORO.sin_medicion
  const contratado = chat.vinculo === 'contratado'
  const delta = chat.hsAjustado !== null ? chat.hsAjustado - chat.hsOficial : null

  /* Cuando la medición falló, los ceros del origen NO son ceros del cliente.
     Akún tiene 31 bandejas contratadas y la recolección se cayó en todas sus
     cuentas: publicar «0 mensajes», «0 bandejas con tráfico» y un −100% de
     caída afirma que dejó de usar el chat, cuando lo cierto es que no lo
     pudimos medir. Donde no hay medición se dice que no la hay. */
  const medido = chat.semaforo !== 'sin_medicion'
  const cifra = (n: number) => (medido ? num(n) : 'sin dato')

  return (
    <div className="cp-card">
      {/* Encabezado */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `${sem.color}1F` }}>
            <MessageCircle size={15} style={{ color: sem.color }} />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: '#fff' }}>Callpicker Chat</p>
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Corte desde {chat.periodo}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] font-semibold px-2 py-1 rounded-lg whitespace-nowrap"
            style={{ background: `${sem.color}22`, color: sem.color }}>
            {sem.label}
          </span>
          <span className="text-[10px] font-semibold px-2 py-1 rounded-lg whitespace-nowrap"
            style={contratado
              ? { background: 'rgba(59,130,246,0.18)', color: '#93C5FD' }
              : { background: 'rgba(249,115,22,0.18)', color: '#FDBA74' }}>
            {contratado ? 'Contratado' : 'Tráfico sin contrato'}
          </span>
        </div>
      </div>

      {/* Lo que dicta la factura */}
      {chat.planFacturado && (
        <div className="rounded-xl px-3.5 py-2.5 mb-2.5"
          style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.18)' }}>
          <p className="text-[10px] mb-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Plan que nombra la factura ({chat.mesFactura})
          </p>
          <p className="text-xs font-medium" style={{ color: '#fff' }}>
            {chat.planFacturado}
            {chat.montoFacturado ? (
              <span className="ml-2 font-normal" style={{ color: 'rgba(255,255,255,0.6)' }}>
                ${num(Math.round(chat.montoFacturado))}
              </span>
            ) : null}
          </p>
        </div>
      )}

      {/* Cifras del periodo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2.5">
        <Dato label="Mensajes"       valor={cifra(chat.mensajes)} />
        <Dato label="Conversaciones" valor={cifra(chat.conversaciones)} />
        <Dato label="Bandejas contratadas"
          valor={chat.bandejasContratadas > 0 ? num(chat.bandejasContratadas) : '—'} />
        <Dato label="Bandejas con tráfico" valor={cifra(chat.bandejasConTrafico)}
          alerta={medido && chat.contratadasMuertas > 0
            ? `${chat.contratadasMuertas} contratada(s) sin un solo mensaje`
            : undefined} />
      </div>

      {/* Cuentas de Chatwoot — nombre + ID, como pidió Daniel Martínez */}
      {chat.cuentas.length > 0 && (
        <div className="space-y-1.5 mb-2.5">
          {chat.cuentas.map((x, i) => (
            <div key={i} className="rounded-lg px-3 py-2 flex items-center justify-between gap-3"
              style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="min-w-0">
                <p className="text-[11px] font-medium truncate" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  {x.nombre}
                  {x.id !== null && (
                    <span className="ml-1.5 font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      · ID {x.id}
                    </span>
                  )}
                </p>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {medido ? `${num(x.mensajes)} mensajes` : 'sin medición en el periodo'}
                  {x.agentes ? ` · ${x.agentes} agente(s) contratado(s)` : ''}
                  {x.bolsa ? ` · bolsa de ${num(x.bolsa)}` : ''}
                  {medido && x.pctBolsa !== null ? ` · ${x.pctBolsa.toFixed(0)}% consumido` : ''}
                </p>
              </div>
              {medido && x.crecimiento !== null && (
                <span className="text-[10px] font-semibold flex items-center gap-1 flex-shrink-0"
                  style={{ color: x.crecimiento >= 0 ? '#4ADE80' : '#F87171' }}>
                  {x.crecimiento >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {x.crecimiento >= 0 ? '+' : ''}{x.crecimiento.toFixed(0)}%
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Ponderación en la salud */}
      <div className="rounded-xl px-3.5 py-3"
        style={{ background: 'rgba(255,255,255,0.045)', border: '1px solid rgba(255,255,255,0.09)' }}>
        <p className="text-[11px] font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.8)' }}>
          Peso del chat en la salud del cliente
        </p>

        {chat.hsAjustado !== null && delta !== null ? (
          <>
            <div className="flex items-center gap-2.5 mb-2">
              <Marcador label="Health Score" valor={chat.hsOficial} color="rgba(255,255,255,0.55)" />
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>→</span>
              <Marcador label="Con chat ponderado" valor={chat.hsAjustado}
                color={delta >= 0 ? '#4ADE80' : '#F87171'} />
              <span className="text-[11px] font-semibold"
                style={{ color: delta > 0 ? '#4ADE80' : delta < 0 ? '#F87171' : 'rgba(255,255,255,0.4)' }}>
                {delta > 0 ? '+' : ''}{delta}
              </span>
            </div>
            <p className="text-[10px] mb-1.5" style={{ color: 'rgba(255,255,255,0.42)' }}>
              80% del Health Score oficial + 20% del uso de chat ({chat.score}/100). El oficial no
              se modifica: se recompone encima. Una cuenta sin chat queda idéntica a hoy.
            </p>
          </>
        ) : (
          <p className="text-[10px] mb-1.5" style={{ color: 'rgba(255,255,255,0.42)' }}>
            El Health Score se queda en <strong style={{ color: 'rgba(255,255,255,0.7)' }}>{chat.hsOficial}</strong>,
            sin ajuste por chat.
          </p>
        )}

        <ul className="space-y-0.5">
          {chat.razones.map((r, i) => (
            <li key={i} className="text-[10px] flex gap-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <span>·</span>{r}
            </li>
          ))}
        </ul>
      </div>

      {/* Hallazgos del semáforo */}
      {chat.motivos.length > 0 && (
        <ul className="mt-2.5 space-y-1">
          {chat.motivos.map((m, i) => (
            <li key={i} className="text-[11px] flex gap-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
              <span style={{ color: sem.color }}>·</span>{m}
            </li>
          ))}
        </ul>
      )}

      {chat.bandejasConError > 0 && (
        <p className="text-[10px] mt-2 flex items-start gap-1.5" style={{ color: '#FDBA74' }}>
          <AlertTriangle size={11} className="flex-shrink-0 mt-px" />
          {chat.bandejasConError} bandeja(s) con error al calcular su consumo en el origen. Sus
          mensajes no entran en estas cifras.
        </p>
      )}

      <p className="text-[10px] mt-3 pt-3 flex items-center justify-between gap-2"
        style={{ color: 'rgba(255,255,255,0.38)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <span>{chat.origen}.</span>
        <Link href="/callpicker-chat" className="flex items-center gap-1 flex-shrink-0 hover:underline"
          style={{ color: '#93C5FD' }}>
          Ver módulo completo <ExternalLink size={10} />
        </Link>
      </p>
    </div>
  )
}

function Dato({ label, valor, alerta }: { label: string; valor: string; alerta?: string }) {
  return (
    <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
      <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.42)' }}>{label}</p>
      <p className="text-sm font-bold" style={{ color: '#fff' }}>{valor}</p>
      {alerta && <p className="text-[9px] mt-0.5" style={{ color: '#FDBA74' }}>{alerta}</p>}
    </div>
  )
}

function Marcador({ label, valor, color }: { label: string; valor: number; color: string }) {
  return (
    <div>
      <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.38)' }}>{label}</p>
      <p className="text-base font-bold leading-none" style={{ color }}>{valor}</p>
    </div>
  )
}
