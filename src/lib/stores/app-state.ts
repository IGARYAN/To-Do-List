import { writable } from 'svelte/store';
import type { Task, AppSettings } from '$lib/types/task.ts';    // Подключение типов

export const isSingleColumn = writable(false);
export const isTaskModalOpen = writable(false);                 // открыто ли модальное окно задачи
export const isSettingsModalOpen = writable(false);             // открыто ли модальное окно настроек
export const isDeleteDialogOpen = writable(false);              // открыт ли диалог подтверждения удаления

export const editingTask = writable<Task | null>(null);         // задача для редактирования (null если создание новой)
export const taskToDelete = writable<Task | null>(null);        // задача для удаления

export const currentTime = writable(new Date());                // переменная для отслеживания времени

export const tasks = writable<Task[]>([]);                      // список всех задач
export const settings = writable<AppSettings>({                 // настройки приложения
    alwaysOnTop: false,         // Всегда поверх всех окон
    autoDeleteDays: 7,          // Автоудаление выполненных задач через N дней
    futureDays: 7,              // На сколько дней вперед показывать задачи
    encryptTasks: false,        // Шифровать задачи
    theme: "system",            // Тема оформления
    saveWindowState: false,     // Сохранять состояние окна
    windowState: null,          // Состояние окна
});
