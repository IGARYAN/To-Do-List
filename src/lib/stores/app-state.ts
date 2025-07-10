import { writable } from 'svelte/store';
import type { TypesTask } from '$lib/types/types-task';         // Подключение типов
import type { TypesSettings } from '$lib/types/types-settings'; // Подключение типов

export const isEditTaskModalOpen = writable(false);             // Управляет видимостью
export const currentTime = writable(new Date());                // Отслеживание времени
export const currentPass = writable<string | null>(null);       // Текущий пароль
export const editedTask = writable<TypesTask | null>(null);     // Одна задача или null
export const tasks = writable<TypesTask[]>([]);                 // Список всех задач
export const settings = writable<TypesSettings>({               // Настройки приложения
    alwaysOnTop: false,         // Всегда поверх всех окон
    autoDeleteDays: 7,          // Автоудаление выполненных задач через N дней
    futureDays: 7,              // На сколько дней вперед показывать задачи
    theme: "system",            // Тема оформления
    saveWindowState: false,     // Сохранять состояние окна
    windowState: null,          // Состояние окна
});
