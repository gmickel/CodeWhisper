import path from 'node:path';
import chalk from 'chalk';
import fs from 'fs-extra';
import ora from 'ora';
import simpleGit from 'simple-git';
import { processFiles } from '../core/file-processor';
import { generateMarkdown } from '../core/markdown-generator';
import { applyChanges } from '../git/apply-changes';
import { selectFilesPrompt } from '../interactive/select-files-prompt';
import { selectGitHubIssuePrompt } from '../interactive/select-github-issue-prompt';
import { selectModelPrompt } from '../interactive/select-model-prompt';
import type { AiAssistedTaskOptions, MarkdownOptions } from '../types';
import {
  DEFAULT_CACHE_PATH,
  getCachedValue,
  setCachedValue,
} from '../utils/cache-utils';
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

    // Model selection
    let modelKey = options.model;

    if (modelKey) {
      const modelConfig = getModelConfig(options.model);
      if (!modelConfig) {
        console.log(chalk.red(`Invalid model ID: ${options.model}.`));
        console.log(chalk.yellow('Displaying model selection list...'));
      } else {
        console.log(chalk.blue(`Using model: ${modelConfig.modelName}`));
      }
    }

    if (!modelKey) {
      try {
        modelKey = await selectModelPrompt();
        const modelConfig = getModelConfig(modelKey);
        console.log(chalk.blue(`Using model: ${modelConfig.modelName}`));
      } catch (error) {
        console.error(chalk.red('Error selecting model:'), error);
        process.exit(1);
      }
    }

    let taskDescription = '';
    let instructions = '';

    if (options.githubIssue) {
      if (!process.env.GITHUB_TOKEN) {
        console.log(
          chalk.yellow(
            'GITHUB_TOKEN not set. GitHub issue functionality may be limited.',
          ),
        );
      }
      const selectedIssue = await selectGitHubIssuePrompt();
      if (selectedIssue) {
        taskDescription = `# ${selectedIssue.title}\n\n${selectedIssue.body}`;
        options.issueNumber = selectedIssue.number;
      } else {
        console.log(
          chalk.yellow(
            'No GitHub issue selected. Falling back to manual input.',
          ),
        );
      }
    }

    if (!taskDescription) {
      if (options.task || options.description) {
        taskDescription =
          `# ${options.task || 'Task'}\n\n${options.description || ''}`.trim();
      } else {
        const cachedTaskDescription = await getCachedValue(
          'taskDescription',
          options.cachePath,
        );
        if (cachedTaskDescription) {
          console.log(chalk.yellow('Using cached task description.'));
        }
        taskDescription =
          (await getTaskDescription(
            cachedTaskDescription as string | undefined,
          )) ?? 'No task description provided.';
        await setCachedValue(
          'taskDescription',
          taskDescription,
          options.cachePath,
        );
      }
    }

    if (!instructions) {
      if (options.instructions) {
        instructions = options.instructions;
      } else {
        const cachedInstructions = await getCachedValue(
          'instructions',
          options.cachePath,
        );
        if (cachedInstructions) {
          console.log(chalk.yellow('Using cached instructions.'));
        }
        instructions =
          (await getInstructions(cachedInstructions as string | undefined)) ??
          'No instructions provided.';
        await setCachedValue('instructions', instructions, options.cachePath);
      }
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

    const modelConfig = getModelConfig(modelKey);

    spinner.start('Generating AI plan...');
    let generatedPlan: string;
    if (modelKey.includes('ollama')) {
      generatedPlan = await generateAIResponse(planPrompt, {
        maxCostThreshold: options.maxCostThreshold,
        model: modelKey,
        contextWindow: options.contextWindow,
        maxTokens: options.maxTokens,
        logAiInteractions: options.logAiInteractions,
      });
    } else {
      generatedPlan = await generateAIResponse(
        planPrompt,
        {
          maxCostThreshold: options.maxCostThreshold,
          model: modelKey,
          logAiInteractions: options.logAiInteractions,
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
    if (modelKey.includes('ollama')) {
      generatedCode = await generateAIResponse(codeGenPrompt, {
        maxCostThreshold: options.maxCostThreshold,
        model: modelKey,
        contextWindow: options.contextWindow,
        maxTokens: options.maxTokens,
        logAiInteractions: options.logAiInteractions,
      });
    } else {
      generatedCode = await generateAIResponse(
        codeGenPrompt,
        {
          maxCostThreshold: options.maxCostThreshold,
          model: modelKey,
          logAiInteractions: options.logAiInteractions,
        },
        modelConfig.temperature?.codegenTemperature,
      );
    }
    spinner.succeed('AI Code Modifications generated successfully');

    const parsedResponse = parseAICodegenResponse(
      generatedCode,
      options.logAiInteractions,
    );

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

      try {
        const actualBranchName = await ensureBranch(
          basePath,
          parsedResponse.gitBranchName,
          { issueNumber: options.issueNumber },
        );

        // Apply changes
        await applyChanges({ basePath, parsedResponse, dryRun: false });

        if (options.autoCommit) {
          const git = simpleGit(basePath);
          await git.add('.');
          const commitMessage = options.issueNumber
            ? `${parsedResponse.gitCommitMessage} (Closes #${options.issueNumber})`
            : parsedResponse.gitCommitMessage;
          await git.commit(commitMessage);
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
            chalk.cyan(
              `  git commit -m "${parsedResponse.gitCommitMessage}${options.issueNumber ? ` (Closes #${options.issueNumber})` : ''}"`,
            ),
          );
        }
      } catch (error) {
        spinner.fail('Error applying AI Code Modifications');
        console.error(
          chalk.red('Failed to create branch or apply changes:'),
          error instanceof Error ? error.message : String(error),
        );
        console.log(
          chalk.yellow('Please check your Git configuration and try again.'),
        );
        process.exit(1);
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
