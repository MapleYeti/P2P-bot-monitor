class LogDisplay {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.logsDisplay = document.getElementById("logsDisplay");
    this.setupInitialState();
  }

  setupInitialState() {
    if (this.logsDisplay) {
      this.logsDisplay.innerHTML =
        '<div class="no-logs">📋 Program output will appear here when monitoring is active.</div>';
    }
  }

  handleLogEvent(data) {
    switch (data.type) {
      case "log-entry":
        this.addLogEntry({
          timestamp: data.timestamp,
          type: "log-entry",
          content: data.content,
          level: data.level || "info",
        });
        break;
      case "file-added":
        this.addLogEntry({
          timestamp: data.timestamp,
          type: "file-added",
          content: `📁 New log file detected: ${data.file}`,
          level: "info",
        });
        break;
      case "status":
        this.addLogEntry({
          timestamp: data.timestamp,
          type: "status",
          content: `🔄 ${data.message}`,
          level: "success",
        });
        break;
    }
  }

  addProgramLog(message, type = "info", level = "info") {
    this.addLogEntry({
      timestamp: new Date().toISOString(),
      type: type,
      content: message,
      level: level,
    });
  }

  addLogEntry(entry) {
    if (!this.logsDisplay) return;

    const logElement = document.createElement("div");
    logElement.className = `log-entry log-entry-${entry.level || "info"}`;

    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const levelIcon = this.getLevelIcon(entry.level);
    const typeLabel = this.getTypeLabel(entry.type);

    console.log(entry);
    logElement.innerHTML = `
      <div class="log-header">
        <span class="timestamp">${timestamp}</span>
        <span class="type-badge">${typeLabel}</span>
        <span class="level-icon">${levelIcon}</span>
      </div>
      <div class="content">${entry.content}</div>
    `;

    this.logsDisplay.appendChild(logElement);
    this.logsDisplay.scrollTop = this.logsDisplay.scrollHeight;

    // Remove old logs if too many
    const logs = this.logsDisplay.querySelectorAll(".log-entry");
    if (logs.length > 100) {
      logs[0].remove();
    }
  }

  getLevelIcon(level) {
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

  getTypeLabel(type) {
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

  clearLogs() {
    if (this.logsDisplay) {
      this.logsDisplay.innerHTML =
        '<div class="no-logs">📋 Program output will appear here when monitoring is active.</div>';
    }
  }
}

export default LogDisplay;
