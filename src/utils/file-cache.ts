import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'fs-extra';
import type { FileInfo } from '../core/file-processor';

interface CacheEntry {
  hash: string;
  data: FileInfo;
}

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
          this.cache = JSON.parse(content);
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
      await fs.writeFile(tempFile, JSON.stringify(this.cache), 'utf-8');
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
    return this.cache[filePath]?.data || null;
  }

  async set(filePath: string, data: FileInfo): Promise<void> {
    await this.loadCache();
    const hash = this.hashFile(data);
    this.cache[filePath] = { hash, data };
    this.isDirty = true;
  }

  private hashFile(data: FileInfo): string {
    return crypto
      .createHash('md5')
      .update(`${data.size}-${data.modified.getTime()}`)
      .digest('hex');
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
