# Changelog

## [Unreleased] - 2025-07-11

### ✨ Major Features

#### Rust Settings Dialog Implementation

- **Native Settings Dialog**: Replaced React-based settings dialog with native Rust implementation
- **Comprehensive Settings Management**:
  - Provider configuration with API key management
  - Theme switching and appearance customization
  - Preferences and advanced settings
  - Export/import functionality with security exclusions
- **Real-time Synchronization**: Settings changes propagate immediately via Tauri events
- **Enhanced Security**: API keys stored securely using Tauri store plugin
- **Provider Testing**: Built-in connection testing for all LLM providers
- **Theme Integration**: Seamless theme switching with OS detection support

#### Store Architecture Refactoring

- **Modular Store Structure**: Refactored monolithic 1282-line store into focused slices
- **Slice-Based Organization**:
  - `canvas-slice.ts`: Node and edge management
  - `workflow-slice.ts`: Workflow execution state
  - `session-slice.ts`: Session CRUD operations
  - `settings-slice.ts`: Settings and theme management
  - `dialog-slice.ts`: Dialog state management
  - `history-slice.ts`: Text node history management
  - `autosave-slice.ts`: Auto-save functionality
- **Enhanced Type Safety**: Improved TypeScript support with dedicated slice interfaces
- **Utility Functions**: Added selectors and helper functions for common operations
- **Backward Compatibility**: Legacy `store.ts` imports still work seamlessly
- **Better Maintainability**: Easier to test, debug, and extend individual features

#### Text Node Edit History with Undo/Redo

- **Independent Node History**: Each text node maintains its own edit history stack
- **Smart Keyboard Shortcuts**:
  - `Ctrl/Cmd+Z`: Undo to previous save point (when node is selected)
  - `Ctrl/Cmd+Shift+Z`: Redo to next save point (when node is selected)
  - `Ctrl/Cmd+Y`: Alternative redo shortcut
- **Context-Aware Operation**: Only works when node is selected but textarea is not focused
- **Native Textarea Support**: Preserves built-in undo/redo when actively typing
- **Save Point History**: History snapshots only captured when workflows are saved (auto-save or manual Ctrl/Cmd+S)
- **Memory Management**: History limited to 100 save points per node to prevent memory issues

#### LLM Workflow Execution System

- **Multiple Output Streaming**: LLM nodes now stream to ALL connected output nodes simultaneously
- **Content Preservation**: Output nodes preserve content until new data arrives
- **Enhanced Error Handling**: Errors propagate to all connected outputs with proper cleanup
- **Real-time Visual Feedback**: All nodes show status indicators during execution

#### App-Wide Dark Mode

- **Complete Theme System**: Fully functional dark mode with light → dark → system switching
- **Theme Toggle Button**: Header button with Sun, Moon, Monitor icons for each mode
- **System Detection**: Real-time OS theme detection and response
- **Theme Persistence**: Settings persist across app sessions

#### Output Node Copy Functionality

- **Copy Button**: Convenient copy button in output nodes with visual feedback
- **Smart Behavior**: Only appears when content is available, works with streaming

### 🐛 Bug Fixes

#### Streaming and Output Issues

- **Fixed Single Output Limitation**: LLM nodes now stream to multiple outputs instead of just the first
- **Fixed Content Clearing**: Content persists until new data arrives
- **Fixed Unconnected LLM Nodes**: Nodes without inputs maintain idle state instead of erroring

#### Session and State Issues

- **Automatic Error Clearing**: Session errors clear when starting new workflows
- **Fixed Text Node Data Loss**: Text input now persists across app reloads
- **Fixed Session Loading**: Sessions no longer immediately mark as unsaved when clicked

#### Text Node History Synchronization

- **Fixed Text Appending Issue**: Resolved issue where undo/redo operations would append text instead of replacing it after switching sessions
- **Improved Store Mutations**: All text history operations now properly update nodes immutably
- **Enhanced Synchronization**: TextNode component now properly syncs with store updates to prevent race conditions
- **Better Error Handling**: Added comprehensive error handling and debugging for history operations
- **Optimized History Capture**: Changed from capturing every keystroke to only capturing history at save points for better performance and more meaningful undo/redo operations
- **Smart History Filtering**: Empty changes and duplicate saves no longer create unnecessary history entries

---

## [Previous] - 2025-07-10

### ✨ Major Features

#### Settings Management System

- **Settings Dialog**: Tabbed interface with Providers, Appearance, Preferences, and Advanced tabs
- **Secure API Key Storage**: Encrypted storage using Tauri's secure store
- **Provider Management**: Support for OpenAI, Anthropic, Google, Cohere, and Ollama
- **Settings Export/Import**: Full settings backup and restore functionality

#### Session Management System

- **Tabbed Sidebar**: Sessions and Nodes tabs with full CRUD operations
- **Session Persistence**: Reliable data persistence across app restarts
- **Session Search**: Search across session names and content
- **Auto-save**: Automatic saving every 30 seconds for unsaved changes
- **Status Indicators**: Visual dots for saved, unsaved, running, and error states

#### Enhanced User Experience

- **Context Menus**: Right-click menus for canvas and session operations
- **Keyboard Shortcuts**: Comprehensive shortcuts for all major operations
- **Modern Dialogs**: Replaced native dialogs with shadcn components
- **Node Library**: Organized drag-and-drop node creation with categories

### 🐛 Bug Fixes

- **Fixed API Key Validation**: OpenAI API keys now validate correctly regardless of length
- **Fixed NaN Token Count**: Output nodes no longer display "NaN" for token counts
- **Fixed Session State**: Sessions load properly without triggering unsaved state
