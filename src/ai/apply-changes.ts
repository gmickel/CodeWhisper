import { tmpdir } from 'node:os';
import path from 'node:path';
import chalk from 'chalk';
import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
import type { AIFileInfo, ApplyChangesOptions } from '../types';
import { applySearchReplace } from './parsers/search-replace-parser';

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
  const tempPath = path.join(tmpdir(), `codewhisper-${uuidv4()}`);

  console.log(chalk.cyan(`Processing file: ${file.path}`));
  console.log(chalk.cyan(`File status: ${file.status}`));

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
          await fs.writeFile(tempPath, file.content || '');
          await fs.move(tempPath, fullPath, { overwrite: true });
          console.log(chalk.green(`Created file: ${file.path}`));
        }
        break;
      case 'modified':
        if (dryRun) {
          console.log(
            chalk.yellow(`[DRY RUN] Would modify file: ${file.path}`),
          );
          if (file.changes) {
            console.log(
              chalk.gray(
                `[DRY RUN] Changes preview:\n${JSON.stringify(file.changes, null, 2)}`,
              ),
            );
          } else if (file.content) {
            console.log(
              chalk.gray(
                `[DRY RUN] Full content replacement preview:\n${file.content.substring(0, 200)}${file.content.length > 200 ? '...' : ''}`,
              ),
            );
          }
        } else {
          let currentContent: string;
          try {
            currentContent = await fs.readFile(fullPath, 'utf-8');
          } catch (error) {
            console.error(chalk.red(`Error reading file ${file.path}:`, error));
            throw error;
          }

          // Write current content to temp file first
          await fs.writeFile(tempPath, currentContent);
          console.log(
            chalk.cyan(`Wrote original content to temp file: ${tempPath}`),
          );

          let updatedContent: string;

          if (file.changes && file.changes.length > 0) {
            console.log(
              chalk.cyan(
                `Applying ${file.changes.length} changes in diff mode`,
              ),
            );
            updatedContent = applySearchReplace(currentContent, file.changes);
            if (updatedContent === currentContent) {
              console.log(chalk.yellow(`No changes applied to: ${file.path}`));
              await fs.remove(tempPath);
              return;
            }
            // Write updated content to temp file
            await fs.writeFile(tempPath, updatedContent);
          } else if (file.content) {
            console.log('Applying whole file edit');
            updatedContent = file.content;
            // Write new content to temp file
            await fs.writeFile(tempPath, updatedContent);
          } else {
            console.log(chalk.yellow(`No changes to apply for: ${file.path}`));
            await fs.remove(tempPath);
            return;
          }

          // Move temp file to overwrite original file
          await fs.move(tempPath, fullPath, { overwrite: true });
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
    try {
      await fs.remove(tempPath);
    } catch (removeError) {
      console.error(
        chalk.yellow(`Failed to remove temp file: ${tempPath}`),
        removeError,
      );
    }
    throw error;
  }
}
