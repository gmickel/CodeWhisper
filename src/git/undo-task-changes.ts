import { confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import simpleGit, { type SimpleGit } from 'simple-git';
import type { UndoTaskOptions } from '../types/index.js';
import { findDefaultBranch, findParentBranch } from '../utils/git-tools.js';
import getLogger from '../utils/logger.js';

export async function undoTaskChanges(options: UndoTaskOptions): Promise<void> {
  const git: SimpleGit = simpleGit(options.path);
  const logger = getLogger(true);

  try {
    const currentBranch = await git.revparse(['--abbrev-ref', 'HEAD']);
    const parentBranch = await findParentBranch(git, currentBranch);
    const defaultBranch = parentBranch || (await findDefaultBranch(git));
    if (!defaultBranch) {
      console.log(
        chalk.yellow('No default branch found. Cannot undo changes.'),
      );
      return;
    }

    const status = await git.status();

    if (status.isClean()) {
      if (currentBranch === defaultBranch) {
        const lastCommit = await git.log(['-1', '--pretty=%H %s']);
        if (lastCommit.latest) {
          const { hash, message } = lastCommit.latest;
          const confirmRevert = await confirm({
            message: `This will revert the last commit:\n"${message}"\n\nAre you sure you want to continue?`,
          });

          if (confirmRevert) {
            await git.revert(hash);
            console.log(chalk.green('Successfully reverted the last commit.'));
            logger.info('Reverted last commit', {
              branch: currentBranch,
              commit: hash,
            });
          } else {
            console.log(chalk.yellow('Undo operation cancelled.'));
          }
        } else {
          console.log(chalk.yellow('No commits found to undo.'));
        }
      } else {
        const confirmDelete = await confirm({
          message: `This will delete the current branch "${currentBranch}" and switch back to "${defaultBranch}". Are you sure you want to continue?`,
        });

        if (confirmDelete) {
          await git.checkout(defaultBranch);
          await git.deleteLocalBranch(currentBranch, true);
          console.log(
            chalk.green(
              `Successfully switched to ${defaultBranch} and deleted ${currentBranch}.`,
            ),
          );
          logger.info('Deleted AI task branch and switched to default', {
            deletedBranch: currentBranch,
            defaultBranch,
          });
        } else {
          console.log(chalk.yellow('Undo operation cancelled.'));
        }
      }
    } else {
      const confirmDiscard = await confirm({
        message: `This will discard all uncommitted changes in the current branch "${currentBranch}". Are you sure you want to continue?`,
      });

      if (confirmDiscard) {
        await git.reset(['--hard']);
        if (currentBranch !== defaultBranch) {
          await git.checkout(defaultBranch);
          await git.deleteLocalBranch(currentBranch, true);
          console.log(
            chalk.green(
              `Successfully discarded changes, switched to ${defaultBranch}, and deleted ${currentBranch}.`,
            ),
          );
        } else {
          console.log(
            chalk.green('Successfully discarded all uncommitted changes.'),
          );
        }
        logger.info('Discarded uncommitted changes', { branch: currentBranch });
      } else {
        console.log(chalk.yellow('Undo operation cancelled.'));
      }
    }
  } catch (error) {
    console.error(chalk.red('Error during undo operation:'), error);
    logger.error('Error during undo operation', { error });
    throw error;
  }
}
