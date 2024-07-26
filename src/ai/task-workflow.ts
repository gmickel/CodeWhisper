import path from 'node:path';
import chalk from 'chalk';
import fs from 'fs-extra';
import ora from 'ora';
import { processFiles } from '../core/file-processor';
import { generateMarkdown } from '../core/markdown-generator';
import { applyChanges } from '../git/apply-changes';
import { selectFilesPrompt } from '../interactive/select-files-prompt';
import type { AiAssistedTaskOptions, MarkdownOptions } from '../types';
import { createBranchAndCommit } from '../utils/git-tools';
import {
  collectVariables,
  extractTemplateVariables,
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

    let taskDescription = '';
    if (options.task || options.description) {
      taskDescription =
        `# ${options.task || 'Task'}\n\n${options.description || ''}`.trim();
    } else {
      taskDescription =
        (await getTaskDescription()) ?? 'No task description provided.';
    }

    let instructions = '';
    if (options.instructions) {
      instructions = options.instructions;
    } else {
      instructions = (await getInstructions()) ?? 'No instructions provided.';
    }
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
    const generatedPlan = await generateAIResponse(planPrompt, {
      maxCostThreshold: options.maxCostThreshold,
    });
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
    const generatedCode = await generateAIResponse(codeGenPrompt, {
      maxCostThreshold: options.maxCostThreshold,
    });
    spinner.succeed('AI Code Modifications generated successfully');

    const parsedResponse = parseAICodegenResponse(generatedCode);

    if (options.dryRun) {
      spinner.info(
        chalk.yellow(
          'Dry Run Mode: Generating output without applying changes',
        ),
      );

      // Save only the generated code modifications
      const outputPath = path.join(basePath, 'codewhisper-task-output.json');
      await fs.writeJSON(
        outputPath,
        {
          taskDescription,
          parsedResponse,
        },
        { spaces: 2 },
      );
      console.log(chalk.green(`AI-generated output saved to: ${outputPath}`));
      console.log(chalk.cyan('To apply these changes, run:'));
      console.log(chalk.cyan(`npx codewhisper apply-task ${outputPath}`));

      // Detailed console output
      console.log('\nTask Summary:');
      console.log(chalk.blue('Task Description:'), taskDescription);
      console.log(chalk.blue('Branch Name:'), parsedResponse.gitBranchName);
      console.log(
        chalk.blue('Commit Message:'),
        parsedResponse.gitCommitMessage,
      );
      console.log(chalk.blue('Files to be changed:'));
      for (const file of parsedResponse.files) {
        console.log(`  ${file.status}: ${file.path}`);
      }
      console.log(chalk.blue('Summary:'), parsedResponse.summary);
      console.log(
        chalk.blue('Potential Issues:'),
        parsedResponse.potentialIssues,
      );
    } else {
      spinner.start('Applying AI Code Modifications...');
      await applyChanges({ basePath, parsedResponse, dryRun: false });
      await createBranchAndCommit(
        basePath,
        parsedResponse.gitBranchName,
        parsedResponse.gitCommitMessage,
      );
      spinner.succeed(
        `AI Code Modifications applied and committed to branch: ${parsedResponse.gitBranchName}`,
      );
    }
    console.log(chalk.green('AI-assisted task completed! 🎉'));
  } catch (error) {
    spinner.fail('Error in AI-assisted task');
    console.error(
      chalk.red(error instanceof Error ? error.message : String(error)),
    );
    process.exit(1);
  }
}
