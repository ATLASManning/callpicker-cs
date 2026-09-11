'use client'

/* Diagnóstico SAC & UX del portafolio de chat.
 *
 * Este apartado nació de un panel de revisión que tumbó la primera versión.
 * Las reglas que quedaron, y que NO deben relajarse al agregar indicadores:
 *
 *  1. Ningún agregado se publica sin su denominador escrito al lado. El 18% de
 *     cuentas que no se pudieron medir no es un asterisco: es parte de la lectura.
 *  2. El balance de conversación NO se llama "mensajes sin responder". El dato es
 *     un conteo agregado por dirección: no hay mapeo mensaje→respuesta, ni tiempos,
 *     ni identidad. En WhatsApp el cliente final escribe en ráfaga y una sola
 *     respuesta atiende cinco líneas. Se publica como pregunta, nunca como acusación.
 *  3. La lectura de canal declara que solo explica el 9.7% del volumen. Decir
 *     "el QR mueve 14× más que la API" sin eso sería mentir por omisión.
 *  4. Los umbrales no se calibran contra percentiles del propio portafolio: eso
 *     garantiza que siempre haya un cuarto en rojo y es un ranking disfrazado.
 *  5. Nada de score 0-100. Promediar esconde justo el riesgo que mueve la junta.
 *  6. La agenda se acota a la capacidad real de actividades por asesor. Setenta
 *     banderas sobre 87 cuentas no son un diagnóstico, son ruido.
 */

import { useState } from 'react'
import {
  ShieldAlert, GitBranch, MessageSquareWarning, CalendarCheck,
  Bot, Info, ArrowRight,
} from 'lucide-react'
import { CHAT_SACUX } from './chat-data'

const S = CHAT_SACUX as any

const n = (v: number | null | undefined) => (v ?? 0).toLocaleString('es-MX')

const COLOR_TIPO: Record<string, string> = {
  'WhatsApp API': '#22C55E', 'WhatsApp QR': '#84CC16', 'Facebook': '#3B82F6',
  'Comentarios de Facebook': '#60A5FA', 'Marketplace': '#F59E0B', 'Correo': '#A855F7',
  'Web': '#06B6D4', 'API (otro)': '#94A3B8', 'Otro': '#94A3B8', 'Sin clasificar': '#475569',
}

type Banda = 'cobertura' | 'continuidad' | 'canales' | 'operacion' | 'agenda'

const BANDAS: { id: Banda; label: string; icon: React.ElementType; sub: string }[] = [
  { id: 'agenda',      label: 'Agenda de la semana',   icon: CalendarCheck,        sub: `${S.agenda.length} cuentas priorizadas` },
  { id: 'continuidad', label: 'Riesgo de continuidad', icon: ShieldAlert,          sub: `${S.riesgoQR.length} dependen de WhatsApp QR` },
  { id: 'canales',     label: 'Arquitectura de canales', icon: GitBranch,          sub: `${S.concentradas.length} con enrutamiento concentrado` },
  { id: 'operacion',   label: 'Señales de operación',  icon: MessageSquareWarning, sub: `${S.noCierran.length} no cierran conversaciones` },
  { id: 'cobertura',   label: 'Sobre qué se concluye', icon: Info,                 sub: `${S.cobertura.medibles} de ${S.cobertura.clientes} medibles` },
]

export default function DiagnosticoSacUx() {
  const [banda, setBanda] = useState<Banda>('agenda')

  return (
    <div className="space-y-5">

      {/* ── Selector de banda ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {BANDAS.map(b => {
          const on = banda === b.id
          const Icon = b.icon
          return (
            <button key={b.id} onClick={() => setBanda(b.id)}
              className="rounded-xl px-3 py-3 text-left transition-all"
              style={{
                background: on ? 'rgba(59,130,246,0.18)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${on ? '#3B82F6' : 'rgba(255,255,255,0.10)'}`,
                boxShadow: on ? '0 0 0 3px rgba(59,130,246,0.18)' : 'none',
              }}>
              <div className="flex items-center gap-2 mb-1">
                <Icon size={15} style={{ color: on ? '#93C5FD' : 'rgba(255,255,255,0.55)' }} />
                <span className="text-[11px] font-semibold leading-tight" style={{ color: '#fff' }}>{b.label}</span>
              </div>
              <p className="text-[10px]" style={{ color: on ? '#93C5FD' : 'rgba(255,255,255,0.42)' }}>{b.sub}</p>
            </button>
          )
        })}
      </div>

      {banda === 'agenda'      && <BandaAgenda />}
      {banda === 'continuidad' && <BandaContinuidad />}
      {banda === 'canales'     && <BandaCanales />}
      {banda === 'operacion'   && <BandaOperacion />}
      {banda === 'cobertura'   && <BandaCobertura />}
    </div>
  )
}

/* ── Marco reutilizable ─────────────────────────────────────────────────── */
function Bloque({ titulo, base, children }: { titulo: string; base: string; children: React.ReactNode }) {
  return (
    <div className="cp-card">
      <div className="mb-3">
        <p className="text-sm font-bold" style={{ color: '#fff' }}>{titulo}</p>
        {/* El denominador va SIEMPRE junto al título, no en letra chica al pie. */}
        <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{base}</p>
      </div>
      {children}
    </div>
  )
}

function Barra({ valor, max, color, alto = 8 }: { valor: number; max: number; color: string; alto?: number }) {
  const pct = max > 0 ? Math.max(1.5, (valor / max) * 100) : 0
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height: alto, background: 'rgba(255,255,255,0.07)' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 999 }} />
    </div>
  )
}

/* ── 1 · Agenda ─────────────────────────────────────────────────────────── */
function BandaAgenda() {
  const a = S.agenda as any[]
  return (
    <Bloque
      titulo="Las cuentas que vale la pena llamar esta semana"
      base={`${a.length} de ${S.agendaTotal} hallazgos. El tope es la capacidad real: ${S.capacidad} actividades por semana. Cada cuenta aparece una sola vez, con su motivo principal — no una llamada por indicador.`}
    >
      <div className="space-y-2">
        {a.map((x, i) => (
          <div key={x.cid} className="rounded-xl p-3.5"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold"
                style={{ background: 'rgba(59,130,246,0.2)', color: '#93C5FD' }}>{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-semibold text-sm" style={{ color: '#fff' }}>{x.nombre}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>CID {x.cid}</span>
                  {x.tier && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}>{x.tier}</span>
                  )}
                  <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>{n(x.mensajes)} mensajes</span>
                </div>
                <p className="text-[11px] font-semibold mb-1" style={{ color: '#F97316' }}>{x.motivo}</p>
                <p className="text-xs leading-snug" style={{ color: 'rgba(255,255,255,0.72)' }}>{x.guion}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[11px] mt-3 leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
        Quedaron {S.agendaTotal - a.length} hallazgos fuera de la lista. No desaparecen: están en las otras bandas.
        Se recortan aquí a propósito, porque una lista de {S.agendaTotal} llamadas sobre {S.cobertura.medibles} cuentas
        medibles no es un plan, es ruido.
      </p>
    </Bloque>
  )
}

/* ── 2 · Continuidad ────────────────────────────────────────────────────── */
function BandaContinuidad() {
  const r = S.riesgoQR as any[]
  const max = Math.max(...r.map(x => x.qr), 1)
  return (
    <div className="space-y-4">
      <Bloque
        titulo="Clientes que atienden por WhatsApp QR y no tienen respaldo en API oficial"
        base={`${r.length} clientes, nombrados uno por uno. No se publica como porcentaje del portafolio: el desglose por bandeja solo explica el ${S.volumen.pctExplicado}% del volumen total, así que un "% del tráfico" sería falso.`}
      >
        <div className="rounded-xl px-4 py-3 mb-4"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>
            <span className="font-semibold" style={{ color: '#FCA5A5' }}>Por qué es un riesgo y no una preferencia técnica.</span>{' '}
            WhatsApp QR es una conexión no oficial: el número vive colgado de un celular enlazado. Se desconecta solo,
            y Meta puede tumbar el número sin aviso. Cuando eso pasa no se pierde una función — se pierde el número que
            el cliente tiene publicado y el historial de conversaciones. La caída no es gradual, es binaria.
            Por eso esta bandera es sí/no y no un percentil.
          </p>
        </div>

        <div className="space-y-2.5">
          {r.map(x => (
            <div key={x.cid} className="flex items-center gap-3">
              <div className="w-44 flex-shrink-0 text-right">
                <p className="text-xs font-semibold truncate" style={{ color: '#fff' }}>{x.nombre}</p>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  CID {x.cid}{x.tier ? ` · ${x.tier}` : ''}
                </p>
              </div>
              <div className="flex-1">
                <Barra valor={x.qr} max={max} color="#84CC16" alto={10} />
              </div>
              <div className="w-40 flex-shrink-0 text-[11px]">
                <span className="font-bold" style={{ color: '#84CC16' }}>{n(x.qr)}</span>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}> por QR · </span>
                <span className="font-bold" style={{ color: '#EF4444' }}>0</span>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}> por API</span>
              </div>
            </div>
          ))}
        </div>
      </Bloque>

      <div className="cp-card border-l-2" style={{ borderLeftColor: '#3B82F6' }}>
        <p className="text-[11px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: '#93C5FD' }}>
          Lo que se le dice al cliente en la junta
        </p>
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>
          «El número por el que te escriben tus clientes está conectado por QR, o sea colgado de un celular enlazado.
          El día que se desconecte o que Meta lo tumbe, no pierdes una función: pierdes el número que tienes publicado
          y todo el historial. Pasar a la API oficial lo vuelve tuyo y deja de depender de un teléfono prendido.»
        </p>
        <p className="text-[11px] mt-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Cierre esperado: una fecha de migración, no un «lo vemos después».
        </p>
      </div>
    </div>
  )
}

/* ── 3 · Canales ────────────────────────────────────────────────────────── */
function BandaCanales() {
  const mezcla = Object.entries(S.mezclaCanal as Record<string, number>)
    .filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])
  const totalMezcla = mezcla.reduce((s, [, v]) => s + v, 0)
  const conc = S.concentradas as any[]

  return (
    <div className="space-y-4">
      <Bloque
        titulo="Por dónde entra el tráfico que sí se puede clasificar"
        base={`Cuidado con este gráfico: describe ${n(S.volumen.explicadoPorBandeja)} mensajes, que son el ${S.volumen.pctExplicado}% del total del portafolio (${n(S.volumen.total)}). El resto viene de cuentas que se midieron por respaldo y no traen desglose por bandeja. Lo clasificado por tipo es apenas el ${S.volumen.pctClasificado}%.`}
      >
        {/* barra apilada */}
        <div className="w-full rounded-lg overflow-hidden flex mb-3" style={{ height: 26 }}>
          {mezcla.map(([t, v]) => (
            <div key={t} title={`${t}: ${n(v)} mensajes`}
              style={{
                width: `${(v / totalMezcla) * 100}%`,
                background: COLOR_TIPO[t] ?? '#475569',
                opacity: t === 'Sin clasificar' ? 0.35 : 1,
              }} />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5">
          {mezcla.map(([t, v]) => (
            <div key={t} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                style={{ background: COLOR_TIPO[t] ?? '#475569', opacity: t === 'Sin clasificar' ? 0.35 : 1 }} />
              <span className="text-[11px] flex-1 truncate" style={{ color: 'rgba(255,255,255,0.7)' }}>{t}</span>
              <span className="text-[11px] font-semibold" style={{ color: '#fff' }}>{n(v)}</span>
              <span className="text-[10px] w-11 text-right" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {((v / totalMezcla) * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
        <p className="text-[11px] mt-3 leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Dentro de lo clasificable, <span className="font-semibold" style={{ color: '#84CC16' }}>WhatsApp QR</span> mueve
          más tráfico que la API oficial. Es el hallazgo que sostiene la banda de continuidad — pero la conclusión se
          limita a estas cuentas, no al portafolio entero.
        </p>
      </Bloque>

      <Bloque
        titulo="Clientes que concentran su tráfico en una sola bandeja"
        base={`${conc.length} clientes con 3 o más bandejas donde el 90% o más del tráfico cae en una. El denominador son TODAS sus bandejas del corte, no solo las que tuvieron actividad — con ese filtro una cuenta al 100% quedaba excluida justo por ser el caso extremo.`}
      >
        <div className="space-y-2">
          {conc.map(x => (
            <div key={x.cid} className="flex items-center gap-3 rounded-lg px-3 py-2"
              style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: '#fff' }}>{x.nombre}</p>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>CID {x.cid}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold" style={{ color: '#F59E0B' }}>{(x.pct * 100).toFixed(0)}%</p>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  en {x.activas} de {x.bandejas} bandejas
                </p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] mt-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Una bandeja que nadie usa no es neutral: aparece publicada en algún lado y manda al cliente final a un
          canal sin atención. Revisar qué se publicó y dónde.
        </p>
      </Bloque>
    </div>
  )
}

/* ── 4 · Operación ──────────────────────────────────────────────────────── */
function BandaOperacion() {
  const nc = S.noCierran as any[]
  const bal = (S.balance as any[]).filter(x => x.valor < 0.6)
  const bots = S.automatizadas as any[]
  const maxNc = Math.max(...nc.map(x => x.valor), 1)

  return (
    <div className="space-y-4">
      <Bloque
        titulo="Conversaciones que no se cierran"
        base={`${nc.length} clientes con 100 o más mensajes por conversación. El corte NO es un percentil del portafolio: 100 mensajes en un mismo hilo no es "arriba del promedio", es un proceso que no marca resolución.`}
      >
        <div className="space-y-2.5">
          {nc.slice(0, 10).map(x => (
            <div key={x.cid} className="flex items-center gap-3">
              <div className="w-44 flex-shrink-0 text-right">
                <p className="text-xs font-semibold truncate" style={{ color: '#fff' }}>{x.nombre}</p>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {n(x.conversaciones)} conv · {n(x.mensajes)} msj
                </p>
              </div>
              <div className="flex-1"><Barra valor={x.valor} max={maxNc} color="#A855F7" alto={10} /></div>
              <span className="w-20 text-right text-xs font-bold" style={{ color: '#C4B5FD' }}>
                {x.valor.toFixed(0)} <span className="font-normal text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>msj/conv</span>
              </span>
            </div>
          ))}
        </div>
        <p className="text-[11px] mt-3 leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Importa más de lo que parece: si las conversaciones nunca se cierran, ninguna métrica de operación del
          cliente es fiable — ni tiempos, ni volumen por conversación, ni carga real por agente.
        </p>
      </Bloque>

      <Bloque
        titulo="Balance de la conversación"
        base={`${bal.length} clientes por debajo de 0.60, calculado solo sobre cuentas con al menos ${n(S.baseMinimaBalance)} mensajes entrantes. Es una pregunta a investigar, no un hallazgo cerrado.`}
      >
        <div className="rounded-xl px-4 py-3 mb-4"
          style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>
            <span className="font-semibold" style={{ color: '#FCD34D' }}>Esto NO son «mensajes sin responder».</span>{' '}
            El dato es un conteo agregado por dirección: no existe mapeo de mensaje a respuesta, ni tiempos, ni
            identidad del agente. En WhatsApp el cliente final escribe en ráfaga —cinco líneas cortas son cinco
            mensajes— y una sola respuesta las atiende todas. Un ratio bajo <em>puede</em> ser operación normal.
            Sirve para decidir a qué bandeja entrar a mirar, no para acusar a nadie en una junta.
          </p>
        </div>
        <div className="space-y-2">
          {bal.map(x => (
            <div key={x.cid} className="flex items-center gap-3 rounded-lg px-3 py-2"
              style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: '#fff' }}>{x.nombre}</p>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {n(x.base)} mensajes entrantes en el corte
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold" style={{ color: '#F59E0B' }}>{x.valor.toFixed(2)}</p>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>salen / entran</p>
              </div>
            </div>
          ))}
        </div>
      </Bloque>

      {bots.length > 0 && (
        <Bloque
          titulo="Volumen que no es atención humana"
          base={`${bots.length} cuentas con más de 20,000 mensajes por agente contratado y 2 agentes o menos.`}
        >
          <div className="space-y-2">
            {bots.map(x => (
              <div key={x.cid} className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.25)' }}>
                <Bot size={16} style={{ color: '#22D3EE' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold" style={{ color: '#fff' }}>{x.nombre}</p>
                  <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {n(x.mensajes)} mensajes · {n(x.carga)} por agente
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] mt-3 leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
            No se marcan como «agente saturado» a propósito. Un volumen así con un agente no es una persona
            desbordada: es automatización. Llamar al cliente a hablar de carga de trabajo sería una conversación
            equivocada — la correcta es sobre qué está haciendo ese bot y si está bien dimensionado.
          </p>
        </Bloque>
      )}
    </div>
  )
}

/* ── 5 · Cobertura ──────────────────────────────────────────────────────── */
function BandaCobertura() {
  const c = S.cobertura
  const total = c.clientes
  const seg = [
    { k: 'Medibles',     v: c.medibles,    color: '#22C55E', d: 'Lectura buena y con tráfico. Todo indicador de este apartado se calcula solo sobre éstos.' },
    { k: 'Sin uso',      v: c.sinUso,      color: '#EF4444', d: 'Cero mensajes en el corte completo. No es un vacío de datos: es un hallazgo.' },
    { k: 'Sin medición', v: c.sinMedicion, color: '#64748B', d: 'La recolección falló (HTTP 500) o la cuenta está suspendida. No se puede concluir nada de ellas.' },
  ]
  return (
    <div className="space-y-4">
      <Bloque
        titulo="Sobre cuántos clientes se puede concluir algo"
        base={`De ${total} clientes con chat, solo ${c.medibles} admiten análisis. Meter a los otros ${total - c.medibles} en cualquier promedio lo volvería falso.`}
      >
        <div className="w-full rounded-lg overflow-hidden flex mb-4" style={{ height: 30 }}>
          {seg.map(s => (
            <div key={s.k} title={`${s.k}: ${s.v}`}
              className="flex items-center justify-center"
              style={{
                width: `${(s.v / total) * 100}%`,
                background: s.k === 'Sin medición' ? 'rgba(100,116,139,0.4)' : s.color,
                backgroundImage: s.k === 'Sin medición'
                  ? 'repeating-linear-gradient(45deg, rgba(255,255,255,0.10) 0 5px, transparent 5px 10px)'
                  : undefined,
              }}>
              <span className="text-[11px] font-bold" style={{ color: s.k === 'Sin medición' ? '#CBD5E1' : '#06251A' }}>
                {s.v}
              </span>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {seg.map(s => (
            <div key={s.k} className="flex gap-2.5">
              <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0 mt-1"
                style={{
                  background: s.color,
                  backgroundImage: s.k === 'Sin medición'
                    ? 'repeating-linear-gradient(45deg, rgba(255,255,255,0.25) 0 3px, transparent 3px 6px)'
                    : undefined,
                }} />
              <div>
                <p className="text-xs font-semibold" style={{ color: '#fff' }}>{s.k} · {s.v} clientes</p>
                <p className="text-[11px] leading-snug" style={{ color: 'rgba(255,255,255,0.55)' }}>{s.d}</p>
              </div>
            </div>
          ))}
        </div>
      </Bloque>

      <Bloque
        titulo="Qué parte del volumen se puede desglosar"
        base="El total de mensajes viene de la hoja de resumen. El desglose por bandeja viene de la otra hoja, y no cubren lo mismo."
      >
        <div className="space-y-3">
          {[
            { k: 'Volumen total del portafolio', v: S.volumen.total, pct: 100, color: '#3B82F6' },
            { k: 'Explicado bandeja por bandeja', v: S.volumen.explicadoPorBandeja, pct: S.volumen.pctExplicado, color: '#22C55E' },
            { k: 'Con tipo de canal identificado', v: S.volumen.clasificadoPorTipo, pct: S.volumen.pctClasificado, color: '#84CC16' },
          ].map(x => (
            <div key={x.k}>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.7)' }}>{x.k}</span>
                <span className="text-xs font-bold" style={{ color: '#fff' }}>
                  {n(x.v)} <span className="font-normal text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>· {x.pct}%</span>
                </span>
              </div>
              <Barra valor={x.pct} max={100} color={x.color} alto={9} />
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-4 rounded-xl px-3.5 py-3"
          style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)' }}>
          <ArrowRight size={15} className="flex-shrink-0 mt-0.5" style={{ color: '#93C5FD' }} />
          <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
            Por eso ninguna lectura de canal de este apartado se presenta como porcentaje del portafolio.
            Las cuentas medidas por respaldo reportan su total pero no lo reparten entre bandejas —
            PVnube, por ejemplo, tiene {n(342362)} mensajes en su cuenta y cero en el desglose.
            Cerrar esa brecha depende de quien alimenta la hoja, no del tablero.
          </p>
        </div>
      </Bloque>
    </div>
  )
}
