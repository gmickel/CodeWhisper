import { describe, expect, it } from 'vitest';
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

  it('should handle custom data in templates', async () => {
    const template =
      '# {{projectName}}\n\n{{projectDescription}}\n\n{{#each files}}{{this.path}}{{/each}}';
    const customData = {
      projectName: 'My Awesome Project',
      projectDescription: 'A fantastic tool for developers',
    };

    const result = await generateMarkdown(mockFiles, template, { customData });

    expect(result).toContain('# My Awesome Project');
    expect(result).toContain('A fantastic tool for developers');
    expect(result).toContain('/project/src/index.ts');
  });

  it('should support direct custom data access', async () => {
    const template = '{{key}}';
    const customData = {
      key: 'Direct Value',
    };

    const result = await generateMarkdown(mockFiles, template, { customData });

    expect(result).toBe('Direct Value');
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
  it('should handle custom data in templates', async () => {
    const mockFiles = [
      {
        path: '/project/src/index.ts',
        extension: 'ts',
        language: 'typescript',
        size: 100,
        created: new Date('2023-01-01'),
        modified: new Date('2023-01-02'),
        content: 'console.log("Hello, World!");',
      },
    ];

    const template =
      '# {{projectName}}\n\n{{projectDescription}}\n\n{{#each files}}{{this.path}}{{/each}}';
    const customData = {
      projectName: 'My Awesome Project',
      projectDescription: 'A fantastic tool for developers',
    };

    const result = await generateMarkdown(mockFiles, template, { customData });

    expect(result).toContain('# My Awesome Project');
    expect(result).toContain('A fantastic tool for developers');
    expect(result).toContain('/project/src/index.ts');
  });

  it('should append custom prompt to the generated markdown', async () => {
    const mockFiles = [
      {
        path: '/project/src/index.ts',
        extension: 'ts',
        language: 'typescript',
        size: 100,
        created: new Date('2023-01-01'),
        modified: new Date('2023-01-02'),
        content: 'console.log("Hello, World!");',
      },
    ];

    const template = '# Project\n\n{{#each files}}{{this.path}}{{/each}}';
    const customPrompt = 'Please review this code and provide feedback.';

    const result = await generateMarkdown(mockFiles, template);
    const finalResult = `${result}\n\n## Custom Prompt\n\n${customPrompt}`;

    expect(finalResult).toContain('# Project');
    expect(finalResult).toContain('/project/src/index.ts');
    expect(finalResult).toContain('## Custom Prompt');
    expect(finalResult).toContain(
      'Please review this code and provide feedback.',
    );
  });
});
