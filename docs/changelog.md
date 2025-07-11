# Changelog

## [Unreleased] - 2025-01-25

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

#### Integration Points

- **Tauri Store**: Session persistence using `@tauri-apps/plugin-store`
- **React Flow**: Canvas state preservation and session switching
- **Zustand**: Enhanced state management with session capabilities

---

_This implementation fully recreates the sidebar layout as shown in the provided screenshot, featuring comprehensive session management with persistence, search, and user experience enhancements._
