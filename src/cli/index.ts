import path from 'node:path';
import chalk from 'chalk';
import { Command } from 'commander';
import fs from 'fs-extra';
import { processFiles } from '../core/file-processor';
import { generateMarkdown } from '../core/markdown-generator';

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
  .option('-t, --template <template>', 'Template to use', 'codebase-summary')
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
  .action(async (options) => {
    try {
      const files = await processFiles({
        path: options.path,
        gitignorePath: options.gitignore,
        filter: options.filter,
        exclude: options.exclude,
        suppressComments: options.suppressComments,
        caseSensitive: options.caseSensitive,
        customIgnores: options.customIgnores,
      });

      let customData = {};
      if (options.customData) {
        try {
          customData = JSON.parse(options.customData);
        } catch (error) {
          console.error(
            chalk.red('Error parsing custom data JSON:'),
            (error as Error).message,
          );
          process.exit(1);
        }
      }

      const templatePath = options.customTemplate || options.template;
      const markdown = await generateMarkdown(files, {
        template: templatePath,
        noCodeblock: !options.codeblock,
        customData,
      });

      if (options.output) {
        await fs.writeFile(options.output, markdown);
        console.log(chalk.green(`Output written to ${options.output}`));
      } else {
        console.log(markdown);
      }
    } catch (error) {
      console.error(chalk.red('Error:'), (error as Error).message);
      process.exit(1);
    }
  });

program
  .command('list-templates')
  .description('List available templates')
  .action(() => {
    const templatesDir = path.join(__dirname, '..', 'templates');
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
    const sourceDir = path.join(__dirname, '..', 'templates');
    const targetDir = path.resolve(options.dir);

    try {
      await fs.ensureDir(targetDir);
      await fs.copy(sourceDir, targetDir, { overwrite: false });
      console.log(chalk.green(`Templates exported to ${targetDir}`));
    } catch (error) {
      console.error(
        chalk.red('Error exporting templates:'),
        (error as Error).message,
      );
    }
  });

program.parse(process.argv);
