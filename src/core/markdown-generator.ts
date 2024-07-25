import path from 'node:path';
import Handlebars from 'handlebars';
import type { FileInfo } from '../types';
import { replaceTemplateVariables } from '../utils/template-utils';

export interface MarkdownOptions {
  template?: string;
  noCodeblock?: boolean;
  customData?: Record<string, string>;
  basePath?: string;
  lineNumbers?: boolean;
}

function registerHandlebarsHelpers(
  noCodeblock: boolean,
  options: MarkdownOptions,
) {
  Handlebars.registerHelper(
    'codeblock',
    (content: string, language: string) => {
      let numberedContent = content;
      if (options.lineNumbers) {
        numberedContent = content
          .split('\n')
          .map((line, index) => `${index + 1} ${line}`)
          .join('\n');
      }
      if (options.noCodeblock) {
        return numberedContent;
      }
      return new Handlebars.SafeString(
        `\`\`\`${language}\n${numberedContent}\n\`\`\``,
      );
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

  registerHandlebarsHelpers(noCodeblock, options);

  // Preprocess the template content to replace our custom variables
  const preprocessedContent = replaceTemplateVariables(
    templateContent,
    customData,
  );

  const compiledTemplate = Handlebars.compile(preprocessedContent);

  const data = {
    files,
    base: basePath,
    ...customData,
  };

  const result = compiledTemplate(data);

  // Normalize line endings to LF
  return result.replace(/\r\n/g, '\n');
}
