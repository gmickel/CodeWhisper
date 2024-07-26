import path from 'node:path';
import chalk from 'chalk';
import fs from 'fs-extra';
import ora from 'ora';
import { processFiles } from '../core/file-processor';
import {
  type MarkdownOptions,
  generateMarkdown,
} from '../core/markdown-generator';
import { applyChanges } from '../git/apply-changes';
import { selectFilesPrompt } from '../interactive/select-files-prompt';
import type { AiAssistedTaskOptions } from '../types';
import {
  collectVariables,
  extractTemplateVariables,
  getAvailableTemplates,
  getTemplatePath,
} from '../utils/template-utils';
import { generateAIResponse } from './generate-ai-response';
import { getInstructions } from './get-instructions';
import { getTaskDescription } from './get-task-description';
import { parseAICodegenResponse } from './parse-ai-codegen-response';
import { reviewPlan } from './plan-review';

export async function runAIAssistedTask(options: AiAssistedTaskOptions) {
  const spinner = ora();
  try {
    const basePath = path.resolve(options.path ?? '.');

    const taskDescription =
      (await getTaskDescription()) ?? 'No task description provided.';

    const instructions =
      (await getInstructions()) ?? 'No instructions provided.';

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

    const templatePath = getTemplatePath('task-plan-prompt');

    const templateContent = await fs.readFile(templatePath, 'utf-8');
    const variables = extractTemplateVariables(templateContent);

    const data = `{"var_taskDescription": "${taskDescription}", "var_instructions": "${instructions}"}`;

    const customData = await collectVariables(
      data,
      options.cachePath,
      variables,
      templatePath,
    );

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

    const planPrompt = await generateMarkdown(
      processedFiles,
      templateContent,
      markdownOptions,
    );
    spinner.succeed('Plan prompt generated successfully');

    spinner.start('Generating AI plan...');
    const generatedPlan = await generateAIResponse(planPrompt);
    spinner.succeed('AI plan generated successfully');

    const reviewedPlan = await reviewPlan(generatedPlan);

    const codegenTemplatePath = getTemplatePath('codegen-prompt');
    const codegenTemplateContent = await fs.readFile(
      codegenTemplatePath,
      'utf-8',
    );

    const codegenVariables = extractTemplateVariables(codegenTemplateContent);

    const codegenData = `{"var_taskDescription": "${taskDescription}","var_instructions": "${instructions}", "var_plan": "${reviewedPlan}"}`;

    const codegenCustomData = await collectVariables(
      codegenData,
      options.cachePath,
      codegenVariables,
      codegenTemplatePath,
    );

    spinner.start('Generating Codegen prompt...');
    const codegenMarkdownOptions: MarkdownOptions = {
      noCodeblock: options.noCodeblock,
      basePath,
      customData: codegenCustomData,
      lineNumbers: options.lineNumbers,
    };

    const codeGenPrompt = await generateMarkdown(
      processedFiles,
      codegenTemplateContent,
      codegenMarkdownOptions,
    );
    spinner.succeed('Codegen prompt generated successfully');

    spinner.start('Generating AI Code Modifications...');
    const generatedCode = await generateAIResponse(codeGenPrompt);
    spinner.succeed('AI Code Modifications generated successfully');

    spinner.start('Applying AI Code Modifications...');
    const parsedResponse = parseAICodegenResponse(generatedCode);
    await applyChanges(basePath, parsedResponse, options.dryRun);
    spinner.succeed('AI Code Modifications applied successfully');

    console.log(chalk.green('AI-assisted task completed! 🎉'));
  } catch (error) {
    spinner.fail('Error in AI-assisted task');
    console.error(
      chalk.red(error instanceof Error ? error.message : String(error)),
    );
    process.exit(1);
  }
}
