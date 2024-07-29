import { editor } from '@inquirer/prompts';
import { describe, expect, it, vi } from 'vitest';
import { getInstructions } from '../../src/ai/get-instructions';

vi.mock('@inquirer/prompts', () => ({
  editor: vi.fn(),
}));

describe('getInstructions', () => {
  it('should return instructions from user input', async () => {
    const mockInstructions = 'These are the test instructions';
    vi.mocked(editor).mockResolvedValue(mockInstructions);

    const result = await getInstructions();

    expect(result).toBe(mockInstructions);
    expect(editor).toHaveBeenCalledWith({
      message: 'Provide further instructions for completing the task:',
      default: expect.stringContaining(
        'Provide your instructions for completing the task here',
      ),
      waitForUseInput: false,
    });
  });

  it('should handle empty input', async () => {
    vi.mocked(editor).mockResolvedValue('');

    const result = await getInstructions();

    expect(result).toBe('');
  });

  it('should handle cancellation', async () => {
    vi.mocked(editor).mockResolvedValue(undefined as unknown as string);

    const result = await getInstructions();

    expect(result).toBeUndefined();
  });
});
