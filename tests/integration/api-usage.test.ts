import path from 'node:path';
import fs from 'fs-extra';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { generateMarkdown, processFiles } from '../../src/index';

describe('API Usage', () => {
  const testProjectPath = path.resolve(
    __dirname,
    '..',
    'fixtures',
    'test-project',
  );
  const outputPath = path.join(testProjectPath, 'output.md');
  const originalCustomTemplatePath = path.join(
    testProjectPath,
    '..',
    'custom-template.hbs',
  );
  const customTemplatePath = path.join(
    testProjectPath,
    'custom-template-api.hbs',
  );
  const securityReviewTemplatePath = path.join(
    testProjectPath,
    'security-review-template.hbs',
  );

  beforeAll(async () => {
    // Ensure custom templates exist
    await fs.writeFile(
      customTemplatePath,
      'Custom template: {{projectName}} {{version}}',
    );
    await fs.writeFile(
      securityReviewTemplatePath,
      'Security Review: {{projectName}} {{reviewDate}}',
    );
  });

  afterAll(async () => {
    // Clean up
    await fs.remove(outputPath);
    await fs.remove(customTemplatePath);
    await fs.remove(securityReviewTemplatePath);
  });

  it('should generate a code summary', async () => {
    const files = await processFiles({
      path: testProjectPath,
      filter: ['src/**/*.js', 'src/**/*.ts'],
      exclude: ['**/node_modules/**'],
    });

    const templateContent = await fs.readFile(
      originalCustomTemplatePath,
      'utf-8',
    );

    const markdown = await generateMarkdown(files, templateContent, {
      noCodeblock: false,
      customData: {
        projectName: 'Test Project',
        version: '1.0.0',
      },
    });

    expect(markdown).toContain('Custom Template:');
    expect(markdown).toContain('Test Project');
    expect(markdown).toContain('```javascript');
    expect(markdown).toContain('```typescript');
  });

  it('should generate custom output', async () => {
    const files = await processFiles({
      path: testProjectPath,
      filter: ['src/**/*.js'],
    });

    const customTemplate = await fs.readFile(customTemplatePath, 'utf-8');

    const output = await generateMarkdown(files, customTemplate, {
      customData: {
        projectName: 'Test Project',
        version: '1.0.0',
      },
    });

    expect(output).toBe('Custom template: Test Project 1.0.0');

    await fs.writeFile(outputPath, output);
    const fileContent = await fs.readFile(outputPath, 'utf-8');
    expect(fileContent).toBe('Custom template: Test Project 1.0.0');
  });

  it('should generate a security-focused code review', async () => {
    const files = await processFiles({
      path: testProjectPath,
      filter: ['**/*.js', '**/*.ts', '**/*.php'],
      exclude: ['**/vendor/**', '**/node_modules/**'],
    });

    const templateContent = await fs.readFile(
      securityReviewTemplatePath,
      'utf-8',
    );

    const reviewDate = new Date('2024-01-01').toISOString();
    const markdown = await generateMarkdown(files, templateContent, {
      customData: {
        projectName: 'My Secure Project',
        reviewDate: reviewDate,
      },
      lineNumbers: true,
    });

    expect(markdown).toBe(`Security Review: My Secure Project ${reviewDate}`);

    await fs.writeFile(outputPath, markdown);
    const fileContent = await fs.readFile(outputPath, 'utf-8');
    expect(fileContent).toBe(
      `Security Review: My Secure Project ${reviewDate}`,
    );
  });

  it('should handle errors when processing files', async () => {
    await expect(
      processFiles({
        path: '/non/existent/path',
        filter: ['**/*.js'],
      }),
    ).rejects.toThrow();
  });

  it('should respect file filters', async () => {
    const files = await processFiles({
      path: testProjectPath,
      filter: ['**/*.js'],
      exclude: ['**/*.test.js'],
    });

    const jsFiles = files.filter((file) => file.extension === 'js');
    const tsFiles = files.filter((file) => file.extension === 'ts');
    const testFiles = files.filter((file) => file.path.includes('.test.'));

    expect(jsFiles.length).toBeGreaterThan(0);
    expect(tsFiles.length).toBe(0);
    expect(testFiles.length).toBe(0);
  });
});
