# P2P Bot Monitor

A real-time monitoring system for RuneScape bots that tracks chat interactions, level-ups, and quest completions, sending notifications to Discord via webhooks.

## 🎯 Features

- **Real-time Log Monitoring**: Watches DreamBot log files for instant updates
- **Chat Detection**: Monitors bot chat interactions and responses
- **Level-up Tracking**: Automatically detects and reports skill level advancements
- **Quest Completion**: Tracks quest completions across all monitored bots
- **Discord Integration**: Sends formatted notifications to Discord channels via webhooks
- **Multi-bot Support**: Monitor multiple bots simultaneously with individual webhook configurations

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **DreamBot** with logging enabled
- **P2P Master AI** Monitoring is designed to work with [P2P Master AI](https://dreambot.org/forums/index.php?/topic/26725-p2p-master-ai-machine-learning-1-click-account-builder/), not tested with other scripts
- **Discord Webhook URLs** for your notification channels

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd P2P-bot-monitor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure the application**
   - Modify `config.js` settings (see Configuration section below)
   - Set up your Discord webhooks

4. **Start the monitor**
   ```bash
   npm start
   ```
   Or run the bot-monitor.bat file

## ⚙️ Configuration

The `config.js` file contains all the necessary settings for the bot monitor:

### Basic Configuration

```javascript
const config = {
    // Directory to DreamBot Log Files
    "BASE_LOG_DIR": "C:\\Users\\YourUsername\\DreamBot\\Logs",
    
    // Bot names and their Discord webhook URLs
    "BOT_NAMES_WITH_DISCORD_WEBHOOKS": {
        "MyBot1": "https://discord.com/api/webhooks/1234567890123456789/abcdefghijklmnopqrstuvwxyz",
        "MyBot2": "https://discord.com/api/webhooks/9876543210987654321/zyxwvutsrqponmlkjihgfedcba"
    },
    
    // Webhook URL for bot chat messages
    "BOT_CHAT_WEBHOOK_URL": "https://discord.com/api/webhooks/1111111111111111111/chatwebhookurl"
}
```

### Configuration Options

| Setting | Description | Example |
|---------|-------------|---------|
| `BASE_LOG_DIR` | Path to your DreamBot logs directory | `"C:\\Users\\username\\DreamBot\\Logs"` |
| `BOT_NAMES_WITH_DISCORD_WEBHOOKS` | Object mapping bot names to their webhook URLs | `"BotName": "webhook_url"` |
| `BOT_CHAT_WEBHOOK_URL` | Webhook URL for chat message notifications | Discord webhook URL |

### Setting Up Discord Webhooks

1. **Create a Discord webhook:**
   - Go to your Discord server settings
   - Navigate to Integrations → Webhooks
   - Click "New Webhook"
   - Copy the webhook URL

2. **Configure bot-specific webhooks:**
   - Create separate webhooks for each bot (recommended)
   - Use the `BOT_NAMES_WITH_DISCORD_WEBHOOKS` object to map bot names to webhooks

3. **Configure chat webhook:**
   - Create a webhook for general chat notifications
   - Use the `BOT_CHAT_WEBHOOK_URL` setting

## 📁 Project Structure

```
P2P-bot-monitor/
├── config.js              # Configuration file
├── server.js              # Main server application
├── package.json           # Node.js dependencies
├── utils/                 # Utility functions
│   ├── levelUpUtils.js    # Level-up message formatting
│   ├── questUtils.js      # Quest completion formatting
│   └── webhookUtils.js    # Webhook management
├── images/                # Bot and application images
└── bot-monitor-enhanced.bat  # Windows batch file for easy startup
```

## 🎮 Usage

### Starting the Monitor

**Option 1: Using npm scripts**
```bash
npm start          # Start the monitor
npm run dev        # Development mode
npm run monitor    # Alternative start command
```

**Option 2: Using the batch file (Windows)**
```bash
bot-monitor-enhanced.bat
```

**Option 3: Direct Node.js execution**
```bash
node server.js
```

### Monitoring Features

The system automatically detects and reports:

- **Chat Messages**: When bots receive chat messages
- **Bot Responses**: When bots respond to chat
- **Level-ups**: Skill level advancements
- **Quest Completions**: Finished quests

### Discord Notifications

The monitor sends formatted messages to Discord including:
- Bot name identification
- Skill level changes
- Quest completion details
- Chat interaction logs

## 🔧 Troubleshooting

### Common Issues

1. **Log directory not found**
   - Verify the `BASE_LOG_DIR` path in `config.js`
   - Ensure DreamBot logging is enabled
   - Check file permissions

2. **Webhook errors**
   - Verify Discord webhook URLs are correct
   - Check Discord server permissions
   - Ensure webhook URLs haven't expired

3. **No notifications**
   - Confirm bot names match DreamBot log folder names
   - Check console output for error messages
   - Verify webhook configurations

### Log Files

The monitor creates log files in the same directory:
- Check console output for real-time status
- Monitor for error messages and webhook failures

## 📦 Dependencies

- **axios**: HTTP client for Discord webhook requests
- **chokidar**: File system watching for log file monitoring
- **Node.js built-ins**: fs, path, readline for file operations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

If you encounter issues or need help:
1. Check the troubleshooting section above
2. Review the console output for error messages
3. Verify your configuration settings
4. Ensure all dependencies are properly installed

---

**Note**: This tool is designed for educational and monitoring purposes. Please ensure compliance with RuneScape's Terms of Service and your local laws regarding bot usage.
