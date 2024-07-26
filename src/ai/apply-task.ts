import path from 'node:path';
import chalk from 'chalk';
import fs from 'fs-extra';
import simpleGit from 'simple-git';
import { applyChanges } from '../git/apply-changes';
import { createBranchAndCommit, ensureBranch } from '../utils/git-tools';

export async function applyTask(filePath: string): Promise<void> {
  try {
    const absolutePath = path.resolve(filePath);
    const taskOutput = await fs.readJSON(absolutePath);

    const { parsedResponse } = taskOutput;

    const basePath = process.cwd();

    await ensureBranch(basePath, parsedResponse.gitBranchName);

    await applyChanges({
      basePath: process.cwd(),
      parsedResponse,
      dryRun: false,
    });

    const git = simpleGit(basePath);
    await git.add('.');
    await git.commit(parsedResponse.gitCommitMessage);

    console.log(
      chalk.green(
        `Task applied successfully. Changes committed to branch: ${parsedResponse.gitBranchName}`,
      ),
    );
    console.log(chalk.blue('Commit Message:'), parsedResponse.gitCommitMessage);
    console.log(chalk.blue('Summary:'), parsedResponse.summary);
    if (parsedResponse.potentialIssues) {
      console.log(
        chalk.yellow('Potential Issues:'),
        parsedResponse.potentialIssues,
      );
    }
  } catch (error) {
    console.error(chalk.red('Error applying task:'), error);
    throw error;
  }
}
