import { search } from '@inquirer/prompts';
import { getModelConfig, getModelNames } from '../ai/model-config';
import type { ModelSpec } from '../types';

export async function selectModelPrompt(): Promise<string> {
  const modelNames = getModelNames().filter(
    (name) => !name.startsWith('ollama'),
  );

  return search({
    message: 'Select an AI model:',
    source: async (input) => {
      if (!input) {
        return modelNames.map(formatModelChoice);
      }
      const filteredModels = modelNames.filter(
        (name) =>
          name.toLowerCase().includes(input.toLowerCase()) ||
          getModelConfig(name)
            .modelName.toLowerCase()
            .includes(input.toLowerCase()),
      );
      return filteredModels.map(formatModelChoice);
    },
  });
}

function formatModelChoice(modelKey: string): {
  name: string;
  value: string;
  description: string;
} {
  const model: ModelSpec = getModelConfig(modelKey);
  const { modelName, pricing, contextWindow, maxOutput } = model;

  const name = `${modelName} (${modelKey})`;
  const description =
    `🔍 Context: ${contextWindow} tokens, Max Output: ${maxOutput} tokens\n` +
    `💰 Pricing: $${pricing.inputCost}/1M input tokens, $${pricing.outputCost}/1M output tokens`;

  return {
    name,
    value: modelKey,
    description,
  };
}
