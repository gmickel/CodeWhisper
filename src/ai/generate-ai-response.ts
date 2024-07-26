import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import chalk from 'chalk';
import dotenv from 'dotenv';
import type { GenerateAIResponseOptions } from '../types';
import { calculateCost, estimateCost } from './cost-calculation';
import {
  calculateTokenUsage,
  estimateTokenCount,
  getModelSpecs,
  truncateToContextLimit,
} from './token-management';

dotenv.config();

if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY) {
  throw new Error(
    'ANTHROPIC_API_KEY/OPENAI_API_KEY is not set in the environment variables.',
  );
}

const MODEL = process.env.MODEL || 'claude-3-5-sonnet-20240620';
const MAX_TOKENS = getModelSpecs(MODEL).maxOutput;

export async function generateAIResponse(
  prompt: string,
  options: GenerateAIResponseOptions,
): Promise<string> {
  const anthropic = createAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    headers: {
      'anthropic-beta': 'max-tokens-3-5-sonnet-2024-07-15',
    },
  });

  const estimatedInputTokens = estimateTokenCount(prompt, MODEL);
  const estimatedOutputTokens = MAX_TOKENS; // We assume the max output tokens for caluated the total token count
  const estimatedCost = estimateCost(
    MODEL,
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
  const modelSpecs = getModelSpecs(MODEL);

  if (estimatedInputTokens > modelSpecs.contextWindow) {
    console.warn(
      chalk.yellow(
        `Truncating prompt to ${modelSpecs.contextWindow} tokens...`,
      ),
    );
    processedPrompt = truncateToContextLimit(prompt, MODEL);
  }

  try {
    const result = await generateText({
      model: anthropic(MODEL),
      maxTokens: MAX_TOKENS,
      prompt: processedPrompt,
    });

    const usage = calculateTokenUsage(processedPrompt, result.text, MODEL);
    const actualCost = calculateCost(MODEL, usage);

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
