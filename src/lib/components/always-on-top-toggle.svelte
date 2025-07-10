<script lang="ts">
    import { getCurrentWindow } from "@tauri-apps/api/window";
    import { buttonVariants } from "$lib/components/ui/button";
    import { Pin, PinOff } from "@lucide/svelte";
    import { settings } from "$lib/stores/app-state";
    import { toastStore } from "$lib/stores/toast-store";
    import * as Tooltip from "$lib/components/ui/tooltip/index.js";

    $effect(() => {
        (async () => {
            const win = await getCurrentWindow();
            await win.setAlwaysOnTop($settings.alwaysOnTop);
        })();
    });

    async function toggleAlwaysOnTop() {
        const newState = !$settings.alwaysOnTop;
        settings.update(s => ({...s, alwaysOnTop: newState}));

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

<Tooltip.Provider delayDuration={1000}>
    <Tooltip.Root>
        <Tooltip.Trigger
            onclick={toggleAlwaysOnTop}
            class={`transition-all duration-300 ${
                $settings.alwaysOnTop
                    ? buttonVariants({ variant: "default", size: "icon" })
                    : buttonVariants({ variant: "outline", size: "icon" })
            }`}
        >
            {#if $settings.alwaysOnTop}
                <Pin class="h-4 w-4" />
            {:else}
                <PinOff class="h-4 w-4" />
            {/if}
        </Tooltip.Trigger>
        <Tooltip.Content side="top">
            <p>
                Поверх всех окон
            </p>
        </Tooltip.Content>
    </Tooltip.Root>
</Tooltip.Provider>
