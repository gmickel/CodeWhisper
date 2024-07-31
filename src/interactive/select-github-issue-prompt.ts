import { search } from '@inquirer/prompts';
import { GitHubAPI } from '../github/github-api';
import type { GitHubIssue } from '../types';
import { getGitHubRepoInfo } from '../utils/git-tools';

export async function selectGitHubIssuePrompt(): Promise<GitHubIssue | null> {
  const repoInfo = await getGitHubRepoInfo();
  if (!repoInfo) {
    console.error('Unable to detect GitHub repository information.');
    return null;
  }

  const { owner, repo } = repoInfo;
  const githubAPI = new GitHubAPI();

  try {
    const issues = await githubAPI.getRepositoryIssues(owner, repo);

    if (issues.length === 0) {
      console.log('No open issues found in the repository.');
      return null;
    }

    const selectedIssueNumber = await search({
      message: 'Select a GitHub issue:',
      source: async (input, { signal }) => {
        if (signal.aborted) return [];

        const filteredIssues = issues.filter((issue) => {
          if (!input) return true;
          const lowerInput = input.toLowerCase();
          return (
            issue.title?.toLowerCase().includes(lowerInput) ||
            issue.number?.toString().includes(input)
          );
        });

        return filteredIssues.map(formatIssueChoice);
      },
    });

    return await githubAPI.getIssueDetails(owner, repo, selectedIssueNumber);
  } catch (error) {
    console.error('Error selecting GitHub issue:', error);
    return null;
  }
}

function formatIssueChoice(issue: GitHubIssue): {
  name: string;
  value: number;
  description: string;
} {
  const name = `#${issue.number} - ${issue.title || 'No title'}`;
  const description = truncateDescription(issue.body || '', 400);

  return {
    name,
    value: issue.number,
    description,
  };
}

function truncateDescription(description: string, maxLength: number): string {
  if (!description) return 'No description provided.';
  if (description.length <= maxLength) return description;
  return `${description.substring(0, maxLength - 3)}...`;
}
