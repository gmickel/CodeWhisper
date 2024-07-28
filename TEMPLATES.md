# CodeWhisper Templates Guide

This document provides in-depth information on using and creating templates for CodeWhisper.

## Table of Contents

* [Using Built-in Templates](#using-built-in-templates)
* [Creating Custom Templates](#creating-custom-templates)
* [Template Variables](#template-variables)
* [Handlebars Helpers](#handlebars-helpers)
* [Template Context](#template-context)
* [Example Custom Templates](#example-custom-templates)
* [Best Practices](#best-practices)
* [Troubleshooting](#troubleshooting)

## Using Built-in Templates

CodeWhisper comes with several pre-defined templates:

01. `task-plan-prompt`: Creates a plan from a task description for AI-assisted workflows.
02. `codegen-prompt`: Generates code modifications based on the task plan.
03. `codebase-summary`: Produces a comprehensive summary of your codebase.
04. `create-readme`: Generates a README file for your project.
05. `deep-code-review`: Performs a detailed code review.
06. `default`: The default template for general use.
07. `generate-project-documentation`: Creates full project documentation.
08. `minimal`: A minimal output format for quick overviews.
09. `optimize-llm-prompt`: Optimizes prompts for use with language models.
10. `security-focused-review`: Conducts a security-focused code review.
11. `prompt-to-few-shot-prompt`: Converts a prompt into a few-shot prompt for use with simpler models.
12. `task-to-few-shot-prompt`: Converts a task description into a few-shot prompt.

To use a specific template:

```bash
codewhisper generate -t <template-name>
```

Examples:

```bash
# Generate a codebase summary
codewhisper generate -t codebase-summary

# Perform a deep code review
codewhisper generate -t deep-code-review

# Create a README file
codewhisper generate -t create-readme
```

## Creating Custom Templates

01. Create a new `.hbs` file with your template content.
02. Use the `--custom-template` option to specify your template file:

```bash
codewhisper generate --custom-template path/to/your-template.hbs
```

## Template Variables

When creating custom templates, you can use special variable prefixes to enable interactive prompting:

* Use `{{var_variableName}}` for single-line input prompts.
* Use `{{multiline_variableName}}` for multiline input prompts that open in the user's default text editor.

Example:

```handlebars
# {{var_projectName}}

## Description

{{multiline_projectDescription}}

## Author

{{var_authorName}}
```

## Handlebars Helpers

CodeWhisper provides several custom Handlebars helpers:

* `codeblock`: Wraps content in a code block with optional line numbers.
* `eq`: Checks if two values are equal.
* `objectKeys`: Returns the keys of an object.
* `gt`: Checks if one value is greater than another.
* `hasCustomData`: Checks if custom data is present.
* `isCustomData`: Checks if a key is custom data.
* `lineNumbers`: Adds line numbers to content.
* `tableOfContents`: Generates a table of contents for files.
* `fileInfo`: Displays information about a file.
* `relativePath`: Generates a relative path for a file.

For detailed usage of each helper, refer to the [Handlebars Helpers](#handlebars-helpers) section.

## Template Context

Your templates have access to the following context:

* `files`: An array of `FileInfo` objects representing the processed files.
* `base`: The base path of the project.
* Any custom data provided via the `--custom-data` option.

A `FileInfo` object contains:
* `path`: The file path
* `extension`: The file extension
* `language`: The detected language
* `size`: File size in bytes
* `created`: Creation date
* `modified`: Last modified date
* `content`: The file content

## Example Custom Templates

### 1. Code Overview Template

```handlebars
# Code Overview

{{tableOfContents files}}

{{#each files}}

## {{relativePath this.path}}

{{fileInfo this}}

```{{this.language}}
{{#codeblock this.content this.language}}{{/codeblock}}
```

{{/each}}

```

Use this template with:

```bash
codewhisper generate --custom-template code-overview.hbs
```

### 2. Project Statistics Template

```handlebars
# Project Statistics

## File Count: {{files.length}}

## Languages Used:

{{#each (objectKeys (groupBy files "language"))}}
- {{this}}: {{lookup .. this}}
{{/each}}

## Total Lines of Code:

{{sum files "content.split('\n').length"}}

## Largest Files:

{{#each (sortBy files "size" true)}}
{{#if (lt @index 5)}}
- {{relativePath this.path}}: {{this.size}} bytes
{{/if}}
{{/each}}
```

Use this template with:

```bash
codewhisper generate --custom-template project-stats.hbs
```

## Best Practices

01. Keep templates modular and reusable.
02. Use comments to explain complex logic within templates.
03. Leverage Handlebars helpers to keep your templates DRY (Don't Repeat Yourself).
04. Test your templates with various codebases to ensure they work as expected.
05. Use consistent formatting and indentation for better readability.
06. Consider creating a set of base templates that can be extended for specific use cases.

## Troubleshooting

01. **Variable not rendering**: Ensure that the variable name in the template matches the one provided in custom data or through interactive prompts.

02. **Helper not found**: Double-check the helper name and make sure it's one of the provided custom helpers or a built-in Handlebars helper.

03. **Unexpected output**: Use the `{{log}}` helper to debug variables and expressions within your template.

04. **Performance issues with large codebases**: Consider using pagination or limiting the number of files processed in a single run.

For more complex issues or feature requests, please open an issue on the [CodeWhisper GitHub repository](https://github.com/gmickel/CodeWhisper/issues).
