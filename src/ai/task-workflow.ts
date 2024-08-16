import path from 'node:path';
import chalk from 'chalk';
import fs from 'fs-extra';
import ora from 'ora';
import simpleGit from 'simple-git';
import { processFiles } from '../core/file-processor';
import { generateMarkdown } from '../core/markdown-generator';
import { selectFilesPrompt } from '../interactive/select-files-prompt';
import { selectGitHubIssuePrompt } from '../interactive/select-github-issue-prompt';
import { selectModelPrompt } from '../interactive/select-model-prompt';
import type {
  AIParsedResponse,
  AiAssistedTaskOptions,
  FileInfo,
  MarkdownOptions,
  TaskData,
} from '../types';
import {
  DEFAULT_CACHE_PATH,
  getCachedValue,
  setCachedValue,
} from '../utils/cache-utils';
import { ensureBranch } from '../utils/git-tools';
import { TaskCache } from '../utils/task-cache';
import {
  collectVariables,
  extractTemplateVariables,
  getTemplatePath,
} from '../utils/template-utils';
import { applyChanges } from './apply-changes';
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
    const filters = options.githubIssueFilters ?? '';
    const taskCache = new TaskCache(basePath);

    const modelKey = await selectModel(options);
    const modelConfig = getModelConfig(modelKey);

    if (options.diff === undefined) {
      options.diff = modelConfig.mode === 'diff';
    }
    console.log(
      chalk.blue(`Using ${options.diff ? 'diff' : 'whole-file'} editing mode`),
    );

    const { taskDescription, instructions } = await getTaskInfo(
      options,
      basePath,
      filters,
    );

    let selectedFiles: string[] = [];

    if (!options.skipFiles) {
      selectedFiles = await selectFiles(options, basePath);
      selectedFiles.push(...(options.filter ?? []));
    } else {
      selectedFiles = options.filter ?? [];
    }

    spinner.start('Processing files...');
    const processedFiles = await processFiles(
      getProcessOptions(options, basePath, selectedFiles),
    );
    spinner.succeed('Files processed successfully');

    const taskData = {
      selectedFiles,
      taskDescription,
      instructions,
      model: modelKey,
    } as TaskData;

    if (options.plan) {
      await handlePlanWorkflow(
        options,
        basePath,
        taskCache,
        taskData,
        processedFiles,
        modelKey,
      );
    } else {
      await handleNoPlanWorkflow(
        options,
        basePath,
        taskCache,
        taskData,
        processedFiles,
        modelKey,
      );
    }

    spinner.succeed('AI-assisted task completed! 🎉');
  } catch (error) {
    spinner.fail('Error in AI-assisted task');
    console.error(
      chalk.red(error instanceof Error ? error.message : String(error)),
    );
    process.exit(1);
  }
}

async function selectModel(options: AiAssistedTaskOptions): Promise<string> {
  let modelKey = options.model;

  if (modelKey) {
    const modelConfig = getModelConfig(modelKey);
    if (!modelConfig) {
      console.log(chalk.red(`Invalid model ID: ${modelKey}.`));
      console.log(chalk.yellow('Displaying model selection list...'));
      modelKey = '';
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

  return modelKey;
}

async function getTaskInfo(
  options: AiAssistedTaskOptions,
  basePath: string,
  filters: string,
): Promise<{ taskDescription: string; instructions: string }> {
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
    const selectedIssue = await selectGitHubIssuePrompt(basePath, filters);
    if (selectedIssue) {
      taskDescription = `# ${selectedIssue.title}\n\n${selectedIssue.body}`;
      options.issueNumber = selectedIssue.number;
    } else {
      console.log(
        chalk.yellow('No GitHub issue selected. Falling back to manual input.'),
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
      taskDescription = await getTaskDescription(
        cachedTaskDescription as string | undefined,
      );
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
      instructions = await getInstructions(
        cachedInstructions as string | undefined,
      );
      await setCachedValue('instructions', instructions, options.cachePath);
    }
  }

  return { taskDescription, instructions };
}

async function selectFiles(
  options: AiAssistedTaskOptions,
  basePath: string,
): Promise<string[]> {
  const userFilters = options.filter || [];

  let selectedFiles: string[];
  if (options.context && options.context.length > 0) {
    selectedFiles = options.context.map((item) => {
      const relativePath = path.relative(basePath, item);
      return fs.statSync(path.join(basePath, item)).isDirectory()
        ? path.join(relativePath, '**/*')
        : relativePath;
    });
  } else {
    selectedFiles = await selectFilesPrompt(basePath, options.invert ?? false);
  }

  const combinedFilters = [...new Set([...userFilters, ...selectedFiles])];

  console.log(
    chalk.cyan(`Files to be ${options.invert ? 'excluded' : 'included'}:`),
  );
  for (const filter of combinedFilters) {
    console.log(chalk.cyan(`  ${filter}`));
  }

  return combinedFilters;
}

async function prepareCustomData(
  templateContent: string,
  taskDescription: string,
  instructions: string,
  options: AiAssistedTaskOptions,
): Promise<Record<string, string>> {
  const variables = extractTemplateVariables(templateContent);
  const dataObj = {
    var_taskDescription: taskDescription,
    var_instructions: instructions,
  };
  const data = JSON.stringify(dataObj);

  return collectVariables(
    data,
    options.cachePath ?? DEFAULT_CACHE_PATH,
    variables,
    templateContent,
  );
}

function getProcessOptions(
  options: AiAssistedTaskOptions,
  basePath: string,
  selectedFiles: string[],
): AiAssistedTaskOptions {
  return {
    ...options,
    path: basePath,
    filter: options.invert ? undefined : selectedFiles,
    exclude: options.invert ? selectedFiles : options.exclude,
  };
}

export async function handlePlanWorkflow(
  options: AiAssistedTaskOptions,
  basePath: string,
  taskCache: TaskCache,
  taskData: TaskData,
  processedFiles: FileInfo[],
  modelKey: string,
) {
  const planTemplatePath = getTemplatePath('task-plan-prompt-full');
  const planTemplateContent = await fs.readFile(planTemplatePath, 'utf-8');
  const planCustomData = await prepareCustomData(
    planTemplateContent,
    taskData.taskDescription,
    taskData.instructions,
    options,
  );

  const planPrompt = await generatePlanPrompt(
    processedFiles,
    planTemplateContent,
    planCustomData,
    options,
    basePath,
  );
  const generatedPlan = await generatePlan(planPrompt, modelKey, options);

  let reviewedPlan = generatedPlan;
  if (!options.acceptPlan) {
    reviewedPlan = await reviewPlan(generatedPlan);
  } else {
    console.log(
      chalk.yellow(
        'Automatically accepting the generated plan. Skipping manual review.',
      ),
    );
  }

  taskCache.setTaskData(basePath, { ...taskData, generatedPlan: reviewedPlan });

  await generateAndApplyCode(
    options,
    basePath,
    taskCache,
    modelKey,
    processedFiles,
    reviewedPlan,
  );
}

export async function handleNoPlanWorkflow(
  options: AiAssistedTaskOptions,
  basePath: string,
  taskCache: TaskCache,
  taskData: TaskData,
  processedFiles: FileInfo[],
  modelKey: string,
) {
  taskCache.setTaskData(basePath, { ...taskData, generatedPlan: '' });
  await generateAndApplyCode(
    options,
    basePath,
    taskCache,
    modelKey,
    processedFiles,
  );
}

async function generatePlanPrompt(
  processedFiles: FileInfo[],
  templateContent: string,
  customData: Record<string, string>,
  options: AiAssistedTaskOptions,
  basePath: string,
): Promise<string> {
  const spinner = ora('Generating markdown...').start();
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
  return planPrompt;
}

async function generatePlan(
  planPrompt: string,
  modelKey: string,
  options: AiAssistedTaskOptions,
): Promise<string> {
  const spinner = ora('Generating AI plan...').start();
  const modelConfig = getModelConfig(modelKey);

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
  return generatedPlan;
}

async function generateAndApplyCode(
  options: AiAssistedTaskOptions,
  basePath: string,
  taskCache: TaskCache,
  modelKey: string,
  processedFiles: FileInfo[],
  reviewedPlan?: string,
) {
  const codegenTemplatePath = getCodegenTemplatePath(options);
  const codegenTemplateContent = await fs.readFile(
    codegenTemplatePath,
    'utf-8',
  );

  const codegenCustomData = await prepareCodegenCustomData(
    codegenTemplateContent,
    taskCache,
    basePath,
    options,
    reviewedPlan,
  );

  const spinner = ora('Generating Codegen prompt...').start();
  const codeGenPrompt = await generateCodegenPrompt(
    options,
    basePath,
    processedFiles,
    codegenTemplateContent,
    codegenCustomData,
  );
  spinner.succeed('Codegen prompt generated successfully');

  const generatedCode = await generateCode(codeGenPrompt, modelKey, options);
  const parsedResponse = parseAICodegenResponse(
    generatedCode,
    options.logAiInteractions,
    options.diff,
  );

  if (options.dryRun) {
    await handleDryRun(
      basePath,
      parsedResponse,
      taskCache.getLastTaskData(basePath)?.taskDescription || '',
    );
  } else {
    await applyCodeModifications(options, basePath, parsedResponse);
  }
}

function getCodegenTemplatePath(options: AiAssistedTaskOptions): string {
  return getTemplatePath(
    options.diff ? 'codegen-diff-prompt' : 'codegen-prompt',
  );
}

async function prepareCodegenCustomData(
  codegenTemplateContent: string,
  taskCache: TaskCache,
  basePath: string,
  options: AiAssistedTaskOptions,
  reviewedPlan?: string,
): Promise<Record<string, string>> {
  const codegenVariables = extractTemplateVariables(codegenTemplateContent);
  const lastTaskData = taskCache.getLastTaskData(basePath);

  const codegenDataObj = {
    var_taskDescription: lastTaskData?.taskDescription || '',
    var_instructions: lastTaskData?.instructions || '',
  } as Record<string, string>;

  if (reviewedPlan) {
    codegenDataObj.var_plan = reviewedPlan;
  }

  return collectVariables(
    JSON.stringify(codegenDataObj),
    options.cachePath ?? DEFAULT_CACHE_PATH,
    codegenVariables,
    codegenTemplateContent,
  );
}

async function generateCodegenPrompt(
  options: AiAssistedTaskOptions,
  basePath: string,
  processedFiles: FileInfo[],
  codegenTemplateContent: string,
  codegenCustomData: Record<string, string>,
): Promise<string> {
  const codegenMarkdownOptions: MarkdownOptions = {
    noCodeblock: options.noCodeblock,
    basePath,
    customData: codegenCustomData,
    lineNumbers: options.lineNumbers,
  };

  return generateMarkdown(
    processedFiles,
    codegenTemplateContent,
    codegenMarkdownOptions,
  );
}

async function generateCode(
  codeGenPrompt: string,
  modelKey: string,
  options: AiAssistedTaskOptions,
): Promise<string> {
  let systemPromptContent = undefined;

  if (options.diff) {
    const systemPromptPath = getTemplatePath('diff-system-prompt');
    systemPromptContent = await fs.readFile(systemPromptPath, 'utf-8');
  }

  const spinner = ora('Generating AI Code Modifications...').start();
  const modelConfig = getModelConfig(modelKey);

  let generatedCode: string;
  if (modelKey.includes('ollama')) {
    generatedCode = await generateAIResponse(codeGenPrompt, {
      maxCostThreshold: options.maxCostThreshold,
      model: modelKey,
      contextWindow: options.contextWindow,
      maxTokens: options.maxTokens,
      logAiInteractions: options.logAiInteractions,
      systemPrompt: systemPromptContent,
    });
  } else {
    generatedCode = await generateAIResponse(
      codeGenPrompt,
      {
        maxCostThreshold: options.maxCostThreshold,
        model: modelKey,
        logAiInteractions: options.logAiInteractions,
        systemPrompt: systemPromptContent,
      },
      modelConfig.temperature?.codegenTemperature,
    );
  }
  spinner.succeed('AI Code Modifications generated successfully');
  return generatedCode;
}

async function handleDryRun(
  basePath: string,
  parsedResponse: AIParsedResponse,
  taskDescription: string,
) {
  ora().info(
    chalk.yellow('Dry Run Mode: Generating output without applying changes'),
  );

  const outputPath = path.join(basePath, 'codewhisper-task-output.json');
  await fs.writeJSON(
    outputPath,
    { taskDescription, parsedResponse },
    { spaces: 2 },
  );

  console.log(chalk.green(`AI-generated output saved to: ${outputPath}`));
  console.log(chalk.cyan('To apply these changes, run:'));
  console.log(chalk.cyan(`npx codewhisper apply-task ${outputPath}`));

  console.log('\nTask Summary:');
  console.log(chalk.blue('Task Description:'), taskDescription);
  console.log(chalk.blue('Branch Name:'), parsedResponse.gitBranchName);
  console.log(chalk.blue('Commit Message:'), parsedResponse.gitCommitMessage);
  console.log(chalk.blue('Files to be changed:'));
  for (const file of parsedResponse.files) {
    console.log(`  ${file.status}: ${file.path}`);
  }
  console.log(chalk.blue('Summary:'), parsedResponse.summary);
  console.log(chalk.blue('Potential Issues:'), parsedResponse.potentialIssues);
}

async function applyCodeModifications(
  options: AiAssistedTaskOptions,
  basePath: string,
  parsedResponse: AIParsedResponse,
) {
  const spinner = ora('Applying AI Code Modifications...').start();

  try {
    const actualBranchName = await ensureBranch(
      basePath,
      parsedResponse.gitBranchName,
      { issueNumber: options.issueNumber },
    );
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
      console.log(chalk.green('Changes have been applied but not committed.'));
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
