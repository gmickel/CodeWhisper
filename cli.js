#!/usr/bin/env node

import path from 'node:path';
import url from 'node:url';

// Determine the directory of the current file
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

// Determine the correct path to the built CLI entry point
let cliPath;
if (__dirname.includes('/dist')) {
  // In production, use the built ESM module
  cliPath = path.resolve(__dirname, 'cli/index.js');
} else {
  // In development, use the TypeScript source file
  cliPath = path.resolve(__dirname, 'src/cli/index.ts');
}

import(cliPath)
  .then((cliModule) => {
    // Check compatibly whether default or named export `cli`
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
