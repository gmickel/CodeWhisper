import { getModelConfig } from './model-config';
import type { TokenUsage } from './token-management';

export function calculateCost(modelKey: string, usage: TokenUsage): number {
  const modelConfig = getModelConfig(modelKey);
  if (!modelConfig) throw new Error(`Unknown model: ${modelKey}`);

  const inputCost =
    (usage.inputTokens / 1_000_000) * modelConfig.pricing.inputCost;
  const outputCost =
    (usage.outputTokens / 1_000_000) * modelConfig.pricing.outputCost;

  return Number((inputCost + outputCost).toFixed(6));
}

export function estimateCost(
  modelKey: string,
  estimatedInputTokens: number,
  estimatedOutputTokens: number,
): number {
  const modelConfig = getModelConfig(modelKey);
  if (!modelConfig) throw new Error(`Unknown model: ${modelKey}`);

  const estimatedInputCost =
    (estimatedInputTokens / 1_000_000) * modelConfig.pricing.inputCost;
  const estimatedOutputCost =
    (estimatedOutputTokens / 1_000_000) * modelConfig.pricing.outputCost;

  return Number((estimatedInputCost + estimatedOutputCost).toFixed(6));
}
