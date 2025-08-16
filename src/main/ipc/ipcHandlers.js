import { ipcMain, dialog, shell } from "electron";
import path from "path";

class IPCHandlers {
  constructor(windowManager, configFileManager, logMonitor) {
    this.windowManager = windowManager;
    this.configManager = configFileManager; // Keep the property name for compatibility
    this.logMonitor = logMonitor;
    this.setupHandlers();
  }

  setupHandlers() {
    // Directory selection
    ipcMain.handle("select-directory", async () => {
      const mainWindow = this.windowManager.getMainWindow();
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ["openDirectory"],
        title: "Select DreamBot Logs Directory",
      });

      if (!result.canceled) {
        return result.filePaths[0];
      }
      return null;
    });

    // Configuration management
    ipcMain.handle("load-config", async () => {
      return await this.configManager.loadConfig();
    });

    ipcMain.handle("save-config", async (event, config) => {
      return await this.configManager.saveConfig(config);
    });

    ipcMain.handle("import-config", async () => {
      const mainWindow = this.windowManager.getMainWindow();
      return await this.configManager.importConfig(mainWindow);
    });

    ipcMain.handle("export-config", async (event, config) => {
      const mainWindow = this.windowManager.getMainWindow();
      return await this.configManager.exportConfig(mainWindow, config);
    });

    // Monitoring control
    ipcMain.handle("start-monitoring", async (event, config) => {
      return await this.logMonitor.startMonitoring(config);
    });

    ipcMain.handle("stop-monitoring", async () => {
      return await this.logMonitor.stopMonitoring();
    });

    ipcMain.handle("get-monitoring-status", () => {
      return this.logMonitor.getMonitoringStatus();
    });

    // Launch CLI command
    ipcMain.handle("launch-cli", async (event, command) => {
      try {
        // Use shell.openExternal to open a new terminal with the command
        // This will open the default terminal application
        await shell.openExternal(`cmd://${command}`);
        return { success: true };
      } catch (error) {
        console.error("Failed to launch CLI:", error);
        return { success: false, error: error.message };
      }
    });
  }

  // Method to remove all handlers (useful for cleanup)
  removeHandlers() {
    ipcMain.removeHandler("select-directory");
    ipcMain.removeHandler("load-config");
    ipcMain.removeHandler("save-config");
    ipcMain.removeHandler("import-config");
    ipcMain.removeHandler("export-config");
    ipcMain.removeHandler("start-monitoring");
    ipcMain.removeHandler("stop-monitoring");
    ipcMain.removeHandler("get-monitoring-status");
    ipcMain.removeHandler("launch-cli");
  }
}

export default IPCHandlers;
