const fs = require('fs');

const file = 'components/reports/DekontaminasiAlatReport.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/bg-white text-black print:bg-white print:text-black/g, 'bg-force-white text-force-black print:bg-white print:text-black');
content = content.replace(/border-black/g, 'border-slate-300');
content = content.replace(/text-black/g, 'text-force-black');
content = content.replace(/bg-white/g, 'bg-force-white');
content = content.replace(/bg-gray-100/g, 'bg-force-white');

fs.writeFileSync(file, content, 'utf8');
