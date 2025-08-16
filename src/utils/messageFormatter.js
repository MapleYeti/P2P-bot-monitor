import { MESSAGE_FORMATS } from "./constants.js";
import { getSkillIcon } from "./skillUtils.js";
import { getFormattedBreakDuration } from "./breakUtils.js";

/**
 * Format a message using a template and variables
 * @param {string} template - Message template with placeholders
 * @param {Object} variables - Variables to substitute
 * @returns {string} - Formatted message
 */
function formatMessage(template, variables) {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return variables[key] || match;
  });
}

/**
 * Format chat detected message
 * @param {string} chatMessage - The chat message
 * @param {string} botName - The bot name
 * @returns {string} - Formatted message
 */
export function formatChatDetectedMessage(chatMessage, botName) {
  return formatMessage(MESSAGE_FORMATS.CHAT_DETECTED, {
    chat: chatMessage,
    bot: botName,
  });
}

/**
 * Format bot response message
 * @param {string} chatMessage - The original chat message
 * @param {string} responseMessage - The bot's response
 * @param {string} botName - The bot name
 * @returns {string} - Formatted message
 */
export function formatBotResponseMessage(
  chatMessage,
  responseMessage,
  botName
) {
  return formatMessage(MESSAGE_FORMATS.BOT_RESPONSE, {
    chat: chatMessage,
    response: responseMessage,
    bot: botName,
  });
}

/**
 * Format level up message
 * @param {string} skill - The skill that leveled up
 * @param {string} level - The new level
 * @param {string} botName - The bot name
 * @returns {string} - Formatted message
 */
export function formatLevelUpMessage(skill, level, botName) {
  const skillEmoji = getSkillIcon(skill);
  return formatMessage(MESSAGE_FORMATS.LEVEL_UP, {
    skillEmoji,
    skill,
    level,
    bot: botName,
  });
}

/**
 * Format quest completion message
 * @param {string} quest - The completed quest name
 * @param {string} botName - The bot name
 * @returns {string} - Formatted message
 */
export function formatQuestCompleteMessage(quest, botName) {
  return formatMessage(MESSAGE_FORMATS.QUEST_COMPLETE, {
    quest,
    bot: botName,
  });
}

/**
 * Format break start message
 * @param {string} breakLength - Break length in milliseconds
 * @param {string} botName - The bot name
 * @returns {string} - Formatted message
 */
export function formatBreakStartMessage(breakLength, botName) {
  const duration = getFormattedBreakDuration(breakLength);
  return formatMessage(MESSAGE_FORMATS.BREAK_START, {
    duration,
    bot: botName,
  });
}

/**
 * Format break over message
 * @param {string} botName - The bot name
 * @returns {string} - Formatted message
 */
export function formatBreakOverMessage(botName) {
  return formatMessage(MESSAGE_FORMATS.BREAK_OVER, {
    bot: botName,
  });
}

/**
 * Format death message
 * @param {string} botName - The bot name
 * @returns {string} - Formatted message
 */
export function formatDeathMessage(botName) {
  return formatMessage(MESSAGE_FORMATS.DEATH, {
    bot: botName,
  });
}

/**
 * Format valuable drop message
 * @param {string} itemName - The item name
 * @param {string} coinValue - The coin value
 * @param {string} botName - The bot name
 * @returns {string} - Formatted message
 */
export function formatValuableDropMessage(itemName, coinValue, botName) {
  return formatMessage(MESSAGE_FORMATS.VALUABLE_DROP, {
    item: itemName,
    coins: coinValue,
    bot: botName,
  });
}

/**
 * Sanitize message content for Discord
 * @param {string} content - Raw message content
 * @returns {string} - Sanitized content
 */
export function sanitizeDiscordMessage(content) {
  return content
    .replace(/\\/g, "\\\\") // Escape backslashes
    .replace(/`/g, "\\`") // Escape code blocks
    .replace(/\*/g, "\\*") // Escape bold/italic
    .replace(/_/g, "\\_") // Escape underline
    .replace(/~/g, "\\~") // Escape strikethrough
    .replace(/>/g, "\\>") // Escape blockquotes
    .replace(/\|/g, "\\|"); // Escape spoilers
}
