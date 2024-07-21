import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'fs-extra';
import type { FileInfo } from '../core/file-processor';
import { normalizePath } from './normalize-path';

interface CacheEntry {
  hash: string;
  data: FileInfo;
}

const MAX_CACHE_ITEM_SIZE = 1024 * 1024; // 1 MB

export class FileCache {
  private cacheFile: string;
  private cache: Record<string, CacheEntry> = {};
  private isDirty = false;
  private isLoaded = false;
  private inMemoryLock = false;

  constructor(cacheFilePath: string) {
    this.cacheFile = cacheFilePath;
  }

  private async loadCache(): Promise<void> {
    if (this.isLoaded) return;

    if (this.inMemoryLock) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return this.loadCache();
    }

    this.inMemoryLock = true;

    try {
      if (await fs.pathExists(this.cacheFile)) {
        const content = await fs.readFile(this.cacheFile, 'utf-8');
        try {
          this.cache = JSON.parse(content, (key, value) => {
            if (typeof value === 'object' && value !== null) {
              if (value.type === 'Date') {
                return new Date(value.value);
              }
              if (value.created && value.modified) {
                value.created = new Date(value.created);
                value.modified = new Date(value.modified);
              }
            }
            if (key === 'path') {
              return normalizePath(value);
            }
            return value;
          });
        } catch (parseError) {
          console.warn(
            `Failed to parse cache file ${this.cacheFile}:`,
            parseError,
          );
          this.cache = {};
        }
      }
      this.isLoaded = true;
    } catch (error) {
      console.warn(`Failed to load cache from ${this.cacheFile}:`, error);
      this.cache = {};
    } finally {
      this.inMemoryLock = false;
    }
  }

  private async saveCache(): Promise<void> {
    if (!this.isDirty) return;

    if (this.inMemoryLock) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return this.saveCache();
    }

    this.inMemoryLock = true;

    try {
      await fs.ensureDir(path.dirname(this.cacheFile));
      const tempFile = `${this.cacheFile}.tmp`;

      const cacheString = JSON.stringify(this.cache, (key, value) => {
        if (value instanceof Date) {
          return { type: 'Date', value: value.toISOString() };
        }
        if (key === 'created' || key === 'modified') {
          return { type: 'Date', value: new Date(value).toISOString() };
        }
        if (key === 'path') {
          return normalizePath(value);
        }
        return value;
      });

      await fs.writeFile(tempFile, cacheString, 'utf-8');
      await fs.rename(tempFile, this.cacheFile);
      this.isDirty = false;
    } catch (error) {
      console.error(`Failed to save cache to ${this.cacheFile}:`, error);
    } finally {
      this.inMemoryLock = false;
    }
  }

  async get(filePath: string): Promise<FileInfo | null> {
    await this.loadCache();
    const cacheEntry = this.cache[filePath];
    if (cacheEntry) {
      const currentHash = await this.calculateFileHash(filePath);
      if (currentHash === cacheEntry.hash) {
        return cacheEntry.data;
      }
    }
    return null;
  }

  async set(filePath: string, data: FileInfo): Promise<void> {
    await this.loadCache();
    const hash = await this.calculateFileHash(filePath);

    // Check the size of the data
    const dataSize = JSON.stringify(data).length;
    if (dataSize > MAX_CACHE_ITEM_SIZE) {
      console.warn(`Skipping cache for large file: ${filePath}`);
      return;
    }

    this.cache[filePath] = { hash, data };
    this.isDirty = true;
  }

  private async calculateFileHash(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath);
      return crypto.createHash('md5').update(content).digest('hex');
    } catch (error) {
      console.error(`Error calculating hash for ${filePath}:`, error);
      return '';
    }
  }

  async clear(): Promise<void> {
    this.cache = {};
    this.isDirty = true;
    await this.saveCache();
  }

  async flush(): Promise<void> {
    if (this.isDirty) {
      await this.saveCache();
    }
  }
}
