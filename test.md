# Code Summary

- vitest.config.ts
- tsconfig.json
- test.md
- package.json
- lefthook.yml
- build.config.ts
- biome.json
- README.md
- LICENSE
- CONTRIBUTING.md
- .npmrc
- .gitignore
- .github/FUNDING.yml
- test/utils/language-detector.test.ts
- src/utils/language-detector.ts
- src/utils/gitignore-parser.ts
- src/utils/comment-stripper.ts
- src/templates/security-focused-review.hbs
- src/templates/optimize-llm-prompt.hbs
- src/templates/generate-readme.hbs
- src/templates/generate-project-documentation.hbs
- src/templates/default.hbs
- src/templates/deep-code-review.hbs
- src/templates/codebase-summary.hbs
- src/core/markdown-generator.ts
- src/core/file-processor.ts
- src/cli/interactive-filtering.ts
- src/cli/index.ts
- src/cli/git-tools.ts
- .github/workflows/release.yml
- .github/workflows/ci.yml

## Files

## vitest.config.ts

- Language: typescript
- Size: 346 bytes
- Last modified: Tue Jul 09 2024 09:21:14 GMT+0200 (Central European Summer Time)

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/tests/e2e/**'],
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});

```

## tsconfig.json

- Language: json
- Size: 394 bytes
- Last modified: Mon Jul 08 2024 21:40:27 GMT+0200 (Central European Summer Time)

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
  }
}

```

## test.md

- Language: markdown
- Size: 0 bytes
- Last modified: Tue Jul 09 2024 21:46:21 GMT+0200 (Central European Summer Time)

```markdown

```

## package.json

- Language: json
- Size: 2258 bytes
- Last modified: Tue Jul 09 2024 21:21:58 GMT+0200 (Central European Summer Time)

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
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    }
  },
  "main": "./dist/index.mjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "typesVersions": {
    "*": {
      "*": ["./dist/*", "./dist/index.d.ts"]
    }
  },
  "bin": {
    "codewhisper": "./dist/cli/index.mjs"
  },
  "files": ["dist"],
  "scripts": {
    "build": "unbuild",
    "lint": "biome check .",
    "lint:fix": "biome check . --write",
    "prepublishOnly": "nr build",
    "release": "bumpp && npm publish",
    "start": "esno src/cli/index.ts",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "typecheck": "tsc --noEmit",
    "prepare": "lefthook install"
  },
  "dependencies": {
    "chalk": "5.3.0",
    "commander": "12.1.0",
    "fs-extra": "11.2.0",
    "glob": "11.0.0",
    "handlebars": "4.7.8",
    "ignore": "5.3.1",
    "inquirer": "10.0.1",
    "isbinaryfile": "^5.0.2",
    "minimatch": "10.0.1",
    "ora": "8.0.1",
    "simple-git": "3.25.0",
    "strip-comments": "2.0.1"
  },
  "devDependencies": {
    "@antfu/utils": "0.7.10",
    "@biomejs/biome": "1.8.3",
    "@types/fs-extra": "11.0.4",
    "@types/node": "20.14.10",
    "@types/strip-comments": "2.0.4",
    "@vitest/coverage-v8": "2.0.1",
    "@vitest/ui": "2.0.1",
    "bumpp": "9.4.1",
    "eslint": "9.6.0",
    "esno": "4.7.0",
    "lefthook": "1.7.1",
    "rimraf": "6.0.0",
    "typescript": "5.5.3",
    "unbuild": "2.0.0",
    "vite": "5.3.3",
    "vitest": "2.0.1"
  },
  "packageManager": "bun@1.1.17",
  "workspaces": ["apps/*", "packages/*"],
  "trustedDependencies": ["@biomejs/biome", "lefthook"]
}

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

## build.config.ts

- Language: typescript
- Size: 183 bytes
- Last modified: Tue Jul 09 2024 11:07:40 GMT+0200 (Central European Summer Time)

```typescript
import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  entries: ['src/index'],
  declaration: true,
  clean: true,
  rollup: {
    emitCJS: true,
  },
});

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

## README.md

- Language: markdown
- Size: 1420 bytes
- Last modified: Tue Jul 09 2024 11:07:14 GMT+0200 (Central European Summer Time)

```markdown
# code-whisper

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

## CONTRIBUTING.md

- Language: markdown
- Size: 0 bytes
- Last modified: Mon Jul 08 2024 18:44:53 GMT+0200 (Central European Summer Time)

```markdown

```

## .npmrc

- Language: plaintext
- Size: 53 bytes
- Last modified: Mon Jul 08 2024 18:42:50 GMT+0200 (Central European Summer Time)

```plaintext
ignore-workspace-root-check=true
shell-emulator=true

```

## .gitignore

- Language: plaintext
- Size: 2347 bytes
- Last modified: Tue Jul 09 2024 21:11:31 GMT+0200 (Central European Summer Time)

```plaintext
# Created by https://www.toptal.com/developers/gitignore/api/node
# Edit at https://www.toptal.com/developers/gitignore?templates=node

### Node ###
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*
.pnpm-debug.log*


# Diagnostic reports (https://nodejs.org/api/report.html)
report.[0-9]*.[0-9]*.[0-9]*.[0-9]*.json

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Directory for instrumented libs generated by jscoverage/JSCover
lib-cov

# Coverage directory used by tools like istanbul
coverage
*.lcov

# nyc test coverage
.nyc_output

# Grunt intermediate storage (https://gruntjs.com/creating-plugins#storing-task-files)
.grunt

# Bower dependency directory (https://bower.io/)
bower_components

# node-waf configuration
.lock-wscript

# Compiled binary addons (https://nodejs.org/api/addons.html)
build/Release

# Dependency directories
node_modules/
jspm_packages/

# Snowpack dependency directory (https://snowpack.dev/)
web_modules/

# TypeScript cache
*.tsbuildinfo

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Optional stylelint cache
.stylelintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variable files
.env
.env.development.local
.env.test.local
.env.production.local
.env.local

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# Next.js build output
.next
out

# Nuxt.js build / generate output
.nuxt
dist

# Gatsby files
.cache/
# Comment in the public line in if your project uses Gatsby and not Next.js
# https://nextjs.org/blog/next-9-1#public-directory-support
# public

# vuepress build output
.vuepress/dist

# vuepress v2.x temp and cache directory
.temp

# Docusaurus cache and generated files
.docusaurus

# Serverless directories
.serverless/

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port

# Stores VSCode versions used for testing VSCode extensions
.vscode-test

# yarn v2
.yarn/cache
.yarn/unplugged
.yarn/build-state.yml
.yarn/install-state.gz
.pnp.*

### Node Patch ###
# Serverless Webpack directories
.webpack/

# Optional stylelint cache

# SvelteKit build / generate output
.svelte-kit

CodeWhisper.xml

```

## .github/FUNDING.yml

- Language: yaml
- Size: 42 bytes
- Last modified: Mon Jul 08 2024 18:44:19 GMT+0200 (Central European Summer Time)

```yaml
github: [gmickel]
opencollective: gmickel

```

## test/utils/language-detector.test.ts

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

## src/templates/security-focused-review.hbs

- Language: plaintext
- Size: 1676 bytes
- Last modified: Tue Jul 09 2024 11:51:05 GMT+0200 (Central European Summer Time)

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
### {{this.path}}

```{{this.language}}
{{this.content}}
{{/each}}
</code>

</codebase> ```

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

## src/templates/generate-readme.hbs

- Language: plaintext
- Size: 3042 bytes
- Last modified: Tue Jul 09 2024 13:19:40 GMT+0200 (Central European Summer Time)

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
### `{{this.path}}`

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

## src/templates/generate-project-documentation.hbs

- Language: plaintext
- Size: 1546 bytes
- Last modified: Tue Jul 09 2024 11:51:53 GMT+0200 (Central European Summer Time)

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
### {{this.path}}

```{{this.language}}
{{this.content}}
{{/each}}
</code>

</codebase> ```

```

## src/templates/default.hbs

- Language: plaintext
- Size: 248 bytes
- Last modified: Tue Jul 09 2024 21:44:46 GMT+0200 (Central European Summer Time)

```plaintext
# Code Summary

{{tableOfContents files}}

## Files

{{#each files}}
## {{this.path}}

- Language: {{this.language}}
- Size: {{this.size}} bytes
- Last modified: {{this.modified}}

{{#codeblock this.content this.language}}{{/codeblock}}

{{/each}}

```

## src/templates/deep-code-review.hbs

- Language: plaintext
- Size: 2002 bytes
- Last modified: Tue Jul 09 2024 11:42:28 GMT+0200 (Central European Summer Time)

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
### {{this.path}}

```{{this.language}}
{{this.content}}
{{/each}}
</code>

</codebase> ```

```

## src/templates/codebase-summary.hbs

- Language: plaintext
- Size: 1239 bytes
- Last modified: Tue Jul 09 2024 21:42:24 GMT+0200 (Central European Summer Time)

```plaintext
# Comprehensive Codebase Analysis

## Project Overview

Analyze the following codebase summary, focusing on its structure, main components, and potential areas of interest.
Provide insights on the overall architecture and design patterns used.

## File Structure

{{tableOfContents files}}

## Detailed Code Analysis

{{#each files}}
### File: {{this.path}}

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

## src/core/markdown-generator.ts

- Language: typescript
- Size: 2101 bytes
- Last modified: Tue Jul 09 2024 21:12:36 GMT+0200 (Central European Summer Time)

```typescript
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';
import Handlebars from 'handlebars';
import type { FileInfo } from './file-processor';

interface MarkdownOptions {
  template?: string;
  noCodeblock?: boolean;
  customData?: Record<string, unknown>;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function generateMarkdown(
  files: FileInfo[],
  options: MarkdownOptions = {},
): Promise<string> {
  const {
    template = 'generate-readme',
    noCodeblock = false,
    customData = {},
  } = options;

  let templatePath: string;
  if (
    path.isAbsolute(template) ||
    template.startsWith('./') ||
    template.startsWith('../')
  ) {
    templatePath = template;
  } else {
    templatePath = path.join(__dirname, '..', 'templates', `${template}.hbs`);
  }

  const templateContent = await fs.readFile(templatePath, 'utf-8');
  const compiledTemplate = Handlebars.compile(templateContent);

  registerHandlebarsHelpers(noCodeblock);

  const data = {
    files,
    ...customData,
  };

  return compiledTemplate(data);
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

  Handlebars.registerHelper('lineNumbers', (content: string) => {
    const lines = content.split('\n');
    const numberedLines = lines.map((line, index) => `${index + 1} | ${line}`);
    return new Handlebars.SafeString(numberedLines.join('\n'));
  });

  Handlebars.registerHelper('tableOfContents', (files: FileInfo[]) => {
    const toc = files.map((file) => `- ${file.path}`).join('\n');
    return new Handlebars.SafeString(toc);
  });

  Handlebars.registerHelper(
    'fileInfo',
    (file: FileInfo) =>
      new Handlebars.SafeString(`
- Language: ${file.language}
- Size: ${file.size} bytes
- Last modified: ${file.modified}
    `),
  );
}

```

## src/core/file-processor.ts

- Language: typescript
- Size: 3207 bytes
- Last modified: Tue Jul 09 2024 21:17:02 GMT+0200 (Central European Summer Time)

```typescript
import path from 'node:path';
import fs from 'fs-extra';
import { glob } from 'glob';
import ignore from 'ignore';
import isbinaryfile from 'isbinaryfile';
import { detectLanguage } from '../utils/language-detector';

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
}

const DEFAULT_IGNORES = [
  // Version control
  '.git',
  '.svn',
  '.hg',

  // Package manager files
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'bun.lockb',

  // Other package managers (examples)
  'Gemfile.lock', // Ruby
  'Cargo.lock', // Rust
  'poetry.lock', // Python
  'composer.lock', // PHP

  // Build outputs and caches
  'node_modules',
  'dist',
  'build',
  '.cache',

  // IDE and editor files
  '.vscode',
  '.idea',
  '*.swp',
  '*.swo',
  '.DS_Store',
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
  } = options;

  const ig = ignore();

  // Add default ignores
  ig.add(DEFAULT_IGNORES);

  // Add custom ignores
  ig.add(customIgnores);

  // Add .gitignore patterns
  if (await fs.pathExists(gitignorePath)) {
    const gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');
    ig.add(gitignoreContent);
  }

  const globOptions = {
    nocase: !caseSensitive,
    ignore: exclude,
    dot: true, // Include dotfiles
  };

  const filePaths = await glob(path.join(basePath, '**', '*'), globOptions);

  const fileInfos: FileInfo[] = (
    await Promise.all(
      filePaths
        .filter((filePath) => !ig.ignores(path.relative(basePath, filePath)))
        .map(async (filePath) => {
          try {
            const stats = await fs.stat(filePath);

            if (!stats.isFile()) {
              return null;
            }

            const buffer = await fs.readFile(filePath);
            if (await isbinaryfile.isBinaryFile(buffer)) {
              return null;
            }

            const content = buffer.toString('utf-8');
            const extension = path.extname(filePath).slice(1);
            const language = detectLanguage(filePath);

            if (suppressComments) {
              // Here you would implement comment suppression logic
              // This depends on the language and might require a separate module
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
        }),
    )
  ).filter((fileInfo): fileInfo is FileInfo => fileInfo !== null);

  return fileInfos;
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

## src/cli/index.ts

- Language: typescript
- Size: 3965 bytes
- Last modified: Tue Jul 09 2024 21:45:34 GMT+0200 (Central European Summer Time)

```typescript
import path from 'node:path';
import chalk from 'chalk';
import ora from 'ora';
import { Command } from 'commander';
import fs from 'fs-extra';
import { processFiles } from '../core/file-processor';
import { generateMarkdown } from '../core/markdown-generator';

const program = new Command();

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
  .option('--no-codeblock', 'Disable wrapping code inside markdown code blocks')
  .option(
    '--custom-data <json>',
    'Custom data to pass to the template (JSON string)',
  )
  .option('--custom-template <path>', 'Path to a custom Handlebars template')
  .option('--custom-ignores <patterns...>', 'Additional patterns to ignore')
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

      const templatePath = options.customTemplate || options.template;
      const markdown = await generateMarkdown(files, {
        template: templatePath,
        noCodeblock: !options.codeblock,
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
    const templatesDir = path.join(__dirname, '..', 'templates');
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
    const sourceDir = path.join(__dirname, '..', 'templates');
    const targetDir = path.resolve(options.dir);

    try {
      await fs.ensureDir(targetDir);
      await fs.copy(sourceDir, targetDir, { overwrite: false });
      console.log(chalk.green(`Templates exported to ${targetDir}`));
    } catch (error) {
      console.error(
        chalk.red('Error exporting templates:'),
        (error as Error).message,
      );
    }
  });

program.parse(process.argv);

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

## .github/workflows/release.yml

- Language: yaml
- Size: 474 bytes
- Last modified: Mon Jul 08 2024 18:42:50 GMT+0200 (Central European Summer Time)

```yaml
name: Release

permissions:
  contents: write

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Install pnpm
        uses: pnpm/action-setup@v3

      - name: Set node
        uses: actions/setup-node@v4
        with:
          node-version: lts/*

      - run: npx changelogithub
        env:
          GITHUB_TOKEN: ${{secrets.GITHUB_TOKEN}}

```

## .github/workflows/ci.yml

- Language: yaml
- Size: 1477 bytes
- Last modified: Mon Jul 08 2024 18:44:19 GMT+0200 (Central European Summer Time)

```yaml
name: CI

on:
  push:
    branches:
      - main

  pull_request:
    branches:
      - main

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install pnpm
        uses: pnpm/action-setup@v3

      - name: Set node
        uses: actions/setup-node@v4
        with:
          node-version: lts/*

      - name: Setup
        run: npm i -g @gmickel/ni

      - name: Install
        run: nci

      - name: Lint
        run: nr lint

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install pnpm
        uses: pnpm/action-setup@v3

      - name: Set node
        uses: actions/setup-node@v4
        with:
          node-version: lts/*

      - name: Setup
        run: npm i -g @gmickel/ni

      - name: Install
        run: nci

      - name: Typecheck
        run: nr typecheck

  test:
    runs-on: ${{ matrix.os }}

    strategy:
      matrix:
        node: [lts/*]
        os: [ubuntu-latest, windows-latest, macos-latest]
      fail-fast: false

    steps:
      - uses: actions/checkout@v4

      - name: Install pnpm
        uses: pnpm/action-setup@v3

      - name: Set node ${{ matrix.node }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}

      - name: Setup
        run: npm i -g @gmickel/ni

      - name: Install
        run: nci

      - name: Build
        run: nr build

      - name: Test
        run: nr test

```


