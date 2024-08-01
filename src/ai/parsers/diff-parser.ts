import { type ParsedDiff, parsePatch } from 'diff';
import type { AIFileInfo } from '../../types';

export function parseDiffFiles(response: string): AIFileInfo[] {
  const files: AIFileInfo[] = [];

  const fileRegex =
    /<file>[\s\S]*?<file_path>(.*?)<\/file_path>[\s\S]*?<file_status>(.*?)<\/file_status>[\s\S]*?<file_content language="(.*?)">([\s\S]*?)<\/file_content>(?:[\s\S]*?<explanation>([\s\S]*?)<\/explanation>)?[\s\S]*?<\/file>/gs;
  let match: RegExpExecArray | null;
  while (true) {
    match = fileRegex.exec(response);
    if (match === null) break;
    const [, path, status, language, content, explanation] = match;
    const fileInfo: AIFileInfo = {
      path: path.trim(),
      language: language.trim(),
      status: status.trim() as 'new' | 'modified' | 'deleted',
      explanation: explanation ? explanation.trim() : undefined,
    };

    if (status.trim() === 'modified') {
      try {
        const parsedDiff = parsePatch(content.trim())[0] as ParsedDiff;
        // Simplify the diff object to match our expected structure
        fileInfo.diff = {
          oldFileName: parsedDiff.oldFileName,
          newFileName: parsedDiff.newFileName,
          hunks: parsedDiff.hunks.map((hunk) => ({
            oldStart: hunk.oldStart,
            oldLines: hunk.oldLines,
            newStart: hunk.newStart,
            newLines: hunk.newLines,
            lines: hunk.lines,
          })),
        };
      } catch (error) {
        console.error(`Error parsing diff for ${path}:`, error);
        continue;
      }
    } else if (status.trim() === 'new') {
      fileInfo.content = content.trim();
    }

    files.push(fileInfo);
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
      status: 'deleted',
    });
  }

  return files;
}
