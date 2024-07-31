import os from 'node:os';
import path from 'node:path';
import chalk from 'chalk';
import fs from 'fs-extra';

export const DEFAULT_CACHE_PATH = path.join(
  os.tmpdir(),
  'codewhisper-cache.json',
);

export async function getCachedValue(
  key: string,
  cachePath?: string,
): Promise<string | null> {
  const cacheFile = cachePath ?? DEFAULT_CACHE_PATH;
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
  const cacheFile = cachePath ?? DEFAULT_CACHE_PATH;
  try {
    const cache = await fs.readJSON(cacheFile).catch(() => ({}));
    cache[key] = value;
    await fs.writeJSON(cacheFile, cache);
  } catch (error) {
    console.warn('Failed to cache value:', error);
  }
}

export async function clearCache(cachePath?: string): Promise<void> {
  const cacheFile = cachePath ?? DEFAULT_CACHE_PATH;
  try {
    await fs.remove(cacheFile);
    console.log(
      chalk.green(`Cache cleared successfully (cachefile: ${cacheFile})`),
    );
  } catch (error) {
    console.error(chalk.red('Error clearing cache:'), error);
    console.log(
      chalk.blue(
        `You can clear the cache manually by deleting the file: ${cacheFile}`,
      ),
    );
  }
}
