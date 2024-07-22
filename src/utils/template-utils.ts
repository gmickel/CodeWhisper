import path from 'node:path';
import url from 'node:url';
import fs from 'fs-extra';

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
