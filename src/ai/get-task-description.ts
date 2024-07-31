import { editor } from '@inquirer/prompts';

export async function getTaskDescription(
  cachedValue?: string,
): Promise<string> {
  return editor({
    message: 'Describe your task:',
    default:
      cachedValue ||
      `# Title
Provide a title for your task here

## Description

Provide a detailed description of your task here.`,
    waitForUseInput: false,
  });
}
