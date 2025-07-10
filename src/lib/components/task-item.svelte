<script lang="ts">
  import { format } from "date-fns"; // Для форматирования дат
  import { ru } from "date-fns/locale"; // Локализация на русский
  import { Calendar, CheckCircle2, Circle } from "@lucide/svelte"; // Иконки
  import { Button } from "$lib/components/ui/button/index.js"; // Кнопки
  import * as Card from "$lib/components/ui/card/index.js"; // Карточка для задачи
  import { Badge } from "$lib/components/ui/badge/index.js"; // Бейджи статусов
  import type { TypesTask } from "$lib/types/types-task"; // Тип задачи
  import DeleteConfirmDialog from "$lib/components/delete-confirm-dialog.svelte";
  import EditTaskModal from "$lib/components/edit-task-modal.svelte";
  import { toastStore } from "$lib/stores/toast-store"; // Уведомления
  import { tasks } from "$lib/stores/app-state";

  // export let task: string;
  let { task } = $props();

  // Реактивное состояние для отображения кнопок действий при наведении
  let isHovered = $state(false);

  /*
    Переключение статуса выполнения задачи
    - Инвертирует статус completed
    - Устанавливает время выполнения при отметке как выполненная
    - Показывает соответствующее уведомление
  */
  function toggleTask(id: string) {
    let updatedTask: TypesTask | undefined;

    $tasks = $tasks.map((task) => {
      if (task.id === id) {
        const isNowCompleted = !task.completed;
        updatedTask = {
          ...task,
          completed: isNowCompleted,
          completedAt: isNowCompleted ? new Date().toISOString() : undefined,
        };
        return updatedTask;
      }
      return task;
    });

    if (updatedTask) {
      toastStore.add({
        title: updatedTask.completed
          ? "Задача выполнена"
          : "Задача не выполнена",
        description: `Задача "${updatedTask.title}" ${updatedTask.completed ? "отмечена как выполненная." : "отмечена как невыполненная."}`,
        variant: "default",
      });
    }
  }

  /*
    Подготовка дат для сравнения
    Все даты нормализуются (обнуляются часы, минуты, секунды)
    для корректного сравнения только по дате
  */

  // Дата выполнения задачи
  const taskDate = $derived.by(() => {
    const date = new Date(task.date);
    date.setHours(0, 0, 0, 0);
    return date;
  });

  // Сегодняшняя дата
  const today = $derived.by(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  });

  // Завтрашняя дата
  const tomorrow = $derived.by(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    date.setHours(0, 0, 0, 0);
    return date;
  });

  /*
    Определение статусов задачи по дате выполнения
    Используются для отображения соответствующих бейджей
  */
  const isOverdue = $derived(
    taskDate.getTime() < today.getTime() && !task.completed,
  );
  const isToday = $derived(taskDate.getTime() === today.getTime());
  const isTomorrow = $derived(taskDate.getTime() === tomorrow.getTime());
</script>

<Card.Root
  class={`px-2 py-2 transition-all duration-300 hover:shadow-md dark:hover:shadow-white/10 
  ${isOverdue ? "border-red-300 dark:border-red-900" : ""}`}
  onmouseenter={() => (isHovered = true)}
  onmouseleave={() => (isHovered = false)}
>
  <div class="flex items-center gap-3">
    <!-- Кнопка переключения статуса выполнения -->
    <Button
      variant="ghost"
      size="icon"
      onclick={() => toggleTask(task.id)}
      class="h-8 w-8 p-0 hover:bg-transparent"
      aria-label={task.completed
        ? "Отметить как невыполненную"
        : "Отметить как выполненную"}
    >
      {#if task.completed}
        <CheckCircle2 class="h-5 w-5 text-green-500" />
      {:else}
        <Circle class="h-5 w-5 text-muted-foreground hover:text-primary" />
      {/if}
    </Button>

    <!-- Основная информация о задаче -->
    <div class="flex-1 min-w-0">
      <!-- Название задачи -->
      <h3
        class={`font-medium ${task.completed ? "line-through text-muted-foreground" : ""}`}
      >
        {task.title}
      </h3>

      <!-- Описание задачи (если есть) -->
      {#if task.description}
        <p
          class={`text-sm ${
            task.completed
              ? "line-through text-muted-foreground"
              : "text-muted-foreground"
          }`}
        >
          {task.description}
        </p>
      {/if}

      <!-- Дата и статусные бейджи -->
      <div class="flex items-center gap-2 pt-2">
        <div class="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar class="h-3 w-3" />
          {format(taskDate, "d MMMM yyyy", { locale: ru })}
        </div>

        <!-- Бейдж "Сегодня" -->
        {#if isToday}
          <Badge class="text-xs">Сегодня</Badge>
        {/if}

        <!-- Бейдж "Просрочено" -->
        {#if isOverdue}
          <Badge
            variant="secondary"
            class="bg-red-700 dark:bg-red-800 text-white text-xs"
            >Просрочено</Badge
          >
        {/if}

        {#if isTomorrow}
          <Badge
            variant="secondary"
            class="bg-orange-700 dark:bg-orange-800 text-white text-xs"
            >Завтра</Badge
          >
        {/if}
      </div>
    </div>

    <!-- Кнопки действий (показываются при наведении) -->
    <div
      class={`flex items-center gap-1 transition-opacity duration-300 ${
        isHovered ? "opacity-100" : "opacity-0"
      }`}
    >
      <!-- Кнопка редактирования -->
      <EditTaskModal editTask={task} />

      <!-- Кнопка удаления -->
      <DeleteConfirmDialog delTask={task} />
    </div>
  </div>
</Card.Root>
