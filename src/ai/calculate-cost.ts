// TODO: Replace this with actual cost calculation logic

const COST_PER_1K_TOKENS = 0.03;

export function calculateCost(tokens: number): number {
  return (tokens / 1000) * COST_PER_1K_TOKENS;
}
