<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { get } from "svelte/store";
    import { currentPass, settings } from "$lib/stores/app-state";
    import { SquareAsterisk } from "lucide-svelte";
    import { Button } from "$lib/components/ui/button/index.js";
    import * as Dialog from "$lib/components/ui/dialog/index.js";
    import * as InputOTP from "$lib/components/ui/input-otp/index.js";
    import { Separator } from "$lib/components/ui/separator/index.js";

    export let open = false;
    export let isSavePending = false;

    const dispatch = createEventDispatcher();

    let mode: "create" | "verify" = "create";

    let newPin = "";
    let confirmPin = "";
    let inputPin = "";

    // Отслеживаем режим при открытии модалки
    $: if (open) {
        const s = get(settings);
        const pin = get(currentPass);

        if (get(settings).encryptTasks && !pin) {
            mode = "create";
        } else if (!get(settings).encryptTasks && pin) {
            mode = "verify";
        }
    }

    function forceSwitch(value: boolean) {
        settings.update((n) => ({ ...n, encryptTasks: value }));
    }

    function cancelDialog() {
        dispatch("cancel");
    }

    function resetForm() {
        newPin = "";
        confirmPin = "";
        inputPin = "";
    }

    function savePin() {
        if (newPin.length !== 4 || confirmPin.length !== 4) return;
        if (newPin !== confirmPin) {
            alert("ПИН коды не совпадают!");
            return;
        }

        currentPass.set(newPin);
        forceSwitch(true);

        resetForm();
        open = false;

        dispatch("success");
    }

    function verifyPin() {
        const pin = get(currentPass);

        if (inputPin === pin) {
            currentPass.set(null);
            forceSwitch(false);

            resetForm();
            open = false;

            dispatch("success");
        } else {
            alert("Неверный ПИН код!");
        }
    }
</script>

<Dialog.Root bind:open>
    <Dialog.Content class="w-sm">
        {#if mode === "create"}
            <div class="flex flex-col items-center gap-2">
                <div class="flex items-center justify-center rounded-sm">
                    <SquareAsterisk class="size-6" />
                    <SquareAsterisk class="size-6" />
                    <SquareAsterisk class="size-6" />
                    <SquareAsterisk class="size-6" />
                </div>
                <h1 class="text-xl font-bold">Создание ПИН кода</h1>
                <div class="text-center text-sm">Введите новый ПИН код</div>
            </div>

            <InputOTP.Root
                class="flex justify-center gap-4"
                maxlength={4}
                bind:value={newPin}
            >
                {#snippet children({ cells })}
                    {#each cells as cell (cell)}
                        <InputOTP.Group>
                            <InputOTP.Slot {cell} />
                        </InputOTP.Group>
                    {/each}
                {/snippet}
            </InputOTP.Root>

            <div
                class="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border"
            >
                <span
                    class="bg-background text-muted-foreground relative z-10 px-2"
                    >Повторите ПИН код</span
                >
            </div>

            <InputOTP.Root
                class="flex justify-center gap-4"
                maxlength={4}
                bind:value={confirmPin}
            >
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
                <Button variant="outline" class="flex-1" onclick={cancelDialog}
                    >Отмена</Button
                >
                <Button variant="default" class="flex-1" onclick={savePin}
                    >Сохранить</Button
                >
            </div>
        {:else if mode === "verify"}
            <div class="flex flex-col items-center gap-2">
                <h1 class="text-xl font-bold">
                    Введите ПИН код для отключения
                </h1>
            </div>

            <InputOTP.Root
                class="flex justify-center gap-4"
                maxlength={4}
                bind:value={inputPin}
            >
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
                <Button variant="outline" class="flex-1" onclick={cancelDialog}
                    >Отмена</Button
                >
                <Button variant="default" class="flex-1" onclick={verifyPin}
                    >Подтвердить</Button
                >
            </div>
        {/if}
    </Dialog.Content>
</Dialog.Root>
