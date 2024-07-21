import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'fs-extra';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { normalizePath } from '../../src/utils/normalize-path';

describe('CLI Commands', () => {
  const cliPath = path.resolve(__dirname, '../../cli.js');
  const testProjectPath = path.resolve(__dirname, '../fixtures/test-project');
  const outputPath = path.join(testProjectPath, 'output.md');
  const tempGitignorePath = path.join(testProjectPath, '.gitignore');
  const tempTodosPath = path.join(testProjectPath, 'todos.md');
  const customTemplatePath = path.join(testProjectPath, 'custom-template.hbs');
  const customReadmeTemplatePath = path.join(
    testProjectPath,
    '..',
    'generate-readme.hbs',
  );

  beforeAll(async () => {
    // Ensure .gitignore and todos.md exists
    await fs.writeFile(tempGitignorePath, 'todos.md\n');
    await fs.writeFile(tempTodosPath, '# TODOs\n\n- Write tests\n- Fix bugs\n');

    // Ensure custom template exists
    await fs.writeFile(
      customTemplatePath,
      '# Custom Template\n\n{{#each files}}{{this.path}}\n{{/each}}',
    );
  });

  afterAll(async () => {
    // Clean up
    await fs.remove(tempGitignorePath);
    await fs.remove(tempTodosPath);
    await fs.remove(outputPath);
    await fs.remove(customTemplatePath);
  });

  it('should generate markdown respecting .gitignore by default', () => {
    try {
      const command = `pnpm exec esno ${cliPath} generate -p "${normalizePath(testProjectPath)}" -o "${normalizePath(outputPath)}"`;

      execSync(command, {
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'test' },
        cwd: path.resolve(__dirname, '../..'), // Set working directory to project root
      });

      const output = fs.readFileSync(outputPath, 'utf-8');

      expect(output).toContain('# Code Summary');
      expect(output).toContain('## Files');
      expect(output).not.toContain('todos.md'); // This should be ignored by default
    } catch (error) {
      console.error('Error executing command:', error);
      throw error;
    }
  });

  it('should generate markdown ignoring .gitignore with --no-respect-gitignore', () => {
    try {
      const command = `pnpm exec esno ${cliPath} generate -p "${normalizePath(testProjectPath)}" -o "${normalizePath(outputPath)}" --no-respect-gitignore`;

      execSync(command, {
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'test' },
        cwd: path.resolve(__dirname, '../..'), // Set working directory to project root
      });

      const output = fs.readFileSync(outputPath, 'utf-8');

      expect(output).toContain('# Code Summary');
      expect(output).toContain('## Files');
      expect(output).toContain('todos.md'); // This should be included as --no-respect-gitignore is used
    } catch (error) {
      console.error('Error executing command:', error);
      throw error;
    }
  });

  it('should generate markdown with custom template', () => {
    try {
      const command = `pnpm exec esno ${cliPath} generate -p "${normalizePath(testProjectPath)}" -o "${normalizePath(outputPath)}" --custom-template "${normalizePath(customTemplatePath)}"`;

      execSync(command, {
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'test' },
        cwd: path.resolve(__dirname, '../..'), // Set working directory to project root
      });

      const output = fs.readFileSync(outputPath, 'utf-8');

      expect(output).toContain('# Custom Template');
      expect(output).toContain(normalizePath('custom-template.hbs'));
      expect(output).toContain('package.json');
    } catch (error) {
      console.error('Error executing command:', error);
      throw error;
    }
  });

  it('should generate markdown applying filters and excludes', () => {
    try {
      const command = `pnpm exec esno ${cliPath} generate -p "${normalizePath(testProjectPath)}" -o "${normalizePath(outputPath)}" --filter "**/*.js" --exclude "**/main.js" --no-respect-gitignore`;

      execSync(command, {
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'test' },
        cwd: path.resolve(__dirname, '../..'), // Set working directory to project root
      });

      const output = fs.readFileSync(outputPath, 'utf-8');

      expect(output).toContain('# Code Summary');
      expect(output).toContain('## Files');
      expect(output).not.toContain('utils.ts'); // Filter includes all .js files
      expect(output).not.toContain('main.js'); // Exclude explicitly excludes main.js
      expect(output).not.toContain('todos.md'); // Excluded by default .gitignore behaviour
    } catch (error) {
      console.error('Error executing command:', error);
      throw error;
    }
  });

  it('should generate markdown suppressing comments', () => {
    try {
      const command = `pnpm exec esno ${cliPath} generate -p "${normalizePath(testProjectPath)}" -o "${normalizePath(outputPath)}" --suppress-comments`;

      execSync(command, {
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'test' },
        cwd: path.resolve(__dirname, '../..'), // Set working directory to project root
      });

      const output = fs.readFileSync(outputPath, 'utf-8');

      expect(output).toContain('# Code Summary');
      expect(output).toContain('## Files');
      // Assuming some files have comments which should be suppressed
      // No easy way to test suppression unless checking before vs after content
    } catch (error) {
      console.error('Error executing command:', error);
      throw error;
    }
  });

  it('should generate markdown using a specific cache path', () => {
    const customCachePath = path.join(testProjectPath, 'custom-cache.json');

    try {
      const command = `pnpm exec esno ${cliPath} generate -p "${normalizePath(testProjectPath)}" -o "${normalizePath(outputPath)}" --cache-path "${normalizePath(customCachePath)}"`;

      execSync(command, {
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'test' },
        cwd: path.resolve(__dirname, '../..'), // Set working directory to project root
      });

      const output = fs.readFileSync(outputPath, 'utf-8');

      expect(output).toContain('# Code Summary');
      expect(output).toContain('## Files');

      // Check that custom cache path exists
      expect(fs.existsSync(customCachePath)).toBe(true);
    } catch (error) {
      console.error('Error executing command:', error);
      throw error;
    } finally {
      // Clean up custom cache path
      fs.removeSync(customCachePath);
    }
  });
  it('should generate markdown with custom data and prompt', () => {
    const customData = JSON.stringify({
      projectName: 'My Awesome Project',
      projectDescription: 'A fantastic tool for developers',
    });
    const customPrompt = 'Please review this code and provide feedback.';

    const command = `pnpm exec esno ${cliPath} generate -p "${testProjectPath}" -o "${outputPath}" --custom-template "${normalizePath(customReadmeTemplatePath)}" --custom-data '${customData}' --prompt "${customPrompt}"`;

    execSync(command, {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'test' },
      cwd: path.resolve(__dirname, '../..'), // Set working directory to project root
    });

    const output = fs.readFileSync(outputPath, 'utf-8');

    expect(output).toContain('<h1 align="center">My Awesome Project</h1>');
    expect(output).toContain('A fantastic tool for developers');
    expect(output).toContain('## Your Task');
    expect(output).toContain('Please review this code and provide feedback.');
  });
});
