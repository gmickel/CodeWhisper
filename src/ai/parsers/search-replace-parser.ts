import { detectLanguage } from '../../core/file-worker';
import type { AIFileChange, AIFileInfo } from '../../types';
import { handleDeletedFiles } from './common-parser';

export function parseSearchReplaceFiles(response: string): AIFileInfo[] {
  let files: AIFileInfo[] = [];

  const fileRegex = /<file>([\s\S]*?)<\/file>/g;
  let fileMatch: RegExpExecArray | null;

  // biome-ignore lint/suspicious/noAssignInExpressions: avoid infinite loop
  while ((fileMatch = fileRegex.exec(response)) !== null) {
    const fileContent = fileMatch[1];

    const pathMatch = /<file_path>(.*?)<\/file_path>/.exec(fileContent);
    const statusMatch = /<file_status>(.*?)<\/file_status>/.exec(fileContent);
    const contentMatch = /<file_content>([\s\S]*?)<\/file_content>/.exec(
      fileContent,
    );
    const explanationMatch = /<explanation>([\s\S]*?)<\/explanation>/.exec(
      fileContent,
    );

    if (!pathMatch || !statusMatch || !contentMatch) {
      console.warn('Skipping file due to missing required information');
      continue;
    }

    const path = pathMatch[1].trim();
    const status = statusMatch[1].trim() as 'new' | 'modified' | 'deleted';
    const content = contentMatch[1].trim();
    const explanation = explanationMatch
      ? explanationMatch[1].trim()
      : undefined;

    console.log(`Parsing file: ${path}`);
    console.log(`Status: ${status}`);
    console.log(`Content: ${content}`);

    const fileInfo: AIFileInfo = {
      path,
      language: detectLanguage(path),
      status,
      explanation,
    };

    if (status === 'modified') {
      fileInfo.changes = parseSearchReplaceBlocks(content);
      if (fileInfo.changes.length === 0) {
        console.warn(`No changes found for modified file: ${path}`);
        fileInfo.content = content;
      }
    } else if (status === 'new') {
      fileInfo.content = content;
    }

    files.push(fileInfo);
  }

  files = handleDeletedFiles(files, response);

  return files;
}
function parseSearchReplaceBlocks(content: string): AIFileChange[] {
  console.log('Parsing search/replace blocks. Content:', content);

  const blockRegex =
    /<<<<<<< SEARCH([\s\S]*?)=======([\s\S]*?)>>>>>>> REPLACE/g;
  const changes: AIFileChange[] = [];
  let match: RegExpExecArray | null;

  // biome-ignore lint/suspicious/noAssignInExpressions: avoid infinite loop
  while ((match = blockRegex.exec(content)) !== null) {
    const search = match[1].trim();
    const replace = match[2].trim();

    if (search && replace) {
      changes.push({ search, replace });
    } else {
      console.log('Invalid block structure');
    }
  }

  console.log(`Found ${changes.length} valid changes`);
  return changes;
}
