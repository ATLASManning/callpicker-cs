'use client'
import { useState, useMemo } from 'react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, BarChart,
} from 'recharts'
import { formatMXN } from '@/lib/types'

// ── Paleta clara ──────────────────────────────────────────────────────────────
const BG      = '#EFF6FF'
const PANEL   = '#FFFFFF'
const PANEL2  = 'rgba(0,87,255,0.04)'
const BORDER  = '#BFDBFE'
const ACCENT  = '#0057FF'
const TX      = '#0F172A'
const TX_MID  = '#475569'
const TX_LOW  = '#94A3B8'

const VENDEDOR_COLOR: Record<string, string> = {
  'Fátima':       '#A855F7',
  'Dan':          '#0EA5E9',
  'Claudia':      '#F97316',
  'Monse':        '#22C55E',
  'José':         '#F59E0B',
  'Ignacio':      '#14B8A6',
  'Jorge':        '#EC4899',
  'Marina':       '#84CC16',
  'Brunno':       '#6366F1',
  'Diego':        '#F43F5E',
  'M. Mandujano': '#8B5CF6',
  'Sin vendedor': '#475569',
  'Otro':         '#64748B',
}
const EJECUTIVO_COLOR: Record<string, string> = {
  'Pepe Toño':    '#F59E0B',
  'Cecilia':      '#EC4899',
  'Ricardo':      '#14B8A6',
  'Enrique':      '#8B5CF6',
  'Toño del Río': '#F97316',
  'Otro':         '#64748B',
  'N/A':          '#475569',
}
const TAMANO_COLOR: Record<string, string> = {
  'micro':        '#3B82F6',
  'pequeña':      '#22C55E',
  'mediana':      '#F97316',
  'grande':       '#A855F7',
  'corporativo':  '#EC4899',
  'N/A':          '#475569',
}
const GIRO_COLOR: Record<string, string> = {
  'Servicios':      '#3B82F6',
  'Bienes Raíces':  '#22C55E',
  'Producto':       '#14B8A6',
  'Salud':          '#EC4899',
  'Automotriz':     '#F59E0B',
  'Turismo':        '#A855F7',
  'Educación':      '#F97316',
  'Constructora':   '#EF4444',
  'Gobierno':       '#0EA5E9',
  'Restaurantes':   '#84CC16',
  'Callcenter':     '#06B6D4',
  'N/A':            '#475569',
}
const TIPO_COLOR: Record<string, string> = {
  'pagada': '#22C55E', 'demo': '#F59E0B', 'convertida': '#3B82F6', 'N/A': '#475569',
}

const MES_NUM: Record<string, number> = {
  January:1, February:2, March:3, April:4, May:5, June:6,
  July:7, August:8, September:9, October:10, November:11, December:12,
}
const MES_ES: Record<string, string> = {
  January:'Ene', February:'Feb', March:'Mar', April:'Abr', May:'May', June:'Jun',
  July:'Jul', August:'Ago', September:'Sep', October:'Oct', November:'Nov', December:'Dic',
}

const TT_STYLE = {
  background:'#0A1E35', border:'1px solid rgba(0,180,255,0.28)',
  borderRadius:10, fontSize:13, color:TX,
  boxShadow:'0 4px 24px rgba(0,0,0,0.55)', padding:'12px 16px',
}

export interface RegistroItem {
  id:string; cliente:string; primerPago:number; tamano:string
  ejecutivo:string; mes:string; ano:number; vendedor:string; giro:string; tipo:string
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function agrupar(records: RegistroItem[], key: keyof RegistroItem, colorMap: Record<string,string>) {
  const m = new Map<string,{count:number;fac:number}>()
  for (const r of records) {
    const k = String(r[key]) || 'N/A'
    const v = m.get(k) ?? {count:0,fac:0}
    v.count++; v.fac += r.primerPago; m.set(k, v)
  }
  return Array.from(m.entries())
    .map(([name, d]) => ({name, ...d, color: colorMap[name] ?? '#94A3B8'}))
    .sort((a,b) => b.count - a.count)
}

function agruparMes(records: RegistroItem[], soloUnAno: boolean) {
  const m = new Map<string,{count:number;fac:number;sortKey:number}>()
  for (const r of records) {
    const num = MES_NUM[r.mes] ?? 0
    const es  = MES_ES[r.mes] ?? r.mes
    const label = soloUnAno ? es : `${es}'${String(r.ano).slice(2)}`
    const sk = r.ano*100+num
    const v = m.get(label) ?? {count:0,fac:0,sortKey:sk}
    v.count++; v.fac += r.primerPago; m.set(label, v)
  }
  return Array.from(m.entries())
    .map(([mes,d]) => ({mes,...d}))
    .sort((a,b) => a.sortKey - b.sortKey)
}

// ── UI atoms ──────────────────────────────────────────────────────────────────
function KPI({label,value,sub,color=TX}:{label:string;value:string;sub?:string;color?:string}) {
  return (
    <div style={{flex:1,padding:'18px 20px',borderRadius:12,background:PANEL2,border:`1px solid ${BORDER}`}}>
      <p style={{fontSize:10,fontWeight:700,color:TX_LOW,textTransform:'uppercase',letterSpacing:'0.09em',marginBottom:8}}>{label}</p>
      <p style={{fontSize:24,fontWeight:800,color,lineHeight:1,fontVariantNumeric:'tabular-nums'}}>{value}</p>
      {sub && <p style={{fontSize:11,color:TX_MID,marginTop:6}}>{sub}</p>}
    </div>
  )
}

function Panel({title,sub,children}:{title:string;sub?:string;children:React.ReactNode}) {
  return (
    <div style={{padding:'20px 24px',borderRadius:14,background:PANEL,border:`1px solid ${BORDER}`}}>
      <p style={{fontSize:15,fontWeight:800,color:TX,marginBottom:sub?3:16}}>{title}</p>
      {sub && <p style={{fontSize:12,color:TX_MID,marginBottom:16}}>{sub}</p>}
      {children}
    </div>
  )
}

function Chip({label,color,capitalize=false}:{label:string;color:string;capitalize?:boolean}) {
  return (
    <span style={{
      fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:6,
      textTransform:capitalize?'capitalize':'none',
      color,background:`${color}1A`,
    }}>{label}</span>
  )
}

function TTMes({active,payload,label}:any) {
  if(!active||!payload?.length) return null
  return (
    <div style={TT_STYLE}>
      <p style={{fontWeight:800,color:ACCENT,marginBottom:8}}>{label}</p>
      {payload.map((p:any)=>(
        <div key={p.name} style={{display:'flex',justifyContent:'space-between',gap:28,marginBottom:4}}>
          <span style={{color:p.color??TX_MID}}>{p.name}</span>
          <span style={{fontWeight:700,color:TX,fontVariantNumeric:'tabular-nums'}}>
            {p.name==='Activaciones' ? p.value : formatMXN(p.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

function TTBar({active,payload,label,colorMap}:any) {
  if(!active||!payload?.length) return null
  const d = payload[0]?.payload
  const color = colorMap?.[label] ?? ACCENT
  return (
    <div style={TT_STYLE}>
      <p style={{fontWeight:800,color,marginBottom:8}}>{label}</p>
      <div style={{display:'flex',justifyContent:'space-between',gap:28,marginBottom:4}}>
        <span style={{color:TX_MID}}>Activaciones</span><span style={{fontWeight:700,color:TX}}>{d?.count}</span>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',gap:28}}>
        <span style={{color:TX_MID}}>Facturación</span><span style={{fontWeight:700,color:'#22C55E'}}>{formatMXN(d?.fac??0)}</span>
      </div>
    </div>
  )
}

// ── Select de filtro ──────────────────────────────────────────────────────────
function FilterSelect({
  label, value, onChange, options,
}: {
  label: string; value: string; onChange:(v:string)=>void; options:{value:string;label:string}[]
}) {
  const active = value !== 'todos'
  return (
    <div style={{display:'flex',flexDirection:'column',gap:4,minWidth:140}}>
      <label style={{fontSize:10,fontWeight:700,color:TX_LOW,textTransform:'uppercase',letterSpacing:'0.08em'}}>
        {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          padding:'7px 10px', borderRadius:8, fontSize:12, fontWeight:600,
          background: active ? `${ACCENT}18` : '#F0F7FF',
          color: active ? ACCENT : TX_MID,
          border: `1px solid ${active ? ACCENT : BORDER}`,
          cursor:'pointer', outline:'none', appearance:'none',
          backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%230057FF' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
          backgroundRepeat:'no-repeat', backgroundPosition:'right 8px center',
          paddingRight:28,
        }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value} style={{background:'#ffffff',color:'#0F172A'}}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function ActivacionesCharts({registros,anos}:{registros:RegistroItem[];anos:number[]}) {

  const [selAno,   setSelAno]   = useState<number|'todos'>('todos')
  const [selEjec,  setSelEjec]  = useState('todos')
  const [selVnd,   setSelVnd]   = useState('todos')
  const [selTam,   setSelTam]   = useState('todos')
  const [selGiro,  setSelGiro]  = useState('todos')
  const [selMes,   setSelMes]   = useState('todos')

  // Opciones únicas para los selects
  const optsEjec = useMemo(() =>
    [{value:'todos',label:'Todos los ejecutivos'},
     ...Array.from(new Set(registros.map(r=>r.ejecutivo))).sort().map(v=>({value:v,label:v}))], [registros])
  const optsVnd = useMemo(() =>
    [{value:'todos',label:'Todos los vendedores'},
     ...Array.from(new Set(registros.map(r=>r.vendedor))).sort().map(v=>({value:v,label:v}))], [registros])
  const optsTam = useMemo(() =>
    [{value:'todos',label:'Todos los tamaños'},
     ...Array.from(new Set(registros.map(r=>r.tamano).filter(t=>t!=='N/A'))).sort().map(v=>({value:v,label:v.charAt(0).toUpperCase()+v.slice(1)}))], [registros])
  const optsGiro = useMemo(() =>
    [{value:'todos',label:'Todos los giros'},
     ...Array.from(new Set(registros.map(r=>r.giro).filter(g=>g!=='N/A'))).sort().map(v=>({value:v,label:v}))], [registros])
  const optsMes = useMemo(() => {
    const meses = Array.from(new Set(registros.map(r=>r.mes))).filter(Boolean)
      .sort((a,b)=>(MES_NUM[a]??0)-(MES_NUM[b]??0))
    return [{value:'todos',label:'Todos los meses'}, ...meses.map(m=>({value:m,label:MES_ES[m]??m}))]
  }, [registros])

  // Filtrado combinado
  const filtered = useMemo(() => registros.filter(r => {
    if (selAno  !== 'todos' && r.ano      !== selAno)  return false
    if (selEjec !== 'todos' && r.ejecutivo !== selEjec) return false
    if (selVnd  !== 'todos' && r.vendedor  !== selVnd)  return false
    if (selTam  !== 'todos' && r.tamano    !== selTam)  return false
    if (selGiro !== 'todos' && r.giro      !== selGiro) return false
    if (selMes  !== 'todos' && r.mes       !== selMes)  return false
    return true
  }), [registros,selAno,selEjec,selVnd,selTam,selGiro,selMes])

  const total    = filtered.length
  const totalFac = filtered.reduce((s,r)=>s+r.primerPago,0)
  const promedio = total>0 ? totalFac/total : 0
  const sinVnd   = filtered.filter(r=>r.vendedor==='Sin vendedor').length
  const pctSin   = total>0 ? (sinVnd/total)*100 : 0

  const porMes      = useMemo(()=>agruparMes(filtered,selAno!=='todos'),[filtered,selAno])
  const porVendedor = useMemo(()=>agrupar(filtered,'vendedor',VENDEDOR_COLOR).slice(0,12),[filtered])
  const porEjec     = useMemo(()=>agrupar(filtered,'ejecutivo',EJECUTIVO_COLOR),[filtered])
  const porTamano   = useMemo(()=>agrupar(filtered,'tamano',TAMANO_COLOR).filter(d=>d.name!=='N/A'),[filtered])
  const porGiro     = useMemo(()=>agrupar(filtered,'giro',GIRO_COLOR).filter(d=>d.name!=='N/A').slice(0,10),[filtered])
  const porTipo     = useMemo(()=>agrupar(filtered,'tipo',TIPO_COLOR).filter(d=>d.name!=='N/A'),[filtered])
  const recientes   = useMemo(()=>[...filtered].sort((a,b)=>{
    const ka=a.ano*100+(MES_NUM[a.mes]??0), kb=b.ano*100+(MES_NUM[b.mes]??0)
    return kb-ka
  }).slice(0,20),[filtered])

  const maxFacMes = Math.max(...porMes.map(m=>m.fac),1)
  const activeFilters = [selEjec,selVnd,selTam,selGiro,selMes].filter(f=>f!=='todos').length + (selAno!=='todos'?1:0)

  const resetAll = () => { setSelAno('todos'); setSelEjec('todos'); setSelVnd('todos'); setSelTam('todos'); setSelGiro('todos'); setSelMes('todos') }

  return (
    <div style={{display:'flex',flexDirection:'column',gap:24}}>

      {/* ── Barra de filtros ─────────────────────────────────────────────── */}
      <div style={{
        padding:'18px 20px', borderRadius:14,
        background:'rgba(0,180,255,0.05)', border:`1px solid ${BORDER}`,
      }}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <p style={{fontSize:13,fontWeight:800,color:TX}}>Filtros</p>
            {activeFilters > 0 && (
              <span style={{
                fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:20,
                background:`${ACCENT}22`,color:ACCENT,
              }}>{activeFilters} activo{activeFilters>1?'s':''}</span>
            )}
          </div>
          {activeFilters > 0 && (
            <button onClick={resetAll} style={{
              fontSize:11,fontWeight:700,color:TX_LOW,background:'transparent',
              border:`1px solid ${BORDER}`,borderRadius:6,padding:'4px 12px',cursor:'pointer',
            }}>
              Limpiar todo
            </button>
          )}
        </div>

        {/* Fila 1: Año (tabs) */}
        <div style={{display:'flex',gap:6,alignItems:'center',marginBottom:16}}>
          <span style={{fontSize:10,fontWeight:700,color:TX_LOW,textTransform:'uppercase',letterSpacing:'0.08em',width:60}}>Año</span>
          {(['todos',...anos] as (number|'todos')[]).map(a=>(
            <button key={String(a)} onClick={()=>setSelAno(a)} style={{
              padding:'5px 14px',borderRadius:8,fontSize:12,fontWeight:700,
              cursor:'pointer',transition:'all 150ms',
              background: selAno===a ? ACCENT : '#EFF6FF',
              color:      selAno===a ? BG     : TX_MID,
              border:     selAno===a ? 'none' : `1px solid ${BORDER}`,
            }}>{a==='todos'?'Todos':a}</button>
          ))}
        </div>

        {/* Fila 2: Selects */}
        <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
          <FilterSelect label="Mes"       value={selMes}  onChange={setSelMes}  options={optsMes}  />
          <FilterSelect label="Ejecutivo" value={selEjec} onChange={setSelEjec} options={optsEjec} />
          <FilterSelect label="Vendedor"  value={selVnd}  onChange={setSelVnd}  options={optsVnd}  />
          <FilterSelect label="Tamaño"    value={selTam}  onChange={setSelTam}  options={optsTam}  />
          <FilterSelect label="Giro"      value={selGiro} onChange={setSelGiro} options={optsGiro} />
        </div>

        {/* Resultado del filtro */}
        {activeFilters > 0 && (
          <p style={{fontSize:12,color:TX_MID,marginTop:14}}>
            Mostrando <strong style={{color:TX}}>{total.toLocaleString('es-MX')}</strong> activaciones
            {' '}· <strong style={{color:'#22C55E'}}>{formatMXN(totalFac)}</strong> en facturación
          </p>
        )}
      </div>

      {/* ── KPIs ─────────────────────────────────────────────────────────── */}
      <div style={{display:'flex',gap:16}}>
        <KPI label="Total Activaciones"  value={total.toLocaleString('es-MX')} color={ACCENT} />
        <KPI label="Facturación Total"   value={formatMXN(totalFac)} color="#22C55E" sub="Suma primer pago" />
        <KPI label="Promedio 1er Pago"   value={formatMXN(promedio)} color="#F59E0B" />
        <KPI label="Sin Vendedor" value={`${pctSin.toFixed(1)}%`}
          color={pctSin>30?'#EF4444':TX_LOW} sub={`${sinVnd} de ${total}`} />
        {/* Tipos */}
        <div style={{flex:1.2,padding:'18px 20px',borderRadius:12,background:PANEL2,border:`1px solid ${BORDER}`}}>
          <p style={{fontSize:10,fontWeight:700,color:TX_LOW,textTransform:'uppercase',letterSpacing:'0.09em',marginBottom:10}}>Tipo</p>
          <div style={{display:'flex',flexDirection:'column',gap:7}}>
            {porTipo.map(t=>{
              const pct = total>0 ? (t.count/total)*100 : 0
              return (
                <div key={t.name} style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{width:8,height:8,borderRadius:'50%',background:t.color,flexShrink:0}}/>
                  <span style={{fontSize:12,color:TX_MID,flex:1,textTransform:'capitalize'}}>{t.name}</span>
                  <span style={{fontSize:12,fontWeight:700,color:TX,fontVariantNumeric:'tabular-nums'}}>{t.count}</span>
                  <span style={{fontSize:11,color:TX_LOW,width:32,textAlign:'right'}}>{pct.toFixed(0)}%</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Activaciones por Mes ─────────────────────────────────────────── */}
      <Panel title="Activaciones por Mes" sub="Nuevas cuentas y facturación acumulada por período">
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={porMes} margin={{top:4,right:20,left:-10,bottom:0}}>
            <CartesianGrid vertical={false} stroke="#DBEAFE" />
            <XAxis dataKey="mes" tick={{fill:TX_MID,fontSize:11,fontWeight:600}} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={{fill:TX_LOW,fontSize:10}} axisLine={false} tickLine={false} />
            <YAxis yAxisId="right" orientation="right" domain={[0,maxFacMes*1.1]}
              tickFormatter={v=>`$${(v/1000).toFixed(0)}k`}
              tick={{fill:'rgba(34,197,94,0.55)',fontSize:10}} axisLine={false} tickLine={false} />
            <Tooltip content={<TTMes />} cursor={{fill:'rgba(0,180,255,0.06)'}} />
            <Legend wrapperStyle={{fontSize:11,paddingTop:10}} formatter={(v)=><span style={{color:TX_MID}}>{v}</span>} />
            <Bar yAxisId="left" dataKey="count" name="Activaciones" fill={ACCENT} fillOpacity={0.85} radius={[4,4,0,0]} maxBarSize={38} />
            <Line yAxisId="right" type="monotone" dataKey="fac" name="Facturación" stroke="#22C55E" strokeWidth={2.5}
              dot={{fill:'#22C55E',r:4,strokeWidth:2,stroke:BG}} activeDot={{r:6,stroke:'#22C55E',strokeWidth:2,fill:BG}} />
          </ComposedChart>
        </ResponsiveContainer>
      </Panel>

      {/* ── Vendedor + Ejecutivo ─────────────────────────────────────────── */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
        <Panel title="Por Vendedor" sub="Comercial que cerró la venta">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={porVendedor} layout="vertical" margin={{top:0,right:60,left:10,bottom:0}}>
              <CartesianGrid horizontal={false} stroke="#DBEAFE" />
              <XAxis type="number" tick={{fill:TX_LOW,fontSize:10}} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{fill:TX_MID,fontSize:12,fontWeight:600}} axisLine={false} tickLine={false} width={100} />
              <Tooltip content={(p:any)=><TTBar {...p} label={p.label} colorMap={VENDEDOR_COLOR} />} cursor={{fill:'rgba(0,180,255,0.06)'}} />
              <Bar dataKey="count" radius={[0,4,4,0]} maxBarSize={20}>
                {porVendedor.map(d=><Cell key={d.name} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Por Ejecutivo" sub="Responsable de la activación">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={porEjec} layout="vertical" margin={{top:0,right:60,left:10,bottom:0}}>
              <CartesianGrid horizontal={false} stroke="#DBEAFE" />
              <XAxis type="number" tick={{fill:TX_LOW,fontSize:10}} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{fill:TX_MID,fontSize:12,fontWeight:600}} axisLine={false} tickLine={false} width={100} />
              <Tooltip content={(p:any)=><TTBar {...p} label={p.label} colorMap={EJECUTIVO_COLOR} />} cursor={{fill:'rgba(0,180,255,0.06)'}} />
              <Bar dataKey="count" radius={[0,4,4,0]} maxBarSize={20}>
                {porEjec.map(d=><Cell key={d.name} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      {/* ── Tamaño + Giro ────────────────────────────────────────────────── */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1.4fr',gap:20}}>
        <Panel title="Por Tamaño de Cuenta" sub="Segmento comercial del cliente">
          <div style={{display:'flex',gap:16,alignItems:'center'}}>
            <PieChart width={160} height={160}>
              <Pie data={porTamano} dataKey="count" nameKey="name"
                cx="50%" cy="50%" innerRadius={46} outerRadius={74} paddingAngle={3}>
                {porTamano.map(d=><Cell key={d.name} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={TT_STYLE} itemStyle={{color:TX}} formatter={(v:any,n:string)=>[v,n]} />
            </PieChart>
            <div style={{flex:1,display:'flex',flexDirection:'column',gap:9}}>
              {porTamano.map(d=>{
                const pct=total>0?Math.round((d.count/total)*100):0
                return (
                  <div key={d.name} style={{display:'flex',alignItems:'center',gap:8}}>
                    <span style={{width:9,height:9,borderRadius:'50%',background:d.color,flexShrink:0}}/>
                    <span style={{fontSize:12,color:TX_MID,flex:1,textTransform:'capitalize'}}>{d.name}</span>
                    <span style={{fontSize:12,fontWeight:700,color:TX,fontVariantNumeric:'tabular-nums'}}>{d.count}</span>
                    <span style={{fontSize:11,color:TX_LOW,width:32,textAlign:'right'}}>{pct}%</span>
                  </div>
                )
              })}
            </div>
          </div>
        </Panel>

        <Panel title="Por Giro / Industria" sub="Top 10 sectores por número de activaciones">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={porGiro} layout="vertical" margin={{top:0,right:50,left:10,bottom:0}}>
              <CartesianGrid horizontal={false} stroke="#DBEAFE" />
              <XAxis type="number" tick={{fill:TX_LOW,fontSize:10}} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{fill:TX_MID,fontSize:12}} axisLine={false} tickLine={false} width={100} />
              <Tooltip content={(p:any)=><TTBar {...p} label={p.label} colorMap={GIRO_COLOR} />} cursor={{fill:'rgba(0,180,255,0.06)'}} />
              <Bar dataKey="count" radius={[0,4,4,0]} maxBarSize={18}>
                {porGiro.map(d=><Cell key={d.name} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      {/* ── Tabla recientes ───────────────────────────────────────────────── */}
      <Panel title="Últimas 20 Activaciones" sub="Ordenadas por período más reciente según los filtros aplicados">
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
            <thead>
              <tr>
                {['ID','Cliente','Mes / Año','Vendedor','Ejecutivo','Tamaño','Tipo','1er Pago'].map(h=>(
                  <th key={h} style={{
                    textAlign:'left',padding:'8px 12px',
                    color:TX_LOW,fontWeight:700,fontSize:10,
                    textTransform:'uppercase',letterSpacing:'0.07em',
                    borderBottom:`1px solid ${BORDER}`,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recientes.map((r,i)=>(
                <tr key={r.id} style={{background:i%2===0?'transparent':'#F0F7FF'}}>
                  <td style={{padding:'8px 12px',color:TX_LOW,fontSize:11,fontVariantNumeric:'tabular-nums'}}>{r.id}</td>
                  <td style={{padding:'8px 12px',color:TX,fontWeight:600}}>{r.cliente}</td>
                  <td style={{padding:'8px 12px',color:TX_MID,fontVariantNumeric:'tabular-nums'}}>{MES_ES[r.mes]??r.mes} {r.ano}</td>
                  <td style={{padding:'8px 12px'}}><Chip label={r.vendedor}  color={VENDEDOR_COLOR[r.vendedor]??'#64748B'} /></td>
                  <td style={{padding:'8px 12px'}}><Chip label={r.ejecutivo} color={EJECUTIVO_COLOR[r.ejecutivo]??'#64748B'} /></td>
                  <td style={{padding:'8px 12px'}}><Chip label={r.tamano}    color={TAMANO_COLOR[r.tamano]??'#64748B'} capitalize /></td>
                  <td style={{padding:'8px 12px'}}><Chip label={r.tipo}      color={TIPO_COLOR[r.tipo]??'#64748B'} capitalize /></td>
                  <td style={{padding:'8px 12px',color:r.primerPago>0?'#22C55E':TX_LOW,fontWeight:700,fontVariantNumeric:'tabular-nums'}}>
                    {r.primerPago>0?formatMXN(r.primerPago):'—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}
