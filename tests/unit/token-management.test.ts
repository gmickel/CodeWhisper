import { describe, expect, it } from 'vitest';
import {
  calculateTokenUsage,
  countTokens,
  estimateTokenCount,
  getModelSpecs,
  truncateToContextLimit,
} from '../../src/ai/token-management';

describe('Token Management', () => {
  describe('countTokens', () => {
    it('should count tokens correctly', () => {
      expect(countTokens('Hello, world!')).toBe(4);
      expect(countTokens('This is a longer sentence with more tokens.')).toBe(
        9,
      );
    });
  });

  describe('truncateToContextLimit', () => {
    it.each([
      'claude-3-5-sonnet-20240620',
      'claude-3-opus-20240229',
      'claude-3-haiku-20240307',
      'gpt-4o',
      'gpt-4o-mini',
    ])('should truncate text to context limit for %s', (model) => {
      const modelSpecs = getModelSpecs(model);
      const contextWindow = modelSpecs.contextWindow;

      // Create a string that's definitely longer than the context window in tokens
      const longText = 'a '.repeat(contextWindow + 1000);

      const truncated = truncateToContextLimit(longText, model);

      const originalTokens = countTokens(longText);
      const truncatedTokens = countTokens(truncated);

      expect(truncatedTokens).toBeLessThanOrEqual(contextWindow);
      expect(truncatedTokens).toBeLessThan(originalTokens);

      console.log(`Model: ${model}`);
      console.log(`Original tokens: ${originalTokens}`);
      console.log(`Truncated tokens: ${truncatedTokens}`);
      console.log(`Context window: ${contextWindow}`);
    });

    it('should not truncate text within context limit', () => {
      const shortText = 'This is a short text.';
      const result = truncateToContextLimit(shortText, 'gpt-4o');
      expect(result).toBe(shortText);
    });

    it('should throw an error for unknown models', () => {
      expect(() => truncateToContextLimit('text', 'unknown-model')).toThrow(
        'Unknown model: unknown-model',
      );
    });
  });
  describe('estimateTokenCount', () => {
    it('should estimate tokens correctly for Claude models', () => {
      const text = 'This is a test sentence.';
      const claudeEstimate = estimateTokenCount(
        text,
        'claude-3-5-sonnet-20240620',
      );
      const gptEstimate = estimateTokenCount(text, 'gpt-4o');
      expect(claudeEstimate).toBeGreaterThan(gptEstimate);
    });

    it('should estimate tokens correctly for GPT models', () => {
      const text = 'This is a test sentence.';
      const gptEstimate = estimateTokenCount(text, 'gpt-4o');
      expect(gptEstimate).toBe(6); // Actual token count without multiplier
    });
  });

  describe('calculateTokenUsage', () => {
    it('should calculate token usage correctly', () => {
      const input = 'Input text';
      const output = 'Output text';
      const usage = calculateTokenUsage(
        input,
        output,
        'claude-3-5-sonnet-20240620',
      );
      expect(usage.inputTokens).toBeGreaterThan(0);
      expect(usage.outputTokens).toBeGreaterThan(0);
    });
  });

  describe('getModelSpecs', () => {
    it('should return correct specs for Claude models', () => {
      const specs = getModelSpecs('claude-3-5-sonnet-20240620');
      expect(specs).toEqual({
        contextWindow: 200000,
        maxOutput: 8192,
        modelName: 'Claude 3.5 Sonnet',
      });
    });

    it('should return correct specs for GPT models', () => {
      const specs = getModelSpecs('gpt-4o');
      expect(specs).toEqual({
        contextWindow: 128000,
        maxOutput: 4096,
        modelName: 'GPT 4 Omni',
      });
    });

    it('should throw an error for unknown models', () => {
      expect(() => getModelSpecs('unknown-model')).toThrow(
        'Unknown model: unknown-model',
      );
    });
  });
});
