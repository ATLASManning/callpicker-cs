const XLSX = require('xlsx');
const wb = XLSX.readFile('C:/Users/manni/OneDrive/Escritorio/Top Customer.xlsx');

// Simulate exactly what import.ts does
const top = wb.Sheets['TOP'];
const range = XLSX.utils.decode_range(top['!ref'] || 'A1:E200');
const accountMap = new Map();

// Pass 1: seed from TOP
for(let r=range.s.r+1; r<=range.e.r; r++){
  const row=r+1;
  const cell=top['A'+row];
  if(!cell) continue;
  const v = String(cell.v||'').trim();
  if(!/^[FDC]\d+$/.test(v)) continue;
  accountMap.set(v, { consecutivo: v, source: 'TOP' });
}
console.log('After TOP seed:', accountMap.size);

// Pass 2: iterate Concentrado
const conc = wb.Sheets['Concentrado'];
const cRange = XLSX.utils.decode_range(conc['!ref'] || 'A1:AJ200');
let addedNew=0, updatedExisting=0;

for(let r=cRange.s.r+1; r<=cRange.e.r; r++){
  const row=r+1;
  const cell=conc['A'+row];
  if(!cell) continue;
  const v = String(cell.v||'').trim();
  if(!/^[FDC]\d+$/.test(v)) continue;

  const existing = accountMap.get(v);
  if(existing) {
    accountMap.set(v, { ...existing, fromConc: true });
    updatedExisting++;
  } else {
    accountMap.set(v, { consecutivo: v, source: 'CONC_ONLY' });
    addedNew++;
    if(addedNew <= 5) console.log('  Added new account:', JSON.stringify(v), 'len='+v.length, 'codes:', [...v].map(c=>c.charCodeAt(0)).join(','));
  }
}

console.log('After Concentrado merge:', accountMap.size);
console.log('  Updated existing:', updatedExisting);
console.log('  Added new:', addedNew);

// Check what keys are in the map
const byPrefix = { F:0, D:0, C:0, other:0 };
for(const k of accountMap.keys()){
  const p = k[0];
  if(p==='F') byPrefix.F++;
  else if(p==='D') byPrefix.D++;
  else if(p==='C') byPrefix.C++;
  else byPrefix.other++;
}
console.log('Map distribution:', JSON.stringify(byPrefix));
