/**
 * File-based Configuration Manager
 * Handles loading, saving, and importing configuration files
 */

import fs from "fs";
import path from "path";
import { dialog } from "electron";
import { error, warn } from "./logging/logger.js";

class FileConfigManager {
  constructor() {
    this.configPath = path.join(process.cwd(), "config.json");
  }

  /**
   * Load configuration from file
   * @returns {Object} Result with success status and config or error
   */
  async loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const config = JSON.parse(fs.readFileSync(this.configPath, "utf8"));

        // Validate the loaded configuration
        const validation = this.validateConfig(config);
        if (!validation.success) {
          return {
            success: false,
            error: validation.error,
            config: config, // Still return config for debugging
            validation: validation,
          };
        }

        return { success: true, config, validation };
      } else {
        return { success: false, error: "No configuration file found" };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Save configuration to file
   * @param {Object} config - Configuration object to save
   * @returns {Object} Result with success status or error
   */
  async saveConfig(config) {
    try {
      fs.writeFileSync(
        this.configPath,
        JSON.stringify(config, null, 2),
        "utf8"
      );
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Import configuration from external file
   * @param {BrowserWindow} mainWindow - Main window for dialog
   * @returns {Object} Result with success status and config or error
   */
  async importConfig(mainWindow) {
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ["openFile"],
        title: "Import Configuration File",
        filters: [
          { name: "JSON Files", extensions: ["json"] },
          { name: "All Files", extensions: ["*"] },
        ],
      });

      if (result.canceled) {
        return { success: false, error: "Import cancelled" };
      }

      const filePath = result.filePaths[0];
      const fileContent = fs.readFileSync(filePath, "utf8");
      const config = JSON.parse(fileContent);

      // Validate the config structure using our validation method
      const validation = this.validateConfig(config);
      if (!validation.success) {
        return validation;
      }

      // Ensure required fields exist with defaults if missing
      if (!config.BASE_LOG_DIR) {
        config.BASE_LOG_DIR = "";
      }
      if (!config.BOT_CHAT_WEBHOOK_URL) {
        config.BOT_CHAT_WEBHOOK_URL = "";
      }
      if (!config.BOT_NAMES_WITH_DISCORD_WEBHOOKS) {
        config.BOT_NAMES_WITH_DISCORD_WEBHOOKS = {};
      }

      // Save the imported config to config.json (overwriting current)
      fs.writeFileSync(
        this.configPath,
        JSON.stringify(config, null, 2),
        "utf8"
      );

      return { success: true, config };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get the configuration file path
   * @returns {string} Path to configuration file
   */
  getConfigPath() {
    return this.configPath;
  }

  /**
   * Check if configuration file exists
   * @returns {boolean} True if config file exists
   */
  configFileExists() {
    return fs.existsSync(this.configPath);
  }

  /**
   * Create default configuration file
   * @returns {Object} Result with success status or error
   */
  async createDefaultConfig() {
    try {
      const defaultConfig = {
        BASE_LOG_DIR: "",
        BOT_CHAT_WEBHOOK_URL: "",
        BOT_NAMES_WITH_DISCORD_WEBHOOKS: {},
      };

      await this.saveConfig(defaultConfig);
      return { success: true, config: defaultConfig };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate configuration object
   * @param {Object} config - Configuration object to validate
   * @returns {Object} Validation result with success status, errors, and warnings
   */
  validateConfig(config) {
    const errors = [];
    const warnings = [];

    // Check required fields
    if (!config.BASE_LOG_DIR) {
      errors.push("BASE_LOG_DIR is required");
    } else if (!config.BASE_LOG_DIR.trim()) {
      errors.push("BASE_LOG_DIR cannot be empty");
    }

    if (!config.BOT_CHAT_WEBHOOK_URL) {
      errors.push("BOT_CHAT_WEBHOOK_URL is required");
    } else if (!this.isValidWebhookUrl(config.BOT_CHAT_WEBHOOK_URL)) {
      errors.push("BOT_CHAT_WEBHOOK_URL must be a valid Discord webhook URL");
    }

    // Check bot webhooks
    if (
      !config.BOT_NAMES_WITH_DISCORD_WEBHOOKS ||
      Object.keys(config.BOT_NAMES_WITH_DISCORD_WEBHOOKS).length === 0
    ) {
      warnings.push(
        "No bot webhooks configured - level up and quest notifications will not work"
      );
    } else {
      // Validate each bot webhook
      for (const [botName, webhookUrl] of Object.entries(
        config.BOT_NAMES_WITH_DISCORD_WEBHOOKS
      )) {
        if (!webhookUrl || !webhookUrl.trim()) {
          errors.push(`Webhook URL for bot "${botName}" is empty`);
        } else if (!this.isValidWebhookUrl(webhookUrl)) {
          errors.push(`Invalid webhook URL for bot "${botName}"`);
        }
      }
    }

    // Log warnings
    warnings.forEach((warning) => warn(warning, "Config"));

    // Log errors and return validation result
    if (errors.length > 0) {
      errors.forEach((err) => error(err, "Config"));
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
   * Check if a string is a valid Discord webhook URL
   * @param {string} url - URL to validate
   * @returns {boolean} - Whether URL is valid
   */
  isValidWebhookUrl(url) {
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
   * Get configuration summary for logging
   * @param {Object} config - Configuration object
   * @returns {Object} - Configuration summary
   */
  getConfigSummary(config) {
    return {
      baseLogDir: config.BASE_LOG_DIR,
      botChatWebhookConfigured: !!config.BOT_CHAT_WEBHOOK_URL,
      botCount: Object.keys(config.BOT_NAMES_WITH_DISCORD_WEBHOOKS || {})
        .length,
      botNames: Object.keys(config.BOT_NAMES_WITH_DISCORD_WEBHOOKS || {}),
    };
  }
}

export default FileConfigManager;
