const fs = require('fs');
const path = require('path');

const summaryPath = 'books/quarter-life-crisis/src/SUMMARY.md';
let summary = fs.readFileSync(summaryPath, 'utf8');

const lines = summary.split('\n');
let chapterCounter = 1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].startsWith('- [') && !lines[i].includes('Referensi')) {
    // Check if it already has "Bab"
    if (!lines[i].includes('Bab ')) {
      lines[i] = lines[i].replace('- [', `- [Bab ${chapterCounter}: `);
    }
    
    // Also update the file content
    const match = lines[i].match(/\((.*?)\)/);
    if (match) {
      const filePath = path.join('books/quarter-life-crisis/src', match[1]);
      if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        // Find the first H2 (## )
        content = content.replace(/^##\s+(?!Bab)/m, `## Bab ${chapterCounter}: `);
        fs.writeFileSync(filePath, content);
      }
    }
    chapterCounter++;
  }
}

fs.writeFileSync(summaryPath, lines.join('\n'));
console.log('Done renaming to Bab X');
