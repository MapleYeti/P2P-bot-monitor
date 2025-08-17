import UIManager from "./core/uiManager.js";
import ConfigUI from "./core/configUI.js";
import LogDisplay from "./core/logDisplay.js";
import EventHandlers from "./core/eventHandlers.js";
import BotStatusManager from "./core/botStatusManager.js";

// Global references for onclick handlers
let uiManager;
let configUI;
let logDisplay;
let eventHandlers;
let botStatusManager;

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
    logDisplay = new LogDisplay(uiManager);
    configUI = new ConfigUI(uiManager, logDisplay);
    eventHandlers = new EventHandlers(uiManager, configUI, logDisplay);
    botStatusManager = new BotStatusManager(uiManager);

    // Make configUI globally accessible for onclick handlers
    window.configUI = {
      saveBotWebhookChanges: (originalBotName) =>
        configUI.saveBotWebhookChanges(originalBotName),
      cancelBotWebhookEdit: (botName) => configUI.cancelBotWebhookEdit(botName),
      editBot: (botName) => configUI.editBot(botName),
      removeBot: (botName) => configUI.removeBot(botName),
      saveConfiguration: () => configUI.saveConfiguration(),
      undoChanges: () => configUI.undoChanges(),
    };

    // Load configuration and setup UI
    try {
      if (!window.electronAPI) {
        throw new Error("Electron API not available");
      }

      logDisplay.addProgramLog("📋 Loading configuration...", "config", "info");

      const result = await window.electronAPI.loadConfig();

      // Always load the config into the form, even if there are validation errors
      if (result.config) {
        uiManager.setConfig(result.config);
        // Update the original config in ConfigUI so form fields can be populated
        configUI.setOriginalConfig(result.config);
        configUI.updateFormFields();
        configUI.updateBotsDisplay();
        configUI.updateConfigurationStatus();
        configUI.updateLaunchCLIVisibility();

        if (result.success) {
          uiManager.showSuccess("Configuration loaded successfully");
          logDisplay.addProgramLog(
            "✅ Configuration loaded successfully",
            "config",
            "success"
          );
        } else {
          // Show validation errors but still load the config
          const errorMessage =
            result.error || "Configuration has validation errors";
          uiManager.showWarning(
            `Configuration loaded with errors: ${errorMessage}`
          );
          logDisplay.addProgramLog(
            `⚠️ Configuration loaded with errors: ${errorMessage}`,
            "config",
            "warning"
          );

          // If there are specific validation details, show them
          if (result.validation && result.validation.errors) {
            result.validation.errors.forEach((error) => {
              logDisplay.addProgramLog(`❌ ${error}`, "config", "error");
            });
          }
        }
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

    // Update UI
    uiManager.updateUI();

    // Initialize bot status display
    botStatusManager.updateBotStatusList();

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
    "undoChangesBtn",
    "loadConfigBtn",
    "exportConfigBtn",
    "toggleMonitoringBtn",
    "clearLogsBtn",
    "logsDisplay",
    "botModal",
    "botName",
    "botWebhook",
    "botLaunchCLI",
    "saveBotBtn",
    "cancelBotBtn",
    "editBotModal",
    "editBotName",
    "editBotWebhook",
    "editBotLaunchCLI",
    "saveEditBotBtn",
    "cancelEditBotBtn",
    "configAccordionHeader",
    "configAccordionToggle",
    "configAccordionContent",
    "configStatus",
    "botStatusList",
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
