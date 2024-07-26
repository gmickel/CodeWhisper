import path from 'node:path';
import chalk from 'chalk';
import fs from 'fs-extra';
import simpleGit, { type SimpleGit } from 'simple-git';
import type {
  AIFileInfo,
  AIParsedResponse,
  ApplyChangesOptions,
} from '../types';

export async function applyChanges({
  basePath,
  parsedResponse,
  dryRun = false,
}: ApplyChangesOptions): Promise<void> {
  const git: SimpleGit = simpleGit(basePath);

  try {
    const { gitBranchName, gitCommitMessage, files } = parsedResponse;

    if (dryRun) {
      console.log(
        chalk.yellow(`[DRY RUN] Would create new branch: ${gitBranchName}`),
      );
    } else {
      await git.checkoutLocalBranch(gitBranchName);
      console.log(chalk.green(`Created new branch: ${gitBranchName}`));
    }

    for (const file of files) {
      await applyFileChange(basePath, file, dryRun);
    }

    if (dryRun) {
      console.log(chalk.yellow('[DRY RUN] Would stage all changes'));
      console.log(
        chalk.yellow(
          `[DRY RUN] Would commit changes with message: ${gitCommitMessage}`,
        ),
      );
    } else {
      await git.add('.');
      await git.commit(gitCommitMessage);
      console.log(chalk.green(`Committed changes: ${gitCommitMessage}`));
    }

    console.log(
      chalk.green(
        dryRun
          ? 'Dry run completed.'
          : 'All changes applied and committed successfully.',
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
      case 'modified':
        if (dryRun) {
          console.log(
            chalk.yellow(
              `[DRY RUN] Would ${file.status === 'new' ? 'create' : 'modify'} file: ${file.path}`,
            ),
          );
          console.log(
            chalk.gray(
              `[DRY RUN] Content preview:\n${file.content.substring(0, 200)}${file.content.length > 200 ? '...' : ''}`,
            ),
          );
        } else {
          await fs.ensureDir(path.dirname(fullPath));
          await fs.writeFile(fullPath, file.content);
          console.log(
            chalk.green(
              `${file.status === 'new' ? 'Created' : 'Modified'} file: ${file.path}`,
            ),
          );
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
