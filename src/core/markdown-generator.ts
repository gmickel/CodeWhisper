import path from 'node:path';
import fs from 'fs-extra';
import Handlebars from 'handlebars';
import type { FileInfo } from './file-processor';

interface MarkdownOptions {
  template?: string;
  noCodeblock?: boolean;
  customData?: Record<string, unknown>;
  basePath?: string; // Add this property
}

// Helper function to convert absolute path to relative path
function relativePath(base: string, target: string): string {
  return path.relative(base, target);
}

export async function generateMarkdown(
  files: FileInfo[],
  options: MarkdownOptions = {},
): Promise<string> {
  const {
    template = 'generate-readme',
    noCodeblock = false,
    customData = {},
    basePath = process.cwd(), // Default to current working directory if not provided
  } = options;

  const isDist = path
    .dirname(new URL(import.meta.url).pathname)
    .includes('/dist/');
  const templatesDir = isDist
    ? path.resolve(path.dirname(new URL(import.meta.url).pathname), '../')
    : path.resolve(
        path.dirname(new URL(import.meta.url).pathname),
        '../templates',
      );
  const templatePath = options.template
    ? options.template
    : path.resolve(templatesDir, `${template}.hbs`);

  const templateContent = await fs.readFile(templatePath, 'utf-8');
  const compiledTemplate = Handlebars.compile(templateContent);

  registerHandlebarsHelpers(noCodeblock);

  const data = {
    files,
    base: basePath,
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

  Handlebars.registerHelper('tableOfContents', (files: FileInfo[], options) => {
    const basePath = options.data.root.base;
    const toc = files
      .map((file) => `- ${relativePath(basePath, file.path)}`)
      .join('\n');
    return new Handlebars.SafeString(toc);
  });

  Handlebars.registerHelper('fileInfo', (file: FileInfo, options) => {
    const basePath = options.data.root.base;
    return new Handlebars.SafeString(`
- Path: ${relativePath(basePath, file.path)}
- Language: ${file.language}
- Size: ${file.size} bytes
- Last modified: ${file.modified}
    `);
  });

  Handlebars.registerHelper('relativePath', (filePath: string, options) => {
    const basePath = options.data.root.base;
    return relativePath(basePath, filePath);
  });
}
