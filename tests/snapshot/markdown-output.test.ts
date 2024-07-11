import path from 'node:path';
import fs from 'fs-extra';
import { describe, expect, it } from 'vitest';
import { type FileInfo, processFiles } from '../../src/core/file-processor';
import { generateMarkdown } from '../../src/core/markdown-generator';

const joinPath = (pathname: string) =>
  new URL(pathname, import.meta.url).pathname;

describe('Markdown Output', () => {
  const fixturesPath = joinPath('../fixtures');
  const customTemplatePath = path.join(fixturesPath, 'custom-template.hbs');
  const defaultTemplatePath = path.join(fixturesPath, 'default.hbs');
  const testDir = path.join(fixturesPath, 'test-project');

  async function readTemplateContent(templatePath: string): Promise<string> {
    return await fs.readFile(templatePath, 'utf-8');
  }

  async function getProcessedFiles(directory: string) {
    return await processFiles({ path: directory });
  }

  async function generateMarkdownContent(
    files: FileInfo[],
    templateContent: string,
    options: Record<string, unknown>,
  ) {
    return await generateMarkdown(files, templateContent, {
      ...options,
      basePath: (options.basePath as string) || testDir,
    });
  }

  it('should match snapshot for default template', async () => {
    const files = await getProcessedFiles(testDir);
    const defaultTemplateContent =
      await readTemplateContent(defaultTemplatePath);

    const markdown = await generateMarkdownContent(
      files,
      defaultTemplateContent,
      {},
    );

    expect(markdown).toMatchSnapshot();
  });

  it('should match snapshot for custom template with custom data', async () => {
    const files = await getProcessedFiles(testDir);
    const customTemplateContent = await readTemplateContent(customTemplatePath);

    const markdownWithCustomData = await generateMarkdownContent(
      files,
      customTemplateContent,
      {
        customData: { title: 'Snapshot Test Project', version: '1.0.0' },
      },
    );

    expect(markdownWithCustomData).toMatchSnapshot();
  });

  it('should match snapshot for default template with additional custom data', async () => {
    const files = await getProcessedFiles(testDir);
    const defaultTemplateContent =
      await readTemplateContent(defaultTemplatePath);

    const markdownWithCustomData = await generateMarkdownContent(
      files,
      defaultTemplateContent,
      {
        customData: { key: 'value', another: 'data point' },
      },
    );

    expect(markdownWithCustomData).toMatchSnapshot();
  });
});
