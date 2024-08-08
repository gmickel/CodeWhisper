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
            // Check for unchanged parts
            expect(content).toContain("import path from 'node:path';");
            expect(content).toContain("import winston from 'winston';");
          }
          if (file.path.includes('index.ts')) {
            expect(content).toContain(
              "logLevel?: 'error' | 'warn' | 'info' | 'debug'",
            );
            // Check for unchanged parts
            expect(content).toContain('export interface GitHubIssue');
            expect(content).toContain('export interface MarkdownOptions');
          }
          if (file.path.includes('task-workflow.ts')) {
            expect(content).toContain(
              'const logger = getLogger(loggerOptions)',
            );
            expect(content).toContain(
              "logger.info(`Using ${options.diff ? 'diff' : 'whole-file'} editing mode`);",
            );
            // Check for unchanged parts
            expect(content).toContain(
              "import { processFiles } from '../core/file-processor';",
            );
            expect(content).toContain(
              "import { generateMarkdown } from '../core/markdown-generator';",
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

describe('applyChanges edge cases', () => {
  const fixturesPath = path.join(__dirname, '..', 'fixtures', 'applyChanges');
  const tempPath = path.join(os.tmpdir(), 'temp', 'edge-cases');
  let parsedResponse: AIParsedResponse;

  beforeEach(async () => {
    // Load the parsed response for edge cases
    parsedResponse = await fs.readJSON(
      path.join(fixturesPath, 'parsedResponseEdgeCases.json'),
    );

    // Copy fixture files to a temporary directory
    await fs.copy(path.join(fixturesPath, 'src'), path.join(tempPath, 'src'));
  });

  afterEach(async () => {
    // Clean up the temporary directory after each test
    await fs.remove(tempPath);
  });

  it('should handle flexible whitespace matching', async () => {
    await applyChanges({
      basePath: tempPath,
      parsedResponse,
      dryRun: false,
    });

    const content = await fs.readFile(
      path.join(tempPath, 'src', 'edge-cases', 'whitespace.ts'),
      'utf-8',
    );
    expect(content).toContain("console.log('Hello, flexible whitespace!');");
    expect(content).toContain('const   x    =    5;'); // This line should remain unchanged
  });

  it('should apply multiple changes in a single file', async () => {
    await applyChanges({
      basePath: tempPath,
      parsedResponse,
      dryRun: false,
    });

    const content = await fs.readFile(
      path.join(tempPath, 'src', 'edge-cases', 'multiple-changes.ts'),
      'utf-8',
    );
    expect(content).toContain('const PI = Math.PI;');
    expect(content).toContain('function square(x: number): number {');
    expect(content).toContain('return x ** 2;');
  });

  it('should handle partial matching with surrounding context', async () => {
    await applyChanges({
      basePath: tempPath,
      parsedResponse,
      dryRun: false,
    });

    const content = await fs.readFile(
      path.join(tempPath, 'src', 'edge-cases', 'partial-match.ts'),
      'utf-8',
    );
    expect(content).toContain('function processData(data: any): any {');
    expect(content).toContain('// Data processing implemented');
    expect(content).toContain('return data.map(item => item * 2);');
    expect(content).toContain('const a = 1;'); // This line should remain unchanged
  });

  it('should not modify file when no match is found', async () => {
    const originalContent = await fs.readFile(
      path.join(tempPath, 'src', 'edge-cases', 'no-match.ts'),
      'utf-8',
    );

    await applyChanges({
      basePath: tempPath,
      parsedResponse,
      dryRun: false,
    });

    const newContent = await fs.readFile(
      path.join(tempPath, 'src', 'edge-cases', 'no-match.ts'),
      'utf-8',
    );
    expect(newContent).toBe(originalContent);
  });

  it('should create a new file', async () => {
    await applyChanges({
      basePath: tempPath,
      parsedResponse,
      dryRun: false,
    });

    const exists = await fs.pathExists(
      path.join(tempPath, 'src', 'edge-cases', 'new-file.ts'),
    );
    expect(exists).toBe(true);

    const content = await fs.readFile(
      path.join(tempPath, 'src', 'edge-cases', 'new-file.ts'),
      'utf-8',
    );
    expect(content).toContain('export const NEW_CONSTANT = 42;');
    expect(content).toContain('export function newFunction() {');
  });

  it('should delete a file', async () => {
    const existsBefore = await fs.pathExists(
      path.join(tempPath, 'src', 'edge-cases', 'delete-me.ts'),
    );
    expect(existsBefore).toBe(true);

    await applyChanges({
      basePath: tempPath,
      parsedResponse,
      dryRun: false,
    });

    const existsAfter = await fs.pathExists(
      path.join(tempPath, 'src', 'edge-cases', 'delete-me.ts'),
    );
    expect(existsAfter).toBe(false);
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
    const deleteFilePath = path.join(
      tempPath,
      'src',
      'edge-cases',
      'delete-me.ts',
    );
    expect(await fs.pathExists(deleteFilePath)).toBe(true);
  });
});
