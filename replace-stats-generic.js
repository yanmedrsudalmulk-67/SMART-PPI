const fs = require('fs');
const path = require('path');

function findFiles(dir, filter, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      findFiles(fullPath, filter, fileList);
    } else if (filter.test(file)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const files = findFiles('./app/dashboard/input', /page\.tsx$/);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('Item Dinilai')) return;
  if (!content.includes('Hasil Persentase') && !content.includes('Kepatuhan')) return;
  
  if (!content.includes('import { LiveStatisticsCard }')) {
    content = content.replace(/(import.*?\n)(?=import|const|export)/, `$1import { LiveStatisticsCard } from '@/components/LiveStatisticsCard';\n`);
  }

  // The summary block is usually a <div className="glass-card ..."> ... </div>
  // Or multiple <div className="glass-card ..."> blocks.
  // I will just use regex to replace from whatever starts the Stats section to whatever ends it.
  
  // Apd specific:
  const matchApd = content.match(/\{\/\* HASIL PERSENTASE STANDARDIZED \*\}[\s\S]*?<\/AnimatePresence>\s*<\/div>/);
  if (matchApd) {
    const repl = `        <LiveStatisticsCard 
          totalDinilai={stats.dinilai}
          totalPatuh={stats.patuh}
          totalTidakPatuh={stats.dinilai - stats.patuh}
          persentase={stats.persentase}
          statusText={stats.status}
          title="KEPATUHAN APD"
        />\n      </div>`;
    content = content.replace(matchApd[0], repl);
  }

  // monitoring-fasilitas_apd
  const matchFasilApd = content.match(/<div className="glass-card p-6 lg:p-8 rounded-\[2\.5rem\] border-white\/5 shadow-xl">[\s\S]*?<\/svg>[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<\/div>\s*<\/div>/);
  // Wait, monitoring-fasilitas_apd has:
  //         {/* HASIL PERSENTASE STANDARDIZED */}
  //         <div className="glass-card p-6 sm:p-8 rounded-[32px] border-white/5 flex flex-col md:flex-row items-center justify-center gap-8 relative overflow-hidden mt-6 mb-6">
  
  const genPattern = /\{\/\* HASIL PERSENTASE STANDARDIZED \*\}[\s\S]*?<\/svg>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/;
  if (genPattern.test(content)) {
    // If we can determine the variables...
    let totalDinilai = content.includes('stats.totalDinilai') ? 'stats.totalDinilai' : 'stats.dinilai';
    let totalPatuh = content.includes('stats.totalPatuh') ? 'stats.totalPatuh' : 'stats.patuh';
    let totalTidakPatuh = content.includes('stats.totalTidakPatuh') ? 'stats.totalTidakPatuh' : `${totalDinilai} - ${totalPatuh}`;
    let persentase = 'stats.persentase';
    let statusText = content.includes('stats.statusText') ? 'stats.statusText' : 'stats.status';
    
    // For monitoring-farmasi, it's Object.values(data)...
    if (file.includes('farmasi')) {
      totalDinilai = '{Object.values(data).filter(d => d.status !== null).length}';
      totalPatuh = '{Object.values(data).filter(d => d.status === "Sesuai").length}';
      totalTidakPatuh = '{Object.values(data).filter(d => d.status === "Tidak Sesuai").length}';
      persentase = '{Math.round((Object.values(data).filter(d => d.status === "Sesuai").length / Math.max(1, Object.values(data).filter(d => d.status !== null).length)) * 100)}';
      statusText = '{Object.values(data).filter(d => d.status === "Sesuai").length / Math.max(1, Object.values(data).filter(d => d.status !== null).length) >= 0.85 ? "Baik" : "Perlu Tindak Lanjut"}';
    }

    const repl = `<LiveStatisticsCard 
          totalDinilai={${totalDinilai.replace(/^{|}$/g, '')}}
          totalPatuh={${totalPatuh.replace(/^{|}$/g, '')}}
          totalTidakPatuh={${totalTidakPatuh.replace(/^{|}$/g, '')}}
          persentase={${persentase.replace(/^{|}$/g, '')}}
          statusText={${statusText.replace(/^{|}$/g, '')}}
          title="HASIL KEPATUHAN"
        />`;
    
    content = content.replace(genPattern, repl);
  }

  if (content !== fs.readFileSync(file, 'utf8')) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
});
