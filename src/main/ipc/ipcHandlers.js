import { ipcMain, dialog, shell } from "electron";
import { spawn } from "child_process";
import path from "path";

class IPCHandlers {
  constructor(windowManager, configFileManager, logMonitor) {
    this.windowManager = windowManager;
    this.configManager = configFileManager; // Keep the property name for compatibility
    this.logMonitor = logMonitor;
    this.trackedProcesses = new Map(); // Map to track launched processes and their status
    this.setupHandlers();
  }

  setupHandlers() {
    // Directory selection
    ipcMain.handle("select-directory", async () => {
      const mainWindow = this.windowManager.getMainWindow();
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ["openDirectory"],
        title: "Select DreamBot Logs Directory",
      });

      if (!result.canceled) {
        return result.filePaths[0];
      }
      return null;
    });

    // Configuration management
    ipcMain.handle("load-config", async () => {
      return await this.configManager.loadConfig();
    });

    ipcMain.handle("save-config", async (event, config) => {
      return await this.configManager.saveConfig(config);
    });

    ipcMain.handle("import-config", async () => {
      const mainWindow = this.windowManager.getMainWindow();
      return await this.configManager.importConfig(mainWindow);
    });

    ipcMain.handle("export-config", async (event, config) => {
      const mainWindow = this.windowManager.getMainWindow();
      return await this.configManager.exportConfig(mainWindow, config);
    });

    // Monitoring control
    ipcMain.handle("start-monitoring", async (event, config) => {
      return await this.logMonitor.startMonitoring(config);
    });

    ipcMain.handle("stop-monitoring", async () => {
      return await this.logMonitor.stopMonitoring();
    });

    ipcMain.handle("get-monitoring-status", () => {
      return this.logMonitor.getMonitoringStatus();
    });

    // Launch CLI command
    ipcMain.handle("launch-cli", async (event, command) => {
      try {
        console.log(`Launching CLI command: ${command}`);

        // Use child_process.spawn to execute the command directly in a new terminal
        const child = spawn("cmd", ["/k", command], {
          detached: true,
          stdio: "ignore",
          shell: true,
        });

        // Track the child process directly
        this.trackedProcesses.set(child.pid, {
          process: child,
          command: command,
          status: "running",
        });

        // Set up event listeners for the child process
        child.on("exit", (code, signal) => {
          console.log(
            `Process ${child.pid} exited with code ${code} and signal ${signal}`
          );
          this.trackedProcesses.delete(child.pid);

          // Notify renderer process that this process has exited
          this.notifyProcessExited(child.pid, code, signal);
        });

        child.on("error", (error) => {
          console.error(`Process ${child.pid} error:`, error);
          this.trackedProcesses.delete(child.pid);
        });

        // Unreference the child process so it can run independently
        child.unref();

        return { success: true, pid: child.pid };
      } catch (error) {
        console.error("Failed to launch CLI:", error);
        return { success: false, error: error.message };
      }
    });

    // Check process status
    ipcMain.handle("check-process-status", async (event, pid) => {
      try {
        console.log(`Checking process status for PID: ${pid}`);

        // Check if process is still running
        const isRunning = await this.isProcessRunning(pid);

        console.log(`Process ${pid} is running: ${isRunning}`);
        return { isRunning };
      } catch (error) {
        console.error("Failed to check process status:", error);
        return { isRunning: false, error: error.message };
      }
    });

    // Get status of all tracked processes
    ipcMain.handle("get-tracked-processes", () => {
      const processes = {};
      this.trackedProcesses.forEach((info, pid) => {
        processes[pid] = {
          command: info.command,
          status: info.status,
          hasDirectReference: !!info.process,
        };
      });
      return processes;
    });

    // Debug: Get detailed tracking information
    ipcMain.handle("debug-tracked-processes", () => {
      const debugInfo = {
        totalProcesses: this.trackedProcesses.size,
        processes: Array.from(this.trackedProcesses.entries()),
        details: {},
      };

      this.trackedProcesses.forEach((info, pid) => {
        debugInfo.details[pid] = {
          ...info,
          processAlive: info.process ? !info.process.killed : "N/A",
          hasExitListener: info.process
            ? !!info.process.listenerCount("exit")
            : "N/A",
        };
      });

      return debugInfo;
    });
  }

  // Method to remove all handlers (useful for cleanup)
  removeHandlers() {
    ipcMain.removeHandler("select-directory");
    ipcMain.removeHandler("load-config");
    ipcMain.removeHandler("save-config");
    ipcMain.removeHandler("import-config");
    ipcMain.removeHandler("export-config");
    ipcMain.removeHandler("start-monitoring");
    ipcMain.removeHandler("stop-monitoring");
    ipcMain.removeHandler("get-monitoring-status");
    ipcMain.removeHandler("launch-cli");
    ipcMain.removeHandler("check-process-status");
    ipcMain.removeHandler("get-tracked-processes");
    ipcMain.removeHandler("debug-tracked-processes");
  }

  /**
   * Notify renderer process that a tracked process has exited
   */
  notifyProcessExited(pid, code, signal) {
    try {
      const mainWindow = this.windowManager.getMainWindow();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("process-exited", {
          pid: pid,
          code: code,
          signal: signal,
        });
        console.log(`Notified renderer that process ${pid} exited`);
      }
    } catch (error) {
      console.error(
        `Error notifying renderer about process ${pid} exit:`,
        error
      );
    }
  }

  /**
   * Check if a process is still running by its PID
   */
  async isProcessRunning(pid) {
    try {
      // First check if we're tracking this process
      const trackedProcess = this.trackedProcesses.get(pid);
      if (trackedProcess && trackedProcess.process) {
        // If we have a direct reference to the process, check if it's still alive
        return !trackedProcess.process.killed;
      }

      // Fallback to tasklist for processes we can't track directly
      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const execAsync = promisify(exec);

      const result = await execAsync(
        `tasklist /FI "PID eq ${pid}" /FO CSV /NH`
      );

      // If the process is running, tasklist will return a line with the PID
      // If not running, it will return "INFO: No tasks are running which match the specified criteria."
      const isRunning =
        !result.stdout.includes("No tasks are running") &&
        result.stdout.includes(pid.toString());

      return isRunning;
    } catch (error) {
      console.error(`Error checking if process ${pid} is running:`, error);
      return false;
    }
  }
}

export default IPCHandlers;
