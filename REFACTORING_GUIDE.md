# Refactoring Guide: RuneScape Bot Monitor

## Overview

This document outlines the refactoring changes made to improve separation of concerns and maintainability of the RuneScape Bot Monitor application.

## Before Refactoring

The application had several large files doing too many things:

- `src/main/main.js` (304 lines) - Mixed window management, IPC handling, log monitoring, and configuration
- `src/renderer/renderer.js` (1005 lines) - Mixed UI management, event handling, configuration, and logging

## After Refactoring

The application now follows a clean modular architecture with focused responsibilities:

### Main Process (`src/main/`)

- **`main.js`** - Main entry point and orchestration
- **`windowManager.js`** - Browser window creation and management
- **`configManager.js`** - Configuration file operations (load, save, import)
- **`logMonitor.js`** - Log file monitoring and processing
- **`ipcHandlers.js`** - IPC communication between main and renderer processes

### Renderer Process (`src/renderer/`)

- **`renderer.js`** - Main renderer entry point and orchestration
- **`uiManager.js`** - UI state management and updates
- **`configUI.js`** - Configuration UI logic and accordion handling
- **`logDisplay.js`** - Log display and management
- **`eventHandlers.js`** - Event handling and user interactions

## Benefits of Refactoring

### 1. **Single Responsibility Principle**

Each module now has a single, well-defined responsibility:

- `WindowManager` only handles window creation and lifecycle
- `ConfigManager` only handles configuration persistence
- `LogMonitor` only handles log file watching and processing
- `UIManager` only handles UI state and updates

### 2. **Improved Maintainability**

- Easier to locate and fix bugs
- Easier to add new features
- Clearer code organization
- Reduced cognitive load when working on specific features

### 3. **Better Testability**

- Each module can be tested in isolation
- Dependencies are clearly defined and injectable
- Easier to mock dependencies for testing

### 4. **Enhanced Reusability**

- Modules can be reused in different contexts
- Clear interfaces between modules
- Easier to swap implementations

### 5. **Cleaner Dependencies**

- Clear dependency flow from main entry points
- Reduced circular dependencies
- Better separation between main and renderer processes

## Module Dependencies

### Main Process

```
main.js
├── windowManager.js
├── configManager.js
├── logMonitor.js (depends on windowManager)
└── ipcHandlers.js (depends on all three)
```

### Renderer Process

```
renderer.js
├── uiManager.js
├── configUI.js (depends on uiManager)
├── logDisplay.js (depends on uiManager)
└── eventHandlers.js (depends on all three)
```

## Key Changes Made

### 1. **Extracted Window Management**

- Moved all BrowserWindow creation logic to `WindowManager`
- Centralized window event handling
- Added helper methods for renderer communication

### 2. **Separated Configuration Logic**

- Moved configuration file operations to `ConfigManager`
- Centralized configuration validation and defaults
- Cleaner import/export functionality

### 3. **Isolated Log Monitoring**

- Moved chokidar setup and file watching to `LogMonitor`
- Centralized log processing logic
- Cleaner separation from IPC handling

### 4. **Centralized IPC Handling**

- All IPC handlers now in one place
- Clearer communication patterns
- Easier to add new IPC methods

### 5. **Modular UI Components**

- UI state management separated from event handling
- Configuration UI logic isolated
- Log display functionality modularized

## Usage Examples

### Adding a New IPC Handler

```javascript
// In ipcHandlers.js
ipcMain.handle("new-feature", async (event, data) => {
  // Handle new feature
  return { success: true };
});
```

### Adding a New UI Component

```javascript
// Create new module: src/renderer/newFeatureUI.js
class NewFeatureUI {
  constructor(uiManager) {
    this.uiManager = uiManager;
  }

  // Implementation
}

// In renderer.js
import NewFeatureUI from "./newFeatureUI.js";
const newFeatureUI = new NewFeatureUI(uiManager);
```

### Adding a New Configuration Field

```javascript
// In configManager.js
async validateConfig(config) {
  // Add validation for new field
  if (!config.NEW_FIELD) {
    config.NEW_FIELD = "default_value";
  }
  return config;
}
```

## Migration Notes

### 1. **ES6 Modules**

- All files now use ES6 import/export syntax
- HTML updated to use `type="module"` for renderer script

### 2. **Global References**

- Some onclick handlers still use global references for backward compatibility
- These can be refactored to use proper event delegation in future iterations

### 3. **Error Handling**

- Error handling patterns are now consistent across modules
- Each module handles its own errors and communicates them appropriately

## Future Improvements

### 1. **Event Delegation**

- Replace global onclick handlers with proper event delegation
- Use custom events for inter-module communication

### 2. **State Management**

- Consider implementing a proper state management pattern
- Add reactive updates for configuration changes

### 3. **TypeScript**

- Consider migrating to TypeScript for better type safety
- Add proper interfaces for module contracts

### 4. **Testing**

- Add unit tests for each module
- Add integration tests for module interactions
- Add end-to-end tests for user workflows

## Conclusion

The refactoring significantly improves the codebase's maintainability and follows modern JavaScript/Electron best practices. The modular structure makes it easier to understand, test, and extend the application while maintaining clear separation of concerns.
