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
  // Primary background gradients & buttons -> Green Theme
  { regex: /from-blue-600/g, replacement: 'from-emerald-500' },
  { regex: /from-blue-500/g, replacement: 'from-emerald-400' },
  { regex: /from-blue-400/g, replacement: 'from-emerald-300' },
  { regex: /to-indigo-600/g, replacement: 'to-teal-500' },
  { regex: /to-indigo-500/g, replacement: 'to-teal-400' },
  { regex: /to-purple-600/g, replacement: 'to-cyan-500' },
  { regex: /to-purple-500/g, replacement: 'to-cyan-400' },
  { regex: /from-teal-500 to-cyan-500/g, replacement: 'from-emerald-500 to-cyan-500' },
  
  // Solid Button Backgrounds
  { regex: /bg-blue-600 hover:bg-blue-500/g, replacement: 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400' },
  { regex: /bg-blue-600/g, replacement: 'bg-gradient-to-r from-emerald-500 to-cyan-500' },
  { regex: /bg-teal-600 hover:bg-teal-500/g, replacement: 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400' },
  { regex: /bg-teal-600/g, replacement: 'bg-gradient-to-r from-emerald-500 to-cyan-500' },
  
  { regex: /bg-blue-500/g, replacement: 'bg-gradient-to-r from-emerald-400 to-cyan-400' },
  { regex: /bg-blue-600\/20/g, replacement: 'bg-emerald-600/20' },
  { regex: /bg-blue-600\/30/g, replacement: 'bg-emerald-600/30' },
  { regex: /hover:bg-blue-600/g, replacement: 'hover:from-emerald-600 hover:to-cyan-600' },
  { regex: /hover:bg-blue-500/g, replacement: 'hover:from-emerald-400 hover:to-cyan-400' },
  
  // Colors & text
  { regex: /text-blue-400/g, replacement: 'text-emerald-400' },
  { regex: /text-blue-500/g, replacement: 'text-emerald-500' },
  { regex: /text-blue-600/g, replacement: 'text-emerald-600' },
  { regex: /text-purple-400/g, replacement: 'text-cyan-400' },
  { regex: /text-purple-500/g, replacement: 'text-cyan-500' },
  { regex: /text-teal-400/g, replacement: 'text-emerald-400' }, // convert standalone teals
  
  // Borders, shadows
  { regex: /border-blue-400/g, replacement: 'border-emerald-400' },
  { regex: /border-blue-500/g, replacement: 'border-emerald-500' },
  { regex: /shadow-blue-500/g, replacement: 'shadow-emerald-500' },
  { regex: /shadow-blue-600/g, replacement: 'shadow-emerald-600' },
  { regex: /border-purple-400/g, replacement: 'border-cyan-400' },
  { regex: /border-purple-500/g, replacement: 'border-cyan-500' },
  
  // CSS specific
  { regex: /--color-primary:\s*#3b82f6/g, replacement: '--color-primary: #10b981' },
  { regex: /--color-primary-glow:\s*rgba\(59, 130, 246, 0\.5\)/g, replacement: '--color-primary-glow: rgba(16, 185, 129, 0.5)' },
  { regex: /--color-secondary:\s*#8b5cf6/g, replacement: '--color-secondary: #06b6d4' },
  { regex: /--color-secondary-glow:\s*rgba\(139, 92, 246, 0\.5\)/g, replacement: '--color-secondary-glow: rgba(6, 182, 212, 0.5)' }
];

walkDir('./app', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.css') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = content;
    
    // First specific fix for text-gradient CSS rule
    modified = modified.replace(/bg-gradient-to-r from-blue-400 to-purple-500/g, 'bg-gradient-to-r from-emerald-400 to-cyan-400');
    
    replaceRules.forEach(rule => {
      modified = modified.replace(rule.regex, rule.replacement);
    });
    
    // Further fixes to fix nested/compound replacements
    modified = modified.replace(/from-teal-400 to-teal-400/g, 'from-emerald-400 to-cyan-400');
    modified = modified.replace(/from-emerald-400 to-cyan-400 hover:bg-gradient-to-r from-emerald-400 to-cyan-400/g, 'from-emerald-400 to-cyan-400'); // clean up weird nested ones if they happen
    
    // Convert old single colors on buttons (like bg-blue-600) to gradient if missed
    modified = modified.replace(/bg-blue-600/g, 'bg-gradient-to-r from-emerald-500 to-cyan-500');

    // Fix rgba values for shadows if they use tailwind arbitrary values like shadow-[0_0_15px_rgba(59,130,246,0.3)]
    modified = modified.replace(/rgba\(59,130,246,/g, 'rgba(16,185,129,');
    modified = modified.replace(/rgba\(20,184,166,/g, 'rgba(16,185,129,'); // convert teal rgb to emerald
    modified = modified.replace(/rgba\(139,92,246,/g, 'rgba(6,182,212,'); // purple to cyan
    
    if (modified !== content) {
      fs.writeFileSync(filePath, modified, 'utf-8');
      console.log(`Updated ${filePath}`);
    }
  }
});
