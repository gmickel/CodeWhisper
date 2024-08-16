# CodeWhisper Benchmark

This benchmark tool is designed to evaluate the performance of CodeWhisper on Exercism Python exercises.

## Please note

- Running the full benchmark will use a significant amount of tokens.
- Too many concurrent workers is likely to cause rate limiting issues.

## Results

CodeWhisper's performance has been evaluated across different models using the Exercism Python exercises. Below is a summary of the benchmark results:

| Model                      | Tests Passed | Time (s) | Cost ($) | Command                                                                        |
| -------------------------- | ------------ | -------- | -------- | ------------------------------------------------------------------------------ |
| claude-3-5-sonnet-20240620 | 80.27%       | 1619.49  | 3.4000   | `./benchmark/run_benchmark.sh --workers 5 --no-plan`                           |
| gpt-4o-2024-08-06          | 81.51%       | 986.68   | 1.6800   | `./benchmark/run_benchmark.sh --workers 5 --no-plan --model gpt-4o-2024-08-06` |
| deepseek-coder             | 76.89%       | 5850.58  | 0.0000\* | `./benchmark/run_benchmark.sh --workers 5 --no-plan --model deepseek-coder`    |

\*The cost calculation was not working properly for this benchmark run.

> **Note:** All benchmarks are one-shot only, unlike other benchmarks which use multiple generations that depend on the results of the test run.

The full reports used to generate these results are available in the `benchmark/reports/` directory.

These results provide insights into the efficiency and accuracy of different models when used with CodeWhisper. The "Tests Passed" percentage indicates the proportion of Exercism tests successfully completed, while the time and cost metrics offer a view of the resource requirements for each model.

As we continue to run benchmarks with various models and configurations, this table will be updated to provide a comprehensive comparison, helping users make informed decisions about which model might best suit their needs.

## Usage

1. Build the Docker image:

   ```
   ./benchmark/docker_build.sh
   ```

2. Set up the appropriate API key as an environment variable based on the model you intend to use:

   - For Claude models: `export ANTHROPIC_API_KEY=your_anthropic_api_key`
   - For GPT models: `export OPENAI_API_KEY=your_openai_api_key`
   - For Groq models: `export GROQ_API_KEY=your_groq_api_key`
   - For DeepSeek models: `export DEEPSEEK_API_KEY=your_deepseek_api_key`

3. Run the benchmark:

   ```
   ./benchmark/run_benchmark.sh --model <model_name> --workers <num_workers> --tests <num_tests> [--no-plan] [--diff | --no-diff]
   ```

   Options:

   - `--model`: The AI model to use (default: claude-3-5-sonnet-20240620)
   - `--workers`: Number of concurrent workers (default: 4)
   - `--tests`: Number of tests to run (default: all tests)
   - `--no-plan`: Disable the planning mode (default: false)
   - `--diff`: Use the diff mode for AI-generated code modifications (overrides the model's default setting)
   - `--no-diff`: Use the whole file edit mode for AI-generated code modifications (overrides the model's default setting)

## Output

The benchmark will generate a detailed Markdown report for each run, including:

- Summary statistics (total time, total cost, percentage of passed tests)
- Detailed results for each exercise:
  - Time taken
  - Total cost (LLM API costs)
  - Mode used (diff/whole)
  - Model used
  - Number of tests passed
  - Any failed tests or errors encountered

The report will be saved in the `benchmark/reports/` directory with a timestamp in the filename.

A brief summary will also be displayed in the console after the benchmark completes.

## Notes

- Ensure that you've set the appropriate API key as an environment variable for the model you intend to use before running the benchmark.
- The benchmark runs in a Docker container to sandbox the execution and prevent changes to the host filesystem.
- Each model has a default setting for diff/whole file edit mode. The `--diff` and `--no-diff` options allow you to override this default behavior for the benchmark.
- You can run multiple benchmarks without overwriting previous results. Each run generates a new report file with a unique timestamp.
