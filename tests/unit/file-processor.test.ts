import path from 'node:path';
import { Readable } from 'node:stream';
import fastGlob from 'fast-glob';
import Piscina from 'piscina';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type FileInfo, processFiles } from '../../src/core/file-processor';
import { FileCache } from '../../src/utils/file-cache';

vi.mock('fast-glob');
vi.mock('piscina');
vi.mock('../../src/utils/file-cache');

describe('processFiles', () => {
  const fixturesPath = path.resolve(__dirname, '../fixtures/test-project');
  const tempGitignorePath = path.join(fixturesPath, '.gitignore');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should process files correctly', async () => {
    vi.mocked(FileCache.prototype.get).mockResolvedValue(null);
    vi.mocked(FileCache.prototype.set).mockResolvedValue();

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
      path: path.join(fixturesPath, 'src/main.js'),
      extension: 'js',
      language: 'javascript',
      size: 100,
      created: new Date(2023, 0, 1),
      modified: new Date(2023, 0, 1),
      content: 'mock content',
    };

    vi.mocked(Piscina.prototype.run).mockResolvedValue(mockFileInfo);

    const result = await processFiles({
      path: fixturesPath,
      gitignorePath: tempGitignorePath,
    });

    expect(result).toHaveLength(3);
    expect(result[0].path).toEqual(mockFileInfo.path);
    expect(result[1].path).toEqual(mockFileInfo.path);
    expect(result[2].path).toEqual(mockFileInfo.path);
    expect(result[0].content).toBe('mock content');
  });

  it('should respect custom ignore patterns', async () => {
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

    const mockFileInfos: { [key: string]: FileInfo } = {
      'src/main.js': {
        path: path.join(fixturesPath, 'src/main.js'),
        extension: 'js',
        language: 'javascript',
        size: 100,
        created: new Date(2023, 0, 1),
        modified: new Date(2023, 0, 1),
        content: 'mock content for main.js',
      },
      'src/utils.ts': {
        path: path.join(fixturesPath, 'src/utils.ts'),
        extension: 'ts',
        language: 'typescript',
        size: 100,
        created: new Date(2023, 0, 1),
        modified: new Date(2023, 0, 1),
        content: 'mock content for utils.ts',
      },
      'package.json': {
        path: path.join(fixturesPath, 'package.json'),
        extension: 'json',
        language: 'json',
        size: 100,
        created: new Date(2023, 0, 1),
        modified: new Date(2023, 0, 1),
        content: 'mock content for package.json',
      },
    };

    vi.mocked(Piscina.prototype.run).mockImplementation(
      async ({ filePath }) => {
        const relativePath = path.relative(fixturesPath, filePath);
        return mockFileInfos[relativePath];
      },
    );

    const result = await processFiles({
      path: fixturesPath,
      gitignorePath: tempGitignorePath,
      customIgnores: ['**/*.js'],
    });

    const jsFiles = result.filter((file) => file.extension === 'js');
    expect(jsFiles.length).toBe(0);
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

    vi.mocked(FileCache.prototype.get).mockImplementation((filePath) => {
      return filePath === cachedFile.path
        ? Promise.resolve(cachedFile)
        : Promise.resolve(null);
    });

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

    const mockFileInfos: { [key: string]: FileInfo } = {
      'src/main.js': cachedFile,
      'src/utils.ts': {
        path: path.join(fixturesPath, 'src/utils.ts'),
        extension: 'ts',
        language: 'typescript',
        size: 100,
        created: new Date(2023, 0, 1),
        modified: new Date(2023, 0, 1),
        content: 'mock content',
      },
      'package.json': {
        path: path.join(fixturesPath, 'package.json'),
        extension: 'json',
        language: 'json',
        size: 100,
        created: new Date(2023, 0, 1),
        modified: new Date(2023, 0, 1),
        content: 'mock content',
      },
    };

    vi.mocked(Piscina.prototype.run).mockImplementation(
      async ({ filePath }) => {
        const relativePath = path.relative(fixturesPath, filePath);
        return mockFileInfos[relativePath];
      },
    );

    const result = await processFiles({
      path: fixturesPath,
      gitignorePath: tempGitignorePath,
    });

    expect(result.length).toBe(3);
    const mainJsFile = result.find((file) => file.path === cachedFile.path);
    expect(mainJsFile).toEqual(cachedFile);

    expect(FileCache.prototype.get).toHaveBeenCalledTimes(3);
    expect(FileCache.prototype.set).toHaveBeenCalledTimes(2);
  });
});
