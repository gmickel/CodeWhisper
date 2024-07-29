import { editor } from '@inquirer/prompts';
import { describe, expect, it, vi } from 'vitest';
import { reviewPlan } from '../../src/ai/plan-review';

vi.mock('@inquirer/prompts', () => ({
  editor: vi.fn(),
}));

describe('reviewPlan', () => {
  it('should return the edited plan', async () => {
    const initialPlan = 'Initial plan content';
    const editedPlan = 'Edited plan content';
    vi.mocked(editor).mockResolvedValue(editedPlan);

    const result = await reviewPlan(initialPlan);

    expect(result).toBe(editedPlan);
    expect(editor).toHaveBeenCalledWith({
      message: 'Review and edit the generated plan:',
      default: initialPlan,
    });
  });

  it('should return the original plan if no changes are made', async () => {
    const initialPlan = 'Initial plan content';
    vi.mocked(editor).mockResolvedValue(initialPlan);

    const result = await reviewPlan(initialPlan);

    expect(result).toBe(initialPlan);
  });

  it('should handle empty input', async () => {
    const initialPlan = 'Initial plan content';
    vi.mocked(editor).mockResolvedValue('');

    const result = await reviewPlan(initialPlan);

    expect(result).toBe('');
  });

  it('should handle cancellation', async () => {
    const initialPlan = 'Initial plan content';
    vi.mocked(editor).mockResolvedValue(undefined as unknown as string);

    const result = await reviewPlan(initialPlan);

    expect(result).toBeUndefined();
  });
});
