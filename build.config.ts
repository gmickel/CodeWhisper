import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  entries: [
    {
      input: 'src/cli/index',
      name: 'index',
    },
    {
      input: 'src/core/file-worker',
      name: 'file-worker',
    },
  ],
  outDir: 'dist',
  declaration: true,
  clean: true,
  rollup: {
    emitCJS: true,
  },
  failOnWarn: false,
});
