import path from 'node:path';
import chalk from 'chalk';
import fs from 'fs-extra';
import ora from 'ora';
import { processFiles } from '../core/file-processor';
import {
  type MarkdownOptions,
  generateMarkdown,
} from '../core/markdown-generator';
import type { InteractiveModeOptions } from '../types';
import { handleEditorAndOutput } from '../utils/editor-utils';
import {
  collectVariables,
  extractTemplateVariables,
  getAvailableTemplates,
  getTemplatePath,
} from '../utils/template-utils';
import { outputPathPrompt } from './output-path-prompt';
import { selectFilesPrompt } from './select-files-prompt';
import { selectTemplatePrompt } from './select-template-prompt';

export async function runInteractiveMode(options: InteractiveModeOptions) {
  const spinner = ora();
  try {
    const basePath = path.resolve(options.path ?? '.');

    const userFilters = options.filter || [];

    const selectedFiles = await selectFilesPrompt(
      basePath,
      options.invert ?? false,
    );

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
      templatePath = await selectTemplatePrompt();
    }

    const templateContent = await fs.readFile(templatePath, 'utf-8');
    const variables = extractTemplateVariables(templateContent);

    const customData = await collectVariables(
      options.customData ?? '',
      options.cachePath,
      variables,
      templatePath,
    );

    const outputPath = await outputPathPrompt(basePath);

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

    await handleEditorAndOutput({
      content: markdown,
      outputPath: outputPath,
      openEditor: options.openEditor ?? false,
      spinner,
    });
    console.log(
      chalk.green(
        `\nInteractive mode completed! 🎉\nMarkdown output written to ${outputPath}`,
      ),
    );
  } catch (error) {
    spinner.fail('Error in interactive mode');
    console.error(
      chalk.red(error instanceof Error ? error.message : String(error)),
    );
    process.exit(1);
  }
}
