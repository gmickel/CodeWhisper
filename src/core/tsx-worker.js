import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';

// Resolve the path to tsx/cli for executing TypeScript files
const tsx = fileURLToPath(import.meta.resolve('tsx/cli'));
const __dirname = dirname(fileURLToPath(import.meta.url));

// Worker options (Replace 'file-worker.ts' with the path to your worker TypeScript file)
const workerFile = resolve(__dirname, 'file-worker.ts');

// Create a worker using tsx to handle TypeScript execution
const worker = new Worker(tsx, { argv: [workerFile] });

export default worker;
