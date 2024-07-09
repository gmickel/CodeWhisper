import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'fs-extra';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  removeTemporaryGitignore,
  setupTemporaryGitignore,
} from '../helpers/gitignore-helper';

describe('CLI Commands', () => {
  const cliPath = path.resolve(__dirname, '..', '..', 'src', 'cli', 'index.ts');
  const testProjectPath = path.resolve(
    __dirname,
    '..',
    'fixtures',
    'test-project',
  );
  const outputPath = path.join(testProjectPath, 'output.md');
  let tempGitignorePath: string;

  beforeAll(async () => {
    tempGitignorePath = await setupTemporaryGitignore(
      testProjectPath,
      '*.log\nnode_modules/\n',
    );
  });

  afterAll(async () => {
    await removeTemporaryGitignore(tempGitignorePath);
    if (await fs.pathExists(outputPath)) {
      await fs.remove(outputPath);
    }
  });

  it('should generate markdown file with default options', () => {
    execSync(
      `bun run ${cliPath} generate -p ${testProjectPath} -o ${outputPath} -g ${tempGitignorePath}`,
      { stdio: 'inherit' },
    );

    const output = fs.readFileSync(outputPath, 'utf-8');
    expect(output).toContain('# Code Summary');
    expect(output).toContain('## Files');
    expect(output).toContain('src/main.js');
    expect(output).toContain('src/utils.ts');
    expect(output).toContain('package.json');
    expect(output).not.toContain('*.log'); // This should be ignored
  });

  // Add more test cases as needed
});
