# System Patterns

## Frontend Patterns (Svelte 5)
- **Reactivity:** Use Svelte 5 Runes (`$state`, `$derived`, `$effect`) instead of the old Svelte 4 store API where possible.
- **Reactive Stores:** For global state, use `.svelte.ts` files to encapsulate reactivity managed by runes.
- **Component Structure:** Use shadcn-like atomic components located in `src/lib/components/ui`.
- **Styling:** Use Tailwind CSS utility classes. Leverage `tailwind-variants` for complex component variants.

## Desktop/Tauri Patterns
- **Persistence:** Use `@tauri-apps/plugin-fs` for saving application data (tasks, settings).
- **Window State:** Maintain window position and visibility state across sessions.
- **Commands:** Interact with Rust backend via Tauri commands for system-level operations.

## Data & Types
- **Type Safety:** Strict TypeScript usage throughout the frontend.
- **Task Management:** Logic resides in dedicated service classes (e.g., `RepeatService`) and managed by `task-store.svelte.ts`.

## Error Handling & Logging
- **Logging:** Use the custom logger in `src/lib/utils/logger.ts`.
- **UI Feedback:** Use the `toast-store.ts` for non-blocking user notifications.
