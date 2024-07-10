import { describe, expect, it } from 'vitest';
import { processFiles } from '../../src/core/file-processor';
import { generateMarkdown } from '../../src/core/markdown-generator';

const joinPath = (pathname: string) =>
  new URL(pathname, import.meta.url).pathname;

describe('Markdown Output', () => {
  it('should match snapshot for default template', async () => {
    const testDir = joinPath('../fixtures/test-project');
    const files = await processFiles({ path: testDir });
    const markdown = await generateMarkdown(files, { template: 'default' });

    expect(markdown).toMatchSnapshot();
  });
});
