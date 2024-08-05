import path from 'node:path';
import { confirm } from '@inquirer/prompts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getModelConfig } from '../../src/ai/model-config';
import { redoLastTask } from '../../src/ai/redo-task';
import {
  handleNoPlanWorkflow,
  handlePlanWorkflow,
} from '../../src/ai/task-workflow';
import { processFiles } from '../../src/core/file-processor';
import { selectFilesPrompt } from '../../src/interactive/select-files-prompt';
import { selectModelPrompt } from '../../src/interactive/select-model-prompt';
import type { AiAssistedTaskOptions, FileInfo } from '../../src/types';
import { TaskCache } from '../../src/utils/task-cache';

vi.mock('@inquirer/prompts');
vi.mock('../../src/utils/task-cache');
vi.mock('../../src/interactive/select-model-prompt');
vi.mock('../../src/interactive/select-files-prompt');
vi.mock('../../src/ai/model-config');
vi.mock('../../src/ai/task-workflow');
vi.mock('../../src/core/file-processor');

describe('redoLastTask', () => {
  const mockOptions = {
    path: path.join('/', 'test', 'path'),
    model: 'test-model',
    plan: true,
  } as AiAssistedTaskOptions;

  const mockLastTaskData = {
    selectedFiles: ['file1.ts', 'file2.ts'],
    generatedPlan: 'Last generated plan',
    taskDescription: 'Last task description',
    instructions: 'Last instructions',
    model: 'last-model',
  };

  const mockProcessedFiles = [
    { path: 'test.js', content: 'console.log("test");' },
  ];

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

  it('should redo the last task with a plan', async () => {
    const mockLastTaskData = {
      selectedFiles: ['file1.js', 'file2.js'],
      generatedPlan: 'Last generated plan',
      taskDescription: 'Last task description',
      instructions: 'Last instructions',
      model: 'last-model',
    };

    const mockTaskCache = {
      getLastTaskData: vi.fn().mockReturnValue(mockLastTaskData),
      setTaskData: vi.fn(),
    };
    // biome-ignore lint/suspicious/noExplicitAny: explicit any is fine here
    vi.mocked(TaskCache).mockImplementation(() => mockTaskCache as any);
    vi.mocked(confirm).mockResolvedValue(false);
    vi.mocked(processFiles).mockResolvedValue(mockProcessedFiles as FileInfo[]);

    await redoLastTask(mockOptions);

    expect(handlePlanWorkflow).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'last-model' }),
      expect.stringMatching(/[\\\/]test[\\\/]path$/),
      expect.any(Object), // TaskCache
      expect.objectContaining(mockLastTaskData),
      mockProcessedFiles,
      'last-model',
    );
  });

  it('should redo the last task without a plan', async () => {
    const mockLastTaskDataNoPlan = {
      selectedFiles: ['file1.js', 'file2.js'],
      generatedPlan: '', // Empty string for no-plan workflow
      taskDescription: 'Last task description',
      instructions: 'Last instructions',
      model: 'last-model',
    };

    const mockTaskCache = {
      getLastTaskData: vi.fn().mockReturnValue(mockLastTaskDataNoPlan),
      setTaskData: vi.fn(),
    };
    // biome-ignore lint/suspicious/noExplicitAny: explicit any is fine here
    vi.mocked(TaskCache).mockImplementation(() => mockTaskCache as any);
    vi.mocked(confirm).mockResolvedValue(false);
    vi.mocked(processFiles).mockResolvedValue(mockProcessedFiles as FileInfo[]);

    await redoLastTask(mockOptions);

    expect(handleNoPlanWorkflow).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'last-model' }),
      expect.stringMatching(/[\\\/]test[\\\/]path$/),
      expect.any(Object), // TaskCache
      expect.objectContaining(mockLastTaskDataNoPlan),
      mockProcessedFiles,
      'last-model',
    );
  });

  it('should handle a completely new task', async () => {
    const mockNewTaskData = {
      selectedFiles: ['file1.js', 'file2.js'],
      generatedPlan: null, // null for a completely new task
      taskDescription: 'New task description',
      instructions: 'New instructions',
      model: 'new-model',
    };

    const mockTaskCache = {
      getLastTaskData: vi.fn().mockReturnValue(mockNewTaskData),
      setTaskData: vi.fn(),
    };
    // biome-ignore lint/suspicious/noExplicitAny: explicit any is fine here
    vi.mocked(TaskCache).mockImplementation(() => mockTaskCache as any);
    vi.mocked(confirm).mockResolvedValue(false);
    vi.mocked(processFiles).mockResolvedValue(mockProcessedFiles as FileInfo[]);

    await redoLastTask(mockOptions);

    expect(handleNoPlanWorkflow).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'new-model' }),
      expect.stringMatching(/[\\\/]test[\\\/]path$/),
      expect.any(Object), // TaskCache
      expect.objectContaining(mockNewTaskData),
      mockProcessedFiles,
      'new-model',
    );
  });

  it('should allow changing the model', async () => {
    const mockLastTaskData = {
      selectedFiles: ['file1.js', 'file2.js'],
      generatedPlan: 'Last generated plan',
      taskDescription: 'Last task description',
      instructions: 'Last instructions',
      model: 'last-model',
    };

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
    vi.mocked(processFiles).mockResolvedValue(mockProcessedFiles as FileInfo[]);

    await redoLastTask(mockOptions);

    expect(selectModelPrompt).toHaveBeenCalled();
    expect(handlePlanWorkflow).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'new-model' }),
      expect.stringMatching(/[\\\/]test[\\\/]path$/),
      expect.any(Object), // TaskCache
      expect.objectContaining({
        ...mockLastTaskData,
        model: 'new-model',
      }),
      mockProcessedFiles,
      'new-model',
    );

    // Check if the task cache was updated with the new model
    expect(mockTaskCache.setTaskData).toHaveBeenCalledWith(
      expect.stringMatching(/[\\\/]test[\\\/]path$/),
      expect.objectContaining({
        ...mockLastTaskData,
        model: 'new-model',
      }),
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
      expect.stringMatching(/[\\\/]test[\\\/]path$/),
      expect.objectContaining({
        selectedFiles: ['new-file1.ts', 'new-file2.ts'],
      }),
    );
  });
});
