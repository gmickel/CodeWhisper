import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import chalk from 'chalk';
import dotenv from 'dotenv';
import { createOllama } from 'ollama-ai-provider';
import type {
  GenerateAIResponseOptions,
  GenerateTextOptions,
  ModelFamily,
} from '../types';
import getLogger from '../utils/logger';
import { calculateCost, estimateCost } from './cost-calculation';
import { getModelConfig, getModelFamily } from './model-config';
import { estimateTokenCount, truncateToContextLimit } from './token-management';

dotenv.config();

interface ModelFamilyConfig {
  initClient: (
    apiKey?: string,
    baseURL?: string,
  ) => ReturnType<
    typeof createAnthropic | typeof createOpenAI | typeof createOllama
  >;
}

const modelFamilies: Record<ModelFamily, ModelFamilyConfig> = {
  claude: {
    initClient: (apiKey?: string) =>
      createAnthropic({
        apiKey,
        headers: {
          'anthropic-beta': 'max-tokens-3-5-sonnet-2024-07-15',
        },
      }),
  },
  openai: {
    initClient: (apiKey?: string) =>
      createOpenAI({
        apiKey,
        compatibility: 'strict',
      }),
  },
  'openai-compatible': {
    initClient: (apiKey?: string, baseURL?: string) =>
      createOpenAI({
        apiKey,
        baseURL,
      }),
  },
  ollama: {
    initClient: () =>
      createOllama({
        baseURL: 'http://localhost:11434/api',
      }),
  },
};

let totalCost = 0;

export async function generateAIResponse(
  prompt: string,
  options: GenerateAIResponseOptions,
  temperature?: number,
): Promise<string> {
  const logger = getLogger(options.logAiInteractions || false);
  const modelKey = options.model;
  let modelConfig = getModelConfig(modelKey);

  if (!modelConfig) {
    throw new Error(`Unknown model: ${modelKey}`);
  }

  const modelFamily = getModelFamily(modelKey);
  const familyConfig = modelFamilies[modelFamily];

  const taskTemperature = temperature ?? 0.5;

  let client: ReturnType<
    typeof createAnthropic | typeof createOpenAI | typeof createOllama
  >;

  let apiKey: string | undefined;

  if (modelConfig.apiKeyEnv) {
    apiKey = process.env[modelConfig.apiKeyEnv];
    if (!apiKey) {
      throw new Error(
        `${modelConfig.apiKeyEnv} is not set in the environment variables.`,
      );
    }
  }

  if (modelFamily === 'ollama') {
    const ollamaModelName = modelKey.split(':')[1] || 'llama3.1:8b';
    client = familyConfig.initClient();

    // Use provided context window and max tokens, or fallback to defaults
    modelConfig = {
      ...modelConfig,
      contextWindow: options.contextWindow || modelConfig.contextWindow,
      maxOutput: options.maxTokens || modelConfig.maxOutput,
      modelName: `Ollama ${ollamaModelName}`,
    };
  } else if (modelFamily === 'openai-compatible') {
    client = familyConfig.initClient(apiKey, modelConfig.baseURL);
  } else {
    client = familyConfig.initClient(apiKey);
  }

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

  logger.info('AI Prompt', { processedPrompt });
  try {
    const modelName =
      modelFamily === 'ollama'
        ? modelKey.split(':')[1] || 'llama3.1:8b'
        : modelKey;

    const generateTextOptions: GenerateTextOptions = {
      model: client(modelName),
      maxTokens: modelConfig.maxOutput,
      temperature: taskTemperature,
      prompt: processedPrompt,
    };

    if (options.systemPrompt) {
      console.log(chalk.cyan('Using system prompt'));
      generateTextOptions.system = options.systemPrompt;
    }

    const result = await generateText({
      model:
        modelFamily === 'ollama'
          ? client(modelKey.split(':')[1] || 'llama3.1:8b')
          : client(modelKey),
      maxTokens: modelConfig.maxOutput,
      temperature: taskTemperature,
      system: options.systemPrompt ?? '',
      prompt: processedPrompt,
    });

    logger.info('AI Response', { response: result.text });

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

    // Subtract 20 tokens for the response itself (to account for potential token count differences)
    if (result.usage.completionTokens >= modelConfig.maxOutput - 20) {
      console.log(
        chalk.bold.red(
          'WARNING: Maximum output length reached. Some files may be missing from the parsed response. The files that are included should be fine.',
        ),
      );
    }

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
