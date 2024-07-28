import { decode, encode } from 'gpt-tokenizer';
import { getModelConfig } from './model-config';

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

  // Anthropic models use a different tokenizer, so we apply a multiplier
  const anthropicMultiplier = 1.35;

  if (modelKey.startsWith('claude-')) {
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
  modelKey: string,
): TokenUsage {
  return {
    inputTokens: estimateTokenCount(input, modelKey),
    outputTokens: estimateTokenCount(output, modelKey),
  };
}
