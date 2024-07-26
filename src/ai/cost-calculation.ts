import type { TokenUsage } from './token-management';

interface LLMPricing {
  inputCost: number;
  outputCost: number;
}

const LLM_PRICING: Record<string, LLMPricing> = {
  'claude-3-5-sonnet-20240620': { inputCost: 3, outputCost: 15 },
  'claude-3-opus-20240229': { inputCost: 15, outputCost: 75 },
  'claude-3-sonnet-20240229': { inputCost: 3, outputCost: 15 },
  'claude-3-haiku-20240307': { inputCost: 0.25, outputCost: 1.25 },
  'gpt-4o': { inputCost: 5, outputCost: 15 },
  'gpt-4o-mini': { inputCost: 0.15, outputCost: 0.6 },
};

export function calculateCost(model: string, usage: TokenUsage): number {
  const pricing = LLM_PRICING[model];
  if (!pricing) {
    throw new Error(`Unknown model: ${model}`);
  }

  const inputCost = (usage.inputTokens / 1_000_000) * pricing.inputCost;
  const outputCost = (usage.outputTokens / 1_000_000) * pricing.outputCost;

  return Number((inputCost + outputCost).toFixed(6));
}

export function estimateCost(
  model: string,
  estimatedInputTokens: number,
  estimatedOutputTokens: number,
): number {
  const pricing = LLM_PRICING[model];
  if (!pricing) {
    throw new Error(`Unknown model: ${model}`);
  }

  const estimatedInputCost =
    (estimatedInputTokens / 1_000_000) * pricing.inputCost;
  const estimatedOutputCost =
    (estimatedOutputTokens / 1_000_000) * pricing.outputCost;

  return Number((estimatedInputCost + estimatedOutputCost).toFixed(6));
}

export function getAvailableModels(): string[] {
  return Object.keys(LLM_PRICING);
}
