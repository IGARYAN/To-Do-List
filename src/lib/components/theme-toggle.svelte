<script lang="ts">
  import { Moon, Sun, Monitor } from "lucide-svelte";
  import { Button } from "$lib/components/ui/button";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import { themeStore } from "$lib/stores/theme-store";
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
  $: themeStore.set(selected);
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    <Button
      variant="outline"
      size="icon"
      class="transition-all duration-200 relative"
      aria-label="Переключить тему"
    >
      <Sun
        class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
      />
      <Moon
        class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
      />
    </Button>
  </DropdownMenu.Trigger>

  <DropdownMenu.Content align="end">
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
