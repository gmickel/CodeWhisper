import { editor } from '@inquirer/prompts';
import { describe, expect, it, vi } from 'vitest';
import { getTaskDescription } from '../../src/ai/get-task-description';

vi.mock('@inquirer/prompts', () => ({
  editor: vi.fn(),
}));

describe('getTaskDescription', () => {
  it('should return task description from user input', async () => {
    const mockDescription = '# Test Task\n\nThis is a test task description';
    vi.mocked(editor).mockResolvedValue(mockDescription);

    const result = await getTaskDescription();

    expect(result).toBe(mockDescription);
    expect(editor).toHaveBeenCalledWith({
      message: 'Describe your task:',
      default: expect.stringContaining(
        '# Title\nProvide a title for your task here',
      ),
      waitForUseInput: false,
    });
  });

  it('should handle empty input', async () => {
    vi.mocked(editor).mockResolvedValue('');

    const result = await getTaskDescription();

    expect(result).toBe('');
  });

  it('should handle cancellation', async () => {
    vi.mocked(editor).mockResolvedValue(undefined as unknown as string);

    const result = await getTaskDescription();

    expect(result).toBeUndefined();
  });
});
