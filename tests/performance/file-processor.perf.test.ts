import os from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import fs from 'fs-extra';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { processFiles } from '../../src/core/file-processor';
import type { FileInfo } from '../../src/core/file-processor';
import { generateMarkdown } from '../../src/core/markdown-generator';

describe.sequential('Performance Tests', () => {
  const TEST_DIR = path.join(__dirname, 'perf-test-files');
  const DEFAULT_CACHE_PATH = path.join(os.tmpdir(), 'codewhisper-cache.json');

  beforeAll(async () => {
    await fs.ensureDir(TEST_DIR);
    await fs.remove(DEFAULT_CACHE_PATH);
  });

  afterAll(async () => {
    await fs.remove(TEST_DIR);
    await fs.remove(DEFAULT_CACHE_PATH);
  });

  async function createTestFiles(
    count: number,
    sizeKB: number,
    prefix: string,
  ): Promise<void> {
    const content = 'x'.repeat(sizeKB * 1024);
    for (let i = 0; i < count; i++) {
      await fs.writeFile(path.join(TEST_DIR, `${prefix}_${i}.txt`), content);
    }
  }

  async function runProcessFiles(): Promise<[FileInfo[], number]> {
    const start = performance.now();
    const result = await processFiles({ path: TEST_DIR });
    const end = performance.now();
    const duration = end - start;
    console.log(`Processing took ${duration} ms`);
    return [result, duration];
  }

  async function runGenerateMarkdown(
    files: FileInfo[],
  ): Promise<[string, number]> {
    const templateContent = '{{#each files}}{{this.path}}\n{{/each}}';
    const start = performance.now();
    const result = await generateMarkdown(files, templateContent);
    const end = performance.now();
    const duration = end - start;
    console.log(`Markdown generation took ${duration} ms`);
    return [result, duration];
  }

  it('should process 100 small files (1KB each) efficiently', async () => {
    await fs.emptyDir(TEST_DIR);
    await createTestFiles(100, 1, 'small');
    const [files, processingTime] = await runProcessFiles();
    expect(files).toHaveLength(100);
    const [, markdownTime] = await runGenerateMarkdown(files);
    console.log(`Total time: ${processingTime + markdownTime} ms`);
  }, 10000);

  it('should process 10 large files (1MB each) efficiently', async () => {
    await fs.emptyDir(TEST_DIR);
    await createTestFiles(10, 1024, 'large');
    const [files, processingTime] = await runProcessFiles();
    expect(files).toHaveLength(10);
    const [, markdownTime] = await runGenerateMarkdown(files);
    console.log(`Total time: ${processingTime + markdownTime} ms`);
  }, 30000);

  it('should handle 1000 small files (1KB each)', async () => {
    await fs.emptyDir(TEST_DIR);
    await createTestFiles(1000, 1, 'many');
    const [files, processingTime] = await runProcessFiles();
    expect(files).toHaveLength(1000);
    const [, markdownTime] = await runGenerateMarkdown(files);
    console.log(`Total time: ${processingTime + markdownTime} ms`);
  }, 60000);

  it('should benefit from caching on subsequent runs', async () => {
    await fs.emptyDir(TEST_DIR);
    await fs.remove(DEFAULT_CACHE_PATH);
    await createTestFiles(1000, 10, 'cache'); // Increased to 1000 files

    console.log('First run (no cache):');
    const [firstRunFiles, firstRunTime] = await runProcessFiles();
    expect(firstRunFiles).toHaveLength(1000);

    console.log('Second run (with cache):');
    const [secondRunFiles, secondRunTime] = await runProcessFiles();

    console.log(`First run file count: ${firstRunFiles.length}`);
    console.log(`Second run file count: ${secondRunFiles.length}`);

    expect(secondRunFiles).toHaveLength(firstRunFiles.length);

    console.log(`First run time: ${firstRunTime} ms`);
    console.log(`Second run time: ${secondRunTime} ms`);
    console.log(`Time saved: ${firstRunTime - secondRunTime} ms`);
    console.log(
      `Percentage faster: ${(((firstRunTime - secondRunTime) / firstRunTime) * 100).toFixed(2)}%`,
    );

    expect(secondRunTime).toBeLessThan(firstRunTime);
    expect(secondRunTime).toBeLessThan(firstRunTime * 0.7);
  }, 60000);

  it('should handle a mix of file sizes efficiently', async () => {
    await fs.emptyDir(TEST_DIR);
    await createTestFiles(50, 1, 'small'); // 50 small files
    await createTestFiles(30, 100, 'medium'); // 30 medium files
    await createTestFiles(5, 1024, 'large'); // 5 large files

    const [files, processingTime] = await runProcessFiles();
    expect(files).toHaveLength(85);
    const [, markdownTime] = await runGenerateMarkdown(files);
    console.log(`Total time: ${processingTime + markdownTime} ms`);
  }, 30000);

  it('should process files with different extensions', async () => {
    await fs.emptyDir(TEST_DIR);
    const extensions = ['js', 'ts', 'json', 'md', 'txt'];
    for (let i = 0; i < 50; i++) {
      const ext = extensions[i % extensions.length];
      await fs.writeFile(
        path.join(TEST_DIR, `file_${i}.${ext}`),
        `Content of file ${i}`,
      );
    }

    const [files, processingTime] = await runProcessFiles();
    expect(files).toHaveLength(50);
    const [, markdownTime] = await runGenerateMarkdown(files);
    console.log(`Total time: ${processingTime + markdownTime} ms`);
  }, 15000);
});
