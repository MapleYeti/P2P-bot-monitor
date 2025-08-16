const { contextBridge, ipcRenderer } = require("electron");

console.log("Preload script starting...");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  // Configuration management
  loadConfig: () => ipcRenderer.invoke("load-config"),
  saveConfig: (config) => ipcRenderer.invoke("save-config", config),
  importConfig: () => ipcRenderer.invoke("import-config"),
  exportConfig: (config) => ipcRenderer.invoke("export-config", config),

  // Directory selection
  selectDirectory: () => ipcRenderer.invoke("select-directory"),

  // Bot launching
  launchCLI: (command) => ipcRenderer.invoke("launch-cli", command),

  // Monitoring control
  startMonitoring: (config) => ipcRenderer.invoke("start-monitoring", config),
  stopMonitoring: () => ipcRenderer.invoke("stop-monitoring"),
  getMonitoringStatus: () => ipcRenderer.invoke("get-monitoring-status"),

  // Event listeners
  onLogEvent: (callback) => ipcRenderer.on("log-event", callback),
  onMonitoringStatus: (callback) =>
    ipcRenderer.on("monitoring-status", callback),

  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});

console.log("Preload script completed - electronAPI exposed to window");

// Also add a simple test property
contextBridge.exposeInMainWorld("preloadTest", "Preload script is working!");
console.log("Test property 'preloadTest' also exposed");
