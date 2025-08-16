import { BrowserWindow } from "electron";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class WindowManager {
  constructor() {
    this.mainWindow = null;
  }

  createMainWindow() {
    const preloadPath = path.join(
      __dirname,
      "..",
      "..",
      "preload",
      "preload.cjs"
    );

    this.mainWindow = new BrowserWindow({
      width: 1000,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: preloadPath,
      },
      icon: path.join(__dirname, "..", "..", "..", "resources", "icon.ico"),
      title: "RuneScape Bot Monitor",
    });

    // Update global reference for logger
    global.mainWindow = this.mainWindow;

    this.mainWindow.loadFile(
      path.join(__dirname, "..", "..", "renderer", "index.html")
    );

    // Open DevTools in development
    if (process.argv.includes("--dev")) {
      this.mainWindow.webContents.openDevTools();
    }

    this.setupWindowEvents();
    return this.mainWindow;
  }

  setupWindowEvents() {
    if (!this.mainWindow) return;

    // Debug preload script loading
    this.mainWindow.webContents.on("did-finish-load", () => {
      console.log("✅ Window finished loading");
    });

    this.mainWindow.webContents.on(
      "preload-error",
      (event, preloadPath, error) => {
        console.error("❌ Preload script error:", error);
        console.error("Preload path:", preloadPath);
      }
    );

    this.mainWindow.webContents.on("did-start-loading", () => {
      console.log("🔄 Window started loading");
    });

    this.mainWindow.webContents.on("dom-ready", () => {
      console.log("✅ DOM ready");
    });

    this.mainWindow.webContents.on(
      "console-message",
      (event, level, message, line, sourceId) => {
        console.log(
          `Renderer console [${level}]: ${message} (${sourceId}:${line})`
        );
      }
    );

    this.mainWindow.on("closed", () => {
      this.mainWindow = null;
      global.mainWindow = null;
    });
  }

  getMainWindow() {
    return this.mainWindow;
  }

  sendToRenderer(channel, data) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }

  isWindowDestroyed() {
    return !this.mainWindow || this.mainWindow.isDestroyed();
  }
}

export default WindowManager;
