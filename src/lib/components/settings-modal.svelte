<script lang="ts">
  import { Settings, Trash2, Clock } from "lucide-svelte";
  import { Button, buttonVariants } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import { Switch } from "$lib/components/ui/switch/index.js";
  import * as Tooltip from "$lib/components/ui/tooltip/index.js";
  import { toastStore } from "$lib/stores/toast-store"; // Уведомления
  import { slide } from "svelte/transition";
  import {
    settings,
    isSettingsModalOpen,
    currentPass,
    isPinModalOpen,
  } from "$lib/stores/app-state";
  import { get, writable } from "svelte/store";
  import PinModal from "$lib/components/pin-modal.svelte"; // Модальное окно ПИН кода

  // Локальные копии полей
  let autoDeleteDays = writable(7);
  let futureDays = writable(7);
  let saveWindowState = writable(false);
  let encryptTasks = writable(false);

  let isSavePending = false; // флаг для ожидания завершения работы с пин-кодом

  // Ошибки
  let autoDeleteError = writable("");
  let futureDaysError = writable("");

  $: if ($isSettingsModalOpen) {
    // При открытии модалки загружаем актуальные настройки
    const s = get(settings);
    autoDeleteDays.set(s.autoDeleteDays);
    futureDays.set(s.futureDays);
    saveWindowState.set(s.saveWindowState ?? false);
    encryptTasks.set(s.encryptTasks ?? false);

    autoDeleteError.set("");
    futureDaysError.set("");
  }

  function validate() {
    let valid = true;
    const autoDelete = Number(get(autoDeleteDays));
    if (autoDelete < 1 || autoDelete > 365) {
      autoDeleteError.set("Введите число от 1 до 365");
      valid = false;
    } else {
      autoDeleteError.set("");
    }

    const futureD = Number(get(futureDays));
    if (futureD < 1 || futureD > 365) {
      futureDaysError.set("Введите число от 1 до 365");
      valid = false;
    } else {
      futureDaysError.set("");
    }

    return valid;
  }

  function preSaveSettings() {
    if (!validate()) return;

    const pin = get(currentPass);

    if (get(encryptTasks) && !pin) {
      $isPinModalOpen = true;
      isSavePending = true;
      return;
    }

    if (!get(encryptTasks) && pin) {
      $isPinModalOpen = true;
      isSavePending = true;
      return;
    }

    saveSettings();
  }

  function saveSettings() {
    if (!validate()) return;

    settings.update((s) => ({
      ...s,
      autoDeleteDays: Number(get(autoDeleteDays)),
      futureDays: Number(get(futureDays)),
      saveWindowState: get(saveWindowState),
      encryptTasks: get(encryptTasks),
    }));

    toastStore.add({
      title: "Настройки успешно сохранены",
      description: "Изменения успешно применены.",
      variant: "default",
    });

    isSettingsModalOpen.set(false);
  }

  function closeSettings() {
    const s = get(settings);
    autoDeleteDays.set(s.autoDeleteDays);
    futureDays.set(s.futureDays);
    saveWindowState.set(s.saveWindowState ?? false);
    encryptTasks.set(s.encryptTasks ?? false);

    autoDeleteError.set("");
    futureDaysError.set("");

    isSettingsModalOpen.set(false);
  }

  function handleOpenAutoFocus(event: Event) {
    event.preventDefault(); // предотвращаем автофокус
  }

  function handlePinCancel() {
    isSavePending = false;
    encryptTasks.update((value) => !value);
    isPinModalOpen.set(false);
  }
</script>

<Tooltip.Provider delayDuration={1000}>
  <Tooltip.Root>
    <Tooltip.Trigger
      onclick={() => ($isSettingsModalOpen = true)}
      class={`transition-all duration-300 ${buttonVariants({ variant: "outline" })}`}
    >
      <Settings class="h-4 w-4" />
      <Dialog.Root open={$isSettingsModalOpen} onOpenChange={closeSettings}>
        <Dialog.Content
          class="sm:max-w-md"
          onOpenAutoFocus={handleOpenAutoFocus}
        >
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
                bind:value={$autoDeleteDays}
                class="transition-all w-20 duration-300"
              />
              <span class="pl-3 pr-1">дней.</span>
            </div>
          </div>
          {#if $autoDeleteError}
            <div
              transition:slide={{ duration: 500 }}
              class="text-red-500 text-sm pl-1"
            >
              {$autoDeleteError}
            </div>
          {/if}
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
                bind:value={$futureDays}
                class="transition-all w-20 duration-300"
              />
              <span class="pl-3 pr-1">дней.</span>
            </div>
          </div>
          {#if $futureDaysError}
            <div
              transition:slide={{ duration: 500 }}
              class="text-red-500 text-sm pl-1"
            >
              {$futureDaysError}
            </div>
          {/if}
          <Dialog.Description class="pl-1">
            Показывать будущие задачи на указанное количество дней вперед.
          </Dialog.Description>

          <Separator />

          <div class="flex items-center justify-between">
            <span class="pl-1">Сохранять и восстанавливать состояние окна</span>
            <Switch bind:checked={$saveWindowState} />
          </div>

          <!-- <Dialog.Description class="pl-1">
      При запуске, приложение будет восстанавливать размер и положение окна.
    </Dialog.Description> -->

          <!-- <Separator /> -->

          <div class="flex items-center justify-between">
            <span class="pl-1">Включить шифрование задач c (ПИН) кодом.</span>
            <Switch bind:checked={$encryptTasks} />
          </div>

          <!-- <Dialog.Description class="pl-1">
      При запуске, приложение будет запрашивать (ПИН КОД) для доступа к задачам.
    </Dialog.Description> -->

          <Separator />

          <!-- Кнопки действий -->
          <div class="flex gap-4">
            <Button
              variant="outline"
              onclick={closeSettings}
              class="flex-1 transition-all duration-300"
            >
              Отмена
            </Button>
            <Button
              onclick={preSaveSettings}
              class="flex-1 transition-all duration-300"
            >
              Сохранить
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Root>
    </Tooltip.Trigger>
    <Tooltip.Content>
      <p>Настройки</p>
    </Tooltip.Content>
  </Tooltip.Root>
</Tooltip.Provider>

<PinModal
  bind:open={$isPinModalOpen}
  {isSavePending}
  on:success={() => {
    saveSettings();
    isSavePending = false;
  }}
  on:cancel={handlePinCancel}
/>
