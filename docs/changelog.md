# Changelog

## [Unreleased] - 2025-07-11

### ✨ Major Features

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
