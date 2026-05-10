const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      walkSync(filePath, filelist);
    } else if (filePath.endsWith('.ts')) {
      filelist.push(filePath);
    }
  }
  return filelist;
};

const files = walkSync(path.join(__dirname, 'src'));

let changed = 0;
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Fix controllers: (+id) -> (id) and (+id, ...) -> (id, ...)
  content = content.replace(/\(\+id/g, '(id');
  
  // Fix arguments: id: number -> id: string
  content = content.replace(/id: number/g, 'id: string');

  if (content !== original) {
    fs.writeFileSync(file, content);
    changed++;
    console.log('Fixed', file);
  }
}

console.log('Total files fixed:', changed);
