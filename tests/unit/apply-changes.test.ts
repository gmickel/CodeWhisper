import path from 'node:path';
import fs from 'fs-extra';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyChanges } from '../../src/ai/apply-changes';
import { applySearchReplace } from '../../src/ai/parsers/search-replace-parser';
import type { AIParsedResponse } from '../../src/types';

vi.mock('fs-extra');
vi.mock('../../src/ai/parsers/search-replace-parser');

describe('applyChanges', () => {
  const mockBasePath = '/mock/base/path';

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create new files, modify existing ones with multiple changes, and delete files', async () => {
    const mockParsedResponse: AIParsedResponse = {
      fileList: ['new-file.js', 'existing-file.js', 'deleted-file.js'],
      files: [
        {
          path: 'new-file.js',
          language: 'javascript',
          content: 'console.log("New file");',
          status: 'new',
        },
        {
          path: 'existing-file.js',
          language: 'javascript',
          changes: [
            {
              search: 'console.log("Old content");',
              replace: 'console.log("Modified content");',
            },
            {
              search: 'function oldFunction() {}',
              replace: 'function newFunction() {}',
            },
          ],
          status: 'modified',
        },
        {
          path: 'deleted-file.js',
          language: 'javascript',
          status: 'deleted',
        },
      ],
      gitBranchName: 'feature/mixed-changes',
      gitCommitMessage: 'Add, modify, and delete files',
      summary:
        'Created a new file, modified an existing one with multiple changes, and deleted a file',
      potentialIssues: 'None',
    };

    const originalContent =
      'console.log("Old content");\nfunction oldFunction() {}';
    const modifiedContent =
      'console.log("Modified content");\nfunction newFunction() {}';

    // biome-ignore lint/suspicious/noExplicitAny: explicit any is required for the mock
    vi.mocked(fs.readFile).mockResolvedValue(originalContent as any);
    vi.mocked(applySearchReplace).mockResolvedValue(modifiedContent);

    await applyChanges({
      basePath: mockBasePath,
      parsedResponse: mockParsedResponse,
      dryRun: false,
    });

    expect(fs.ensureDir).toHaveBeenCalledTimes(1);
    expect(fs.writeFile).toHaveBeenCalledTimes(2);
    expect(fs.readFile).toHaveBeenCalledTimes(1);
    expect(fs.remove).toHaveBeenCalledTimes(1);
    expect(applySearchReplace).toHaveBeenCalledTimes(1);

    // Check if the writeFile calls include both the new and modified files
    expect(vi.mocked(fs.writeFile).mock.calls).toEqual(
      expect.arrayContaining([
        [path.join(mockBasePath, 'new-file.js'), 'console.log("New file");'],
        [path.join(mockBasePath, 'existing-file.js'), expect.any(Promise)],
      ]),
    );

    // Resolve the Promise for the modified file content
    await expect(vi.mocked(fs.writeFile).mock.calls[1][1]).resolves.toBe(
      modifiedContent,
    );

    // Check if the deleted file was removed
    expect(fs.remove).toHaveBeenCalledWith(
      path.join(mockBasePath, 'deleted-file.js'),
    );
  });

  it('should not apply changes in dry run mode', async () => {
    const mockParsedResponse: AIParsedResponse = {
      fileList: ['new-file.js', 'existing-file.js', 'deleted-file.js'],
      files: [
        {
          path: 'new-file.js',
          language: 'javascript',
          content: 'console.log("New file");',
          status: 'new',
        },
        {
          path: 'existing-file.js',
          language: 'javascript',
          changes: [
            {
              search: 'console.log("Old content");',
              replace: 'console.log("Modified content");',
            },
          ],
          status: 'modified',
        },
        {
          path: 'deleted-file.js',
          language: 'javascript',
          status: 'deleted',
        },
      ],
      gitBranchName: 'feature/dry-run',
      gitCommitMessage: 'This should not be committed',
      summary: 'This is a dry run',
      potentialIssues: 'None',
    };

    await applyChanges({
      basePath: mockBasePath,
      parsedResponse: mockParsedResponse,
      dryRun: true,
    });

    expect(fs.ensureDir).not.toHaveBeenCalled();
    expect(fs.writeFile).not.toHaveBeenCalled();
    expect(fs.readFile).not.toHaveBeenCalled();
    expect(fs.remove).not.toHaveBeenCalled();
  });

  it('should handle errors during file operations', async () => {
    const mockParsedResponse: AIParsedResponse = {
      fileList: ['error-file.js'],
      files: [
        {
          path: 'error-file.js',
          language: 'javascript',
          content: 'console.log("Error");',
          status: 'new',
        },
      ],
      gitBranchName: 'feature/error-branch',
      gitCommitMessage: 'This should fail',
      summary: 'This operation should fail',
      potentialIssues: 'None',
    };

    vi.mocked(fs.ensureDir).mockRejectedValueOnce(
      new Error('Failed to create directory'),
    );

    await expect(
      applyChanges({
        basePath: mockBasePath,
        parsedResponse: mockParsedResponse,
        dryRun: false,
      }),
    ).rejects.toThrow('Failed to create directory');
  });

  it('should handle file path with subdirectories', async () => {
    const mockParsedResponse: AIParsedResponse = {
      fileList: ['deep/nested/file.js'],
      files: [
        {
          path: 'deep/nested/file.js',
          language: 'javascript',
          content: 'console.log("Nested file");',
          status: 'new',
        },
      ],
      gitBranchName: 'feature/nested-file',
      gitCommitMessage: 'Add nested file',
      summary: 'Added a file in nested directories',
      potentialIssues: 'None',
    };

    await applyChanges({
      basePath: mockBasePath,
      parsedResponse: mockParsedResponse,
      dryRun: false,
    });

    expect(fs.ensureDir).toHaveBeenCalledWith(
      expect.stringContaining(path.join('deep', 'nested')),
    );
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining(path.join('deep', 'nested', 'file.js')),
      'console.log("Nested file");',
    );
  });

  it('should handle empty file list', async () => {
    const mockParsedResponse: AIParsedResponse = {
      fileList: [],
      files: [],
      gitBranchName: 'feature/no-changes',
      gitCommitMessage: 'No changes',
      summary: 'No files were changed',
      potentialIssues: 'None',
    };

    await applyChanges({
      basePath: mockBasePath,
      parsedResponse: mockParsedResponse,
      dryRun: false,
    });

    expect(fs.ensureDir).not.toHaveBeenCalled();
    expect(fs.writeFile).not.toHaveBeenCalled();
    expect(fs.remove).not.toHaveBeenCalled();
  });
});
