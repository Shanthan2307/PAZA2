const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const token = process.env.TELEGRAM_BOT_TOKEN;

console.log('Token:', token ? token.substring(0, 10) + '...' : 'NOT FOUND');

if (!token) {
  console.error('TELEGRAM_BOT_TOKEN not found');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

bot.on('error', (error) => {
  console.error('Bot error:', error);
});

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Bot is working!');
});

console.log('Bot started successfully!');
