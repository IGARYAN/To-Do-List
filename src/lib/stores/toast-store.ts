import { writable } from "svelte/store"
import type { Toast } from "$lib/types/toast"

/**
 * Store для управления Toast уведомлениями
 */
function createToastStore() {
  const { subscribe, update } = writable<Toast[]>([])

  return {
    subscribe,
    /**
     * Добавление нового уведомления
     */
    add: (toast: Omit<Toast, "id">) => {
      const id = Date.now().toString()
      const newToast: Toast = { ...toast, id }

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
