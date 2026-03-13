/**
 * Тип для шаблона повторяющейся задачи
 */
export type RepeatType = 'weekly' | 'monthly' | 'yearly';

export type TypesRepeatTemplate = {
    // Уникальный ID шаблона
    id: string;

    // Основные поля задачи
    title: string;
    description?: string;
    color?: string;

    // Тип повторения
    type: RepeatType;

    // Для weekly: дни недели [1-7] где 1=пн, 7=вс
    weekDays?: number[];

    // Для monthly: число месяца [1-31]
    monthDay?: number;
    lastDayOfMonth?: boolean; // если true — игнорируем monthDay и берём последний день

    // Для yearly: месяц [1-12] и число [1-31]
    yearMonth?: number;
    yearDay?: number;

    // Активен ли шаблон (можно приостановить без удаления)
    isActive: boolean;

    // Дата создания шаблона
    createdAt: string;
}