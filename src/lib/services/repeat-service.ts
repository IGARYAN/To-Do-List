import type { TypesRepeatTemplate } from "$lib/types/types-repeat-template";
import type { TypesTask } from "$lib/types/types-task";
import { taskStore } from "$lib/stores/task-store.svelte";
import { settingsStore } from "$lib/stores/settings-store.svelte";
import { v4 as uuidv4 } from "uuid";

/**
 * Вычисляет все даты повторения шаблона в заданном диапазоне
 */
function getDatesInRange(
    template: TypesRepeatTemplate,
    from: Date,
    to: Date
): Date[] {
    const dates: Date[] = [];
    const current = new Date(from);
    current.setHours(0, 0, 0, 0);

    if (template.type === 'weekly' && template.weekDays?.length) {
        // Перебираем каждый день в диапазоне и проверяем день недели
        while (current <= to) {
            // getDay() возвращает 0=вс, 1=пн...6=сб
            // Приводим к формату 1=пн...7=вс
            const dayOfWeek = current.getDay() === 0 ? 7 : current.getDay();
            if (template.weekDays.includes(dayOfWeek)) {
                dates.push(new Date(current));
            }
            current.setDate(current.getDate() + 1);
        }
    }

    if (template.type === 'monthly' && template.monthDay) {
        // Перебираем каждый месяц в диапазоне
        while (current <= to) {
            if (current.getDate() === template.monthDay) {
                dates.push(new Date(current));
            }
            current.setDate(current.getDate() + 1);
        }
    }

    if (template.type === 'monthly') {
        while (current <= to) {
            if (template.lastDayOfMonth) {
                // Последний день месяца — проверяем что завтра уже другой месяц
                const tomorrow = new Date(current);
                tomorrow.setDate(tomorrow.getDate() + 1);
                if (tomorrow.getMonth() !== current.getMonth()) {
                    dates.push(new Date(current));
                }
            } else if (template.monthDay && current.getDate() === template.monthDay) {
                dates.push(new Date(current));
            }
            current.setDate(current.getDate() + 1);
        }
    }

    if (template.type === 'yearly' && template.yearMonth && template.yearDay) {
        // Перебираем каждый день в диапазоне
        while (current <= to) {
            if (
                current.getMonth() + 1 === template.yearMonth &&
                current.getDate() === template.yearDay
            ) {
                dates.push(new Date(current));
            }
            current.setDate(current.getDate() + 1);
        }
    }

    return dates;
}

/**
 * Проверяет существует ли уже задача из этого шаблона на указанную дату
 */
function taskExistsForDate(
    templateId: string,
    date: Date,
    tasks: TypesTask[]
): boolean {
    return tasks.some(task => {
        if (task.repeatTemplateId !== templateId) return false;
        const taskDate = new Date(task.date);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === date.getTime();
    });
}

/**
 * Основная функция генерации задач из шаблонов
 * Вызывается при старте, в полночь и при изменении futureDays
 */
export function generateTasksFromTemplates(): void {
    const templates = taskStore.templates.filter(t => t.isActive);

    if (templates.length === 0) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Диапазон генерации — от сегодня до сегодня + futureDays
    const to = new Date(today);
    to.setDate(to.getDate() + settingsStore.settings.futureDays);

    const newTasks: TypesTask[] = [];

    for (const template of templates) {
        // Вычисляем даты для этого шаблона в диапазоне
        const dates = getDatesInRange(template, today, to);

        for (const date of dates) {
            // Проверяем что задачи на эту дату ещё нет
            if (!taskExistsForDate(template.id, date, taskStore.tasks)) {
                const newTask: TypesTask = {
                    id: uuidv4(),
                    title: template.title,
                    description: template.description,
                    color: template.color,
                    date: date.toISOString(),
                    completed: false,
                    repeatTemplateId: template.id,
                };
                newTasks.push(newTask);
                console.log(`[RepeatService] Создана задача "${template.title}" на ${date.toLocaleDateString('ru-RU')}`);
            }
        }
    }

    if (newTasks.length > 0) {
        // Добавляем все новые задачи за один раз
        taskStore.tasks = [...taskStore.tasks, ...newTasks];
        console.log(`[RepeatService] Сгенерировано задач: ${newTasks.length}`);
    }
}