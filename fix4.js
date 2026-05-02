const fs = require('fs');
const glob = require('glob');
const files = glob.sync('app/dashboard/input/**/page.tsx');
let count = 0;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  const saveOrig1 = `if (error && error.code !== '42P01') throw error;`;
  
  if (content.includes(saveOrig1)) {
    content = content.replace(/if \(error && error\.code !== '42P01'\) throw error;/g, "if (error) console.error('Observer DB Error:', error);");
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    count++;
  }
});
console.log('Updated ' + count + ' files for broader error catching');
