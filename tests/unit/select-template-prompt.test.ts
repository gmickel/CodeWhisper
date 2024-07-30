import { select } from '@inquirer/prompts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { selectTemplatePrompt } from '../../src/interactive/select-template-prompt';
import { getAvailableTemplates } from '../../src/utils/template-utils';

// Mock the modules
vi.mock('@inquirer/prompts', () => ({
  select: vi.fn(),
}));

vi.mock('../../src/utils/template-utils', () => ({
  getAvailableTemplates: vi.fn(),
}));

describe('selectTemplatePrompt', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return the selected template path', async () => {
    const mockTemplates = [
      { name: 'Template 1', path: '/path/to/template1.hbs' },
      { name: 'Template 2', path: '/path/to/template2.hbs' },
    ];

    vi.mocked(getAvailableTemplates).mockResolvedValue(mockTemplates);
    vi.mocked(select).mockResolvedValue('/path/to/template1.hbs');

    const result = await selectTemplatePrompt();

    expect(result).toBe('/path/to/template1.hbs');
    expect(getAvailableTemplates).toHaveBeenCalled();
    expect(select).toHaveBeenCalledWith({
      message: 'Select a template:',
      choices: [
        { value: '/path/to/template1.hbs', name: 'Template 1' },
        { value: '/path/to/template2.hbs', name: 'Template 2' },
      ],
    });
  });

  it('should handle empty template list', async () => {
    vi.mocked(getAvailableTemplates).mockResolvedValue([]);
    vi.mocked(select).mockResolvedValue('');

    const result = await selectTemplatePrompt();

    expect(result).toBe('');
    expect(getAvailableTemplates).toHaveBeenCalled();
    expect(select).toHaveBeenCalledWith({
      message: 'Select a template:',
      choices: [],
    });
  });

  it('should handle relative paths', async () => {
    const mockTemplates = [
      { name: 'Template 1', path: 'templates/template1.hbs' },
      { name: 'Template 2', path: 'templates/template2.hbs' },
    ];

    vi.mocked(getAvailableTemplates).mockResolvedValue(mockTemplates);
    vi.mocked(select).mockResolvedValue('templates/template2.hbs');

    const result = await selectTemplatePrompt();

    expect(result).toBe('templates/template2.hbs');
    expect(select).toHaveBeenCalledWith({
      message: 'Select a template:',
      choices: [
        { value: 'templates/template1.hbs', name: 'Template 1' },
        { value: 'templates/template2.hbs', name: 'Template 2' },
      ],
    });
  });

  it('should handle errors from getAvailableTemplates', async () => {
    vi.mocked(getAvailableTemplates).mockRejectedValue(
      new Error('Failed to get templates'),
    );

    await expect(selectTemplatePrompt()).rejects.toThrow(
      'Failed to get templates',
    );
    expect(getAvailableTemplates).toHaveBeenCalled();
    expect(select).not.toHaveBeenCalled();
  });

  it('should handle different path formats', async () => {
    const mockTemplates = [
      { name: 'Template 1', path: '/path/to/template1.hbs' },
      { name: 'Template 2', path: 'C:\\path\\to\\template2.hbs' },
    ];

    vi.mocked(getAvailableTemplates).mockResolvedValue(mockTemplates);
    vi.mocked(select).mockResolvedValue('C:\\path\\to\\template2.hbs');

    const result = await selectTemplatePrompt();

    expect(result).toBe('C:\\path\\to\\template2.hbs');
    expect(select).toHaveBeenCalledWith({
      message: 'Select a template:',
      choices: [
        { value: '/path/to/template1.hbs', name: 'Template 1' },
        { value: 'C:\\path\\to\\template2.hbs', name: 'Template 2' },
      ],
    });
  });
});
