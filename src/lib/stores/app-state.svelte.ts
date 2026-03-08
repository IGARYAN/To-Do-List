/**
 * Svelte 5 Store для управления состоянием UI приложения
 * Использует $state для реактивности (без автосохранения - это UI состояние)
 */
import type { TypesTask } from "$lib/types/types-task";

/**
 * Класс-стор для управления состоянием UI
 * Содержит состояния модальных окон, диалогов и временных данных
 */
class AppStateStore {
    // ==================== UI Состояния ====================

    // Состояние модальных окон
    isEditTaskModalOpen = $state(false);
    isCreateTaskModalOpen = $state(false);
    isDeleteConfirmDialogOpen = $state(false);

    // ==================== Данные для операций ====================

    // Задача для создания/редактирования/удаления
    taskCreateEditDelete = $state<TypesTask | null>(null);

    // Выбранный цвет для задачи
    selectedColor = $state<string | undefined>(undefined);

    // Текущее время (обновляется каждую минуту)
    currentTime = $state(new Date());

    // ==================== Методы управления UI ====================

    /**
     * Открыть модальное окно создания задачи
     */
    openCreateTaskModal(): void {
        this.isCreateTaskModalOpen = true;
    }

    /**
     * Закрыть модальное окно создания задачи
     */
    closeCreateTaskModal(): void {
        this.isCreateTaskModalOpen = false;
        this.taskCreateEditDelete = null;
        this.selectedColor = undefined;
    }

    /**
     * Открыть модальное окно редактирования задачи
     */
    openEditTaskModal(task: TypesTask): void {
        this.taskCreateEditDelete = task;
        this.isEditTaskModalOpen = true;
    }

    /**
     * Закрыть модальное окно редактирования задачи
     */
    closeEditTaskModal(): void {
        this.isEditTaskModalOpen = false;
        this.taskCreateEditDelete = null;
        this.selectedColor = undefined;
    }

    /**
     * Функция открывает диалог создания задачи из существующей задачи
     */
    openCreateTaskFromExisting(task: TypesTask): void {
        this.taskCreateEditDelete = task;
        this.selectedColor = task.color;
        this.isCreateTaskModalOpen = true;
    }

    /**
     * Открыть диалог подтверждения удаления
     */
    openDeleteConfirmDialog(task: TypesTask): void {
        this.taskCreateEditDelete = task;
        this.isDeleteConfirmDialogOpen = true;
    }

    /**
     * Закрыть диалог подтверждения удаления
     */
    closeDeleteConfirmDialog(): void {
        this.isDeleteConfirmDialogOpen = false;
        this.taskCreateEditDelete = null;
    }

    /**
     * Установить выбранный цвет
     */
    setSelectedColor(color: string | undefined): void {
        this.selectedColor = color;
    }

    /**
     * Обновить текущее время
     */
    updateTime(): void {
        this.currentTime = new Date();
    }


    private _timeInterval: ReturnType<typeof setInterval> | null = null;

    /**
     * Запустить таймер обновления времени (каждую минуту)
     */
    startTimeUpdater(): void {
        if (this._timeInterval) clearInterval(this._timeInterval);
        this._timeInterval = setInterval(() => {
            this.updateTime();
        }, 60000);
    }

    stopTimeUpdater(): void {
        if (this._timeInterval) {
            clearInterval(this._timeInterval);
            this._timeInterval = null;
        }
    }

    /**
     * Закрыть все модальные окна и диалоги
     */
    closeAll(): void {
        this.isCreateTaskModalOpen = false;
        this.isEditTaskModalOpen = false;
        this.isDeleteConfirmDialogOpen = false;
        this.taskCreateEditDelete = null;
        this.selectedColor = undefined;
    }

    // Гетер - Сегодняшняя дата
    get today(): Date {
        const date = new Date(this.currentTime);
        date.setHours(0, 0, 0, 0);
        return date;
    }

    // Гетер - Завтрашняя дата
    get tomorrow(): Date {
        const date = new Date(this.currentTime);
        date.setDate(date.getDate() + 1);
        date.setHours(0, 0, 0, 0);
        return date;
    }
}

// Экспортируем единственный экземпляр класса
export const appStateStore = new AppStateStore();