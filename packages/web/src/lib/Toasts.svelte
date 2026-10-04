<script lang="ts">
  import { fly } from 'svelte/transition';
  import { toasts, dismissToast } from '$lib/toasts.js';
</script>

<div class="toasts" aria-live="polite">
  {#each $toasts as toast (toast.id)}
    <div class="toast {toast.kind}" role={toast.kind === 'error' ? 'alert' : 'status'} transition:fly={{ y: 20, duration: 200 }}>
      <span>
        {toast.message}
        {#if toast.link}
          <a href={toast.link.href} onclick={() => dismissToast(toast.id)}>{toast.link.label}</a>
        {/if}
      </span>
      <button type="button" class="close" aria-label="Dismiss" onclick={() => dismissToast(toast.id)}>×</button>
    </div>
  {/each}
</div>

<style>
  .toasts {
    position: fixed;
    bottom: 1em;
    left: 50%;
    transform: translateX(-50%);
    z-index: 200;
    display: flex;
    flex-direction: column;
    gap: 0.5em;
    width: min(480px, calc(100% - 2em));
    pointer-events: none;
  }

  .toast {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1em;
    padding: 0.6em 0.8em;
    background: var(--nav-bg);
    color: var(--nav-link);
    border: 1px solid var(--nav-border);
    border-left: 4px solid #3a9a5b;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
    pointer-events: auto;
  }

  .toast.error {
    border-left-color: var(--danger);
  }

  .toast a {
    color: inherit;
    font-weight: 600;
  }

  .close {
    flex: none;
    background: transparent;
    border: none;
    color: inherit;
    font-size: 1.2em;
    line-height: 1;
    cursor: pointer;
    padding: 0 0.2em;
  }
</style>
