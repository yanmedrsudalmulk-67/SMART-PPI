const fs = require('fs');
const glob = require('glob');
const files = glob.sync('app/dashboard/input/**/page.tsx');
let count = 0;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  const saveRegex = /if \(error\) console\.error\('Observer DB Error:', error\);/g;
  
  if (content.match(saveRegex)) {
    content = content.replace(saveRegex, "if (error) { console.error('Observer DB Error:', error); throw error; }");
    changed = true;
  }

  const alertRegex = /alert\('Gagal menyimpan observer\.'\);/g;
  if (content.match(alertRegex)) {
    content = content.replace(alertRegex, "alert('Gagal menyimpan observer: ' + (err.message || JSON.stringify(err)));");
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    count++;
  }
});
console.log('Updated ' + count + ' files with precise error throwing');
