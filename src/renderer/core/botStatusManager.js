class BotStatusManager {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.botStatuses = new Map(); // Map to store bot statuses
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Listen for configuration changes to update bot list
    document.addEventListener("configUpdated", () => {
      this.updateBotStatusList();
    });
  }

  /**
   * Update the bot status list display
   */
  updateBotStatusList() {
    const botStatusList = document.getElementById("botStatusList");
    if (!botStatusList) return;

    const config = this.uiManager.getConfig();
    const botNames = Object.keys(config.BOT_CONFIG || {});

    // Clear existing list
    botStatusList.innerHTML = "";

    if (botNames.length === 0) {
      botStatusList.innerHTML = `
        <div class="bot-status-row">
          <span class="bot-name">No bots configured</span>
          <span class="bot-status">-</span>
          <span class="bot-actions">-</span>
        </div>
      `;
      return;
    }

    // Add each bot to the status list
    botNames.forEach((botName) => {
      // Initialize status to unknown if not already set
      if (!this.botStatuses.has(botName)) {
        this.botStatuses.set(botName, "unknown");
      }

      const botStatus = this.botStatuses.get(botName);
      const statusRow = this.createBotStatusRow(botName, botStatus);
      botStatusList.appendChild(statusRow);
    });
  }

  /**
   * Create a bot status row element
   */
  createBotStatusRow(botName, status) {
    const row = document.createElement("div");
    row.className = "bot-status-row";
    row.dataset.botName = botName;

    const statusInfo = this.getStatusInfo(status);
    const config = this.uiManager.getConfig();
    const botConfig = config.BOT_CONFIG[botName];

    row.innerHTML = `
      <span class="bot-name">${botName}</span>
      <div class="bot-status">
        <span class="status-indicator-bot ${status}"></span>
        <span class="status-text-bot">${statusInfo.text}</span>
      </div>
      <div class="bot-actions">
        ${
          botConfig?.launchCLI
            ? `<button type="button" class="btn btn-small btn-secondary launch-bot-btn" data-bot-name="${botName}">🚀 Launch</button>`
            : ""
        }
      </div>
    `;

    // Add event listeners
    const launchBtn = row.querySelector(".launch-bot-btn");
    if (launchBtn) {
      launchBtn.addEventListener("click", () => this.launchBot(botName));
    }

    return row;
  }

  /**
   * Get status information for display
   */
  getStatusInfo(status) {
    switch (status) {
      case "running":
        return { text: "Running", color: "#38a169" };
      case "stopped":
        return { text: "Stopped", color: "#e53e3e" };
      case "unknown":
      default:
        return { text: "Unknown", color: "#d69e2e" };
    }
  }

  /**
   * Update the status of a specific bot
   */
  updateBotStatus(botName, status) {
    this.botStatuses.set(botName, status);

    // Update the display if the bot is currently shown
    const existingRow = document.querySelector(`[data-bot-name="${botName}"]`);
    if (existingRow) {
      const statusIndicator = existingRow.querySelector(
        ".status-indicator-bot"
      );
      const statusText = existingRow.querySelector(".status-text-bot");

      if (statusIndicator && statusText) {
        statusIndicator.className = `status-indicator-bot ${status}`;
        statusText.textContent = this.getStatusInfo(status).text;
      }
    }
  }

  /**
   * Launch a bot using its CLI command
   */
  async launchBot(botName) {
    try {
      const config = this.uiManager.getConfig();
      const botConfig = config.BOT_CONFIG[botName];

      if (!botConfig?.launchCLI) {
        this.uiManager.showError(`No launch command configured for ${botName}`);
        return;
      }

      this.uiManager.showInfo(`Launching ${botName}...`);

      const result = await window.electronAPI.launchCLI(botConfig.launchCLI);
      if (result.success) {
        this.uiManager.showSuccess(
          `${botName} launch command executed successfully`
        );
        // Update status to running after a short delay
        setTimeout(() => {
          this.updateBotStatus(botName, "running");
        }, 2000);
      } else {
        this.uiManager.showError(
          `Failed to launch ${botName}: ${result.error}`
        );
      }
    } catch (error) {
      this.uiManager.showError(`Failed to launch ${botName}: ${error.message}`);
    }
  }

  /**
   * Get all bot statuses
   */
  getAllBotStatuses() {
    return Object.fromEntries(this.botStatuses);
  }

  /**
   * Reset all bot statuses to unknown
   */
  resetAllStatuses() {
    const config = this.uiManager.getConfig();
    const botNames = Object.keys(config.BOT_CONFIG || {});

    botNames.forEach((botName) => {
      this.botStatuses.set(botName, "unknown");
    });

    this.updateBotStatusList();
  }

  /**
   * Check if any bots are running
   */
  hasRunningBots() {
    return Array.from(this.botStatuses.values()).some(
      (status) => status === "running"
    );
  }
}

export default BotStatusManager;
