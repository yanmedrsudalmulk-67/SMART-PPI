const fs = require('fs');

const file = 'components/reports/DekontaminasiAlatReport.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  '<table className="w-full min-w-[700px] border-collapse text-left text-sm text-force-black border border-slate-300">',
  '<table className="w-full min-w-[700px] border-collapse text-left text-sm text-force-black bg-force-white border border-slate-300">'
);
content = content.replace(
  'return (\\n    <div className="w-full font-sans bg-force-white text-force-black print:bg-force-white print:text-force-black">',
  'return (\\n    <div className="w-full font-sans bg-force-white text-force-black print:bg-force-white print:text-force-black print:overflow-visible">'
);

fs.writeFileSync(file, content, 'utf8');
