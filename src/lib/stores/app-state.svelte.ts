/**
 * Svelte 5 Store для управления состоянием UI приложения
 * Использует $state для реактивности (без автосохранения - это UI состояние)
 */
import type { TypesTask } from "$lib/types/types-task";
import type { TypesRepeatTemplate } from "$lib/types/types-repeat-template";


/**
 * Класс-стор для управления состоянием UI
 * Содержит состояния модальных окон, диалогов и временных данных
 */
class AppStateStore {
    // ==================== UI Состояния ====================

    // Состояние модальных окон
    isPasswordModalOpen = $state(false);
    isSettingsModalOpen = $state(false);
    isDeleteConfirmDialogOpen = $state(false);
    isTaskModalOpen = $state(false);
    taskModalMode = $state<'create' | 'edit' | 'createFrom' | null>(null);
    isTemplateModalOpen = $state(false);
    templateToEdit = $state<TypesRepeatTemplate | null>(null);

    // ==================== Данные для операций ====================

    // Задача для создания/редактирования/удаления
    taskCreateEditDelete = $state<TypesTask | null>(null);

    // Выбранный цвет для задачи
    selectedColor = $state<string | undefined>(undefined);

    // Текущее время (обновляется каждую минуту)
    currentTime = $state(new Date());

    // ==================== Методы управления UI ====================

    /**
     * Открыть модальное окно настроек
     */
    openSettingsModal(): void {
        this.isSettingsModalOpen = true;
    }

    /**
     * Закрыть модальное окно настроек
     */
    closeSettingsModal(): void {
        this.isSettingsModalOpen = false;
    }

    /**
     * Открыть модальное окно пароля
     */
    openPasswordModal(): void {
        this.isPasswordModalOpen = true;
    }

    /**
     * Закрыть модальное окно пароля
     */
    closePasswordModal(): void {
        this.isPasswordModalOpen = false;
    }

    /**
     * Открыть модальное окно шаблонов
     */
    openTemplateModal(template?: TypesRepeatTemplate): void {
        this.templateToEdit = template ?? null;
        this.isTemplateModalOpen = true;
    }

    /**
     * Закрыть модальное окно шаблонов
     */
    closeTemplateModal(): void {
        this.isTemplateModalOpen = false;
        this.templateToEdit = null;
        this.selectedColor = undefined;
    }

    /**
     * Открыть модальное окно создания задачи
     */
    openCreateTaskModal(): void {
        this.taskModalMode = 'create';
        this.isTaskModalOpen = true;
    }

    /**
     * Открыть модальное окно редактирования задачи
     */
    openEditTaskModal(task: TypesTask): void {
        this.taskModalMode = 'edit';
        this.taskCreateEditDelete = task;
        this.isTaskModalOpen = true;
    }

    /**
     * Функция открывает диалог создания задачи из существующей задачи
     */
    openCreateTaskFromExisting(task: TypesTask): void {
        this.taskModalMode = 'createFrom';
        this.taskCreateEditDelete = task;
        this.selectedColor = task.color;
        this.isTaskModalOpen = true;
    }

    /**
     * Закрыть модальное окно создания, создания из и редактирования задачи
     */
    closeTaskModal(): void {
        this.isTaskModalOpen = false;
        this.taskCreateEditDelete = null;
        this.selectedColor = undefined;
        this.taskModalMode = null;
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
        this.taskCreateEditDelete = null;
        this.isDeleteConfirmDialogOpen = false;
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

    /**
     * Закрыть все модальные окна и диалоги
     */
    closeAll(): void {
        this.isTaskModalOpen = false;
        this.isDeleteConfirmDialogOpen = false;
        this.isSettingsModalOpen = false;
        this.isPasswordModalOpen = false;
        this.isTemplateModalOpen = false;
        this.templateToEdit = null;
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