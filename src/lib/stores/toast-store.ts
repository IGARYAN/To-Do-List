import { writable } from "svelte/store"
import type { TypesToast } from "$lib/types/types-toast"

/**
 * Store для управления Toast уведомлениями
 */
function createToastStore() {
  const { subscribe, update } = writable<TypesToast[]>([])

  return {
    subscribe,
    /**
     * Добавление нового уведомления
     */
    add: (toast: Omit<TypesToast, "id">) => {
      const id = Date.now().toString()
      const newToast: TypesToast = { ...toast, id }

      update((toasts) => [...toasts, newToast])

      // Автоматически удаляем уведомление через 5 секунд
      setTimeout(() => {
        update((toasts) => toasts.filter((t) => t.id !== id))
      }, 10000)

      return id
    },
    /**
     * Удаление уведомления по ID
     */
    remove: (id: string) => {
      update((toasts) => toasts.filter((t) => t.id !== id))
    },
    /**
     * Очистка всех уведомлений
     */
    clear: () => {
      update(() => [])
    },
  }
}

export const toastStore = createToastStore()
