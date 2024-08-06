import { parsePatch } from 'diff';
import type { AIFileInfo } from '../../types';

export function parseDiffFiles(response: string): AIFileInfo[] {
  const files: AIFileInfo[] = [];

  const fileRegex =
    /<file>[\s\S]*?<file_path>(.*?)<\/file_path>[\s\S]*?<file_status>(.*?)<\/file_status>[\s\S]*?<file_content language="(.*?)">([\s\S]*?)<\/file_content>(?:[\s\S]*?<explanation>([\s\S]*?)<\/explanation>)?[\s\S]*?<\/file>/gs;
  let match: RegExpExecArray | null;

  // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
  while ((match = fileRegex.exec(response)) !== null) {
    const [, path, status, language, content, explanation] = match;
    const fileInfo: AIFileInfo = {
      path: path.trim(),
      language: language.trim(),
      status: status.trim() as 'new' | 'modified' | 'deleted',
      explanation: explanation ? explanation.trim() : undefined,
    };

    if (status.trim() === 'modified') {
      try {
        const normalizedContent = content.trim().replace(/\r\n/g, '\n');
        const parsedDiff = parsePatch(normalizedContent);

        if (parsedDiff.length > 0 && parsedDiff[0].hunks.length > 0) {
          const diff = parsedDiff[0];
          fileInfo.diff = {
            oldFileName: diff.oldFileName || path,
            newFileName: diff.newFileName || path,
            hunks: diff.hunks.map((hunk) => ({
              oldStart: hunk.oldStart,
              oldLines: hunk.oldLines,
              newStart: hunk.newStart,
              newLines: hunk.newLines,
              lines: hunk.lines,
            })),
          };
        } else {
          console.error(`No valid diff found for ${path}`);
        }
      } catch (error) {
        console.error(`Error parsing diff for ${path}:`, error);
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

  // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
  while ((deletedMatch = deletedFileRegex.exec(response)) !== null) {
    const [, path] = deletedMatch;
    files.push({
      path: path.trim(),
      language: '',
      status: 'deleted',
    });
  }

  return files;
}
