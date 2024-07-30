import path from 'node:path';
import simpleGit, { type SimpleGit } from 'simple-git';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { generateAIResponse } from '../../src/ai/generate-ai-response';
import { getInstructions } from '../../src/ai/get-instructions';
import { getTaskDescription } from '../../src/ai/get-task-description';
import { parseAICodegenResponse } from '../../src/ai/parse-ai-codegen-response';
import { reviewPlan } from '../../src/ai/plan-review';
import { runAIAssistedTask } from '../../src/ai/task-workflow';
import { processFiles } from '../../src/core/file-processor';
import { generateMarkdown } from '../../src/core/markdown-generator';
import { applyChanges } from '../../src/git/apply-changes';
import { selectFilesPrompt } from '../../src/interactive/select-files-prompt';
import type { AIParsedResponse, AiAssistedTaskOptions } from '../../src/types';
import { ensureBranch } from '../../src/utils/git-tools';

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
vi.mock('simple-git');

describe('runAIAssistedTask', () => {
  const mockOptions: AiAssistedTaskOptions = {
    path: path.join('/', 'test', 'path'),
    model: 'test-model',
    dryRun: false,
    noCodeblock: false,
    invert: false,
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
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
      <git_branch_name>feature/test-task</git_branch_name>
      <git_commit_message>Implement test task</git_commit_message>
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
    expect(parseAICodegenResponse).toHaveBeenCalledWith(mockGeneratedCode);

    expect(ensureBranch).toHaveBeenCalledWith(
      expect.stringMatching(/[\\\/]test[\\\/]path$/),
      'feature/test-task',
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

    await runAIAssistedTask(optionsWithoutTask);

    expect(getTaskDescription).toHaveBeenCalled();
    expect(getInstructions).toHaveBeenCalled();
  });
});
