import TelegramBot from 'node-telegram-bot-api';
import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { elizaLogger } from '@elizaos/core';
import { PhotoAnalyzer } from './analyze-photo';
import { ImageAnalysisProvider, LocationProvider, WeatherProvider, NewsProvider } from './providers';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Add global error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  elizaLogger.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  elizaLogger.error('Uncaught Exception:', error);
  process.exit(1);
});

interface VideoAnalysisResult {
  success: boolean;
  imageUrl?: string;
  analysisUrl?: string;
  message: string;
  error?: string;
}

export class PazeTelegramBot {
  private bot: TelegramBot;
  private tempDir: string;
  private token: string;
  private analyzer: PhotoAnalyzer;
  private framePathMap: Map<string, string> = new Map();

  constructor(token: string) {
    this.token = token;
    this.bot = new TelegramBot(token, { polling: true });
    this.tempDir = path.join(__dirname, 'temp', 'telegram-videos');
    
    // Initialize providers
    const providers = {
      imageAnalysis: new ImageAnalysisProvider(process.env.ANTHROPIC_API_KEY!),
      location: new LocationProvider(),
      weather: new WeatherProvider(),
      news: new NewsProvider()
    };
    
    this.analyzer = new PhotoAnalyzer(providers);
    this.setupHandlers();
  }

  private setupHandlers() {
    // Handle /start command
    this.bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      this.bot.sendMessage(
        chatId,
        '🤖 Welcome to Paze - People\'s Waze for Infrastructure!\n\n' +
        'Report infrastructure damage and help your community:\n\n' +
        '1. 🎥 Send a video of the damage\n' +
        '2. 📝 Add a caption describing what to look for\n' +
        '3. 📸 Bot extracts the best frame\n' +
        '4. 🧠 Click "Analyze" to process with AI\n' +
        '5. ☁️ Get IPFS URLs for DAO proposal\n\n' +
        'Example: Send a video with caption:\n' +
        '"Cracked footpath on Main Street"'
      );
    });

    // Handle /help command
    this.bot.onText(/\/help/, (msg) => {
      const chatId = msg.chat.id;
      this.bot.sendMessage(
        chatId,
        '📖 How to use Paze:\n\n' +
        '1. Record a video of the damage\n' +
        '   ⚠️ Keep it under 20MB (about 1 minute)\n' +
        '2. Send it to this bot\n' +
        '3. Add a caption describing what\'s damaged\n' +
        '   Example: "Broken sidewalk" or "Pothole on 5th Ave"\n\n' +
        '4. Bot extracts the frame\n' +
        '5. Click "Analyze" button\n' +
        '6. Get IPFS URLs (30-60 seconds)\n\n' +
        '💡 If video is too large, compress it:\n' +
        'ffmpeg -i input.mp4 -vcodec h264 -crf 28 output.mp4\n\n' +
        'Commands:\n' +
        '/start - Start the bot\n' +
        '/help - Show this help message\n' +
        '/status - Check bot status'
      );
    });

    // Handle /status command
    this.bot.onText(/\/status/, (msg) => {
      const chatId = msg.chat.id;
      this.bot.sendMessage(
        chatId,
        '✅ Bot is online and ready!\n\n' +
        'Services:\n' +
        '• Video Analysis: ✅ Ready\n' +
        '• Photo Analyst: ✅ Ready\n' +
        '• IPFS Upload: ✅ Ready\n' +
        '• Weather API: ✅ Ready\n' +
        '• News API: ✅ Ready'
      );
    });

    // Handle video messages
    this.bot.on('video', async (msg) => {
      await this.handleVideo(msg);
    });

    // Handle document messages (videos sent as files)
    this.bot.on('document', async (msg) => {
      if (msg.document?.mime_type?.startsWith('video/')) {
        await this.handleVideo(msg);
      }
    });

    // Handle callback queries (button clicks)
    this.bot.on('callback_query', async (query) => {
      await this.handleCallback(query);
    });

    elizaLogger.info('Telegram bot handlers set up');
  }

  private async handleVideo(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const video = msg.video || msg.document;
    const caption = msg.caption || '';

    if (!video) {
      await this.bot.sendMessage(chatId, '❌ No video found in message');
      return;
    }

    if (!caption) {
      await this.bot.sendMessage(
        chatId,
        '⚠️ Please add a caption describing what damage to look for.\n\n' +
        'Example: "Cracked footpath" or "Broken sidewalk"'
      );
      return;
    }

    try {
      const statusMsg = await this.bot.sendMessage(
        chatId,
        '🔄 Processing your video...\n\n' +
        `📹 Video received\n` +
        `🔍 Looking for: "${caption}"\n\n` +
        'This may take 30-60 seconds...'
      );

      // Download video
      await this.bot.editMessageText(
        '⬇️ Downloading video...',
        { chat_id: chatId, message_id: statusMsg.message_id }
      );

      const videoPath = await this.downloadVideo(video.file_id, chatId);

      // Extract frame
      await this.bot.editMessageText(
        '🎬 Extracting frame from video...\n' +
        `🔍 Looking for: "${caption}"`,
        { chat_id: chatId, message_id: statusMsg.message_id }
      );

      const framePath = await this.extractFrame(videoPath, caption);

      // Frame extracted - send it with analyze button
      await this.bot.editMessageText(
        '✅ Frame extracted successfully!\n\n' +
        `🔍 Found: "${caption}"\n\n` +
        'Click "Analyze" to process with AI and upload to IPFS.',
        { chat_id: chatId, message_id: statusMsg.message_id }
      );

      // Generate short ID for callback_data
      const frameId = `${chatId}-${Date.now()}`;
      this.framePathMap.set(frameId, framePath);

      // Send the extracted frame with analyze button
      await this.bot.sendPhoto(chatId, framePath, {
        caption: `Extracted frame: ${caption}`,
        reply_markup: {
          inline_keyboard: [[
            {
              text: '🧠 Analyze',
              callback_data: `analyze:${frameId}`
            }
          ]]
        }
      });

      // Cleanup video (keep frame for analysis)
      await fs.unlink(videoPath).catch(() => {});

    } catch (error: any) {
      elizaLogger.error('Error handling video:', error);
      
      let errorMessage = '❌ Error processing video:\n\n';
      
      if (error.message?.includes('too large') || error.message?.includes('20MB')) {
        errorMessage += '📹 Video is too large!\n\n' +
                       '⚠️ Telegram Bot API has a 20MB hard limit.\n\n' +
                       '💡 Solutions:\n\n' +
                       '1️⃣ COMPRESS (recommended):\n' +
                       'ffmpeg -i input.mp4 -vcodec h264 -crf 28 output.mp4\n\n' +
                       '2️⃣ TRIM to shorter clip:\n' +
                       'ffmpeg -i input.mp4 -t 30 -c copy output.mp4\n\n' +
                       '3️⃣ Record shorter video (under 1 minute)';
      } else {
        errorMessage += error.message || 'Unknown error occurred';
      }
      
      await this.bot.sendMessage(chatId, errorMessage);
    }
  }

  private async handleCallback(query: TelegramBot.CallbackQuery) {
    const chatId = query.message!.chat.id;
    const data = query.data!;

    if (data.startsWith('analyze:')) {
      const frameId = data.replace('analyze:', '');
      const framePath = this.framePathMap.get(frameId);

      if (!framePath) {
        await this.bot.answerCallbackQuery(query.id, {
          text: '❌ Frame not found. Please send the video again.',
          show_alert: true
        });
        return;
      }

      try {
        await this.bot.answerCallbackQuery(query.id, {
          text: '🔄 Starting analysis...'
        });

        const statusMsg = await this.bot.sendMessage(
          chatId,
          '🧠 Analyzing photo...\n\n' +
          'This may take 30-60 seconds...\n\n' +
          '• Extracting metadata\n' +
          '• Analyzing with Claude Vision\n' +
          '• Getting weather data\n' +
          '• Getting news data\n' +
          '• Uploading to IPFS'
        );

        // Analyze the photo
        const result = await this.analyzer.analyzePhoto(framePath);

        if (result.success) {
          await this.bot.editMessageText(
            '✅ Analysis complete!\n\n' +
            '📸 Image URL:\n' +
            `${result.data.imageAnalysis.storage.imageUrl}\n\n` +
            '📄 Analysis URL:\n' +
            `${result.data.imageAnalysis.storage.analysisUrl}\n\n` +
            '🎯 Use these URLs for your DAO proposal!',
            { chat_id: chatId, message_id: statusMsg.message_id }
          );

          // Cleanup frame
          this.framePathMap.delete(frameId);
          await fs.unlink(framePath).catch(() => {});
        } else {
          await this.bot.editMessageText(
            '❌ Analysis failed. Please try again.',
            { chat_id: chatId, message_id: statusMsg.message_id }
          );
        }
      } catch (error: any) {
        elizaLogger.error('Error analyzing photo:', error);
        await this.bot.sendMessage(
          chatId,
          `❌ Analysis failed:\n${error.message}`
        );
      }
    }
  }

  private async downloadVideo(fileId: string, chatId: number): Promise<string> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });

      const file = await this.bot.getFile(fileId);
      const fileSizeMB = (file.file_size || 0) / (1024 * 1024);
      elizaLogger.info(`File size: ${fileSizeMB.toFixed(1)}MB`);
      
      if (fileSizeMB > 20) {
        throw new Error('Video is too large for Telegram Bot API (20MB limit)');
      }
      
      const fileUrl = `https://api.telegram.org/file/bot${this.token}/${file.file_path}`;
      const response = await fetch(fileUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to download: ${response.statusText}`);
      }
      
      const buffer = Buffer.from(await response.arrayBuffer());
      const filename = `video-${chatId}-${Date.now()}.mp4`;
      const filepath = path.join(this.tempDir, filename);
      await fs.writeFile(filepath, buffer);

      elizaLogger.info('Video downloaded successfully:', filepath);
      return filepath;
    } catch (error: any) {
      elizaLogger.error('Error downloading video:', error);
      throw error;
    }
  }

  private async extractFrame(videoPath: string, description: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const outputDir = path.join(this.tempDir, `frames-${Date.now()}`);
      
      // Python script is in parent directory's video-analyst folder
      const scriptPath = path.join(__dirname, '../src/video-analyst/video-frame-extractor.py');
      
      const args = [
        scriptPath,
        '--video', videoPath,
        '--note', description,
        '--fps', '2.0',
        '--topk', '1',
        '--roi', 'none',
        '--out', outputDir
      ];

      const python = spawn('python3', args);

      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', async (code) => {
        if (code !== 0) {
          elizaLogger.error('Frame extraction failed:', stderr);
          reject(new Error(`Frame extraction failed: ${stderr}`));
          return;
        }

        try {
          const reportPath = path.join(outputDir, 'report.json');
          const reportContent = await fs.readFile(reportPath, 'utf-8');
          const report = JSON.parse(reportContent);
          
          const snapshotPath = report.best.snapshot_path;
          elizaLogger.info('Frame extracted:', snapshotPath);
          resolve(snapshotPath);
        } catch (error) {
          reject(new Error('Failed to read extraction report'));
        }
      });

      python.on('error', (error) => {
        elizaLogger.error('Failed to start Python:', error);
        reject(new Error('Failed to start frame extraction'));
      });
    });
  }

  async start() {
    elizaLogger.info('Paze Telegram Bot started');
    elizaLogger.info('Bot: @Paze2026Bot');
    elizaLogger.info('Send videos to analyze infrastructure damage');
  }

  async stop() {
    await this.bot.stopPolling();
    elizaLogger.info('Telegram bot stopped');
  }
}

// Main entry point
async function main() {
  try {
    elizaLogger.info('Checking environment variables...');
    
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!telegramToken) {
      throw new Error(
        'TELEGRAM_BOT_TOKEN not found in environment variables.\n' +
        'Get a token from @BotFather on Telegram and add it to .env:\n' +
        'TELEGRAM_BOT_TOKEN=your_token_here'
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not found in environment variables');
    }

    if (!process.env.PINATA_JWT && (!process.env.PINATA_API_KEY || !process.env.PINATA_API_SECRET)) {
      throw new Error('Pinata credentials not found in environment variables');
    }

    elizaLogger.info('Starting Paze Telegram Bot...');
    elizaLogger.info('Telegram token:', telegramToken.substring(0, 10) + '...');

    const bot = new PazeTelegramBot(telegramToken);
    await bot.start();

    elizaLogger.info('✅ Paze Telegram Bot is running!');

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      elizaLogger.info('Shutting down...');
      await bot.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      elizaLogger.info('Shutting down...');
      await bot.stop();
      process.exit(0);
    });

  } catch (error: any) {
    elizaLogger.error('Failed to start Telegram bot:', error);
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

main().catch((error) => {
  elizaLogger.error('Unhandled error in main:', error);
  console.error('\n❌ Fatal error:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
});
