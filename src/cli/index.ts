import os from 'node:os';
import path from 'node:path';
import chalk from 'chalk';
import { Command } from 'commander';
import fs from 'fs-extra';
import ora from 'ora';
import { processFiles } from '../core/file-processor';
import { generateMarkdown } from '../core/markdown-generator';
import { joinPath } from '../utils/path-utils';

// Function to determine the current script's extension
function getScriptExtension(): string {
  const scriptPath = process.argv[1] || '';
  return path.extname(scriptPath);
}

const scriptExt = getScriptExtension();
const isTS = scriptExt === '.ts';

// Determine the templates directory based on the script type
const templatesDir = isTS
  ? joinPath(import.meta.url, '..', 'templates')
  : path.resolve(__dirname, '../templates');

const program = new Command();

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
  .option('-f, --filter <patterns...>', 'File patterns to include')
  .option('-e, --exclude <patterns...>', 'File patterns to exclude')
  .option('-s, --suppress-comments', 'Strip comments from the code')
  .option('--case-sensitive', 'Use case-sensitive pattern matching')
  .option('--no-codeblock', 'Disable wrapping code inside markdown code blocks')
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
  .action(async (options) => {
    const spinner = ora('Processing files...').start();
    try {
      const files = await processFiles({
        path: options.path,
        gitignorePath: options.gitignore,
        filter: options.filter,
        exclude: options.exclude,
        suppressComments: options.suppressComments,
        caseSensitive: options.caseSensitive,
        customIgnores: options.customIgnores,
        cachePath: options.cachePath,
      });

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
      const markdown = await generateMarkdown(files, {
        template: templatePath,
        noCodeblock: !options.codeblock,
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
