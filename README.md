# CodeWhisper

add blazing fast AI-friendly prompts to your codebase

[![CI](https://github.com/gmickel/CodeWhisper/actions/workflows/ci.yml/badge.svg)](https://github.com/gmickel/CodeWhisper/actions/workflows/ci.yml)
[![Known Vulnerabilities](https://snyk.io/test/github/gmickel/CodeWhisper/badge.svg)](https://snyk.io/test/github/gmickel/CodeWhisper)
[![License](https://img.shields.io/github/license/gmickel/codewhisper)](https://github.com/gmickel/CodeWhisper/blob/main/LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/gmickel/codewhisper)](https://github.com/gmickel/CodeWhisper/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/gmickel/codewhisper)](https://github.com/gmickel/CodeWhisper/network)

[Key Features](#-key-features) •
[Quick Start](#-quick-start) •
[Installation](#-installation) •
[Usage](#-usage) •
[Templates and Handlebars](#-templates-and-handlebars) •
[API](#-api) •
[Contributing](#-contributing) •
[License](#-license)

## 📖 About

CodeWhisper is a powerful tool designed to convert your repository code into AI-friendly prompts. It streamlines the process of generating comprehensive code summaries, making it easier to integrate your codebase with AI-powered tools and workflows.

![CodeWhisper](https://raw.githubusercontent.com/gmickel/CodeWhisper/main/assets/worker_sm.jpg)

## ✨ Key Features

* 🚀 Blazingly fast code processing with concurrent workers
* 🎯 Customizable file filtering and exclusion
* 📊 Intelligent caching for improved performance
* 🔧 Extensible template system
* 🖥️ CLI and programmatic API
* 🔒 Respects .gitignore rules
* 🌈 Full language support for all text-based file types
* 🤖 Interactive mode for granular file selection
* ⚡ Optimized for large repositories

## 📺 Video

https://github.com/user-attachments/assets/a3a1ad99-d402-4781-9672-7228c0aa2f93

## 🚀 Quick Start

You can quickly use CodeWhisper without installing it globally using `npx` :

```bash
# Navigate to your project directory
cd /path/to/your/project

# Generate an AI-friendly prompt using npx
npx codewhisper generate
```

Or, if you prefer to install globally:

```bash
# Install CodeWhisper globally
npm install -g codewhisper

# Navigate to your project directory
cd /path/to/your/project

# Generate an AI-friendly prompt
codewhisper generate
```

## 📦 Installation

You can use CodeWhisper without installation using `npx` , or install it globally using your preferred package manager:

### Using npx (no installation required)

```bash
npx codewhisper <command>
```

### Global Installation

```bash
# Using npm
npm install -g codewhisper

# Using yarn
yarn global add codewhisper

# Using pnpm
pnpm add -g codewhisper

# Using bun
bun add -g codewhisper
```

## 💻 Usage

### Basic Usage

Generate a markdown file from your codebase:

```bash
# Using npx
npx codewhisper generate -p /path/to/your/project -o output.md

# Or if installed globally
codewhisper generate -p /path/to/your/project -o output.md
```

### Default Ignores

CodeWhisper comes with a set of default ignore patterns to exclude common files and directories that are typically not needed in code analysis (e.g., `.git` , `node_modules` , build outputs, etc.). You can view the full list of default ignores in the [file-processor.ts](https://github.com/gmickel/CodeWhisper/blob/main/src/core/file-processor.ts#L41) file.

These default ignores can be overridden using the filter options or interactive selection. For example, if you want to include files that are ignored by default, you can use the `-f` or `--filter` option:

```bash
codewhisper generate -f "node_modules/**/*.js"
```

Alternatively, you can use the interactive mode to manually select files and directories, including those that would be ignored by default:

```bash
codewhisper interactive
```

### Binary Files

CodeWhisper ignores all binary files by default.

### Advanced Options

* `-p, --path <path>`: Path to the codebase (default: current directory)
* `-o, --output <output>`: Output file name
* `-t, --template <template>`: Template to use (default: "default")
* `-g, --gitignore <path>`: Path to .gitignore file
* `-f, --filter <patterns...>`: File patterns to include (use glob patterns)
* `-e, --exclude <patterns...>`: File patterns to exclude (use glob patterns)
* `-s, --suppress-comments`: Strip comments from the code
* `-l, --line-numbers`: Add line numbers to code blocks
* `--case-sensitive`: Use case-sensitive pattern matching
* `--no-codeblock`: Disable wrapping code inside markdown code blocks
* `--custom-data <json>`: Custom data to pass to the template (JSON string)
* `--custom-template <path>`: Path to a custom Handlebars template
* `--custom-ignores <patterns...>`: Additional patterns to ignore
* `--cache-path <path>`: Custom path for the cache file
* `--respect-gitignore`: Respect entries in .gitignore (default: true)
* `--no-respect-gitignore`: Do not respect entries in .gitignore
* `-pr, --prompt <prompt>`: Custom prompt to append to the output

### Interactive Mode

Start an interactive session to select files:

```bash
npx codewhisper interactive
```

Interactive mode supports all the options available in generate mode. Additionally, it includes:

* `--invert`: Selected files will be excluded instead of included

### Typical Usage Examples

1. Include only JavaScript and TypeScript files:

```bash
   npx codewhisper generate -f "**/*.js" "**/*.ts"
   ```

2. Exclude test files and the `dist` directory:

```bash
   npx codewhisper generate -e "**/*.test.js" "dist/**/*"
   ```

3. Combine include and exclude patterns:

```bash
   npx codewhisper generate -f "src/**/*" -e "**/*.test.js" "**/*.spec.js"
   ```

4. Use custom data in a template:

```bash
   npx codewhisper generate --custom-data '{"projectName": "MyApp", "version": "1.0.0"}' --custom-template my-template.hbs
   ```

5. Generate a diff-based summary:

```bash
   npx codewhisper generate --filter $(git diff --name-only HEAD^)
   ```

6. Analyze a specific subdirectory:

```bash
   npx codewhisper generate -p ./src/components -f "**/*.tsx"
   ```

7. Generate a summary with a custom prompt:

```bash
   npx codewhisper generate -pr "Analyze this code for potential security vulnerabilities"
   ```

8. Use interactive mode with inverted selection:

```bash
   npx codewhisper interactive --invert
   ```

9. Generate output with line numbers in code blocks:

```bash
   npx codewhisper generate -l
   ```

### CI/CD Integration

CodeWhisper can be easily integrated into your CI/CD pipeline. Here's an example of how to use CodeWhisper in a GitHub Actions workflow:

```yaml
name: Code Analysis
on: [push]
jobs:
  analyze-code:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    - name: Install dependencies
      run: |
        npm install -g codewhisper
        npm install @anthropic-ai/sdk
    - name: Analyze codebase
      run: |
        codewhisper generate --path . --output codebase_summary.md
        node -e '
          const fs = require("fs");
          const Anthropic = require("@anthropic-ai/sdk");

          const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
          });

          async function analyzeCode() {
            const summary = fs.readFileSync("codebase_summary.md", "utf8");
            const msg = await anthropic.messages.create({
              model: "claude-3-5-sonnet-20240620",
              max_tokens: 8192,
              messages: [
                {
                  role: "user",
                  content: `Analyze this codebase summary and provide insights:

${summary}

Perform a comprehensive analysis of this codebase. Identify areas for improvement, potential bugs, and suggest optimizations.`
                }
              ],
            });
            fs.writeFileSync("analysis.md", msg.content[0].text);
          }

          analyzeCode();
        '
      env:
        ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
    - name: Upload analysis
      uses: actions/upload-artifact@v3
      with:
        name: code-analysis
        path: analysis.md
```

This workflow does the following:
1. Checks out your repository
2. Sets up Node.js
3. Installs CodeWhisper and the Anthropic AI SDK
4. Generates a codebase summary using CodeWhisper
5. Sends the summary to Anthropic's AI for analysis
6. Uploads the analysis as an artifact

You can also use other LLM libraries or tools. For instance, here's an example combining CodeWhisper with the Python-based `llm` library:

```yaml
name: Code Analysis
on: [push]
jobs:
  analyze-code:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.x'
    - name: Install dependencies
      run: |
        npm install -g codewhisper
        pip install llm
    - name: Analyze codebase
      run: |
        codewhisper generate --path . --output codebase_summary.md
        cat codebase_summary.md | llm "Perform a comprehensive analysis of this codebase. Identify areas for improvement, potential bugs, and suggest optimizations." > analysis.md
    - name: Upload analysis
      uses: actions/upload-artifact@v3
      with:
        name: code-analysis
        path: analysis.md
```

This workflow:
1. Checks out your repository
2. Sets up both Node.js and Python
3. Installs CodeWhisper (npm) and llm (pip)
4. Generates a codebase summary using CodeWhisper
5. Pipes the summary to llm for analysis
6. Uploads the analysis as an artifact

You can adapt these workflows to use any LLM or analysis tool of your choice. The key is to generate the codebase summary with CodeWhisper and then pass that summary to your preferred analysis tool.

## 📝 Templates and Handlebars

CodeWhisper uses Handlebars templates to generate output. This section covers the available templates, how to use them, and how to create your own custom templates.

### Available Templates

CodeWhisper comes with several pre-defined templates:

1. `codebase-summary`: Generates a comprehensive summary of your codebase.
2. `create-readme`: Creates a README file for your project.
3. `deep-code-review`: Produces a detailed code review report.
4. `default`: The default template for general use.
5. `generate-project-documentation`: Creates full project documentation.
6. `minimal`: A minimal output format for quick overviews.
7. `optimize-llm-prompt`: Optimizes the output for use with language models.
8. `security-focused-review`: Generates a security-focused code review.

### Using Templates

To use a specific template, use the `-t` or `--template` option:

```bash
codewhisper generate -t deep-code-review
```

Some templates may require custom data. You can provide this using the `--custom-data` option:

```bash
codewhisper generate -t create-readme --custom-data '{"projectName": "MyProject", "description": "A cool project"}'
```

### Creating Custom Templates

You can create your own Handlebars templates for use with CodeWhisper. Here's how:

1. Create a new `.hbs` file with your template content.
2. Use the `--custom-template` option to specify your template file:

```bash
codewhisper generate --custom-template path/to/your-template.hbs
```

### Handlebars Helpers

CodeWhisper provides several custom Handlebars helpers to assist in template creation:

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

For more information on Handlebars syntax and built-in helpers, refer to the [Handlebars documentation](https://handlebarsjs.com/guide/).

### Template Context

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

### Example Custom Template

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

## 🔧 Configuration

CodeWhisper uses sensible defaults, but you can customize its behavior:

1. Create a `.codewhisperrc` file in your project root:

```json
{
  "defaultTemplate": "custom",
  "customIgnores": ["**/build", "**/dist"],
  "suppressComments": true
}
```

## 📚 API Reference

CodeWhisper can be used programmatically in your Node.js projects:

```javascript
import {
    processFiles,
    generateMarkdown
} from 'codewhisper';

const files = await processFiles({
    path: '/path/to/project',
    filter: ['**/*.js', '**/*.ts'],
    exclude: ['**/node_modules/**'],
});

const markdown = await generateMarkdown(files, customTemplate, {
    noCodeblock: false,
    customData: {
        projectName: 'My Project'
    },
});

console.log(markdown);
```

For detailed API documentation, please refer to the [API Documentation](docs/api.md).

## 🤝 Contributing

We welcome contributions to CodeWhisper! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 🧪 Running Tests

To run the test suite:

```bash
pnpm run test
```

For coverage report:

```bash
pnpm run test:coverage
```

## 🚢 Deployment

CodeWhisper uses semantic-release for automated versioning and package publishing. Simply merge your changes into the main branch, and the CI/CD pipeline will handle the rest.

## 🗺️ Roadmap

* [ ] Add better support for other languages
* [ ] Add support for other prompting techniques
* [ ] Add direct integration with LLMs
* [ ] Implement AI-powered code summarization
* [ ] Create a web interface for easier usage
* [ ] Develop plugins for popular IDEs and text editors
* [ ] Enhance performance for very large codebases
* [ ] Git-based workflows (diffs, PRs)
* [ ] Usage in CI pipelines

## 📄 License

[MIT](./LICENSE) License © 2024-PRESENT [Gordon Mickel](https://github.com/gmickel)

## Sponsors ❤️

[Your sponsors here](https://github.com/sponsors/gmickel)

## Stargazers ⭐

[![Stargazers repo roster for @gmickel/CodeWhisper](https://reporoster.com/stars/gmickel/CodeWhisper)](https://github.com/gmickel/CodeWhisper/stargazers)

## Contributors 👨‍💻

<!-- readme: collaborators, contributors -start -->
<!-- readme: collaborators, contributors -end -->

## 👏 Acknowledgments

* [Handlebars](https://handlebarsjs.com/) for templating
* [Commander.js](https://github.com/tj/commander.js/) for CLI support
* [fast-glob](https://github.com/mrmlnc/fast-glob) for file matching
* [Inquirer.js](https://github.com/SBoudrias/Inquirer.js/) for interactive prompts

## 📬 Contact

Gordon Mickel - [@gmickel](https://twitter.com/gmickel) - gordon@mickel.tech

Project Link: [https://github.com/gmickel/CodeWhisper](https://github.com/gmickel/CodeWhisper)

## ❓ FAQ

**Q: Can CodeWhisper handle large codebases?**
A: Yes, CodeWhisper is optimized for performance with large repositories. It uses concurrent workers for blazingly fast code processing and intelligent caching mechanisms. For very large projects, consider using more specific file filters or the interactive mode to focus on the most relevant parts of your codebase.

**Q: Is it possible to use custom templates?**
A: Absolutely! You can create custom Handlebars templates and use them with the `--custom-template` option or by placing them in the `templates/` directory.

**Q: Does CodeWhisper support languages other than JavaScript/TypeScript?**
A: Yes, CodeWhisper supports all text-based file types. While it was initially designed with JavaScript/TypeScript in mind, its language detection feature now supports a wide range of programming languages, making it versatile for various project types.

**Q: How can I use CodeWhisper in my CI/CD pipeline?**
A: CodeWhisper can be easily integrated into CI/CD pipelines. You can install it as a dependency in your project and use the CLI or API in your scripts. For example, you could generate code summaries for each pull request or use it to create documentation automatically on each release. See the [CI/CD Integration](#cicd-integration) section for example workflows using GitHub Actions.

**Q: Can I use CodeWhisper with other AI tools or language models?**
A: Yes, CodeWhisper is designed to generate code summaries that can be used as input for various AI tools and language models. You can pipe the output of CodeWhisper to any AI tool or LLM of your choice, as demonstrated in our CI/CD integration examples.

**Q: How does CodeWhisper handle sensitive information in the code?**
A: CodeWhisper respects `.gitignore` files by default, which helps exclude sensitive files from processing. However, it's always a good practice to review the generated summaries before sharing them, especially when working with confidential codebases.

---

⭐ If you find CodeWhisper useful, please consider giving it a star on GitHub to show your support! ⭐

## Project Growth

[![Star History Chart](https://api.star-history.com/svg?repos=gmickel/CodeWhisper&type=Date)](https://star-history.com/#gmickel/CodeWhisper&Date)

Made with ❤️ by [Gordon Mickel](https://github.com/gmickel).
