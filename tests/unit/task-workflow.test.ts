import path from 'node:path';
import simpleGit, { type SimpleGit } from 'simple-git';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { generateAIResponse } from '../../src/ai/generate-ai-response';
import { getInstructions } from '../../src/ai/get-instructions';
import { getTaskDescription } from '../../src/ai/get-task-description';
import { getModelConfig } from '../../src/ai/model-config';
import { parseAICodegenResponse } from '../../src/ai/parse-ai-codegen-response';
import { reviewPlan } from '../../src/ai/plan-review';
import { runAIAssistedTask } from '../../src/ai/task-workflow';
import { processFiles } from '../../src/core/file-processor';
import { generateMarkdown } from '../../src/core/markdown-generator';
import { applyChanges } from '../../src/git/apply-changes';
import { selectFilesPrompt } from '../../src/interactive/select-files-prompt';
import { selectModelPrompt } from '../../src/interactive/select-model-prompt';
import type {
  AIParsedResponse,
  AiAssistedTaskOptions,
  ModelSpec,
} from '../../src/types';
import { ensureBranch } from '../../src/utils/git-tools';
import { TaskCache } from '../../src/utils/task-cache';

vi.mock('../../src/ai/get-task-description');
vi.mock('../../src/ai/get-instructions');
vi.mock('../../src/interactive/select-files-prompt');
vi.mock('../../src/core/file-processor');
vi.mock('../../src/core/markdown-generator');
vi.mock('../../src/ai/generate-ai-response');
vi.mock('../../src/ai/parse-ai-codegen-response');
vi.mock('../../src/ai/plan-review');
vi.mock('../../src/git/apply-changes');
vi.mock('../../src/utils/git-tools');
vi.mock('../../src/ai/model-config');
vi.mock('simple-git');
vi.mock('../../src/utils/task-cache');
vi.mock('../../src/interactive/select-model-prompt');
vi.mock('../../src/interactive/select-files-prompt');

vi.mock('../../src/ai/model-config', async () => {
  const actual = await vi.importActual('../../src/ai/model-config');
  return {
    ...actual,
    getModelNames: vi.fn().mockReturnValue(['model1', 'model2']),
    getModelConfig: vi.fn().mockReturnValue({
      contextWindow: 100000,
      maxOutput: 4096,
      modelName: 'Test Model',
      pricing: { inputCost: 0.01, outputCost: 0.02 },
      modelFamily: 'test',
      temperature: {
        planningTemperature: 0.7,
        codegenTemperature: 0.5,
      },
    }),
  };
});

describe('runAIAssistedTask', () => {
  const mockOptions: AiAssistedTaskOptions = {
    path: path.join('/', 'test', 'path'),
    model: 'claude-3-5-sonnet-20240620',
    dryRun: false,
    noCodeblock: false,
    invert: false,
    plan: true,
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should execute the happy path successfully with no planning step', async () => {
    const mockTaskDescription = 'Test task description';
    const mockInstructions = 'Test instructions';
    const mockSelectedFiles = ['file1.ts', 'file2.ts'];
    const mockProcessedFiles = [
      {
        path: 'file1.ts',
        content: 'content1',
        language: 'typescript',
        size: 100,
        created: new Date(),
        modified: new Date(),
        extension: 'ts',
      },
      {
        path: 'file2.ts',
        content: 'content2',
        language: 'typescript',
        size: 200,
        created: new Date(),
        modified: new Date(),
        extension: 'ts',
      },
    ];
    const mockGeneratedCode = `
      <file_list>
      file1.ts
      file2.ts
      </file_list>
      <file>
      <file_path>file1.ts</file_path>
      <file_content language="typescript">
      // Updated content for file1.ts
      </file_content>
      <file_status>modified</file_status>
      </file>
      <file>
      <file_path>file2.ts</file_path>
      <file_content language="typescript">
      // Updated content for file2.ts
      </file_content>
      <file_status>modified</file_status>
      </file>
      <git_branch_name>feature/test-task</git_branch_name>
      <git_commit_message>Implement test task</git_commit_message>
      <summary>Updated both files</summary>
      <potential_issues>None</potential_issues>
    `;

    const mockParsedResponse = {
      gitBranchName: 'feature/test-task',
      gitCommitMessage: 'Implement test task',
      fileList: ['file1.ts', 'file2.ts'],
      files: [
        {
          path: 'file1.ts',
          content: '// Updated content for file1.ts',
          language: 'typescript',
          status: 'modified',
        },
        {
          path: 'file2.ts',
          content: '// Updated content for file2.ts',
          language: 'typescript',
          status: 'modified',
        },
      ],
      summary: 'Updated both files',
      potentialIssues: 'None',
    };

    const mockModelConfig: ModelSpec = {
      contextWindow: 100000,
      maxOutput: 4096,
      modelName: 'Claude 3.5 Sonnet',
      pricing: { inputCost: 3, outputCost: 15 },
      modelFamily: 'claude',
      temperature: {
        planningTemperature: 0.5,
        codegenTemperature: 0.3,
      },
    };

    vi.mocked(getTaskDescription).mockResolvedValue(mockTaskDescription);
    vi.mocked(getInstructions).mockResolvedValue(mockInstructions);
    vi.mocked(selectFilesPrompt).mockResolvedValue(mockSelectedFiles);
    vi.mocked(processFiles).mockResolvedValue(mockProcessedFiles);
    vi.mocked(generateMarkdown).mockResolvedValue('Generated markdown');
    vi.mocked(generateAIResponse).mockResolvedValueOnce(mockGeneratedCode);
    vi.mocked(parseAICodegenResponse).mockReturnValue(
      mockParsedResponse as unknown as AIParsedResponse,
    );
    vi.mocked(ensureBranch).mockResolvedValue('feature/test-task');
    vi.mocked(applyChanges).mockResolvedValue();
    vi.mocked(getModelConfig).mockReturnValue(mockModelConfig);

    const mockOptionsWithoutPlan = {
      ...mockOptions,
      plan: false,
    };

    await runAIAssistedTask(mockOptionsWithoutPlan);

    expect(getTaskDescription).toHaveBeenCalled();
    expect(getInstructions).toHaveBeenCalled();
    expect(processFiles).toHaveBeenCalledWith(
      expect.objectContaining({
        path: expect.stringMatching(/[\\\/]test[\\\/]path$/),
      }),
    );
    expect(generateMarkdown).toHaveBeenCalledTimes(1);
    expect(generateAIResponse).toHaveBeenCalledTimes(1);
    expect(reviewPlan).toHaveBeenCalledTimes(0);
    expect(parseAICodegenResponse).toHaveBeenCalledWith(
      mockGeneratedCode,
      undefined,
      undefined,
    );

    expect(ensureBranch).toHaveBeenCalledWith(
      expect.stringMatching(/[\\\/]test[\\\/]path$/),
      'feature/test-task',
      { issueNumber: undefined },
    );
    expect(applyChanges).toHaveBeenCalledWith(
      expect.objectContaining({
        basePath: expect.stringMatching(/[\\\/]test[\\\/]path$/),
        parsedResponse: mockParsedResponse,
        dryRun: false,
      }),
    );
  });

  it('should execute the happy path successfully', async () => {
    const mockTaskDescription = 'Test task description';
    const mockInstructions = 'Test instructions';
    const mockSelectedFiles = ['file1.ts', 'file2.ts'];
    const mockProcessedFiles = [
      {
        path: 'file1.ts',
        content: 'content1',
        language: 'typescript',
        size: 100,
        created: new Date(),
        modified: new Date(),
        extension: 'ts',
      },
      {
        path: 'file2.ts',
        content: 'content2',
        language: 'typescript',
        size: 200,
        created: new Date(),
        modified: new Date(),
        extension: 'ts',
      },
    ];
    const mockGeneratedPlan = 'Generated plan';
    const mockReviewedPlan = 'Reviewed plan';
    const mockGeneratedCode = `
      <file_list>
      file1.ts
      file2.ts
      </file_list>
      <file>
      <file_path>file1.ts</file_path>
      <file_content language="typescript">
      // Updated content for file1.ts
      </file_content>
      <file_status>modified</file_status>
      </file>
      <file>
      <file_path>file2.ts</file_path>
      <file_content language="typescript">
      // Updated content for file2.ts
      </file_content>
      <file_status>modified</file_status>
      </file>
      <git_branch_name>feature/test-task</git_branch_name>
      <git_commit_message>Implement test task</git_commit_message>
      <summary>Updated both files</summary>
      <potential_issues>None</potential_issues>
    `;

    const mockParsedResponse = {
      gitBranchName: 'feature/test-task',
      gitCommitMessage: 'Implement test task',
      fileList: ['file1.ts', 'file2.ts'],
      files: [
        {
          path: 'file1.ts',
          content: '// Updated content for file1.ts',
          language: 'typescript',
          status: 'modified',
        },
        {
          path: 'file2.ts',
          content: '// Updated content for file2.ts',
          language: 'typescript',
          status: 'modified',
        },
      ],
      summary: 'Updated both files',
      potentialIssues: 'None',
    };

    const mockModelConfig: ModelSpec = {
      contextWindow: 100000,
      maxOutput: 4096,
      modelName: 'Claude 3.5 Sonnet',
      pricing: { inputCost: 3, outputCost: 15 },
      modelFamily: 'claude',
      temperature: {
        planningTemperature: 0.5,
        codegenTemperature: 0.3,
      },
    };

    vi.mocked(getTaskDescription).mockResolvedValue(mockTaskDescription);
    vi.mocked(getInstructions).mockResolvedValue(mockInstructions);
    vi.mocked(selectFilesPrompt).mockResolvedValue(mockSelectedFiles);
    vi.mocked(processFiles).mockResolvedValue(mockProcessedFiles);
    vi.mocked(generateMarkdown).mockResolvedValue('Generated markdown');
    vi.mocked(generateAIResponse).mockResolvedValueOnce(mockGeneratedPlan);
    vi.mocked(reviewPlan).mockResolvedValue(mockReviewedPlan);
    vi.mocked(generateAIResponse).mockResolvedValueOnce(mockGeneratedCode);
    vi.mocked(parseAICodegenResponse).mockReturnValue(
      mockParsedResponse as unknown as AIParsedResponse,
    );
    vi.mocked(ensureBranch).mockResolvedValue('feature/test-task');
    vi.mocked(applyChanges).mockResolvedValue();
    vi.mocked(getModelConfig).mockReturnValue(mockModelConfig);

    await runAIAssistedTask(mockOptions);

    expect(getTaskDescription).toHaveBeenCalled();
    expect(getInstructions).toHaveBeenCalled();
    expect(processFiles).toHaveBeenCalledWith(
      expect.objectContaining({
        path: expect.stringMatching(/[\\\/]test[\\\/]path$/),
      }),
    );
    expect(generateMarkdown).toHaveBeenCalledTimes(2);
    expect(generateAIResponse).toHaveBeenCalledTimes(2);
    expect(reviewPlan).toHaveBeenCalledWith(mockGeneratedPlan);
    expect(parseAICodegenResponse).toHaveBeenCalledWith(
      mockGeneratedCode,
      undefined,
      undefined,
    );

    expect(ensureBranch).toHaveBeenCalledWith(
      expect.stringMatching(/[\\\/]test[\\\/]path$/),
      'feature/test-task',
      { issueNumber: undefined },
    );
    expect(applyChanges).toHaveBeenCalledWith(
      expect.objectContaining({
        basePath: expect.stringMatching(/[\\\/]test[\\\/]path$/),
        parsedResponse: mockParsedResponse,
        dryRun: false,
      }),
    );
  });

  it('should handle diff-based updates when --diff flag is used', async () => {
    const diffOptions = {
      ...mockOptions,
      model: 'claude-3-sonnet-20240229',
      diff: true,
    };

    const mockTaskDescription = 'Test diff-based task';
    const mockInstructions = 'Test diff-based instructions';
    const mockSelectedFiles = ['file1.ts'];
    const mockProcessedFiles = [
      {
        path: 'file1.ts',
        content: 'original content',
        language: 'typescript',
        size: 100,
        created: new Date(),
        modified: new Date(),
        extension: 'ts',
      },
    ];
    const mockGeneratedPlan = 'Generated diff-based plan';
    const mockReviewedPlan = 'Reviewed diff-based plan';
    const mockGeneratedCode = `
      <file_list>
      file1.ts
      </file_list>
      <file>
      <file_path>file1.ts</file_path>
      <file_status>modified</file_status>
      <file_content language="typescript">
      --- file1.ts
      +++ file1.ts
      @@ -1 +1 @@
      -original content
      +updated content
      </file_content>
      </file>
      <git_branch_name>feature/diff-task</git_branch_name>
      <git_commit_message>Implement diff-based task</git_commit_message>
      <summary>Updated file using diff</summary>
      <potential_issues>None</potential_issues>
    `;

    const mockParsedResponse = {
      gitBranchName: 'feature/diff-task',
      gitCommitMessage: 'Implement diff-based task',
      fileList: ['file1.ts'],
      files: [
        {
          path: 'file1.ts',
          language: 'typescript',
          status: 'modified',
          diff: {
            oldFileName: 'file1.ts',
            newFileName: 'file1.ts',
            hunks: [
              {
                oldStart: 1,
                oldLines: 1,
                newStart: 1,
                newLines: 1,
                lines: ['-original content', '+updated content'],
              },
            ],
          },
        },
      ],
      summary: 'Updated file using diff',
      potentialIssues: 'None',
    };

    const mockModelConfig: ModelSpec = {
      contextWindow: 100000,
      maxOutput: 4096,
      modelName: 'Claude 3.5 Sonnet',
      pricing: { inputCost: 3, outputCost: 15 },
      modelFamily: 'claude',
      temperature: {
        planningTemperature: 0.5,
        codegenTemperature: 0.3,
      },
    };

    vi.mocked(getTaskDescription).mockResolvedValue(mockTaskDescription);
    vi.mocked(getInstructions).mockResolvedValue(mockInstructions);
    vi.mocked(selectFilesPrompt).mockResolvedValue(mockSelectedFiles);
    vi.mocked(processFiles).mockResolvedValue(mockProcessedFiles);
    vi.mocked(generateMarkdown).mockResolvedValue('Generated markdown');
    vi.mocked(generateAIResponse).mockResolvedValueOnce(mockGeneratedPlan);
    vi.mocked(reviewPlan).mockResolvedValue(mockReviewedPlan);
    vi.mocked(generateAIResponse).mockResolvedValueOnce(mockGeneratedCode);
    vi.mocked(parseAICodegenResponse).mockReturnValue(
      mockParsedResponse as unknown as AIParsedResponse,
    );
    vi.mocked(ensureBranch).mockResolvedValue('feature/diff-task');
    vi.mocked(applyChanges).mockResolvedValue();
    vi.mocked(getModelConfig).mockReturnValue(mockModelConfig);

    await runAIAssistedTask(diffOptions);

    expect(parseAICodegenResponse).toHaveBeenCalledWith(
      mockGeneratedCode,
      undefined,
      true,
    );
    expect(applyChanges).toHaveBeenCalledWith(
      expect.objectContaining({
        basePath: expect.stringMatching(/[\\\/]test[\\\/]path$/),
        parsedResponse: mockParsedResponse,
        dryRun: false,
      }),
    );
  });

  it('should handle auto-commit option correctly', async () => {
    const autoCommitOptions = { ...mockOptions, autoCommit: true };
    const mockGit = {
      add: vi.fn().mockResolvedValue(undefined),
      commit: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(simpleGit).mockReturnValue(mockGit as unknown as SimpleGit);

    vi.mocked(getTaskDescription).mockResolvedValue('Auto-commit task');
    vi.mocked(getInstructions).mockResolvedValue('Auto-commit instructions');
    vi.mocked(selectFilesPrompt).mockResolvedValue(['file1.ts']);
    vi.mocked(processFiles).mockResolvedValue([
      {
        path: 'file1.ts',
        content: 'content',
        language: 'typescript',
        size: 100,
        created: new Date(),
        modified: new Date(),
        extension: 'ts',
      },
    ]);
    vi.mocked(generateMarkdown).mockResolvedValue('Generated markdown');
    vi.mocked(generateAIResponse).mockResolvedValueOnce('Generated plan');
    vi.mocked(reviewPlan).mockResolvedValue('Reviewed plan');
    vi.mocked(generateAIResponse).mockResolvedValueOnce(`
      <git_branch_name>feature/auto-commit</git_branch_name>
      <git_commit_message>Auto-commit changes</git_commit_message>
      <file_list>
      file1.ts
      </file_list>
      <file>
      <file_path>file1.ts</file_path>
      <file_content language="typescript">
      // Auto-commit content
      </file_content>
      <file_status>modified</file_status>
      </file>
      <summary>Auto-commit summary</summary>
      <potential_issues>None</potential_issues>
    `);
    vi.mocked(ensureBranch).mockResolvedValue('feature/auto-commit');
    vi.mocked(applyChanges).mockResolvedValue();

    const mockParsedResponse = {
      gitBranchName: 'feature/auto-commit',
      gitCommitMessage: 'Auto-commit changes',
      fileList: ['file1.ts'],
      files: [
        {
          path: 'file1.ts',
          content: '// Updated content for file1.ts',
          language: 'typescript',
          status: 'modified',
        },
      ],
      summary: 'Auto-commit summary',
      potentialIssues: 'None',
    };

    const mockModelConfig: ModelSpec = {
      contextWindow: 100000,
      maxOutput: 4096,
      modelName: 'Claude 3.5 Sonnet',
      pricing: { inputCost: 3, outputCost: 15 },
      modelFamily: 'claude',
      temperature: {
        planningTemperature: 0.5,
        codegenTemperature: 0.3,
      },
    };

    vi.mocked(getModelConfig).mockReturnValue(mockModelConfig);

    vi.mocked(parseAICodegenResponse).mockReturnValue(
      mockParsedResponse as unknown as AIParsedResponse,
    );

    await runAIAssistedTask(autoCommitOptions);

    expect(mockGit.add).toHaveBeenCalledWith('.');
    expect(mockGit.commit).toHaveBeenCalledWith('Auto-commit changes');
  });

  it('should use provided task and instructions when available', async () => {
    const optionsWithTask = {
      ...mockOptions,
      task: 'Provided task',
      description: 'Provided description',
      instructions: 'Provided instructions',
    };

    vi.mocked(selectFilesPrompt).mockResolvedValue(['file1.ts']);
    vi.mocked(processFiles).mockResolvedValue([
      {
        path: 'file1.ts',
        content: 'content1',
        language: 'typescript',
        size: 100,
        created: new Date(),
        modified: new Date(),
        extension: 'ts',
      },
    ]);
    vi.mocked(generateMarkdown).mockResolvedValue('Generated markdown');
    vi.mocked(generateAIResponse).mockResolvedValue('AI generated plan');
    vi.mocked(reviewPlan).mockResolvedValue('Reviewed plan');
    vi.mocked(generateAIResponse).mockResolvedValueOnce(
      'AI generated code modifications',
    );
    vi.mocked(ensureBranch).mockResolvedValue('feature/test-branch');

    const mockParsedResponse = {
      gitBranchName: 'feature/test-branch',
      gitCommitMessage: 'Test',
      fileList: ['file1.ts'],
      files: [
        {
          path: 'file1.ts',
          content: '// Updated content for file1.ts',
          language: 'typescript',
          status: 'modified',
        },
      ],
      summary: 'Test',
      potentialIssues: 'None',
    };

    const mockModelConfig: ModelSpec = {
      contextWindow: 100000,
      maxOutput: 4096,
      modelName: 'Claude 3.5 Sonnet',
      pricing: { inputCost: 3, outputCost: 15 },
      modelFamily: 'claude',
      temperature: {
        planningTemperature: 0.5,
        codegenTemperature: 0.3,
      },
    };

    vi.mocked(getModelConfig).mockReturnValue(mockModelConfig);

    vi.mocked(parseAICodegenResponse).mockReturnValue(
      mockParsedResponse as unknown as AIParsedResponse,
    );

    await runAIAssistedTask(optionsWithTask);

    expect(getTaskDescription).not.toHaveBeenCalled();
    expect(getInstructions).not.toHaveBeenCalled();
  });

  it('should prompt for task description and instructions when not provided', async () => {
    const optionsWithoutTask = {
      ...mockOptions,
      task: '',
      description: '',
      instructions: '',
    };

    vi.mocked(selectFilesPrompt).mockResolvedValue(['file1.ts']);
    vi.mocked(processFiles).mockResolvedValue([
      {
        path: 'file1.ts',
        content: 'content1',
        language: 'typescript',
        size: 100,
        created: new Date(),
        modified: new Date(),
        extension: 'ts',
      },
    ]);
    vi.mocked(generateMarkdown).mockResolvedValue('Generated markdown');
    vi.mocked(generateAIResponse).mockResolvedValue('AI generated plan');
    vi.mocked(reviewPlan).mockResolvedValue('Reviewed plan');
    vi.mocked(generateAIResponse).mockResolvedValueOnce(
      'AI generated code modifications',
    );
    vi.mocked(ensureBranch).mockResolvedValue('feature/test-branch');

    const mockParsedResponse = {
      gitBranchName: 'feature/test-branch',
      gitCommitMessage: 'test',
      fileList: ['file1.ts'],
      files: [
        {
          path: 'file1.ts',
          content: '// Updated content for file1.ts',
          language: 'typescript',
          status: 'modified',
        },
      ],
      summary: 'test',
      potentialIssues: 'None',
    };

    vi.mocked(parseAICodegenResponse).mockReturnValue(
      mockParsedResponse as unknown as AIParsedResponse,
    );

    const mockModelConfig: ModelSpec = {
      contextWindow: 100000,
      maxOutput: 4096,
      modelName: 'Claude 3.5 Sonnet',
      pricing: { inputCost: 3, outputCost: 15 },
      modelFamily: 'claude',
      temperature: {
        planningTemperature: 0.5,
        codegenTemperature: 0.3,
      },
    };

    vi.mocked(getModelConfig).mockReturnValue(mockModelConfig);

    await runAIAssistedTask(optionsWithoutTask);

    expect(getTaskDescription).toHaveBeenCalled();
    expect(getInstructions).toHaveBeenCalled();
  });

  it('should execute the happy path successfully with TaskCache', async () => {
    const mockTaskDescription = 'Test task description';
    const mockInstructions = 'Test instructions';
    const mockSelectedFiles = ['file1.ts', 'file2.ts'];
    const mockGeneratedPlan = 'Generated plan';
    const mockReviewedPlan = 'Reviewed plan';

    const mockProcessedFiles = [
      {
        path: 'file1.ts',
        content: 'content1',
        language: 'typescript',
        size: 100,
        created: new Date(),
        modified: new Date(),
        extension: 'ts',
      },
      {
        path: 'file2.ts',
        content: 'content2',
        language: 'typescript',
        size: 200,
        created: new Date(),
        modified: new Date(),
        extension: 'ts',
      },
    ];

    const mockGeneratedCode = `
      <file_list>
      file1.ts
      file2.ts
      </file_list>
      <file>
      <file_path>file1.ts</file_path>
      <file_content language="typescript">
      // Updated content for file1.ts
      </file_content>
      <file_status>modified</file_status>
      </file>
      <file>
      <file_path>file2.ts</file_path>
      <file_content language="typescript">
      // Updated content for file2.ts
      </file_content>
      <file_status>modified</file_status>
      </file>
      <git_branch_name>feature/test-task</git_branch_name>
      <git_commit_message>Implement test task</git_commit_message>
      <summary>Updated both files</summary>
      <potential_issues>None</potential_issues>
    `;

    const mockParsedResponse = {
      gitBranchName: 'feature/test-task',
      gitCommitMessage: 'Implement test task',
      fileList: ['file1.ts', 'file2.ts'],
      files: [
        {
          path: 'file1.ts',
          content: '// Updated content for file1.ts',
          language: 'typescript',
          status: 'modified',
        },
        {
          path: 'file2.ts',
          content: '// Updated content for file2.ts',
          language: 'typescript',
          status: 'modified',
        },
      ],
      summary: 'Updated both files',
      potentialIssues: 'None',
    };

    vi.mocked(getTaskDescription).mockResolvedValue(mockTaskDescription);
    vi.mocked(getInstructions).mockResolvedValue(mockInstructions);
    vi.mocked(selectFilesPrompt).mockResolvedValue(mockSelectedFiles);
    vi.mocked(processFiles).mockResolvedValue(mockProcessedFiles);
    vi.mocked(generateMarkdown).mockResolvedValue('Generated markdown');
    vi.mocked(generateAIResponse).mockResolvedValueOnce(mockGeneratedPlan);
    vi.mocked(reviewPlan).mockResolvedValue(mockReviewedPlan);
    vi.mocked(generateAIResponse).mockResolvedValueOnce(mockGeneratedCode);
    vi.mocked(parseAICodegenResponse).mockReturnValue(
      mockParsedResponse as unknown as AIParsedResponse,
    );
    vi.mocked(ensureBranch).mockResolvedValue('feature/test-task');
    vi.mocked(applyChanges).mockResolvedValue();

    const mockTaskCache = {
      getLastTaskData: vi.fn().mockReturnValue(null),
      setTaskData: vi.fn(),
    };
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    vi.mocked(TaskCache).mockImplementation(() => mockTaskCache as any);

    vi.mocked(selectModelPrompt).mockResolvedValue(mockOptions.model);
    vi.mocked(getModelConfig).mockReturnValue({
      modelName: 'Claude 3.5 Sonnet',
      contextWindow: 100000,
      maxOutput: 4096,
      pricing: { inputCost: 3, outputCost: 15 },
      modelFamily: 'claude',
      temperature: {
        planningTemperature: 0.5,
        codegenTemperature: 0.3,
      },
    } as ModelSpec);

    // Test for plan workflow
    await runAIAssistedTask({ ...mockOptions, plan: true });

    expect(mockTaskCache.setTaskData).toHaveBeenCalledTimes(1);
    expect(mockTaskCache.setTaskData).toHaveBeenCalledWith(
      expect.stringMatching(/[\\\/]test[\\\/]path$/),
      expect.objectContaining({
        selectedFiles: mockSelectedFiles,
        generatedPlan: mockReviewedPlan,
        taskDescription: mockTaskDescription,
        instructions: mockInstructions,
        model: mockOptions.model,
      }),
    );

    // Reset mocks
    vi.clearAllMocks();

    // Reset mocks for no-plan workflow
    vi.mocked(getTaskDescription).mockResolvedValue(mockTaskDescription);
    vi.mocked(getInstructions).mockResolvedValue(mockInstructions);
    vi.mocked(selectFilesPrompt).mockResolvedValue(mockSelectedFiles);
    vi.mocked(processFiles).mockResolvedValue(mockProcessedFiles);
    vi.mocked(generateMarkdown).mockResolvedValue('Generated markdown');
    vi.mocked(generateAIResponse).mockResolvedValueOnce(mockGeneratedCode);
    vi.mocked(parseAICodegenResponse).mockReturnValue(
      mockParsedResponse as unknown as AIParsedResponse,
    );
    vi.mocked(ensureBranch).mockResolvedValue('feature/test-task');
    vi.mocked(applyChanges).mockResolvedValue();
    vi.mocked(selectModelPrompt).mockResolvedValue(mockOptions.model);

    // Test for no-plan workflow
    await runAIAssistedTask({ ...mockOptions, plan: false });

    expect(mockTaskCache.setTaskData).toHaveBeenCalledTimes(1);
    expect(mockTaskCache.setTaskData).toHaveBeenCalledWith(
      expect.stringMatching(/[\\\/]test[\\\/]path$/),
      expect.objectContaining({
        selectedFiles: mockSelectedFiles,
        generatedPlan: '',
        taskDescription: mockTaskDescription,
        instructions: mockInstructions,
        model: mockOptions.model,
      }),
    );
  });
});
