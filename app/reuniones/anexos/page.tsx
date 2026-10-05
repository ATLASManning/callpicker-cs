'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Paperclip, Plus, X, Save, ArrowLeft, Trash2, RefreshCw, Download,
  Building2, FileText, AlertTriangle, Search,
} from 'lucide-react'
import Link from 'next/link'
import CustomSelect from '@/components/CustomSelect'
import { textoFecha } from '@/lib/fecha-local'
import {
  TEMAS, ETIQUETA_TEMA, COLOR_TEMA, ACCEPT, MAX_BYTES,
  motivoRechazo, etiquetaFormato, pesoLegible, type Tema, type Anexo,
} from '@/lib/anexos'

/** Cuenta seleccionable. El vínculo es por id; el nombre no es llave. */
type CuentaOpcion = { id: string; consecutivo: string | null; cid: string | null; empresa: string; asesor: string | null }

const vacio = () => ({ cuenta_id: '', nombre_documento: '', tema: '' as Tema | '', notas: '' })

export default function AnexosPage() {
  const [anexos, setAnexos]   = useState<Anexo[]>([])
  const [cuentas, setCuentas] = useState<CuentaOpcion[]>([])
  const [loading, setLoading] = useState(true)
  const [tablaExiste, setTablaExiste] = useState<boolean | null>(null)
  const [cuentasError, setCuentasError] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(vacio())
  const [archivo, setArchivo] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filtroTema, setFiltroTema] = useState<Tema | ''>('')
  const [busca, setBusca] = useState('')

  /* SE REVISA `res.ok`, Y UN FALLO NO VACÍA LA LISTA.
   *
   * Antes esto hacía `const json = await res.json()` sin mirar el estado. Un
   * 500 de Supabase se parseaba igual, `json.rows` no venía, y la pantalla
   * pintaba «Todavía no hay anexos» — un fallo presentado como dato. Con la
   * sesión caída era peor: el middleware redirige a /acceso, `fetch` sigue el
   * redirect, `res.json()` revienta con el HTML del login y el `catch` borraba
   * una lista ya cargada de documentos para afirmar que no había ninguno.
   *
   * Es exactamente lo que el flag `tablaExiste` vino a evitar, y sólo cubría
   * un modo de falla de los tres. */
  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/anexos')
      if (!res.ok) {
        let msg = `No se pudo cargar la lista (error ${res.status}).`
        try { const j = await res.json(); msg = j.mensaje ?? j.error ?? msg } catch {}
        if (res.status === 403) msg = 'Tu rol no tiene acceso a los anexos.'
        setError(msg)
        return   // la lista anterior se queda; no se finge un cero
      }
      const json = await res.json()
      setTablaExiste(json.tablaExiste !== false)
      setAnexos(Array.isArray(json.rows) ? json.rows : [])
      setError(null)
    } catch {
      setError('No se pudo cargar la lista. Puede que la sesión haya expirado: recarga la página.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  useEffect(() => {
    let cancelado = false
    setCuentasError(false)
    fetch('/api/cuentas')
      .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json() })
      .then((rows: unknown) => {
        if (cancelado) return
        if (!Array.isArray(rows)) throw new Error('respuesta inesperada')
        setCuentas((rows as Record<string, unknown>[])
          .map(c => ({
            id: String(c.id), consecutivo: (c.consecutivo as string) ?? null,
            cid: (c.cid as string) ?? null, empresa: String(c.empresa ?? ''),
            asesor: (c.asesor as string) ?? null,
          }))
          .filter(c => c.id && c.empresa)
          .sort((a, b) => a.empresa.localeCompare(b.empresa, 'es')))
      })
      // Sin catálogo no se puede elegir cliente, y el cliente es obligatorio:
      // decirlo en pantalla en vez de dejar un combo vacío sin explicación.
      .catch(() => { if (!cancelado) setCuentasError(true) })
    return () => { cancelado = true }
  }, [])

  /* El archivo se valida en el navegador con la MISMA función que usa el
     servidor. No sustituye a la del servidor —ésa es la que manda— pero evita
     subir 20 MB para que lo rechacen al final. */
  function elegirArchivo(f: File | null) {
    setArchivo(f)
    setError(f ? motivoRechazo(f.name, f.type, f.size) : null)
    // El nombre del documento se propone solo, y se puede cambiar.
    if (f && !form.nombre_documento.trim()) {
      const i = f.name.lastIndexOf('.')
      setForm(p => ({ ...p, nombre_documento: i > 0 ? f.name.slice(0, i) : f.name }))
    }
  }

  async function guardar() {
    if (!form.cuenta_id)            return setError('Elige el cliente al que pertenece el documento.')
    if (!form.nombre_documento.trim()) return setError('Escribe el nombre del documento.')
    if (!form.tema)                 return setError('Elige el tema del documento.')
    if (!archivo)                   return setError('Adjunta un archivo Word, Excel, PDF o HTML.')
    const malo = motivoRechazo(archivo.name, archivo.type, archivo.size)
    if (malo) return setError(malo)

    setSaving(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('cuenta_id', form.cuenta_id)
      fd.append('nombre_documento', form.nombre_documento.trim())
      fd.append('tema', form.tema)
      fd.append('notas', form.notas.trim())
      fd.append('archivo', archivo)

      const res = await fetch('/api/anexos', { method: 'POST', body: fd })
      if (!res.ok) {
        let msg = `Error ${res.status}`
        // `mensaje` es la explicación; `error` suele ser un código de máquina.
        try { const j = await res.json(); msg = j.mensaje ?? j.error ?? msg } catch {}
        if (res.status === 401) msg = 'Sesión expirada. Recarga la página e ingresa de nuevo.'
        setError(msg)
        return
      }
      const json = await res.json()
      if (!json.row) { setError('El servidor no confirmó la subida. Recarga la página.'); return }
      setAnexos(prev => [json.row as Anexo, ...prev])
      setShowForm(false)
      setForm(vacio())
      setArchivo(null)
    } catch {
      setError('Error de conexión. Verifica tu red y que la sesión esté activa.')
    } finally {
      setSaving(false)
    }
  }

  async function eliminar(a: Anexo) {
    if (!confirm(`¿Eliminar "${a.nombre_documento}"? El archivo se borra del almacenamiento.`)) return
    try {
      const res = await fetch(`/api/anexos/${a.id}`, { method: 'DELETE' })
      if (!res.ok) {
        let msg = `No se pudo eliminar (${res.status}).`
        try { const j = await res.json(); msg = j.mensaje ?? j.error ?? msg } catch {}
        setError(msg)
        return
      }
      const j = await res.json()
      setAnexos(prev => prev.filter(x => x.id !== a.id))
      if (j.aviso) setError(j.aviso)
    } catch {
      setError('Error de conexión al eliminar.')
    }
  }

  const visibles = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return anexos.filter(a =>
      (!filtroTema || a.tema === filtroTema) &&
      (!q || `${a.nombre_documento} ${a.empresa ?? ''} ${a.cid ?? ''} ${a.archivo_nombre}`
        .toLowerCase().includes(q)))
  }, [anexos, filtroTema, busca])

  /* El conteo por tema CIERRA contra el total: un reparto que no suma deja al
     lector sin saber si falta una categoría o si el filtro está mintiendo. */
  const porTema = useMemo(() => {
    const m = new Map<Tema, number>(TEMAS.map(t => [t, 0]))
    for (const a of anexos) m.set(a.tema, (m.get(a.tema) ?? 0) + 1)
    return m
  }, [anexos])

  return (
    <div className="min-h-screen">
      <div className="px-6 pt-5 pb-0">
        <Link href="/reuniones" className="inline-flex items-center gap-1.5 text-xs mb-4"
          style={{ color: '#64748b' }}>
          <ArrowLeft size={13} /> Volver a Reuniones
        </Link>
        <div className="flex items-center justify-between pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold" style={{ color: '#0F172A', letterSpacing: '-0.02em' }}>
                Anexos
              </h1>
              <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(0,87,255,0.1)', color: '#0057FF' }}>
                <Paperclip size={9} /> {anexos.length}
              </span>
            </div>
            <p className="text-sm mt-0.5" style={{ color: '#475569' }}>
              Documentos de cliente — Word, Excel, PDF e informes HTML. Cada uno queda asociado a su cuenta
              y aparece en su ficha.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={cargar} className="cp-btn cp-btn-ghost" title="Recargar">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            {tablaExiste !== false && (
              <button onClick={() => { setShowForm(true); setForm(vacio()); setArchivo(null); setError(null) }}
                className="cp-btn cp-btn-primary">
                <Plus size={15} /> Nuevo Anexo
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 pb-10">
        {tablaExiste === false && (
          <div className="rounded-lg p-4 mb-4"
            style={{ background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.35)' }}>
            <p className="text-sm font-semibold mb-1" style={{ color: '#92400E' }}>
              <AlertTriangle size={14} className="inline mr-1" /> Falta crear la tabla
            </p>
            <p className="text-xs" style={{ color: '#92400E' }}>
              Ejecuta <code>scripts/migracion-anexos.sql</code> en el editor SQL de Supabase.
              Hasta entonces esta pantalla no puede guardar nada — y eso es mejor que
              aceptar documentos que se perderían.
            </p>
          </div>
        )}

        {cuentasError && (
          <div className="rounded-lg p-3 mb-4"
            style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.35)' }}>
            <p className="text-xs" style={{ color: '#991B1B' }}>
              <strong>No se pudo cargar el catálogo de cuentas.</strong> Sin él no puedes elegir
              cliente, y el cliente es obligatorio. Recarga la página.
            </p>
          </div>
        )}

        {error && !showForm && (
          <div className="rounded-lg p-3 mb-4"
            style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.35)' }}>
            <p className="text-xs" style={{ color: '#991B1B' }}>{error}</p>
          </div>
        )}

        {/* ── Filtros ───────────────────────────────────────────────── */}
        {anexos.length > 0 && (
          <div className="flex gap-2 mb-5 flex-wrap items-center">
            <button onClick={() => setFiltroTema('')} className="cp-btn text-xs"
              style={!filtroTema
                ? { background: '#0057FF', color: '#fff', border: '1px solid #003db3' }
                : { background: '#fff', color: '#374151', border: '1px solid #BFDBFE' }}>
              Todos · {anexos.length}
            </button>
            {TEMAS.map(t => (
              <button key={t} onClick={() => setFiltroTema(filtroTema === t ? '' : t)}
                className="cp-btn text-xs"
                style={filtroTema === t
                  ? { background: COLOR_TEMA[t].fg, color: '#fff', border: `1px solid ${COLOR_TEMA[t].fg}` }
                  : { background: '#fff', color: '#374151', border: '1px solid #BFDBFE' }}>
                {ETIQUETA_TEMA[t]} · {porTema.get(t) ?? 0}
              </button>
            ))}
            <div className="relative ml-auto">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2"
                style={{ color: '#94a3b8' }} />
              <input type="text" placeholder="Buscar documento o cliente…"
                value={busca} onChange={e => setBusca(e.target.value)}
                className="cp-input text-xs" style={{ paddingLeft: 28, minWidth: 230 }} />
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-16">
            <RefreshCw size={20} className="animate-spin" style={{ color: '#1B3FCC' }} />
          </div>
        )}

        {!loading && anexos.length === 0 && tablaExiste !== false && (
          <div className="cp-card text-center" style={{ padding: '40px 20px' }}>
            <Paperclip size={28} style={{ color: '#64748B', margin: '0 auto 10px' }} />
            <p className="text-sm font-semibold" style={{ color: '#fff' }}>Todavía no hay anexos</p>
            <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>
              Sube el primer documento con «Nuevo Anexo».
            </p>
          </div>
        )}

        {!loading && anexos.length > 0 && visibles.length === 0 && (
          <div className="cp-card text-center" style={{ padding: '30px 20px' }}>
            <p className="text-sm" style={{ color: '#94a3b8' }}>
              Ninguno de los {anexos.length} anexos coincide con el filtro.
            </p>
          </div>
        )}

        {/* ── Lista ─────────────────────────────────────────────────── */}
        {visibles.length > 0 && (
          <div className="space-y-2">
            {visibles.map(a => {
              const c = COLOR_TEMA[a.tema] ?? COLOR_TEMA.producto
              return (
                <div key={a.id} className="cp-card" style={{ padding: '12px 14px' }}>
                  <div className="flex items-start gap-3 flex-wrap">
                    <FileText size={18} style={{ color: c.fg, marginTop: 2, flexShrink: 0 }} />
                    <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: c.bg, color: c.fg, border: `1px solid ${c.fg}40` }}>
                          {ETIQUETA_TEMA[a.tema]}
                        </span>
                        <Link href={`/cuentas/${a.cuenta_id}`}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
                          style={{ background: 'rgba(5,150,105,0.1)', color: '#059669', border: '1px solid rgba(5,150,105,0.2)' }}>
                          <Building2 size={9} />{a.empresa ?? 'sin nombre'}{a.cid ? ` · ${a.cid}` : ''}
                        </Link>
                      </div>
                      <p className="text-sm font-semibold truncate" style={{ color: '#fff' }}>
                        {a.nombre_documento}
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: '#94a3b8' }}>
                        {etiquetaFormato(a.archivo_tipo)} · {pesoLegible(a.archivo_bytes)} ·{' '}
                        {textoFecha(a.creado_en) ?? '—'}
                        {a.subido_por ? ` · ${a.subido_por}` : ''}
                      </p>
                      {a.notas && (
                        <p className="text-[11px] mt-1" style={{ color: '#cbd5e1' }}>{a.notas}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {/* La ruta NO termina en extensión a propósito: el
                          middleware deja pasar sin sesión todo lo que case
                          con /\.\w+$/. Ver el encabezado de la ruta. */}
                      <a href={`/api/anexos/${a.id}/descargar`}
                        className="cp-btn cp-btn-ghost text-xs"
                        style={{ color: '#059669', borderColor: '#059669' }}>
                        <Download size={13} /> Descargar
                      </a>
                      <button onClick={() => eliminar(a)} className="cp-btn cp-btn-ghost text-xs"
                        style={{ color: '#ef4444', borderColor: '#ef4444' }} title="Eliminar">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Formulario ──────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto"
          style={{ background: 'rgba(15,23,42,0.6)', padding: '40px 16px' }}>
          <div className="w-full max-w-2xl rounded-2xl" style={{ background: '#fff', padding: 24 }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-extrabold" style={{ color: '#0F172A' }}>Nuevo Anexo</h2>
              <button onClick={() => setShowForm(false)} className="cp-btn cp-btn-ghost"><X size={16} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium mb-1 flex items-center gap-1" style={{ color: '#059669' }}>
                  <Building2 size={12} /> Cliente <span style={{ color: '#ef4444' }}>*</span>
                </label>
                {/* Por cuenta, no por nombre escrito. Un texto libre no vincula
                    nada: es la lección que dejó el módulo de Reuniones. */}
                <CustomSelect
                  value={form.cuenta_id} searchable
                  placeholder="Busca y selecciona el cliente…"
                  wrapperClassName="w-full" className="cp-select w-full"
                  style={{ borderColor: form.cuenta_id ? undefined : '#fca5a5' }}
                  onChange={v => setForm(p => ({ ...p, cuenta_id: v }))}
                  options={[
                    { value: '', label: '— Selecciona un cliente —' },
                    ...cuentas.map(c => ({
                      value: c.id,
                      label: `${c.consecutivo ?? 's/c'} · ${c.empresa}${c.asesor ? ` · ${c.asesor}` : ''}`,
                    })),
                  ]} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: '#475569' }}>
                    Nombre del documento <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input type="text" placeholder="ej. Análisis de caso · octubre"
                    value={form.nombre_documento}
                    onChange={e => setForm(p => ({ ...p, nombre_documento: e.target.value }))}
                    className="cp-input w-full" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: '#475569' }}>
                    Tema <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <CustomSelect
                    value={form.tema}
                    onChange={v => setForm(p => ({ ...p, tema: v as Tema }))}
                    className="cp-select w-full"
                    style={{ borderColor: form.tema ? undefined : '#fca5a5' }}
                    options={[
                      { value: '', label: '— Selecciona un tema —' },
                      ...TEMAS.map(t => ({ value: t, label: ETIQUETA_TEMA[t] })),
                    ]} />
                </div>
              </div>

              <div>
                {/* El tope lo pone Vercel (4.5 MB de cuerpo de peticion), no
                    el bucket. Se dice el numero real: prometer 25 MB hacia que
                    un PDF de 10 fallara con un 413 crudo, antes de que la ruta
                    pudiera explicar nada. */}
                <label className="text-xs font-medium mb-1 block" style={{ color: '#475569' }}>
                  Archivo <span style={{ color: '#ef4444' }}>*</span>
                  <span style={{ color: '#64748B', fontWeight: 400 }}>
                    {' '}· Word, Excel, PDF o HTML · máximo {MAX_BYTES / 1024 / 1024} MB
                  </span>
                </label>
                <input type="file" accept={ACCEPT}
                  onChange={e => elegirArchivo(e.target.files?.[0] ?? null)}
                  className="cp-input w-full text-xs"
                  style={{ padding: 8, borderColor: archivo ? undefined : '#fca5a5' }} />
                {archivo && (
                  <p className="text-[10px] mt-1" style={{ color: '#059669' }}>
                    {archivo.name} · {etiquetaFormato(archivo.type) === 'Documento' && /\.html?$/i.test(archivo.name)
                      ? 'HTML' : etiquetaFormato(archivo.type)} · {pesoLegible(archivo.size)}
                  </p>
                )}
                {/* El HTML puede traer scripts. Se guarda y se descarga, pero NO
                    se abre dentro del tablero: servirlo desde este origen le
                    daria acceso a la cookie de sesion. Decirlo evita que alguien
                    reporte como falla que no se vea en pantalla. */}
                {archivo && /\.html?$/i.test(archivo.name) && (
                  <p className="text-[10px] mt-1" style={{ color: '#92400E' }}>
                    Un informe HTML se guarda y se descarga, pero no se abre dentro del
                    tablero: se abre desde tu equipo una vez descargado.
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: '#475569' }}>
                  Notas <span style={{ color: '#64748B', fontWeight: 400 }}>· opcional</span>
                </label>
                <textarea placeholder="¿Qué contiene? ¿Para qué sirve?"
                  value={form.notas} rows={3}
                  onChange={e => setForm(p => ({ ...p, notas: e.target.value }))}
                  className="cp-input w-full" />
              </div>

              {error && (
                <div className="rounded-lg p-3"
                  style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.3)' }}>
                  <p className="text-xs" style={{ color: '#991B1B' }}>{error}</p>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button onClick={guardar} disabled={saving} className="cp-btn cp-btn-primary flex-1">
                  {saving
                    ? <><RefreshCw size={14} className="animate-spin" /> Subiendo…</>
                    : <><Save size={14} /> Guardar Anexo</>}
                </button>
                <button onClick={() => setShowForm(false)} className="cp-btn cp-btn-ghost">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
