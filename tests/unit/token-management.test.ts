import { describe, expect, it } from 'vitest';
import { getModelConfig } from '../../src/ai/model-config';
import {
  countTokens,
  estimateTokenCount,
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
      'gpt-4o-2024-08-06',
      'gpt-4o-mini',
      'llama-3.1-70b-versatile',
      'deepseek-coder',
    ])('should truncate text to context limit for %s', (model) => {
      const modelSpecs = getModelConfig(model);
      if (!modelSpecs) {
        throw new Error(`Model specifications not found for ${model}`);
      }
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
      const result = truncateToContextLimit(shortText, 'gpt-4o-2024-08-06');
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
      const gptEstimate = estimateTokenCount(text, 'gpt-4o-2024-08-06');
      expect(claudeEstimate).toBeGreaterThan(gptEstimate);
    });

    it('should estimate tokens correctly for GPT models and OpenAI compatible models', () => {
      const text = 'This is a test sentence.';
      const gptEstimate = estimateTokenCount(text, 'gpt-4o-2024-08-06');
      expect(gptEstimate).toBe(6); // Actual token count without multiplier
      const openaiEstimate = estimateTokenCount(
        text,
        'llama-3.1-70b-versatile',
      );
      expect(openaiEstimate).toBe(6); // Actual token count without multiplier
    });
  });

  describe('getModelSpecs', () => {
    it('should return correct specs for Claude models', () => {
      const specs = getModelConfig('claude-3-5-sonnet-20240620');
      expect(specs).toEqual({
        contextWindow: 200000,
        mode: 'diff',
        maxOutput: 8192,
        modelName: 'Claude 3.5 Sonnet',
        pricing: { inputCost: 3, outputCost: 15 },
        modelFamily: 'claude',
        temperature: {
          planningTemperature: 0.5,
          codegenTemperature: 0.2,
        },
        apiKeyEnv: 'ANTHROPIC_API_KEY',
      });
    });

    it('should return correct specs for GPT models', () => {
      const specs = getModelConfig('gpt-4o-2024-08-06');
      expect(specs).toEqual({
        contextWindow: 128000,
        maxOutput: 16384,
        modelName: 'GPT 4 Omni',
        pricing: { inputCost: 2.5, outputCost: 10 },
        modelFamily: 'openai',
        temperature: {
          planningTemperature: 0.5,
          codegenTemperature: 0.1,
        },
        apiKeyEnv: 'OPENAI_API_KEY',
        mode: 'diff',
      });
    });

    it('should return correct specs for GROQ models', () => {
      const specs = getModelConfig('llama-3.1-70b-versatile');
      expect(specs).toEqual({
        contextWindow: 131072,
        maxOutput: 8000,
        modelName: 'Llama 3.1 70B Groq',
        pricing: { inputCost: 0.15, outputCost: 0.6 },
        modelFamily: 'openai-compatible',
        apiKeyEnv: 'GROQ_API_KEY',
        mode: 'whole',
        temperature: {
          planningTemperature: 0.5,
          codegenTemperature: 0.1,
        },
        baseURL: 'https://api.groq.com/openai/v1',
      });
    });

    it('should return correct specs for DEEPSEEK models', () => {
      const specs = getModelConfig('deepseek-coder');
      expect(specs).toEqual({
        contextWindow: 128000,
        maxOutput: 8000,
        modelName: 'DeepSeek-Coder',
        pricing: { inputCost: 0.14, outputCost: 0.28 },
        modelFamily: 'openai-compatible',
        baseURL: 'https://api.deepseek.com/beta',
        apiKeyEnv: 'DEEPSEEK_API_KEY',
        mode: 'diff',
        temperature: {
          planningTemperature: 0.5,
          codegenTemperature: 0.1,
        },
      });
    });

    it('should throw an error for unknown models', () => {
      expect(() => getModelConfig('unknown-model')).toThrow(
        'Unknown model: unknown-model',
      );
    });
  });
});
