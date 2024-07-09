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

  constructor(cacheFilePath: string) {
    this.cacheFile = cacheFilePath;
    this.loadCache();
  }

  private async loadCache() {
    try {
      if (await fs.pathExists(this.cacheFile)) {
        const content = await fs.readFile(this.cacheFile, 'utf-8');
        this.cache = JSON.parse(content);
      }
    } catch (error) {
      console.warn(`Failed to load cache from ${this.cacheFile}:`, error);
      this.cache = {};
    }
  }

  private async saveCache() {
    if (!this.isDirty) return;

    try {
      await fs.ensureDir(path.dirname(this.cacheFile));
      await fs.writeFile(this.cacheFile, JSON.stringify(this.cache), 'utf-8');
      this.isDirty = false;
    } catch (error) {
      console.error(`Failed to save cache to ${this.cacheFile}:`, error);
    }
  }

  async get(filePath: string): Promise<FileInfo | null> {
    try {
      const stats = await fs.stat(filePath);
      const currentHash = this.hashFile(stats);

      if (this.cache[filePath] && this.cache[filePath].hash === currentHash) {
        return this.cache[filePath].data;
      }
    } catch (error) {
      console.warn(`Failed to get cache entry for ${filePath}:`, error);
    }

    return null;
  }

  async set(filePath: string, data: FileInfo): Promise<void> {
    try {
      const stats = await fs.stat(filePath);
      const hash = this.hashFile(stats);

      this.cache[filePath] = { hash, data };
      this.isDirty = true;
      await this.saveCache();
    } catch (error) {
      console.error(`Failed to set cache entry for ${filePath}:`, error);
    }
  }

  private hashFile(stats: fs.Stats): string {
    return crypto
      .createHash('md5')
      .update(`${stats.size}-${stats.mtime.getTime()}`)
      .digest('hex');
  }

  async clear(): Promise<void> {
    this.cache = {};
    this.isDirty = true;
    await this.saveCache();
  }
}
