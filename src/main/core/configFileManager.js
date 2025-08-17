/**
 * File-based Configuration Manager
 * Handles loading, saving, and importing configuration files
 */

import fs from "fs";
import path from "path";
import { dialog } from "electron";
import { error, warn } from "./logging/logger.js";
import { validateConfig } from "../../shared/configValidator.js";

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
        const validation = validateConfig(config);

        // Log warnings and errors
        validation.warnings.forEach((warning) => warn(warning, "Config"));
        if (!validation.success) {
          validation.errors.forEach((err) => error(err, "Config"));
        }

        // Always return the config and validation result, regardless of success
        return {
          success: validation.success,
          config,
          validation,
          error: validation.success ? null : validation.error,
        };
      } else {
        // No configuration file found, create a default one
        console.log(
          "No configuration file found, creating default configuration..."
        );
        const result = await this.createDefaultConfig();
        if (result.success) {
          return { success: true, config: result.config, isDefault: true };
        } else {
          return {
            success: false,
            error: "Failed to create default configuration: " + result.error,
          };
        }
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
      const validation = validateConfig(config);

      // Log warnings and errors
      validation.warnings.forEach((warning) => warn(warning, "Config"));
      if (!validation.success) {
        validation.errors.forEach((err) => error(err, "Config"));
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
        DREAMBOT_VIP_FEATURES: false,
        BOT_CONFIG: {},
      };

      await this.saveConfig(defaultConfig);
      return { success: true, config: defaultConfig };
    } catch (error) {
      return { success: false, error: error.message };
    }
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
