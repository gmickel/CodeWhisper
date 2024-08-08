import { decode, encode } from 'gpt-tokenizer';
import { getModelConfig, getModelFamily } from './model-config';

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export function countTokens(text: string): number {
  return encode(text).length;
}

export function truncateToContextLimit(text: string, modelKey: string): string {
  const modelConfig = getModelConfig(modelKey);
  if (!modelConfig) throw new Error(`Unknown model: ${modelKey}`);

  const tokens = encode(text);
  if (tokens.length <= modelConfig.contextWindow) return text;

  return decode(tokens.slice(0, modelConfig.contextWindow));
}

export function estimateTokenCount(text: string, modelKey: string): number {
  const baseTokenCount = countTokens(text);

  const modelFamily = getModelFamily(modelKey);

  switch (modelFamily) {
    case 'claude': {
      // Anthropic models use a different tokenizer, so we apply a multiplier
      const anthropicMultiplier = 1.35;
      return Math.ceil(baseTokenCount * anthropicMultiplier);
    }
    case 'openai':
    case 'openai-compatible':
      // OpenAI and OpenAI-compatible models use the same tokenizer
      return baseTokenCount;
    default:
      // If we encounter an unknown model family, we'll use the base count
      // and log a warning
      console.warn(
        `Unknown model family for tokenization: ${modelFamily}. Using base token count.`,
      );
      return baseTokenCount;
  }
}
