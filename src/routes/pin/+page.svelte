<script lang="ts">
    import { SquareAsterisk } from "lucide-svelte";
    import { Button } from "$lib/components/ui/button/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import { toastStore } from "$lib/stores/toast-store"; // Уведомления
    import { settings, currentPass } from "$lib/stores/app-state";

    toastStore.add({
        title: "Ошибка",
        description: "Введен не верный пароль.",
        variant: "destructive",
    });
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
                class="w-40 h-10 text-center text-xl "
            />
        </div>

        <div class="flex flex-col items-center">
            <Button type="button" class="transition-all duration-300">
                Вход
            </Button>
        </div>
    </div>
</div>
