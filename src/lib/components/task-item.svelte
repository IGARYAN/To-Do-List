<script lang="ts">
  import { format } from "date-fns"; // Для форматирования дат
  import { ru } from "date-fns/locale"; // Локализация на русский
  import { Button, buttonVariants } from "$lib/components/ui/button/index.js"; // Кнопки
  import * as Card from "$lib/components/ui/card/index.js"; // Карточка для задачи
  import { Badge } from "$lib/components/ui/badge/index.js"; // Бейджи статусов
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import type { TypesTask } from "$lib/types/types-task"; // Тип задачи
  import { toastStore } from "$lib/stores/toast-store"; // Уведомления
  import { ColorMap } from '$lib/types/color-map';
  import {
    Plus,
    Circle,
    Pencil,
    Trash2,
    Calendar,
    CircleCheckBig,
    EllipsisVertical,
  } from "@lucide/svelte"; // Иконки
  import {
    tasks,
    currentTime,
    isEditTaskModalOpen,
    taskCreateEditDelete,
    isCreateTaskModalOpen,
    isDeleteConfirmDialogOpen,
  } from "$lib/stores/app-state";

  let { task } = $props();

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
    const date = new Date($currentTime);
    date.setHours(0, 0, 0, 0);
    return date;
  });

  // Завтрашняя дата
  const tomorrow = $derived.by(() => {
    const date = new Date($currentTime);
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

  // Функция открывает диалог редактирования задачи
  function EditTaskModalOpen() {
    taskCreateEditDelete.set(task);
    isEditTaskModalOpen.set(true);
  }

  // Функция открывает диалог создания задачи из существующей задачи
  function CreateTaskModalOpen() {
    taskCreateEditDelete.set(task);
    isCreateTaskModalOpen.set(true);
  }

  // Функция открывает диалог подтверждения удаления задачи
  function DeleteConfirmDialogOpen() {
    taskCreateEditDelete.set(task);
    isDeleteConfirmDialogOpen.set(true);
  }
</script>

<Card.Root
  class={`flex px-2 py-2 transition-all duration-300 hover:shadow-md dark:hover:shadow-white/10 
  ${isOverdue ? "border-red-300 dark:border-red-900" : ""}`}
>
  <div class="flex items-stretch gap-3 h-full">
    <div class="flex items-center">
      <!-- Кнопка переключения статуса выполнения -->
      <Button
        variant="ghost"
        size="icon"
        onclick={() => toggleTask(task.id)}
        class="h-8 w-8 p-0 hover:bg-transparent -mr-2"
        aria-label={task.completed
          ? "Отметить как невыполненную"
          : "Отметить как выполненную"}
      >
        {#if task.completed}
          <CircleCheckBig class="h-5 w-5 text-green-500" />
        {:else}
          <Circle class="h-5 w-5 text-muted-foreground hover:text-primary" />
        {/if}
      </Button>
    </div>

    <!-- Цветная полоса -->
    <div
      class="-mr-1 w-2 rounded"
      style="background-color: {ColorMap[task.color ?? 'gray']}"
    ></div>

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
    <div class="flex items-center gap-1 transition-opacity duration-300">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          class={`transition-all duration-300 relative text-muted-foreground ${buttonVariants({ variant: "ghost", size: "icon" })}`}
          aria-label="Меню"
        >
          <EllipsisVertical class="h-4 w-4" />
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end">
          <!-- Пункт меню редактирования задачи -->
          {#if !task.completed}
            <DropdownMenu.Item onclick={EditTaskModalOpen}>
              <Pencil class="h-4 w-4" />
              <span>Изменить</span>
            </DropdownMenu.Item>
          {/if}

          <!-- Пункт меню создания задачи из -->
          <DropdownMenu.Item onclick={CreateTaskModalOpen}>
            <Plus class="h-4 w-4" />
            <span>Создать из</span>
          </DropdownMenu.Item>

          <DropdownMenu.Separator />

          <!-- Пункт меню удаления задачи -->
          <DropdownMenu.Item onclick={DeleteConfirmDialogOpen}>
            <Trash2 class="h-4 w-4 text-red-500" />
            <span>Удалить</span>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  </div>
</Card.Root>
