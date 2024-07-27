# CodeWhisper

Blazingly fast codebase-to-LLM context bridge and AI-powered code generation workflow

[![CI](https://github.com/gmickel/CodeWhisper/actions/workflows/ci.yml/badge.svg)](https://github.com/gmickel/CodeWhisper/actions/workflows/ci.yml)
[![Known Vulnerabilities](https://snyk.io/test/github/gmickel/CodeWhisper/badge.svg)](https://snyk.io/test/github/gmickel/CodeWhisper)
[![License](https://img.shields.io/github/license/gmickel/codewhisper)](https://github.com/gmickel/CodeWhisper/blob/main/LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/gmickel/codewhisper)](https://github.com/gmickel/CodeWhisper/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/gmickel/codewhisper)](https://github.com/gmickel/CodeWhisper/network)

[About](#-about) •
[Key Features](#-key-features) •
[Quick Start](#-quick-start) •
[Installation](#-installation) •
[Usage](#-usage) •
[Templates](#-templates) •
[Configuration](#-configuration) •
[API](#-api) •
[FAQ](#-faq)

## 📖 About

CodeWhisper is a powerful tool that bridges the gap between your codebase and Large Language Models (LLMs). It serves two primary functions:

01. **Blazing Fast Codebase to Prompt Generator**: Quickly transform your entire codebase into context-rich prompts for LLMs.
02. **Fully Customizable AI-Powered Code Generation Workflow**: Leverage AI to assist in various coding tasks, from planning to implementation.

Whether you're tackling complex refactoring, conducting thorough code reviews, or seeking AI-driven architectural insights, CodeWhisper equips your AI tools with the comprehensive understanding they need. It's not just about coding assistance – it's about enabling AI to be a true collaborator in your software development process.

![CodeWhisper](https://raw.githubusercontent.com/gmickel/CodeWhisper/main/assets/worker_sm.jpg)

## 📺 Video

https://github.com/user-attachments/assets/a3a1ad99-d402-4781-9672-7228c0aa2f93

## ✨ Key Features

* 🚀 Blazingly fast code processing with concurrent workers
* 🎯 Customizable file filtering and exclusion
* 📊 Intelligent caching for improved performance
* 🔧 Extensible template system with interactive variable prompts
* 🖊️ Support for single-line and multi-line custom variables in templates
* 💾 Value caching for quick template reuse
* 🖥️ CLI and programmatic API
* 🔒 Respects .gitignore and/or custom include and exclude globs
* 🌈 Full language support for all text-based file types
* 🤖 Interactive mode for granular file selection and template customization
* ⚡ Optimized for large repositories
* 🧠 AI-powered task planning and code generation
* 🔄 Full git integration for version control of AI-generated changes

## 🚀 Quick Start

### Codebase to Prompt Generation

```bash
# Navigate to your project directory
cd /path/to/your/project

# Generate an AI-friendly prompt using interactive mode
npx codewhisper interactive

# Follow the prompts to select files and customize the output
```

### AI-Assisted Task Creation and Code Generation

```bash
# Start an AI-assisted coding task
npx codewhisper task

# Describe your task when prompted
# Review and approve the AI-generated plan
# AI-generated changes are applied to a new git branch
```

## 📦 Installation

You can use CodeWhisper without installation using `npx` , or install it globally:

```bash
# Using npx (no installation required)
npx codewhisper <command>

# Global installation
npm install -g codewhisper
```

## 💻 Usage

CodeWhisper offers several commands to cater to different use cases. For detailed usage instructions and examples, please refer to [USAGE.md](USAGE.md).

## 📝 Templates

CodeWhisper uses Handlebars templates to generate output. You can use pre-defined templates or create custom ones. For in-depth information on templating, see [TEMPLATES.md](TEMPLATES.md).

## 🔧 Configuration

Create a `.codewhisperrc` file in your project root for custom configurations. For more details on configuration options, check [CUSTOMIZATION.md](CUSTOMIZATION.md).

## 📚 API

CodeWhisper can be used programmatically in your Node.js projects. For detailed API documentation and examples, please refer to [LIBRARY_USAGE.md](LIBRARY_USAGE.md).

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

* [Handlebars](https://handlebarsjs.com/) for templating
* [Commander.js](https://github.com/tj/commander.js/) for CLI support
* [fast-glob](https://github.com/mrmlnc/fast-glob) for file matching
* [Inquirer.js](https://github.com/SBoudrias/Inquirer.js/) for interactive prompts

## 📬 Contact

Gordon Mickel - [@gmickel](https://twitter.com/gmickel) - gordon@mickel.tech

Project Link: [https://github.com/gmickel/CodeWhisper](https://github.com/gmickel/CodeWhisper)

## Project Growth

[![Star History Chart](https://api.star-history.com/svg?repos=gmickel/CodeWhisper&type=Date)](https://star-history.com/#gmickel/CodeWhisper&Date)

---

⭐ If you find CodeWhisper useful, please consider giving it a star on GitHub to show your support! ⭐

Made with ❤️ by [Gordon Mickel](https://github.com/gmickel).
