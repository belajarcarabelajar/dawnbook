const fs = require('fs');
const path = require('path');

function fixAndaToKamu(content) {
    // Replace "Anda" with "kamu" case-insensitively, but match whole words
    content = content.replace(/\bAnda\b/g, 'kamu');
    content = content.replace(/\banda\b/g, 'kamu');
    
    // Fix capital Kamu at start of sentence or list item (including markdown formatting)
    content = content.replace(/([\.!\?]\s+[> "'_*`\[]*)kamu\b/g, '$1Kamu');

    // Allow for -, *, or + as list item indicators
    content = content.replace(/(^\s*[-*+]\s+[> "'_*`\[]*)kamu\b/gm, '$1Kamu');

    content = content.replace(/(^\s*\d+\.\s+[> "'_*`\[]*)kamu\b/gm, '$1Kamu');
    content = content.replace(/(^\s*[> "'_*`\[]*)kamu\b/gm, '$1Kamu');
    content = content.replace(/(\n\s*[> "'_*`\[]*)kamu\b/g, '$1Kamu');

    return content;
}

if (require.main === module) {
    const contentDir = path.resolve(__dirname, '../../books/quarter-life-crisis/src/content');
    if (fs.existsSync(contentDir)) {
        const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.md'));

        files.forEach(file => {
            const filePath = path.join(contentDir, file);
            let content = fs.readFileSync(filePath, 'utf8');
            content = fixAndaToKamu(content);
            fs.writeFileSync(filePath, content);
        });

        console.log('Fixed pronouns in quarter-life-crisis');
    }
}

module.exports = { fixAndaToKamu };
