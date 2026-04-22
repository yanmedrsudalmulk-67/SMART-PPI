const fs = require('fs');
const path = require('path');

const filesToClean = [
  'app/dashboard/input/penempatan-pasien/page.tsx',
  'app/dashboard/input/pengelolaan-limbah-medis/page.tsx',
  'app/dashboard/input/pengelolaan-limbah-tajam/page.tsx',
  'app/dashboard/input/pengendalian-lingkungan/page.tsx',
  'app/dashboard/input/penyuntikan-aman/page.tsx',
  'app/dashboard/input/penatalaksanaan-linen/page.tsx'
];

for (const filePath of filesToClean) {
    if (!fs.existsSync(filePath)) continue;
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Ensure DocImage import
    if (!content.includes('import { DocumentationUploader, DocImage }')) {
        if (content.includes('DocumentationUploader')) {
             content = content.replace(/import \{.*?\} from .*?DocumentationUploader.*/g, "import { DocumentationUploader, DocImage } from '@/components/DocumentationUploader';");
        } else {
             content = content.replace(/import .*? from .*?supabase.*/g, "$&\nimport { DocumentationUploader, DocImage } from '@/components/DocumentationUploader';");
        }
    }

    // 2. Fix images state type
    content = content.replace(/useState<string\[\]>\(\[\]\)/g, "useState<DocImage[]>([]);");
    content = content.replace(/useState<any\[\]>\(\[\]\)/g, "useState<DocImage[]>([]);");
    content = content.replace(/useState<\{.*?\}\[\]>\(\[\]\)/g, "useState<DocImage[]>([]);");

    // 3. Strip all old image functions
    content = content.replace(/const getBase64 = [\s\S]*?reader\.readAsDataURL\(file\);\s*\}\);?\s*\};/g, '');
    content = content.replace(/const compressAndUploadImage = [\s\S]*?reader\.readAsDataURL\(file\);\s*\}\);?\s*\};/g, '');
    content = content.replace(/const handleImageUpload =[\s\S]*?setImages\(prev => \[\.\.\.prev, \.\.\.newImages\]\);\s*\}[\s\S]*?finally \{[\s\S]*?\}?\s*\};/gs, '');
    content = content.replace(/const handleFileUpload =[\s\S]*?setImages\(prev => \[\.\.\.prev, \.\.\.newImages\]\);\s*\}[\s\S]*?finally \{[\s\S]*?\}?\s*\};/gs, '');
    content = content.replace(/const removeImage = \(index: number\) => \{\s*setImages\(prev => prev\.filter\(\(_, i\) => i !== index\)\);\s*\};/g, '');

    // 4. Update handleSubmit to use uploadImagesToSupabase
    if (!content.includes('await uploadImagesToSupabase')) {
        const insertPoint = content.indexOf('const payload = {');
        if (insertPoint !== -1) {
            const before = content.slice(0, insertPoint);
            const after = content.slice(insertPoint);
            content = before + `const uploadedUrls = await uploadImagesToSupabase(supabase, images, 'dokumentasi', 'audit');\n    ` + after;
        }
    }
    
    // Update payload fields
    content = content.replace(/dokumentasi: finalDokumentasiUrls\.join\([^\)]*\)/g, "foto: uploadedUrls");
    content = content.replace(/dokumentasi: uploadedUrls/g, "foto: uploadedUrls");

    // 5. Replace documentation JSX with component
    const docsHeader = /<h3[^>]*>\s*<Camera[^>]*\/> Dokumentasi[\s\S]*?<\/div>[\s\S]*?<\/div>\s*<\/div>/;
    if (docsHeader.test(content)) {
        content = content.replace(docsHeader, '<DocumentationUploader images={images} setImages={setImages} />');
    }

    fs.writeFileSync(filePath, content, 'utf8');
}
