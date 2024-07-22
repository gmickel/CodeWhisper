import path from 'node:path';
import url from 'node:url';

export function getWorkerPath(): string {
  const __filename = url.fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  if (__dirname.includes('node_modules')) {
    // We're running from an installed package (including npx)
    return path.resolve(__dirname, '..', 'dist', 'core', 'file-worker.js');
  }
  if (__dirname.includes(`${path.sep}dist`)) {
    // We're running in production mode
    return path.resolve(__dirname, '..', 'core', 'file-worker.js');
  }
  // We're running in development mode
  return path.resolve(__dirname, '..', '..', 'src', 'core', 'file-worker.js');
}
