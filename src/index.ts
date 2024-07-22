// Main functions
export { processFiles } from './core/file-processor';
export { generateMarkdown } from './core/markdown-generator';

// Types
export type { FileInfo } from './core/file-processor';
export type { MarkdownOptions } from './core/markdown-generator';

// Utilities
export { parseGitignore } from './utils/gitignore-parser';
export { normalizePath } from './utils/normalize-path';
export { getAvailableTemplates, getTemplatePath } from './utils/template-utils';
export { FileCache } from './utils/file-cache';

// Constants and configurations
export { DEFAULT_IGNORES } from './core/file-processor';
