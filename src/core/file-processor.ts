import path from 'node:path';
import fs from 'fs-extra';
import { glob } from 'glob';
import { Minimatch } from 'minimatch';
import { stripComments } from '../utils/comment-stripper';
import { parseGitignore } from '../utils/gitignore-parser';
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
}

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
  } = options;

  const gitignoreFilter = await parseGitignore(gitignorePath);
  const globOptions = { nocase: !caseSensitive, ignore: exclude };

  const filterMatchers = filter.map(
    (pattern) => new Minimatch(pattern, { nocase: !caseSensitive }),
  );
  const excludeMatchers = exclude.map(
    (pattern) => new Minimatch(pattern, { nocase: !caseSensitive }),
  );

  const filePaths = glob
    .sync(path.join(basePath, '**', '*'), globOptions)
    .filter((filePath) => {
      const relativePath = path.relative(basePath, filePath);
      return !gitignoreFilter.ignores(relativePath);
    })
    .filter((filePath) => {
      if (filterMatchers.length === 0) return true;
      return filterMatchers.some((matcher) => matcher.match(filePath));
    })
    .filter((filePath) => {
      return !excludeMatchers.some((matcher) => matcher.match(filePath));
    });

  const fileInfos: FileInfo[] = await Promise.all(
    filePaths.map(async (filePath) => {
      const stats = await fs.stat(filePath);
      let content = await fs.readFile(filePath, 'utf-8');
      const extension = path.extname(filePath).slice(1);
      const language = detectLanguage(filePath);

      if (suppressComments) {
        content = stripComments(content, language);
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
    }),
  );

  return fileInfos;
}
