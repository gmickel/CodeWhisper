import path from 'node:path';
import chalk from 'chalk';
import fs from 'fs-extra';
import ora from 'ora';
import simpleGit from 'simple-git';
import { processFiles } from '../core/file-processor';
import { generateMarkdown } from '../core/markdown-generator';
import { applyChanges } from '../git/apply-changes';
import { selectFilesPrompt } from '../interactive/select-files-prompt';
import type { AiAssistedTaskOptions, MarkdownOptions } from '../types';
import { DEFAULT_CACHE_PATH } from '../utils/cache-utils';
import { ensureBranch } from '../utils/git-tools';
import {
  collectVariables,
  extractTemplateVariables,
  getTemplatePath,
} from '../utils/template-utils';
import { generateAIResponse } from './generate-ai-response';
import { getInstructions } from './get-instructions';
import { getTaskDescription } from './get-task-description';
import { getModelConfig } from './model-config';
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

    const dataObj = {
      var_taskDescription: taskDescription,
      var_instructions: instructions,
    };

    let data: string;
    try {
      data = JSON.stringify(dataObj);
    } catch (error) {
      console.error(
        chalk.red('Error creating data for task plan prompt:'),
        error instanceof Error ? error.message : String(error),
      );
      process.exit(1);
    }

    const customData = await collectVariables(
      data,
      options.cachePath ?? DEFAULT_CACHE_PATH,
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

    const modelKey = options.model;
    const modelConfig = getModelConfig(modelKey);

    spinner.start('Generating AI plan...');
    let generatedPlan: string;
    if (options.model.includes('ollama')) {
      generatedPlan = await generateAIResponse(planPrompt, {
        maxCostThreshold: options.maxCostThreshold,
        model: options.model,
        contextWindow: options.contextWindow,
        maxTokens: options.maxTokens,
      });
    } else {
      generatedPlan = await generateAIResponse(
        planPrompt,
        {
          maxCostThreshold: options.maxCostThreshold,
          model: options.model,
        },
        modelConfig.temperature?.planningTemperature,
      );
    }

    spinner.succeed('AI plan generated successfully');

    const reviewedPlan = await reviewPlan(generatedPlan);

    const codegenTemplatePath = getTemplatePath('codegen-prompt');
    const codegenTemplateContent = await fs.readFile(
      codegenTemplatePath,
      'utf-8',
    );

    const codegenVariables = extractTemplateVariables(codegenTemplateContent);

    const codegenDataObj = {
      var_taskDescription: taskDescription,
      var_instructions: instructions,
      var_plan: reviewedPlan,
    };

    let codegenData: string;
    try {
      codegenData = JSON.stringify(codegenDataObj);
    } catch (error) {
      console.error(
        chalk.red('Error creating data for code generation prompt:'),
        error instanceof Error ? error.message : String(error),
      );
      process.exit(1);
    }

    const codegenCustomData = await collectVariables(
      codegenData,
      options.cachePath ?? DEFAULT_CACHE_PATH,
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
    let generatedCode: string;
    if (options.model.includes('ollama')) {
      generatedCode = await generateAIResponse(codeGenPrompt, {
        maxCostThreshold: options.maxCostThreshold,
        model: options.model,
        contextWindow: options.contextWindow,
        maxTokens: options.maxTokens,
      });
    } else {
      generatedCode = await generateAIResponse(
        codeGenPrompt,
        {
          maxCostThreshold: options.maxCostThreshold,
          model: options.model,
        },
        modelConfig.temperature?.codegenTemperature,
      );
    }
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

      const actualBranchName = await ensureBranch(
        basePath,
        parsedResponse.gitBranchName,
      );

      // Apply changes
      await applyChanges({ basePath, parsedResponse, dryRun: false });

      if (options.autoCommit) {
        const git = simpleGit(basePath);
        await git.add('.');
        await git.commit(parsedResponse.gitCommitMessage);
        spinner.succeed(
          `AI Code Modifications applied and committed to branch: ${actualBranchName}`,
        );
      } else {
        spinner.succeed(
          `AI Code Modifications applied to branch: ${actualBranchName}`,
        );
        console.log(
          chalk.green('Changes have been applied but not committed.'),
        );
        console.log(
          chalk.yellow(
            'Please review the changes in your IDE before committing.',
          ),
        );
        console.log(
          chalk.cyan('To commit the changes, use the following commands:'),
        );
        console.log(chalk.cyan('  git add .'));
        console.log(
          chalk.cyan(`  git commit -m "${parsedResponse.gitCommitMessage}"`),
        );
      }
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
