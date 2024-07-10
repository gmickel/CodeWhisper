import path from 'node:path';
import fs from 'fs-extra';
import { afterAll, describe, expect, it } from 'vitest';
import { processFiles } from '../../src/core/file-processor';

const resolvePath = (pathname: string) =>
  new URL(pathname, import.meta.url).pathname;

describe('File Processor Performance', () => {
  const largePath = resolvePath('../fixtures/large-project');

  // Helper function to create a large project structure
  async function createLargeProject() {
    await fs.ensureDir(largePath);
    for (let i = 0; i < 1000; i++) {
      const content = `console.log('File ${i}');\n`.repeat(100);
      await fs.writeFile(path.join(largePath, `file${i}.js`), content);
    }
  }

  // Clean up after tests
  afterAll(async () => {
    await fs.remove(largePath);
  });

  it('should process a large number of files efficiently', async () => {
    await createLargeProject();

    const start = performance.now();
    const result = await processFiles({ path: largePath });
    const end = performance.now();

    expect(result.length).toBe(1000);
    console.log(`Processed 1000 files in ${end - start} ms`);
    // You might want to add an assertion here to ensure it completes within a certain time
    // expect(end - start).toBeLessThan(5000); // Should complete in less than 5 seconds, for example
  });

  it('should be faster on subsequent runs due to caching', async () => {
    const firstRun = performance.now();
    await processFiles({ path: largePath });
    const firstEnd = performance.now();

    const secondRun = performance.now();
    await processFiles({ path: largePath });
    const secondEnd = performance.now();

    const firstDuration = firstEnd - firstRun;
    const secondDuration = secondEnd - secondRun;

    console.log(`First run: ${firstDuration} ms`);
    console.log(`Second run: ${secondDuration} ms`);

    expect(secondDuration).toBeLessThan(firstDuration);
  });
});
