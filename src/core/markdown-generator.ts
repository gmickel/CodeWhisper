import path from 'node:path';
import Handlebars from 'handlebars';
import type { FileInfo } from './file-processor';

export interface MarkdownOptions {
  template?: string;
  noCodeblock?: boolean;
  customData?: Record<string, unknown>;
  basePath?: string;
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

  Handlebars.registerHelper('eq', (v1, v2) => v1 === v2);
  Handlebars.registerHelper('objectKeys', Object.keys);
  Handlebars.registerHelper('gt', (a, b) => a > b);

  Handlebars.registerHelper('hasCustomData', (context) =>
    Object.keys(context).some(
      (key) => key !== 'files' && key !== 'base' && Object.hasOwn(context, key),
    ),
  );

  Handlebars.registerHelper(
    'isCustomData',
    (key) => key !== 'files' && key !== 'base',
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

  // Adapt to handle missing helpers gracefully
  Handlebars.registerHelper('helperMissing', (...args) => {
    const options = args.pop();
    console.warn(`Missing helper: "${options.name}"`);
    return `Missing helper: "${options.name}"`;
  });
}

function relativePath(base: string, target: string): string {
  return path.relative(base, target).replace(/\\/g, '/');
}

export async function generateMarkdown(
  files: FileInfo[],
  templateContent: string,
  options: MarkdownOptions = {},
): Promise<string> {
  const {
    noCodeblock = false,
    customData = {},
    basePath = process.cwd(),
  } = options;

  registerHandlebarsHelpers(noCodeblock);

  const compiledTemplate = Handlebars.compile(templateContent);

  const data = {
    files,
    base: basePath,
    ...customData,
  };

  const result = compiledTemplate(data);

  // Normalize line endings to LF
  return result.replace(/\r\n/g, '\n');
}
