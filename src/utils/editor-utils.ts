import { exec } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import chalk from 'chalk';
import fs from 'fs-extra';
import type { Ora } from 'ora';

const execAsync = promisify(exec);

interface EditorOptions {
  content: string;
  outputPath: string | 'stdout';
  openEditor: boolean;
  spinner?: Ora;
}

export async function handleEditorAndOutput(
  options: EditorOptions,
): Promise<void> {
  const { content, outputPath, openEditor, spinner } = options;

  if (outputPath !== 'stdout') {
    await fs.writeFile(outputPath, content, 'utf8');
    spinner?.succeed(chalk.green(`Output written to ${outputPath}`));

    if (openEditor) {
      await openInEditor(outputPath, spinner);
    }
  } else {
    if (openEditor) {
      const tempFile = path.join(os.tmpdir(), 'codewhisper-output.md');
      await fs.writeFile(tempFile, content, 'utf8');
      console.log(chalk.cyan(`Temporary file created: ${tempFile}`));
      console.log(
        chalk.yellow(
          'The file will be opened in your default editor. You can make changes before copying the content to your clipboard.',
        ),
      );
      await openInEditor(tempFile, spinner);
    } else {
      spinner?.stop();
      console.log(chalk.cyan('\nGenerated Output:'));
      console.log(content);
    }
  }
}

async function openInEditor(filePath: string, spinner?: Ora): Promise<void> {
  const editor = process.env.VISUAL || process.env.EDITOR || 'nano';
  try {
    spinner?.start('Opening editor...');
    await execAsync(`${editor} "${filePath}"`);
    spinner?.succeed(chalk.green('Editor closed.'));
  } catch (error: unknown) {
    if (error instanceof Error) {
      spinner?.fail(chalk.red(`Failed to open editor: ${error.message}`));
    } else {
      spinner?.fail(chalk.red('Failed to open editor: Unknown error'));
    }
  }
}
