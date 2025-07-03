<script lang="ts">
  import { onMount } from 'svelte'
  import { CheckCircle2, AlertCircle, X } from 'lucide-svelte'
  import { Button } from "$lib/components/ui/button/index.js";
  import { toastStore } from '$lib/stores/toast-store'
  import type { TypesToast } from '$lib/types/types-toast'

  // Состояние для хранения активных уведомлений
  let toasts = $state<TypesToast[]>([])

  // Подписываемся на изменения в store уведомлений
  onMount(() => {
    const unsubscribe = toastStore.subscribe((currentToasts) => {
      toasts = currentToasts
    })
    return unsubscribe
  })

  /**
   * Функция закрытия уведомления
   */
  function dismissToast(id: string) {
    toastStore.remove(id)
  }

  /**
   * Получение иконки в зависимости от типа уведомления
   */
  function getIcon(variant: TypesToast['variant']) {
    switch (variant) {
      case 'destructive':
        return AlertCircle
      default:
        return CheckCircle2
    }
  }

  /**
   * Получение стилей в зависимости от типа уведомления
   */
  function getToastStyles(variant: TypesToast['variant']) {
    switch (variant) {
      case 'destructive':
        return 'border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-50'
      default:
        return 'border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-50'
    }
  }
</script>

<!-- Контейнер для уведомлений -->
<div class="fixed bottom-4 right-4 z-500 flex flex-col gap-2 max-w-sm">
  {#each toasts as toast (toast.id)}
    {@const SvelteComponent = getIcon(toast.variant)}
    <div
      class={`p-4 rounded-lg border shadow-lg transition-all duration-300 animate-in slide-in-from-right ${getToastStyles(toast.variant)}`}
    >
      <div class="flex items-start gap-3">
        <!-- Иконка уведомления -->
        <SvelteComponent
          class="h-5 w-5 mt-0.5 flex-shrink-0"
        />

        <!-- Содержимое уведомления -->
        <div class="flex-1 min-w-0">
          {#if toast.title}
            <h4 class="font-semibold text-sm">{toast.title}</h4>
          {/if}
          {#if toast.description}
            <p class="text-sm opacity-90 mt-1">{toast.description}</p>
          {/if}
        </div>

        <!-- Кнопка закрытия -->
        <Button
          variant="ghost"
          size="icon"
          onclick={() => dismissToast(toast.id)}
          class="h-6 w-6 p-0 hover:bg-transparent opacity-70 hover:opacity-100"
        >
          <X class="h-4 w-4" />
        </Button>
      </div>
    </div>
  {/each}
</div>
