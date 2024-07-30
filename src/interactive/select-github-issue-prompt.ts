import { select } from '@inquirer/prompts';
import { GitHubAPI, type GitHubIssue } from '../github/github-api';
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

    const selectedIssueNumber = await select({
      message: 'Select a GitHub issue:',
      choices: issues.map((issue) => ({
        name: `#${issue.number} - ${issue.title}`,
        value: issue.number,
      })),
    });

    return await githubAPI.getIssueDetails(owner, repo, selectedIssueNumber);
  } catch (error) {
    console.error('Error selecting GitHub issue:', error);
    return null;
  }
}
