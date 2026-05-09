const XLSX = require('xlsx');
const wb = XLSX.readFile('C:/Users/manni/OneDrive/Escritorio/Top Customer.xlsx');

// TOP sheet
const top = wb.Sheets['TOP'];
const topRange = XLSX.utils.decode_range(top['!ref'] || 'A1:E200');
let fC=0,dC=0,cC=0;
for(let r=topRange.s.r+1; r<=topRange.e.r; r++){
  const row=r+1;
  const cell=top['A'+row];
  if(!cell) continue;
  const v=String(cell.v||'').trim();
  if(!/^[FDC]\d+$/.test(v)) continue;
  if(v[0]==='F') fC++; else if(v[0]==='D') dC++; else cC++;
}
console.log('TOP: F='+fC+' D='+dC+' C='+cC+' total='+(fC+dC+cC));

// Concentrado sheet
const conc = wb.Sheets['Concentrado'];
const cRange = XLSX.utils.decode_range(conc['!ref'] || 'A1:AJ200');
let cf=0,cd=0,cc=0; const noEmp=[];
for(let r=cRange.s.r+1; r<=cRange.e.r; r++){
  const row=r+1;
  const aCell=conc['A'+row];
  if(!aCell) continue;
  const v=String(aCell.v||'').trim();
  if(!/^[FDC]\d+$/.test(v)) continue;
  const emp=String(conc['C'+row]?.v||'').trim();
  if(!emp) noEmp.push(v);
  if(v[0]==='F') cf++; else if(v[0]==='D') cd++; else cc++;
}
console.log('Concentrado: F='+cf+' D='+cd+' C='+cc+' total='+(cf+cd+cc));
if(noEmp.length) console.log('No empresa in Concentrado:', noEmp.join(', '));

// Max field lengths in Concentrado
const cols={P:'dir_fiscal',U:'num_oficinas',W:'giro',V:'total_empleados',Q:'pagina_web',AD:'observaciones'};
for(const [col,name] of Object.entries(cols)){
  let max=0, maxVal='';
  for(let r=cRange.s.r+1; r<=cRange.e.r; r++){
    const row=r+1;
    const v=String(conc[col+row]?.v||'').trim();
    if(v.length>max){ max=v.length; maxVal=v.slice(0,60); }
  }
  console.log(name+'['+col+']: max='+max+' chars | "'+maxVal+'"');
}

// Check dates in Z column
console.log('\nSample Z (activo_desde) values:');
const seenZ = [];
for(let r=cRange.s.r+1; r<=cRange.e.r; r++){
  const row=r+1;
  const cell=conc['Z'+row];
  if(!cell) continue;
  if(seenZ.length<5) {
    seenZ.push({row, v:cell.v, t:cell.t});
    console.log('  Z'+row+': v='+cell.v+' type='+cell.t);
  }
}
