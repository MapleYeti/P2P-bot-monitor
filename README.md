# DreamBot Bot Monitor

A modern application for monitoring DreamBot logs, managing bot configurations, and launching bots via CLI commands. Features real-time Discord notifications and an intuitive configuration interface.

## 🚀 Features

### **Bot Monitoring**

- **Real-time Log Monitoring**: Watch DreamBot log files for activity with live updates
- **Discord Integration**: Send notifications to Discord channels via webhooks
- **Bot-Specific Webhooks**: Configure different webhooks for different bots
- **Smart Log Processing**: Automatically detects breaks, skill gains, quest completions and other events

#### **Webhook Events**

The application automatically detects and sends Discord notifications for the following events:

- 🎯 **Skill Gains**: Level ups, experience milestones, and skill advancements
- ⏸️ **Break Detection**: When bots take breaks or resume
- 🏆 **Quest Completions**: Finished quests and achievements
- 💰 **Valuable Drops**: Based on in-game valuable drop chat message (ensure you have this enabled and the threshold set)
- 💀 **Bot Death**: Whenever your bot dies

### **Bot Management**

- **CLI Bot Launching**: Start and stop bots directly from the application (requires DreamBot VIP)
- **Bot Status Monitoring**: Real-time tracking of running/stopped bot processes

## 🖥️ How to Use

### **Getting Started**

1. **Clone the Repository**: Clone the repository to your local machine
2. **Install Dependencies**: Run `npm install` to install required packages
3. **Start the Application**: Run `npm start` to launch the program
4. **First Launch**: The application will start with default settings
5. **Configure Log Directory**: Set the path to your DreamBot logs folder
6. **Add Discord Webhooks**: Configure webhook URLs for notifications (optional)
7. **Add Your Bots**: Configure each bot with their settings and webhooks

### **Monitoring Your Bots**

1. **Start Monitoring**: Click the "Start Monitoring" button to begin watching log files
2. **View Live Logs**: See real-time log events in the live log display
3. **Bot Status**: Monitor which bots are currently running in the bot status table
4. **Discord Notifications**: Receive alerts for important events via webhooks

### **Managing Bot Configurations**

1. **Add a New Bot**: Click "Add Bot" to create a new bot configuration
2. **Configure Webhooks**: Set Discord webhook URLs for bot-specific notifications
3. **Set Launch Commands**: Configure CLI commands for launching bots (VIP feature)
4. **Edit Settings**: Modify existing bot configurations as needed
5. **Save Changes**: Click "Save Configuration" to apply your changes

### **Launching Bots (VIP Feature)**

**Requirements:**

- DreamBot VIP subscription
- Enable "DreamBot VIP Features" in configuration

**How to Use:**

1. **Configure Launch Commands**: Set the CLI command for each bot
2. **Launch Bot**: Click the "🚀 Launch" button in the bot status table
3. **Monitor Process**: Watch the bot status change to "running"
4. **Stop Bot**: Click the "🛑 Stop" button to terminate the process

**Example Launch Command:**

```
java -Xmx255M -jar C:\Users\username\Dreambot\BotData\client.jar -script "P2P Master AI" -world 403 -username user@email.com -password password123 -account MyBot -covert -params default
```

### **Configuration Management**

1. **Save Configuration**: Always save after making changes
2. **Import Configuration**: Load previously exported configurations
3. **Export Configuration**: Backup your current settings
4. **Undo Changes**: Revert unsaved modifications
5. **Validation**: Fix any configuration errors before saving

## ⚙️ Configuration Options

### **Required Settings**

- **Log Directory**: Path to your DreamBot logs folder

### **Optional Settings**

- **Bot Names**: Names of the bots you want to monitor
- **General Chat Webhook**: Discord webhook for general notifications
- **Bot-Specific Webhooks**: Individual webhooks for each bot
- **DreamBot VIP Features**: Enable/disable CLI launching capabilities
- **Launch CLI Commands**: Command-line instructions for starting bots

### **Configuration File Location**

- **Windows**: `%APPDATA%\DreamBotBotMonitor\config.json`
- **macOS**: `~/Library/Application Support/DreamBotBotMonitor/config.json`
- **Linux**: `~/.config/DreamBotBotMonitor/config.json`

## 🔧 Troubleshooting

### **Common Issues**

**Configuration Not Saving**

- Check for validation errors in the configuration status
- Ensure all required fields are filled
- Try the "Undo Changes" button and reconfigure

**Bot Status Not Updating**

- Verify the log directory path is correct
- Check that log files are being written to the directory
- Restart monitoring if needed

**CLI Launching Not Working**

- Confirm DreamBot VIP subscription is active
- Enable "DreamBot VIP Features" in configuration
- Verify launch commands are correctly formatted
- Check that Java and DreamBot paths are correct

**Discord Notifications Not Working**

- Verify webhook URLs are correct and active
- Check Discord server permissions for the webhook
- Test webhook URLs in a browser

### **Getting Help**

- Check the configuration status for error messages
- Review the live logs for detailed information
- Ensure all paths and URLs are correctly formatted

## 👨‍💻 Author

**MapleYeti** - [GitHub](https://github.com/MapleYeti)
