import * as fs from 'node:fs';
import * as path from 'node:path';
import ora from 'ora';
import pLimit from 'p-limit';
import type { BenchmarkResult, SummaryStats } from './types';
import { cloneRepo, runExercise } from './utils';

const DEBUG_MODE = process.env.DEBUG_MODE === 'true';
const DEBUG_LIMIT = 10;

const EXERCISM_REPO = 'https://github.com/exercism/python.git';
const REPO_DIR = '/tmp/exercism-python';
const EXERCISES_DIR = path.join(REPO_DIR, 'exercises', 'practice');

async function main(): Promise<void> {
  try {
    const model = process.env.MODEL || 'claude-3-5-sonnet-20240620';
    const concurrentWorkers = Number.parseInt(
      process.env.CONCURRENT_WORKERS || '4',
      10,
    );
    const numTests = process.env.NUM_TESTS || 'all';
    const noPlan = process.env.NO_PLAN === 'true';
    const diffMode = process.env.DIFF_MODE || '';

    console.log(
      `Running benchmark with model: ${model}, workers: ${concurrentWorkers}, tests: ${numTests}, no-plan: ${noPlan}, diff-mode: ${diffMode || 'default'}`,
    );

    const spinner = ora('Starting benchmark').start();

    // Clone Exercism repo
    spinner.text = 'Cloning Exercism repository';
    await cloneRepo(EXERCISM_REPO, REPO_DIR);

    // Get list of exercises
    let exercises = fs
      .readdirSync(EXERCISES_DIR)
      .map((dir) => path.join(EXERCISES_DIR, dir));

    if (DEBUG_MODE) {
      console.log(`DEBUG: Limiting tests to ${DEBUG_LIMIT} for testing`);
      exercises = exercises.slice(0, DEBUG_LIMIT);
    } else if (numTests !== 'all') {
      const numTestsInt = Number.parseInt(numTests, 10);
      if (Number.isNaN(numTestsInt) || numTestsInt <= 0) {
        throw new Error('Invalid number of tests specified');
      }
      exercises = exercises
        .sort(() => Math.random() - 0.5)
        .slice(0, numTestsInt);
    }

    console.log(`Total exercises to run: ${exercises.length}`);

    // Set up concurrent limit
    const limit = pLimit(concurrentWorkers);

    // Run exercises concurrently
    spinner.text = 'Running exercises';
    let completedExercises = 0;
    const results: BenchmarkResult[] = await Promise.all(
      exercises.map((exerciseDir) =>
        limit(async () => {
          const exerciseName = path.basename(exerciseDir);
          spinner.text = `Running exercise: ${exerciseName}`;
          const result = await runExercise(
            exerciseDir,
            model,
            noPlan,
            diffMode,
          );
          completedExercises++;
          console.log(
            `Completed ${completedExercises}/${exercises.length}: ${exerciseName}`,
          );
          return result;
        }),
      ),
    );

    spinner.succeed('Benchmark completed');

    // Calculate summary statistics
    const summary: SummaryStats = results.reduce(
      (acc, result) => {
        acc.totalTime += result.time_taken;
        acc.totalCost += result.total_cost;
        acc.passedTests += result.test_passed ? 1 : 0;
        return acc;
      },
      { totalTime: 0, totalCost: 0, passedTests: 0 },
    );

    // Generate and save markdown report with timestamp
    const reportDir = '/app/benchmark/reports';
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFileName = `benchmark_report_${timestamp}.md`;
    const reportPath = path.join(reportDir, reportFileName);

    const markdownReport = generateMarkdownReport(results, summary);
    fs.writeFileSync(reportPath, markdownReport);

    console.log(`Benchmark report saved as ${reportFileName}`);

    // Output summary to console
    console.log('\nSummary:');
    console.log(`Total time: ${summary.totalTime.toFixed(2)} seconds`);
    console.log(`Total cost: $${summary.totalCost.toFixed(4)}`);
    console.log(
      `Passed tests: ${summary.passedTests}/${results.length} (${((summary.passedTests / results.length) * 100).toFixed(2)}%)`,
    );

    console.log('Benchmark process finished. Exiting.');
  } catch (error) {
    console.error('An error occurred during the benchmark:', error);
  } finally {
    // Ensure the process exits
    process.exit(0);
  }
}

function generateMarkdownReport(
  results: BenchmarkResult[],
  summary: SummaryStats,
): string {
  let markdown = '# CodeWhisper Benchmark Report\n\n';

  markdown += '## Summary\n\n';
  markdown += `- **Total time:** ${summary.totalTime.toFixed(2)} seconds\n`;
  markdown += `- **Total cost:** $${summary.totalCost.toFixed(4)}\n`;
  markdown += `- **Passed exercises:** ${summary.passedTests}/${results.length} (${((summary.passedTests / results.length) * 100).toFixed(2)}%)\n\n`;

  markdown += '## Detailed Results\n\n';

  results.forEach((result, index) => {
    markdown += `### ${index + 1}. ${result.exercise}\n\n`;
    markdown += `- **Time taken:** ${result.time_taken.toFixed(2)} seconds\n`;
    markdown += `- **Cost:** $${result.total_cost.toFixed(4)}\n`;
    markdown += `- **Mode used:** ${result.mode_used}\n`;
    markdown += `- **Model used:** ${result.model_used}\n`;
    markdown += `- **Tests passed:** ${result.passed_tests}/${result.total_tests}\n`;

    if (result.failed_tests.length > 0) {
      markdown += '- **Failed tests:**\n';
      for (const test of result.failed_tests) {
        markdown += `  - ${test}\n`;
      }
    }

    if (result.errors.length > 0) {
      markdown += '- **Errors:**\n';
      for (const error of result.errors) {
        markdown += `  - ${error}\n`;
      }
    }

    markdown += '\n';
  });

  return markdown;
}

// Call main and handle any uncaught errors
main().catch((error) => {
  console.error('Unhandled error in main:', error);
  process.exit(1);
});
