const fs = require('fs');
const path = require('path');

// Fix the hardcoded path by resolving it dynamically
const contentDir = path.resolve(__dirname, '../../books/quarter-life-crisis/src/content');

function fixAnda(dir = contentDir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));

    files.forEach(file => {
        const filePath = path.join(dir, file);
        let content = fs.readFileSync(filePath, 'utf8');

        // Replace "Anda" with "kamu" case-insensitively, but match whole words
        content = content.replace(/\bAnda\b/g, 'kamu');
        content = content.replace(/\banda\b/g, 'kamu');

        // Fix capital Kamu at start of sentence or list item (including markdown formatting)
        content = content.replace(/([\.!\?]\s+[> "'_*`\[]*)kamu/g, '$1Kamu');

        // Allow for -, *, or + as list item indicators
        content = content.replace(/(^\s*[-*+]\s+[> "'_*`\[]*)kamu/gm, '$1Kamu');

        content = content.replace(/(^\s*\d+\.\s+[> "'_*`\[]*)kamu/gm, '$1Kamu');
        content = content.replace(/(^\s*[> "'_*`\[]*)kamu/gm, '$1Kamu');
        content = content.replace(/(\n\s*[> "'_*`\[]*)kamu/g, '$1Kamu');

        fs.writeFileSync(filePath, content);
    });

    console.log('Fixed pronouns in quarter-life-crisis');
}

if (require.main === module) {
    fixAnda();
}

module.exports = { fixAnda, contentDir };
