# Loki Services API Documentation

## Overview

Loki's architecture is built around a collection of specialized services that handle different aspects of the application. Each service is designed with a single responsibility and provides a clean, typed interface for its operations.

The services work together to provide:

- **Workflow Execution**: Orchestrating LLM workflows with dependency management
- **LLM Integration**: Connecting to various AI providers with streaming support
- **Session Persistence**: Reliable storage and retrieval of workflow sessions
- **Settings Management**: Configuration and secure API key storage

## Execution Engine

### Purpose

The ExecutionEngine coordinates workflow execution, managing node dependencies, status tracking, and error handling. It provides sophisticated orchestration for LLM workflows with support for parallel execution and streaming operations.

### Class: `ExecutionEngine`

```typescript
class ExecutionEngine {
  executeWorkflow(): Promise<void>;
  stopExecution(): void;
  private executeNode(
    node: CustomNode,
    edges: Edge[],
    nodes: CustomNode[]
  ): Promise<void>;
  private executeLLMNode(
    node: CustomNode,
    edges: Edge[],
    nodes: CustomNode[]
  ): Promise<void>;
}
```

### Core Methods

#### `executeWorkflow(): Promise<void>`

Executes the entire workflow using dependency-based ordering.

**Execution Strategy:**

- Identifies start nodes as entry points
- Calculates dependencies between nodes
- Executes nodes in parallel when dependencies are satisfied
- Provides comprehensive error handling and cleanup

**Usage:**

```typescript
import { executionEngine } from "@/lib/execution-engine";

const { startWorkflow } = useStore();

try {
  startWorkflow();
  await executionEngine.executeWorkflow();
} catch (error) {
  console.error("Workflow execution failed:", error);
}
```

**Error Handling:**

- Detects circular dependencies
- Handles disconnected node clusters
- Provides descriptive error messages
- Ensures clean state after failures

#### `stopExecution(): void`

Immediately stops the current workflow execution.

**Behavior:**

- Aborts any running LLM requests
- Stops workflow execution
- Cleans up execution state
- Updates store workflow status

**Usage:**

```typescript
const handleStop = () => {
  executionEngine.stopExecution();
};
```

### Node Execution Strategy

#### Dependency Resolution

The execution engine automatically resolves node dependencies:

```typescript
// Example workflow dependency chain
Start Node → Text Prompt → LLM Invocation → Output Node
```

**Dependency Rules:**

- **Start Nodes**: Can always execute first
- **Text Prompt Nodes**: Execute immediately (user input)
- **LLM Nodes**: Wait for all input nodes to complete
- **Output Nodes**: Wait for connected input nodes

#### Parallel Execution

Nodes with satisfied dependencies execute in parallel:

```typescript
// Parallel execution example
Start Node → Text Prompt A ┐
                           ├→ LLM Node → Output
            Text Prompt B ┘
```

### LLM Node Execution

#### Stream Broadcasting

LLM nodes support streaming to multiple output nodes simultaneously:

**Key Features:**

- **Multiple Output Streaming**: Content streams to ALL connected output nodes
- **Synchronized Updates**: All outputs receive identical content in real-time
- **Error Propagation**: Failures propagate to all connected outputs
- **Status Coordination**: Both LLM and output nodes show consistent status

**Implementation:**

```typescript
// Find ALL connected output nodes
const outputNodes = this.getOutputNodes(nodeId, edges, nodes);
const connectedOutputNodes = outputNodes.filter(
  (n) => n.type === NodeType.OUTPUT
);

// Stream to all outputs simultaneously
connectedOutputNodes.forEach((outputNode) => {
  updateNodeData(outputNode.id, { streamedContent: content });
});
```

### Error Handling

The execution engine provides robust error handling:

- **Node-Level Errors**: Individual node failures don't stop other parallel nodes
- **Workflow-Level Errors**: Critical errors stop entire workflow
- **Error Propagation**: Errors propagate downstream to dependent nodes
- **State Cleanup**: Failed executions leave system in consistent state

## LLM Service

### Purpose

The LLMService provides a unified interface for integrating with various Large Language Model providers. It supports streaming responses, configurable parameters, and provider-specific optimizations.

### Class: `LLMService`

```typescript
export class LLMService {
  static async streamCompletion(
    prompt: string,
    params: LLMParams,
    callbacks: StreamingCallbacks
  ): Promise<void>;

  static async simpleCompletion(
    prompt: string,
    params: LLMParams
  ): Promise<{ content: string; tokenCount?: number }>;
}
```

### Interfaces

#### `LLMParams`

```typescript
interface LLMParams {
  model: "gpt-4" | "gpt-3.5-turbo" | "claude-3-haiku" | "claude-3-sonnet";
  temperature: number; // 0.0 - 2.0
  maxTokens: number; // 1 - 4000
  systemPrompt?: string; // Optional system prompt
}
```

#### `StreamingCallbacks`

```typescript
interface StreamingCallbacks {
  onStart: () => void; // Called when streaming begins
  onContent: (content: string) => void; // Called for each content chunk
  onComplete: (finalContent: string, tokenCount?: number) => void; // Called when complete
  onError: (error: string) => void; // Called on errors
}
```

### Streaming Operations

#### `streamCompletion(prompt: string, params: LLMParams, callbacks: StreamingCallbacks): Promise<void>`

Provides real-time streaming of LLM responses with comprehensive callback support.

**Usage:**

```typescript
import { LLMService } from "@/lib/llm-service";

const params: LLMParams = {
  model: "gpt-4",
  temperature: 0.7,
  maxTokens: 1000,
  systemPrompt: "You are a helpful assistant.",
};

await LLMService.streamCompletion("What is artificial intelligence?", params, {
  onStart: () => {
    console.log("Streaming started");
    setIsLoading(true);
  },

  onContent: (content: string) => {
    console.log("Received content:", content);
    setStreamContent(content);
  },

  onComplete: (finalContent: string, tokenCount?: number) => {
    console.log("Streaming complete:", finalContent);
    console.log("Token count:", tokenCount);
    setIsLoading(false);
  },

  onError: (error: string) => {
    console.error("Streaming error:", error);
    setError(error);
    setIsLoading(false);
  },
});
```

**Features:**

- **Real-time Updates**: Content streams as it's generated
- **Token Counting**: Automatic usage tracking
- **Error Recovery**: Graceful error handling with detailed messages
- **Type Safety**: Full TypeScript support for parameters and callbacks

#### `simpleCompletion(prompt: string, params: LLMParams): Promise<{ content: string; tokenCount?: number }>`

Provides a simple, non-streaming completion for basic use cases.

**Usage:**

```typescript
try {
  const result = await LLMService.simpleCompletion(
    "Summarize this text briefly.",
    {
      model: "gpt-3.5-turbo",
      temperature: 0.3,
      maxTokens: 150,
    }
  );

  console.log("Response:", result.content);
  console.log("Tokens used:", result.tokenCount);
} catch (error) {
  console.error("Completion failed:", error);
}
```

### Provider Management

#### Dynamic Provider Configuration

The service automatically configures providers based on settings:

```typescript
// Automatic provider selection based on model
const getProviderClient = async (model: string) => {
  const provider = settingsService.getProviderFromModel(model);
  const apiKey = await settingsService.getApiKey(provider);

  // Returns configured client for the provider
  switch (provider) {
    case "openai":
      return createOpenAI({ apiKey })(model);
    case "anthropic":
    // Future: return createAnthropic({ apiKey })(model);
    // ... other providers
  }
};
```

#### Supported Providers

**Currently Supported:**

- **OpenAI**: GPT-4, GPT-3.5 Turbo (fully implemented)

**Future Support:**

- **Anthropic**: Claude 3 Haiku, Claude 3 Sonnet
- **Google**: Gemini models
- **Cohere**: Command models
- **Ollama**: Local model support

#### Provider Fallback

Automatic fallback to OpenAI for unsupported providers:

```typescript
// Graceful fallback for future providers
case 'anthropic':
  console.warn(`Provider ${provider} not yet supported, falling back to OpenAI`);
  const fallbackClient = createOpenAI({ apiKey: openaiKey });
  return fallbackClient('gpt-3.5-turbo');
```

### Error Handling

The LLM service provides comprehensive error handling:

- **API Key Validation**: Checks for missing or invalid API keys
- **Network Errors**: Handles connectivity issues gracefully
- **Rate Limiting**: Manages API rate limits and quotas
- **Model Errors**: Handles model-specific errors and limitations

## Session Service

### Purpose

The SessionService manages persistent storage and retrieval of workflow sessions using Tauri's secure store. It provides comprehensive CRUD operations, search functionality, and import/export capabilities.

### Class: `SessionService`

```typescript
class SessionService {
  // Core operations
  async createSession(
    name?: string,
    nodes?: CustomNode[],
    edges?: Edge[]
  ): Promise<Session>;
  async loadSession(sessionId: string): Promise<Session | null>;
  async saveSession(session: Session): Promise<void>;
  async deleteSession(sessionId: string): Promise<boolean>;

  // Management operations
  async duplicateSession(sessionId: string): Promise<Session | null>;
  async renameSession(sessionId: string, newName: string): Promise<boolean>;
  async getAllSessions(): Promise<Record<string, Session>>;

  // Search and filtering
  async searchSessions(query: string): Promise<string[]>;

  // Import/Export
  async exportSession(sessionId: string): Promise<string | null>;
  async importSession(sessionData: string): Promise<Session | null>;
  async exportAllSessions(): Promise<string>;
}
```

### Core Operations

#### `createSession(name?: string, nodes?: CustomNode[], edges?: Edge[]): Promise<Session>`

Creates a new session with optional initial state.

**Parameters:**

- `name`: Optional session name (auto-generated if not provided)
- `nodes`: Initial nodes array (defaults to empty)
- `edges`: Initial edges array (defaults to empty)

**Usage:**

```typescript
import { sessionService } from "@/lib/session-service";

// Create empty session
const session = await sessionService.createSession();

// Create named session with content
const session = await sessionService.createSession(
  "My AI Workflow",
  nodes,
  edges
);
```

**Behavior:**

- Generates unique session ID
- Creates unique session name if name conflicts exist
- Sets initial metadata (creation time, node count, etc.)
- Persists to Tauri store immediately

#### `loadSession(sessionId: string): Promise<Session | null>`

Loads a specific session from persistence.

**Returns:** Session object or null if not found

**Usage:**

```typescript
const session = await sessionService.loadSession("session-123");
if (session) {
  console.log("Loaded session:", session.name);
  console.log("Node count:", session.nodes.length);
} else {
  console.log("Session not found");
}
```

#### `saveSession(session: Session): Promise<void>`

Saves or updates a session in persistence.

**Behavior:**

- Updates `updatedAt` timestamp
- Recalculates metadata (node count, etc.)
- Marks as saved status
- Persists to store with error handling

**Usage:**

```typescript
const session = {
  ...existingSession,
  nodes: updatedNodes,
  edges: updatedEdges,
};

await sessionService.saveSession(session);
```

#### `deleteSession(sessionId: string): Promise<boolean>`

Permanently deletes a session from persistence.

**Returns:** Boolean indicating success

**Usage:**

```typescript
const success = await sessionService.deleteSession("session-to-delete");
if (success) {
  console.log("Session deleted successfully");
} else {
  console.log("Session not found or deletion failed");
}
```

### Management Operations

#### `duplicateSession(sessionId: string): Promise<Session | null>`

Creates a copy of an existing session with a new ID.

**Usage:**

```typescript
const duplicated = await sessionService.duplicateSession("original-session");
if (duplicated) {
  console.log("Created duplicate:", duplicated.name);
}
```

**Behavior:**

- Copies all nodes and edges
- Generates new unique ID
- Creates unique name (adds "Copy" suffix)
- Preserves all workflow content

#### `renameSession(sessionId: string, newName: string): Promise<boolean>`

Renames an existing session.

**Usage:**

```typescript
const success = await sessionService.renameSession(
  "session-123",
  "My Renamed Workflow"
);
```

### Search and Filtering

#### `searchSessions(query: string): Promise<string[]>`

Searches sessions by content and returns matching session IDs ordered by relevance.

**Search Scope:**

- Session names (highest weight)
- Node content and text
- Node titles and descriptions

**Usage:**

```typescript
const matchingIds = await sessionService.searchSessions("machine learning");
console.log("Found sessions:", matchingIds);
```

**Ranking Algorithm:**

- **Name matches**: 10 points per term
- **Content matches**: 5 points per term
- **Title matches**: 3 points per term
- Results sorted by total relevance score

### Import/Export

#### Export Formats

**Single Session Export:**

```typescript
interface SessionExport {
  version: "1.0.0";
  exportedAt: string;
  session: Session;
}
```

**Bulk Export:**

```typescript
interface SessionBulkExport {
  version: "1.0.0";
  exportedAt: string;
  sessions: Session[];
}
```

#### `exportSession(sessionId: string): Promise<string | null>`

Exports a single session to JSON string.

**Usage:**

```typescript
const exportData = await sessionService.exportSession("session-123");
if (exportData) {
  // Save to file or share
  const blob = new Blob([exportData], { type: "application/json" });
  // ... file download logic
}
```

#### `importSession(sessionData: string): Promise<Session | null>`

Imports a session from JSON string.

**Features:**

- Validates import data format
- Generates new session ID
- Ensures unique session name
- Handles import errors gracefully

**Usage:**

```typescript
try {
  const importedSession = await sessionService.importSession(jsonData);
  if (importedSession) {
    console.log("Imported:", importedSession.name);
  }
} catch (error) {
  console.error("Import failed:", error);
}
```

### Metadata Management

#### `updateSessionMetadata(sessionId: string, metadata: Partial<SessionMetadata>, updateTimestamp?: boolean): Promise<void>`

Updates session metadata without full session persistence.

**Usage:**

```typescript
// Update status without timestamp
await sessionService.updateSessionMetadata(
  "session-123",
  {
    status: SessionStatus.RUNNING,
    isRunning: true,
  },
  false
);

// Update with timestamp for content changes
await sessionService.updateSessionMetadata(
  "session-123",
  {
    hasUnsavedChanges: true,
  },
  true
);
```

### Error Handling

The session service includes comprehensive error handling:

- **Store Initialization**: Handles Tauri store creation failures
- **Persistence Errors**: Manages file system and storage errors
- **Data Validation**: Validates session data integrity
- **Concurrent Access**: Handles multiple simultaneous operations
- **Recovery**: Graceful fallbacks for corrupted data

## Settings Service

### Purpose

The SettingsService manages application configuration and secure API key storage. It provides a unified interface for settings persistence, validation, and provider management using Tauri's secure storage capabilities.

### Class: `SettingsService`

```typescript
class SettingsService {
  // API Key Management (Secure)
  async saveApiKey(provider: LLMProvider, apiKey: string): Promise<void>;
  async getApiKey(provider: LLMProvider): Promise<string | null>;
  async removeApiKey(provider: LLMProvider): Promise<void>;

  // Settings Management
  async saveSettings(settings: AppSettings): Promise<void>;
  async loadSettings(): Promise<AppSettings>;
  async updateProviderSettings(
    provider: LLMProvider,
    settings: Partial<ProviderSettings>
  ): Promise<void>;

  // Provider Testing
  async testProviderConnection(provider: LLMProvider): Promise<boolean>;
  async getProviderStatus(): Promise<Record<LLMProvider, boolean>>;

  // Import/Export
  async exportSettings(): Promise<string>;
  async importSettings(data: string): Promise<void>;
  async resetSettings(): Promise<void>;
}
```

### Secure API Key Management

#### Storage Security

API keys are stored using Tauri's secure storage with encryption:

```typescript
const SECURE_KEYS_PREFIX = "loki-api-key-";

// Keys are encrypted at rest
await this.store.set(`${SECURE_KEYS_PREFIX}${provider}`, apiKey.trim());
```

#### `saveApiKey(provider: LLMProvider, apiKey: string): Promise<void>`

Securely stores an API key for a provider.

**Validation:**

- Non-empty key validation
- Automatic key trimming
- Provider-specific validation

**Usage:**

```typescript
import { settingsService } from "@/lib/settings-service";

try {
  await settingsService.saveApiKey("openai", "sk-...");
  console.log("API key saved securely");
} catch (error) {
  console.error("Failed to save API key:", error);
}
```

#### `getApiKey(provider: LLMProvider): Promise<string | null>`

Retrieves a stored API key for a provider.

**Returns:** Decrypted API key or null if not found

**Usage:**

```typescript
const apiKey = await settingsService.getApiKey("openai");
if (apiKey) {
  // Use API key for requests
} else {
  // Prompt user to configure API key
}
```

### Settings Management

#### `loadSettings(): Promise<AppSettings>`

Loads application settings with automatic defaults and migration.

**Features:**

- Automatic default generation for new installations
- Settings migration for version updates
- Graceful fallback for corrupted settings
- Validation and sanitization

**Usage:**

```typescript
const settings = await settingsService.loadSettings();
console.log("Current theme:", settings.theme);
console.log("Auto-save interval:", settings.autoSaveInterval);
```

#### `saveSettings(settings: AppSettings): Promise<void>`

Validates and saves application settings.

**Validation:**

- Range validation for numeric settings
- Enum validation for theme and other options
- Provider configuration validation
- Custom validation rules

**Usage:**

```typescript
const newSettings = {
  ...currentSettings,
  theme: "dark",
  autoSaveInterval: 60,
  defaultTemperature: 0.7,
};

await settingsService.saveSettings(newSettings);
```

#### Settings Validation

The service includes comprehensive validation:

```typescript
private validateSettings(settings: Partial<AppSettings>): string[] {
  const errors: string[] = [];

  // Auto-save interval validation
  if (settings.autoSaveInterval !== undefined) {
    if (settings.autoSaveInterval < 5 || settings.autoSaveInterval > 300) {
      errors.push("Auto-save interval must be between 5-300 seconds");
    }
  }

  // Temperature validation
  if (settings.defaultTemperature !== undefined) {
    if (settings.defaultTemperature < 0 || settings.defaultTemperature > 2) {
      errors.push("Temperature must be between 0-2");
    }
  }

  return errors;
}
```

### Provider Management

#### `updateProviderSettings(provider: LLMProvider, settings: Partial<ProviderSettings>): Promise<void>`

Updates configuration for a specific LLM provider.

**Usage:**

```typescript
await settingsService.updateProviderSettings("openai", {
  enabled: true,
  defaultModel: "gpt-4",
  maxTokens: 2000,
});
```

#### Provider Status Testing

#### `testProviderConnection(provider: LLMProvider): Promise<boolean>`

Tests if a provider is properly configured and accessible.

**Testing Methods:**

- **API Key Validation**: Checks if API key is stored
- **Connection Testing**: Makes actual API calls to validate keys
- **Endpoint Testing**: Verifies provider endpoints are accessible

**Usage:**

```typescript
const isWorking = await settingsService.testProviderConnection("openai");
if (isWorking) {
  console.log("OpenAI is configured and working");
} else {
  console.log("OpenAI configuration issue");
}
```

#### `getProviderStatus(): Promise<Record<LLMProvider, boolean>>`

Gets the status of all providers simultaneously.

**Usage:**

```typescript
const status = await settingsService.getProviderStatus();
console.log("OpenAI status:", status.openai);
console.log("Anthropic status:", status.anthropic);
```

### Import/Export

#### `exportSettings(): Promise<string>`

Exports settings to JSON format (excludes API keys for security).

**Export Format:**

```typescript
interface SettingsExport {
  version: "1.0.0";
  timestamp: string;
  settings: AppSettings; // Without API keys
}
```

**Usage:**

```typescript
const exportData = await settingsService.exportSettings();
// Save to file or share (API keys not included)
```

#### `importSettings(data: string): Promise<void>`

Imports settings from JSON data with validation.

**Features:**

- Format validation
- Settings merging with current configuration
- Validation of imported values
- Error handling for corrupted imports

**Usage:**

```typescript
try {
  await settingsService.importSettings(importJsonData);
  console.log("Settings imported successfully");
} catch (error) {
  console.error("Import failed:", error);
}
```

### Utility Methods

#### `getProviderFromModel(model: string): LLMProvider`

Determines which provider a model belongs to.

**Usage:**

```typescript
const provider = settingsService.getProviderFromModel("gpt-4");
console.log("Provider:", provider); // 'openai'
```

**Model Mapping:**

- `gpt-4`, `gpt-3.5-turbo` → `openai`
- `claude-3-haiku`, `claude-3-sonnet` → `anthropic`
- Future models mapped to respective providers

### Error Handling

The settings service provides robust error handling:

- **Storage Errors**: Handles Tauri store failures gracefully
- **Validation Errors**: Provides detailed validation error messages
- **Network Errors**: Manages API connection test failures
- **Encryption Errors**: Handles secure storage encryption issues
- **Migration Errors**: Manages settings version migration failures

## Service Integration

### Singleton Pattern

All services use the singleton pattern for consistent state:

```typescript
// Each service exports a singleton instance
export const sessionService = new SessionService();
export const settingsService = new SettingsService();
export const executionEngine = new ExecutionEngine();
```

### Cross-Service Dependencies

Services are designed to work together:

```typescript
// Execution Engine uses LLM Service
await LLMService.streamCompletion(prompt, params, callbacks);

// LLM Service uses Settings Service for API keys
const apiKey = await settingsService.getApiKey(provider);

// Store coordinates all services
await sessionService.saveSession(session);
await settingsService.saveSettings(settings);
```

### Initialization

Services require initialization before use:

```typescript
// Store handles service initialization
async initializeStore() {
  await sessionService.initialize();
  await settingsService.initialize();
  // Load initial data
}
```

### Error Coordination

Services coordinate error handling through the store:

```typescript
// Services report errors to store
set({ error: errorMessage, isLoading: false });

// Store provides global error state
const { error, isLoading } = useStore();
```

This architecture provides a robust, scalable foundation for Loki's functionality with clear separation of concerns and strong error handling throughout.
