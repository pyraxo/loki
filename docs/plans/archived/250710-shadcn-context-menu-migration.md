# **🎯 SHADCN CONTEXT MENU IMPLEMENTATION PLAN**

### Comprehensive Migration from Custom Context Menus to shadcn ContextMenu

## **PHASE 1: Canvas Context Menu Replacement**

### **1.1 Replace NodeCreationMenu Component**

- **Replace** the custom Card-based `NodeCreationMenu` with shadcn `ContextMenu`
- **Update** Canvas.tsx to use `ContextMenu`, `ContextMenuTrigger`, `ContextMenuContent`, `ContextMenuItem`
- **Remove** the position-based absolute positioning logic (shadcn handles this)
- **Maintain** the same node creation functionality with improved UX

### **1.2 NodeLibrary Integration**

- **Import** and utilize existing `NodeLibrary` categories and structure from `src/components/session/NodeLibrary.tsx`
- **Organize** context menu items by categories: Control, Input, AI, Output, Utility
- **Use** same icons, descriptions, and badge system ("Essential", "Coming Soon")
- **Handle** disabled states for "Coming Soon" node types
- **Add** `ContextMenuSeparator` between categories for visual organization

---

## **PHASE 2: Session Context Menu Migration**

### **2.1 SessionItem ContextMenu Replacement**

- **Replace** `DropdownMenu` implementation with `ContextMenu` in `SessionItem.tsx`
- **Migrate** all existing session operations:
  - Rename session
  - Duplicate session
  - Export session
  - Delete session (with destructive styling)
- **Remove** the three-dot button trigger, use right-click on entire session item
- **Add** `ContextMenuSeparator` before destructive delete action

---

## **PHASE 3: Global Keyboard Shortcuts Integration**

### **3.1 Canvas Keyboard Shortcuts**

- **Implement** global keyboard event handler for canvas
- **Add shortcuts**:
  - `Ctrl/Cmd + 1` → Create Start Node
  - `Ctrl/Cmd + 2` → Create Text Prompt Node
  - `Ctrl/Cmd + 3` → Create LLM Invocation Node
  - `Ctrl/Cmd + 4` → Create Output Node
  - `Delete/Backspace` → Delete selected nodes/edges
- **Display** shortcuts in context menu using `ContextMenuShortcut` component

### **3.2 Session Management Shortcuts**

- **Add session shortcuts**:
  - `F2` → Rename active session
  - `Ctrl/Cmd + D` → Duplicate active session
  - `Ctrl/Cmd + E` → Export active session
  - `Ctrl/Cmd + Delete` → Delete active session (with confirmation)

---

## **PHASE 4: Code Cleanup and Documentation**

### **4.1 Component Cleanup**

- **Delete** `src/components/node-creation-menu.tsx` entirely
- **Remove** all imports and references to `NodeCreationMenu`
- **Clean up** unused `DropdownMenu` imports in SessionItem
- **Update** Canvas.tsx imports to include shadcn ContextMenu components

### **4.2 Documentation Updates**

- **Update** `docs/changelog.md` with new context menu features and improved UX
- **Update** `docs/api/nodes.md` with new interaction patterns
- **Document** new keyboard shortcuts and context menu usage

---

## **IMPLEMENTATION DETAILS**

### **Context Menu Structure (Canvas)**

```tsx
<ContextMenu>
  <ContextMenuTrigger>Canvas Area</ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuLabel>Control</ContextMenuLabel>
    <ContextMenuItem>
      🚀 Start Node <ContextMenuShortcut>⌘1</ContextMenuShortcut>
    </ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuLabel>Input</ContextMenuLabel>
    <ContextMenuItem>
      📝 Text Prompt <ContextMenuShortcut>⌘2</ContextMenuShortcut>
    </ContextMenuItem>
    {/* ... more categories ... */}
  </ContextMenuContent>
</ContextMenu>
```

### **Context Menu Structure (Sessions)**

```tsx
<ContextMenu>
  <ContextMenuTrigger>Session Item</ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem>
      Rename <ContextMenuShortcut>F2</ContextMenuShortcut>
    </ContextMenuItem>
    <ContextMenuItem>
      Duplicate <ContextMenuShortcut>⌘D</ContextMenuShortcut>
    </ContextMenuItem>
    <ContextMenuItem>
      Export <ContextMenuShortcut>⌘E</ContextMenuShortcut>
    </ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem variant="destructive">
      Delete <ContextMenuShortcut>⌘⌫</ContextMenuShortcut>
    </ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

### **Benefits of This Implementation**

- ✅ **Consistent UX**: All context menus use shadcn design system
- ✅ **Better Accessibility**: Native context menu behavior and keyboard navigation
- ✅ **Improved Discoverability**: Keyboard shortcuts visible in menus
- ✅ **Future Extensibility**: Easy to add more context menu items and categories
- ✅ **Reduced Code**: Less custom positioning and state management logic

---

## **EXECUTION TIMELINE**

1. **Phase 1**: Canvas Context Menu Replacement (~30-45 mins)
2. **Phase 2**: Session Context Menu Migration (~20-30 mins)
3. **Phase 3**: Global Keyboard Shortcuts (~25-35 mins)
4. **Phase 4**: Cleanup and Documentation (~15-20 mins)
