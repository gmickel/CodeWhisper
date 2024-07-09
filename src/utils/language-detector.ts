import path from 'node:path';

const languageMap: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  rb: 'ruby',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  cs: 'csharp',
  go: 'go',
  rs: 'rust',
  php: 'php',
  html: 'html',
  css: 'css',
  json: 'json',
  md: 'markdown',
  yml: 'yaml',
  yaml: 'yaml',
  xml: 'xml',
  sql: 'sql',
  sh: 'bash',
  bat: 'batch',
  ps1: 'powershell',
  // Add more mappings as needed
};

export function detectLanguage(filePath: string): string {
  const extension = path.extname(filePath).slice(1).toLowerCase();
  return languageMap[extension] || 'plaintext';
}
