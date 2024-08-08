import { confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import simpleGit, { type SimpleGit } from 'simple-git';
import type { UndoTaskOptions } from '../types/index.js';
import { findOriginalBranch } from '../utils/git-tools.js';
import getLogger from '../utils/logger.js';

export async function undoTaskChanges(options: UndoTaskOptions): Promise<void> {
  const git: SimpleGit = simpleGit(options.path);
  const logger = getLogger(true);

  try {
    const currentBranch = await git.revparse(['--abbrev-ref', 'HEAD']);
    const isDetachedHead = currentBranch === 'HEAD';
    const originalBranch = await findOriginalBranch(git);

    const status = await git.status();

    if (!status.isClean()) {
      const confirmDiscard = await confirm({
        message: `This will discard all uncommitted changes${isDetachedHead ? ' and switch back to the original branch' : ` in the current branch "${currentBranch}"`}. Are you sure you want to continue?`,
      });

      if (confirmDiscard) {
        await git.reset(['--hard']);
        await git.clean('f', ['-d']);
        console.log(
          chalk.green('Successfully discarded all uncommitted changes.'),
        );
        logger.info('Discarded uncommitted changes', { branch: currentBranch });
      } else {
        console.log(chalk.yellow('Undo operation cancelled.'));
        return;
      }
    }

    if (isDetachedHead || currentBranch !== originalBranch) {
      const confirmSwitch = await confirm({
        message: `This will switch back to the original branch "${originalBranch}"${currentBranch !== 'HEAD' ? ` and delete the current branch "${currentBranch}"` : ''}. Are you sure you want to continue?`,
      });

      if (confirmSwitch) {
        await git.checkout(originalBranch);
        if (currentBranch !== 'HEAD') {
          await git.deleteLocalBranch(currentBranch, true);
        }
        console.log(
          chalk.green(
            `Successfully switched to ${originalBranch}${currentBranch !== 'HEAD' ? ` and deleted ${currentBranch}` : ''}.`,
          ),
        );
        logger.info('Switched to original branch and deleted AI task branch', {
          originalBranch,
          deletedBranch: currentBranch,
        });
      } else {
        console.log(chalk.yellow('Undo operation cancelled.'));
      }
    } else {
      console.log(
        chalk.green(
          'Already on the original branch. No further action needed.',
        ),
      );
    }
  } catch (error) {
    console.error(chalk.red('Error during undo operation:'), error);
    logger.error('Error during undo operation', { error });
    throw error;
  }
}
