import { exec } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
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
  const instructionsFile = path.join(exerciseDir, '.docs', 'instructions.md');

  // Use relative paths for the -f option
  const relSolutionFile = path.relative(exerciseDir, solutionFile);
  const relTestFile = path.relative(exerciseDir, testFile);
  const relInstructionsFile = path.relative(exerciseDir, instructionsFile);

  const planFlag = noPlan ? '--no-plan' : '--accept-plan';
  const cmd = `node /app/dist/cli/index.js task -t "Solve the following problem" --description "Solve the problem described in the instructions.md file by editing the file ${relSolutionFile}. Ensure the solution passes the tests in ${relTestFile}." -i " " --skip-files ${planFlag} --model "${model}" --path "${exerciseDir}" ${diffMode} -f "${relSolutionFile}" "${relTestFile}" "${relInstructionsFile}"`;

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
  try {
    const testDir = path.dirname(testFile);
    const { stdout, stderr } = await execAsync(
      `python3 -m unittest ${path.basename(testFile)}`,
      { cwd: testDir },
    );
    const output = stdout + stderr;

    const totalTests = Number.parseInt(
      output.match(/Ran (\d+) test/)?.[1] || '0',
    );
    const failedTests =
      output.match(/FAIL: (test_\w+)/g)?.map((match) => match.split(': ')[1]) ||
      [];
    const passedTests = totalTests - failedTests.length;

    // Create a concise output
    const conciseOutput =
      '.'.repeat(passedTests) + 'F'.repeat(failedTests.length);

    return {
      passed: failedTests.length === 0,
      output: conciseOutput,
      total_tests: totalTests,
      passed_tests: passedTests,
      failed_tests: failedTests,
    };
  } catch (error) {
    if (error instanceof Error && 'stdout' in error && 'stderr' in error) {
      const output = (error.stdout as string) + (error.stderr as string);
      return {
        passed: false,
        output: 'E',
        total_tests: 0,
        passed_tests: 0,
        failed_tests: [],
      };
    }
    return {
      passed: false,
      output: 'E',
      total_tests: 0,
      passed_tests: 0,
      failed_tests: [],
    };
  }
}

export async function runExercise(
  exerciseDir: string,
  model: string,
  noPlan: boolean,
  diffMode: string,
): Promise<BenchmarkResult> {
  const exerciseName = path.basename(exerciseDir);
  console.log(`Starting exercise: ${exerciseName}`);

  const configFile = path.join(exerciseDir, '.meta', 'config.json');
  const config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));

  const testFile = path.join(exerciseDir, config.files.test[0]);

  let codewhisperResult: CodeWhisperResult | undefined;
  let codewhisperError: string | null = null;

  try {
    const codewhisperPromise = runCodeWhisper(
      exerciseDir,
      model,
      noPlan,
      diffMode,
    );
    const timeoutPromise = new Promise<never>(
      (_, reject) =>
        setTimeout(
          () => reject(new Error('CodeWhisper execution timed out')),
          600000,
        ), // 10 minutes timeout
    );
    codewhisperResult = await Promise.race([
      codewhisperPromise,
      timeoutPromise,
    ]);
  } catch (error) {
    codewhisperError =
      error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(`Error in runCodeWhisper for ${exerciseName}:`, error);
  }

  if (codewhisperError || !codewhisperResult) {
    console.log(`Exercise ${exerciseName} failed during CodeWhisper execution`);
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
      errors: codewhisperError
        ? [codewhisperError]
        : ['CodeWhisper execution failed'],
    };
  }

  // Run tests
  console.log(`Running tests for ${exerciseName}`);
  const testResult = await runTests(testFile);

  console.log(`Completed exercise: ${exerciseName}`);

  // Calculate metrics
  return {
    exercise: exerciseName,
    time_taken: codewhisperResult.time / 1000, // Convert to seconds
    total_cost: codewhisperResult.totalCost,
    mode_used: codewhisperResult.modeUsed,
    model_used: model,
    test_passed: testResult.passed,
    test_output: testResult.output,
    total_tests: testResult.total_tests,
    passed_tests: testResult.passed_tests,
    failed_tests: testResult.failed_tests,
    errors: [],
  };
}
