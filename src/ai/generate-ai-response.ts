import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import chalk from 'chalk';
import dotenv from 'dotenv';
import type { GenerateAIResponseOptions } from '../types';
import { calculateCost, estimateCost } from './cost-calculation';
import { getModelConfig } from './model-config';
import {
  calculateTokenUsage,
  estimateTokenCount,
  truncateToContextLimit,
} from './token-management';

dotenv.config();

export async function generateAIResponse(
  prompt: string,
  options: GenerateAIResponseOptions,
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY is not set in the environment variables.',
    );
  }

  const modelKey = options.model;
  const modelConfig = getModelConfig(modelKey);

  if (!modelConfig) {
    throw new Error(`Unknown model: ${modelKey}`);
  }

  const anthropic = createAnthropic({
    apiKey,
    headers: {
      'anthropic-beta': 'max-tokens-3-5-sonnet-2024-07-15',
    },
  });

  const estimatedInputTokens = estimateTokenCount(prompt, modelKey);
  const estimatedOutputTokens = modelConfig.maxOutput;
  const estimatedCost = estimateCost(
    modelKey,
    estimatedInputTokens,
    estimatedOutputTokens,
  );

  console.log(
    chalk.yellow(`Estimated max cost: $${estimatedCost.toFixed(2)} USD`),
  );

  if (options.maxCostThreshold && estimatedCost > options.maxCostThreshold) {
    const proceed = await confirmCostExceedsThreshold(
      estimatedCost,
      options.maxCostThreshold,
    );
    if (!proceed) {
      console.log(chalk.red('Operation cancelled due to cost threshold.'));
      return '';
    }
  }

  let processedPrompt = prompt;

  if (estimatedInputTokens > modelConfig.contextWindow) {
    console.warn(
      chalk.yellow(
        `Truncating prompt to ${modelConfig.contextWindow} tokens...`,
      ),
    );
    processedPrompt = truncateToContextLimit(processedPrompt, modelKey);
  }

  try {
    const result = await generateText({
      model: anthropic(modelKey),
      maxTokens: modelConfig.maxOutput,
      prompt: processedPrompt,
    });

    const usage = calculateTokenUsage(processedPrompt, result.text, modelKey);
    const actualCost = calculateCost(modelKey, usage);

    console.log(chalk.green(`Actual cost: $${actualCost.toFixed(2)} USD`));
    console.log(
      chalk.blue(
        `Tokens used: ${usage.inputTokens} (input) + ${usage.outputTokens} (output) = ${usage.inputTokens + usage.outputTokens} (total)`,
      ),
    );

    return result.text;
  } catch (error) {
    console.error(chalk.red('Error generating AI response:'), error);
    throw error;
  }
}

async function confirmCostExceedsThreshold(
  estimatedCost: number,
  threshold: number,
): Promise<boolean> {
  const { confirm } = await import('@inquirer/prompts');
  return confirm({
    message: `The estimated cost ($${estimatedCost.toFixed(2)} USD) exceeds the set threshold ($${threshold.toFixed(2)} USD). Do you want to proceed?`,
    default: false,
  });
}
