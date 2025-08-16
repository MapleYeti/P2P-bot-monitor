import UIManager from "./core/uiManager.js";
import ConfigUI from "./core/configUI.js";
import LogDisplay from "./core/logDisplay.js";
import EventHandlers from "./core/eventHandlers.js";

// Global references for onclick handlers
let uiManager;
let configUI;
let logDisplay;
let eventHandlers;

// Initialize the application
document.addEventListener("DOMContentLoaded", async () => {
  console.log("DOM Content Loaded - Starting initialization...");
  console.log("Initial window state:", {
    electronAPI: window.electronAPI,
    preloadTest: window.preloadTest,
    keys: Object.keys(window),
  });

  // Show startup status
  uiManager = new UIManager();
  uiManager.showStartupStatus("Initializing application...");

  try {
    // Verify all DOM elements are found
    if (!validateDOMElements()) {
      console.error("Some DOM elements could not be found");
      uiManager.showStartupStatus(
        "Error: Required elements not found",
        "error"
      );
      return;
    }

    console.log("DOM validation passed, setting up Electron listeners...");

    // Setup Electron listeners first and wait for them to be ready
    await setupElectronListeners();

    console.log("Electron listeners ready, loading configuration...");

    // Initialize UI components
    configUI = new ConfigUI(uiManager);
    logDisplay = new LogDisplay(uiManager);
    eventHandlers = new EventHandlers(uiManager, configUI, logDisplay);

    // Load configuration and setup UI
    await loadConfiguration();

    // Update UI
    uiManager.updateUI();

    console.log("Application initialization complete!");

    // Add initial program log entry
    logDisplay.addProgramLog(
      "🚀 RuneScape Bot Monitor initialized successfully",
      "system",
      "success"
    );

    // Hide startup status immediately
    uiManager.hideStartupStatus();
  } catch (error) {
    console.error("Initialization failed:", error);
    uiManager.showStartupStatus(
      "Initialization failed: " + error.message,
      "error"
    );

    // Show more detailed error information
    setTimeout(() => {
      uiManager.showStartupStatus("Check console for details", "error");
    }, 3000);
  }
});

// Validate that all required DOM elements exist
function validateDOMElements() {
  const requiredElements = [
    "statusIndicator",
    "statusDot",
    "statusText",
    "logsDir",
    "selectDirBtn",
    "chatWebhook",
    "botWebhooks",
    "addBotBtn",
    "saveConfigBtn",
    "loadConfigBtn",
    "startBtn",
    "stopBtn",
    "clearLogsBtn",
    "logsDisplay",
    "botModal",
    "botName",
    "botWebhook",
    "saveBotBtn",
    "cancelBotBtn",
    "configAccordionHeader",
    "configAccordionToggle",
    "configAccordionContent",
    "configStatusIcon",
    "configStatusText",
  ];

  for (const id of requiredElements) {
    if (!document.getElementById(id)) {
      console.error(`Required DOM element not found: ${id}`);
      return false;
    }
  }

  return true;
}

// Electron IPC Listeners
async function setupElectronListeners() {
  return new Promise((resolve, reject) => {
    // Wait for Electron API to be available
    let retries = 0;
    const maxRetries = 100;
    const retryInterval = 100;

    const setupListeners = () => {
      console.log(`Attempt ${retries + 1}: Checking for Electron API...`);
      console.log("window.electronAPI:", window.electronAPI);
      console.log("window.preloadTest:", window.preloadTest);
      console.log("window keys:", Object.keys(window));

      if (!window.electronAPI) {
        if (retries < maxRetries) {
          retries++;
          console.log(`Waiting for Electron API... (${retries}/${maxRetries})`);
          setTimeout(setupListeners, retryInterval);
          return;
        } else {
          const errorMsg = "Electron API not available after multiple attempts";
          console.error(errorMsg);
          console.error("Final window state:", window);
          console.error(
            "Available window properties:",
            Object.getOwnPropertyNames(window)
          );
          reject(new Error(errorMsg));
          return;
        }
      }

      try {
        console.log("Setting up Electron listeners...");
        console.log("Available API methods:", Object.keys(window.electronAPI));

        window.electronAPI.onLogEvent((event, data) => {
          logDisplay.handleLogEvent(data);
        });

        window.electronAPI.onMonitoringStatus((event, data) => {
          uiManager.setMonitoringStatus(data.isMonitoring);
        });

        console.log("Electron listeners setup complete");
        resolve();
      } catch (error) {
        console.error("Failed to setup Electron listeners:", error);
        reject(error);
      }
    };

    setupListeners();
  });
}

// Configuration Management
async function loadConfiguration() {
  try {
    if (!window.electronAPI) {
      throw new Error("Electron API not available");
    }

    logDisplay.addProgramLog("📋 Loading configuration...", "config", "info");

    const result = await window.electronAPI.loadConfig();
    if (result.success) {
      uiManager.setConfig(result.config);
      configUI.updateFormFields();
      configUI.updateBotWebhooksDisplay();
      uiManager.showSuccess("Configuration loaded successfully");
      logDisplay.addProgramLog(
        "✅ Configuration loaded successfully",
        "config",
        "success"
      );
    } else {
      uiManager.showInfo(
        "No configuration file found. Please configure and save."
      );
      logDisplay.addProgramLog(
        "ℹ️ No configuration file found",
        "config",
        "info"
      );
    }
  } catch (error) {
    console.error("Configuration loading error:", error);
    uiManager.showError("Failed to load configuration: " + error.message);
    logDisplay.addProgramLog(
      `❌ Configuration loading error: ${error.message}`,
      "config",
      "error"
    );
  }
}

// Make configUI globally accessible for onclick handlers
window.configUI = {
  saveBotWebhookChanges: (originalBotName) =>
    configUI?.saveBotWebhookChanges(originalBotName),
  cancelBotWebhookEdit: (botName) => configUI?.cancelBotWebhookEdit(botName),
  editBotWebhook: (botName) => configUI?.editBotWebhook(botName),
  removeBotWebhook: (botName) => configUI?.removeBotWebhook(botName),
};
