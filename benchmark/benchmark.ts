import * as fs from 'node:fs';
import * as path from 'node:path';
import pLimit from 'p-limit';
import type { BenchmarkResult, SummaryStats } from './types';
import { cloneRepo, runExercise } from './utils';

const EXERCISM_REPO = 'https://github.com/exercism/python.git';
const REPO_DIR = '/tmp/exercism-python';
const EXERCISES_DIR = path.join(REPO_DIR, 'exercises', 'practice');

async function main(): Promise<void> {
  const model = process.env.MODEL || 'claude-3-5-sonnet-20240620';
  const concurrentWorkers = Number.parseInt(
    process.env.CONCURRENT_WORKERS || '4',
    10,
  );
  const numTests = Number.parseInt(process.env.NUM_TESTS || '10', 10);
  const noPlan = process.env.NO_PLAN === 'true';

  console.log(
    `Running benchmark with model: ${model}, workers: ${concurrentWorkers}, tests: ${numTests}, no-plan: ${noPlan}`,
  );

  // Clone Exercism repo
  await cloneRepo(EXERCISM_REPO, REPO_DIR);

  // Get list of exercises
  const exercises = fs
    .readdirSync(EXERCISES_DIR)
    .map((dir) => path.join(EXERCISES_DIR, dir))
    .sort(() => Math.random() - 0.5)
    .slice(0, numTests);

  // Set up concurrent limit
  const limit = pLimit(concurrentWorkers);

  // Run exercises concurrently
  const results: BenchmarkResult[] = await Promise.all(
    exercises.map((exerciseDir) =>
      limit(() => runExercise(exerciseDir, model, noPlan)),
    ),
  );

  // Output results
  console.log(JSON.stringify(results, null, 2));

  // Calculate and output summary statistics
  const summary: SummaryStats = results.reduce(
    (acc, result) => {
      acc.totalTime += result.time_taken;
      acc.totalCost += result.total_cost;
      acc.passedTests += result.test_passed ? 1 : 0;
      return acc;
    },
    { totalTime: 0, totalCost: 0, passedTests: 0 },
  );

  console.log('\nSummary:');
  console.log(`Total time: ${summary.totalTime.toFixed(2)} seconds`);
  console.log(`Total cost: $${summary.totalCost.toFixed(4)}`);
  console.log(
    `Passed tests: ${summary.passedTests}/${results.length} (${((summary.passedTests / results.length) * 100).toFixed(2)}%)`,
  );
}

main().catch(console.error);
