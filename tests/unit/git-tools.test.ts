import simpleGit from 'simple-git';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ensureBranch } from '../../src/utils/git-tools';

vi.mock('simple-git');

describe('ensureBranch', () => {
  const mockBasePath = '/mock/base/path';
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  let mockGit: any;

  beforeEach(() => {
    mockGit = {
      branchLocal: vi.fn(),
      checkoutLocalBranch: vi.fn(),
    };
    vi.mocked(simpleGit).mockReturnValue(mockGit);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

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

    const result = await ensureBranch(mockBasePath, 'feature/existing-branch');

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
    ).rejects.toThrow('Branch creation failed');
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
