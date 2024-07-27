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

export async function ensureBranch(
  basePath: string,
  initialBranchName: string,
  options: { suffix?: string; maxAttempts?: number } = {},
): Promise<string> {
  const git: SimpleGit = simpleGit(basePath);
  const suffix = options.suffix || '-ai-';
  const maxAttempts = options.maxAttempts || 100;

  const branches = await git.branchLocal();
  let branchName = initialBranchName;
  let attempts = 0;

  while (attempts < maxAttempts) {
    if (!branches.all.includes(branchName)) {
      await git.checkoutLocalBranch(branchName);
      return branchName;
    }

    attempts++;
    branchName = `${initialBranchName}${suffix}${attempts}`;
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
