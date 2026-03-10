/**
 * Svelte 5 Store для управления настройками
 * Использует $state и $effect для реактивности и автосохранения
 */
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { resourceDir, join } from "@tauri-apps/api/path";
import type { TypesSettings } from "$lib/types/types-settings";

// Имя файла для хранения настроек
const SETTINGS_FILE = "settings.json";

// Значения настроек по умолчанию
const DEFAULT_SETTINGS: TypesSettings = {
    alwaysOnTop: false,
    autoDeleteDays: 7,
    futureDays: 7,
    theme: "system",
    saveWindowState: false,
    windowState: null,
};

/**
 * Класс-стор для управления настройками
 * Автоматически сохраняет изменения в файл при каждом обновлении
 */
class SettingsStore {
    // Реактивное состояние настроек
    settings = $state<TypesSettings>({ ...DEFAULT_SETTINGS });

    // Флаг инициализации - чтобы не сохранять при начальной загрузке
    isInitialized = $state(false);

    // Приватный флаг для отслеживания изменений
    _lastSavedSettings = $state<string>("");

    // Закэшированный путь к файлу
    private _filePath: string | null = null;

    constructor() {
        // Конструктор теперь пустой - эффекты перенесены в компонент +layout.svelte
        console.log("[SettingsStore] Создан экземпляр сторa");
    }

    /**
     * Получить путь к файлу настроек
     */
    private async getFilePath(): Promise<string> {
        if (!this._filePath) {
            const dir = await resourceDir();
            this._filePath = await join(dir, SETTINGS_FILE);
            console.log(`[SettingsStore] Путь к файлу закэширован: ${this._filePath}`);
        }
        return this._filePath;
    }

    /**
     * Загрузить настройки из файла (вызывается один раз при старте)
     */
    async loadSettings(): Promise<void> {
        try {
            const path = await this.getFilePath();
            console.log(`[SettingsStore] Загрузка настроек из: ${path}`);

            const content = await readTextFile(path);
            const fileSettings = JSON.parse(content) as TypesSettings;

            // Применяем загруженные настройки с проверкой на обязательные поля
            this.settings = {
                ...DEFAULT_SETTINGS,
                ...fileSettings,
            };

            this._lastSavedSettings = JSON.stringify(this.settings);
            console.log("[SettingsStore] ✅ Настройки успешно загружены из файла.");
        } catch (error) {
            console.warn(`[SettingsStore] ⚠️ Файл настроек не найден, используются настройки по умолчанию.`, error);
        } finally {
            this.isInitialized = true;
            console.log("[SettingsStore] Инициализация настроек завершена");
        }
    }

    /**
     * Сохранить настройки в файл
     */
    async saveSettings(): Promise<void> {
        try {
            const path = await this.getFilePath();
            console.log(`[SettingsStore] Сохранение настроек в: ${path}`);
            const content = JSON.stringify(this.settings, null, 2);
            await writeTextFile(path, content);
            console.log("[SettingsStore] 💾 Настройки успешно сохранены.");
        } catch (error) {
            console.error(`[SettingsStore] ❌ Ошибка при сохранении настроек:`, error);
        }
    }

    /**
     * Обновить настройки (частичное обновление)
     */
    updateSettings(updates: Partial<TypesSettings>): void {
        this.settings = {
            ...this.settings,
            ...updates,
        };
    }

    /**
     * Установить конкретную настройку
     */
    set<K extends keyof TypesSettings>(key: K, value: TypesSettings[K]): void {
        this.settings = {
            ...this.settings,
            [key]: value,
        };
    }

    /**
     * Получить конкретную настройку
     */
    get<K extends keyof TypesSettings>(key: K): TypesSettings[K] {
        return this.settings[key];
    }

    /**
     * Сбросить настройки до значений по умолчанию
     */
    resetToDefaults(): void {
        this.settings = { ...DEFAULT_SETTINGS };
    }
}

// Экспортируем единственный экземпляр класса
export const settingsStore = new SettingsStore();
