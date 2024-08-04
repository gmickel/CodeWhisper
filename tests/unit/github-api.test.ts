import { Octokit } from '@octokit/rest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GitHubAPI } from '../../src/github/github-api';

vi.mock('@octokit/rest', () => {
  return {
    Octokit: vi.fn(() => ({
      issues: {
        listForRepo: vi.fn(),
        get: vi.fn(),
      },
    })),
  };
});

describe('GitHubAPI', () => {
  let githubAPI: GitHubAPI;
  // biome-ignore lint/suspicious/noExplicitAny: explicit any is fine here
  let mockOctokit: { issues: { listForRepo: any; get: any } };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GITHUB_TOKEN = 'test-token';
    githubAPI = new GitHubAPI();
    // biome-ignore lint/suspicious/noExplicitAny: explicit any is fine here
    mockOctokit = (Octokit as any).mock.results[0].value;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getRepositoryIssues', () => {
    it('should fetch repository issues successfully', async () => {
      const mockIssues = [
        { number: 1, title: 'Issue 1', body: 'Body 1', html_url: 'url1' },
        { number: 2, title: 'Issue 2', body: 'Body 2', html_url: 'url2' },
      ];
      mockOctokit.issues.listForRepo.mockResolvedValue({ data: mockIssues });

      const result = await githubAPI.getRepositoryIssues('owner', 'repo', '');
      expect(result).toEqual(mockIssues);
      expect(mockOctokit.issues.listForRepo).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        state: 'open',
        sort: 'updated',
        direction: 'desc',
      });
    });

    it('should handle rate limit errors', async () => {
      // biome-ignore lint/suspicious/noExplicitAny: explicit any is fine here
      const error: any = new Error('Rate limit exceeded');
      error.status = 403;
      error.headers = { 'x-ratelimit-remaining': '0' };
      mockOctokit.issues.listForRepo.mockRejectedValue(error);

      await expect(
        githubAPI.getRepositoryIssues('owner', 'repo', ''),
      ).rejects.toThrow(
        'GitHub API rate limit exceeded. Please try again later or use an API token.',
      );
    });

    it('should handle repository not found errors', async () => {
      // biome-ignore lint/suspicious/noExplicitAny: explicit any is fine here
      const error: any = new Error('Not Found');
      error.status = 404;
      mockOctokit.issues.listForRepo.mockRejectedValue(error);

      await expect(
        githubAPI.getRepositoryIssues('owner', 'repo', ''),
      ).rejects.toThrow('Repository not found: owner/repo');
    });

    it('should handle unknown errors', async () => {
      mockOctokit.issues.listForRepo.mockRejectedValue(
        new Error('Unknown error'),
      );

      await expect(
        githubAPI.getRepositoryIssues('owner', 'repo', ''),
      ).rejects.toThrow('Failed to fetch GitHub issues: Unknown error');
    });
  });

  describe('parseAndMergeFilters', () => {
    it('should parse and merge filters correctly', () => {
      const result = githubAPI.parseAndMergeFilters('labels:bug,assignee:user');
      expect(result).toEqual({
        state: 'open',
        sort: 'updated',
        direction: 'desc',
        labels: 'bug',
        assignee: 'user',
      });
    });

    it('should throw an error for invalid filter format', () => {
      expect(() => githubAPI.parseAndMergeFilters('invalid-filter')).toThrow(
        'Invalid filter format: invalid-filter. Expected format: key:value',
      );
    });
  });

  describe('getIssueDetails', () => {
    it('should fetch issue details successfully', async () => {
      const mockIssue = {
        number: 1,
        title: 'Issue 1',
        body: 'Body 1',
        html_url: 'url1',
      };
      mockOctokit.issues.get.mockResolvedValue({ data: mockIssue });

      const result = await githubAPI.getIssueDetails('owner', 'repo', 1);
      expect(result).toEqual(mockIssue);
      expect(mockOctokit.issues.get).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        issue_number: 1,
      });
    });

    it('should handle rate limit errors', async () => {
      // biome-ignore lint/suspicious/noExplicitAny: explicit any is fine here
      const error: any = new Error('Rate limit exceeded');
      error.status = 403;
      error.headers = { 'x-ratelimit-remaining': '0' };
      mockOctokit.issues.get.mockRejectedValue(error);

      await expect(
        githubAPI.getIssueDetails('owner', 'repo', 1),
      ).rejects.toThrow(
        'GitHub API rate limit exceeded. Please try again later or use an API token.',
      );
    });

    it('should handle issue not found errors', async () => {
      // biome-ignore lint/suspicious/noExplicitAny: explicit any is fine here
      const error: any = new Error('Not Found');
      error.status = 404;
      mockOctokit.issues.get.mockRejectedValue(error);

      await expect(
        githubAPI.getIssueDetails('owner', 'repo', 1),
      ).rejects.toThrow('Issue #1 not found in repository owner/repo');
    });

    it('should handle unknown errors', async () => {
      mockOctokit.issues.get.mockRejectedValue(new Error('Unknown error'));

      await expect(
        githubAPI.getIssueDetails('owner', 'repo', 1),
      ).rejects.toThrow('Failed to fetch GitHub issue details: Unknown error');
    });
  });
});
