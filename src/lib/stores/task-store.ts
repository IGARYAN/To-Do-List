import { get } from "svelte/store";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { resourceDir, join } from "@tauri-apps/api/path";
import { encryptData, decryptData } from "$lib/stores/crypto-store";
import { tasks, settings, currentPass } from "$lib/stores/app-state";
import type { TypesTask } from "$lib/types/types-task";

const TASKS_FILE = "tasks.json";

let isInitialized = false;

async function getFilePath(fileName: string): Promise<string> {
    const dir = await resourceDir();
    return await join(dir, fileName);
}

export async function loadTask(): Promise<void> {
    try {
        const path = await getFilePath(TASKS_FILE);
        console.log(`Загрузка задач из: ${path}`);

        const content = await readTextFile(path);
        const fileData = JSON.parse(content);

        const appSettings = get(settings);
        const pass = get(currentPass);

        const isFileEncrypted = fileData.cipher && fileData.iv;

        if (isFileEncrypted) {
            console.log("📦 Найден зашифрованный файл задач.");

            if (!pass) {
                console.warn("⚠️ Пароль не установлен. Невозможно расшифровать задачи.");
                tasks.set([]);
                return;
            }

            const decrypted = await decryptData(fileData.cipher, pass);

            if (decrypted.success && decrypted.data) {
                tasks.set(decrypted.data);
                console.log("✅ Задачи успешно расшифрованы и загружены.");
            } else {
                console.warn("⚠️ Ошибка расшифровки задач. Возможно, пароль неверный.");
                tasks.set([]);
            }
        } else if (!appSettings.encryptTasks && !pass) {
            // Если файл не зашифрован, шифрование отключено, и пароля нет — читаем напрямую
            console.log("📂 Найден незашифрованный файл задач.");
            tasks.set(fileData);
        } else {
            console.warn("⚠️ Файл выглядит незашифрованным, но в настройках включено шифрование или указан пароль. Проверка прервана для безопасности.");
            tasks.set([]);
        }
    } catch (error) {
        console.warn(`⚠️ Файл с задачами не найден. Используются значения по умолчанию.`, error);
    } finally {
        isInitialized = true;
        console.log("Инициализация задач завершена.");
    }
}

tasks.subscribe((value) => {
    if (!isInitialized) return;

    saveTask(value);
});

export async function saveTask(data: TypesTask[]): Promise<void> {
    try {
        const path = await getFilePath(TASKS_FILE);
        const appSettings = get(settings);
        const pass = get(currentPass);

        if (appSettings.encryptTasks) {
            if (!pass || pass.length === 0) {
                console.warn("⚠️ Пароль не установлен. Задачи не будут сохранены.");
                return;
            }

            const encrypted = await encryptData(data, pass);
            const content = JSON.stringify(encrypted, null, 2);
            await writeTextFile(path, content);
            console.log("🔐 Задачи успешно зашифрованы и сохранены.");
        } else {
            const content = JSON.stringify(data, null, 2);
            await writeTextFile(path, content);
            console.log("💾 Задачи успешно сохранены без шифрования.");
        }
    } catch (error) {
        console.error(`❌ Ошибка при сохранении задач:`, error);
    }
}
