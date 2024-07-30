import { createAnthropic } from '@ai-sdk/anthropic';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as modelConfig from '../../src/ai/model-config';
import { parseAICodegenResponse } from '../../src/ai/parse-ai-codegen-response';
import getLogger from '../../src/utils/logger';

vi.mock('../../src/utils/logger');
vi.mock('../../src/ai/model-config');
vi.mock('@ai-sdk/anthropic');
vi.mock('ai');

describe('Logging functionality', () => {
  const mockGenerateText = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(modelConfig.getModelConfig).mockReturnValue({
      contextWindow: 100000,
      maxOutput: 4096,
      modelName: 'Claude 3.5 Sonnet',
      pricing: { inputCost: 3, outputCost: 15 },
      modelFamily: 'claude',
    });
    vi.mocked(modelConfig.getModelFamily).mockReturnValue('claude');

    // Mock the createAnthropic function
    vi.mocked(createAnthropic).mockReturnValue({
      generateText: mockGenerateText,
    } as unknown as ReturnType<typeof createAnthropic>);

    // Mock process.env
    vi.stubEnv('ANTHROPIC_API_KEY', 'mock-api-key');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('should log parsed AI codegen response when logging is enabled', () => {
    const mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
    };
    vi.mocked(getLogger).mockReturnValue(mockLogger);

    const mockResponse = `
      <file_list>file1.js</file_list>
      <git_branch_name>feature/test</git_branch_name>
      <git_commit_message>Test commit</git_commit_message>
    `;

    parseAICodegenResponse(mockResponse, true);

    expect(mockLogger.info).toHaveBeenCalledWith('Parsed AI Codegen Response', {
      parsedResponse: expect.objectContaining({
        fileList: ['file1.js'],
        gitBranchName: 'feature/test',
        gitCommitMessage: 'Test commit',
      }),
    });
  });
});
