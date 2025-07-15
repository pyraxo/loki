// Settings Dialog JavaScript
class SettingsDialog {
  constructor() {
    this.settings = null;
    this.providerMetadata = null;
    this.currentTab = "providers";
    this.isLoading = false;
    this.init();
  }

  async init() {
    // Load Tauri API
    await this.loadTauriAPI();

    // Initialize settings storage
    await this.initializeSettings();

    // Load current settings
    await this.loadSettings();

    // Load provider metadata
    await this.loadProviderMetadata();

    // Set up event listeners
    this.setupEventListeners();

    // Apply initial theme
    this.applyTheme();

    // Render UI
    this.renderUI();
  }

  async loadTauriAPI() {
    // Load Tauri API from global scope
    if (typeof window.__TAURI__ !== "undefined") {
      this.tauri = window.__TAURI__;
      this.invoke = this.tauri.core.invoke;
      this.listen = this.tauri.event.listen;
      this.emit = this.tauri.event.emit;
    } else {
      console.error("Tauri API not available");
    }
  }

  async initializeSettings() {
    try {
      await this.invoke("init_settings");
    } catch (error) {
      console.error("Failed to initialize settings:", error);
    }
  }

  async loadSettings() {
    try {
      this.showLoading("Loading settings...");
      this.settings = await this.invoke("get_settings");
      this.updateDebugInfo();
    } catch (error) {
      console.error("Failed to load settings:", error);
      this.showError("Failed to load settings");
    } finally {
      this.hideLoading();
    }
  }

  async loadProviderMetadata() {
    try {
      this.providerMetadata = await this.invoke("get_provider_metadata");
    } catch (error) {
      console.error("Failed to load provider metadata:", error);
    }
  }

  setupEventListeners() {
    // Tab switching
    document.querySelectorAll(".tab-button").forEach((button) => {
      button.addEventListener("click", (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // Settings form handlers
    this.setupSettingsHandlers();

    // Provider handlers
    this.setupProviderHandlers();

    // Advanced tab handlers
    this.setupAdvancedHandlers();

    // Modal handlers
    this.setupModalHandlers();

    // Listen for settings updates from Rust
    if (this.listen) {
      this.listen("settings-updated", (event) => {
        this.settings = event.payload;
        this.renderUI();
      });
    }
  }

  setupSettingsHandlers() {
    // Theme selection
    const themeSelect = document.getElementById("theme-select");
    if (themeSelect) {
      themeSelect.addEventListener("change", async (e) => {
        await this.updateSetting("theme", e.target.value);
        this.applyTheme();
      });
    }

    // Sidebar width
    const sidebarWidth = document.getElementById("sidebar-width");
    if (sidebarWidth) {
      sidebarWidth.addEventListener("input", (e) => {
        document.getElementById("sidebar-width-value").textContent =
          e.target.value + "px";
      });
      sidebarWidth.addEventListener("change", async (e) => {
        await this.updateSetting("sidebar_width", parseInt(e.target.value));
      });
    }

    // Auto-save interval
    const autoSaveInterval = document.getElementById("auto-save-interval");
    if (autoSaveInterval) {
      autoSaveInterval.addEventListener("input", (e) => {
        document.getElementById("auto-save-value").textContent =
          e.target.value + "s";
      });
      autoSaveInterval.addEventListener("change", async (e) => {
        await this.updateSetting(
          "auto_save_interval",
          parseInt(e.target.value)
        );
      });
    }

    // Temperature
    const temperature = document.getElementById("temperature");
    if (temperature) {
      temperature.addEventListener("input", (e) => {
        document.getElementById("temperature-value").textContent = parseFloat(
          e.target.value
        ).toFixed(1);
      });
      temperature.addEventListener("change", async (e) => {
        await this.updateSetting(
          "default_temperature",
          parseFloat(e.target.value)
        );
      });
    }

    // Max tokens
    const maxTokens = document.getElementById("max-tokens");
    if (maxTokens) {
      maxTokens.addEventListener("change", async (e) => {
        await this.updateSetting(
          "default_max_tokens",
          parseInt(e.target.value)
        );
      });
    }

    // Checkboxes
    const checkboxes = ["compact-mode", "debug-mode", "analytics"];
    checkboxes.forEach((id) => {
      const checkbox = document.getElementById(id);
      if (checkbox) {
        checkbox.addEventListener("change", async (e) => {
          const settingName = id.replace("-", "_");
          await this.updateSetting(settingName, e.target.checked);
        });
      }
    });
  }

  setupProviderHandlers() {
    // Provider handlers will be set up when providers are rendered
  }

  setupAdvancedHandlers() {
    // Export settings
    document
      .getElementById("export-settings")
      ?.addEventListener("click", async () => {
        await this.exportSettings();
      });

    // Import settings
    document
      .getElementById("import-settings")
      ?.addEventListener("click", async () => {
        await this.importSettings();
      });

    // Reset settings
    document
      .getElementById("reset-settings")
      ?.addEventListener("click", async () => {
        this.showConfirmationModal(
          "Reset Settings",
          "Are you sure you want to reset all settings to default? This action cannot be undone.",
          async () => {
            await this.resetSettings();
          }
        );
      });
  }

  setupModalHandlers() {
    // Confirmation modal
    document.getElementById("modal-cancel")?.addEventListener("click", () => {
      this.hideConfirmationModal();
    });

    document.getElementById("modal-confirm")?.addEventListener("click", () => {
      if (this.confirmCallback) {
        this.confirmCallback();
      }
      this.hideConfirmationModal();
    });
  }

  switchTab(tabName) {
    this.currentTab = tabName;

    // Update tab buttons
    document.querySelectorAll(".tab-button").forEach((button) => {
      button.dataset.state = button.dataset.tab === tabName ? "active" : "";
    });

    // Update tab content
    document.querySelectorAll(".tab-content").forEach((content) => {
      content.classList.add("hidden");
    });

    document.getElementById(tabName + "-tab")?.classList.remove("hidden");
  }

  async updateSetting(key, value) {
    try {
      const updates = { [key]: value };
      await this.invoke("update_settings", { updates });
    } catch (error) {
      console.error(`Failed to update setting ${key}:`, error);
      this.showError(`Failed to update ${key}`);
    }
  }

  async updateProviderSetting(provider, key, value) {
    try {
      const updates = { [key]: value };
      await this.invoke("update_provider_settings", { provider, updates });
    } catch (error) {
      console.error(
        `Failed to update provider ${provider} setting ${key}:`,
        error
      );
      this.showError(`Failed to update ${provider} ${key}`);
    }
  }

  async testProvider(provider) {
    try {
      if (!this.settings.providers[provider]) return;

      const button = document.getElementById(`test-${provider}`);
      if (button) {
        button.disabled = true;
        button.innerHTML = '<div class="loading-spinner"></div> Testing...';
      }

      const result = await this.invoke("test_provider_connection", {
        provider,
        config: this.settings.providers[provider],
      });

      if (button) {
        button.disabled = false;
        button.innerHTML = result ? "✓ Success" : "✗ Failed";
        button.className = result ? "btn-primary" : "btn-destructive";

        // Reset button after 3 seconds
        setTimeout(() => {
          button.innerHTML = "Test Connection";
          button.className = "btn-secondary";
        }, 3000);
      }
    } catch (error) {
      console.error(`Failed to test provider ${provider}:`, error);
      const button = document.getElementById(`test-${provider}`);
      if (button) {
        button.disabled = false;
        button.innerHTML = "✗ Error";
        button.className = "btn-destructive";
      }
    }
  }

  async exportSettings() {
    try {
      this.showLoading("Exporting settings...");
      const exportData = await this.invoke("export_settings");

      // Create and download file
      const blob = new Blob([exportData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `loki-settings-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export settings:", error);
      this.showError("Failed to export settings");
    } finally {
      this.hideLoading();
    }
  }

  async importSettings() {
    try {
      // Create file input
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";

      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            this.showLoading("Importing settings...");
            const importData = e.target.result;
            await this.invoke("import_settings", { exportData: importData });
            await this.loadSettings();
            this.renderUI();
          } catch (error) {
            console.error("Failed to import settings:", error);
            this.showError("Failed to import settings");
          } finally {
            this.hideLoading();
          }
        };
        reader.readAsText(file);
      };

      input.click();
    } catch (error) {
      console.error("Failed to import settings:", error);
      this.showError("Failed to import settings");
    }
  }

  async resetSettings() {
    try {
      this.showLoading("Resetting settings...");
      await this.invoke("reset_settings");
      await this.loadSettings();
      this.renderUI();
    } catch (error) {
      console.error("Failed to reset settings:", error);
      this.showError("Failed to reset settings");
    } finally {
      this.hideLoading();
    }
  }

  renderUI() {
    if (!this.settings) return;

    this.renderProviders();
    this.renderAppearance();
    this.renderPreferences();
    this.updateDebugInfo();
  }

  renderProviders() {
    const providersList = document.getElementById("providers-list");
    if (!providersList || !this.settings.providers) return;

    providersList.innerHTML = "";

    Object.entries(this.settings.providers).forEach(
      ([providerId, provider]) => {
        const metadata = this.providerMetadata?.[providerId] || {
          name: providerId,
          description: "",
          models: [],
        };

        const card = document.createElement("div");
        card.className = `provider-card bg-card rounded-lg border p-4 ${
          provider.enabled ? "provider-enabled" : "provider-disabled"
        }`;

        card.innerHTML = `
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center space-x-3">
                        <div class="toggle-switch">
                            <input type="checkbox" id="enable-${providerId}" ${
          provider.enabled ? "checked" : ""
        }>
                            <span class="toggle-slider"></span>
                        </div>
                        <div>
                            <h3 class="font-semibold">${metadata.name}</h3>
                            <p class="text-sm text-muted-foreground">${
                              metadata.description
                            }</p>
                        </div>
                    </div>
                    <div class="status-indicator ${
                      provider.enabled ? "status-success" : "status-error"
                    }"></div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="text-sm font-medium">API Key</label>
                        <div class="flex space-x-2 mt-1">
                            <input 
                                type="password" 
                                id="api-key-${providerId}" 
                                placeholder="Enter API key"
                                class="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value="${provider.api_key || ""}"
                            >
                            <button 
                                type="button" 
                                id="toggle-visibility-${providerId}"
                                class="btn-secondary px-2"
                                title="Toggle visibility"
                            >
                                👁️
                            </button>
                        </div>
                    </div>

                    <div>
                        <label class="text-sm font-medium">Default Model</label>
                        <select 
                            id="model-${providerId}"
                            class="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                            ${metadata.models
                              .map(
                                (model) =>
                                  `<option value="${model}" ${
                                    provider.default_model === model
                                      ? "selected"
                                      : ""
                                  }>${model}</option>`
                              )
                              .join("")}
                        </select>
                    </div>

                    ${
                      providerId === "ollama"
                        ? `
                        <div>
                            <label class="text-sm font-medium">Endpoint</label>
                            <input 
                                type="text" 
                                id="endpoint-${providerId}" 
                                placeholder="http://localhost:11434"
                                class="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value="${provider.custom_endpoint || ""}"
                            >
                        </div>
                    `
                        : ""
                    }

                    <div>
                        <label class="text-sm font-medium">Rate Limit (RPM)</label>
                        <input 
                            type="number" 
                            id="rate-limit-${providerId}" 
                            min="0" 
                            max="1000"
                            class="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value="${provider.rate_limit_rpm || 0}"
                        >
                    </div>
                </div>

                <div class="mt-4 flex justify-end">
                    <button 
                        type="button" 
                        id="test-${providerId}"
                        class="btn-secondary"
                        ${!provider.enabled ? "disabled" : ""}
                    >
                        Test Connection
                    </button>
                </div>
            `;

        providersList.appendChild(card);

        // Set up event listeners for this provider
        this.setupProviderEventListeners(providerId);
      }
    );
  }

  setupProviderEventListeners(providerId) {
    // Enable/disable toggle
    document
      .getElementById(`enable-${providerId}`)
      ?.addEventListener("change", async (e) => {
        await this.updateProviderSetting(
          providerId,
          "enabled",
          e.target.checked
        );
      });

    // API key
    document
      .getElementById(`api-key-${providerId}`)
      ?.addEventListener("change", async (e) => {
        await this.updateProviderSetting(providerId, "api_key", e.target.value);
      });

    // Model selection
    document
      .getElementById(`model-${providerId}`)
      ?.addEventListener("change", async (e) => {
        await this.updateProviderSetting(
          providerId,
          "default_model",
          e.target.value
        );
      });

    // Endpoint (for Ollama)
    document
      .getElementById(`endpoint-${providerId}`)
      ?.addEventListener("change", async (e) => {
        await this.updateProviderSetting(
          providerId,
          "custom_endpoint",
          e.target.value
        );
      });

    // Rate limit
    document
      .getElementById(`rate-limit-${providerId}`)
      ?.addEventListener("change", async (e) => {
        await this.updateProviderSetting(
          providerId,
          "rate_limit_rpm",
          parseInt(e.target.value)
        );
      });

    // Test connection
    document
      .getElementById(`test-${providerId}`)
      ?.addEventListener("click", async () => {
        await this.testProvider(providerId);
      });

    // Toggle password visibility
    document
      .getElementById(`toggle-visibility-${providerId}`)
      ?.addEventListener("click", (e) => {
        const input = document.getElementById(`api-key-${providerId}`);
        if (input) {
          input.type = input.type === "password" ? "text" : "password";
        }
      });
  }

  renderAppearance() {
    if (!this.settings) return;

    // Theme selection
    const themeSelect = document.getElementById("theme-select");
    if (themeSelect) {
      themeSelect.value = this.settings.theme;
    }

    // Sidebar width
    const sidebarWidth = document.getElementById("sidebar-width");
    if (sidebarWidth) {
      sidebarWidth.value = this.settings.sidebar_width;
      document.getElementById("sidebar-width-value").textContent =
        this.settings.sidebar_width + "px";
    }

    // Compact mode
    const compactMode = document.getElementById("compact-mode");
    if (compactMode) {
      compactMode.checked = this.settings.compact_mode;
    }
  }

  renderPreferences() {
    if (!this.settings) return;

    // Auto-save interval
    const autoSaveInterval = document.getElementById("auto-save-interval");
    if (autoSaveInterval) {
      autoSaveInterval.value = this.settings.auto_save_interval;
      document.getElementById("auto-save-value").textContent =
        this.settings.auto_save_interval + "s";
    }

    // Temperature
    const temperature = document.getElementById("temperature");
    if (temperature) {
      temperature.value = this.settings.default_temperature;
      document.getElementById("temperature-value").textContent =
        this.settings.default_temperature.toFixed(1);
    }

    // Max tokens
    const maxTokens = document.getElementById("max-tokens");
    if (maxTokens) {
      maxTokens.value = this.settings.default_max_tokens;
    }

    // Debug mode
    const debugMode = document.getElementById("debug-mode");
    if (debugMode) {
      debugMode.checked = this.settings.debug_mode;
    }

    // Analytics
    const analytics = document.getElementById("analytics");
    if (analytics) {
      analytics.checked = this.settings.enable_analytics;
    }
  }

  updateDebugInfo() {
    if (!this.settings) return;

    document.getElementById("settings-loaded").textContent = "Yes";
    document.getElementById("last-saved").textContent =
      new Date().toLocaleString();
  }

  applyTheme() {
    if (!this.settings) return;

    const body = document.body;
    const theme = this.settings.theme;

    // Remove existing theme classes
    body.classList.remove("dark", "light");

    if (theme === "dark") {
      body.classList.add("dark");
    } else if (theme === "light") {
      body.classList.add("light");
    } else {
      // System theme
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      body.classList.add(prefersDark ? "dark" : "light");
    }
  }

  showLoading(message = "Loading...") {
    this.isLoading = true;
    const overlay = document.getElementById("loading-overlay");
    const text = document.getElementById("loading-text");
    if (overlay && text) {
      text.textContent = message;
      overlay.classList.remove("hidden");
    }
  }

  hideLoading() {
    this.isLoading = false;
    const overlay = document.getElementById("loading-overlay");
    if (overlay) {
      overlay.classList.add("hidden");
    }
  }

  showError(message) {
    console.error(message);
    // Could implement a toast notification here
    alert(message);
  }

  showConfirmationModal(title, message, callback) {
    this.confirmCallback = callback;

    document.getElementById("modal-title").textContent = title;
    document.getElementById("modal-message").textContent = message;
    document.getElementById("confirmation-modal").classList.remove("hidden");
  }

  hideConfirmationModal() {
    this.confirmCallback = null;
    document.getElementById("confirmation-modal").classList.add("hidden");
  }
}

// Initialize the settings dialog when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new SettingsDialog();
});
