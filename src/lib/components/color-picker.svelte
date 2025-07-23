<script lang="ts">
    import * as Popover from "$lib/components/ui/popover/index.js";
    import { onMount } from "svelte";
    import { Check } from "@lucide/svelte";
    import { buttonVariants } from "$lib/components/ui/button";
    import { selectedColor } from "$lib/stores/app-state";
    import { ColorMap } from '$lib/types/color-map';

    // Переменные
    let isOpen = $state(false);

    // Доступные цвета
    const availableColors = Object.keys(ColorMap);

    // При монтировании — если цвет не выбран, выбираем случайный
    onMount(() => {
        if (!$selectedColor) {
            const random = getRandomColor();
            $selectedColor = random;
        }
    });

    function getRandomColor(): string {
        const index = Math.floor(Math.random() * availableColors.length);
        return availableColors[index];
    }

    function selectColor(color: string) {
        $selectedColor = color;
        isOpen = false;
    }
</script>

<!-- Кнопка-переключатель -->
<Popover.Root bind:open={isOpen}>
    <Popover.Trigger
        class={buttonVariants({ variant: "outline", size: "icon" })}
        aria-label="Выбрать цвет"
    >
        <div
            class="w-6 h-6 rounded"
            style="background-color: {ColorMap[
                $selectedColor || 'red'
            ]}"
        ></div>
    </Popover.Trigger>

    <!-- Поповер с цветами -->
    <Popover.Content align="end" class="grid grid-cols-4 gap-2 p-2 w-auto">
        {#each availableColors as color}
            <button
                class="relative w-6 h-6 rounded border shadow transition-transform duration-300 hover:scale-110"
                style="background-color: {ColorMap[color]}"
                onclick={() => selectColor(color)}
                aria-label={`Выбрать цвет ${color}`}
            >
                {#if color === $selectedColor}
                    <Check class="absolute inset-0 m-auto h-4 w-4 text-white" />
                {/if}
            </button>
        {/each}
    </Popover.Content>
</Popover.Root>
