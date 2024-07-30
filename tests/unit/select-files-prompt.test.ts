import path from 'node:path';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { selectFilesPrompt } from '../../src/interactive/select-files-prompt';

// Mock the modules
vi.mock('fs-extra');
vi.mock('inquirer', () => ({
  default: {
    prompt: vi.fn(),
    registerPrompt: vi.fn(),
  },
}));

describe('selectFilesPrompt', () => {
  const mockBasePath = path.join('/', 'test', 'base', 'path');

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return selected files when not inverted', async () => {
    vi.mocked(inquirer.prompt).mockResolvedValue({
      selectedFiles: [
        path.join(mockBasePath, 'file1.ts'),
        path.join(mockBasePath, 'file2.ts'),
      ],
    });

    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.statSync).mockReturnValue({
      isDirectory: () => false,
    } as fs.Stats);

    const result = await selectFilesPrompt(mockBasePath, false);

    expect(result).toEqual(['file1.ts', 'file2.ts']);
    expect(inquirer.prompt).toHaveBeenCalledWith([
      expect.objectContaining({
        message: 'Select files and directories to be included:',
        root: mockBasePath,
      }),
    ]);
  });

  it('should return selected files when inverted', async () => {
    vi.mocked(inquirer.prompt).mockResolvedValue({
      selectedFiles: [
        path.join(mockBasePath, 'file1.ts'),
        path.join(mockBasePath, 'file2.ts'),
      ],
    });

    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.statSync).mockReturnValue({
      isDirectory: () => false,
    } as fs.Stats);

    const result = await selectFilesPrompt(mockBasePath, true);

    expect(result).toEqual(['file1.ts', 'file2.ts']);
    expect(inquirer.prompt).toHaveBeenCalledWith([
      expect.objectContaining({
        message: 'Select files and directories to be excluded:',
        root: mockBasePath,
      }),
    ]);
  });

  it('should handle directory selection', async () => {
    vi.mocked(inquirer.prompt).mockResolvedValue({
      selectedFiles: [path.join(mockBasePath, 'dir1')],
    });

    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.statSync).mockReturnValue({
      isDirectory: () => true,
    } as fs.Stats);

    const result = await selectFilesPrompt(mockBasePath, false);

    expect(result).toEqual([path.join('dir1', '**', '*')]);
  });

  it('should handle single file selection', async () => {
    vi.mocked(inquirer.prompt).mockResolvedValue({
      selectedFiles: path.join(mockBasePath, 'singleFile.ts'),
    });

    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.statSync).mockReturnValue({
      isDirectory: () => false,
    } as fs.Stats);

    const result = await selectFilesPrompt(mockBasePath, false);

    expect(result).toEqual(['singleFile.ts']);
  });

  it('should handle top-level directory selection', async () => {
    vi.mocked(inquirer.prompt).mockResolvedValue({
      selectedFiles: mockBasePath,
    });

    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.statSync).mockReturnValue({
      isDirectory: () => true,
    } as fs.Stats);

    const result = await selectFilesPrompt(mockBasePath, false);

    expect(result[0]).toMatch(/^\*\*[/\\]\*$/);
  });
});
