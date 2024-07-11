import os from 'node:os';
import path, { resolve } from 'node:path';
import fastGlob from 'fast-glob';
import fs from 'fs-extra';
import ignore from 'ignore';
import { isBinaryFile } from 'isbinaryfile';
import Piscina from 'piscina';
import { FileCache } from '../utils/file-cache';
import { filename } from './file-worker';

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

const isDist = path
  .dirname(new URL(import.meta.url).pathname)
  .includes('/dist/');
const workerFilename = 'file-worker.js';
const workerFilePath = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  '../core',
  workerFilename,
);

const pool = new Piscina({ filename: workerFilePath });

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

  // OS generated files
  '**/.DS_Store',
  '**/.DS_Store?',
  '**/._*',
  '**/.Spotlight-V100',
  '**/.Trashes',
  '**/ehthumbs.db',
  '**/Thumbs.db',

  // Logs
  '**/logs',
  '**/*.log',
  '**/npm-debug.log*',
  '**/yarn-debug.log*',
  '**/yarn-error.log*',

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
  const tasks: Promise<void>[] = [];

  const globStream = fastGlob.stream('**/*', globOptions);

  return new Promise((resolve, reject) => {
    globStream.on('data', (filePath) => {
      tasks.push(
        (async () => {
          const filePathStr = filePath.toString();
          const relativePath = path.relative(basePath, filePathStr);

          if (ig.ignores(relativePath)) return;

          if (
            filter.length > 0 &&
            !filter.some((pattern) => new RegExp(pattern).test(filePathStr))
          )
            return;

          try {
            const cached = await fileCache.get(filePathStr);
            if (cached) {
              fileInfos.push(cached);
              return;
            }

            const stats = await fs.stat(filePathStr);
            if (!stats.isFile()) return;

            const buffer = await fs.readFile(filePathStr);
            if (await isBinaryFile(buffer)) return;

            const result = await pool.run({
              filePath: filePathStr,
              suppressComments,
            });

            if (result) {
              await fileCache.set(filePathStr, result as FileInfo);
              fileInfos.push(result as FileInfo);
            }
          } catch (error) {
            console.error(`Error processing file ${filePathStr}:`, error);
          }
        })(),
      );
    });

    globStream.on('end', async () => {
      await Promise.all(tasks);
      fileInfos.sort((a, b) => a.path.localeCompare(b.path));
      resolve(fileInfos);
    });

    globStream.on('error', reject);
  });
}

export const testExports = {
  pool,
};
