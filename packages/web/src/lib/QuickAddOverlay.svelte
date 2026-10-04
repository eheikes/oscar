<script module lang="ts">
  import type { ItemType } from '$lib/types.js';

  // Types rarely change, so keep them across openings of the overlay.
  let cachedTypes: ItemType[] | null = null;
</script>

<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { createItem, getTypes } from '$lib/api.js';
  import { showToast } from '$lib/toasts.js';

  let { top = 0, onclose }: { top?: number; onclose: () => void } = $props();

  let title = $state('');
  let type = $state('');
  let types = $state<ItemType[]>(cachedTypes ?? []);
  let error = $state('');
  let titleInput: HTMLInputElement | undefined = $state();

  onMount(async () => {
    titleInput?.focus();
    if (cachedTypes !== null) return;
    try {
      cachedTypes = await getTypes();
      types = cachedTypes;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load types';
    }
  });

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!title.trim() || !type) return;
    const data = {
      title: title.trim(),
      type,
      due: null,
      labels: [],
    };
    // Close right away so the user can keep working (or add another item)
    // while the request is in flight; the result is reported via a toast.
    onclose();
    try {
      const item = await createItem(data);
      showToast({
        kind: 'success',
        message: 'Item added.',
        link: { href: `/i/${item.id}`, label: 'View the new item.' },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      showToast({ kind: 'error', message: `Failed to add "${data.title}": ${msg}` });
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onclose();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div
  class="backdrop"
  style:top="{top}px"
  role="presentation"
  onclick={(e) => { if (e.target === e.currentTarget) onclose(); }}
  transition:fade={{ duration: 150 }}
>
  <div
    class="panel"
    role="dialog"
    aria-modal="true"
    aria-labelledby="quick-add-heading"
    transition:fly={{ y: -20, duration: 150 }}
  >
    <h2 id="quick-add-heading">Add Item</h2>
    <form onsubmit={handleSubmit} class="add-form">
      <label>
        Title <span class="required">*</span>
        <input type="text" bind:value={title} bind:this={titleInput} required />
      </label>

      <label>
        Type <span class="required">*</span>
        <select bind:value={type} required>
          <option value="">— select type —</option>
          {#each types as t}
            <option value={t.id}>{t.readable}</option>
          {/each}
        </select>
      </label>

      {#if error}
        <p class="error">{error}</p>
      {/if}

      <div class="form-actions">
        <button type="submit" disabled={!title.trim() || !type}>Add Item</button>
        <button type="button" class="cancel" onclick={onclose}>Cancel</button>
        <a class="full-form" href="/add" onclick={onclose}>Use full Add Item form</a>
      </div>
    </form>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 100;
    background: rgba(0, 0, 0, 0.45);
  }

  .panel {
    width: min(520px, calc(100% - 2em));
    margin: 0 auto;
    padding: 1em 1.25em 1.25em;
    background: var(--bg);
    border: 1px solid var(--border);
    border-top: none;
    border-radius: 0 0 6px 6px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  }

  h2 {
    margin: 0 0 0.75em;
    font-size: 1.2em;
  }

  .add-form {
    display: flex;
    flex-direction: column;
    gap: 0.75em;
  }

  .add-form label {
    display: flex;
    flex-direction: column;
    gap: 0.25em;
    font-size: 0.9em;
    font-weight: 600;
    color: var(--muted-strong);
  }

  .add-form input,
  .add-form select {
    font-size: 1em;
    font-weight: normal;
    padding: 0.3em 0.5em;
    border: 1px solid var(--border);
    border-radius: 3px;
  }

  .required {
    color: var(--danger);
  }

  .form-actions {
    display: flex;
    gap: 1em;
    align-items: center;
    margin-top: 0.25em;
  }

  /* Styled like the Cancel link on the full Add Item page. */
  .cancel {
    padding: 0;
    background: none;
    border: none;
    color: var(--muted);
    font-size: 0.9em;
    text-decoration: underline;
    cursor: pointer;
  }

  .full-form {
    margin-left: auto;
    color: var(--muted);
    font-size: 0.85em;
  }

  .error {
    color: var(--danger);
    margin: 0;
  }
</style>
