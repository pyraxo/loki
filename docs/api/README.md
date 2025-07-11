# Loki API Documentation

## Overview

Welcome to the comprehensive API documentation for Loki, a visual workflow builder for LLM operations. This documentation covers all aspects of the system's architecture, from the centralized state management to individual utility functions.

Loki is built with TypeScript and React, using modern patterns and best practices to ensure type safety, performance, and maintainability.

## Documentation Structure

### 📊 [Store API](./store.md)

**Centralized State Management with Zustand**

The Store API documentation covers Loki's comprehensive state management system, including:

- **Canvas State**: React Flow nodes, edges, and canvas operations
- **Workflow Execution**: Real-time execution control and status tracking
- **Session Management**: Complete CRUD operations for workflow sessions
- **Settings Management**: Application configuration and provider settings
- **Dialog Management**: UI dialogs for confirmations and user input

**Key Features:**

- Type-safe state operations
- Auto-save functionality
- Real-time workflow execution
- Session persistence and export/import
- Settings validation and secure API key storage

---

### 🔧 [Services API](./services.md)

**Core Services and Business Logic**

The Services API documentation details all backend services and their integrations:

#### **Execution Engine**

- Workflow orchestration with dependency management
- Parallel node execution
- Stream broadcasting to multiple outputs
- Comprehensive error handling and recovery

#### **LLM Service**

- Multi-provider LLM integration (OpenAI, Anthropic, etc.)
- Real-time streaming responses
- Token counting and usage tracking
- Provider-specific optimizations

#### **Session Service**

- Persistent session storage using Tauri secure store
- Advanced search and filtering capabilities
- Import/export with validation
- Session health monitoring

#### **Settings Service**

- Secure API key management with encryption
- Provider configuration and testing
- Settings validation and migration
- Export/import functionality

---

### 🛠️ [Utilities API](./utils.md)

**Helper Functions and Custom Hooks**

The Utilities API documentation covers all helper functions and React hooks:

#### **Session Utilities**

- Session name generation and validation
- Timestamp formatting and data sanitization
- Deep object comparison and health checking
- Size calculation and integrity validation

#### **Custom Hooks**

- `useAutoSave`: Automatic session saving with configurable intervals
- `useSessionShortcuts`: Comprehensive keyboard shortcuts for session management
- `useUnsavedChangesWarning`: Browser warnings for unsaved changes

#### **General Utilities**

- `cn`: Type-safe CSS class composition with Tailwind CSS
- Type utilities and validation helpers
- Performance optimization patterns

---

### 🎨 [Nodes API](./nodes.md)

**Visual Workflow Components**

The Nodes API documentation covers the visual workflow system:

- **Node Types**: Start, Text Prompt, LLM Invocation, and Output nodes
- **Node Architecture**: Common properties, status system, and error handling
- **Context Menus**: Right-click interactions and keyboard shortcuts
- **Workflow Examples**: Common patterns and use cases

## Quick Start Guide

### Basic Store Usage

```typescript
import { useStore } from "@/lib/store";

function MyComponent() {
  const { nodes, edges, setNodes, activeSessionId, saveSession } = useStore();

  const handleSave = async () => {
    if (activeSessionId) {
      await saveSession();
    }
  };

  return (
    <div>
      <button onClick={handleSave}>Save Session</button>
      <div>Nodes: {nodes.length}</div>
    </div>
  );
}
```

### Workflow Execution

```typescript
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

  return (
    <button onClick={workflow.isRunning ? stopWorkflow : handleRun}>
      {workflow.isRunning ? "Stop" : "Run"}
    </button>
  );
}
```

### LLM Integration

```typescript
import { LLMService } from "@/lib/llm-service";

const params = {
  model: "gpt-4",
  temperature: 0.7,
  maxTokens: 1000,
};

await LLMService.streamCompletion("What is artificial intelligence?", params, {
  onStart: () => setIsLoading(true),
  onContent: (content) => setStreamContent(content),
  onComplete: (finalContent, tokenCount) => {
    setFinalContent(finalContent);
    setIsLoading(false);
  },
  onError: (error) => setError(error),
});
```

### Session Management with Hooks

```typescript
import {
  useAutoSave,
  useSessionShortcuts,
  useUnsavedChangesWarning,
} from "@/lib/session-utils";

function App() {
  // Enable auto-save every 30 seconds
  useAutoSave(30000);

  // Enable keyboard shortcuts
  useSessionShortcuts();

  // Warn before leaving with unsaved changes
  useUnsavedChangesWarning();

  return <YourAppContent />;
}
```

## Architecture Overview

### State Flow

```
User Interaction → Store Actions → Service Calls → State Updates → UI Updates
```

### Service Dependencies

```
Store (Coordinator)
├── Execution Engine
│   └── LLM Service
│       └── Settings Service (API Keys)
├── Session Service
│   └── Tauri Store (Persistence)
└── Settings Service
    └── Tauri Secure Store (API Keys)
```

### Data Flow

1. **User Actions**: Trigger store actions (create/load/save sessions)
2. **Store Coordination**: Coordinates between services and manages state
3. **Service Operations**: Handle business logic and persistence
4. **State Updates**: Update store state and trigger UI re-renders
5. **Real-time Updates**: Streaming operations update state in real-time

## Type Safety

All APIs are fully typed with TypeScript:

- **Strict Type Checking**: All parameters and return values are strongly typed
- **Interface Definitions**: Clear interfaces for all data structures
- **Generic Utilities**: Type-safe utility functions with proper inference
- **Runtime Validation**: Type guards and validation for external data

## Error Handling

Comprehensive error handling throughout:

- **Graceful Degradation**: System continues working when non-critical operations fail
- **Error Propagation**: Errors bubble up through service layers with context
- **User Feedback**: Clear error messages and recovery suggestions
- **State Consistency**: Failed operations don't leave system in inconsistent state

## Performance Considerations

- **Optimized State Updates**: Batched updates and minimal re-renders
- **Streaming Operations**: Real-time updates without blocking UI
- **Lazy Loading**: Services initialize only when needed
- **Memory Management**: Proper cleanup of resources and event listeners
- **Efficient Algorithms**: Optimized search, filtering, and validation

## Development Workflow

### Adding New Features

1. **Define Types**: Add TypeScript interfaces in `/src/types/`
2. **Implement Service**: Add business logic in appropriate service
3. **Update Store**: Add store actions and state management
4. **Create Components**: Build UI components with proper typing
5. **Add Documentation**: Update API documentation
6. **Write Tests**: Add comprehensive test coverage

### Best Practices

- **Type-First Development**: Define types before implementation
- **Service Separation**: Keep business logic in services, not components
- **Error Handling**: Always handle errors gracefully
- **Performance**: Consider performance implications of state updates
- **Documentation**: Document public APIs and complex logic

## Getting Help

For questions about specific APIs:

1. **Store Questions**: See [Store API Documentation](./store.md)
2. **Service Integration**: See [Services API Documentation](./services.md)
3. **Utility Usage**: See [Utilities API Documentation](./utils.md)
4. **Node Development**: See [Nodes API Documentation](./nodes.md)

For general architecture questions or contributions, please refer to the main project documentation and contribution guidelines.
