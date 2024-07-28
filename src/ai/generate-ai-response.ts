import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import chalk from 'chalk';
import dotenv from 'dotenv';
import type { GenerateAIResponseOptions, ModelFamily } from '../types';
import { calculateCost, estimateCost } from './cost-calculation';
import { getModelConfig, getModelFamily } from './model-config';
import { estimateTokenCount, truncateToContextLimit } from './token-management';

dotenv.config();

interface ModelFamilyConfig {
  initClient: (
    apiKey: string,
  ) => ReturnType<typeof createAnthropic | typeof createOpenAI>;
  apiKeyEnv: string;
}

const modelFamilies: Record<ModelFamily, ModelFamilyConfig> = {
  claude: {
    initClient: (apiKey: string) =>
      createAnthropic({
        apiKey,
        headers: {
          'anthropic-beta': 'max-tokens-3-5-sonnet-2024-07-15',
        },
      }),
    apiKeyEnv: 'ANTHROPIC_API_KEY',
  },
  openai: {
    initClient: (apiKey: string) =>
      createOpenAI({
        apiKey,
        compatibility: 'strict',
      }),
    apiKeyEnv: 'OPENAI_API_KEY',
  },
  'openai-compatible': {
    initClient: (apiKey: string) =>
      createOpenAI({
        apiKey,
      }),
    apiKeyEnv: 'OPENAI_COMPATIBLE_API_KEY',
  },
  groq: {
    initClient: (apiKey: string) =>
      createOpenAI({
        baseURL: 'https://api.groq.com/openai/v1',
        apiKey,
      }),
    apiKeyEnv: 'GROQ_API_KEY',
  },
};

let totalCost = 0;

export async function generateAIResponse(
  prompt: string,
  options: GenerateAIResponseOptions,
): Promise<string> {
  const modelKey = options.model;
  const modelConfig = getModelConfig(modelKey);

  if (!modelConfig) {
    throw new Error(`Unknown model: ${modelKey}`);
  }

  const modelFamily = getModelFamily(modelKey);
  const familyConfig = modelFamilies[modelFamily];

  const apiKey = process.env[familyConfig.apiKeyEnv];
  if (!apiKey) {
    throw new Error(
      `${familyConfig.apiKeyEnv} is not set in the environment variables.`,
    );
  }

  const client = familyConfig.initClient(apiKey);

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
      model: client(modelKey),
      maxTokens: modelConfig.maxOutput,
      prompt: processedPrompt,
    });

    const actualCost = calculateCost(modelKey, {
      inputTokens: result.usage.promptTokens,
      outputTokens: result.usage.completionTokens,
    });

    totalCost += actualCost;

    console.log(chalk.green(`Actual cost: $${actualCost.toFixed(2)} USD`));
    console.log(
      chalk.blue(
        `Tokens used: ${result.usage.promptTokens} (input) + ${result.usage.completionTokens} (output) = ${result.usage.totalTokens} (total)`,
      ),
    );
    console.log(
      chalk.magenta(`Total cost so far: $${totalCost.toFixed(2)} USD`),
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
