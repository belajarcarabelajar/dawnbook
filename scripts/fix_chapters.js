const fs = require('fs');
const path = require('path');

const srcDir = '/home/belajarcarabelajar/dawnbook/books/quarter-life-crisis/src';
const contentDir = path.join(srcDir, 'content');

if (!fs.existsSync(contentDir)) {
    fs.mkdirSync(contentDir);
}

const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.md') && f !== 'SUMMARY.md');
let summaryLines = ['# Summary', ''];

const slugify = (text) => {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
};

files.sort((a, b) => parseInt(a) - parseInt(b)).forEach(file => {
    const filePath = path.join(srcDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Find the first H1 for the title
    const match = content.match(/^#\s+(.+)$/m);
    if (!match) return;
    
    let title = match[1].trim();
    // Clean up title for summary (remove colons, quotes, etc)
    let summaryTitle = title.replace(/[:"']/g, '');
    
    // Convert ALL H1s to H2s to fix the nesting issue
    content = content.replace(/^#\s+/gm, '## ');
    
    // Generate new filename
    const chapterNum = file.match(/^(\d+)/)[1];
    // Limit slug to a reasonable length (first 6 words)
    let slugTitle = slugify(title.split(' ').slice(0, 6).join(' '));
    const newFilename = `${chapterNum}_${slugTitle}.md`;
    
    // Write to content dir
    fs.writeFileSync(path.join(contentDir, newFilename), content);
    
    // Add to summary
    summaryLines.push(`- [${summaryTitle}](./content/${newFilename})`);
    
    // Delete old file
    fs.unlinkSync(filePath);
});

fs.writeFileSync(path.join(srcDir, 'SUMMARY.md'), summaryLines.join('\n') + '\n');
console.log('Successfully refactored chapters and SUMMARY.md');
