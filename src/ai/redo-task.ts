import path from 'node:path';
import { confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import ora from 'ora';
import { processFiles } from '../core/file-processor';
import { selectFilesPrompt } from '../interactive/select-files-prompt';
import { selectModelPrompt } from '../interactive/select-model-prompt';
import type { AiAssistedTaskOptions } from '../types';
import { TaskCache } from '../utils/task-cache';
import { getModelConfig } from './model-config';
import { handleNoPlanWorkflow, handlePlanWorkflow } from './task-workflow';

export async function redoLastTask(options: AiAssistedTaskOptions) {
  const spinner = ora();
  try {
    const basePath = path.resolve(options.path ?? '.');
    const taskCache = new TaskCache(basePath);

    const lastTaskData = taskCache.getLastTaskData(basePath);

    if (!lastTaskData) {
      console.log(
        chalk.yellow(
          'No previous task found for this directory. Please run a new task.',
        ),
      );
      process.exit(0);
    }

    console.log(chalk.blue('Redoing last task:'));
    console.log(chalk.cyan('Task Description:'), lastTaskData.taskDescription);
    console.log(chalk.cyan('Instructions:'), lastTaskData.instructions);
    console.log(chalk.cyan('Model:'), lastTaskData.model);
    console.log(chalk.cyan('Files included:'));
    for (const file of lastTaskData.selectedFiles) {
      console.log(chalk.cyan(`  ${file}`));
    }

    let modelKey = lastTaskData.model || options.model;
    let selectedFiles = lastTaskData.selectedFiles;

    // Confirmation for changing the model
    const changeModel = await confirm({
      message: 'Do you want to change the AI model for code generation?',
      default: false,
    });

    if (changeModel) {
      modelKey = await selectModelPrompt();
      console.log(
        chalk.blue(`Using new model: ${getModelConfig(modelKey).modelName}`),
      );
    }

    // Confirmation for changing file selection
    const changeFiles = await confirm({
      message: 'Do you want to change the file selection for code generation?',
      default: false,
    });

    if (changeFiles) {
      selectedFiles = await selectFilesPrompt(
        basePath,
        options.invert ?? false,
      );
      console.log(chalk.cyan('New file selection:'));
      for (const file of selectedFiles) {
        console.log(chalk.cyan(`  ${file}`));
      }
    }

    // Update the task cache with new selections if changed
    if (changeModel || changeFiles) {
      taskCache.setTaskData(basePath, {
        ...lastTaskData,
        model: modelKey,
        selectedFiles,
      });
    }

    // Process files
    spinner.start('Processing files...');
    const processedFiles = await processFiles({
      ...options,
      path: basePath,
      filter: options.invert ? undefined : selectedFiles,
      exclude: options.invert ? selectedFiles : options.exclude,
    });
    spinner.succeed('Files processed successfully');

    const updatedTaskData = {
      ...lastTaskData,
      model: modelKey,
      selectedFiles,
    };

    // Determine whether to use plan or no-plan workflow based on the original task
    const usePlanWorkflow = lastTaskData.generatedPlan !== '';

    if (usePlanWorkflow) {
      await handlePlanWorkflow(
        { ...options, model: modelKey, plan: true },
        basePath,
        taskCache,
        updatedTaskData,
        processedFiles,
        modelKey,
      );
    } else {
      await handleNoPlanWorkflow(
        { ...options, model: modelKey, plan: false },
        basePath,
        taskCache,
        updatedTaskData,
        processedFiles,
        modelKey,
      );
    }
  } catch (error) {
    spinner.fail('Error in redoing AI-assisted task');
    console.error(
      chalk.red(error instanceof Error ? error.message : String(error)),
    );
    process.exit(1);
  }
}
