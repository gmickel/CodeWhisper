import { select } from '@inquirer/prompts';
import { getAvailableTemplates } from '../utils/template-utils';

export async function selectTemplatePrompt(): Promise<string> {
  const templates = await getAvailableTemplates();
  const selected = await select({
    message: 'Select a template:',
    choices: templates.map((t) => ({
      value: t.path,
      name: t.name,
    })),
  });
  return selected;
}
