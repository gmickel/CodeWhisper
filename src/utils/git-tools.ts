import chalk from 'chalk';
import simpleGit, { type SimpleGit } from 'simple-git';
import { detectLanguage } from '../core/file-worker';
import type { FileInfo } from '../types';

const git: SimpleGit = simpleGit();

export async function gitDiff(branch?: string): Promise<FileInfo[]> {
  const diffSummary = await git.diffSummary([branch ?? 'HEAD^']);

  const fileInfos: FileInfo[] = await Promise.all(
    diffSummary.files.map(async (file) => {
      const content = await git.show([`${branch ?? 'HEAD'}:${file.file}`]);
      return {
        path: file.file,
        extension: file.file.split('.').pop() ?? '',
        language: detectLanguage(file.file),
        size: content.length,
        created: new Date(),
        modified: new Date(),
        content,
      };
    }),
  );

  return fileInfos;
}

export async function prReview(prNumber: string): Promise<FileInfo[]> {
  // This is a placeholder. In a real implementation, you'd use the GitHub API
  // to fetch the PR diff and convert it to FileInfo objects.
  console.log(`Reviewing PR #${prNumber}`);
  return [];
}

export function ensureValidBranchName(branchName: string): string {
  // Remove any characters that are not allowed in Git branch names
  let sanitizedName = branchName.replace(/[^a-zA-Z0-9-_./]/g, '-');

  // Ensure the branch name doesn't start or end with a slash
  sanitizedName = sanitizedName.replace(/^\/+|\/+$/g, '');

  // If the branch name is empty or consists only of dashes after sanitization, provide a default
  if (!sanitizedName || /^-+$/.test(sanitizedName)) {
    sanitizedName = `feature/ai-task-${Date.now()}`;
  }

  return sanitizedName;
}

export async function ensureBranch(
  basePath: string,
  initialBranchName: string,
  options: { suffix?: string; maxAttempts?: number; issueNumber?: number } = {},
): Promise<string> {
  const git: SimpleGit = simpleGit(basePath);
  const suffix = options.suffix || '-ai-';
  const maxAttempts = options.maxAttempts || 100;

  // Remove leading slash if present
  let branchName = initialBranchName.replace(/^\//, '');

  if (options.issueNumber) {
    // Construct branch name without leading slash
    branchName = `${branchName}-issue-${options.issueNumber}`;
  }

  // Ensure the branch name is valid
  branchName = ensureValidBranchName(branchName);

  const branches = await git.branchLocal();
  let attempts = 0;

  while (attempts < maxAttempts) {
    if (!branches.all.includes(branchName)) {
      try {
        await git.checkoutLocalBranch(branchName);
        return branchName;
      } catch (error) {
        console.error(`Failed to create branch ${branchName}:`, error);
        throw new Error(`Failed to create branch ${branchName}`);
      }
    }

    attempts++;
    branchName = `${initialBranchName}${suffix}${attempts}`;
    branchName = ensureValidBranchName(branchName);
  }

  throw new Error(
    `Failed to create a unique branch name after ${maxAttempts} attempts`,
  );
}

export async function createBranchAndCommit(
  basePath: string,
  branchName: string,
  commitMessage: string,
): Promise<void> {
  const git = simpleGit(basePath);

  await ensureBranch(basePath, branchName);

  await git.add('.');
  await git.commit(commitMessage);
}

export async function getGitHubRepoInfo(): Promise<{
  owner: string;
  repo: string;
} | null> {
  try {
    const git: SimpleGit = simpleGit();
    const remotes = await git.getRemotes(true);
    const originRemote = remotes.find((remote) => remote.name === 'origin');

    if (!originRemote) {
      console.warn(
        chalk.yellow(
          'No GitHub remote found. Ensure your repository has a GitHub remote named "origin".',
        ),
      );
      return null;
    }
    const match = originRemote.refs.fetch.match(
      /github\.com[:/]([^/]+)\/([^.]+)\.git/,
    );
    if (!match) {
      return null;
    }

    return {
      owner: match[1],
      repo: match[2],
    };
  } catch (error) {
    console.error('Error getting GitHub repository information:', error);
    return null;
  }
}
