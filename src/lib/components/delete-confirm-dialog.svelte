<script lang="ts">
  import { AlertTriangle } from "@lucide/svelte";
  import { Button, buttonVariants } from "$lib/components/ui/button/index.js";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import {
    tasks,
    taskCreateEditDelete,
    isDeleteConfirmDialogOpen,
  } from "$lib/stores/app-state";
  import { toastStore } from "$lib/stores/toast-store";
  import { get } from "svelte/store";

  /*
    Удаление задачи
    - Удаляет задачу из хранилища по ID
    - Показывает уведомление об удалении
  */
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
  <Dialog.Root
    bind:open={$isDeleteConfirmDialogOpen}
    onOpenChange={(open) => {
      if (!open) cancelDialog();
    }}
  >
    <Dialog.Content>
      <Dialog.Header>
        <Dialog.Title class="flex items-center gap-2">
          <AlertTriangle class="h-5 w-5 text-red-500" />
          Подтвердите удаление
        </Dialog.Title>
      </Dialog.Header>

      <div class="py-0">
        <p class="text-md text-muted-foreground">
          Вы уверены, что хотите удалить задачу <span class="font-semibold"
            >"{$taskCreateEditDelete.title}"</span
          >?
          <br />
          <span class="text-red-500">Это действие нельзя отменить.</span>
        </p>
      </div>

      <Dialog.Footer>
        <!-- Кнопка отмены -->

        <Dialog.Close
          class={`transition-all duration-300 ${buttonVariants({ variant: "outline" })}`}
        >
          Отмена
        </Dialog.Close>

        <!-- Кнопка подтверждения удаления -->
        <Button onclick={deleteTask} class="transition-all duration-300">
          Удалить
        </Button>
      </Dialog.Footer>
    </Dialog.Content>
  </Dialog.Root>
{/if}
