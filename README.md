# 🤖 DreamBot Bot Monitor

A Node.js application that monitors DreamBot log files and sends notifications to Discord webhooks for various events like chat messages, level ups, and quest completions.

Designed to work with [P2P Master AI script](https://dreambot.org/forums/index.php?/topic/26725-p2p-master-ai-machine-learning-1-click-account-builder/), untested with other scripts

## ✨ Features

- **📡 Real-time Log Monitoring**: Watches DreamBot log files for changes
- **💬 Chat Detection**: Monitors for chat messages and bot responses
- **🎯 Level Up Notifications**: Sends notifications when bots level up skills
- **🏆 Quest Completion**: Tracks and reports quest completions
- **🔗 Discord Integration**: Sends all notifications to configurable Discord webhooks
- **🤖 Multi-bot Support**: Monitor multiple bots simultaneously

## 📁 Project Structure

```
P2P-bot-monitor/
├── 📂 app/
│   ├── 📄 processLogFile.js    # Main log processing logic
│   ├── 📋 constants.js         # Application constants and patterns
│   └── 🛠️ utils/
│       ├── 📝 logger.js        # Centralized logging utility
│       ├── 💬 messageFormatter.js # Discord message formatting
│       ├── 📈 levelUpUtils.js  # Level up message formatting
│       ├── 🏆 questUtils.js    # Quest completion formatting
│       ├── 💤 breakUtils.js    # Break duration formatting
│       └── 🔗 webhookUtils.js  # Webhook URL management
├── 🛠️ utils/
│   └── ✅ configValidator.js   # Configuration validation
├── ⚙️ config.js                # Configuration file
├── 📋 baseConfig.js            # Base configuration template
├── 🚀 server.js                # Main application entry point
├── 📦 package.json             # Dependencies and scripts
├── 🖥️ bot-monitor.bat          # Windows batch file for easy startup
└── 📖 README.md                # This file
```

## ⚙️ Configuration

Create a `config.js` file with the following structure:

```javascript
const config = {
    // Directory containing DreamBot log files
    "BASE_LOG_DIR": "C:\\Users\\username\\DreamBot\\Logs",
    
    // Bot-specific webhook URLs for level up and quest notifications
    "BOT_NAMES_WITH_DISCORD_WEBHOOKS": {
        "MyBot1": "https://discord.com/api/webhooks/...",
        "MyBot2": "https://discord.com/api/webhooks/..."
    },
    
    // General webhook URL for chat messages
    "BOT_CHAT_WEBHOOK_URL": "https://discord.com/api/webhooks/..."
};

export default config;
```

**💡 Tip**: Use `baseConfig.js` as a starting template for your configuration!

## 🚀 Installation

1. **📥 Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd P2P-bot-monitor
   ```

2. **📦 Install dependencies**
   ```bash
   npm install
   ```

3. **⚙️ Configure your `config.js` file**, using `baseConfig.js` as a reference

4. **▶️ Start the application**
   1. Using npm
   ```bash
   npm start
   ```
   2. Using `bot-monitor.bat`

## 🎮 Usage

The application will:
1. ✅ Validate your configuration on startup
2. 👀 Begin monitoring the specified log directory
3. 🔄 Process new log entries in real-time
4. 📤 Send appropriate notifications to Discord webhooks

## 📊 Log Events

### 💬 Chat Messages
- **🔍 Pattern**: `[INFO] CHAT: <message>`
- **📤 Action**: Sends notification to general chat webhook

### 🤖 Bot Responses
- **🔍 Pattern**: `[INFO] SLOWLY TYPING RESPONSE: <response>`
- **📤 Action**: Sends notification with original chat and bot response

### 📈 Level Ups
- **🔍 Pattern**: `you've just advanced your <skill> level. You are now level <level>`
- **📤 Action**: Sends notification to bot-specific webhook

### 🏆 Quest Completions
- **🔍 Pattern**: `completed a quest: <col=...><quest_name></col>`
- **📤 Action**: Sends notification to bot-specific webhook

### ☕ Bot Breaks
- **🔍 Pattern**: `[SCRIPT] Break length <milliseconds>`
- **📤 Action**: Sends notification to bot-specific webhook with human-readable duration
- **💡 Example**: `[SCRIPT] Break length 12860461` → "💤 **Bot Break Started!**\n**Bot:** MyBot\n**Break Duration:** 3 hours 34 minutes 20 seconds"

### ✅ Break Finished
- **🔍 Pattern**: `[SCRIPT] Break over`
- **📤 Action**: Sends notification to bot-specific webhook when break ends
- **💡 Example**: `[SCRIPT] Break over` → "✅ **Bot Break Finished!**\n**Bot:** MyBot\n**Status:** Back to work!"

## 🛠️ Development

### 🔧 Adding New Log Patterns
1. ➕ Add the regex pattern to `app/constants.js`
2. 🆕 Create a processing function in `app/processLogFile.js`
3. 🔗 Add the pattern matching logic to `processLogLine()`

### 💬 Adding New Message Types
1. 📝 Define the message format in `app/constants.js`
2. 🎨 Create a formatter function in `app/utils/messageFormatter.js`
3. 🔄 Update the monitor to use the new formatter

## 📦 Dependencies

- **chokidar**: File system watching
- **axios**: HTTP requests for webhooks
- **Node.js**: Built-in modules for file system and streams

## 🚨 Troubleshooting

### ❌ Common Issues

1. **📁 Log directory not found**
   - Verify the `BASE_LOG_DIR` path in `config.js`
   - Ensure DreamBot logging is enabled
   - Check file permissions

2. **🔗 Webhook errors**
   - Verify Discord webhook URLs are correct
   - Check Discord server permissions
   - Ensure webhook URLs haven't expired

3. **📤 No notifications**
   - Confirm bot names match DreamBot log folder names
   - Check console output for error messages
   - Verify webhook configurations

### 📝 Log Files
- Check console output for real-time status
- Monitor for error messages and webhook failures

**🎮 Happy Bot Monitoring!** 🚀
