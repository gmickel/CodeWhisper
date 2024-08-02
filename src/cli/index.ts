import path from 'node:path';
import url from 'node:url';

import chalk from 'chalk';
import { Command } from 'commander';
import fs from 'fs-extra';
import ora from 'ora';
import { applyTask } from '../ai/apply-task';
import { getModelConfig, getModelNames } from '../ai/model-config';
import { runAIAssistedTask } from '../ai/task-workflow';
import { processFiles } from '../core/file-processor';
import { generateMarkdown } from '../core/markdown-generator';
import { runInteractiveMode } from '../interactive/interactive-workflow';
import { DEFAULT_CACHE_PATH, clearCache } from '../utils/cache-utils';
import { handleEditorAndOutput } from '../utils/editor-utils';
import {
  collectVariables,
  extractTemplateVariables,
  getTemplatePath,
  getTemplatesDir,
} from '../utils/template-utils';

function parseOptionStringToInt(value: string): number {
  // parseInt takes a string and a radix
  const parsedValue = Number.parseInt(value, 10);
  if (Number.isNaN(parsedValue)) {
    throw new Error(`Invalid number: ${value}`);
  }
  return parsedValue;
}

const templatesDir = getTemplatesDir();
const program = new Command();

export function cli(_args: string[]) {
  program
    .name('codewhisper')
    .description('A powerful tool for converting code to AI-friendly prompts')
    .version('1.0.0');

  program
    .command('list-models')
    .description('List available AI models')
    .action(() => {
      const models = getModelNames();
      console.log('Available AI models:');
      for (const modelId of models) {
        const config = getModelConfig(modelId);
        if (config) {
          console.log(`- ${config.modelName} (${chalk.cyan(modelId)})`);
          console.log(
            `  Context window: ${config.contextWindow}, Max output: ${config.maxOutput}`,
          );
          console.log(
            `  Pricing: $${config.pricing.inputCost}/1M tokens (input), $${config.pricing.outputCost}/1M tokens (output)`,
          );
        }
      }
    });

  program
    .command('apply-task <file>')
    .description('Apply an AI-generated task from a file')
    .option('--auto-commit', 'Automatically commit changes', false)
    .action(async (file) => {
      try {
        await applyTask(file);
      } catch (error) {
        console.error(chalk.red('Error applying task:'), error);
        process.exit(1);
      }
    });

  program
    .command('task')
    .description('Start an AI-assisted coding task')
    .option('-p, --path <path>', 'Path to the codebase', '.')
    .option('-m, --model <modelId>', 'Specify the AI model to use')
    .option(
      '-c, --context <paths...>',
      'Specify files or directories to include in the task context. Can be file paths, directory paths, or glob patterns. Multiple entries should be space-separated.',
    )
    .option('-t, --task <task>', 'Short task title')
    .option('-d, --description <description>', 'Detailed task description')
    .option(
      '-i, --instructions <instructions>',
      'Additional instructions for the task',
    )
    .option(
      '-df, --diff',
      'Use the new diff mode for AI-generated code modifications',
      false,
    )
    .option(
      '-cw, --context-window <number>',
      'Specify the context window for the AI model. Only applicable for Ollama models.',
      parseOptionStringToInt,
      undefined,
    )
    .option(
      '-mt, --max-tokens <number>',
      'Specify the max output tokens for the AI model. Only applicable for Ollama models.',
      parseOptionStringToInt,
      undefined,
    )
    .option('-g, --gitignore <path>', 'Path to .gitignore file', '.gitignore')
    .option(
      '-f, --filter <patterns...>',
      'File patterns to include (use glob patterns, e.g., "src/**/*.js")',
    )
    .option(
      '-e, --exclude <patterns...>',
      'File patterns to exclude (use glob patterns, e.g., "**/*.test.js")',
    )
    .option('-s, --suppress-comments', 'Strip comments from the code', false)
    .option('-l, --line-numbers', 'Add line numbers to code blocks', false)
    .option('--case-sensitive', 'Use case-sensitive pattern matching', false)
    .option('--custom-ignores <patterns...>', 'Additional patterns to ignore')
    .option(
      '--cache-path <path>',
      'Custom path for the cache file',
      DEFAULT_CACHE_PATH,
    )
    .option('--respect-gitignore', 'Respect entries in .gitignore', true)
    .option(
      '--no-respect-gitignore',
      'Do not respect entries in .gitignore',
      false,
    )
    .option('--invert', 'Selected files will be excluded', false)
    .option(
      '--dry-run',
      'Perform a dry run without making actual changes. Saves changes to a file so you can apply them after review using apply-task',
      false,
    )
    .option(
      '--log-ai-interactions',
      'Enable logging of AI prompts, responses, and parsing results',
      false,
    )
    .option(
      '-max --max-cost-threshold <number>',
      'Set a maximum cost threshold for AI operations in USD (e.g., 0.5 for $0.50)',
      Number.parseFloat,
    )
    .option('--auto-commit', 'Automatically commit changes', false)
    .option('--github-issue', 'Use GitHub issue for task input', false)
    .action(async (options) => {
      try {
        await runAIAssistedTask(options);
      } catch (error) {
        console.error(chalk.red('Error in AI-assisted task:'), error);
        process.exit(1);
      }
    });

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
    .option('-g, --gitignore <path>', 'Path to .gitignore file', '.gitignore')
    .option(
      '-f, --filter <patterns...>',
      'File patterns to include (use glob patterns, e.g., "src/**/*.js")',
    )
    .option(
      '-e, --exclude <patterns...>',
      'File patterns to exclude (use glob patterns, e.g., "**/*.test.js")',
    )
    .option('-s, --suppress-comments', 'Strip comments from the code', false)
    .option('-l, --line-numbers', 'Add line numbers to code blocks', false)
    .option('--case-sensitive', 'Use case-sensitive pattern matching', false)
    .option(
      '--no-codeblock',
      'Disable wrapping code inside markdown code blocks',
      false,
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
      DEFAULT_CACHE_PATH,
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

        const customData = await collectVariables(
          options.customData,
          options.cachePath,
          variables,
          templatePath,
        );

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
    .option('-g, --gitignore <path>', 'Path to .gitignore file', '.gitignore')
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
    .option('-s, --suppress-comments', 'Strip comments from the code', false)
    .option('-l, --line-numbers', 'Add line numbers to code blocks', false)
    .option('--case-sensitive', 'Use case-sensitive pattern matching', false)
    .option(
      '--no-codeblock',
      'Disable wrapping code inside markdown code blocks',
      false,
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
      DEFAULT_CACHE_PATH,
    )
    .option('--respect-gitignore', 'Respect entries in .gitignore', true)
    .option(
      '--no-respect-gitignore',
      'Do not respect entries in .gitignore',
      false,
    )
    .option('--invert', 'Selected files will be excluded', false)
    .action(async (options) => {
      try {
        await runInteractiveMode(options);
      } catch (error) {
        console.error(chalk.red('Error in interactive mode:'), error);
        process.exit(1);
      }
    });

  program
    .command('clear-cache')
    .description('Clear the cache')
    .option('-p, --path <path>', 'Path to the cache file', DEFAULT_CACHE_PATH)
    .action(async (options) => {
      await clearCache(options.path);
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
