/**
 * Интерфейс задачи
 */
export interface TypesTask {
  id: string;                 // Уникальный идентификатор задачи
  title: string;              // Название задачи
  description?: string;       // Описание задачи (необязательное)
  date: string;               // Дата выполнения в формате ISO
  completed: boolean;         // Статус выполнения
  completedAt?: string;       // Дата и время выполнения (устанавливается автоматически)
}
