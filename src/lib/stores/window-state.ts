import { getCurrentWindow, LogicalSize, LogicalPosition } from "@tauri-apps/api/window";
import { readSettings, writeSettings } from "$lib/stores/app-store";

const appWindow = getCurrentWindow();

/** Сохраняем состояние окна */
export async function saveWindow() {
    try {
        const settings = await readSettings();
        if (!settings.saveWindowState) return;

        // Проверяем, минимизировано ли окно
        const isMinimized = await appWindow.isMinimized();
        if (isMinimized) {
            console.log("Окно свернуто — состояние не сохраняется.");
            return;
        } // Сохраняем только если окно не минимизировано
        // Сохраняем внешнюю позицию (включает заголовок и рамки)
        const { x, y } = await appWindow.outerPosition();
        // Сохраняем только внутренний размер (контентную область)
        const { width, height } = await appWindow.innerSize();
        const isMaximized = await appWindow.isMaximized();
        settings.windowState = { x, y, width, height, isMaximized };
        await writeSettings(settings);
    } catch (e) {
        console.error("Ошибка при сохранении окна:", e);
    }
}

/** Восстанавливаем состояние окна */
export async function restoreWindow() {
    try {
        const settings = await readSettings();
        if (settings.saveWindowState && settings.windowState) {
            const { x, y, width, height, isMaximized } = settings.windowState;

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
        try { // 💾 Сохраняем состояние окна
            await saveWindow();
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