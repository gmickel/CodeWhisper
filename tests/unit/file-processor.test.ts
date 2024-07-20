import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import fastGlob from 'fast-glob';
import fs from 'fs-extra'; // Import fs-extra module
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
        objectMode: true, // Ensure Readable stream supports object mode
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
      language:
        path.extname(filePath).slice(1) === 'ts' ? 'typescript' : 'javascript',
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
    const mockFiles = ['src/main.js', 'src/utils.ts', 'package.json'];
    setupMockFileSystem(mockFiles);

    const result = await processFiles({
      path: normalizedFixturesPath,
      gitignorePath: tempGitignorePath,
    });

    expect(result).toHaveLength(3);
    expect(
      result
        .map((file) => path.basename(file.path))
        .sort((a, b) => a.localeCompare(b)),
    ).toEqual(['main.js', 'package.json', 'utils.ts']);
    expect(result[0].content).toBe('mock content for package.json');
  });

  it('should handle directory and file selections correctly', async () => {
    const mockFiles = [
      'src/main.js',
      'src/utils.ts',
      'src/components/Button.jsx',
      'package.json',
    ];
    setupMockFileSystem(mockFiles);

    const result = await processFiles({
      path: normalizedFixturesPath,
      gitignorePath: tempGitignorePath,
      filter: ['src/**/*.{js,jsx}', 'package.json'],
    });

    expect(result).toHaveLength(3);
    expect(
      result
        .map((file) => path.relative(normalizedFixturesPath, file.path))
        .sort((a, b) => a.localeCompare(b)),
    ).toEqual(['package.json', 'src/components/Button.jsx', 'src/main.js']);
  });

  it('should respect custom ignore patterns', async () => {
    const mockFiles = [
      'src/main.js',
      'src/utils.ts',
      'src/components/Button.jsx',
      'package.json',
    ];
    setupMockFileSystem(mockFiles);

    const result = await processFiles({
      path: normalizedFixturesPath,
      gitignorePath: tempGitignorePath,
      customIgnores: ['**/*.js'],
    });

    const jsFiles = result.filter((file) => file.extension === 'js');
    expect(jsFiles.length).toBe(0);
    expect(result.length).toBe(3); // Only .ts, .jsx, and .json files should be processed
  });

  it('should apply filters correctly', async () => {
    const mockFiles = [
      'src/main.js',
      'src/utils.ts',
      'src/components/Button.jsx',
      'package.json',
    ];
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
    const mockFiles = [
      'src/main.js',
      'src/utils.ts',
      'src/components/Button.jsx',
      'package.json',
    ];
    setupMockFileSystem(mockFiles);

    const result = await processFiles({
      path: normalizedFixturesPath,
      gitignorePath: tempGitignorePath,
      filter: ['**/*.js*', '**/package.json'],
    });

    expect(result).toHaveLength(3);
    expect(
      result
        .map((file) => path.basename(file.path))
        .sort((a, b) => a.localeCompare(b)),
    ).toEqual(['Button.jsx', 'main.js', 'package.json']);
  });

  it('should handle both include and exclude filters', async () => {
    const mockFiles = [
      'src/main.js',
      'src/utils.ts',
      'src/components/Button.jsx',
      'package.json',
    ];
    setupMockFileSystem(mockFiles);

    const result = await processFiles({
      path: normalizedFixturesPath,
      gitignorePath: tempGitignorePath,
      filter: ['**/*'],
      exclude: ['**/*.ts'],
    });

    expect(result).toHaveLength(3);
    expect(
      result
        .map((file) => path.basename(file.path))
        .sort((a, b) => a.localeCompare(b)),
    ).toEqual(['Button.jsx', 'main.js', 'package.json']);
  });

  it('should handle absolute path filters', async () => {
    const mockFiles = [
      'src/main.js',
      'src/utils.ts',
      'src/components/Button.jsx',
      'package.json',
    ];
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

  it('should process all files when no filter is provided', async () => {
    const mockFiles = [
      'src/main.js',
      'src/utils.ts',
      'src/components/Button.jsx',
      'package.json',
    ];
    setupMockFileSystem(mockFiles);

    const result = await processFiles({
      path: normalizedFixturesPath,
      gitignorePath: tempGitignorePath,
      filter: [],
    });

    expect(result).toHaveLength(4);
    expect(
      result
        .map((file) => path.basename(file.path))
        .sort((a, b) => a.localeCompare(b)),
    ).toEqual(['Button.jsx', 'main.js', 'package.json', 'utils.ts']);
  });

  it('should handle complex glob patterns and directory selections correctly', async () => {
    const mockFiles = [
      'src/main.js',
      'src/utils.ts',
      'src/components/Button.jsx',
      'src/components/Input.tsx',
      'tests/unit/main.test.js',
      'tests/integration/api.test.js',
      'docs/README.md',
      'LICENSE',
      'package.json',
    ];
    setupMockFileSystem(mockFiles);

    const result = await processFiles({
      path: normalizedFixturesPath,
      gitignorePath: tempGitignorePath,
      filter: ['src/**/*.{js,jsx}', 'tests', '**/README.md'],
      exclude: ['**/*.test.js'],
      customIgnores: ['**/Input.tsx'],
    });

    expect(result).toHaveLength(3);
    expect(
      result
        .map((file) => path.relative(normalizedFixturesPath, file.path))
        .sort((a, b) => a.localeCompare(b)),
    ).toEqual(['docs/README.md', 'src/components/Button.jsx', 'src/main.js']);
  });

  it('should handle basename matching correctly', async () => {
    const mockFiles = [
      'src/main.js',
      'src/utils.ts',
      'src/components/Button.jsx',
      'src/components/Input.tsx',
      'tests/integration/api.test.js',
      'tests/unit/main.test.js',
      'docs/README.md',
      'LICENSE',
      'package.json',
    ];
    setupMockFileSystem(mockFiles);

    const result = await processFiles({
      path: normalizedFixturesPath,
      gitignorePath: tempGitignorePath,
      filter: ['main.js', 'README.md', 'Input.tsx'],
      matchBase: true,
    });

    expect(result).toHaveLength(3);
    expect(
      result
        .map((file) => path.relative(normalizedFixturesPath, file.path))
        .sort((a, b) => a.localeCompare(b)),
    ).toEqual(['docs/README.md', 'src/components/Input.tsx', 'src/main.js']);
  });

  it('should process and cache files, then use cached data on reprocessing', async () => {
    const TEST_DIR = path.join(os.tmpdir(), 'file-processor-test');
    const CACHE_FILE = path.join(TEST_DIR, 'test-cache.json');
    let fileCache: FileCache;

    await fs.ensureDir(TEST_DIR);

    const mockFileInfo: FileInfo = {
      path: path.join(TEST_DIR, 'file1.js'),
      extension: 'js',
      language: 'javascript',
      size: 50,
      created: new Date(2022, 11, 31),
      modified: new Date(2022, 11, 31),
      content: 'mock cached content for file1.js',
    };

    // Mock FileCache.get initial return of null (cache miss)
    vi.mocked(FileCache.prototype.get).mockResolvedValue(null);

    // Mock Piscina.run for initial processing
    vi.mocked(Piscina.prototype.run).mockImplementation(
      async ({ filePath }) => {
        return {
          ...mockFileInfo,
          path: filePath,
          content: `mock content for ${path.basename(filePath)}`,
          size: 100,
        };
      },
    );

    // Mock fastGlob.stream to list files
    vi.mocked(fastGlob.stream).mockImplementation(() => {
      const stream = new Readable({
        objectMode: true,
        read() {
          this.push(path.join(TEST_DIR, 'file1.js'));
          this.push(null);
        },
      });
      return stream;
    });

    // First processing (no cache hit)
    await fs.writeFile(
      path.join(TEST_DIR, 'file1.js'),
      'console.log("Hello file1");',
    );
    const firstResults = await processFiles({
      path: TEST_DIR,
      cachePath: CACHE_FILE,
    });

    expect(firstResults).toHaveLength(1);
    expect(firstResults[0].content).toBe('mock content for file1.js');

    // Mock FileCache.get to return cached data for subsequent run (cache hit)
    vi.mocked(FileCache.prototype.get).mockImplementation(
      async (filePath: string) => {
        if (filePath === mockFileInfo.path) {
          return mockFileInfo;
        }
        return null;
      },
    );

    // Second processing (cache hit, should not reprocess file1.js)
    const secondResults = await processFiles({
      path: TEST_DIR,
      cachePath: CACHE_FILE,
    });

    expect(secondResults).toHaveLength(1);
    expect(secondResults[0].content).toBe('mock cached content for file1.js');

    // Ensure Piscina.run was only called once for initial processing
    const piscinaRunCalls = vi.mocked(Piscina.prototype.run).mock.calls;
    expect(piscinaRunCalls.length).toBe(1);
  });
});
