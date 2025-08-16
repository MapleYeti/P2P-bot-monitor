/**
 * Global Configuration Manager
 * Centralizes configuration management across the application
 */

// Global configuration storage
let globalConfig = {};

/**
 * Set the global configuration
 * @param {Object} config - Configuration object
 */
export function setGlobalConfig(config) {
  globalConfig = { ...config };
  console.log("🔧 Global config set:", Object.keys(config));
}

/**
 * Get the current global configuration
 * @returns {Object} Current configuration
 */
export function getGlobalConfig() {
  return globalConfig;
}

/**
 * Get a specific configuration value
 * @param {string} key - Configuration key
 * @param {*} defaultValue - Default value if key doesn't exist
 * @returns {*} Configuration value or default
 */
export function getConfigValue(key, defaultValue = undefined) {
  return globalConfig[key] !== undefined ? globalConfig[key] : defaultValue;
}

/**
 * Update a specific configuration value
 * @param {string} key - Configuration key
 * @param {*} value - New value
 */
export function updateConfigValue(key, value) {
  globalConfig[key] = value;
  console.log(`🔧 Config updated: ${key} = ${value}`);
}

/**
 * Check if a configuration key exists
 * @param {string} key - Configuration key
 * @returns {boolean} True if key exists
 */
export function hasConfigKey(key) {
  return key in globalConfig;
}

/**
 * Get all configuration keys
 * @returns {string[]} Array of configuration keys
 */
export function getConfigKeys() {
  return Object.keys(globalConfig);
}

/**
 * Reset configuration to empty object
 */
export function resetConfig() {
  globalConfig = {};
  console.log("🔧 Global config reset");
}

/**
 * Validate that required configuration keys exist
 * @param {string[]} requiredKeys - Array of required configuration keys
 * @returns {Object} Validation result with success status and missing keys
 */
export function validateRequiredConfig(requiredKeys) {
  const missingKeys = requiredKeys.filter((key) => !hasConfigKey(key));

  if (missingKeys.length > 0) {
    return {
      success: false,
      missingKeys,
      error: `Missing required configuration keys: ${missingKeys.join(", ")}`,
    };
  }

  return { success: true };
}

/**
 * Get configuration summary for logging/debugging
 * @returns {Object} Configuration summary
 */
export function getConfigSummary() {
  return {
    keys: getConfigKeys(),
    hasBaseLogDir: hasConfigKey("BASE_LOG_DIR"),
    hasBotChatWebhook: hasConfigKey("BOT_CHAT_WEBHOOK_URL"),
    botWebhookCount: Object.keys(
      globalConfig.BOT_NAMES_WITH_DISCORD_WEBHOOKS || {}
    ).length,
  };
}
