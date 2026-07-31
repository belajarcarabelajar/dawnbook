const fs = require('fs');
const path = require('path');

// Fix the hardcoded path by resolving it dynamically
const contentDir = path.resolve(__dirname, '../books/quarter-life-crisis/src/content');
const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.md'));

files.forEach(file => {
    const filePath = path.join(contentDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace "Anda" with "kamu" case-insensitively, but match whole words
    content = content.replace(/\bAnda\b/g, 'kamu');
    content = content.replace(/\banda\b/g, 'kamu');
    
    // Fix capital Kamu at start of sentence or list item
    content = content.replace(/([\.!\?]\s+)kamu/g, '$1Kamu');

    // Allow for -, *, or + as list item indicators
    content = content.replace(/(^\s*[-*+]\s*)kamu/gm, '$1Kamu');

    content = content.replace(/(^\s*\d+\.\s*)kamu/gm, '$1Kamu');
    content = content.replace(/^kamu/gm, 'Kamu');
    content = content.replace(/(\n\s*)kamu/g, '$1Kamu');
    
    fs.writeFileSync(filePath, content);
});

console.log('Fixed pronouns in quarter-life-crisis');
