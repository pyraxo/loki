# Loki Store API Documentation

## Overview

Loki uses a modernized Zustand store architecture based on **slices** for comprehensive state management. The store was refactored from a monolithic 1282-line file into focused, maintainable slices that provide clear separation of concerns while maintaining type safety throughout.

## Architecture

### Store Structure

The store is organized into **7 focused slices**:

```
src/lib/store/
├── index.ts              # Main store composition
├── types.ts              # All store-related types
├── slices/
│   ├── canvas-slice.ts   # Node/edge management
│   ├── workflow-slice.ts # Workflow execution
│   ├── session-slice.ts  # Session CRUD operations
│   ├── settings-slice.ts # Settings & theme management
│   ├── dialog-slice.ts   # Dialog states
│   ├── history-slice.ts  # Text history/undo-redo
│   └── autosave-slice.ts # Auto-save functionality
└── utils/
    ├── selectors.ts      # Reusable selectors
    └── store-utils.ts    # Helper functions
```

### Slice Pattern

Each slice follows the Zustand slice pattern:

```typescript
export const createSliceName: StateCreator<
  StoreState,
  [],
  [],
  SliceInterface
> = (set, get, store) => ({
  // State
  someState: initialValue,

  // Actions
  someAction: () => {
    // Implementation
  },
});
```

## Usage

### Basic Usage

```typescript
import { useStore } from "@/lib/store";

// Access state and actions
const { nodes, setNodes, updateNodeData } = useStore();

// Use with selectors for optimized re-renders
import { selectCanvasState } from "@/lib/store";
const canvasState = useStore(selectCanvasState);
```

### Selectors

Use selectors for optimized re-renders:

```typescript
import {
  selectActiveSession,
  selectWorkflowState,
  selectCanUndo,
  selectCanRedo,
} from "@/lib/store";

const activeSession = useStore(selectActiveSession);
const workflowState = useStore(selectWorkflowState);
const canUndo = useStore(selectCanUndo(nodeId));
```

## Store Slices

### 1. Canvas Slice (`canvas-slice.ts`)

Manages React Flow nodes, edges, and canvas operations.

#### State

```typescript
interface CanvasSlice {
  nodes: CustomNode[];
  edges: Edge[];
  hasUnsavedChanges: boolean;
}
```

#### Key Actions

```typescript
// Node management
setNodes(nodes: CustomNode[]) // Updates nodes and marks as unsaved
setNodesInternal(nodes: CustomNode[]) // Internal React Flow changes
updateNodeData(nodeId: string, data: Partial<NodeData>) // Updates specific node
updateNodeDataDuringExecution(nodeId: string, data: Partial<NodeData>) // Execution updates
updateNodeStatus(nodeId: string, status: NodeStatus, error?: string) // Status updates

// Edge management
setEdges(edges: Edge[]) // Updates edges and marks as unsaved
setEdgesInternal(edges: Edge[]) // Internal React Flow changes
```

#### Usage Examples

```typescript
// Update node data
const { updateNodeData } = useStore();
updateNodeData("node-1", { text: "New text" });

// Update node status during execution
const { updateNodeStatus } = useStore();
updateNodeStatus("node-1", "running");
```

### 2. Workflow Slice (`workflow-slice.ts`)

Manages workflow execution state and node completion tracking.

#### State

```typescript
interface WorkflowSlice {
  workflow: {
    isRunning: boolean;
    currentNode: string | undefined;
    completedNodes: string[];
    errorNodes: string[];
  };
}
```

#### Key Actions

```typescript
startWorkflow() // Starts workflow execution
stopWorkflow() // Stops workflow execution
markNodeCompleted(nodeId: string) // Marks node as completed
markNodeError(nodeId: string, error: string) // Marks node as errored
resetWorkflow() // Resets all workflow state
checkWorkflowCompletion() // Checks if workflow is complete
```

#### Usage Examples

```typescript
// Start workflow
const { startWorkflow } = useStore();
startWorkflow();

// Mark node as completed
const { markNodeCompleted } = useStore();
markNodeCompleted("node-1");

// Check workflow state
const { workflow } = useStore();
if (workflow.isRunning) {
  console.log("Workflow is running");
}
```

### 3. Session Slice (`session-slice.ts`)

Manages session CRUD operations, search, and metadata.

#### State

```typescript
interface SessionSlice {
  sessions: Record<string, Session>;
  activeSessionId: string | null;
  searchQuery: string;
  filteredSessionIds: string[];
  isLoading: boolean;
  error: string | null;
}
```

#### Key Actions

```typescript
// Session CRUD
createSession(name?: string): Promise<string>
loadSession(sessionId: string): Promise<void>
saveSession(sessionId?: string): Promise<void>
deleteSession(sessionId: string): Promise<void>
duplicateSession(sessionId: string): Promise<string>
renameSession(sessionId: string, newName: string): Promise<void>

// Session management
setActiveSession(sessionId: string)
updateSessionMetadata(sessionId: string, metadata: Partial<SessionMetadata>)
markSessionAsUnsaved(sessionId?: string)
markSessionAsRunning(sessionId?: string)
markSessionAsError(sessionId: string, error: string)
markSessionAsCompleted(sessionId: string)

// Search and filtering
setSearchQuery(query: string)
filterSessions()
refreshSessions(): Promise<void>

// Export/Import
exportSession(sessionId: string): Promise<string | null>
importSession(sessionData: string): Promise<string | null>
exportAllSessions(): Promise<string>
```

#### Usage Examples

```typescript
// Create and load session
const { createSession, loadSession } = useStore();
const sessionId = await createSession("My Session");
await loadSession(sessionId);

// Search sessions
const { setSearchQuery } = useStore();
setSearchQuery("my search");

// Export session
const { exportSession } = useStore();
const sessionData = await exportSession(sessionId);
```

### 4. Settings Slice (`settings-slice.ts`)

Manages application settings, provider configurations, and theme.

#### State

```typescript
interface SettingsSlice {
  settings: AppSettings;
  settingsLoaded: boolean;
}
```

#### Key Actions

```typescript
// Settings management
updateSettings(settings: Partial<AppSettings>): Promise<void>
updateProviderSettings(provider: LLMProvider, settings: Partial<ProviderSettings>): Promise<void>
setApiKey(provider: LLMProvider, apiKey: string): Promise<void>
getApiKey(provider: LLMProvider): Promise<string | null>

// Theme management
setTheme(theme: ThemeMode): Promise<void>
initializeTheme(): Promise<void>

// Settings export/import
exportSettings(): Promise<string>
importSettings(data: string): Promise<void>
resetSettings(): Promise<void>
```

#### Usage Examples

```typescript
// Update theme
const { setTheme } = useStore();
await setTheme("dark");

// Update provider settings
const { updateProviderSettings } = useStore();
await updateProviderSettings("openai", {
  model: "gpt-4",
  temperature: 0.7,
});

// Set API key
const { setApiKey } = useStore();
await setApiKey("openai", "sk-...");
```

### 5. Dialog Slice (`dialog-slice.ts`)

Manages UI dialog states (confirmation, rename, settings).

#### State

```typescript
interface DialogSlice {
  confirmationDialog: {
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    onConfirm: (() => void) | null;
  };
  renameDialog: {
    isOpen: boolean;
    title: string;
    currentValue: string;
    onConfirm: ((newName: string) => void) | null;
  };
  settingsDialog: {
    isOpen: boolean;
    activeTab: string;
  };
}
```

#### Key Actions

```typescript
// Confirmation dialog
showConfirmationDialog(title: string, description: string, onConfirm: () => void, confirmText?: string)
hideConfirmationDialog()

// Rename dialog
showRenameDialog(title: string, currentValue: string, onConfirm: (newName: string) => void)
hideRenameDialog()

// Settings dialog
openSettingsDialog(tab?: string)
closeSettingsDialog()
toggleSettingsDialog()
```

#### Usage Examples

```typescript
// Show confirmation dialog
const { showConfirmationDialog } = useStore();
showConfirmationDialog(
  "Delete Session",
  "Are you sure you want to delete this session?",
  () => deleteSession(sessionId),
  "Delete"
);

// Show rename dialog
const { showRenameDialog } = useStore();
showRenameDialog("Rename Session", currentName, (newName) =>
  renameSession(sessionId, newName)
);
```

### 6. History Slice (`history-slice.ts`)

Manages text node edit history with undo/redo functionality.

#### Key Actions

```typescript
addTextHistoryEntry(nodeId: string, text: string) // Add history entry
undoTextChange(nodeId: string): boolean // Undo last change
redoTextChange(nodeId: string): boolean // Redo last undone change
captureTextHistoryAtSavePoint() // Capture history at save point
```

#### Usage Examples

```typescript
// Add to history
const { addTextHistoryEntry } = useStore();
addTextHistoryEntry("node-1", "New text content");

// Undo/redo
const { undoTextChange, redoTextChange } = useStore();
const canUndo = undoTextChange("node-1");
const canRedo = redoTextChange("node-1");

// Check if can undo/redo
import { selectCanUndo, selectCanRedo } from "@/lib/store";
const canUndo = useStore(selectCanUndo("node-1"));
const canRedo = useStore(selectCanRedo("node-1"));
```

### 7. Auto-save Slice (`autosave-slice.ts`)

Manages auto-save functionality and unsaved changes tracking.

#### State

```typescript
interface AutoSaveSlice {
  autoSaveEnabled: boolean;
}
```

#### Key Actions

```typescript
enableAutoSave() // Enable auto-save
disableAutoSave() // Disable auto-save
triggerAutoSave(): Promise<void> // Trigger auto-save if enabled
```

#### Usage Examples

```typescript
// Control auto-save
const { enableAutoSave, disableAutoSave, triggerAutoSave } = useStore();
enableAutoSave();
await triggerAutoSave();
```

## Selectors

### Canvas Selectors

```typescript
selectCanvasState(state); // Canvas state (nodes, edges, hasUnsavedChanges)
selectNodeById(nodeId)(state); // Specific node by ID
selectTextNodeData(nodeId)(state); // Text node data
```

### Workflow Selectors

```typescript
selectWorkflowState(state); // Workflow state
selectIsWorkflowRunning(state); // Is workflow running
```

### Session Selectors

```typescript
selectActiveSession(state); // Active session
selectSessionById(sessionId)(state); // Session by ID
selectFilteredSessions(state); // Filtered sessions
selectSessionLoadingState(state); // Loading state
```

### Settings Selectors

```typescript
selectSettings(state); // All settings
selectProviderSettings(provider)(state); // Provider settings
selectTheme(state); // Current theme
```

### Dialog Selectors

```typescript
selectConfirmationDialog(state); // Confirmation dialog state
selectRenameDialog(state); // Rename dialog state
selectSettingsDialog(state); // Settings dialog state
```

### History Selectors

```typescript
selectTextHistory(nodeId)(state); // Text history for node
selectCanUndo(nodeId)(state); // Can undo
selectCanRedo(nodeId)(state); // Can redo
```

### Composite Selectors

```typescript
selectCanSave(state); // Can save session
selectSessionStatus(sessionId)(state); // Session status
selectActiveSessionStatus(state); // Active session status
```

## Utilities

### Store Utilities (`store-utils.ts`)

```typescript
// Node utilities
findNodeById(nodes, nodeId); // Find node by ID
isNodeOfType(nodes, nodeId, nodeType); // Check node type
getNodesByType(nodes, nodeType); // Get nodes by type
updateNodeInArray(nodes, nodeId, updateFn); // Update node in array

// Session utilities
getSessionSummary(session); // Get session summary
hasUnsavedChanges(session); // Check unsaved changes
getUnsavedSessions(sessions); // Get unsaved sessions
sortSessionsByDate(sessions, ascending); // Sort sessions by date

// Workflow utilities
calculateWorkflowProgress(totalNodes, completedNodes, errorNodes); // Calculate progress

// General utilities
getNodeDisplayName(node); // Get display name for node
isValidSession(session); // Validate session data
debounce(func, delay); // Debounce function
```

## Migration Guide

### From Monolithic Store

The refactored store maintains **100% backward compatibility**. All existing imports continue to work:

```typescript
// This still works
import { useStore } from "@/lib/store";
const { nodes, setNodes, createSession } = useStore();
```

### Recommended Migration

For new code, use selectors for better performance:

```typescript
// Before
const { nodes, edges, hasUnsavedChanges } = useStore();

// After (more efficient)
import { selectCanvasState } from "@/lib/store";
const canvasState = useStore(selectCanvasState);
```

### Testing Individual Slices

You can now test slices in isolation:

```typescript
import { createCanvasSlice } from "@/lib/store/slices/canvas-slice";

// Test just the canvas slice
const mockSet = jest.fn();
const mockGet = jest.fn();
const mockStore = jest.fn();
const canvasSlice = createCanvasSlice(mockSet, mockGet, mockStore);
```

## Best Practices

### 1. Use Selectors

```typescript
// ✅ Good - optimized re-renders
const activeSession = useStore(selectActiveSession);

// ❌ Less optimal - subscribes to entire store
const { sessions, activeSessionId } = useStore();
const activeSession = activeSessionId ? sessions[activeSessionId] : null;
```

### 2. Batch Updates

```typescript
// ✅ Good - single update
const { updateNodeData } = useStore();
updateNodeData(nodeId, { text: "new text", status: "idle" });

// ❌ Less optimal - multiple updates
const { updateNodeData, updateNodeStatus } = useStore();
updateNodeData(nodeId, { text: "new text" });
updateNodeStatus(nodeId, "idle");
```

### 3. Use Appropriate Actions

```typescript
// ✅ Good - for user actions
const { setNodes } = useStore();
setNodes(newNodes); // Marks as unsaved

// ✅ Good - for internal React Flow updates
const { setNodesInternal } = useStore();
setNodesInternal(newNodes); // Doesn't mark as unsaved
```

### 4. Handle Async Operations

```typescript
// ✅ Good - proper error handling
const { createSession } = useStore();
try {
  const sessionId = await createSession("New Session");
  // Handle success
} catch (error) {
  // Handle error
}
```

### 5. Use Utilities

```typescript
// ✅ Good - use provided utilities
import { findNodeById } from "@/lib/store";
const node = findNodeById(nodes, nodeId);

// ❌ Less optimal - manual implementation
const node = nodes.find((n) => n.id === nodeId);
```

## Type Safety

The refactored store provides enhanced type safety:

```typescript
// All slices are properly typed
interface StoreState =
  CanvasSlice &
  WorkflowSlice &
  SessionSlice &
  SettingsSlice &
  DialogSlice &
  HistorySlice &
  AutoSaveSlice & {
    initializeStore: () => Promise<void>;
  };
```

Every action and selector is fully typed, providing excellent IDE support and catching errors at compile time.

## Performance Optimizations

### 1. Selective Subscriptions

Use selectors to subscribe only to needed state:

```typescript
// Only re-renders when canvas state changes
const canvasState = useStore(selectCanvasState);
```

### 2. Memoized Selectors

Selectors are designed to be memoized:

```typescript
// This selector can be memoized
const selectNodeText = useMemo(() => selectTextNodeData(nodeId), [nodeId]);
```

### 3. Slice Isolation

Each slice manages its own state, reducing update conflicts and improving performance.

## Error Handling

The store provides comprehensive error handling:

```typescript
// Session operations include error states
const { error, isLoading } = useStore();

// Async operations return proper errors
try {
  await createSession("Test");
} catch (error) {
  console.error("Session creation failed:", error);
}
```

## Development Tools

### 1. Debug Logging

Development mode includes comprehensive logging:

```typescript
// History operations log in development
if (process.env.NODE_ENV === "development") {
  console.log(`Added history entry for ${nodeId}`);
}
```

### 2. Store Inspection

Use React DevTools with Zustand DevTools for store inspection:

```typescript
// Store state is fully visible in DevTools
const store = useStore();
```

## Conclusion

The refactored store architecture provides:

- **Maintainability**: Clear separation of concerns
- **Type Safety**: Comprehensive TypeScript support
- **Performance**: Optimized re-renders with selectors
- **Testability**: Individual slices can be tested in isolation
- **Developer Experience**: Better IDE support and debugging
- **Backward Compatibility**: Existing code continues to work

This architecture scales well for future features while maintaining the simplicity and performance that made the original store effective.
