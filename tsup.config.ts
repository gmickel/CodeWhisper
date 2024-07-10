import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'cli/index': 'src/cli/index.ts',
    'core/file-worker': 'src/core/file-worker.ts',
    cli: 'cli.js',
  },
  format: ['esm'],
  splitting: false,
  clean: true,
  shims: true,
  dts: true,
  name: 'codewhisper',
  tsconfig: 'tsconfig.build.json',
  publicDir: 'src/templates',
  esbuildOptions: (options) => {
    options.platform = 'node';
  },
});
