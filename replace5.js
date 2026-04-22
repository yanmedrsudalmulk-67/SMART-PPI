const fs = require('fs');

const files = [
  'app/dashboard/input/penempatan-pasien/page.tsx',
  'app/dashboard/input/pengelolaan-limbah-medis/page.tsx',
  'app/dashboard/input/pengelolaan-limbah-tajam/page.tsx',
  'app/dashboard/input/pengendalian-lingkungan/page.tsx',
  'app/dashboard/input/penyuntikan-aman/page.tsx'
];

for (const filePath of files) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix images state type
  content = content.replace(/useState<string\[\]>\(\[\]\);/g, "useState<DocImage[]>([]);");
  content = content.replace(/useState<{url: string, file: File}\[\]>\(\[\]\);/g, "useState<DocImage[]>([]);");
  content = content.replace(/useState<{ url: string; file: File }\[\]>\(\[\]\);/g, "useState<DocImage[]>([]);");
  content = content.replace(/useState<any\[\]>\(\[\]\);/g, "useState<DocImage[]>([]);");

  // Strip `handleFileUpload` function completely!
  content = content.replace(/const handleFileUpload =.*?setImages\(newImages\);\s*\};\s*const removeImage = .*?\};\s/s, '');

  // Strip duplicate upload inside `handleSubmit`
  const uploadBlock = /let finalDokumentasiUrls: string\[\] = \[\];\s*\/\/\s*Upload Gambar(?:[\s\S]*?)(?=const ttdPj|const ttd_pj|const payload)/;
  if (uploadBlock.test(content)) {
    content = content.replace(uploadBlock, '');
  }

  const uploadBlock2 = /let finalDokumentasiUrls: string\[\] = \[\];\s*if \(fileInputRef(?:[\s\S]*?)(?=const ttd|const payload)/;
  if(uploadBlock2.test(content)){
    content = content.replace(uploadBlock2, '');
  }

  // Find the documentation block
  const docsBlock = /<h2[^>]*>\s*<Camera[^>]*\/> Dokumentasi(?:.*?)\s*<\/h2>[\s\S]*?<\/AnimatePresence>\s*<\/div>\s*\)\}\s*<\/div>/;
  if (docsBlock.test(content)) {
    content = content.replace(docsBlock, '<DocumentationUploader images={images} setImages={setImages} />');
  } else {
    // If not found, fall back to matching till</div>
    const docsBlock2 = /<h2[^>]*>\s*<Camera[^>]*\/> Dokumentasi(?:.*?)\s*<\/h2>[\s\S]*?<\/AnimatePresence>\s*<\/div>\s*<\/div>/;
    if (docsBlock2.test(content)) {
      content = content.replace(docsBlock2, '<DocumentationUploader images={images} setImages={setImages} />');
    } else {
        const docsBlock3 = /<h2[^>]*>\s*<Camera[^>]*\/> Dokumentasi(?:.*?)\s*<\/h2>[\s\S]*?<\/div>\s*\)\}\s*<\/div>/;
        if(docsBlock3.test(content)){
           content = content.replace(docsBlock3, '<DocumentationUploader images={images} setImages={setImages} />');
        }
    }
  }

  // remove finalDokumentasiUrls.join(',') from payload
  content = content.replace(/dokumentasi:\s*finalDokumentasiUrls\.join\([^\)]*\),\s*/g, '');


  fs.writeFileSync(filePath, content, 'utf8');
}
