# 📋 Rust Settings Dialog Implementation Plan

## 🎯 Project Goal

Create a native settings dialog on the Rust side of Tauri to replace the current React-based SettingsDialog.tsx, with full feature parity and improved security.

## 🏗️ Architecture Overview

**Approach**: Hybrid native dialog using custom Tauri window with embedded webview
**Storage**: Rust-side settings management using Tauri store plugin
**Security**: API keys stored in Tauri store (more secure than browser memory)
**Integration**: Frontend triggers dialog, Rust handles everything independently
**Communication**: Tauri events + toast notifications for error handling

---

## 📝 PHASE 1: Rust Settings Foundation

**Duration**: 2-3 hours

### 1.1 Create Rust Settings Types & Structures

- Define Rust structs mirroring `AppSettings` from TypeScript
- Create serialization/deserialization with serde
- Set up default settings factory function

### 1.2 Implement Settings Storage System

- Set up Tauri store plugin integration
- Create settings persistence layer
- Implement CRUD operations for settings
- Add API key secure storage

### 1.3 Create Tauri Commands for Settings

- `get_settings()` - Retrieve current settings
- `update_settings(settings)` - Update settings
- `reset_settings()` - Reset to defaults
- `export_settings()` - Export settings (excluding API keys)
- `import_settings(data)` - Import settings
- `test_provider(provider, config)` - Test provider connection

---

## 📝 PHASE 2: Hybrid Dialog Window Setup

**Duration**: 1-2 hours

### 2.1 Create Custom Dialog Window

- Configure new Tauri window for settings dialog
- Set up modal window properties (size, positioning, always on top)
- Implement window lifecycle management

### 2.2 HTML/CSS/JS Assets for Dialog

- Create embedded HTML template for settings UI
- Set up CSS framework (or inline styles) for native look
- Create basic JavaScript for dialog functionality

### 2.3 Window Communication System

- Set up bidirectional communication between dialog and main app
- Implement event system for real-time updates
- Create toast notification system

---

## 📝 PHASE 3: Settings UI Implementation

**Duration**: 3-4 hours

### 3.1 Providers Tab

- Provider list with enable/disable toggles
- API key input fields with show/hide functionality
- Model selection dropdowns
- Rate limit configuration
- Provider testing with loading states

### 3.2 Appearance Tab

- Theme selection (light/dark/system)
- Real-time theme switching
- Sidebar width slider
- Compact mode toggle

### 3.3 Preferences Tab

- Auto-save interval slider
- Default temperature slider
- Default max tokens input
- Debug mode toggle
- Analytics toggle

### 3.4 Advanced Tab

- Export settings functionality
- Import settings with file picker
- Reset settings with confirmation
- Debug information display

---

## 📝 PHASE 4: Advanced Features Integration

**Duration**: 2-3 hours

### 4.1 Provider Testing System

- Implement async provider connection testing
- Create loading states and result indicators
- Add error handling and user feedback

### 4.2 Theme System Integration

- Real-time theme switching from dialog
- Sync with main app theme state
- OS theme detection and auto-switching

### 4.3 Export/Import Functionality

- JSON export with timestamp and version
- File picker integration for imports
- Validation and error handling for imported data

### 4.4 Error Handling & Notifications

- Toast notification system for errors
- Event-based communication with frontend
- Graceful error recovery

---

## 📝 PHASE 5: Integration & Cleanup

**Duration**: 1-2 hours

### 5.1 Frontend Integration

- Create Tauri command to open settings dialog
- Replace existing settings button handler
- Update store selectors to use Rust backend

### 5.2 Cleanup & Migration

- Remove React SettingsDialog.tsx and related components
- Clean up unused settings-related frontend code
- Update imports and dependencies

### 5.3 Testing & Validation

- Test all settings functionality
- Verify data persistence across app restarts
- Validate error handling and edge cases

---

## 📂 New File Structure

```
src-tauri/src/
├── settings/
│   ├── mod.rs              # Settings module
│   ├── types.rs            # Rust settings types
│   ├── storage.rs          # Settings persistence
│   ├── commands.rs         # Tauri commands
│   └── dialog.rs           # Dialog window management
├── assets/
│   ├── settings.html       # Settings dialog HTML
│   ├── settings.css        # Settings dialog styles
│   └── settings.js         # Settings dialog JavaScript
└── main.rs                 # Updated with new commands
```

---

## 🔧 Technical Implementation Details

### Dependencies to Add

```toml
# Cargo.toml additions
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tauri-plugin-store = "2.0"
tauri-plugin-notification = "2.0"
```

### Key Tauri Commands

- Settings CRUD operations
- Provider testing
- Theme management
- Export/import functionality
- Dialog window management

### Communication Flow

1. Frontend → Rust: Open settings dialog
2. Rust: Create modal window with embedded webview
3. Dialog ↔ Rust: Settings manipulation via JavaScript bridge
4. Rust → Frontend: Settings updates via events
5. Rust → User: Error feedback via toast notifications

---

## ⚠️ Considerations & Risks

1. **State Synchronization**: Ensuring frontend and Rust settings stay in sync
2. **Performance**: Dialog rendering and real-time updates
3. **Cross-Platform**: Ensuring consistent behavior across OS
4. **Security**: Proper API key handling and storage
5. **Error Handling**: Graceful failure modes for all operations

---

## 🎯 Success Criteria

✅ **Complete feature parity** with current React SettingsDialog
✅ **Improved security** with Rust-side API key storage
✅ **Native integration** with OS-appropriate dialog behavior
✅ **Real-time updates** for theme and settings changes
✅ **Robust error handling** with user-friendly notifications
✅ **Clean integration** with existing frontend codebase

---

## 📊 Estimated Timeline: 8-12 hours total

**Status**: Implementation started on 16/07/25
**Plan saved**: docs/plans/160725-rust-settings-dialog-plan.md
