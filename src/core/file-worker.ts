import fs from 'fs-extra';
import { isBinaryFile } from 'isbinaryfile';
import { stripComments } from '../utils/comment-stripper';
import { detectLanguage } from '../utils/language-detector';

interface WorkerData {
  filePath: string;
  suppressComments: boolean;
}

export default async function processFile({
  filePath,
  suppressComments,
}: WorkerData) {
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
