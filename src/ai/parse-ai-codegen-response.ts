import { detectLanguage } from '../core/file-worker';
import type { AIFileChange, AIFileInfo, AIParsedResponse } from '../types';
import getLogger from '../utils/logger';

export function parseAICodegenResponse(
  response: string,
  logAiInteractions = false,
): AIParsedResponse {
  const logger = getLogger(logAiInteractions);
  const result: AIParsedResponse = {
    fileList: [],
    files: [],
    gitBranchName: '',
    gitCommitMessage: '',
    summary: '',
    potentialIssues: '',
  };

  try {
    // Extract file list
    const fileListMatch = response.match(/<file_list>([\s\S]*?)<\/file_list>/);
    result.fileList = fileListMatch
      ? fileListMatch[1]
          .trim()
          .split('\n')
          .map((file) => file.trim())
      : [];

    // Extract git branch name
    const branchMatch = response.match(
      /<git_branch_name>([\s\S]*?)<\/git_branch_name>/,
    );
    result.gitBranchName = branchMatch ? branchMatch[1].trim() : '';

    // Extract git commit message
    const commitMatch = response.match(
      /<git_commit_message>([\s\S]*?)<\/git_commit_message>/,
    );
    result.gitCommitMessage = commitMatch ? commitMatch[1].trim() : '';

    // Extract summary
    const summaryMatch = response.match(/<summary>([\s\S]*?)<\/summary>/);
    result.summary = summaryMatch ? summaryMatch[1].trim() : '';

    // Extract potential issues
    const issuesMatch = response.match(
      /<potential_issues>([\s\S]*?)<\/potential_issues>/,
    );
    result.potentialIssues = issuesMatch ? issuesMatch[1].trim() : '';

    // Extract file information
    const fileBlocks = response.match(/<file>[\s\S]*?<\/file>/g) || [];
    result.files = fileBlocks.map((block) => parseFileBlock(block));

    if (isResponseMalformed(result)) {
      throw new Error('Malformed response');
    }
  } catch (error) {
    console.error('Error parsing AI response:', error);
    result.gitCommitMessage = 'Error: Malformed response';
  }

  logger.info('Parsed AI Codegen Response', { parsedResponse: result });

  return result;
}

function parseFileBlock(block: string): AIFileInfo {
  const pathMatch = block.match(/<file_path>(.*?)<\/file_path>/);
  const statusMatch = block.match(/<file_status>(.*?)<\/file_status>/);
  const contentMatch = block.match(/<file_content>([\s\S]*?)<\/file_content>/);
  const explanationMatch = block.match(
    /<explanation>([\s\S]*?)<\/explanation>/,
  );

  if (!pathMatch || !statusMatch || !contentMatch) {
    throw new Error('Invalid file block format');
  }

  const path = pathMatch[1].trim();
  const status = statusMatch[1].trim() as 'new' | 'modified' | 'deleted';
  const contentBlock = contentMatch[1].trim();
  const explanation = explanationMatch ? explanationMatch[1].trim() : undefined;

  let content: string | undefined;
  let changes: AIFileChange[] | undefined;

  if (status === 'modified') {
    changes = parseSearchReplaceBlocks(contentBlock);
  } else if (status === 'new') {
    content = contentBlock;
  }

  return {
    path,
    status,
    language: detectLanguage(path),
    content,
    changes,
    explanation,
  };
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

function isResponseMalformed(result: AIParsedResponse): boolean {
  return (
    result.fileList.length === 0 &&
    result.files.length === 0 &&
    result.gitCommitMessage === ''
  );
}
