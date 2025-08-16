// Main process entry point
import { app, BrowserWindow } from "electron";
import WindowManager from "./core/windowManager.js";
import ConfigFileManager from "./core/configFileManager.js";
import LogMonitor from "./core/logMonitor.js";
import IPCHandlers from "./ipc/ipcHandlers.js";

// Initialize managers
let windowManager;
let configFileManager;
let logMonitor;
let ipcHandlers;

function createWindow() {
  // Create instances of all managers
  windowManager = new WindowManager();
  configFileManager = new ConfigFileManager();
  logMonitor = new LogMonitor(windowManager);
  ipcHandlers = new IPCHandlers(windowManager, configFileManager, logMonitor);

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
