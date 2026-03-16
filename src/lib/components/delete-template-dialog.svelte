<script lang="ts">
    import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
    import * as Alert from "$lib/components/ui/alert/index.js";
    import { Button } from "$lib/components/ui/button";
    import { taskStore } from "$lib/stores/task-store.svelte";
    import { appStateStore } from "$lib/stores/app-state.svelte";
    import { toastStore } from "$lib/stores/toast-store";
    import { AlertTriangle, AlertCircleIcon } from "@lucide/svelte";

    function deleteTemplateOnly() {
        if (!appStateStore.templateToDelete) return;
        taskStore.deleteTemplate(appStateStore.templateToDelete.id, false);
        toastStore.add({
            title: "Шаблон удалён",
            description: `Шаблон "${appStateStore.templateToDelete.title}" удалён. Задачи стали обычными.`,
            variant: "default",
        });
        appStateStore.closeDeleteTemplateDialog();
    }

    function deleteTemplateWithTasks() {
        if (!appStateStore.templateToDelete) return;
        taskStore.deleteTemplate(appStateStore.templateToDelete.id, true);
        toastStore.add({
            title: "Шаблон удалён",
            description: `Шаблон "${appStateStore.templateToDelete.title}" и все задачи удалены.`,
            variant: "default",
        });
        appStateStore.closeDeleteTemplateDialog();
    }

    function cancelDialog() {
        appStateStore.closeDeleteTemplateDialog();
    }
</script>

<!-- Диалог подтверждения удаления -->
<AlertDialog.Root
    open={appStateStore.isDeleteTemplateDialogOpen}
    onOpenChange={(open) => {
        if (!open) appStateStore.closeDeleteTemplateDialog();
    }}
>
    <AlertDialog.Content class="md:max-w-lg">
        <AlertDialog.Header>
            <AlertDialog.Title class="flex items-center gap-2">
                <AlertTriangle class="h-5 w-5 text-red-500" />
                Подтвердите удаление шаблона
            </AlertDialog.Title>
        </AlertDialog.Header>

        <div class="py-0">
            <AlertDialog.Description class="">
                Вы уверены, что хотите удалить шаблон <span
                    class="font-medium text-foreground"
                    >"{appStateStore.templateToDelete?.title}"</span
                >?
                <br /> <br />
                <span class="text-red-500">Это действие нельзя отменить.</span>
            </AlertDialog.Description>
        </div>

        <Alert.Root>
            <AlertCircleIcon />
            <Alert.Description>
                <p>
                    Если удалить только шаблон, то все созданные этим шаблоном
                    задачи будут преобразованы в обычные (не повторяющиеся)
                    задачи.
                </p>
            </Alert.Description>
        </Alert.Root>

        <div class="flex flex-col gap-2 pt-2">
            <Button onclick={deleteTemplateOnly} class="w-full">
                Удалить только шаблон
            </Button>
            <Button
                variant="destructive"
                onclick={deleteTemplateWithTasks}
                class="w-full"
            >
                Удалить шаблон и все задачи
            </Button>
            <Button variant="outline" onclick={cancelDialog} class="w-full">
                Отмена
            </Button>
        </div>
    </AlertDialog.Content>
</AlertDialog.Root>
