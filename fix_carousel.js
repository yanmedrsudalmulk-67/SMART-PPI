const fs = require('fs');

const file = 'app/dashboard/reports/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// The strategy is to apply the requested colors directly by replacing the default tailwind classes.

// CSS 1: button background: #f8f8f8
content = content.replace(
  /'bg-white dark:bg-\[#1e293b\] border-blue-500\/50 shadow-\[0_20px_50px_rgba\(59,130,246,0.3\)\] z-20'[\s\n]+: 'bg-slate-50 dark:bg-white\/5/g,
  `'bg-[#f8f8f8] dark:bg-[#f8f8f8] border-blue-500/50 shadow-[0_20px_50px_rgba(59,130,246,0.3)] z-20' 
                         : 'bg-[#f8f8f8] dark:bg-[#f8f8f8]`
);
// Make sure to match the multiline cleanly if my regex above fails

// CSS 2: h4 Name: text-[#060505]
content = content.replace(
  /className=\{`text-xl sm:text-2xl font-black leading-tight tracking-tight \$\{isActive \? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'\}`\}/g,
  'className={`text-xl sm:text-2xl font-black leading-tight tracking-tight text-[#060505] dark:text-[#060505]`}'
);

// CSS 5 & 6: currentValue (p) and '%' (span)
content = content.replace(
  /<p className=\{`text-5xl sm:text-6xl font-black font-heading tracking-tighter leading-none \$\{statusColor\}`\}>/g,
  '<p className={`text-5xl sm:text-6xl font-black font-heading tracking-tighter leading-none text-[#c8d706]`}>'
);
content = content.replace(
  /<span className=\{`text-xl font-black \$\{statusColor\} opacity-70`\}>\{ind\.type \|\| '%'\}<\/span>/g,
  "<span className={`text-xl font-black text-[#c9ef05] opacity-70`}>{ind.type || '%'}</span>"
);

// CSS 7: "Realtime Capaian"
content = content.replace(
  /<span className=\{`text-\[10px\] font-black uppercase tracking-widest \$\{isActive \? 'text-slate-500 dark:text-slate-400' : 'text-slate-400 dark:text-slate-600'\}`\}>Realtime Capaian<\/span>/g,
  '<span className={`text-[10px] font-black uppercase tracking-widest text-[#060505]`}>Realtime Capaian</span>'
);

// CSS 4: "Target Mutu"
content = content.replace(
  /<p className=\{`text-\[9px\] font-black uppercase tracking-widest mb-1\.5 \$\{isActive \? 'text-slate-500 dark:text-slate-400' : 'text-slate-400 dark:text-slate-500'\}`\}>Target Mutu<\/p>/g,
  '<p className={`text-[9px] font-black uppercase tracking-widest mb-1.5 text-[#070707]`}>Target Mutu</p>'
);

// CSS 3: "Target Mutu" value box
content = content.replace(
  /className=\{`px-4 py-2 rounded-xl border font-black text-sm tracking-tight \$\{isActive \? 'bg-slate-50 dark:bg-white\/10 border-slate-200 dark:border-white\/20 text-slate-900 dark:text-white shadow-sm' : 'bg-transparent border-slate-300 text-slate-500 dark:border-slate-700 dark:text-slate-400'\}`\}/g,
  'className={`px-4 py-2 rounded-xl border font-black text-sm tracking-tight text-[#0d0c0c] ${isActive ? \'bg-slate-50 dark:bg-white/10 border-slate-200 dark:border-white/20 shadow-sm\' : \'bg-transparent border-slate-300 dark:border-slate-700\'}`}'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed styles.');
