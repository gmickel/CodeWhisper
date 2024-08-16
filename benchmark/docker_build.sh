#!/bin/bash

set -e

# Get the directory of the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Navigate to the parent directory of the script (main CodeWhisper project root)
cd "$SCRIPT_DIR/.." || exit

echo "Building Docker image from $(pwd)"

# Build the Docker image with verbose output
docker build --progress=plain -t codewhisper-benchmark -f "$SCRIPT_DIR/Dockerfile" . 2>&1 | tee build.log

echo "Docker build completed. Check build.log for details."
