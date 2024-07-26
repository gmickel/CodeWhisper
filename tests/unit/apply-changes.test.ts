import fs from 'fs-extra';
import simpleGit from 'simple-git';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyChanges } from '../../src/git/apply-changes';
import type { AIParsedResponse } from '../../src/types';
import * as gitTools from '../../src/utils/git-tools';

vi.mock('fs-extra');
vi.mock('simple-git');
vi.mock('../../src/utils/git-tools');

describe('applyChanges', () => {
  const mockBasePath = '/mock/base/path';

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create new files and modify existing ones', async () => {
    const mockParsedResponse: AIParsedResponse = {
      fileList: ['new-file.js', 'existing-file.js'],
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
          content: 'console.log("Modified file");',
          status: 'modified',
        },
      ],
      gitBranchName: 'feature/new-branch',
      gitCommitMessage: 'Add and modify files',
      summary: 'Created a new file and modified an existing one',
      potentialIssues: 'None',
    };

    await applyChanges({
      basePath: mockBasePath,
      parsedResponse: mockParsedResponse,
      dryRun: false,
    });

    expect(fs.ensureDir).toHaveBeenCalledTimes(2);
    expect(fs.writeFile).toHaveBeenCalledTimes(2);
  });

  it('should not apply changes in dry run mode', async () => {
    const mockParsedResponse: AIParsedResponse = {
      fileList: ['new-file.js'],
      files: [
        {
          path: 'new-file.js',
          language: 'javascript',
          content: 'console.log("New file");',
          status: 'new',
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

  it('should handle mixed operations (create, modify, delete)', async () => {
    const mockParsedResponse: AIParsedResponse = {
      fileList: ['new-file.js', 'modified-file.js', 'deleted-file.js'],
      files: [
        {
          path: 'new-file.js',
          language: 'javascript',
          content: 'console.log("New file");',
          status: 'new',
        },
        {
          path: 'modified-file.js',
          language: 'javascript',
          content: 'console.log("Modified file");',
          status: 'modified',
        },
        {
          path: 'deleted-file.js',
          language: '',
          content: '',
          status: 'deleted',
        },
      ],
      gitBranchName: 'feature/mixed-changes',
      gitCommitMessage: 'Mixed file operations',
      summary: 'Created, modified, and deleted files',
      potentialIssues: 'None',
    };

    await applyChanges({
      basePath: mockBasePath,
      parsedResponse: mockParsedResponse,
      dryRun: false,
    });

    expect(fs.ensureDir).toHaveBeenCalledTimes(2);
    expect(fs.writeFile).toHaveBeenCalledTimes(2);
    expect(fs.remove).toHaveBeenCalledTimes(1);
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
      expect.stringContaining('deep/nested'),
    );
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('deep/nested/file.js'),
      'console.log("Nested file");',
    );
  });
});
