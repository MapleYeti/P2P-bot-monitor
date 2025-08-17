class BotStatusManager {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.botStatuses = new Map(); // Map to store bot statuses
    this.botProcesses = new Map(); // Map to store bot process PIDs
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
            ? `<button type="button" class="btn btn-small btn-secondary action-btn" data-bot-name="${botName}">${
                status === "running" ? "🛑 Stop" : "🚀 Launch"
              }</button>`
            : ""
        }
      </div>
    `;

    // Add event listeners
    const actionBtn = row.querySelector(".action-btn");
    if (actionBtn) {
      // Store the current status in the button's data attribute for reference
      actionBtn.setAttribute("data-current-status", status);

      actionBtn.addEventListener("click", (event) => {
        const button = event.target;
        const currentStatus = button.getAttribute("data-current-status");

        if (currentStatus === "running") {
          this.terminateBot(botName);
        } else {
          this.launchBot(botName);
        }
      });
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
      const actionBtn = existingRow.querySelector(".action-btn");

      if (statusIndicator && statusText) {
        statusIndicator.className = `status-indicator-bot ${status}`;
        statusText.textContent = this.getStatusInfo(status).text;
      }

      // Update button text and data attribute based on new status
      if (actionBtn) {
        actionBtn.textContent = status === "running" ? "🛑 Stop" : "🚀 Launch";
        actionBtn.setAttribute("data-current-status", status);
      }
    }
  }

  /**
   * Terminate a running bot
   */
  async terminateBot(botName) {
    try {
      const pid = this.botProcesses.get(botName);

      if (!pid) {
        this.uiManager.showError(`No running process found for ${botName}`);
        return;
      }

      this.uiManager.showInfo(`Stopping ${botName}...`);

      const result = await window.electronAPI.terminateProcess(pid);

      if (result.success) {
        // Remove from tracking and update status
        this.botProcesses.delete(botName);
        this.updateBotStatus(botName, "stopped");
        // Don't call updateBotStatusList() here as it recreates all rows and loses event listeners

        this.uiManager.showSuccess(`${botName} has been stopped`);
      } else {
        this.uiManager.showError(`Failed to stop ${botName}: ${result.error}`);
      }
    } catch (error) {
      console.error(`Error in terminateBot:`, error);
      this.uiManager.showError(`Failed to stop ${botName}: ${error.message}`);
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
   * Check if a specific bot process is still running
   */
  async checkBotProcessStatus(botName) {
    const pid = this.botProcesses.get(botName);
    if (!pid) {
      return "unknown";
    }

    try {
      // Check if we have tracked process information
      const trackedProcesses = await window.electronAPI.getTrackedProcesses();
      const trackedProcess = trackedProcesses[pid];

      if (trackedProcess && trackedProcess.hasDirectReference) {
        const result = await window.electronAPI.checkProcessStatus(pid);
        return result.isRunning ? "running" : "stopped";
      }

      // Fallback to regular process status check
      const result = await window.electronAPI.checkProcessStatus(pid);

      if (result.isRunning) {
        return "running";
      } else {
        // Process is no longer running, remove it from tracking
        this.botProcesses.delete(botName);
        return "stopped";
      }
    } catch (error) {
      console.error(`Error checking process status for ${botName}:`, error);
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

      // Update the display to refresh button text
      this.updateBotStatusList();
    }
  }
}

export default BotStatusManager;
