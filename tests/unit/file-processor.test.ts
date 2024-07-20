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
  const normalizedFixturesPath = path.normalize(fixturesPath);
  const tempGitignorePath = path.join(normalizedFixturesPath, '.gitignore');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function setupMockFileSystem(mockFiles: string[]) {
    vi.mocked(FileCache.prototype.get).mockResolvedValue(null);
    vi.mocked(FileCache.prototype.set).mockResolvedValue();

    vi.mocked(fastGlob.stream).mockReturnValue(
      new Readable({
        read() {
          for (const file of mockFiles) {
            this.push(path.join(normalizedFixturesPath, file));
          }
          this.push(null);
        },
      }),
    );

    const mockFileInfo = (filePath: string): FileInfo => ({
      path: path.join(normalizedFixturesPath, filePath),
      extension: path.extname(filePath).slice(1),
      language: 'javascript',
      size: 100,
      created: new Date(2023, 0, 1),
      modified: new Date(2023, 0, 1),
      content: `mock content for ${filePath}`,
    });

    vi.mocked(Piscina.prototype.run).mockImplementation(async ({ filePath }) =>
      mockFileInfo(path.relative(normalizedFixturesPath, filePath)),
    );
  }
  it('should process files correctly', async () => {
    vi.mocked(FileCache.prototype.get).mockResolvedValue(null);
    vi.mocked(FileCache.prototype.set).mockResolvedValue();

    vi.mocked(fastGlob.stream).mockReturnValue(
      new Readable({
        read() {
          const files = ['src/main.js', 'src/utils.ts', 'package.json'];
          for (const file of files) {
            this.push(path.join(normalizedFixturesPath, file));
          }
          this.push(null);
        },
      }),
    );

    const mockFileInfo: FileInfo = {
      path: path.join(normalizedFixturesPath, 'src/main.js'),
      extension: 'js',
      language: 'javascript',
      size: 100,
      created: new Date(2023, 0, 1),
      modified: new Date(2023, 0, 1),
      content: 'mock content',
    };

    vi.mocked(Piscina.prototype.run).mockResolvedValue(mockFileInfo);

    const result = await processFiles({
      path: normalizedFixturesPath,
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
            this.push(path.join(normalizedFixturesPath, file));
          }
          this.push(null);
        },
      }),
    );

    const mockFileInfos: { [key: string]: FileInfo } = {
      'src/main.js': {
        path: path.join(normalizedFixturesPath, 'src/main.js'),
        extension: 'js',
        language: 'javascript',
        size: 100,
        created: new Date(2023, 0, 1),
        modified: new Date(2023, 0, 1),
        content: 'mock content for main.js',
      },
      'src/utils.ts': {
        path: path.join(normalizedFixturesPath, 'src/utils.ts'),
        extension: 'ts',
        language: 'typescript',
        size: 100,
        created: new Date(2023, 0, 1),
        modified: new Date(2023, 0, 1),
        content: 'mock content for utils.ts',
      },
      'package.json': {
        path: path.join(normalizedFixturesPath, 'package.json'),
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
        const relativePath = path.relative(normalizedFixturesPath, filePath);
        return mockFileInfos[relativePath];
      },
    );

    const result = await processFiles({
      path: normalizedFixturesPath,
      gitignorePath: tempGitignorePath,
      customIgnores: ['**/*.js'],
    });

    const jsFiles = result.filter((file) => file.extension === 'js');
    expect(jsFiles.length).toBe(0);
  });

  it('should use cache for unchanged files', async () => {
    const cachedFile: FileInfo = {
      path: path.join(normalizedFixturesPath, 'src', 'main.js'),
      extension: 'js',
      language: 'javascript',
      content: 'cached content',
      size: 50,
      created: new Date(2023, 0, 1),
      modified: new Date(2023, 0, 1),
    };

    vi.mocked(FileCache.prototype.get).mockImplementation((filePath) => {
      return path.normalize(filePath) === path.normalize(cachedFile.path)
        ? Promise.resolve(cachedFile)
        : Promise.resolve(null);
    });

    const mockFiles = ['src/main.js', 'src/utils.ts', 'package.json'];
    vi.mocked(fastGlob.stream).mockReturnValue(
      new Readable({
        read() {
          for (const file of mockFiles) {
            this.push(path.join(normalizedFixturesPath, file));
          }
          this.push(null);
        },
      }),
    );

    const mockFileInfos: { [key: string]: FileInfo } = {
      'src/main.js': cachedFile,
      'src/utils.ts': {
        path: path.join(normalizedFixturesPath, 'src', 'utils.ts'),
        extension: 'ts',
        language: 'typescript',
        size: 100,
        created: new Date(2023, 0, 1),
        modified: new Date(2023, 0, 1),
        content: 'mock content',
      },
      'package.json': {
        path: path.join(normalizedFixturesPath, 'package.json'),
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
        const relativePath = path.relative(normalizedFixturesPath, filePath);
        return mockFileInfos[relativePath.replace(/\\/g, '/')];
      },
    );

    const result = await processFiles({
      path: normalizedFixturesPath,
      gitignorePath: tempGitignorePath,
    });

    expect(result.length).toBe(mockFiles.length);
    const mainJsFile = result.find(
      (file) => path.normalize(file.path) === path.normalize(cachedFile.path),
    );
    expect(mainJsFile).toEqual(cachedFile);

    expect(FileCache.prototype.get).toHaveBeenCalledTimes(mockFiles.length);
    expect(FileCache.prototype.set).toHaveBeenCalledTimes(mockFiles.length - 1);
  });

  it('should apply filters correctly', async () => {
    const mockFiles = ['src/main.js', 'src/utils.ts', 'package.json'];
    setupMockFileSystem(mockFiles);

    const result = await processFiles({
      path: normalizedFixturesPath,
      gitignorePath: tempGitignorePath,
      filter: ['**/*.js', '**/*.ts'],
    });

    expect(result).toHaveLength(2);
    expect(
      result
        .map((file) => path.basename(file.path))
        .sort((a, b) => a.localeCompare(b)),
    ).toEqual(['main.js', 'utils.ts']);
  });

  it('should handle multiple filters correctly', async () => {
    const mockFiles = ['src/main.js', 'src/utils.ts', 'package.json'];
    setupMockFileSystem(mockFiles);

    const result = await processFiles({
      path: normalizedFixturesPath,
      gitignorePath: tempGitignorePath,
      filter: ['**/*.js', '**/package.json'],
    });

    expect(result).toHaveLength(2);
    expect(
      result
        .map((file) => path.basename(file.path))
        .sort((a, b) => a.localeCompare(b)),
    ).toEqual(['main.js', 'package.json']);
  });

  it('should handle both include and exclude filters', async () => {
    const mockFiles = ['src/main.js', 'src/utils.ts', 'package.json'];
    setupMockFileSystem(mockFiles);

    const result = await processFiles({
      path: normalizedFixturesPath,
      gitignorePath: tempGitignorePath,
      filter: ['**/*'],
      exclude: ['**/*.ts'],
    });

    expect(result).toHaveLength(2);
    expect(
      result
        .map((file) => path.basename(file.path))
        .sort((a, b) => a.localeCompare(b)),
    ).toEqual(['main.js', 'package.json']);
  });

  it('should handle absolute path filters', async () => {
    const mockFiles = ['src/main.js', 'src/utils.ts', 'package.json'];
    setupMockFileSystem(mockFiles);

    const result = await processFiles({
      path: normalizedFixturesPath,
      gitignorePath: tempGitignorePath,
      filter: [
        path.join(normalizedFixturesPath, 'src', 'main.js'),
        '**/package.json',
      ],
    });

    expect(result).toHaveLength(2);
    expect(
      result
        .map((file) => path.basename(file.path))
        .sort((a, b) => a.localeCompare(b)),
    ).toEqual(['main.js', 'package.json']);
  });
});
