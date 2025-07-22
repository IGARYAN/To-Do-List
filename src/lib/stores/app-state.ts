import { writable } from 'svelte/store';
import type { TypesTask } from '$lib/types/types-task';                 // Подключение типов задач
import type { TypesSettings } from '$lib/types/types-settings';         // Подключение типов настроек

export const isEditTaskModalOpen = writable(false);                     // Переменная определяет открыт диалог изменения задачи или нет
export const isCreateTaskModalOpen = writable(false);                   // Переменная определяет открыт диалог создания задачи или нет
export const isDeleteConfirmDialogOpen = writable(false);               // Переменная определяет открыт диалог удаления задачи или нет

export const taskCreateEditDelete = writable<TypesTask | null>(null);   // Переменная для передачи задачи для создания и редактирования или удаления
export const selectedColor = writable<string | undefined>(undefined);   // Выбранный цвет
export const currentTime = writable(new Date());                        // переменная для отслеживания времени
export const currentPass = writable<string | null>(null);               // Текущий пароль

export const tasks = writable<TypesTask[]>([]);                         // список всех задач
export const settings = writable<TypesSettings>({                       // настройки приложения
    alwaysOnTop: false,                                                 // Всегда поверх всех окон
    autoDeleteDays: 7,                                                  // Автоудаление выполненных задач через N дней
    futureDays: 7,                                                      // На сколько дней вперед показывать задачи
    theme: "system",                                                    // Тема оформления
    saveWindowState: false,                                             // Сохранять состояние окна
    windowState: null,                                                  // Состояние окна
});
