<script lang="ts">
  import "../app.css";
  import { Window, getCurrentWindow } from "@tauri-apps/api/window";
  import { onMount } from "svelte";
  import { themeStore } from "$lib/stores/theme-store"; // импорт темы
  import Toaster from "$lib/components/toaster.svelte";
  import { restoreWindow, initWindow } from "$lib/stores/window-state";
  import { loadSettings } from '$lib/stores/app-store';
  import { settings } from "$lib/stores/app-state";
  import { goto } from '$app/navigation';

  onMount(async () => {
    console.log("Загружаем настройки...");
    await loadSettings(); // загружаем и применяем в store

    console.log("Восстанавливаем состояние окна...");
    await restoreWindow(); // Восстанавливаем состояние окна

    console.log("Инициализируем обработчик закрытия...");
    await initWindow(); // подписка на событие close-requested

    await themeStore.init(); // подписка на тему (она сама применит её к <html>)
    
    // const settings = await readSettings();
    // if ($settings.encryptTasks) {
    //     goto('/pin'); // Переход на ввод PIN
    //     // goto('/pin?mode=create'); // Переход на ввод PIN
    // }

    // goto('/pin'); // Переход на ввод PIN

    // Ждем полной загрузки DOM
    await new Promise<void>((resolve) => {
      if (document.readyState === "complete") {
        resolve();
      } else {
        const handler = () => {
          setTimeout(resolve, 200);
        };
        window.addEventListener("load", handler, { once: true });
      }
    });

    // Показываем окно
    try {
      const win = await getCurrentWindow();
      const isVisible = await win.isVisible();
      if (!isVisible) {
        await win.show();
        await win.setFocus();
        console.log('✅ Окно показано и в фокусе');
      } else {
        console.log("ℹ️ Окно уже видимо");
      }
    } catch (err) {
      console.error("❌ Ошибка при показе окна:", err);
    }
  });
</script>

<slot />

<Toaster />
