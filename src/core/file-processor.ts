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
    dot: true,
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
