import os from 'node:os';
import path from 'node:path';
import fastGlob from 'fast-glob';
import fs from 'fs-extra';
import ignore from 'ignore';
import { isBinaryFile } from 'isbinaryfile';
import Piscina from 'piscina';
import { FileCache } from '../utils/file-cache';

export interface FileInfo {
  path: string;
  extension: string;
  language: string;
  size: number;
  created: Date;
  modified: Date;
  content: string;
}

interface ProcessOptions {
  path: string;
  gitignorePath?: string;
  filter?: string[];
  exclude?: string[];
  suppressComments?: boolean;
  caseSensitive?: boolean;
  customIgnores?: string[];
  cachePath?: string;
}

// Determine the correct extension and filename for the worker
const isDist = path
  .dirname(new URL(import.meta.url).pathname)
  .includes('/dist/');
const workerFilename = `file-worker.${isDist ? 'js' : 'ts'}`;
const workerFilePath = new URL(
  isDist ? path.join('../core', workerFilename) : workerFilename,
  import.meta.url,
).href;

const piscina = new Piscina({
  filename: workerFilePath,
});

const DEFAULT_IGNORES = [
  // Version control
  '**/.git',
  '**/.gitignore',
  '**/.gitattributes',
  '**/.gitmodules',
  '**/.gitkeep',
  '**/.github',
  '**/.svn',
  '**/.hg',
  '**/.hgignore',
  '**/.hgcheck',

  // Package manager directories
  '**/node_modules',
  '**/jspm_packages',
  '**/bower_components',

  // Build outputs and caches
  '**/dist',
  '**/build',
  '**/.cache',
  '**/.output',
  '**/.nuxt',
  '**/.next',
  '**/.vuepress/dist',
  '**/.serverless',
  '**/.fusebox',
  '**/.dynamodb',

  // Package manager files
  '**/package-lock.json',
  '**/yarn.lock',
  '**/pnpm-lock.yaml',
  '**/bun.lockb',
  '**/Gemfile.lock',
  '**/Cargo.lock',
  '**/poetry.lock',
  '**/composer.lock',

  // IDE and editor files
  '**/.vscode',
  '**/.idea',
  '**/*.swp',
  '**/*.swo',
  '**/.DS_Store',

  // Logs
  '**/logs',
  '**/*.log',
  '**/npm-debug.log*',
  '**/yarn-debug.log*',
  '**/yarn-error.log*',

  // OS generated files
  '**/.DS_Store',
  '**/.DS_Store?',
  '**/._*',
  '**/.Spotlight-V100',
  '**/.Trashes',
  '**/ehthumbs.db',
  '**/Thumbs.db',

  // Test coverage
  '**/coverage',
  '**/.nyc_output',

  // Temporary files
  '**/tmp',
  '**/temp',
];

export async function processFiles(
  options: ProcessOptions,
): Promise<FileInfo[]> {
  const {
    path: basePath,
    gitignorePath = '.gitignore',
    filter = [],
    exclude = [],
    suppressComments = false,
    caseSensitive = false,
    customIgnores = [],
    cachePath = path.join(os.tmpdir(), 'codewhisper-cache.json'),
  } = options;

  const fileCache = new FileCache(cachePath);
  const ig = ignore().add(DEFAULT_IGNORES).add(customIgnores);

  if (await fs.pathExists(gitignorePath)) {
    const gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');
    ig.add(gitignoreContent);
  }

  const globOptions: fastGlob.Options = {
    cwd: basePath,
    dot: true,
    absolute: true,
    onlyFiles: true,
    followSymbolicLinks: false,
    caseSensitiveMatch: caseSensitive,
    ignore: exclude,
  };

  const fileInfos: FileInfo[] = [];
  const globStream = fastGlob.stream('**/*', globOptions);

  return new Promise((resolve, reject) => {
    globStream.on('data', async (filePath: string) => {
      const relativePath = path.relative(basePath, filePath);
      if (ig.ignores(relativePath)) return;
      if (
        filter.length > 0 &&
        !filter.some((pattern) => new RegExp(pattern).test(filePath))
      )
        return;

      try {
        const cached = await fileCache.get(filePath);
        if (cached) {
          fileInfos.push(cached);
          return;
        }

        const stats = await fs.stat(filePath);
        if (!stats.isFile()) return;

        const buffer = await fs.readFile(filePath);
        if (await isBinaryFile(buffer)) return;

        const result = await piscina.run({ filePath, suppressComments });

        if (result) {
          await fileCache.set(filePath, result as FileInfo);
          fileInfos.push(result as FileInfo);
        }
      } catch (error) {
        console.error(`Error processing file ${filePath}:`, error);
      }
    });

    globStream.on('end', () => resolve(fileInfos));
    globStream.on('error', (error) => reject(new Error(error)));
  });
}

export const testExports = {
  piscina,
};
