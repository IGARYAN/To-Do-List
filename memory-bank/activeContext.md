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
- **2026-10-30**: Решена проблема с Tooltip и упрощен интерфейс:
  - Удалены компоненты `theme-toggle.svelte` и `always-on-top-toggle.svelte`
  - Заменены отдельные кнопки на единое выпадающее меню с иконкой Menu в `+page.svelte`
  - Интегрированы функции переключения темы и режима "Поверх всех окон" напрямую в dropdown меню
  - Удалены все Tooltip из проекта (task-item.svelte, repeat-templates-list-modal.svelte)
  - Удален Tooltip.Provider из +layout.svelte
  - Используется style программирования через stores: `themeStore.set()` и `settingsStore.set()`
- **2026-11-03**: Исправлена логика удаления просроченных повторяющихся задач:
  - В `task-item.svelte` изменена функция `DeleteTaskDialogOpen()`: добавлена проверка `!isOverdue`
  - Теперь просроченные повторяющиеся задачи удаляются через диалог удаления задачи (только эта задача)
  - Непросроченные повторяющиеся задачи по-прежнему открывают диалог удаления шаблона
  - Логика: будущие/сегодняшние повторяющиеся → диалог шаблона, просроченные/выполненные/обычные → диалог задачи
- **2026-11-03**: Актуализирован README.md:
  - Добавлены пункты о визуальном выделении просроченных задач и умном удалении повторяющихся задач
  - Обновлён раздел "Установка и запуск" для портабельного приложения Windows
  - Разделён на "Быстрый запуск" для пользователей и "Разработка" для разработчиков
