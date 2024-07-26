import type { AIFileInfo, AIParsedResponse } from '../types';

export function parseAICodegenResponse(response: string): AIParsedResponse {
  const files: AIFileInfo[] = [];

  // Parse file list
  const fileListMatch = response.match(/<file_list>([\s\S]*?)<\/file_list>/);
  const fileList = fileListMatch
    ? fileListMatch[1]
        .trim()
        .split('\n')
        .map((file) => file.trim())
    : [];

  // Parse individual files
  const fileRegex =
    /<file>[\s\S]*?<file_path>(.*?)<\/file_path>[\s\S]*?<file_content language="(.*?)">([\s\S]*?)<\/file_content>[\s\S]*?<file_status>(.*?)<\/file_status>(?:[\s\S]*?<explanation>([\s\S]*?)<\/explanation>)?[\s\S]*?<\/file>/g;
  let match: RegExpExecArray | null;
  while (true) {
    match = fileRegex.exec(response);
    if (match === null) break;
    const [, path, language, content, status, explanation] = match;
    files.push({
      path: path.trim(),
      language: language.trim(),
      content: content.trim(),
      status: status.trim() as 'new' | 'modified' | 'deleted',
      explanation: explanation ? explanation.trim() : undefined,
    });
  }

  // Handle deleted files (which don't have content)
  const deletedFileRegex =
    /<file>[\s\S]*?<file_path>(.*?)<\/file_path>[\s\S]*?<file_status>deleted<\/file_status>[\s\S]*?<\/file>/g;
  let deletedMatch: RegExpExecArray | null;
  while (true) {
    deletedMatch = deletedFileRegex.exec(response);
    if (deletedMatch === null) break;
    const [, path] = deletedMatch;
    files.push({
      path: path.trim(),
      language: '',
      content: '',
      status: 'deleted',
    });
  }

  // Parse git branch name
  const gitBranchNameMatch = response.match(
    /<git_branch_name>([\s\S]*?)<\/git_branch_name>/,
  );
  const gitBranchName = gitBranchNameMatch ? gitBranchNameMatch[1].trim() : '';

  // Parse git commit message
  const gitCommitMessageMatch = response.match(
    /<git_commit_message>([\s\S]*?)<\/git_commit_message>/,
  );
  const gitCommitMessage = gitCommitMessageMatch
    ? gitCommitMessageMatch[1].trim()
    : '';

  // Parse summary
  const summaryMatch = response.match(/<summary>([\s\S]*?)<\/summary>/);
  const summary = summaryMatch ? summaryMatch[1].trim() : '';

  // Parse potential issues
  const potentialIssuesMatch = response.match(
    /<potential_issues>([\s\S]*?)<\/potential_issues>/,
  );
  const potentialIssues = potentialIssuesMatch
    ? potentialIssuesMatch[1].trim()
    : '';

  return {
    fileList,
    files,
    gitBranchName,
    gitCommitMessage,
    summary,
    potentialIssues,
  };
}
