<script lang="ts">
  import { Settings, Trash2, Clock } from "@lucide/svelte";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import { Switch } from "$lib/components/ui/switch/index.js";
  import { toastStore } from "$lib/stores/toast-store"; // Уведомления
  import { settingsStore } from "$lib/stores/settings-store.svelte";
  import { appStateStore } from "$lib/stores/app-state.svelte";
  import { taskStore } from "$lib/stores/task-store.svelte";
  import {
    isEnabled as isAutostartEnabled,
    enable as enableAutostart,
    disable as disableAutostart,
  } from "@tauri-apps/plugin-autostart";

  // Локальные копии полей
  let localAutoDeleteDays = $state("");
  let localFutureDays = $state("");
  let localSaveWindowState = $state(false);
  let localAutostart = $state(false);

  // Флаг для детекта именно момента открытия модалки.
  // Нужен, чтобы не перезаписывать поля при каждом вводе пользователя.
  let wasSettingsModalOpen = false;

  // При открытии модалки загружаем актуальные настройки
  $effect(() => {
    // Инициализируем локальные поля только на переходе false -> true.
    // Это устраняет проблему, когда реактивный эффект сбрасывал ввод пользователя.
    if (appStateStore.isSettingsModalOpen && !wasSettingsModalOpen) {
      localAutoDeleteDays = String(settingsStore.settings.autoDeleteDays);
      localFutureDays = String(settingsStore.settings.futureDays);
      localSaveWindowState = settingsStore.settings.saveWindowState;
      // Загружаем текущее состояние автозапуска из системы
      isAutostartEnabled().then((enabled) => {
        localAutostart = enabled;
      });
    }
    wasSettingsModalOpen = appStateStore.isSettingsModalOpen;
  });

  // Функция валидации
  function validate() {
    const autoDelete = Number(localAutoDeleteDays);
    if (isNaN(autoDelete) || autoDelete < 1 || autoDelete > 30) {
      toastStore.add({
        title: "Ошибка - Автоудаление задач",
        description: "Введите число от 1 до 30",
        variant: "destructive",
      });
      return false;
    }

    const futureD = Number(localFutureDays);
    if (isNaN(futureD) || futureD < 1 || futureD > 30) {
      toastStore.add({
        title: "Ошибка - Показ ближайших задач",
        description: "Введите число от 1 до 30",
        variant: "destructive",
      });
      return false;
    }
    return true;
  }

  async function saveSettings() {
    if (!validate()) return;

    settingsStore.updateSettings({
      autoDeleteDays: Number(localAutoDeleteDays),
      futureDays: Number(localFutureDays),
      saveWindowState: localSaveWindowState,
    });

    // Применяем автозапуск
    try {
      if (localAutostart) {
        await enableAutostart();
      } else {
        await disableAutostart();
      }
    } catch (error) {
      console.error("[SettingsModal] Ошибка изменения автозапуска:", error);
    }

    toastStore.add({
      title: "Настройки успешно сохранены",
      description: "Изменения успешно применены.",
      variant: "default",
    });

    closeSettings();
  }

  function closeSettings() {
    appStateStore.closeSettingsModal();
  }

  function handleOpenAutoFocus(event: Event) {
    event.preventDefault(); // предотвращаем автофокус
  }
</script>

<Dialog.Root
  open={appStateStore.isSettingsModalOpen}
  onOpenChange={closeSettings}
>
  <Dialog.Content class="md:max-w-lg" onOpenAutoFocus={handleOpenAutoFocus}>
    <Dialog.Header>
      <Dialog.Title class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Settings class="h-5 w-5" />
          Настройки
        </div>
      </Dialog.Title>
    </Dialog.Header>

    <Separator />

    <!-- Настройка автоудаления выполненных задач  -->
    <div class="flex items-center justify-between">
      <div class="pl-1 flex items-center gap-2">
        <Trash2 class="h-4 w-4 text-red-500" />
        <span>Автоудаление задач через</span>
      </div>
      <div class="flex items-center">
        <Input
          id="autoDeleteDays"
          type="number"
          min="1"
          max="30"
          autocomplete="off"
          bind:value={localAutoDeleteDays}
          class="transition-all w-18 duration-300"
        />
        <span class="pl-3 pr-1">дн.</span>
      </div>
    </div>

    <Dialog.Description class="pl-1">
      Выполненные задачи будут автоматически удаляться через указанное
      количество дней. (макс. 30 дн.)
    </Dialog.Description>

    <Separator />

    <!-- Настройка периода отображения будущих задач -->
    <div class="flex items-center justify-between">
      <div class="pl-1 flex items-center gap-2">
        <Clock class="h-4 w-4 text-orange-500" />
        <span>Показывать будущие задачи за</span>
      </div>
      <div class="flex items-center">
        <Input
          id="futureDays"
          type="number"
          min="1"
          max="30"
          autocomplete="off"
          bind:value={localFutureDays}
          class="transition-all w-18 duration-300"
        />
        <span class="pl-3 pr-1">дн.</span>
      </div>
    </div>

    <Dialog.Description class="pl-1">
      Показывать будущие задачи на указанное количество дней вперед. (макс. 30
      дн.)
    </Dialog.Description>

    <Separator />

    <div class="flex items-center justify-between">
      <span class="pl-1">Сохранять и восстанавливать состояние окна</span>
      <Switch bind:checked={localSaveWindowState} />
    </div>

    <div class="flex items-center justify-between">
      <span class="pl-1">Автозапуск программы вместе с Windows</span>
      <Switch bind:checked={localAutostart} />
    </div>

    <Separator />

    <div class="flex gap-4">
      <Button
        onclick={() => appStateStore.openPasswordModal()}
        variant={taskStore.currentPass ? "default" : "outline"}
        class="flex-1 transition-all duration-300"
      >
        {#if taskStore.currentPass}
          Отключить вход с паролем
        {:else}
          Включить вход с паролем
        {/if}
      </Button>
    </div>

    <!-- Кнопки действий -->
    <div class="flex gap-4">
      <Button
        variant="outline"
        onclick={closeSettings}
        class="flex-1 transition-all duration-300"
      >
        Отмена
      </Button>
      <Button onclick={saveSettings} class="flex-1 transition-all duration-300">
        Сохранить
      </Button>
    </div>
  </Dialog.Content>
</Dialog.Root>
