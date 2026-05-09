const XLSX = require('xlsx');
const wb = XLSX.readFile('C:/Users/manni/OneDrive/Escritorio/Top Customer.xlsx');

// Print ALL TOP A-column values raw
const top = wb.Sheets['TOP'];
const range = XLSX.utils.decode_range(top['!ref'] || 'A1:E200');
const topKeys = [];
for(let r=range.s.r+1; r<=range.e.r; r++){
  const row=r+1;
  const cell=top['A'+row];
  if(!cell) continue;
  const v = String(cell.v||'').trim();
  if(/^[FDC]\d+$/.test(v)) topKeys.push(v);
}
console.log('TOP keys (' + topKeys.length + '):', topKeys.join(', '));

// Print just D and C keys
const dKeys = topKeys.filter(k => k.startsWith('D'));
const cKeys = topKeys.filter(k => k.startsWith('C'));
console.log('D keys in TOP (' + dKeys.length + '):', dKeys.join(', '));
console.log('C keys in TOP (' + cKeys.length + '):', cKeys.join(', '));

// Print Concentrado D and C keys
const conc = wb.Sheets['Concentrado'];
const cRange = XLSX.utils.decode_range(conc['!ref'] || 'A1:AJ200');
const concDKeys = [], concCKeys = [];
for(let r=cRange.s.r+1; r<=cRange.e.r; r++){
  const row=r+1;
  const cell=conc['A'+row];
  if(!cell) continue;
  const v = String(cell.v||'').trim();
  if(/^D\d+$/.test(v)) concDKeys.push(v);
  if(/^C\d+$/.test(v)) concCKeys.push(v);
}
console.log('D keys in Conc (' + concDKeys.length + '):', concDKeys.join(', '));
console.log('C keys in Conc (first 20):', concCKeys.slice(0,20).join(', '));

// What D keys are only in Concentrado?
const topSet = new Set(topKeys);
const onlyInConc = [...concDKeys, ...concCKeys].filter(k => !topSet.has(k));
console.log('\nOnly in Conc (' + onlyInConc.length + '):', onlyInConc.join(', '));
