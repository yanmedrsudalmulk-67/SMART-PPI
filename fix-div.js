const fs = require('fs');
const files = [
  'app/dashboard/input/monitoring-airborne/page.tsx',
  'app/dashboard/input/monitoring-ambulance/page.tsx',
  'app/dashboard/input/monitoring-cssd/page.tsx',
  'app/dashboard/input/monitoring-gizi/page.tsx',
  'app/dashboard/input/monitoring-isolasi/page.tsx',
  'app/dashboard/input/monitoring-jenazah/page.tsx',
  'app/dashboard/input/monitoring-laboratorium/page.tsx',
  'app/dashboard/input/monitoring-radiologi/page.tsx',
  'app/dashboard/input/monitoring-tunggu/page.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace:
  //         />
  //       </div>
  // 
  //       {/* 
  // With:
  //         />
  // 
  //       {/*
  
  content = content.replace(/\/>\s*<\/div>\s*\{\/\*(?: Temuan| Keterangan| DOKUMENTASI)/g, (match) => {
    return match.replace(/<\/div>\s*/, '');
  });

  fs.writeFileSync(file, content);
  console.log('Fixed', file);
});
