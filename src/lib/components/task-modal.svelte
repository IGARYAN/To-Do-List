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
    import { cn } from "$lib/utils";
    import { slide } from "svelte/transition";
    import type { Task } from "$lib/types/task";
    import {
        DateFormatter,
        getLocalTimeZone,
        CalendarDate,
    } from "@internationalized/date";

    // Пропсы компонента
    export let isOpen = false;
    export let onClose: () => void;
    export let onSave: (
        task: Task | Omit<Task, "id">,
    ) => Promise<void> = async () => {};
    export let task: Task | null = null;

    let isPopoverOpen = false;
    let value: CalendarDate | undefined;
    let title = "";
    let description = "";
    let errorTitle = "";
    let errorDate = "";
    let taskSaving = false;

    // Инициализация формы при изменении задачи или открытии
    $: if (isOpen || task) {
        if (task) {
            title = task.title;
            description = task.description || "";
            const taskDate = new Date(task.date);
            value = new CalendarDate(
                taskDate.getFullYear(),
                taskDate.getMonth() + 1,
                taskDate.getDate(),
            );
        } else {
            resetForm();
        }
    }

    const formatter = new DateFormatter("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    function resetForm() {
        title = "";
        description = "";
        value = undefined;
        errorTitle = "";
        errorDate = "";
    }

    // Сброс формы при закрытии диалога
    $: if (!isOpen) {
        resetForm();
    }

    // Автоматическое закрытие поповера при выборе даты
    $: if (value) {
        isPopoverOpen = false;
    }

    function validate(): boolean {
        let ok = true;
        if (!title.trim()) {
            errorTitle = "Название задачи обязательно";
            ok = false;
        } else errorTitle = "";

        if (!value) {
            errorDate = "Укажите дату выполнения";
            ok = false;
        } else errorDate = "";
        return ok;
    }

    async function taskSave() {
        if (!validate()) return;

        taskSaving = true;
        try {
            if (!value) {
                throw new Error("Дата не указана");
            }

            const taskData = {
                title,
                description,
                date: value.toDate(getLocalTimeZone()).toISOString(),
                completed: false,
            };

            const resultTask = task ? { ...task, ...taskData } : taskData;

            await onSave(resultTask);
            onClose();
        } catch (e) {
            toastStore.add({
                title: "Ошибка",
                description: "Ошибка при сохранении задачи",
                variant: "destructive",
            });
            console.error(e);
        } finally {
            taskSaving = false;
        }
    }

    async function createCopy() {
        if (!validate()) return;

        taskSaving = true;
        try {
            if (!value) {
                throw new Error("Дата не указана");
            }

            const taskData = {
                title,
                description,
                date: value.toDate(getLocalTimeZone()).toISOString(),
                completed: false,
            };

            // ВАЖНО: Передаём без id, чтобы создать новую
            await onSave(taskData);
            onClose();
        } catch (e) {
            toastStore.add({
                title: "Ошибка",
                description: "Ошибка при создании копии",
                variant: "destructive",
            });
            console.error(e);
        } finally {
            taskSaving = false;
        }
    }
</script>

<Dialog.Root open={isOpen} onOpenChange={onClose}>
    <Dialog.Content class="sm:max-w-md">
        <Dialog.Header>
            <Dialog.Title>
                <!-- Новая задача -->
                {task ? "Редактировать задачу" : "Новая задача"}
            </Dialog.Title>
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
                    aria-invalid={errorTitle ? "true" : "false"}
                    class={cn(
                        "transition-all duration-300",
                        errorTitle && "border-red-500",
                    )}
                />
                {#if errorTitle}
                    <div
                        transition:slide={{ duration: 500 }}
                        class="text-red-500 text-sm"
                    >
                        {errorTitle}
                    </div>
                {/if}
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
                    <Popover.Trigger>
                        <Button
                            variant="outline"
                            class="w-full justify-start text-left font-normal"
                        >
                            {value
                                ? formatter.format(
                                      value.toDate(getLocalTimeZone()),
                                  )
                                : "Выберите дату"}
                            <Calendar class="h-4 w-4 ml-auto" />
                        </Button>
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
            {#if errorDate}
                <div
                    transition:slide={{ duration: 500 }}
                    class="text-red-500 text-sm"
                >
                    {errorDate}
                </div>
            {/if}

            <Separator />

            <div class="flex gap-4">
                <Dialog.Close
                    class={cn(
                        buttonVariants({ variant: "outline" }),
                        "flex-1 transition-all duration-300",
                    )}>Отмена</Dialog.Close
                >
                <Button
                    class="flex-1 transition-all duration-300"
                    onclick={taskSave}
                >
                    <!-- Сохранить -->
                    {task ? "Сохранить" : "Создать"}
                </Button>
                {#if task}
                    <Button
                        variant="outline"
                        class="flex-1 transition-all duration-300"
                        onclick={createCopy}
                    >
                        <!-- Сщздать на основе -->
                        Создать
                    </Button>
                {/if}
            </div>
        </div>
    </Dialog.Content>
</Dialog.Root>
