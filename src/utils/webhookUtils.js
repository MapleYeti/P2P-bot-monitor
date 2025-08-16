export function getBotWebhookUrl(botName, config) {
  if (!config.BOT_NAMES_WITH_DISCORD_WEBHOOKS[botName]) {
    throw new Error(`No webhook URL found for bot: ${botName}`);
  }
  return config.BOT_NAMES_WITH_DISCORD_WEBHOOKS[botName];
}
