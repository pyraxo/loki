# Loki Utilities API Documentation

## Overview

Loki provides a comprehensive set of utilities and custom React hooks to enhance development productivity and provide consistent functionality across the application. These utilities handle common patterns like auto-save, keyboard shortcuts, session management, and data validation.

The utilities are organized into several categories:

- **Session Utilities**: Session management helpers and validation
- **Custom Hooks**: React hooks for auto-save, shortcuts, and warnings
- **General Utilities**: Common functions and type utilities

## Session Utilities

### `SessionUtils` Object

A collection of utility functions for session management, validation, and data manipulation.

```typescript
export const SessionUtils = {
  generateSessionName: (existingNames: string[], baseName?: string) => string;
  formatTimestamp: (timestamp: string) => string;
  deepEqual: (obj1: any, obj2: any) => boolean;
  validateSessionData: (data: any) => boolean;
  sanitizeSessionName: (name: string) => string;
  calculateSessionSize: (session: any) => string;
  getSessionHealth: (session: any) => { status: string; issues: string[] };
};
```

#### `generateSessionName(existingNames: string[], baseName?: string): string`

Generates a unique session name that doesn't conflict with existing names.

**Parameters:**

- `existingNames`: Array of existing session names to avoid conflicts
- `baseName`: Base name to use (defaults to "Untitled Session")

**Returns:** Unique session name with numeric suffix if needed

**Usage:**

```typescript
import { SessionUtils } from "@/lib/session-utils";

const existingNames = ["My Session", "My Session 1", "My Session 2"];
const newName = SessionUtils.generateSessionName(existingNames, "My Session");
console.log(newName); // 'My Session 3'

// With default base name
const defaultName = SessionUtils.generateSessionName(existingNames);
console.log(defaultName); // 'Untitled Session'
```

**Algorithm:**

- Starts with base name
- Appends incrementing number if conflicts exist
- Continues until unique name is found

#### `formatTimestamp(timestamp: string): string`

Formats ISO timestamp strings into human-readable relative time.

**Usage:**

```typescript
const timestamp = "2025-01-11T10:30:00Z";
const formatted = SessionUtils.formatTimestamp(timestamp);
console.log(formatted); // '2h ago', '3d ago', 'Jan 11', etc.
```

**Time Ranges:**

- Less than 1 minute: "Just now"
- Less than 1 hour: "{minutes}m ago"
- Less than 24 hours: "{hours}h ago"
- Less than 7 days: "{days}d ago"
- Older: Formatted date string

#### `deepEqual(obj1: any, obj2: any): boolean`

Performs deep equality comparison between two objects.

**Features:**

- Handles nested objects and arrays
- Null and undefined safe
- Primitive value comparison
- Recursive property checking

**Usage:**

```typescript
const obj1 = { user: { name: "John", settings: { theme: "dark" } } };
const obj2 = { user: { name: "John", settings: { theme: "dark" } } };

const isEqual = SessionUtils.deepEqual(obj1, obj2);
console.log(isEqual); // true
```

**Use Cases:**

- Change detection for auto-save
- Session state comparison
- Settings validation
- Optimistic updates

#### `validateSessionData(data: any): boolean`

Validates session import data structure and integrity.

**Validation Checks:**

- Required fields presence (`version`, `session`)
- Session object structure
- Essential session properties
- Data type validation

**Usage:**

```typescript
const importData = JSON.parse(sessionFile);
const isValid = SessionUtils.validateSessionData(importData);

if (isValid) {
  await importSession(importData);
} else {
  console.error("Invalid session data format");
}
```

**Required Structure:**

```typescript
{
  version: "1.0.0",
  session: {
    id: string,
    name: string,
    nodes: CustomNode[],
    edges: Edge[],
    metadata: SessionMetadata,
    createdAt: string,
    updatedAt: string
  }
}
```

#### `sanitizeSessionName(name: string): string`

Sanitizes session names for safe file storage and display.

**Sanitization Rules:**

- Removes invalid filename characters: `<>:"/\|?*`
- Trims whitespace
- Limits length to 100 characters
- Preserves Unicode characters

**Usage:**

```typescript
const userInput = 'My Session: "Advanced" <Test>';
const sanitized = SessionUtils.sanitizeSessionName(userInput);
console.log(sanitized); // 'My Session Advanced Test'
```

#### `calculateSessionSize(session: any): string`

Calculates and formats the storage size of a session.

**Returns:** Human-readable size string (B, KB, MB)

**Usage:**

```typescript
const session = { nodes: [...], edges: [...] };
const size = SessionUtils.calculateSessionSize(session);
console.log(size); // '2.5 KB', '1.2 MB', etc.
```

**Size Calculation:**

- Serializes session to JSON
- Calculates byte size using Blob
- Formats with appropriate units

#### `getSessionHealth(session: any): { status: string; issues: string[] }`

Analyzes session health and identifies potential issues.

**Health Checks:**

- Empty workflow detection
- Disconnected nodes
- Missing start node
- Orphaned nodes
- Workflow integrity

**Returns:**

```typescript
{
  status: 'healthy' | 'warning' | 'error',
  issues: string[]
}
```

**Usage:**

```typescript
const health = SessionUtils.getSessionHealth(session);
console.log("Status:", health.status);
console.log("Issues:", health.issues);

// Example output:
// Status: 'warning'
// Issues: ['2 disconnected nodes', 'No start node found']
```

**Health Status Levels:**

- **healthy**: No issues detected
- **warning**: Minor issues that don't prevent execution
- **error**: Critical issues that prevent workflow execution

## Custom Hooks

### `useAutoSave(intervalMs?: number)`

Provides automatic session saving functionality with configurable intervals.

**Parameters:**

- `intervalMs`: Auto-save interval in milliseconds (default: 30000)

**Features:**

- Respects global auto-save enabled setting
- Only saves when there are unsaved changes
- Automatic cleanup on unmount
- Configurable save interval

**Usage:**

```typescript
import { useAutoSave } from "@/lib/session-utils";

function MyComponent() {
  // Auto-save every 30 seconds (default)
  useAutoSave();

  // Custom interval - save every minute
  useAutoSave(60000);

  return <div>Content with auto-save</div>;
}
```

**Implementation Details:**

- Uses `setInterval` for periodic saves
- Checks `autoSaveEnabled` and `hasUnsavedChanges` flags
- Calls `triggerAutoSave()` from store
- Clears interval on component unmount

### `useSessionShortcuts()`

Provides comprehensive keyboard shortcuts for session management.

**Features:**

- Smart focus detection (doesn't trigger when typing)
- Session creation, saving, and navigation
- Context-aware operations
- Cross-platform key combinations

**Keyboard Shortcuts:**

#### Global Shortcuts

- `Cmd/Ctrl + N` - Create new session
- `Cmd/Ctrl + S` - Save current session
- `Cmd/Ctrl + 1-9` - Switch to session by index

#### Session-Specific Shortcuts (when not typing)

- `F2` - Rename active session
- `Cmd/Ctrl + D` - Duplicate active session
- `Cmd/Ctrl + E` - Export active session
- `Cmd/Ctrl + Delete` - Delete active session

**Usage:**

```typescript
import { useSessionShortcuts } from "@/lib/session-utils";

function App() {
  useSessionShortcuts();

  return <div>{/* Shortcuts work automatically throughout the app */}</div>;
}
```

**Smart Focus Detection:**
The hook intelligently detects when user is typing to prevent accidental shortcuts:

```typescript
const isInputFocused =
  activeElement &&
  (activeElement.tagName === "INPUT" ||
    activeElement.tagName === "TEXTAREA" ||
    activeElement.contentEditable === "true");
```

**Dialog Integration:**
Shortcuts automatically integrate with confirmation and rename dialogs:

```typescript
// Delete with confirmation
if (event.key === "Delete" && (event.metaKey || event.ctrlKey)) {
  showConfirmationDialog(
    "Delete Session",
    `Are you sure you want to delete "${currentSession.name}"?`,
    () => deleteSession(activeSessionId)
  );
}

// Rename with dialog
if (event.key === "F2") {
  showRenameDialog("Rename Session", currentSession.name, (newName) =>
    renameSession(activeSessionId, newName)
  );
}
```

### `useUnsavedChangesWarning()`

Provides browser warning when leaving with unsaved changes.

**Features:**

- Monitors `hasUnsavedChanges` store state
- Shows native browser confirmation dialog
- Prevents accidental data loss
- Automatic cleanup

**Usage:**

```typescript
import { useUnsavedChangesWarning } from "@/lib/session-utils";

function App() {
  useUnsavedChangesWarning();

  return <div>App with unsaved changes protection</div>;
}
```

**Implementation:**

- Uses `beforeunload` event
- Only shows warning when changes exist
- Returns standard warning message
- Cleans up event listener on unmount

**Browser Behavior:**

- Triggers when user tries to:
  - Close browser tab/window
  - Navigate to different URL
  - Refresh page
  - Close browser application

## General Utilities

### `cn(...inputs: ClassValue[]): string`

Utility function for conditional CSS class name composition using `clsx` and `tailwind-merge`.

**Located:** `@/lib/utils`

**Features:**

- Conditional class application
- Tailwind CSS class deduplication
- Type-safe class composition
- Performance optimized

**Usage:**

```typescript
import { cn } from "@/lib/utils";

// Basic usage
const className = cn("base-class", "additional-class");

// Conditional classes
const className = cn(
  "base-class",
  isActive && "active-class",
  isDisabled && "disabled-class"
);

// Tailwind conflict resolution
const className = cn(
  "p-4 p-6", // Only 'p-6' will be applied
  "text-red-500",
  isError && "text-red-700" // Will override text-red-500
);

// Object syntax
const className = cn({
  "base-class": true,
  "active-class": isActive,
  "disabled-class": isDisabled,
});

// Array syntax
const className = cn([
  "base-class",
  isActive && "active-class",
  isDisabled && "disabled-class",
]);
```

**Integration with Components:**

```typescript
interface ButtonProps {
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  className?: string;
}

function Button({ variant = "primary", size = "md", className, ...props }) {
  return (
    <button
      className={cn(
        // Base styles
        "font-medium rounded focus:outline-none",

        // Variant styles
        {
          "bg-blue-500 text-white": variant === "primary",
          "bg-gray-200 text-gray-800": variant === "secondary",
        },

        // Size styles
        {
          "px-2 py-1 text-sm": size === "sm",
          "px-4 py-2": size === "md",
          "px-6 py-3 text-lg": size === "lg",
        },

        // Custom classes
        className
      )}
      {...props}
    />
  );
}
```

## Usage Patterns

### Auto-Save Implementation

```typescript
import { useAutoSave, useUnsavedChangesWarning } from "@/lib/session-utils";

function WorkflowEditor() {
  // Enable auto-save every 30 seconds
  useAutoSave(30000);

  // Warn before leaving with unsaved changes
  useUnsavedChangesWarning();

  return <div>{/* Editor content */}</div>;
}
```

### Session Management with Shortcuts

```typescript
import { useSessionShortcuts } from "@/lib/session-utils";
import { SessionUtils } from "@/lib/session-utils";

function SessionManager() {
  useSessionShortcuts();

  const handleExport = async (sessionId: string) => {
    const session = sessions[sessionId];
    const exportData = await exportSession(sessionId);

    if (exportData) {
      const fileName = `${SessionUtils.sanitizeSessionName(session.name)}.json`;
      const blob = new Blob([exportData], { type: "application/json" });

      // Download file
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return <div>{/* Session list with keyboard shortcuts enabled */}</div>;
}
```

### Session Health Monitoring

```typescript
import { SessionUtils } from "@/lib/session-utils";

function SessionHealthIndicator({ session }) {
  const health = SessionUtils.getSessionHealth(session);

  const getHealthColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-500";
      case "warning":
        return "text-yellow-500";
      case "error":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn("h-2 w-2 rounded-full", getHealthColor(health.status))}
      />
      <span className="text-sm">
        {health.status === "healthy"
          ? "Healthy"
          : `${health.issues.length} issues`}
      </span>

      {health.issues.length > 0 && (
        <div className="text-xs text-gray-500">{health.issues.join(", ")}</div>
      )}
    </div>
  );
}
```

### Data Validation Pipeline

```typescript
import { SessionUtils } from "@/lib/session-utils";

async function handleSessionImport(file: File) {
  try {
    const content = await file.text();
    const data = JSON.parse(content);

    // Validate structure
    if (!SessionUtils.validateSessionData(data)) {
      throw new Error("Invalid session file format");
    }

    // Sanitize session name
    const sanitizedName = SessionUtils.sanitizeSessionName(data.session.name);
    data.session.name = sanitizedName;

    // Check for size
    const size = SessionUtils.calculateSessionSize(data.session);
    console.log(`Importing session: ${size}`);

    // Import the session
    const importedSession = await importSession(JSON.stringify(data));

    if (importedSession) {
      console.log("Session imported successfully");
    }
  } catch (error) {
    console.error("Import failed:", error);
    // Show error to user
  }
}
```

## Performance Considerations

### Auto-Save Optimization

- Uses `setInterval` instead of multiple timeouts
- Checks conditions before triggering saves
- Automatically cleans up timers
- Respects user settings for enable/disable

### Keyboard Shortcuts

- Single global event listener
- Smart focus detection prevents unnecessary processing
- Event delegation for performance
- Proper cleanup on unmount

### Session Utilities

- Memoized calculations where possible
- Lazy evaluation for expensive operations
- Efficient deep comparison algorithms
- Optimized string sanitization

### Memory Management

- Automatic cleanup of event listeners
- Proper timer cleanup in hooks
- No memory leaks in utility functions
- Efficient object comparison algorithms

## Type Safety

All utilities are fully typed with TypeScript:

- Generic utility functions with proper type inference
- Strongly typed hook parameters and return values
- Interface definitions for complex data structures
- Type guards for runtime validation

This ensures compile-time safety and excellent IDE support throughout the application.
