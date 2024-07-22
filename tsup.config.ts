import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'cli/index': 'src/cli/index.ts',
    'core/file-worker': 'src/core/file-worker.js',
    'utils/worker-path': 'src/utils/worker-path.ts',
    cli: 'cli.js',
  },
  format: ['esm'],
  splitting: false,
  clean: true,
  shims: true,
  name: 'codewhisper',
  tsconfig: 'tsconfig.build.json',
  publicDir: 'src/templates',
  dts: {
    entry: {
      'cli/index': 'src/cli/index.ts',
    },
  },
  esbuildOptions: (options) => {
    options.platform = 'node';
  },
});
