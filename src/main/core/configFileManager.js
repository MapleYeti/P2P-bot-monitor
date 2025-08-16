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

        // Convert old bot configuration format to new standardized format if needed
        if (config.BOT_CONFIG) {
          config.BOT_CONFIG = this.convertBotConfigToNewFormat(
            config.BOT_CONFIG
          );
        }

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

      // Ensure required fields exist with defaults if missing
      if (!config.BASE_LOG_DIR) {
        config.BASE_LOG_DIR = "";
      }
      if (!config.BOT_CHAT_WEBHOOK_URL) {
        config.BOT_CHAT_WEBHOOK_URL = "";
      }
      if (!config.BOT_CONFIG) {
        config.BOT_CONFIG = {};
      }

      // Convert old bot configuration format to new standardized format
      config.BOT_CONFIG = this.convertBotConfigToNewFormat(config.BOT_CONFIG);

      // Validate the converted config structure
      const validation = this.validateConfig(config);
      if (!validation.success) {
        return validation;
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
        BOT_CONFIG: {},
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

    // BOT_CHAT_WEBHOOK_URL is optional - only validate if provided
    if (config.BOT_CHAT_WEBHOOK_URL && config.BOT_CHAT_WEBHOOK_URL.trim()) {
      if (!this.isValidWebhookUrl(config.BOT_CHAT_WEBHOOK_URL)) {
        errors.push("BOT_CHAT_WEBHOOK_URL must be a valid Discord webhook URL");
      }
    }

    // Check bot webhooks
    if (!config.BOT_CONFIG || Object.keys(config.BOT_CONFIG).length === 0) {
      warnings.push(
        "No bot webhooks configured - level up and quest notifications will not work"
      );
    } else {
      // Validate each bot webhook
      for (const [botName, botConfig] of Object.entries(config.BOT_CONFIG)) {
        if (!botConfig.webhookUrl || !botConfig.webhookUrl.trim()) {
          errors.push(`Webhook URL for bot "${botName}" is empty`);
        } else if (!this.isValidWebhookUrl(botConfig.webhookUrl)) {
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
   * Convert old bot configuration format to new standardized format
   * @param {Object} botConfig - Bot configuration object (old or new format)
   * @returns {Object} - Standardized bot configuration
   */
  convertBotConfigToNewFormat(botConfig) {
    const convertedConfig = {};

    for (const [botName, botData] of Object.entries(botConfig)) {
      if (typeof botData === "string") {
        // Old format: "BotName": "webhook_url"
        convertedConfig[botName] = {
          webhookUrl: botData,
          launchCLI: "",
        };
      } else if (botData && typeof botData === "object") {
        // Check if it's already in new format or old format with different property names
        if (botData.webhookUrl !== undefined) {
          // Already in new format
          convertedConfig[botName] = {
            webhookUrl: botData.webhookUrl || "",
            launchCLI: botData.launchCLI || "",
          };
        } else if (botData.webhook !== undefined) {
          // Old format: { webhook: "url", launchCLI: "command" }
          convertedConfig[botName] = {
            webhookUrl: botData.webhook || "",
            launchCLI: botData.launchCLI || "",
          };
        } else {
          // Invalid format, skip this bot
          console.warn(
            `Skipping invalid bot configuration for ${botName}:`,
            botData
          );
          continue;
        }
      } else {
        // Invalid format, skip this bot
        console.warn(
          `Skipping invalid bot configuration for ${botName}:`,
          botData
        );
        continue;
      }
    }

    return convertedConfig;
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
      botCount: Object.keys(config.BOT_CONFIG || {}).length,
      botNames: Object.keys(config.BOT_CONFIG || {}),
    };
  }

  /**
   * Export configuration to external file
   * @param {BrowserWindow} mainWindow - Main window for dialog
   * @param {Object} config - Configuration object to export
   * @returns {Object} Result with success status or error
   */
  async exportConfig(mainWindow, config) {
    try {
      const result = await dialog.showSaveDialog(mainWindow, {
        title: "Export Configuration File",
        defaultPath: "config_export.json",
        filters: [
          { name: "JSON Files", extensions: ["json"] },
          { name: "All Files", extensions: ["*"] },
        ],
      });

      if (result.canceled) {
        return { success: false, error: "Export cancelled" };
      }

      const filePath = result.filePath;

      // Ensure the config is in the new standardized format before exporting
      const exportConfig = { ...config };
      if (exportConfig.BOT_CONFIG) {
        exportConfig.BOT_CONFIG = this.convertBotConfigToNewFormat(
          exportConfig.BOT_CONFIG
        );
      }

      fs.writeFileSync(filePath, JSON.stringify(exportConfig, null, 2), "utf8");

      return { success: true, filePath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default FileConfigManager;
