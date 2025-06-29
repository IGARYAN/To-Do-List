<script lang="ts">
  // Импорты компонентов
  import AlwaysOnTop from "$lib/components/always-on-top-toggle.svelte"; // Переключатель по верх всех окон
  import TaskModal from "$lib/components/task-modal.svelte"; // Модальное окно задачи
  import SettingsModal from "$lib/components/settings-modal.svelte"; // Модальное окно настроек
  import DeleteConfirmDialog from "$lib/components/delete-confirm-dialog.svelte"; // Диалог подтверждения удаления
  import ThemeToggle from "$lib/components/theme-toggle.svelte"; // Переключатель темы
  import TaskItem from "$lib/components/task-item.svelte"; // Компонент отображения задачи
  import { tasksStore, settingsStore } from "$lib/stores/app-store"; // Хранилища состояний
  import { toastStore } from "$lib/stores/toast-store"; // Уведомления
  import type { Task, AppSettings } from "$lib/types/task"; // Типы данных
  import { buttonVariants } from "$lib/components/ui/button"; // Кнопки UI
  import * as Tooltip from "$lib/components/ui/tooltip/index.js";
  import { Badge } from "$lib/components/ui/badge"; // Бейджи UI
  import { onMount } from "svelte"; // Хук жизненного цикла
  import { getCurrentWindow } from "@tauri-apps/api/window";
  import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  } from "$lib/components/ui/card"; // Карточки UI
  import {
    Plus,
    Settings,
    CircleX,
    Calendar,
    Clock,
    ArrowRight,
    ArrowDown,
    CircleCheckBig,
  } from "lucide-svelte"; // Иконки

  /*
    Реактивные состояния страницы:
    - isTaskModalOpen: открыто ли модальное окно задачи
    - isSettingsModalOpen: открыто ли модальное окно настроек
    - isDeleteDialogOpen: открыт ли диалог подтверждения удаления
    - editingTask: задача для редактирования (null если создание новой)
    - taskToDelete: задача для удаления
    - currentTime: переменная для отслеживания времени
  */
  let isSingleColumn = $state(false);
  let isTaskModalOpen = $state(false);
  let isSettingsModalOpen = $state(false);
  let isDeleteDialogOpen = $state(false);
  let editingTask = $state<Task | null>(null);
  let taskToDelete = $state<Task | null>(null);
  let currentTime = $state(new Date());

  /*
    Реактивные данные из хранилищ:
    - tasks: список всех задач
    - settings: настройки приложения
  */
  let tasks = $state<Task[]>([]);
  let settings = $state<AppSettings>({
    autoDeleteDays: 7, // Автоудаление выполненных задач через N дней
    futureDays: 7, // Сколько дней вперед показывать задачи
    theme: "system", // Тема оформления
    saveWindowState: false, // Сохранять состояние окна
    windowState: null, // Состояние окна
    alwaysOnTop: false,
  });

  /*
    Подписка на изменения в хранилищах при монтировании компонента
    - Добавляем класс 'loaded' для плавного появления интерфейса
    - Подписываемся на изменения задач и настроек
  */
  onMount(() => {
    document.documentElement.classList.add("loaded");

    const unsubscribeTasks = tasksStore.subscribe((value) => {
      tasks = value;
    });

    const unsubscribeSettings = settingsStore.subscribe(async (value) => {
      settings = value;

      // Сразу применяем состояние окна при изменении настроек
      const win = await getCurrentWindow();
      await win.setAlwaysOnTop(value.alwaysOnTop);
    });

    handleResize();
    window.addEventListener("resize", handleResize);

    // Ставим таймер до полуночи
    let midnightTimerId = setTimeout(() => {
      currentTime = new Date(); // принудительно обновляем дату, что триггернет пересчёт today

      // Сразу ставим таймер на следующую полночь
      midnightTimerId = startMidnightTimer();
    }, getMillisecondsToMidnight());

    function startMidnightTimer() {
      return setTimeout(() => {
        currentTime = new Date();
        midnightTimerId = startMidnightTimer(); // рекурсивно продолжаем на каждый следующий день
      }, getMillisecondsToMidnight());
    }

    // Отписка при размонтировании
    return () => {
      unsubscribeTasks();
      unsubscribeSettings();
      clearTimeout(midnightTimerId);
      window.removeEventListener("resize", handleResize);
    };
  });

  // Функция расчёта миллисекунд до следующей полуночи
  function getMillisecondsToMidnight(bufferMs = 1000) {
    // 1 секунда запаса
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setHours(24, 0, 0, 0);
    return tomorrow.getTime() - now.getTime() + bufferMs;
  }

  /*
    Эффект для автоматического удаления выполненных задач
    Срабатывает при изменении списка задач или настроек
    Удаляет задачи, выполненные более autoDeleteDays дней назад
  */
  $effect(() => {
    if (tasks.length === 0) return;

    const now = new Date();
    const updatedTasks = tasks.filter((task) => {
      if (task.completed && task.completedAt) {
        const completedDate = new Date(task.completedAt);
        const daysDiff = Math.floor(
          (now.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        return daysDiff < settings.autoDeleteDays;
      }
      return true;
    });

    // Если задачи были удалены - показываем уведомление
    if (updatedTasks.length !== tasks.length) {
      const deletedCount = tasks.length - updatedTasks.length;
      tasksStore.set(updatedTasks);
      toastStore.add({
        title: "Авто удаление задач",
        description: `Удалено ${deletedCount} выполненных задач.`,
        variant: "default",
      });
    }
  });

  /*
    Добавление новой задачи
    - Генерирует уникальный ID на основе времени
    - Добавляет задачу в хранилище
    - Показывает уведомление об успешном создании
  */
  function addTask(task: Omit<Task, "id">) {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
    };

    tasksStore.update((currentTasks) => [...currentTasks, newTask]);

    toastStore.add({
      title: "Новая задача",
      description: `Задача "${newTask.title}" успешно создана.`,
      variant: "default",
    });
  }

  /*
    Обновление существующей задачи
    - Находит задачу по ID и заменяет ее данные
    - Показывает уведомление об успешном обновлении
  */
  function updateTask(updatedTask: Task) {
    tasksStore.update((currentTasks) =>
      currentTasks.map((task) =>
        task.id === updatedTask.id ? updatedTask : task,
      ),
    );

    toastStore.add({
      title: "Изменение задачи",
      description: `Задача "${updatedTask.title}" успешно изменена.`,
      variant: "default",
    });
  }

  /*
    Удаление задачи
    - Удаляет задачу из хранилища по ID
    - Показывает уведомление об удалении
  */
  function deleteTask(id: string) {
    const taskToRemove = tasks.find((task) => task.id === id);
    tasksStore.update((currentTasks) =>
      currentTasks.filter((task) => task.id !== id),
    );

    if (taskToRemove) {
      toastStore.add({
        title: "Удаление задачи",
        description: `Задача "${taskToRemove.title}" успешно удалена.`,
        variant: "destructive",
      });
    }
  }

  /*
    Переключение статуса выполнения задачи
    - Инвертирует статус completed
    - Устанавливает время выполнения при отметке как выполненная
    - Показывает соответствующее уведомление
  */
  function toggleTask(id: string) {
    let updatedTask: Task | undefined;

    tasksStore.update((currentTasks) =>
      currentTasks.map((task) => {
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
      }),
    );

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
    Управление модальными окнами
  */

  // Открытие модального окна редактирования задачи
  function openEditModal(task: Task) {
    editingTask = task;
    isTaskModalOpen = true;
  }

  // Закрытие модального окна задачи
  function closeTaskModal() {
    isTaskModalOpen = false;
    editingTask = null;
  }

  // Открытие диалога подтверждения удаления
  function openDeleteDialog(task: Task) {
    taskToDelete = task;
    isDeleteDialogOpen = true;
  }

  // Подтверждение удаления задачи
  function confirmDelete() {
    if (taskToDelete) {
      deleteTask(taskToDelete.id);
      taskToDelete = null;
      isDeleteDialogOpen = false;
    }
  }

  // Отмена удаления задачи
  function cancelDelete() {
    taskToDelete = null;
    isDeleteDialogOpen = false;
  }

  /*
    Сохранение настроек приложения
    - Обновляет хранилище настроек
    - Показывает уведомление об успешном сохранении
  */
  function saveSettings(newSettings: AppSettings) {
    settingsStore.set(newSettings);
    toastStore.add({
      title: "Настройки успешно сохранены",
      description: "Изменения успешно применены.",
      variant: "default",
    });
  }

  /*
    Фильтрация задач по категориям
    Все категории используют $derived для реактивности
  */

  // Текущая дата (нормализованная)
  const today = $derived.by(() => {
    const date = new Date(currentTime);
    date.setHours(0, 0, 0, 0);
    return date;
  });

  // Выполненные задачи
  const completedTasks = $derived(
    tasks
      .filter((task) => task.completed)
      .sort(
        (a, b) =>
          new Date(b.completedAt!).getTime() -
          new Date(a.completedAt!).getTime(),
      ),
  );

  // Просроченные задачи (отсортированные от старых к новым)
  const overdueTasks = $derived(
    tasks
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
    tasks
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
    tasks
      .filter((task) => {
        if (task.completed) return false;
        const taskDate = new Date(task.date);
        taskDate.setHours(0, 0, 0, 0);
        const daysDiff = Math.floor(
          (taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );
        return daysDiff > 0 && daysDiff <= settings.futureDays;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
  );

  /*
    Обработчик сохранения задачи
    - Определяет, нужно ли создать новую или обновить существующую
    - Вызывает соответствующую функцию
  */
  async function handleSave(task: Task | Omit<Task, "id">) {
    if ("id" in task) {
      updateTask(task as Task);
    } else {
      addTask(task);
    }
  }

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
        <AlwaysOnTop />
        <ThemeToggle />

        <Tooltip.Provider delayDuration={1000}>
          <Tooltip.Root>
            <Tooltip.Trigger
              onclick={() => (isSettingsModalOpen = true)}
              class={`transition-all duration-300 ${buttonVariants({ variant: "outline" })}`}
            >
              <Settings class="h-4 w-4" />
            </Tooltip.Trigger>

            <Tooltip.Content>
              <p>Настройки</p>
            </Tooltip.Content>
          </Tooltip.Root>
        </Tooltip.Provider>

        <Tooltip.Provider delayDuration={1000}>
          <Tooltip.Root>
            <Tooltip.Trigger
              onclick={() => (isTaskModalOpen = true)}
              class={`transition-all duration-300 ${buttonVariants({ variant: "default" })}`}
            >
              <Plus class="h-4 w-4" />
              Добавить
            </Tooltip.Trigger>

            <Tooltip.Content>
              <p>Добавить новую задачу</p>
            </Tooltip.Content>
          </Tooltip.Root>
        </Tooltip.Provider>
      </div>
    </div>

    <!-- Статистические карточки -->
    <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-5">
      <!-- Карточка будущих задач -->
      <Card
        class="border-orange-300 dark:border-orange-900 bg-orange-50 dark:bg-orange-950 transition-all duration-300 hover:shadow-md dark:hover:shadow-white/10"
      >
        <CardContent class="px-6 py-0">
          <div class="flex flex-col gap-1">
            <div class="flex items-center justify-between">
              <p class="text-md text-muted-foreground">Будущие</p>
              <Clock class="h-6 w-6 text-orange-500" />
            </div>
            <p class="text-2xl font-bold">{futureTasks.length}</p>
          </div>
        </CardContent>
      </Card>

      <!-- Карточка просроченных задач -->
      <Card
        class="border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950 transition-all duration-300 hover:shadow-md dark:hover:shadow-white/10"
      >
        <CardContent class="px-6 py-0">
          <div class="flex flex-col gap-1">
            <div class="flex items-center justify-between">
              <p class="text-md text-muted-foreground">Просрочено</p>
              <CircleX class="h-6 w-6 text-red-500" />
            </div>
            <p class="text-2xl font-bold">{overdueTasks.length}</p>
          </div>
        </CardContent>
      </Card>

      <!-- Карточка задач на сегодня -->
      <Card
        class="border-blue-300 dark:border-blue-900 bg-blue-50 dark:bg-blue-950 transition-all duration-300 hover:shadow-md dark:hover:shadow-white/10"
      >
        <CardContent class="px-6 py-0">
          <div class="flex flex-col gap-1">
            <div class="flex items-center justify-between">
              <p class="text-md text-muted-foreground">На сегодня</p>
              <Calendar class="h-6 w-6 text-blue-500" />
            </div>
            <p class="text-2xl font-bold">{todayTasks.length}</p>
          </div>
        </CardContent>
      </Card>

      <!-- Карточка выполненных задач -->
      <Card
        class="border-green-300 dark:border-green-900 bg-green-50 dark:bg-green-950 transition-all duration-300 hover:shadow-md dark:hover:shadow-white/10"
      >
        <CardContent class="px-6 py-0">
          <div class="flex flex-col gap-1">
            <div class="flex items-center justify-between">
              <p class="text-md text-muted-foreground">Выполнено</p>
              <CircleCheckBig class="h-6 w-6 text-green-500" />
            </div>
            <p class="text-2xl font-bold">{completedTasks.length}</p>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Разделы с задачами -->
    <div class="grid gap-4 grid-cols-1 xl:grid-cols-3">
      {#if !isSingleColumn || futureTasks.length > 0}
        <!-- Будущие задачи -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Clock class="h-5 w-5 text-orange-500" />
              Ближайшие задачи
              <Badge variant="secondary">{futureTasks.length}</Badge>
              {#if isSingleColumn}
                <ArrowDown class="h-5 w-5" />
              {:else}
                <ArrowRight class="h-5 w-5" />
              {/if}
            </CardTitle>
          </CardHeader>
          <CardContent class="px-4">
            <div class="space-y-2">
              {#each futureTasks as task (task.id)}
                <TaskItem
                  {task}
                  onToggle={toggleTask}
                  onEdit={openEditModal}
                  onDelete={openDeleteDialog}
                />
              {/each}
            </div>
          </CardContent>
        </Card>
      {/if}

      <!-- Задачи на сегодня -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
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
          </CardTitle>
        </CardHeader>
        <CardContent class="px-4">
          {#if overdueTasks.length === 0 && todayTasks.length === 0}
            <p class="text-muted-foreground text-center py-8">
              На сегодня задач нет. Отличная работа! 🎉
            </p>
          {/if}

          <!-- Просроченные и сегодняшние задачи -->
          <div class="space-y-2">
            {#each [...overdueTasks, ...todayTasks] as task (task.id)}
              <TaskItem
                {task}
                onToggle={toggleTask}
                onEdit={openEditModal}
                onDelete={openDeleteDialog}
              />
            {/each}
          </div>
        </CardContent>
      </Card>

      <!-- Выполненные задачи -->
      {#if !isSingleColumn || completedTasks.length > 0}
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <CircleCheckBig class="h-5 w-5 text-green-500" />
              Выполненные задачи
              <Badge variant="secondary">{completedTasks.length}</Badge>
              {#if isSingleColumn}
                <ArrowDown class="h-5 w-5" />
              {:else}
                <ArrowRight class="h-5 w-5" />
              {/if}
            </CardTitle>
          </CardHeader>
          <CardContent class="px-4">
            <div class="space-y-2">
              {#each completedTasks as task (task.id)}
                <TaskItem
                  {task}
                  onToggle={toggleTask}
                  onEdit={openEditModal}
                  onDelete={openDeleteDialog}
                />
              {/each}
            </div>
          </CardContent>
        </Card>
      {/if}
    </div>

    <!-- Модальные окна -->
    <TaskModal
      isOpen={isTaskModalOpen}
      onClose={closeTaskModal}
      onSave={handleSave}
      task={editingTask}
    />

    <SettingsModal
      isOpen={isSettingsModalOpen}
      onClose={() => (isSettingsModalOpen = false)}
      {settings}
      onSave={saveSettings}
    />

    <!-- Диалог подтверждения удаления -->
    <DeleteConfirmDialog
      isOpen={isDeleteDialogOpen}
      onConfirm={confirmDelete}
      onCancel={cancelDelete}
      taskTitle={taskToDelete?.title || ""}
    />

    <!-- Toast уведомления -->
  </div>
</div>
