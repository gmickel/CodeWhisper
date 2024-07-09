import path from 'node:path';
import fs from 'fs-extra';

export async function setupTemporaryGitignore(
  fixturesPath: string,
  content: string,
): Promise<string> {
  const tempGitignorePath = path.join(fixturesPath, '.gitignore');
  await fs.writeFile(tempGitignorePath, content);
  return tempGitignorePath;
}

export async function removeTemporaryGitignore(
  gitignorePath: string,
): Promise<void> {
  await fs.remove(gitignorePath);
}
