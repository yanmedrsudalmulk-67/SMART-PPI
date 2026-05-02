const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    if(fs.statSync(dirPath).isDirectory()) {
      if(f !== 'node_modules' && f !== '.next') {
        walkDir(dirPath, callback);
      }
    } else {
      if(dirPath.endsWith('.tsx')) {
        callback(dirPath);
      }
    }
  });
}

const replaceRules = [
  { regex: /bg-\[#020617\]/g, replacement: 'bg-slate-50' },
  { regex: /text-slate-200/g, replacement: 'text-slate-800' },
  { regex: /bg-navy-dark\/50/g, replacement: 'bg-white/90' },
  { regex: /bg-navy-dark/g, replacement: 'bg-white' },
  { regex: /bg-navy-light/g, replacement: 'bg-slate-50' },
  { regex: /text-white/g, replacement: 'text-slate-900' },
  { regex: /border-white\/[0-9]+/g, replacement: 'border-slate-200' },
  { regex: /bg-white\/[0-9]+/g, replacement: 'bg-slate-100' },
  { regex: /text-slate-300/g, replacement: 'text-slate-700' },
  { regex: /text-slate-400/g, replacement: 'text-slate-600' },
  { regex: /glass-card/g, replacement: 'bg-white shadow-sm border border-slate-200' },
  { regex: /bg-\[#0f172a\]/g, replacement: 'bg-white' },
  { regex: /glow-blue/g, replacement: 'shadow-lg shadow-blue-500/20' },
  { regex: /glow-emerald/g, replacement: 'shadow-lg shadow-emerald-500/20' },
  { regex: /text-gradient/g, replacement: 'text-blue-900' }
];

const targets = [
  './app/dashboard/input',
  './components/DocumentationUploader.tsx'
];

targets.forEach(target => {
  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
    walkDir(target, (filePath) => applyReplacements(filePath));
  } else if (fs.existsSync(target)) {
    applyReplacements(target);
  }
});

function applyReplacements(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let original = content;
  
  replaceRules.forEach(rule => {
    content = content.replace(rule.regex, rule.replacement);
  });
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Reverted theme in ${filePath}`);
  }
}

