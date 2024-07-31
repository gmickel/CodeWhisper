import { search } from '@inquirer/prompts';
import fs from 'fs-extra';
import { getAvailableTemplates } from '../utils/template-utils';

export async function selectTemplatePrompt(): Promise<string> {
  const templates = await getAvailableTemplates();

  const selected = await search({
    message: 'Select a template:',
    source: async (input, { signal }) => {
      if (signal.aborted) return [];

      const filteredTemplates = templates.filter((t) => {
        if (!input) return true;
        return t.name.toLowerCase().includes(input.toLowerCase());
      });

      return Promise.all(filteredTemplates.map(formatTemplateChoice));
    },
  });

  return selected;
}

async function formatTemplateChoice(template: {
  name: string;
  path: string;
}): Promise<{ name: string; value: string; description: string }> {
  const name = template.name;
  const value = template.path;
  const description = await getTemplatePreview(template.path);

  return {
    name,
    value,
    description,
  };
}

async function getTemplatePreview(
  templatePath: string,
  previewLength = 150,
): Promise<string> {
  try {
    const content = await fs.readFile(templatePath, 'utf-8');
    const lines = content.split('\n').slice(0, 5).join('\n'); // Get first 5 lines
    return lines.length > previewLength
      ? `${lines.substring(0, previewLength - 3)}...`
      : lines;
  } catch (error) {
    console.error(`Error reading template file: ${templatePath}`, error);
    return 'Unable to load template preview.';
  }
}
