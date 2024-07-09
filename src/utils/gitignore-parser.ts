import fs from 'fs-extra';
import ignore, { type Ignore } from 'ignore';

export async function parseGitignore(gitignorePath: string): Promise<Ignore> {
  const ig = ignore();

  try {
    const gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');
    ig.add(gitignoreContent);
  } catch (error) {
    console.warn(`Could not read .gitignore file: ${gitignorePath}`);
  }

  return ig;
}
