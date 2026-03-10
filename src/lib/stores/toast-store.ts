import { writable } from "svelte/store"
import type { TypesToast } from "$lib/types/types-toast"

/**
 * Store для управления Toast уведомлениями
 */
function createToastStore() {
    const { subscribe, update } = writable<TypesToast[]>([])
    const timers = new Map<string, ReturnType<typeof setTimeout>>()

    return {
        subscribe,
        /**
         * Добавление нового уведомления
         */
        add: (toast: Omit<TypesToast, "id">) => {
            const id = Date.now().toString()
            const newToast: TypesToast = { ...toast, id }
            update((toasts) => [...toasts, newToast])

            // Сохраняем таймер чтобы можно было отменить при ручном удалении
            const timer = setTimeout(() => {
                update((toasts) => toasts.filter((t) => t.id !== id))
                timers.delete(id)
            }, 10000)

            timers.set(id, timer)
            return id
        },
        /**
         * Удаление уведомления по ID
         */
        remove: (id: string) => {
            // Отменяем таймер если тост удаляется вручную
            const timer = timers.get(id)
            if (timer) {
                clearTimeout(timer)
                timers.delete(id)
            }
            update((toasts) => toasts.filter((t) => t.id !== id))
        },
        /**
         * Очистка всех уведомлений
         */
        clear: () => {
            // Отменяем все таймеры
            timers.forEach((timer) => clearTimeout(timer))
            timers.clear()
            update(() => [])
        },
    }
}

export const toastStore = createToastStore()
