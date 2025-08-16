class EventHandlers {
  constructor(uiManager, configUI, logDisplay) {
    this.uiManager = uiManager;
    this.configUI = configUI;
    this.logDisplay = logDisplay;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Configuration buttons
    const selectDirBtn = document.getElementById("selectDirBtn");
    const addBotBtn = document.getElementById("addBotBtn");
    const saveConfigBtn = document.getElementById("saveConfigBtn");
    const loadConfigBtn = document.getElementById("loadConfigBtn");

    // Monitoring buttons
    const startBtn = document.getElementById("startBtn");
    const stopBtn = document.getElementById("stopBtn");
    const clearLogsBtn = document.getElementById("clearLogsBtn");

    // Modal buttons
    const saveBotBtn = document.getElementById("saveBotBtn");
    const cancelBotBtn = document.getElementById("cancelBotBtn");
    const botModal = document.getElementById("botModal");

    // Setup event listeners
    selectDirBtn?.addEventListener("click", () => this.selectDirectory());
    addBotBtn?.addEventListener("click", () => this.configUI.showAddBotModal());
    saveConfigBtn?.addEventListener("click", () => this.saveConfiguration());
    loadConfigBtn?.addEventListener("click", () => this.importConfiguration());

    startBtn?.addEventListener("click", () => this.startMonitoring());
    stopBtn?.addEventListener("click", () => this.stopMonitoring());
    clearLogsBtn?.addEventListener("click", () => this.logDisplay.clearLogs());

    // Modal events
    saveBotBtn?.addEventListener("click", () => this.configUI.saveBotWebhook());
    cancelBotBtn?.addEventListener("click", () =>
      this.configUI.hideAddBotModal()
    );

    // Close modal when clicking outside
    botModal?.addEventListener("click", (e) => {
      if (e.target === botModal) {
        this.configUI.hideAddBotModal();
      }
    });
  }

  async selectDirectory() {
    try {
      if (!this.isElectronAPIAvailable()) {
        this.uiManager.showError(
          "Electron API not available. Please wait for the application to fully load."
        );
        return;
      }

      this.logDisplay.addProgramLog(
        "📁 Opening directory selector...",
        "config",
        "info"
      );

      const selectedPath = await window.electronAPI.selectDirectory();
      if (selectedPath) {
        const logsDir = document.getElementById("logsDir");
        if (logsDir) {
          logsDir.value = selectedPath;
          this.uiManager.updateConfigField("BASE_LOG_DIR", selectedPath);
          this.uiManager.updateConfigurationStatus();
          this.uiManager.showSuccess("Directory selected successfully");
          this.logDisplay.addProgramLog(
            `✅ Directory selected: ${selectedPath}`,
            "config",
            "success"
          );
        }
      }
    } catch (error) {
      console.error("Directory selection error:", error);
      this.uiManager.showError("Failed to select directory: " + error.message);
      this.logDisplay.addProgramLog(
        `❌ Directory selection error: ${error.message}`,
        "config",
        "error"
      );
    }
  }

  async saveConfiguration() {
    try {
      if (!this.isElectronAPIAvailable()) {
        this.uiManager.showError(
          "Electron API not available. Please wait for the application to fully load."
        );
        return;
      }

      const logsDir = document.getElementById("logsDir");
      const chatWebhook = document.getElementById("chatWebhook");

      if (!logsDir || !chatWebhook) return;

      // Update config from form fields
      this.uiManager.updateConfigField("BASE_LOG_DIR", logsDir.value.trim());
      this.uiManager.updateConfigField(
        "BOT_CHAT_WEBHOOK_URL",
        chatWebhook.value.trim()
      );

      if (!this.uiManager.getConfig().BASE_LOG_DIR) {
        this.uiManager.showError("DreamBot Logs Directory is required");
        return;
      }

      this.logDisplay.addProgramLog(
        "💾 Saving configuration...",
        "config",
        "info"
      );

      const result = await window.electronAPI.saveConfig(
        this.uiManager.getConfig()
      );
      if (result.success) {
        this.uiManager.updateConfigurationStatus();
        this.uiManager.showSuccess("Configuration saved successfully");
        this.logDisplay.addProgramLog(
          "✅ Configuration saved successfully",
          "config",
          "success"
        );
      } else {
        this.uiManager.showError(
          "Failed to save configuration: " + result.error
        );
        this.logDisplay.addProgramLog(
          `❌ Failed to save configuration: ${result.error}`,
          "config",
          "error"
        );
      }
    } catch (error) {
      this.uiManager.showError(
        "Failed to save configuration: " + error.message
      );
      this.logDisplay.addProgramLog(
        `❌ Save configuration error: ${error.message}`,
        "config",
        "error"
      );
    }
  }

  async importConfiguration() {
    try {
      if (!this.isElectronAPIAvailable()) {
        this.uiManager.showError(
          "Electron API not available. Please wait for the application to fully load."
        );
        return;
      }

      // Show confirmation dialog
      const confirmed = confirm(
        "⚠️ Warning: Importing a configuration file will overwrite your current settings.\n\n" +
          "This action cannot be undone. Are you sure you want to continue?"
      );

      if (!confirmed) {
        this.logDisplay.addProgramLog(
          "ℹ️ Configuration import cancelled by user",
          "config",
          "info"
        );
        return;
      }

      this.logDisplay.addProgramLog(
        "📥 Importing configuration file...",
        "config",
        "info"
      );

      const result = await window.electronAPI.importConfig();
      if (result.success) {
        this.uiManager.setConfig(result.config);
        this.configUI.updateFormFields();
        this.configUI.updateBotWebhooksDisplay();
        this.uiManager.showSuccess(
          "Configuration imported and loaded successfully"
        );
        this.logDisplay.addProgramLog(
          "✅ Configuration imported and loaded successfully",
          "config",
          "success"
        );
      } else {
        if (result.error === "Import cancelled") {
          this.logDisplay.addProgramLog(
            "ℹ️ Configuration import cancelled",
            "config",
            "info"
          );
        } else {
          this.uiManager.showError(
            "Failed to import configuration: " + result.error
          );
          this.logDisplay.addProgramLog(
            `❌ Configuration import error: ${result.error}`,
            "config",
            "error"
          );
        }
      }
    } catch (error) {
      this.uiManager.showError(
        "Failed to import configuration: " + error.message
      );
      this.logDisplay.addProgramLog(
        `❌ Configuration import error: ${error.message}`,
        "config",
        "error"
      );
    }
  }

  async startMonitoring() {
    try {
      if (!this.isElectronAPIAvailable()) {
        this.uiManager.showError(
          "Electron API not available. Please wait for the application to fully load."
        );
        return;
      }

      if (!this.uiManager.getConfig().BASE_LOG_DIR) {
        this.uiManager.showError(
          "Please configure the DreamBot Logs Directory first"
        );
        return;
      }

      this.logDisplay.addProgramLog(
        "🚀 Starting bot monitoring...",
        "monitoring",
        "info"
      );
      this.logDisplay.addProgramLog(
        `📂 Monitoring directory: ${this.uiManager.getConfig().BASE_LOG_DIR}`,
        "monitoring",
        "info"
      );

      const result = await window.electronAPI.startMonitoring(
        this.uiManager.getConfig()
      );
      if (result.success) {
        this.uiManager.showSuccess("Monitoring started successfully");
        this.logDisplay.addProgramLog(
          "✅ Bot monitoring started successfully",
          "monitoring",
          "success"
        );
      } else {
        this.uiManager.showError("Failed to start monitoring: " + result.error);
        this.logDisplay.addProgramLog(
          `❌ Failed to start monitoring: ${result.error}`,
          "monitoring",
          "error"
        );
      }
    } catch (error) {
      this.uiManager.showError("Failed to start monitoring: " + error.message);
      this.logDisplay.addProgramLog(
        `❌ Monitoring error: ${error.message}`,
        "monitoring",
        "error"
      );
    }
  }

  async stopMonitoring() {
    try {
      if (!this.isElectronAPIAvailable()) {
        this.uiManager.showError(
          "Electron API not available. Please wait for the application to fully load."
        );
        return;
      }

      this.logDisplay.addProgramLog(
        "🛑 Stopping bot monitoring...",
        "monitoring",
        "info"
      );

      const result = await window.electronAPI.stopMonitoring();
      if (result.success) {
        this.uiManager.showSuccess("Monitoring stopped successfully");
        this.logDisplay.addProgramLog(
          "✅ Bot monitoring stopped successfully",
          "monitoring",
          "success"
        );
      } else {
        this.uiManager.showError("Failed to stop monitoring: " + result.error);
        this.logDisplay.addProgramLog(
          `❌ Failed to stop monitoring: ${result.error}`,
          "monitoring",
          "error"
        );
      }
    } catch (error) {
      this.uiManager.showError("Failed to stop monitoring: " + error.message);
      this.logDisplay.addProgramLog(
        `❌ Stop monitoring error: ${error.message}`,
        "monitoring",
        "error"
      );
    }
  }

  isElectronAPIAvailable() {
    return window.electronAPI && typeof window.electronAPI === "object";
  }
}

export default EventHandlers;
