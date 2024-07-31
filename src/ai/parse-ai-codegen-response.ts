import type { AIParsedResponse } from '../types';
import { ensureValidBranchName } from '../utils/git-tools';
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
    // Parse file list
    const fileListMatch = response.match(/<file_list>([\s\S]*?)<\/file_list>/);
    result.fileList = fileListMatch
      ? fileListMatch[1]
          .trim()
          .split('\n')
          .map((file) => file.trim())
          .filter((file) => file !== '')
      : [];

    // Parse individual files
    const fileRegex =
      /<file>[\s\S]*?<file_path>(.*?)<\/file_path>[\s\S]*?<file_content language="(.*?)">([\s\S]*?)<\/file_content>[\s\S]*?<file_status>(.*?)<\/file_status>(?:[\s\S]*?<explanation>([\s\S]*?)<\/explanation>)?[\s\S]*?<\/file>/gs;
    let match: RegExpExecArray | null;
    while (true) {
      match = fileRegex.exec(response);
      if (match === null) break;
      const [, path, language, content, status, explanation] = match;
      result.files.push({
        path: path.trim(),
        language: language.trim(),
        content: content.trim(),
        status: status.trim() as 'new' | 'modified' | 'deleted',
        explanation: explanation ? explanation.trim() : undefined,
      });
    }

    // Handle deleted files
    const deletedFileRegex =
      /<file>[\s\S]*?<file_path>(.*?)<\/file_path>[\s\S]*?<file_status>deleted<\/file_status>[\s\S]*?<\/file>/g;
    let deletedMatch: RegExpExecArray | null;
    while (true) {
      deletedMatch = deletedFileRegex.exec(response);
      if (deletedMatch === null) break;
      const [, path] = deletedMatch;
      result.files.push({
        path: path.trim(),
        language: '',
        content: '',
        status: 'deleted',
      });
    }

    // Parse other fields
    result.gitBranchName = ensureValidBranchName(
      parseField(response, 'git_branch_name'),
    );
    result.gitCommitMessage = parseField(response, 'git_commit_message');
    result.summary = parseField(response, 'summary');
    result.potentialIssues = parseField(response, 'potential_issues');

    // Check if the response is malformed
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

function parseField(response: string, fieldName: string): string {
  const regex = new RegExp(`<${fieldName}>([\\s\\S]*?)<\\/${fieldName}>`, 'g');
  const match = regex.exec(response);
  return match ? match[1].trim() : '';
}

function isResponseMalformed(result: AIParsedResponse): boolean {
  // Consider the response malformed only if all main fields are empty
  return (
    result.fileList.length === 0 &&
    result.files.length === 0 &&
    result.gitCommitMessage === ''
  );
}
