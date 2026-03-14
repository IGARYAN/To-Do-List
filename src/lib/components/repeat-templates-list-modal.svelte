<script lang="ts">
    import { Button, buttonVariants } from "$lib/components/ui/button";
    import * as Card from "$lib/components/ui/card";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
    import * as Dialog from "$lib/components/ui/dialog";
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
        EllipsisVertical,
        RepeatIcon,
        PauseCircle,
        PlayCircle,
    } from "@lucide/svelte";

    // Диалог подтверждения удаления
    let isDeleteDialogOpen = $state(false);
    let templateToDelete = $state<TypesRepeatTemplate | null>(null);

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
        if (template.type === "monthly" && template.monthDay) {
            return `${template.monthDay} числа каждого месяца`;
        }
        if (
            template.type === "yearly" &&
            template.yearMonth &&
            template.yearDay
        ) {
            return `${template.yearDay} ${monthNames[template.yearMonth]} каждый год`;
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
        templateToDelete = template;
        isDeleteDialogOpen = true;
    }

    // Удалить только шаблон
    function deleteTemplateOnly() {
        if (!templateToDelete) return;
        taskStore.deleteTemplate(templateToDelete.id, false);
        toastStore.add({
            title: "Шаблон удалён",
            description: `Шаблон "${templateToDelete.title}" удалён. Созданные задачи сохранены.`,
            variant: "default",
        });
        closeDeleteDialog();
    }

    // Удалить шаблон и будущие задачи
    function deleteTemplateWithTasks() {
        if (!templateToDelete) return;
        taskStore.deleteTemplate(templateToDelete.id, true);
        toastStore.add({
            title: "Шаблон удалён",
            description: `Шаблон "${templateToDelete.title}" и будущие задачи удалены.`,
            variant: "default",
        });
        closeDeleteDialog();
    }

    function closeDeleteDialog() {
        isDeleteDialogOpen = false;
        templateToDelete = null;
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
    <Dialog.Content class="md:max-w-4xl">
        <Dialog.Header>
            <Dialog.Title>Повторяющиеся задачи</Dialog.Title>
        </Dialog.Header>
        <!-- Заголовок с кнопкой добавления -->
        <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
                <RepeatIcon class="h-5 w-5 text-purple-500" />
                <h2 class="text-lg font-semibold">Повторяющиеся задачи</h2>
                <Badge variant="secondary">{taskStore.templates.length}</Badge>
            </div>
            <Button
                variant="outline"
                size="icon"
                onclick={() => appStateStore.openTemplateModal()}
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
                                class="w-2 h-10 rounded flex-shrink-0"
                                style="background-color: {ColorMap[
                                    template.color ?? 'red'
                                ]}"
                            ></div>

                            <!-- Информация -->
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center gap-2">
                                    <span class="font-medium"
                                        >{template.title}</span
                                    >
                                    <Badge variant="secondary" class="text-xs">
                                        {getRepeatTypeName(template.type)}
                                    </Badge>
                                    {#if !template.isActive}
                                        <Badge variant="outline" class="text-xs"
                                            >Пауза</Badge
                                        >
                                    {/if}
                                </div>
                                <p class="text-xs text-muted-foreground mt-0.5">
                                    {getRepeatDescription(template)}
                                </p>
                                {#if template.description}
                                    <p
                                        class="text-xs text-muted-foreground truncate"
                                    >
                                        {template.description}
                                    </p>
                                {/if}
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
                                            appStateStore.openTemplateModal(
                                                template,
                                            )}
                                    >
                                        <Pencil class="h-4 w-4" />
                                        <span>Редактировать</span>
                                    </DropdownMenu.Item>

                                    <!-- Пауза / Возобновить -->
                                    <DropdownMenu.Item
                                        onclick={() => toggleActive(template)}
                                    >
                                        {#if template.isActive}
                                            <PauseCircle class="h-4 w-4" />
                                            <span>Приостановить</span>
                                        {:else}
                                            <PlayCircle class="h-4 w-4" />
                                            <span>Возобновить</span>
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

        <!-- Диалог подтверждения удаления -->
        <Dialog.Root open={isDeleteDialogOpen} onOpenChange={closeDeleteDialog}>
            <Dialog.Content class="sm:max-w-md">
                <Dialog.Header>
                    <Dialog.Title>Удалить шаблон?</Dialog.Title>
                </Dialog.Header>
                <p class="text-sm text-muted-foreground">
                    Что сделать с задачами созданными из шаблона
                    <span class="font-medium text-foreground"
                        >"{templateToDelete?.title}"</span
                    >?
                </p>
                <div class="flex flex-col gap-2 pt-2">
                    <Button
                        variant="outline"
                        onclick={deleteTemplateOnly}
                        class="w-full"
                    >
                        Удалить только шаблон
                    </Button>
                    <Button
                        variant="destructive"
                        onclick={deleteTemplateWithTasks}
                        class="w-full"
                    >
                        Удалить шаблон и будущие задачи
                    </Button>
                    <Button
                        variant="ghost"
                        onclick={closeDeleteDialog}
                        class="w-full"
                    >
                        Отмена
                    </Button>
                </div>
            </Dialog.Content>
        </Dialog.Root>
    </Dialog.Content>
</Dialog.Root>
