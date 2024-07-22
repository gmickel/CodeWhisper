import path from 'node:path';
import { editor, input, select } from '@inquirer/prompts';
import chalk from 'chalk';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import inquirerFileTreeSelection from 'inquirer-file-tree-selection-prompt';
import ora from 'ora';
import { processFiles } from '../core/file-processor';
import {
  type MarkdownOptions,
  generateMarkdown,
} from '../core/markdown-generator';
import { getCachedValue, setCachedValue } from '../utils/cache-utils';
import {
  extractTemplateVariables,
  getAvailableTemplates,
  getTemplatePath,
} from '../utils/template-utils';

inquirer.registerPrompt('file-tree-selection', inquirerFileTreeSelection);

interface InteractiveModeOptions {
  path?: string;
  template?: string;
  prompt?: string;
  gitignore?: string;
  filter?: string[];
  exclude?: string[];
  suppressComments?: boolean;
  caseSensitive?: boolean;
  noCodeblock?: boolean;
  customData?: string;
  customTemplate?: string;
  customIgnores?: string[];
  cachePath?: string;
  respectGitignore?: boolean;
  invert?: boolean;
  lineNumbers?: boolean;
}

export async function interactiveMode(options: InteractiveModeOptions) {
  const spinner = ora();
  try {
    const basePath = path.resolve(options.path ?? '.');

    const userFilters = options.filter || [];

    const selectedFiles = await selectFiles(basePath, options.invert ?? false);

    // Combine user filters with selected files
    const combinedFilters = [...new Set([...userFilters, ...selectedFiles])];

    console.log(
      chalk.cyan(`Files to be ${options.invert ? 'excluded' : 'included'}:`),
    );
    for (const filter of combinedFilters) {
      console.log(chalk.cyan(`  ${filter}`));
    }

    let templatePath: string;
    if (options.template) {
      templatePath = getTemplatePath(options.template);
    } else if (options.customTemplate) {
      templatePath = options.customTemplate;
    } else {
      templatePath = await selectTemplate();
    }

    const templateContent = await fs.readFile(templatePath, 'utf-8');
    const variables = extractTemplateVariables(templateContent);

    let customData: { [key: string]: string } = {};
    if (options.customData) {
      try {
        customData = JSON.parse(options.customData);
      } catch (error) {
        console.error(chalk.red('Error parsing custom data JSON:'), error);
        process.exit(1);
      }
    } else if (variables.length > 0) {
      for (const variable of variables) {
        const cacheKey = `${path.basename(templatePath, '.hbs')}_${variable.name}`;
        const cachedValue = await getCachedValue(cacheKey, options.cachePath);

        if (variable.isMultiline) {
          const answer = await editor({
            message: `Enter value for ${variable.name} (multiline):`,
            default: cachedValue ?? undefined,
          });
          customData[variable.name] = answer;
        } else {
          const answer = await inquirer.prompt([
            {
              type: 'input',
              name: variable.name,
              message: `Enter value for ${variable.name}:`,
              default: cachedValue ?? undefined,
            },
          ]);
          customData[variable.name] = answer[variable.name];
        }

        await setCachedValue(
          cacheKey,
          customData[variable.name],
          options.cachePath,
        );
      }
    }
    const outputPath = await getOutputPath(basePath);

    spinner.start('Processing files...');
    const processedFiles = await processFiles({
      ...options,
      path: basePath,
      filter: options.invert ? undefined : combinedFilters,
      exclude: options.invert ? combinedFilters : options.exclude,
    });
    spinner.succeed('Files processed successfully');

    spinner.start('Generating markdown...');
    const markdownOptions: MarkdownOptions = {
      noCodeblock: options.noCodeblock,
      basePath,
      customData,
      lineNumbers: options.lineNumbers,
    };

    let markdown = await generateMarkdown(
      processedFiles,
      templateContent,
      markdownOptions,
    );

    if (options.prompt) {
      markdown += `\n\n## Your Task\n\n${options.prompt}`;
    }

    spinner.succeed('Markdown generated successfully');

    if (outputPath === 'stdout') {
      console.log(chalk.cyan('\nGenerated Markdown:'));
      console.log(markdown);
    } else {
      await fs.writeFile(outputPath, markdown, 'utf8');
      console.log(chalk.cyan(`\nMarkdown saved to: ${outputPath}`));
    }

    console.log(chalk.green('\nInteractive mode completed!'));
  } catch (error) {
    spinner.fail('Error in interactive mode');
    console.error(
      chalk.red(error instanceof Error ? error.message : String(error)),
    );
  }
}

async function selectFiles(
  basePath: string,
  invert: boolean,
): Promise<string[]> {
  const answer = await inquirer.prompt([
    {
      type: 'file-tree-selection',
      name: 'selectedFiles',
      message: `Select files and directories to be ${invert ? 'excluded' : 'included'}:`,
      pageSize: 20,
      root: basePath,
      multiple: true,
      enableGoUpperDirectory: false,
      onlyShowValid: false,
      hideChildrenOfValid: false,
      validate: () => true,
      transformer: (item: string) => path.basename(item),
    },
  ]);

  let selectedFilesOrDirs = Array.isArray(answer.selectedFiles)
    ? answer.selectedFiles.map((file: string) => path.relative(basePath, file))
    : [path.relative(basePath, answer.selectedFiles)];

  // Process the selected files/directories
  selectedFilesOrDirs = selectedFilesOrDirs.map((fileOrDir: string) => {
    const fullPath = path.join(basePath, fileOrDir);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
      return path.join(fileOrDir, '**/*');
    }
    return fileOrDir;
  });

  // If the top-level directory is selected, use '**/*' to include all files
  if (selectedFilesOrDirs.length === 1 && selectedFilesOrDirs[0] === '') {
    selectedFilesOrDirs = ['**/*'];
  }

  return selectedFilesOrDirs;
}

async function selectTemplate(): Promise<string> {
  const templates = await getAvailableTemplates();
  const selected = await select({
    message: 'Select a template:',
    choices: templates.map((t) => ({
      value: t.path,
      name: t.name,
    })),
  });
  return selected;
}

async function getOutputPath(basePath: string): Promise<string> {
  const defaultFileName = `${path.basename(basePath)}.md`;
  const defaultPath = path.join(basePath, defaultFileName);
  const outputPath = await input({
    message: 'Enter the output file path (or "" for console/stdout output):',
    default: defaultPath,
  });
  return outputPath.trim() === '' ? 'stdout' : outputPath;
}