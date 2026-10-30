import { defineConfig } from "vite";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from '@tailwindcss/vite';

// Хост для dev-режима Tauri (задаётся Tauri CLI при `tauri dev` для мобильных устройств).
// Директива @ts-expect-error больше не нужна: тип `process` берётся из @types/node.
const host = process.env.TAURI_DEV_HOST;

// Отладочная информация: видно, какой хост получен и включён ли HMR по сети
console.log("[vite.config] TAURI_DEV_HOST =", host ?? "(не задан)");
console.log("[vite.config] HMR через отдельный WebSocket:", Boolean(host));

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  // Плагины: Tailwind CSS и SvelteKit
  plugins: [tailwindcss(), sveltekit()],

  // Опции Vite для Tauri (применяются в `tauri dev` и `tauri build`)
  //
  // 1. Не очищать экран, чтобы не скрывать ошибки Rust
  clearScreen: false,
  // 2. Tauri ожидает фиксированный порт; если он занят, завершаемся с ошибкой
  server: {
    port: 1420,
    strictPort: true,
    // Если задан TAURI_DEV_HOST, слушаем на нём, иначе только локально
    host: host || false,
    // HMR по отдельному порту только при заданном хосте (разработка на устройстве)
    hmr: host
      ? {
        protocol: "ws",
        host,
        port: 1421,
      }
      : undefined,
    watch: {
      // 3. Не отслеживать изменения в `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));