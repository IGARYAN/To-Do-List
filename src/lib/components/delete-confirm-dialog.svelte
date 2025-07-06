<script lang="ts">
  import { AlertTriangle, Trash2 } from "lucide-svelte";
  import { Button, buttonVariants } from "$lib/components/ui/button/index.js";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { tasks } from "$lib/stores/app-state";
  import { toastStore } from "$lib/stores/toast-store";
  import { get } from "svelte/store";

  let { delTask } = $props();

  let isDeleteConfirmDialogOpen = $state(false);

  /*
    Удаление задачи
    - Удаляет задачу из хранилища по ID
    - Показывает уведомление об удалении
  */
  function deleteTask() {
    const currentTasks = get(tasks);
    tasks.set(currentTasks.filter(task => task.id !== delTask.id));

    toastStore.add({
        title: "Удаление задачи",
        description: `Задача "${delTask.title}" успешно удалена.`,
        variant: "default",
      });

    isDeleteConfirmDialogOpen = false;
  }
</script>

<Dialog.Root open={isDeleteConfirmDialogOpen} onOpenChange={() => (isDeleteConfirmDialogOpen = false)}>
  <Dialog.Trigger onclick={() => { isDeleteConfirmDialogOpen = true; }}
    class={`h-8 w-8 text-red-500 hover:text-red-600 ${buttonVariants({ variant: "ghost", size: "icon" })}`}
    aria-label="Удалить задачу"
  >
    <Trash2 class="h-4 w-4" />
  </Dialog.Trigger>
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
          >"{delTask.title}"</span
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
