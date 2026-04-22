const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if(isDirectory) {
      if(f !== 'node_modules' && f !== '.next') {
        walkDir(dirPath, callback);
      }
    } else {
      callback(path.join(dir, f));
    }
  });
}

walkDir('./app', (filePath) => {
  if (filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = content;
    
    modified = modified.replace(/text-gradient(?! drop-shadow)/g, 'text-gradient drop-shadow-[0_0_25px_rgba(59,130,246,0.5)]');
    
    modified = modified.replace(/text-lg tracking-widest text-white">SMART-PPI/g, 'text-xl tracking-widest text-gradient drop-shadow-[0_0_25px_rgba(59,130,246,0.5)]">SMART-PPI');

    if (modified !== content) {
      fs.writeFileSync(filePath, modified, 'utf-8');
      console.log(`Updated gradient on ${filePath}`);
    }
  }
});
