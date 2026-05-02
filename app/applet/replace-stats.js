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

let processed = 0;
let modified = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  processed++;
  
  let originalContent = content;

  // Add import if not present
  if (!content.includes('LiveStatisticsCard')) {
    // try to find where to put it
    content = content.replace(/(import.*?\n)(?=\n|const|export)/s, `$1import { LiveStatisticsCard } from '@/components/LiveStatisticsCard';\n`);
  }

  // Type 1: Standard 'grid grid-cols-2 lg:grid-cols-4 gap-4' with [ { label: 'Item Dinilai', val: stats.totalDinilai }...
  let changed = false;
  
  // Pattern 1:
  // {/* Live Statistics Card */}
  // <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  // ...
  // </div>
  // </div>
  const match1 = content.match(/\{\/\* Live Statistics Card .*\*\/\}\s*<div className="grid grid-cols-2 md:grid-cols-4 gap-4">[\s\S]*?<\/svg>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/);
  if (match1) {
    const replacement = `<LiveStatisticsCard 
          totalDinilai={stats.totalDinilai}
          totalPatuh={stats.totalPatuh}
          totalTidakPatuh={stats.totalTidakPatuh}
          persentase={stats.persentase}
          statusText={stats.statusText}
          title="HASIL KEPATUHAN"
        />`;
    content = content.replace(match1[0], replacement);
    changed = true;
  }

  // Generic match for other variations
  // we might want to just dump a manual regex or use npx tsx to manually update each one
  if (changed) {
    fs.writeFileSync(file, content);
    modified++;
    console.log(`Modified pattern 1 in: ${file}`);
  }
});

console.log(`Processed ${processed} files, modified ${modified}.`);
