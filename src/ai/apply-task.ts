import path from 'node:path';
import chalk from 'chalk';
import fs from 'fs-extra';
import simpleGit from 'simple-git';
import { applyChanges } from '../git/apply-changes';
import { createBranchAndCommit, ensureBranch } from '../utils/git-tools';

export async function applyTask(
  filePath: string,
  autoCommit = false,
): Promise<void> {
  try {
    const absolutePath = path.resolve(filePath);
    const taskOutput = await fs.readJSON(absolutePath);

    const { parsedResponse } = taskOutput;

    const basePath = process.cwd();

    const actualBranchName = await ensureBranch(
      basePath,
      parsedResponse.gitBranchName,
    );

    await applyChanges({
      basePath: process.cwd(),
      parsedResponse,
      dryRun: false,
    });

    if (autoCommit) {
      const git = simpleGit(basePath);
      await git.add('.');
      await git.commit(parsedResponse.gitCommitMessage);
      console.log(
        chalk.green(
          `Task applied and committed successfully to branch: ${actualBranchName}`,
        ),
      );
    } else {
      console.log(
        chalk.green(`Task applied successfully to branch: ${actualBranchName}`),
      );
      console.log(chalk.yellow('Changes have been applied but not committed.'));
      console.log(
        chalk.cyan('Please review the changes in your IDE before committing.'),
      );
      console.log(
        chalk.cyan('To commit the changes, use the following commands:'),
      );
      console.log(chalk.cyan('  git add .'));
      console.log(
        chalk.cyan(`  git commit -m "${parsedResponse.gitCommitMessage}"`),
      );
    }

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
