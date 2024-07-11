// tests/unit/markdown-generator.test.ts
import { beforeEach, describe, expect, it } from 'vitest';
import type { FileInfo } from '../../src/core/file-processor';
import { generateMarkdown } from '../../src/core/markdown-generator';

function decodeHTMLEntities(text: string): string {
  const entities: Record<string, string> = {
    '&quot;': '"',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
  };

  return text.replace(/&quot;|&amp;|&lt;|&gt;/g, (match) => entities[match]);
}

describe('Markdown Generator', () => {
  const mockFiles: FileInfo[] = [
    {
      path: '/project/src/index.ts',
      extension: 'ts',
      language: 'typescript',
      size: 100,
      created: new Date('2023-01-01'),
      modified: new Date('2023-01-02'),
      content: 'console.log("Hello, World!");',
    },
    {
      path: '/project/README.md',
      extension: 'md',
      language: 'markdown',
      size: 50,
      created: new Date('2023-01-01'),
      modified: new Date('2023-01-01'),
      content: '# Project README',
    },
  ];

  const defaultTemplate = `# Code Summary

{{tableOfContents files}}

## Files

{{#each files}}
## {{relativePath this.path}}

- Language: {{this.language}}
- Size: {{this.size}} bytes
- Last modified: {{this.modified}}

{{#codeblock this.content this.language}}{{/codeblock}}

{{/each}}`;

  const customTemplate = 'Custom template: {{files.length}} files';

  it('should generate markdown with default template', async () => {
    const result = await generateMarkdown(mockFiles, defaultTemplate);

    expect(result).toContain('# Code Summary');
    expect(result).toContain('Language: typescript');
    expect(result).toContain('Language: markdown');
    expect(result).toContain(
      '```typescript\nconsole.log("Hello, World!");\n```',
    );
    expect(result).toContain('```markdown\n# Project README\n```');
  });

  it('should use custom template when provided', async () => {
    const result = await generateMarkdown(mockFiles, customTemplate);

    expect(result).toBe('Custom template: 2 files');
  });

  it('should handle noCodeblock option', async () => {
    const template =
      '{{#each files}}{{#codeblock this.content this.language}}{{/codeblock}}{{/each}}';

    const resultWithCodeblock = await generateMarkdown(mockFiles, template);

    const resultWithoutCodeblock = await generateMarkdown(mockFiles, template, {
      noCodeblock: true,
    });

    expect(resultWithCodeblock).toContain('```typescript');
    expect(resultWithCodeblock).toContain('```markdown');
    expect(resultWithoutCodeblock).not.toContain('```typescript');
    expect(resultWithoutCodeblock).not.toContain('```markdown');
  });

  it('should include custom data in template context', async () => {
    const template = 'Custom data: {{customData.key}}';

    const result = await generateMarkdown(mockFiles, template, {
      customData: { key: 'value' },
    });

    expect(result).toBe('Custom data: value');
  });

  it('should use provided basePath for relative paths', async () => {
    const template = '{{#each files}}{{relativePath this.path}}{{/each}}';

    const result = await generateMarkdown(mockFiles, template, {
      basePath: '/project',
    });

    expect(result).toBe('src/index.tsREADME.md');
  });

  it('should handle errors when processing templates', async () => {
    // Intentionally use an invalid template to trigger helperMissing
    const invalidTemplate =
      '{{#each files}}{{invalidHelper this.content}}{{/each}}';

    const result = await generateMarkdown(mockFiles, invalidTemplate);

    expect(decodeHTMLEntities(result)).toContain(
      'Missing helper: "invalidHelper"',
    );
  });
});
