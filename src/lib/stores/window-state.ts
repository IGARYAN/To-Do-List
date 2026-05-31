import {
    getCurrentWindow,
    PhysicalSize,
    PhysicalPosition,
    currentMonitor,
    primaryMonitor,
} from "@tauri-apps/api/window";
import { settingsStore } from "./settings-store.svelte";
import type { WindowState, DisplayInfo } from "$lib/types/types-settings";

const appWindow = getCurrentWindow();

// Минимальная видимая часть окна (в физических пикселях), чтобы
// окно не оказалось полностью за пределами экрана после восстановления
const MIN_VISIBLE_MARGIN = 50;

/**
 * Вспомогательная функция: получает текущие параметры дисплея
 * через Tauri Monitor API. Используется при сохранении и восстановлении
 * для сравнения графического окружения.
 *
 * @returns DisplayInfo с разрешением, масштабом и именем монитора
 */
async function getCurrentDisplayInfo(): Promise<DisplayInfo> {
    try {
        // Пытаемся получить монитор, на котором окно сейчас
        let monitor = await currentMonitor();
        console.log("[getCurrentDisplayInfo] currentMonitor вернул:", monitor);

        // Если окно не на мониторе (скрыто/невидимо), берём primaryMonitor
        if (!monitor) {
            console.log("[getCurrentDisplayInfo] currentMonitor = null, используем primaryMonitor");
            monitor = await primaryMonitor();
            console.log("[getCurrentDisplayInfo] primaryMonitor:", monitor);
        }

        // Если и primaryMonitor недоступен (маловероятно), возвращаем заглушку
        if (!monitor) {
            console.warn("[getCurrentDisplayInfo] ⚠️ Ни один монитор не доступен! Использую заглушку.");
            return {
                displayWidth: 1920,
                displayHeight: 1080,
                scaleFactor: 1.0,
                monitorName: null,
            };
        }

        // Извлекаем параметры из объекта Monitor
        // size — PhysicalSize { width, height } в физических пикселях
        // scaleFactor — number (1.0, 1.25, 1.5...)
        // name — string | null
        const displayInfo: DisplayInfo = {
            displayWidth: monitor.size.width,
            displayHeight: monitor.size.height,
            scaleFactor: monitor.scaleFactor,
            monitorName: monitor.name ?? null,
        };

        console.log("[getCurrentDisplayInfo] Определены параметры дисплея:", displayInfo);
        return displayInfo;
    } catch (e) {
        console.error("[getCurrentDisplayInfo] ❌ Ошибка получения параметров дисплея:", e);
        // В случае ошибки возвращаем значения по умолчанию
        return {
            displayWidth: 1920,
            displayHeight: 1080,
            scaleFactor: 1.0,
            monitorName: null,
        };
    }
}

/**
 * Сохраняет текущее состояние окна (координаты, размеры, максимизацию)
 * и параметры дисплея в настройки. Вызывается при закрытии приложения.
 */
export async function saveWindow() {
    try {
        const currentSettings = settingsStore.settings;
        if (!currentSettings.saveWindowState) {
            console.log("[saveWindow] Сохранение состояния окна отключено в настройках");
            return;
        }

        // Проверяем, минимизировано ли окно
        const isMinimized = await appWindow.isMinimized();
        if (isMinimized) {
            console.log("[saveWindow] Окно свернуто — состояние не сохраняется.");
            return;
        }

        // Получаем текущее состояние окна
        const { x, y } = await appWindow.outerPosition();
        const { width, height } = await appWindow.innerSize();
        const isMaximized = await appWindow.isMaximized();

        // Получаем текущие параметры дисплея
        const displayInfo = await getCurrentDisplayInfo();

        // Формируем полный объект состояния окна
        const windowState: WindowState = {
            x,
            y,
            width,
            height,
            isMaximized,
            displayWidth: displayInfo.displayWidth,
            displayHeight: displayInfo.displayHeight,
            scaleFactor: displayInfo.scaleFactor,
            monitorName: displayInfo.monitorName,
        };

        console.log("[saveWindow] Сохранение состояния окна:", windowState);

        // Обновляем состояние через стор
        settingsStore.set("windowState", windowState);

        // Принудительно сохраняем на диск
        await settingsStore.saveSettings();
        console.log("[saveWindow] ✅ Состояние окна успешно сохранено");
    } catch (e) {
        console.error("[saveWindow] ❌ Ошибка при сохранении окна:", e);
    }
}

/**
 * Восстанавливает состояние окна из настроек ТОЛЬКО если:
 * 1. Опция saveWindowState включена
 * 2. Сохранённые параметры дисплея совпадают с текущими
 *    (разрешение, масштаб, монитор)
 *
 * ВАЖНО: saveWindow() сохраняет физические пиксели (PhysicalPosition/PhysicalSize
 * от outerPosition/innerSize). restoreWindow() восстанавливает через
 * PhysicalPosition/PhysicalSize, чтобы избежать двойного масштабирования:
 * - LogicalPosition(x, y) при scaleFactor!=1 даёт физический OFFSET = x*scaleFactor
 * - PhysicalPosition(x, y) даёт ТОЧНО такой же физический пиксель, как был сохранён
 *
 * После восстановления координаты/размеры проверяются на выход за границы
 * текущего монитора (clamp), чтобы окно не оказалось невидимым.
 *
 * Если параметры не совпадают — окно остаётся в стандартном
 * размещении (центр экрана, размеры по умолчанию из tauri.conf.json),
 * а причина отказа логируется.
 */
export async function restoreWindow() {
    try {
        const currentSettings = settingsStore.settings;

        // Проверяем, нужно ли восстанавливать
        if (!currentSettings.saveWindowState) {
            console.log("[restoreWindow] Восстановление окна отключено в настройках (saveWindowState=false)");
            return;
        }

        if (!currentSettings.windowState) {
            console.log("[restoreWindow] Нет сохранённого состояния окна — используется стандартное размещение");
            return;
        }

        const saved = currentSettings.windowState;
        console.log("[restoreWindow] Сохранённое состояние окна:", saved);

        // Получаем текущие параметры дисплея
        const currentDisplay = await getCurrentDisplayInfo();

        // === Проверка 1: совпадает ли разрешение экрана ===
        if (saved.displayWidth !== currentDisplay.displayWidth ||
            saved.displayHeight !== currentDisplay.displayHeight) {
            console.warn(
                "[restoreWindow] ⚠️ Разрешение экрана изменилось — состояние окна НЕ восстановлено.",
                {
                    saved: { w: saved.displayWidth, h: saved.displayHeight },
                    current: { w: currentDisplay.displayWidth, h: currentDisplay.displayHeight },
                }
            );
            console.log("[restoreWindow] Окно будет показано в центре с размерами по умолчанию");
            return;
        }

        // === Проверка 2: совпадает ли масштаб (DPI) ===
        // Сохраняем и восстанавливаем в физических пикселях, поэтому
        // при scaleFactor-отличиях конвертация Logical→Physical НЕ делается.
        // Если scaleFactor отличается — это нормально, т.к. физические пиксели
        // инвариантны к масштабу (монитор имеет фиксированное физическое разрешение).
        // Единственное условие — физическое разрешение экрана должно совпадать,
        // иначе сохранённые координаты могут указывать на несуществующую область.
        if (Math.abs(saved.scaleFactor - currentDisplay.scaleFactor) > 0.01) {
            console.log(
                "[restoreWindow] Масштаб (DPI) изменился:",
                { saved: saved.scaleFactor, current: currentDisplay.scaleFactor }
            );
            // Размеры НЕ корректируем — они в физических пикселях и не зависят от DPI
        }

        // === Проверка 3: существует ли сохранённый монитор ===
        if (saved.monitorName !== null &&
            saved.monitorName !== currentDisplay.monitorName) {
            console.warn(
                "[restoreWindow] ⚠️ Монитор изменился — состояние окна НЕ восстановлено.",
                {
                    saved: saved.monitorName,
                    current: currentDisplay.monitorName,
                }
            );
            console.log("[restoreWindow] Окно будет показано в центре с размерами по умолчанию");
            return;
        }

        // === Все проверки пройдены — применяем сохранённое состояние ===
        console.log("[restoreWindow] ✅ Параметры дисплея совпадают, восстанавливаем окно");

        if (saved.isMaximized) {
            console.log("[restoreWindow] Восстановление: максимизация окна");
            await appWindow.maximize();
        } else {
            // Clamp: проверяем, что хотя бы MIN_VISIBLE_MARGIN пикселей окна
            // видимо на экране. Если окно выходит за границы — центрируем его.
            const displayW = currentDisplay.displayWidth;
            const displayH = currentDisplay.displayHeight;

            // Сначала рассчитываем позицию
            let windowX = saved.x;
            let windowY = saved.y;
            let windowW = saved.width;
            let windowH = saved.height;

            // Если окно полностью за пределами видимой области слева/сверху
            if (windowX + windowW < MIN_VISIBLE_MARGIN) {
                console.log("[restoreWindow] Окно выходит за левую границу, центрируем по X");
                windowX = Math.round((displayW - windowW) / 2);
            }
            if (windowY + windowH < MIN_VISIBLE_MARGIN) {
                console.log("[restoreWindow] Окно выходит за верхнюю границу, центрируем по Y");
                windowY = Math.round((displayH - windowH) / 2);
            }

            // Если окно шире экрана — уменьшаем с отступом
            if (windowW > displayW - MIN_VISIBLE_MARGIN) {
                console.log("[restoreWindow] Окно шире экрана, уменьшаем ширину");
                windowW = displayW - MIN_VISIBLE_MARGIN;
                windowX = Math.round((displayW - windowW) / 2);
            }
            if (windowH > displayH - MIN_VISIBLE_MARGIN) {
                console.log("[restoreWindow] Окно выше экрана, уменьшаем высоту");
                windowH = displayH - MIN_VISIBLE_MARGIN;
                windowY = Math.round((displayH - windowH) / 2);
            }

            // Если окно уходит за правую/нижнюю границу — сдвигаем
            if (windowX + windowW > displayW) {
                console.log("[restoreWindow] Окно выходит за правую границу, корректируем X");
                windowX = displayW - windowW;
            }
            if (windowY + windowH > displayH) {
                console.log("[restoreWindow] Окно выходит за нижнюю границу, корректируем Y");
                windowY = displayH - windowH;
            }

            console.log("[restoreWindow] Восстановление: позиция и размеры (физические пиксели)", {
                x: windowX,
                y: windowY,
                width: windowW,
                height: windowH,
            });

            // Используем PhysicalPosition/PhysicalSize, чтобы НЕ было
            // двойного масштабирования (saved значения уже в физических пикселях)
            await appWindow.setPosition(new PhysicalPosition(windowX, windowY));
            await appWindow.setSize(new PhysicalSize(windowW, windowH));
        }

        console.log("[restoreWindow] ✅ Состояние окна успешно восстановлено");
    } catch (e) {
        console.error("[restoreWindow] ❌ Ошибка при восстановлении окна:", e);
        // В случае ошибки окно остаётся в стандартном размещении
    }
}

/** Автоматическая привязка к событию закрытия */
export async function initWindow() {
    appWindow.onCloseRequested(async (event) => {
        console.log("[initWindow] Обработка запроса на закрытие окна");
        try {
            // 💾 Сохраняем состояние окна (включая параметры дисплея)
            await saveWindow();
            console.log("[initWindow] Состояние окна сохранено, закрываем окно");
            // ✅ Разрешаем закрытие окна
            await appWindow.close();
        } catch (e) {
            console.error("[initWindow] ❌ Ошибка при закрытии окна:", e);
            // Если не удалось закрыть программно, разрешаем стандартное закрытие
            event.preventDefault();
            await appWindow.close();
        }
    });
}