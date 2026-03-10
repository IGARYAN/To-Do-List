<script lang="ts">
  import "../app.css";
  import "$lib/utils/logger";
  import { getCurrentWindow } from "@tauri-apps/api/window";
  import { onMount } from "svelte";
  import { themeStore } from "$lib/stores/theme-store";
  import Toaster from "$lib/components/toaster.svelte";
  import { restoreWindow, initWindow } from "$lib/stores/window-state";
  import { settingsStore } from "$lib/stores/settings-store.svelte";
  import { taskStore } from "$lib/stores/task-store.svelte";
  import { goto } from "$app/navigation";

  // Блокируем системное контекстное меню
  window.addEventListener("contextmenu", (e) => e.preventDefault());

  // $effect для автосохранения настроек при изменении
  // Это работает только внутри компонента Svelte, а не внутри класса
  $effect(() => {
    const currentSettingsStr = JSON.stringify(settingsStore.settings);

    // Проверяем, изменились ли настройки
    if (settingsStore._lastSavedSettings !== currentSettingsStr) {
      settingsStore._lastSavedSettings = currentSettingsStr;

      // Сохраняем только если инициализация завершена
      if (settingsStore.isInitialized) {
        console.log("[Layout] Настройки изменились, сохраняем...");
        settingsStore.saveSettings();
      }
    }
  });

  // $effect для автосохранения задач при изменении
  // Вынесен из TaskStore, чтобы избежать ошибки Svelte effect_orphan.
  $effect(() => {
    const currentTasksStr = JSON.stringify(taskStore.tasks);

    // Подробный лог состояния для отладки реактивности
    console.log("[Layout] [TaskAutoSave] Проверка изменений задач", {
      isInitialized: taskStore.isInitialized,
      hasChanges: taskStore._lastSavedTasks !== currentTasksStr,
      tasksCount: taskStore.tasks.length,
    });

    // Проверяем, изменились ли задачи
    if (taskStore._lastSavedTasks !== currentTasksStr) {
      taskStore._lastSavedTasks = currentTasksStr;

      // Сохраняем только после завершения начальной инициализации
      if (taskStore.isInitialized) {
        console.log("[Layout] [TaskAutoSave] Задачи изменились, сохраняем...");
        taskStore.saveTask();
      } else {
        console.log(
          "[Layout] [TaskAutoSave] Инициализация не завершена, сохранять пока рано",
        );
      }
    }
  });

  // Локальная переменная для отслеживания последнего значения пароля
  // Нужна, чтобы корректно определять именно изменение пароля.
  let lastKnownPass: string | null = null;

  // $effect для автосохранения при изменении пароля
  // Повторяет старое поведение: сохраняем только если пароль не null.
  $effect(() => {
    const currentPass = taskStore.currentPass;

    // На этапе до инициализации просто синхронизируем baseline
    if (!taskStore.isInitialized) {
      lastKnownPass = currentPass;
      console.log(
        "[Layout] [TaskPasswordEffect] Инициализация еще не завершена",
        {
          currentPassIsSet: currentPass !== null,
        },
      );
      return;
    }

    // Детект изменения пароля
    if (lastKnownPass !== currentPass) {
      console.log("[Layout] [TaskPasswordEffect] Обнаружено изменение пароля", {
        previousPassWasSet: lastKnownPass !== null,
        currentPassIsSet: currentPass !== null,
      });

      lastKnownPass = currentPass;

      if (currentPass !== null) {
        console.log(
          "[Layout] [TaskPasswordEffect] Пароль изменен, пересохраняем задачи...",
        );
        taskStore.saveTask();
      } else {
        console.log(
          "[Layout] [TaskPasswordEffect] Пароль сброшен в null, пересохранение по старой логике не выполняется",
        );
      }
    }
  });

  onMount(async () => {
    try {
      console.log("[Layout] Загружаем настройки...");
      await settingsStore.loadSettings();

      console.log("[Layout] Инициализируем тему...");
      themeStore.init(); // не async, await не нужен

      console.log("[Layout] Загружаем задачи...");
      const result = await taskStore.loadTask();

      console.log("[Layout] Восстанавливаем состояние окна...");
      await restoreWindow();

      console.log("[Layout] Инициализируем обработчик закрытия...");
      await initWindow();

      // Показываем окно ДО навигации
      const win = await getCurrentWindow();
      const isVisible = await win.isVisible();
      if (!isVisible) {
        await win.show();
        await win.setFocus();
        console.log("[Layout] ✅ Окно показано и в фокусе");
      } else {
        console.log("[Layout] ℹ️ Окно уже видимо");
      }

      // Навигация после показа окна
      if (!result) {
        console.log("[Layout] Переход на /pass");
        goto("/pass");
      }
    } catch (err) {
      console.error("[Layout] ❌ Ошибка инициализации:", err);
    }
  });

  // Svelte 5: вместо <slot /> используем snippet children через {@render ...}
  // Добавляем лог для удобства отладки в DEV-режиме.
  let { children } = $props();
  console.log("[Layout] Инициализирован snippet children:", !!children);
</script>

{@render children?.()}

<Toaster />
