import path from 'node:path';
import fs from 'fs-extra';
import Handlebars from 'handlebars';
import { joinPath } from '../utils/path-utils';
import type { FileInfo } from './file-processor';

interface MarkdownOptions {
  template?: string;
  noCodeblock?: boolean;
  customData?: Record<string, unknown>;
}

export async function generateMarkdown(
  files: FileInfo[],
  options: MarkdownOptions = {},
): Promise<string> {
  const {
    template = 'generate-readme',
    noCodeblock = false,
    customData = {},
  } = options;

  let templatePath: string;
  if (
    path.isAbsolute(template) ||
    template.startsWith('./') ||
    template.startsWith('../')
  ) {
    templatePath = template;
  } else {
    templatePath = joinPath(
      import.meta.url,
      '..',
      'templates',
      `${template}.hbs`,
    );
  }

  const templateContent = await fs.readFile(templatePath, 'utf-8');
  const compiledTemplate = Handlebars.compile(templateContent);

  registerHandlebarsHelpers(noCodeblock);

  const data = {
    files,
    ...customData,
  };

  return compiledTemplate(data);
}

function registerHandlebarsHelpers(noCodeblock: boolean) {
  Handlebars.registerHelper(
    'codeblock',
    (content: string, language: string) => {
      if (noCodeblock) {
        return content;
      }
      return new Handlebars.SafeString(`\`\`\`${language}\n${content}\n\`\`\``);
    },
  );

  Handlebars.registerHelper('lineNumbers', (content: string) => {
    const lines = content.split('\n');
    const numberedLines = lines.map((line, index) => `${index + 1} | ${line}`);
    return new Handlebars.SafeString(numberedLines.join('\n'));
  });

  Handlebars.registerHelper('tableOfContents', (files: FileInfo[]) => {
    const toc = files.map((file) => `- ${file.path}`).join('\n');
    return new Handlebars.SafeString(toc);
  });

  Handlebars.registerHelper(
    'fileInfo',
    (file: FileInfo) =>
      new Handlebars.SafeString(`
- Language: ${file.language}
- Size: ${file.size} bytes
- Last modified: ${file.modified}
    `),
  );
}
