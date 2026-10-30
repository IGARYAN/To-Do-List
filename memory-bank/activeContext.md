# Active Context

## Current Status
- The project is a Svelte 5 + Tauri v2 Todo application.
- Memory Bank infrastructure has been initialized.
- MCP servers (Hindsight for long-term memory and Context7 for documentation) are connected and verified.
- Core UI components and state management stores are already implemented.

## Immediate Goals
- [ ] Ensure all new features follow the established Svelte 5 reactive patterns.

## Recent Changes
- Initialized `techContext.md`.
- Verified Hindsight and Context7 MCP connections.
- **2026-10-30**: Улучшена логика отображения выполненных задач в `task-item.svelte`:
  - Добавлено вычисляемое свойство `isCompletedOverdue` для identification задач, выполненных после назначенной даты
  - Оранжевая рамка (`border-orange-300 dark:border-orange-900`) для визуального выделения выполненных с просрочкой
  - Отображение даты назначения и фактической даты выполнения через стрелку (`ArrowRight`) для наглядного сравнения
  - Использованы существующие поля `date` и `completedAt` без изменений структуры данных
