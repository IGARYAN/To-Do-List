<script lang="ts">
    import * as Card from "$lib/components/ui/card/index.js";
    import { CircleX, Calendar, Clock, CircleCheckBig } from "@lucide/svelte"; // Иконки

    let { Future, Overdue, Today, Completed } = $props();
</script>

<!-- Статистические карточки -->
<div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-5">
    <!-- Карточка будущих задач -->
    <Card.Root
        class="border-orange-300 dark:border-orange-900 bg-orange-50 dark:bg-orange-950 transition-all duration-300 hover:shadow-lg dark:hover:shadow-white/10"
    >
        <Card.Content class="px-6 py-0">
            <div class="flex flex-col gap-1">
                <div class="flex items-center justify-between">
                    <p class="text-md text-muted-foreground">Будущие</p>
                    <Clock class="h-6 w-6 text-orange-500" />
                </div>
                <p class="text-3xl font-bold">{Future.length}</p>
            </div>
        </Card.Content>
    </Card.Root>

    <!-- Карточка просроченных задач -->
    <Card.Root
        class="border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950 transition-all duration-300 hover:shadow-lg dark:hover:shadow-white/10"
    >
        <Card.Content class="px-6 py-0">
            <div class="flex flex-col gap-1">
                <div class="flex items-center justify-between">
                    <p class="text-md text-muted-foreground">Просрочено</p>
                    <CircleX class="h-6 w-6 text-red-500" />
                </div>
                <p class="text-3xl font-bold">{Overdue.length}</p>
            </div>
        </Card.Content>
    </Card.Root>

    <!-- Карточка задач на сегодня -->
    <Card.Root
        class="border-blue-300 dark:border-blue-900 bg-blue-50 dark:bg-blue-950 transition-all duration-300 hover:shadow-lg dark:hover:shadow-white/10"
    >
        <Card.Content class="px-6 py-0">
            <div class="flex flex-col gap-1">
                <div class="flex items-center justify-between">
                    <p class="text-md text-muted-foreground">На сегодня</p>
                    <Calendar class="h-6 w-6 text-blue-500" />
                </div>
                <p class="text-3xl font-bold">{Today.length}</p>
            </div>
        </Card.Content>
    </Card.Root>

    <!-- Карточка выполненных задач -->
    <Card.Root
        class="border-green-300 dark:border-green-900 bg-green-50 dark:bg-green-950 transition-all duration-300 hover:shadow-lg dark:hover:shadow-white/10"
    >
        <Card.Content class="px-6 py-0">
            <div class="flex flex-col gap-1">
                <div class="flex items-center justify-between">
                    <p class="text-md text-muted-foreground">Выполнено</p>
                    <CircleCheckBig class="h-6 w-6 text-green-500" />
                </div>
                <p class="text-3xl font-bold">{Completed.length}</p>
            </div>
        </Card.Content>
    </Card.Root>
</div>
