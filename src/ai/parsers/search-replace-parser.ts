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
      console.warn(
        `Failed to apply change:\n${block.search}\n=====\n${block.replace}`,
      );
    }
  }

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

  // Try for a perfect match
  let result = perfectReplace(content, searchBlock, replaceBlock);
  if (result) {
    console.log('Perfect match successful');
    return result;
  }

  console.log('Perfect match failed, attempting flexible whitespace match');

  // Try being flexible about leading whitespace
  result = replaceWithMissingLeadingWhitespace(
    content,
    searchBlock,
    replaceBlock,
  );
  if (result) {
    console.log('Flexible whitespace match successful');
    return result;
  }

  console.log('All matching attempts failed');
  return null;
}

function perfectReplace(
  whole: string,
  part: string,
  replace: string,
): string | null {
  const wholeLines = whole.split('\n');
  const partLines = part.split('\n');
  const replaceLines = replace.split('\n');
  const partLen = partLines.length;

  for (let i = 0; i <= wholeLines.length - partLen; i++) {
    const chunk = wholeLines.slice(i, i + partLen);
    if (chunk.join('\n') === part) {
      return [
        ...wholeLines.slice(0, i),
        ...replaceLines,
        ...wholeLines.slice(i + partLen),
      ].join('\n');
    }
  }

  return null;
}

function replaceWithMissingLeadingWhitespace(
  whole: string,
  part: string,
  replace: string,
): string | null {
  const wholeLines = whole.split('\n');
  const partLines = part.split('\n');
  const replaceLines = replace.split('\n');

  // Outdent everything in partLines and replaceLines by the max fixed amount possible
  const minLeading = Math.min(
    ...partLines
      .filter((l) => l.trim())
      .map((l) => l.length - l.trimStart().length),
    ...replaceLines
      .filter((l) => l.trim())
      .map((l) => l.length - l.trimStart().length),
  );

  const outdentedPartLines = partLines.map((l) => l.slice(minLeading));
  const outdentedReplaceLines = replaceLines.map((l) => l.slice(minLeading));

  for (let i = 0; i <= wholeLines.length - outdentedPartLines.length; i++) {
    const chunk = wholeLines.slice(i, i + outdentedPartLines.length);
    const leadingSpace = chunk[0].slice(
      0,
      chunk[0].length - chunk[0].trimStart().length,
    );

    if (
      chunk.map((l) => l.slice(leadingSpace.length)).join('\n') ===
      outdentedPartLines.join('\n')
    ) {
      const newChunk = outdentedReplaceLines.map((l) => leadingSpace + l);
      return [
        ...wholeLines.slice(0, i),
        ...newChunk,
        ...wholeLines.slice(i + outdentedPartLines.length),
      ].join('\n');
    }
  }

  return null;
}

function handleMatchFailure(content: string, searchBlock: string): string {
  const contentLines = content.split('\n');
  const searchLines = searchBlock.split('\n');

  let errorMessage = 'Failed to match the following block:\n\n';
  errorMessage += `${searchBlock}\n\n`;
  errorMessage += 'Possible similar sections in the file:\n\n';

  const similarLines = findSimilarLines(searchLines, contentLines);
  errorMessage += similarLines;

  return errorMessage;
}

function findSimilarLines(
  searchLines: string[],
  contentLines: string[],
  threshold = 0.6,
): string {
  let bestRatio = 0;
  let bestMatch: string[] = [];
  let bestMatchIndex = -1;

  for (let i = 0; i <= contentLines.length - searchLines.length; i++) {
    const chunk = contentLines.slice(i, i + searchLines.length);
    const ratio = calculateSimilarity(searchLines, chunk);
    if (ratio > bestRatio) {
      bestRatio = ratio;
      bestMatch = chunk;
      bestMatchIndex = i;
    }
  }

  if (bestRatio < threshold) {
    return '';
  }

  if (
    bestMatch[0] === searchLines[0] &&
    bestMatch[bestMatch.length - 1] === searchLines[searchLines.length - 1]
  ) {
    return bestMatch.join('\n');
  }

  const N = 5;
  const start = Math.max(0, bestMatchIndex - N);
  const end = Math.min(
    contentLines.length,
    bestMatchIndex + searchLines.length + N,
  );
  return contentLines.slice(start, end).join('\n');
}

function calculateSimilarity(a: string[], b: string[]): number {
  const matches = a.filter((line, index) => line === b[index]).length;
  return matches / Math.max(a.length, b.length);
}
