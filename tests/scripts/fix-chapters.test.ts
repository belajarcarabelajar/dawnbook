import { describe, test, expect } from 'bun:test';
const { convertH1ToH2, slugify } = require('../../archive/scripts/fix_chapters.js');

describe('fix_chapters conversion logic', () => {
    test('converts top-level H1 headers to H2 headers', () => {
        const input = '# Chapter Title\n\nSome text.\n\n# Section Title\n';
        const expected = '## Chapter Title\n\nSome text.\n\n## Section Title\n';
        expect(convertH1ToH2(input)).toBe(expected);
    });

    test('ignores H1 headers inside code blocks', () => {
        const input = [
            '# Main Title',
            '',
            '```javascript',
            '// Comment with # symbol',
            '# Not a heading in code block',
            'const a = 1;',
            '```',
            '',
            '# Sub Title',
            '',
            '```',
            '# Another code block header',
            '```'
        ].join('\n');

        const expected = [
            '## Main Title',
            '',
            '```javascript',
            '// Comment with # symbol',
            '# Not a heading in code block',
            'const a = 1;',
            '```',
            '',
            '## Sub Title',
            '',
            '```',
            '# Another code block header',
            '```'
        ].join('\n');

        expect(convertH1ToH2(input)).toBe(expected);
    });

    test('preserves existing H2 and H3 headers untouched', () => {
        const input = '# Main Title\n\n## Section H2\n\n### Sub-section H3\n';
        const expected = '## Main Title\n\n## Section H2\n\n### Sub-section H3\n';
        expect(convertH1ToH2(input)).toBe(expected);
    });

    test('ignores text with hashtags or no space after #', () => {
        const input = '#HeaderWithoutSpace\n\n#hashtag\n\n# Title With Space';
        const expected = '#HeaderWithoutSpace\n\n#hashtag\n\n## Title With Space';
        expect(convertH1ToH2(input)).toBe(expected);
    });

    test('slugify cleans title strings correctly', () => {
        expect(slugify('Quarter Life Crisis: Part 1! Fine?')).toBe('quarter-life-crisis-part-1-fine');
    });
});
