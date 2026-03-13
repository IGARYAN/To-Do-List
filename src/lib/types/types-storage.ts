import type { TypesTask } from "$lib/types/types-task";
import type { TypesRepeatTemplate } from "$lib/types/types-repeat-template";

/**
 * Тип для хранилища данных (tasks.json)
 */
export type TypesStorage = {
    templates: TypesRepeatTemplate[];
    tasks: TypesTask[];
}