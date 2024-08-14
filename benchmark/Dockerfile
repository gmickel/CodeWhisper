FROM node:20

# Install Python and pip
RUN apt-get update && apt-get install -y python3 python3-pip

# Install git
RUN apt-get install -y git

# Set up working directory
WORKDIR /app

# Copy benchmark files
COPY benchmark/ .

# Install Node.js dependencies
RUN npm install

# Install CodeWhisper globally
RUN npm install -g codewhisper

# Set environment variables
ENV NODE_ENV=production

# Run benchmark
CMD ["npm", "start"]
