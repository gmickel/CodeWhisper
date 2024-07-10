import path from 'node:path';
import { Readable } from 'node:stream';
import fastGlob from 'fast-glob';
import fs from 'fs-extra';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import workerpool from 'workerpool';
import { type FileInfo, processFiles } from '../../src/core/file-processor';
import { FileCache } from '../../src/utils/file-cache';

const resolvePath = (pathname: string) =>
  new URL(pathname, import.meta.url).pathname;

vi.mock('fast-glob');
vi.mock('workerpool');
vi.mock('../../src/utils/file-cache');

describe('processFiles', () => {
  const fixturesPath = resolvePath('../fixtures/test-project');
  const tempGitignorePath = path.join(fixturesPath, '.gitignore');

  beforeEach(async () => {
    // Set up a real test directory structure
    await fs.ensureDir(fixturesPath);
    await fs.writeFile(tempGitignorePath, '*.log\nnode_modules/\n');
    await fs.writeFile(
      path.join(fixturesPath, 'src', 'main.js'),
      'console.log("Hello, World!");',
    );
    await fs.writeFile(
      path.join(fixturesPath, 'src', 'utils.ts'),
      'export const add = (a, b) => a + b;',
    );
    await fs.writeFile(
      path.join(fixturesPath, 'package.json'),
      '{ "name": "test-project" }',
    );
  });

  afterEach(async () => {
    // Clean up the test directory
    await fs.remove(fixturesPath);
  });

  it('should process files correctly', async () => {
    vi.mocked(FileCache.prototype.get).mockResolvedValue(null);
    vi.mocked(FileCache.prototype.set).mockResolvedValue();

    vi.mocked(fastGlob.stream).mockReturnValue({
      on: vi.fn().mockImplementation((event, callback) => {
        if (event === 'data') {
          for (const file of ['src/main.js', 'src/utils.ts', 'package.json']) {
            callback(path.join(fixturesPath, file));
          }
        } else if (event === 'end') {
          callback();
        }
        return { on: vi.fn() };
      }),
    } as unknown as ReturnType<typeof fastGlob.stream>);

    const mockFileInfo: FileInfo = {
      path: 'mockPath',
      extension: 'js',
      language: 'javascript',
      size: 100,
      created: new Date(2023, 0, 1),
      modified: new Date(2023, 0, 1),
      content: 'mock content',
    };

    vi.mocked(workerpool.pool).mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockFileInfo),
      terminate: vi.fn().mockResolvedValue(undefined),
    } as unknown as ReturnType<typeof workerpool.pool>);

    const result = await processFiles({
      path: fixturesPath,
      gitignorePath: tempGitignorePath,
    });

    expect(result).toHaveLength(3);
    expect(result[0].path).toContain('src/main.js');
    expect(result[1].path).toContain('src/utils.ts');
    expect(result[2].path).toContain('package.json');

    expect(result[0].content).toBe('mock content');
    expect(result[0].size).toBe(100);
    expect(result[0].created).toEqual(new Date(2023, 0, 1));
    expect(result[0].modified).toEqual(new Date(2023, 0, 1));
  });

  it('should respect custom ignore patterns', async () => {
    vi.mocked(fastGlob.stream).mockReturnValue({
      on: vi.fn().mockImplementation((event, callback) => {
        if (event === 'data') {
          for (const file of ['src/main.js', 'src/utils.ts', 'package.json']) {
            callback(path.join(fixturesPath, file));
          }
        } else if (event === 'end') {
          callback();
        }
        return {
          pipe: vi.fn().mockReturnThis(),
          read: vi.fn(),
          pause: vi.fn(),
          resume: vi.fn(),
        };
      }),
      pipe: vi.fn().mockReturnThis(),
      read: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      destroy: vi.fn(),
    } as unknown as ReturnType<typeof fastGlob.stream>);

    const mockFileInfo: FileInfo = {
      path: 'mockPath',
      extension: 'js',
      language: 'javascript',
      size: 100,
      created: new Date(2023, 0, 1),
      modified: new Date(2023, 0, 1),
      content: 'mock content',
    };

    vi.mocked(workerpool.pool).mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockFileInfo),
      terminate: vi.fn().mockResolvedValue(undefined),
    } as unknown as workerpool.Pool);

    const result = await processFiles({
      path: fixturesPath,
      gitignorePath: tempGitignorePath,
      customIgnores: ['*.js'],
    });

    const jsFiles = result.filter((file) => file.path.endsWith('.js'));
    expect(jsFiles).toHaveLength(0);
  });

  it('should use cache for unchanged files', async () => {
    const cachedFile: FileInfo = {
      path: path.join(fixturesPath, 'src/main.js'),
      extension: 'js',
      language: 'javascript',
      content: 'cached content',
      size: 50,
      created: new Date(2023, 0, 1),
      modified: new Date(2023, 0, 1),
    };

    vi.mocked(FileCache.prototype.get).mockImplementation(
      (filePath: string) => {
        if (filePath.endsWith('main.js')) {
          return Promise.resolve(cachedFile);
        }
        return Promise.resolve(null);
      },
    );

    vi.mocked(fastGlob.stream).mockReturnValue(
      new Readable({
        read() {
          const files = ['src/main.js', 'src/utils.ts', 'package.json'];
          for (const file of files) {
            this.push(path.join(fixturesPath, file));
          }
          this.push(null);
        },
      }),
    );

    const mockFileInfo: FileInfo = {
      path: 'mockPath',
      extension: 'ts',
      language: 'typescript',
      size: 100,
      created: new Date(2023, 0, 1),
      modified: new Date(2023, 0, 1),
      content: 'mock content',
    };

    vi.mocked(workerpool.pool).mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockFileInfo),
      terminate: vi.fn().mockResolvedValue(undefined),
    } as unknown as workerpool.Pool);

    const result = await processFiles({
      path: fixturesPath,
      gitignorePath: tempGitignorePath,
    });

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual(cachedFile);
    expect(FileCache.prototype.get).toHaveBeenCalledTimes(3);
    expect(FileCache.prototype.set).toHaveBeenCalledTimes(2);
  });
});
