class ConfigUI {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.setupAccordionHandlers();
  }

  setupAccordionHandlers() {
    const configAccordionHeader = document.getElementById(
      "configAccordionHeader"
    );
    const configAccordionToggle = document.getElementById(
      "configAccordionToggle"
    );
    const configAccordionContent = document.getElementById(
      "configAccordionContent"
    );

    if (
      configAccordionHeader &&
      configAccordionToggle &&
      configAccordionContent
    ) {
      // Toggle accordion when header is clicked
      configAccordionHeader.addEventListener("click", () =>
        this.toggleAccordion()
      );

      // Toggle accordion when toggle button is clicked
      configAccordionToggle.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent header click event
        this.toggleAccordion();
      });

      // Start with accordion collapsed by default
      this.collapseAccordion();
    }
  }

  toggleAccordion() {
    const configAccordionContent = document.getElementById(
      "configAccordionContent"
    );
    const configAccordionToggle = document.getElementById(
      "configAccordionToggle"
    );

    if (!configAccordionContent || !configAccordionToggle) return;

    if (configAccordionContent.classList.contains("expanded")) {
      this.collapseAccordion();
    } else {
      this.expandAccordion();
    }
  }

  expandAccordion() {
    const configAccordionContent = document.getElementById(
      "configAccordionContent"
    );
    const configAccordionToggle = document.getElementById(
      "configAccordionToggle"
    );

    if (!configAccordionContent || !configAccordionToggle) return;

    configAccordionContent.classList.add("expanded");
    const toggleIcon = configAccordionToggle.querySelector(".toggle-icon");
    if (toggleIcon) {
      toggleIcon.textContent = "▲";
    }
  }

  collapseAccordion() {
    const configAccordionContent = document.getElementById(
      "configAccordionContent"
    );
    const configAccordionToggle = document.getElementById(
      "configAccordionToggle"
    );

    if (!configAccordionContent || !configAccordionToggle) return;

    configAccordionContent.classList.remove("expanded");
    const toggleIcon = configAccordionToggle.querySelector(".toggle-icon");
    if (toggleIcon) {
      toggleIcon.textContent = "▼";
    }
  }

  updateFormFields() {
    const logsDir = document.getElementById("logsDir");
    const chatWebhook = document.getElementById("chatWebhook");

    if (logsDir && chatWebhook) {
      const config = this.uiManager.getConfig();
      logsDir.value = config.BASE_LOG_DIR || "";
      chatWebhook.value = config.BOT_CHAT_WEBHOOK_URL || "";
      this.uiManager.updateConfigurationStatus();
    }
  }

  updateBotWebhooksDisplay() {
    const botWebhooks = document.getElementById("botWebhooks");
    if (!botWebhooks) return;

    botWebhooks.innerHTML = "";
    const config = this.uiManager.getConfig();

    Object.entries(config.BOT_NAMES_WITH_DISCORD_WEBHOOKS).forEach(
      ([name, webhook]) => {
        const item = document.createElement("div");
        item.className = "bot-webhook-item";
        item.innerHTML = `
          <input type="text" value="${name}" placeholder="Bot Name" class="bot-name-input" data-original-name="${name}">
          <input type="text" value="${webhook}" placeholder="Webhook URL" class="webhook-url-input">
          <button type="button" class="btn btn-small btn-primary save-bot-btn" onclick="configUI.saveBotWebhookChanges('${name}')">Save</button>
          <button type="button" class="btn btn-small btn-warning cancel-bot-btn" onclick="configUI.cancelBotWebhookEdit('${name}')" style="display: none;">Cancel</button>
          <button type="button" class="btn btn-small btn-secondary edit-bot-btn" onclick="configUI.editBotWebhook('${name}')">Edit</button>
          <button type="button" class="btn btn-small btn-danger" onclick="configUI.removeBotWebhook('${name}')">Remove</button>
        `;

        // Add event listeners for the inputs
        const nameInput = item.querySelector(".bot-name-input");
        const webhookInput = item.querySelector(".webhook-url-input");
        const saveBtn = item.querySelector(".save-bot-btn");

        // Initially disable editing
        nameInput.readOnly = true;
        webhookInput.readOnly = true;
        saveBtn.style.display = "none";

        botWebhooks.appendChild(item);
      }
    );

    // Update configuration status after webhooks change
    this.uiManager.updateConfigurationStatus();
  }

  showAddBotModal() {
    const botModal = document.getElementById("botModal");
    const botName = document.getElementById("botName");
    const botWebhook = document.getElementById("botWebhook");

    if (botModal && botName && botWebhook) {
      botModal.style.display = "block";
      botName.value = "";
      botWebhook.value = "";
      botName.focus();
    }
  }

  hideAddBotModal() {
    const botModal = document.getElementById("botModal");
    if (botModal) {
      botModal.style.display = "none";
    }
  }

  async saveBotWebhook() {
    const botName = document.getElementById("botName");
    const botWebhook = document.getElementById("botWebhook");

    if (!botName || !botWebhook) return;

    const name = botName.value.trim();
    const webhook = botWebhook.value.trim();

    if (!name || !webhook) {
      this.uiManager.showError("Bot name and webhook URL are required");
      return;
    }

    try {
      const config = this.uiManager.getConfig();
      config.BOT_NAMES_WITH_DISCORD_WEBHOOKS[name] = webhook;

      // Save configuration to disk
      const result = await window.electronAPI.saveConfig(config);
      if (result.success) {
        this.uiManager.setConfig(config);
        this.updateBotWebhooksDisplay();
        this.hideAddBotModal();
        this.uiManager.showSuccess("Bot webhook added successfully");
      } else {
        this.uiManager.showError(
          "Failed to save configuration: " + result.error
        );
      }
    } catch (error) {
      this.uiManager.showError("Failed to save bot webhook: " + error.message);
    }
  }

  async removeBotWebhook(botName) {
    try {
      const config = this.uiManager.getConfig();
      delete config.BOT_NAMES_WITH_DISCORD_WEBHOOKS[botName];

      // Save configuration to disk
      const result = await window.electronAPI.saveConfig(config);
      if (result.success) {
        this.uiManager.setConfig(config);
        this.updateBotWebhooksDisplay();
        this.uiManager.showSuccess("Bot webhook removed successfully");
      } else {
        this.uiManager.showError(
          "Failed to save configuration: " + result.error
        );
        // Revert the changes
        config.BOT_NAMES_WITH_DISCORD_WEBHOOKS[botName] =
          this.uiManager.getConfig().BOT_NAMES_WITH_DISCORD_WEBHOOKS[botName];
        this.updateBotWebhooksDisplay();
      }
    } catch (error) {
      this.uiManager.showError(
        "Failed to remove bot webhook: " + error.message
      );
    }
  }

  editBotWebhook(botName) {
    const item = event.target.closest(".bot-webhook-item");
    if (!item) return;

    const nameInput = item.querySelector(".bot-name-input");
    const webhookInput = item.querySelector(".webhook-url-input");
    const saveBtn = item.querySelector(".save-bot-btn");
    const cancelBtn = item.querySelector(".cancel-bot-btn");
    const editBtn = item.querySelector(".edit-bot-btn");

    // Enable editing
    nameInput.readOnly = false;
    webhookInput.readOnly = false;
    saveBtn.style.display = "inline-block";
    cancelBtn.style.display = "inline-block";
    editBtn.style.display = "none";

    // Add editing visual state
    item.classList.add("editing");

    // Focus on the name input
    nameInput.focus();
  }

  cancelBotWebhookEdit(botName) {
    const item = event.target.closest(".bot-webhook-item");
    if (!item) return;

    const nameInput = item.querySelector(".bot-name-input");
    const webhookInput = item.querySelector(".webhook-url-input");
    const saveBtn = item.querySelector(".save-bot-btn");
    const cancelBtn = item.querySelector(".cancel-bot-btn");
    const editBtn = item.querySelector(".edit-bot-btn");

    const config = this.uiManager.getConfig();

    // Restore original values
    nameInput.value = botName;
    webhookInput.value = config.BOT_NAMES_WITH_DISCORD_WEBHOOKS[botName];

    // Disable editing
    nameInput.readOnly = true;
    webhookInput.readOnly = true;
    saveBtn.style.display = "none";
    cancelBtn.style.display = "none";
    editBtn.style.display = "inline-block";

    // Remove editing visual state
    item.classList.remove("editing");
  }

  async saveBotWebhookChanges(originalBotName) {
    const item = event.target.closest(".bot-webhook-item");
    if (!item) return;

    const nameInput = item.querySelector(".bot-name-input");
    const webhookInput = item.querySelector(".webhook-url-input");
    const saveBtn = item.querySelector(".save-bot-btn");
    const cancelBtn = item.querySelector(".cancel-bot-btn");
    const editBtn = item.querySelector(".edit-bot-btn");

    const newBotName = nameInput.value.trim();
    const newWebhook = webhookInput.value.trim();

    if (!newBotName || !newWebhook) {
      this.uiManager.showError("Bot name and webhook URL are required");
      return;
    }

    try {
      const config = this.uiManager.getConfig();

      // Remove the old entry and add the new one
      delete config.BOT_NAMES_WITH_DISCORD_WEBHOOKS[originalBotName];
      config.BOT_NAMES_WITH_DISCORD_WEBHOOKS[newBotName] = newWebhook;

      // Save configuration to disk
      const result = await window.electronAPI.saveConfig(config);
      if (result.success) {
        this.uiManager.setConfig(config);

        // Update the display
        this.updateBotWebhooksDisplay();

        // Disable editing
        nameInput.readOnly = true;
        webhookInput.readOnly = true;
        saveBtn.style.display = "none";
        cancelBtn.style.display = "none";
        editBtn.style.display = "inline-block";

        // Remove editing visual state
        item.classList.remove("editing");

        this.uiManager.showSuccess(
          "Bot webhook updated and saved successfully"
        );
      } else {
        this.uiManager.showError(
          "Failed to save configuration: " + result.error
        );
        // Revert the changes
        delete config.BOT_NAMES_WITH_DISCORD_WEBHOOKS[newBotName];
        config.BOT_NAMES_WITH_DISCORD_WEBHOOKS[originalBotName] =
          webhookInput.value;
        this.updateBotWebhooksDisplay();
      }
    } catch (error) {
      this.uiManager.showError("Failed to save bot webhook: " + error.message);
      // Revert the changes
      const config = this.uiManager.getConfig();
      delete config.BOT_NAMES_WITH_DISCORD_WEBHOOKS[newBotName];
      config.BOT_NAMES_WITH_DISCORD_WEBHOOKS[originalBotName] =
        webhookInput.value;
      this.updateBotWebhooksDisplay();
    }
  }
}

export default ConfigUI;
