import { describe, expect, it } from 'bun:test';
import path from 'path';
import fs from 'fs';

// Import archive script
const { fixAnda, contentDir } = require('../../archive/scripts/fix_anda.js');

describe('archive/scripts/fix_anda.js', () => {
  it('resolves contentDir dynamically relative to __dirname', () => {
    const expectedPath = path.resolve(__dirname, '../../books/quarter-life-crisis/src/content');
    expect(contentDir).toBe(expectedPath);
  });

  it('replaces Anda/anda with kamu/Kamu appropriately in markdown files', async () => {
    const tmpDir = path.join(__dirname, '../tmp_test_fix_anda');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const testFilePath = path.join(tmpDir, 'test_chapter.md');
    const inputContent = 'Apakah Anda merasa ragu? Anda harus yakin. - anda bisa!';
    fs.writeFileSync(testFilePath, inputContent, 'utf8');

    try {
      fixAnda(tmpDir);
      const updatedContent = fs.readFileSync(testFilePath, 'utf8');
      expect(updatedContent).toContain('Kamu');
      expect(updatedContent).toContain('kamu');
      expect(updatedContent).not.toContain('Anda');
    } finally {
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
      if (fs.existsSync(tmpDir)) {
        fs.rmdirSync(tmpDir);
      }
    }
  });
});
