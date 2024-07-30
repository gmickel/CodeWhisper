import path from 'node:path';
import { input } from '@inquirer/prompts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { outputPathPrompt } from '../../src/interactive/output-path-prompt';

// Mock the @inquirer/prompts module
vi.mock('@inquirer/prompts', () => ({
  input: vi.fn(),
}));

describe('outputPathPrompt', () => {
  const mockBasePath = path.join('/', 'test', 'base', 'path');

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return the user-provided path when input is not empty', async () => {
    const userProvidedPath = path.join('/', 'user', 'provided', 'path.md');
    vi.mocked(input).mockResolvedValue(userProvidedPath);

    const result = await outputPathPrompt(mockBasePath);

    expect(result).toBe(userProvidedPath);
    expect(input).toHaveBeenCalledWith({
      message: 'Enter the output file path (or "" for console/stdout output):',
      default: path.join(mockBasePath, `${path.basename(mockBasePath)}.md`),
    });
  });

  it('should return "stdout" when input is empty', async () => {
    vi.mocked(input).mockResolvedValue('');

    const result = await outputPathPrompt(mockBasePath);

    expect(result).toBe('stdout');
    expect(input).toHaveBeenCalledWith({
      message: 'Enter the output file path (or "" for console/stdout output):',
      default: path.join(mockBasePath, `${path.basename(mockBasePath)}.md`),
    });
  });

  it('should return "stdout" when input is only whitespace', async () => {
    vi.mocked(input).mockResolvedValue('   ');

    const result = await outputPathPrompt(mockBasePath);

    expect(result).toBe('stdout');
  });

  it('should use the correct default path', async () => {
    const expectedDefaultPath = path.join(
      mockBasePath,
      `${path.basename(mockBasePath)}.md`,
    );
    vi.mocked(input).mockResolvedValue(expectedDefaultPath);

    await outputPathPrompt(mockBasePath);

    expect(input).toHaveBeenCalledWith({
      message: 'Enter the output file path (or "" for console/stdout output):',
      default: expectedDefaultPath,
    });
  });

  it('should trim the user input', async () => {
    const userProvidedPath = path.join('/', 'user', 'provided', 'path.md');
    vi.mocked(input).mockResolvedValue(`  ${userProvidedPath}  `);

    const result = await outputPathPrompt(mockBasePath);

    expect(result).toBe(userProvidedPath);
  });
});
