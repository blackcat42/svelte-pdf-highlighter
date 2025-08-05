<script lang="ts">
    //providing context
    import type { Snippet } from 'svelte';
    
    interface HighlightChildrenWrapperProps {
        child_context: any;
        children: Snippet;
    }

    import { setContext } from 'svelte';
    let { child_context, children }: HighlightChildrenWrapperProps = $props();
    setContext('highlightUtils', child_context);

    $effect.pre(() => {
        //TODO: remove effects and keys, force remount whole layer (when scale or highlights[page_number] change) instead
        setContext('highlightUtils', child_context);
    });
</script>

{#key child_context}
    {@render children?.()}
{/key}