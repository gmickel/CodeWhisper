export interface MarkdownOptions {
  template?: string;
  noCodeblock?: boolean;
  customData?: Record<string, string>;
  basePath?: string;
  lineNumbers?: boolean;
}

export interface InteractiveModeOptions {
  path?: string;
  template?: string;
  prompt?: string;
  gitignore?: string;
  filter?: string[];
  exclude?: string[];
  suppressComments?: boolean;
  caseSensitive?: boolean;
  noCodeblock: boolean;
  customData?: string;
  customTemplate?: string;
  customIgnores?: string[];
  cachePath?: string;
  respectGitignore?: boolean;
  invert: boolean;
  lineNumbers?: boolean;
  openEditor?: boolean;
}

export type AiAssistedTaskOptions = Pick<
  InteractiveModeOptions,
  | 'path'
  | 'filter'
  | 'exclude'
  | 'suppressComments'
  | 'lineNumbers'
  | 'caseSensitive'
  | 'customIgnores'
  | 'cachePath'
  | 'respectGitignore'
  | 'invert'
  | 'gitignore'
  | 'noCodeblock'
> & {
  dryRun: boolean;
  maxCostThreshold?: number;
  task?: string;
  description?: string;
  instructions?: string;
  autoCommit?: boolean;
  model: string;
};

export type ProcessOptions = Pick<
  InteractiveModeOptions,
  | 'path'
  | 'gitignore'
  | 'filter'
  | 'exclude'
  | 'suppressComments'
  | 'caseSensitive'
  | 'customIgnores'
  | 'cachePath'
  | 'respectGitignore'
> & {
  matchBase?: boolean;
};

export interface FileInfo {
  path: string;
  extension: string;
  language: string;
  size: number;
  created: Date;
  modified: Date;
  content: string;
}

export interface AIFileInfo {
  path: string;
  language: string;
  content: string;
  status: 'new' | 'modified' | 'deleted';
  explanation?: string;
}

export interface AIParsedResponse {
  fileList: string[];
  files: AIFileInfo[];
  gitBranchName: string;
  gitCommitMessage: string;
  summary: string;
  potentialIssues: string;
}

export interface GenerateAIResponseOptions {
  maxCostThreshold?: number;
  model: string;
}

export interface ApplyChangesOptions {
  basePath: string;
  parsedResponse: AIParsedResponse;
  dryRun?: boolean;
}

interface LLMPricing {
  inputCost: number;
  outputCost: number;
}

export interface ModelSpec {
  contextWindow: number;
  maxOutput: number;
  modelName: string;
  pricing: LLMPricing;
}

export interface ModelSpecs {
  [key: string]: ModelSpec;
}
