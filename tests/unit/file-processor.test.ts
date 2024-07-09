import path from 'node:path';
import fs from 'fs-extra';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { processFiles } from '../../src/core/file-processor';
import {
  removeTemporaryGitignore,
  setupTemporaryGitignore,
} from '../helpers/gitignore-helper';

describe('processFiles', () => {
  const fixturesPath = path.resolve(
    __dirname,
    '..',
    'fixtures',
    'test-project',
  );
  let tempGitignorePath: string;

  beforeAll(async () => {
    tempGitignorePath = await setupTemporaryGitignore(
      fixturesPath,
      '*.log\nnode_modules/\n',
    );
  });

  afterAll(async () => {
    await removeTemporaryGitignore(tempGitignorePath);
  });

  it('should process files correctly', async () => {
    const result = await processFiles({
      path: fixturesPath,
      gitignorePath: tempGitignorePath,
    });

    // Sort the result by path for consistent ordering in tests
    result.sort((a, b) => a.path.localeCompare(b.path));

    expect(result).toHaveLength(3); // Assuming we have 3 files in our fixture

    expect(result[0].path).toContain('package.json');
    expect(result[1].path).toContain('src/main.js');
    expect(result[2].path).toContain('src/utils.ts');

    // Check content of a file
    const mainJsContent = await fs.readFile(
      path.join(fixturesPath, 'src', 'main.js'),
      'utf-8',
    );
    expect(result[1].content).toBe(mainJsContent);

    // Check that .gitignore is working
    const ignoredFiles = result.filter((file) => file.path.endsWith('.log'));
    expect(ignoredFiles).toHaveLength(0);

    // Check file properties
    expect(result[0].size).toBeGreaterThan(0);
    expect(result[0].created).toBeInstanceOf(Date);
    expect(result[0].modified).toBeInstanceOf(Date);
  });

  it('should respect custom ignore patterns', async () => {
    const result = await processFiles({
      path: fixturesPath,
      gitignorePath: tempGitignorePath,
      customIgnores: ['*.js'],
    });

    const jsFiles = result.filter((file) => file.path.endsWith('.js'));
    expect(jsFiles).toHaveLength(0);
  });
});
