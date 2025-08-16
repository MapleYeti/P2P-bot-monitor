// Main process entry point
import { app, BrowserWindow } from "electron";
import WindowManager from "./core/windowManager.js";
import ConfigManager from "./core/configManager.js";
import LogMonitor from "./core/logMonitor.js";
import IPCHandlers from "./ipc/ipcHandlers.js";

// Initialize managers
let windowManager;
let configManager;
let logMonitor;
let ipcHandlers;

function createWindow() {
  // Create instances of all managers
  windowManager = new WindowManager();
  configManager = new ConfigManager();
  logMonitor = new LogMonitor(windowManager);
  ipcHandlers = new IPCHandlers(windowManager, configManager, logMonitor);

  // Create the main window
  windowManager.createMainWindow();
}

// App lifecycle events
app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Cleanup before quitting
app.on("before-quit", () => {
  if (ipcHandlers) {
    ipcHandlers.removeHandlers();
  }
  if (logMonitor) {
    logMonitor.stopMonitoring();
  }
});
