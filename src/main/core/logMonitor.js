import fs from "fs";
import chokidar from "chokidar";
import { processLogFile } from "./processing/logProcessor.js";
import { setGlobalConfig } from "./globalConfigManager.js";
import path from "path";

class LogMonitor {
  constructor(windowManager) {
    this.windowManager = windowManager;
    this.logWatcher = null;
    this.fileOffsets = new Map();
    this.currentConfig = {};
    this.isMonitoring = false;
  }

  async startMonitoring(config) {
    try {
      if (this.logWatcher) {
        this.logWatcher.close();
      }

      if (!config.BASE_LOG_DIR || !fs.existsSync(config.BASE_LOG_DIR)) {
        return { success: false, error: "Invalid logs directory" };
      }

      // Store config for use in log processing
      this.currentConfig = config;

      // Set global config for log processor
      setGlobalConfig(config);

      // Initialize file offsets for existing log files
      const existingFiles = fs.readdirSync(config.BASE_LOG_DIR);
      for (const file of existingFiles) {
        const filePath = path.join(config.BASE_LOG_DIR, file);
        if (fs.statSync(filePath).isFile() && file.endsWith(".log")) {
          this.fileOffsets.set(filePath, fs.statSync(filePath).size);
        }
      }

      this.logWatcher = chokidar.watch(config.BASE_LOG_DIR, {
        persistent: true,
        usePolling: true,
        interval: 1000,
        ignoreInitial: false,
        ignored: (filePath) => {
          try {
            return (
              !filePath.endsWith(".log") && !fs.statSync(filePath).isDirectory()
            );
          } catch {
            return false;
          }
        },
      });

      this.setupWatcherEvents();
      this.isMonitoring = true;

      return { success: true };
    } catch (error) {
      console.error("Error starting monitoring:", error);
      return { success: false, error: error.message };
    }
  }

  setupWatcherEvents() {
    this.logWatcher
      .on("add", (filePath) => {
        try {
          if (fs.statSync(filePath).isFile() && filePath.endsWith(".log")) {
            const fileSize = fs.statSync(filePath).size;
            this.fileOffsets.set(filePath, fileSize);

            this.windowManager.sendToRenderer("log-event", {
              type: "file-added",
              file: path.basename(filePath),
              timestamp: new Date().toISOString(),
            });

            console.log(`📁 New log file detected: ${path.basename(filePath)}`);
          }
        } catch (err) {
          console.error("Error processing new file:", err);
        }
      })
      .on("change", async (filePath) => {
        try {
          if (fs.statSync(filePath).isFile() && filePath.endsWith(".log")) {
            // Process the log file using our processLogFile function
            await processLogFile(filePath, this.fileOffsets, (eventData) => {
              // Send webhook events to the frontend log display
              this.windowManager.sendToRenderer("log-event", eventData);
            });

            // // Send log event to renderer
            // this.windowManager.sendToRenderer("log-event", {
            //   type: "log-entry",
            //   entry: {
            //     timestamp: new Date().toISOString(),
            //     file: path.basename(filePath),
            //     content: "Log file processed",
            //   },
            // });
          }
        } catch (err) {
          console.error("Error processing file change:", err);
        }
      })
      .on("ready", () => {
        console.log("✅ Log monitoring started successfully");
        this.windowManager.sendToRenderer("monitoring-status", {
          isMonitoring: true,
        });
        this.windowManager.sendToRenderer("log-event", {
          type: "status",
          message: "Monitoring started successfully",
          timestamp: new Date().toISOString(),
        });
      });
  }

  stopMonitoring() {
    try {
      if (this.logWatcher) {
        this.logWatcher.close();
        this.logWatcher = null;
      }
      this.isMonitoring = false;
      this.windowManager.sendToRenderer("monitoring-status", {
        isMonitoring: false,
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getMonitoringStatus() {
    return { isMonitoring: this.isMonitoring };
  }

  getCurrentConfig() {
    return this.currentConfig;
  }

  /**
   * Update the current configuration and sync with log processor
   * @param {Object} newConfig - New configuration object
   */
  updateConfig(newConfig) {
    this.currentConfig = newConfig;
    setGlobalConfig(newConfig);
    console.log("🔧 Log monitor configuration updated");
  }
}

export default LogMonitor;
