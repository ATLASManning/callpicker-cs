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
import { TX_TENUE } from '@/lib/contraste'

const SEMAFORO: Record<string, { label: string; color: string }> = {
  intenso:      { label: 'Uso intenso',  color: '#22C55E' },
  saludable:    { label: 'Saludable',    color: '#22C55E' },
  bajo:         { label: 'Uso bajo',     color: '#F97316' },
  sin_uso:      { label: 'Sin uso',      color: '#EF4444' },
  suspendida:   { label: 'Suspendida',   color: '#EF4444' },
  sin_medicion: { label: 'Sin medición', color: '#3D4B5C' },
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
     pudimos medir. Donde no hay medición se dice que no la hay.

     DESDE EL RESCATE (23 nov 2026) SON TRES ESTADOS, NO DOS. Entre «medido» y
     «sin dato» está el PISO: la llamada de cuenta falló pero las bandejas sí
     contestaron, y hay un «al menos N» medido en ESE mismo periodo. Con dos
     estados, Medicall Expert salía con «sin dato» en las cuatro cifras justo
     encima de un motivo que decía «al menos 6,118 mensajes medidos en este
     mismo periodo»: la misma tarjeta contradiciéndose. Un piso no es un total
     —por eso va rotulado— pero taparlo es peor que un cero: es esconder uso
     que sí se midió. [[feedback-cero-sin-medicion]] */
  const medido = chat.semaforo !== 'sin_medicion'
  const hayCifra = medido || chat.rescatados > 0
  /* `some(esPiso)` y no `rescateEsPiso`: un cliente con dos cuentas rotas puede
     traer una exacta —que le da semáforo— y otra en piso. Mirando sólo el
     semáforo, esa segunda se colaba dentro del total sin rótulo. Basta UNA
     cota para que el agregado sea una cota. [[feedback-tablas-deben-cerrar]] */
  const piso = chat.rescatados > 0 && chat.cuentas.some(x => x.esPiso)
  const cifra = (n: number) => (hayCifra ? num(n) : 'sin dato')

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
            <p className="text-[11px]" style={{ color: TX_TENUE }}>
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
          <p className="text-[10px] mb-0.5" style={{ color: TX_TENUE }}>
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
        <Dato label="Mensajes" valor={cifra(chat.mensajesEfectivos)}
          nota={piso ? 'al menos — no es el total' : undefined} />
        <Dato label="Conversaciones" valor={cifra(chat.conversacionesEfectivas)}
          nota={piso ? 'de las bandejas que sí respondieron' : undefined} />
        <Dato label="Bandejas contratadas"
          valor={chat.bandejasContratadas > 0 ? num(chat.bandejasContratadas) : '—'} />
        <Dato label="Bandejas con tráfico" valor={cifra(chat.bandejasConTrafico)}
          nota={piso ? 'las que se pudieron leer' : undefined}
          alerta={medido && chat.contratadasMuertas > 0
            ? `${chat.contratadasMuertas} contratada(s) sin un solo mensaje`
            : undefined} />
      </div>

      {/* De dónde sale la cifra cuando el resumen de cuenta no se pudo leer.
          Sin esta línea, un «al menos» suelto parece una estimación nuestra. */}
      {piso && (
        <p className="text-[10px] mb-2.5 rounded-lg px-3 py-2 leading-snug"
          style={{ background: 'rgba(147,197,253,0.10)', color: 'rgba(255,255,255,0.75)' }}>
          {/* `background: 'transparent'` para escapar de la regla de globals.css
              que pinta blanco todo <span> sin fondo propio dentro de .cp-card. */}
          <span className="font-semibold" style={{ color: '#93C5FD', background: 'transparent' }}>
            Piso medido, no el total.{' '}
          </span>
          La llamada de resumen de cuenta falló en el origen, pero las bandejas sí respondieron:
          estas cifras son lo que ellas midieron <strong style={{ color: '#fff' }}>en este mismo
          periodo</strong>. El total real es igual o mayor.
        </p>
      )}

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
                  {x.mensajesEfectivos > 0
                    ? `${x.esPiso ? 'al menos ' : ''}${num(x.mensajesEfectivos)} mensajes`
                    : 'sin medición en el periodo'}
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
            <p className="text-[10px] mb-1.5" style={{ color: TX_TENUE }}>
              80% del Health Score oficial + 20% del uso de chat ({chat.score}/100). El oficial no
              se modifica: se recompone encima. Una cuenta sin chat queda idéntica a hoy.
            </p>
          </>
        ) : (
          <p className="text-[10px] mb-1.5" style={{ color: TX_TENUE }}>
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
        style={{ color: TX_TENUE, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <span>{chat.origen}.</span>
        <Link href="/callpicker-chat" className="flex items-center gap-1 flex-shrink-0 hover:underline"
          style={{ color: '#93C5FD' }}>
          Ver módulo completo <ExternalLink size={10} />
        </Link>
      </p>
    </div>
  )
}

function Dato({ label, valor, nota, alerta }:
  { label: string; valor: string; nota?: string; alerta?: string }) {
  return (
    <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
      <p className="text-[10px]" style={{ color: TX_TENUE }}>{label}</p>
      <p className="text-sm font-bold" style={{ color: '#fff' }}>{valor}</p>
      {/* #93C5FD sobre el fondo de la ficha: el mismo azul con el que el módulo
          de Chat rotula sus pisos, para que la cota se lea igual en los dos
          sitios. [[atlas-dashboard-contrast-architecture]] */}
      {/* El rótulo va en un <span> CON `background`, no en un <p>: `globals.css`
          fuerza `color: rgba(255,255,255,0.88) !important` a todo <p> dentro de
          `.cp-card`, y a los <span> que no declaren fondo. Medido aquí mismo: el
          #93C5FD se escribía y se publicaba BLANCO, con lo que la cota se leía
          igual que el resto del texto. Declarar `background` —aunque sea
          transparente— es la cláusula de escape de esa regla.
          [[atlas-dashboard-contrast-architecture]] */}
      {nota && (
        <p className="text-[9px] mt-0.5">
          <span style={{ color: '#93C5FD', background: 'transparent' }}>{nota}</span>
        </p>
      )}
      {alerta && <p className="text-[9px] mt-0.5" style={{ color: '#FDBA74' }}>{alerta}</p>}
    </div>
  )
}

function Marcador({ label, valor, color }: { label: string; valor: number; color: string }) {
  return (
    <div>
      <p className="text-[9px]" style={{ color: TX_TENUE }}>{label}</p>
      <p className="text-base font-bold leading-none" style={{ color }}>{valor}</p>
    </div>
  )
}
