import {
  type BuildEntry,
  type MkdistBuildEntry,
  defineBuildConfig,
} from 'unbuild';

function dualOutput(
  config: Omit<MkdistBuildEntry, 'builder' | 'format'>,
): BuildEntry[] {
  return [
    {
      builder: 'mkdist',
      format: 'esm',
      ...config,
      pattern: '**/!(*.stories).{js,jsx,ts,tsx}',
    },
    {
      builder: 'mkdist',
      format: 'cjs',
      ...config,
      pattern: '**/!(*.stories).{js,jsx,ts,tsx}',
    },
  ];
}

export default defineBuildConfig({
  entries: [
    './src/cli/index',
    ...dualOutput({
      input: './src/cli/index',
      outDir: './dist',
    }),
    ...dualOutput({
      input: './src/core/file-worker',
      outDir: './dist',
    }),
  ],
  declaration: true,
  clean: true,
  rollup: {
    emitCJS: true,
  },
  failOnWarn: false,
});
