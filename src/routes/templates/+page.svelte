<script lang="ts">
    import RepeatTemplatesList from "$lib/components/repeat-templates-list-modal.svelte";
    import RepeatTemplateModal from "$lib/components/repeat-template-modal.svelte";
    import { appStateStore } from "$lib/stores/app-state.svelte";
    import { buttonVariants } from "$lib/components/ui/button";
    import { ArrowLeft } from "@lucide/svelte";
    import { goto } from "$app/navigation";
</script>

<div class="min-h-screen bg-background transition-colors duration-300">
    <div class="w-full px-4 py-4">
        <!-- Заголовок -->
        <div class="flex items-center gap-3 mb-4">
            <button
                onclick={() => goto("/")}
                class={buttonVariants({ variant: "outline", size: "icon" })}
            >
                <ArrowLeft class="h-4 w-4" />
            </button>
            <h1 class="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Шаблоны задач
            </h1>
        </div>

        <!-- Список шаблонов -->
        <RepeatTemplatesList />
    </div>
</div>

{#if appStateStore.isTemplateModalOpen}
    <RepeatTemplateModal />
{/if}