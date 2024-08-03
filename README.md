# CodeWhisper

Blazingly fast codebase-to-LLM context bridge and AI-powered code generation workflow

[![CI](https://github.com/gmickel/CodeWhisper/actions/workflows/ci.yml/badge.svg)](https://github.com/gmickel/CodeWhisper/actions/workflows/ci.yml)
[![Known Vulnerabilities](https://snyk.io/test/github/gmickel/CodeWhisper/badge.svg)](https://snyk.io/test/github/gmickel/CodeWhisper)
[![License](https://img.shields.io/github/license/gmickel/codewhisper)](https://github.com/gmickel/CodeWhisper/blob/main/LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/gmickel/codewhisper)](https://github.com/gmickel/CodeWhisper/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/gmickel/codewhisper)](https://github.com/gmickel/CodeWhisper/network)
[![NPM Version](https://img.shields.io/npm/v/codewhisper)](https://www.npmjs.com/package/codewhisper)
[![NPM Downloads](https://img.shields.io/npm/dw/codewhisper)](https://www.npmjs.com/package/codewhisper)

[About](#-about) •
[Why CodeWhisper?](#-why-codewhisper) •
[Key Features](#-key-features) •
[Quick Start](#-quick-start) •
[Installation](#-installation) •
[Usage](#-usage) •
[Templates](#-templates) •
[Configuration](#-configuration) •
[API](#-api) •
[Contributing](#-contributing) •
[Roadmap](#-roadmap) •
[FAQ](#-faq)

## 📖 About

CodeWhisper is a powerful tool that bridges the gap between your codebase and Large Language Models (LLMs). It serves two primary functions:

1. **AI-Powered End-to-End Task Implementation**: Tackle complex, codebase-spanning tasks with ease. CodeWhisper doesn't just suggest snippets; it plans, generates, and applies comprehensive code changes across your entire project, from backend logic to frontend integration.

2. **Precision-Guided Context Curation for LLMs**: Harness the power of human insight to feed AI exactly what it needs. Quickly transform carefully selected parts of your codebase into rich, relevant context for LLMs, ensuring more accurate and project-aligned results.

Whether you're implementing comprehensive features, tackling complex refactoring, conducting thorough code reviews, or seeking AI-driven architectural insights, CodeWhisper equips your AI tools with the comprehensive understanding they need. It's not just about coding assistance – it's about enabling AI to be a true collaborator in your software development process.

### 💬 Join the Community

Join the [CodeWhisper Discord](https://discord.com/invite/82mjJkwABQ) to connect with fellow users and developers, share insights, discuss features, and get support for leveraging CodeWhisper in your coding workflow.

![CodeWhisper](https://raw.githubusercontent.com/gmickel/CodeWhisper/main/assets/worker_sm.jpg)

## 🤔 Why CodeWhisper?

CodeWhisper was born out of a simple yet powerful idea: to provide AI models with meticulously curated context from your entire codebase in the most comfortable way possible. What started as a tool to generate comprehensive and customizable prompts from your codebase has evolved into a full-fledged AI-assisted development workflow solution.

### The Power of Manual Context Curation

Many AI coding assistants and tools fall short when tackling tasks that demand a comprehensive understanding of your project. They often lack the big-picture context necessary for making informed decisions about your codebase as a whole. CodeWhisper addresses this limitation through its unique manually curated context approach, delivering end-to-end task implementation with a git-first workflow:

<details>
<summary>Read more</summary>

1.  **Precision Through Human-Guided Curation**: CodeWhisper trusts you to handpick the most relevant parts of your codebase for any given task. This ensures the AI model receives exactly the context it needs, leading to more accurate and comprehensive task implementation.

    > Example: For a task to "Implement user authentication":

    - You select core auth components, user models, and key API endpoints.
    - CodeWhisper then generates and applies all necessary code modifications across selected files.
    - The result is a fully implemented feature, from backend logic to frontend integration.

2.  **Project-Specific Knowledge Integration**: Manual curation allows you to include non-code context that automated tools might miss, such as architectural decisions or business logic explanations.

    > Example: When enhancing your payment system, you can include:

    - Relevant code files
    - Snippets from financial compliance documents
    - Notes on transaction flow architecture
      CodeWhisper uses this rich context to generate compliant, architecturally sound code modifications.

3.  **Noise Reduction, Signal Amplification**: By manually curating the context, you eliminate irrelevant information, enabling CodeWhisper to generate more focused and effective code modifications.

    > Example: For a UI redesign task, you can exclude backend complexities, allowing CodeWhisper to concentrate on generating precise frontend component updates and style changes.

4.  **Adaptive to Project Evolution**: As your project evolves, manual curation ensures CodeWhisper always works with the most up-to-date and relevant information.

    > Example: After adopting a new state management library, you can immediately update the context, ensuring CodeWhisper's generated code aligns with your new architecture.

5.  **Seamless Integration of External Knowledge**: CodeWhisper's approach allows you to easily incorporate relevant code snippets or documentation from outside your current project.

    > Example: When implementing a new API integration, you could include:

    - Your existing API service files
    - Official documentation of the third-party API
    - Example implementations from other projects
      CodeWhisper will then use this context to generate a fully functional integration, handling authentication, data mapping, and error scenarios.

6.  **Git-First Workflow**: CodeWhisper automatically creates new branches before applying any code modifications, ensuring a clean and organized development process.

    > Example: For a task to "Add user profile management":

    - CodeWhisper creates a new branch (e.g., `feature/user-profile-management` )
    - Generates and applies all necessary code changes within this branch
    - Optionally prepares a commit with a descriptive message

    This approach makes it straightforward to track CodeWhisper's output and review the changes in a dedicated branch.

By leveraging manually curated context and a git-first approach, CodeWhisper transforms from a simple code assistant into a comprehensive task implementation tool. It doesn't just suggest code snippets; it generates, applies, and organizes entire feature implementations. This approach combines the best of both worlds: the vast knowledge and processing power of AI models with the nuanced understanding and decision-making capabilities of experienced developers.

### Beyond Simple Code Completion

While CodeWhisper excels at performing individual coding tasks and even large feature implementations, its true power shines in its flexibility to also tackle scenarios that require understanding the big picture:

- **Refactoring**: Make informed decisions about restructuring your code based on a comprehensive understanding of your project's architecture.
- **Architectural Insights**: Get AI-driven suggestions for improving your overall code structure and design patterns.
- **Code Reviews**: Conduct more thorough and context-aware code reviews with AI assistance.
- **Documentation**: Generate more accurate and comprehensive documentation that takes into account the entire project structure.

</details>

## ✨ Key Features

- 🧠 AI-powered task planning and code generation
- 🔄 Full git integration for version control of AI-generated changes
- 🔄 Support for diff-based code modifications to handle larger edits within output token limits
- 🌍 Support for various models and LLM providers, such as Anthropic, OpenAI, and Groq
- 🔐 Support for local models via Ollama
- 🚀 Blazingly fast code processing with concurrent workers
- 🎯 Customizable file filtering and exclusion
- 📊 Intelligent caching for improved performance
- 🔧 Extensible template system with interactive variable prompts
- 🖊️ Support for single-line and multi-line custom variables in templates
- 💾 Value caching for quick template reuse
- 🖥️ CLI and programmatic API
- 🔒 Respects .gitignore and/or custom include and exclude globs
- 🌈 Full language support for all text-based file types
- 🤖 Interactive mode for granular file selection and template customization
- ⚡ Optimized for large repositories
- 📝 Detailed logging of AI prompts, responses, and parsing results
- 🔗 GitHub integration for fetching and working with issues (see [Configuration](#-configuration))

## 📺 Video

Both videos feature CodeWhisper using Claude 3.5 Sonnet for the plan and code generation steps.

### Code Generation workflow

https://github.com/user-attachments/assets/64922cf6-658e-4036-a251-cfc458a14801

### Interactive codebase-to-LLM

https://github.com/user-attachments/assets/a3a1ad99-d402-4781-9672-7228c0aa2f93

## 🚀 Quick Start

Get started with CodeWhisper in just a few steps:

```bash
# Install CodeWhisper globally
npm install -g codewhisper

# Navigate to your project directory
cd /path/to/your/project

# Generate an AI-friendly prompt using interactive mode
codewhisper interactive

# List available models
codewhisper list-models

# Start an AI-assisted coding task
# CodeWhisper will prompt you to select a model from the list of available models
codewhisper task

# To use the new experimental diff-based code modifications, you can use the following command:
codewhisper task --diff

# You can also specify a model directly
# Claude-3.5 Sonnet
codewhisper task -m claude-3-5-sonnet-20240620

# Or use a local Ollama model (not recommended as it will be slow and inaccurate for comprehensive feature implementation tasks)
codewhisper task -m ollama:llama3.1:70b --context-window 131072 --max-tokens 8192

# To undo changes made by an AI-assisted task, use the --undo option
codewhisper task --undo

# To redo the last task with the option to change the model, file selection or plan, use the --redo option
codewhisper task --redo
```

> Note: If you are using CodeWhisper's LLM integration with `codewhisper task` you will need to set the respective environment variable for the model you want to use (e.g. `export ANTHROPIC_API_KEY=your_api_key` or `export OPENAI_API_KEY=your_api_key` or `export GROQ_API_KEY=your_api_key` ).

For more detailed instructions, see the [Installation](#-installation) and [Usage](#-usage) sections.

### Supported Models and Current Recommendations

While CodeWhisper supports a variety of providers and models, my current recommendations are based on extensive testing and real-world usage. Here's an overview of the current status:

#### Recommended Models

1. **Claude-3.5-Sonnet (Anthropic)**

   - Highest recommendation
   - Generates exceptional quality plans and results
   - Optimal performance for comprehensive task implementation

2. **GPT-4o (OpenAI)**

   - Excellent performance
   - Produces high-quality plans and good results
   - Nearly on par with Claude-3.5-Sonnet

3. **GPT-4o-mini (OpenAI)**
   - Strong performance
   - Generates good quality plans and results
   - Has a long max output length of 16384 tokens which can be used for complex tasks

#### Experimental Support

- **Groq as a provider**
  - We're eager to test Llama 3.1 405B on Groq
  - Current rate limits are too restrictive for thorough testing
  - Awaiting access to paid plans and the larger Llama 3.1 model for further evaluation

#### Local Models (via Ollama)

Currently not recommended for complex tasks. Models tested include:

- Llama 3.1 (8B to 70B variants)
- DeepSeek Coder V2
- Mistral Nemo
- Mistral Large

These models currently struggle to follow instructions accurately for comprehensive task implementation. However, I am actively working on:

1. Improving the workflow for smaller local models
2. Developing an evaluation pipeline for consistent performance measurement
3. Fine-tuning prompts to better suit the capabilities of local models

## 📦 Installation

You can use CodeWhisper without installation using `npx` , or install it globally:

```bash
# Using npx (no installation required)
npx codewhisper <command>

# Global installation
npm install -g codewhisper
```

## 💻 Usage

CodeWhisper offers several commands to cater to different use cases:

```bash
# Generate a codebase summary
codewhisper generate

# Start an interactive session
codewhisper interactive

# Begin an AI-assisted coding task
codewhisper task

# Apply a previously AI-generated task
codewhisper apply-task <file>

# List available templates
codewhisper list-templates

# Export templates to the current or specified directory
codewhisper export-templates -d ./my-templates
```

For detailed usage instructions and examples, please refer to [USAGE.md](USAGE.md).

Certainly! Here's the relevant section to be added to the README.md file:

### Undoing AI-Assisted Task Changes

To undo changes made by an AI-assisted task, you can use the `--undo` option with the `task` command:

```bash
codewhisper task --undo
```

This command will:

- Discard uncommitted changes if any
- Delete the AI-generated branch if not on the main branch
- Offer to revert the last commit if on the main branch

The command will always ask for confirmation before making any changes. It will show you the exact actions it's about to perform, including the full commit message of any commit it's about to revert.

Always review the proposed changes carefully before confirming, as this operation may result in loss of work.

Here's the updated section for the README.md file that includes information about the new --redo functionality:

### Redoing AI-Assisted Tasks

CodeWhisper now supports redoing AI-assisted tasks from the review plan stage. This feature allows you to restart your last task with the option to modify the generated plan as well as the model and file selection. To use this feature, you can use the `--redo` option with the `task` command:

```bash
codewhisper task --redo
```

When you use the `--redo` option:

1. CodeWhisper will retrieve the last task data for the current project directory.
2. It will display the details of the last task, including the task description, instructions, model used, and files included.
3. You'll be given the option to change the AI model for code generation.
4. You'll also have the opportunity to modify the file selection for the task.
5. The task will then continue from the review plan stage, where you can then modify the plan to your liking.

This feature is particularly useful when:

- You want to try a different AI model for the same task
- You need to adjust the file selection for the same task
- You want to quickly tweak the plan without starting from scratch

Note: The redo functionality uses a cache stored in your home directory, so it persists across different sessions and is not affected by git operations like branch switching or resetting.

Example workflow:

1. Run an initial task: `codewhisper task`
2. Review the code modifications and decide you want to tweak the plan or try a different model
3. Undo the task: `codewhisper task --undo`
4. Redo the task: `codewhisper task --redo`
5. Optionally change the model when prompted
6. Optionally adjust the file selection
7. Adjust the plan as needed

This feature enhances the flexibility of CodeWhisper's AI-assisted workflow, allowing for quick iterations and experimentation with different models or scopes for your tasks.

## 📝 Templates

CodeWhisper uses Handlebars templates to generate output. You can use pre-defined templates or create custom ones. For in-depth information on templating, see [TEMPLATES.md](TEMPLATES.md).

## 🔧 Configuration

### GitHub Integration

To use the GitHub issue integration feature, you need to set the `GITHUB_TOKEN` environment variable with a valid GitHub personal access token.

You can create a fine-grained personal access token in your GitHub account settings. The token needs the following permission:

- "Issues" repository permission with read access

This allows CodeWhisper to list repository issues.

To set up the token:

1. Create a fine-grained personal access token following [GitHub's documentation](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token).
2. Set the environment variable:

```bash
export GITHUB_TOKEN=your_github_personal_access_token
```

> Note: This endpoint can be used without authentication if only public resources are requested. However, using a token is recommended to avoid rate limiting and access private repositories.

For more details on custom templates, extending CodeWhisper, and integrating with other tools, check [CUSTOMIZATION.md](CUSTOMIZATION.md).

## 📚 API

CodeWhisper can be used programmatically in your Node.js projects. For detailed API documentation and examples, please refer to [USAGE.md](USAGE.md).

## 🤝 Contributing

We welcome contributions to CodeWhisper! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 🏎️ Roadmap

- [x] Add AI-assisted task creation and code generation
- [x] Add GitHub integration for fetching issues and pull requests
- [ ] Add other integrations for fetching issues and pull requests (GitLab, Jira, Linear, etc.)
- [x] Finish OpenAI and Groq support
- [x] Add support for other LLMs
- [x] Add support for local models via Ollama
- [x] Experiment with partial file modifications
- [ ] Experiment with generateObject with a fixed schema
- [ ] Run evaluations on generated code
- [ ] Possibly add agentic behaviors

## ❓ FAQ

**Q: How does CodeWhisper handle large codebases?**
A: CodeWhisper uses concurrent workers and intelligent caching for optimal performance with large repositories. For very large projects, use specific file filters or interactive mode to focus on relevant parts.

**Q: Can I use custom templates?**
A: Yes, you can create custom Handlebars templates and use them with the `--custom-template` option or by placing them in the `templates/` directory. See [TEMPLATES.md](TEMPLATES.md) for more information.

**Q: Does CodeWhisper support languages other than JavaScript/TypeScript?**
A: Yes, CodeWhisper supports all text-based file types and has language detection for a wide range of programming languages.

**Q: How can I use CodeWhisper in my CI/CD pipeline?**
A: CodeWhisper can be integrated into CI/CD pipelines. Install it as a dependency and use the CLI or API in your scripts. You can generate code summaries for pull requests or create documentation automatically on each release. See [USAGE.md](USAGE.md) for CI/CD integration examples.

**Q: Can I use CodeWhisper with other AI tools or language models?**
A: Yes, CodeWhisper generates code summaries that can be used as input for various AI tools and language models. You can pipe the output to any AI tool or LLM of your choice.

**Q: How does CodeWhisper handle sensitive information in the code?**
A: CodeWhisper respects `.gitignore` files by default, helping to exclude sensitive files. Always review generated summaries before sharing, especially with confidential codebases.

## 📄 License

[MIT](./LICENSE) License © 2024-PRESENT [Gordon Mickel](https://github.com/gmickel)

## Stargazers ⭐

[![Stargazers repo roster for @gmickel/CodeWhisper](https://reporoster.com/stars/gmickel/CodeWhisper)](https://github.com/gmickel/CodeWhisper/stargazers)

## Contributors 👨‍💻

<!-- readme: collaborators, contributors -start -->
<!-- readme: collaborators, contributors -end -->

## 👏 Acknowledgments

- [Handlebars](https://handlebarsjs.com/) for templating
- [Commander.js](https://github.com/tj/commander.js/) for CLI support
- [fast-glob](https://github.com/mrmlnc/fast-glob) for file matching
- [Inquirer.js](https://github.com/SBoudrias/Inquirer.js/) for interactive prompts

## 📬 Contact

Gordon Mickel - [@gmickel](https://twitter.com/gmickel) - gordon@mickel.tech

Project Link: [https://github.com/gmickel/CodeWhisper](https://github.com/gmickel/CodeWhisper)

## Project Growth

<a href="https://star-history.com/#gmickel/CodeWhisper&Timeline">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=gmickel/CodeWhisper&type=Timeline&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=gmickel/CodeWhisper&type=Timeline" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=gmickel/CodeWhisper&type=Timeline" />
 </picture>
</a>

---

⭐ If you find CodeWhisper useful, please consider giving it a star on GitHub to show your support! ⭐

Made with ❤️ by [Gordon Mickel](https://github.com/gmickel).
