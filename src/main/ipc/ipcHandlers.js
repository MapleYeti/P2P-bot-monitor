import { ipcMain, dialog } from "electron";
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
  }

  // Method to remove all handlers (useful for cleanup)
  removeHandlers() {
    ipcMain.removeHandler("select-directory");
    ipcMain.removeHandler("load-config");
    ipcMain.removeHandler("save-config");
    ipcMain.removeHandler("import-config");
    ipcMain.removeHandler("start-monitoring");
    ipcMain.removeHandler("stop-monitoring");
    ipcMain.removeHandler("get-monitoring-status");
  }
}

export default IPCHandlers;
