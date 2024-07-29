import { exec } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import fs from 'fs-extra';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { normalizePath } from '../../src/utils/normalize-path';

const execAsync = promisify(exec);

describe('CLI Commands', () => {
  const cliPath = path.resolve(__dirname, '..', '..', 'src', 'cli', 'index.ts');
  const testProjectPath = path.join(
    os.tmpdir(),
    'codewhisper-cli-test-project',
  );
  const outputPath = path.join(testProjectPath, 'output.md');
  const tempGitignorePath = path.join(testProjectPath, '.gitignore');
  const tempTodosPath = path.join(testProjectPath, 'todos.md');
  const customTemplatePath = path.join(
    testProjectPath,
    'custom-template-e2e.hbs',
  );
  const customReadmeTemplatePath = path.join(
    testProjectPath,
    'generate-readme.hbs',
  );

  beforeAll(async () => {
    // Create test project directory
    await fs.ensureDir(testProjectPath);

    // Create test files
    await fs.writeFile(
      path.join(testProjectPath, 'main.js'),
      'console.log("Hello World");',
    );
    await fs.writeFile(
      path.join(testProjectPath, 'utils.ts'),
      'export const add = (a: number, b: number) => a + b;',
    );
    await fs.writeFile(
      path.join(testProjectPath, 'package.json'),
      '{"name": "test-project", "version": "1.0.0"}',
    );

    // Ensure .gitignore and todos.md exists
    await fs.writeFile(tempGitignorePath, 'todos.md\n');
    await fs.writeFile(tempTodosPath, '# TODOs\n\n- Write tests\n- Fix bugs\n');

    // Ensure custom templates exist
    await fs.writeFile(
      customTemplatePath,
      '# Custom Template\n\n{{#each files}}{{this.path}}\n{{/each}}',
    );
    await fs.writeFile(
      customReadmeTemplatePath,
      '<h1 align="center">{{projectName}}</h1>\n\n{{projectDescription}}\n\n## Your Task\n\n{{prompt}}',
    );
  });

  afterAll(async () => {
    // Clean up the entire test project directory
    await fs.remove(testProjectPath);
  });

  it('should generate markdown respecting .gitignore by default', async () => {
    const command = `pnpm exec esno ${cliPath} generate -p "${normalizePath(testProjectPath)}" -o "${normalizePath(outputPath)}"`;

    await execAsync(command, {
      env: { ...process.env, NODE_ENV: 'test' },
      cwd: path.resolve(__dirname, '../..'),
    });

    const output = await fs.readFile(outputPath, 'utf-8');

    expect(output).toContain('# Code Summary');
    expect(output).toContain('## Files');
    expect(output).not.toContain('todos.md');
  });

  it('should generate markdown ignoring .gitignore with --no-respect-gitignore', async () => {
    const command = `pnpm exec esno ${cliPath} generate -p "${normalizePath(testProjectPath)}" -o "${normalizePath(outputPath)}" --no-respect-gitignore`;

    await execAsync(command, {
      env: { ...process.env, NODE_ENV: 'test' },
      cwd: path.resolve(__dirname, '../..'),
    });

    const output = await fs.readFile(outputPath, 'utf-8');

    expect(output).toContain('# Code Summary');
    expect(output).toContain('## Files');
    expect(output).toContain('todos.md');
  });

  it('should generate markdown with custom template', async () => {
    const command = `pnpm exec esno ${cliPath} generate -p "${normalizePath(testProjectPath)}" -o "${normalizePath(outputPath)}" --custom-template "${normalizePath(customTemplatePath)}"`;

    await execAsync(command, {
      env: { ...process.env, NODE_ENV: 'test' },
      cwd: path.resolve(__dirname, '../..'),
    });

    const output = await fs.readFile(outputPath, 'utf-8');

    expect(output).toContain('# Custom Template');
    expect(output).toContain(normalizePath('custom-template-e2e.hbs'));
    expect(output).toContain('package.json');
  });

  it('should generate markdown applying filters and excludes', async () => {
    const command = `pnpm exec esno ${cliPath} generate -p "${normalizePath(testProjectPath)}" -o "${normalizePath(outputPath)}" --filter "**/*.js" --exclude "**/main.js" --no-respect-gitignore`;

    await execAsync(command, {
      env: { ...process.env, NODE_ENV: 'test' },
      cwd: path.resolve(__dirname, '../..'),
    });

    const output = await fs.readFile(outputPath, 'utf-8');

    expect(output).toContain('# Code Summary');
    expect(output).toContain('## Files');
    expect(output).not.toContain('utils.ts');
    expect(output).not.toContain('main.js');
    expect(output).not.toContain('todos.md');
  });

  it('should generate markdown suppressing comments', async () => {
    const command = `pnpm exec esno ${cliPath} generate -p "${normalizePath(testProjectPath)}" -o "${normalizePath(outputPath)}" --suppress-comments`;

    await execAsync(command, {
      env: { ...process.env, NODE_ENV: 'test' },
      cwd: path.resolve(__dirname, '../..'),
    });

    const output = await fs.readFile(outputPath, 'utf-8');

    expect(output).toContain('# Code Summary');
    expect(output).toContain('## Files');
  });

  it('should generate markdown using a specific cache path', async () => {
    const customCachePath = path.join(testProjectPath, 'custom-cache.json');

    const command = `pnpm exec esno ${cliPath} generate -p "${normalizePath(testProjectPath)}" -o "${normalizePath(outputPath)}" --cache-path "${normalizePath(customCachePath)}"`;

    await execAsync(command, {
      env: { ...process.env, NODE_ENV: 'test' },
      cwd: path.resolve(__dirname, '../..'),
    });

    const output = await fs.readFile(outputPath, 'utf-8');

    expect(output).toContain('# Code Summary');
    expect(output).toContain('## Files');

    expect(await fs.pathExists(customCachePath)).toBe(true);

    // Clean up custom cache path
    await fs.remove(customCachePath);
  });

  it('should generate markdown with custom data and prompt', async () => {
    const customData = JSON.stringify({
      projectName: 'My Awesome Project',
      projectDescription: 'A fantastic tool for developers',
    });
    const customPrompt = 'Please review this code and provide feedback.';

    const command = [
      'pnpm',
      'exec',
      'esno',
      normalizePath(cliPath),
      'generate',
      '-p',
      `"${normalizePath(testProjectPath)}"`,
      '-o',
      `"${normalizePath(outputPath)}"`,
      '--custom-template',
      `"${normalizePath(customReadmeTemplatePath)}"`,
      '--custom-data',
      process.platform === 'win32'
        ? `"${customData.replace(/"/g, '\\"')}"`
        : `'${customData}'`,
      '--prompt',
      `"${customPrompt}"`,
    ].join(' ');

    await execAsync(command, {
      env: { ...process.env, NODE_ENV: 'test' },
      cwd: path.resolve(__dirname, '../..'),
    });

    const output = await fs.readFile(outputPath, 'utf-8');

    expect(output).toContain('<h1 align="center">My Awesome Project</h1>');
    expect(output).toContain('A fantastic tool for developers');
    expect(output).toContain('## Your Task');
    expect(output).toContain('Please review this code and provide feedback.');
  });

  it('should generate markdown with line numbers when --line-numbers flag is used', async () => {
    const testDir1 = path.join(testProjectPath, 'test-project-1');
    const testDir2 = path.join(testProjectPath, 'test-project-2');

    await fs.ensureDir(testDir1);
    await fs.ensureDir(testDir2);

    const testFile1 = path.join(testDir1, 'test-file.js');
    const testFile2 = path.join(testDir2, 'test-file.js');

    await fs.writeFile(
      testFile1,
      'const x = 1;\nconst y = 2;\nconsole.log(x + y);',
    );
    await fs.writeFile(
      testFile2,
      'const x = 1;\nconst y = 2;\nconsole.log(x + y);',
    );

    const outputPath1 = path.join(testDir1, 'output-with-line-numbers.md');
    const outputPath2 = path.join(testDir2, 'output-without-line-numbers.md');

    const commandWithLineNumbers = `pnpm exec esno ${cliPath} generate -p "${normalizePath(testDir1)}" -o "${normalizePath(outputPath1)}" --line-numbers`;
    const commandWithoutLineNumbers = `pnpm exec esno ${cliPath} generate -p "${normalizePath(testDir2)}" -o "${normalizePath(outputPath2)}"`;

    await execAsync(commandWithLineNumbers, {
      env: { ...process.env, NODE_ENV: 'test' },
      cwd: path.resolve(__dirname, '../..'),
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));

    await execAsync(commandWithoutLineNumbers, {
      env: { ...process.env, NODE_ENV: 'test' },
      cwd: path.resolve(__dirname, '../..'),
    });

    const outputWithLineNumbers = await fs.readFile(outputPath1, 'utf-8');
    const outputWithoutLineNumbers = await fs.readFile(outputPath2, 'utf-8');

    expect(outputWithLineNumbers).toContain('1 const x = 1;');
    expect(outputWithLineNumbers).toContain('2 const y = 2;');
    expect(outputWithLineNumbers).toContain('3 console.log(x + y);');

    expect(outputWithoutLineNumbers).not.toContain('1 const x = 1;');
    expect(outputWithoutLineNumbers).toContain('const x = 1;');
  }, 30000);
});
