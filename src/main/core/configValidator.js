import { error, warn } from '../app/utils/logger.js';

/**
 * Validate configuration before application startup
 * @param {Object} config - Configuration object to validate
 * @returns {boolean} - Whether configuration is valid
 */
export function validateConfig(config) {
    const errors = [];
    const warnings = [];

    // Check required fields
    if (!config.BASE_LOG_DIR) {
        errors.push('BASE_LOG_DIR is required');
    } else if (!config.BASE_LOG_DIR.trim()) {
        errors.push('BASE_LOG_DIR cannot be empty');
    }

    if (!config.BOT_CHAT_WEBHOOK_URL) {
        errors.push('BOT_CHAT_WEBHOOK_URL is required');
    } else if (!isValidWebhookUrl(config.BOT_CHAT_WEBHOOK_URL)) {
        errors.push('BOT_CHAT_WEBHOOK_URL must be a valid Discord webhook URL');
    }

    // Check bot webhooks
    if (!config.BOT_NAMES_WITH_DISCORD_WEBHOOKS ||
        Object.keys(config.BOT_NAMES_WITH_DISCORD_WEBHOOKS).length === 0) {
        warnings.push('No bot webhooks configured - level up and quest notifications will not work');
    } else {
        // Validate each bot webhook
        for (const [botName, webhookUrl] of Object.entries(config.BOT_NAMES_WITH_DISCORD_WEBHOOKS)) {
            if (!webhookUrl || !webhookUrl.trim()) {
                errors.push(`Webhook URL for bot "${botName}" is empty`);
            } else if (!isValidWebhookUrl(webhookUrl)) {
                errors.push(`Invalid webhook URL for bot "${botName}"`);
            }
        }
    }

    // Log warnings
    warnings.forEach(warning => warn(warning, 'Config'));

    // Log errors and return validation result
    if (errors.length > 0) {
        errors.forEach(err => error(err, 'Config'));
        return false;
    }

    return true;
}

/**
 * Check if a string is a valid Discord webhook URL
 * @param {string} url - URL to validate
 * @returns {boolean} - Whether URL is valid
 */
function isValidWebhookUrl(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname === 'discord.com' &&
            urlObj.pathname.startsWith('/api/webhooks/') &&
            urlObj.pathname.split('/').length >= 4;
    } catch {
        return false;
    }
}

/**
 * Get configuration summary for logging
 * @param {Object} config - Configuration object
 * @returns {Object} - Configuration summary
 */
export function getConfigSummary(config) {
    return {
        baseLogDir: config.BASE_LOG_DIR,
        botChatWebhookConfigured: !!config.BOT_CHAT_WEBHOOK_URL,
        botCount: Object.keys(config.BOT_NAMES_WITH_DISCORD_WEBHOOKS || {}).length,
        botNames: Object.keys(config.BOT_NAMES_WITH_DISCORD_WEBHOOKS || {})
    };
}
