import { describe, expect, it } from 'vitest';
import { calculateCost, estimateCost } from '../../src/ai/cost-calculation';
import { getModelNames } from '../../src/ai/model-config';

function roundTo(num: number, decimals: number): number {
  return Number(num.toFixed(decimals));
}

describe('Cost Calculation', () => {
  describe('calculateCost', () => {
    it('should calculate cost correctly for Claude models', () => {
      const usage = { inputTokens: 1000000, outputTokens: 500000 };
      expect(calculateCost('claude-3-5-sonnet-20240620', usage)).toBe(10.5);
      expect(calculateCost('claude-3-opus-20240229', usage)).toBe(52.5);
      expect(calculateCost('claude-3-haiku-20240307', usage)).toBe(0.875);
    });

    it('should calculate cost correctly for GPT models', () => {
      const usage = { inputTokens: 1000000, outputTokens: 500000 };
      expect(calculateCost('gpt-4o', usage)).toBe(12.5);
      expect(roundTo(calculateCost('gpt-4o-mini', usage), 2)).toBe(0.45);
    });

    it('should throw an error for unknown models', () => {
      const usage = { inputTokens: 1000, outputTokens: 500 };
      expect(() => calculateCost('unknown-model', usage)).toThrow(
        'Unknown model: unknown-model',
      );
    });
  });

  describe('estimateCost', () => {
    it('should estimate cost correctly for Claude models', () => {
      expect(estimateCost('claude-3-5-sonnet-20240620', 1000000, 500000)).toBe(
        10.5,
      );
      expect(estimateCost('claude-3-opus-20240229', 1000000, 500000)).toBe(
        52.5,
      );
      expect(estimateCost('claude-3-haiku-20240307', 1000000, 500000)).toBe(
        0.875,
      );
    });

    it('should estimate cost correctly for GPT models', () => {
      expect(estimateCost('gpt-4o', 1000000, 500000)).toBe(12.5);
      expect(roundTo(estimateCost('gpt-4o-mini', 1000000, 500000), 2)).toBe(
        0.45,
      );
    });

    it('should throw an error for unknown models', () => {
      expect(() => estimateCost('unknown-model', 1000, 500)).toThrow(
        'Unknown model: unknown-model',
      );
    });
  });

  describe('getAvailableModels', () => {
    it('should return all available models', () => {
      const availableModels = getModelNames();
      expect(availableModels).toEqual([
        'claude-3-5-sonnet-20240620',
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
        'claude-3-haiku-20240307',
        'gpt-4o',
        'gpt-4o-mini',
        'llama-3.1-70b-versatile',
      ]);
    });
  });
});
