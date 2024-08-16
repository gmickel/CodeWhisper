import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    benchmark: 'benchmark.ts',
  },
  format: ['esm'],
  splitting: false,
  clean: true,
  shims: true,
  name: 'codewhisper-benchmark',
  dts: true,
  esbuildOptions: (options) => {
    options.platform = 'node';
  },
});
