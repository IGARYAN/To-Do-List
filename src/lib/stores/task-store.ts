import { get } from "svelte/store";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { resourceDir, join } from "@tauri-apps/api/path";
import { encryptData, decryptData } from "$lib/stores/crypto-store";
import { tasks, currentPass } from "$lib/stores/app-state";
import type { TypesTask } from "$lib/types/types-task";
import { goto } from '$app/navigation';
import { toastStore } from "$lib/stores/toast-store";

const TASKS_FILE = "tasks.json";

let isInitialized = false;

async function getFilePath(fileName: string): Promise<string> {
    const dir = await resourceDir();
    return await join(dir, fileName);
}

export async function loadTask(): Promise<boolean> {
    try {
        const path = await getFilePath(TASKS_FILE);
        console.log(`Загрузка задач из: ${path}`);

        const content = await readTextFile(path);
        const fileData = JSON.parse(content);
        const pass = get(currentPass);
        const isFileEncrypted = !!fileData.cipher;

        if (isFileEncrypted) {
            console.log("📦 Найден зашифрованный файл задач.");

            if (!pass) {
                console.warn("⚠️ Пароль не установлен. Невозможно расшифровать задачи, ожидаем пароль.");
                // tasks.set([]);
                return false;
            }

            const decrypted = await decryptData(fileData.cipher, pass);

            if (decrypted.success && decrypted.data) {
                tasks.set(decrypted.data);
                console.log("✅ Задачи успешно расшифрованы и загружены.");
                return true;
            } else {
                console.warn("⚠️ Ошибка расшифровки задач. Возможно, пароль неверный.");
                // tasks.set([]);
                return false;
            }
        } else {
            console.log("📂 Найден незашифрованный файл задач.");
            tasks.set(fileData);
            console.log("✅ Задачи успешно загружены из файла.");
            return true;
        }
    } catch (error) {
        console.warn(`⚠️ Файл с задачами не найден.`, error);
        return true;
    } finally {
        isInitialized = true;
        console.log("Инициализация задач завершена.");
    }
}

tasks.subscribe((value) => {
    if (!isInitialized) return;

    saveTask(value);
});

currentPass.subscribe(async (value) => {
    if (!isInitialized) return;

    if (!!value) {
        console.log("🔐 Попытка расшифровать задачи с новым паролем...");
        const success = await loadTask();

        if (success) {
            console.log("✅ Пароль принят, задачи загружены.");
            goto('/'); // Переход на главную
        } else {
            console.warn("❌ Пароль неверный. Ждём новый ввод.");
            toastStore.add({
                title: "Ошибка",
                description: "Неверный пароль",
                variant: "destructive",
            });
        }
    } else {
        saveTask(get(tasks));
    }
});

export async function saveTask(data: TypesTask[]): Promise<void> {
    try {
        const path = await getFilePath(TASKS_FILE);
        console.log(`Сохранения задач по пути: ${path}`);
        const pass = get(currentPass);
        console.log(`Пароль установлен: ${!!pass}`);

        if (!!pass) {
            console.warn("⚠️ Пароль установлен. Задачи будут зашифрованы и сохранены.");
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
