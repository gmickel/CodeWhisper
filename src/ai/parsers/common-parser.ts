import type { AIParsedResponse } from '../../types';
import { ensureValidBranchName } from '../../utils/git-tools';

export function parseCommonFields(response: string): Partial<AIParsedResponse> {
  const result: Partial<AIParsedResponse> = {
    fileList: [],
    gitBranchName: '',
    gitCommitMessage: '',
    summary: '',
    potentialIssues: '',
  };

  // Parse file list
  const fileListMatch = response.match(/<file_list>([\s\S]*?)<\/file_list>/);
  result.fileList = fileListMatch
    ? fileListMatch[1]
        .trim()
        .split('\n')
        .map((file) => file.trim())
        .filter((file) => file !== '')
    : [];

  // Parse other fields
  result.gitBranchName = ensureValidBranchName(
    parseField(response, 'git_branch_name'),
  );
  result.gitCommitMessage = parseField(response, 'git_commit_message');
  result.summary = parseField(response, 'summary');
  result.potentialIssues = parseField(response, 'potential_issues');

  return result;
}

export function parseField(response: string, fieldName: string): string {
  const regex = new RegExp(`<${fieldName}>([\\s\\S]*?)<\\/${fieldName}>`, 'g');
  const match = regex.exec(response);
  return match ? match[1].trim() : '';
}

export function isResponseMalformed(result: AIParsedResponse): boolean {
  return (
    result.fileList.length === 0 &&
    result.files.length === 0 &&
    result.gitCommitMessage === ''
  );
}
