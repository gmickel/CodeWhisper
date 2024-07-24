import os from 'node:os';
import path from 'node:path';
import fs from 'fs-extra';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FileInfo } from '../../src/core/file-processor';
import { FileCache } from '../../src/utils/file-cache';
import { normalizePath } from '../../src/utils/normalize-path';

describe('FileCache', () => {
  const TEST_DIR = path.join(os.tmpdir(), 'file-cache-test');
  const CACHE_FILE = path.join(TEST_DIR, 'test-cache.json');
  let fileCache: FileCache;

  beforeEach(async () => {
    await fs.ensureDir(TEST_DIR);
    fileCache = new FileCache(CACHE_FILE);
  });

  afterEach(async () => {
    await fs.remove(TEST_DIR);
  });

  it('should store and retrieve file info', async () => {
    const testFile = path.join(TEST_DIR, 'test.txt');
    await fs.writeFile(testFile, 'test content');

    const fileInfo: FileInfo = {
      path: testFile,
      extension: 'txt',
      language: 'plaintext',
      size: 12,
      created: new Date(),
      modified: new Date(),
      content: 'test content',
    };

    await fileCache.set(testFile, fileInfo);
    const retrieved = await fileCache.get(testFile);

    expect(retrieved).toEqual(fileInfo);
  });

  it('should return null for non-existent files', async () => {
    const nonExistentFile = path.join(TEST_DIR, 'non-existent.txt');
    const retrieved = await fileCache.get(nonExistentFile);

    expect(retrieved).toBeNull();
  });

  it('should update cache when file content changes', async () => {
    const testFile = path.join(TEST_DIR, 'changing.txt');
    await fs.writeFile(testFile, 'initial content');

    const initialInfo: FileInfo = {
      path: testFile,
      extension: 'txt',
      language: 'plaintext',
      size: 15,
      created: new Date(),
      modified: new Date(),
      content: 'initial content',
    };

    await fileCache.set(testFile, initialInfo);

    // Change file content
    await fs.writeFile(testFile, 'updated content');

    const updatedInfo: FileInfo = {
      ...initialInfo,
      size: 15,
      content: 'updated content',
    };

    await fileCache.set(testFile, updatedInfo);

    const retrieved = await fileCache.get(testFile);

    expect(retrieved).toEqual(updatedInfo);
    expect(retrieved).not.toEqual(initialInfo);
  });

  it('should persist cache to disk and load it', async () => {
    const testFile = normalizePath(path.join(TEST_DIR, 'persist.txt'));
    await fs.writeFile(testFile, 'persist test');

    const fileInfo: FileInfo = {
      path: testFile,
      extension: 'txt',
      language: 'plaintext',
      size: 11,
      created: new Date(),
      modified: new Date(),
      content: 'persist test',
    };

    await fileCache.set(testFile, fileInfo);
    await fileCache.flush();

    // Create a new FileCache instance to load from disk
    const newFileCache = new FileCache(CACHE_FILE);
    const retrieved = await newFileCache.get(testFile);

    expect(retrieved).toBeDefined();
    expect(retrieved).not.toBeNull();

    if (retrieved) {
      expect(normalizePath(retrieved.path)).toEqual(
        normalizePath(fileInfo.path),
      );
      expect(retrieved.content).toEqual(fileInfo.content);
      expect(retrieved.size).toEqual(fileInfo.size);
      expect(retrieved.language).toEqual(fileInfo.language);
      expect(retrieved.created).toBeInstanceOf(Date);
      expect(retrieved.modified).toBeInstanceOf(Date);
      expect(retrieved.created.getTime()).toBeCloseTo(
        fileInfo.created.getTime(),
        -3,
      );
      expect(retrieved.modified.getTime()).toBeCloseTo(
        fileInfo.modified.getTime(),
        -3,
      );
    } else {
      throw new Error('Retrieved cache item is null');
    }
  });

  it('should clear the cache', async () => {
    const testFile = path.join(TEST_DIR, 'clear.txt');
    await fs.writeFile(testFile, 'clear test');

    const fileInfo: FileInfo = {
      path: testFile,
      extension: 'txt',
      language: 'plaintext',
      size: 10,
      created: new Date(),
      modified: new Date(),
      content: 'clear test',
    };

    await fileCache.set(testFile, fileInfo);
    await fileCache.clear();

    const retrieved = await fileCache.get(testFile);
    expect(retrieved).toBeNull();
  });
});
