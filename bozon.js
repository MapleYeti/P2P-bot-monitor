module.exports = {
  // Main process entry point
  main: "src/main/main.js",

  // Renderer process entry point
  renderer: "src/renderer/index.html",

  // Preload script
  preload: "src/preload/preload.cjs",

  // Build configuration
  build: {
    // Output directory
    output: "dist",

    // Build resources directory
    buildResources: "resources",

    // Files to include in the build
    files: [
      "src/**/*",
      "package.json",
      "!src/**/*.test.js",
      "!src/**/*.spec.js",
    ],

    // Platform-specific configurations
    win: {
      target: "nsis",
      icon: "resources/icon.ico",
    },

    mac: {
      target: "dmg",
      icon: "resources/icon.icns",
      category: "public.app-category.utilities",
    },

    linux: {
      target: "AppImage",
      icon: "resources/icon.png",
    },
  },

  // Development configuration
  dev: {
    // Development server port
    port: 3000,

    // Hot reload enabled
    hotReload: true,

    // Open DevTools in development
    openDevTools: true,
  },
};
