import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';

/**
 * Resolves the path to a file, checking for both TypeScript and JavaScript versions.
 * This is useful for resolving paths that might be different in development and production.
 *
 * @param importMetaUrl Pass import.meta.url from the calling module
 * @param fileName The name of the file without extension
 * @returns The resolved path to the file
 */
export function resolveModulePath(
  importMetaUrl: string,
  fileName: string,
): string {
  const tsPath = joinPath(importMetaUrl, `${fileName}.ts`);
  const jsPath = joinPath(importMetaUrl, `${fileName}.js`);

  if (fs.existsSync(tsPath)) {
    return tsPath;
  }

  return jsPath;
}

/**
 * Get the directory name of the current module file.
 * This function replicates the behavior of __dirname in CommonJS modules.
 *
 * @param importMetaUrl Pass import.meta.url from the calling module
 * @returns The directory name of the current module
 */
export function getDirname(importMetaUrl: string): string {
  const __filename = fileURLToPath(importMetaUrl);
  return path.dirname(__filename);
}

/**
 * Join the current directory path with the given path segments.
 * This function combines getDirname and path.join for convenience.
 *
 * @param importMetaUrl Pass import.meta.url from the calling module
 * @param ...paths Path segments to join
 * @returns The joined path
 */
export function joinPath(importMetaUrl: string, ...paths: string[]): string {
  const dirname = getDirname(importMetaUrl);
  return path.join(dirname, ...paths);
}

/**
 * Resolve a path relative to the current module's directory.
 * This function combines getDirname and path.resolve for convenience.
 *
 * @param importMetaUrl Pass import.meta.url from the calling module
 * @param ...paths Path segments to resolve
 * @returns The resolved absolute path
 */
export function resolvePath(importMetaUrl: string, ...paths: string[]): string {
  const dirname = getDirname(importMetaUrl);
  return path.resolve(dirname, ...paths);
}
