<script lang="ts">
    import { Button, buttonVariants } from "$lib/components/ui/button";
    import { Separator } from "$lib/components/ui/separator";
    import * as Dialog from "$lib/components/ui/dialog";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Calendar } from "@lucide/svelte";
    import * as Popover from "$lib/components/ui/popover";
    import { Textarea } from "$lib/components/ui/textarea";
    import DatePicker from "$lib/components/ui/calendar/calendar.svelte";
    import { toastStore } from "$lib/stores/toast-store";
    import {
        tasks,
        isEditTaskModalOpen,
        taskCreateEditDelete,
    } from "$lib/stores/app-state";
    import type { TypesTask } from "$lib/types/types-task";
    import {
        DateFormatter,
        getLocalTimeZone,
        CalendarDate,
    } from "@internationalized/date";
    import { get } from "svelte/store";

    let isPopoverOpen = $state(false);

    // Реактивные переменные
    let value = $state<CalendarDate | undefined>(undefined);
    let title = $state("");
    let description = $state("");

    const formatter = new DateFormatter("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    function cancelDialog() {
        taskCreateEditDelete.set(null);
        resetForm();
        isEditTaskModalOpen.set(false);
    }

    function resetForm() {
        title = "";
        description = "";
        value = undefined;
    }

    function validate(): boolean {
        if (!title.trim()) {
            toastStore.add({
                title: "Ошибка",
                description: "Название задачи обязательно!",
                variant: "destructive",
            });
            return false;
        }

        if (!value) {
            toastStore.add({
                title: "Ошибка",
                description: "Укажите дату выполнения!",
                variant: "destructive",
            });
            return false;
        }

        return true;
    }

    async function saveTask() {
        if (!validate()) return;

        const task = get(taskCreateEditDelete);
        if (!task) return;

        try {
            const updatedTask: TypesTask = {
                id: task.id, // сохраняем тот же id
                title: title.trim(),
                description: description.trim() || undefined,
                date: value!.toDate(getLocalTimeZone()).toISOString(),
                completed: task.completed, // сохранить состояние выполнения
            };

            tasks.update((currentTasks) =>
                currentTasks.map((t) => (t.id === task.id ? updatedTask : t)),
            );

            toastStore.add({
                title: "Измеение задачи",
                description: `Задача "${updatedTask.title}" успешно изменена!`,
                variant: "default",
            });
            cancelDialog();
        } catch (e) {
            toastStore.add({
                title: "Ошибка",
                description: "Ошибка при сохранении задачи",
                variant: "destructive",
            });
            console.error(e);
        }
    }

    $effect(() => {
        if ($isEditTaskModalOpen && $taskCreateEditDelete) {
            title = $taskCreateEditDelete.title;
            description = $taskCreateEditDelete.description || "";
            const taskDate = new Date($taskCreateEditDelete.date);
            value = new CalendarDate(
                taskDate.getFullYear(),
                taskDate.getMonth() + 1,
                taskDate.getDate(),
            );
        }
    });

    // Автоматическое закрытие поповера при выборе даты
    $effect(() => {
        if (value) {
            isPopoverOpen = false;
        }
    });
</script>

<Dialog.Root
    bind:open={$isEditTaskModalOpen}
    onOpenChange={(open) => {
        if (!open) cancelDialog();
    }}
>
    <Dialog.Content class="sm:max-w-md">
        <Dialog.Header>
            <Dialog.Title>Редактировать задачу</Dialog.Title>
        </Dialog.Header>

        <div class="space-y-4">
            <!-- Название -->
            <div class="space-y-2">
                <Label for="title">Название задачи</Label>
                <Input
                    id="title"
                    bind:value={title}
                    autocomplete="off"
                    placeholder="Введите название задачи..."
                    class="transition-all duration-300"
                />
            </div>

            <!-- Описание -->
            <div class="space-y-2">
                <Label for="description">Описание задачи (необязательно)</Label>
                <Textarea
                    id="description"
                    bind:value={description}
                    placeholder="Добавьте описание..."
                    rows={3}
                    class="transition-all duration-300 resize-none"
                />
            </div>

            <!-- Выбор даты -->
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 pl-0">
                    <Calendar class="h-4 w-4 text-blue-500" />
                    <Label>Дата выполнения задачи</Label>
                </div>
                <Popover.Root bind:open={isPopoverOpen}>
                    <Popover.Trigger
                        class={`justify-start text-left font-normal ${buttonVariants({ variant: "outline" })}`}
                    >
                        {value
                            ? formatter.format(value.toDate(getLocalTimeZone()))
                            : "Выберите дату"}
                        <Calendar class="h-4 w-4 ml-auto" />
                    </Popover.Trigger>
                    <Popover.Content align="end" class="w-auto p-0">
                        <DatePicker
                            type="single"
                            bind:value
                            class="rounded-lg border shadow-sm"
                            minValue={new CalendarDate(
                                new Date().getFullYear(),
                                new Date().getMonth() + 1,
                                new Date().getDate(),
                            )}
                            numberOfMonths={1}
                            locale="ru-RU"
                            weekdayFormat="long"
                            monthFormat="long"
                        />
                    </Popover.Content>
                </Popover.Root>
            </div>

            <Separator />

            <div class="flex gap-4">
                <!-- Кнопка - Отмена -->
                <Dialog.Close
                    class={`flex-1 transition-all duration-300 ${buttonVariants({ variant: "outline" })}`}
                >
                    Отмена
                </Dialog.Close>

                <!-- Кнопка - Сохранить -->
                <Button
                    class="flex-1 transition-all duration-300"
                    onclick={saveTask}
                >
                    Сохранить
                </Button>
            </div>
        </div>
    </Dialog.Content>
</Dialog.Root>
