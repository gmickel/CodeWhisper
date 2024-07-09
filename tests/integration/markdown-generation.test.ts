import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { processFiles } from '../../src/core/file-processor';
import { generateMarkdown } from '../../src/core/markdown-generator';

describe('Markdown Generation', () => {
  it('should generate correct markdown for given files', async () => {
    const testDir = path.join(__dirname, '..', 'fixtures', 'test-project');
    const files = await processFiles({ path: testDir });
    const markdown = await generateMarkdown(files, { template: 'default' });

    expect(markdown).toContain('# Code Summary');
    expect(markdown).toContain('## Files');
    expect(markdown).toContain('src/main.js');
    expect(markdown).toContain('src/utils.ts');
    expect(markdown).toContain('package.json');
    expect(markdown).not.toContain('*.log');
  });
});
