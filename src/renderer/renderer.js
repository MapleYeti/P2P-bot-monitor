// DOM Elements
const statusIndicator = document.getElementById("statusIndicator");
const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");
const logsDir = document.getElementById("logsDir");
const selectDirBtn = document.getElementById("selectDirBtn");
const chatWebhook = document.getElementById("chatWebhook");
const botWebhooks = document.getElementById("botWebhooks");
const addBotBtn = document.getElementById("addBotBtn");
const saveConfigBtn = document.getElementById("saveConfigBtn");
const loadConfigBtn = document.getElementById("loadConfigBtn");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const clearLogsBtn = document.getElementById("clearLogsBtn");
const logsDisplay = document.getElementById("logsDisplay");
const botModal = document.getElementById("botModal");
const botName = document.getElementById("botName");
const botWebhook = document.getElementById("botWebhook");
const saveBotBtn = document.getElementById("saveBotBtn");
const cancelBotBtn = document.getElementById("cancelBotBtn");

// State
let currentConfig = {
  BASE_LOG_DIR: "",
  BOT_CHAT_WEBHOOK_URL: "",
  BOT_NAMES_WITH_DISCORD_WEBHOOKS: {},
};

let isMonitoring = false;

// Initialize the application
document.addEventListener("DOMContentLoaded", async () => {
  console.log("DOM Content Loaded - Starting initialization...");
  console.log("Initial window state:", {
    electronAPI: window.electronAPI,
    preloadTest: window.preloadTest,
    keys: Object.keys(window),
  });

  // Show startup status
  showStartupStatus("Initializing application...");

  try {
    // Verify all DOM elements are found
    if (!validateDOMElements()) {
      console.error("Some DOM elements could not be found");
      showStartupStatus("Error: Required elements not found", "error");
      return;
    }

    console.log("DOM validation passed, setting up Electron listeners...");

    // Setup Electron listeners first and wait for them to be ready
    await setupElectronListeners();

    console.log("Electron listeners ready, loading configuration...");

    // Then load configuration and setup UI
    await loadConfiguration();
    setupEventListeners();
    updateUI();

    console.log("Application initialization complete!");

    // Add initial program log entry
    addProgramLog(
      "🚀 RuneScape Bot Monitor initialized successfully",
      "system",
      "success"
    );

    // Hide startup status immediately
    hideStartupStatus();
  } catch (error) {
    console.error("Initialization failed:", error);
    showStartupStatus("Initialization failed: " + error.message, "error");

    // Show more detailed error information
    setTimeout(() => {
      showStartupStatus("Check console for details", "error");
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
  ];

  for (const id of requiredElements) {
    if (!document.getElementById(id)) {
      console.error(`Required DOM element not found: ${id}`);
      return false;
    }
  }

  return true;
}

// Check if Electron API is available
function isElectronAPIAvailable() {
  return window.electronAPI && typeof window.electronAPI === "object";
}

// Startup status management
function showStartupStatus(message, type = "info") {
  // Remove existing startup status if any
  hideStartupStatus();

  const statusElement = document.createElement("div");
  statusElement.id = "startupStatus";
  statusElement.className = `startup-status startup-status-${type}`;
  statusElement.innerHTML = `
    <div class="startup-spinner"></div>
    <span>${message}</span>
  `;

  document.body.appendChild(statusElement);

  // Show with animation
  setTimeout(() => statusElement.classList.add("show"), 100);
}

function hideStartupStatus() {
  const existingStatus = document.getElementById("startupStatus");
  if (existingStatus) {
    existingStatus.classList.remove("show");
    setTimeout(() => existingStatus.remove(), 300);
  }
}

// Event Listeners
function setupEventListeners() {
  selectDirBtn.addEventListener("click", selectDirectory);
  addBotBtn.addEventListener("click", showAddBotModal);
  saveConfigBtn.addEventListener("click", saveConfiguration);
  loadConfigBtn.addEventListener("click", loadConfiguration);
  startBtn.addEventListener("click", startMonitoring);
  stopBtn.addEventListener("click", stopMonitoring);
  clearLogsBtn.addEventListener("click", clearLogs);

  // Modal events
  saveBotBtn.addEventListener("click", saveBotWebhook);
  cancelBotBtn.addEventListener("click", hideAddBotModal);

  // Close modal when clicking outside
  botModal.addEventListener("click", (e) => {
    if (e.target === botModal) {
      hideAddBotModal();
    }
  });
}

// Electron IPC Listeners
async function setupElectronListeners() {
  return new Promise((resolve, reject) => {
    // Wait for Electron API to be available
    let retries = 0;
    const maxRetries = 100; // Increased retries even more
    const retryInterval = 100; // Slightly longer interval for debugging

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
          handleLogEvent(data);
        });

        window.electronAPI.onMonitoringStatus((event, data) => {
          isMonitoring = data.isMonitoring;
          updateUI();
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

// Directory Selection
async function selectDirectory() {
  try {
    if (!isElectronAPIAvailable()) {
      showError(
        "Electron API not available. Please wait for the application to fully load."
      );
      return;
    }

    addProgramLog("📁 Opening directory selector...", "config", "info");

    const selectedPath = await window.electronAPI.selectDirectory();
    if (selectedPath) {
      logsDir.value = selectedPath;
      currentConfig.BASE_LOG_DIR = selectedPath;
      showSuccess("Directory selected successfully");
      addProgramLog(
        `✅ Directory selected: ${selectedPath}`,
        "config",
        "success"
      );
    }
  } catch (error) {
    console.error("Directory selection error:", error);
    showError("Failed to select directory: " + error.message);
    addProgramLog(
      `❌ Directory selection error: ${error.message}`,
      "config",
      "error"
    );
  }
}

// Bot Webhook Management
function showAddBotModal() {
  botModal.style.display = "block";
  botName.value = "";
  botWebhook.value = "";
  botName.focus();
}

function hideAddBotModal() {
  botModal.style.display = "none";
}

function saveBotWebhook() {
  const name = botName.value.trim();
  const webhook = botWebhook.value.trim();

  if (!name || !webhook) {
    showError("Bot name and webhook URL are required");
    return;
  }

  currentConfig.BOT_NAMES_WITH_DISCORD_WEBHOOKS[name] = webhook;
  updateBotWebhooksDisplay();
  hideAddBotModal();

  addProgramLog(`🤖 Bot webhook added: ${name}`, "webhook", "success");
}

function removeBotWebhook(botName) {
  delete currentConfig.BOT_NAMES_WITH_DISCORD_WEBHOOKS[botName];
  updateBotWebhooksDisplay();

  addProgramLog(`🗑️ Bot webhook removed: ${botName}`, "webhook", "info");
}

function updateBotWebhooksDisplay() {
  botWebhooks.innerHTML = "";

  Object.entries(currentConfig.BOT_NAMES_WITH_DISCORD_WEBHOOKS).forEach(
    ([name, webhook]) => {
      const item = document.createElement("div");
      item.className = "bot-webhook-item";
      item.innerHTML = `
            <input type="text" value="${name}" placeholder="Bot Name" readonly>
            <input type="text" value="${webhook}" placeholder="Webhook URL" readonly>
            <button type="button" class="btn btn-small btn-danger" onclick="removeBotWebhook('${name}')">Remove</button>
        `;
      botWebhooks.appendChild(item);
    }
  );
}

// Configuration Management
async function loadConfiguration() {
  try {
    if (!window.electronAPI) {
      throw new Error("Electron API not available");
    }

    addProgramLog("📋 Loading configuration...", "config", "info");

    const result = await window.electronAPI.loadConfig();
    if (result.success) {
      currentConfig = result.config;
      updateFormFields();
      updateBotWebhooksDisplay();
      showSuccess("Configuration loaded successfully");
      addProgramLog(
        "✅ Configuration loaded successfully",
        "config",
        "success"
      );
    } else {
      showInfo("No configuration file found. Please configure and save.");
      addProgramLog("ℹ️ No configuration file found", "config", "info");
    }
  } catch (error) {
    console.error("Configuration loading error:", error);
    showError("Failed to load configuration: " + error.message);
    addProgramLog(
      `❌ Configuration loading error: ${error.message}`,
      "config",
      "error"
    );
  }
}

async function saveConfiguration() {
  try {
    if (!isElectronAPIAvailable()) {
      showError(
        "Electron API not available. Please wait for the application to fully load."
      );
      return;
    }

    // Update config from form fields
    currentConfig.BASE_LOG_DIR = logsDir.value.trim();
    currentConfig.BOT_CHAT_WEBHOOK_URL = chatWebhook.value.trim();

    if (!currentConfig.BASE_LOG_DIR) {
      showError("DreamBot Logs Directory is required");
      return;
    }

    addProgramLog("💾 Saving configuration...", "config", "info");

    const result = await window.electronAPI.saveConfig(currentConfig);
    if (result.success) {
      showSuccess("Configuration saved successfully");
      addProgramLog("✅ Configuration saved successfully", "config", "success");
    } else {
      showError("Failed to save configuration: " + result.error);
      addProgramLog(
        `❌ Failed to save configuration: ${result.error}`,
        "config",
        "error"
      );
    }
  } catch (error) {
    showError("Failed to save configuration: " + error.message);
    addProgramLog(
      `❌ Save configuration error: ${error.message}`,
      "config",
      "error"
    );
  }
}

function updateFormFields() {
  logsDir.value = currentConfig.BASE_LOG_DIR || "";
  chatWebhook.value = currentConfig.BOT_CHAT_WEBHOOK_URL || "";
}

// Monitoring Control
async function startMonitoring() {
  try {
    if (!isElectronAPIAvailable()) {
      showError(
        "Electron API not available. Please wait for the application to fully load."
      );
      return;
    }

    if (!currentConfig.BASE_LOG_DIR) {
      showError("Please configure the DreamBot Logs Directory first");
      return;
    }

    addProgramLog("🚀 Starting bot monitoring...", "monitoring", "info");
    addProgramLog(
      `📂 Monitoring directory: ${currentConfig.BASE_LOG_DIR}`,
      "monitoring",
      "info"
    );

    const result = await window.electronAPI.startMonitoring(currentConfig);
    if (result.success) {
      showSuccess("Monitoring started successfully");
      addProgramLog(
        "✅ Bot monitoring started successfully",
        "monitoring",
        "success"
      );
    } else {
      showError("Failed to start monitoring: " + result.error);
      addProgramLog(
        `❌ Failed to start monitoring: ${result.error}`,
        "monitoring",
        "error"
      );
    }
  } catch (error) {
    showError("Failed to start monitoring: " + error.message);
    addProgramLog(
      `❌ Monitoring error: ${error.message}`,
      "monitoring",
      "error"
    );
  }
}

async function stopMonitoring() {
  try {
    if (!isElectronAPIAvailable()) {
      showError(
        "Electron API not available. Please wait for the application to fully load."
      );
      return;
    }

    addProgramLog("🛑 Stopping bot monitoring...", "monitoring", "info");

    const result = await window.electronAPI.stopMonitoring();
    if (result.success) {
      showSuccess("Monitoring stopped successfully");
      addProgramLog(
        "✅ Bot monitoring stopped successfully",
        "monitoring",
        "success"
      );
    } else {
      showError("Failed to stop monitoring: " + result.error);
      addProgramLog(
        `❌ Failed to stop monitoring: ${result.error}`,
        "monitoring",
        "error"
      );
    }
  } catch (error) {
    showError("Failed to stop monitoring: " + error.message);
    addProgramLog(
      `❌ Stop monitoring error: ${error.message}`,
      "monitoring",
      "error"
    );
  }
}

// Log Management
function handleLogEvent(data) {
  switch (data.type) {
    case "log-entry":
      addLogEntry({
        timestamp: data.entry.timestamp,
        type: "log-entry",
        content: `[${data.entry.file}] ${data.entry.content}`,
        level: "info",
      });
      break;
    case "file-added":
      addLogEntry({
        timestamp: data.timestamp,
        type: "file-added",
        content: `📁 New log file detected: ${data.file}`,
        level: "info",
      });
      break;
    case "status":
      addLogEntry({
        timestamp: data.timestamp,
        type: "status",
        content: `🔄 ${data.message}`,
        level: "success",
      });
      break;
  }
}

// Add program-specific log entries
function addProgramLog(message, type = "info", level = "info") {
  addLogEntry({
    timestamp: new Date().toISOString(),
    type: type,
    content: message,
    level: level,
  });
}

function addLogEntry(entry) {
  const logElement = document.createElement("div");
  logElement.className = `log-entry log-entry-${entry.level || "info"}`;

  const timestamp = new Date(entry.timestamp).toLocaleTimeString();
  const levelIcon = getLevelIcon(entry.level);
  const typeLabel = getTypeLabel(entry.type);

  logElement.innerHTML = `
        <div class="log-header">
          <span class="timestamp">${timestamp}</span>
          <span class="type-badge">${typeLabel}</span>
          <span class="level-icon">${levelIcon}</span>
        </div>
        <div class="content">${entry.content}</div>
    `;

  logsDisplay.appendChild(logElement);
  logsDisplay.scrollTop = logsDisplay.scrollHeight;

  // Remove old logs if too many
  const logs = logsDisplay.querySelectorAll(".log-entry");
  if (logs.length > 100) {
    logs[0].remove();
  }
}

function getLevelIcon(level) {
  switch (level) {
    case "success":
      return "✅";
    case "error":
      return "❌";
    case "warning":
      return "⚠️";
    case "info":
    default:
      return "ℹ️";
  }
}

function getTypeLabel(type) {
  switch (type) {
    case "log-entry":
      return "LOG";
    case "file-added":
      return "FILE";
    case "status":
      return "STATUS";
    case "monitoring":
      return "MONITOR";
    case "config":
      return "CONFIG";
    case "webhook":
      return "WEBHOOK";
    case "system":
      return "SYSTEM";
    default:
      return "INFO";
  }
}

function clearLogs() {
  logsDisplay.innerHTML =
    '<div class="no-logs">📋 Program output will appear here when monitoring is active.</div>';

  addProgramLog("🧹 Logs cleared", "system", "info");
}

// UI Updates
function updateUI() {
  if (isMonitoring) {
    statusDot.classList.add("active");
    statusText.textContent = "Monitoring";
    startBtn.disabled = true;
    stopBtn.disabled = false;
  } else {
    statusDot.classList.remove("active");
    statusText.textContent = "Stopped";
    startBtn.disabled = false;
    stopBtn.disabled = true;
  }
}

// Utility Functions
function showSuccess(message) {
  showNotification(message, "success");
}

function showError(message) {
  showNotification(message, "error");
}

function showInfo(message) {
  showNotification(message, "info");
}

function showNotification(message, type = "info") {
  // Create notification element
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.textContent = message;

  // Add to page
  document.body.appendChild(notification);

  // Show notification
  setTimeout(() => notification.classList.add("show"), 100);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}
