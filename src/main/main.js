import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "path";
import fs from "fs";
import chokidar from "chokidar";
import { fileURLToPath } from "url";
import { processLogFile } from "../utils/processLogFile.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

// Log monitoring state
let logWatcher = null;
let fileOffsets = new Map();
let currentConfig = {};

function createWindow() {
  const preloadPath = path.join(__dirname, "..", "preload", "preload.cjs");
  console.log("=== PRELOAD SCRIPT DEBUGGING ===");
  console.log("Current directory (__dirname):", __dirname);
  console.log("Preload script path:", preloadPath);
  console.log("Preload script absolute path:", path.resolve(preloadPath));
  console.log("Process working directory:", process.cwd());

  // Check if preload file exists
  if (!fs.existsSync(preloadPath)) {
    console.error("❌ Preload script not found at:", preloadPath);
    return;
  }

  console.log("✅ Preload script found and will be loaded");

  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
    },
    icon: path.join(__dirname, "assets/icon.png"),
    title: "RuneScape Bot Monitor",
  });

  mainWindow.loadFile(path.join(__dirname, "..", "renderer", "index.html"));

  // Open DevTools in development
  if (process.argv.includes("--dev")) {
    mainWindow.webContents.openDevTools();
  }

  // Debug preload script loading
  mainWindow.webContents.on("did-finish-load", () => {
    console.log("✅ Window finished loading");
  });

  mainWindow.webContents.on("preload-error", (event, preloadPath, error) => {
    console.error("❌ Preload script error:", error);
    console.error("Preload path:", preloadPath);
  });

  mainWindow.webContents.on("did-start-loading", () => {
    console.log("🔄 Window started loading");
  });

  mainWindow.webContents.on("dom-ready", () => {
    console.log("✅ DOM ready");
  });

  mainWindow.webContents.on(
    "console-message",
    (event, level, message, line, sourceId) => {
      console.log(
        `Renderer console [${level}]: ${message} (${sourceId}:${line})`
      );
    }
  );

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC Handlers
ipcMain.handle("select-directory", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
    title: "Select DreamBot Logs Directory",
  });

  if (!result.canceled) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle("load-config", async () => {
  try {
    const configPath = path.join(process.cwd(), "config.json");
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
      return { success: true, config };
    } else {
      return { success: false, error: "No configuration file found" };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("save-config", async (event, config) => {
  try {
    const configPath = path.join(process.cwd(), "config.json");
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("start-monitoring", async (event, config) => {
  try {
    if (logWatcher) {
      logWatcher.close();
    }

    if (!config.BASE_LOG_DIR || !fs.existsSync(config.BASE_LOG_DIR)) {
      return { success: false, error: "Invalid logs directory" };
    }

    // Store config for use in log processing
    currentConfig = config;

    // Initialize file offsets for existing log files
    const existingFiles = fs.readdirSync(config.BASE_LOG_DIR);
    for (const file of existingFiles) {
      const filePath = path.join(config.BASE_LOG_DIR, file);
      if (fs.statSync(filePath).isFile() && file.endsWith(".log")) {
        fileOffsets.set(filePath, fs.statSync(filePath).size);
      }
    }

    logWatcher = chokidar.watch(config.BASE_LOG_DIR, {
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

    logWatcher
      .on("add", (filePath) => {
        try {
          if (fs.statSync(filePath).isFile() && filePath.endsWith(".log")) {
            const fileSize = fs.statSync(filePath).size;
            fileOffsets.set(filePath, fileSize);

            mainWindow.webContents.send("log-event", {
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
            await processLogFile(filePath, fileOffsets, currentConfig);

            // Send log event to renderer
            mainWindow.webContents.send("log-event", {
              type: "log-entry",
              entry: {
                timestamp: new Date().toISOString(),
                file: path.basename(filePath),
                content: "Log file processed",
              },
            });
          }
        } catch (err) {
          console.error("Error processing file change:", err);
        }
      })
      .on("ready", () => {
        console.log("✅ Log monitoring started successfully");
        mainWindow.webContents.send("monitoring-status", {
          isMonitoring: true,
        });
        mainWindow.webContents.send("log-event", {
          type: "status",
          message: "Monitoring started successfully",
          timestamp: new Date().toISOString(),
        });
      });

    return { success: true };
  } catch (error) {
    console.error("Error starting monitoring:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("stop-monitoring", async () => {
  try {
    if (logWatcher) {
      logWatcher.close();
      logWatcher = null;
    }
    mainWindow.webContents.send("monitoring-status", { isMonitoring: false });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("get-monitoring-status", () => {
  return { isMonitoring: logWatcher !== null };
});
