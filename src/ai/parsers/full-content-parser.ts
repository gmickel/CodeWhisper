import type { AIFileInfo } from '../../types';

export function parseFullContentFiles(response: string): AIFileInfo[] {
  const files: AIFileInfo[] = [];

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

  // Handle deleted files
  const deletedFileRegex =
    /<file>[\s\S]*?<file_path>(.*?)<\/file_path>[\s\S]*?<file_status>deleted<\/file_status>[\s\S]*?<\/file>/g;
  let deletedMatch: RegExpExecArray | null;
  while (true) {
    deletedMatch = deletedFileRegex.exec(response);
    if (deletedMatch === null) break;
    const [, path] = deletedMatch;
    files.push({
      path: path.trim(),
      language: '',
      content: '',
      status: 'deleted',
    });
  }

  return files;
}
