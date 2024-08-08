import chalk from 'chalk';
import { detectLanguage } from '../../core/file-worker';
import type { AIFileChange, AIFileInfo } from '../../types';
import getLogger from '../../utils/logger';
import { handleDeletedFiles, preprocessBlock } from './common-parser';

const logger = getLogger(true);

/**
 * Parses the AI response to extract file information and changes.
 *
 * @param response - The string response from the AI containing file information.
 * @returns An array of AIFileInfo objects representing the parsed files.
 */
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

    console.log(chalk.cyan(`Parsing file: ${path}`));
    console.log(chalk.cyan(`Status: ${status}`));

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

/**
 * Parses the AI response to extract search/replace blocks.
 *
 * @param content - The string content from the AI containing search/replace blocks.
 * @returns An array of AIFileChange objects representing the parsed search/replace blocks.
 */
function parseSearchReplaceBlocks(content: string): AIFileChange[] {
  console.log(chalk.cyan('Parsing search/replace blocks.'));

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
      console.log(chalk.red('Invalid block structure'));
    }
  }

  console.log(chalk.cyan(`Found ${changes.length} valid changes`));
  return changes;
}

/**
 * Applies the search/replace blocks to the source code.
 *
 * @param source - The string source code to apply the search/replace blocks to.
 * @param searchReplaceBlocks - The array of AIFileChange objects representing the search/replace blocks.
 * @returns The string result of applying the search/replace blocks to the source code.
 */
export function applySearchReplace(
  source: string,
  searchReplaceBlocks: AIFileChange[],
): string {
  let result = source;

  for (const block of searchReplaceBlocks) {
    const matchResult = flexibleMatch(result, block.search, block.replace);
    if (matchResult) {
      result = matchResult;
    }
  }

  return result;
}

/**
 * Attempts to match the search block to the content and replace it with the replace block.
 *
 * @param content - The string content to match the search block to.
 * @param searchBlock - The string search block to match to the content.
 * @param replaceBlock - The string replace block to replace the search block with.
 * @returns The string result of applying the search/replace blocks to the source code.
 */
function flexibleMatch(
  content: string,
  searchBlock: string,
  replaceBlock: string,
): string | null {
  // Try for a perfect match
  let result = perfectReplace(content, searchBlock, replaceBlock);
  if (result) {
    return result;
  }

  // Try being flexible about whitespace
  result = replaceWithFlexibleWhitespace(content, searchBlock, replaceBlock);
  if (result) {
    return result;
  }

  // If nothing else, log the failure so the user can manually fix it
  console.warn(chalk.yellow(generateMatchFailureReport(content, searchBlock)));
  logger.info(
    generateMatchFailureReport(
      'Match Failure:',
      `${searchBlock}\n${replaceBlock}`,
    ),
  );
  return null;
}

/**
 * Attempts to replace the search block with the replace block in the content.
 *
 * @param whole - The string content to replace the search block in.
 * @param part - The string search block to replace in the content.
 * @param replace - The string replace block to replace the search block with.
 * @returns The string result of replacing the search block with the replace block in the content.
 */
function perfectReplace(
  whole: string,
  part: string,
  replace: string,
): string | null {
  const index = whole.indexOf(part);
  if (index !== -1) {
    return whole.slice(0, index) + replace + whole.slice(index + part.length);
  }
  return null;
}

/**
 * Attempts to replace the search block with the replace block in the content.
 *
 * @param whole - The string content to replace the search block in.
 * @param part - The string search block to replace in the content.
 * @param replace - The string replace block to replace the search block with.
 * @returns The string result of replacing the search block with the replace block in the content.
 */
function replaceWithFlexibleWhitespace(
  whole: string,
  part: string,
  replace: string,
): string | null {
  const wholeLines = whole.split('\n');
  const partLines = part.split('\n');
  const replaceLines = replace.split('\n');

  for (let i = 0; i <= wholeLines.length - partLines.length; i++) {
    const chunk = wholeLines.slice(i, i + partLines.length);
    if (
      chunk.map((l) => l.trim()).join('\n') ===
      partLines.map((l) => l.trim()).join('\n')
    ) {
      const newChunk = chunk.map((line, index) => {
        const leadingSpace = line.match(/^\s*/)?.[0] || '';
        return leadingSpace + replaceLines[index].trim();
      });
      return [
        ...wholeLines.slice(0, i),
        ...newChunk,
        ...wholeLines.slice(i + partLines.length),
      ].join('\n');
    }
  }

  return null;
}

/**
 * Generates a report of the failure to match the search block to the content.
 *
 * @param content - The string content to match the search block to.
 * @param searchBlock - The string search block to match to the content.
 * @returns The string result of the failure to match the search block to the content.
 */
function generateMatchFailureReport(
  content: string,
  searchBlock: string,
): string {
  const contentLines = content.split('\n');
  const searchLines = searchBlock.split('\n');

  let errorMessage = 'Failed to match the following block:\n\n';
  errorMessage += `${searchBlock}\n\n`;
  errorMessage += 'Possible similar sections in the file:\n\n';

  const similarLines = findSimilarLines(searchLines, contentLines);
  errorMessage += similarLines;

  errorMessage += '\n\nThis diff will have to be applied manually.\n\n';

  return errorMessage;
}

/**
 * Finds similar lines in the content to the search block.
 *
 * @param searchLines - The string search block to match to the content.
 * @param contentLines - The string content to match the search block to.
 * @returns The string result of the failure to match the search block to the content.
 */
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

/**
 * Calculates the similarity between two arrays of strings.
 *
 * @param a - The first array of strings to compare.
 * @param b - The second array of strings to compare.
 * @returns The similarity between the two arrays of strings.
 */
function calculateSimilarity(a: string[], b: string[]): number {
  const matches = a.filter((line, index) => line === b[index]).length;
  return matches / Math.max(a.length, b.length);
}
