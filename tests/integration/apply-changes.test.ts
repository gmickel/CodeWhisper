import os from 'node:os';
import path from 'node:path';
import fs from 'fs-extra';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { applyChanges } from '../../src/ai/apply-changes';
import type { AIParsedResponse } from '../../src/types';

describe('apply-changes integration', () => {
  const fixturesPath = path.join(__dirname, '..', 'fixtures', 'applyChanges');
  const tempPath = path.join(os.tmpdir(), 'temp');
  let parsedResponse: AIParsedResponse;

  beforeEach(async () => {
    const loadedData = await fs.readJSON(
      path.join(fixturesPath, 'parsedResponse.json'),
    );
    parsedResponse = loadedData.parsedResponse;

    if (!Array.isArray(parsedResponse.files)) {
      throw new Error('parsedResponse.files is not an array');
    }

    await fs.copy(path.join(fixturesPath, 'src'), path.join(tempPath, 'src'));
  });

  afterEach(async () => {
    await fs.remove(tempPath);
  });

  it('should apply changes correctly to multiple files', async () => {
    await applyChanges({
      basePath: tempPath,
      parsedResponse,
      dryRun: false,
    });

    // Check if files were modified correctly
    for (const file of parsedResponse.files) {
      const filePath = path.join(tempPath, file.path);

      switch (file.status) {
        case 'modified': {
          const content = await fs.readFile(filePath, 'utf-8');
          if (file.path.includes('logger.ts')) {
            expect(content).toContain('export interface LoggerOptions');
            expect(content).toContain(
              "logLevel: 'error' | 'warn' | 'info' | 'debug'",
            );
          }
          if (file.path.includes('index.ts')) {
            expect(content).toContain(
              "logLevel?: 'error' | 'warn' | 'info' | 'debug'",
            );
          }
          if (file.path.includes('task-workflow.ts')) {
            expect(content).toContain(
              'const logger = getLogger(loggerOptions)',
            );
            expect(content).toContain(
              "logger.info(`Using ${options.diff ? 'diff' : 'whole-file'} editing mode`);",
            );
          }
          break;
        }
        case 'new':
          expect(await fs.pathExists(filePath)).toBe(true);
          if (file.path.includes('new-file.ts')) {
            const newFileContent = await fs.readFile(filePath, 'utf-8');
            expect(newFileContent).toContain(
              'This is a new function in a new file',
            );
          }
          break;
        case 'deleted':
          expect(await fs.pathExists(filePath)).toBe(false);
          break;
      }
    }
  });

  it('should not modify files in dry run mode', async () => {
    const originalContents = await Promise.all(
      parsedResponse.files.map((file) =>
        fs
          .pathExists(path.join(tempPath, file.path))
          .then((exists) =>
            exists
              ? fs.readFile(path.join(tempPath, file.path), 'utf-8')
              : null,
          ),
      ),
    );
    await applyChanges({
      basePath: tempPath,
      parsedResponse,
      dryRun: true,
    });

    // Check if files were not modified
    for (let i = 0; i < parsedResponse.files.length; i++) {
      const filePath = path.join(tempPath, parsedResponse.files[i].path);
      const exists = await fs.pathExists(filePath);

      if (parsedResponse.files[i].status !== 'new') {
        expect(exists).toBe(true);
        if (exists) {
          const content = await fs.readFile(filePath, 'utf-8');
          expect(content).toBe(originalContents[i]);
        }
      } else {
        expect(exists).toBe(false);
      }
    }

    // Check that the file to be deleted still exists
    const deleteFilePath = path.join(tempPath, 'src/delete-me.ts');
    expect(await fs.pathExists(deleteFilePath)).toBe(true);
  });

  // Add more tests as needed, e.g., for error handling, edge cases, etc.
});
