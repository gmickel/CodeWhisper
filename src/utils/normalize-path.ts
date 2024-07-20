export function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}
