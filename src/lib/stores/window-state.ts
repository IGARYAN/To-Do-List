import { getCurrentWindow, LogicalSize, LogicalPosition } from "@tauri-apps/api/window";
import { settingsStore } from "./settings-store.svelte";

const appWindow = getCurrentWindow();

/** Сохраняем состояние окна */
export async function saveWindow() {
    try {
        const currentSettings = settingsStore.settings;
        if (!currentSettings.saveWindowState) {
            console.log("Сохранение состояния окна отключено в настройках");
            return;
        }

        // Проверяем, минимизировано ли окно
        const isMinimized = await appWindow.isMinimized();
        if (isMinimized) {
            console.log("Окно свернуто — состояние не сохраняется.");
            return;
        }

        // Получаем текущее состояние окна
        const { x, y } = await appWindow.outerPosition();
        const { width, height } = await appWindow.innerSize();
        const isMaximized = await appWindow.isMaximized();

        console.log("Сохранение состояния окна:", { x, y, width, height, isMaximized });

        // Обновляем состояние через стор
        settingsStore.set("windowState", { x, y, width, height, isMaximized });
        
        // Принудительно сохраняем на диск (вызываем метод saveSettings)
        await settingsStore.saveSettings();
    } catch (e) {
        console.error("Ошибка при сохранении окна:", e);
    }
}

/** Восстанавливаем состояние окна */
export async function restoreWindow() {
    try {
        const currentSettings = settingsStore.settings;
        if (currentSettings.saveWindowState && currentSettings.windowState) {
            const { x, y, width, height, isMaximized } = currentSettings.windowState;

            if (isMaximized) {
                await appWindow.maximize();
            } else {
                await appWindow.setPosition(new LogicalPosition(x, y));
                await appWindow.setSize(new LogicalSize(width, height));
            }
        }
    } catch (e) {
        console.error("Ошибка при восстановлении окна:", e);
    }
}

/** Автоматическая привязка к событию закрытия */
export async function initWindow() {
    appWindow.onCloseRequested(async (event) => {
        console.log("Обработка запроса на закрытие окна");
        try { // 💾 Сохраняем состояние окна
            await saveWindow();
            console.log("Состояние окна сохранено, закрываем окно");
            // ✅ Разрешаем закрытие окна
            await appWindow.close();
        } catch (e) {
            console.error("Ошибка при закрытии окна:", e);
            // Если не удалось закрыть программно, разрешаем стандартное закрытие
            event.preventDefault();
            await appWindow.close();
        }
    });
}