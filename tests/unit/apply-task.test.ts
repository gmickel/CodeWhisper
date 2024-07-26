import fs from 'fs-extra';
import simpleGit from 'simple-git';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyTask } from '../../src/ai/apply-task';
import * as applyChanges from '../../src/git/apply-changes';
import * as gitTools from '../../src/utils/git-tools';

vi.mock('../../src/utils/git-tools');
vi.mock('../../src/git/apply-changes');
vi.mock('fs-extra');
vi.mock('simple-git');

describe('applyTask', () => {
  const mockFilePath = '/mock/path/codewhisper-task-output.json';
  const mockTaskOutput = {
    taskDescription: 'Test task',
    parsedResponse: {
      fileList: ['file1.js', 'file2.js'],
      files: [
        {
          path: 'file1.js',
          content: 'console.log("file1");',
          status: 'modified',
        },
        { path: 'file2.js', content: 'console.log("file2");', status: 'new' },
      ],
      gitBranchName: 'feature/test-branch',
      gitCommitMessage: 'Test commit message',
      summary: 'Test summary',
      potentialIssues: 'No issues',
    },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(fs.readJSON).mockResolvedValue(mockTaskOutput);
    vi.mocked(applyChanges.applyChanges).mockResolvedValue();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should apply the task correctly', async () => {
    const mockGit = {
      add: vi.fn().mockResolvedValue(undefined),
      commit: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(simpleGit).mockReturnValue(
      mockGit as unknown as ReturnType<typeof simpleGit>,
    );

    await applyTask(mockFilePath);

    expect(fs.readJSON).toHaveBeenCalledWith(mockFilePath);
    expect(gitTools.ensureBranch).toHaveBeenCalledWith(
      expect.any(String),
      'feature/test-branch',
    );
    expect(applyChanges.applyChanges).toHaveBeenCalledWith({
      basePath: expect.any(String),
      parsedResponse: mockTaskOutput.parsedResponse,
      dryRun: false,
    });
    expect(mockGit.add).toHaveBeenCalledWith('.');
    expect(mockGit.commit).toHaveBeenCalledWith('Test commit message');
  });

  it('should handle file read errors', async () => {
    vi.mocked(fs.readJSON).mockRejectedValue(new Error('File read error'));

    await expect(applyTask(mockFilePath)).rejects.toThrow('File read error');
  });

  it('should handle git operation errors', async () => {
    vi.mocked(gitTools.ensureBranch).mockRejectedValue(new Error('Git error'));

    await expect(applyTask(mockFilePath)).rejects.toThrow('Git error');
  });
});
