import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

let cliPath;
if (__dirname.includes(`${path.sep}dist`)) {
  cliPath = path.resolve(__dirname, 'cli', 'index.js');
} else {
  cliPath = path.resolve(__dirname, 'src', 'cli', 'index.ts');
}

// Add this function to determine the templates directory
function getTemplatesDir() {
  const isProduction = __dirname.includes(`${path.sep}dist`);
  if (isProduction) {
    return path.resolve(__dirname, '..');
  }
  return path.resolve(__dirname, 'src', 'templates');
}

// Set the TEMPLATES_DIR environment variable
process.env.TEMPLATES_DIR = getTemplatesDir();

import(url.pathToFileURL(cliPath).href)
  .then((cliModule) => {
    if (cliModule.default) {
      cliModule.default(process.argv.slice(2));
    } else if (cliModule.cli) {
      cliModule.cli(process.argv.slice(2));
    } else {
      console.error('CLI function not found in module');
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
