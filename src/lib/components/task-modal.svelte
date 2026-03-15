<script lang="ts">
    import { Button, buttonVariants } from "$lib/components/ui/button";
    import { Separator } from "$lib/components/ui/separator";
    import * as Dialog from "$lib/components/ui/dialog";
    import * as Tabs from "$lib/components/ui/tabs";
    import * as Select from "$lib/components/ui/select";
    import * as Popover from "$lib/components/ui/popover";
    import { Switch } from "$lib/components/ui/switch/index.js";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Textarea } from "$lib/components/ui/textarea";
    import { Calendar } from "@lucide/svelte";
    import DatePicker from "$lib/components/ui/calendar/calendar.svelte";
    import ColorPicker from "$lib/components/color-picker.svelte";
    import { toastStore } from "$lib/stores/toast-store";
    import type { TypesTask } from "$lib/types/types-task";
    import type {
        TypesRepeatTemplate,
        RepeatType,
    } from "$lib/types/types-repeat-template";
    import { taskStore } from "$lib/stores/task-store.svelte";
    import { appStateStore } from "$lib/stores/app-state.svelte";
    import { generateTasksFromTemplates } from "$lib/services/repeat-service";
    import {
        CalendarDate,
        DateFormatter,
        getLocalTimeZone,
    } from "@internationalized/date";
    import { v4 as uuidv4 } from "uuid";

    // ==================== Общие переменные ====================
    let title = $state("");
    let description = $state("");
    let wasModalOpen = false;

    // Активный таб — определяет режим сохранения
    let activeTab = $state<RepeatType>("not_repeat");

    // ==================== Переменные задачи ====================
    let isPopoverOpen = $state(false);
    let dateValue = $state<CalendarDate | undefined>(undefined);

    // ==================== Переменные шаблона ====================
    let selectedWeekDays = $state<number[]>([]);
    let monthDay = $state<number>(1);
    let lastDayOfMonth = $state(false);
    let yearMonth = $state<number>(1);
    let yearDay = $state<number>(1);

    // ==================== Режим модала ====================
    const isEditMode = $derived(appStateStore.taskModalMode === "edit");
    // При редактировании задачи табы заблокированы
    const tabsDisabled = $derived(isEditMode);

    const formatter = new DateFormatter("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    const weekDays = [
        { value: 1, label: "Пн" },
        { value: 2, label: "Вт" },
        { value: 3, label: "Ср" },
        { value: 4, label: "Чт" },
        { value: 5, label: "Пт" },
        { value: 6, label: "Сб" },
        { value: 7, label: "Вс" },
    ];

    const months = [
        { value: 1, label: "Январь" },
        { value: 2, label: "Февраль" },
        { value: 3, label: "Март" },
        { value: 4, label: "Апрель" },
        { value: 5, label: "Май" },
        { value: 6, label: "Июнь" },
        { value: 7, label: "Июль" },
        { value: 8, label: "Август" },
        { value: 9, label: "Сентябрь" },
        { value: 10, label: "Октябрь" },
        { value: 11, label: "Ноябрь" },
        { value: 12, label: "Декабрь" },
    ];

    // ==================== Заполнение формы при открытии ====================
    $effect(() => {
        if (appStateStore.isTaskModalOpen && !wasModalOpen) {
            const mode = appStateStore.taskModalMode;

            if (mode === "editTemplate" && appStateStore.templateToEdit) {
                const t = appStateStore.templateToEdit;
                title = t.title;
                description = t.description || "";
                appStateStore.selectedColor = t.color;
                activeTab = t.type;
                selectedWeekDays = t.weekDays ?? [];
                lastDayOfMonth = t.lastDayOfMonth ?? false;
                monthDay = t.monthDay ?? 1;
                yearMonth = t.yearMonth ?? 1;
                yearDay = t.yearDay ?? 1;
            } else if (mode === "createTemplate") {
                resetForm();
                activeTab = "weekly"; // сразу на второй таб
            } else if (appStateStore.taskCreateEditDelete) {
                const task = appStateStore.taskCreateEditDelete;
                title = task.title;
                description = task.description || "";
                appStateStore.selectedColor = task.color;
                const taskDate = new Date(task.date);
                dateValue = new CalendarDate(
                    taskDate.getFullYear(),
                    taskDate.getMonth() + 1,
                    taskDate.getDate(),
                );
                activeTab = "not_repeat";
            } else {
                resetForm();
            }
        }
        wasModalOpen = appStateStore.isTaskModalOpen;
    });

    // Автоматическое закрытие поповера при выборе даты
    $effect(() => {
        if (dateValue) isPopoverOpen = false;
    });

    function cancelDialog() {
        resetForm();
        appStateStore.closeTaskModal();
    }

    function resetForm() {
        title = "";
        description = "";
        activeTab = "not_repeat";
        dateValue = undefined;
        selectedWeekDays = [];
        lastDayOfMonth = false;
        monthDay = 1;
        yearMonth = 1;
        yearDay = 1;
    }

    function toggleWeekDay(day: number) {
        if (selectedWeekDays.includes(day)) {
            selectedWeekDays = selectedWeekDays.filter((d) => d !== day);
        } else {
            selectedWeekDays = [...selectedWeekDays, day].sort();
        }
    }

    function setToday() {
        dateValue = new CalendarDate(
            new Date().getFullYear(),
            new Date().getMonth() + 1,
            new Date().getDate(),
        );
        isPopoverOpen = false;
    }

    function setTomorrow() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        dateValue = new CalendarDate(
            tomorrow.getFullYear(),
            tomorrow.getMonth() + 1,
            tomorrow.getDate(),
        );
        isPopoverOpen = false;
    }

    // Скрываем таб "Не повторять" в режимах шаблона
    const hideNotRepeat = $derived(
        appStateStore.taskModalMode === "createTemplate" ||
            appStateStore.taskModalMode === "editTemplate",
    );

    const modalTitle = $derived(() => {
        switch (appStateStore.taskModalMode) {
            case "edit":
                return "Редактировать задачу";
            case "editTemplate":
                return "Редактировать шаблон";
            case "createTemplate":
                return "Новый шаблон";
            case "createFrom":
                return "Новая задача из текущей";
            default:
                return "Новая задача";
        }
    });

    // ==================== Валидация ====================
    function validate(): boolean {
        if (!title.trim()) {
            toastStore.add({
                title: "Ошибка",
                description: "Название обязательно!",
                variant: "destructive",
            });
            return false;
        }

        if (activeTab === "not_repeat") {
            if (!dateValue) {
                toastStore.add({
                    title: "Ошибка",
                    description: "Укажите дату выполнения!",
                    variant: "destructive",
                });
                return false;
            }
            const selectedDate = dateValue.toDate(getLocalTimeZone());
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (selectedDate < today) {
                toastStore.add({
                    title: "Ошибка",
                    description: "Дата не может быть в прошлом!",
                    variant: "destructive",
                });
                return false;
            }
        }

        if (activeTab === "weekly" && selectedWeekDays.length === 0) {
            toastStore.add({
                title: "Ошибка",
                description: "Выберите хотя бы один день недели!",
                variant: "destructive",
            });
            return false;
        }

        if (
            activeTab === "monthly" &&
            !lastDayOfMonth &&
            (monthDay < 1 || monthDay > 31)
        ) {
            toastStore.add({
                title: "Ошибка",
                description: "Укажите число от 1 до 31!",
                variant: "destructive",
            });
            return false;
        }

        if (activeTab === "yearly") {
            if (yearMonth < 1 || yearMonth > 12) {
                toastStore.add({
                    title: "Ошибка",
                    description: "Укажите корректный месяц!",
                    variant: "destructive",
                });
                return false;
            }
            if (yearDay < 1 || yearDay > 31) {
                toastStore.add({
                    title: "Ошибка",
                    description: "Укажите корректное число!",
                    variant: "destructive",
                });
                return false;
            }
        }

        return true;
    }

    // ==================== Сохранение ====================
    async function save() {
        if (!validate()) return;

        try {
            if (activeTab === "not_repeat") {
                // Сохраняем задачу
                if (isEditMode) {
                    const task = appStateStore.taskCreateEditDelete!;
                    const updatedTask: TypesTask = {
                        id: task.id,
                        title: title.trim(),
                        description: description.trim() || undefined,
                        color: appStateStore.selectedColor,
                        date: dateValue!
                            .toDate(getLocalTimeZone())
                            .toISOString(),
                        completed: task.completed,
                        repeatTemplateId: task.repeatTemplateId,
                    };
                    taskStore.updateTask(task.id, updatedTask);
                    toastStore.add({
                        title: "Задача изменена",
                        description: `Задача "${updatedTask.title}" успешно изменена!`,
                        variant: "default",
                    });
                } else {
                    const newTask: TypesTask = {
                        id: uuidv4(),
                        title: title.trim(),
                        description: description.trim() || undefined,
                        color: appStateStore.selectedColor,
                        date: dateValue!
                            .toDate(getLocalTimeZone())
                            .toISOString(),
                        completed: false,
                    };
                    taskStore.addTask(newTask);
                    toastStore.add({
                        title: "Задача создана",
                        description: `Задача "${newTask.title}" успешно создана!`,
                        variant: "default",
                    });
                }
            } else {
                // Шаблон — создание или редактирование
                const isEditTemplate =
                    appStateStore.taskModalMode === "editTemplate";
                const template: TypesRepeatTemplate = {
                    id: isEditTemplate
                        ? appStateStore.templateToEdit!.id
                        : uuidv4(),
                    title: title.trim(),
                    description: description.trim() || undefined,
                    color: appStateStore.selectedColor,
                    type: activeTab,
                    weekDays:
                        activeTab === "weekly" ? selectedWeekDays : undefined,
                    monthDay:
                        activeTab === "monthly" && !lastDayOfMonth
                            ? monthDay
                            : undefined,
                    lastDayOfMonth:
                        activeTab === "monthly" ? lastDayOfMonth : undefined,
                    yearMonth: activeTab === "yearly" ? yearMonth : undefined,
                    yearDay: activeTab === "yearly" ? yearDay : undefined,
                    isActive: isEditTemplate
                        ? appStateStore.templateToEdit!.isActive
                        : true,
                    createdAt: isEditTemplate
                        ? appStateStore.templateToEdit!.createdAt
                        : new Date().toISOString(),
                };

                if (isEditTemplate) {
                    taskStore.updateTemplate(template.id, template);
                    // Удаляем будущие незавершённые задачи для пересоздания
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    taskStore.tasks = taskStore.tasks.filter((task) => {
                        if (task.repeatTemplateId !== template.id) return true;
                        if (task.completed) return true;
                        const taskDate = new Date(task.date);
                        taskDate.setHours(0, 0, 0, 0);
                        return taskDate < today;
                    });
                    toastStore.add({
                        title: "Шаблон обновлён",
                        description: `Шаблон "${template.title}" успешно обновлён!`,
                        variant: "default",
                    });
                } else {
                    taskStore.addTemplate(template);
                    toastStore.add({
                        title: "Шаблон создан",
                        description: `Шаблон "${template.title}" успешно создан!`,
                        variant: "default",
                    });
                }
                generateTasksFromTemplates();
            }
            cancelDialog();
        } catch (e) {
            toastStore.add({
                title: "Ошибка",
                description: "Ошибка при сохранении",
                variant: "destructive",
            });
            console.error(e);
        }
    }
</script>

<Dialog.Root
    open={appStateStore.isTaskModalOpen}
    onOpenChange={(open) => {
        if (!open) cancelDialog();
    }}
>
    <Dialog.Content class="md:max-w-lg">
        <Dialog.Header>
            <Dialog.Title>{modalTitle()}</Dialog.Title>
        </Dialog.Header>

        <div class="space-y-4">
            <!-- Название + цвет -->
            <div class="space-y-2">
                <Label for="title">Название</Label>
                <div class="flex items-center gap-2">
                    <Input
                        id="title"
                        bind:value={title}
                        autocomplete="off"
                        placeholder="Введите название..."
                        class="transition-all duration-300"
                    />
                    <ColorPicker />
                </div>
            </div>

            <!-- Описание -->
            <div class="space-y-2">
                <Label for="description">Описание (необязательно)</Label>
                <Textarea
                    id="description"
                    bind:value={description}
                    placeholder="Добавьте описание..."
                    rows={2}
                    class="transition-all duration-300 resize-none"
                />
            </div>

            <!-- Табы повторения -->
            <Tabs.Root bind:value={activeTab} disabled={tabsDisabled}>
                <Tabs.List class="w-full">
                    {#if !hideNotRepeat}
                        <Tabs.Trigger value="not_repeat" class="flex-1"
                            >Не повторять</Tabs.Trigger
                        >
                    {/if}
                    <Tabs.Trigger value="weekly" class="flex-1"
                        >Еженедельно</Tabs.Trigger
                    >
                    <Tabs.Trigger value="monthly" class="flex-1"
                        >Ежемесячно</Tabs.Trigger
                    >
                    <Tabs.Trigger value="yearly" class="flex-1"
                        >Ежегодно</Tabs.Trigger
                    >
                </Tabs.List>

                <!-- Не повторять — выбор даты -->
                <Tabs.Content value="not_repeat">
                    <div class="flex items-center justify-between pt-2">
                        <div class="flex items-center gap-2">
                            <Calendar class="h-4 w-4 text-blue-500" />
                            <Label>Дата выполнения</Label>
                        </div>
                        <Popover.Root bind:open={isPopoverOpen}>
                            <Popover.Trigger
                                class={`justify-start w-52 text-left font-normal ${buttonVariants({ variant: "outline" })}`}
                            >
                                {dateValue
                                    ? formatter.format(
                                          dateValue.toDate(getLocalTimeZone()),
                                      )
                                    : "Выберите дату"}
                                <Calendar class="h-4 w-4 ml-auto" />
                            </Popover.Trigger>
                            <Popover.Content align="end" class="w-auto p-0">
                                <DatePicker
                                    type="single"
                                    bind:value={dateValue}
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
                </Tabs.Content>

                <!-- Еженедельно — выбор дней недели -->
                <Tabs.Content value="weekly">
                    <div class="flex gap-1 pt-2 justify-between">
                        {#each weekDays as day}
                            <button
                                onclick={() => toggleWeekDay(day.value)}
                                class={`w-13 h-9 rounded text-sm font-medium transition-all duration-200
                                    ${
                                        selectedWeekDays.includes(day.value)
                                            ? buttonVariants({
                                                  variant: "default",
                                                  size: "sm",
                                              })
                                            : buttonVariants({
                                                  variant: "outline",
                                                  size: "sm",
                                              })
                                    }`}
                            >
                                {day.label}
                            </button>
                        {/each}
                    </div>
                </Tabs.Content>

                <!-- Ежемесячно — число месяца -->
                <Tabs.Content value="monthly">
                    <div class="flex items-center justify-between pt-2">
                        <div class="flex items-center gap-2">
                            <Label>Число месяца</Label>
                            <Input
                                type="number"
                                min="1"
                                max="31"
                                bind:value={monthDay}
                                class="w-20"
                                disabled={lastDayOfMonth}
                            />
                        </div>
                        <div class="flex items-center gap-2">
                            <Label>Последний день</Label>
                            <Switch bind:checked={lastDayOfMonth} />
                        </div>
                    </div>
                </Tabs.Content>

                <!-- Ежегодно — месяц и число -->
                <Tabs.Content value="yearly">
                    <div class="flex items-center justify-between pt-2">
                        <div class="flex items-center gap-2">
                            <Label>Месяц</Label>
                            <Select.Root
                                type="single"
                                value={String(yearMonth)}
                                onValueChange={(v) => (yearMonth = Number(v))}
                            >
                                <Select.Trigger class="w-36">
                                    {months.find((m) => m.value === yearMonth)
                                        ?.label ?? "Выберите месяц"}
                                </Select.Trigger>
                                <Select.Content>
                                    {#each months as month}
                                        <Select.Item
                                            value={String(month.value)}
                                        >
                                            {month.label}
                                        </Select.Item>
                                    {/each}
                                </Select.Content>
                            </Select.Root>
                        </div>
                        <div class="flex items-center gap-2">
                            <Label>Число</Label>
                            <Input
                                type="number"
                                min="1"
                                max="31"
                                bind:value={yearDay}
                                class="w-20"
                            />
                        </div>
                    </div>
                </Tabs.Content>
            </Tabs.Root>

            <Separator />

            <div class="flex gap-4">
                <Dialog.Close
                    class={`flex-1 transition-all duration-300 ${buttonVariants({ variant: "outline" })}`}
                >
                    Отмена
                </Dialog.Close>
                <Button
                    class="flex-1 transition-all duration-300"
                    onclick={save}
                >
                    {#if appStateStore.taskModalMode === "edit" || appStateStore.taskModalMode === "editTemplate"}
                        Сохранить
                    {:else if activeTab === "not_repeat"}
                        Создать задачу
                    {:else}
                        Создать шаблон
                    {/if}
                </Button>
            </div>
        </div>
    </Dialog.Content>
</Dialog.Root>
