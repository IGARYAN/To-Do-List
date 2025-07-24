<script lang="ts">
  import { AlertTriangle } from "@lucide/svelte";
  import { buttonVariants } from "$lib/components/ui/button";
  import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
  import {
    tasks,
    taskCreateEditDelete,
    isDeleteConfirmDialogOpen,
  } from "$lib/stores/app-state";
  import { toastStore } from "$lib/stores/toast-store";
  import { get } from "svelte/store";

  function deleteTask() {
    const task = get(taskCreateEditDelete);
    if (!task) return;

    const currentTasks = get(tasks);
    tasks.set(currentTasks.filter((t) => t.id !== task.id));

    toastStore.add({
      title: "Удаление задачи",
      description: `Задача "${task.title}" успешно удалена.`,
      variant: "default",
    });

    cancelDialog();
  }

  function cancelDialog() {
    taskCreateEditDelete.set(null);
    isDeleteConfirmDialogOpen.set(false);
  }
</script>

{#if $taskCreateEditDelete}
  <AlertDialog.Root
    bind:open={$isDeleteConfirmDialogOpen}
    onOpenChange={(open) => {
      if (!open) cancelDialog();
    }}
  >
    <AlertDialog.Content class="">
      <AlertDialog.Header>
        <AlertDialog.Title class="flex items-center gap-2">
          <AlertTriangle class="h-5 w-5 text-red-500" />
          Подтвердите удаление
        </AlertDialog.Title>
      </AlertDialog.Header>

      <div class="py-0">
        <AlertDialog.Description class="text-md">
          Вы уверены, что хотите удалить задачу <span class="font-semibold"
            >"{$taskCreateEditDelete.title}"</span
          >?
          <br />
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
