import { describe, expect, it } from 'vitest';
import { processFiles } from '../../src/core/file-processor';
import { generateMarkdown } from '../../src/core/markdown-generator';
import { joinPath } from '../../src/utils/path-utils';

describe('Markdown Output', () => {
  it('should match snapshot for default template', async () => {
    const testDir = joinPath(import.meta.url, '..', 'fixtures', 'test-project');
    const files = await processFiles({ path: testDir });
    const markdown = await generateMarkdown(files, { template: 'default' });

    expect(markdown).toMatchSnapshot();
  });
});
