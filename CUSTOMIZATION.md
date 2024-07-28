# Customizing CodeWhisper

This guide explains how to customize CodeWhisper to fit your specific needs and workflow.

## Table of Contents

* [Custom Templates](#custom-templates)
* [Template Variables](#template-variables)
* [Customizing AI Models](#customizing-ai-models)
* [Extending CodeWhisper](#extending-codewhisper)
* [Performance Tuning](#performance-tuning)
* [Integrating with Other Tools](#integrating-with-other-tools)

## Custom Templates

To create and use custom templates:

1. Export the built-in templates:

```bash
codewhisper export-templates -d ./my-templates
```

2. Edit or create new template files in the `./my-templates` directory.

3. Use your custom template:

```bash
codewhisper generate --custom-template ./my-templates/my-custom-template.hbs
```

### Example: Creating a Custom Template

Let's create a template that focuses on code statistics:

```handlebars
# Code Statistics for {{var_projectName}}

{{tableOfContents files}}

## Overall Statistics

Total Files: {{files.length}}
Total Lines of Code: {{sum files 'content.split("\n").length'}}

## File Breakdown

{{#each files}}

### {{relativePath this.path}}

- Language: {{this.language}}
- Lines of Code: {{this.content.split("\n").length}}
- Last Modified: {{this.modified}}

{{/each}}

## Project Description

{{multiline_projectDescription}}
```

Save this as `code-stats.hbs` in your templates directory and use it with:

```bash
codewhisper generate --custom-template ./my-templates/code-stats.hbs --custom-data '{"projectName": "My Project"}'
```

### Best Practices for Template Creation

1. Use clear and descriptive variable names.
2. Leverage Handlebars helpers for complex logic.
3. Include comments in your templates for better maintainability.
4. Consider creating modular templates that can be composed together.
5. Test your templates with various input data to ensure they handle edge cases.

## Template Variables

CodeWhisper supports two types of special variable prefixes in templates to enable interactive prompting:

1. `var_`: Used for single-line input prompts.
2. `multiline_`: Used for multi-line input prompts that open in the user's default text editor.

Example usage in a template:

```handlebars
# {{var_projectName}}

## Description

{{multiline_projectDescription}}

## Author

{{var_authorName}}
```

When using a template with these variables, CodeWhisper will automatically prompt the user for input if the values aren't provided via the `--custom-data` option. This feature makes it easier to create dynamic, interactive templates that can be reused across different projects.

Note: Variable values are cached to speed up repeated use of templates. The cache can be cleared by using a different cache path with the `--cache-path` option.

### Advanced Variable Usage

You can also use computed values and conditional logic in your templates:

```handlebars
{{#if (gt files.length 10)}}
This is a large project with {{files.length}} files.
{{else}}
This is a small project with {{files.length}} files.
{{/if}}
```

## Customizing AI Models

CodeWhisper allows you to specify which AI model to use for tasks. You can customize this in your commands:

```bash
codewhisper task -m claude-3-opus-20240229
```

To add support for new models:

1. Modify the `MODEL_CONFIGS` object in `src/ai/model-config.ts`
2. Update the `generateAIResponse` function in `src/ai/generate-ai-response.ts` to handle the new model

### Example: Adding a New AI Model

```typescript
// In src/ai/model-config.ts
export const MODEL_CONFIGS: ModelSpecs = {
  // ... existing models ...
  'new-model-name': {
    contextWindow: 100000,
    maxOutput: 4096,
    modelName: 'New Model',
    pricing: { inputCost: 1, outputCost: 2 },
  },
};

// In src/ai/generate-ai-response.ts
// Update the generateAIResponse function to handle the new model
```

## Extending CodeWhisper

To add new features or modify existing ones:

1. Fork the CodeWhisper repository
2. Clone your fork and create a new branch
3. Make your changes, following the existing code style
4. Add tests for your new features
5. Update the documentation to reflect your changes
6. Submit a pull request with a clear description of your changes

### Example: Adding a New Command

To add a new command, e.g., `analyze` :

1. Create a new file `src/commands/analyze.ts`:

```typescript
import { Command } from 'commander';
import { processFiles } from '../core/file-processor';
import { generateMarkdown } from '../core/markdown-generator';

export function registerAnalyzeCommand(program: Command) {
  program
    .command('analyze')
    .description('Analyze code and generate a report')
    .option('-p, --path <path>', 'Path to analyze', '.')
    .action(async (options) => {
      const files = await processFiles(options);
      const template = `
# Code Analysis Report

{{#each files}}

## {{relativePath this.path}}

{{fileInfo this}}

{{/each}}
      `;
      const output = await generateMarkdown(files, template, options);
      console.log(output);
    });
}
```

2. Update `src/cli/index.ts` to include your new command:

```typescript
import { registerAnalyzeCommand } from '../commands/analyze';

// ... existing code ...

registerAnalyzeCommand(program);

// ... existing code ...
```

3. Add tests for your new command in `tests/commands/analyze.test.ts`

4. Update the documentation to include information about the new `analyze` command

## Performance Tuning

To optimize CodeWhisper's performance:

1. Use specific file filters to reduce the number of processed files.
2. Leverage the caching mechanism by using a consistent cache path.

Example:

```bash
codewhisper generate --filter "src/**/*.js" --cache-path /path/to/cache
```

## Integrating with Other Tools

CodeWhisper can be easily integrated with other development tools:

1. Version Control: Use CodeWhisper in pre-commit hooks to generate documentation or perform code analysis.
2. CI/CD: Incorporate CodeWhisper in your CI/CD pipeline for automated code reviews or documentation generation.
3. IDE Extensions: Create IDE extensions that leverage CodeWhisper's API for in-editor code analysis and AI assistance.

Example Git pre-commit hook:

```bash
#!/bin/sh
codewhisper analyze --path ./src --output ./docs/analysis.md
git add ./docs/analysis.md
```

By following these customization guidelines and leveraging the advanced features, you can tailor CodeWhisper to better suit your specific needs and workflows.
