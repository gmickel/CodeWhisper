import { exec } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import url from 'node:url';
import { promisify } from 'node:util';

import { editor, input } from '@inquirer/prompts';
import chalk from 'chalk';
import { Command } from 'commander';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import ora from 'ora';
import { processFiles } from '../core/file-processor';
import { generateMarkdown } from '../core/markdown-generator';
import { getCachedValue, setCachedValue } from '../utils/cache-utils';
import { handleEditorAndOutput } from '../utils/editor-utils';
import {
  extractTemplateVariables,
  getTemplatePath,
  getTemplatesDir,
} from '../utils/template-utils';
import { interactiveMode } from './interactive-filtering';

const templatesDir = getTemplatesDir();

const execAsync = promisify(exec);

const program = new Command();

export function cli(args: string[]) {
  program
    .name('codewhisper')
    .description('A powerful tool for converting code to AI-friendly prompts')
    .version('1.0.0');

  program
    .command('generate')
    .description('Generate a markdown file from your codebase')
    .option('-p, --path <path>', 'Path to the codebase', '.')
    .option(
      '-pr, --prompt <prompt>',
      'Custom prompt to append to the output',
      (value) => value,
    )
    .option('-o, --output <output>', 'Output file name')
    .option(
      '-E, --open-editor',
      'Open the result in your default editor',
      false,
    )
    .option('-t, --template <template>', 'Template to use', 'default')
    .option('-g, --gitignore <path>', 'Path to .gitignore file')
    .option(
      '-f, --filter <patterns...>',
      'File patterns to include (use glob patterns, e.g., "src/**/*.js")',
    )
    .option(
      '-e, --exclude <patterns...>',
      'File patterns to exclude (use glob patterns, e.g., "**/*.test.js")',
    )
    .option('-s, --suppress-comments', 'Strip comments from the code')
    .option('-l, --line-numbers', 'Add line numbers to code blocks')
    .option('--case-sensitive', 'Use case-sensitive pattern matching')
    .option(
      '--no-codeblock',
      'Disable wrapping code inside markdown code blocks',
    )
    .option(
      '--custom-data <json>',
      'Custom data to pass to the template (JSON string)',
    )
    .option('--custom-template <path>', 'Path to a custom Handlebars template')
    .option('--custom-ignores <patterns...>', 'Additional patterns to ignore')
    .option(
      '--cache-path <path>',
      'Custom path for the cache file',
      path.join(os.tmpdir(), 'codewhisper-cache.json'),
    )
    .option('--respect-gitignore', 'Respect entries in .gitignore', true)
    .option(
      '--no-respect-gitignore',
      'Do not respect entries in .gitignore',
      false,
    )
    .action(async (options) => {
      const spinner = ora('Processing files...').start();

      try {
        let templatePath: string;
        if (options.customTemplate) {
          templatePath = path.resolve(options.customTemplate);
        } else {
          templatePath = getTemplatePath(options.template);
        }

        if (!fs.existsSync(templatePath)) {
          console.error(`Template file not found: ${templatePath}`);
          process.exit(1);
        }

        const templateContent = await fs.readFile(templatePath, 'utf-8');
        const variables = extractTemplateVariables(templateContent);

        let customData: { [key: string]: string } = {};
        if (options.customData) {
          try {
            customData = JSON.parse(options.customData);
          } catch (error) {
            spinner.fail('Error parsing custom data JSON');
            console.error(chalk.red((error as Error).message));
            process.exit(1);
          }
        } else if (variables.length > 0) {
          spinner.stop();
          for (const variable of variables) {
            const cacheKey = `${options.template}_${variable.name}`;
            const cachedValue = await getCachedValue(
              cacheKey,
              options.cachePath,
            );

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
        const files = await processFiles(options);

        spinner.text = 'Generating markdown...';

        let markdown = await generateMarkdown(files, templateContent, {
          noCodeblock: !options.codeblock,
          basePath: options.path,
          customData,
          lineNumbers: options.lineNumbers,
        });

        if (options.prompt) {
          markdown += `\n\n## Your Task\n\n${options.prompt}`;
        }

        spinner.succeed('Markdown generated successfully');

        await handleEditorAndOutput({
          content: markdown,
          outputPath: options.output || 'stdout',
          openEditor: options.openEditor,
          spinner,
        });
      } catch (error) {
        spinner.fail('Error generating output');
        console.error(chalk.red((error as Error).message));
        process.exit(1);
      }
    });

  program
    .command('interactive')
    .description('Start interactive mode')
    .option('-p, --path <path>', 'Path to the codebase', '.')
    .option(
      '-pr, --prompt <prompt>',
      'Custom prompt to append to the output',
      (value) => value,
    )
    .option('-t, --template <template>', 'Template to use')
    .option('-g, --gitignore <path>', 'Path to .gitignore file')
    .option(
      '-f, --filter <patterns...>',
      'File patterns to include (use glob patterns, e.g., "src/**/*.js")',
    )
    .option(
      '-e, --exclude <patterns...>',
      'File patterns to exclude (use glob patterns, e.g., "**/*.test.js")',
    )
    .option(
      '-E, --open-editor',
      'Open the result in your default editor',
      false,
    )
    .option('-s, --suppress-comments', 'Strip comments from the code')
    .option('-l, --line-numbers', 'Add line numbers to code blocks')
    .option('--case-sensitive', 'Use case-sensitive pattern matching')
    .option(
      '--no-codeblock',
      'Disable wrapping code inside markdown code blocks',
    )
    .option(
      '--custom-data <json>',
      'Custom data to pass to the template (JSON string)',
    )
    .option('--custom-template <path>', 'Path to a custom Handlebars template')
    .option('--custom-ignores <patterns...>', 'Additional patterns to ignore')
    .option('--cache-path <path>', 'Custom path for the cache file')
    .option('--respect-gitignore', 'Respect entries in .gitignore', true)
    .option(
      '--no-respect-gitignore',
      'Do not respect entries in .gitignore',
      false,
    )
    .option('--invert', 'Selected files will be excluded', false)
    .action(async (options) => {
      try {
        await interactiveMode(options);
      } catch (error) {
        console.error(chalk.red('Error in interactive mode:'), error);
        process.exit(1);
      }
    });

  program
    .command('list-templates')
    .description('List available templates')
    .action(() => {
      const templates = fs
        .readdirSync(templatesDir)
        .filter((file) => file.endsWith('.hbs'))
        .map((file) => file.replace('.hbs', ''));

      console.log(chalk.blue('Available templates:'));
      for (const template of templates) {
        console.log(`- ${template}`);
      }
    });

  program
    .command('export-templates')
    .description('Export templates to the current or specified directory')
    .option(
      '-d, --dir <directory>',
      'Target directory for exported templates',
      '.',
    )
    .action(async (options) => {
      const targetDir = path.resolve(options.dir);

      try {
        await fs.ensureDir(targetDir);

        const templateFiles = await fs.readdir(templatesDir);
        const hbsFiles = templateFiles.filter((file) => file.endsWith('.hbs'));

        for (const file of hbsFiles) {
          const srcPath = path.join(templatesDir, file);
          const destPath = path.join(targetDir, file);
          await fs.copy(srcPath, destPath, { overwrite: false });
        }

        console.log(chalk.green(`Templates exported to ${targetDir}`));
      } catch (error) {
        console.error(
          chalk.red('Error exporting templates:'),
          (error as Error).message,
        );
      }
    });

  program.parse(process.argv);
}

export { cli as default };

if (import.meta.url === url.pathToFileURL(process.argv[1]).href) {
  cli(process.argv.slice(2));
}
