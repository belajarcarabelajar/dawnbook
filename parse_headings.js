const fs = require('fs');
const path = require('path');

const dir = '/home/belajarcarabelajar/Downloads/New';
const files = Array.from({length: 11}, (_, i) => `${i+1}.md`);
const results = [];

files.forEach(file => {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  const firstLine = content.split('\n').find(line => line.trim().startsWith('#'));
  let heading = firstLine ? firstLine.replace(/^#+\s*/, '').trim() : 'Unknown';
  // generate filename
  const num = file.replace('.md', '').padStart(2, '0');
  const slug = heading.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 50);
  results.push({ originalFile: file, num, heading, targetFile: `${num}_${slug}.md` });
});

console.log(JSON.stringify(results, null, 2));
