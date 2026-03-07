import { writable } from "svelte/store";
import { settingsStore } from "./settings-store.svelte";

type Theme = "dark" | "light" | "system";

const defaultTheme: Theme = "system";

// Создаем writable store с начальным значением
const { subscribe, set: internalSet } = writable<Theme>(defaultTheme);

// Текущее значение темы
let currentTheme: Theme = defaultTheme;

// Подписчик на системную тему
let mediaQuery: MediaQueryList | null = null;
let mediaListener: ((e: MediaQueryListEvent) => void) | null = null;

/**
 * Применяет тему к <html> (document.documentElement)
 */
function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");

  let applied: Theme = theme;
  if (theme === "system") {
    applied = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  root.classList.add(applied);
}

/**
 * Слушает изменения системной темы (только если выбран system)
 */
function watchSystemTheme() {
  mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaListener = () => {
    if (currentTheme === "system") {
      applyTheme("system");
    }
  };
  mediaQuery.addEventListener("change", mediaListener);
}

function unwatchSystemTheme() {
  if (mediaQuery && mediaListener) {
    mediaQuery.removeEventListener("change", mediaListener);
    mediaQuery = null;
    mediaListener = null;
  }
}

/**
 * Инициализация темы из settings.json
 */
function initTheme() {
  const theme = settingsStore.settings.theme as Theme ?? defaultTheme;
  currentTheme = theme;
  internalSet(theme);
  applyTheme(theme);
  if (theme === "system") {
    watchSystemTheme();
  }
}

/**
 * Основной store
 */
export const themeStore = {
  subscribe,
  /**
   * Устанавливает новую тему
   */
  set: (theme: Theme) => {
    currentTheme = theme;
    internalSet(theme);
    applyTheme(theme);
    unwatchSystemTheme();
    if (theme === "system") {
      watchSystemTheme();
    }

    // Обновляем глобальные настройки через новый стор
    settingsStore.set("theme", theme);
  },
  init: initTheme,
};
