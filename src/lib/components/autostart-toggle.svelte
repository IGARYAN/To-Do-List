<script lang="ts">
    import { toastStore } from "$lib/stores/toast-store";
    import * as Tooltip from "$lib/components/ui/tooltip/index.js";
    import { buttonVariants } from "$lib/components/ui/button";
    import { Power, PowerOff } from "@lucide/svelte";
    import {
        isEnabled as isAutostartEnabled,
        enable as enableAutostart,
        disable as disableAutostart,
    } from "@tauri-apps/plugin-autostart";
    import { onMount } from "svelte";

    // Локальное состояние переключателя
    let isAutostart = $state(false);
    let isLoading = $state(true);

    // Читаем текущее состояние автозапуска из системы при монтировании
    onMount(async () => {
        try {
            const enabled = await isAutostartEnabled();
            isAutostart = enabled;
            console.log("[AutostartToggle] Состояние загружено:", enabled);
        } catch (error) {
            console.error("[AutostartToggle] Ошибка чтения состояния:", error);
        } finally {
            isLoading = false;
        }
    });

    // Вызывается при клике на кнопку
    async function handleToggle() {
        const newValue = !isAutostart;
        console.log("[AutostartToggle] Пользователь переключил на:", newValue);
        const previousValue = isAutostart;
        isAutostart = newValue; // Оптимистично обновляем UI

        try {
            if (newValue) {
                await enableAutostart();
                console.log("[AutostartToggle] Автозапуск включён");
            } else {
                await disableAutostart();
                console.log("[AutostartToggle] Автозапуск выключен");
            }

            toastStore.add({
                title: newValue ? "Автозапуск включён" : "Автозапуск отключён",
                description: newValue
                    ? "Приложение будет запускаться вместе с Windows"
                    : "Приложение больше не будет запускаться вместе с Windows",
                variant: "default",
            });
        } catch (error) {
            console.error("[AutostartToggle] Ошибка изменения:", error);
            // Откатываем UI при ошибке
            isAutostart = previousValue;
            toastStore.add({
                title: "Ошибка",
                description: "Не удалось изменить настройку автозапуска",
                variant: "destructive",
            });
        }
    }
</script>

<Tooltip.Provider delayDuration={1000}>
    <Tooltip.Root>
        <Tooltip.Trigger
            onclick={handleToggle}
            disabled={isLoading}
            class={`transition-all duration-300 ${
                isAutostart
                    ? buttonVariants({ variant: "default", size: "icon" })
                    : buttonVariants({ variant: "outline", size: "icon" })
            }`}
        >
            {#if isAutostart}
                <Power class="h-4 w-4" />
            {:else}
                <PowerOff class="h-4 w-4" />
            {/if}
        </Tooltip.Trigger>
        <Tooltip.Content side="top">
            <p>Автозапуск вместе с Windows</p>
        </Tooltip.Content>
    </Tooltip.Root>
</Tooltip.Provider>
