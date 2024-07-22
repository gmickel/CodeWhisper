#!/usr/bin/env node

import path from 'node:path';
import url from 'node:url';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Remove this line as we no longer need it
// process.env.CODEWHISPER_EXEC_PATH = process.argv[1];

function getExecutionContext() {
  if (__dirname.includes('node_modules')) {
    if (
      __dirname.includes('.npm/_npx') || // npx
      __dirname.includes('.pnpm') || // pnpx
      __dirname.includes('.bun') || // bunx
      process.execPath.includes('npx') || // fallback for npx
      process.execPath.includes('.pnpm') || // fallback for pnpx
      process.execPath.includes('.bun')
    ) {
      // fallback for bunx
      return 'package-runner';
    }
    return 'installed-package';
  }
  if (__dirname.includes(`${path.sep}dist`)) {
    return 'production';
  }
  return 'development';
}

const executionContext = getExecutionContext();

let cliPath;
if (executionContext === 'development') {
  cliPath = path.resolve(__dirname, 'src', 'cli', 'index.ts');
} else {
  cliPath = path.resolve(__dirname, 'cli', 'index.js');
}

function getTemplatesDir() {
  switch (executionContext) {
    case 'package-runner':
    case 'installed-package':
      return path.resolve(__dirname, 'templates');
    case 'production':
      return __dirname;
    case 'development':
      return path.resolve(__dirname, 'src', 'templates');
  }
}

// Set the TEMPLATES_DIR environment variable
process.env.TEMPLATES_DIR = getTemplatesDir();

// Set an environment variable for the execution context
process.env.CODEWHISPER_EXECUTION_CONTEXT = executionContext;

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
