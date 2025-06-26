<script lang="ts">
  import { AlertTriangle } from "lucide-svelte";
  import { Button } from "$lib/components/ui/button/index.js";
  import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
  } from "$lib/components/ui/dialog";

  // Пропсы компонента
  let {
    isOpen,
    onConfirm,
    onCancel,
    taskTitle,
  }: {
    isOpen: boolean; // Открыт ли диалог
    onConfirm: () => void; // Функция подтверждения удаления
    onCancel: () => void; // Функция отмены удаления
    taskTitle: string; // Название задачи для отображения
  } = $props();
</script>

<Dialog open={isOpen} onOpenChange={onCancel}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle class="flex items-center gap-2">
        <AlertTriangle class="h-5 w-5 text-red-500" />
        Подтвердите удаление
      </DialogTitle>
    </DialogHeader>

    <div class="py-0">
      <p class="text-md text-muted-foreground">
        Вы уверены, что хотите удалить задачу <span class="font-semibold"
          >"{taskTitle}"</span
        >?
        <br />
        <span class="text-red-500">Это действие нельзя отменить.</span>
      </p>
    </div>

    <DialogFooter>
      <!-- Кнопка отмены -->
      <Button
        variant="outline"
        onclick={onCancel}
        class="transition-all duration-200"
      >
        Отмена
      </Button>

      <!-- Кнопка подтверждения удаления -->
      <Button onclick={onConfirm} class="transition-all duration-200">
        Удалить
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
