import * as fs from 'fs';
import * as path from 'path';

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
  // Primary background gradients & buttons -> Green Theme
  { regex: /from-blue-600/g, replacement: 'from-emerald-500' },
  { regex: /from-blue-500/g, replacement: 'from-emerald-400' },
  { regex: /from-blue-400/g, replacement: 'from-emerald-300' },
  { regex: /to-indigo-600/g, replacement: 'to-teal-500' },
  { regex: /to-indigo-500/g, replacement: 'to-teal-400' },
  { regex: /to-purple-600/g, replacement: 'to-cyan-500' },
  { regex: /to-purple-500/g, replacement: 'to-cyan-400' },
  { regex: /to-cyan-500/g, replacement: 'to-teal-500' }, // fix if already cyan
  
  // Solid Button Backgrounds
  { regex: /bg-blue-600/g, replacement: 'bg-gradient-to-r from-emerald-500 to-teal-500' },
  { regex: /bg-blue-500/g, replacement: 'bg-gradient-to-r from-emerald-400 to-teal-400' },
  { regex: /bg-blue-600\/20/g, replacement: 'bg-emerald-600/20' },
  { regex: /bg-blue-600\/30/g, replacement: 'bg-emerald-600/30' },
  { regex: /hover:bg-blue-600/g, replacement: 'hover:from-emerald-600 hover:to-teal-600' },
  { regex: /hover:bg-blue-500/g, replacement: 'hover:from-emerald-400 hover:to-teal-400' },
  
  // Colors & text
  { regex: /text-blue-400/g, replacement: 'text-emerald-400' },
  { regex: /text-blue-500/g, replacement: 'text-emerald-500' },
  { regex: /text-blue-600/g, replacement: 'text-emerald-600' },
  { regex: /text-purple-400/g, replacement: 'text-teal-400' },
  { regex: /text-purple-500/g, replacement: 'text-teal-500' },
  
  // Borders, shadows
  { regex: /border-blue-400/g, replacement: 'border-emerald-400' },
  { regex: /border-blue-500/g, replacement: 'border-emerald-500' },
  { regex: /shadow-blue-500/g, replacement: 'shadow-emerald-500' },
  { regex: /shadow-blue-600/g, replacement: 'shadow-emerald-600' },
  { regex: /border-purple-400/g, replacement: 'border-teal-400' },
  { regex: /border-purple-500/g, replacement: 'border-teal-500' },
  
  // CSS specific
  { regex: /--color-primary:\s*#3b82f6/g, replacement: '--color-primary: #10b981' },
  { regex: /--color-primary-glow:\s*rgba\(59, 130, 246, 0\.5\)/g, replacement: '--color-primary-glow: rgba(16, 185, 129, 0.5)' },
  { regex: /--color-secondary:\s*#8b5cf6/g, replacement: '--color-secondary: #06b6d4' },
  { regex: /--color-secondary-glow:\s*rgba\(139, 92, 246, 0\.5\)/g, replacement: '--color-secondary-glow: rgba(6, 182, 212, 0.5)' }
];

walkDir('./app', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.css')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = content;
    
    replaceRules.forEach(rule => {
      modified = modified.replace(rule.regex, rule.replacement);
    });
    
    // Also remove any pulse animation on buttons, user requested it.
    // "HILANGKAN ANIMASI BERDENYUT PADA KEDUA INPUT DATA TERSEBUT" -> already did, but ensure globally "Pulse animation halus" was asked in NEW requirements?
    // Wait, the new requirement says "Pulse animation halus". Let's keep it if present or let CSS handle it.

    // Let's specifically fix text-gradient CSS rule
    modified = modified.replace(/bg-gradient-to-r from-blue-400 to-purple-500/g, 'bg-gradient-to-r from-emerald-400 to-cyan-400');
    
    if (modified !== content) {
      fs.writeFileSync(filePath, modified, 'utf-8');
      console.log(`Updated ${filePath}`);
    }
  }
});
