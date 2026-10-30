# Project Progress

## Completed
- [x] Project structure analysis.
- [x] MCP connectors verification (Hindsight, Context7).
- [x] Memory Bank initialization (`techContext`, `activeContext`, `systemPatterns`, `AGENTS`).
- [x] Hindsight directive creation (Russian language).
- [x] **2026-10-30**: Реализовано визуальное различие выполненных задач в срок и с просрочкой в `task-item.svelte`:
  - Добазано вычисляемое свойство `isCompletedOverdue` для определения задач, выполненных после назначенной даты
  - Оранжевая рамка для выполненных с просрочкой задач
  - Отображение обеих дат (назначенной и фактической) со стрелкой для визуального сравнения
- [x] **2026-10-30**: Рефакторинг интерфейса - замена кнопок на dropdown меню:
  - Удалены компоненты `theme-toggle.svelte` и `always-on-top-toggle.svelte`
  - Добавлено единое dropdown меню в заголовок приложения
  - Интегрированы все функции в меню: Создать задачу, Повторяющиеся задачи, Тема (submenu), Поверх всех окон, Настройки
  - Удалены все Tooltip из проекта
  - Стиль программирования: использование stores (`themeStore`, `settingsStore`, `appStateStore`) вместо props

## In Progress
- [ ] (TBD)

## Future Roadmap
- [ ] (TBD)
