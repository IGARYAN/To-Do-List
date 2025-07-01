<script lang="ts">
  import { Moon, Sun, Monitor } from "lucide-svelte";
  import { buttonVariants } from "$lib/components/ui/button";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import * as Tooltip from "$lib/components/ui/tooltip/index.js";
  import { themeStore } from "$lib/stores/theme-store";
  import { settings } from "$lib/stores/app-state";
  import { onDestroy } from "svelte";

  // Внутреннее состояние для RadioGroup
  let selected: "light" | "dark" | "system" = "system";

  // Подписка на внешнюю тему
  const unsubscribe = themeStore.subscribe((theme) => {
    selected = theme;
  });

  onDestroy(() => {
    unsubscribe();
  });

  // Отслеживаем выбор и обновляем тему
  $: {
    themeStore.set(selected);
    settings.update(s => ({...s, theme: selected}));
  }
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
