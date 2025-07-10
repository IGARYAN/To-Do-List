<script lang="ts">
    import { get } from "svelte/store";
    import { currentPass, tasks } from "$lib/stores/app-state";
    import { SquareAsterisk } from "@lucide/svelte";
    import { Button, buttonVariants } from "$lib/components/ui/button/index.js";
    import * as Dialog from "$lib/components/ui/dialog/index.js";
    import { toastStore } from "$lib/stores/toast-store";
    import { Separator } from "$lib/components/ui/separator/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import { saveTask } from "$lib/stores/task-store";

    let isPassModalOpen = $state(false);
    let newPass = $state("");
    let confirmPass = $state("");
    let inputPass = $state("");

    function cancelDialog() {
        resetForm();
        isPassModalOpen = false;
    }

    // Очистка формы
    function resetForm() {
        newPass = "";
        confirmPass = "";
        inputPass = "";
    }

    // Верификация нового парооля
    const validatePassword = (pass: string) => {
        pass = pass.trim().replace(/\s+/g, "");

        if (!pass) {
            toastStore.add({
                title: "Ошибка",
                description: "Пароль не может быть пустым!",
                variant: "destructive",
            });
            return false;
        }

        if (pass.length < 4 || pass.length > 16) {
            toastStore.add({
                title: "Ошибка",
                description: "Длина пароля должна быть от 4 до 16 символов!",
                variant: "destructive",
            });
            return false;
        }

        if (!/^[A-Za-z\d!@#$%^&*()_+=[\]{}|;:'",.<>/?-]*$/.test(pass)) {
            toastStore.add({
                title: "Ошибка",
                description: "Пароль содержит недопустимые символы",
                variant: "destructive",
            });
            return false;
        }
        return true;
    };

    // Сохраняем новый пароль для включения входа с паролем
    function savePass() {
        if (!validatePassword(newPass)) return;
        if (!validatePassword(confirmPass)) return;
        if (newPass !== confirmPass) {
            toastStore.add({
                title: "Ошибка",
                description: "Пароли не совпадают!",
                variant: "destructive",
            });
            return;
        }
        currentPass.set(newPass);
        saveTask(get(tasks)); // Пересохраняем файл в зашифрованном виде
        toastStore.add({
            title: "Создание пароля",
            description: "Новый пароль успешно создан.",
            variant: "default",
        });
        resetForm();
        isPassModalOpen = false;
    }

    // Проверка пароля для отключения входа с паролем
    function verifyPass() {
        if (!validatePassword(inputPass)) return;
        if (inputPass === $currentPass) {
            currentPass.set(null);
            saveTask(get(tasks)); // Пересохраняем файл в незашифрованном виде
            toastStore.add({
                title: "Верификация пароля",
                description: "Вход с паролем успешно отключен.",
                variant: "default",
            });
            resetForm();
            isPassModalOpen = false;
        } else {
            toastStore.add({
                title: "Ошибка",
                description: "Неверный пароль!",
                variant: "destructive",
            });
        }
    }
</script>

<Dialog.Root open={isPassModalOpen} onOpenChange={cancelDialog}>
    <Dialog.Trigger
        onclick={() => (isPassModalOpen = true)}
        class={`flex-1 transition-all duration-300 ${
            $currentPass
                ? buttonVariants({ variant: "default" })
                : buttonVariants({ variant: "outline" })
        }`}
    >
        {#if $currentPass}
            Отключить вход с паролем
        {:else}
            Включить вход с паролем
        {/if}
    </Dialog.Trigger>
    <Dialog.Content class="w-sm">
        {#if !$currentPass}
            <div class="flex flex-col items-center gap-2">
                <div class="flex items-center justify-center rounded-sm">
                    <SquareAsterisk class="size-6" />
                    <SquareAsterisk class="size-6" />
                    <SquareAsterisk class="size-6" />
                    <SquareAsterisk class="size-6" />
                </div>
                <h1 class="text-xl font-bold">Создание нового пароля</h1>
                <div class="text-center text-muted-foreground text-sm">
                    Введите новый пароль
                </div>
            </div>

            <div class="flex items-center justify-center rounded-sm">
                <Input
                    type="password"
                    placeholder="* * * * * *"
                    class="w-40 h-10 text-center text-xl"
                    bind:value={newPass}
                />
            </div>

            <div
                class="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border"
            >
                <span
                    class="bg-background text-muted-foreground relative z-10 px-2"
                    >Повторите новый пароль</span
                >
            </div>

            <div class="flex items-center justify-center rounded-sm">
                <Input
                    type="password"
                    placeholder="* * * * * *"
                    class="w-40 h-10 text-center text-xl"
                    bind:value={confirmPass}
                />
            </div>

            <Separator />

            <div class="flex gap-4">
                <Button variant="outline" class="flex-1" onclick={cancelDialog}
                    >Отмена</Button
                >
                <Button variant="default" class="flex-1" onclick={savePass}
                    >Сохранить</Button
                >
            </div>
        {:else}
            <div class="flex flex-col items-center gap-2">
                <div class="flex items-center justify-center rounded-sm">
                    <SquareAsterisk class="size-6" />
                    <SquareAsterisk class="size-6" />
                    <SquareAsterisk class="size-6" />
                    <SquareAsterisk class="size-6" />
                </div>
                <h1 class="text-xl font-bold">Введите пароль</h1>
            </div>

            <div class="flex items-center justify-center rounded-sm">
                <Input
                    type="password"
                    placeholder="* * * * * *"
                    class="w-40 h-10 text-center text-xl"
                    bind:value={inputPass}
                    autofocus
                />
            </div>

            <Separator />

            <div class="flex gap-4">
                <Button variant="outline" class="flex-1" onclick={cancelDialog}
                    >Отмена</Button
                >
                <Button variant="default" class="flex-1" onclick={verifyPass}
                    >Подтвердить</Button
                >
            </div>
        {/if}
    </Dialog.Content>
</Dialog.Root>
