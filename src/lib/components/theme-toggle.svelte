<script lang="ts">
  import { Moon, Sun, Monitor } from "@lucide/svelte";
  import { buttonVariants } from "$lib/components/ui/button";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import * as Tooltip from "$lib/components/ui/tooltip/index.js";
  import { themeStore } from "$lib/stores/theme-store";
  import { settingsStore } from "$lib/stores/settings-store.svelte";

  type Theme = "light" | "dark" | "system";

  // Внутреннее состояние для RadioGroup
  let selected: Theme = $state("system");

  // Последнее значение темы, полученное ИМЕННО из settingsStore.
  // Это обычная переменная (не реактивная), чтобы:
  // 1) не добавлять лишние зависимости в $effect,
  // 2) не перезаписывать выбор пользователя до применения в store.
  let lastThemeFromSettings: Theme | null = null;

  // Синхронизируем local state <- settingsStore.
  // КРИТИЧНО: этот эффект НЕ должен зависеть от `selected`,
  // иначе при выборе пункта в меню значение может откатиться назад
  // до того, как успеет выполниться применение темы.
  $effect(() => {
    const themeFromSettings = settingsStore.settings.theme as Theme;

    if (themeFromSettings !== lastThemeFromSettings) {
      console.log("[ThemeToggle] [SyncFromSettings] Обновляем selected из settingsStore", {
        previousThemeFromSettings: lastThemeFromSettings,
        nextThemeFromSettings: themeFromSettings,
      });

      lastThemeFromSettings = themeFromSettings;
      selected = themeFromSettings;
    }
  });

  // Синхронизируем settingsStore/themeStore <- local state.
  // Защита от цикла:
  // - если selected уже равен settingsStore.settings.theme, ничего не делаем;
  // - запись в settingsStore выполняется только внутри themeStore.set().
  $effect(() => {
    const themeFromSettings = settingsStore.settings.theme as Theme;

    if (selected === themeFromSettings) {
      console.log("[ThemeToggle] [ApplyTheme] Пропуск: selected уже синхронизирован", {
        selected,
      });
      return;
    }

    console.log("[ThemeToggle] [ApplyTheme] Применяем новую тему", {
      previousTheme: themeFromSettings,
      nextTheme: selected,
    });

    // themeStore.set() сам обновляет settingsStore,
    // поэтому дублирующий settingsStore.set() здесь не нужен.
    themeStore.set(selected);
  });
</script>

<Tooltip.Provider delayDuration={1000}>
  <Tooltip.Root>
    <Tooltip.Trigger
      class="transition-all duration-300 relative"
    >
      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          class={`transition-all duration-300 relative ${buttonVariants({ variant: "outline", size: "icon" })}`}
          aria-label="Переключить тему"
        >
          <Sun
            class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
          />
          <Moon
            class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
          />
        </DropdownMenu.Trigger>

        <DropdownMenu.Content>
          <DropdownMenu.RadioGroup bind:value={selected}>
            <DropdownMenu.RadioItem value="light">
              <Sun class="mr-2 h-4 w-4" />
              Светлая
            </DropdownMenu.RadioItem>

            <DropdownMenu.RadioItem value="dark">
              <Moon class="mr-2 h-4 w-4" />
              Темная
            </DropdownMenu.RadioItem>

            <DropdownMenu.RadioItem value="system">
              <Monitor class="mr-2 h-4 w-4" />
              Системная
            </DropdownMenu.RadioItem>
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </Tooltip.Trigger>
    <Tooltip.Content><p>Тема оформления</p></Tooltip.Content>
  </Tooltip.Root>
</Tooltip.Provider>
