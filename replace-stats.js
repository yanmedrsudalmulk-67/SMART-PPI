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
  
  // Clean up existing LiveStatisticsCard import if we added it multiple times or something
  if (content.includes('import { LiveStatisticsCard }')) {
    // Already present
  } else {
    content = content.replace(/(import.*?\n)(?=import|const|export)/, `$1import { LiveStatisticsCard } from '@/components/LiveStatisticsCard';\n`);
  }

  // Type 1: Standard 'grid grid-cols-2 lg:grid-cols-4 gap-4' with [ { label: 'Item Dinilai', val: stats.totalDinilai }...
  // Usually follows: {/* Live Statistics Card */}
  const pattern1 = /\{\/\* Live Statistics Card[\s\S]*?<\/svg>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/;
  if (pattern1.test(content)) {
    const replacement = `<LiveStatisticsCard 
          totalDinilai={stats.totalDinilai}
          totalPatuh={stats.totalPatuh}
          totalTidakPatuh={stats.totalTidakPatuh}
          persentase={stats.persentase}
          statusText={stats.statusText}
        />\n      </div>`;
    content = content.replace(pattern1, replacement);
  }

  const pattern2 = /<div className="mt-8 mb-8">[\s\S]*?<!-- Live Statistics Card -->[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<\/div>\s*<\/div>/;
  // Let me just manually edit them and let script do the easy ones

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    modified++;
    console.log(`Modified in: ${file}`);
  }
});

console.log(`Processed ${processed} files, modified ${modified}.`);
