# Paze Telegram Bot - Standalone Version

A standalone Telegram bot for analyzing infrastructure damage photos and uploading to IPFS.

## Features

- 🎥 Video frame extraction using CLIP
- 🧠 AI-powered image analysis with Claude Vision
- 🌤️ Weather data integration (Open-Meteo)
- 📰 News data integration (GDELT)
- ☁️ IPFS storage via Pinata
- 🗳️ DAO proposal ready outputs

## Prerequisites

- Node.js v22+
- Python 3.9+
- FFmpeg
- exiftool

### Install System Dependencies (macOS)

```bash
brew install ffmpeg exiftool python3
```

### Install Python Dependencies

```bash
pip3 install torch torchvision transformers pillow numpy opencv-python
```

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:
- `TELEGRAM_BOT_TOKEN` - Get from @BotFather on Telegram
- `ANTHROPIC_API_KEY` - Get from https://console.anthropic.com/
- `PINATA_JWT` or (`PINATA_API_KEY` + `PINATA_API_SECRET`) - Get from https://pinata.cloud/

3. Make sure the video frame extractor script is accessible:

The bot expects the Python script at: `../src/video-analyst/video-frame-extractor.py`

If you moved this folder, update the path in `bot.ts` line 348.

## Usage

Start the bot:

```bash
pnpm start
```

### Using the Bot

1. Start a chat with your bot on Telegram
2. Send `/start` to see instructions
3. Send a video with a caption describing the damage
   - Example: "Cracked footpath on Main Street"
4. Bot extracts the best frame
5. Click the "Analyze" button
6. Get IPFS URLs for your DAO proposal

### Video Size Limits

Telegram Bot API has a 20MB hard limit. If your video is larger:

```bash
# Compress video
ffmpeg -i input.mp4 -vcodec h264 -crf 28 output.mp4

# Or trim to shorter duration
ffmpeg -i input.mp4 -t 30 -c copy output.mp4
```

## Project Structure

```
tg_analysis/
├── bot.ts                  # Main bot implementation
├── analyze-photo.ts        # Photo analysis logic
├── providers.ts            # API providers (Claude, Weather, News, Location)
├── shared-config.ts        # Configuration
├── providers/              # Original provider files (reference)
├── services/               # Storage services
│   └── pinata.service.ts
├── utils/                  # Utilities
│   └── format-analysis.ts
├── data/                   # SQLite database
├── output/                 # Analysis JSON outputs
└── temp/                   # Temporary files

```

## How It Works

1. **Video Upload**: User sends video with description
2. **Frame Extraction**: Python CLIP model finds best frame matching description
3. **Metadata Extraction**: Extract EXIF data (GPS, timestamp, camera info)
4. **Image Analysis**: Claude Vision analyzes the image
5. **Context Enrichment**: 
   - Reverse geocoding (OpenStreetMap)
   - Historical weather data (Open-Meteo)
   - Local news (GDELT)
6. **IPFS Upload**: Upload image + analysis JSON to Pinata
7. **Return URLs**: User gets IPFS URLs for DAO proposal

## Troubleshooting

### Bot not responding
- Check if `TELEGRAM_BOT_TOKEN` is correct
- Make sure bot is running (`pnpm start`)

### Analysis fails
- Check `ANTHROPIC_API_KEY` is valid
- Check `PINATA_JWT` or Pinata API keys are valid
- Check Python dependencies are installed

### Frame extraction fails
- Make sure Python 3.9+ is installed
- Install required Python packages (torch, transformers, etc.)
- Check FFmpeg is installed

### Video too large
- Compress video before sending (see Video Size Limits above)

## License

MIT
