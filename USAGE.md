# Detailed Usage Guide

This document provides comprehensive usage instructions and examples for CodeWhisper.

## Table of Contents

- [Command Overview](#command-overview)
- [Detailed Command Usage](#detailed-command-usage)
- [Usage Examples](#usage-examples)
- [Advanced Usage Scenarios](#advanced-usage-scenarios)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

## Command Overview

CodeWhisper offers the following main commands:

| Command            | Description                                                      |
| ------------------ | ---------------------------------------------------------------- |
| `task`             | Start an AI-assisted coding task                                 |
| `apply-task`       | Apply an AI-generated task from a file                           |
| `interactive`      | Start an interactive session to select files and generate output |
| `generate`         | Generate a markdown file from your codebase                      |
| `list-models`      | List available AI models                                         |
| `list-templates`   | List available templates                                         |
| `export-templates` | Export templates to the current or specified directory           |
| `clear-cache`      | Clear the cache                                                  |

## Detailed Command Usage

### `task` : AI-Assisted Coding Task

```bash
codewhisper task [options]
```

#### Options

| Option                                | Description                                                                                                                                                    |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `-p, --path <path>`                   | Path to the codebase (default: current directory)                                                                                                              |
| `-m, --model <modelId>`               | Specify the AI model to use (if not specified, CodeWhisper will prompt you to select a model from the list of available models)                                |
| `-t, --task <task>`                   | Short task title                                                                                                                                               |
| `-d, --description <description>`     | Detailed task description                                                                                                                                      |
| `-i, --instructions <instructions>`   | Additional instructions for the task                                                                                                                           |
| `-c, --context <paths...>`            | Specify files or directories to include in the task context. Can be file paths, directory paths, or glob patterns. Multiple entries should be space-separated. |
| `-df, --diff`                         | Use diff format for file updates instead of full file content                                                                                                  |
| `-g, --gitignore <path>`              | Path to .gitignore file (default: .gitignore)                                                                                                                  |
| `-f, --filter <patterns...>`          | File patterns to include (use glob patterns, e.g., "src/\*_/_.js")                                                                                             |
| `-e, --exclude <patterns...>`         | File patterns to exclude (use glob patterns, e.g., "\*_/_.test.js")                                                                                            |
| `-s, --suppress-comments`             | Strip comments from the code                                                                                                                                   |
| `-l, --line-numbers`                  | Add line numbers to code blocks                                                                                                                                |
| `-cw, --context-window <number>`      | Specify the context window for the AI model. Only applicable for Ollama models.                                                                                |
| `-mt, --max-tokens <number>`          | Specify the max output tokens for the AI model. Only applicable for Ollama models.                                                                             |
| `--case-sensitive`                    | Use case-sensitive pattern matching                                                                                                                            |
| `--custom-ignores <patterns...>`      | Additional patterns to ignore                                                                                                                                  |
| `--cache-path <path>`                 | Custom path for the cache file                                                                                                                                 |
| `--respect-gitignore`                 | Respect entries in .gitignore (default: true)                                                                                                                  |
| `--no-respect-gitignore`              | Do not respect entries in .gitignore                                                                                                                           |
| `--invert`                            | Selected files will be excluded                                                                                                                                |
| `--dry-run`                           | Perform a dry run without making actual changes. Saves changes to a file so you can apply them after review using apply-task                                   |
| `--log-ai-interactions`               | Enable logging of AI prompts, responses, and parsing results to a file (default: false)                                                                        |
| `-max, --max-cost-threshold <number>` | Set a maximum cost threshold for AI operations in USD (e.g., 0.5 for $0.50)                                                                                    |
| `--auto-commit`                       | Automatically commit changes                                                                                                                                   |
| `--undo`                              | Undo AI-assisted task changes                                                                                                                                  |
| `--redo`                              | Redo the last task for the specified path with the option to change the generated plan as well as the model and file selection (see below)                 |

#### Model Selection

CodeWhisper will prompt you to select a model from the list of available models when you run the `task` command. You can also specify a model directly using the `-m` or `--model` option.

> Note: Ollama models can only be used if they are selected directly using the `-m` or `--model` option. E.g. `codewhisper task -m ollama:llama3.1:70b --context-window 131072 --max-tokens 8192`

#### GitHub Issue Integration

To use the GitHub issue integration feature:

1. Create a GitHub fine-grained personal access token:

   - Go to [GitHub's Personal Access Tokens page](https://github.com/settings/tokens?type=beta)
   - Click "Generate new token"
   - Set the token name and expiration
   - Select the repository you want to access
   - Under "Repository permissions", find "Issues" and set it to "Read-only"
   - Generate the token

   For detailed instructions, refer to [GitHub's documentation on creating fine-grained personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token).

2. Set the `GITHUB_TOKEN` environment variable:

   ```bash
   export GITHUB_TOKEN=your_github_personal_access_token
   ```

3. Use the `--github-issue` flag when running a task:

```bash
codewhisper task --github-issue -m claude-3-5-sonnet-20240620
```

This will allow you to select from open issues in the current repository.

Note:

- The token must have "Issues" repository permission with read access.
- This feature works with GitHub App user access tokens, GitHub App installation access tokens, and fine-grained personal access tokens.
- If you're only accessing public repositories, you can use this feature without authentication, but a token is recommended to avoid rate limiting.

### `apply-task` : Apply AI-Generated Task from a previous dry-run

```bash
codewhisper apply-task <file> [options]
```

#### Options

- `--auto-commit`: Automatically commit changes (default: false)

### `interactive` : Interactive Mode

```bash
codewhisper interactive [options]
```

#### Options

| Option                           | Description                                                         |
| -------------------------------- | ------------------------------------------------------------------- |
| `-p, --path <path>`              | Path to the codebase (default: current directory)                   |
| `-pr, --prompt <prompt>`         | Custom prompt to append to the output                               |
| `-t, --template <template>`      | Template to use                                                     |
| `-g, --gitignore <path>`         | Path to .gitignore file (default: .gitignore)                       |
| `-f, --filter <patterns...>`     | File patterns to include (use glob patterns, e.g., "src/\*_/_.js")  |
| `-e, --exclude <patterns...>`    | File patterns to exclude (use glob patterns, e.g., "\*_/_.test.js") |
| `-E, --open-editor`              | Open the result in your default editor                              |
| `-s, --suppress-comments`        | Strip comments from the code                                        |
| `-l, --line-numbers`             | Add line numbers to code blocks                                     |
| `--case-sensitive`               | Use case-sensitive pattern matching                                 |
| `--no-codeblock`                 | Disable wrapping code inside markdown code blocks                   |
| `--custom-data <json>`           | Custom data to pass to the template (JSON string)                   |
| `--custom-template <path>`       | Path to a custom Handlebars template                                |
| `--custom-ignores <patterns...>` | Additional patterns to ignore                                       |
| `--cache-path <path>`            | Custom path for the cache file                                      |
| `--respect-gitignore`            | Respect entries in .gitignore (default: true)                       |
| `--no-respect-gitignore`         | Do not respect entries in .gitignore                                |
| `--invert`                       | Selected files will be excluded                                     |

### `generate` : Generate Output

```bash
codewhisper generate [options]
```

#### Options

| Option                           | Description                                                         |
| -------------------------------- | ------------------------------------------------------------------- |
| `-p, --path <path>`              | Path to the codebase (default: current directory)                   |
| `-pr, --prompt <prompt>`         | Custom prompt to append to the output                               |
| `-o, --output <output>`          | Output file name                                                    |
| `-E, --open-editor`              | Open the result in your default editor                              |
| `-t, --template <template>`      | Template to use (default: "default")                                |
| `-g, --gitignore <path>`         | Path to .gitignore file (default: .gitignore)                       |
| `-f, --filter <patterns...>`     | File patterns to include (use glob patterns, e.g., "src/\*_/_.js")  |
| `-e, --exclude <patterns...>`    | File patterns to exclude (use glob patterns, e.g., "\*_/_.test.js") |
| `-s, --suppress-comments`        | Strip comments from the code                                        |
| `-l, --line-numbers`             | Add line numbers to code blocks                                     |
| `--case-sensitive`               | Use case-sensitive pattern matching                                 |
| `--no-codeblock`                 | Disable wrapping code inside markdown code blocks                   |
| `--custom-data <json>`           | Custom data to pass to the template (JSON string)                   |
| `--custom-template <path>`       | Path to a custom Handlebars template                                |
| `--custom-ignores <patterns...>` | Additional patterns to ignore                                       |
| `--cache-path <path>`            | Custom path for the cache file                                      |
| `--respect-gitignore`            | Respect entries in .gitignore (default: true)                       |
| `--no-respect-gitignore`         | Do not respect entries in .gitignore                                |

### `list-templates` : List Available Templates

```bash
codewhisper list-templates
```

This command lists all available templates in the templates directory. It doesn't take any options.

### `export-templates` : Export Templates

```bash
codewhisper export-templates [options]
```

#### Options

- `-d, --dir <directory>`: Target directory for exported templates (default: current directory)

### `clear-cache` : Clear Codewhisper's Cache

```bash
codewhisper clear-cache [options]
```

This command clears the cache file which is used to store information about processed files as well as previous task and instruction inputs.

#### Options

- `-p, --path <path>`: Path to the cache file (default: default-os-temporary-files-dir/codewhisper-cache.json)

## Usage Examples

1.  Include only JavaScript and TypeScript files:

```bash
codewhisper generate -f "**/*.js" "**/*.ts"
```

2.  Exclude test files and the `dist` directory:

```bash
codewhisper generate -e "**/*.test.js" "dist/**/*"
```

3.  Combine include and exclude patterns:

```bash
codewhisper generate -f "src/**/*" -e "**/*.test.js" "**/*.spec.js"
```

4.  Use custom data in a template:

```bash
codewhisper generate --custom-data '{"projectName": "MyApp", "version": "1.0.0"}' --custom-template my-template.hbs
```

5.  Generate a diff-based summary:

```bash
codewhisper generate --filter $(git diff --name-only HEAD^)
```

6.  Analyze a specific subdirectory:

```bash
codewhisper generate -p ./src/components -f "**/*.tsx"
```

7.  Generate a summary with a custom prompt:

```bash
codewhisper generate -pr "Analyze this code for potential security vulnerabilities"
```

8.  Use interactive mode with inverted (exclude all selected files) selection:

```bash
codewhisper interactive --invert
```

9.  Generate output with line numbers in code blocks:

```bash
codewhisper generate -l
```

10. Review changes in a specific branch compared to main:

```bash
codewhisper generate --filter $(git diff --name-only main...feature-branch) --template deep-code-review
```

## Advanced Usage Scenarios

11. Generate documentation for a new release:

```bash
codewhisper generate --filter $(git diff --name-only v1.0.0...v1.1.0) --template generate-project-documentation
```

12. Perform a security audit on recent changes:

```bash
codewhisper generate --filter $(git diff --name-only HEAD~10) --template security-focused-review
```

13. Create a code overview for onboarding new team members:

```bash
codewhisper generate -f "src/**/*" --template codebase-summary -o onboarding-guide.md
```

14. Generate an optimized LLM prompt for code explanation:

```bash
codewhisper generate --template optimize-llm-prompt --editor --custom-data '{"prompt": "your prompt goes here"}'
```

15. Start an AI-assisted coding task with a dry run:

```bash
codewhisper task --dry-run -t "Implement user authentication" -d "Add user login and registration functionality using JWT"
```

16. Apply an AI-generated task with automatic commit:

```bash
codewhisper apply-task ./codewhisper-task-output.json --auto-commit
```

17. Analyze code changes between two specific commits:

```bash
codewhisper generate --filter $(git diff --name-only commit1..commit2) --template deep-code-review
```

18. Generate a code summary for a specific pull request:

```bash
codewhisper generate --filter $(git diff --name-only main...pull-request-branch) --template codebase-summary
```

19. Create a custom template for generating API documentation:

```bash
codewhisper export-templates
# Edit the exported template to focus on API documentation
codewhisper generate --custom-template ./my-templates/api-docs.hbs -f "src/api/**/*"
```

20. Use CodeWhisper with a different LLM provider:

```bash
# Assuming you've set up the necessary environment variables for the new LLM provider
codewhisper generate --model llm
```

21. Use a local Ollama model:

```bash
codewhisper generate --model ollama:llama3.1:70b --context-window 131072 --max-tokens 8192
```

22. Run an AI-assisted task with detailed logging:

```bash
# This will generate a log file (codewhisper-`<date>`.log) in the current directory, containing all AI prompts, responses, and parsing results.

codewhisper task -m claude-3-5-sonnet-20240620 --log-ai-interactions -t "Implement error handling" -d "Add comprehensive error handling to all API endpoints" -i "some instructions"
```

23. Run an AI-assisted task using diff-based updates:

```bash
# This command will use diff-based updates for modified files, which can help handle larger edits within token limits.

codewhisper task --diff -m claude-3-5-sonnet-20240620 -t "Refactor authentication logic" -d "Update the user authentication system to use JWT tokens" -i "some instructions"
```

24. Undo AI-assisted task changes:

```bash
codewhisper task --undo
```

This command will:

- Discard uncommitted changes if any
- Delete the AI-generated branch if not on the main branch
- Offer to revert the last commit if on the main branch

The command will always ask for confirmation before making any changes.

25. Redo the last task with the option to change the generated plan as well as the model and file selection:

```bash
codewhisper task --redo
```

This command will:

- Retrieve the last task data for the current project directory
- Display the details of the last task, including the task description, instructions, model used, and files included
- You'll be given the option to change the AI model for code generation
- You'll also have the opportunity to modify the file selection for the task
- The task will then continue from the review plan stage, where you can then modify the plan to your liking

This feature is particularly useful when:
- You want to try a different AI model for the same task
- You need to adjust the file selection for the same task
- You want to quickly tweak the plan without starting from scratch

Note: The redo functionality uses a cache stored in your home directory, so it persists across different sessions and is not affected by git operations like branch switching or resetting.

Example workflow:

1. Run an initial task: `codewhisper task`
2. Review the code modifications and decide you want to tweak the plan or try a different model
3. Undo the task: `codewhisper task --undo`
3. Redo the task: `codewhisper task --redo`
4. Optionally change the model when prompted
5. Optionally adjust the file selection
6. Adjust the plan as needed

## CI/CD Integration

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

This workflow generates a codebase summary using CodeWhisper and then uses Anthropic's AI to analyze the summary and provide insights.

## Troubleshooting

Here are some common issues and their solutions:

1.  **Issue**: CodeWhisper is not recognizing my custom template.
    **Solution**: Ensure that your custom template file has a `.hbs` extension and is in the correct directory. Use the `--custom-template` option with the full path to your template file.

2.  **Issue**: The generated output is empty or incomplete.
    **Solution**: Check your file filters and ensure they're not excluding important files. Try running the command with the `--no-respect-gitignore` option to see if `.gitignore` is causing the issue.

3.  **Issue**: CodeWhisper is running slowly on large codebases.
    **Solution**: Use more specific file filters to reduce the number of files processed. You can also try increasing the cache size or using a faster storage medium for the cache file.

4.  **Issue**: AI-assisted tasks are not producing the expected results.
    **Solution**: Provide more detailed task descriptions and instructions. You can also try using a different AI model or adjusting the prompt in your custom template.

5.  **Issue**: Error "ANTHROPIC_API_KEY (or OPENAI_API_KEY or GROQ_API_KEY) not set" when running AI-assisted tasks.
    **Solution**: Ensure you've set the `ANTHROPIC_API_KEY` (or `OPENAI_API_KEY` or `GROQ_API_KEY` ) environment variable with your API key. You can do this by running `export ANTHROPIC_API_KEY=your_api_key` or `export OPENAI_API_KEY=your_api_key` or `export GROQ_API_KEY=your_api_key` before running CodeWhisper.

For more complex issues or if these solutions don't help, please open an issue on the [CodeWhisper GitHub repository](https://github.com/gmickel/CodeWhisper/issues).
