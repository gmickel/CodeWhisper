import path from 'node:path';
import url from 'node:url';
import { editor } from '@inquirer/prompts';
import chalk from 'chalk';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import { getCachedValue, setCachedValue } from './cache-utils';

interface TemplateVariable {
  name: string;
  isMultiline: boolean;
}

function escapeLineBreaks(str: string): string {
  return str ? str.replace(/\r?\n/g, '\\n') : str;
}

export async function collectVariables(
  data: string,
  cachePath: string,
  variables: TemplateVariable[],
  templatePath: string,
): Promise<Record<string, string>> {
  let customData: Record<string, string> = {};

  const escapedData = escapeLineBreaks(data);

  if (escapedData) {
    try {
      customData = JSON.parse(escapedData);
    } catch (error) {
      console.error(chalk.red('Error parsing custom data JSON:'), error);
      process.exit(1);
    }
  } else if (variables.length > 0) {
    for (const variable of variables) {
      const cacheKey = `${path.basename(templatePath, '.hbs')}_${variable.name}`;
      const cachedValue = await getCachedValue(cacheKey, cachePath);

      if (variable.isMultiline) {
        const answer = await editor({
          message: `Enter value for ${variable.name} (multiline):`,
          default: cachedValue ?? undefined,
        });
        customData[variable.name] = answer;
      } else {
        const answer = await inquirer.prompt([
          {
            type: 'input',
            name: variable.name,
            message: `Enter value for ${variable.name}:`,
            default: cachedValue ?? undefined,
          },
        ]);
        customData[variable.name] = answer[variable.name];
      }

      await setCachedValue(cacheKey, customData[variable.name], cachePath);
    }
  }
  return customData;
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
    (match, _prefix, name) => {
      return customData[name] || match;
    },
  );
}

export function getTemplatesDir(): string {
  const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
  const isCLI = process.env.CODEWHISPER_CLI === 'true';

  if (isCLI) {
    return path.resolve(__dirname, '..');
  }

  if (__dirname.includes(`${path.sep}node_modules`)) {
    return path.resolve(__dirname, '..', 'dist');
  }

  if (__dirname.includes(`${path.sep}dist`)) {
    return path.resolve(__dirname, '..');
  }

  return path.resolve(__dirname, '..', '..', 'src', 'templates');
}

const templatesDir = getTemplatesDir();

export async function getAvailableTemplates(): Promise<
  Array<{ name: string; path: string }>
> {
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
