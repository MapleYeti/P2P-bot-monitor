/**
 * Shared Configuration Validator
 * Provides consistent validation logic for both main and renderer processes
 */

/**
 * Check if a string is a valid Discord webhook URL
 * @param {string} url - URL to validate
 * @returns {boolean} - Whether URL is valid
 */
export function isValidWebhookUrl(url) {
  try {
    const urlObj = new URL(url);
    return (
      urlObj.hostname === "discord.com" &&
      urlObj.pathname.startsWith("/api/webhooks/") &&
      urlObj.pathname.split("/").length >= 4
    );
  } catch {
    return false;
  }
}

/**
 * Validate configuration object
 * @param {Object} config - Configuration object to validate
 * @returns {Object} Validation result with success status, errors, and warnings
 */
export function validateConfig(config) {
  const errors = [];
  const warnings = [];

  // Check required fields
  if (!config.BASE_LOG_DIR) {
    errors.push("BASE_LOG_DIR is required");
  } else if (!config.BASE_LOG_DIR.trim()) {
    errors.push("BASE_LOG_DIR cannot be empty");
  }

  // BOT_CHAT_WEBHOOK_URL is optional - only validate if provided
  if (config.BOT_CHAT_WEBHOOK_URL && config.BOT_CHAT_WEBHOOK_URL.trim()) {
    if (!isValidWebhookUrl(config.BOT_CHAT_WEBHOOK_URL)) {
      errors.push("BOT_CHAT_WEBHOOK_URL must be a valid Discord webhook URL");
    }
  }

  // Check bot webhooks
  if (!config.BOT_CONFIG || Object.keys(config.BOT_CONFIG).length === 0) {
    warnings.push(
      "No bots configured - level up and quest notifications will not work"
    );
  } else {
    // Validate each bot webhook (webhook URLs are optional)
    for (const [botName, botConfig] of Object.entries(config.BOT_CONFIG)) {
      // Webhook URL is optional - only validate if provided
      if (botConfig.webhookUrl && botConfig.webhookUrl.trim()) {
        if (!isValidWebhookUrl(botConfig.webhookUrl)) {
          errors.push(`Invalid webhook URL for bot "${botName}"`);
        }
      }
    }
  }

  // Return validation result
  if (errors.length > 0) {
    return {
      success: false,
      errors,
      warnings,
      error: `Configuration validation failed: ${errors.join(", ")}`,
    };
  }

  return {
    success: true,
    errors: [],
    warnings,
  };
}

/**
 * Get detailed validation errors for the current configuration
 * This is a frontend-friendly version that returns user-friendly error messages
 * @param {Object} config - Configuration object to validate
 * @returns {Array} Array of user-friendly error messages
 */
export function getValidationErrors(config) {
  const errors = [];

  // Check for required fields
  if (!config.BASE_LOG_DIR || !config.BASE_LOG_DIR.trim()) {
    errors.push("DreamBot Logs Directory is required");
  }

  // Check BOT_CHAT_WEBHOOK_URL if provided (it's optional but must be valid if present)
  if (config.BOT_CHAT_WEBHOOK_URL && config.BOT_CHAT_WEBHOOK_URL.trim()) {
    if (!isValidWebhookUrl(config.BOT_CHAT_WEBHOOK_URL)) {
      errors.push(
        "General Chat Webhook URL must be a valid Discord webhook URL"
      );
    }
  }

  // Check bot webhook URLs if they are provided
  if (config.BOT_CONFIG) {
    for (const [botName, botConfig] of Object.entries(config.BOT_CONFIG)) {
      // Webhook URL is optional, but if provided, it must be valid
      if (botConfig.webhookUrl && botConfig.webhookUrl.trim()) {
        if (!isValidWebhookUrl(botConfig.webhookUrl)) {
          errors.push(
            `Bot "${botName}" webhook URL must be a valid Discord webhook URL`
          );
        }
      }
    }
  }

  return errors;
}

/**
 * Check if there are validation errors in the current configuration
 * @param {Object} config - Configuration object to validate
 * @returns {boolean} - Whether there are validation errors
 */
export function hasValidationErrors(config) {
  try {
    // Check for required fields
    if (!config.BASE_LOG_DIR || !config.BASE_LOG_DIR.trim()) {
      return true;
    }

    // Check BOT_CHAT_WEBHOOK_URL if provided (it's optional but must be valid if present)
    if (config.BOT_CHAT_WEBHOOK_URL && config.BOT_CHAT_WEBHOOK_URL.trim()) {
      if (!isValidWebhookUrl(config.BOT_CHAT_WEBHOOK_URL)) {
        return true;
      }
    }

    // Check bot webhook URLs if they are provided
    if (config.BOT_CONFIG) {
      for (const [botName, botConfig] of Object.entries(config.BOT_CONFIG)) {
        // Webhook URL is optional, but if provided, it must be valid
        if (botConfig.webhookUrl && botConfig.webhookUrl.trim()) {
          if (!isValidWebhookUrl(botConfig.webhookUrl)) {
            return true;
          }
        }
      }
    }

    return false;
  } catch (error) {
    console.error("Error checking validation:", error);
    return true; // Assume there are errors if we can't check
  }
}
