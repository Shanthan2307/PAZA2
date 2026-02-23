FROM node:20-alpine

# Install Python, pip, ffmpeg, and OpenCV for video processing
RUN apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg \
    build-base \
    python3-dev \
    py3-opencv

# Create app directory
WORKDIR /app

# Install Python packages for video processing
RUN pip3 install --no-cache-dir opencv-python-headless numpy --break-system-packages

# Copy package files
COPY package*.json ./

# Install Node dependencies (including dev for tsx)
RUN npm ci

# Copy application code
COPY . .

# Create temp directory for video processing
RUN mkdir -p temp/telegram-videos

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "console.log('healthy')" || exit 1

# Start the bot
CMD ["npm", "start"]
