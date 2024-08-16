import * as fs from 'node:fs';
import * as path from 'node:path';
import { setTimeout } from 'node:timers/promises';
import ora from 'ora';
import pLimit from 'p-limit';
import type { BenchmarkResult, SummaryStats } from './types';
import { cloneRepo, runExercise } from './utils';

const DEBUG_MODE = process.env.DEBUG_MODE === 'true';
const DEBUG_SKIP = DEBUG_MODE ? 113 : 0; // Skip the first 113 exercises in debug mode

const EXERCISM_REPO = 'https://github.com/exercism/python.git';
const REPO_DIR = '/tmp/exercism-python';
const EXERCISES_DIR = path.join(REPO_DIR, 'exercises', 'practice');

async function main(): Promise<void> {
  console.log('Main function started');
  console.log('Process ID:', process.pid);
  console.log('Node version:', process.version);
  console.log('Current working directory:', process.cwd());
  console.log('Debug mode:', DEBUG_MODE ? 'ON' : 'OFF');

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
      .map((dir) => path.join(EXERCISES_DIR, dir))
      .sort();

    if (DEBUG_MODE) {
      console.log(`DEBUG: Skipping the first ${DEBUG_SKIP} exercises`);
      exercises = exercises.slice(DEBUG_SKIP);
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

    const reportDir = '/app/benchmark/reports';
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFileName = `benchmark_report_${timestamp}.md`;
    const reportPath = path.join(reportDir, reportFileName);

    console.log(`Benchmark report will be saved as ${reportFileName}`);

    // Set up concurrent limit
    const limit = pLimit(concurrentWorkers);

    // Run exercises concurrently and write results incrementally
    spinner.text = 'Running exercises';
    const resultPromises = exercises.map((exerciseDir, index) =>
      limit(async () => {
        const exerciseName = path.basename(exerciseDir);
        spinner.text = `Running exercise: ${exerciseName}`;
        console.log(
          `Starting exercise ${index + 1}/${exercises.length}: ${exerciseName}`,
        );

        const exercisePromise = runExercise(
          exerciseDir,
          model,
          noPlan,
          diffMode,
        );
        const timeoutPromise = setTimeout(
          60000,
          'Exercise execution timed out',
        );

        let result: BenchmarkResult;
        try {
          const raceResult = await Promise.race([
            exercisePromise,
            timeoutPromise,
          ]);
          if (typeof raceResult === 'string') {
            throw new Error(raceResult);
          }
          result = raceResult;
        } catch (error) {
          console.error(`Error in exercise ${exerciseName}:`, error);
          result = {
            exercise: exerciseName,
            time_taken: 60, // 1 minute timeout
            total_cost: 0,
            mode_used: diffMode ? 'diff' : 'whole',
            model_used: model,
            test_passed: false,
            test_output: 'Exercise execution timed out or errored',
            total_tests: 0,
            passed_tests: 0,
            failed_tests: [],
            errors: [
              error instanceof Error ? error.message : 'Unknown error occurred',
            ],
          };
        }

        // Write result to report file (use a lock here if necessary)
        writeResultToReport(result, reportPath, index);

        console.log(
          `Completed ${index + 1}/${exercises.length}: ${exerciseName}`,
        );
        return result;
      }),
    );

    const results = await Promise.all(resultPromises);

    spinner.succeed('Benchmark completed');

    // Calculate summary
    const summary: SummaryStats = results.reduce(
      (acc, result) => {
        acc.totalTime += result.time_taken;
        acc.totalCost += result.total_cost;
        acc.passedTests += result.test_passed ? 1 : 0;
        acc.totalTests += result.total_tests;
        acc.totalPassedTests += result.passed_tests;
        return acc;
      },
      {
        totalTime: 0,
        totalCost: 0,
        passedTests: 0,
        totalTests: 0,
        totalPassedTests: 0,
      },
    );

    // Generate and prepend summary to the report
    const summaryMarkdown = generateSummaryMarkdown(results, summary);
    const existingReport = fs.readFileSync(reportPath, 'utf8');
    fs.writeFileSync(reportPath, summaryMarkdown + existingReport);

    console.log(`Benchmark report saved as ${reportFileName}`);

    // Output summary to console
    console.log('\nSummary:');
    console.log(`Total time: ${summary.totalTime.toFixed(2)} seconds`);
    console.log(`Total cost: $${summary.totalCost.toFixed(4)}`);
    console.log(
      `Passed exercises: ${summary.passedTests}/${results.length} (${((summary.passedTests / results.length) * 100).toFixed(2)}%)`,
    );
    console.log(
      `Total tests passed: ${summary.totalPassedTests}/${summary.totalTests} (${((summary.totalPassedTests / summary.totalTests) * 100).toFixed(2)}%)`,
    );

    console.log('Benchmark process finished. Exiting.');
  } catch (error) {
    console.error('An error occurred during the benchmark:', error);
  } finally {
    // Ensure the process exits
    process.exit(0);
  }
}

function writeResultToReport(
  result: BenchmarkResult,
  reportPath: string,
  index: number,
): void {
  let markdown = '';
  if (index === 0) {
    markdown += '# CodeWhisper Benchmark Report\n\n';
    markdown += '## Detailed Results\n\n';
  }

  markdown += `### ${index + 1}. ${result.exercise}\n\n`;
  markdown += `- **Time taken:** ${result.time_taken.toFixed(2)} seconds\n`;
  markdown += `- **Cost:** $${result.total_cost.toFixed(4)}\n`;
  markdown += `- **Mode used:** ${result.mode_used}\n`;
  markdown += `- **Model used:** ${result.model_used}\n`;
  const exerciseTestPassPercentage =
    result.total_tests > 0
      ? ((result.passed_tests / result.total_tests) * 100).toFixed(2)
      : '0.00';
  markdown += `- **Tests passed:** ${result.passed_tests}/${result.total_tests} (${exerciseTestPassPercentage}%)\n`;

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

  fs.appendFileSync(reportPath, markdown);
}

function generateSummaryMarkdown(
  results: BenchmarkResult[],
  summary: SummaryStats,
): string {
  let markdown = '# CodeWhisper Benchmark Report\n\n';

  markdown += '## Summary\n\n';
  markdown += `- **Total time:** ${summary.totalTime.toFixed(2)} seconds\n`;
  markdown += `- **Total cost:** $${summary.totalCost.toFixed(4)}\n`;
  markdown += `- **Passed exercises:** ${summary.passedTests}/${results.length} (${((summary.passedTests / results.length) * 100).toFixed(2)}%)\n`;
  const testPassPercentage =
    summary.totalTests > 0
      ? ((summary.totalPassedTests / summary.totalTests) * 100).toFixed(2)
      : '0.00';
  markdown += `- **Total tests passed:** ${summary.totalPassedTests}/${summary.totalTests} (${testPassPercentage}%)\n\n`;

  return markdown;
}

// Call main and handle any uncaught errors
main().catch((error) => {
  console.error('Unhandled error in main:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Optionally exit the process
  // process.exit(1);
});
