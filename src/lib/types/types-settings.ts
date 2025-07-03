/**
 * Интерфейс настроек приложения
 */
export interface TypesSettings {
    autoDeleteDays: number;                     // Количество дней до автоудаления выполненных задач
    futureDays: number;                         // Количество дней для отображения будущих задач
    theme: "light" | "dark" | "system";         // Тема оформления
    saveWindowState: boolean;                   // Сохранять состояние окна
    alwaysOnTop: boolean;                       // Всегда поверх всех окон

    // Состояние окна:
    windowState?: {
        x: number;
        y: number;
        width: number;
        height: number;
        isMaximized: boolean;
    } | null;
};