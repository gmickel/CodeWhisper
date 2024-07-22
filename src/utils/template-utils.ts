import path from 'node:path';
import url from 'node:url';
import fs from 'fs-extra';

interface TemplateVariable {
  name: string;
  isMultiline: boolean;
}

export function extractTemplateVariables(
  templateContent: string,
): TemplateVariable[] {
  const variableRegex = /{{(var_|multiline_)(\w+)}}/g;
  const variables: TemplateVariable[] = [];
  let match: RegExpExecArray | null;

  while (true) {
    match = variableRegex.exec(templateContent);
    if (match === null) break;

    const prefix = match[1];
    const name = match[2];

    variables.push({
      name,
      isMultiline: prefix === 'multiline_',
    });
  }

  return [...new Set(variables.map((v) => JSON.stringify(v)))].map((v) =>
    JSON.parse(v),
  );
}

export function replaceTemplateVariables(
  templateContent: string,
  customData: Record<string, string>,
): string {
  return templateContent.replace(
    /{{(var_|multiline_)(\w+)}}/g,
    (match, prefix, name) => {
      return customData[name] || match;
    },
  );
}

export function getTemplatesDir() {
  const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
  const isCLI = process.env.CODEWHISPER_CLI === 'true';

  if (isCLI) {
    // We're running from CLI (global install or npx)
    return path.resolve(__dirname, '..');
  }

  if (__dirname.includes(`${path.sep}node_modules`)) {
    // We're running in production mode (e.g., programmatic usage of installed package)
    return path.resolve(__dirname, '..', 'dist');
  }

  if (__dirname.includes(`${path.sep}dist`)) {
    // We're running in production mode (e.g., local build)
    return path.resolve(__dirname, '..');
  }

  // We're running in development mode
  return path.resolve(__dirname, '..', '..', 'src', 'templates');
}

const templatesDir = getTemplatesDir();

export async function getAvailableTemplates() {
  const templateFiles = await fs.readdir(templatesDir);
  return templateFiles
    .filter((file) => file.endsWith('.hbs'))
    .map((file) => ({
      name: file.replace('.hbs', ''),
      path: path.join(templatesDir, file),
    }));
}

export function getTemplatePath(templateName: string): string {
  return path.join(templatesDir, `${templateName}.hbs`);
}
