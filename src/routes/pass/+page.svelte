<script lang="ts">
    import { SquareAsterisk } from "lucide-svelte";
    import { Button } from "$lib/components/ui/button/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import { toastStore } from "$lib/stores/toast-store";
    import { currentPass } from "$lib/stores/app-state";

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

    const handleSubmit = () => {
        password = password.trim().replace(/\s+/g, "");
        if (validatePassword(password)) {
            currentPass.set(password);
        }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSubmit();
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
