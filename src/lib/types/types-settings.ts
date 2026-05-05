// Интерфейс настроек приложения
export interface TypesSettings {
    autoDeleteDays: number;                     // Количество дней до автоудаления выполненных задач
    futureDays: number;                         // Количество дней для отображения будущих задач
    theme: "light" | "dark" | "system";         // Тема оформления
    saveWindowState: boolean;                   // Сохранять состояние окна
    alwaysOnTop: boolean;                       // Всегда поверх всех окон

    windowState?: WindowState | null;           // Состояние окна (с параметрами дисплея)
};

/**
 * Параметры дисплея, при которых было сохранено состояние окна.
 * Используется для проверки актуальности сохранённых координат
 * при восстановлении после смены разрешения, DPI или монитора.
 */
export interface DisplayInfo {
    displayWidth: number;    // Физическая ширина монитора в пикселях
    displayHeight: number;   // Физическая высота монитора в пикселях
    scaleFactor: number;     // Коэффициент масштабирования (DPI): 1.0, 1.25, 1.5...
    monitorName: string | null; // Идентификатор монитора (null если ОС не сообщает)
}

/**
 * Полное состояние окна, включая координаты, размеры и параметры дисплея.
 * Сохраняется в настройках при закрытии приложения.
 */
export interface WindowState {
    // Координаты и размеры окна
    x: number;
    y: number;
    width: number;
    height: number;
    isMaximized: boolean;

    // Параметры дисплея на момент сохранения
    displayWidth: number;
    displayHeight: number;
    scaleFactor: number;
    monitorName: string | null;
};
