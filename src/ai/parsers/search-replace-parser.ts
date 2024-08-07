import * as Diff3 from 'node-diff3';
import { detectLanguage } from '../../core/file-worker';
import type { AIFileChange, AIFileInfo } from '../../types';
import { handleDeletedFiles, preprocessBlock } from './common-parser';

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
    const search = preprocessBlock(match[1].trim());
    const replace = preprocessBlock(match[2].trim());

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
  let result = source;

  for (const block of searchReplaceBlocks) {
    const matchResult = flexibleMatch(result, block.search, block.replace);
    if (matchResult) {
      result = matchResult;
    } else {
      console.warn(handleMatchFailure(result, block.search));
    }
  }

  return result;
}

function flexibleMatch(
  content: string,
  searchBlock: string,
  replaceBlock: string,
): string | null {
  // Try exact matching
  const patch = Diff3.diffPatch(content.split('\n'), searchBlock.split('\n'));
  let result = Diff3.patch(content.split('\n'), patch);

  if (result) {
    return result.join('\n').replace(searchBlock, replaceBlock);
  }

  // Try matching with flexible whitespace
  const normalizedContent = content.replace(/\s+/g, ' ');
  const normalizedSearch = searchBlock.replace(/\s+/g, ' ');
  const flexPatch = Diff3.diffPatch(
    normalizedContent.split('\n'),
    normalizedSearch.split('\n'),
  );
  result = Diff3.patch(normalizedContent.split('\n'), flexPatch);

  if (result) {
    // Map the changes back to the original content
    return mapChangesToOriginal(
      content,
      result.join('\n').replace(normalizedSearch, replaceBlock),
    );
  }

  return null;
}

function mapChangesToOriginal(
  originalContent: string,
  changedContent: string,
): string {
  const originalLines = originalContent.split('\n');
  const changedLines = changedContent.split('\n');

  let result = '';
  let originalIndex = 0;
  let changedIndex = 0;

  while (
    originalIndex < originalLines.length &&
    changedIndex < changedLines.length
  ) {
    if (
      originalLines[originalIndex].trim() === changedLines[changedIndex].trim()
    ) {
      result += `${originalLines[originalIndex]}\n`;
      originalIndex++;
      changedIndex++;
    } else {
      result += `${changedLines[changedIndex]}\n`;
      changedIndex++;
    }
  }

  // Add any remaining lines from either original or changed content
  while (originalIndex < originalLines.length) {
    result += `${originalLines[originalIndex]}\n`;
    originalIndex++;
  }
  while (changedIndex < changedLines.length) {
    result += `${changedLines[changedIndex]}\n`;
    changedIndex++;
  }

  return result.trim();
}

function handleMatchFailure(content: string, searchBlock: string): string {
  const contentLines = content.split('\n');
  const searchLines = searchBlock.split('\n');
  const indices = Diff3.diffIndices(contentLines, searchLines);

  let errorMessage = 'Failed to match the following block:\n\n';
  errorMessage += `${searchBlock}\n\n`;
  errorMessage += 'Possible similar sections in the file:\n\n';

  for (const index of indices) {
    if (Array.isArray(index) && index.length >= 2) {
      const start = Math.max(0, index[0] - 2);
      const end = Math.min(contentLines.length, index[1] + 3);
      errorMessage += `${contentLines.slice(start, end).join('\n')}\n---\n`;
    }
  }

  return errorMessage;
}
