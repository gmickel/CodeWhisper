import path from 'node:path';
import fs from 'fs-extra';
import Handlebars from 'handlebars';
import type { FileInfo } from './file-processor';

interface MarkdownOptions {
  template?: string;
  noCodeblock?: boolean;
}

export async function generateMarkdown(
  files: FileInfo[],
  options: MarkdownOptions = {},
): Promise<string> {
  const { template = 'default', noCodeblock = false } = options;

  const templatePath = path.join(
    __dirname,
    '..',
    'templates',
    `${template}.hbs`,
  );
  const templateContent = await fs.readFile(templatePath, 'utf-8');
  const compiledTemplate = Handlebars.compile(templateContent);

  Handlebars.registerHelper(
    'codeblock',
    (content: string, language: string) => {
      if (noCodeblock) {
        return content;
      }
      return `\`\`\`${language}\n${content}\n\`\`\``;
    },
  );

  return compiledTemplate({ files });
}
