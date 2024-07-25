import path from 'node:path';
import { input } from '@inquirer/prompts';

export async function outputPathPrompt(basePath: string): Promise<string> {
  const defaultFileName = `${path.basename(basePath)}.md`;
  const defaultPath = path.join(basePath, defaultFileName);
  const outputPath = await input({
    message: 'Enter the output file path (or "" for console/stdout output):',
    default: defaultPath,
  });
  return outputPath.trim() === '' ? 'stdout' : outputPath;
}
