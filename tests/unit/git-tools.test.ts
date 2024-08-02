import { confirm } from '@inquirer/prompts';
import simpleGit from 'simple-git';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { undoTaskChanges } from '../../src/git/undo-task-changes';
import { ensureBranch } from '../../src/utils/git-tools';
import { findDefaultBranch } from '../../src/utils/git-tools';

vi.mock('simple-git');
vi.mock('@inquirer/prompts', () => ({
  confirm: vi.fn(),
}));

describe('Git utility functions', () => {
  const mockBasePath = '/mock/base/path';
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  let mockGit: any;

  beforeEach(() => {
    mockGit = {
      branchLocal: vi.fn(),
      checkoutLocalBranch: vi.fn(),
      raw: vi.fn(),
      revparse: vi.fn(),
      status: vi.fn(),
      reset: vi.fn(),
      clean: vi.fn(),
      checkout: vi.fn(),
      deleteLocalBranch: vi.fn(),
    };
    vi.mocked(simpleGit).mockReturnValue(mockGit);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('ensureBranch', () => {
    it('should create a new branch when it does not exist', async () => {
      mockGit.branchLocal.mockResolvedValue({ all: ['main', 'develop'] });
      mockGit.checkoutLocalBranch.mockResolvedValue(undefined);

      const result = await ensureBranch(mockBasePath, 'feature/new-branch');

      expect(result).toBe('feature/new-branch');
      expect(mockGit.branchLocal).toHaveBeenCalledTimes(1);
      expect(mockGit.checkoutLocalBranch).toHaveBeenCalledWith(
        'feature/new-branch',
      );
    });

    it('should create a branch with suffix when original name exists', async () => {
      mockGit.branchLocal.mockResolvedValue({
        all: ['main', 'develop', 'feature/existing-branch'],
      });
      mockGit.checkoutLocalBranch.mockResolvedValue(undefined);

      const result = await ensureBranch(
        mockBasePath,
        'feature/existing-branch',
      );

      expect(result).toBe('feature/existing-branch-ai-1');
      expect(mockGit.branchLocal).toHaveBeenCalledTimes(1);
      expect(mockGit.checkoutLocalBranch).toHaveBeenCalledWith(
        'feature/existing-branch-ai-1',
      );
    });

    it('should increment suffix until a unique branch name is found', async () => {
      mockGit.branchLocal.mockResolvedValue({
        all: ['main', 'feature/branch', 'feature/branch-ai-1'],
      });
      mockGit.checkoutLocalBranch.mockResolvedValue(undefined);

      const result = await ensureBranch(mockBasePath, 'feature/branch');

      expect(result).toBe('feature/branch-ai-2');
      expect(mockGit.branchLocal).toHaveBeenCalledTimes(1);
      expect(mockGit.checkoutLocalBranch).toHaveBeenCalledWith(
        'feature/branch-ai-2',
      );
    });

    it('should handle empty branch list', async () => {
      mockGit.branchLocal.mockResolvedValue({ all: [] });
      mockGit.checkoutLocalBranch.mockResolvedValue(undefined);

      const result = await ensureBranch(mockBasePath, 'feature/new-branch');

      expect(result).toBe('feature/new-branch');
      expect(mockGit.branchLocal).toHaveBeenCalledTimes(1);
      expect(mockGit.checkoutLocalBranch).toHaveBeenCalledWith(
        'feature/new-branch',
      );
    });

    it('should throw an error if branch creation fails', async () => {
      mockGit.branchLocal.mockResolvedValue({ all: ['main'] });
      mockGit.checkoutLocalBranch.mockRejectedValue(
        new Error('Branch creation failed'),
      );

      await expect(
        ensureBranch(mockBasePath, 'feature/new-branch'),
      ).rejects.toThrow('Failed to create branch feature/new-branch');
      expect(mockGit.branchLocal).toHaveBeenCalledTimes(1);
      expect(mockGit.checkoutLocalBranch).toHaveBeenCalledWith(
        'feature/new-branch',
      );
    });

    it('should use custom suffix when provided', async () => {
      mockGit.branchLocal.mockResolvedValue({
        all: ['main', 'feature/custom-branch'],
      });
      mockGit.checkoutLocalBranch.mockResolvedValue(undefined);

      const result = await ensureBranch(mockBasePath, 'feature/custom-branch', {
        suffix: '-custom-',
      });

      expect(result).toBe('feature/custom-branch-custom-1');
      expect(mockGit.branchLocal).toHaveBeenCalledTimes(1);
      expect(mockGit.checkoutLocalBranch).toHaveBeenCalledWith(
        'feature/custom-branch-custom-1',
      );
    });

    it('should throw an error after maximum attempts', async () => {
      const maxAttempts = 5;
      mockGit.branchLocal.mockResolvedValue({
        all: [
          'main',
          'feature/max',
          'feature/max-ai-1',
          'feature/max-ai-2',
          'feature/max-ai-3',
          'feature/max-ai-4',
          'feature/max-ai-5',
        ],
      });

      await expect(
        ensureBranch(mockBasePath, 'feature/max', { maxAttempts }),
      ).rejects.toThrow(
        `Failed to create a unique branch name after ${maxAttempts} attempts`,
      );

      expect(mockGit.branchLocal).toHaveBeenCalledTimes(1);
      expect(mockGit.checkoutLocalBranch).not.toHaveBeenCalled();
    });
  });

  describe('findDefaultBranch', () => {
    it('should return "main" if it exists', async () => {
      mockGit.branchLocal.mockResolvedValue({
        all: ['main', 'develop', 'feature'],
      });

      const result = await findDefaultBranch(mockGit);

      expect(result).toBe('main');
    });

    it('should return "master" if it exists and "main" does not', async () => {
      mockGit.branchLocal.mockResolvedValue({
        all: ['master', 'develop', 'feature'],
      });

      const result = await findDefaultBranch(mockGit);

      expect(result).toBe('master');
    });

    it('should return the first branch if neither "main" nor "master" exist', async () => {
      mockGit.branchLocal.mockResolvedValue({ all: ['develop', 'feature'] });

      const result = await findDefaultBranch(mockGit);

      expect(result).toBe('develop');
    });

    it('should handle empty branch list', async () => {
      mockGit.branchLocal.mockResolvedValue({ all: [] });

      const result = await findDefaultBranch(mockGit);

      expect(result).toBeUndefined();
    });
  });

  describe('undoTaskChanges', () => {
    beforeEach(() => {
      vi.mocked(confirm).mockReset();
    });

    it('should discard changes and switch to original branch', async () => {
      mockGit.revparse.mockResolvedValue('feature-branch');
      mockGit.raw.mockResolvedValue(
        'HEAD@{1}: checkout: moving from main to feature-branch',
      );
      mockGit.status.mockResolvedValue({ isClean: () => false });
      vi.mocked(confirm)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true);

      await undoTaskChanges({ path: mockBasePath });

      expect(mockGit.reset).toHaveBeenCalledWith(['--hard']);
      expect(mockGit.clean).toHaveBeenCalledWith('f', ['-d']);
      expect(mockGit.checkout).toHaveBeenCalledWith('main');
      expect(mockGit.deleteLocalBranch).toHaveBeenCalledWith(
        'feature-branch',
        true,
      );
    });

    it('should handle detached HEAD state', async () => {
      mockGit.revparse.mockResolvedValue('HEAD');
      mockGit.raw.mockResolvedValue(
        'HEAD@{1}: checkout: moving from main to 1234abc',
      );
      mockGit.status.mockResolvedValue({ isClean: () => true });
      vi.mocked(confirm).mockResolvedValueOnce(true);

      await undoTaskChanges({ path: mockBasePath });

      expect(mockGit.checkout).toHaveBeenCalledWith('main');
    });

    it('should do nothing if already on original branch and working directory is clean', async () => {
      mockGit.revparse.mockResolvedValue('main');
      mockGit.raw.mockResolvedValue(
        'HEAD@{1}: checkout: moving from feature-branch to main',
      );
      mockGit.status.mockResolvedValue({ isClean: () => true });

      await undoTaskChanges({ path: mockBasePath });

      expect(mockGit.checkout).not.toHaveBeenCalled();
      expect(mockGit.deleteLocalBranch).not.toHaveBeenCalled();
    });

    it('should fallback to findDefaultBranch if reflog is empty', async () => {
      mockGit.revparse.mockResolvedValue('feature-branch');
      mockGit.raw.mockResolvedValue('');
      mockGit.status.mockResolvedValue({ isClean: () => true });
      mockGit.branchLocal.mockResolvedValue({
        all: ['main', 'feature-branch'],
      });
      vi.mocked(confirm).mockResolvedValueOnce(true);

      await undoTaskChanges({ path: mockBasePath });

      expect(mockGit.checkout).toHaveBeenCalledWith('main');
      expect(mockGit.deleteLocalBranch).toHaveBeenCalledWith(
        'feature-branch',
        true,
      );
    });
  });
});
