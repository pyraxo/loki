# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Building & Development:**

- `bun run dev` - Start development server (Vite + Tauri dev mode)
- `bun run build` - Build production bundle (TypeScript compilation + Vite build)
- `bun run preview` - Preview production build
- `bun run tauri` - Tauri CLI commands

**Note:** NEVER run development server commands to test changes - this is explicitly prohibited per project rules.

## General Rules

- NEVER run `bun` commands (including `bun run dev`) to test the server after implementing new changes.
- NEVER run the development server (e.g. `npm run dev`) to test changes.

## Documentation Requirements

### General Requirements

- When a project directory is added or changed, always update the repo structure file (`.cursor/repo-structure.mdc`).

### Implementation Plans

- When you are saving an implementation plan from Planner Mode, save it in the `docs/plans` folder in the format `YYMMDD-filename.md`. For e.g., `docs/plans/090725-sidebar-plan.md`.

### Feature Completion

- When a new feature has been implemented, always add the updates to the changelog (`docs/changelog.md`).
- Always update the features in the corresponding documentation in `docs/api`.

## Special Modes

### Planner Mode

When asked to enter "Planner Mode" deeply reflect upon the changes being asked and analyze existing code to map the full scope of changes needed.

Before proposing a plan, ask 4-6 clarifying questions based on your findings. Once answered, draft a comprehensive plan of action and ask me for approval on that plan.

If feedback is provided, revise the plan and ask for approval again. Once approved, implement all steps in that plan.

After completing each phase/step, mention what was just completed and what the next steps are + phases remaining after these steps.

### PM Mode

When asked to enter "PM Mode", analyze existing code of all specified directories, or all files if unspecified, to understand the current scope of the project.

Then understand the [prd.md](docs/prd.md) located in the root folder, creating a new file if it doesn't exist.

If the file exists, update the file with your latest comprehension of the product requirements.

Along the way, if you come across any documentation (such as `README.md` files) which are outdated, update the contents of the file.

Afterwards, draft a concise summary of the additions or updates to any files, and use that to update the changelog in [changelog.md](docs/changelog.md).

## Project Architecture

**Tech Stack:**

- React + TypeScript frontend with Vite
- Tauri for desktop app framework
- React Flow (@xyflow/react) for node-based workflow editor
- Zustand for state management with modular slice architecture
- Tailwind CSS + shadcn/ui components
- AI SDK with OpenAI integration

**Core Concepts:**

- Node-based workflow editor where users create AI chat workflows by connecting nodes
- Sessions represent saved workflows with metadata
- Real-time workflow execution engine that processes nodes in dependency order
- Persistent storage via Tauri's store plugin

## Repository Overview

### Top-level

- **src/** – React + TypeScript frontend code.
  - **components/** – Reusable UI components and node definitions.
  - **lib/** – Shared utilities, Zustand store, global state helpers.
    - **store/** – Modular Zustand store architecture with slices.
  - **pages/** – Route-level components (Index.tsx, NotFound.tsx).
  - **hooks/** – Custom React hooks.
- **src-tauri/** – Rust backend for Tauri:
  - **src/** – `main.rs`, Tauri commands, Rust helpers.
  - **icons/** – Application icons for packaging.
- **docs/** – Internal documentation (PRD, architecture notes, nodes documentation, changelog).
- **.cursor/rules/** – Cursor rule files like this one.

## Store Architecture

Global state is managed using a **slice-based Zustand store** in `src/lib/store/`:

```
src/lib/store/
├── index.ts              # Main store composition
├── types.ts              # Store type definitions
├── slices/
│   ├── canvas-slice.ts   # Node/edge management
│   ├── workflow-slice.ts # Workflow execution state
│   ├── session-slice.ts  # Session CRUD operations
│   ├── settings-slice.ts # Settings & theme management
│   ├── dialog-slice.ts   # Dialog states
│   ├── history-slice.ts  # Text history/undo-redo
│   └── autosave-slice.ts # Auto-save functionality
└── utils/
    ├── selectors.ts      # Reusable selectors
    └── store-utils.ts    # Helper functions
```

### Key Store Slices

- **Canvas**: Manages React Flow nodes, edges, and canvas operations
- **Workflow**: Handles workflow execution, node completion tracking
- **Session**: CRUD operations, search, export/import, metadata
- **Settings**: App settings, provider configs, theme management
- **Dialog**: UI dialogs (confirmation, rename, settings)
- **History**: Text node edit history with undo/redo
- **Auto-save**: Auto-save logic and unsaved change tracking

### Store Usage

```typescript
// Basic usage (backward compatible)
import { useStore } from "@/lib/store";
const { nodes, setNodes, createSession } = useStore();

// Optimized usage with selectors
import { selectCanvasState, selectActiveSession } from "@/lib/store";
const canvasState = useStore(selectCanvasState);
const activeSession = useStore(selectActiveSession);
```

### Store Development Guidelines

- Use **selectors** for optimized re-renders instead of subscribing to entire store
- Use appropriate actions: `setNodes()` for user changes, `setNodesInternal()` for React Flow updates
- Handle async operations with proper error handling
- Use provided utilities in `store-utils.ts` for common operations
- Each slice is testable in isolation for better test coverage
- Store maintains 100% backward compatibility with existing code

## Navigation Tips

- When searching for frontend logic, start in `src/components/` or `src/lib/`.
- Node implementations live in `src/components/nodes/`; add new node types here.
- Store slices are in `src/lib/store/slices/`; each handles a specific domain.
- Store utilities and selectors are in `src/lib/store/utils/`.
- Rust commands exposed to the frontend are defined in `src-tauri/src/main.rs`.
- Documentation lives in `docs/` – update PRD & architecture docs here.
- Store documentation is in `docs/api/store.md` with comprehensive examples.

## Node System

**Node Types:**

- `start` - Entry point for workflows
- `textPrompt` - User text input with edit history
- `llmInvocation` - LLM API calls with configurable parameters
- `textOutput` - Display LLM responses with streaming support

**Node Implementation:**

- Base nodes in `src/components/nodes/BaseNode.tsx`
- Specific implementations in `src/components/nodes/[NodeType].tsx`
- Node data types defined in `src/types/nodes.ts`
- Execution logic in `src/lib/execution-engine.ts`

## Key Services

- `session-service.ts` - Session persistence and metadata management
- `settings-service.ts` - Settings persistence and provider configuration
- `llm-service.ts` - LLM API integration and streaming
- `execution-engine.ts` - Workflow execution with dependency resolution
- `theme-service.ts` - Theme synchronization between next-themes and store

## File Organization

**Frontend (`src/`):**

- `components/` - UI components including node definitions
- `lib/store/` - Zustand store slices and utilities
- `lib/` - Services and business logic
- `hooks/` - Custom React hooks
- `types/` - TypeScript type definitions
- `pages/` - Route components

**Backend (`src-tauri/`):**

- `src/main.rs` - Tauri commands and Rust backend
- `tauri.conf.json` - Tauri configuration

**Documentation (`docs/`):**

- `api/` - API documentation for store, services, nodes
- `plans/` - Implementation plans and summaries
- `prd.md` - Product requirements document

## Import Paths

Use `@/` alias for all imports from `src/`:

```typescript
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
```

## Development Notes

- Store maintains complete backward compatibility while providing optimized patterns
- Text nodes include comprehensive edit history with undo/redo
- Workflow execution engine handles complex node dependencies and streaming
- Auto-save functionality tracks unsaved changes and periodically saves sessions
- Theme system synchronizes between next-themes and internal store state
