<script lang="ts">
    // import { page } from '$app/stores';
    import { SquareAsterisk } from "lucide-svelte";
    import { Separator } from "$lib/components/ui/separator/index.js";
    import * as InputOTP from "$lib/components/ui/input-otp/index.js";
    import { Button } from "$lib/components/ui/button/index.js";

    // Чтение параметра mode из URL
    // $: mode = $page.url.searchParams.get('mode') ?? 'unlock';
</script>

<div class="min-h-screen flex items-center justify-center">
    <div class="w-full max-w-sm p-10 flex flex-col gap-6">
        <div class="flex flex-col gap-6">
            <div class="flex flex-col items-center gap-2">
                <div class="flex items-center justify-center rounded-md">
                    <SquareAsterisk class="size-8" />
                    <SquareAsterisk class="size-8" />
                    <SquareAsterisk class="size-8" />
                    <SquareAsterisk class="size-8" />
                </div>
                <span class="sr-only">Acme Inc.</span>
                <!-- <h1 class="text-xl font-bold">Создание ПИН кода {mode}</h1> -->
                <div class="text-center text-sm">Введите новый ПИН код</div>
            </div>

            <!-- PIN Input -->
            <InputOTP.Root class="flex justify-center gap-6" maxlength={4}>
                {#snippet children({ cells })}
                    {#each cells as cell (cell)}
                        <InputOTP.Group>
                            <InputOTP.Slot {cell} />
                        </InputOTP.Group>
                    {/each}
                {/snippet}
            </InputOTP.Root>

            <div
                class="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t"
            >
                <span
                    class="bg-background text-muted-foreground relative z-10 px-2"
                >Повторите ПИН код</span>
            </div>

            <!-- PIN Input -->
            <InputOTP.Root class="flex justify-center gap-6" maxlength={4}>
                {#snippet children({ cells })}
                    {#each cells as cell (cell)}
                        <InputOTP.Group>
                            <InputOTP.Slot {cell} />
                        </InputOTP.Group>
                    {/each}
                {/snippet}
            </InputOTP.Root>

            <Separator />

            <div class="flex gap-4">
                <Button variant="outline" type="button" class="flex-1 transition-all duration-300">
                    Отмена
                </Button>
                <Button variant="default" type="button" class="flex-1 transition-all duration-300">
                    Сохранить
                </Button>
            </div>
        </div>
    </div>
</div>
