import path from 'node:path';
import chalk from 'chalk';
import { applyPatch } from 'diff';
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
          if (file.diff) {
            console.log(
              chalk.gray(
                `[DRY RUN] Diff preview:\n${JSON.stringify(file.diff, null, 2)}`,
              ),
            );
          } else if (file.changes) {
            console.log(
              chalk.gray(
                `[DRY RUN] Changes preview:\n${JSON.stringify(file.changes, null, 2)}`,
              ),
            );
          } else if (file.content) {
            console.log(
              chalk.gray(
                `[DRY RUN] Content preview:\n${file.content.substring(0, 200)}${file.content.length > 200 ? '...' : ''}`,
              ),
            );
          }
        } else {
          if (file.diff) {
            const currentContent = await fs.readFile(fullPath, 'utf-8');
            const updatedContent = applyPatch(currentContent, file.diff);
            if (updatedContent === false) {
              throw new Error(
                `Failed to apply patch to file: ${file.path}\nA common cause is that the file was not sent to the LLM and it hallucinated the content. Try running the task again (task --redo) and selecting the problematic file.`,
              );
            }
            await fs.writeFile(fullPath, updatedContent);
          } else if (file.changes) {
            let currentContent = await fs.readFile(fullPath, 'utf-8');
            for (const change of file.changes) {
              currentContent = applyChange(
                currentContent,
                change.search,
                change.replace,
              );
            }
            await fs.writeFile(fullPath, currentContent);
          } else if (file.content) {
            await fs.writeFile(fullPath, file.content);
          } else {
            throw new Error(
              `No content, diff, or changes provided for modified file: ${file.path}`,
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

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function applyChange(content: string, search: string, replace: string): string {
  const trimmedSearch = search.trim();
  const trimmedReplace = replace.trim();

  const escapedSearch = escapeRegExp(trimmedSearch);
  const regex = new RegExp(escapedSearch, 'g');

  if (regex.test(content)) {
    return content.replace(regex, trimmedReplace);
  }

  // If exact match fails, try matching with flexible whitespace
  const flexibleSearch = escapedSearch.replace(/\s+/g, '\\s+');
  const flexibleRegex = new RegExp(flexibleSearch, 'g');

  if (flexibleRegex.test(content)) {
    return content.replace(flexibleRegex, (match) => {
      const leadingWhitespace = match.match(/^\s*/)?.[0] || '';
      const trailingWhitespace = match.match(/\s*$/)?.[0] || '';
      return leadingWhitespace + trimmedReplace + trailingWhitespace;
    });
  }

  throw new Error(
    'Failed to apply changes: search content not found in the file',
  );
}
