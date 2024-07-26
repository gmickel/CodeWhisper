import { editor } from '@inquirer/prompts';

export async function reviewPlan(generatedPlan: string): Promise<string> {
  return editor({
    message: 'Review and edit the generated plan:',
    default: generatedPlan,
  });
}
