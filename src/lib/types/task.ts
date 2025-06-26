/**
 * Интерфейс задачи
 */
export interface Task {
  id: string; // Уникальный идентификатор задачи
  title: string; // Название задачи
  description?: string; // Описание задачи (необязательное)
  date: string; // Дата выполнения в формате ISO
  completed: boolean; // Статус выполнения
  completedAt?: string; // Дата и время выполнения (устанавливается автоматически)
}

/**
 * Интерфейс настроек приложения
 */
export interface AppSettings {
  autoDeleteDays: number; // Количество дней до автоудаления выполненных задач
  futureDays: number; // Количество дней для отображения будущих задач
  theme: "light" | "dark" | "system"; // Тема оформления
  saveWindowState: boolean;
  alwaysOnTop: boolean;

  // Добавляем состояние окна:
  windowState?: {
    x: number;
    y: number;
    width: number;
    height: number;
    isMaximized: boolean;
  } | null;
};