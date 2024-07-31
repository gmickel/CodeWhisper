import { editor } from '@inquirer/prompts';

export async function getInstructions(cachedValue?: string): Promise<string> {
  return editor({
    message: 'Provide further instructions for completing the task:',
    default:
      cachedValue ||
      'Provide your instructions for completing the task here. Be specific and detailed.\n\nNote: this is optional, save this as an empty file/string if you do not have any instructions.',
    waitForUseInput: false,
  });
}
