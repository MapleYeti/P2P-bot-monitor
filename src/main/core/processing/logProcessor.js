import path from "path";
import fs from "fs";
import readline from "readline";
import axios from "axios";

import { getBotWebhookUrl } from "../logging/webhookManager.js";
import { chat, webhook, error } from "../logging/logger.js";
import {
  formatChatDetectedMessage,
  formatBotResponseMessage,
  formatBreakStartMessage,
  formatLevelUpMessage,
  formatQuestCompleteMessage,
  formatBreakOverMessage,
  formatDeathMessage,
  formatValuableDropMessage,
} from "./messageFormatter.js";
import { LOG_PATTERNS } from "../constants.js";
import { getGlobalConfig } from "../globalConfigManager.js";

// Store last chat message per file
const lastChatMessages = new Map();

/**
 * Send webhook message with error handling
 * @param {string} webhookUrl - The webhook URL to send to
 * @param {Object} payload - The message payload
 * @param {string} context - Context for logging
 * @returns {Promise<boolean>} - Success status
 */
async function sendWebhook(webhookUrl, payload, context) {
  console.log(`🚀 Sending webhook to: ${webhookUrl}`);
  console.log(`📦 Payload:`, payload);
  console.log(`🏷️ Context: ${context}`);

  try {
    const response = await axios.post(webhookUrl, payload);
    console.log(`✅ Webhook sent successfully. Status: ${response.status}`);
    webhook("success", context);
    return true;
  } catch (err) {
    console.error(`❌ Webhook failed:`, err.message);
    if (err.response) {
      console.error(`📊 Response status: ${err.response.status}`);
      console.error(`📄 Response data:`, err.response.data);
    }
    webhook("error", err);
    return false;
  }
}

/**
 * Process chat message without response
 * @param {string} chatMessage - The chat message
 * @param {string} botName - The bot name
 */
async function processChatMessage(chatMessage, botName) {
  const content = formatChatDetectedMessage(chatMessage, botName);
  const payload = { content };

  await sendWebhook(
    getGlobalConfig().BOT_CHAT_WEBHOOK_URL,
    payload,
    "chat + no response"
  );
}

/**
 * Process bot response to chat
 * @param {string} responseMessage - The bot's response
 * @param {string} chatMessage - The original chat message
 * @param {string} botName - The bot name
 */
async function processBotResponse(responseMessage, chatMessage, botName) {
  const content = formatBotResponseMessage(
    chatMessage,
    responseMessage,
    botName
  );
  const payload = { content };

  await sendWebhook(
    getGlobalConfig().BOT_CHAT_WEBHOOK_URL,
    payload,
    "chat + response"
  );
}

/**
 * Process level up event
 * @param {string} skill - The skill that leveled up
 * @param {string} level - The new level
 * @param {string} botName - The bot name
 * @param {string} botWebhookUrl - The bot's specific webhook URL
 */
async function processLevelUp(skill, level, botName, botWebhookUrl) {
  if (!botWebhookUrl) {
    console.warn(
      `No webhook configured for bot: ${botName}. Skipping level up notification.`
    );
    return;
  }

  const levelUpMessage = formatLevelUpMessage(skill, level, botName);
  await sendWebhook(
    botWebhookUrl,
    { content: levelUpMessage },
    `level up: ${skill} → ${level}`
  );
}

/**
 * Process quest completion
 * @param {string} quest - The completed quest name
 * @param {string} botName - The bot name
 * @param {string} botWebhookUrl - The bot's specific webhook URL
 */
async function processQuestCompletion(quest, botName, botWebhookUrl) {
  if (!botWebhookUrl) {
    console.warn(
      `No webhook configured for bot: ${botName}. Skipping quest completion notification.`
    );
    return;
  }

  const questMessage = formatQuestCompleteMessage(quest, botName);
  await sendWebhook(
    botWebhookUrl,
    { content: questMessage },
    `quest: ${quest}`
  );
}

/**
 * Process break start event
 * @param {string} breakLength - Break length in milliseconds
 * @param {string} botName - The bot name
 * @param {string} botWebhookUrl - The bot's specific webhook URL
 * @param {Function} emitLogEvent - Function to emit log events to renderer
 */
async function processBreakStart(
  breakLength,
  botName,
  botWebhookUrl,
  emitLogEvent
) {
  if (!botWebhookUrl) {
    console.warn(
      `No webhook configured for bot: ${botName}. Skipping break start notification.`
    );
    // Still emit to log display even if webhook fails
    if (emitLogEvent) {
      emitLogEvent({
        type: "break-start",
        botName,
        breakLength,
        timestamp: new Date().toISOString(),
        message: `💤 Bot break started for ${botName} (${breakLength}ms)`,
        level: "warning",
      });
    }
    return;
  }

  const breakMessage = formatBreakStartMessage(breakLength, botName);
  await sendWebhook(
    botWebhookUrl,
    { content: breakMessage },
    `break start: ${breakLength}ms`
  );

  // Emit to log display
  if (emitLogEvent) {
    emitLogEvent({
      type: "break-start",
      botName,
      breakLength,
      timestamp: new Date().toISOString(),
      message: `💤 Bot break started for ${botName} (${breakLength}ms)`,
      level: "success",
    });
  }
}

/**
 * Process break over event
 * @param {string} botName - The bot name
 * @param {string} botWebhookUrl - The bot's specific webhook URL
 */
async function processBreakOver(botName, botWebhookUrl) {
  if (!botWebhookUrl) {
    console.warn(
      `No webhook configured for bot: ${botName}. Skipping break over notification.`
    );
    return;
  }

  const breakOverMessage = formatBreakOverMessage(botName);
  await sendWebhook(botWebhookUrl, { content: breakOverMessage }, "break over");
}

/**
 * Process death event
 * @param {string} botName - The bot name
 * @param {string} botWebhookUrl - The bot's specific webhook URL
 */
async function processDeath(botName, botWebhookUrl) {
  if (!botWebhookUrl) {
    console.warn(
      `No webhook configured for bot: ${botName}. Skipping death notification.`
    );
    return;
  }

  const deathMessage = formatDeathMessage(botName);
  await sendWebhook(botWebhookUrl, { content: deathMessage }, "death");
}

/**
 * Process valuable drop event
 * @param {string} itemName - The name of the valuable item dropped
 * @param {string} coinValue - The coin value of the item
 * @param {string} botName - The bot name
 * @param {string} botWebhookUrl - The bot's specific webhook URL
 */
async function processValuableDrop(
  itemName,
  coinValue,
  botName,
  botWebhookUrl
) {
  if (!botWebhookUrl) {
    console.warn(
      `No webhook configured for bot: ${botName}. Skipping valuable drop notification.`
    );
    return;
  }

  const dropMessage = formatValuableDropMessage(itemName, coinValue, botName);
  await sendWebhook(
    botWebhookUrl,
    { content: dropMessage },
    `valuable drop: ${itemName} (${coinValue} coins)`
  );
}

/**
 * Process a single log line and extract relevant information
 * @param {string} line - The log line to process
 * @param {string} filePath - The file path for context
 * @param {string} botName - The bot name
 * @param {string} botWebhookUrl - The bot's specific webhook URL
 */
async function processLogLine(line, filePath, botName, botWebhookUrl) {
  console.log(
    `🔍 Checking patterns for line: "${line.substring(0, 80)}${
      line.length > 80 ? "..." : ""
    }"`
  );
  console.log(`🔍 Full line: "${line}"`);
  console.log(`🔍 Break pattern: ${LOG_PATTERNS.BREAK}`);

  // Check for chat message
  const chatMatch = line.match(LOG_PATTERNS.CHAT);
  if (chatMatch) {
    console.log(`💬 Chat message detected: ${chatMatch[1].trim()}`);
    const chatMessage = chatMatch[1].trim();
    lastChatMessages.set(filePath, chatMessage);
    chat(chatMessage, botName);
    await processChatMessage(chatMessage, botName);
    return;
  }

  // Check for bot response
  const responseMatch = line.match(LOG_PATTERNS.RESPONSE);
  if (responseMatch) {
    const responseMessage = responseMatch[1].trim();
    const chatMessage =
      lastChatMessages.get(filePath) || "(No chat message found)";
    await processBotResponse(responseMessage, chatMessage, botName);
    return;
  }

  // Check for level up
  const levelUpMatch = line.match(LOG_PATTERNS.LEVEL_UP);
  if (levelUpMatch) {
    const [, skill, level] = levelUpMatch;
    await processLevelUp(skill, level, botName, botWebhookUrl);
    return;
  }

  // Check for quest completion
  const questMatch = line.match(LOG_PATTERNS.QUEST);
  if (questMatch) {
    const quest = questMatch[1];
    await processQuestCompletion(quest, botName, botWebhookUrl);
    return;
  }

  // Check for break start
  const breakMatch = line.match(LOG_PATTERNS.BREAK);
  if (breakMatch) {
    const breakLength = breakMatch[1];
    console.log(
      `Break length detected: ${breakLength}ms for bot: ${botName}, webhook: ${
        botWebhookUrl ? "configured" : "not configured"
      }`
    );
    await processBreakStart(breakLength, botName, botWebhookUrl);
    return;
  } else {
    console.log(
      `❌ Break pattern not matched. Pattern: ${LOG_PATTERNS.BREAK}, Line: "${line}"`
    );
  }

  // Check for break over
  const breakOverMatch = line.match(LOG_PATTERNS.BREAK_OVER);
  if (breakOverMatch) {
    await processBreakOver(botName, botWebhookUrl);
    return;
  }

  // Check for death
  const deathMatch = line.match(LOG_PATTERNS.DEATH);
  if (deathMatch) {
    await processDeath(botName, botWebhookUrl);
    return;
  }

  // Check for valuable drop
  const valuableDropMatch = line.match(LOG_PATTERNS.VALUABLE_DROP);
  if (valuableDropMatch) {
    const itemName = valuableDropMatch[1];
    const coinValue = valuableDropMatch[2]; // Assuming coin value is the second part of the match
    await processValuableDrop(itemName, coinValue, botName, botWebhookUrl);
    return;
  }
}

/**
 * Process a log file and extract relevant information
 * @param {string} filePath - Path to the log file
 * @param {Map} fileOffsets - Map of file offsets for tracking changes
 */
export async function processLogFile(filePath, fileOffsets) {
  try {
    const previousSize = fileOffsets.get(filePath) || 0;
    const currentSize = fs.statSync(filePath).size;

    if (currentSize <= previousSize) return;

    console.log(`🔍 Processing log file: ${filePath}`);
    console.log(`📊 File size: ${previousSize} → ${currentSize} bytes`);
    console.log(
      `📁 Bot name extracted: ${path.basename(path.dirname(filePath))}`
    );
    console.log(
      `⚙️ Config webhooks:`,
      Object.keys(getGlobalConfig().BOT_NAMES_WITH_DISCORD_WEBHOOKS || {})
    );

    const stream = fs.createReadStream(filePath, {
      start: previousSize,
      end: currentSize,
    });

    const rl = readline.createInterface({ input: stream });
    const botName = path.basename(path.dirname(filePath));
    const botWebhookUrl = getBotWebhookUrl(botName, getGlobalConfig());

    console.log(
      `🔗 Bot webhook URL: ${botWebhookUrl ? "Configured" : "Not configured"}`
    );

    let lineCount = 0;
    for await (const line of rl) {
      lineCount++;
      console.log(
        `📝 Processing line ${lineCount}: ${line.substring(0, 100)}${
          line.length > 100 ? "..." : ""
        }`
      );
      await processLogLine(line, filePath, botName, botWebhookUrl);
    }

    console.log(`✅ Processed ${lineCount} lines from ${filePath}`);
    fileOffsets.set(filePath, currentSize);
  } catch (err) {
    error(`Error processing log file ${filePath}: ${err.message}`, "Monitor");
    throw err; // Re-throw to let caller handle it
  }
}
