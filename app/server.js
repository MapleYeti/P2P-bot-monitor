import chokidar from 'chokidar';
import path from 'path';
import fs from 'fs';
import readline from 'readline';
import axios from 'axios';

import { getBotWebhookUrl } from './utils/webhookUtils.js';
import { getLevelUpMessage } from './utils/levelUpUtils.js';
import { getQuestMessage } from './utils/questUtils.js';

import config from './config.js';

const BASE_LOG_DIR = config.BASE_LOG_DIR;
const BOT_CHAT_WEBHOOK_URL = config.BOT_CHAT_WEBHOOK_URL;

const fileOffsets = new Map();

// Store last chat message per file
const lastChatMessages = new Map();

async function processLogFile(filePath) {
  const previousSize = fileOffsets.get(filePath) || 0;
  const currentSize = fs.statSync(filePath).size;
  if (currentSize <= previousSize) return;

  const stream = fs.createReadStream(filePath, {
    start: previousSize,
    end: currentSize,
  });

  const rl = readline.createInterface({ input: stream });
  const botName = path.basename(path.dirname(filePath));
  const botWebhookUrl = getBotWebhookUrl(botName);

  for await (const line of rl) {
    const chatMatch = line.match(/\[INFO\] CHAT: (.+)/);
    const responseMatch = line.match(/\[INFO\] SLOWLY TYPING RESPONSE: (.+)/);
    const levelUpMatch = line.match(/you've just advanced your (.+?) level\. You are now level (\d+)/i);
    const questMatch = line.match(/completed a quest: <col=.+?>(.+?)<\/col>/i);

    if (chatMatch && !responseMatch) {
      const chatMessage = chatMatch[1].trim();
      lastChatMessages.set(filePath, chatMessage);
      console.log(`💬 [Chat] ${chatMessage}`);
      try {
        await axios.post(BOT_CHAT_WEBHOOK_URL, {
          content: `💬 **Chat Detected:** ${chatMessage}\n **Bot:** ${botName}\n No Response given`,
        });
        console.log('✅ Webhook sent for chat + no response');
      } catch (err) {
        console.error('❌ Webhook failed:', err.message);
      }
    }

    if (responseMatch) {
      const responseMessage = responseMatch[1].trim();
      const chatMessage = lastChatMessages.get(filePath) || "(No chat message found)";

      try {
        await axios.post(BOT_CHAT_WEBHOOK_URL, {
          content: `🤖 **Bot:** ${botName}\n📩 **Chat:** ${chatMessage}\n💬 **Response:** ${responseMessage}}`,
        });
        console.log('✅ Webhook sent for chat + response');
      } catch (err) {
        console.error('❌ Webhook failed:', err.message);
      }
    }

    if (levelUpMatch) {
      const skill = levelUpMatch[1];
      const level = levelUpMatch[2];


      const levelUpMessage = getLevelUpMessage(skill, level);
      try {
        await axios.post(botWebhookUrl, {
          content: levelUpMessage,
        });
        console.log(`✅ Webhook sent for level up: ${skill} → ${level}`);
      } catch (err) {
        console.error('❌ Webhook failed:', err.message);
      }
    }

    if (questMatch) {
      const quest = questMatch[1];
      const questMessage = getQuestMessage(quest, botName);
      try {
        await axios.post(botWebhookUrl, {
          content: questMessage,
        });
        console.log(`✅ Webhook sent for quest: ${quest}`);
      } catch (err) {
        console.error('❌ Webhook failed:', err.message);
      }
    }
  }
  fileOffsets.set(filePath, currentSize);
}

console.log('👀 Watching:', BASE_LOG_DIR);

const watcher = chokidar.watch(BASE_LOG_DIR, {
  persistent: true,
  usePolling: true,
  interval: 1000,
  ignoreInitial: false,
  ignored: (filePath) => {
    // Ignore everything except .log files and directories
    try {
      return !filePath.endsWith('.log') && !fs.statSync(filePath).isDirectory();
    } catch {
      return false; // In case file is deleted during check
    }
  },
});

watcher
  .on('add', (filePath) => {
    console.log(`📄 [add] New log file detected: ${filePath}`);
    fileOffsets.set(filePath, fs.statSync(filePath).size);
  })
  .on('change', (filePath) => {
    console.log(`🔄 [change] File changed: ${filePath}`);
    processLogFile(filePath);
  })
  .on('error', (error) => {
    console.error('❌ Watcher error:', error);
  })
  .on('ready', () => {
    console.log('✅ Initial scan complete. Watching for changes...');
  });
