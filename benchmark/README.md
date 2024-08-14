# CodeWhisper Benchmark

This benchmark tool is designed to evaluate the performance of CodeWhisper on Exercism Python exercises.

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
   - `--tests`: Number of tests to run (default: 10)
   - `--no-plan`: Disable the planning mode (default: false)
   - `--diff`: Use the diff mode for AI-generated code modifications (overrides the model's default setting)
   - `--no-diff`: Use the whole file edit mode for AI-generated code modifications (overrides the model's default setting)

## Output

The benchmark will output a JSON array of metrics for each exercise, including:

- Time taken
- Total cost (LLM API costs)
- Mode used (diff/whole)
- Model used
- Whether the test passed
- Any errors encountered

A summary of the results will also be displayed, showing the total time, total cost, and percentage of passed tests.

## Notes

- Ensure that you've set the appropriate API key as an environment variable for the model you intend to use before running the benchmark.
- The benchmark runs in a Docker container to sandbox the execution and prevent changes to the host filesystem.
- Each model has a default setting for diff/whole file edit mode. The `--diff` and `--no-diff` options allow you to override this default behavior for the benchmark.
