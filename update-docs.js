const fs = require('fs');
const path = require('path');

const inputDir = path.join(__dirname, 'app', 'dashboard', 'input');
const filesToUpdate = [
  'etika-batuk/page.tsx',
  'penyuntikan-aman/page.tsx',
  'pengelolaan-limbah-tajam/page.tsx',
  'bundles/[bundleId]/page.tsx',
  'penatalaksanaan-linen/page.tsx',
  'monitoring-fasilitas_hh/page.tsx',
  'penempatan-pasien/page.tsx',
  'pengendalian-lingkungan/page.tsx',
  'pengelolaan-limbah-medis/page.tsx',
  'dekontaminasi-alat/page.tsx',
  'diklat/page.tsx',
  'monitoring-ruang_isolasi/page.tsx',
  'monitoring-fasilitas_apd/page.tsx',
  'monitoring-ibs/page.tsx'
];

for (const relPath of filesToUpdate) {
  const filePath = path.join(inputDir, relPath);
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Add imports
  if (!content.includes('DocumentationUploader')) {
    content = content.replace(
      "import { getSupabase } from '@/lib/supabase';", 
      "import { getSupabase } from '@/lib/supabase';\nimport { uploadImagesToSupabase } from '@/lib/upload';\nimport { DocumentationUploader, DocImage } from '@/components/DocumentationUploader';"
    );
  }

  // 2. Fix images state type
  content = content.replace(
    /const \[images, setImages\] = useState<\{ url: string; file: File \}\[\]>\(\[\]\);/g,
    "const [images, setImages] = useState<DocImage[]>([]);"
  );
  content = content.replace(
    /const \[images, setImages\] = useState<\{url: string, file: File\}\[\]>\(\[\]\);/g,
    "const [images, setImages] = useState<DocImage[]>([]);"
  );
  content = content.replace(
    /const \[images, setImages\] = useState<any\[\]>\(\[\]\);/g,
    "const [images, setImages] = useState<DocImage[]>([]);"
  );

  // Remove `compressImage`, `handleFileUpload`, `removeImage`
  content = content.replace(/const compressImage = async.*?\n\s+\};\n\s+\};\n\s+\}\);\n\s+\};\n/s, '');
  content = content.replace(/const handleFileUpload = async.*?\n\s+setImages\(prev => \[\.\.\.prev, \.\.\.newImages\]\);\n\s+\};\n/s, '');
  content = content.replace(/const removeImage = .*?\n\s+return updated;\n\s+\}\);\n\s+\};\n/s, '');

  
  // 3. Update the JSX for Documentation
  // Find the `{/* DOKUMENTASI */}` comment, and replace the whole `div.glass-card` under it.
  const regex = /(\{\/\*\s*DOKUMENTASI\s*\*\/\}\s*)<div className="glass-card[^>]*>.*?(\{\/\*\s*TANDA TANGAN\s*\*\/\})/s;
  if(regex.test(content)) {
     content = content.replace(regex, `$1<div className="glass-card p-6 sm:p-8 rounded-[2.5rem] border-white/5 space-y-6 flex flex-col items-center">
          <DocumentationUploader images={images} setImages={setImages} />
        </div>

        $2`);
  }

  // Also replace `payload` logic
  if (!content.includes('uploadedUrls = await uploadImagesToSupabase')) {
    content = content.replace(
      /const payload = \{/g,
      "const uploadedUrls = await uploadImagesToSupabase(supabase, images, 'dokumentasi', 'audit');\n      const payload = {"
    );
    // add dokumentasi: uploadedUrls to the payload 
    // it usually ends with `created_at: new Date().toISOString() \n }`
    content = content.replace(
      /created_at: new Date\(\)\.toISOString\(\)\s*\};/g,
      "created_at: new Date().toISOString(),\n        dokumentasi: uploadedUrls\n      };"
    );
     // and for those without created_at like dekontaminasi-alat
    content = content.replace(
      /ttd_ipcn: ttdIpcn,\s*\/\/ we can store the upload doc url or just the fact that it exists\s*dokumentasi:.*?\n\s*\};/gs,
      "ttd_ipcn: ttdIpcn,\n        dokumentasi: uploadedUrls\n      };"
    );
     // and for diklat which doesn't have created_at
     content = content.replace(
       /tempat: location\s*\};/gs,
       "tempat: location,\n        dokumentasi: uploadedUrls\n      };"
     );
  }

  // some files use `ttd_ipcn: ttd_ipcn \n }`
  content = content.replace(
    /ttd_ipcn,\s*kategori:.*?\s*\};/gs,
    "ttd_ipcn,\n        kategori: 'ibs',\n        dokumentasi: uploadedUrls\n      };"
  );
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated DOM in ' + relPath);
}
