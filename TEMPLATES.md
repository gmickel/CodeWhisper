# CodeWhisper Templates Guide

This document provides in-depth information on using and creating templates for CodeWhisper.

## Table of Contents

* [Using Built-in Templates](#using-built-in-templates)
* [Creating Custom Templates](#creating-custom-templates)
* [Template Variables](#template-variables)
* [Handlebars Helpers](#handlebars-helpers)
* [Template Context](#template-context)
* [Example Custom Template](#example-custom-template)

## Using Built-in Templates

CodeWhisper comes with several pre-defined templates:

01. `task-plan-prompt`: The prompt used in CodeWhisper's ai workflow to create a plan from a task + description.
02. `codegen-prompt`: The prompt used in CodeWhisper's ai workflow to generate the code modifications to perform.
03. `codebase-summary`: Generates a comprehensive summary of your codebase.
04. `create-readme`: Creates a README file for your project.
05. `deep-code-review`: Produces a detailed code review report.
06. `default`: The default template for general use.
07. `generate-project-documentation`: Creates full project documentation.
08. `minimal`: A minimal output format for quick overviews.
09. `optimize-llm-prompt`: Optimizes the output for use with language models.
10. `security-focused-review`: Generates a security-focused code review.
11. `prompt-to-few-shot-prompt`: Converts a prompt into a few-shot prompt for use with cheaper models.
12. `task-to-few-shot-prompt`: Converts a task description into a few-shot prompt for use with cheaper models.

To use a specific template:

```bash
codewhisper generate -t <template-name>
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

```handlebars
  {{#codeblock file.content file.language}}{{/codeblock}}
  ```

* `eq`: Checks if two values are equal.

```handlebars
  {{#if (eq value1 value2)}}They are equal{{/if}}
  ```

* `objectKeys`: Returns the keys of an object.

```handlebars
  {{#each (objectKeys myObject)}}{{this}}{{/each}}
  ```

* `gt`: Checks if one value is greater than another.

```handlebars
  {{#if (gt value1 value2)}}Value1 is greater{{/if}}
  ```

* `hasCustomData`: Checks if custom data is present.

```handlebars
  {{#if (hasCustomData this)}}Custom data exists{{/if}}
  ```

* `isCustomData`: Checks if a key is custom data.

```handlebars
  {{#if (isCustomData key)}}This is custom data{{/if}}
  ```

* `lineNumbers`: Adds line numbers to content.

```handlebars
  {{lineNumbers file.content}}
  ```

* `tableOfContents`: Generates a table of contents for files.

```handlebars
  {{tableOfContents files}}
  ```

* `fileInfo`: Displays information about a file.

```handlebars
  {{fileInfo file}}
  ```

* `relativePath`: Generates a relative path for a file.

```handlebars
  {{relativePath file.path}}
  ```

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

## Example Custom Template

Here's an example of a custom template that generates a simple code overview:

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

Save this as `code-overview.hbs` and use it with:

```bash
codewhisper generate --custom-template code-overview.hbs
```

This template will create a markdown file with a table of contents, followed by each file's content wrapped in a code block, along with file information.
