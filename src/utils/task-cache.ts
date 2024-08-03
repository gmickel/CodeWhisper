import os from 'node:os';
import path from 'node:path';
import fs from 'fs-extra';
import type { TaskData } from '../types';

export class TaskCache {
  private cacheFile: string;
  private cache: Record<string, TaskData> = {};

  constructor(projectPath: string) {
    const cacheDir = path.join(os.homedir(), '.codewhisper');
    fs.ensureDirSync(cacheDir);
    const projectHash = Buffer.from(projectPath).toString('base64');
    this.cacheFile = path.join(cacheDir, `${projectHash}-task-cache.json`);
    this.loadCache();
  }
  private loadCache(): void {
    if (fs.existsSync(this.cacheFile)) {
      this.cache = fs.readJSONSync(this.cacheFile);
    }
  }

  private saveCache(): void {
    fs.writeJSONSync(this.cacheFile, this.cache);
  }

  setTaskData(
    basePath: string,
    data: Omit<TaskData, 'basePath' | 'timestamp'>,
  ): void {
    const key = this.getKey(basePath);
    this.cache[key] = { ...data, basePath, timestamp: Date.now() };
    this.saveCache();
  }

  getLastTaskData(basePath: string): TaskData | null {
    const key = this.getKey(basePath);
    return this.cache[key] || null;
  }

  private getKey(basePath: string): string {
    return path.resolve(basePath);
  }
}
