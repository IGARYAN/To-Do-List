<script lang="ts">
  import { Settings, Trash2, Clock } from "lucide-svelte";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import { Switch } from "$lib/components/ui/switch/index.js";
  import type { AppSettings } from "$lib/types/task";
  import { slide } from "svelte/transition";

  // Пропсы компонента
  let {
    isOpen,
    onClose,
    settings,
    onSave,
  }: {
    isOpen: boolean; // Открыто ли модальное окно
    onClose: () => void; // Функция закрытия окна
    settings: AppSettings; // Текущие настройки
    onSave: (settings: AppSettings) => void; // Функция сохранения настроек
  } = $props();

  // Локальные состояния для настроек
  let autoDeleteDays = $state(settings.autoDeleteDays);
  let futureDays = $state(settings.futureDays);
  let saveWindowState = $state(settings.saveWindowState ?? false);

  // Ошибки валидации
  let errors = $state({
    autoDeleteDays: "",
    futureDays: "",
  });

  // Синхронизируем локальные состояния с пропсами при открытии
  $effect(() => {
    if (isOpen) {
      saveWindowState = settings.saveWindowState ?? false;
      autoDeleteDays = settings.autoDeleteDays;
      futureDays = settings.futureDays;
      Object.assign(errors, { autoDeleteDays: "", futureDays: "" });
    }
  });

  /**
   * Обработчик сохранения настроек
   * Сохраняем настройки с валидацией минимальных значений
   */
  function handleSave() {
    if (!validateForm()) return;
    const newSettings = {
      ...settings,
      autoDeleteDays: Math.max(1, Number(autoDeleteDays)),
      futureDays: Math.max(1, Number(futureDays)),
      saveWindowState: saveWindowState, // сохраняем флаг
    };

    onSave(newSettings);
    onClose();
  }

  /**
   * Обработчик закрытия без сохранения
   * Возвращает исходные значения
   */
  function handleClose() {
    autoDeleteDays = settings.autoDeleteDays;
    futureDays = settings.futureDays;
    onClose();
  }

  function validateField(value: number, field: keyof typeof errors): boolean {
    value = Number(value);
    const message =
      isNaN(value) || value < 1 || value > 365
        ? "Введите число от 1 до 365"
        : "";

    errors[field] = message; // ✅ сохраняем реактивность
    return message === "";
  }

  function validateForm(): boolean {
    let isValid = true;
    let firstInvalidFieldId: string | null = null;

    if (!validateField(autoDeleteDays, "autoDeleteDays")) {
      isValid = false;
      firstInvalidFieldId ??= "autoDeleteDays";
    }

    if (!validateField(futureDays, "futureDays")) {
      isValid = false;
      firstInvalidFieldId ??= "futureDays";
    }

    // Автофокус на первом невалидном поле
    if (firstInvalidFieldId) {
      const el = document.getElementById(firstInvalidFieldId);
      el?.focus();
    }

    return isValid;
  }

  function handleOpenAutoFocus(event: Event) {
    event.preventDefault(); // предотвращаем автофокус
  }
</script>

<Dialog.Root open={isOpen} onOpenChange={handleClose}>
  <Dialog.Content class="sm:max-w-md" onOpenAutoFocus={handleOpenAutoFocus}>
    <Dialog.Header>
      <Dialog.Title class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Settings class="h-5 w-5" />
          Настройки
        </div>
      </Dialog.Title>
    </Dialog.Header>

    <Separator class="py-0" />

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
          bind:value={autoDeleteDays}
          class="transition-all w-20 duration-300"
        />
        <span class="pl-3 pr-1">дней.</span>
      </div>
    </div>
    {#if errors.autoDeleteDays}
      <div
        transition:slide={{ duration: 500 }}
        class="text-red-500 text-sm pl-1"
      >
        {errors.autoDeleteDays}
      </div>
    {/if}
    <Dialog.Description class="pl-1">
      Выполненные задачи будут автоматически удаляться через указанное
      количество дней.
    </Dialog.Description>

    <Separator class="py-0" />

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
          bind:value={futureDays}
          class="transition-all w-20 duration-300"
        />
        <span class="pl-3 pr-1">дней.</span>
      </div>
    </div>
    {#if errors.futureDays}
      <div
        transition:slide={{ duration: 500 }}
        class="text-red-500 text-sm pl-1"
      >
        {errors.futureDays}
      </div>
    {/if}
    <Dialog.Description class="pl-1">
      Показывать будущие задачи на указанное количество дней вперед.
    </Dialog.Description>

    <Separator class="py-0" />

    <div class="flex items-center justify-between">
      <span class="pl-1">Сохранять состояние окна</span>
      <Switch bind:checked={saveWindowState} />
    </div>

    <Dialog.Description class="pl-1">
      При запуске, приложение будет восстанавливать размер и положение окна.
    </Dialog.Description>

    <Separator class="py-0" />

    <!-- Кнопки действий -->
    <div class="flex gap-4">
      <Button
        variant="outline"
        onclick={handleClose}
        class="flex-1 transition-all duration-300"
      >
        Отмена
      </Button>
      <Button onclick={handleSave} class="flex-1 transition-all duration-300">
        Сохранить
      </Button>
    </div>
  </Dialog.Content>
</Dialog.Root>
