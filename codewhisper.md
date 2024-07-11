# Code Summary

- CONTRIBUTING.md
- cli.js
- LICENSE
- package.json
- pnpm-workspace.yaml
- tsconfig.build.json
- tsup.config.ts
- README.md
- vitest.config.ts
- tsconfig.json
- tests/vitest.setup.ts
- __mocks__/fs/promises.cjs
- .npmrc
- build.config.ts
- src/templates/generate-readme.hbs
- src/templates/codebase-summary.hbs
- lefthook.yml
- src/templates/generate-project-documentation.hbs
- src/templates/default.hbs
- src/templates/optimize-llm-prompt.hbs
- src/core/file-processor.ts
- src/core/file-worker.ts
- src/core/markdown-generator.ts
- src/cli/git-tools.ts
- src/cli/index.ts
- src/cli/interactive-filtering.ts
- src/templates/deep-code-review.hbs
- biome.json
- __mocks__/fs.cjs
- src/templates/security-focused-review.hbs
- tests/unit/markdown-generator.test.ts
- tests/e2e/cli-commands.test.ts
- tests/unit/file-processor.test.ts
- tests/fixtures/custom-template.hbs
- src/utils/gitignore-parser.ts
- src/utils/comment-stripper.ts
- tests/helpers/gitignore-helper.ts
- tests/integration/markdown-generation.test.ts
- tests/snapshot/markdown-output.test.ts
- tests/performance/file-processor.perf.test.ts
- src/utils/file-cache.ts
- tests/utils/language-detector.test.ts
- src/utils/language-detector.ts
- tests/fixtures/test-project/package.json
- tests/snapshot/__snapshots__/markdown-output.test.ts.snap
- tests/fixtures/test-project/src/main.js
- tests/fixtures/test-project/src/utils.ts

## Files

## CONTRIBUTING.md

- Language: markdown
- Size: 54 bytes
- Last modified: Tue Jul 09 2024 21:54:14 GMT+0200 (Central European Summer Time)

```markdown
Please refer to https://github.com/gmickel/contribute

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
- Size: 2528 bytes
- Last modified: Thu Jul 11 2024 13:28:23 GMT+0200 (Central European Summer Time)

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
  "keywords": [
    "code",
    "ai",
    "prompt",
    "git"
  ],
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
      "*": [
        "./dist/*",
        "./dist/cli/index.d.ts"
      ]
    }
  },
  "bin": {
    "codewhisper": "./dist/cli.js"
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
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
    "chalk": "5.3.0",
    "commander": "12.1.0",
    "fast-glob": "3.3.2",
    "fs-extra": "11.2.0",
    "handlebars": "4.7.8",
    "ignore": "5.3.1",
    "inquirer": "10.0.1",
    "isbinaryfile": "5.0.2",
    "ora": "8.0.1",
    "piscina": "4.6.1",
    "simple-git": "3.25.0",
    "strip-comments": "2.0.1"
  },
  "devDependencies": {
    "@antfu/utils": "0.7.10",
    "@biomejs/biome": "1.8.3",
    "@types/fs-extra": "11.0.4",
    "@types/node": "20.14.10",
    "@types/strip-comments": "2.0.4",
    "@vitest/coverage-v8": "2.0.2",
    "@vitest/ui": "2.0.2",
    "bumpp": "9.4.1",
    "cpx": "1.5.0",
    "esno": "4.7.0",
    "lefthook": "1.7.2",
    "memfs": "^4.9.3",
    "tsup": "8.1.0",
    "typescript": "5.5.3",
    "vite": "5.3.3",
    "vitest": "2.0.2"
  },
  "packageManager": "pnpm@9.5.0",
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "trustedDependencies": [
    "@biomejs/biome",
    "lefthook"
  ]
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

## tsup.config.ts

- Language: typescript
- Size: 434 bytes
- Last modified: Wed Jul 10 2024 10:22:45 GMT+0200 (Central European Summer Time)

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'cli/index': 'src/cli/index.ts',
    'core/file-worker': 'src/core/file-worker.ts',
    cli: 'cli.js',
  },
  format: ['esm'],
  splitting: false,
  clean: true,
  shims: true,
  dts: true,
  name: 'codewhisper',
  tsconfig: 'tsconfig.build.json',
  publicDir: 'src/templates',
  esbuildOptions: (options) => {
    options.platform = 'node';
  },
});

```

## README.md

- Language: markdown
- Size: 1475 bytes
- Last modified: Tue Jul 09 2024 23:12:12 GMT+0200 (Central European Summer Time)

```markdown
# code-whisper

add blazing fast AI-friendly prompts to your codebase

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![JSDocs][jsdocs-src]][jsdocs-href]
[![License][license-src]][license-href]

_description_

## Sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/gmickel/static/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/gmickel/static/sponsors.svg'/>
  </a>
</p>

## License

[MIT](./LICENSE) License © 2024-PRESENT [Gordon Mickel](https://github.com/gmickel)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/code-whisper?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/code-whisper
[npm-downloads-src]: https://img.shields.io/npm/dm/code-whisper?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/code-whisper
[bundle-src]: https://img.shields.io/bundlephobia/minzip/code-whisper?style=flat&colorA=080f12&colorB=1fa669&label=minzip
[bundle-href]: https://bundlephobia.com/result?p=code-whisper
[license-src]: https://img.shields.io/github/license/gmickel/code-whisper.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/gmickel/code-whisper/blob/main/LICENSE
[jsdocs-src]: https://img.shields.io/badge/jsdocs-reference-080f12?style=flat&colorA=080f12&colorB=1fa669
[jsdocs-href]: https://www.jsdocs.io/package/code-whisper

```

## vitest.config.ts

- Language: typescript
- Size: 417 bytes
- Last modified: Wed Jul 10 2024 23:33:21 GMT+0200 (Central European Summer Time)

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    environment: 'node',
    globals: true,
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    setupFiles: ['./tests/vitest.setup.ts'],
  },
});

```

## tsconfig.json

- Language: json
- Size: 445 bytes
- Last modified: Wed Jul 10 2024 23:24:04 GMT+0200 (Central European Summer Time)

```json
{
  "compilerOptions": {
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
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*", "tests/**/*", "cli.js"]
}

```

## tests/vitest.setup.ts

- Language: typescript
- Size: 0 bytes
- Last modified: Wed Jul 10 2024 23:44:42 GMT+0200 (Central European Summer Time)

```typescript

```

## __mocks__/fs/promises.cjs

- Language: plaintext
- Size: 54 bytes
- Last modified: Thu Jul 11 2024 17:19:48 GMT+0200 (Central European Summer Time)

```plaintext
const { fs } = require('memfs');
module.exports = fs;

```

## .npmrc

- Language: plaintext
- Size: 53 bytes
- Last modified: Mon Jul 08 2024 18:42:50 GMT+0200 (Central European Summer Time)

```plaintext
ignore-workspace-root-check=true
shell-emulator=true

```

## build.config.ts

- Language: typescript
- Size: 807 bytes
- Last modified: Wed Jul 10 2024 10:09:54 GMT+0200 (Central European Summer Time)

```typescript
import {
  type BuildEntry,
  type MkdistBuildEntry,
  defineBuildConfig,
} from 'unbuild';

function dualOutput(
  config: Omit<MkdistBuildEntry, 'builder' | 'format'>,
): BuildEntry[] {
  return [
    {
      builder: 'mkdist',
      format: 'esm',
      ...config,
      pattern: '**/!(*.stories).{js,jsx,ts,tsx}',
    },
    {
      builder: 'mkdist',
      format: 'cjs',
      ...config,
      pattern: '**/!(*.stories).{js,jsx,ts,tsx}',
    },
  ];
}

export default defineBuildConfig({
  entries: [
    './src/cli/index',
    ...dualOutput({
      input: './src/cli/index',
      outDir: './dist',
    }),
    ...dualOutput({
      input: './src/core/file-worker',
      outDir: './dist',
    }),
  ],
  declaration: true,
  clean: true,
  rollup: {
    emitCJS: true,
  },
  failOnWarn: false,
});

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

## src/core/file-processor.ts

- Language: typescript
- Size: 4593 bytes
- Last modified: Thu Jul 11 2024 12:56:34 GMT+0200 (Central European Summer Time)

```typescript
import os from 'node:os';
import path from 'node:path';
import fastGlob from 'fast-glob';
import fs from 'fs-extra';
import ignore from 'ignore';
import { isBinaryFile } from 'isbinaryfile';
import { FileCache } from '../utils/file-cache';
import Piscina from 'piscina';

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

const isDist = path
  .dirname(new URL(import.meta.url).pathname)
  .includes('/dist/');
const workerFilename = `file-worker.${isDist ? 'js' : 'ts'}`;
const workerFilePath = new URL(
  isDist ? path.join('../core', workerFilename) : workerFilename,
  import.meta.url,
).href;

const pool = new Piscina({ filename: workerFilePath });

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
  '**/.DS_Store',

  // Logs
  '**/logs',
  '**/*.log',
  '**/npm-debug.log*',
  '**/yarn-debug.log*',
  '**/yarn-error.log*',

  // OS generated files
  '**/.DS_Store',
  '**/.DS_Store?',
  '**/._*',
  '**/.Spotlight-V100',
  '**/.Trashes',
  '**/ehthumbs.db',
  '**/Thumbs.db',

  // Test coverage
  '**/coverage',
  '**/.nyc_output',

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
  const tasks: Promise<void>[] = [];

  const globStream = fastGlob.stream('**/*', globOptions);

  return new Promise((resolve, reject) => {
    globStream.on('data', (filePath) => {
      tasks.push(
        (async () => {
          const filePathStr = filePath.toString();
          const relativePath = path.relative(basePath, filePathStr);

          if (ig.ignores(relativePath)) return;

          if (
            filter.length > 0 &&
            !filter.some((pattern) => new RegExp(pattern).test(filePathStr))
          )
            return;

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
      await Promise.all(tasks);
      resolve(fileInfos);
    });

    globStream.on('error', reject);
  });
}

export const testExports = {
  pool,
};

```

## src/core/file-worker.ts

- Language: typescript
- Size: 1039 bytes
- Last modified: Thu Jul 11 2024 10:14:15 GMT+0200 (Central European Summer Time)

```typescript
import fs from 'fs-extra';
import { isBinaryFile } from 'isbinaryfile';
import { stripComments } from '../utils/comment-stripper';
import { detectLanguage } from '../utils/language-detector';

interface WorkerData {
  filePath: string;
  suppressComments: boolean;
}

export default async function processFile({
  filePath,
  suppressComments,
}: WorkerData) {
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
- Size: 2702 bytes
- Last modified: Thu Jul 11 2024 17:56:19 GMT+0200 (Central European Summer Time)

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
- Size: 4915 bytes
- Last modified: Thu Jul 11 2024 17:50:15 GMT+0200 (Central European Summer Time)

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
- Size: 574 bytes
- Last modified: Tue Jul 09 2024 11:07:40 GMT+0200 (Central European Summer Time)

```typescript
import inquirer from 'inquirer';
import type { FileInfo } from '../core/file-processor';

export async function interactiveFiltering(
  files: FileInfo[],
): Promise<FileInfo[]> {
  const { selectedFiles } = await inquirer.prompt<{
    selectedFiles: FileInfo[];
  }>([
    {
      type: 'checkbox',
      name: 'selectedFiles',
      message: 'Select files to include:',
      choices: files.map((file) => ({
        name: `${file.path} (${file.language})`,
        value: file,
        checked: true,
      })),
      pageSize: 20,
    },
  ]);

  return selectedFiles;
}

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

## __mocks__/fs.cjs

- Language: plaintext
- Size: 54 bytes
- Last modified: Thu Jul 11 2024 17:19:12 GMT+0200 (Central European Summer Time)

```plaintext
const { fs } = require('memfs');
module.exports = fs;

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

## tests/unit/markdown-generator.test.ts

- Language: typescript
- Size: 3686 bytes
- Last modified: Thu Jul 11 2024 17:56:28 GMT+0200 (Central European Summer Time)

```typescript
// tests/unit/markdown-generator.test.ts
import { describe, beforeEach, expect, it } from 'vitest';
import { generateMarkdown } from '../../src/core/markdown-generator';
import type { FileInfo } from '../../src/core/file-processor';

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

## tests/e2e/cli-commands.test.ts

- Language: typescript
- Size: 1622 bytes
- Last modified: Thu Jul 11 2024 09:21:30 GMT+0200 (Central European Summer Time)

```typescript
import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'fs-extra';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  removeTemporaryGitignore,
  setupTemporaryGitignore,
} from '../helpers/gitignore-helper';

const __dirname = new URL('.', import.meta.url).pathname;
const resolvePath = (pathname: string) =>
  new URL(pathname, import.meta.url).pathname;

describe('CLI Commands', () => {
  const cliPath = resolvePath('../../cli.js');
  const testProjectPath = path.resolve(__dirname, '../fixtures/test-project');
  const outputPath = path.join(testProjectPath, 'output.md');
  let tempGitignorePath: string;

  beforeAll(async () => {
    tempGitignorePath = await setupTemporaryGitignore(
      testProjectPath,
      '*.log\nnode_modules/\n',
    );
  });

  afterAll(async () => {
    await removeTemporaryGitignore(tempGitignorePath);
    if (await fs.pathExists(outputPath)) {
      await fs.remove(outputPath);
    }
  });

  it('should generate markdown file with default options', () => {
    execSync(
      `pnpm exec esno ${cliPath} generate -p ${testProjectPath} -o ${outputPath} -g ${tempGitignorePath}`,
      { stdio: 'inherit' },
    );

    const output = fs.readFileSync(outputPath, 'utf-8');
    expect(output).toContain('# Code Summary');
    expect(output).toContain('## Files');
    expect(output).toContain('src/main.js');
    expect(output).toContain('src/utils.ts');
    expect(output).toContain('package.json');
    expect(output).not.toContain('*.log'); // This should be ignored
  });

  // Add more test cases as needed
});

```

## tests/unit/file-processor.test.ts

- Language: typescript
- Size: 5763 bytes
- Last modified: Thu Jul 11 2024 12:52:55 GMT+0200 (Central European Summer Time)

```typescript
import path from 'node:path';
import { Readable } from 'node:stream';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import fastGlob from 'fast-glob';
import Piscina from 'piscina';
import { processFiles, type FileInfo } from '../../src/core/file-processor';
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

## tests/fixtures/custom-template.hbs

- Language: plaintext
- Size: 659 bytes
- Last modified: Thu Jul 11 2024 14:16:29 GMT+0200 (Central European Summer Time)

```plaintext
# Custom Template: {{#if customData.title}}{{customData.title}}{{else}}Untitled Project{{/if}}

## Project Overview

This project contains {{files.length}} file(s).

## File Listing

{{#each files}}
### {{this.path}}

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

## Generated on: {{now}}

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
- Size: 4983 bytes
- Last modified: Thu Jul 11 2024 14:17:09 GMT+0200 (Central European Summer Time)

```typescript
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { generateMarkdown } from '../../src/core/markdown-generator';
import type { FileInfo } from '../../src/core/file-processor';

describe('Markdown Generation Integration', () => {
  const fixturesPath = path.resolve(__dirname, '../fixtures');
  const customTemplatePath = path.join(fixturesPath, 'custom-template.hbs');

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
    const result = await generateMarkdown(mockFiles, { basePath: '/project' });

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
    const result = await generateMarkdown(mockFiles, {
      template: customTemplatePath,
      customData: { title: 'Test Project', version: '1.0.0' },
    });

    expect(result).toContain('# Custom Template: Test Project');
    expect(result).toContain('## Project Overview');
    expect(result).toContain('This project contains 2 file(s).');
    expect(result).toContain('## File Listing');
    expect(result).toContain('### /project/src/index.ts');
    expect(result).toContain('### /project/README.md');
    expect(result).toContain('- **Language:** typescript');
    expect(result).toContain('- **Language:** markdown');
    expect(result).toContain('- **Size:** 100 bytes');
    expect(result).toContain('- **Size:** 50 bytes');
    expect(result).toContain('- **Last Modified:**');
    expect(result).toContain('#### Content Preview:');
    expect(result).toContain(
      '```typescript\nconsole.log(&quot;Hello, World!&quot;);\n```',
    );
    expect(result).toContain('```markdown\n# Project README\n```');
    expect(result).toContain('## Custom Data');
    expect(result).toContain('Custom data provided:');
    expect(result).toContain('- title: Test Project');
    expect(result).toContain('- version: 1.0.0');
    expect(result).toContain('## Generated on:');
  });

  it('should include custom data in template context', async () => {
    const result = await generateMarkdown(mockFiles, {
      template: customTemplatePath,
      customData: { key: 'value', another: 'data point' },
    });

    expect(result).toContain('## Custom Data');
    expect(result).toContain('Custom data provided:');
    expect(result).toContain('- key: value');
    expect(result).toContain('- another: data point');
  });

  it('should handle case when no custom data is provided', async () => {
    const result = await generateMarkdown(mockFiles, {
      template: customTemplatePath,
    });

    expect(result).toContain('# Custom Template: Untitled Project');
    expect(result).toContain('## Custom Data');
    expect(result).toContain('No custom data provided.');
    expect(result).not.toContain('Custom data provided:');
  });

  it('should handle case when empty custom data object is provided', async () => {
    const result = await generateMarkdown(mockFiles, {
      template: customTemplatePath,
      customData: {},
    });

    expect(result).toContain('# Custom Template: Untitled Project');
    expect(result).toContain('## Custom Data');
    expect(result).toContain('No custom data provided.');
    expect(result).not.toContain('Custom data provided:');
  });

  it('should handle case when custom data is provided', async () => {
    const result = await generateMarkdown(mockFiles, {
      template: customTemplatePath,
      customData: { title: 'My Project', version: '1.0.0' },
    });

    expect(result).toContain('# Custom Template: My Project');
    expect(result).toContain('## Custom Data');
    expect(result).toContain('Custom data provided:');
    expect(result).toContain('- title: My Project');
    expect(result).toContain('- version: 1.0.0');
  });

  it('should handle errors when reading non-existent template file', async () => {
    const nonExistentPath = path.join(
      fixturesPath,
      'non-existent-template.hbs',
    );
    await expect(
      generateMarkdown(mockFiles, { template: nonExistentPath }),
    ).rejects.toThrow();
  });
});

```

## tests/snapshot/markdown-output.test.ts

- Language: typescript
- Size: 611 bytes
- Last modified: Wed Jul 10 2024 08:59:05 GMT+0200 (Central European Summer Time)

```typescript
import { describe, expect, it } from 'vitest';
import { processFiles } from '../../src/core/file-processor';
import { generateMarkdown } from '../../src/core/markdown-generator';

const joinPath = (pathname: string) =>
  new URL(pathname, import.meta.url).pathname;

describe('Markdown Output', () => {
  it('should match snapshot for default template', async () => {
    const testDir = joinPath('../fixtures/test-project');
    const files = await processFiles({ path: testDir });
    const markdown = await generateMarkdown(files, { template: 'default' });

    expect(markdown).toMatchSnapshot();
  });
});

```

## tests/performance/file-processor.perf.test.ts

- Language: typescript
- Size: 1963 bytes
- Last modified: Thu Jul 11 2024 13:19:21 GMT+0200 (Central European Summer Time)

```typescript
import path from 'node:path';
import fs from 'fs-extra';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { processFiles } from '../../src/core/file-processor';

const resolvePath = (pathname: string) =>
  new URL(pathname, import.meta.url).pathname;

describe('File Processor Performance', () => {
  const largePath = resolvePath('../fixtures/large-project');

  // Helper function to create a large project structure
  async function createLargeProject() {
    await fs.ensureDir(largePath);
    for (let i = 0; i < 1000; i++) {
      const content = `console.log('File ${i}');\n`.repeat(100);
      await fs.writeFile(path.join(largePath, `file${i}.js`), content);
    }
  }

  beforeAll(async () => {
    await createLargeProject();
  });

  // Clean up after tests
  afterAll(async () => {
    await fs.remove(largePath);
  });

  it('should process a large number of files efficiently', async () => {
    const start = performance.now();
    const result = await processFiles({ path: largePath });
    const end = performance.now();

    expect(result.length).toBe(1000);
    console.log(`Processed 1000 files in ${end - start} ms`);
    // You might want to add an assertion here to ensure it completes within a certain time
    // expect(end - start).toBeLessThan(5000); // Should complete in less than 5 seconds, for example
  });

  it('should be faster on subsequent runs due to caching', async () => {
    const firstRun = performance.now();
    await processFiles({ path: largePath });
    const firstEnd = performance.now();

    const secondRun = performance.now();
    await processFiles({ path: largePath });
    const secondEnd = performance.now();

    const firstDuration = firstEnd - firstRun;
    const secondDuration = secondEnd - secondRun;

    console.log(`First run: ${firstDuration} ms`);
    console.log(`Second run: ${secondDuration} ms`);

    expect(secondDuration).toBeLessThan(firstDuration);
  });
});

```

## src/utils/file-cache.ts

- Language: typescript
- Size: 2191 bytes
- Last modified: Tue Jul 09 2024 23:48:19 GMT+0200 (Central European Summer Time)

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

  constructor(cacheFilePath: string) {
    this.cacheFile = cacheFilePath;
    this.loadCache();
  }

  private async loadCache() {
    try {
      if (await fs.pathExists(this.cacheFile)) {
        const content = await fs.readFile(this.cacheFile, 'utf-8');
        this.cache = JSON.parse(content);
      }
    } catch (error) {
      console.warn(`Failed to load cache from ${this.cacheFile}:`, error);
      this.cache = {};
    }
  }

  private async saveCache() {
    if (!this.isDirty) return;

    try {
      await fs.ensureDir(path.dirname(this.cacheFile));
      await fs.writeFile(this.cacheFile, JSON.stringify(this.cache), 'utf-8');
      this.isDirty = false;
    } catch (error) {
      console.error(`Failed to save cache to ${this.cacheFile}:`, error);
    }
  }

  async get(filePath: string): Promise<FileInfo | null> {
    try {
      const stats = await fs.stat(filePath);
      const currentHash = this.hashFile(stats);

      if (this.cache[filePath] && this.cache[filePath].hash === currentHash) {
        return this.cache[filePath].data;
      }
    } catch (error) {
      console.warn(`Failed to get cache entry for ${filePath}:`, error);
    }

    return null;
  }

  async set(filePath: string, data: FileInfo): Promise<void> {
    try {
      const stats = await fs.stat(filePath);
      const hash = this.hashFile(stats);

      this.cache[filePath] = { hash, data };
      this.isDirty = true;
      await this.saveCache();
    } catch (error) {
      console.error(`Failed to set cache entry for ${filePath}:`, error);
    }
  }

  private hashFile(stats: fs.Stats): string {
    return crypto
      .createHash('md5')
      .update(`${stats.size}-${stats.mtime.getTime()}`)
      .digest('hex');
  }

  async clear(): Promise<void> {
    this.cache = {};
    this.isDirty = true;
    await this.saveCache();
  }
}

```

## tests/utils/language-detector.test.ts

- Language: typescript
- Size: 1163 bytes
- Last modified: Tue Jul 09 2024 11:07:40 GMT+0200 (Central European Summer Time)

```typescript
import { describe, expect, it } from 'vitest';
import { detectLanguage } from '../../src/utils/language-detector';

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

## tests/fixtures/test-project/package.json

- Language: json
- Size: 51 bytes
- Last modified: 2024-07-10T21:40:47.688Z

```json
{
  "name": "test-project",
  "version": "1.0.0"
}

```

## tests/snapshot/__snapshots__/markdown-output.test.ts.snap

- Language: plaintext
- Size: 1208 bytes
- Last modified: 2024-07-09T20:42:15.265Z

```plaintext
// Vitest Snapshot v1, https://vitest.dev/guide/snapshot.html

exports[`Markdown Output > should match snapshot for default template 1`] = `
"# Code Summary

- /Users/gordon/work/CodeWhisper/tests/fixtures/test-project/package.json
- /Users/gordon/work/CodeWhisper/tests/fixtures/test-project/src/utils.ts
- /Users/gordon/work/CodeWhisper/tests/fixtures/test-project/src/main.js

## Files

## /Users/gordon/work/CodeWhisper/tests/fixtures/test-project/package.json

- Language: json
- Size: 51 bytes
- Last modified: Tue Jul 09 2024 22:40:41 GMT+0200 (Central European Summer Time)

\`\`\`json
{
  "name": "test-project",
  "version": "1.0.0"
}

\`\`\`

## /Users/gordon/work/CodeWhisper/tests/fixtures/test-project/src/utils.ts

- Language: typescript
- Size: 70 bytes
- Last modified: Tue Jul 09 2024 22:40:30 GMT+0200 (Central European Summer Time)

\`\`\`typescript
export function add(a: number, b: number): number {
  return a + b;
}

\`\`\`

## /Users/gordon/work/CodeWhisper/tests/fixtures/test-project/src/main.js

- Language: javascript
- Size: 30 bytes
- Last modified: Tue Jul 09 2024 22:40:24 GMT+0200 (Central European Summer Time)

\`\`\`javascript
console.log('Hello, World!');

\`\`\`

"
`;

```

## tests/fixtures/test-project/src/main.js

- Language: javascript
- Size: 30 bytes
- Last modified: 2024-07-10T21:40:47.688Z

```javascript
console.log('Hello, World!');

```

## tests/fixtures/test-project/src/utils.ts

- Language: typescript
- Size: 70 bytes
- Last modified: 2024-07-10T21:40:47.688Z

```typescript
export function add(a: number, b: number): number {
  return a + b;
}

```

