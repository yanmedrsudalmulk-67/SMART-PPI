const fs = require('fs');

const files = [
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

  // Insert a </div> right before the comment
  content = content.replace(/(\{\/\*\s*(?:Temuan|Keterangan|DOKUMENTASI|Tempat sampah))/g, (match) => {
     return "</div>\n      " + match;
  });

  fs.writeFileSync(file, content);
  console.log('Fixed', file);
});
