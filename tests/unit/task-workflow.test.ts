import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { generateAIResponse } from '../../src/ai/generate-ai-response';
import { getInstructions } from '../../src/ai/get-instructions';
import { getTaskDescription } from '../../src/ai/get-task-description';
import { reviewPlan } from '../../src/ai/plan-review';
import { runAIAssistedTask } from '../../src/ai/task-workflow';
import { processFiles } from '../../src/core/file-processor';
import { generateMarkdown } from '../../src/core/markdown-generator';
import { selectFilesPrompt } from '../../src/interactive/select-files-prompt';
import type { AiAssistedTaskOptions } from '../../src/types';
import { ensureBranch } from '../../src/utils/git-tools';

vi.mock('../../src/ai/get-task-description');
vi.mock('../../src/ai/get-instructions');
vi.mock('../../src/interactive/select-files-prompt');
vi.mock('../../src/core/file-processor');
vi.mock('../../src/core/markdown-generator');
vi.mock('../../src/ai/generate-ai-response');
vi.mock('../../src/ai/plan-review');
vi.mock('../../src/git/apply-changes');
vi.mock('../../src/utils/git-tools');
vi.mock('simple-git');

describe('runAIAssistedTask', () => {
  const mockOptions: AiAssistedTaskOptions = {
    path: '/test/path',
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

    await runAIAssistedTask(optionsWithTask);

    expect(getTaskDescription).not.toHaveBeenCalled();
    expect(getInstructions).not.toHaveBeenCalled();
  });
});
