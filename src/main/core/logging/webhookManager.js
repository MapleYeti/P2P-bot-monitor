export function getBotWebhookUrl(botName, config) {
  console.log(`🔍 Looking up webhook for bot: "${botName}"`);
  console.log(`📋 Available bots:`, Object.keys(config.BOT_CONFIG || {}));

  if (!config.BOT_CONFIG[botName]) {
    console.log(`❌ No config found for bot: "${botName}"`);
    return null; // Return null instead of throwing error
  }

  if (!config.BOT_CONFIG[botName].webhookUrl) {
    console.log(`❌ No webhook URL found for bot: "${botName}"`);
    return null; // Return null instead of throwing error
  }

  console.log(`✅ Webhook found for bot: "${botName}"`);
  return config.BOT_CONFIG[botName].webhookUrl;
}
