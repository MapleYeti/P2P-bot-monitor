export function getBotWebhookUrl(botName, config) {
  console.log(`🔍 Looking up webhook for bot: "${botName}"`);
  console.log(
    `📋 Available bots:`,
    Object.keys(config.BOT_NAMES_WITH_DISCORD_WEBHOOKS || {})
  );

  if (!config.BOT_NAMES_WITH_DISCORD_WEBHOOKS[botName]) {
    console.log(`❌ No webhook found for bot: "${botName}"`);
    return null; // Return null instead of throwing error
  }

  console.log(`✅ Webhook found for bot: "${botName}"`);
  return config.BOT_NAMES_WITH_DISCORD_WEBHOOKS[botName];
}
