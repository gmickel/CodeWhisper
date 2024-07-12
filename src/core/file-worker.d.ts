export function detectLanguage(filePath: string): string;
export function stripComments(code: string, language: string): string;
export default function processFile(options: {
  filePath: string;
  suppressComments: boolean;
}): Promise<object | null>;
