<script lang="ts">
  import AlwaysOnTop from "$lib/components/always-on-top-toggle.svelte"; // Переключатель по верх всех окон
  import CreateTaskModal from "$lib/components/create-task-modal.svelte"; // Модальное окно задачи
  import SettingsModal from "$lib/components/settings-modal.svelte"; // Модальное окно настроек
  import ThemeToggle from "$lib/components/theme-toggle.svelte"; // Переключатель темы
  import TaskItem from "$lib/components/task-item.svelte"; // Компонент отображения задачи
  import TaskStatistics from "$lib/components/task-statistics.svelte"; // Компонент статистики
  import { toastStore } from "$lib/stores/toast-store"; // Уведомления
  import { Badge } from "$lib/components/ui/badge"; // Бейджи UI
  import { onMount } from "svelte"; // Хук жизненного цикла
  import { getCurrentWindow } from "@tauri-apps/api/window";
  import { currentTime, tasks, settings } from "$lib/stores/app-state";
  import * as Card from "$lib/components/ui/card/index.js"; // Карточки UI
  import {
    Calendar,
    Clock,
    ArrowRight,
    ArrowDown,
    CircleCheckBig,
  } from "@lucide/svelte"; // Иконки

  // import { TrayIcon } from "@tauri-apps/api/tray";
  // import { Menu } from "@tauri-apps/api/menu";

  // async function setupTray() {
  //   const menu = await Menu.new({
  //     items: [
  //       {
  //         id: "quit",
  //         text: "Выход",
  //       },
  //     ],
  //   });

  //   const options = {
  //     menu,
  //     icon: "icons/icon.ico",
  //     tooltip: "Мое приложение",
  //     menuOnLeftClick: true,
  //   };

  //   const tray = await TrayIcon.new(options);
  // }

  // setupTray();

  let isSingleColumn = $state(false);

  let midnightTimerId: NodeJS.Timeout | null = null;

  /*
    Подписка на изменения в хранилищах при монтировании компонента
    - Добавляем класс 'loaded' для плавного появления интерфейса
    - Подписываемся на изменения задач и настроек
  */
  onMount(() => {
    document.documentElement.classList.add("loaded");

    // Подписка на изменения настроек для обновления состояния окна
    const unsubscribeSettings = settings.subscribe(async (value) => {
      const win = await getCurrentWindow();
      await win.setAlwaysOnTop(value.alwaysOnTop);
    });

    handleResize();
    window.addEventListener("resize", handleResize);

    // Инициализация таймера, Ставим таймер до полуночи
    setupMidnightTimer();

    // Отписка при размонтировании
    return () => {
      unsubscribeSettings();
      if (midnightTimerId) { // Очистка
        clearTimeout(midnightTimerId);
      }
      window.removeEventListener("resize", handleResize);
    };
  });

  // Функция расчёта миллисекунд до следующей полуночи
  function getMillisecondsToMidnight(bufferMs = 1000): number { // 1 секунда запаса
    const now = new Date();
    const midnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1, // Следующий день
      0, 0, 0, 0, // Ровно 00:00:00.000
    );
    return midnight.getTime() - now.getTime() + bufferMs;
  }

  function setupMidnightTimer() {
    if (midnightTimerId) { // Очищаем предыдущий таймер, если есть
      clearTimeout(midnightTimerId);
    }

    const updateTimeAndReschedule = () => {
      $currentTime = new Date(); // Обновляем время
      setupMidnightTimer();      // Регистрируем следующий таймер
    };

    const timeUntilMidnight = getMillisecondsToMidnight();
    midnightTimerId = setTimeout(updateTimeAndReschedule, timeUntilMidnight);
  }

  /*
    Эффект для автоматического удаления выполненных задач
    Срабатывает при изменении списка задач или настроек
    Удаляет задачи, выполненные более autoDeleteDays дней назад
  */
  $effect(() => {
    if ($tasks.length === 0) return;

    const now = new Date();
    const updatedTasks = $tasks.filter((task) => {
      if (task.completed && task.completedAt) {
        const completedDate = new Date(task.completedAt);
        const daysDiff = Math.floor(
          (now.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        return daysDiff < $settings.autoDeleteDays;
      }
      return true;
    });

    // Если задачи были удалены - показываем уведомление
    if (updatedTasks.length !== $tasks.length) {
      const deletedCount = $tasks.length - updatedTasks.length;
      $tasks = updatedTasks;
      toastStore.add({
        title: "Авто удаление задач",
        description: `Удалено ${deletedCount} выполненных задач.`,
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
    const date = new Date($currentTime);
    date.setHours(0, 0, 0, 0);
    return date;
  });

  // Выполненные задачи
  const completedTasks = $derived(
    $tasks
      .filter((task) => task.completed)
      .sort(
        (a, b) =>
          new Date(b.completedAt!).getTime() -
          new Date(a.completedAt!).getTime(),
      ),
  );

  // Просроченные задачи (отсортированные от старых к новым)
  const overdueTasks = $derived(
    $tasks
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
    $tasks
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
    $tasks
      .filter((task) => {
        if (task.completed) return false;
        const taskDate = new Date(task.date);
        taskDate.setHours(0, 0, 0, 0);
        const daysDiff = Math.floor(
          (taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );
        return daysDiff > 0 && daysDiff <= $settings.futureDays;
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
        <CreateTaskModal />
        <ThemeToggle />
        <AlwaysOnTop />
        <SettingsModal />
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
              Ближайшие задачи
              <Badge variant="secondary">{futureTasks.length}</Badge>
              {#if isSingleColumn}
                <ArrowDown class="h-5 w-5" />
              {:else}
                <ArrowRight class="h-5 w-5" />
              {/if}
            </Card.Title>
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
