// Main functions
export { processFiles } from './core/file-processor';
export { generateMarkdown } from './core/markdown-generator';

// Types
export type {
  AiAssistedTaskOptions,
  AIFileInfo,
  AIParsedResponse,
  GenerateAIResponseOptions,
  ApplyChangesOptions,
  InteractiveModeOptions,
  MarkdownOptions,
  FileInfo,
  ModelSpecs,
} from './types';

// Utilities
export { parseGitignore } from './utils/gitignore-parser';
export { normalizePath } from './utils/normalize-path';
export { getAvailableTemplates, getTemplatePath } from './utils/template-utils';
export { FileCache } from './utils/file-cache';

// Constants and configurations
export { DEFAULT_IGNORES } from './core/file-processor';

// AI
export { runAIAssistedTask } from './ai/task-workflow';
export { generateAIResponse } from './ai/generate-ai-response';
export { getTaskDescription } from './ai/get-task-description';
export { getInstructions } from './ai/get-instructions';
export { parseAICodegenResponse } from './ai/parse-ai-codegen-response';
export { reviewPlan } from './ai/plan-review';
