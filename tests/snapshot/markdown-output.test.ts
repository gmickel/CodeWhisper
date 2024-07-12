import path from 'node:path';
import fs from 'fs-extra';
import { beforeAll, describe, expect, it } from 'vitest';
import { type FileInfo, processFiles } from '../../src/core/file-processor';
import { generateMarkdown } from '../../src/core/markdown-generator';

const joinPath = (pathname: string) =>
  new URL(pathname, import.meta.url).pathname;

describe('Markdown Output', () => {
  const fixturesPath = joinPath('../fixtures');
  const customTemplatePath = path.join(fixturesPath, 'custom-template.hbs');
  const defaultTemplatePath = path.join(fixturesPath, 'default.hbs');
  const testDir = path.join(fixturesPath, 'test-project');

  let processedFiles: FileInfo[];
  let defaultTemplateContent: string;
  let customTemplateContent: string;

  beforeAll(async () => {
    processedFiles = await processFiles({ path: testDir });
    defaultTemplateContent = await fs.readFile(defaultTemplatePath, 'utf-8');
    customTemplateContent = await fs.readFile(customTemplatePath, 'utf-8');
  });

  async function generateMarkdownContent(
    templateContent: string,
    options: Record<string, unknown> = {},
  ) {
    return await generateMarkdown(processedFiles, templateContent, {
      ...options,
      basePath: testDir,
    });
  }

  // Custom snapshot serializer
  expect.addSnapshotSerializer({
    test: (val) => typeof val === 'string',
    print: (val) => {
      const str = val as string;
      // Replace the actual test directory path with a placeholder
      let normalizedStr = str.replace(
        new RegExp(testDir.replace(/\\/g, '\\\\'), 'g'),
        '[TEST_DIR]',
      );

      // Unescape HTML entities
      normalizedStr = normalizedStr
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');

      return normalizedStr;
    },
  });

  it('should match snapshot for default template', async () => {
    const markdown = await generateMarkdownContent(defaultTemplateContent);
    expect(markdown).toMatchSnapshot();
  });

  it('should match snapshot for custom template with custom data', async () => {
    const markdown = await generateMarkdownContent(customTemplateContent, {
      customData: { title: 'Snapshot Test Project', version: '1.0.0' },
    });
    expect(markdown).toMatchSnapshot();
  });

  it('should match snapshot for default template with no codeblocks', async () => {
    const markdown = await generateMarkdownContent(defaultTemplateContent, {
      noCodeblock: true,
    });
    expect(markdown).toMatchSnapshot();
  });

  it('should match snapshot for custom template with additional custom data', async () => {
    const markdown = await generateMarkdownContent(customTemplateContent, {
      customData: {
        title: 'Extended Snapshot Test',
        version: '2.0.0',
        author: 'Test Author',
        description: 'This is a test project for snapshot testing',
      },
    });
    expect(markdown).toMatchSnapshot();
  });

  it('should match snapshot for custom template with empty custom data', async () => {
    const markdown = await generateMarkdownContent(customTemplateContent, {
      customData: {},
    });
    expect(markdown).toMatchSnapshot();
  });
});
