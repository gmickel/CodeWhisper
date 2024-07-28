import type { ModelSpec, ModelSpecs } from '../types';
export const MODEL_CONFIGS: ModelSpecs = {
  'claude-3-5-sonnet-20240620': {
    contextWindow: 200000,
    maxOutput: 8192,
    modelName: 'Claude 3.5 Sonnet',
    pricing: { inputCost: 3, outputCost: 15 },
  },
  'claude-3-opus-20240229': {
    contextWindow: 200000,
    maxOutput: 4096,
    modelName: 'Claude 3 Opus',
    pricing: { inputCost: 15, outputCost: 75 },
  },
  'claude-3-sonnet-20240229': {
    contextWindow: 200000,
    maxOutput: 4096,
    modelName: 'Claude 3 Sonnet',
    pricing: { inputCost: 3, outputCost: 15 },
  },
  'claude-3-haiku-20240307': {
    contextWindow: 200000,
    maxOutput: 4096,
    modelName: 'Claude 3 Haiku',
    pricing: { inputCost: 0.25, outputCost: 1.25 },
  },
  'gpt-4o': {
    contextWindow: 128000,
    maxOutput: 4096,
    modelName: 'GPT 4 Omni',
    pricing: { inputCost: 5, outputCost: 15 },
  },
  'gpt-4o-mini': {
    contextWindow: 128000,
    maxOutput: 16384,
    modelName: 'GPT 4 Omni Mini',
    pricing: { inputCost: 0.15, outputCost: 0.6 },
  },
};

export function getModelNames(): string[] {
  return Object.keys(MODEL_CONFIGS);
}

export function getModelConfig(modelKey: string): ModelSpec | undefined {
  if (!MODEL_CONFIGS[modelKey]) {
    throw new Error(`Unknown model: ${modelKey}`);
  }
  return MODEL_CONFIGS[modelKey];
}