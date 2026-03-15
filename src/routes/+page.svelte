<script lang="ts">
  import AlwaysOnTop from "$lib/components/always-on-top-toggle.svelte"; // Переключатель по верх всех окон
  import RepeatTemplatesListModal from "$lib/components/repeat-templates-list-modal.svelte";
  import SettingsModal from "$lib/components/settings-modal.svelte"; // Модальное окно настроек
  import PasswordModal from "$lib/components/password-modal.svelte"; // Модальное окно пароля
  import ThemeToggle from "$lib/components/theme-toggle.svelte"; // Переключатель темы
  import TaskItem from "$lib/components/task-item.svelte"; // Компонент отображения задачи
  import TaskStatistics from "$lib/components/task-statistics.svelte"; // Компонент статистики
  import DeleteConfirmDialog from "$lib/components/delete-confirm-dialog.svelte";
  import TaskModal from "$lib/components/task-modal.svelte";
  import { generateTasksFromTemplates } from "$lib/services/repeat-service";
  import { toastStore } from "$lib/stores/toast-store"; // Уведомления
  import { Badge } from "$lib/components/ui/badge"; // Бейджи UI
  import { buttonVariants } from "$lib/components/ui/button/index.js"; // Кнопки
  import { onMount } from "svelte"; // Хук жизненного цикла
  import { getCurrentWindow } from "@tauri-apps/api/window";
  import { taskStore } from "$lib/stores/task-store.svelte";
  import { settingsStore } from "$lib/stores/settings-store.svelte";
  import { appStateStore } from "$lib/stores/app-state.svelte";
  import * as Card from "$lib/components/ui/card/index.js"; // Карточки UI
  import * as Tooltip from "$lib/components/ui/tooltip/index.js";
  import {
    Plus,
    Clock,
    Settings,
    Calendar,
    ArrowDown,
    RepeatIcon,
    ArrowRight,
    CircleCheckBig,
  } from "@lucide/svelte"; // Иконки

  let showAllFuture = $state(false);

  let isSingleColumn = $state(false);

  let midnightTimerId: NodeJS.Timeout | null = null;

  let lastFutureDays = settingsStore.settings.futureDays;

  /*
      Подписка на изменения в хранилищах при монтировании компонента
      - Добавляем класс 'loaded' для плавного появления интерфейса
    */
  onMount(() => {
    document.documentElement.classList.add("loaded");

    handleResize();
    window.addEventListener("resize", handleResize);

    // Инициализация таймера, Ставим таймер до полуночи
    setupMidnightTimer();

    return () => {
      if (midnightTimerId) {
        // Очистка
        clearTimeout(midnightTimerId);
      }
      window.removeEventListener("resize", handleResize);
    };
  });

  // Функция расчёта миллисекунд до следующей полуночи
  function getMillisecondsToMidnight(bufferMs = 1000): number {
    // 1 секунда запаса
    const now = new Date();
    const midnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1, // Следующий день
      0,
      0,
      0,
      0,
    ); // Ровно 00:00:00.000
    return midnight.getTime() - now.getTime() + bufferMs;
  }

  function setupMidnightTimer() {
    if (midnightTimerId) {
      // Очищаем предыдущий таймер, если есть
      clearTimeout(midnightTimerId);
    }

    const updateTimeAndReschedule = () => {
      appStateStore.updateTime(); // Обновляем время через стор
      generateTasksFromTemplates();
      setupMidnightTimer(); // Регистрируем следующий таймер
    };

    const timeUntilMidnight = getMillisecondsToMidnight();
    midnightTimerId = setTimeout(updateTimeAndReschedule, timeUntilMidnight);
  }

  // $effect для обновления alwaysOnTop при изменении настроек
  $effect(() => {
    const win = getCurrentWindow();
    win.setAlwaysOnTop(settingsStore.settings.alwaysOnTop);
  });

  // Реагируем на изменение futureDays
  $effect(() => {
    const futureDays = settingsStore.settings.futureDays;
    if (taskStore.isInitialized && futureDays !== lastFutureDays) {
      lastFutureDays = futureDays;
      console.log(
        `[Page] futureDays изменился на ${futureDays}, перегенерируем задачи`,
      );
      generateTasksFromTemplates();
    }
  });

  /*
      Эффект для автоматического удаления выполненных задач
      Срабатывает при изменении списка задач или настроек
      Удаляет задачи, выполненные более autoDeleteDays дней назад
    */
  $effect(() => {
    const tasks = taskStore.tasks;
    const currentTime = appStateStore.currentTime;
    const autoDeleteDays = settingsStore.settings.autoDeleteDays;

    if (tasks.length === 0) return;
    const now = new Date(currentTime);
    now.setHours(0, 0, 0, 0); // сравнение по дате, не по времени

    const updatedTasks = tasks.filter((task) => {
      if (task.completed && task.completedAt) {
        const completedDate = new Date(task.completedAt);
        completedDate.setHours(0, 0, 0, 0);
        const daysDiff = Math.floor(
          (now.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        return daysDiff < autoDeleteDays;
      }
      return true;
    });

    // Если задачи были удалены - показываем уведомление
    if (updatedTasks.length !== tasks.length) {
      const deletedCount = tasks.length - updatedTasks.length;
      taskStore.tasks = updatedTasks;
      toastStore.add({
        title: "Авто удаление задач",
        description: `Удален${deletedCount === 1 ? "а" : "о"} ${deletedCount} выполнен${deletedCount === 1 ? "ная задача" : "ных задач"}`,
        variant: "default",
      });
    }
  });

  /*
      Фильтрация задач по категориям
      Все категории используют $derived для реактивности
    */

  // Текущая дата (нормализованная)
  const today = $derived.by(() => {
    const date = new Date(appStateStore.currentTime);
    date.setHours(0, 0, 0, 0);
    return date;
  });

  // Выполненные задачи
  const completedTasks = $derived(
    taskStore.tasks
      .filter((task) => task.completed)
      .sort(
        (a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime(),
      ),
  );

  // Просроченные задачи (отсортированные от старых к новым)
  const overdueTasks = $derived(
    taskStore.tasks
      .filter((task) => {
        if (task.completed) return false;
        const taskDate = new Date(task.date);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() < today.getTime();
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
  );

  // Задачи на сегодня (отсортированные по времени)
  const todayTasks = $derived(
    taskStore.tasks
      .filter((task) => {
        if (task.completed) return false;
        const taskDate = new Date(task.date);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === today.getTime();
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
  );

  // Будущие задачи (в пределах futureDays дней, отсортированные)
  const futureTasks = $derived(
    taskStore.tasks
      .filter((task) => {
        if (task.completed) return false;
        const taskDate = new Date(task.date);
        taskDate.setHours(0, 0, 0, 0);
        const daysDiff = Math.floor(
          (taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );
        // Если showAllFuture — показываем все будущие, иначе только в пределах futureDays
        return showAllFuture
          ? daysDiff > 0
          : daysDiff > 0 && daysDiff <= settingsStore.settings.futureDays;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
  );

  // Слежение за размером окна
  function handleResize() {
    isSingleColumn = window.innerWidth < 1280; // xl breakpoint
  }
</script>

<div class="min-h-screen bg-background transition-colors duration-300">
  <!-- Основной контейнер с полной шириной и небольшими отступами -->
  <div class="w-full px-4 py-4">
    <!-- Заголовок приложения -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1
          class="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
        >
          Мои задачи
        </h1>
        <!-- <p class="text-muted-foreground">
            Управляйте своими задачами эффективно
          </p> -->
      </div>

      <!-- Панель управления -->
      <div class="flex items-center gap-2">
        <!-- Кнопка создать задачу -->
        <Tooltip.Provider delayDuration={1000}>
          <Tooltip.Root>
            <Tooltip.Trigger
              onclick={() => appStateStore.openCreateTaskModal()}
              class={`transition-all duration-300 ${buttonVariants({ variant: "default", size: "icon" })}`}
            >
              <Plus class="h-4 w-4" />
            </Tooltip.Trigger>
            <Tooltip.Content>
              <p>Создать задачу</p>
            </Tooltip.Content>
          </Tooltip.Root>
        </Tooltip.Provider>

        <!-- Кнопка повторяющихся задач -->
        <Tooltip.Provider delayDuration={1000}>
          <Tooltip.Root>
            <Tooltip.Trigger
              onclick={() => appStateStore.openTemplatesListModal()}
              class={`transition-all duration-300 ${buttonVariants({ variant: "outline", size: "icon" })}`}
            >
              <RepeatIcon class="h-4 w-4" />
            </Tooltip.Trigger>
            <Tooltip.Content>
              <p>Повторяющиеся задачи</p>
            </Tooltip.Content>
          </Tooltip.Root>
        </Tooltip.Provider>

        <ThemeToggle />
        <AlwaysOnTop />

        <!-- Кнопка настроек -->
        <Tooltip.Provider delayDuration={1000}>
          <Tooltip.Root>
            <Tooltip.Trigger
              onclick={() => appStateStore.openSettingsModal()}
              class={`transition-all duration-300 ${buttonVariants({ variant: "outline", size: "icon" })}`}
            >
              <Settings class="h-4 w-4" />
            </Tooltip.Trigger>
            <Tooltip.Content>
              <p>Настройки</p>
            </Tooltip.Content>
          </Tooltip.Root>
        </Tooltip.Provider>
      </div>
    </div>

    <!-- Статистические карточки -->
    <TaskStatistics
      Future={futureTasks}
      Overdue={overdueTasks}
      Today={todayTasks}
      Completed={completedTasks}
    />

    <!-- Разделы с задачами -->
    <div class="grid gap-4 grid-cols-1 xl:grid-cols-3">
      {#if !isSingleColumn || futureTasks.length > 0}
        <!-- Будущие задачи -->
        <Card.Root>
          <Card.Header>
            <Card.Title class="flex items-center gap-2">
              <Clock class="h-5 w-5 text-orange-500" />
              Будущие задачи
              <Badge variant="secondary">{futureTasks.length}</Badge>
              {#if isSingleColumn}
                <ArrowDown class="h-5 w-5" />
              {:else}
                <ArrowRight class="h-5 w-5" />
              {/if}
            </Card.Title>
            <Card.Action>
              <button
                onclick={() => (showAllFuture = !showAllFuture)}
                class={`w-20 ${buttonVariants({ variant: showAllFuture ? "default" : "outline", size: "sm" })}`}
              >
                {showAllFuture
                  ? "Все"
                  : `${settingsStore.settings.futureDays} дн.`}
              </button>
            </Card.Action>
          </Card.Header>
          <Card.Content class="px-4">
            <div class="space-y-2">
              {#each futureTasks as task (task.id)}
                <TaskItem {task} />
              {/each}
            </div>
          </Card.Content>
        </Card.Root>
      {/if}

      <!-- Задачи на сегодня -->
      <Card.Root>
        <Card.Header>
          <Card.Title class="flex items-center gap-2">
            <Calendar class="h-5 w-5 text-blue-500" />
            Задачи на сегодня
            <Badge variant="secondary"
              >{overdueTasks.length + todayTasks.length}</Badge
            >
            {#if isSingleColumn}
              <ArrowDown class="h-5 w-5" />
            {:else}
              <ArrowRight class="h-5 w-5" />
            {/if}
          </Card.Title>
        </Card.Header>
        <Card.Content class="px-4">
          {#if overdueTasks.length === 0 && todayTasks.length === 0}
            <p class="text-muted-foreground text-center py-8">
              На сегодня задач нет. Отличная работа! 🎉
            </p>
          {/if}

          <!-- Просроченные и сегодняшние задачи -->
          <div class="space-y-2">
            {#each [...overdueTasks, ...todayTasks] as task (task.id)}
              <TaskItem {task} />
            {/each}
          </div>
        </Card.Content>
      </Card.Root>

      <!-- Выполненные задачи -->
      {#if !isSingleColumn || completedTasks.length > 0}
        <Card.Root>
          <Card.Header>
            <Card.Title class="flex items-center gap-2">
              <CircleCheckBig class="h-5 w-5 text-green-500" />
              Выполненные задачи
              <Badge variant="secondary">{completedTasks.length}</Badge>
              {#if isSingleColumn}
                <ArrowDown class="h-5 w-5" />
              {:else}
                <ArrowRight class="h-5 w-5" />
              {/if}
            </Card.Title>
            <Card.Action>
              <button
                onclick={() => appStateStore.openSettingsModal()}
                class={`w-20 ${buttonVariants({ variant: "outline", size: "sm" })}`}
              >
                {settingsStore.settings.autoDeleteDays} дн.
              </button>
            </Card.Action>
          </Card.Header>

          <Card.Content class="px-4">
            <div class="space-y-2">
              {#each completedTasks as task (task.id)}
                <TaskItem {task} />
              {/each}
            </div>
          </Card.Content>
        </Card.Root>
      {/if}
    </div>
  </div>
</div>

{#if appStateStore.isTaskModalOpen}
  <TaskModal />
{/if}

{#if appStateStore.isSettingsModalOpen}
  <SettingsModal />
{/if}

{#if appStateStore.isPasswordModalOpen}
  <PasswordModal />
{/if}

{#if appStateStore.isDeleteConfirmDialogOpen}
  <DeleteConfirmDialog />
{/if}

{#if appStateStore.isTemplatesListModalOpen}
  <RepeatTemplatesListModal />
{/if}
