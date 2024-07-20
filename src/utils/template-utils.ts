import path from 'node:path';
import url from 'node:url';
import fs from 'fs-extra';

export function getTemplatesDir(): string {
  // First, check if TEMPLATES_DIR is set by the CLI script
  if (process.env.TEMPLATES_DIR) {
    return process.env.TEMPLATES_DIR;
  }

  // If not set, determine it dynamically
  const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

  if (__dirname.includes('node_modules')) {
    // We're running from an installed package
    return path.resolve(__dirname, '..');
  }

  if (__dirname.includes(`${path.sep}dist`)) {
    // We're running in production mode
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
