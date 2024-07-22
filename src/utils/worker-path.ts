import path from 'node:path';
import url from 'node:url';

export function getWorkerPath(): string {
  const __filename = url.fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Check if we're running from a package runner
  const isPackageRunner =
    process.execPath.includes('npx') ||
    process.execPath.includes('pnpx') ||
    process.execPath.includes('bunx') ||
    process.execPath.includes('.npm') ||
    process.execPath.includes('.pnpm') ||
    process.execPath.includes('.bun');

  // Check if we're in a node_modules directory
  const isInNodeModules = __dirname.includes('node_modules');

  // Check if we're in the dist directory
  const isInDist = __dirname.includes(`${path.sep}dist`);

  if (isInNodeModules) {
    if (isPackageRunner) {
      // We're running from a package runner (npx, pnpx, bunx, etc.)
      return path.resolve(__dirname, '..', 'core', 'file-worker.js');
    }
    // We're running as an installed package (programmatic usage)
    return path.resolve(__dirname, '..', 'dist', 'core', 'file-worker.js');
  }
  if (isInDist) {
    // We're running in production mode (e.g., pnpm run start)
    return path.resolve(__dirname, '..', 'core', 'file-worker.js');
  }
  // We're running in development mode
  return path.resolve(__dirname, '..', '..', 'src', 'core', 'file-worker.js');
}
