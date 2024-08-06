import type { AIParsedResponse } from '../types';
import getLogger from '../utils/logger';
import {
  isResponseMalformed,
  parseCommonFields,
} from './parsers/common-parser';
import { parseFullContentFiles } from './parsers/full-content-parser';
import { parseSearchReplaceFiles } from './parsers/search-replace-parser';

export function parseAICodegenResponse(
  response: string,
  logAiInteractions = false,
  useDiffMode = false,
): AIParsedResponse {
  const logger = getLogger(logAiInteractions);
  let result: AIParsedResponse = {
    fileList: [],
    files: [],
    gitBranchName: '',
    gitCommitMessage: '',
    summary: '',
    potentialIssues: '',
  };

  try {
    const commonFields = parseCommonFields(response);
    result = { ...result, ...commonFields };

    if (useDiffMode) {
      result.files = parseSearchReplaceFiles(response);
    } else {
      result.files = parseFullContentFiles(response);
    }

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
