# Loki Nodes Documentation

## Overview

Loki's visual workflow system is built around a flexible node-based architecture. Each node represents a distinct operation or data point in an LLM workflow, connected together to create complex processing pipelines. The system supports four core node types, each designed for specific purposes in the workflow graph.

All nodes share a common visual structure with draggable headers, status indicators, and connection handles that enable building sophisticated LLM workflows through simple drag-and-drop interactions.

## Node Creation and Interaction

### Context Menu System

The canvas uses a right-click context menu system for intuitive node creation and management. The context menu is organized by node categories for easy discovery:

#### Canvas Context Menu

Right-click anywhere on the empty canvas to access the node creation menu:

- **Control**: Workflow control nodes (Start)
- **Input**: Data input nodes (Text Prompt)
- **AI**: AI processing nodes (LLM Invocation)
- **Output**: Result output nodes (Output)
- **Utility**: Helper utility nodes (Coming Soon)

Each menu item displays:

- Node icon for visual identification
- Node name and description
- Keyboard shortcut (if available)
- Disabled state for future node types

#### Keyboard Shortcuts

**Canvas Operations:**

- `Cmd/Ctrl + 1` - Create Start Node
- `Cmd/Ctrl + 2` - Create Text Prompt Node
- `Cmd/Ctrl + 3` - Create LLM Invocation Node
- `Cmd/Ctrl + 4` - Create Output Node
- `Delete/Backspace` - Delete selected nodes and edges

**Node Positioning:**

- Context menu creation: Node appears at cursor position
- Keyboard creation: Node appears at canvas center
- Automatic offset: Prevents overlapping with existing nodes

#### Smart Focus Detection

All keyboard shortcuts are intelligently disabled when:

- Typing in input fields (textarea, input)
- Editing contenteditable elements
- Focus is on form controls

This prevents accidental node creation while editing node properties.

### Interaction Patterns

**Right-Click Workflow:**

1. Right-click on empty canvas area
2. Select desired node type from categorized menu
3. Node appears at cursor position
4. Continue building workflow by connecting nodes

**Keyboard Workflow:**

1. Use `Cmd/Ctrl + [1-4]` to quickly create nodes
2. Nodes appear in canvas center
3. Drag to desired position
4. Use `Delete` to remove selected elements

## Node Architecture

### Common Properties

All nodes inherit from a base `BaseNodeData` interface that provides:

- **ID**: Unique identifier for the node instance
- **Status**: Current execution state (`idle`, `running`, `success`, `error`)
- **Error**: Optional error message for debugging
- **Visual State**: Border colors and badges that reflect current status

### Status System

Nodes use a unified status system with visual indicators:

- **Idle** (gray): Node is ready but not yet executed
- **Running** (blue): Node is currently processing, with animated loader
- **Success** (green): Node completed successfully
- **Error** (red): Node encountered an error, with detailed error message

## Node Types

### 1. Start Node 🚀

**Purpose**: Serves as the entry point for workflow execution. Controls the overall workflow state and provides the primary execution trigger.

**Key Features**:

- Workflow name display
- Run/Stop workflow controls
- Global workflow state management
- Visual status indication for entire workflow

**Properties**:

```typescript
interface StartNodeData extends BaseNodeData {
  workflowName: string;
}
```

**Behavior**:

- Single Run/Stop button that controls entire workflow
- Green border to indicate entry point
- Only has source handle (bottom) - no inputs
- Integrates with global execution engine
- Button text changes based on workflow state (Run All / Stop)

**Usage Notes**:

- Place at the beginning of your workflow
- Only one Start node should be used per canvas
- Automatically manages workflow orchestration when executed

---

### 2. Text Prompt Node 📝

**Purpose**: Provides an editable text input interface for creating and managing prompts that will be sent to LLM models.

**Key Features**:

- Multi-line text editing with textarea
- Character count tracking
- Real-time content validation
- Interactive editing with drag prevention
- Input persistence and state management

**Properties**:

```typescript
interface TextPromptNodeData extends BaseNodeData {
  text: string;
  characterCount?: number;
}
```

**Behavior**:

- Large resizable textarea for prompt input
- Character counter displays below input area
- Text changes trigger immediate state updates
- Prevents dragging when interacting with text area
- Validates content and shows errors if present
- Supports both target (top) and source (bottom) handles

**Usage Notes**:

- Essential for providing input to LLM Invocation nodes
- Character count helps manage token limits
- Can be chained together for complex prompt building
- Content automatically persists as you type

---

### 3. LLM Invocation Node 🤖

**Purpose**: Configures and executes calls to Large Language Models with customizable parameters and model selection.

**Key Features**:

- Model selection dropdown (GPT-4, GPT-3.5 Turbo, Claude variants)
- Temperature control with visual slider (0.0 - 2.0)
- Maximum token limit configuration
- Real-time parameter updates
- Execution status with animated indicators

**Properties**:

```typescript
interface LLMInvocationNodeData extends BaseNodeData {
  model: "gpt-4" | "gpt-3.5-turbo" | "claude-3-haiku" | "claude-3-sonnet";
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
}
```

**Configuration Options**:

**Model Selection**:

- **GPT-4**: OpenAI's most capable model
- **GPT-3.5 Turbo**: Faster, cost-effective OpenAI model
- **Claude 3 Haiku**: Anthropic's fastest model
- **Claude 3 Sonnet**: Balanced performance Claude model

**Temperature Control**:

- Range: 0.0 (deterministic) to 2.0 (highly creative)
- Visual slider with real-time value display
- Affects randomness and creativity of responses

**Token Limits**:

- Configurable maximum tokens (1-4000)
- Controls response length
- Helps manage API costs

**Behavior**:

- Accepts input from Text Prompt nodes or other sources
- Shows animated spinner during execution
- Displays errors in dedicated error panel
- Outputs to connected Output/Viewer nodes
- Both target (top) and source (bottom) handles

**Usage Notes**:

- Must be connected to a Text Prompt node for input
- Connect output to Output node to view results
- Configure parameters before execution
- Different models may have different capabilities and costs

---

### 4. Output/Viewer Node 📄

**Purpose**: Displays the results from LLM invocations with support for both streaming and static content presentation.

**Key Features**:

- Real-time streaming content display
- Static content viewing for completed responses
- Token count tracking
- Formatted text presentation with whitespace preservation
- Error display with detailed messages

**Properties**:

```typescript
interface OutputNodeData extends BaseNodeData {
  content: string;
  isStreaming: boolean;
  streamedContent?: string;
  tokenCount?: number;
}
```

**Display Modes**:

**Streaming Mode**:

- Shows content as it arrives from LLM
- Animated cursor indicator during streaming
- Real-time content updates
- "Streaming" badge with spinner

**Static Mode**:

- Displays final, complete content
- Preserves formatting and whitespace
- Shows total token count
- Final status indication

**Behavior**:

- Large content area with scrolling support
- Gray background for content distinction
- Placeholder text when no content available
- Token count display when available
- Error messages shown in red error panel
- Only has target handle (top) - terminal node

**Usage Notes**:

- Connect as the final step in LLM workflows
- Larger size (384px wide) to accommodate longer content
- Automatically handles both streaming and batch responses
- Content is preserved after workflow completion

## Workflow Examples

### Basic LLM Chain

```
Start Node → Text Prompt Node → LLM Invocation Node → Output Node
```

### Multi-Input Processing

```
Start Node → Text Prompt Node A ┐
                                ├→ LLM Invocation Node → Output Node
              Text Prompt Node B ┘
```

### Parallel Processing

```
Start Node → Text Prompt Node → LLM Invocation Node A → Output Node A
                              └→ LLM Invocation Node B → Output Node B
```

## Development Notes

### Node Registration

Nodes are organized in the `src/components/nodes/` directory with individual component files and a centralized export system:

**File Structure:**

```
src/components/nodes/
├── index.tsx          # Central node registration and exports
├── BaseNode.tsx       # Shared base node functionality
├── StartNode.tsx      # Start node implementation
├── TextNode.tsx       # Text prompt node implementation
├── LLMNode.tsx        # LLM invocation node implementation
└── OutputNode.tsx     # Output/viewer node implementation
```

**Registration System:**
All nodes are registered in `src/components/nodes/index.tsx`:

```typescript
import { NodeType } from "@/types/nodes";
import { StartNode } from "@/components/nodes/StartNode";
import { TextPromptNode } from "@/components/nodes/TextNode";
import { LLMInvocationNode } from "@/components/nodes/LLMNode";
import { OutputNode } from "@/components/nodes/OutputNode";

export const nodeTypes = {
  [NodeType.START]: StartNode,
  [NodeType.TEXT_PROMPT]: TextPromptNode,
  [NodeType.LLM_INVOCATION]: LLMInvocationNode,
  [NodeType.OUTPUT]: OutputNode,
};
```

This centralized approach makes it easy to add new node types by:

1. Creating the component file in `src/components/nodes/`
2. Adding the import and registration in `index.tsx`
3. Defining the node type in `@/types/nodes`

### Styling Conventions

- **Draggable Headers**: Use `node-drag` class and `cursor-move`
- **Interactive Elements**: Prevent drag propagation with `onMouseDown`/`onPointerDown` event handlers
- **Status Colors**: Border colors reflect node status (blue=running, green=success, red=error)
- **Consistent Sizing**: Width standards (Start: 256px, Text: 320px, LLM: 320px, Output: 384px)

### State Management

Nodes integrate with Zustand store for:

- Node data updates via `updateNodeData()`
- Workflow control via `startWorkflow()` / `stopWorkflow()`
- Global state synchronization

### Future Extensions

The node system is designed for extensibility. Future node types might include:

- File Input nodes for document processing
- Transform nodes for data manipulation
- Branch nodes for conditional logic
- Join nodes for combining outputs
- Custom nodes via plugin system
