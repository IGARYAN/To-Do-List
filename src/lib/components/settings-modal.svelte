<script lang="ts">
  import { Settings, Trash2, Clock } from "@lucide/svelte";
  import { Button, buttonVariants } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import { Switch } from "$lib/components/ui/switch/index.js";
  import * as Tooltip from "$lib/components/ui/tooltip/index.js";
  import { toastStore } from "$lib/stores/toast-store"; // Уведомления
  import { settingsStore } from "$lib/stores/settings-store.svelte";
  import PasswordModal from "$lib/components/password-modal.svelte"; // Модальное окно пароля

  // Локальные копии полей
  let isSettingsModalOpen = $state(false);
  let localAutoDeleteDays = $state("");
  let localFutureDays = $state("");
  let localSaveWindowState = $state(false);

  // Флаг для детекта именно момента открытия модалки.
  // Нужен, чтобы не перезаписывать поля при каждом вводе пользователя.
  let wasSettingsModalOpen = false;

  // При открытии модалки загружаем актуальные настройки
  $effect(() => {
    // Инициализируем локальные поля только на переходе false -> true.
    // Это устраняет проблему, когда реактивный эффект сбрасывал ввод пользователя.
    if (isSettingsModalOpen && !wasSettingsModalOpen) {
      localAutoDeleteDays = String(settingsStore.settings.autoDeleteDays);
      localFutureDays = String(settingsStore.settings.futureDays);
      localSaveWindowState = settingsStore.settings.saveWindowState;

      console.log("[SettingsModal] Инициализация локальных полей при открытии (false -> true)", {
        autoDeleteDaysFromStore: settingsStore.settings.autoDeleteDays,
        futureDaysFromStore: settingsStore.settings.futureDays,
        saveWindowStateFromStore: settingsStore.settings.saveWindowState,
      });
    }

    wasSettingsModalOpen = isSettingsModalOpen;
  });

  function validate() {
    const autoDelete = Number(localAutoDeleteDays);
    if (isNaN(autoDelete) || autoDelete < 1 || autoDelete > 365) {
      toastStore.add({
        title: "Ошибка - Автоудаление задач",
        description: "Введите число от 1 до 365",
        variant: "destructive",
      });
      return false;
    }

    const futureD = Number(localFutureDays);
    if (isNaN(futureD) || futureD < 1 || futureD > 365) {
      toastStore.add({
        title: "Ошибка - Показ ближайших задач",
        description: "Введите число от 1 до 365",
        variant: "destructive",
      });
      return false;
    }
    return true;
  }

  function saveSettings() {
    if (!validate()) return;

    console.log("[SettingsModal] Сохраняем настройки из локального состояния", {
      autoDeleteDays: localAutoDeleteDays,
      futureDays: localFutureDays,
      saveWindowState: localSaveWindowState,
    });
    
    // Используем метод updateSettings из стора
    settingsStore.updateSettings({
      autoDeleteDays: Number(localAutoDeleteDays),
      futureDays: Number(localFutureDays),
      saveWindowState: localSaveWindowState,
    });

    toastStore.add({
      title: "Настройки успешно сохранены",
      description: "Изменения успешно применены.",
      variant: "default",
    });

    closeSettings();
  }

  function closeSettings() {
    isSettingsModalOpen = false;
  }

  function handleOpenAutoFocus(event: Event) {
    event.preventDefault(); // предотвращаем автофокус
  }
</script>

<Tooltip.Provider delayDuration={1000}>
  <Tooltip.Root>
    <Tooltip.Trigger
      onclick={() => (isSettingsModalOpen = true)}
      class={`transition-all duration-300 ${buttonVariants({ variant: "outline", size: "icon" })}`}
    >
      <Settings class="h-4 w-4" />
    </Tooltip.Trigger>
    <Tooltip.Content>
      <p>Настройки</p>
    </Tooltip.Content>
  </Tooltip.Root>
</Tooltip.Provider>

<Dialog.Root open={isSettingsModalOpen} onOpenChange={closeSettings}>
  <Dialog.Content class="sm:max-w-md" onOpenAutoFocus={handleOpenAutoFocus}>
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
          max="365"
          autocomplete="off"
          bind:value={localAutoDeleteDays}
          class="transition-all w-20 duration-300"
        />
        <span class="pl-3 pr-1">дней.</span>
      </div>
    </div>

    <Dialog.Description class="pl-1">
      Выполненные задачи будут автоматически удаляться через указанное
      количество дней.
    </Dialog.Description>

    <Separator />

    <!-- Настройка периода отображения будущих задач -->
    <div class="flex items-center justify-between">
      <div class="pl-1 flex items-center gap-2">
        <Clock class="h-4 w-4 text-orange-500" />
        <span>Показ ближайших задач за</span>
      </div>
      <div class="flex items-center">
        <Input
          id="futureDays"
          type="number"
          min="1"
          max="365"
          autocomplete="off"
          bind:value={localFutureDays}
          class="transition-all w-20 duration-300"
        />
        <span class="pl-3 pr-1">дней.</span>
      </div>
    </div>

    <Dialog.Description class="pl-1">
      Показывать будущие задачи на указанное количество дней вперед.
    </Dialog.Description>

    <Separator />

    <div class="flex items-center justify-between">
      <span class="pl-1">Сохранять и восстанавливать состояние окна</span>
      <Switch bind:checked={localSaveWindowState} />
    </div>

    <Separator />

    <div class="flex gap-4">
      <PasswordModal />
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
