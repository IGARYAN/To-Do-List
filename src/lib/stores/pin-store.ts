import { writable } from "svelte/store";

export const pinStore = writable<string | null>(null);
