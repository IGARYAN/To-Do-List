<script lang="ts">
    import { Button, buttonVariants } from "$lib/components/ui/button";
    import * as Card from "$lib/components/ui/card";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
    import * as Dialog from "$lib/components/ui/dialog";
    import * as Tooltip from "$lib/components/ui/tooltip/index.js";
    import { Badge } from "$lib/components/ui/badge";
    import { ColorMap } from "$lib/types/color-map";
    import { taskStore } from "$lib/stores/task-store.svelte";
    import { appStateStore } from "$lib/stores/app-state.svelte";
    import { toastStore } from "$lib/stores/toast-store";
    import type { TypesRepeatTemplate } from "$lib/types/types-repeat-template";
    import {
        Plus,
        Pencil,
        Trash2,
        Calendar,
        RepeatIcon,
        PlayCircle,
        PauseCircle,
        EllipsisVertical,
    } from "@lucide/svelte";
    import { format } from "date-fns";
    import { ru } from "date-fns/locale";

    // Человекочитаемое описание повторения
    const weekDayNames = ["", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
    const monthNames = [
        "",
        "Январь",
        "Февраль",
        "Март",
        "Апрель",
        "Май",
        "Июнь",
        "Июль",
        "Август",
        "Сентябрь",
        "Октябрь",
        "Ноябрь",
        "Декабрь",
    ];

    function getRepeatDescription(template: TypesRepeatTemplate): string {
        if (template.type === "weekly" && template.weekDays?.length) {
            return template.weekDays.map((d) => weekDayNames[d]).join(", ");
        }
        if (template.type === "monthly") {
            if (template.lastDayOfMonth) {
                return "Последний день месяца";
            }
            if (template.monthDay) {
                return `${template.monthDay} числа`;
            }
        }
        if (
            template.type === "yearly" &&
            template.yearMonth &&
            template.yearDay
        ) {
            return `${monthNames[template.yearMonth]} ${template.yearDay} числа`;
        }
        return "";
    }

    function getRepeatTypeName(type: string): string {
        if (type === "weekly") return "Еженедельно";
        if (type === "monthly") return "Ежемесячно";
        if (type === "yearly") return "Ежегодно";
        return "";
    }

    // Открыть диалог подтверждения удаления
    function confirmDelete(template: TypesRepeatTemplate) {
        appStateStore.openDeleteTemplateDialog(template);
    }

    // Переключить активность шаблона
    function toggleActive(template: TypesRepeatTemplate) {
        taskStore.updateTemplate(template.id, { isActive: !template.isActive });
        toastStore.add({
            title: template.isActive
                ? "Шаблон приостановлен"
                : "Шаблон активирован",
            description: `Шаблон "${template.title}" ${template.isActive ? "приостановлен" : "активирован"}.`,
            variant: "default",
        });
    }
</script>

<Dialog.Root
    open={appStateStore.isTemplatesListModalOpen}
    onOpenChange={(open) => {
        if (!open) appStateStore.closeTemplatesListModal();
    }}
>
    <Dialog.Content class="md:max-w-xl">
        <Dialog.Header>
            <Dialog.Title>Повторяющиеся задачи</Dialog.Title>
        </Dialog.Header>
        <!-- Заголовок с кнопкой добавления -->
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
                <RepeatIcon class="h-5 w-5 text-purple-500" />
                <Dialog.Description>Повторяющихся задач</Dialog.Description>
                <Badge variant="secondary">{taskStore.templates.length}</Badge>
            </div>
            <Button
                variant="default"
                size="icon"
                onclick={() => appStateStore.openCreateTemplateModal()}
            >
                <Plus class="h-4 w-4" />
            </Button>
        </div>

        <!-- Список шаблонов -->
        {#if taskStore.templates.length === 0}
            <p class="text-muted-foreground text-center py-8">
                Нет шаблонов. Нажмите + чтобы создать.
            </p>
        {:else}
            <div class="space-y-2">
                {#each taskStore.templates as template (template.id)}
                    <Card.Root
                        class={`px-2 py-2 transition-all duration-300 ${!template.isActive ? "opacity-50" : ""}`}
                    >
                        <div class="flex items-center gap-3">
                            <!-- Цветная полоса -->
                            <div
                                class="ml-1 w-6 h-6 rounded flex-shrink-0"
                                style="background-color: {ColorMap[
                                    template.color ?? 'red'
                                ]}"
                            ></div>

                            <!-- Информация -->
                            <div class="flex-1 min-w-0">
                                <!-- Строка 1: Заголовок -->
                                <div class="flex items-center gap-2">
                                    <span class="font-medium"
                                        >{template.title}</span
                                    >
                                    {#if !template.isActive}
                                        <Badge variant="outline" class="text-xs"
                                            >Пауза</Badge
                                        >
                                    {/if}
                                </div>

                                <!-- Строка 2: Описание -->
                                {#if template.description}
                                    <p
                                        class="text-sm text-muted-foreground truncate mt-0.5"
                                    >
                                        {template.description}
                                    </p>
                                {/if}

                                <!-- Строка 3: Метод повторения -->
                                <p class="text-sm text-muted-foreground mt-0.5">
                                    <span class="font-medium"
                                        >{getRepeatTypeName(template.type)} -
                                    </span>
                                    {getRepeatDescription(template)}
                                </p>

                                <!-- Строка 4: Дата создания -->
                                <div
                                    class="flex items-center gap-1 text-sm text-muted-foreground mt-0.5"
                                >
                                    <Tooltip.Provider delayDuration={1300}>
                                        <Tooltip.Root>
                                            <Tooltip.Trigger
                                                ><Calendar class="h-4 w-4" />
                                            </Tooltip.Trigger>
                                            <Tooltip.Content>
                                                <p>Дата создания шаблона</p>
                                            </Tooltip.Content>
                                        </Tooltip.Root>
                                    </Tooltip.Provider>

                                    {format(
                                        new Date(template.createdAt),
                                        "d MMMM yyyy",
                                        { locale: ru },
                                    )}
                                </div>
                            </div>

                            <!-- Меню действий -->
                            <DropdownMenu.Root>
                                <DropdownMenu.Trigger
                                    class={`text-muted-foreground ${buttonVariants({ variant: "ghost", size: "icon" })}`}
                                >
                                    <EllipsisVertical class="h-4 w-4" />
                                </DropdownMenu.Trigger>
                                <DropdownMenu.Content align="end">
                                    <!-- Редактировать -->
                                    <DropdownMenu.Item
                                        onclick={() =>
                                            appStateStore.openEditTemplateModal(
                                                template,
                                            )}
                                    >
                                        <Pencil class="h-4 w-4" />
                                        <span>Изменить</span>
                                    </DropdownMenu.Item>

                                    <!-- Пауза / Возобновить -->
                                    <DropdownMenu.Item
                                        onclick={() => toggleActive(template)}
                                    >
                                        {#if template.isActive}
                                            <PauseCircle class="h-4 w-4" />
                                            <span>Пауза</span>
                                        {:else}
                                            <PlayCircle class="h-4 w-4" />
                                            <span>Старт</span>
                                        {/if}
                                    </DropdownMenu.Item>

                                    <DropdownMenu.Separator />

                                    <!-- Удалить -->
                                    <DropdownMenu.Item
                                        onclick={() => confirmDelete(template)}
                                    >
                                        <Trash2 class="h-4 w-4 text-red-500" />
                                        <span>Удалить</span>
                                    </DropdownMenu.Item>
                                </DropdownMenu.Content>
                            </DropdownMenu.Root>
                        </div>
                    </Card.Root>
                {/each}
            </div>
        {/if}
    </Dialog.Content>
</Dialog.Root>
