# 🎯 **SIDEBAR SETTINGS FOOTER IMPLEMENTATION PLAN**

### Comprehensive Settings Management with Secure LLM Provider Configuration

## **OVERVIEW**

implement a settings footer at the bottom of the left sidebar using shadcn components, featuring secure API key management for LLM providers, theme settings, and app preferences. the system will use tauri's secure store for encryption and support export/import functionality.

---

## **PHASE 1: Architecture & Types Foundation**

### **1.1 Settings Type Definitions**

create `src/types/settings.ts` with comprehensive interfaces:

```typescript
// Provider-specific settings
interface ProviderSettings {
  apiKey?: string;
  customEndpoint?: string;
  defaultModel?: string;
  rateLimitRpm?: number;
  enabled: boolean;
}

// Main settings interface
interface AppSettings {
  // LLM Provider settings
  providers: {
    openai: ProviderSettings;
    anthropic: ProviderSettings;
    google: ProviderSettings;
    cohere: ProviderSettings;
    ollama: ProviderSettings;
  };

  // UI/UX settings
  theme: "light" | "dark" | "system";
  sidebarWidth: number;
  autoSaveInterval: number; // seconds

  // Default model parameters
  defaultTemperature: number;
  defaultMaxTokens: number;

  // Advanced settings
  enableAnalytics: boolean;
  debugMode: boolean;
  compactMode: boolean;
}
```

### **1.2 Settings Service Layer**

create `src/lib/settings-service.ts` for secure storage:

```typescript
class SettingsService {
  private readonly SETTINGS_KEY = "loki-app-settings";
  private readonly SECURE_KEYS_PREFIX = "loki-api-key-";

  // Use Tauri's secure store for API keys
  async saveApiKey(provider: string, apiKey: string): Promise<void>;
  async getApiKey(provider: string): Promise<string | null>;

  // Regular store for non-sensitive settings
  async saveSettings(settings: AppSettings): Promise<void>;
  async loadSettings(): Promise<AppSettings>;

  // Export/import with API key handling
  async exportSettings(): Promise<string>;
  async importSettings(data: string): Promise<void>;
}
```

---

## **PHASE 2: State Management Integration**

### **2.1 Extend Zustand Store**

enhance `src/lib/store.ts` with settings state:

```typescript
interface CanvasState {
  // ... existing state ...

  // Settings state
  settings: AppSettings;
  settingsLoaded: boolean;

  // Settings actions
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  updateProviderSettings: (
    provider: string,
    settings: Partial<ProviderSettings>
  ) => Promise<void>;
  setApiKey: (provider: string, apiKey: string) => Promise<void>;
  getApiKey: (provider: string) => Promise<string | null>;

  // Settings dialog state
  settingsDialog: {
    isOpen: boolean;
    activeTab: string;
  };
  openSettingsDialog: (tab?: string) => void;
  closeSettingsDialog: () => void;

  // Export/import settings
  exportSettings: () => Promise<string>;
  importSettings: (data: string) => Promise<void>;
}
```

### **2.2 Settings Initialization**

integrate settings loading into store initialization:

```typescript
initializeStore: async () => {
  // ... existing initialization ...

  // Load settings
  const settings = await settingsService.loadSettings();
  set({ settings, settingsLoaded: true });

  // Apply theme
  applyTheme(settings.theme);
};
```

---

## **PHASE 3: UI Components Architecture**

### **3.1 Settings Dialog Components**

create modular settings components in `src/components/settings/`:

```
src/components/settings/
├── SettingsDialog.tsx          # Main dialog container
├── ProviderSettingsTab.tsx     # LLM provider configuration
├── AppearanceTab.tsx          # Theme and UI settings
├── PreferencesTab.tsx         # Auto-save, defaults, etc.
├── AdvancedTab.tsx           # Debug, analytics settings
├── ApiKeyInput.tsx           # Secure API key input component
└── ExportImportSection.tsx   # Settings backup/restore
```

### **3.2 Sidebar Footer Component**

create `src/components/sidebar-footer.tsx`:

```typescript
export default function SidebarFooter() {
  const { openSettingsDialog, settings } = useStore();

  return (
    <div className="border-t p-3 space-y-2">
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start"
        onClick={() => openSettingsDialog()}
      >
        <Settings className="h-4 w-4 mr-2" />
        Settings
      </Button>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Theme: {settings.theme}</span>
        <span className={getProviderStatus()}>●</span>
      </div>
    </div>
  );
}
```

### **3.3 Settings Dialog Structure**

comprehensive settings dialog with tabs:

```typescript
<Dialog open={settingsDialog.isOpen} onOpenChange={closeSettingsDialog}>
  <DialogContent className="max-w-4xl h-[600px]">
    <DialogHeader>
      <DialogTitle>Settings</DialogTitle>
    </DialogHeader>

    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="providers">Providers</TabsTrigger>
        <TabsTrigger value="appearance">Appearance</TabsTrigger>
        <TabsTrigger value="preferences">Preferences</TabsTrigger>
        <TabsTrigger value="advanced">Advanced</TabsTrigger>
      </TabsList>

      <TabsContent value="providers">
        <ProviderSettingsTab />
      </TabsContent>

      <TabsContent value="appearance">
        <AppearanceTab />
      </TabsContent>

      <TabsContent value="preferences">
        <PreferencesTab />
      </TabsContent>

      <TabsContent value="advanced">
        <AdvancedTab />
      </TabsContent>
    </Tabs>
  </DialogContent>
</Dialog>
```

---

## **PHASE 4: LLM Service Integration**

### **4.1 Refactor LLM Service**

enhance `src/lib/llm-service.ts` to use configurable providers:

```typescript
class LLMService {
  private static async getProviderClient(model: string) {
    const { settings } = useStore.getState();
    const provider = getProviderFromModel(model);
    const apiKey = await settingsService.getApiKey(provider);

    if (!apiKey) {
      throw new Error(`API key not configured for ${provider}`);
    }

    switch (provider) {
      case "openai":
        return openai(model, { apiKey });
      case "anthropic":
        return anthropic(model, { apiKey }); // future
      // ... other providers
    }
  }

  // Update existing methods to use getProviderClient
}
```

### **4.2 Provider Status Indicators**

add provider connectivity checks:

```typescript
// In settings service
async testProviderConnection(provider: string): Promise<boolean> {
  try {
    const apiKey = await this.getApiKey(provider);
    if (!apiKey) return false;

    // Test API call based on provider
    // Return connection status
  } catch {
    return false;
  }
}
```

---

## **PHASE 5: Security & Validation**

### **5.1 API Key Security**

implement secure API key handling:

```typescript
// Never store API keys in regular state
// Always use Tauri secure store
// Validate API key format before saving
// Clear sensitive data from memory after use

const validateApiKey = (provider: string, key: string): boolean => {
  const patterns = {
    openai: /^sk-[a-zA-Z0-9]{48}$/,
    anthropic: /^sk-ant-[a-zA-Z0-9\-_]{95}$/,
    // ... other patterns
  };
  return patterns[provider]?.test(key) ?? false;
};
```

### **5.2 Settings Validation**

comprehensive settings validation:

```typescript
const validateSettings = (settings: Partial<AppSettings>): string[] => {
  const errors: string[] = [];

  // Validate numeric ranges
  if (
    settings.autoSaveInterval &&
    (settings.autoSaveInterval < 5 || settings.autoSaveInterval > 300)
  ) {
    errors.push("Auto-save interval must be between 5-300 seconds");
  }

  // Validate temperature range
  if (
    settings.defaultTemperature &&
    (settings.defaultTemperature < 0 || settings.defaultTemperature > 2)
  ) {
    errors.push("Temperature must be between 0-2");
  }

  return errors;
};
```

---

## **PHASE 6: Export/Import & Integration**

### **6.1 Settings Export/Import**

safe settings backup/restore:

```typescript
// Export settings (excluding API keys for security)
export interface SettingsExport {
  version: string;
  timestamp: string;
  settings: Omit<AppSettings, "providers"> & {
    providers: Record<string, Omit<ProviderSettings, "apiKey">>;
  };
}

// Import with validation
const importSettings = async (data: string): Promise<void> => {
  const parsed = JSON.parse(data) as SettingsExport;

  // Version compatibility check
  // Settings validation
  // Merge with existing settings
  // Apply to store and persist
};
```

### **6.2 Integration Points**

connect settings to app functionality:

- **Theme application**: Update CSS variables and theme provider
- **Auto-save**: Update interval in session-utils
- **Default parameters**: Use in node creation
- **Provider selection**: Update model options in LLM nodes

---

## **IMPLEMENTATION CHECKLIST**

### **Phase 1: Foundation**

- [ ] Create settings type definitions
- [ ] Implement settings service with Tauri secure store
- [ ] Add settings state to Zustand store

### **Phase 2: Core Components**

- [ ] Build settings dialog with tabbed interface
- [ ] Create provider settings tab with API key management
- [ ] Add appearance and preferences tabs
- [ ] Implement sidebar footer component

### **Phase 3: Integration**

- [ ] Refactor LLM service for configurable providers
- [ ] Add settings loading to app initialization
- [ ] Connect theme settings to UI
- [ ] Update default parameters in node creation

### **Phase 4: Security & Polish**

- [ ] Implement API key validation
- [ ] Add provider connectivity testing
- [ ] Create export/import functionality
- [ ] Add settings reset option

---

## **TECHNICAL SPECIFICATIONS**

### **Dependencies Required**

- `@tauri-apps/plugin-store` (existing) - for secure storage
- `next-themes` (existing) - for theme management
- shadcn UI components - dialog, tabs, form components

### **File Structure Changes**

```
src/
├── types/
│   └── settings.ts (new)
├── lib/
│   ├── settings-service.ts (new)
│   └── store.ts (enhanced)
├── components/
│   ├── sidebar-footer.tsx (new)
│   ├── settings/
│   │   ├── SettingsDialog.tsx (new)
│   │   ├── ProviderSettingsTab.tsx (new)
│   │   ├── AppearanceTab.tsx (new)
│   │   ├── PreferencesTab.tsx (new)
│   │   └── ApiKeyInput.tsx (new)
│   └── left-sidebar.tsx (enhanced)
```

### **Security Considerations**

- API keys stored in Tauri secure store (encrypted)
- No API keys in exported settings
- Input validation for all settings
- Secure memory handling for sensitive data

---

## **FUTURE EXTENSIBILITY**

### **Provider Plugin System**

- Dynamic provider registration
- Custom provider definitions
- Plugin-based model configurations

### **Advanced Features**

- Usage analytics and cost tracking
- Rate limiting and quota management
- Multi-account provider support
- Cloud settings sync

---

**Plan Status**: ✅ Approved and Ready for Implementation  
**Estimated Implementation Time**: 4-6 hours  
**Priority**: High - Core functionality for LLM provider management
