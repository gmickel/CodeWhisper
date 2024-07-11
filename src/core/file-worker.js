/**
 * This file is configured to use a JavaScript worker file (`file-worker.js`)
 * because the `Piscina` worker-thread pool works better with a JavaScript file as the entry point.
 * This ensures compatibility in both development (`src`), testing (`tests`), and production (`dist`).
 */
import fs from 'fs-extra';
import { isBinaryFile } from 'isbinaryfile';
import { stripComments } from '../utils/comment-stripper';
import { detectLanguage } from '../utils/language-detector';

/**
 * Process a file and return its metadata and content.
 *
 * @param {Object} options - The options for processing the file.
 * @param {string} options.filePath - The path of the file to process.
 * @param {boolean} options.suppressComments - Whether to suppress comments in the file content.
 * @returns {Promise<Object|null>} A promise that resolves to an object containing the file metadata and content,
 *                                or null if there was an error processing the file.
 */
export default async function processFile({ filePath, suppressComments }) {
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
