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
  await execAsync(`git clone --depth 1 ${repoUrl} ${targetDir}`);
}

export async function runCodeWhisper(
  solutionFile: string,
  instructions: string,
  model: string,
  noPlan: boolean,
  diffMode: string,
): Promise<CodeWhisperResult> {
  const noPlanFlag = noPlan ? '--no-plan' : '';
  const cmd = `codewhisper task --task "Implement solution" --description "${instructions}" --accept-plan --model "${model}" --path "${path.dirname(solutionFile)}" ${noPlanFlag} ${diffMode}`;
  const startTime = Date.now();
  const { stdout } = await execAsync(cmd);
  const endTime = Date.now();

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

export async function runTests(testFile: string): Promise<boolean> {
  try {
    await execAsync(`python3 -m unittest ${testFile}`);
    return true;
  } catch (error) {
    return false;
  }
}

export async function runExercise(
  exerciseDir: string,
  model: string,
  noPlan: boolean,
  diffMode: string,
): Promise<BenchmarkResult> {
  const configFile = path.join(exerciseDir, '.meta', 'config.json');
  const config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));

  const solutionFile = path.join(exerciseDir, config.files.solution[0]);
  const testFile = path.join(exerciseDir, config.files.test[0]);

  const instructions = fs.readFileSync(
    path.join(exerciseDir, '.docs', 'instructions.md'),
    'utf-8',
  );

  // Run CodeWhisper
  const codewhisperResult = await runCodeWhisper(
    solutionFile,
    instructions,
    model,
    noPlan,
    diffMode,
  );

  // Run tests
  const testResult = await runTests(testFile);

  // Calculate metrics
  return {
    exercise: path.basename(exerciseDir),
    time_taken: codewhisperResult.time / 1000, // Convert to seconds
    total_cost: codewhisperResult.totalCost,
    mode_used: codewhisperResult.modeUsed,
    model_used: model,
    test_passed: testResult,
    errors: [], // This should be populated with any errors encountered
  };
}
