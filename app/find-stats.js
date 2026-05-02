const fs = require('fs');
const path = require('path');

function findFiles(dir, filter, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      findFiles(path.join(dir, file), filter, fileList);
    } else if (filter.test(file)) {
      fileList.push(path.join(dir, file));
    }
  }
  return fileList;
}

const files = findFiles('./app/dashboard/input', /page\.tsx$/);

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('Item Dinilai')) {
    console.log(file);
  }
});
