import { Octokit } from '@octokit/rest';
import type { GitHubIssue } from '../types';

export class GitHubAPI {
  private octokit: Octokit;

  constructor() {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      console.warn(
        'GITHUB_TOKEN not set. GitHub API calls may be rate-limited.',
      );
    }
    this.octokit = new Octokit({ auth: token });
  }

  async getRepositoryIssues(
    owner: string,
    repo: string,
    filters: string,
  ): Promise<GitHubIssue[]> {
    try {
      const filterObj = this.parseAndMergeFilters(filters);
      const response = await this.octokit.issues.listForRepo({
        owner,
        repo,
        ...filterObj,
      });

      return response.data.map((issue) => ({
        number: issue.number,
        title: issue.title,
        body: issue.body || '',
        html_url: issue.html_url,
      }));
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        'status' in error &&
        'headers' in error &&
        typeof error.status === 'number' &&
        error.status === 403 &&
        typeof error.headers === 'object' &&
        error.headers !== null &&
        'x-ratelimit-remaining' in error.headers &&
        error.headers['x-ratelimit-remaining'] === '0'
      ) {
        throw new Error(
          'GitHub API rate limit exceeded. Please try again later or use an API token.',
        );
      }
      if (
        error instanceof Error &&
        'status' in error &&
        typeof error.status === 'number' &&
        error.status === 404
      ) {
        throw new Error(`Repository not found: ${owner}/${repo}`);
      }
      if (error instanceof Error) {
        console.error('Error fetching GitHub issues:', error);
        throw new Error(`Failed to fetch GitHub issues: ${error.message}`);
      }
      console.error('Unknown error fetching GitHub issues:', error);
      throw new Error('Failed to fetch GitHub issues: Unknown error');
    }
  }

  parseAndMergeFilters(filters: string): Record<string, string> {
    let filterObj = {
      state: 'open',
      sort: 'updated',
      direction: 'desc',
    };
    if (filters) {
      const parsedFilters: Record<string, string> = filters.split(',').reduce(
        (acc, filter) => {
          const [key, value] = filter.split(':');
          if (!key || !value) {
            throw new Error(
              `Invalid filter format: ${filter}. Expected format: key:value`,
            );
          }
          acc[key.trim()] = value.trim();
          return acc;
        },
        {} as Record<string, string>,
      );

      filterObj = {
        ...filterObj,
        ...parsedFilters,
      };
    }

    return filterObj;
  }

  async getIssueDetails(
    owner: string,
    repo: string,
    issueNumber: number,
  ): Promise<GitHubIssue> {
    try {
      const response = await this.octokit.issues.get({
        owner,
        repo,
        issue_number: issueNumber,
      });

      return {
        number: response.data.number,
        title: response.data.title,
        body: response.data.body || '',
        html_url: response.data.html_url,
      };
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        'status' in error &&
        'headers' in error &&
        typeof error.status === 'number' &&
        error.status === 403 &&
        typeof error.headers === 'object' &&
        error.headers !== null &&
        'x-ratelimit-remaining' in error.headers &&
        error.headers['x-ratelimit-remaining'] === '0'
      ) {
        throw new Error(
          'GitHub API rate limit exceeded. Please try again later or use an API token.',
        );
      }
      if (
        error instanceof Error &&
        'status' in error &&
        typeof error.status === 'number' &&
        error.status === 404
      ) {
        throw new Error(
          `Issue #${issueNumber} not found in repository ${owner}/${repo}`,
        );
      }
      if (error instanceof Error) {
        console.error('Error fetching GitHub issue details:', error);
        throw new Error(
          `Failed to fetch GitHub issue details: ${error.message}`,
        );
      }
      console.error('Unknown error fetching GitHub issue details:', error);
      throw new Error('Failed to fetch GitHub issue details: Unknown error');
    }
  }
}
