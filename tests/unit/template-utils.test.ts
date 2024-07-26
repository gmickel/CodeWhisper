import path from 'node:path';
import { editor, input } from '@inquirer/prompts';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getCachedValue, setCachedValue } from '../../src/utils/cache-utils';
import {
  collectVariables,
  extractTemplateVariables,
  getAvailableTemplates,
  getTemplatePath,
  getTemplatesDir,
  replaceTemplateVariables,
} from '../../src/utils/template-utils';

vi.mock('@inquirer/prompts');
vi.mock('inquirer');
vi.mock('../../src/utils/cache-utils');
vi.mock('fs-extra');
vi.mock('path', async () => {
  const actual = (await vi.importActual('path')) as object;
  return {
    ...actual,
    dirname: vi.fn(),
    resolve: vi.fn(),
    sep: '/',
    basename: vi.fn((filePath) => filePath.split('/').pop()),
  };
});

describe('Template Utils', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('collectVariables', () => {
    it('should parse and return custom data when provided', async () => {
      const data = '{"var_name": "John", "var_age": "30"}';
      const result = await collectVariables(
        data,
        '/tmp/cache',
        [],
        '/path/to/template.hbs',
      );
      expect(result).toEqual({ var_name: 'John', var_age: '30' });
    });

    it('should prompt for variables when no data is provided', async () => {
      const variables = [
        { name: 'name', isMultiline: false },
        { name: 'description', isMultiline: true },
      ];

      vi.mocked(getCachedValue)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      vi.mocked(inquirer.prompt).mockResolvedValueOnce({ name: 'John' });
      vi.mocked(editor).mockResolvedValueOnce('A long description');

      const result = await collectVariables(
        '',
        '/tmp/cache',
        variables,
        '/path/to/template.hbs',
      );

      expect(result).toEqual({
        name: 'John',
        description: 'A long description',
      });

      expect(inquirer.prompt).toHaveBeenCalledWith([
        {
          type: 'input',
          name: 'name',
          message: 'Enter value for name:',
          default: undefined,
        },
      ]);

      expect(editor).toHaveBeenCalledWith({
        message: 'Enter value for description (multiline):',
        default: undefined,
      });

      expect(setCachedValue).toHaveBeenCalledTimes(2);
    });

    it('should use cached values when available', async () => {
      const variables = [
        { name: 'name', isMultiline: false },
        { name: 'description', isMultiline: true },
      ];

      vi.mocked(getCachedValue)
        .mockResolvedValueOnce('Cached John')
        .mockResolvedValueOnce('Cached description');
      vi.mocked(inquirer.prompt).mockResolvedValueOnce({ name: 'Cached John' });
      vi.mocked(editor).mockResolvedValueOnce('Cached description');

      const result = await collectVariables(
        '',
        '/tmp/cache',
        variables,
        '/path/to/template.hbs',
      );

      expect(result).toEqual({
        name: 'Cached John',
        description: 'Cached description',
      });

      expect(inquirer.prompt).toHaveBeenCalledWith([
        {
          type: 'input',
          name: 'name',
          message: 'Enter value for name:',
          default: 'Cached John',
        },
      ]);

      expect(editor).toHaveBeenCalledWith({
        message: 'Enter value for description (multiline):',
        default: 'Cached description',
      });
    });

    it('should handle errors when parsing custom data', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const processExitSpy = vi
        .spyOn(process, 'exit')
        .mockImplementation(() => {
          throw new Error('process.exit called');
        });

      const invalidData = '{"invalid": "json",}';

      await expect(
        collectVariables(
          invalidData,
          '/tmp/cache',
          [],
          '/path/to/template.hbs',
        ),
      ).rejects.toThrow('process.exit called');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error parsing custom data JSON:'),
        expect.any(Error),
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);

      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });
  });

  describe('extractTemplateVariables', () => {
    it('should extract variables from template content', () => {
      const templateContent = '{{var_name}} {{multiline_description}}';
      const result = extractTemplateVariables(templateContent);
      expect(result).toEqual([
        { name: 'name', isMultiline: false },
        { name: 'description', isMultiline: true },
      ]);
    });
    it('should handle templates with no variables', () => {
      const templateContent = 'This template has no variables';
      const result = extractTemplateVariables(templateContent);
      expect(result).toEqual([]);
    });

    it('should extract multiple occurrences of the same variable', () => {
      const templateContent = '{{var_name}} {{var_name}} {{multiline_name}}';
      const result = extractTemplateVariables(templateContent);
      expect(result).toEqual([
        { name: 'name', isMultiline: false },
        { name: 'name', isMultiline: true },
      ]);
    });
  });

  describe('replaceTemplateVariables', () => {
    it('should replace variables in template content', () => {
      const templateContent = '{{var_name}} {{multiline_description}}';
      const customData = {
        name: 'John',
        description: 'A multi-line\ndescription',
      };
      const result = replaceTemplateVariables(templateContent, customData);
      expect(result).toBe('John A multi-line\ndescription');
    });
    it('should not replace variables that are not in customData', () => {
      const templateContent = '{{var_name}} {{var_unknown}}';
      const customData = { name: 'John' };
      const result = replaceTemplateVariables(templateContent, customData);
      expect(result).toBe('John {{var_unknown}}');
    });
  });

  describe('getTemplatesDir', () => {
    it('should return the correct templates directory', () => {
      const result = getTemplatesDir();
      expect(result).toContain('templates');
    });
    it('should handle different environment scenarios', () => {
      process.env.CODEWHISPER_CLI = 'false';
      expect(getTemplatesDir()).toContain('src/templates');
    });
  });

  describe('getTemplatePath', () => {
    it('should return the correct template path', () => {
      const result = getTemplatePath('custom-template');
      expect(result).toContain('custom-template.hbs');
    });
  });

  // Add more test cases for collectVariables and other functions
});
