<script lang="ts">
    import { getCurrentWindow } from "@tauri-apps/api/window";
    import { Button } from "$lib/components/ui/button";
    import { Pin, PinOff } from "lucide-svelte";
    import { settingsStore } from "$lib/stores/app-store";
    import { toastStore } from "$lib/stores/toast-store";

    let settings = $state($settingsStore);

    // Эффект для применения "поверх всех окон" (правильный синтаксис)
    // $effect(() => {
    //     (async () => {
    //         const win = await getCurrentWindow();
    //         await win.setAlwaysOnTop(settings.alwaysOnTop);
    //     })();
    // });

    async function toggleAlwaysOnTop() {
        const newState = !settings.alwaysOnTop;

        // Сохраняем в store
        settingsStore.update((current) => ({
            ...current,
            alwaysOnTop: newState,
        }));

        const win = await getCurrentWindow();
        await win.setAlwaysOnTop(newState);

        toastStore.add({
            title: newState
                ? "Поверх всех окон включено"
                : "Поверх всех окон отключено",
            description: newState
                ? "Окно приложения теперь всегда будет сверху"
                : "Окно приложения вернулось в обычный режим",
            variant: "default",
        });
    }
</script>

<Button
    variant={settings.alwaysOnTop ? "default" : "outline"}
    size="icon"
    onclick={toggleAlwaysOnTop}
    class="transition-all duration-300"
>
    {#if settings.alwaysOnTop}
        <Pin class="h-4 w-4" />
    {:else}
        <PinOff class="h-4 w-4" />
    {/if}
</Button>
