export interface CodeWhisperResult {
  output: string;
  time: number;
  totalCost: number;
  modeUsed: 'diff' | 'whole';
}

export interface BenchmarkResult {
  exercise: string;
  time_taken: number;
  total_cost: number;
  mode_used: 'diff' | 'whole';
  model_used: string;
  test_passed: boolean;
  test_output: string;
  total_tests: number;
  passed_tests: number;
  failed_tests: string[];
  errors: string[];
}

export type SummaryStats = {
  totalTime: number;
  totalCost: number;
  passedTests: number;
  totalTests: number;
  totalPassedTests: number;
};
