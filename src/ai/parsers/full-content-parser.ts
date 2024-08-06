import type { AIFileInfo } from '../../types';
import { handleDeletedFiles } from './common-parser';
export function parseFullContentFiles(response: string): AIFileInfo[] {
  let files: AIFileInfo[] = [];

  // Parse individual files
  const fileRegex =
    /<file>[\s\S]*?<file_path>(.*?)<\/file_path>[\s\S]*?<file_content language="(.*?)">([\s\S]*?)<\/file_content>[\s\S]*?<file_status>(.*?)<\/file_status>(?:[\s\S]*?<explanation>([\s\S]*?)<\/explanation>)?[\s\S]*?<\/file>/gs;
  let match: RegExpExecArray | null;
  while (true) {
    match = fileRegex.exec(response);
    if (match === null) break;
    const [, path, language, content, status, explanation] = match;
    files.push({
      path: path.trim(),
      language: language.trim(),
      content: content.trim(),
      status: status.trim() as 'new' | 'modified' | 'deleted',
      explanation: explanation ? explanation.trim() : undefined,
    });
  }

  files = handleDeletedFiles(files, response);

  return files;
}
