/**
 * Svelte 5 Store для управления задачами
 * Использует $state и $effect для реактивности и автосохранения
 */
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { resourceDir, join } from "@tauri-apps/api/path";
import { encryptData, decryptData } from "$lib/stores/crypto-store";
import type { TypesTask } from "$lib/types/types-task";
import type { TypesStorage } from "$lib/types/types-storage";
import type { TypesRepeatTemplate } from "$lib/types/types-repeat-template";

// Имя файла для хранения задач
const TASKS_FILE = "tasks.json";

/**
 * Класс-стор для управления задачами
 * Автоматически сохраняет изменения в файл при каждом обновлении
 */
class TaskStore {
    // Реактивное состояние задач
    tasks = $state<TypesTask[]>([]);

    // Реактивное состояние шаблона задачи
    templates = $state<TypesRepeatTemplate[]>([]);

    // Текущий пароль для шифрования
    currentPass = $state<string | null>(null);

    // Флаг инициализации - чтобы не сохранять при начальной загрузке
    // Важно: поле используется в компонентных $effect (вынесено из конструктора)
    isInitialized = $state(false);

    // Приватный флаг для отслеживания изменений
    // Важно: поле используется в компонентных $effect (вынесено из конструктора)
    _lastSavedTasks = $state<string>("");

    // Закэшированный путь к файлу
    private _filePath: string | null = null;

    constructor() {
        // В Svelte 5 нельзя вызывать $effect внутри произвольного класса
        // Поэтому автосохранение перенесено в компонент src/routes/+layout.svelte.
        console.log("[TaskStore] Экземпляр store создан. Эффекты автосохранения инициализируются в layout.");
    }

    /**
     * Получить путь к файлу задач и закэшировать
     */
    private async getFilePath(): Promise<string> {
        if (!this._filePath) {
            const dir = await resourceDir();
            this._filePath = await join(dir, TASKS_FILE);
            console.log(`[TaskStore] Путь к файлу закэширован: ${this._filePath}`);
        }
        return this._filePath;
    }

    /**Загрузка — читаем оба массива
     * Загрузить задачи из файла (вызывается один раз при старте)
     */
    async loadTask(): Promise<boolean> {
        try {
            const path = await this.getFilePath();
            const content = await readTextFile(path);
            const fileData = JSON.parse(content);
            const isFileEncrypted = !!fileData.cipher;

            if (isFileEncrypted) {
                if (!this.currentPass) {
                    console.warn("[TaskStore] ⚠️ Пароль не установлен.");
                    return false;
                }

                const decrypted = await decryptData(
                    fileData.cipher,
                    this.currentPass,
                    fileData.iv,
                    fileData.salt
                );

                if (decrypted.success && decrypted.data) {
                    this.tasks = decrypted.data.tasks ?? [];
                    this.templates = decrypted.data.templates ?? [];
                    this._lastSavedTasks = JSON.stringify({ tasks: this.tasks, templates: this.templates });
                    this.isInitialized = true;
                    return true;
                } else {
                    console.warn("[TaskStore] ⚠️ Ошибка расшифровки.");
                    return false;
                }
            } else {
                // Поддержка старого формата (массив задач без шаблонов)
                if (Array.isArray(fileData)) {
                    console.warn("[TaskStore] 📂 Старый формат файла, мигрируем...");
                    this.tasks = fileData;
                    this.templates = [];
                } else {
                    this.tasks = fileData.tasks ?? [];
                    this.templates = fileData.templates ?? [];
                }
                this._lastSavedTasks = JSON.stringify({ tasks: this.tasks, templates: this.templates });
                this.isInitialized = true;
                return true;
            }
        } catch (error) {
            console.warn("[TaskStore] ⚠️ Файл не найден, начинаем с пустым списком.", error);
            this.isInitialized = true;
            return true;
        }
    }

    /**Сохранение — сохраняем оба массива
     * Сохранить задачи в файл
     */
    async saveTask(): Promise<void> {
        try {
            const path = await this.getFilePath();
            const storage: TypesStorage = {
                tasks: this.tasks,
                templates: this.templates,
            };

            if (this.currentPass) {
                const encrypted = await encryptData(storage, this.currentPass);
                await writeTextFile(path, JSON.stringify(encrypted, null, 2));
                console.log("[TaskStore] ✅ Данные зашифрованы и сохранены.");
            } else {
                await writeTextFile(path, JSON.stringify(storage, null, 2));
                console.log("[TaskStore] 💾 Данные сохранены.");
            }
        } catch (error) {
            console.error("[TaskStore] ❌ Ошибка сохранения:", error);
        }
    }

    // Методы для шаблонов
    addTemplate(template: TypesRepeatTemplate): void {
        this.templates = [...this.templates, template];
    }

    updateTemplate(id: string, updates: Partial<TypesRepeatTemplate>): void {
        this.templates = this.templates.map(t =>
            t.id === id ? { ...t, ...updates } : t
        );
    }

    deleteTemplate(id: string, deleteFutureTasks: boolean): void {
        this.templates = this.templates.filter(t => t.id !== id);

        if (deleteFutureTasks) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            // Удаляем незавершённые будущие задачи связанные с шаблоном
            this.tasks = this.tasks.filter(task => {
                if (task.repeatTemplateId !== id) return true;
                if (task.completed) return true; // выполненные не трогаем
                const taskDate = new Date(task.date);
                taskDate.setHours(0, 0, 0, 0);
                return taskDate < today; // прошедшие не трогаем
            });
        }
    }

    /**
     * Установить пароль
     */
    setPassword(pass: string | null): void {
        this.currentPass = pass;
    }

    /**
     * Добавить новую задачу
     */
    addTask(task: TypesTask): void {
        this.tasks = [...this.tasks, task];
    }

    /**
     * Обновить задачу
     */
    updateTask(id: string, updates: Partial<TypesTask>): void {
        this.tasks = this.tasks.map(task =>
            task.id === id ? { ...task, ...updates } : task
        );
    }

    /**
     * Удалить задачу
     */
    deleteTask(id: string): void {
        this.tasks = this.tasks.filter(task => task.id !== id);
    }

    /**
     * Переключить статус выполнения задачи
     */
    toggleTask(id: string): void {
        this.tasks = this.tasks.map(task => {
            if (task.id === id) {
                const isNowCompleted = !task.completed;
                return {
                    ...task,
                    completed: isNowCompleted,
                    completedAt: isNowCompleted ? new Date().toISOString() : undefined,
                };
            }
            return task;
        });
    }

    /**
     * Очистить все задачи
     */
    clearTasks(): void {
        this.tasks = [];
    }
}

// Экспортируем единственный экземпляр класса
export const taskStore = new TaskStore();
