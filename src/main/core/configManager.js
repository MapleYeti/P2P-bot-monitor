import fs from 'fs';
import path from 'path';
import { dialog } from 'electron';

class ConfigManager {
  constructor() {
    this.configPath = path.join(process.cwd(), "config.json");
  }

  async loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const config = JSON.parse(fs.readFileSync(this.configPath, "utf8"));
        return { success: true, config };
      } else {
        return { success: false, error: "No configuration file found" };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async saveConfig(config) {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2), "utf8");
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

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

      // Validate the config structure
      if (!config.BASE_LOG_DIR && !config.BOT_NAMES_WITH_DISCORD_WEBHOOKS) {
        return {
          success: false,
          error:
            "Invalid configuration file format. File must contain BASE_LOG_DIR or BOT_NAMES_WITH_DISCORD_WEBHOOKS",
        };
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
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2), "utf8");

      return { success: true, config };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getConfigPath() {
    return this.configPath;
  }
}

export default ConfigManager;
