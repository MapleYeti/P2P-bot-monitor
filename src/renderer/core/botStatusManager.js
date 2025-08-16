class BotStatusManager {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.botStatuses = new Map(); // Map to store bot statuses
    this.botProcesses = new Map(); // Map to store bot process PIDs
    this.processCheckFailures = new Map(); // Map to track consecutive failures
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Listen for configuration changes to update bot list
    document.addEventListener("configUpdated", () => {
      this.updateBotStatusList();
    });

    // Listen for process exit events from main process
    if (window.electronAPI && window.electronAPI.onProcessExited) {
      window.electronAPI.onProcessExited((event, data) => {
        this.handleProcessExited(data.pid, data.code, data.signal);
      });
    }

    // Set up debug button
    const debugBtn = document.getElementById("debugTrackingBtn");
    if (debugBtn) {
      debugBtn.addEventListener("click", () => {
        this.debugTracking();
      });
    }
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
        // Store the process PID for status monitoring
        if (result.pid) {
          this.botProcesses.set(botName, result.pid);
          this.updateBotStatus(botName, "running");

          // Verify the process is actually running after a short delay
          setTimeout(async () => {
            await this.updateBotStatusFromProcess(botName);
          }, 2000);
        }

        this.uiManager.showSuccess(
          `${botName} launch command executed successfully`
        );
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
   * Force refresh all bot statuses by checking their processes
   */
  async refreshAllBotStatuses() {
    const config = this.uiManager.getConfig();
    const botNames = Object.keys(config.BOT_CONFIG || {});

    for (const botName of botNames) {
      if (this.botProcesses.has(botName)) {
        await this.updateBotStatusFromProcess(botName);
      }
    }
  }

  /**
   * Manually check a specific bot's process status
   */
  async checkBotStatus(botName) {
    if (this.botProcesses.has(botName)) {
      await this.updateBotStatusFromProcess(botName);
    } else {
      console.log(`Bot ${botName} has no tracked process`);
    }
  }

  /**
   * Debug: Get detailed tracking information from main process
   */
  async debugTracking() {
    try {
      console.log("=== DEBUG TRACKING INFO ===");
      const debugInfo = await window.electronAPI.debugTrackedProcesses();
      console.log("Debug info:", debugInfo);

      console.log("=== BOT STATUS MANAGER STATE ===");
      console.log("Bot statuses:", Object.fromEntries(this.botStatuses));
      console.log("Bot processes:", Object.fromEntries(this.botProcesses));
      console.log(
        "Process check failures:",
        Object.fromEntries(this.processCheckFailures)
      );

      console.log("=== END DEBUG ===");
    } catch (error) {
      console.error("Error getting debug info:", error);
    }
  }

  /**
   * Check if a specific bot process is still running
   */
  async checkBotProcessStatus(botName) {
    const pid = this.botProcesses.get(botName);
    if (!pid) {
      return "unknown";
    }

    try {
      // First check if we have tracked process information
      const trackedProcesses = await window.electronAPI.getTrackedProcesses();
      const trackedProcess = trackedProcesses[pid];

      if (trackedProcess && trackedProcess.hasDirectReference) {
        // Use the direct process status check
        const result = await window.electronAPI.checkProcessStatus(pid);
        return result.isRunning ? "running" : "stopped";
      }

      // Fallback to regular process status check
      const result = await window.electronAPI.checkProcessStatus(pid);

      // Reset failure count on successful check
      this.processCheckFailures.delete(botName);

      if (result.isRunning) {
        return "running";
      } else {
        // Process is no longer running, remove it from tracking
        this.botProcesses.delete(botName);
        this.processCheckFailures.delete(botName);
        console.log(
          `Process ${pid} for ${botName} has stopped, removed from tracking`
        );
        return "stopped";
      }
    } catch (error) {
      console.error(`Error checking process status for ${botName}:`, error);

      // Increment failure count
      const failureCount = (this.processCheckFailures.get(botName) || 0) + 1;
      this.processCheckFailures.set(botName, failureCount);

      // After 3 consecutive failures, assume the process has stopped
      if (failureCount >= 3) {
        console.log(
          `Process ${pid} for ${botName} failed ${failureCount} times, removing from tracking`
        );
        this.botProcesses.delete(botName);
        this.processCheckFailures.delete(botName);
        return "stopped";
      }

      // Return unknown for temporary failures
      return "unknown";
    }
  }

  /**
   * Update bot status based on actual process status
   */
  async updateBotStatusFromProcess(botName) {
    const status = await this.checkBotProcessStatus(botName);
    this.updateBotStatus(botName, status);
  }

  /**
   * Handle process exit event from main process
   */
  handleProcessExited(pid, code, signal) {
    // Find which bot this PID belongs to
    let botName = null;
    for (const [name, botPid] of this.botProcesses.entries()) {
      if (botPid === pid) {
        botName = name;
        break;
      }
    }

    if (botName) {
      // Remove the process from tracking
      this.botProcesses.delete(botName);

      // Update the bot status to stopped
      this.updateBotStatus(botName, "stopped");

      // Update the display
      this.updateBotStatusList();
    }
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
