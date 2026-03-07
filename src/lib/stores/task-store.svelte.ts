/**
 * Svelte 5 Store для управления задачами
 * Использует $state и $effect для реактивности и автосохранения
 */
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { resourceDir, join } from "@tauri-apps/api/path";
import { encryptData, decryptData } from "$lib/stores/crypto-store";
import type { TypesTask } from "$lib/types/types-task";

// Имя файла для хранения задач
const TASKS_FILE = "tasks.json";

/**
 * Класс-стор для управления задачами
 * Автоматически сохраняет изменения в файл при каждом обновлении
 */
class TaskStore {
    // Реактивное состояние задач
    tasks = $state<TypesTask[]>([]);
    
    // Текущий пароль для шифрования
    currentPass = $state<string | null>(null);
    
    // Флаг инициализации - чтобы не сохранять при начальной загрузке
    // Важно: поле используется в компонентных $effect (вынесено из конструктора)
    isInitialized = $state(false);
    
    // Приватный флаг для отслеживания изменений
    // Важно: поле используется в компонентных $effect (вынесено из конструктора)
    _lastSavedTasks = $state<string>("");

    constructor() {
        // В Svelte 5 нельзя вызывать $effect внутри произвольного класса
        // (иначе получим runtime-ошибку effect_orphan).
        // Поэтому автосохранение перенесено в компонент src/routes/+layout.svelte.
        console.log("[TaskStore] Экземпляр store создан. Эффекты автосохранения инициализируются в layout.");
    }

    /**
     * Получить путь к файлу задач
     */
    private async getFilePath(): Promise<string> {
        const dir = await resourceDir();
        return await join(dir, TASKS_FILE);
    }

    /**
     * Загрузить задачи из файла (вызывается один раз при старте)
     */
    async loadTask(): Promise<boolean> {
        try {
            const path = await this.getFilePath();
            console.log(`[TaskStore] Загрузка задач из: ${path}`);

            const content = await readTextFile(path);
            const fileData = JSON.parse(content);
            const isFileEncrypted = !!fileData.cipher;

            if (isFileEncrypted) {
                console.log("[TaskStore] 📦 Найден зашифрованный файл задач.");

                if (!this.currentPass) {
                    console.warn("[TaskStore] ⚠️ Пароль не установлен. Невозможно расшифровать задачи.");
                    this.isInitialized = true;
                    return false;
                }

                const decrypted = await decryptData(fileData.cipher, this.currentPass, fileData.iv, fileData.salt);

                if (decrypted.success && decrypted.data) {
                    this.tasks = decrypted.data;
                    this._lastSavedTasks = JSON.stringify(this.tasks);
                    console.log("[TaskStore] ✅ Задачи успешно расшифрованы и загружены.");
                    this.isInitialized = true;
                    return true;
                } else {
                    console.warn("[TaskStore] ⚠️ Ошибка расшифровки задач. Возможно, пароль неверный.");
                    this.isInitialized = true;
                    return false;
                }
            } else {
                console.log("[TaskStore] 📂 Найден незашифрованный файл задач.");
                this.tasks = fileData;
                this._lastSavedTasks = JSON.stringify(this.tasks);
                console.log("[TaskStore] ✅ Задачи успешно загружены из файла.");
                this.isInitialized = true;
                return true;
            }
        } catch (error) {
            console.warn("[TaskStore] ⚠️ Файл с задачами не найден. Начинаем с пустым списком.", error);
            this.isInitialized = true;
            return true;
        }
    }

    /**
     * Сохранить задачи в файл
     */
    async saveTask(): Promise<void> {
        try {
            const path = await this.getFilePath();
            console.log(`[TaskStore] Сохранение задач по пути: ${path}`);
            console.log(`[TaskStore] Пароль установлен: ${!!this.currentPass}`);

            if (this.currentPass) {
                console.log("[TaskStore] 🔐 Пароль установлен. Задачи будут зашифрованы и сохранены.");
                const encrypted = await encryptData(this.tasks, this.currentPass);
                const content = JSON.stringify(encrypted, null, 2);
                await writeTextFile(path, content);
                console.log("[TaskStore] ✅ Задачи успешно зашифрованы и сохранены.");
            } else {
                const content = JSON.stringify(this.tasks, null, 2);
                await writeTextFile(path, content);
                console.log("[TaskStore] 💾 Задачи успешно сохранены без шифрования.");
            }
        } catch (error) {
            console.error("[TaskStore] ❌ Ошибка при сохранении задач:", error);
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
