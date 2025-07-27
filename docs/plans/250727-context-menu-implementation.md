# Context Menu Implementation Plan

## Overview
Implementation of dual context menu system for React Flow canvas:
- Canvas right-click: Shows existing node creation menu
- Node right-click: Shows new node context menu with duplication functionality

## Architecture Design

### Event Flow
```
Canvas Right-Click → onPaneContextMenu → Node Creation Menu (existing)
Node Right-Click → onNodeContextMenu → Node Context Menu (new)
```

### Component Structure
```
Canvas Component
├── React Flow
│   ├── onPaneContextMenu (existing)
│   └── onNodeContextMenu (new)
├── NodeCreationMenu (existing)
└── NodeContextMenu (new)
    └── Duplicate action
```

## Implementation Steps

### Phase 1: Discovery & Foundation
1. **Research Current Implementation**
   - Examine existing context menu for node creation
   - Locate React Flow canvas event handlers  
   - Study node data structures and ID generation patterns
   - Review UI component patterns for consistency

2. **Create Node Context Menu Component**
   - Build `NodeContextMenu` component following existing UI patterns
   - Include "Duplicate" option as initial functionality
   - Accept target node data as props
   - Integrate with existing styling system
   - Design for extensibility (future node actions)

### Phase 2: Core Integration  
3. **Implement Event Handler Integration**
   - Add `onNodeContextMenu` handler to React Flow component
   - Update canvas state management for context menu tracking
   - Ensure proper event separation (canvas vs node clicks)
   - Store clicked node data and mouse coordinates for positioning

4. **Implement Node Duplication Logic**
   - Add `duplicateNode` action to appropriate Zustand store slice
   - Deep clone node data while generating new unique IDs
   - Calculate offset positioning to avoid overlaps
   - Handle all node types: start, textPrompt, llmInvocation, textOutput
   - Maintain data integrity with fresh IDs and positions

### Phase 3: Integration & Refinement
5. **Wire Up Complete Integration**
   - Connect NodeContextMenu Duplicate button to store action
   - Implement proper menu dismissal after duplication
   - Add visual feedback for duplication action
   - Test event propagation for conflict resolution
   - Verify existing canvas context menu remains unchanged

6. **Handle Edge Cases and Positioning**
   - Implement collision detection for positioned nodes
   - Handle viewport boundary constraints
   - Address edge cases (canvas edges, zoom levels)
   - Optimize position calculation performance
   - Add accessibility for keyboard navigation

### Phase 4: Validation
7. **Testing and Validation**
   - Manual testing of both context menu behaviors
   - Verify duplication across all node types
   - Test positioning logic in various canvas states
   - Validate no regressions in existing functionality
   - Performance and memory leak testing
   - Event listener cleanup verification

## Technical Details

### Store Integration
- **Canvas Slice**: Context menu state management
- **Node Operations**: Duplication logic integration  
- **Event Coordination**: Proper state cleanup

### Key Design Decisions
- **Event Separation**: Use React Flow's built-in handlers for clean separation
- **Duplication Strategy**: Deep clone with new ID generation for data integrity
- **Positioning Logic**: Simple offset with collision detection for good UX
- **Extensibility**: Design NodeContextMenu for future node-specific actions

### Dependencies
- React Flow event system (`onNodeContextMenu`, `onPaneContextMenu`)
- Zustand store architecture (canvas-slice, existing patterns)
- Current node type definitions and ID generation
- Existing UI component patterns

## Success Criteria
- Canvas right-click preserves existing node creation menu
- Node right-click shows new context menu with Duplicate option  
- Duplication creates functionally identical node with unique ID
- Duplicated node appears at appropriate offset position
- No conflicts between menu systems
- All existing functionality remains intact

## Files to Modify/Create
- Create: `src/components/NodeContextMenu.tsx`
- Modify: Canvas component (add `onNodeContextMenu` handler)
- Modify: Canvas slice (add context menu state)
- Modify: Appropriate store slice (add `duplicateNode` action)

## Implementation Date
Planned: [Current Date]
Status: In Progress