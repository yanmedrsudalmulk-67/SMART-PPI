const fs = require('fs');

const files = [
  'app/dashboard/input/dekontaminasi-alat/page.tsx',
  'app/dashboard/input/penatalaksanaan-linen/page.tsx',
  'app/dashboard/input/pengelolaan-limbah-medis/page.tsx',
  'app/dashboard/input/pengelolaan-limbah-tajam/page.tsx',
  'app/dashboard/input/pengendalian-lingkungan/page.tsx',
  'app/dashboard/input/penyuntikan-aman/page.tsx'
];

for (const filePath of files) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Let's replace anything from <h2 className="..."><Camera/> Dokumentasi</h2> 
  // or <label className="..."><Camera/> Foto Dokumentasi</label>
  // to the </AnimatePresence></div></div>
  let r = /<label className="[^"]*">\s*<Camera[^>]*\/> Foto Dokumentasi\s*<\/label>.*?<\/AnimatePresence>\s*<\/div>\s*<\/div>/s;
  if(r.test(content)) {
     content = content.replace(r, '<DocumentationUploader images={images} setImages={setImages} />');
     console.log("Matched 1 in " + filePath);
  }

  let r2 = /<h2 className="[^"]*">\s*<Camera[^>]*\/> Dokumentasi\s*<\/h2>.*?<\/AnimatePresence>\s*<\/div>\s*<\/div>/s;
  if(r2.test(content)) {
     content = content.replace(r2, '<DocumentationUploader images={images} setImages={setImages} />');
     console.log("Matched 2 in " + filePath);
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
}
