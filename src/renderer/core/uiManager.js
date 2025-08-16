class UIManager {
  constructor() {
    this.isMonitoring = false;
    this.currentConfig = {
      BASE_LOG_DIR: "",
      BOT_CHAT_WEBHOOK_URL: "",
      BOT_CONFIG: {},
    };
  }

  setMonitoringStatus(isMonitoring) {
    this.isMonitoring = isMonitoring;
    this.updateUI();
  }

  setConfig(config) {
    this.currentConfig = { ...config };
    this.emitConfigUpdated();
  }

  getConfig() {
    return { ...this.currentConfig };
  }

  updateConfigField(field, value) {
    this.currentConfig[field] = value;
    this.emitConfigUpdated();
  }

  updateUI() {
    this.updateStatusIndicator();
    this.updateButtonStates();
    this.updateConfigurationStatus();
  }

  updateStatusIndicator() {
    const statusDot = document.getElementById("statusDot");
    const statusText = document.getElementById("statusText");

    if (statusDot && statusText) {
      if (this.isMonitoring) {
        statusDot.classList.add("active");
        statusText.textContent = "Monitoring";
      } else {
        statusDot.classList.remove("active");
        statusText.textContent = "Stopped";
      }
    }
  }

  updateButtonStates() {
    const toggleBtn = document.getElementById("toggleMonitoringBtn");

    if (toggleBtn) {
      if (this.isMonitoring) {
        toggleBtn.textContent = "Stop Monitoring";
        toggleBtn.className = "btn btn-danger";
      } else {
        toggleBtn.textContent = "Start Monitoring";
        toggleBtn.className = "btn btn-success";
      }
    }
  }

  updateConfigurationStatus() {
    const configStatusIcon = document.getElementById("configStatusIcon");
    const configStatusText = document.getElementById("configStatusText");

    if (!configStatusIcon || !configStatusText) return;

    const hasLogsDir =
      this.currentConfig.BASE_LOG_DIR &&
      this.currentConfig.BASE_LOG_DIR.trim() !== "";
    const hasWebhooks = Object.keys(this.currentConfig.BOT_CONFIG).length > 0;

    if (hasLogsDir && hasWebhooks) {
      configStatusIcon.textContent = "✅";
      configStatusText.textContent = "Complete";
      configStatusIcon.style.color = "#38a169";
    } else if (hasLogsDir || hasWebhooks) {
      configStatusIcon.textContent = "⚠️";
      configStatusText.textContent = "Partial";
      configStatusIcon.style.color = "#d69e2e";
    } else {
      configStatusIcon.textContent = "❌";
      configStatusText.textContent = "Not Configured";
      configStatusIcon.style.color = "#e53e3e";
    }
  }

  showStartupStatus(message, type = "info") {
    this.hideStartupStatus();

    const statusElement = document.createElement("div");
    statusElement.id = "startupStatus";
    statusElement.className = `startup-status startup-status-${type}`;
    statusElement.innerHTML = `
      <div class="startup-spinner"></div>
      <span>${message}</span>
    `;

    document.body.appendChild(statusElement);
    setTimeout(() => statusElement.classList.add("show"), 100);
  }

  hideStartupStatus() {
    const existingStatus = document.getElementById("startupStatus");
    if (existingStatus) {
      existingStatus.classList.remove("show");
      setTimeout(() => existingStatus.remove(), 300);
    }
  }

  showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add("show"), 100);

    setTimeout(() => {
      notification.classList.remove("show");
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  showSuccess(message) {
    this.showNotification(message, "success");
  }

  showError(message) {
    this.showNotification(message, "error");
  }

  showInfo(message) {
    this.showNotification(message, "info");
  }

  /**
   * Emit configuration updated event
   */
  emitConfigUpdated() {
    const event = new CustomEvent("configUpdated", {
      detail: { config: this.currentConfig },
    });
    document.dispatchEvent(event);
  }
}

export default UIManager;
