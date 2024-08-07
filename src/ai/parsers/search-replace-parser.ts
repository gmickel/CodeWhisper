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
  console.log('Original content length:', source.length);

  for (const block of searchReplaceBlocks) {
    console.log('Applying search/replace block:', block);
    const matchResult = flexibleMatch(result, block.search, block.replace);
    if (matchResult) {
      result = matchResult;
      console.log(
        'Block applied successfully. New content length:',
        result.length,
      );
    } else {
      console.warn(
        'Failed to apply block:',
        handleMatchFailure(result, block.search),
      );
    }
  }

  console.log('Final content length after all changes:', result.length);
  return result;
}

function flexibleMatch(
  content: string,
  searchBlock: string,
  replaceBlock: string,
): string | null {
  console.log('Attempting flexible match');
  console.log('Content length:', content.length);
  console.log('Search block length:', searchBlock.length);
  console.log('Replace block length:', replaceBlock.length);

  // Try exact matching
  const patch = Diff3.diffPatch(content.split('\n'), searchBlock.split('\n'));
  let result = Diff3.patch(content.split('\n'), patch);

  if (result) {
    console.log('Exact match successful');
    const finalResult = result.join('\n').replace(searchBlock, replaceBlock);
    console.log('Result after exact match. Length:', finalResult.length);
    return finalResult;
  }

  console.log('Exact match failed, trying flexible whitespace match');

  // Try matching with flexible whitespace
  const normalizedContent = content.replace(/\s+/g, ' ');
  const normalizedSearch = searchBlock.replace(/\s+/g, ' ');
  const flexPatch = Diff3.diffPatch(
    normalizedContent.split('\n'),
    normalizedSearch.split('\n'),
  );
  result = Diff3.patch(normalizedContent.split('\n'), flexPatch);

  if (result) {
    console.log('Flexible whitespace match successful');
    const flexResult = result
      .join('\n')
      .replace(normalizedSearch, replaceBlock);
    const mappedResult = mapChangesToOriginal(content, flexResult);
    console.log(
      'Result after flexible match and mapping. Length:',
      mappedResult.length,
    );
    return mappedResult;
  }

  console.log('All matching attempts failed');
  return null;
}

function mapChangesToOriginal(
  originalContent: string,
  changedContent: string,
): string {
  console.log('Mapping changes to original content');
  console.log('Original content length:', originalContent.length);
  console.log('Changed content length:', changedContent.length);

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

  console.log('Mapping complete. Result length:', result.length);
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
