<script lang="ts">
    import { SquareAsterisk } from "lucide-svelte";
    import { Button } from "$lib/components/ui/button/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import { toastStore } from "$lib/stores/toast-store";
    import { currentPass } from "$lib/stores/app-state";
    import { loadTask } from "$lib/stores/task-store";
    import { goto } from '$app/navigation';

    let password = "";

    const validatePassword = (pass: string) => {
        pass = pass.trim().replace(/\s+/g, "");

        if (!pass) {
            toastStore.add({
                title: "Ошибка",
                description: "Пароль не может быть пустым",
                variant: "destructive",
            });
            return false;
        }

        if (pass.length < 4 || pass.length > 16) {
            toastStore.add({
                title: "Ошибка",
                description: "Длина пароля должна быть от 4 до 16 символов",
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

    const handleSubmit = async () => {
        password = password.trim().replace(/\s+/g, "");
        if (validatePassword(password)) {
            currentPass.set(password);
            console.log("🔐 Попытка расшифровать задачи с новым паролем...");

            const success = await loadTask();

            if (success) {
                console.log("✅ Пароль принят, задачи загружены.");
                goto('/'); // Переход на главную
            } else {
                console.warn("❌ Пароль неверный. Ждём новый ввод.");
                toastStore.add({
                    title: "Ошибка",
                    description: "Неверный пароль",
                    variant: "destructive",
                });
            }
        }
    };

    const handleKeyDown = async (e: KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault(); // Если нужно, чтобы форма не сабмитилась по умолчанию
            await handleSubmit();
        }
    };
</script>

<div class="min-h-screen flex items-center justify-center">
    <div class="flex flex-col gap-4">
        <div class="flex flex-col items-center">
            <div class="flex items-center justify-center pb-4">
                <SquareAsterisk class="size-8" />
                <SquareAsterisk class="size-8" />
                <SquareAsterisk class="size-8" />
                <SquareAsterisk class="size-8" />
            </div>
            <h1 class="text-xl font-bold pb-2">Введите пароль</h1>

            <Input
                type="password"
                placeholder="* * * * * *"
                class="w-40 h-10 text-center text-xl"
                bind:value={password}
                onkeydown={handleKeyDown}
                autofocus
            />
        </div>

        <div class="flex flex-col items-center">
            <Button class="transition-all duration-300" onclick={handleSubmit}>
                Вход
            </Button>
        </div>
    </div>
</div>
