import { type ExecException, exec } from 'node:child_process';
import path from 'node:path';
import fs from 'fs-extra';
import type { Ora } from 'ora';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handleEditorAndOutput } from '../../src/utils/editor-utils';

vi.mock('fs-extra', () => ({
  default: {
    writeFile: vi.fn(),
  },
}));

vi.mock('node:child_process', () => ({
  exec: vi.fn((cmd, callback) => {
    // Simulate the behavior of the exec function
    callback(null, '', ''); // Assuming no error, empty stdout and stderr
  }),
  __promisify__: vi.fn((command) => {
    return new Promise<{
      error?: ExecException | null;
      stdout: string;
      stderr: string;
    }>((resolve) => {
      // Since we're mocking, we directly resolve with the simulated values
      resolve({
        error: null,
        stdout: '',
        stderr: '',
      });
    });
  }),
}));

describe('Editor Utils', () => {
  const mockSpinner: Ora = {
    start: vi.fn(),
    stop: vi.fn(),
    succeed: vi.fn(),
    fail: vi.fn(),
  } as unknown as Ora;

  const mockExec = vi.mocked(exec);

  beforeEach(() => {
    vi.resetAllMocks();
    process.env.EDITOR = 'test-editor';
  });

  afterEach(() => {
    process.env.EDITOR = undefined;
  });

  it('should write content to file when outputPath is provided', async () => {
    const options = {
      content: 'Test content',
      outputPath: '/test/output.md',
      openEditor: false,
      spinner: mockSpinner,
    };

    await handleEditorAndOutput(options);

    expect(fs.writeFile).toHaveBeenCalledWith(
      '/test/output.md',
      'Test content',
      'utf8',
    );
    expect(mockSpinner.succeed).toHaveBeenCalledWith(
      expect.stringContaining('Output written to'),
    );
    expect(mockSpinner.start).not.toHaveBeenCalled();
    expect(exec).not.toHaveBeenCalled();
  });

  it('should open editor when openEditor is true', async () => {
    const options = {
      content: 'Test content',
      outputPath: '/test/output.md',
      openEditor: true,
      spinner: mockSpinner,
    };

    mockExec.mockImplementation(((
      _cmd: string,
      callback: (
        error: ExecException | null,
        stdout: string,
        stderr: string,
      ) => void,
    ) => {
      callback(null, '', '');
      return {
        unref: () => {},
      };
    }) as typeof exec);

    await handleEditorAndOutput(options);

    expect(fs.writeFile).toHaveBeenCalledWith(
      '/test/output.md',
      'Test content',
      'utf8',
    );
    expect(exec).toHaveBeenCalledWith(
      'test-editor "/test/output.md"',
      expect.any(Function),
    );
    expect(mockSpinner.start).toHaveBeenCalledWith('Opening editor...');
    expect(mockSpinner.succeed).toHaveBeenCalledWith(
      expect.stringContaining('Editor closed'),
    );
  });

  it('should create temporary file when outputPath is stdout and openEditor is true', async () => {
    const options = {
      content: 'Test content',
      outputPath: 'stdout',
      openEditor: true,
      spinner: mockSpinner,
    };

    mockExec.mockImplementation(((
      _cmd: string,
      callback: (
        error: ExecException | null,
        stdout: string,
        stderr: string,
      ) => void,
    ) => {
      callback(null, '', '');
      return {
        unref: () => {},
      };
    }) as typeof exec);

    const pathSpy = vi.spyOn(path, 'join');

    await handleEditorAndOutput(options);

    expect(fs.writeFile).toHaveBeenCalled();
    expect(exec).toHaveBeenCalled();
    expect(pathSpy).toHaveBeenCalled(); // Verify if temp path was generated
    expect(mockSpinner.start).toHaveBeenCalledWith('Opening editor...');
    expect(mockSpinner.succeed).toHaveBeenCalledWith(
      expect.stringContaining('Editor closed'),
    );
  });

  it('should log content to console when outputPath is stdout and openEditor is false', async () => {
    const options = {
      content: 'Test content',
      outputPath: 'stdout',
      openEditor: false,
      spinner: mockSpinner,
    };

    const consoleLogSpy = vi.spyOn(console, 'log');

    await handleEditorAndOutput(options);

    expect(fs.writeFile).not.toHaveBeenCalled();
    expect(exec).not.toHaveBeenCalled();
    expect(mockSpinner.stop).toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Generated Output:'),
    );
    expect(consoleLogSpy).toHaveBeenCalledWith('Test content');
  });

  it('should handle editor opening errors', async () => {
    const options = {
      content: 'Test content',
      outputPath: '/test/output.md',
      openEditor: true,
      spinner: mockSpinner,
    };

    mockExec.mockImplementation(((
      _cmd: string,
      callback: (
        error: ExecException | null,
        stdout: string,
        stderr: string,
      ) => void,
    ) => {
      callback(new Error('Failed to open editor'), '', '');
      return {
        unref: () => {},
      };
    }) as typeof exec);

    await handleEditorAndOutput(options);

    expect(fs.writeFile).toHaveBeenCalledWith(
      '/test/output.md',
      'Test content',
      'utf8',
    );
    expect(exec).toHaveBeenCalledWith(
      'test-editor "/test/output.md"',
      expect.any(Function),
    );
    expect(mockSpinner.start).toHaveBeenCalledWith('Opening editor...');
    expect(mockSpinner.fail).toHaveBeenCalledWith(
      expect.stringContaining('Failed to open editor'),
    );
  });

  it('should use nano when VISUAL and EDITOR are not set', async () => {
    const options = {
      content: 'Test content',
      outputPath: '/test/output.md',
      openEditor: true,
      spinner: mockSpinner,
    };

    const originalVisual = process.env.VISUAL;
    const originalEditor = process.env.EDITOR;
    // biome-ignore lint/performance/noDelete: <explanation>
    delete process.env.VISUAL;
    // biome-ignore lint/performance/noDelete: <explanation>
    delete process.env.EDITOR;

    mockExec.mockImplementation(((
      _cmd: string,
      callback: (
        error: ExecException | null,
        stdout: string,
        stderr: string,
      ) => void,
    ) => {
      callback(null, '', '');
      return { unref: () => {} };
    }) as typeof exec);

    await handleEditorAndOutput(options);

    expect(exec).toHaveBeenCalledWith(
      'nano "/test/output.md"',
      expect.any(Function),
    );

    // Restore the original environment variables
    process.env.VISUAL = originalVisual;
    process.env.EDITOR = originalEditor;
  });
});
