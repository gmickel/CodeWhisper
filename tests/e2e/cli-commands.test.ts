import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'fs-extra';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('CLI Commands', () => {
  const cliPath = path.resolve(__dirname, '../../cli.js');
  const testProjectPath = path.resolve(__dirname, '../fixtures/test-project');
  const outputPath = path.join(testProjectPath, 'output.md');
  const tempGitignorePath = path.join(testProjectPath, '.gitignore');

  beforeAll(async () => {
    // Ensure .gitignore exists
    await fs.writeFile(tempGitignorePath, '*.log\n');
  });

  afterAll(async () => {
    // Clean up
    await fs.remove(tempGitignorePath);
    await fs.remove(outputPath);
  });

  it('should generate markdown file with default options', () => {
    try {
      const command = `pnpm exec esno ${cliPath} generate -p "${testProjectPath}" -o "${outputPath}" -g "${tempGitignorePath}"`;

      execSync(command, {
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'test' },
        cwd: path.resolve(__dirname, '../..'), // Set working directory to project root
      });

      const output = fs.readFileSync(outputPath, 'utf-8');

      expect(output).toContain('# Code Summary');
      expect(output).toContain('## Files');
      expect(output).toContain('src/main.js');
      expect(output).toContain('src/utils.ts');
      expect(output).toContain('package.json');
      expect(output).not.toContain('*.log'); // This should be ignored
    } catch (error) {
      console.error('Error executing command:', error);
      throw error;
    }
  });
});
