import os from 'node:os';
import path from 'node:path';
import fs from 'fs-extra';

const DEFAULT_CACHE_FILE = path.join(os.tmpdir(), 'codewhisper-cache.json');

export async function getCachedValue(
  key: string,
  cachePath?: string,
): Promise<string | null> {
  const cacheFile = cachePath ?? DEFAULT_CACHE_FILE;
  try {
    const cache = await fs.readJSON(cacheFile);
    return cache[key] || null;
  } catch {
    return null;
  }
}

export async function setCachedValue(
  key: string,
  value: string,
  cachePath?: string,
): Promise<void> {
  const cacheFile = cachePath ?? DEFAULT_CACHE_FILE;
  try {
    const cache = await fs.readJSON(cacheFile).catch(() => ({}));
    cache[key] = value;
    await fs.writeJSON(cacheFile, cache);
  } catch (error) {
    console.warn('Failed to cache value:', error);
  }
}
