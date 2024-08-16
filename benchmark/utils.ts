import { exec } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { promisify } from 'node:util';
import type { BenchmarkResult, CodeWhisperResult } from './types';

const execAsync = promisify(exec);

export async function cloneRepo(
  repoUrl: string,
  targetDir: string,
): Promise<void> {
  console.log(`Cloning repository into ${targetDir}`);
  try {
    // Remove the directory if it exists
    if (fs.existsSync(targetDir)) {
      fs.rmSync(targetDir, { recursive: true, force: true });
      console.log(`Removed existing directory: ${targetDir}`);
    }

    // Clone the repository
    await execAsync(`git clone --depth 1 ${repoUrl} ${targetDir}`);
    console.log('Repository cloned successfully.');
  } catch (error) {
    console.error('Error cloning repository:', error);
    throw error;
  }
}

export async function runCodeWhisper(
  exerciseDir: string,
  model: string,
  noPlan: boolean,
  diffMode: string,
): Promise<CodeWhisperResult> {
  const configFile = path.join(exerciseDir, '.meta', 'config.json');
  const config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));

  const solutionFile = path.join(exerciseDir, config.files.solution[0]);
  const testFile = path.join(exerciseDir, config.files.test[0]);
  // const introductionFile = path.join(exerciseDir, '.docs', 'introduction.md');
  const instructionsFile = path.join(exerciseDir, '.docs', 'instructions.md');

  // Use relative paths for the -f option
  const relSolutionFile = path.relative(exerciseDir, solutionFile);
  const relTestFile = path.relative(exerciseDir, testFile);
  // const relIntroductionFile = path.relative(exerciseDir, introductionFile);
  const relInstructionsFile = path.relative(exerciseDir, instructionsFile);

  const planFlag = noPlan ? '--no-plan' : '--accept-plan';
  const cmd = `node /app/dist/cli/index.js task -t "Complete the following task" --description "Complete the task described in the instructions.md file by modifying the file ${relSolutionFile}. Ensure the solution passes the tests in ${relTestFile}." -i "Don't change the names of existing functions or classes, as they may be referenced from other code like unit tests, etc. Only use standard python libraries, don't suggest installing any packages. The test file that is provided is 100% correct and will pass if the solution is correct." --skip-files ${planFlag} --model "${model}" --path "${exerciseDir}" ${diffMode} -f "${relSolutionFile}" "${relTestFile}" "${relInstructionsFile}" --log-ai-interactions`;

  const startTime = Date.now();
  const { stdout } = await execAsync(cmd);
  const endTime = Date.now();

  // Check if the solution file exists and has content
  if (
    !fs.existsSync(solutionFile) ||
    fs.readFileSync(solutionFile, 'utf-8').trim() === ''
  ) {
    throw new Error(
      `Solution file ${solutionFile} was not created or is empty`,
    );
  }

  // Parse the total cost from the output
  const costMatches = stdout.match(/Total cost so far: \$(\d+\.\d{2}) USD/g);
  let totalCost = 0;
  if (costMatches && costMatches.length > 0) {
    const lastCostMatch = costMatches[costMatches.length - 1];
    totalCost = Number.parseFloat(
      lastCostMatch.match(/\$(\d+\.\d{2})/)?.[1] ?? '0',
    );
  }

  // Determine the mode used
  const modeUsed = stdout.includes('diff') ? 'diff' : 'whole';

  return {
    output: stdout,
    time: endTime - startTime,
    totalCost,
    modeUsed,
  };
}

export async function runTests(testFile: string): Promise<{
  passed: boolean;
  output: string;
  total_tests: number;
  passed_tests: number;
  failed_tests: string[];
}> {
  const testFileName = path.basename(testFile);
  console.log(`Running tests for ${testFileName}`);

  try {
    const testDir = path.dirname(testFile);
    const { stdout, stderr } = await execAsync(
      `python3 -m unittest ${testFileName}`,
      { cwd: testDir },
    );
    const output = stdout + stderr;
    return parseTestOutput(output, testFileName);
  } catch (error) {
    console.error(`Error running tests for ${testFileName}:`, error);
    if (error instanceof Error && 'stdout' in error && 'stderr' in error) {
      const output = (error.stdout as string) + (error.stderr as string);
      return parseTestOutput(output, testFileName);
    }
    return {
      passed: false,
      output: error instanceof Error ? error.message : 'Unknown error occurred',
      total_tests: 0,
      passed_tests: 0,
      failed_tests: ['Error running tests'],
    };
  }
}

function parseTestOutput(
  output: string,
  testFileName: string,
): {
  passed: boolean;
  output: string;
  total_tests: number;
  passed_tests: number;
  failed_tests: string[];
} {
  // Count dots for passed tests and F's for failed tests
  const passedCount = (output.match(/\./g) || []).length;
  const failedCount = (output.match(/F/g) || []).length;
  const totalTests = passedCount + failedCount;

  // Extract failed test names
  const failedTests = (output.match(/FAIL: (test_\w+)/g) || []).map(
    (match) => match.split(': ')[1],
  );

  const passed = failedCount === 0;

  console.log(
    `Tests completed for ${testFileName}. Total: ${totalTests}, Passed: ${passedCount}, Failed: ${failedCount}`,
  );

  return {
    passed,
    output,
    total_tests: totalTests,
    passed_tests: passedCount,
    failed_tests: failedTests,
  };
}

export async function runExercise(
  exerciseDir: string,
  model: string,
  noPlan: boolean,
  diffMode: string,
): Promise<BenchmarkResult> {
  const exerciseName = path.basename(exerciseDir);
  console.log(`Starting exercise: ${exerciseName}`);

  try {
    // Read the config file to get the correct test file name
    const configFile = path.join(exerciseDir, '.meta', 'config.json');
    const config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
    const testFileName = config.files.test[0]; // Get the first test file name

    // Run CodeWhisper with a timeout
    const codewhisperPromise = runCodeWhisper(
      exerciseDir,
      model,
      noPlan,
      diffMode,
    );
    const timeoutPromise = setTimeout(60000, 'CodeWhisper execution timed out');

    const codewhisperResult = await Promise.race([
      codewhisperPromise,
      timeoutPromise,
    ]);

    if (codewhisperResult === 'CodeWhisper execution timed out') {
      console.log(
        `CodeWhisper execution for ${exerciseName} timed out after 1 minute`,
      );
      return {
        exercise: exerciseName,
        time_taken: 600,
        total_cost: 0,
        mode_used: diffMode ? 'diff' : 'whole',
        model_used: model,
        test_passed: false,
        test_output: 'CodeWhisper execution timed out',
        total_tests: 0,
        passed_tests: 0,
        failed_tests: [],
        errors: ['CodeWhisper execution timed out after 1 minutes'],
      };
    }

    console.log(
      `CodeWhisper execution for ${exerciseName} completed. Running tests.`,
    );

    // Run tests
    const testFile = path.join(exerciseDir, testFileName);
    const testResult = await runTests(testFile);

    console.log(
      `Tests for ${exerciseName} completed. Result: ${testResult.passed ? 'PASSED' : 'FAILED'}`,
    );

    // Calculate metrics
    return {
      exercise: exerciseName,
      time_taken: (codewhisperResult as CodeWhisperResult).time / 1000, // Convert to seconds
      total_cost: (codewhisperResult as CodeWhisperResult).totalCost,
      mode_used: (codewhisperResult as CodeWhisperResult).modeUsed,
      model_used: model,
      test_passed: testResult.passed,
      test_output: testResult.output,
      total_tests: testResult.total_tests,
      passed_tests: testResult.passed_tests,
      failed_tests: testResult.failed_tests,
      errors: [],
    };
  } catch (error) {
    console.error(`Error in exercise ${exerciseName}:`, error);
    return {
      exercise: exerciseName,
      time_taken: 0,
      total_cost: 0,
      mode_used: diffMode ? 'diff' : 'whole',
      model_used: model,
      test_passed: false,
      test_output: '',
      total_tests: 0,
      passed_tests: 0,
      failed_tests: [],
      errors: [
        error instanceof Error ? error.message : 'Unknown error occurred',
      ],
    };
  }
}
