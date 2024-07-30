import path from 'node:path';
import fs, { type PathOrFileDescriptor } from 'fs-extra';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { processFiles } from '../../src/core/file-processor';
import { generateMarkdown } from '../../src/core/markdown-generator';
import { runInteractiveMode } from '../../src/interactive/interactive-workflow';
import { outputPathPrompt } from '../../src/interactive/output-path-prompt';
import { selectFilesPrompt } from '../../src/interactive/select-files-prompt';
import { selectTemplatePrompt } from '../../src/interactive/select-template-prompt';
import type { InteractiveModeOptions } from '../../src/types';
import { handleEditorAndOutput } from '../../src/utils/editor-utils';
import {
  collectVariables,
  extractTemplateVariables,
  getTemplatePath,
} from '../../src/utils/template-utils';

vi.mock('../../src/core/file-processor');
vi.mock('../../src/core/markdown-generator');
vi.mock('../../src/interactive/select-files-prompt');
vi.mock('../../src/interactive/select-template-prompt');
vi.mock('../../src/interactive/output-path-prompt');
vi.mock('../../src/utils/editor-utils');
vi.mock('../../src/utils/template-utils');
vi.mock('fs-extra');

describe('runInteractiveMode', () => {
  const mockOptions: InteractiveModeOptions = {
    path: path.join('/', 'test', 'path'),
    noCodeblock: false,
    invert: false,
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should execute the happy path successfully', async () => {
    const mockSelectedFiles = ['file1.ts', 'file2.ts'];
    const mockTemplatePath = path.join('/', 'test', 'template', 'path.hbs');
    const mockTemplateContent = '{{var_test}}';
    const mockVariables = [{ name: 'test', isMultiline: false }];
    const mockCustomData = { test: 'value' };
    const mockOutputPath = path.join('/', 'test', 'output', 'path.md');
    const mockProcessedFiles = [
      {
        path: 'file1.ts',
        content: 'content1',
        language: 'typescript',
        size: 100,
        created: new Date(),
        modified: new Date(),
        extension: 'ts',
      },
      {
        path: 'file2.ts',
        content: 'content2',
        language: 'typescript',
        size: 100,
        created: new Date(),
        modified: new Date(),
        extension: 'ts',
      },
    ];
    const mockMarkdown = 'Generated Markdown';

    vi.mocked(selectFilesPrompt).mockResolvedValue(mockSelectedFiles);
    vi.mocked(selectTemplatePrompt).mockResolvedValue(mockTemplatePath);
    vi.mocked(fs.readFile).mockImplementation(
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      (path: PathOrFileDescriptor, options?: any) => {
        if (path === mockTemplatePath && options === 'utf-8') {
          return Promise.resolve(mockTemplateContent);
        }
        return Promise.reject(new Error('Unexpected file read'));
      },
    );
    vi.mocked(extractTemplateVariables).mockReturnValue(mockVariables);
    vi.mocked(collectVariables).mockResolvedValue(mockCustomData);
    vi.mocked(outputPathPrompt).mockResolvedValue(mockOutputPath);
    vi.mocked(processFiles).mockResolvedValue(mockProcessedFiles);
    vi.mocked(generateMarkdown).mockResolvedValue(mockMarkdown);

    await runInteractiveMode(mockOptions);

    expect(outputPathPrompt).toHaveBeenCalledWith(
      expect.stringMatching(/[\\\/]test[\\\/]path$/),
    );

    expect(selectTemplatePrompt).toHaveBeenCalled();
    expect(fs.readFile).toHaveBeenCalledWith(mockTemplatePath, 'utf-8');
    expect(extractTemplateVariables).toHaveBeenCalledWith(mockTemplateContent);
    expect(collectVariables).toHaveBeenCalled();
    expect(processFiles).toHaveBeenCalledWith(
      expect.objectContaining({
        path: path.join('/', 'test', 'path'),
        filter: mockSelectedFiles,
      }),
    );
    expect(generateMarkdown).toHaveBeenCalledWith(
      mockProcessedFiles,
      mockTemplateContent,
      expect.objectContaining({
        noCodeblock: false,
        basePath: path.join('/', 'test', 'path'),
        customData: mockCustomData,
      }),
    );
    expect(handleEditorAndOutput).toHaveBeenCalledWith(
      expect.objectContaining({
        content: mockMarkdown,
        outputPath: mockOutputPath,
        openEditor: false,
      }),
    );
  });

  it('should use provided template when available', async () => {
    const optionsWithTemplate = {
      ...mockOptions,
      template: 'custom-template',
    };
    const mockTemplatePath = path.join('/', 'test', 'custom', 'template.hbs');

    vi.mocked(getTemplatePath).mockReturnValue(mockTemplatePath);
    vi.mocked(selectFilesPrompt).mockResolvedValue([]);
    vi.mocked(fs.readFile).mockResolvedValue();
    vi.mocked(extractTemplateVariables).mockReturnValue([]);
    vi.mocked(collectVariables).mockResolvedValue({});
    vi.mocked(outputPathPrompt).mockResolvedValue(
      path.join('/', 'test', 'output.md'),
    );
    vi.mocked(processFiles).mockResolvedValue([]);
    vi.mocked(generateMarkdown).mockResolvedValue('');

    await runInteractiveMode(optionsWithTemplate);

    expect(getTemplatePath).toHaveBeenCalledWith('custom-template');
    expect(selectTemplatePrompt).not.toHaveBeenCalled();
  });

  it('should handle custom template path', async () => {
    const optionsWithCustomTemplate = {
      ...mockOptions,
      customTemplate: path.join('/', 'path', 'to', 'custom', 'template.hbs'),
    };

    vi.mocked(selectFilesPrompt).mockResolvedValue([]);
    vi.mocked(fs.readFile).mockResolvedValue();
    vi.mocked(extractTemplateVariables).mockReturnValue([]);
    vi.mocked(collectVariables).mockResolvedValue({});
    vi.mocked(outputPathPrompt).mockResolvedValue(
      path.join('/', 'test', 'output.md'),
    );
    vi.mocked(processFiles).mockResolvedValue([]);
    vi.mocked(generateMarkdown).mockResolvedValue('');

    await runInteractiveMode(optionsWithCustomTemplate);

    expect(fs.readFile).toHaveBeenCalledWith(
      path.join('/', 'path', 'to', 'custom', 'template.hbs'),
      'utf-8',
    );
    expect(selectTemplatePrompt).not.toHaveBeenCalled();
  });

  it('should add prompt to markdown when provided', async () => {
    const optionsWithPrompt = {
      ...mockOptions,
      prompt: 'Custom prompt',
    };

    vi.mocked(selectFilesPrompt).mockResolvedValue([]);
    vi.mocked(selectTemplatePrompt).mockResolvedValue(
      path.join('/', 'test', 'template.hbs'),
    );
    vi.mocked(fs.readFile).mockResolvedValue();
    vi.mocked(extractTemplateVariables).mockReturnValue([]);
    vi.mocked(collectVariables).mockResolvedValue({});
    vi.mocked(outputPathPrompt).mockResolvedValue(
      path.join('/', 'test', 'output.md'),
    );
    vi.mocked(processFiles).mockResolvedValue([]);
    vi.mocked(generateMarkdown).mockResolvedValue('Generated Markdown');

    await runInteractiveMode(optionsWithPrompt);

    expect(handleEditorAndOutput).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining(
          'Generated Markdown\n\n## Your Task\n\nCustom prompt',
        ),
      }),
    );
  });

  it('should handle errors gracefully', async () => {
    vi.mocked(selectFilesPrompt).mockRejectedValue(new Error('Test error'));

    const mockExit = vi.spyOn(process, 'exit').mockImplementation((number) => {
      throw new Error(`process.exit: ${number}`);
    });

    await expect(runInteractiveMode(mockOptions)).rejects.toThrow(
      'process.exit: 1',
    );

    expect(mockExit).toHaveBeenCalledWith(1);
  });
});
