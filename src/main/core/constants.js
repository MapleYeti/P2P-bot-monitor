/**
 * Application constants and configuration
 */

// File watching configuration
export const FILE_WATCH_CONFIG = {
  POLLING_INTERVAL: 1000,
  IGNORED_EXTENSIONS: [".log"],
  IGNORED_PATTERNS: ["*.tmp", "*.bak", "*.old"],
};

// Log parsing patterns
export const LOG_PATTERNS = {
  CHAT: /\[INFO\] CHAT: (.+)/,
  RESPONSE: /\[INFO\] SLOWLY TYPING RESPONSE: (.+)/,
  LEVEL_UP: /you've just advanced your (.+?) level\. You are now level (\d+)/i,
  QUEST: /completed a quest: <col=.+?>(.+?)<\/col>/i,
  BREAK: /\[(?:SCRIPT|INFO)\] Break length (\d+)/,
  BREAK_OVER: /\[(?:SCRIPT|INFO)\] Break over/,
  DEATH: /Oh dear, you are dead!/,
  VALUABLE_DROP:
    /\[INFO\] \[GAME\] <col=.+?>Valuable drop: (.+?) \((\d+(?:,\d+)*) coins\)<\/col>/,
};

// Discord message formatting
export const MESSAGE_FORMATS = {
  CHAT_DETECTED: "💬 **Chat Detected:** {chat}\n**Bot:** {bot}\n**Status:**",
  BOT_RESPONSE:
    "🤖 **Bot:** {bot}\n📩 **Chat:** {chat}\n💬 **Response:** {response}",
  LEVEL_UP: "📈{skillEmoji} **{skill}** has leveled up to **{level}**",
  QUEST_COMPLETE: "🏆 **Quest Complete!**\n**Bot:** {bot}\n**Quest:** {quest}",
  BREAK_START:
    "💤 **Bot Break Started!**\n**Bot:** {bot}\n**Break Duration:** {duration}",
  BREAK_OVER: "⏰ **Bot Break Finished!**\n**Bot:** {bot}",
  DEATH: "💀 **Bot Died!**\n**Bot:** {bot}",
  VALUABLE_DROP:
    "💰 **Valuable Drop!**\n**Bot:** {bot}\n**Item:** {item}\n**Value:** {coins} coins",
};

// Error messages
export const ERROR_MESSAGES = {
  CONFIG_VALIDATION_FAILED:
    "Configuration validation failed. Please check your config.js file.",
  NO_WEBHOOK_FOUND: "No webhook URL found for bot: {botName}",
  FILE_PROCESSING_ERROR: "Error processing log file {filePath}: {error}",
  WEBHOOK_FAILED: "Webhook failed for {context}: {error}",
};

// Success messages
export const SUCCESS_MESSAGES = {
  WEBHOOK_SENT: "Webhook sent for {context}",
  FILE_PROCESSED: "File processed successfully: {filePath}",
  MONITOR_STARTED: "Bot monitor started successfully",
};

// Log levels
export const LOG_LEVELS = {
  INFO: "INFO",
  WARN: "WARN",
  ERROR: "ERROR",
  SUCCESS: "SUCCESS",
  DEBUG: "DEBUG",
};

// Application states
export const APP_STATES = {
  STARTING: "STARTING",
  RUNNING: "RUNNING",
  STOPPING: "STOPPING",
  ERROR: "ERROR",
};

// File operations
export const FILE_OPERATIONS = {
  ADD: "add",
  CHANGE: "change",
  UNLINK: "unlink",
  ERROR: "error",
  READY: "ready",
};

// Webhook status
export const WEBHOOK_STATUS = {
  SUCCESS: "success",
  ERROR: "error",
  PENDING: "pending",
};
