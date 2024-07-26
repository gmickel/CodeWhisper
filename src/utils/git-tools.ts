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
  branchName: string,
): Promise<void> {
  const git: SimpleGit = simpleGit(basePath);

  // Check if the branch already exists
  const branches = await git.branchLocal();
  const branchExists = branches.all.includes(branchName);

  if (!branchExists) {
    // Create the branch if it doesn't exist
    await git.checkoutLocalBranch(branchName);
  } else {
    // If the branch exists, switch to it
    await git.checkout(branchName);
  }
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
