# CodeWhisper Library Usage Guide

This document provides detailed information on using CodeWhisper programmatically in your Node.js projects.

## Table of Contents

* [Installation](#installation)
* [Basic Usage](#basic-usage)
* [Advanced Usage](#advanced-usage)
* [API Reference](#api-reference)
* [Examples](#examples)

## Installation

To use CodeWhisper as a library in your project, install it using npm:

```bash
npm install codewhisper
```

## Basic Usage

Here's a basic example of using CodeWhisper in your Node.js project:

```javascript
import {
    processFiles,
    generateMarkdown
} from 'codewhisper';

async function generateCodeSummary() {
    const files = await processFiles({
        path: '/path/to/project',
        filter: ['**/*.js', '**/*.ts'],
        exclude: ['**/node_modules/**'],
    });

    const markdown = await generateMarkdown(files, 'default', {
        noCodeblock: false,
        customData: {
            projectName: 'My Project'
        },
    });

    console.log(markdown);
}

generateCodeSummary();
```

## Advanced Usage

### Custom Template Usage

```javascript
import {
    processFiles,
    generateMarkdown
} from 'codewhisper';
import fs from 'fs/promises';

async function generateCustomOutput() {
    const files = await processFiles({
        path: '/path/to/project',
        filter: ['src/**/*.js'],
    });

    const customTemplate = await fs.readFile('path/to/custom-template.hbs', 'utf-8');

    const output = await generateMarkdown(files, customTemplate, {
        customData: {
            projectName: 'My Project',
            version: '1.0.0',
        },
    });

    await fs.writeFile('output.md', output);
}

generateCustomOutput();
```

### Using the AI Task Workflow

```javascript
import {
    runAIAssistedTask
} from 'codewhisper';

async function performAITask() {
    try {
        await runAIAssistedTask({
            path: '/path/to/project',
            task: 'Implement user authentication',
            description: 'Add user login and registration functionality using JWT',
            model: 'claude-3-5-sonnet-20240620',
            dryRun: true,
        });
    } catch (error) {
        console.error('Error in AI-assisted task:', error);
    }
}

performAITask();
```

## API Reference

### `processFiles(options: ProcessOptions): Promise<FileInfo[]>`

Processes files in the specified directory based on the given options.

#### Parameters:

* `options: ProcessOptions`
  + `path?: string` - Path to the codebase (default: current directory)
  + `gitignore?: string` - Path to .gitignore file
  + `filter?: string[]` - File patterns to include (use glob patterns)
  + `exclude?: string[]` - File patterns to exclude (use glob patterns)
  + `suppressComments?: boolean` - Strip comments from the code
  + `caseSensitive?: boolean` - Use case-sensitive pattern matching
  + `customIgnores?: string[]` - Additional patterns to ignore
  + `cachePath?: string` - Custom path for the cache file
  + `respectGitignore?: boolean` - Respect entries in .gitignore

#### Returns:

* `Promise<FileInfo[]>` - An array of processed file information

### `generateMarkdown(files: FileInfo[], templateContent: string, options: MarkdownOptions): Promise<string>`

Generates markdown output based on the processed files and template.

#### Parameters:

* `files: FileInfo[]` - Array of processed file information
* `templateContent: string` - Handlebars template content
* `options: MarkdownOptions`
  + `noCodeblock?: boolean` - Disable wrapping code inside markdown code blocks
  + `customData?: Record<string, string>` - Custom data to pass to the template
  + `basePath?: string` - Base path for relative file paths
  + `lineNumbers?: boolean` - Add line numbers to code blocks

#### Returns:

* `Promise<string>` - Generated markdown content

### `runAIAssistedTask(options: AiAssistedTaskOptions): Promise<void>`

Runs an AI-assisted coding task.

#### Parameters:

* `options: AiAssistedTaskOptions`
  + `path?: string` - Path to the codebase
  + `task?: string` - Short task title
  + `description?: string` - Detailed task description
  + `instructions?: string` - Additional instructions for the task
  + `model: string` - AI model to use
  + `dryRun: boolean` - Perform a dry run without making actual changes
  + `maxCostThreshold?: number` - Maximum cost threshold for AI operations
  + `autoCommit?: boolean` - Automatically commit changes

#### Returns:

* `Promise<void>`

## Examples

### Generate a Security-Focused Code Review

```javascript
import {
    processFiles,
    generateMarkdown
} from 'codewhisper';
import fs from 'fs/promises';

async function generateSecurityReview() {
    const files = await processFiles({
        path: '/path/to/project',
        filter: ['**/*.js', '**/*.ts', '**/*.php'],
        exclude: ['**/vendor/**', '**/node_modules/**'],
    });

    const templateContent = await fs.readFile('security-review-template.hbs', 'utf-8');

    const markdown = await generateMarkdown(files, templateContent, {
        customData: {
            projectName: 'My Secure Project',
            reviewDate: new Date().toISOString(),
        },
        lineNumbers: true,
    });

    await fs.writeFile('security-review.md', markdown);
    console.log('Security review generated successfully!');
}

generateSecurityReview();
```

### Perform an AI-Assisted Refactoring Task

```javascript
import {
    runAIAssistedTask
} from 'codewhisper';

async function refactorCode() {
    try {
        await runAIAssistedTask({
            path: '/path/to/project',
            task: 'Refactor authentication module',
            description: 'Improve the current authentication module by implementing proper password hashing, adding multi-factor authentication support, and reorganizing the code for better maintainability.',
            instructions: 'Use bcrypt for password hashing. Implement TOTP for multi-factor authentication. Follow SOLID principles in the refactored code.',
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
