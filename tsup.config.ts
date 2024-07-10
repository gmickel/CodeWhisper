import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/cli/index.ts', 'src/core/file-worker.ts'],
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
