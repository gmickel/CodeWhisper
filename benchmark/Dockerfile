FROM node:20

# Enable corepack for pnpm support
RUN corepack enable

# Install Python, pip, and build essentials
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    build-essential \
    git \
    && rm -rf /var/lib/apt/lists/*

# Set up pnpm to use a specific store directory in the container
RUN echo "store-dir=/root/.pnpm-store" > /root/.npmrc

# Set up working directory for the main project
WORKDIR /app

# Copy the entire CodeWhisper project
COPY .. .

# Install dependencies for the main project
RUN pnpm install

# Set NODE_ENV to development for the build process
ENV NODE_ENV=development

# Build the main project
RUN pnpm run build

# Change to the benchmark directory
WORKDIR /app/benchmark

# Install dependencies for the benchmark
RUN pnpm install

# Build the benchmark
RUN pnpm run build

# Set environment variables back to production
ENV NODE_ENV=production

# Set PATH to include CodeWhisper's dist directory
ENV PATH="/app/dist/cli:${PATH}"

# Run benchmark
CMD ["node", "--unhandled-rejections=strict", "/app/benchmark/dist/benchmark.js"]
