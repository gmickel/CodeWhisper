import os from 'node:os';
import path from 'node:path';
import url from 'node:url';
import chalk from 'chalk';
import { Command } from 'commander';
import fs from 'fs-extra';
import ora from 'ora';
import { processFiles } from '../core/file-processor';
import { generateMarkdown } from '../core/markdown-generator';
import { getTemplatesDir } from '../utils/template-utils';
import { interactiveMode } from './interactive-filtering';

const templatesDir = getTemplatesDir();

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
    .option('-o, --output <output>', 'Output file name')
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
        const files = await processFiles(options);

        spinner.text = 'Generating markdown...';

        let customData = {};
        if (options.customData) {
          try {
            customData = JSON.parse(options.customData);
          } catch (error) {
            spinner.fail('Error parsing custom data JSON');
            console.error(chalk.red((error as Error).message));
            process.exit(1);
          }
        }

        const templatePath =
          options.customTemplate ||
          path.join(templatesDir, `${options.template}.hbs`);

        const templateContent = await fs.readFile(templatePath, 'utf-8');

        const markdown = await generateMarkdown(files, templateContent, {
          noCodeblock: !options.codeblock,
          basePath: options.path,
          customData,
        });

        if (options.output) {
          await fs.writeFile(options.output, markdown);
          spinner.succeed(`Output written to ${options.output}`);
        } else {
          spinner.stop();
          console.log(markdown);
        }
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
    .option('-s, --suppress-comments', 'Strip comments from the code')
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
        await fs.copy(templatesDir, targetDir, { overwrite: false });
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
