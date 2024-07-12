import path from 'node:path';
/**
 * This file is configured to use a JavaScript worker file (`file-worker.js`)
 * because the `Piscina` worker-thread pool works better with a JavaScript file as the entry point.
 * This ensures compatibility in both development (`src`), testing (`tests`), and production (`dist`).
 */
import fs from 'fs-extra';
import { isBinaryFile } from 'isbinaryfile';
import stripCommentsLib from 'strip-comments';

/**
 * Strips comments from the given code.
 *
 * @param {string} code - The code from which to strip comments.
 * @param {string} language - The language of the code (e.g., 'javascript', 'python').
 * @returns {string} - The code with comments stripped.
 */
export function stripComments(code, language) {
  const options = {
    language,
    preserveNewlines: true,
  };

  return stripCommentsLib(code, options);
}

const languageMap = {
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

/**
 * Detects the language of a file based on its extension.
 *
 * @param {string} filePath - The path of the file.
 * @returns {string} The detected language of the file.
 */
export function detectLanguage(filePath) {
  const extension = path.extname(filePath).slice(1).toLowerCase();
  return languageMap[extension] || 'plaintext';
}

/**
 * Process a file and return its metadata and content.
 *
 * @param {Object} options - The options for processing the file.
 * @param {string} options.filePath - The path of the file to process.
 * @param {boolean} options.suppressComments - Whether to suppress comments in the file content.
 * @returns {Promise<Object|null>} A promise that resolves to an object containing the file metadata and content,
 *                                or null if there was an error processing the file.
 */
export default async function processFile({
  filePath,
  suppressComments = false,
}) {
  try {
    const stats = await fs.stat(filePath);
    const buffer = await fs.readFile(filePath);

    if (await isBinaryFile(buffer)) {
      return null;
    }

    let content = buffer.toString('utf-8');
    const extension = filePath.split('.').pop() ?? '';
    const language = detectLanguage(filePath);

    if (suppressComments) {
      content = stripComments(content, language);
    }

    return {
      path: filePath,
      extension,
      language,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      content,
    };
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    return null;
  }
}
