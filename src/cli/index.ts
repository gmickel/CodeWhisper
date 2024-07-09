import chalk from 'chalk';
import { Command } from 'commander';
import fs from 'fs-extra';
import { processFiles } from '../core/file-processor';
import { generateMarkdown } from '../core/markdown-generator';
import { gitDiff, prReview } from './git-tools';
import { interactiveFiltering } from './interactive-filtering';

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
  .option('-i, --interactive', 'Use interactive filtering')
  .option('-g, --gitignore <path>', 'Path to .gitignore file')
  .option('-f, --filter <patterns...>', 'File patterns to include')
  .option('-e, --exclude <patterns...>', 'File patterns to exclude')
  .option('-s, --suppress-comments', 'Strip comments from the code')
  .option('--case-sensitive', 'Use case-sensitive pattern matching')
  .option('--no-codeblock', 'Disable wrapping code inside markdown code blocks')
  .action(async (options) => {
    try {
      let files = await processFiles({
        path: options.path,
        gitignorePath: options.gitignore,
        filter: options.filter,
        exclude: options.exclude,
        suppressComments: options.suppressComments,
        caseSensitive: options.caseSensitive,
      });

      if (options.interactive) {
        files = await interactiveFiltering(files);
      }

      const markdown = await generateMarkdown(files, {
        template: options.template,
        noCodeblock: !options.codeblock,
      });

      if (options.output) {
        await fs.writeFile(options.output, markdown);
        console.log(chalk.green(`Output written to ${options.output}`));
      } else {
        console.log(markdown);
      }
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('git-diff')
  .description('Generate a prompt from Git diff')
  .option('-b, --branch <branch>', 'Compare with branch')
  .option('-o, --output <output>', 'Output file name')
  .option('-t, --template <template>', 'Template to use', 'default')
  .action(async (options) => {
    try {
      const files = await gitDiff(options.branch);
      const markdown = await generateMarkdown(files, {
        template: options.template,
      });

      if (options.output) {
        await fs.writeFile(options.output, markdown);
        console.log(chalk.green(`Output written to ${options.output}`));
      } else {
        console.log(markdown);
      }
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('pr-review')
  .description('Assist in PR review')
  .option('-n, --number <number>', 'PR number')
  .option('-o, --output <output>', 'Output file name')
  .option('-t, --template <template>', 'Template to use', 'pr-summary')
  .action(async (options) => {
    try {
      const files = await prReview(options.number);
      const markdown = await generateMarkdown(files, {
        template: options.template,
      });

      if (options.output) {
        await fs.writeFile(options.output, markdown);
        console.log(chalk.green(`Output written to ${options.output}`));
      } else {
        console.log(markdown);
      }
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

program.parse(process.argv);
