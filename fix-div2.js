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

  // Find the exact broken piece:
  //         />
  //       </div>
  //       </div>
  //       </div>
  // 
  //       {/* Temuan ...
  
  // We want to reduce one `</div>`
  content = content.replace(/(<LiveStatisticsCard[\s\S]*?\/>\s*)(<\/div>\s*)+(\{\/\*(?:\s*Temuan|\s*Keterangan|\s*DOKUMENTASI))/g, (match, p1, p2, p3) => {
     // p2 contains multiple </div>\n. We want to remove one of them.
     const reduced = p2.replace(/<\/div>\s*$/, '');
     return p1 + reduced + p3;
  });

  fs.writeFileSync(file, content);
  console.log('Fixed', file);
});
