# Code Summary

- .npmrc
- biome.json
- cli.js
- CONTRIBUTING.md
- lefthook.yml
- LICENSE
- package.json
- pnpm-workspace.yaml
- README.md
- src/cli/git-tools.ts
- src/cli/index.ts
- src/cli/interactive-filtering.ts
- src/core/file-processor.ts
- src/core/file-worker.d.ts
- src/core/file-worker.js
- src/core/markdown-generator.ts
- src/templates/codebase-summary.hbs
- src/templates/deep-code-review.hbs
- src/templates/default.hbs
- src/templates/generate-project-documentation.hbs
- src/templates/generate-readme.hbs
- src/templates/minimal.hbs
- src/templates/optimize-llm-prompt.hbs
- src/templates/security-focused-review.hbs
- src/utils/comment-stripper.ts
- src/utils/file-cache.ts
- src/utils/gitignore-parser.ts
- src/utils/language-detector.ts
- tests/e2e/cli-commands.test.ts
- tests/fixtures/custom-template.hbs
- tests/fixtures/default.hbs
- tests/fixtures/test-project/package.json
- tests/fixtures/test-project/src/main.js
- tests/fixtures/test-project/src/utils.ts
- tests/helpers/gitignore-helper.ts
- tests/integration/markdown-generation.test.ts
- tests/performance/file-processor.perf.test.ts
- tests/unit/file-processor.test.ts
- tests/unit/markdown-generator.test.ts
- tests/utils/language-detector.test.ts
- tests/vitest.setup.ts
- tsconfig.build.json
- tsconfig.json
- tsup.config.ts
- vitest.config.ts

## Files

## .npmrc

- Language: plaintext
- Size: 53 bytes
- Last modified: Mon Jul 08 2024 18:42:50 GMT+0200 (Central European Summer Time)

```plaintext
ignore-workspace-root-check=true
shell-emulator=true

```

## biome.json

- Language: json
- Size: 538 bytes
- Last modified: Mon Jul 08 2024 18:45:43 GMT+0200 (Central European Summer Time)

```json
{
  "$schema": "https://biomejs.dev/schemas/1.6.4/schema.json",
  "formatter": {
    "indentStyle": "space",
    "indentWidth": 2,
    "formatWithErrors": true
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single"
    }
  },
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "noUndeclaredVariables": "warn"
      }
    }
  },
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  }
}

```

## cli.js

- Language: javascript
- Size: 953 bytes
- Last modified: Wed Jul 10 2024 10:42:23 GMT+0200 (Central European Summer Time)

```javascript
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

```

## CONTRIBUTING.md

- Language: markdown
- Size: 54 bytes
- Last modified: Tue Jul 09 2024 21:54:14 GMT+0200 (Central European Summer Time)

```markdown
Please refer to https://github.com/gmickel/contribute

```

## lefthook.yml

- Language: yaml
- Size: 256 bytes
- Last modified: Tue Jul 09 2024 21:12:51 GMT+0200 (Central European Summer Time)

```yaml
pre-push:
  parallel: true
pre-commit:
  commands:
    check:
      glob: "*.{js,ts,cjs,mjs,d.cts,d.mts,jsx,tsx,json,jsonc}"
      run: npx biome check --write --no-errors-on-unmatched --files-ignore-unknown=true {staged_files} && git update-index --again

```

## LICENSE

- Language: plaintext
- Size: 1088 bytes
- Last modified: Mon Jul 08 2024 18:45:28 GMT+0200 (Central European Summer Time)

```plaintext
MIT License

Copyright (c) 2024 Gordon Mickel (git@mickel.tech)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

```

## package.json

- Language: json
- Size: 2492 bytes
- Last modified: Fri Jul 19 2024 01:48:53 GMT+0200 (Central European Summer Time)

```json
{
  "name": "codewhisper",
  "type": "module",
  "version": "1.0.0",
  "description": "A powerful tool for converting repository code to AI-friendly prompts",
  "author": "Gordon Mickel <gordon@mickel.tech>",
  "license": "MIT",
  "funding": "https://github.com/sponsors/gmickel",
  "homepage": "https://github.com/gmickel/code-whisper#readme",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/gmickel/code-whisper.git"
  },
  "bugs": "https://github.com/gmickel/code-whisper/issues",
  "keywords": ["code", "ai", "prompt", "git"],
  "sideEffects": false,
  "exports": {
    "./cli": {
      "types": "./dist/cli/index.d.ts",
      "import": "./dist/cli/index.js"
    },
    "./core": {
      "types": "./dist/core/file-worker.d.ts",
      "import": "./dist/core/file-worker.js"
    }
  },
  "main": "./dist/cli/index.js",
  "module": "./dist/cli/index.js",
  "types": "./dist/cli/index.d.ts",
  "typesVersions": {
    "*": {
      "*": ["./dist/*", "./dist/cli/index.d.ts"]
    }
  },
  "bin": {
    "codewhisper": "./dist/cli.js"
  },
  "files": ["dist", "README.md", "LICENSE"],
  "scripts": {
    "prebuild": "pnpm run typecheck",
    "build": "tsup",
    "lint": "biome check .",
    "lint:fix": "biome check . --write",
    "prepublishOnly": "nr build",
    "release": "bumpp && npm publish",
    "dev": "esno src/cli/index.ts",
    "start": "node dist/cli/index.js",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "typecheck": "tsc --noEmit",
    "prepare": "lefthook install"
  },
  "dependencies": {
    "@inquirer/prompts": "^5.1.2",
    "chalk": "5.3.0",
    "commander": "12.1.0",
    "fast-glob": "3.3.2",
    "fs-extra": "11.2.0",
    "handlebars": "4.7.8",
    "ignore": "5.3.1",
    "inquirer": "9.2.10",
    "inquirer-file-tree-selection-prompt": "^2.0.5",
    "isbinaryfile": "5.0.2",
    "ora": "8.0.1",
    "piscina": "4.6.1",
    "simple-git": "3.25.0",
    "strip-comments": "2.0.1"
  },
  "devDependencies": {
    "@biomejs/biome": "1.8.3",
    "@types/fs-extra": "11.0.4",
    "@types/inquirer": "^9.0.7",
    "@types/node": "20.14.10",
    "@types/strip-comments": "2.0.4",
    "@vitest/coverage-v8": "2.0.2",
    "@vitest/ui": "2.0.2",
    "bumpp": "9.4.1",
    "esno": "4.7.0",
    "lefthook": "1.7.2",
    "tsup": "8.1.0",
    "typescript": "5.5.3",
    "vite": "5.3.3",
    "vitest": "2.0.2"
  },
  "packageManager": "pnpm@9.5.0",
  "workspaces": ["apps/*", "packages/*"],
  "trustedDependencies": ["@biomejs/biome", "lefthook"]
}

```

## pnpm-workspace.yaml

- Language: yaml
- Size: 64 bytes
- Last modified: Tue Jul 09 2024 23:45:21 GMT+0200 (Central European Summer Time)

```yaml
packages:
  - playground
  - docs
  - packages/*
  - examples/*

```

## README.md

- Language: markdown
- Size: 1147 bytes
- Last modified: Sat Jul 20 2024 09:54:59 GMT+0200 (Central European Summer Time)

```markdown
# code-whisper

add blazing fast AI-friendly prompts to your codebase

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![JSDocs][jsdocs-src]][jsdocs-href]
[![License][license-src]][license-href]

[![CI](https://github.com/gmickel/CodeWhisper/actions/workflows/ci.yml/badge.svg)](https://github.com/gmickel/CodeWhisper/actions/workflows/ci.yml)
[![Known Vulnerabilities](https://snyk.io/test/github/gmickel/CodeWhisper/badge.svg)](https://snyk.io/test/github/gmickel/CodeWhisper)
[![License](https://img.shields.io/github/license/gmickel/CodeWhisper.svg)](https://github.com/gmickel/CodeWhisper/blob/main/LICENSE)

_description_

## Sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/gmickel/static/sponsors.svg">

    <img src='https://cdn.jsdelivr.net/gh/gmickel/static/sponsors.svg'/>

  </a>
</p>

## License

[MIT](./LICENSE) License © 2024-PRESENT [Gordon Mickel](https://github.com/gmickel)

## Contributors 👨‍💻

<!-- readme: collaborators, contributors -start -->
<!-- readme: collaborators, contributors -end -->

```

## src/cli/git-tools.ts

- Language: typescript
- Size: 1081 bytes
- Last modified: Tue Jul 09 2024 11:07:40 GMT+0200 (Central European Summer Time)

```typescript
import simpleGit, { type SimpleGit } from 'simple-git';
import type { FileInfo } from '../core/file-processor';
import { detectLanguage } from '../utils/language-detector';

const git: SimpleGit = simpleGit();

export async function gitDiff(branch?: string): Promise<FileInfo[]> {
  const diffSummary = await git.diffSummary([branch ?? 'HEAD^']);

  const fileInfos: FileInfo[] = await Promise.all(
    diffSummary.files.map(async (file) => {
      const content = await git.show([`${branch ?? 'HEAD'}:${file.file}`]);
      return {
        path: file.file,
        extension: file.file.split('.').pop() ?? '',
        language: detectLanguage(file.file),
        size: content.length,
        created: new Date(),
        modified: new Date(),
        content,
      };
    }),
  );

  return fileInfos;
}

export async function prReview(prNumber: string): Promise<FileInfo[]> {
  // This is a placeholder. In a real implementation, you'd use the GitHub API
  // to fetch the PR diff and convert it to FileInfo objects.
  console.log(`Reviewing PR #${prNumber}`);
  return [];
}

```

## src/cli/index.ts

- Language: typescript
- Size: 5344 bytes
- Last modified: Fri Jul 12 2024 22:38:48 GMT+0200 (Central European Summer Time)

```typescript
import os from 'node:os';
import path from 'node:path';
import url from 'node:url';
import chalk from 'chalk';
import { Command } from 'commander';
import fs from 'fs-extra';
import ora from 'ora';
import { processFiles } from '../core/file-processor';
import { generateMarkdown } from '../core/markdown-generator';
import { interactiveMode } from './interactive-filtering';

const isProduction = path
  .dirname(new URL(import.meta.url).pathname)
  .includes('/dist/');
const templatesDir = isProduction
  ? path.resolve(path.dirname(new URL(import.meta.url).pathname), '../')
  : path.resolve(
      path.dirname(new URL(import.meta.url).pathname),
      '../templates',
    );

const program = new Command();

export function cli(args: string[]) {
  program
    .name('codewhisper')
    .description('A powerful tool for converting code to AI-friendly prompts')
    .version('1.0.0');

  program
    .command('generate')
    .description('Generate a markdown file from your codebase')
    .option('-p, --path <path>', 'Path to the codebase', '.')
    .option('-o, --output <output>', 'Output file name')
    .option('-t, --template <template>', 'Template to use', 'default')
    .option('-g, --gitignore <path>', 'Path to .gitignore file')
    .option('-f, --filter <patterns...>', 'File patterns to include')
    .option('-e, --exclude <patterns...>', 'File patterns to exclude')
    .option('-s, --suppress-comments', 'Strip comments from the code')
    .option('--case-sensitive', 'Use case-sensitive pattern matching')
    .option(
      '--no-codeblock',
      'Disable wrapping code inside markdown code blocks',
    )
    .option(
      '--custom-data <json>',
      'Custom data to pass to the template (JSON string)',
    )
    .option('--custom-template <path>', 'Path to a custom Handlebars template')
    .option('--custom-ignores <patterns...>', 'Additional patterns to ignore')
    .option(
      '--cache-path <path>',
      'Custom path for the cache file',
      path.join(os.tmpdir(), 'codewhisper-cache.json'),
    )
    .action(async (options) => {
      const spinner = ora('Processing files...').start();

      try {
        const files = await processFiles({
          path: options.path,
          gitignorePath: options.gitignore,
          filter: options.filter,
          exclude: options.exclude,
          suppressComments: options.suppressComments,
          caseSensitive: options.caseSensitive,
          customIgnores: options.customIgnores,
          cachePath: options.cachePath,
        });

        spinner.text = 'Generating markdown...';

        let customData = {};
        if (options.customData) {
          try {
            customData = JSON.parse(options.customData);
          } catch (error) {
            spinner.fail('Error parsing custom data JSON');
            console.error(chalk.red((error as Error).message));
            process.exit(1);
          }
        }

        const templatePath =
          options.customTemplate ||
          path.join(templatesDir, `${options.template}.hbs`);

        const templateContent = await fs.readFile(templatePath, 'utf-8');

        const markdown = await generateMarkdown(files, templateContent, {
          noCodeblock: !options.codeblock,
          basePath: options.path,
          customData,
        });

        if (options.output) {
          await fs.writeFile(options.output, markdown);
          spinner.succeed(`Output written to ${options.output}`);
        } else {
          spinner.stop();
          console.log(markdown);
        }
      } catch (error) {
        spinner.fail('Error generating output');
        console.error(chalk.red((error as Error).message));
        process.exit(1);
      }
    });

  program
    .command('interactive')
    .description('Start interactive mode')
    .option('-p, --path <path>', 'Path to the codebase', '.')
    .action(async (options) => {
      try {
        await interactiveMode(options.path);
      } catch (error) {
        console.error(chalk.red('Error in interactive mode:'), error);
        process.exit(1);
      }
    });

  program
    .command('list-templates')
    .description('List available templates')
    .action(() => {
      const templates = fs
        .readdirSync(templatesDir)
        .filter((file) => file.endsWith('.hbs'))
        .map((file) => file.replace('.hbs', ''));

      console.log(chalk.blue('Available templates:'));
      for (const template of templates) {
        console.log(`- ${template}`);
      }
    });

  program
    .command('export-templates')
    .description('Export templates to the current or specified directory')
    .option(
      '-d, --dir <directory>',
      'Target directory for exported templates',
      '.',
    )
    .action(async (options) => {
      const targetDir = path.resolve(options.dir);

      try {
        await fs.ensureDir(targetDir);
        await fs.copy(templatesDir, targetDir, { overwrite: false });
        console.log(chalk.green(`Templates exported to ${targetDir}`));
      } catch (error) {
        console.error(
          chalk.red('Error exporting templates:'),
          (error as Error).message,
        );
      }
    });

  program.parse(process.argv);
}

export { cli as default };

if (import.meta.url === url.pathToFileURL(process.argv[1]).href) {
  cli(process.argv.slice(2));
}

```

## src/cli/interactive-filtering.ts

- Language: typescript
- Size: 3691 bytes
- Last modified: Fri Jul 19 2024 01:48:53 GMT+0200 (Central European Summer Time)

```typescript
import path from 'node:path';
import url from 'node:url';
import { input, select } from '@inquirer/prompts';
import chalk from 'chalk';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import inquirerFileTreeSelection from 'inquirer-file-tree-selection-prompt';
import { type FileInfo, processFiles } from '../core/file-processor';
import { generateMarkdown } from '../core/markdown-generator';

inquirer.registerPrompt('file-tree-selection', inquirerFileTreeSelection);
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

export async function interactiveMode(basePath: string) {
  try {
    const selectedFiles = await selectFiles(basePath);
    const template = await selectTemplate();
    const outputPath = await getOutputPath(basePath);

    console.log(chalk.cyan('\nProcessing selected files...'));
    const processedFiles = await processSelectedFiles(basePath, selectedFiles);

    console.log(chalk.cyan('\nGenerating markdown...'));
    const templateContent = await fs.readFile(
      path.join(__dirname, '../templates', `${template}.hbs`),
      'utf-8',
    );
    const markdown = await generateMarkdown(processedFiles, templateContent, {
      basePath,
    });

    // Decode HTML entities
    const decodedMarkdown = decodeHTMLEntities(markdown);

    if (outputPath === 'stdout') {
      console.log(chalk.green('\nGenerated Markdown:'));
      console.log(decodedMarkdown);
    } else {
      await fs.writeFile(outputPath, decodedMarkdown, 'utf8');
      console.log(chalk.green(`\nMarkdown saved to: ${outputPath}`));
    }

    console.log(chalk.green('\nInteractive mode completed!'));
  } catch (error) {
    console.error(chalk.red('Error in interactive mode:'), error);
  }
}

async function selectFiles(basePath: string): Promise<string[]> {
  const answer = await inquirer.prompt([
    {
      type: 'file-tree-selection',
      name: 'selectedFiles',
      message: 'Select files and directories:',
      root: basePath,
      multiple: true,
      enableGoUpperDirectory: true,
      onlyShowValid: false,
      hideChildrenOfValid: false,
      validate: (item: string) => true, // You can implement custom validation here
    },
  ]);

  return Array.isArray(answer.selectedFiles)
    ? answer.selectedFiles.map((file: string) => path.relative(basePath, file))
    : [path.relative(basePath, answer.selectedFiles)];
}

async function selectTemplate(): Promise<string> {
  const templates = await fs.readdir(path.join(__dirname, '../templates'));
  return select({
    message: 'Select a template:',
    choices: templates.map((t) => ({
      value: t.replace('.hbs', ''),
      name: t.replace('.hbs', ''),
    })),
  });
}

async function getOutputPath(basePath: string): Promise<string> {
  const defaultFileName = `${path.basename(basePath)}.md`;
  const defaultPath = path.join(basePath, defaultFileName);
  return input({
    message:
      'Enter the output file path (or "" (empty string) for console/stdout output):',
    default: defaultPath,
    transformer: (input: string) => {
      return input === defaultPath ? defaultFileName : input;
    },
  });
}

async function processSelectedFiles(
  basePath: string,
  selectedPaths: string[],
): Promise<FileInfo[]> {
  const processOptions = {
    path: basePath,
    filter: selectedPaths.map((p) => (p.endsWith('/') ? `${p}**/*` : p)), // Handle directories
    // Add other options as needed
  };

  // debug this

  return processFiles(processOptions);
}

function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

```

## src/core/file-processor.ts

- Language: typescript
- Size: 4578 bytes
- Last modified: Fri Jul 12 2024 23:17:00 GMT+0200 (Central European Summer Time)

```typescript
import os from 'node:os';
import path from 'node:path';
import fastGlob from 'fast-glob';
import fs from 'fs-extra';
import ignore from 'ignore';
import { isBinaryFile } from 'isbinaryfile';
import Piscina from 'piscina';
import { FileCache } from '../utils/file-cache';

export interface FileInfo {
  path: string;
  extension: string;
  language: string;
  size: number;
  created: Date;
  modified: Date;
  content: string;
}

interface ProcessOptions {
  path: string;
  gitignorePath?: string;
  filter?: string[];
  exclude?: string[];
  suppressComments?: boolean;
  caseSensitive?: boolean;
  customIgnores?: string[];
  cachePath?: string;
}

const workerFilePath = new URL('../core/file-worker.js', import.meta.url).href;

const pool = new Piscina({
  filename: workerFilePath,
});

const DEFAULT_IGNORES = [
  // Version control
  '**/.git',
  '**/.gitignore',
  '**/.gitattributes',
  '**/.gitmodules',
  '**/.gitkeep',
  '**/.github',
  '**/.svn',
  '**/.hg',
  '**/.hgignore',
  '**/.hgcheck',

  // Package manager directories
  '**/node_modules',
  '**/jspm_packages',
  '**/bower_components',

  // Build outputs and caches
  '**/dist',
  '**/build',
  '**/.cache',
  '**/.output',
  '**/.nuxt',
  '**/.next',
  '**/.vuepress/dist',
  '**/.serverless',
  '**/.fusebox',
  '**/.dynamodb',

  // Package manager files
  '**/package-lock.json',
  '**/yarn.lock',
  '**/pnpm-lock.yaml',
  '**/bun.lockb',
  '**/Gemfile.lock',
  '**/Cargo.lock',
  '**/poetry.lock',
  '**/composer.lock',

  // IDE and editor files
  '**/.vscode',
  '**/.idea',
  '**/*.swp',
  '**/*.swo',

  // OS generated files
  '**/.DS_Store',
  '**/.DS_Store?',
  '**/._*',
  '**/.Spotlight-V100',
  '**/.Trashes',
  '**/ehthumbs.db',
  '**/Thumbs.db',

  // Logs
  '**/logs',
  '**/*.log',
  '**/npm-debug.log*',
  '**/yarn-debug.log*',
  '**/yarn-error.log*',

  // Temporary files
  '**/tmp',
  '**/temp',
];

export async function processFiles(
  options: ProcessOptions,
): Promise<FileInfo[]> {
  const {
    path: basePath,
    gitignorePath = '.gitignore',
    filter = [],
    exclude = [],
    suppressComments = false,
    caseSensitive = false,
    customIgnores = [],
    cachePath = path.join(os.tmpdir(), 'codewhisper-cache.json'),
  } = options;

  const fileCache = new FileCache(cachePath);

  const ig = ignore().add(DEFAULT_IGNORES).add(customIgnores);

  if (await fs.pathExists(gitignorePath)) {
    const gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');
    ig.add(gitignoreContent);
  }

  const globOptions: fastGlob.Options = {
    cwd: basePath,
    dot: true,
    absolute: true,
    onlyFiles: true,
    followSymbolicLinks: false,
    caseSensitiveMatch: caseSensitive,
    ignore: exclude,
  };

  const fileInfos: FileInfo[] = [];
  const cachePromises: Promise<void>[] = [];

  const globStream = fastGlob.stream('**/*', globOptions);

  return new Promise((resolve, reject) => {
    globStream.on('data', (filePath) => {
      const filePathStr = filePath.toString();
      const relativePath = path.relative(basePath, filePathStr);

      if (ig.ignores(relativePath)) return;

      if (
        filter.length > 0 &&
        !filter.some((pattern) => new RegExp(pattern).test(filePathStr))
      )
        return;

      cachePromises.push(
        (async () => {
          try {
            const cached = await fileCache.get(filePathStr);
            if (cached) {
              fileInfos.push(cached);
              return;
            }

            const stats = await fs.stat(filePathStr);
            if (!stats.isFile()) return;

            const buffer = await fs.readFile(filePathStr);
            if (await isBinaryFile(buffer)) return;

            const result = await pool.run({
              filePath: filePathStr,
              suppressComments,
            });

            if (result) {
              await fileCache.set(filePathStr, result as FileInfo);
              fileInfos.push(result as FileInfo);
            }
          } catch (error) {
            console.error(`Error processing file ${filePathStr}:`, error);
          }
        })(),
      );
    });

    globStream.on('end', async () => {
      try {
        await Promise.all(cachePromises);
        fileInfos.sort((a, b) => a.path.localeCompare(b.path));
        await fileCache.flush();
        resolve(fileInfos);
      } catch (error) {
        console.error('Error during file processing or cache flushing:', error);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });

    globStream.on('error', reject);
  });
}

```

## src/core/file-worker.d.ts

- Language: typescript
- Size: 253 bytes
- Last modified: Fri Jul 12 2024 17:30:18 GMT+0200 (Central European Summer Time)

```typescript
export function detectLanguage(filePath: string): string;
export function stripComments(code: string, language: string): string;
export default function processFile(options: {
  filePath: string;
  suppressComments: boolean;
}): Promise<object | null>;

```

## src/core/file-worker.js

- Language: javascript
- Size: 2862 bytes
- Last modified: Fri Jul 12 2024 17:39:04 GMT+0200 (Central European Summer Time)

```javascript
import path from 'node:path';
/**
 * This file is configured to use a JavaScript worker file (`file-worker.js`)
 * because the `Piscina` worker-thread pool works better with a JavaScript file as the entry point.
 * This ensures compatibility in both development (`src`), testing (`tests`), and production (`dist`).
 */
import fs from 'fs-extra';
import { isBinaryFile } from 'isbinaryfile';
import stripCommentsLib from 'strip-comments';

/**
 * Strips comments from the given code.
 *
 * @param {string} code - The code from which to strip comments.
 * @param {string} language - The language of the code (e.g., 'javascript', 'python').
 * @returns {string} - The code with comments stripped.
 */
export function stripComments(code, language) {
  const options = {
    language,
    preserveNewlines: true,
  };

  return stripCommentsLib(code, options);
}

const languageMap = {
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  rb: 'ruby',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  cs: 'csharp',
  go: 'go',
  rs: 'rust',
  php: 'php',
  html: 'html',
  css: 'css',
  json: 'json',
  md: 'markdown',
  yml: 'yaml',
  yaml: 'yaml',
  xml: 'xml',
  sql: 'sql',
  sh: 'bash',
  bat: 'batch',
  ps1: 'powershell',
  // Add more mappings as needed
};

/**
 * Detects the language of a file based on its extension.
 *
 * @param {string} filePath - The path of the file.
 * @returns {string} The detected language of the file.
 */
export function detectLanguage(filePath) {
  const extension = path.extname(filePath).slice(1).toLowerCase();
  return languageMap[extension] || 'plaintext';
}

/**
 * Process a file and return its metadata and content.
 *
 * @param {Object} options - The options for processing the file.
 * @param {string} options.filePath - The path of the file to process.
 * @param {boolean} options.suppressComments - Whether to suppress comments in the file content.
 * @returns {Promise<Object|null>} A promise that resolves to an object containing the file metadata and content,
 *                                or null if there was an error processing the file.
 */
export default async function processFile({
  filePath,
  suppressComments = false,
}) {
  try {
    const stats = await fs.stat(filePath);
    const buffer = await fs.readFile(filePath);

    if (await isBinaryFile(buffer)) {
      return null;
    }

    let content = buffer.toString('utf-8');
    const extension = filePath.split('.').pop() ?? '';
    const language = detectLanguage(filePath);

    if (suppressComments) {
      content = stripComments(content, language);
    }

    return {
      path: filePath,
      extension,
      language,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      content,
    };
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    return null;
  }
}

```

## src/core/markdown-generator.ts

- Language: typescript
- Size: 2698 bytes
- Last modified: Fri Jul 12 2024 17:50:04 GMT+0200 (Central European Summer Time)

```typescript
import path from 'node:path';
import Handlebars from 'handlebars';
import type { FileInfo } from './file-processor';

interface MarkdownOptions {
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

  Handlebars.registerHelper('hasCustomData', (customData) => {
    return customData && Object.keys(customData).length > 0;
  });

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
    customData,
  };

  return compiledTemplate(data);
}

```

## src/templates/codebase-summary.hbs

- Language: plaintext
- Size: 1252 bytes
- Last modified: Wed Jul 10 2024 08:57:44 GMT+0200 (Central European Summer Time)

```plaintext
# Comprehensive Codebase Analysis

## Project Overview

Analyze the following codebase summary, focusing on its structure, main components, and potential areas of interest.
Provide insights on the overall architecture and design patterns used.

## File Structure

{{tableOfContents files}}

## Detailed Code Analysis

{{#each files}}
### File: {{relativePath this.path}}

{{fileInfo this}}

<code_section>
  {{#codeblock this.content this.language}}{{/codeblock}}
</code_section>

{{/each}}

## Analysis Tasks

1. Identify the main components and their interactions within the codebase.
2. Evaluate the overall code organization and suggest any improvements.
3. Detect any potential code smells or anti-patterns.
4. Assess the error handling and robustness of the code.
5. Comment on the code's readability and adherence to best practices.
6. Suggest potential optimizations or architectural improvements.
7. Identify any security concerns or potential vulnerabilities.
8. Evaluate the project's scalability and maintainability.

Provide your analysis, ensuring to reference specific parts of the code when making observations or suggestions. Your
insights should be thorough, actionable, and tailored to the specific characteristics of this codebase.

```

## src/templates/deep-code-review.hbs

- Language: plaintext
- Size: 2015 bytes
- Last modified: Wed Jul 10 2024 08:56:47 GMT+0200 (Central European Summer Time)

```plaintext
# Comprehensive Code Review and Architectural Analysis

## Objective
As an expert software architect and code quality specialist, conduct a thorough analysis of the provided codebase. Your
goal is to uncover strengths, weaknesses, and opportunities for improvement, balancing immediate enhancements with
long-term sustainability.

## Your Expertise
- Advanced software architecture principles and design patterns
- Performance optimization and scalability enhancement
- Security hardening and best practices
- Large-scale refactoring and technical debt reduction
- Modern development frameworks and DevOps practices

## Analysis Framework

1. Initial Assessment
- Identify the primary technologies, frameworks, and architectural patterns
- Assess the overall code organization and structure

2. Multi-Dimensional Analysis
a. Functionality and Business Logic
b. Architectural Design
c. Code Quality and Maintainability
d. Performance and Scalability
e. Security and Data Protection
f. Testing and Quality Assurance
g. DevOps and Deployment Considerations

3. Improvement Identification
For each analyzed dimension:
- Current state
- Ideal state
- Gap analysis
- Suggested improvements (short-term and long-term)

4. Strategic Improvement Plan
- Prioritized list of improvements
- Implementation roadmap
- Resource considerations
- Risk assessment

## Output Format

Provide your analysis in the following structure:

<initial_assessment>
  [Your initial observations and high-level overview]
</initial_assessment>

<detailed_analysis>
  [In-depth analysis of each dimension, with code references]
</detailed_analysis>

<improvement_plan>
  [Prioritized improvements and implementation strategy]
</improvement_plan>

<conclusion>
  [Summary of key findings and next steps]
</conclusion>

## Codebase

<codebase>

  <toc>
    ## Table of Contents

    {{tableOfContents files}}
  </toc>

  <code>
{{#each files}}
### {{relativePath this.path}}

```{{this.language}}
{{this.content}}
{{/each}}
</code>

</codebase> ```

```

## src/templates/default.hbs

- Language: plaintext
- Size: 261 bytes
- Last modified: Wed Jul 10 2024 08:56:16 GMT+0200 (Central European Summer Time)

```plaintext
# Code Summary

{{tableOfContents files}}

## Files

{{#each files}}
## {{relativePath this.path}}

- Language: {{this.language}}
- Size: {{this.size}} bytes
- Last modified: {{this.modified}}

{{#codeblock this.content this.language}}{{/codeblock}}

{{/each}}

```

## src/templates/generate-project-documentation.hbs

- Language: plaintext
- Size: 1559 bytes
- Last modified: Wed Jul 10 2024 08:57:51 GMT+0200 (Central European Summer Time)

```plaintext
# Comprehensive Project Documentation Generation

## Objective
As an expert technical writer and open-source advocate, your task is to create comprehensive project documentation that
will enhance the project's visibility, adoption, and community engagement.

## Documentation Components
1. README.md
2. CONTRIBUTING.md
3. CODE_OF_CONDUCT.md
4. SECURITY.md
5. CHANGELOG.md

## Key Considerations
- Ensure clarity and conciseness in all documents
- Tailor the tone and technical depth to the target audience
- Incorporate best practices for open-source project management
- Focus on user onboarding and contributor engagement

## Output Format

<readme>
  [Full content of README.md, including project overview, installation instructions, usage examples, and contribution
  guidelines]
</readme>

<contributing>
  [Full content of CONTRIBUTING.md, detailing how to contribute to the project, coding standards, and the pull request
  process]
</contributing>

<code_of_conduct>
  [Full content of CODE_OF_CONDUCT.md, outlining expected behavior and community standards]
</code_of_conduct>

<security>
  [Full content of SECURITY.md, describing the project's security policy and how to report vulnerabilities]
</security>

<changelog>
  [Full content of CHANGELOG.md, listing all notable changes to the project]
</changelog>

## Project Codebase

<codebase>

  <toc>
    ## Table of Contents

    {{tableOfContents files}}
  </toc>

  <code>
{{#each files}}
### {{relativePath this.path}}

```{{this.language}}
{{this.content}}
{{/each}}
</code>

</codebase> ```

```

## src/templates/generate-readme.hbs

- Language: plaintext
- Size: 3055 bytes
- Last modified: Wed Jul 10 2024 08:57:25 GMT+0200 (Central European Summer Time)

```plaintext
{{#if projectLogo}}
<p align="center">
  <img src="{{projectLogo}}"
    alt="{{projectName}} logo"
    width="200" />
</p>
{{/if}}

<h1 align="center">{{projectName}}</h1>

<p align="center">
  {{projectTagline}}
</p>

<p align="center">
  {{#if projectBadges}}
  {{{projectBadges}}}
  {{else}}
  <!-- Add your badges here -->
  <img alt="GitHub release (latest by date)"
    src="https://img.shields.io/github/v/release/{{githubUsername}}/{{projectName}}">
  <img alt="GitHub Workflow Status"
    src="https://img.shields.io/github/actions/workflow/status/{{githubUsername}}/{{projectName}}/main.yml">
  <img alt="GitHub"
    src="https://img.shields.io/github/license/{{githubUsername}}/{{projectName}}">
  {{/if}}
</p>

<p align="center">
  <a href="#key-features">Key Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#api">API</a> •
  <a href="#configuration">Configuration</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#license">License</a>
</p>

{{#if projectDemo}}
<p align="center">
  <img src="{{projectDemo}}"
    alt="{{projectName}} Demo"
    width="600">
</p>
{{/if}}

## 📖 About

{{projectDescription}}

## ✨ Key Features

{{#each keyFeatures}}
- {{this}}
{{/each}}

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/{{githubUsername}}/{{projectName}}.git

# Navigate to the project directory
cd {{projectName}}

# Install dependencies
{{installationCommand}}

# Run the project
{{quickStartCommand}}
```

## 📦 Installation

{{installationInstructions}}

## 💻 Usage

{{usageInstructions}}

{{#if codeExamples}}
### Examples

{{#each codeExamples}}
```{{language}}
{{{code}}}
```
{{description}}

{{/each}}
{{/if}}

## 🔧 Configuration

{{configuration}}

## 📚 API Reference

{{#each files}}
{{#if (eq this.language "typescript" "javascript")}}
### `{{relativePath this.path}}`

```{{this.language}}
{{this.content}}
```

{{/if}}
{{/each}}

## 🌳 Project Structure

```
{{projectStructure}}
```

## 🤝 Contributing

We welcome contributions to {{projectName}}! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull
requests.

## 🧪 Running Tests

{{testingInstructions}}

## 🚢 Deployment

{{deploymentInstructions}}

## 🗺️ Roadmap

{{roadmap}}

## 📄 License

This project is licensed under the {{license}} License - see the [LICENSE](LICENSE) file for details.

## 👏 Acknowledgments

{{acknowledgments}}

## 📬 Contact

{{contactInformation}}

{{#if faq}}
## ❓ FAQ

{{faq}}
{{/if}}

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/{{githubUsername}}">{{authorName}}</a>
</p>

```

## src/templates/minimal.hbs

- Language: plaintext
- Size: 155 bytes
- Last modified: Fri Jul 12 2024 21:59:49 GMT+0200 (Central European Summer Time)

```plaintext
## Files

{{#each files}}
## {{relativePath this.path}}

- Language: {{this.language}}

{{#codeblock this.content this.language}}{{/codeblock}}

{{/each}}

```

## src/templates/optimize-llm-prompt.hbs

- Language: plaintext
- Size: 1324 bytes
- Last modified: Tue Jul 09 2024 11:52:27 GMT+0200 (Central European Summer Time)

```plaintext
# LLM Prompt Optimization

## Objective
As an elite prompt engineer, your task is to significantly enhance the effectiveness and clarity of the given prompt for
optimal LLM interaction.

## Input Prompt

<input_prompt>
  {{prompt}}
</input_prompt>

## Optimization Process
1. Analyze the input prompt for clarity, specificity, and potential ambiguities
2. Apply advanced prompting techniques (e.g., Chain-of-Thought, Few-Shot Learning)
3. Enhance the prompt's structure and flow
4. Incorporate relevant context and constraints
5. Optimize for the target LLM's strengths and limitations

## Output Format

<analysis>
  [Detailed analysis of the original prompt, identifying strengths and areas for improvement]
</analysis>

<optimized_prompt_v1>
  [First iteration of the improved prompt]
</optimized_prompt_v1>

<applied_techniques>
  [Explanation of the techniques and strategies used in the optimization]
</applied_techniques>

<evaluation>
  [Assessment of the optimized prompt against key metrics: clarity, specificity, engagement, versatility, and depth]
</evaluation>

<final_optimized_prompt>
  [Final version of the optimized prompt after iterations and refinements]
</final_optimized_prompt>

<improvement_summary>
  [Summary of key improvements and their expected impact on LLM performance]
</improvement_summary>

```

## src/templates/security-focused-review.hbs

- Language: plaintext
- Size: 1689 bytes
- Last modified: Wed Jul 10 2024 08:57:55 GMT+0200 (Central European Summer Time)

```plaintext
# Security-Focused Code Review

## Objective
As a senior security expert and code reviewer, your task is to conduct a comprehensive security audit of the provided
codebase. Focus on identifying potential vulnerabilities, security anti-patterns, and areas where security can be
enhanced.

## Key Focus Areas
1. Authentication and Authorization
2. Data Validation and Sanitization
3. Encryption and Data Protection
4. Session Management
5. Error Handling and Information Leakage
6. Secure Communication
7. Third-party Dependencies
8. Secure Coding Practices

## Review Process
1. For each file, perform a line-by-line security analysis
2. Identify and categorize security issues (Critical, High, Medium, Low)
3. Provide specific recommendations for each identified issue
4. Suggest security enhancements and best practices

## Output Format

<executive_summary>
  [High-level overview of the security state of the codebase]
</executive_summary>

<critical_issues>
  [List and detailed explanation of critical security issues]
</critical_issues>

<high_priority_issues>
  [List and detailed explanation of high-priority security issues]
</high_priority_issues>

<medium_low_priority_issues>
  [Summary of medium and low priority issues]
</medium_low_priority_issues>

<recommendations>
  [Detailed recommendations for addressing each security issue]
</recommendations>

<best_practices>
  [Suggestions for implementing security best practices]
</best_practices>

## Codebase

<codebase>

  <toc>
    ## Table of Contents

    {{tableOfContents files}}
  </toc>

  <code>
{{#each files}}
### {{relativePath this.path}}

```{{this.language}}
{{this.content}}
{{/each}}
</code>

</codebase> ```

```

## src/utils/comment-stripper.ts

- Language: typescript
- Size: 258 bytes
- Last modified: Tue Jul 09 2024 10:42:06 GMT+0200 (Central European Summer Time)

```typescript
import stripCommentsLib from 'strip-comments';

export function stripComments(code: string, language: string): string {
  const options: stripCommentsLib.Options = {
    language,
    preserveNewlines: true,
  };

  return stripCommentsLib(code, options);
}

```

## src/utils/file-cache.ts

- Language: typescript
- Size: 2692 bytes
- Last modified: Fri Jul 12 2024 18:36:31 GMT+0200 (Central European Summer Time)

```typescript
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'fs-extra';
import type { FileInfo } from '../core/file-processor';

interface CacheEntry {
  hash: string;
  data: FileInfo;
}

export class FileCache {
  private cacheFile: string;
  private cache: Record<string, CacheEntry> = {};
  private isDirty = false;
  private isLoaded = false;
  private inMemoryLock = false;

  constructor(cacheFilePath: string) {
    this.cacheFile = cacheFilePath;
  }

  private async loadCache(): Promise<void> {
    if (this.isLoaded) return;

    if (this.inMemoryLock) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return this.loadCache();
    }

    this.inMemoryLock = true;

    try {
      if (await fs.pathExists(this.cacheFile)) {
        const content = await fs.readFile(this.cacheFile, 'utf-8');
        try {
          this.cache = JSON.parse(content);
        } catch (parseError) {
          console.warn(
            `Failed to parse cache file ${this.cacheFile}:`,
            parseError,
          );
          this.cache = {};
        }
      }
      this.isLoaded = true;
    } catch (error) {
      console.warn(`Failed to load cache from ${this.cacheFile}:`, error);
      this.cache = {};
    } finally {
      this.inMemoryLock = false;
    }
  }

  private async saveCache(): Promise<void> {
    if (!this.isDirty) return;

    if (this.inMemoryLock) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return this.saveCache();
    }

    this.inMemoryLock = true;

    try {
      await fs.ensureDir(path.dirname(this.cacheFile));
      const tempFile = `${this.cacheFile}.tmp`;
      await fs.writeFile(tempFile, JSON.stringify(this.cache), 'utf-8');
      await fs.rename(tempFile, this.cacheFile);
      this.isDirty = false;
    } catch (error) {
      console.error(`Failed to save cache to ${this.cacheFile}:`, error);
    } finally {
      this.inMemoryLock = false;
    }
  }

  async get(filePath: string): Promise<FileInfo | null> {
    await this.loadCache();
    return this.cache[filePath]?.data || null;
  }

  async set(filePath: string, data: FileInfo): Promise<void> {
    await this.loadCache();
    const hash = this.hashFile(data);
    this.cache[filePath] = { hash, data };
    this.isDirty = true;
  }

  private hashFile(data: FileInfo): string {
    return crypto
      .createHash('md5')
      .update(`${data.size}-${data.modified.getTime()}`)
      .digest('hex');
  }

  async clear(): Promise<void> {
    this.cache = {};
    this.isDirty = true;
    await this.saveCache();
  }

  async flush(): Promise<void> {
    if (this.isDirty) {
      await this.saveCache();
    }
  }
}

```

## src/utils/gitignore-parser.ts

- Language: typescript
- Size: 397 bytes
- Last modified: Tue Jul 09 2024 11:07:40 GMT+0200 (Central European Summer Time)

```typescript
import fs from 'fs-extra';
import ignore, { type Ignore } from 'ignore';

export async function parseGitignore(gitignorePath: string): Promise<Ignore> {
  const ig = ignore();

  try {
    const gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');
    ig.add(gitignoreContent);
  } catch (error) {
    console.warn(`Could not read .gitignore file: ${gitignorePath}`);
  }

  return ig;
}

```

## src/utils/language-detector.ts

- Language: typescript
- Size: 630 bytes
- Last modified: Tue Jul 09 2024 09:45:14 GMT+0200 (Central European Summer Time)

```typescript
import path from 'node:path';

const languageMap: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  rb: 'ruby',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  cs: 'csharp',
  go: 'go',
  rs: 'rust',
  php: 'php',
  html: 'html',
  css: 'css',
  json: 'json',
  md: 'markdown',
  yml: 'yaml',
  yaml: 'yaml',
  xml: 'xml',
  sql: 'sql',
  sh: 'bash',
  bat: 'batch',
  ps1: 'powershell',
  // Add more mappings as needed
};

export function detectLanguage(filePath: string): string {
  const extension = path.extname(filePath).slice(1).toLowerCase();
  return languageMap[extension] || 'plaintext';
}

```

## tests/e2e/cli-commands.test.ts

- Language: typescript
- Size: 1607 bytes
- Last modified: Fri Jul 12 2024 17:39:04 GMT+0200 (Central European Summer Time)

```typescript
import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'fs-extra';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('CLI Commands', () => {
  const cliPath = path.resolve(__dirname, '../../cli.js');
  const testProjectPath = path.resolve(__dirname, '../fixtures/test-project');
  const outputPath = path.join(testProjectPath, 'output.md');
  const tempGitignorePath = path.join(testProjectPath, '.gitignore');

  beforeAll(async () => {
    // Ensure .gitignore exists
    await fs.writeFile(tempGitignorePath, '*.log\n');
  });

  afterAll(async () => {
    // Clean up
    await fs.remove(tempGitignorePath);
    await fs.remove(outputPath);
  });

  it('should generate markdown file with default options', () => {
    try {
      const command = `pnpm exec esno ${cliPath} generate -p "${testProjectPath}" -o "${outputPath}" -g "${tempGitignorePath}"`;

      execSync(command, {
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'test' },
        cwd: path.resolve(__dirname, '../..'), // Set working directory to project root
      });

      const output = fs.readFileSync(outputPath, 'utf-8');

      expect(output).toContain('# Code Summary');
      expect(output).toContain('## Files');
      expect(output).toContain('src/main.js');
      expect(output).toContain('src/utils.ts');
      expect(output).toContain('package.json');
      expect(output).not.toContain('*.log'); // This should be ignored
    } catch (error) {
      console.error('Error executing command:', error);
      throw error;
    }
  });
});

```

## tests/fixtures/custom-template.hbs

- Language: plaintext
- Size: 646 bytes
- Last modified: Fri Jul 12 2024 11:22:31 GMT+0200 (Central European Summer Time)

```plaintext
# Custom Template: {{#if customData.title}}{{customData.title}}{{else}}Untitled Project{{/if}}

## Project Overview

This project contains {{files.length}} file(s).

## File Listing

{{#each files}}
### {{relativePath this.path}}

- **Language:** {{this.language}}
- **Size:** {{this.size}} bytes
- **Last Modified:** {{this.modified}}

#### Content Preview:

```{{this.language}}
{{this.content}}
```

---
{{/each}}

## Custom Data

{{#if customData}}
{{#if (hasCustomData customData)}}
Custom data provided:
{{#each customData}}
- {{@key}}: {{this}}
{{/each}}
{{else}}
No custom data provided.
{{/if}}
{{else}}
No custom data provided.
{{/if}}

```

## tests/fixtures/default.hbs

- Language: plaintext
- Size: 261 bytes
- Last modified: Thu Jul 11 2024 18:00:43 GMT+0200 (Central European Summer Time)

```plaintext
# Code Summary

{{tableOfContents files}}

## Files

{{#each files}}
## {{relativePath this.path}}

- Language: {{this.language}}
- Size: {{this.size}} bytes
- Last modified: {{this.modified}}

{{#codeblock this.content this.language}}{{/codeblock}}

{{/each}}

```

## tests/fixtures/test-project/package.json

- Language: json
- Size: 51 bytes
- Last modified: Wed Jul 10 2024 23:40:47 GMT+0200 (Central European Summer Time)

```json
{
  "name": "test-project",
  "version": "1.0.0"
}

```

## tests/fixtures/test-project/src/main.js

- Language: javascript
- Size: 30 bytes
- Last modified: Wed Jul 10 2024 23:40:47 GMT+0200 (Central European Summer Time)

```javascript
console.log('Hello, World!');

```

## tests/fixtures/test-project/src/utils.ts

- Language: typescript
- Size: 70 bytes
- Last modified: Wed Jul 10 2024 23:40:47 GMT+0200 (Central European Summer Time)

```typescript
export function add(a: number, b: number): number {
  return a + b;
}

```

## tests/helpers/gitignore-helper.ts

- Language: typescript
- Size: 445 bytes
- Last modified: Tue Jul 09 2024 23:01:16 GMT+0200 (Central European Summer Time)

```typescript
import path from 'node:path';
import fs from 'fs-extra';

export async function setupTemporaryGitignore(
  fixturesPath: string,
  content: string,
): Promise<string> {
  const tempGitignorePath = path.join(fixturesPath, '.gitignore');
  await fs.writeFile(tempGitignorePath, content);
  return tempGitignorePath;
}

export async function removeTemporaryGitignore(
  gitignorePath: string,
): Promise<void> {
  await fs.remove(gitignorePath);
}

```

## tests/integration/markdown-generation.test.ts

- Language: typescript
- Size: 6804 bytes
- Last modified: Fri Jul 12 2024 14:38:38 GMT+0200 (Central European Summer Time)

```typescript
import path from 'node:path';
import fs from 'fs-extra';
import { describe, expect, it } from 'vitest';
import type { FileInfo } from '../../src/core/file-processor';
import { generateMarkdown } from '../../src/core/markdown-generator';

function decodeHTMLEntities(text: string): string {
  const entities: Record<string, string> = {
    '&quot;': '"',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
  };

  return text.replace(/&quot;|&amp;|&lt;|&gt;/g, (match) => entities[match]);
}

describe('Markdown Generation Integration', () => {
  const fixturesPath = path.resolve(__dirname, '../fixtures');
  const customTemplatePath = path.join(fixturesPath, 'custom-template.hbs');
  const defaultTemplatePath = path.join(fixturesPath, 'default.hbs');

  const mockFiles: FileInfo[] = [
    {
      path: '/project/src/index.ts',
      extension: 'ts',
      language: 'typescript',
      size: 100,
      created: new Date('2023-01-01'),
      modified: new Date('2023-01-02'),
      content: 'console.log("Hello, World!");',
    },
    {
      path: '/project/README.md',
      extension: 'md',
      language: 'markdown',
      size: 50,
      created: new Date('2023-01-01'),
      modified: new Date('2023-01-01'),
      content: '# Project README',
    },
  ];

  it('should generate markdown with default template', async () => {
    const defaultTemplateContent = await fs.readFile(
      defaultTemplatePath,
      'utf-8',
    );
    const result = await generateMarkdown(mockFiles, defaultTemplateContent, {
      basePath: '/project',
    });

    expect(result).toContain('# Code Summary');
    expect(result).toContain('## Files');
    expect(result).toContain('src/index.ts');
    expect(result).toContain('README.md');
    expect(result).toContain('Language: typescript');
    expect(result).toContain('Language: markdown');
    expect(result).toContain(
      '```typescript\nconsole.log("Hello, World!");\n```',
    );
    expect(result).toContain('```markdown\n# Project README\n```');
  });

  it('should use custom template when provided', async () => {
    const customTemplateContent = await fs.readFile(
      customTemplatePath,
      'utf-8',
    );

    const result = await generateMarkdown(mockFiles, customTemplateContent, {
      basePath: '/project',
      customData: { title: 'Test Project', version: '1.0.0' },
    });

    // Check for main sections
    expect(decodeHTMLEntities(result)).toContain(
      '# Custom Template: Test Project',
    );
    expect(decodeHTMLEntities(result)).toContain('## Project Overview');
    expect(decodeHTMLEntities(result)).toContain(
      'This project contains 2 file(s).',
    );
    expect(decodeHTMLEntities(result)).toContain('## File Listing');

    // Check for file entries
    expect(decodeHTMLEntities(result)).toContain('### src/index.ts');
    expect(decodeHTMLEntities(result)).toContain('### README.md');

    // Check for file details
    expect(decodeHTMLEntities(result)).toContain('- **Language:** typescript');
    expect(decodeHTMLEntities(result)).toContain('- **Language:** markdown');
    expect(decodeHTMLEntities(result)).toContain('- **Size:** 100 bytes');
    expect(decodeHTMLEntities(result)).toContain('- **Size:** 50 bytes');

    // Check for last modified dates
    expect(decodeHTMLEntities(result)).toContain(
      '- **Last Modified:** Mon Jan 02 2023',
    );
    expect(decodeHTMLEntities(result)).toContain(
      '- **Last Modified:** Sun Jan 01 2023',
    );

    // Check for content previews
    expect(decodeHTMLEntities(result)).toContain('#### Content Preview:');
    expect(decodeHTMLEntities(result)).toContain(
      '```typescript\nconsole.log("Hello, World!");\n```',
    );
    expect(decodeHTMLEntities(result)).toContain(
      '```markdown\n# Project README\n```',
    );

    // Check for custom data section
    expect(decodeHTMLEntities(result)).toContain('## Custom Data');
    expect(decodeHTMLEntities(result)).toContain('Custom data provided:');
    expect(decodeHTMLEntities(result)).toContain('- title: Test Project');
    expect(decodeHTMLEntities(result)).toContain('- version: 1.0.0');
  });
  it('should include custom data in template context', async () => {
    const customTemplateContent = await fs.readFile(
      customTemplatePath,
      'utf-8',
    );
    const result = await generateMarkdown(mockFiles, customTemplateContent, {
      basePath: '/project',
      customData: { key: 'value', another: 'data point' },
    });

    expect(result).toContain('## Custom Data');
    expect(result).toContain('Custom data provided:');
    expect(result).toContain('- key: value');
    expect(result).toContain('- another: data point');
  });

  it('should handle case when no custom data is provided', async () => {
    const customTemplateContent = await fs.readFile(
      customTemplatePath,
      'utf-8',
    );
    const result = await generateMarkdown(mockFiles, customTemplateContent, {
      basePath: '/project',
    });

    expect(result).toContain('# Custom Template: Untitled Project');
    expect(result).toContain('## Custom Data');
    expect(result).toContain('No custom data provided.');
    expect(result).not.toContain('Custom data provided:');
  });

  it('should handle case when empty custom data object is provided', async () => {
    const customTemplateContent = await fs.readFile(
      customTemplatePath,
      'utf-8',
    );
    const result = await generateMarkdown(mockFiles, customTemplateContent, {
      basePath: '/project',
      customData: {},
    });

    expect(result).toContain('# Custom Template: Untitled Project');
    expect(result).toContain('## Custom Data');
    expect(result).toContain('No custom data provided.');
    expect(result).not.toContain('Custom data provided:');
  });

  it('should handle case when custom data is provided', async () => {
    const customTemplateContent = await fs.readFile(
      customTemplatePath,
      'utf-8',
    );
    const result = await generateMarkdown(mockFiles, customTemplateContent, {
      basePath: '/project',
      customData: { title: 'My Project', version: '1.0.0' },
    });

    expect(result).toContain('# Custom Template: My Project');
    expect(result).toContain('## Custom Data');
    expect(result).toContain('Custom data provided:');
    expect(result).toContain('- title: My Project');
    expect(result).toContain('- version: 1.0.0');
  });

  it('should handle invalid template content gracefully', async () => {
    const invalidTemplateContent =
      '{{# each files}}{{invalidHelper this.content}}{{/each}}';

    const result = await generateMarkdown(mockFiles, invalidTemplateContent, {
      basePath: '/project',
    });

    expect(decodeHTMLEntities(result)).toContain(
      'Missing helper: "invalidHelper"',
    );
  });
});

```

## tests/performance/file-processor.perf.test.ts

- Language: typescript
- Size: 5280 bytes
- Last modified: Fri Jul 12 2024 18:40:33 GMT+0200 (Central European Summer Time)

```typescript
import os from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import fs from 'fs-extra';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { processFiles } from '../../src/core/file-processor';
import type { FileInfo } from '../../src/core/file-processor';
import { generateMarkdown } from '../../src/core/markdown-generator';

describe.sequential('Performance Tests', () => {
  const TEST_DIR = path.join(__dirname, 'perf-test-files');
  const DEFAULT_CACHE_PATH = path.join(os.tmpdir(), 'codewhisper-cache.json');

  beforeAll(async () => {
    await fs.ensureDir(TEST_DIR);
    await fs.remove(DEFAULT_CACHE_PATH);
  });

  afterAll(async () => {
    await fs.remove(TEST_DIR);
    await fs.remove(DEFAULT_CACHE_PATH);
  });

  async function createTestFiles(
    count: number,
    sizeKB: number,
    prefix: string,
  ): Promise<void> {
    const content = 'x'.repeat(sizeKB * 1024);
    for (let i = 0; i < count; i++) {
      await fs.writeFile(path.join(TEST_DIR, `${prefix}_${i}.txt`), content);
    }
  }

  async function runProcessFiles(): Promise<[FileInfo[], number]> {
    const start = performance.now();
    const result = await processFiles({ path: TEST_DIR });
    const end = performance.now();
    const duration = end - start;
    console.log(`Processing took ${duration} ms`);
    return [result, duration];
  }

  async function runGenerateMarkdown(
    files: FileInfo[],
  ): Promise<[string, number]> {
    const templateContent = '{{#each files}}{{this.path}}\n{{/each}}';
    const start = performance.now();
    const result = await generateMarkdown(files, templateContent);
    const end = performance.now();
    const duration = end - start;
    console.log(`Markdown generation took ${duration} ms`);
    return [result, duration];
  }

  it('should process 100 small files (1KB each) efficiently', async () => {
    await fs.emptyDir(TEST_DIR);
    await createTestFiles(100, 1, 'small');
    const [files, processingTime] = await runProcessFiles();
    expect(files).toHaveLength(100);
    const [, markdownTime] = await runGenerateMarkdown(files);
    console.log(`Total time: ${processingTime + markdownTime} ms`);
  }, 10000);

  it('should process 10 large files (1MB each) efficiently', async () => {
    await fs.emptyDir(TEST_DIR);
    await createTestFiles(10, 1024, 'large');
    const [files, processingTime] = await runProcessFiles();
    expect(files).toHaveLength(10);
    const [, markdownTime] = await runGenerateMarkdown(files);
    console.log(`Total time: ${processingTime + markdownTime} ms`);
  }, 30000);

  it('should handle 1000 small files (1KB each)', async () => {
    await fs.emptyDir(TEST_DIR);
    await createTestFiles(1000, 1, 'many');
    const [files, processingTime] = await runProcessFiles();
    expect(files).toHaveLength(1000);
    const [, markdownTime] = await runGenerateMarkdown(files);
    console.log(`Total time: ${processingTime + markdownTime} ms`);
  }, 60000);

  it('should benefit from caching on subsequent runs', async () => {
    await fs.emptyDir(TEST_DIR);
    await fs.remove(DEFAULT_CACHE_PATH);
    await createTestFiles(1000, 10, 'cache'); // Increased to 1000 files

    console.log('First run (no cache):');
    const [firstRunFiles, firstRunTime] = await runProcessFiles();
    expect(firstRunFiles).toHaveLength(1000);

    console.log('Second run (with cache):');
    const [secondRunFiles, secondRunTime] = await runProcessFiles();

    console.log(`First run file count: ${firstRunFiles.length}`);
    console.log(`Second run file count: ${secondRunFiles.length}`);

    expect(secondRunFiles).toHaveLength(firstRunFiles.length);

    console.log(`First run time: ${firstRunTime} ms`);
    console.log(`Second run time: ${secondRunTime} ms`);
    console.log(`Time saved: ${firstRunTime - secondRunTime} ms`);
    console.log(
      `Percentage faster: ${(((firstRunTime - secondRunTime) / firstRunTime) * 100).toFixed(2)}%`,
    );

    expect(secondRunTime).toBeLessThan(firstRunTime);
    expect(secondRunTime).toBeLessThan(firstRunTime * 0.5);
  }, 60000);

  it('should handle a mix of file sizes efficiently', async () => {
    await fs.emptyDir(TEST_DIR);
    await createTestFiles(50, 1, 'small'); // 50 small files
    await createTestFiles(30, 100, 'medium'); // 30 medium files
    await createTestFiles(5, 1024, 'large'); // 5 large files

    const [files, processingTime] = await runProcessFiles();
    expect(files).toHaveLength(85);
    const [, markdownTime] = await runGenerateMarkdown(files);
    console.log(`Total time: ${processingTime + markdownTime} ms`);
  }, 30000);

  it('should process files with different extensions', async () => {
    await fs.emptyDir(TEST_DIR);
    const extensions = ['js', 'ts', 'json', 'md', 'txt'];
    for (let i = 0; i < 50; i++) {
      const ext = extensions[i % extensions.length];
      await fs.writeFile(
        path.join(TEST_DIR, `file_${i}.${ext}`),
        `Content of file ${i}`,
      );
    }

    const [files, processingTime] = await runProcessFiles();
    expect(files).toHaveLength(50);
    const [, markdownTime] = await runGenerateMarkdown(files);
    console.log(`Total time: ${processingTime + markdownTime} ms`);
  }, 15000);
});

```

## tests/unit/file-processor.test.ts

- Language: typescript
- Size: 5763 bytes
- Last modified: Thu Jul 11 2024 18:03:12 GMT+0200 (Central European Summer Time)

```typescript
import path from 'node:path';
import { Readable } from 'node:stream';
import fastGlob from 'fast-glob';
import Piscina from 'piscina';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type FileInfo, processFiles } from '../../src/core/file-processor';
import { FileCache } from '../../src/utils/file-cache';

vi.mock('fast-glob');
vi.mock('piscina');
vi.mock('../../src/utils/file-cache');

describe('processFiles', () => {
  const fixturesPath = path.resolve(__dirname, '../fixtures/test-project');
  const tempGitignorePath = path.join(fixturesPath, '.gitignore');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should process files correctly', async () => {
    vi.mocked(FileCache.prototype.get).mockResolvedValue(null);
    vi.mocked(FileCache.prototype.set).mockResolvedValue();

    vi.mocked(fastGlob.stream).mockReturnValue(
      new Readable({
        read() {
          const files = ['src/main.js', 'src/utils.ts', 'package.json'];
          for (const file of files) {
            this.push(path.join(fixturesPath, file));
          }
          this.push(null);
        },
      }),
    );

    const mockFileInfo: FileInfo = {
      path: path.join(fixturesPath, 'src/main.js'),
      extension: 'js',
      language: 'javascript',
      size: 100,
      created: new Date(2023, 0, 1),
      modified: new Date(2023, 0, 1),
      content: 'mock content',
    };

    vi.mocked(Piscina.prototype.run).mockResolvedValue(mockFileInfo);

    const result = await processFiles({
      path: fixturesPath,
      gitignorePath: tempGitignorePath,
    });

    expect(result).toHaveLength(3);
    expect(result[0].path).toEqual(mockFileInfo.path);
    expect(result[1].path).toEqual(mockFileInfo.path);
    expect(result[2].path).toEqual(mockFileInfo.path);
    expect(result[0].content).toBe('mock content');
  });

  it('should respect custom ignore patterns', async () => {
    vi.mocked(fastGlob.stream).mockReturnValue(
      new Readable({
        read() {
          const files = ['src/main.js', 'src/utils.ts', 'package.json'];
          for (const file of files) {
            this.push(path.join(fixturesPath, file));
          }
          this.push(null);
        },
      }),
    );

    const mockFileInfos: { [key: string]: FileInfo } = {
      'src/main.js': {
        path: path.join(fixturesPath, 'src/main.js'),
        extension: 'js',
        language: 'javascript',
        size: 100,
        created: new Date(2023, 0, 1),
        modified: new Date(2023, 0, 1),
        content: 'mock content for main.js',
      },
      'src/utils.ts': {
        path: path.join(fixturesPath, 'src/utils.ts'),
        extension: 'ts',
        language: 'typescript',
        size: 100,
        created: new Date(2023, 0, 1),
        modified: new Date(2023, 0, 1),
        content: 'mock content for utils.ts',
      },
      'package.json': {
        path: path.join(fixturesPath, 'package.json'),
        extension: 'json',
        language: 'json',
        size: 100,
        created: new Date(2023, 0, 1),
        modified: new Date(2023, 0, 1),
        content: 'mock content for package.json',
      },
    };

    vi.mocked(Piscina.prototype.run).mockImplementation(
      async ({ filePath }) => {
        const relativePath = path.relative(fixturesPath, filePath);
        return mockFileInfos[relativePath];
      },
    );

    const result = await processFiles({
      path: fixturesPath,
      gitignorePath: tempGitignorePath,
      customIgnores: ['**/*.js'],
    });

    const jsFiles = result.filter((file) => file.extension === 'js');
    expect(jsFiles.length).toBe(0);
  });

  it('should use cache for unchanged files', async () => {
    const cachedFile: FileInfo = {
      path: path.join(fixturesPath, 'src/main.js'),
      extension: 'js',
      language: 'javascript',
      content: 'cached content',
      size: 50,
      created: new Date(2023, 0, 1),
      modified: new Date(2023, 0, 1),
    };

    vi.mocked(FileCache.prototype.get).mockImplementation((filePath) => {
      return filePath === cachedFile.path
        ? Promise.resolve(cachedFile)
        : Promise.resolve(null);
    });

    vi.mocked(fastGlob.stream).mockReturnValue(
      new Readable({
        read() {
          const files = ['src/main.js', 'src/utils.ts', 'package.json'];
          for (const file of files) {
            this.push(path.join(fixturesPath, file));
          }
          this.push(null);
        },
      }),
    );

    const mockFileInfos: { [key: string]: FileInfo } = {
      'src/main.js': cachedFile,
      'src/utils.ts': {
        path: path.join(fixturesPath, 'src/utils.ts'),
        extension: 'ts',
        language: 'typescript',
        size: 100,
        created: new Date(2023, 0, 1),
        modified: new Date(2023, 0, 1),
        content: 'mock content',
      },
      'package.json': {
        path: path.join(fixturesPath, 'package.json'),
        extension: 'json',
        language: 'json',
        size: 100,
        created: new Date(2023, 0, 1),
        modified: new Date(2023, 0, 1),
        content: 'mock content',
      },
    };

    vi.mocked(Piscina.prototype.run).mockImplementation(
      async ({ filePath }) => {
        const relativePath = path.relative(fixturesPath, filePath);
        return mockFileInfos[relativePath];
      },
    );

    const result = await processFiles({
      path: fixturesPath,
      gitignorePath: tempGitignorePath,
    });

    expect(result.length).toBe(3);
    const mainJsFile = result.find((file) => file.path === cachedFile.path);
    expect(mainJsFile).toEqual(cachedFile);

    expect(FileCache.prototype.get).toHaveBeenCalledTimes(3);
    expect(FileCache.prototype.set).toHaveBeenCalledTimes(2);
  });
});

```

## tests/unit/markdown-generator.test.ts

- Language: typescript
- Size: 3633 bytes
- Last modified: Thu Jul 11 2024 18:56:31 GMT+0200 (Central European Summer Time)

```typescript
import { describe, expect, it } from 'vitest';
import type { FileInfo } from '../../src/core/file-processor';
import { generateMarkdown } from '../../src/core/markdown-generator';

function decodeHTMLEntities(text: string): string {
  const entities: Record<string, string> = {
    '&quot;': '"',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
  };

  return text.replace(/&quot;|&amp;|&lt;|&gt;/g, (match) => entities[match]);
}

describe('Markdown Generator', () => {
  const mockFiles: FileInfo[] = [
    {
      path: '/project/src/index.ts',
      extension: 'ts',
      language: 'typescript',
      size: 100,
      created: new Date('2023-01-01'),
      modified: new Date('2023-01-02'),
      content: 'console.log("Hello, World!");',
    },
    {
      path: '/project/README.md',
      extension: 'md',
      language: 'markdown',
      size: 50,
      created: new Date('2023-01-01'),
      modified: new Date('2023-01-01'),
      content: '# Project README',
    },
  ];

  const defaultTemplate = `# Code Summary

{{tableOfContents files}}

## Files

{{#each files}}
## {{relativePath this.path}}

- Language: {{this.language}}
- Size: {{this.size}} bytes
- Last modified: {{this.modified}}

{{#codeblock this.content this.language}}{{/codeblock}}

{{/each}}`;

  const customTemplate = 'Custom template: {{files.length}} files';

  it('should generate markdown with default template', async () => {
    const result = await generateMarkdown(mockFiles, defaultTemplate);

    expect(result).toContain('# Code Summary');
    expect(result).toContain('Language: typescript');
    expect(result).toContain('Language: markdown');
    expect(result).toContain(
      '```typescript\nconsole.log("Hello, World!");\n```',
    );
    expect(result).toContain('```markdown\n# Project README\n```');
  });

  it('should use custom template when provided', async () => {
    const result = await generateMarkdown(mockFiles, customTemplate);

    expect(result).toBe('Custom template: 2 files');
  });

  it('should handle noCodeblock option', async () => {
    const template =
      '{{#each files}}{{#codeblock this.content this.language}}{{/codeblock}}{{/each}}';

    const resultWithCodeblock = await generateMarkdown(mockFiles, template);

    const resultWithoutCodeblock = await generateMarkdown(mockFiles, template, {
      noCodeblock: true,
    });

    expect(resultWithCodeblock).toContain('```typescript');
    expect(resultWithCodeblock).toContain('```markdown');
    expect(resultWithoutCodeblock).not.toContain('```typescript');
    expect(resultWithoutCodeblock).not.toContain('```markdown');
  });

  it('should include custom data in template context', async () => {
    const template = 'Custom data: {{customData.key}}';

    const result = await generateMarkdown(mockFiles, template, {
      customData: { key: 'value' },
    });

    expect(result).toBe('Custom data: value');
  });

  it('should use provided basePath for relative paths', async () => {
    const template = '{{#each files}}{{relativePath this.path}}{{/each}}';

    const result = await generateMarkdown(mockFiles, template, {
      basePath: '/project',
    });

    expect(result).toBe('src/index.tsREADME.md');
  });

  it('should handle errors when processing templates', async () => {
    // Intentionally use an invalid template to trigger helperMissing
    const invalidTemplate =
      '{{#each files}}{{invalidHelper this.content}}{{/each}}';

    const result = await generateMarkdown(mockFiles, invalidTemplate);

    expect(decodeHTMLEntities(result)).toContain(
      'Missing helper: "invalidHelper"',
    );
  });
});

```

## tests/utils/language-detector.test.ts

- Language: typescript
- Size: 1156 bytes
- Last modified: Fri Jul 12 2024 17:34:25 GMT+0200 (Central European Summer Time)

```typescript
import { describe, expect, it } from 'vitest';
import { detectLanguage } from '../../src/core/file-worker';

describe('language-detector', () => {
  it('should detect JavaScript', () => {
    expect(detectLanguage('file.js')).toBe('javascript');
  });

  it('should detect TypeScript', () => {
    expect(detectLanguage('file.ts')).toBe('typescript');
  });

  it('should detect Python', () => {
    expect(detectLanguage('script.py')).toBe('python');
  });

  it('should detect Ruby', () => {
    expect(detectLanguage('app.rb')).toBe('ruby');
  });

  it('should detect Java', () => {
    expect(detectLanguage('Main.java')).toBe('java');
  });

  it('should detect Go', () => {
    expect(detectLanguage('server.go')).toBe('go');
  });

  it('should detect Rust', () => {
    expect(detectLanguage('lib.rs')).toBe('rust');
  });

  it('should detect HTML', () => {
    expect(detectLanguage('index.html')).toBe('html');
  });

  it('should detect CSS', () => {
    expect(detectLanguage('styles.css')).toBe('css');
  });

  it('should return plaintext for unknown extensions', () => {
    expect(detectLanguage('file.xyz')).toBe('plaintext');
  });
});

```

## tests/vitest.setup.ts

- Language: typescript
- Size: 37 bytes
- Last modified: Thu Jul 11 2024 19:07:51 GMT+0200 (Central European Summer Time)

```typescript
import 'esbuild-register/dist/node';

```

## tsconfig.build.json

- Language: json
- Size: 200 bytes
- Last modified: Wed Jul 10 2024 10:17:51 GMT+0200 (Central European Summer Time)

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules"],
  "include": ["src/**/*.ts", "cli.js"],
  "compilerOptions": {
    "rootDir": "./",
    "outDir": "dist",
    "composite": false
  }
}

```

## tsconfig.json

- Language: json
- Size: 520 bytes
- Last modified: Fri Jul 12 2024 22:45:39 GMT+0200 (Central European Summer Time)

```json
{
  "compilerOptions": {
    "allowJs": true,
    "target": "ESNext",
    "lib": ["ESNext"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "strict": true,
    "strictNullChecks": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipDefaultLibCheck": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "forceConsistentCasingInFileNames": true,
    "types": ["inquirer-file-tree-selection-prompt"]
  },
  "include": ["src/**/*", "tests/**/*", "cli.js"]
}

```

## tsup.config.ts

- Language: typescript
- Size: 494 bytes
- Last modified: Fri Jul 12 2024 18:41:22 GMT+0200 (Central European Summer Time)

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'cli/index': 'src/cli/index.ts',
    'core/file-worker': 'src/core/file-worker.js',
    cli: 'cli.js',
  },
  format: ['esm'],
  splitting: false,
  clean: true,
  shims: true,
  name: 'codewhisper',
  tsconfig: 'tsconfig.build.json',
  publicDir: 'src/templates',
  dts: {
    entry: {
      'cli/index': 'src/cli/index.ts',
    },
  },
  esbuildOptions: (options) => {
    options.platform = 'node';
  },
});

```

## vitest.config.ts

- Language: typescript
- Size: 440 bytes
- Last modified: Fri Jul 12 2024 15:01:58 GMT+0200 (Central European Summer Time)

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    environment: 'node',
    globals: true,
    pool: 'threads',
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    //setupFiles: ['./tests/vitest.setup.ts'],
  },
});

```

