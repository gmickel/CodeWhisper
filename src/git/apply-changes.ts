import path from 'node:path';
import chalk from 'chalk';
import fs from 'fs-extra';
import type { AIFileInfo, ApplyChangesOptions } from '../types';

export async function applyChanges({
  basePath,
  parsedResponse,
  dryRun = false,
}: ApplyChangesOptions): Promise<void> {
  try {
    for (const file of parsedResponse.files) {
      await applyFileChange(basePath, file, dryRun);
    }
    console.log(
      chalk.green(
        dryRun ? 'Dry run completed.' : 'All changes applied successfully.',
      ),
    );
  } catch (error) {
    console.error(chalk.red('Error applying changes:'), error);
    throw error;
  }
}

async function applyFileChange(
  basePath: string,
  file: AIFileInfo,
  dryRun: boolean,
): Promise<void> {
  const fullPath = path.join(basePath, file.path);
  try {
    switch (file.status) {
      case 'new':
        if (dryRun) {
          console.log(
            chalk.yellow(`[DRY RUN] Would create file: ${file.path}`),
          );
          console.log(
            chalk.gray(
              `[DRY RUN] Content preview:\n${file.content?.substring(0, 200)}${file.content && file.content.length > 200 ? '...' : ''}`,
            ),
          );
        } else {
          await fs.ensureDir(path.dirname(fullPath));
          await fs.writeFile(fullPath, file.content || '');
          console.log(chalk.green(`Created file: ${file.path}`));
        }
        break;
      case 'modified':
        if (dryRun) {
          console.log(
            chalk.yellow(`[DRY RUN] Would modify file: ${file.path}`),
          );
          file.changes?.forEach((change, index) => {
            console.log(
              chalk.gray(
                `[DRY RUN] Change ${index + 1} preview:\nSearch:\n${change.search.substring(0, 100)}${change.search.length > 100 ? '...' : ''}\nReplace:\n${change.replace.substring(0, 100)}${change.replace.length > 100 ? '...' : ''}`,
              ),
            );
          });
        } else {
          if (file.changes && file.changes.length > 0) {
            let currentContent = await fs.readFile(fullPath, 'utf-8');
            for (const change of file.changes) {
              currentContent = applyChange(
                currentContent,
                change.search,
                change.replace,
              );
            }
            await fs.writeFile(fullPath, currentContent);
          } else {
            throw new Error(
              `No changes provided for modified file: ${file.path}`,
            );
          }
          console.log(chalk.green(`Modified file: ${file.path}`));
        }
        break;
      case 'deleted':
        if (dryRun) {
          console.log(
            chalk.yellow(`[DRY RUN] Would delete file: ${file.path}`),
          );
        } else {
          await fs.remove(fullPath);
          console.log(chalk.green(`Deleted file: ${file.path}`));
        }
        break;
    }
  } catch (error) {
    console.error(chalk.red(`Error applying change to ${file.path}:`), error);
    throw error;
  }
}

function applyChange(content: string, search: string, replace: string): string {
  const trimmedSearch = search.trim();
  const trimmedReplace = replace.trim();

  if (content.includes(trimmedSearch)) {
    return content.replace(trimmedSearch, trimmedReplace);
  }

  // If exact match fails, try matching with flexible whitespace
  const flexibleSearch = trimmedSearch.replace(/\s+/g, '\\s+');
  const regex = new RegExp(flexibleSearch, 'g');

  if (regex.test(content)) {
    return content.replace(regex, trimmedReplace);
  }

  throw new Error(
    'Failed to apply changes: search content not found in the file',
  );
}
