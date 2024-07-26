import { decode, encode } from 'gpt-tokenizer';

interface ModelSpecs {
  contextWindow: number;
  maxOutput: number;
  modelName: string;
}

const MODEL_SPECS: Record<string, ModelSpecs> = {
  'claude-3-5-sonnet-20240620': {
    contextWindow: 200000,
    maxOutput: 8192,
    modelName: 'Claude 3.5 Sonnet',
  },
  'claude-3-opus-20240229': {
    contextWindow: 200000,
    maxOutput: 4096,
    modelName: 'Claude 3 Opus',
  },
  'claude-3-sonnet-20240229': {
    contextWindow: 200000,
    maxOutput: 4096,
    modelName: 'Claude 3 Sonnet',
  },
  'claude-3-haiku-20240307': {
    contextWindow: 200000,
    maxOutput: 4096,
    modelName: 'Claude 3 Haiku',
  },
  'gpt-4o': { contextWindow: 128000, maxOutput: 4096, modelName: 'GPT 4 Omni' },
  'gpt-4o-mini': {
    contextWindow: 128000,
    maxOutput: 16384,
    modelName: 'GPT 4 Omni Mini',
  },
};

export function countTokens(text: string): number {
  return encode(text).length;
}

export function truncateToContextLimit(text: string, model: string): string {
  const specs = MODEL_SPECS[model];
  if (!specs) throw new Error(`Unknown model: ${model}`);

  const tokens = encode(text);
  if (tokens.length <= specs.contextWindow) return text;

  // Truncate tokens and then decode
  return decode(tokens.slice(0, specs.contextWindow));
}

export function estimateTokenCount(text: string, model: string): number {
  const baseTokenCount = countTokens(text);

  // Anthropic models use a different tokenizer, so we apply a multiplier
  const anthropicMultiplier = 1.35;

  if (model.startsWith('claude-')) {
    return Math.ceil(baseTokenCount * anthropicMultiplier);
  }

  return baseTokenCount;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export function calculateTokenUsage(
  input: string,
  output: string,
  model: string,
): TokenUsage {
  return {
    inputTokens: estimateTokenCount(input, model),
    outputTokens: estimateTokenCount(output, model),
  };
}

export function getModelSpecs(model: string): ModelSpecs {
  const specs = MODEL_SPECS[model];
  if (!specs) throw new Error(`Unknown model: ${model}`);
  return specs;
}
