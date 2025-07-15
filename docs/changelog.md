# Changelog

## [Unreleased] - 2025-07-11

### ✨ Major Features Added

#### LLM Workflow Execution System

- **Multiple Output Streaming**: LLM invocation nodes now stream identical content to ALL connected output nodes simultaneously
- **Content Preservation**: Output nodes preserve previous run content until new streaming data arrives, eliminating unwanted content clearing
- **Enhanced Error Handling**: Errors propagate to all connected output nodes with proper state cleanup and descriptive error messages
- **Coordinated Status Management**: Both global workflow state and individual node states work together seamlessly
- **Real-time Visual Feedback**: All nodes show appropriate status indicators during execution and streaming phases

#### Execution Engine Improvements

- **Broadcasting Streams**: Modified `executeLLMNode()` to find ALL connected output nodes instead of just the first one
- **Parallel Output Updates**: All streaming callbacks (`onStart`, `onContent`, `onComplete`, `onError`) now use `forEach` loops to broadcast to multiple outputs
- **Smart Content Management**: Output nodes connected to LLM nodes preserve content, while those connected to text nodes update immediately
- **Error State Cleanup**: Error handling now properly cleans up streaming state and provides contextual error messages
- **Workflow Coordination**: Improved dependency-based execution flow for optimal streaming performance

#### App-Wide Dark Mode Implementation

- **Complete Theme System**: Implemented fully functional app-wide dark mode with immediate switching, persistence, and system detection
- **ThemeProvider Integration**: Added next-themes ThemeProvider wrapper for seamless theme management across all components
- **Theme Toggle Button**: Beautiful header toggle button that cycles through light → dark → system modes with appropriate icons (Sun, Moon, Monitor)
- **System Theme Detection**: Real-time detection and response to OS theme changes when "system" mode is selected
- **Theme Persistence**: Theme choices persist across app sessions through existing settings infrastructure
- **Bidirectional Synchronization**: Complete sync between next-themes, Zustand store, and settings service
- **Enhanced Appearance Tab**: Updated settings appearance tab to use new theme actions for immediate application
- **Smooth Transitions**: Polished animations and hover effects throughout the theme switching experience

### 🐛 Bug Fixes

#### Streaming and Output Issues

- **Fixed Single Output Limitation**: Resolved issue where LLM nodes only streamed to the first connected output node
- **Fixed Content Clearing**: Eliminated unwanted content clearing on workflow restart - content now persists until new data arrives
- **Fixed Error Propagation**: Errors now properly propagate to all connected output nodes with appropriate cleanup

#### LLM Node Execution Issues

- **Fixed Unconnected LLM Node Errors**: LLM nodes with no input connections now maintain their original "idle" state instead of throwing errors during workflow execution
- **Improved Execution Flow**: Modified execution engine to skip LLM nodes without inputs while properly marking them as completed for workflow continuation

#### Session Error Management

- **Automatic Error Clearing**: Session errors are now automatically cleared when starting a new workflow execution, preventing stale error messages from persisting in the session tab
- **Enhanced Stream Coordination**: Multiple output nodes now show synchronized streaming indicators and content
- **Fixed Session Status During Execution**: Resolved issue where streaming updates marked sessions as "unsaved" (yellow) instead of preserving "workflow running" (blue) status

#### Text Node Persistence

- **Fixed Text Node Data Loss**: Resolved issue where text entered in text nodes was lost when the app refreshed, reverting to the default "Write a short poem about coding" text
- **Improved State Synchronization**: Added proper synchronization between local component state and store data to ensure text persists across app reloads

### 🏗️ Technical Improvements

#### Execution Flow

- **Stream Fanout**: Implemented proper stream broadcasting to multiple output nodes
- **State Consistency**: Enhanced state management to maintain consistency across global workflow and individual node states
- **Performance Optimization**: Optimized streaming updates to minimize unnecessary re-renders while maintaining real-time feedback
- **Execution State Management**: Added `updateNodeDataDuringExecution()` function to update node data during workflow execution without marking sessions as unsaved, preserving proper status indicators

#### Theme System Architecture

- **Theme Service Bridge**: Created `theme-service.ts` to bridge between next-themes and Zustand store with bidirectional synchronization
- **Theme Sync Hook**: Implemented `useThemeSync` custom hook for automatic theme synchronization and system detection
- **Store Integration**: Added `setTheme` and `initializeTheme` actions to Zustand store for centralized theme management
- **Settings Service Enhancement**: Extended settings service with theme application methods for immediate theme switching
- **Header Integration**: Seamlessly integrated theme toggle into app header with proper drag region handling

---

## [Previous] - 2025-07-10

### ✨ Major Features Added

#### Settings Management System

- **Sidebar Footer**: Added settings footer component at bottom of left sidebar with theme indicator and provider status
- **Comprehensive Settings Dialog**: Implemented tabbed settings interface with four main sections:
  - **Providers Tab**: LLM provider configuration with secure API key management
  - **Appearance Tab**: Theme selection (light/dark/system)
  - **Preferences Tab**: Auto-save intervals and default model parameters
  - **Advanced Tab**: Settings export/import and reset functionality
- **Secure API Key Storage**: API keys stored using Tauri's secure store with encryption
- **Provider Management**: Support for OpenAI (active), Anthropic, Google, Cohere, and Ollama (future)
- **Settings Persistence**: Non-sensitive settings stored locally with export/import capability
- **Provider Status Indicators**: Visual status dots showing provider configuration state

#### Enhanced LLM Service

- **Configurable Providers**: Refactored LLM service to use settings-based API key configuration
- **Secure API Integration**: API keys loaded from secure storage for each request
- **Provider Fallback**: Graceful fallback to OpenAI for unsupported providers
- **Better Error Handling**: Clear error messages for missing API keys and provider issues

### 🐛 Bug Fixes

#### API Key Storage Issue

- **Fixed API Key Validation**: Resolved issue where OpenAI API keys weren't being saved due to overly restrictive validation pattern
- **Root Cause**: The OpenAI API key pattern was expecting exactly 48 characters, but modern OpenAI API keys have variable lengths
- **Solution**: Updated pattern from `/^sk-[a-zA-Z0-9]{48}$/` to `/^sk-[a-zA-Z0-9]{20,}$/` to accept at least 20 characters after the `sk-` prefix
- **Enhanced User Feedback**: Added loading states, success messages, and clear error messages for API key saving operations
- **Improved Error Handling**: Better error messages and visual feedback throughout the provider settings interface
- **Removed Restrictive Format Validation**: Eliminated API key format patterns in favor of actual connection testing
- **Real Connection Testing**: Implemented actual API connection testing for OpenAI to validate keys by making real API calls
- **User-Friendly Validation**: API keys are now validated by testing if they actually work, not by arbitrary format rules

#### Output Node NaN Display Issue

- **Fixed NaN Token Count**: Resolved issue where output nodes displayed "NaN" instead of token counts after successful streaming
- **Root Cause**: The AI SDK sometimes returns `undefined` for `usage.totalTokens`, which was being passed through and displayed as NaN
- **Solution**: Added validation in LLM service to only pass valid numbers for token counts, and enhanced OutputNode to safely handle invalid token counts
- **Defensive Programming**: OutputNode now checks for `typeof tokenCount === 'number' && !isNaN(tokenCount)` before displaying
- **Clean State**: Token count is cleared at the start of each new streaming operation to prevent stale NaN values

#### Session Loading Issue

- **Fixed Session Unsaved State**: Resolved issue where clicking on a session would immediately mark it as unsaved
- **Root Causes**:
  1. Canvas component was initializing demo nodes during render instead of using `useEffect`, causing interference with session loading
  2. Session metadata updates were always updating the `updatedAt` timestamp, even for internal status changes
  3. React Flow's internal change events (selection, positioning during load) were triggering `setNodes`/`setEdges` which always mark sessions as unsaved
- **Solutions**:
  1. Moved initialization logic to `useEffect` with proper conditions to prevent execution during session loading
  2. Modified `updateSessionMetadata` to only update timestamps for actual content changes, not status updates
  3. Added internal setters (`setNodesInternal`/`setEdgesInternal`) that don't mark sessions as unsaved, used for React Flow's internal changes vs user actions

### ✨ Major Features Added

#### Context Menu System Overhaul

- **Canvas Context Menus**: Replaced custom node creation menu with shadcn ContextMenu for enhanced UX
- **Session Context Menus**: Migrated session operations from dropdown buttons to right-click context menus
- **Node Library Integration**: Canvas context menu now uses the same categorized structure as Node Library
- **Categorized Node Creation**: Context menu organizes nodes by categories (Control, Input, AI, Output, Utility)
- **Visual Consistency**: All context menus now follow shadcn design system and accessibility standards
- **Enhanced Keyboard Shortcuts**:
  - **Canvas**: `Cmd/Ctrl + 1-4` - Create specific node types
  - **Canvas**: `Delete/Backspace` - Delete selected nodes/edges
  - **Sessions**: `F2` - Rename active session
  - **Sessions**: `Cmd/Ctrl + D` - Duplicate active session
  - **Sessions**: `Cmd/Ctrl + E` - Export active session
  - **Sessions**: `Cmd/Ctrl + Delete` - Delete active session
- **Smart Focus Detection**: Keyboard shortcuts only trigger when not typing in input fields
- **Improved Accessibility**: Native context menu behavior with keyboard navigation support

#### Session Management System

- **Tabbed Sidebar Interface**: Replaced basic sidebar with comprehensive tabbed interface featuring "Sessions" and "Nodes" tabs
- **Session CRUD Operations**: Full create, read, update, delete, and duplicate functionality for sessions
- **Session Persistence**: Integrated Tauri store for reliable session data persistence across app restarts
- **Session Search**: Comprehensive search functionality across session names and content with debounced input
- **Session Status Indicators**: Visual status indicators for saved, unsaved, running, and error states
- **Session Export/Import**: JSON-based session export and import functionality with validation

#### Enhanced User Experience

- **Auto-save Functionality**: Automatic session saving every 30 seconds for unsaved changes
- **Modern Dialog Components**:
  - Replaced native `confirm()` and `prompt()` dialogs with shadcn Dialog components
  - **Confirmation Dialogs**: Consistent, accessible confirmation dialogs for delete operations
  - **Rename Dialogs**: Rich input dialogs for session renaming with keyboard support (Enter/Escape)
  - **Auto-focus and Text Selection**: Input fields automatically focus and select text for quick editing
- **Keyboard Shortcuts**:
  - `Cmd/Ctrl + N` - Create new session
  - `Cmd/Ctrl + S` - Save current session
  - `Cmd/Ctrl + 1-9` - Switch between sessions
- **Unsaved Changes Warning**: Browser warning when leaving with unsaved changes
- **Context Menus**: Right-click context menus for session operations (rename, duplicate, delete, export)

#### Node Library

- **Drag-and-Drop Node Types**: Organized node library with categories (Control, Input, AI, Output, Utility)
- **Node Type Indicators**: Visual badges for essential and coming soon node types
- **Category Organization**: Logical grouping of node types with descriptions

### 🏗️ Technical Improvements

#### State Management

- **Enhanced Zustand Store**: Extended store with comprehensive session management state
- **Session Service**: Dedicated service layer for Tauri store integration
- **Session Utilities**: Utility functions for auto-save, keyboard shortcuts, and session validation

#### Component Architecture

- **Modular Components**: Created reusable session management components
- **Type Safety**: Comprehensive TypeScript interfaces for session data structures
- **Error Handling**: Robust error handling throughout session operations

### 📁 Files Added/Modified

#### New Files

- `src/types/sessions.ts` - Session type definitions and interfaces
- `src/types/settings.ts` - Settings type definitions and provider metadata
- `src/lib/session-service.ts` - Session persistence service
- `src/lib/settings-service.ts` - Settings persistence and secure API key management
- `src/lib/session-utils.ts` - Session management utilities and hooks
- `src/components/session/SessionList.tsx` - Session list component
- `src/components/session/SessionItem.tsx` - Individual session item component
- `src/components/session/SessionSearch.tsx` - Session search component
- `src/components/session/NodeLibrary.tsx` - Node library component
- `src/components/sidebar-footer.tsx` - Settings footer component
- `src/components/settings/SettingsDialog.tsx` - Main settings dialog component
- `src/components/settings/ProviderSettingsTab.tsx` - LLM provider configuration tab
- `src/components/settings/AppearanceTab.tsx` - Theme and UI settings tab
- `src/components/settings/PreferencesTab.tsx` - Auto-save and defaults tab
- `src/components/settings/AdvancedTab.tsx` - Export/import and advanced settings tab
- `src/components/ui/switch.tsx` - Switch component for toggles
- `src/components/ui/confirmation-dialog.tsx` - Global confirmation dialog component
- `src/components/ui/rename-dialog.tsx` - Global rename dialog component
- `docs/plans/090725-sidebar-plan.md` - Implementation plan documentation
- `docs/plans/250125-shadcn-context-menu-migration.md` - Context menu migration plan
- `docs/plans/100725-settings-footer-plan.md` - Settings footer implementation plan

#### Removed Files

- `src/components/node-creation-menu.tsx` - Replaced with shadcn ContextMenu implementation

#### Modified Files

- `src/lib/store.ts` - Enhanced with session management and settings state capabilities
- `src/lib/llm-service.ts` - Refactored to use configurable API keys from settings
- `src/components/left-sidebar.tsx` - Added sidebar footer with settings access
- `src/components/App.tsx` - Integrated settings dialog into global dialogs
- `src/pages/Index.tsx` - Integrated session management utilities
- `src/components/canvas.tsx` - Migrated to shadcn ContextMenu with keyboard shortcuts
- `src/components/session/SessionItem.tsx` - Replaced DropdownMenu with ContextMenu
- `src/lib/session-utils.ts` - Enhanced with additional keyboard shortcuts

### 🎯 Status Indicators

Sessions now display status indicators:

- 🟢 **Green dot**: Saved session
- 🟡 **Yellow dot**: Unsaved changes
- 🔵 **Blue dot (pulsing)**: Workflow running
- 🔴 **Red dot**: Error state

### 📊 Statistics

- **4 Major phases** completed successfully
- **15+ new components** and utilities created
- **50+ functions** and methods implemented
- **Type-safe** session management throughout
- **Auto-save** and **keyboard shortcuts** implemented
- **Export/Import** functionality with validation

### 📚 API Documentation

#### Comprehensive Documentation Suite

- **Store API Documentation**: Complete documentation for Zustand store including state management, actions, and usage patterns
- **Services API Documentation**: Comprehensive coverage of all services including execution engine, LLM service, session service, and settings service
- **Utilities API Documentation**: Detailed documentation for session utilities, custom hooks, and general utilities
- **Usage Examples**: Real-world code examples and integration patterns throughout all documentation
- **Type Safety Coverage**: Full TypeScript interface documentation with type examples and patterns

#### Documentation Features

- **Complete API Coverage**: Every public method, property, and interface documented
- **Usage Examples**: Practical code examples for all major features
- **Error Handling**: Comprehensive error handling documentation and patterns
- **Performance Notes**: Performance considerations and optimization guidelines
- **Integration Patterns**: How components and services work together
- **Developer Experience**: IDE support, type safety, and development workflows

#### Integration Points

- **Tauri Store**: Session persistence using `@tauri-apps/plugin-store`
- **React Flow**: Canvas state preservation and session switching
- **Zustand**: Enhanced state management with session capabilities

---

_This implementation fully recreates the sidebar layout as shown in the provided screenshot, featuring comprehensive session management with persistence, search, and user experience enhancements._
