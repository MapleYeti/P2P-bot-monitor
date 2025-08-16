# DreamBot Bot Monitor

A modern Electron application for monitoring DreamBot logs and sending notifications to Discord webhooks.

## 🚀 Features

- **Real-time Log Monitoring**: Watch DreamBot log files for activity
- **Discord Integration**: Send notifications to Discord channels via webhooks
- **Bot-Specific Webhooks**: Configure different webhooks for different bots
- **Modern UI**: Clean, responsive interface built with modern web technologies
- **Cross-Platform**: Works on Windows, macOS, and Linux

## 📁 Project Structure

```
DreamBotBotMonitor/
├── src/                          # Source code
│   ├── main/                     # Main process (Electron)
│   │   └── main.js              # Main process entry point
│   ├── preload/                  # Preload scripts
│   │   └── preload.cjs          # Preload script for security
│   ├── renderer/                 # Renderer process (UI)
│   │   ├── index.html           # Main HTML interface
│   │   ├── renderer.js          # UI logic and interactions
│   │   └── styles.css           # Application styling
│   ├── utils/                    # Utility functions
│   │   ├── logger.js            # Logging utilities
│   │   ├── configValidator.js   # Configuration validation
│   │   ├── webhookUtils.js      # Discord webhook utilities
│   │   ├── messageFormatter.js  # Message formatting
│   │   ├── skillUtils.js        # Skill-related utilities
│   │   ├── breakUtils.js        # Break detection utilities
│   │   ├── processLogFile.js    # Log file processing
│   │   └── constants.js         # Application constants
│   └── shared/                   # Shared utilities (future use)
├── resources/                     # Build resources (icons, etc.)
├── dist/                         # Build output directory
├── package.json                  # Project configuration
├── bozon.js                      # Bozon build configuration
└── README.md                     # This file
```

## 🛠️ Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd DreamBotBotMonitor
```

2. Install dependencies:

```bash
npm install
```

3. Start development mode:

```bash
npm run dev
```

### Available Scripts

- `npm run dev` - Start development mode with hot reload
- `npm run start` - Start production mode
- `npm run test` - Run tests
- `npm run build` - Build for current platform
- `npm run build:win` - Build for Windows
- `npm run build:mac` - Build for macOS
- `npm run build:linux` - Build for Linux
- `npm run package` - Package the application
- `npm run dist` - Create distributable packages

## 🏗️ Building

### Development Build

```bash
npm run build
```

### Production Build

```bash
npm run dist
```

### Platform-Specific Builds

```bash
# Windows
npm run build:win
npm run dist:win

# macOS
npm run build:mac
npm run dist:mac

# Linux
npm run build:linux
npm run dist:linux
```

## ⚙️ Configuration

The application uses a configuration file (`config.json`) to store:

- **BASE_LOG_DIR**: Directory containing DreamBot log files
- **BOT_CHAT_WEBHOOK_URL**: General Discord webhook for chat notifications
- **BOT_CONFIG**: Bot-specific configurations including webhooks and CLI commands

### Example Configuration

```json
{
  "BASE_LOG_DIR": "C:\\Users\\username\\DreamBot\\Logs",
  "BOT_CHAT_WEBHOOK_URL": "https://discord.com/api/webhooks/...",
  "BOT_CONFIG": {
    "MyBot1": {
      "webhookUrl": "https://discord.com/api/webhooks/...",
      "launchCLI": ""
    },
    "MyBot2": {
      "webhookUrl": "https://discord.com/api/webhooks/...",
      "launchCLI": "java -jar DreamBot.jar -script MyScript -world 301"
    }
  }
}
```

## 🔧 Architecture

### Main Process (`src/main/main.js`)

- Manages Electron window lifecycle
- Handles IPC communication
- Manages file system operations
- Coordinates between renderer and system

### Preload Script (`src/preload/preload.cjs`)

- Securely exposes Node.js APIs to renderer
- Manages context isolation
- Handles IPC setup

### Renderer Process (`src/renderer/`)

- User interface components
- Event handling and user interactions
- Communication with main process via IPC

### Utilities (`src/utils/`)

- Business logic and helper functions
- Configuration management
- Log processing and webhook handling

## 🚀 Deployment

### Windows

- Creates NSIS installer
- Output: `dist/DreamBotBotMonitor Setup.exe`

### macOS

- Creates DMG package
- Output: `dist/DreamBotBotMonitor.dmg`

### Linux

- Creates AppImage
- Output: `dist/DreamBotBotMonitor.AppImage`

## 📝 License

ISC License - see LICENSE file for details.

## 👨‍💻 Author

**MapleYeti** - [GitHub](https://github.com/MapleYeti)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 🐛 Issues

Please report bugs and feature requests through the GitHub issues page.
