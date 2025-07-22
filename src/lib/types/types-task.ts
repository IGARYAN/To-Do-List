// Интерфейс задачи
export interface TypesTask {
  id: string;                 // Уникальный идентификатор задачи
  title: string;              // Название задачи
  color?: string;             // Цвет полоски задачи, например: "yellow", "blue", "green", "red", "gray"
  description?: string;       // Описание задачи (необязательное)
  date: string;               // Дата выполнения в формате ISO
  completed: boolean;         // Статус выполнения
  completedAt?: string;       // Дата и время выполнения (устанавливается автоматически)
}
