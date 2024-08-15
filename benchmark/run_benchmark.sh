#!/bin/bash

# Default values
MODEL="claude-3-5-sonnet-20240620"
CONCURRENT_WORKERS=4
NUM_TESTS=10
NO_PLAN=false
DIFF_MODE=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    key="$1"
    case $key in
        --model)
        MODEL="$2"
        shift
        shift
        ;;
        --workers)
        CONCURRENT_WORKERS="$2"
        shift
        shift
        ;;
        --tests)
        NUM_TESTS="$2"
        shift
        shift
        ;;
        --no-plan)
        NO_PLAN=true
        shift
        ;;
        --diff)
        DIFF_MODE="--diff"
        shift
        ;;
        --no-diff)
        DIFF_MODE="--no-diff"
        shift
        ;;
        *)
        echo "Unknown option: $1"
        exit 1
        ;;
    esac
done

# Determine which API key to use based on the model
if [[ $MODEL == claude* ]]; then
    API_KEY=$ANTHROPIC_API_KEY
elif [[ $MODEL == gpt* ]]; then
    API_KEY=$OPENAI_API_KEY
elif [[ $MODEL == groq* ]]; then
    API_KEY=$GROQ_API_KEY
elif [[ $MODEL == deepseek* ]]; then
    API_KEY=$DEEPSEEK_API_KEY
else
    echo "Unknown model type. Please ensure you've set the correct API key."
    exit 1
fi

# Check if the required API key is set
if [ -z "$API_KEY" ]; then
    echo "Error: API key for the selected model is not set."
    exit 1
fi

# Run the Docker container
docker run -it --rm \
    -e API_KEY=$API_KEY \
    -e MODEL=$MODEL \
    -e CONCURRENT_WORKERS=$CONCURRENT_WORKERS \
    -e NUM_TESTS=$NUM_TESTS \
    -e NO_PLAN=$NO_PLAN \
    -e DIFF_MODE=$DIFF_MODE \
    codewhisper-benchmark
