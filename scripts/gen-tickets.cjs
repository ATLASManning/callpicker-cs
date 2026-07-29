/* eslint-disable */
const XLSX = require('xlsx')
const fs   = require('fs')

const wb  = XLSX.readFile('D:/Archivos/Tickets.xlsx')
const raw = XLSX.utils.sheet_to_json(wb.Sheets['Desglose Tickets'])

const ALIAS = {
  'Mario Hernández':'Mario H.','Paola Bárcenas':'Paola B.','Pablo Soto':'Pablo S',
  'Cecilia Ramírez':'Cecilia R.','Alexis González':'Alexis G.',
  'Enrique Gudiño':'Enrique G.','Ricardo Becerril':'Ricardo B.',
  'José Antonio del Río':'José Antonio R.','Edith Balderas':'Edith B.',
  'Claudia Hernández':'Claudia H.','Antonio Villaseñor':'Antonio V.',
  'Néstor Cortéz':'Néstor C.','Roberto .':'Roberto R.',
  'Paola':'Paola B.','Alma':'Alma I.','Alexis':'Alexis G.',
}
const parseHrs = s => {
  if (!s) return 0
  const h = s.match(/(\d+)\s*hora/), m = s.match(/(\d+)\s*min/)
  return Math.round(((h ? +h[1] : 0) + (m ? +m[1]/60 : 0))*10)/10
}
const normPrior = p => {
  if (!p) return 'Low'
  const l = p.toLowerCase()
  if (l==='urgent') return 'Urgent'
  if (l==='high')   return 'High'
  if (l==='medium') return 'Medium'
  return 'Low'
}
const normCat  = c => (c||'Sin categoría').replace('Sin categoria','Sin categoría')
const normProp = p => ALIAS[p] || p || 'Sin propietario'

const tickets = raw.map(r => {
  const apertura = r['FECHA DE APERTURA'] || ''
  const mes = apertura ? new Date(apertura).toISOString().slice(0,7) : ''
  return {
    cid:         String(r['CID']||''),
    num:         String(r['NUMERO TICKET']||''),
    empresa:     String(r['NOMBRE EMPRESA']||''),
    fecha:       mes,
    ticket_id:   String(r['TICKET_ID']||''),
    categoria:   normCat(r['CATEGORIA']),
    subcategoria:r['SUBCATEGORIA']||'Sin subcategoría',
    es_falla:    r['ES FALLA']==='Si' ? 'Si' : 'No',
    producto:    r['PRODUCTO']||'Sin producto',
    enlace:      r['ENLACE AL TICKET']||'',
    propietario: normProp(r['PROPIETARIO']),
    apertura,
    cierre:      r['FECHA DE CIERRE']||'',
    duracion:    r['DURACION TICKET ABIERTO']||'',
    duracion_hrs:parseHrs(r['DURACION TICKET ABIERTO']),
    prioridad:   normPrior(r['PRIORIDAD']),
    mes,
  }
}).filter(r => r.mes >= '2026-03')

fs.writeFileSync('./lib/tickets-data.json', JSON.stringify(tickets))
console.log('Guardado:', tickets.length, 'tickets en lib/tickets-data.json')
