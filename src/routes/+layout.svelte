<script lang="ts">
  import "../app.css";
  import { Window } from "@tauri-apps/api/window";
  import { onMount } from "svelte";
  import { themeStore } from "$lib/stores/theme-store"; // импорт темы
  import Toaster from "$lib/components/toaster.svelte";
  import { restoreWindow, initWindow } from "$lib/stores/window-state";

  onMount(async () => {
    await themeStore.init(); // подписка на тему (она сама применит её к <html>)

    restoreWindow(); // Восстанавливаем состояние окна
    initWindow(); // подписка на событие close-requested

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
      const win = new Window("main");
      const isVisible = await win.isVisible();
      if (!isVisible) {
        await win.show();
        console.log('✅ Окно "main" показано');
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
