# CodeWhisper Library Usage Guide

This document provides detailed information on using CodeWhisper programmatically in your Node.js projects.

## Table of Contents

- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Advanced Usage](#advanced-usage)
- [API Reference](#api-reference)
  - [processFiles](#processfiles)
  - [generateMarkdown](#generatemarkdown)
  - [runAIAssistedTask](#runaiassistedtask)
- [Examples](#examples)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Installation

To use CodeWhisper as a library in your project, install it using npm:

```bash
npm install codewhisper
```

## Basic Usage

Here's a basic example of using CodeWhisper in your Node.js project:

```javascript
import { processFiles, generateMarkdown } from 'codewhisper';

async function generateCodeSummary() {
  try {
    const files = await processFiles({
      path: '/path/to/project',
      filter: ['**/*.js', '**/*.ts'],
      exclude: ['**/node_modules/**'],
    });

    const markdown = await generateMarkdown(files, 'default', {
      noCodeblock: false,
      customData: {
        projectName: 'My Project',
      },
    });

    console.log(markdown);
  } catch (error) {
    console.error('Error generating code summary:', error);
  }
}

generateCodeSummary();
```

## Advanced Usage

### Custom Template Usage

```javascript
import { processFiles, generateMarkdown } from 'codewhisper';
import fs from 'fs/promises';

async function generateCustomOutput() {
  try {
    const files = await processFiles({
      path: '/path/to/project',
      filter: ['src/**/*.js'],
    });

    const customTemplate = await fs.readFile(
      'path/to/custom-template.hbs',
      'utf-8'
    );

    const output = await generateMarkdown(files, customTemplate, {
      customData: {
        projectName: 'My Project',
        version: '1.0.0',
      },
    });

    await fs.writeFile('output.md', output);
    console.log('Custom output generated successfully!');
  } catch (error) {
    console.error('Error generating custom output:', error);
  }
}

generateCustomOutput();
```

### Using the AI Task Workflow

```javascript
import { runAIAssistedTask } from 'codewhisper';

async function performAITask() {
  try {
    await runAIAssistedTask({
      path: '/path/to/project',
      task: 'Implement user authentication',
      description: 'Add user login and registration functionality using JWT',
      instructions: 'Use bcrypt for password hashing...',
      context: ['src/api/auth.js', 'src/utils/auth.js'],
      model: 'claude-3-5-sonnet-20240620',
      dryRun: true,
    });
    console.log('AI-assisted task completed successfully!');
  } catch (error) {
    console.error('Error in AI-assisted task:', error);
  }
}

performAITask();
```

## API Reference

### processFiles

Processes files in the specified directory based on the given options.

```typescript
function processFiles(options: ProcessOptions): Promise<FileInfo[]>;
```

#### Parameters

| Option             | Type       | Description                              | Default           |
| ------------------ | ---------- | ---------------------------------------- | ----------------- |
| `path`             | `string`   | Path to the codebase                     | Current directory |
| `gitignore`        | `string`   | Path to .gitignore file                  | -                 |
| `filter`           | `string[]` | File patterns to include (glob patterns) | -                 |
| `exclude`          | `string[]` | File patterns to exclude (glob patterns) | -                 |
| `suppressComments` | `boolean`  | Strip comments from the code             | `false`           |
| `caseSensitive`    | `boolean`  | Use case-sensitive pattern matching      | `false`           |
| `customIgnores`    | `string[]` | Additional patterns to ignore            | -                 |
| `cachePath`        | `string`   | Custom path for the cache file           | -                 |
| `respectGitignore` | `boolean`  | Respect entries in .gitignore            | `true`            |

#### Returns

`Promise<FileInfo[]>` - An array of processed file information

#### Example

```javascript
const files = await processFiles({
  path: '/path/to/project',
  filter: ['**/*.js', '**/*.ts'],
  exclude: ['**/node_modules/**'],
});
```

### generateMarkdown

Generates markdown output based on the processed files and template.

```typescript
function generateMarkdown(
  files: FileInfo[],
  templateContent: string,
  options: MarkdownOptions
): Promise<string>;
```

#### Parameters

| Parameter         | Type              | Description                         |
| ----------------- | ----------------- | ----------------------------------- |
| `files`           | `FileInfo[]`      | Array of processed file information |
| `templateContent` | `string`          | Handlebars template content         |
| `options`         | `MarkdownOptions` | Configuration options               |

##### MarkdownOptions

| Option        | Type                     | Description                                       | Default |
| ------------- | ------------------------ | ------------------------------------------------- | ------- |
| `noCodeblock` | `boolean`                | Disable wrapping code inside markdown code blocks | `false` |
| `customData`  | `Record<string, string>` | Custom data to pass to the template               | -       |
| `basePath`    | `string`                 | Base path for relative file paths                 | -       |
| `lineNumbers` | `boolean`                | Add line numbers to code blocks                   | `false` |

#### Returns

`Promise<string>` - Generated markdown content

#### Example

```javascript
const markdown = await generateMarkdown(files, customTemplate, {
  customData: {
    projectName: 'My Project',
    version: '1.0.0',
  },
  lineNumbers: true,
});
```

### runAIAssistedTask

Runs an AI-assisted coding task.

```typescript
function runAIAssistedTask(options: AiAssistedTaskOptions): Promise<void>;
```

#### Parameters

| Option             | Type      | Description                                     | Default           |
| ------------------ | --------- | ----------------------------------------------- | ----------------- |
| `path`             | `string`  | Path to the codebase                            | Current directory |
| `task`             | `string`  | Short task title                                | -                 |
| `description`      | `string`  | Detailed task description                       | -                 |
| `instructions`     | `string`  | Additional instructions for the task            | -                 |
| `model`            | `string`  | AI model to use                                 | -                 |
| `dryRun`           | `boolean` | Perform a dry run without making actual changes | `false`           |
| `maxCostThreshold` | `number`  | Maximum cost threshold for AI operations        | -                 |
| `autoCommit`       | `boolean` | Automatically commit changes                    | `false`           |

#### Returns

`Promise<void>`

#### Example

```javascript
await runAIAssistedTask({
  path: '/path/to/project',
  task: 'Refactor authentication module',
  description: 'Improve the current authentication module...',
  instructions: 'Use bcrypt for password hashing...',
  model: 'claude-3-5-sonnet-20240620',
  dryRun: false,
  autoCommit: true,
});
```

## Examples

### Generate a Security-Focused Code Review

```javascript
import { processFiles, generateMarkdown } from 'codewhisper';
import fs from 'fs/promises';

async function generateSecurityReview() {
  try {
    const files = await processFiles({
      path: '/path/to/project',
      filter: ['**/*.js', '**/*.ts', '**/*.php'],
      exclude: ['**/vendor/**', '**/node_modules/**'],
    });

    const templateContent = await fs.readFile(
      'security-review-template.hbs',
      'utf-8'
    );

    const markdown = await generateMarkdown(files, templateContent, {
      customData: {
        projectName: 'My Secure Project',
        reviewDate: new Date().toISOString(),
      },
      lineNumbers: true,
    });

    await fs.writeFile('security-review.md', markdown);
    console.log('Security review generated successfully!');
  } catch (error) {
    console.error('Error generating security review:', error);
  }
}

generateSecurityReview();
```

### Perform an AI-Assisted Refactoring Task

```javascript
import { runAIAssistedTask } from 'codewhisper';

async function refactorCode() {
  try {
    await runAIAssistedTask({
      path: '/path/to/project',
      task: 'Refactor authentication module',
      description:
        'Improve the current authentication module by implementing proper password hashing, adding multi-factor authentication support, and reorganizing the code for better maintainability.',
      instructions:
        'Use bcrypt for password hashing. Implement TOTP for multi-factor authentication. Follow SOLID principles in the refactored code.',
      model: 'claude-3-5-sonnet-20240620',
      dryRun: false,
      autoCommit: true,
    });
    console.log('Refactoring task completed successfully!');
  } catch (error) {
    console.error('Error during refactoring task:', error);
  }
}

refactorCode();
```

## Error Handling

CodeWhisper functions throw errors when they encounter issues. It's recommended to wrap your code in try-catch blocks to handle these errors gracefully. For example:

```javascript
try {
  const files = await processFiles(options);
  // ... rest of your code
} catch (error) {
  console.error('Error processing files:', error.message);
  // Handle the error appropriately
}
```

## Best Practices

1. Always use error handling when working with CodeWhisper functions.
2. Use the `dryRun` option when testing AI-assisted tasks to preview changes before applying them.
3. Regularly update CodeWhisper to benefit from the latest features and bug fixes.
4. Use custom templates to tailor the output to your specific needs.
5. Leverage the `customData` option to pass project-specific information to your templates.

## Troubleshooting

If you encounter issues while using CodeWhisper:

1. Check that you're using the latest version of CodeWhisper.
2. Verify that your project structure and file patterns are correct.
3. Review the error messages for specific information about what went wrong.
4. Consult the [FAQ section in the README](https://github.com/gmickel/CodeWhisper#-faq) for common issues and solutions.
5. If the problem persists, please [open an issue on GitHub](https://github.com/gmickel/CodeWhisper/issues) with a detailed description of the problem and steps to reproduce it.
