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
 * Send webhook message with error handling
 * @param {Object} payload - The message payload
 * @param {function} emitLogEvent - The function to emit the log event
 * @param {string} level - The level of the log event
 * @returns {Promise<boolean>} - Success status
 */
async function sendLogEvent(payload, emitLogEvent, level = "info") {
  // log event to renderer
  console.log(`🔍 Sending log event: ${payload}`);
  if (emitLogEvent) {
    emitLogEvent({
      type: "log-entry",
      timestamp: new Date().toISOString(),
      content: payload.content,
      level: level,
    });
  }
}

/**
 * Send webhook message with error handling
 * @param {string} webhookUrl - The webhook URL to send to
 * @param {function} emitLogEvent - The function to emit the log event
 * @param {Object} payload - The message payload
 * @param {string} context - Context for logging
 * @returns {Promise<boolean>} - Success status
 */
async function handleMatchEvent(webhookUrl, payload, context, emitLogEvent) {
  await sendWebhook(webhookUrl, payload, context, emitLogEvent);
  await sendLogEvent(payload, emitLogEvent, "success");
}

/**
 * Process chat message without response
 * @param {string} chatMessage - The chat message
 * @param {string} botName - The bot name
 * @param {Function} emitLogEvent - Function to emit log events to renderer (optional)
 */
async function processChatMessage(chatMessage, botName, emitLogEvent) {
  const content = formatChatDetectedMessage(chatMessage, botName);
  const payload = { content };

  // Send webhook if configured
  if (getGlobalConfig().BOT_CHAT_WEBHOOK_URL) {
    await handleMatchEvent(
      getGlobalConfig().BOT_CHAT_WEBHOOK_URL,
      payload,
      "chat + no response",
      emitLogEvent
    );
  }
}

/**
 * Process bot response to chat
 * @param {string} responseMessage - The bot's response
 * @param {string} chatMessage - The original chat message
 * @param {string} botName - The bot name
 * @param {Function} emitLogEvent - Function to emit log events to renderer (optional)
 */
async function processBotResponse(
  responseMessage,
  chatMessage,
  botName,
  emitLogEvent
) {
  const content = formatBotResponseMessage(
    chatMessage,
    responseMessage,
    botName
  );
  const payload = { content };

  await handleMatchEvent(
    getGlobalConfig().BOT_CHAT_WEBHOOK_URL,
    payload,
    "chat + response",
    emitLogEvent
  );
}

/**
 * Process level up event
 * @param {string} skill - The skill that leveled up
 * @param {string} level - The new level
 * @param {string} botName - The bot name
 * @param {string} botWebhookUrl - The bot's specific webhook URL
 * @param {Function} emitLogEvent - Function to emit log events to renderer (optional)
 */
async function processLevelUp(
  skill,
  level,
  botName,
  botWebhookUrl,
  emitLogEvent
) {
  if (!botWebhookUrl) {
    console.warn(
      `No webhook configured for bot: ${botName}. Skipping level up notification.`
    );
    return;
  }

  const levelUpMessage = formatLevelUpMessage(skill, level, botName);
  await handleMatchEvent(
    botWebhookUrl,
    { content: levelUpMessage },
    `level up: ${skill} → ${level}`,
    emitLogEvent
  );
}

/**
 * Process quest completion
 * @param {string} quest - The completed quest name
 * @param {string} botName - The bot name
 * @param {string} botWebhookUrl - The bot's specific webhook URL
 * @param {Function} emitLogEvent - Function to emit log events to renderer (optional)
 */
async function processQuestCompletion(
  quest,
  botName,
  botWebhookUrl,
  emitLogEvent
) {
  if (!botWebhookUrl) {
    console.warn(
      `No webhook configured for bot: ${botName}. Skipping quest completion notification.`
    );
    return;
  }

  const questMessage = formatQuestCompleteMessage(quest, botName);
  await handleMatchEvent(
    botWebhookUrl,
    { content: questMessage },
    `quest: ${quest}`,
    emitLogEvent
  );
}

/**
 * Process break start event
 * @param {string} breakLength - Break length in milliseconds
 * @param {string} botName - The bot name
 * @param {string} botWebhookUrl - The bot's specific webhook URL
 * @param {Function} emitLogEvent - Function to emit log events to renderer (optional)
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
    return;
  }

  const breakMessage = formatBreakStartMessage(breakLength, botName);
  await handleMatchEvent(
    botWebhookUrl,
    { content: breakMessage },
    `break start: ${breakLength}ms`,
    emitLogEvent
  );
}

/**
 * Process break over event
 * @param {string} botName - The bot name
 * @param {string} botWebhookUrl - The bot's specific webhook URL
 * @param {Function} emitLogEvent - Function to emit log events to renderer (optional)
 */
async function processBreakOver(botName, botWebhookUrl, emitLogEvent) {
  if (!botWebhookUrl) {
    console.warn(
      `No webhook configured for bot: ${botName}. Skipping break over notification.`
    );
    return;
  }

  const breakOverMessage = formatBreakOverMessage(botName);
  await handleMatchEvent(
    botWebhookUrl,
    { content: breakOverMessage },
    "break over",
    emitLogEvent
  );
}

/**
 * Process death event
 * @param {string} botName - The bot name
 * @param {string} botWebhookUrl - The bot's specific webhook URL
 * @param {Function} emitLogEvent - Function to emit log events to renderer (optional)
 */
async function processDeath(botName, botWebhookUrl, emitLogEvent) {
  if (!botWebhookUrl) {
    console.warn(
      `No webhook configured for bot: ${botName}. Skipping death notification.`
    );
    return;
  }

  const deathMessage = formatDeathMessage(botName);
  await handleMatchEvent(
    botWebhookUrl,
    { content: deathMessage },
    "death",
    emitLogEvent
  );
}

/**
 * Process valuable drop event
 * @param {string} itemName - The name of the valuable item dropped
 * @param {string} coinValue - The coin value of the item
 * @param {string} botName - The bot name
 * @param {string} botWebhookUrl - The bot's specific webhook URL
 * @param {Function} emitLogEvent - Function to emit log events to renderer (optional)
 */
async function processValuableDrop(
  itemName,
  coinValue,
  botName,
  botWebhookUrl,
  emitLogEvent
) {
  if (!botWebhookUrl) {
    console.warn(
      `No webhook configured for bot: ${botName}. Skipping valuable drop notification.`
    );
    return;
  }

  const dropMessage = formatValuableDropMessage(itemName, coinValue, botName);
  await handleMatchEvent(
    botWebhookUrl,
    { content: dropMessage },
    `valuable drop: ${itemName} (${coinValue} coins)`,
    emitLogEvent
  );
}

/**
 * Process a single log line and extract relevant information
 * @param {string} line - The log line to process
 * @param {string} filePath - The file path for context
 * @param {string} botName - The bot name
 * @param {string} botWebhookUrl - The bot's specific webhook URL
 * @param {Function} emitLogEvent - Function to emit log events to renderer (optional)
 */
async function processLogLine(
  line,
  filePath,
  botName,
  botWebhookUrl,
  emitLogEvent
) {
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
    await processChatMessage(chatMessage, botName, emitLogEvent);
    return;
  }

  // Check for bot response
  const responseMatch = line.match(LOG_PATTERNS.RESPONSE);
  if (responseMatch) {
    const responseMessage = responseMatch[1].trim();
    const chatMessage =
      lastChatMessages.get(filePath) || "(No chat message found)";
    await processBotResponse(
      responseMessage,
      chatMessage,
      botName,
      emitLogEvent
    );
    return;
  }

  // Check for level up
  const levelUpMatch = line.match(LOG_PATTERNS.LEVEL_UP);
  if (levelUpMatch) {
    const [, skill, level] = levelUpMatch;
    await processLevelUp(skill, level, botName, botWebhookUrl, emitLogEvent);
    return;
  }

  // Check for quest completion
  const questMatch = line.match(LOG_PATTERNS.QUEST);
  if (questMatch) {
    const quest = questMatch[1];
    await processQuestCompletion(quest, botName, botWebhookUrl, emitLogEvent);
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
    await processBreakStart(breakLength, botName, botWebhookUrl, emitLogEvent);
    return;
  } else {
    console.log(
      `❌ Break pattern not matched. Pattern: ${LOG_PATTERNS.BREAK}, Line: "${line}"`
    );
  }

  // Check for break over
  const breakOverMatch = line.match(LOG_PATTERNS.BREAK_OVER);
  if (breakOverMatch) {
    await processBreakOver(botName, botWebhookUrl, emitLogEvent);
    return;
  }

  // Check for death
  const deathMatch = line.match(LOG_PATTERNS.DEATH);
  if (deathMatch) {
    await processDeath(botName, botWebhookUrl, emitLogEvent);
    return;
  }

  // Check for valuable drop
  const valuableDropMatch = line.match(LOG_PATTERNS.VALUABLE_DROP);
  if (valuableDropMatch) {
    const itemName = valuableDropMatch[1];
    const coinValue = valuableDropMatch[2]; // Assuming coin value is the second part of the match
    await processValuableDrop(
      itemName,
      coinValue,
      botName,
      botWebhookUrl,
      emitLogEvent
    );
    return;
  }
}

/**
 * Process a log file and extract relevant information
 * @param {string} filePath - Path to the log file
 * @param {Map} fileOffsets - Map of file offsets for tracking changes
 * @param {Function} emitLogEvent - Function to emit log events to renderer (optional)
 */
export async function processLogFile(filePath, fileOffsets, emitLogEvent) {
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
      await processLogLine(
        line,
        filePath,
        botName,
        botWebhookUrl,
        emitLogEvent
      );
    }

    console.log(`✅ Processed ${lineCount} lines from ${filePath}`);
    fileOffsets.set(filePath, currentSize);
  } catch (err) {
    error(`Error processing log file ${filePath}: ${err.message}`, "Monitor");
    throw err; // Re-throw to let caller handle it
  }
}
