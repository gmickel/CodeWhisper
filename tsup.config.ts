import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'cli/index': 'src/cli/index.ts',
    'core/file-worker': 'src/core/file-worker.js', // Add .js directly
    cli: 'cli.js',
  },
  format: ['esm'],
  splitting: false,
  clean: true,
  shims: true,
  dts: {
    entry: {
      'cli/index': 'src/cli/index.ts',
      // Omit file-worker.js from dts generation
    },
  },
  name: 'codewhisper',
  tsconfig: 'tsconfig.build.json',
  publicDir: 'src/templates',
  esbuildOptions: (options) => {
    options.platform = 'node';
  },
});
