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

const replaceRules = [
  // CSS variables
  { regex: /--color-primary:\s*#10b981/g, replacement: '--color-primary: #3b82f6' },
  { regex: /--color-primary-glow:\s*rgba\(16, 185, 129, 0\.5\)/g, replacement: '--color-primary-glow: rgba(59, 130, 246, 0.5)' },
  { regex: /--color-secondary:\s*#06b6d4/g, replacement: '--color-secondary: #8b5cf6' },
  { regex: /--color-secondary-glow:\s*rgba\(6, 182, 212, 0\.5\)/g, replacement: '--color-secondary-glow: rgba(139, 92, 246, 0.5)' },
  
  // Specific text/gradient replacements
  { regex: /bg-gradient-to-r from-emerald-400 to-cyan-400/g, replacement: 'bg-gradient-to-r from-blue-400 to-purple-500' },
  { regex: /bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400/g, replacement: 'bg-blue-600 hover:bg-blue-500' },
  { regex: /bg-gradient-to-r from-emerald-500 to-cyan-500/g, replacement: 'bg-blue-600' },
  
  // Custom classes
  { regex: /glow-emerald/g, replacement: 'glow-blue' },
  { regex: /glow-cyan/g, replacement: 'glow-purple' },
  
  // Shadow RGBA fix
  { regex: /rgba\(16,185,129,/g, replacement: 'rgba(59,130,246,' },
  { regex: /rgba\(6,182,212,/g, replacement: 'rgba(139,92,246,' },
  
  // General colors mapping back
  { regex: /emerald-600/g, replacement: 'blue-600' },
  { regex: /emerald-500/g, replacement: 'blue-500' },
  { regex: /emerald-400/g, replacement: 'blue-400' },
  { regex: /emerald-300/g, replacement: 'blue-300' },
  { regex: /emerald-50\/10/g, replacement: 'blue-50' }, 
  
  { regex: /cyan-600/g, replacement: 'purple-600' },
  { regex: /cyan-500/g, replacement: 'purple-500' },
  { regex: /cyan-400/g, replacement: 'purple-400' },
  { regex: /cyan-300/g, replacement: 'purple-300' },
];

walkDir('./app', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.css') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = content;
    
    replaceRules.forEach(rule => {
      modified = modified.replace(rule.regex, rule.replacement);
    });
    
    if (modified !== content) {
      fs.writeFileSync(filePath, modified, 'utf-8');
      console.log(`Reverted ${filePath}`);
    }
  }
});
