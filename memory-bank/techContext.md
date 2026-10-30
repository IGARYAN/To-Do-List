# Tech Context

## Core Stack
- **Frontend Framework:** Svelte 5 (using Runes for state management)
- **Meta-framework:** SvelteKit
- **Build Tool:** Vite
- **Desktop Runtime:** Tauri v2 (Rust-based)
- **Language:** TypeScript (Frontend), Rust (Backend/Tauri)

## Styling & UI
- **CSS Framework:** Tailwind CSS v4
- **Component Primitive:** Bits UI
- **Icons:** Lucide Svelte
- **UI Patterns:** Shadcn-inspired component structure in `src/lib/components/ui`
- **Animations:** tailwind-variants, tw-animate-css

## State Management & Data
- **Reactivity:** Svelte 5 Runes (`$state`, `$derived`, `$effect`)
- **Stores:** Custom reactive stores using `.svelte.ts` files (e.g., `task-store.svelte.ts`)
- **Storage:** Tauri Filesystem plugin (`@tauri-apps/plugin-fs`)

## Task Status Visualization
- **Task Fields:** `completed: boolean`, `completedAt?: string` (ISO), `date: string` (ISO)
- **Overdue Detection:** `isCompletedOverdue` derived property compares `completedAt > date`
- **Visual Indicators:**
  - Red border: Uncompleted overdue tasks
  - Orange border: Completed tasks with delay
  - Green checkmark: Completed on time

## Key Integrations
- **Auto-start:** `@tauri-apps/plugin-autostart`
- **Window Management:** Custom window state handling for desktop persistence
- **Date Handling:** `date-fns`

## Development Workflow
- **Testing:** Vitest
- **Linting/Typecheck:** svelte-check, TypeScript
- **Command Suite:** `npm run tauri:dev` for desktop development, `npm run dev` for web preview
