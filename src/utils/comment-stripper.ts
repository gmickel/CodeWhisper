import stripCommentsLib from 'strip-comments';

export function stripComments(code: string, language: string): string {
  const options: stripCommentsLib.Options = {
    language,
    preserveNewlines: true,
  };

  return stripCommentsLib(code, options);
}
