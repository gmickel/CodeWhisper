import path from 'node:path';
import url from 'node:url';
import { input, select } from '@inquirer/prompts';
import chalk from 'chalk';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import inquirerFileTreeSelection from 'inquirer-file-tree-selection-prompt';
import { type FileInfo, processFiles } from '../core/file-processor';
import { generateMarkdown } from '../core/markdown-generator';

inquirer.registerPrompt('file-tree-selection', inquirerFileTreeSelection);
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

export async function interactiveMode(basePath: string) {
  try {
    const selectedFiles = await selectFiles(basePath);
    const template = await selectTemplate();
    const outputPath = await getOutputPath(basePath);

    console.log(chalk.cyan('\nProcessing selected files...'));
    const processedFiles = await processSelectedFiles(basePath, selectedFiles);

    console.log(chalk.cyan('\nGenerating markdown...'));
    const templateContent = await fs.readFile(
      path.join(__dirname, '../templates', `${template}.hbs`),
      'utf-8',
    );
    const markdown = await generateMarkdown(processedFiles, templateContent, {
      basePath,
    });

    // Decode HTML entities
    const decodedMarkdown = decodeHTMLEntities(markdown);

    if (outputPath === 'stdout') {
      console.log(chalk.green('\nGenerated Markdown:'));
      console.log(decodedMarkdown);
    } else {
      await fs.writeFile(outputPath, decodedMarkdown, 'utf8');
      console.log(chalk.green(`\nMarkdown saved to: ${outputPath}`));
    }

    console.log(chalk.green('\nInteractive mode completed!'));
  } catch (error) {
    console.error(chalk.red('Error in interactive mode:'), error);
  }
}

async function selectFiles(basePath: string): Promise<string[]> {
  const answer = await inquirer.prompt([
    {
      type: 'file-tree-selection',
      name: 'selectedFiles',
      message: 'Select files and directories:',
      root: basePath,
      multiple: true,
      enableGoUpperDirectory: true,
      onlyShowValid: false,
      hideChildrenOfValid: false,
      validate: (item: string) => true, // You can implement custom validation here
    },
  ]);

  return Array.isArray(answer.selectedFiles)
    ? answer.selectedFiles.map((file: string) => path.relative(basePath, file))
    : [path.relative(basePath, answer.selectedFiles)];
}

async function selectTemplate(): Promise<string> {
  const templates = await fs.readdir(path.join(__dirname, '../templates'));
  return select({
    message: 'Select a template:',
    choices: templates.map((t) => ({
      value: t.replace('.hbs', ''),
      name: t.replace('.hbs', ''),
    })),
  });
}

async function getOutputPath(basePath: string): Promise<string> {
  const defaultFileName = `${path.basename(basePath)}.md`;
  const defaultPath = path.join(basePath, defaultFileName);
  return input({
    message:
      'Enter the output file path (or "" (empty string) for console/stdout output):',
    default: defaultPath,
    transformer: (input: string) => {
      return input === defaultPath ? defaultFileName : input;
    },
  });
}

async function processSelectedFiles(
  basePath: string,
  selectedPaths: string[],
): Promise<FileInfo[]> {
  const processOptions = {
    path: basePath,
    filter: selectedPaths.map((p) => (p.endsWith('/') ? `${p}**/*` : p)), // Handle directories
    // Add other options as needed
  };

  // debug this

  return processFiles(processOptions);
}

function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}
