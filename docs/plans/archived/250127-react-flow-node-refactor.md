# React Flow Node System Refactor Plan

**Date:** 2025-01-27  
**Goal:** Resolve fuzzy node rendering at zoom levels above 1x by refactoring to React Flow-optimized lightweight components

## Problem Analysis

### Current Implementation Issues
- Using shadcn/ui Card-based nodes with heavy DOM structure
- Card > CardHeader > CardContent creates complex nested elements  
- Multiple CSS transform layers interfere with React Flow's rendering
- shadcn/ui components not optimized for canvas-based rendering

### Root Cause
CSS rendering optimizations had minimal impact, indicating the issue is architectural rather than styling-related.

## Implementation Strategy

### Phase 1: Discovery & Research
1. **Research React Flow Best Practices** (Context7)
   - Study official React Flow custom node documentation
   - Identify lightweight DOM patterns for optimal rendering
   - Research performance considerations for canvas-based nodes

2. **Current Implementation Analysis**
   - Examine existing nodes: StartNode, TextPromptNode, LLMInvocationNode, OutputNode
   - Document DOM complexity and simplification opportunities
   - Map current features to React Flow-optimized alternatives

### Phase 2: Architecture & Design
3. **Design Lightweight Node Architecture**
   - Replace Card/CardHeader/CardContent with minimal div structure
   - Implement CSS-only styling for borders, backgrounds, layout
   - Design lightweight status indicators and handles
   - Maintain theming support with CSS custom properties

### Phase 3: Implementation & Validation
4. **Proof of Concept**
   - Build optimized TextPromptNode (simplest structure)
   - Test rendering quality at multiple zoom levels (1x, 1.5x, 2x, 3x)
   - Compare with existing implementation
   - Validate all interactive features work correctly

5. **Full Migration Implementation**
   Migration sequence (complexity order):
   - TextPromptNode (completed in POC)
   - StartNode (basic structure)
   - OutputNode (streaming content)  
   - LLMInvocationNode (most complex)

6. **Finalization & Documentation**
   - Remove old components
   - Update documentation in CLAUDE.md
   - Performance benchmarking
   - Create development guidelines for future nodes

## Success Criteria

### Primary Goals
- Crisp, clear rendering at all zoom levels (2x, 3x+)
- Performance equal to or better than current implementation
- All existing functionality preserved
- Backward compatibility maintained

### Must Preserve
- NodeResizer functionality
- Status indicators and theming
- Handle positioning and connections
- Session data compatibility
- Current visual design consistency

## Risk Mitigation

**Early Risks:**
- Research reveals incompatible patterns → Adjust architecture approach
- POC shows no improvement → Investigate other causes

**Late Risks:**
- Migration breaks functionality → Rollback strategy with old components
- Visual inconsistencies → Gradual migration allows per-node validation

## Implementation Notes

### Design Principles
- Flat DOM hierarchy where possible
- CSS-first styling approach
- Preserve all existing functionality
- Optimize for React Flow's rendering pipeline
- Focus on text clarity and edge sharpness

### Migration Strategy
- Create new optimized versions alongside existing nodes
- Update node type registry gradually
- Maintain backward compatibility during transition
- Test each node type thoroughly before moving to next