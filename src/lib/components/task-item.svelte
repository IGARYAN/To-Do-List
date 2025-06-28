<script lang="ts">
  // Импорты библиотек и компонентов
  import { format } from "date-fns"; // Для форматирования дат
  import { ru } from "date-fns/locale"; // Локализация на русский
  import { Calendar, Edit, Trash2, CheckCircle2, Circle } from "lucide-svelte"; // Иконки
  import { Button } from "$lib/components/ui/button/index.js"; // Кнопки
  import * as Card from "$lib/components/ui/card/index.js"; // Карточка для задачи
  import { Badge } from "$lib/components/ui/badge/index.js"; // Бейджи статусов
  import type { Task } from "$lib/types/task"; // Тип задачи

  /*
    Получаем пропсы компонента с использованием Svelte 5 $props рун
    Пропсы:
    - task: объект задачи для отображения
    - onToggle: функция для переключения статуса выполнения
    - onEdit: функция для открытия редактирования задачи
    - onDelete: функция для открытия диалога удаления
  */
  let {
    task,
    onToggle,
    onEdit,
    onDelete,
  }: {
    task: Task;
    onToggle: (id: string) => void;
    onEdit: (task: Task) => void;
    onDelete: (task: Task) => void;
  } = $props();

  // Реактивное состояние для отображения кнопок действий при наведении
  let isHovered = $state(false);

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
      onclick={() => onToggle(task.id)}
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
      <Button
        variant="ghost"
        size="icon"
        onclick={() => onEdit(task)}
        class="h-8 w-8"
        aria-label="Редактировать задачу"
      >
        <Edit class="h-4 w-4" />
      </Button>

      <!-- Кнопка удаления -->
      <Button
        variant="ghost"
        size="icon"
        onclick={() => onDelete(task)}
        class="h-8 w-8 text-red-500 hover:text-red-600"
        aria-label="Удалить задачу"
      >
        <Trash2 class="h-4 w-4" />
      </Button>
    </div>
  </div>
</Card.Root>
