/**
 * Интерфейс Toast уведомления
 */
export interface Toast {
  id: string // Уникальный идентификатор уведомления
  title?: string // Заголовок уведомления
  description?: string // Описание уведомления
  variant?: "default" | "destructive" // Тип уведомления (обычное или ошибка)
}
