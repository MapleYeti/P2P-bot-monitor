# RuneScape Bot Monitor - Project Structure

## Overview

This document outlines the organized project structure after the refactoring and folder organization. The application now follows a clean, modular architecture with logical file grouping.

## Directory Structure

```
P2P-bot-monitor/
├── src/
│   ├── main/                           # Main process (Electron)
│   │   ├── core/                       # Core application modules
│   │   │   ├── windowManager.js        # Browser window management
│   │   │   ├── globalConfigManager.js  # Global configuration management
│   │   │   └── logMonitor.js          # Log file monitoring
│   │   ├── ipc/                        # Inter-process communication
│   │   │   └── ipcHandlers.js         # IPC handlers for renderer communication
│   │   └── main.js                     # Main process entry point
│   │
│   ├── renderer/                       # Renderer process (UI)
│   │   ├── core/                       # Core UI modules
│   │   │   ├── uiManager.js            # UI state management
│   │   │   ├── configUI.js             # Configuration UI logic
│   │   │   ├── logDisplay.js           # Log display and management
│   │   │   └── eventHandlers.js        # Event handling and user interactions
│   │   ├── renderer.js                 # Renderer process entry point
│   │   ├── index.html                  # Main HTML template
│   │   └── styles.css                  # Application styles
│   │
│   ├── preload/                        # Preload scripts
│   │   ├── index.js                    # Preload entry point
│   │   └── preload.cjs                 # CommonJS preload script
│   │
│   ├── main/                           # Main process (Electron)
│   ├── core/                       # Core application modules
│   │   ├── windowManager.js        # Browser window management
│   │   ├── configManager.js        # Global configuration management
│   │   ├── configFileManager.js    # Configuration file operations
│   │   ├── logMonitor.js          # Log file monitoring
│   │   ├── constants.js            # Application constants
│   │   ├── logging/                # Logging and webhook management
│   │   │   ├── logger.js           # Logging utilities
│   │   │   └── webhookManager.js   # Webhook management
│   │   └── processing/             # Log processing and message formatting
│   │       ├── logProcessor.js     # Log file processing (renamed from processLogFile.js)
│   │       ├── messageFormatter.js # Message formatting
│   │       ├── skillProcessor.js   # Skill-related utilities (renamed from skillUtils.js)
│   │       └── breakProcessor.js   # Break detection utilities (renamed from breakUtils.js)
│   ├── ipc/                        # Inter-process communication
│   │   └── ipcHandlers.js         # IPC handlers for renderer communication
│   └── main.js                     # Main process entry point
│   │
│   └── shared/                         # Shared resources
│
├── config/                              # Configuration files
│   ├── environments/                    # Environment-specific configs
│   │   ├── development.json
│   │   ├── production.json
│   │   └── test.json
│   ├── platforms/                       # Platform-specific configs
│   │   ├── linux.json
│   │   ├── mac.json
│   │   └── windows.json
│   └── settings.json                    # Main settings
│
├── resources/                           # Application resources
│   ├── icon.icns                       # macOS icon
│   └── icon.ico                        # Windows icon
│
├── logs/                                # Application logs
├── test/                                # Test files
├── package.json                         # Node.js dependencies and scripts
├── package-lock.json                    # Dependency lock file
├── eslint.config.mjs                    # ESLint configuration
├── jest.config.js                       # Jest testing configuration
├── preload.cjs                          # Root preload script
├── REFACTORING_GUIDE.md                 # Refactoring documentation
└── PROJECT_STRUCTURE.md                 # This file
```

## Module Organization

### Main Process (`src/main/`)

#### Core Modules (`src/main/core/`)

- **`windowManager.js`** - Handles Electron BrowserWindow creation, lifecycle, and events
- **`globalConfigManager.js`** - Global configuration management and access
- **`configFileManager.js`** - Configuration file operations (load, save, import)
- **`logMonitor.js`** - Handles log file watching and processing using chokidar
- **`constants.js`** - Application constants and configuration

#### Logging & Processing (`src/main/core/logging/` & `src/main/core/processing/`)

- **`logger.js`** - Centralized logging utilities
- **`webhookManager.js`** - Webhook management and communication
- **`logProcessor.js`** - Log file processing and analysis
- **`messageFormatter.js`** - Message formatting and templates
- **`skillProcessor.js`** - Skill-related utilities and processing
- **`breakProcessor.js`** - Break detection and processing

#### IPC Modules (`src/main/ipc/`)

- **`ipcHandlers.js`** - Centralizes all IPC communication between main and renderer processes

#### Entry Point

- **`main.js`** - Main process entry point that orchestrates all modules

### Renderer Process (`src/renderer/`)

#### Core UI Modules (`src/renderer/core/`)

- **`uiManager.js`** - Manages UI state, updates, and notifications
- **`configUI.js`** - Handles configuration UI logic and accordion functionality
- **`logDisplay.js`** - Manages log display and formatting
- **`eventHandlers.js`** - Handles all user interactions and events

#### UI Files

- **`renderer.js`** - Renderer process entry point that initializes UI modules
- **`index.html`** - Main HTML template
- **`styles.css`** - Application styling

### Utilities (Integrated into Main Process)

Utility functions have been reorganized and integrated into the main process modules:

- **Global configuration management** → `src/main/core/globalConfigManager.js`
- **File-based configuration** → `src/main/core/configFileManager.js`
- **Configuration validation** → `src/main/core/configFileManager.js` (integrated)
- **Logging utilities** → `src/main/core/logging/logger.js`
- **Webhook utilities** → `src/main/core/logging/webhookManager.js`
- **Message formatting** → `src/main/core/processing/messageFormatter.js`
- **Log processing** → `src/main/core/processing/logProcessor.js`
- **Skill utilities** → `src/main/core/processing/skillProcessor.js`
- **Break utilities** → `src/main/core/processing/breakProcessor.js`

## Benefits of This Organization

### 1. **Logical Grouping**

- **Core modules** contain the main business logic
- **IPC modules** handle inter-process communication
- **UI modules** are grouped by functionality
- **Utilities** are shared across the application

### 2. **Clear Dependencies**

- Main process modules are clearly separated
- Renderer modules are organized by UI responsibility
- Import paths clearly show module relationships

### 3. **Easier Navigation**

- Developers can quickly find related functionality
- Clear separation between main and renderer processes
- Logical grouping makes the codebase more intuitive

### 4. **Scalability**

- Easy to add new modules in appropriate folders
- Clear structure for future enhancements
- Consistent organization pattern

## Import Paths

### Main Process

```javascript
// From main.js
import WindowManager from "./core/windowManager.js";
import GlobalConfigManager from "./core/globalConfigManager.js";
import LogMonitor from "./core/logMonitor.js";
import IPCHandlers from "./ipc/ipcHandlers.js";
```

### Renderer Process

```javascript
// From renderer.js
import UIManager from "./core/uiManager.js";
import ConfigUI from "./core/configUI.js";
import LogDisplay from "./core/logDisplay.js";
import EventHandlers from "./core/eventHandlers.js";
```

## Adding New Modules

### Adding a New Main Process Module

```bash
# Create new module in appropriate folder
touch src/main/core/newFeature.js
# or
touch src/main/ipc/newIpcHandler.js
```

### Adding a New Renderer Module

```bash
# Create new UI module
touch src/renderer/core/newUIComponent.js
```

### Adding a New Utility

```bash
# Create new utility
touch src/utils/newUtility.js
```

## File Naming Conventions

- **Modules**: Use PascalCase (e.g., `WindowManager.js`)
- **Utilities**: Use camelCase (e.g., `configValidator.js`)
- **Configuration**: Use kebab-case (e.g., `development.json`)
- **Directories**: Use camelCase (e.g., `core/`, `ipc/`)

## Migration Notes

This structure was created by:

1. **Refactoring** large monolithic files into focused modules
2. **Organizing** modules into logical folders
3. **Updating** import paths to reflect new structure
4. **Cleaning up** unused boilerplate files

## Future Considerations

### 1. **Testing Structure**

Consider organizing tests to mirror the source structure:

```
test/
├── main/
│   ├── core/
│   └── ipc/
├── renderer/
│   └── core/
└── utils/
```

### 2. **TypeScript Migration**

If migrating to TypeScript, maintain the same folder structure:

```
src/
├── main/
│   ├── core/
│   │   └── *.ts
│   └── ipc/
│       └── *.ts
└── renderer/
    └── core/
        └── *.ts
```

### 3. **Documentation**

Each module folder could contain:

- `README.md` - Module overview
- `API.md` - Module API documentation
- `examples/` - Usage examples

## Conclusion

The new project structure provides:

- **Better organization** with logical file grouping
- **Clearer dependencies** between modules
- **Easier navigation** for developers
- **Improved scalability** for future development
- **Consistent patterns** across the codebase

This structure makes the RuneScape Bot Monitor application much more maintainable and easier to understand for both current and future developers.
