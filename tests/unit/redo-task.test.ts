import { confirm } from '@inquirer/prompts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getModelConfig } from '../../src/ai/model-config';
import { redoLastTask } from '../../src/ai/redo-task';
import { continueTaskWorkflow } from '../../src/ai/task-workflow';
import { selectFilesPrompt } from '../../src/interactive/select-files-prompt';
import { selectModelPrompt } from '../../src/interactive/select-model-prompt';
import type { AiAssistedTaskOptions } from '../../src/types';
import { TaskCache } from '../../src/utils/task-cache';

vi.mock('@inquirer/prompts');
vi.mock('../../src/utils/task-cache');
vi.mock('../../src/interactive/select-model-prompt');
vi.mock('../../src/interactive/select-files-prompt');
vi.mock('../../src/ai/model-config');
vi.mock('../../src/ai/task-workflow');

describe('redoLastTask', () => {
  const mockOptions = {
    path: '/test/path',
    model: 'test-model',
  } as AiAssistedTaskOptions;

  const mockLastTaskData = {
    selectedFiles: ['file1.ts', 'file2.ts'],
    generatedPlan: 'Last generated plan',
    taskDescription: 'Last task description',
    instructions: 'Last instructions',
    model: 'last-model',
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should exit if no previous task is found', async () => {
    const mockTaskCache = {
      getLastTaskData: vi.fn().mockReturnValue(null),
      setTaskData: vi.fn(),
    };
    // biome-ignore lint/suspicious/noExplicitAny: explicit any is fine here
    vi.mocked(TaskCache).mockImplementation(() => mockTaskCache as any);

    const consoleSpy = vi.spyOn(console, 'log');
    const processExitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation(() => undefined as never);

    await redoLastTask(mockOptions);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('No previous task found'),
    );
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should redo the last task without changes', async () => {
    const mockTaskCache = {
      getLastTaskData: vi.fn().mockReturnValue(mockLastTaskData),
      setTaskData: vi.fn(),
    };
    // biome-ignore lint/suspicious/noExplicitAny: explicit any is fine here
    vi.mocked(TaskCache).mockImplementation(() => mockTaskCache as any);
    vi.mocked(confirm).mockResolvedValue(false);

    await redoLastTask(mockOptions);

    expect(continueTaskWorkflow).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'last-model' }),
      '/test/path',
      expect.any(Object),
      'Last generated plan',
      'last-model',
    );
  });

  it('should allow changing the model', async () => {
    const mockTaskCache = {
      getLastTaskData: vi.fn().mockReturnValue(mockLastTaskData),
      setTaskData: vi.fn(),
    };
    // biome-ignore lint/suspicious/noExplicitAny: explicit any is fine here
    vi.mocked(TaskCache).mockImplementation(() => mockTaskCache as any);
    vi.mocked(confirm).mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    vi.mocked(selectModelPrompt).mockResolvedValue('new-model');
    vi.mocked(getModelConfig).mockReturnValue({
      modelName: 'New Model',
      // biome-ignore lint/suspicious/noExplicitAny: explicit any is fine here
    } as any);

    await redoLastTask(mockOptions);

    expect(selectModelPrompt).toHaveBeenCalled();
    expect(continueTaskWorkflow).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'new-model' }),
      '/test/path',
      expect.any(Object),
      'Last generated plan',
      'new-model',
    );
  });

  it('should allow changing file selection', async () => {
    const mockTaskCache = {
      getLastTaskData: vi.fn().mockReturnValue(mockLastTaskData),
      setTaskData: vi.fn(),
    };
    // biome-ignore lint/suspicious/noExplicitAny: explicit any is fine here
    vi.mocked(TaskCache).mockImplementation(() => mockTaskCache as any);
    vi.mocked(confirm).mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    vi.mocked(selectFilesPrompt).mockResolvedValue([
      'new-file1.ts',
      'new-file2.ts',
    ]);

    await redoLastTask(mockOptions);

    expect(selectFilesPrompt).toHaveBeenCalled();
    expect(mockTaskCache.setTaskData).toHaveBeenCalledWith(
      '/test/path',
      expect.objectContaining({
        selectedFiles: ['new-file1.ts', 'new-file2.ts'],
      }),
    );
  });
});
