import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { resourceDir, join } from "@tauri-apps/api/path";
import { settings } from "$lib/stores/app-state";
import type { TypesSettings } from "$lib/types/types-settings";

// 📁 Имя файла настроек
const SETTINGS_FILE = "settings.json";

// Флаг инициализации
let isInitialized = false;

// Получаем абсолютный путь к файлу
async function getFilePath(fileName: string): Promise<string> {
  const dir = await resourceDir();
  return await join(dir, fileName);
}

// Чтение настроек из файла
export async function loadSettings(): Promise<void> {
  try {
    const path = await getFilePath(SETTINGS_FILE);
    console.log(`Загрузка настроек из: ${path}`);
    const content = await readTextFile(path);
    const fileSettings = JSON.parse(content) as TypesSettings;

    settings.set(fileSettings);
    console.log("✅ Настройки успешно загружены из файла.");
  } catch (error) {
    console.warn(`⚠️ Файл настроек не найден, используются настройки по умолчанию.`, error);
    // Если файла нет — просто продолжаем с текущими значениями store.
  } finally {
    isInitialized = true; // Считаем, что инициализация завершена
    console.log("Инициализация настроек завершена");
  }
}

// Автосохранение настроек при изменении
settings.subscribe((value) => {
  if (!isInitialized) return; // Игнорируем изменения до инициализации

  saveSettings(value);
});

// Сохранение настроек в файл
export async function saveSettings(data: TypesSettings): Promise<void> {
  try {
    const path = await getFilePath(SETTINGS_FILE);
    console.log(`Сохранение настроек в: ${path}`);
    const content = JSON.stringify(data, null, 2);
    await writeTextFile(path, content);
    console.log("💾 Настройки успешно сохранены.");
  } catch (error) {
    console.error(`❌ Ошибка при сохранении настроек:`, error);
  }
}
