import { writable } from "svelte/store";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { resourceDir, join } from "@tauri-apps/api/path";
import type { Task, AppSettings } from "$lib/types/task";
import { encryptData, decryptData } from "$lib/stores/crypto-store";
import { tasks, settings } from "$lib/stores/app-state";

// 📁 Имена файлов
const TASKS_FILE = "tasks.json";
const SETTINGS_FILE = "settings.json";

// 🛠️ Настройки по умолчанию
const defaultSettings: AppSettings = {
  autoDeleteDays: 7,
  futureDays: 7,
  theme: "system",
  saveWindowState: false,
  alwaysOnTop: false,
  encryptTasks: true,
};

// 🔄 Получение абсолютного пути к файлу в каталоге данных приложения
async function getFilePath(fileName: string): Promise<string> {
  const dir = await resourceDir();
  return await join(dir, fileName);
}

// 📥 Загрузка данных из файла
async function loadFromFile<T>(fileName: string, defaultValue: T): Promise<T> {
  try {
    const path = await getFilePath(fileName);
    const content = await readTextFile(path);
    return JSON.parse(content) as T;
  } catch (error) {
    console.warn(`⚠️ Не удалось загрузить файл ${fileName}, используется значение по умолчанию`);
    return defaultValue;
  }
}

// 💾 Сохранение данных в файл
async function saveToFile<T>(fileName: string, data: T): Promise<void> {
  try {
    const path = await getFilePath(fileName);
    const content = JSON.stringify(data, null, 2);
    await writeTextFile(path, content);
  } catch (error) {
    console.error(`❌ Ошибка при сохранении файла ${fileName}:`, error);
  }
}

// 🧠 Загрузка настроек
async function readSettings(): Promise<AppSettings> {
  return await loadFromFile<AppSettings>(SETTINGS_FILE, defaultSettings);
}

// 💾 Сохранение настроек
async function writeSettings(settings: AppSettings): Promise<void> {
  await saveToFile<AppSettings>(SETTINGS_FILE, settings);
}

// ✅ Store для задач
function createTasksStore() {
  const store = writable<Task[]>([], (set) => {
    (async () => {
      const settings = await readSettings();
      if (settings.encryptTasks && currentPin) {
        const encrypted = await loadFromFile<any>(TASKS_FILE, { cipher: "", iv: "" });
        const decrypted = await decryptData(encrypted.cipher, encrypted.iv, currentPin);
        if (decrypted) {
          set(decrypted);
        } else {
          console.error("❌ Неверный PIN или ошибка расшифровки.");
          set([]);
        }
      } else {
        const tasks = await loadFromFile<Task[]>(TASKS_FILE, []);
        set(tasks);
      }
    })();

    return () => { };
  });

  let currentPin: string | null = null;

  return {
    subscribe: store.subscribe,
    setPin: (pin: string) => {
      currentPin = pin;
    },
    clearPin: () => {
      currentPin = null;
    },
    tryDecrypt: async () => {
      const settings = await readSettings();
      if (settings.encryptTasks && currentPin) {
        const encrypted = await loadFromFile<any>(TASKS_FILE, { cipher: '', iv: '' });
        const decrypted = await decryptData(encrypted.cipher, encrypted.iv, currentPin);
        return decrypted !== null;
      }
      return true; // если шифрование не включено, всегда успех
    },
    set: async (tasks: Task[]) => {
      const settings = await readSettings();
      if (settings.encryptTasks && currentPin) {
        const encrypted = await encryptData(tasks, currentPin);
        await saveToFile(TASKS_FILE, encrypted);
      } else {
        await saveToFile(TASKS_FILE, tasks);
      }
      store.set(tasks);
    },
    update: async (fn: (tasks: Task[]) => Task[]) => {
      store.update((current) => {
        const updated = fn(current);

        (async () => {
          const settings = await readSettings();
          if (settings.encryptTasks && currentPin) {
            const encrypted = await encryptData(updated, currentPin);
            await saveToFile(TASKS_FILE, encrypted);
          } else {
            await saveToFile(TASKS_FILE, updated);
          }
        })();

        return updated;
      });
    },
  };
}

// ✅ Store для настроек
function createSettingsStore() {
  const store = writable<AppSettings>(defaultSettings, (set) => {
    readSettings().then(set);
    return () => { };
  });

  return {
    subscribe: store.subscribe,
    set: async (settings: AppSettings) => {
      store.set(settings);
      await writeSettings(settings);
    },
    update: async (fn: (settings: AppSettings) => AppSettings) => {
      store.update((current) => {
        const updated = fn(current);
        writeSettings(updated);
        return updated;
      });
    },
  };
}

export const tasksStore = createTasksStore();
export const settingsStore = createSettingsStore();

// ⬇️ Экспортируем для theme-store.ts
export { readSettings, writeSettings };
