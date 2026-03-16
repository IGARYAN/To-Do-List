<script lang="ts">
  import { AlertTriangle } from "@lucide/svelte";
  import { buttonVariants } from "$lib/components/ui/button";
  import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
  import { taskStore } from "$lib/stores/task-store.svelte";
  import { appStateStore } from "$lib/stores/app-state.svelte";
  import { toastStore } from "$lib/stores/toast-store";

  function deleteTask() {
    const task = appStateStore.taskCreateEditDelete;
    if (!task) return;

    // Используем метод deleteTask из стора
    taskStore.deleteTask(task.id);

    toastStore.add({
      title: "Удаление задачи",
      description: `Задача "${task.title}" успешно удалена.`,
      variant: "default",
    });

    cancelDialog();
  }

  function cancelDialog() {
    appStateStore.closeDeleteTaskDialog();
  }
</script>

{#if appStateStore.taskCreateEditDelete}
  <AlertDialog.Root
    bind:open={appStateStore.isDeleteTaskDialogOpen}
    onOpenChange={(open) => {
      if (!open) cancelDialog();
    }}
  >
    <AlertDialog.Content class="">
      <AlertDialog.Header>
        <AlertDialog.Title class="flex items-center gap-2">
          <AlertTriangle class="h-5 w-5 text-red-500" />
          Подтвердите удаление задачи
        </AlertDialog.Title>
      </AlertDialog.Header>

      <div class="py-0">
        <AlertDialog.Description class="text-md">
          Вы уверены, что хотите удалить задачу <span class="font-semibold"
            >"{appStateStore.taskCreateEditDelete.title}"</span
          >?
          <br /><br />
          <span class="text-red-500">Это действие нельзя отменить.</span>
        </AlertDialog.Description>
      </div>

      <AlertDialog.Footer>
        <AlertDialog.Cancel
          class={`transition-all duration-300 ${buttonVariants({ variant: "outline" })}`}
        >
          Отмена
        </AlertDialog.Cancel>

        <AlertDialog.Action
          onclick={deleteTask}
          class={`transition-all duration-300 ${buttonVariants({ variant: "default" })}`}
        >
          Удалить
        </AlertDialog.Action>
      </AlertDialog.Footer>
    </AlertDialog.Content>
  </AlertDialog.Root>
{/if}
