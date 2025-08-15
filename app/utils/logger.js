/**
 * Centralized logging utility for the bot monitor
 */

const LOG_LEVELS = {
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR',
    SUCCESS: 'SUCCESS'
};

const EMOJIS = {
    [LOG_LEVELS.INFO]: 'ℹ️',
    [LOG_LEVELS.WARN]: '⚠️',
    [LOG_LEVELS.ERROR]: '❌',
    [LOG_LEVELS.SUCCESS]: '✅'
};

/**
 * Format timestamp for logging
 * @returns {string} Formatted timestamp
 */
function getTimestamp() {
    return new Date().toISOString();
}

/**
 * Log a message with consistent formatting
 * @param {string} level - Log level
 * @param {string} message - Message to log
 * @param {string} context - Optional context
 */
function log(level, message, context = '') {
    const timestamp = getTimestamp();
    const emoji = EMOJIS[level] || '📝';
    const contextStr = context ? ` [${context}]` : '';

    console.log(`${emoji} ${timestamp} ${level}${contextStr}: ${message}`);
}

/**
 * Log info message
 * @param {string} message - Message to log
 * @param {string} context - Optional context
 */
export function info(message, context = '') {
    log(LOG_LEVELS.INFO, message, context);
}

/**
 * Log warning message
 * @param {string} message - Message to log
 * @param {string} context - Optional context
 */
export function warn(message, context = '') {
    log(LOG_LEVELS.WARN, message, context);
}

/**
 * Log error message
 * @param {string} message - Message to log
 * @param {string} context - Optional context
 */
export function error(message, context = '') {
    log(LOG_LEVELS.ERROR, message, context);
}

/**
 * Log success message
 * @param {string} message - Message to log
 * @param {string} context - Optional context
 */
export function success(message, context = '') {
    log(LOG_LEVELS.SUCCESS, message, context);
}

/**
 * Log chat message
 * @param {string} message - Chat message
 * @param {string} botName - Bot name
 */
export function chat(message, botName = '') {
    const context = botName ? `Chat [${botName}]` : 'Chat';
    console.log(`💬 ${getTimestamp()} ${context}: ${message}`);
}

/**
 * Log webhook status
 * @param {string} status - Success or failure
 * @param {string} context - What the webhook was for
 */
export function webhook(status, context) {
    if (status === 'success') {
        success(`Webhook sent for ${context}`);
    } else {
        error(`Webhook failed for ${context}`);
    }
}
