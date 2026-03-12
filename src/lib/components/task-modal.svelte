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
    import ColorPicker from "$lib/components/color-picker.svelte";
    import { toastStore } from "$lib/stores/toast-store";
    import type { TypesTask } from "$lib/types/types-task";
    import { taskStore } from "$lib/stores/task-store.svelte";
    import { appStateStore } from "$lib/stores/app-state.svelte";
    import {
        CalendarDate,
        DateFormatter,
        getLocalTimeZone,
    } from "@internationalized/date";
    import { v4 as uuidv4 } from "uuid";

    let isPopoverOpen = $state(false);

    // Реактивные переменные формы
    let title = $state("");
    let description = $state("");
    let value = $state<CalendarDate | undefined>(undefined);

    // Определяем режим — редактирование или создание
    const isEditMode = $derived(appStateStore.taskModalMode === "edit");

    const formatter = new DateFormatter("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    function cancelDialog() {
        resetForm();
        appStateStore.closeTaskModal();
    }

    function resetForm() {
        title = "";
        description = "";
        value = undefined;
    }

    function validate(): boolean {
        const errorTitle = isEditMode
            ? "Ошибка изменения задачи"
            : "Ошибка создания задачи";

        if (!title.trim()) {
            toastStore.add({
                title: errorTitle,
                description: "Название задачи обязательно!",
                variant: "destructive",
            });
            return false;
        }

        if (!value) {
            toastStore.add({
                title: errorTitle,
                description: "Укажите дату выполнения задачи!",
                variant: "destructive",
            });
            return false;
        }

        const selectedDate = value.toDate(getLocalTimeZone());
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
            toastStore.add({
                title: errorTitle,
                description: "Дата выполнения не может быть в прошлом!",
                variant: "destructive",
            });
            return false;
        }

        return true;
    }

    async function saveTask() {
        if (!validate()) return;

        try {
            if (isEditMode) {
                // Режим редактирования
                const task = appStateStore.taskCreateEditDelete!;
                const updatedTask: TypesTask = {
                    id: task.id,
                    title: title.trim(),
                    description: description.trim() || undefined,
                    color: appStateStore.selectedColor,
                    date: value!.toDate(getLocalTimeZone()).toISOString(),
                    completed: task.completed,
                };
                taskStore.updateTask(task.id, updatedTask);
                toastStore.add({
                    title: "Изменение задачи",
                    description: `Задача "${updatedTask.title}" успешно изменена!`,
                    variant: "default",
                });
            } else {
                // Режим создания
                const newTask: TypesTask = {
                    id: uuidv4(),
                    title: title.trim(),
                    description: description.trim() || undefined,
                    color: appStateStore.selectedColor,
                    date: value!.toDate(getLocalTimeZone()).toISOString(),
                    completed: false,
                };
                taskStore.addTask(newTask);
                toastStore.add({
                    title: "Создание задачи",
                    description: `Задача "${newTask.title}" успешно создана!`,
                    variant: "default",
                });
            }
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

    function setToday() {
        value = new CalendarDate(
            new Date().getFullYear(),
            new Date().getMonth() + 1,
            new Date().getDate(),
        );
        isPopoverOpen = false;
    }

    function setTomorrow() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        value = new CalendarDate(
            tomorrow.getFullYear(),
            tomorrow.getMonth() + 1,
            tomorrow.getDate(),
        );
        isPopoverOpen = false;
    }

    $effect(() => {
        if (
            appStateStore.isTaskModalOpen &&
            appStateStore.taskCreateEditDelete
        ) {
            title = appStateStore.taskCreateEditDelete.title;
            description = appStateStore.taskCreateEditDelete.description || "";
            appStateStore.selectedColor =
                appStateStore.taskCreateEditDelete.color;
            const taskDate = new Date(appStateStore.taskCreateEditDelete.date);
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
    open={appStateStore.isTaskModalOpen}
    onOpenChange={(open) => {
        if (!open) cancelDialog();
    }}
>
    <Dialog.Content class="sm:max-w-md">
        <Dialog.Header>
            <Dialog.Title>
                {isEditMode ? "Редактировать задачу" : "Новая задача"}
            </Dialog.Title>
        </Dialog.Header>

        <div class="space-y-4">
            <!-- Название -->
            <div class="space-y-2">
                <Label for="title">Название задачи</Label>
                <div class="flex items-center gap-2">
                    <Input
                        id="title"
                        bind:value={title}
                        autocomplete="off"
                        placeholder="Введите название задачи..."
                        class="transition-all duration-300"
                    />
                    <ColorPicker />
                </div>
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
                <div class="flex items-center gap-2">
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
                        <div
                            class="flex gap-2 items-center justify-center w-full p-2"
                        >
                            <Button
                                variant="outline"
                                size="sm"
                                class="flex-1"
                                onclick={setToday}
                            >
                                Сегодня
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                class="flex-1"
                                onclick={setTomorrow}
                            >
                                Завтра
                            </Button>
                        </div>
                    </Popover.Content>
                </Popover.Root>
            </div>

            <Separator />

            <div class="flex gap-4">
                <Dialog.Close
                    class={`flex-1 transition-all duration-300 ${buttonVariants({ variant: "outline" })}`}
                >
                    Отмена
                </Dialog.Close>
                <Button
                    class="flex-1 transition-all duration-300"
                    onclick={saveTask}
                >
                    {isEditMode ? "Сохранить" : "Создать"}
                </Button>
            </div>
        </div>
    </Dialog.Content>
</Dialog.Root>
