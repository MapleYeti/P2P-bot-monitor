// Validation functions moved inline to avoid module import issues

class ConfigUI {
  constructor(uiManager, logDisplay) {
    this.uiManager = uiManager;
    this.logDisplay = logDisplay;
    this.originalConfig = null; // Store the original config from file
    this.setupAccordionHandlers();
    // Don't load config here - it will be loaded by renderer.js
  }

  /**
   * Set up accordion toggle functionality
   */
  setupAccordionHandlers() {
    const configAccordionHeader = document.getElementById(
      "configAccordionHeader"
    );
    const configAccordionToggle = document.getElementById(
      "configAccordionToggle"
    );
    const configAccordionContent = document.getElementById(
      "configAccordionContent"
    );

    if (
      configAccordionHeader &&
      configAccordionToggle &&
      configAccordionContent
    ) {
      // Toggle accordion when header is clicked
      configAccordionHeader.addEventListener("click", () =>
        this.toggleAccordion()
      );

      // Toggle accordion when toggle button is clicked
      configAccordionToggle.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent header click event
        this.toggleAccordion();
      });

      // Start with accordion collapsed by default
      this.collapseAccordion();
    }
  }

  /**
   * Toggle the accordion between expanded and collapsed states
   */
  toggleAccordion() {
    const configAccordionContent = document.getElementById(
      "configAccordionContent"
    );
    const configAccordionToggle = document.getElementById(
      "configAccordionToggle"
    );

    if (!configAccordionContent || !configAccordionToggle) return;

    if (configAccordionContent.classList.contains("expanded")) {
      this.collapseAccordion();
    } else {
      this.expandAccordion();
    }
  }

  /**
   * Expand the accordion content
   */
  expandAccordion() {
    const configAccordionContent = document.getElementById(
      "configAccordionContent"
    );
    const configAccordionToggle = document.getElementById(
      "configAccordionToggle"
    );

    if (!configAccordionContent || !configAccordionToggle) return;

    configAccordionContent.classList.add("expanded");
    const toggleIcon = configAccordionToggle.querySelector(".toggle-icon");
    if (toggleIcon) {
      toggleIcon.textContent = "▲";
    }
  }

  /**
   * Collapse the accordion content
   */
  collapseAccordion() {
    const configAccordionContent = document.getElementById(
      "configAccordionContent"
    );
    const configAccordionToggle = document.getElementById(
      "configAccordionToggle"
    );

    if (!configAccordionContent || !configAccordionToggle) return;

    configAccordionContent.classList.remove("expanded");
    const toggleIcon = configAccordionToggle.querySelector(".toggle-icon");
    if (toggleIcon) {
      toggleIcon.textContent = "▼";
    }
  }

  /**
   * Load the original configuration from file
   */
  async loadOriginalConfig() {
    try {
      // Load the original config from file
      this.originalConfig = await window.electronAPI.loadConfig();
      this.updateFormFields();
      this.updateBotsDisplay();
      this.updateConfigurationStatus();
    } catch (error) {
      console.error("Failed to load original config:", error);
    }
  }

  /**
   * Set the original configuration (creates a deep copy to avoid reference issues)
   */
  setOriginalConfig(config) {
    console.log("setOriginalConfig: Setting original config to:", config);
    // Create a deep copy to avoid reference issues
    this.originalConfig = JSON.parse(JSON.stringify(config));
    console.log(
      "setOriginalConfig: originalConfig is now:",
      this.originalConfig
    );
  }

  /**
   * Update the form fields with the original configuration values
   */
  updateFormFields() {
    const logsDir = document.getElementById("logsDir");
    const chatWebhook = document.getElementById("chatWebhook");

    if (logsDir && chatWebhook && this.originalConfig) {
      logsDir.value = this.originalConfig.BASE_LOG_DIR || "";
      chatWebhook.value = this.originalConfig.BOT_CHAT_WEBHOOK_URL || "";

      // Add event listeners to detect changes
      this.setupFormFieldListeners();
    }
  }

  /**
   * Set up event listeners for form field changes
   */
  setupFormFieldListeners() {
    const logsDir = document.getElementById("logsDir");
    const chatWebhook = document.getElementById("chatWebhook");

    if (logsDir) {
      logsDir.addEventListener("input", () => this.updateConfigurationStatus());
    }
    if (chatWebhook) {
      chatWebhook.addEventListener("input", () =>
        this.updateConfigurationStatus()
      );
    }
  }

  /**
   * Update the bots display (webhook URLs are now optional)
   */
  updateBotsDisplay() {
    const botWebhooks = document.getElementById("botWebhooks");
    if (!botWebhooks || !this.originalConfig) return;

    botWebhooks.innerHTML = "";
    const config = this.uiManager.getConfig();

    Object.entries(config.BOT_CONFIG).forEach(([name, botData]) => {
      const hasWebhook = botData.webhookUrl && botData.webhookUrl.trim() !== "";
      const hasLaunchCLI = botData.launchCLI && botData.launchCLI.trim() !== "";

      const item = document.createElement("div");
      item.className = "bot-webhook-item";
      item.innerHTML = `
          <span class="bot-name-display">${name}</span>
          <div class="bot-config-status">
                         <span class="config-item">
               <span class="status-icon">${hasWebhook ? "✅" : "⚪"}</span>
               <span class="status-text">Webhook ${
                 hasWebhook ? "Configured" : "Optional"
               }</span>
             </span>
                         <span class="config-item">
               <span class="status-icon">${hasLaunchCLI ? "✅" : "⚪"}</span>
               <span class="status-text">Launch CLI ${
                 hasLaunchCLI ? "Configured" : "Optional"
               }</span>
             </span>
          </div>
          <div class="bot-actions">
            <button type="button" class="btn btn-small btn-secondary edit-bot-btn" onclick="configUI.editBot('${name}')">Edit</button>
            <button type="button" class="btn btn-small btn-danger" onclick="configUI.removeBot('${name}')">Remove</button>
          </div>
        `;

      botWebhooks.appendChild(item);
    });

    this.updateConfigurationStatus();
  }

  /**
   * Show the add bot modal
   */
  showAddBotModal() {
    const botModal = document.getElementById("botModal");
    const botName = document.getElementById("botName");
    const botWebhook = document.getElementById("botWebhook");
    const botLaunchCLI = document.getElementById("botLaunchCLI");

    if (botModal && botName && botWebhook) {
      botModal.style.display = "block";
      botName.value = "";
      botWebhook.value = "";
      if (botLaunchCLI) botLaunchCLI.value = "";
      botName.focus();
    }
  }

  /**
   * Hide the add bot modal
   */
  hideAddBotModal() {
    const botModal = document.getElementById("botModal");
    if (botModal) {
      botModal.style.display = "none";
    }
  }

  /**
   * Add a new bot to the configuration
   */
  async addBot() {
    const botName = document.getElementById("botName");
    const botWebhook = document.getElementById("botWebhook");
    const botLaunchCLI = document.getElementById("botLaunchCLI");

    if (!botName || !botWebhook) return;

    const name = botName.value.trim();
    const webhook = botWebhook.value.trim();
    const launchCLI = botLaunchCLI ? botLaunchCLI.value.trim() : "";

    if (!name) {
      this.uiManager.showError("Bot name is required");
      return;
    }

    try {
      const config = this.uiManager.getConfig();

      // Always save in standardized format
      config.BOT_CONFIG[name] = {
        webhookUrl: webhook,
        launchCLI: launchCLI || "",
      };

      console.log("saveBot: Adding bot", name, "to config:", config.BOT_CONFIG);

      // Update the UI but don't save to disk yet
      this.uiManager.setConfig(config);
      this.updateBotsDisplay();
      this.updateConfigurationStatus();
      this.hideAddBotModal();
    } catch (error) {
      this.uiManager.showError("Failed to add bot: " + error.message);
    }
  }

  /**
   * Remove a bot from the configuration
   */
  async removeBot(botName) {
    try {
      const config = this.uiManager.getConfig();
      delete config.BOT_CONFIG[botName];

      // Update the UI but don't save to disk yet
      this.uiManager.setConfig(config);
      this.updateBotsDisplay();
      this.updateConfigurationStatus();
    } catch (error) {
      this.uiManager.showError("Failed to remove bot: " + error.message);
    }
  }

  /**
   * Edit a bot's configuration
   */
  editBot(botName) {
    const config = this.uiManager.getConfig();
    const webhookData = config.BOT_CONFIG[botName] || {};

    // Show the edit modal with current values
    this.showEditBotModal(
      botName,
      webhookData.webhookUrl || "",
      webhookData.launchCLI || ""
    );
  }

  /**
   * Show the edit bot modal with current values
   */
  showEditBotModal(botName, currentWebhook, currentLaunchCLI) {
    const editModal = document.getElementById("editBotModal");
    const editBotName = document.getElementById("editBotName");
    const editBotWebhook = document.getElementById("editBotWebhook");
    const editBotLaunchCLI = document.getElementById("editBotLaunchCLI");

    if (editModal && editBotName && editBotWebhook) {
      editModal.style.display = "block";
      editBotName.value = botName;
      editBotWebhook.value = currentWebhook;
      if (editBotLaunchCLI) editBotLaunchCLI.value = currentLaunchCLI;
      editBotWebhook.focus();
    }
  }

  /**
   * Hide the edit bot modal
   */
  hideEditBotModal() {
    const editModal = document.getElementById("editBotModal");
    if (editModal) {
      editModal.style.display = "none";
    }
  }

  /**
   * Save changes to an edited bot (webhook URL is optional)
   */
  async saveBotEdit() {
    const editBotName = document.getElementById("editBotName");
    const editBotWebhook = document.getElementById("editBotWebhook");
    const editBotLaunchCLI = document.getElementById("editBotLaunchCLI");

    if (!editBotName || !editBotWebhook) return;

    const name = editBotName.value.trim();
    const webhook = editBotWebhook.value.trim();
    const launchCLI = editBotLaunchCLI ? editBotLaunchCLI.value.trim() : "";

    if (!name) {
      this.uiManager.showError("Bot name is required");
      return;
    }

    try {
      const config = this.uiManager.getConfig();

      // Always save in standardized format
      config.BOT_CONFIG[name] = {
        webhookUrl: webhook,
        launchCLI: launchCLI || "",
      };

      // Update the UI but don't save to disk yet
      this.uiManager.setConfig(config);
      this.updateBotsDisplay();
      this.updateConfigurationStatus();
      this.hideEditBotModal();
    } catch (error) {
      this.uiManager.showError("Failed to update bot: " + error.message);
    }
  }

  /**
   * Save the current configuration to disk
   */
  async saveConfiguration() {
    try {
      const logsDir = document.getElementById("logsDir");
      const chatWebhook = document.getElementById("chatWebhook");

      if (!logsDir || !chatWebhook) return;

      const config = this.uiManager.getConfig();

      // Update the base config values from form fields
      config.BASE_LOG_DIR = logsDir.value.trim();
      config.BOT_CHAT_WEBHOOK_URL = chatWebhook.value.trim();

      // Validate the configuration before saving
      if (this.hasValidationErrors(this.uiManager.getConfig())) {
        const validationErrors = this.getValidationErrors(
          this.uiManager.getConfig()
        );
        const errorMsg =
          "Cannot save configuration with validation errors. Please fix the errors first.";

        // Show error in UI
        this.uiManager.showError(errorMsg);

        // Add detailed validation errors to live log
        this.logDisplay.addProgramLog(`❌ ${errorMsg}`, "config", "error");
        validationErrors.forEach((error) => {
          this.logDisplay.addProgramLog(`  • ${error}`, "config", "error");
        });

        // Show error status to indicate validation problems
        this.showValidationErrorStatus();
        return;
      }

      // Save configuration to disk
      const result = await window.electronAPI.saveConfig(config);
      if (result.success) {
        // Update the original config to match what was saved
        this.originalConfig = JSON.parse(JSON.stringify(config));
        this.uiManager.setConfig(config);
        this.updateConfigurationStatus();
        this.uiManager.showSuccess("Configuration saved successfully!");
        // Add to live log
        this.logDisplay.addProgramLog(
          "✅ Configuration saved successfully!",
          "config",
          "success"
        );
      } else {
        const errorMsg = "Failed to save configuration: " + result.error;
        this.uiManager.showError(errorMsg);
        // Add to live log
        this.logDisplay.addProgramLog(`❌ ${errorMsg}`, "config", "error");
      }
    } catch (error) {
      const errorMsg = "Failed to save configuration: " + error.message;
      this.uiManager.showError(errorMsg);
      // Add to live log
      this.logDisplay.addProgramLog(`❌ ${errorMsg}`, "config", "error");
    }
  }

  /**
   * Undo all unsaved changes and restore the original configuration
   */
  undoChanges() {
    try {
      // Restore the original config from file
      this.uiManager.setConfig(JSON.parse(JSON.stringify(this.originalConfig)));

      // Update form fields
      this.updateFormFields();

      // Update bots display
      this.updateBotsDisplay();

      // Update configuration status (this will show validation errors if they exist in the original config)
      this.updateConfigurationStatus();

      this.uiManager.showSuccess(
        "All changes have been undone. Configuration restored from file."
      );
    } catch (error) {
      this.uiManager.showError("Failed to undo changes: " + error.message);
    }
  }

  /**
   * Update the configuration status indicator and button states
   */
  updateConfigurationStatus() {
    const config = this.uiManager.getConfig();
    const hasUnsavedChanges = this.hasUnsavedChanges();
    const hasValidationErrors = this.hasValidationErrors(
      this.uiManager.getConfig()
    );

    // Update the config status indicator
    const configStatus = document.getElementById("configStatus");
    if (configStatus) {
      if (hasValidationErrors && !hasUnsavedChanges) {
        // Only show validation errors when there are no unsaved changes
        // This means the errors are from the loaded config, not from user input
        configStatus.textContent = "❌ Validation Errors";
        configStatus.className = "config-status error";
      } else if (hasUnsavedChanges) {
        configStatus.textContent = "⚠️ Unsaved Changes";
        configStatus.className = "config-status unsaved";
      } else {
        configStatus.textContent = "✅ Saved";
        configStatus.className = "config-status saved";
      }
    }

    // Enable/disable save and undo buttons
    const saveConfigBtn = document.getElementById("saveConfigBtn");
    const undoChangesBtn = document.getElementById("undoChangesBtn");

    if (saveConfigBtn) {
      // Enable save button whenever there are unsaved changes, regardless of validation errors
      // The user should be able to save their changes even if there are validation issues
      saveConfigBtn.disabled = !hasUnsavedChanges;
    }

    if (undoChangesBtn) {
      undoChangesBtn.disabled = !hasUnsavedChanges;
    }
  }

  /**
   * Show validation error status (overrides normal status logic)
   */
  showValidationErrorStatus() {
    const configStatus = document.getElementById("configStatus");
    if (configStatus) {
      configStatus.textContent = "❌ Validation Errors";
      configStatus.className = "config-status error";
    }
  }

  /**
   * Check if there are unsaved changes by comparing current config to original
   */
  hasUnsavedChanges() {
    if (!this.originalConfig) {
      console.log("hasUnsavedChanges: No originalConfig");
      return false;
    }

    console.log(
      "hasUnsavedChanges: originalConfig at start:",
      this.originalConfig
    );

    // Get current form field values
    const logsDir = document.getElementById("logsDir");
    const chatWebhook = document.getElementById("chatWebhook");

    if (!logsDir || !chatWebhook) {
      console.log("hasUnsavedChanges: Form fields not found");
      return false;
    }

    const currentLogsDir = logsDir.value.trim();
    const currentChatWebhook = chatWebhook.value.trim();

    // Check base config changes by comparing form field values to original config
    if (
      currentLogsDir !== (this.originalConfig.BASE_LOG_DIR || "") ||
      currentChatWebhook !== (this.originalConfig.BOT_CHAT_WEBHOOK_URL || "")
    ) {
      console.log("hasUnsavedChanges: Base config changed");
      return true;
    }

    // Check bot config changes
    const currentConfig = this.uiManager.getConfig();
    const originalBotNames = Object.keys(this.originalConfig.BOT_CONFIG || {});
    const currentBotNames = Object.keys(currentConfig.BOT_CONFIG || {});

    console.log("hasUnsavedChanges: Original bot names:", originalBotNames);
    console.log("hasUnsavedChanges: Current bot names:", currentBotNames);

    if (originalBotNames.length !== currentBotNames.length) {
      console.log("hasUnsavedChanges: Bot count changed");
      return true;
    }

    for (const botName of currentBotNames) {
      const originalBot = this.originalConfig.BOT_CONFIG[botName];
      const currentBot = currentConfig.BOT_CONFIG[botName];

      if (
        !originalBot ||
        originalBot.webhookUrl !== currentBot.webhookUrl ||
        originalBot.launchCLI !== currentBot.launchCLI
      ) {
        console.log(`hasUnsavedChanges: Bot ${botName} changed`);
        return true;
      }
    }

    console.log("hasUnsavedChanges: No changes detected");
    return false;
  }

  /**
   * Check if a string is a valid Discord webhook URL
   * @param {string} url - URL to validate
   * @returns {boolean} - Whether URL is valid
   */
  isValidWebhookUrl(url) {
    try {
      const urlObj = new URL(url);
      return (
        urlObj.hostname === "discord.com" &&
        urlObj.pathname.startsWith("/api/webhooks/") &&
        urlObj.pathname.split("/").length >= 4
      );
    } catch {
      return false;
    }
  }

  /**
   * Check if there are validation errors in the current configuration
   * @param {Object} config - Configuration object to validate
   * @returns {boolean} - Whether there are validation errors
   */
  hasValidationErrors(config) {
    try {
      // Check for required fields
      if (!config.BASE_LOG_DIR || !config.BASE_LOG_DIR.trim()) {
        return true;
      }

      // Check BOT_CHAT_WEBHOOK_URL if provided (it's optional but must be valid if present)
      if (config.BOT_CHAT_WEBHOOK_URL && config.BOT_CHAT_WEBHOOK_URL.trim()) {
        if (!this.isValidWebhookUrl(config.BOT_CHAT_WEBHOOK_URL)) {
          return true;
        }
      }

      // Check bot webhook URLs if they are provided
      if (config.BOT_CONFIG) {
        for (const [botName, botConfig] of Object.entries(config.BOT_CONFIG)) {
          // Webhook URL is optional, but if provided, it must be valid
          if (botConfig.webhookUrl && botConfig.webhookUrl.trim()) {
            if (!this.isValidWebhookUrl(botConfig.webhookUrl)) {
              return true;
            }
          }
        }
      }

      return false;
    } catch (error) {
      console.error("Error checking validation:", error);
      return true; // Assume there are errors if we can't check
    }
  }

  /**
   * Get detailed validation errors for the current configuration
   * This is a frontend-friendly version that returns user-friendly error messages
   * @param {Object} config - Configuration object to validate
   * @returns {Array} Array of user-friendly error messages
   */
  getValidationErrors(config) {
    const errors = [];

    // Check for required fields
    if (!config.BASE_LOG_DIR || !config.BASE_LOG_DIR.trim()) {
      errors.push("DreamBot Logs Directory is required");
    }

    // Check BOT_CHAT_WEBHOOK_URL if provided (it's optional but must be valid if present)
    if (config.BOT_CHAT_WEBHOOK_URL && config.BOT_CHAT_WEBHOOK_URL.trim()) {
      if (!this.isValidWebhookUrl(config.BOT_CHAT_WEBHOOK_URL)) {
        errors.push(
          "General Chat Webhook URL must be a valid Discord webhook URL"
        );
      }
    }

    // Check bot webhook URLs if they are provided
    if (config.BOT_CONFIG) {
      for (const [botName, botConfig] of Object.entries(config.BOT_CONFIG)) {
        // Webhook URL is optional, but if provided, it must be valid
        if (botConfig.webhookUrl && botConfig.webhookUrl.trim()) {
          if (!this.isValidWebhookUrl(botConfig.webhookUrl)) {
            errors.push(
              `Bot "${botName}" webhook URL must be a valid Discord webhook URL`
            );
          }
        }
      }
    }

    return errors;
  }
}

export default ConfigUI;
