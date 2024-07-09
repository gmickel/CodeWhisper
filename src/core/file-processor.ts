import path from 'node:path';
import fs from 'fs-extra';
import { glob } from 'glob';
import ignore from 'ignore';
import isbinaryfile from 'isbinaryfile';
import { detectLanguage } from '../utils/language-detector';

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
}

const DEFAULT_IGNORES = [
  // Version control
  '.git',
  '.svn',
  '.hg',

  // Package manager files
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'bun.lockb',

  // Other package managers (examples)
  'Gemfile.lock', // Ruby
  'Cargo.lock', // Rust
  'poetry.lock', // Python
  'composer.lock', // PHP

  // Build outputs and caches
  'node_modules',
  'dist',
  'build',
  '.cache',

  // IDE and editor files
  '.vscode',
  '.idea',
  '*.swp',
  '*.swo',
  '.DS_Store',
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
  } = options;

  const ig = ignore();

  // Add default ignores
  ig.add(DEFAULT_IGNORES);

  // Add custom ignores
  ig.add(customIgnores);

  // Add .gitignore patterns
  if (await fs.pathExists(gitignorePath)) {
    const gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');
    ig.add(gitignoreContent);
  }

  const globOptions = {
    nocase: !caseSensitive,
    ignore: exclude,
    dot: true, // Include dotfiles
  };

  const filePaths = await glob(path.join(basePath, '**', '*'), globOptions);

  const fileInfos: FileInfo[] = (
    await Promise.all(
      filePaths
        .filter((filePath) => !ig.ignores(path.relative(basePath, filePath)))
        .map(async (filePath) => {
          try {
            const stats = await fs.stat(filePath);

            if (!stats.isFile()) {
              return null;
            }

            const buffer = await fs.readFile(filePath);
            if (await isbinaryfile.isBinaryFile(buffer)) {
              return null;
            }

            const content = buffer.toString('utf-8');
            const extension = path.extname(filePath).slice(1);
            const language = detectLanguage(filePath);

            if (suppressComments) {
              // Here you would implement comment suppression logic
              // This depends on the language and might require a separate module
            }

            return {
              path: filePath,
              extension,
              language,
              size: stats.size,
              created: stats.birthtime,
              modified: stats.mtime,
              content,
            };
          } catch (error) {
            console.error(`Error processing file ${filePath}:`, error);
            return null;
          }
        }),
    )
  ).filter((fileInfo): fileInfo is FileInfo => fileInfo !== null);

  return fileInfos;
}
