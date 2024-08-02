import { exec } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import fs from 'fs-extra';
import simpleGit from 'simple-git';
import { vi } from 'vitest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { generateAIResponse } from '../../src/ai/generate-ai-response';
import { reviewPlan } from '../../src/ai/plan-review';
import { cli } from '../../src/cli/index';
import { normalizePath } from '../../src/utils/normalize-path';

const execAsync = promisify(exec);

vi.mock('../../src/ai/generate-ai-response');
vi.mock('../../src/ai/plan-review');

const isCI = process.env.CI === 'true';

async function runCommand(command: string) {
  try {
    const { stdout, stderr } = await execAsync(command, {
      env: { ...process.env, NODE_ENV: 'test' },
      cwd: path.resolve(__dirname, '../..'),
    });
    if (stderr) console.error('Command stderr:', stderr);
    return stdout;
  } catch (error) {
    console.error('Command execution failed:', error);
    throw error;
  }
}

const cliPath = path.resolve(__dirname, '..', '..', 'src', 'cli', 'index.ts');

describe.sequential('CodeWhisper generate E2E Tests', () => {
  const testProjectPath = path.join(
    os.tmpdir(),
    'codewhisper-generate-test-project',
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
    await fs.ensureDir(testProjectPath);
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
    await fs.writeFile(tempGitignorePath, 'todos.md\n');
    await fs.writeFile(tempTodosPath, '# TODOs\n\n- Write tests\n- Fix bugs\n');
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
    await fs.remove(testProjectPath);
  });

  it('should generate markdown respecting .gitignore by default', async () => {
    const command = `pnpm exec esno ${normalizePath(cliPath)} generate -p "${normalizePath(testProjectPath)}" -o "${normalizePath(outputPath)}"`;
    await runCommand(command);
    const output = await fs.readFile(outputPath, 'utf-8');
    expect(output).toContain('# Code Summary');
    expect(output).toContain('## Files');
    expect(output).not.toContain('todos.md');
  }, 30000);

  it('should generate markdown ignoring .gitignore with --no-respect-gitignore', async () => {
    const command = `pnpm exec esno ${normalizePath(cliPath)} generate -p "${normalizePath(testProjectPath)}" -o "${normalizePath(outputPath)}" --no-respect-gitignore`;
    await runCommand(command);
    const output = await fs.readFile(outputPath, 'utf-8');
    expect(output).toContain('# Code Summary');
    expect(output).toContain('## Files');
    expect(output).toContain('todos.md');
  }, 30000);

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
  }, 30000);

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
  }, 30000);

  it('should generate markdown suppressing comments', async () => {
    const command = `pnpm exec esno ${cliPath} generate -p "${normalizePath(testProjectPath)}" -o "${normalizePath(outputPath)}" --suppress-comments`;

    await execAsync(command, {
      env: { ...process.env, NODE_ENV: 'test' },
      cwd: path.resolve(__dirname, '../..'),
    });

    const output = await fs.readFile(outputPath, 'utf-8');

    expect(output).toContain('# Code Summary');
    expect(output).toContain('## Files');
  }, 30000);

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
  }, 30000);

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
  }, 30000);

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

    const commandWithLineNumbers = `pnpm exec esno ${normalizePath(cliPath)} generate -p "${normalizePath(testDir1)}" -o "${normalizePath(outputPath1)}" --line-numbers`;
    const commandWithoutLineNumbers = `pnpm exec esno ${normalizePath(cliPath)} generate -p "${normalizePath(testDir2)}" -o "${normalizePath(outputPath2)}"`;

    await runCommand(commandWithLineNumbers);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await runCommand(commandWithoutLineNumbers);

    const outputWithLineNumbers = await fs.readFile(outputPath1, 'utf-8');
    const outputWithoutLineNumbers = await fs.readFile(outputPath2, 'utf-8');

    expect(outputWithLineNumbers).toContain('1 const x = 1;');
    expect(outputWithLineNumbers).toContain('2 const y = 2;');
    expect(outputWithLineNumbers).toContain('3 console.log(x + y);');
    expect(outputWithoutLineNumbers).not.toContain('1 const x = 1;');
    expect(outputWithoutLineNumbers).toContain('const x = 1;');
  }, 60000);
});

describe.sequential('CodeWhisper Task E2E Tests', async () => {
  const testProjectRoot = path.join(os.tmpdir(), 'codewhisper-test-projects');
  const taskProjectPath = path.join(testProjectRoot, 'task-test-project');

  beforeEach(() => {
    vi.resetAllMocks();
  });

  beforeAll(async () => {
    await fs.ensureDir(taskProjectPath);
    await fs.writeFile(
      path.join(taskProjectPath, 'main.js'),
      'console.log("Hello World");',
    );
    await fs.writeFile(
      path.join(taskProjectPath, 'utils.js'),
      'function add(a, b) { return a + b; }',
    );

    const git = simpleGit(taskProjectPath);
    await git.init();
    await git.addConfig('user.name', 'Test User', false, 'local');
    await git.addConfig('user.email', 'test@example.com', false, 'local');
    await git.add('.');
    await git.commit('Initial commit');
  });

  afterAll(async () => {
    await fs.remove(taskProjectPath);
  });

  it.skipIf(isCI)(
    'should execute a CodeWhisper task and apply changes',
    async () => {
      // Mock AI responses
      vi.mocked(generateAIResponse)
        .mockResolvedValueOnce('Generated plan') // For planning step
        .mockResolvedValueOnce(`
        <file_list>
        main.js
        utils.js
        </file_list>
        <file>
        <file_path>main.js</file_path>
        <file_content language="javascript">
        console.log("Hello, CodeWhisper!");
        </file_content>
        <file_status>modified</file_status>
        </file>
        <file>
        <file_path>utils.js</file_path>
        <file_content language="javascript">
        function add(a, b) { return a + b; }
        function subtract(a, b) { return a - b; }
        </file_content>
        <file_status>modified</file_status>
        </file>
        <git_branch_name>feature/codewhisper-task</git_branch_name>
        <git_commit_message>Implement CodeWhisper task changes</git_commit_message>
        <summary>Updated main.js and added subtract function to utils.js</summary>
        <potential_issues>None</potential_issues>
      `); // For code generation step

      // Mock the reviewPlan function
      vi.mocked(reviewPlan).mockResolvedValue('Reviewed plan');

      const mainJsPath = path.relative(
        taskProjectPath,
        path.join(taskProjectPath, 'main.js'),
      );
      const utilsJsPath = path.relative(
        taskProjectPath,
        path.join(taskProjectPath, 'utils.js'),
      );

      // Run the CLI command
      process.argv = [
        'node',
        'codewhisper',
        'task',
        '-p',
        taskProjectPath,
        '-m',
        'claude-3-5-sonnet-20240620',
        '-t',
        'Update greeting and add subtract function',
        '-d',
        'Modify main.js to use a different greeting and add a subtract function to utils.js',
        '-i',
        'No further instructions',
        '--auto-commit',
        '-c',
        mainJsPath,
        utilsJsPath,
      ];

      await cli(process.argv.slice(2));

      // Add a small delay to ensure all async operations complete
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Verify changes were applied
      const [mainContent, utilsContent] = await Promise.all([
        fs.readFile(path.join(taskProjectPath, 'main.js'), 'utf-8'),
        fs.readFile(path.join(taskProjectPath, 'utils.js'), 'utf-8'),
      ]);

      expect(mainContent).toContain('Hello, CodeWhisper!');
      expect(utilsContent).toContain('function subtract(a, b)');

      // Verify git operations
      const simpleGit = (await import('simple-git')).default;
      const git = simpleGit(taskProjectPath);

      const [branches, lastCommit] = await Promise.all([
        git.branch(),
        git.log({ maxCount: 1 }),
      ]);

      expect(branches.all).toContain('feature/codewhisper-task');

      expect(lastCommit.latest?.message).toBe(
        'Implement CodeWhisper task changes',
      );

      // Verify that mocks were called
      expect(generateAIResponse).toHaveBeenCalledTimes(2);
      expect(reviewPlan).toHaveBeenCalledTimes(1);
    },
    60000,
  );
});
