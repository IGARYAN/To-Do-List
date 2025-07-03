import { writable } from 'svelte/store';
import type { TypesTask } from '$lib/types/types-task';         // Подключение типов
import type { TypesSettings } from '$lib/types/types-settings'; // Подключение типов

export const isSingleColumn = writable(false);                  // отслеживаем когда в одну колонку а когда в три
export const isTaskModalOpen = writable(false);                 // открыто ли модальное окно задачи
export const isDeleteDialogOpen = writable(false);              // открыт ли диалог подтверждения удаления

export const editingTask = writable<TypesTask | null>(null);    // задача для редактирования (null если создание новой)
export const taskToDelete = writable<TypesTask | null>(null);   // задача для удаления

export const currentTime = writable(new Date());                // переменная для отслеживания времени
export const currentPass = writable<string | null>(null);       // Текущий пароль

export const tasks = writable<TypesTask[]>([]);                 // список всех задач
export const settings = writable<TypesSettings>({               // настройки приложения
    alwaysOnTop: false,         // Всегда поверх всех окон
    autoDeleteDays: 7,          // Автоудаление выполненных задач через N дней
    futureDays: 7,              // На сколько дней вперед показывать задачи
    theme: "system",            // Тема оформления
    saveWindowState: false,     // Сохранять состояние окна
    windowState: null,          // Состояние окна
});
