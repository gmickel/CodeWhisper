import type { ModelFamily, ModelSpec, ModelSpecs } from '../types';

export const MODEL_CONFIGS: ModelSpecs = {
  'claude-3-5-sonnet-20240620': {
    contextWindow: 200000,
    maxOutput: 8192,
    modelName: 'Claude 3.5 Sonnet',
    pricing: { inputCost: 3, outputCost: 15 },
    modelFamily: 'claude',
    temperature: {
      planningTemperature: 0.5,
      codegenTemperature: 0.2,
    },
    mode: 'diff',
    apiKeyEnv: 'ANTHROPIC_API_KEY',
  },
  'claude-3-opus-20240229': {
    contextWindow: 200000,
    maxOutput: 4096,
    modelName: 'Claude 3 Opus',
    pricing: { inputCost: 15, outputCost: 75 },
    modelFamily: 'claude',
    temperature: {
      planningTemperature: 0.5,
      codegenTemperature: 0.2,
    },
    mode: 'diff',
    apiKeyEnv: 'ANTHROPIC_API_KEY',
  },
  'claude-3-sonnet-20240229': {
    contextWindow: 200000,
    maxOutput: 4096,
    modelName: 'Claude 3 Sonnet',
    pricing: { inputCost: 3, outputCost: 15 },
    modelFamily: 'claude',
    temperature: {
      planningTemperature: 0.5,
      codegenTemperature: 0.2,
    },
    mode: 'whole',
    apiKeyEnv: 'ANTHROPIC_API_KEY',
  },
  'claude-3-haiku-20240307': {
    contextWindow: 200000,
    maxOutput: 4096,
    modelName: 'Claude 3 Haiku',
    pricing: { inputCost: 0.25, outputCost: 1.25 },
    modelFamily: 'claude',
    temperature: {
      planningTemperature: 0.5,
      codegenTemperature: 0.2,
    },
    mode: 'whole',
    apiKeyEnv: 'ANTHROPIC_API_KEY',
  },
  'gpt-4o-2024-08-06': {
    contextWindow: 128000,
    maxOutput: 16384,
    modelName: 'GPT 4 Omni',
    pricing: { inputCost: 2.5, outputCost: 10 },
    modelFamily: 'openai',
    temperature: {
      planningTemperature: 0.5,
      codegenTemperature: 0.1,
    },
    mode: 'diff',
    apiKeyEnv: 'OPENAI_API_KEY',
  },
  'gpt-4o-mini': {
    contextWindow: 128000,
    maxOutput: 16384,
    modelName: 'GPT 4 Omni Mini',
    pricing: { inputCost: 0.15, outputCost: 0.6 },
    modelFamily: 'openai',
    temperature: {
      planningTemperature: 0.5,
      codegenTemperature: 0.1,
    },
    mode: 'whole',
    apiKeyEnv: 'OPENAI_API_KEY',
  },
  'deepseek-coder': {
    contextWindow: 128000,
    maxOutput: 8000,
    modelName: 'DeepSeek-Coder',
    pricing: { inputCost: 0.14, outputCost: 0.28 },
    modelFamily: 'openai-compatible',
    temperature: {
      planningTemperature: 0.5,
      codegenTemperature: 0.1,
    },
    mode: 'diff',
    baseURL: 'https://api.deepseek.com/beta',
    apiKeyEnv: 'DEEPSEEK_API_KEY',
  },
  'llama-3.1-70b-versatile': {
    contextWindow: 131072,
    maxOutput: 8000,
    modelName: 'Llama 3.1 70B Groq',
    pricing: { inputCost: 0.15, outputCost: 0.6 },
    modelFamily: 'openai-compatible',
    temperature: {
      planningTemperature: 0.5,
      codegenTemperature: 0.1,
    },
    mode: 'whole',
    baseURL: 'https://api.groq.com/openai/v1',
    apiKeyEnv: 'GROQ_API_KEY',
  },
  ollama: {
    contextWindow: 4096,
    maxOutput: 4096,
    modelName: 'Ollama Model',
    pricing: { inputCost: 0, outputCost: 0 },
    modelFamily: 'ollama',
    mode: 'whole',
  },
};

export function getModelNames(): string[] {
  return Object.keys(MODEL_CONFIGS);
}

export function getModelConfig(modelKey: string): ModelSpec {
  if (modelKey.startsWith('ollama:')) {
    return MODEL_CONFIGS.ollama;
  }

  const config = MODEL_CONFIGS[modelKey];
  if (!config) {
    throw new Error(`Unknown model: ${modelKey}`);
  }
  return config;
}

export function getModelFamily(modelKey: string): ModelFamily {
  if (modelKey.startsWith('ollama:')) {
    return 'ollama';
  }

  const config = getModelConfig(modelKey);
  return config.modelFamily;
}
