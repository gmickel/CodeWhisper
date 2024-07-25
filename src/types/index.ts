export interface InteractiveModeOptions {
  path?: string;
  template?: string;
  prompt?: string;
  gitignore?: string;
  filter?: string[];
  exclude?: string[];
  suppressComments?: boolean;
  caseSensitive?: boolean;
  noCodeblock?: boolean;
  customData?: string;
  customTemplate?: string;
  customIgnores?: string[];
  cachePath?: string;
  respectGitignore?: boolean;
  invert?: boolean;
  lineNumbers?: boolean;
  openEditor?: boolean;
  plan?: boolean;
}

export type InteractiveModeOptionsWithoutPlan = Omit<
  InteractiveModeOptions,
  'plan'
>;
