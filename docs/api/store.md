# Loki Store API Documentation

## Overview

Loki uses a centralized Zustand store for comprehensive state management across the application. The store manages canvas state, workflow execution, session management, settings, and UI dialogs. It provides a clean, typed interface for all application state operations.

The store is designed with clear separation of concerns, organizing state and actions into logical groups while maintaining type safety throughout.

## Store Structure

### State Categories

The store is organized into several key state categories:

- **Canvas State**: React Flow nodes, edges, and canvas operations
- **Workflow State**: Execution control, status tracking, and node completion
- **Session State**: Session management, persistence, and metadata
- **Settings State**: Application configuration and provider settings
- **Dialog State**: UI dialogs for confirmations and user input

## Canvas State Management

### State Properties

```typescript
interface CanvasState {
  // React Flow state
  nodes: CustomNode[];
  edges: Edge[];

  // Canvas operations
  setNodes: (nodes: CustomNode[]) => void;
  setEdges: (edges: Edge[]) => void;
  setNodesInternal: (nodes: CustomNode[]) => void;
  setEdgesInternal: (edges: Edge[]) => void;
  updateNodeData: (nodeId: string, data: Partial<NodeData>) => void;
  updateNodeStatus: (
    nodeId: string,
    status: NodeStatus,
    error?: string
  ) => void;
}
```

### Canvas Actions

#### `setNodes(nodes: CustomNode[])`

Updates the canvas nodes and marks the session as having unsaved changes.

**Usage:**

```typescript
const { setNodes } = useStore();
setNodes(newNodes);
```

**Behavior:**

- Updates the nodes array
- Sets `hasUnsavedChanges` to `true`
- Calls `markSessionAsUnsaved()`

#### `setEdges(edges: Edge[])`

Updates the canvas edges and marks the session as having unsaved changes.

**Usage:**

```typescript
const { setEdges } = useStore();
setEdges(newEdges);
```

#### `setNodesInternal(nodes: CustomNode[])` / `setEdgesInternal(edges: Edge[])`

Internal setters for React Flow changes that shouldn't mark the session as unsaved.

**Use Cases:**

- React Flow's internal positioning updates
- Selection changes
- Drag operations during session loading

**Usage:**

```typescript
const { setNodesInternal } = useStore();
// Used by React Flow internally - not for user-initiated changes
setNodesInternal(updatedNodes);
```

#### `updateNodeData(nodeId: string, data: Partial<NodeData>)`

Updates specific node data and marks the session as unsaved.

**Usage:**

```typescript
const { updateNodeData } = useStore();
updateNodeData("node-1", {
  text: "Updated prompt content",
});
```

#### `updateNodeStatus(nodeId: string, status: NodeStatus, error?: string)`

Updates a node's execution status without marking the session as unsaved.

**Parameters:**

- `status`: `"idle" | "running" | "success" | "error"`
- `error`: Optional error message for error status

**Usage:**

```typescript
const { updateNodeStatus } = useStore();
updateNodeStatus("llm-node-1", "running");
updateNodeStatus("llm-node-1", "error", "API key not configured");
```

## Workflow Execution State

### State Properties

```typescript
interface WorkflowState {
  isRunning: boolean;
  currentNode: string | undefined;
  completedNodes: string[];
  errorNodes: string[];
}

interface Store {
  workflow: WorkflowState;

  // Workflow actions
  startWorkflow: () => void;
  stopWorkflow: () => void;
  markNodeCompleted: (nodeId: string) => void;
  markNodeError: (nodeId: string, error: string) => void;
  resetWorkflow: () => void;
}
```

### Workflow Actions

#### `startWorkflow()`

Initiates workflow execution and resets execution state.

**Behavior:**

- Sets `workflow.isRunning` to `true`
- Clears completed and error node arrays
- Calls `markSessionAsRunning()` for current session

#### `stopWorkflow()`

Stops workflow execution and updates session metadata.

**Behavior:**

- Sets `workflow.isRunning` to `false`
- Clears `currentNode`
- Updates session metadata to mark as not running

#### `markNodeCompleted(nodeId: string)`

Marks a node as successfully completed during execution.

**Usage:**

```typescript
const { markNodeCompleted } = useStore();
markNodeCompleted("text-node-1");
```

#### `markNodeError(nodeId: string, error: string)`

Marks a node as failed and stops workflow execution.

**Behavior:**

- Adds node to `errorNodes` array
- Stops workflow execution
- Updates node status to "error"
- Marks session with error status

#### `resetWorkflow()`

Resets all workflow state and node statuses.

**Behavior:**

- Resets workflow state to initial values
- Sets all node statuses back to "idle"
- Marks session as unsaved

## Session Management

### State Properties

```typescript
interface SessionState {
  sessions: Record<string, Session>;
  activeSessionId: string | null;
  searchQuery: string;
  filteredSessionIds: string[];
  isLoading: boolean;
  error: string | null;
  autoSaveEnabled: boolean;
  hasUnsavedChanges: boolean;
}
```

### Session Operations

#### `createSession(name?: string): Promise<string>`

Creates a new session with current canvas state.

**Parameters:**

- `name`: Optional session name (auto-generated if not provided)

**Returns:** Promise resolving to the new session ID

**Usage:**

```typescript
const { createSession } = useStore();
const sessionId = await createSession("My Workflow");
```

**Behavior:**

- Creates session with current nodes and edges
- Sets as active session
- Clears unsaved changes flag
- Updates filtered session list

#### `loadSession(sessionId: string): Promise<void>`

Loads a session and replaces current canvas state.

**Usage:**

```typescript
const { loadSession } = useStore();
await loadSession("session-123");
```

**Behavior:**

- Loads session from persistence
- Replaces canvas nodes and edges
- Resets workflow state
- Sets as active session
- Clears unsaved changes flag

#### `saveSession(sessionId?: string): Promise<void>`

Saves the current session to persistence.

**Parameters:**

- `sessionId`: Optional specific session ID (uses active session if not provided)

**Usage:**

```typescript
const { saveSession } = useStore();
await saveSession(); // Saves active session
await saveSession("specific-session-id");
```

#### `deleteSession(sessionId: string): Promise<void>`

Permanently deletes a session.

**Usage:**

```typescript
const { deleteSession } = useStore();
await deleteSession("session-to-delete");
```

**Behavior:**

- Removes from persistence
- Updates local sessions state
- Clears active session if it was the deleted one
- Updates filtered session list

#### `duplicateSession(sessionId: string): Promise<string>`

Creates a copy of an existing session.

**Returns:** Promise resolving to the new session ID

**Usage:**

```typescript
const { duplicateSession } = useStore();
const newSessionId = await duplicateSession("original-session");
```

#### `renameSession(sessionId: string, newName: string): Promise<void>`

Renames an existing session.

**Usage:**

```typescript
const { renameSession } = useStore();
await renameSession("session-id", "New Session Name");
```

### Session Metadata Management

#### `updateSessionMetadata(sessionId: string, metadata: Partial<SessionMetadata>, updateTimestamp?: boolean)`

Updates session metadata without full persistence.

**Parameters:**

- `sessionId`: Target session ID
- `metadata`: Partial metadata object to merge
- `updateTimestamp`: Whether to update the `updatedAt` timestamp (default: false)

**Usage:**

```typescript
const { updateSessionMetadata } = useStore();
updateSessionMetadata("session-id", {
  isRunning: true,
  status: SessionStatus.RUNNING,
});
```

#### `markSessionAsUnsaved(sessionId?: string)`

Marks a session as having unsaved changes.

**Usage:**

```typescript
const { markSessionAsUnsaved } = useStore();
markSessionAsUnsaved(); // Marks active session
markSessionAsUnsaved("specific-session"); // Marks specific session
```

### Search and Filtering

#### `setSearchQuery(query: string)`

Sets the search query and filters sessions.

**Usage:**

```typescript
const { setSearchQuery } = useStore();
setSearchQuery("workflow name");
```

#### `filterSessions()`

Filters sessions based on current search query.

**Behavior:**

- Uses session service to search session content
- Updates `filteredSessionIds` with matching results
- Searches session names and node content

#### `refreshSessions(): Promise<void>`

Reloads all sessions from persistence.

**Usage:**

```typescript
const { refreshSessions } = useStore();
await refreshSessions();
```

### Auto-Save

#### `enableAutoSave()` / `disableAutoSave()`

Controls auto-save functionality.

**Usage:**

```typescript
const { enableAutoSave, disableAutoSave } = useStore();
enableAutoSave();
disableAutoSave();
```

#### `triggerAutoSave(): Promise<void>`

Manually triggers auto-save if conditions are met.

**Conditions:**

- Auto-save is enabled
- There are unsaved changes
- There is an active session

**Usage:**

```typescript
const { triggerAutoSave } = useStore();
await triggerAutoSave();
```

## Settings Management

### State Properties

```typescript
interface SettingsState {
  settings: AppSettings;
  settingsLoaded: boolean;
  settingsDialog: {
    isOpen: boolean;
    activeTab: string;
  };
}
```

### Settings Actions

#### `updateSettings(settings: Partial<AppSettings>): Promise<void>`

Updates application settings.

**Usage:**

```typescript
const { updateSettings } = useStore();
await updateSettings({
  theme: "dark",
  autoSaveInterval: 60,
});
```

#### `updateProviderSettings(provider: LLMProvider, settings: Partial<ProviderSettings>): Promise<void>`

Updates settings for a specific LLM provider.

**Usage:**

```typescript
const { updateProviderSettings } = useStore();
await updateProviderSettings("openai", {
  defaultModel: "gpt-4",
  enabled: true,
});
```

#### `setApiKey(provider: LLMProvider, apiKey: string): Promise<void>`

Securely stores an API key for a provider.

**Usage:**

```typescript
const { setApiKey } = useStore();
await setApiKey("openai", "sk-...");
```

#### `getApiKey(provider: LLMProvider): Promise<string | null>`

Retrieves a stored API key for a provider.

**Usage:**

```typescript
const { getApiKey } = useStore();
const apiKey = await getApiKey("openai");
```

### Settings Dialog

#### `openSettingsDialog(tab?: string)`

Opens the settings dialog with optional tab selection.

**Usage:**

```typescript
const { openSettingsDialog } = useStore();
openSettingsDialog("providers");
```

#### `closeSettingsDialog()`

Closes the settings dialog.

## Dialog Management

### Confirmation Dialog

#### `showConfirmationDialog(title: string, description: string, onConfirm: () => void)`

Shows a confirmation dialog with custom action.

**Usage:**

```typescript
const { showConfirmationDialog } = useStore();
showConfirmationDialog(
  "Delete Session",
  "Are you sure you want to delete this session?",
  () => deleteSession(sessionId)
);
```

#### `hideConfirmationDialog()`

Hides the confirmation dialog.

### Rename Dialog

#### `showRenameDialog(title: string, currentValue: string, onConfirm: (newName: string) => void)`

Shows a rename dialog with input field.

**Usage:**

```typescript
const { showRenameDialog } = useStore();
showRenameDialog("Rename Session", currentSession.name, (newName) =>
  renameSession(sessionId, newName)
);
```

## Import/Export

### Session Export/Import

#### `exportSession(sessionId: string): Promise<string | null>`

Exports a session to JSON string.

**Usage:**

```typescript
const { exportSession } = useStore();
const exportData = await exportSession("session-id");
```

#### `importSession(sessionData: string): Promise<string | null>`

Imports a session from JSON string.

**Returns:** Promise resolving to the new session ID or null if failed

**Usage:**

```typescript
const { importSession } = useStore();
const newSessionId = await importSession(jsonData);
```

#### `exportAllSessions(): Promise<string>`

Exports all sessions to a bulk export format.

### Settings Export/Import

#### `exportSettings(): Promise<string>`

Exports application settings to JSON.

#### `importSettings(data: string): Promise<void>`

Imports settings from JSON data.

#### `resetSettings(): Promise<void>`

Resets all settings to defaults.

## Initialization

### `initializeStore(): Promise<void>`

Initializes the store and all services.

**Usage:**

```typescript
const { initializeStore } = useStore();
await initializeStore();
```

**Behavior:**

- Initializes session and settings services
- Loads settings from persistence
- Loads all sessions
- Creates default session if none exist
- Sets up error handling

## Usage Patterns

### Basic Store Usage

```typescript
import { useStore } from "@/lib/store";

function MyComponent() {
  const { nodes, edges, setNodes, activeSessionId, saveSession } = useStore();

  // Use store state and actions
  const handleSave = async () => {
    if (activeSessionId) {
      await saveSession();
    }
  };

  return (
    <div>
      <button onClick={handleSave}>Save</button>
      <div>Nodes: {nodes.length}</div>
    </div>
  );
}
```

### Workflow Execution Pattern

```typescript
import { useStore } from "@/lib/store";
import { executionEngine } from "@/lib/execution-engine";

function WorkflowControls() {
  const { workflow, startWorkflow, stopWorkflow } = useStore();

  const handleRun = async () => {
    try {
      startWorkflow();
      await executionEngine.executeWorkflow();
    } catch (error) {
      console.error("Workflow failed:", error);
    }
  };

  const handleStop = () => {
    executionEngine.stopExecution();
    stopWorkflow();
  };

  return (
    <div>
      {workflow.isRunning ? (
        <button onClick={handleStop}>Stop</button>
      ) : (
        <button onClick={handleRun}>Run</button>
      )}
    </div>
  );
}
```

### Session Management Pattern

```typescript
function SessionManager() {
  const {
    sessions,
    activeSessionId,
    createSession,
    loadSession,
    deleteSession,
    showConfirmationDialog,
  } = useStore();

  const handleDelete = (sessionId: string) => {
    const session = sessions[sessionId];
    showConfirmationDialog("Delete Session", `Delete "${session.name}"?`, () =>
      deleteSession(sessionId)
    );
  };

  return (
    <div>
      {Object.values(sessions).map((session) => (
        <div key={session.id}>
          <span onClick={() => loadSession(session.id)}>{session.name}</span>
          <button onClick={() => handleDelete(session.id)}>Delete</button>
        </div>
      ))}
      <button onClick={() => createSession()}>New Session</button>
    </div>
  );
}
```

## Error Handling

The store includes comprehensive error handling:

- All async operations set loading states
- Errors are captured and stored in `error` state
- Failed operations don't leave the store in inconsistent states
- Automatic error recovery where possible

## Performance Considerations

- State updates are batched where possible
- Large operations use loading states for UI feedback
- Auto-save is throttled to prevent excessive saves
- Session filtering is debounced for search performance
- Internal setters prevent unnecessary change tracking

## Type Safety

The store is fully typed with TypeScript:

- All state properties have explicit types
- Action parameters are strongly typed
- Return types are specified for all async operations
- Custom interfaces for complex state objects

This ensures compile-time safety and excellent IDE support for autocomplete and error detection.
