const fs = require('fs');

const files = [
  'app/dashboard/input/dekontaminasi-alat/page.tsx',
  'app/dashboard/input/etika-batuk/page.tsx',
  'app/dashboard/input/monitoring-fasilitas_hh/page.tsx',
  'app/dashboard/input/penatalaksanaan-linen/page.tsx',
  'app/dashboard/input/pengelolaan-limbah-medis/page.tsx',
  'app/dashboard/input/pengelolaan-limbah-tajam/page.tsx',
  'app/dashboard/input/pengendalian-lingkungan/page.tsx',
  'app/dashboard/input/penyuntikan-aman/page.tsx'
];

for (const filePath of files) {
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf8');

  // Replace from <div className="glass-card... containing SECTION: DOKUMENTASI or DOKUMENTASI
  // to the SECTION: TANDA TANGAN or TANDA TANGAN
  const regex = /(\{\/\*\s*(?:SECTION:\s*)?DOKUMENTASI(?:.*?)\s*\*\/\}\s*)<div className="glass-card[^>]*>.*?(\{\/\*\s*(?:SECTION:\s*)?TANDA TANGAN\s*\*\/\})/s;
  
  if (regex.test(content)) {
    content = content.replace(regex, `$1<div className="glass-card p-6 sm:p-8 rounded-[2.5rem] border-white/5 space-y-6 flex flex-col items-center">
          <DocumentationUploader images={images} setImages={setImages} />
        </div>

        $2`);
    console.log('Replaced markup in ' + filePath);
  } else {
    console.log('Regex 1 failed for ' + filePath);
  }

  fs.writeFileSync(filePath, content, 'utf8');
}
