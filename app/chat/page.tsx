'use client'
import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react'
import PageHeader from '@/components/PageHeader'

interface Msg { role: 'user' | 'assistant'; content: string }

const SUGERENCIAS = [
  '¿Qué cuentas tienen mayor riesgo de churn esta semana?',
  'Dame un script de WhatsApp para un cliente con score rojo',
  '¿Cómo identifico oportunidades de upsell con Callpicker Chat?',
  'Explícame el modelo de Health Score de Callpicker',
  '¿Qué hacer con un cliente de más de 24 meses inactivo?',
  'Genera el resumen de junta semanal para el equipo de UX',
]

export default function ChatPage() {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  async function send(text?: string) {
    const content = text ?? input.trim()
    if (!content || loading) return
    setInput('')
    const newMsgs: Msg[] = [...msgs, { role: 'user', content }]
    setMsgs(newMsgs)
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMsgs }),
      })
      const data = await res.json()
      setMsgs(prev => [...prev, { role: 'assistant', content: data.reply ?? data.error }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen flex flex-col">
      <PageHeader
        title="Atlas IA — Customer Success"
        subtitle="Análisis inteligente de retención y upsell"
      />

      <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-4">
        {msgs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-cp/15 flex items-center justify-center mb-4 shadow-glow-cp">
              <Sparkles size={28} className="text-cp" />
            </div>
            <h2 className="text-lg font-bold text-textHi mb-1">Atlas IA — Customer Success</h2>
            <p className="text-sm text-textMid mb-8 max-w-sm">
              Tu asistente inteligente para retención de cuentas, análisis de health score y oportunidades de upsell.
            </p>
            <div className="grid grid-cols-2 gap-2 max-w-xl w-full">
              {SUGERENCIAS.map(s => (
                <button key={s} onClick={() => send(s)}
                  className="text-left p-3 rounded-xl border border-border bg-surface hover:bg-surfaceAlt hover:border-cp/40 transition-all text-xs text-textMid">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {msgs.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center
              ${m.role === 'assistant' ? 'bg-cp/15 text-cp' : 'bg-cpTeal/15 text-cpTeal'}`}>
              {m.role === 'assistant' ? <Bot size={15} /> : <User size={15} />}
            </div>
            <div className={`max-w-[75%] rounded-2xl p-3.5 text-sm
              ${m.role === 'assistant'
                ? 'bg-surface border border-border text-textHi rounded-tl-sm'
                : 'bg-cp text-white rounded-tr-sm'}`}>
              <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-cp/15 flex items-center justify-center text-cp">
              <Bot size={15} />
            </div>
            <div className="bg-surface border border-border rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-cp" />
              <span className="text-xs text-textMid">Analizando…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 pb-6">
        <div className="flex gap-2 items-end bg-surface border border-border rounded-2xl p-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Pregunta sobre una cuenta, pide un script, analiza el semáforo…"
            rows={1}
            className="flex-1 bg-transparent text-sm text-textHi placeholder:text-textLow resize-none outline-none px-2 py-1 max-h-32"
          />
          <button onClick={() => send()} disabled={loading || !input.trim()}
            className="w-9 h-9 rounded-xl bg-cp flex items-center justify-center text-white disabled:opacity-40 transition-opacity flex-shrink-0">
            <Send size={15} />
          </button>
        </div>
        <p className="text-center text-[10px] text-textLow mt-2">
          Atlas IA · Powered by Callpicker Customer Success
        </p>
      </div>
    </div>
  )
}
