import path from 'node:path';
import fs from 'fs-extra';
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

describe('Markdown Generation Integration', () => {
  const fixturesPath = path.resolve(__dirname, '../fixtures');
  const customTemplatePath = path.join(fixturesPath, 'custom-template.hbs');
  const defaultTemplatePath = path.join(fixturesPath, 'default.hbs');

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

  it('should generate markdown with default template', async () => {
    const defaultTemplateContent = await fs.readFile(
      defaultTemplatePath,
      'utf-8',
    );
    const result = await generateMarkdown(mockFiles, defaultTemplateContent, {
      basePath: '/project',
    });

    expect(result).toContain('# Code Summary');
    expect(result).toContain('## Files');
    expect(result).toContain('src/index.ts');
    expect(result).toContain('README.md');
    expect(result).toContain('Language: typescript');
    expect(result).toContain('Language: markdown');
    expect(result).toContain(
      '```typescript\nconsole.log("Hello, World!");\n```',
    );
    expect(result).toContain('```markdown\n# Project README\n```');
  });

  it('should use custom template when provided', async () => {
    const customTemplateContent = await fs.readFile(
      customTemplatePath,
      'utf-8',
    );
    const result = await generateMarkdown(mockFiles, customTemplateContent, {
      basePath: '/project',
      customData: { title: 'Test Project', version: '1.0.0' },
    });

    expect(result).toContain('# Custom Template: Test Project');
    expect(result).toContain('## Project Overview');
    expect(result).toContain('This project contains 2 file(s).');
    expect(result).toContain('## File Listing');
    expect(result).toContain('### /project/src/index.ts');
    expect(result).toContain('### /project/README.md');
    expect(result).toContain('- **Language:** typescript');
    expect(result).toContain('- **Language:** markdown');
    expect(result).toContain('- **Size:** 100 bytes');
    expect(result).toContain('- **Size:** 50 bytes');
    expect(result).toContain('- **Last Modified:**');
    expect(result).toContain('#### Content Preview:');
    expect(decodeHTMLEntities(result)).toContain(
      '```typescript\nconsole.log("Hello, World!");\n```',
    );
    expect(result).toContain('```markdown\n# Project README\n```');
    expect(result).toContain('## Custom Data');
    expect(result).toContain('Custom data provided:');
    expect(result).toContain('- title: Test Project');
    expect(result).toContain('- version: 1.0.0');
    expect(result).toContain('## Generated on:');
  });

  it('should include custom data in template context', async () => {
    const customTemplateContent = await fs.readFile(
      customTemplatePath,
      'utf-8',
    );
    const result = await generateMarkdown(mockFiles, customTemplateContent, {
      basePath: '/project',
      customData: { key: 'value', another: 'data point' },
    });

    expect(result).toContain('## Custom Data');
    expect(result).toContain('Custom data provided:');
    expect(result).toContain('- key: value');
    expect(result).toContain('- another: data point');
  });

  it('should handle case when no custom data is provided', async () => {
    const customTemplateContent = await fs.readFile(
      customTemplatePath,
      'utf-8',
    );
    const result = await generateMarkdown(mockFiles, customTemplateContent, {
      basePath: '/project',
    });

    expect(result).toContain('# Custom Template: Untitled Project');
    expect(result).toContain('## Custom Data');
    expect(result).toContain('No custom data provided.');
    expect(result).not.toContain('Custom data provided:');
  });

  it('should handle case when empty custom data object is provided', async () => {
    const customTemplateContent = await fs.readFile(
      customTemplatePath,
      'utf-8',
    );
    const result = await generateMarkdown(mockFiles, customTemplateContent, {
      basePath: '/project',
      customData: {},
    });

    expect(result).toContain('# Custom Template: Untitled Project');
    expect(result).toContain('## Custom Data');
    expect(result).toContain('No custom data provided.');
    expect(result).not.toContain('Custom data provided:');
  });

  it('should handle case when custom data is provided', async () => {
    const customTemplateContent = await fs.readFile(
      customTemplatePath,
      'utf-8',
    );
    const result = await generateMarkdown(mockFiles, customTemplateContent, {
      basePath: '/project',
      customData: { title: 'My Project', version: '1.0.0' },
    });

    expect(result).toContain('# Custom Template: My Project');
    expect(result).toContain('## Custom Data');
    expect(result).toContain('Custom data provided:');
    expect(result).toContain('- title: My Project');
    expect(result).toContain('- version: 1.0.0');
  });

  it('should handle invalid template content gracefully', async () => {
    const invalidTemplateContent =
      '{{# each files}}{{invalidHelper this.content}}{{/each}}';

    const result = await generateMarkdown(mockFiles, invalidTemplateContent, {
      basePath: '/project',
    });

    expect(decodeHTMLEntities(result)).toContain(
      'Missing helper: "invalidHelper"',
    );
  });
});
