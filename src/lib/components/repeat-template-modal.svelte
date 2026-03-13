<script lang="ts">
    import { Button, buttonVariants } from "$lib/components/ui/button";
    import { Switch } from "$lib/components/ui/switch/index.js";
    import { Separator } from "$lib/components/ui/separator";
    import * as Dialog from "$lib/components/ui/dialog";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import * as Tabs from "$lib/components/ui/tabs";
    import ColorPicker from "$lib/components/color-picker.svelte";
    import { toastStore } from "$lib/stores/toast-store";
    import { taskStore } from "$lib/stores/task-store.svelte";
    import { appStateStore } from "$lib/stores/app-state.svelte";
    import { generateTasksFromTemplates } from "$lib/services/repeat-service";
    import type {
        TypesRepeatTemplate,
        RepeatType,
    } from "$lib/types/types-repeat-template";
    import { Textarea } from "$lib/components/ui/textarea";
    import { v4 as uuidv4 } from "uuid";

    // Локальные переменные формы
    let title = $state("");
    let description = $state("");
    let repeatType = $state<RepeatType>("weekly");
    let wasModalOpen = false;

    // Для weekly — выбранные дни недели
    let selectedWeekDays = $state<number[]>([]);

    // Для monthly — число месяца
    let monthDay = $state<number>(1);
    let lastDayOfMonth = $state(false);

    // Для yearly — месяц и число
    let yearMonth = $state<number>(1);
    let yearDay = $state<number>(1);

    // Режим — редактирование или создание
    const isEditMode = $derived(!!appStateStore.templateToEdit);

    // Дни недели для UI
    const weekDays = [
        { value: 1, label: "Пн" },
        { value: 2, label: "Вт" },
        { value: 3, label: "Ср" },
        { value: 4, label: "Чт" },
        { value: 5, label: "Пт" },
        { value: 6, label: "Сб" },
        { value: 7, label: "Вс" },
    ];

    // Месяцы для UI
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

    // Заполняем форму при открытии в режиме редактирования
    $effect(() => {
        if (appStateStore.isTemplateModalOpen && !wasModalOpen) {
            if (appStateStore.templateToEdit) {
                const t = appStateStore.templateToEdit;
                title = t.title;
                description = t.description || "";
                repeatType = t.type;
                selectedWeekDays = t.weekDays ?? [];
                lastDayOfMonth = t.lastDayOfMonth ?? false;
                monthDay = t.monthDay ?? 1;
                yearMonth = t.yearMonth ?? 1;
                yearDay = t.yearDay ?? 1;
                appStateStore.selectedColor = t.color;
            } else {
                // Режим создания — сбрасываем форму
                resetForm();
            }
        }
        wasModalOpen = appStateStore.isTemplateModalOpen;
    });

    function cancelDialog() {
        resetForm();
        appStateStore.closeTemplateModal();
    }

    function resetForm() {
        title = "";
        description = "";
        repeatType = "weekly";
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

    function validate(): boolean {
        if (!title.trim()) {
            toastStore.add({
                title: "Ошибка",
                description: "Название шаблона обязательно!",
                variant: "destructive",
            });
            return false;
        }

        if (repeatType === "weekly" && selectedWeekDays.length === 0) {
            toastStore.add({
                title: "Ошибка",
                description: "Выберите хотя бы один день недели!",
                variant: "destructive",
            });
            return false;
        }

        if (repeatType === "monthly" && (monthDay < 1 || monthDay > 31)) {
            toastStore.add({
                title: "Ошибка",
                description: "Укажите число от 1 до 31!",
                variant: "destructive",
            });
            return false;
        }

        if (repeatType === "yearly") {
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

    function saveTemplate() {
        if (!validate()) return;

        const template: TypesRepeatTemplate = {
            id: isEditMode ? appStateStore.templateToEdit!.id : uuidv4(),
            title: title.trim(),
            description: description.trim() || undefined,
            color: appStateStore.selectedColor,
            type: repeatType,
            weekDays: repeatType === "weekly" ? selectedWeekDays : undefined,
            monthDay:
                repeatType === "monthly" && !lastDayOfMonth
                    ? monthDay
                    : undefined,
            lastDayOfMonth:
                repeatType === "monthly" ? lastDayOfMonth : undefined,
            yearMonth: repeatType === "yearly" ? yearMonth : undefined,
            yearDay: repeatType === "yearly" ? yearDay : undefined,
            isActive: true,
            createdAt: isEditMode
                ? appStateStore.templateToEdit!.createdAt
                : new Date().toISOString(),
        };

        if (isEditMode) {
            taskStore.updateTemplate(template.id, template);

            // Удаляем будущие незавершённые задачи этого шаблона
            // чтобы они пересоздались с новыми параметрами
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            taskStore.tasks = taskStore.tasks.filter((task) => {
                if (task.repeatTemplateId !== template.id) return true;
                if (task.completed) return true; // выполненные не трогаем
                const taskDate = new Date(task.date);
                taskDate.setHours(0, 0, 0, 0);
                return taskDate < today; // прошедшие не трогаем
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

        // Сразу генерируем задачи из нового/обновлённого шаблона
        generateTasksFromTemplates();
        cancelDialog();
    }
</script>

<Dialog.Root
    open={appStateStore.isTemplateModalOpen}
    onOpenChange={(open) => {
        if (!open) cancelDialog();
    }}
>
    <Dialog.Content class="sm:max-w-md">
        <Dialog.Header>
            <Dialog.Title>
                {isEditMode ? "Редактировать шаблон" : "Новый шаблон"}
            </Dialog.Title>
        </Dialog.Header>

        <div class="space-y-4">
            <!-- Название -->
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

            <Separator />

            <!-- Тип повторения -->
            <Tabs.Root bind:value={repeatType}>
                <Tabs.List class="w-full">
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

                <!-- Еженедельно — выбор дней недели -->
                <Tabs.Content value="weekly">
                    <div class="flex gap-1 pt-2 justify-between">
                        {#each weekDays as day}
                            <button
                                onclick={() => toggleWeekDay(day.value)}
                                class={`w-10 h-10 rounded text-sm font-medium transition-all duration-200
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
                    <div class="flex items-center gap-2 pt-2">
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
                    <div class="flex items-center gap-2 pt-2">
                        <Switch bind:checked={lastDayOfMonth} />
                        <Label>Последний день месяца</Label>
                    </div>
                </Tabs.Content>

                <!-- Ежегодно — месяц и число -->
                <Tabs.Content value="yearly">
                    <div class="flex items-center gap-4 pt-2">
                        <div class="flex items-center gap-2">
                            <Label>Месяц</Label>
                            <select
                                bind:value={yearMonth}
                                class="h-9 rounded-md border border-input bg-background px-3 text-sm"
                            >
                                {#each months as month}
                                    <option value={month.value}
                                        >{month.label}</option
                                    >
                                {/each}
                            </select>
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
                    onclick={saveTemplate}
                >
                    {isEditMode ? "Сохранить" : "Создать"}
                </Button>
            </div>
        </div>
    </Dialog.Content>
</Dialog.Root>
