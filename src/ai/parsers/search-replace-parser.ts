import * as Diff3 from 'node-diff3';
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

    const fileInfo: AIFileInfo = {
      path,
      language: detectLanguage(path),
      status,
      explanation,
    };

    if (status === 'modified') {
      const changes = parseSearchReplaceBlocks(content);
      if (changes.length > 0) {
        fileInfo.changes = changes;
      } else {
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

export function applySearchReplace(
  source: string,
  searchReplaceBlocks: AIFileChange[],
): string {
  const result = source.split('\n');

  for (const block of searchReplaceBlocks) {
    const searchArray = block.search.split('\n');
    const replaceArray = block.replace.split('\n');

    // Create a patch
    const patch = Diff3.diffPatch(searchArray, replaceArray);

    // Find the location in the result that matches the search
    let startIndex = -1;
    for (let i = 0; i <= result.length - searchArray.length; i++) {
      if (result.slice(i, i + searchArray.length).join('\n') === block.search) {
        startIndex = i;
        break;
      }
    }

    if (startIndex !== -1) {
      // Apply the patch at the found location
      const changedSection = Diff3.patch(
        result.slice(startIndex, startIndex + searchArray.length),
        patch,
      );
      if (Array.isArray(changedSection)) {
        result.splice(startIndex, searchArray.length, ...changedSection);
      } else {
        console.warn(`Failed to apply patch for search block: ${block.search}`);
      }
    } else {
      console.warn(`Search block not found: ${block.search}`);
    }
  }

  return result.join('\n');
}
