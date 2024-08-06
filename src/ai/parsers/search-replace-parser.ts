import { detectLanguage } from '../../core/file-worker';
import type { AIFileChange, AIFileInfo } from '../../types';

export function parseSearchReplaceFiles(response: string): AIFileInfo[] {
  const files: AIFileInfo[] = [];

  const fileRegex =
    /<file>[\s\S]*?<file_path>(.*?)<\/file_path>[\s\S]*?<file_status>(.*?)<\/file_status>[\s\S]*?<file_content>([\s\S]*?)<\/file_content>(?:[\s\S]*?<explanation>([\s\S]*?)<\/explanation>)?[\s\S]*?<\/file>/gs;
  let match: RegExpExecArray | null;

  // biome-ignore lint/suspicious/noAssignInExpressions: avoid infinite loop
  while ((match = fileRegex.exec(response)) !== null) {
    const [, path, status, content, explanation] = match;
    const fileInfo: AIFileInfo = {
      path: path.trim(),
      language: detectLanguage(path),
      status: status.trim() as 'new' | 'modified' | 'deleted',
      explanation: explanation ? explanation.trim() : undefined,
    };

    if (status.trim() === 'modified') {
      fileInfo.changes = parseSearchReplaceBlocks(content);
    } else if (status.trim() === 'new') {
      fileInfo.content = content.trim();
    }

    files.push(fileInfo);
  }

  return files;
}

function parseSearchReplaceBlocks(content: string): AIFileChange[] {
  const blocks = content.split(/(?=<<<<<<< SEARCH)/);
  return blocks
    .map((block) => {
      const [search, replace] = block.split(/^=======\s*$/m);
      return {
        search: search.replace(/^<<<<<<< SEARCH\s*\n/, '').trim(),
        replace: replace.replace(/\s*>>>>>>> REPLACE.*?$/, '').trim(),
      };
    })
    .filter((change) => change.search && change.replace);
}
