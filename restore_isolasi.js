const fs = require('fs');
const path = require('path');

// Read monitoring-ruang_isolasi
const srcPath = path.join(__dirname, 'app/dashboard/input/monitoring-ruang_isolasi/page.tsx');
let content = fs.readFileSync(srcPath, 'utf8');

// The checklists need to be specific to "PPI di ruang isolasi"
const checklistItems = [
  { id: '1', label: 'Petugas melakukan kebersihan tangan sebelum dan sesudah ke area pasien' },
  { id: '2', label: 'Petugas menggunakan APD yang tepat sesuai indikasi transmisi' },
  { id: '3', label: 'Pengunjung dibatasi dan diedukasi edukasi PPI' },
  { id: '4', label: 'Pintu ruang isolasi selalu tertutup dengan rapat' },
  { id: '5', label: 'Limbah medis infeksius dibuang pada tempat sampah kuning' },
  { id: '6', label: 'Linen kotor infeksius dimasukkan pada kantong kuning yang sesuai' },
  { id: '7', label: 'Peralatan medis diletakkan secara dedicated (khusus pasien tersebut)' },
  { id: '8', label: 'Pembersihan lingkungan terjadwal dan menggunakan disinfektan' },
  { id: '9', label: 'Tidak ada barang pribadi pasien/keluarga yang berserakan' }
];

content = content.replace(/const checklistItems = \[[\s\S]*?\];/, 'const checklistItems = ' + JSON.stringify(checklistItems, null, 2) + ';');

content = content.replace(/RuangIsolasiMonitoringPage/g, 'PPIIsolasiMonitoringPage');
content = content.replace(/Ruang Isolasi/g, 'PPI Ruang Isolasi');
content = content.replace(/Menyimpan Audit Isolasi/g, 'Menyimpan Audit PPI Isolasi');

const destDir = path.join(__dirname, 'app/dashboard/input/monitoring-isolasi');
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

fs.writeFileSync(path.join(destDir, 'page.tsx'), content);
console.log('Restored monitoring-isolasi/page.tsx');
