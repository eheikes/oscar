<script lang="ts">
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';
  import { createItem } from '$lib/api.js';
  import { SKYLIGHT_ITEM_TYPE, sendItemToSkylight, skylightEnabled } from '$lib/integrations.js';
  import { localDateTimeToISO } from '$lib/utils.js';

  let { data }: { data: PageData } = $props();

  let title = $state('');
  let type = $state('');
  let due = $state('');
  let length = $state('');
  let summary = $state('');
  let uri = $state('');
  let parentId = $state('');
  let selectedLabels = $state<string[]>([]);
  let sendToSkylight = $state(false);
  let submitting = $state(false);
  let error = $state('');

  let showSkylight = $derived($skylightEnabled && type === SKYLIGHT_ITEM_TYPE);

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!title.trim() || !type) return;
    submitting = true;
    error = '';
    let item;
    try {
      item = await createItem({
        title: title.trim(),
        type,
        due: localDateTimeToISO(due),
        length: length !== '' ? Number(length) : null,
        summary: summary.trim() || null,
        uri: uri.trim() || null,
        parentId: parentId.trim() || null,
        labels: selectedLabels,
      });
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to create item';
      submitting = false;
      return;
    }
    // The item has been added even if this fails; the result is reported with a toast.
    if (showSkylight && sendToSkylight) {
      await sendItemToSkylight(item);
    }
    goto('/');
  }
</script>

<h1>Add Item</h1>

<form onsubmit={handleSubmit} class="add-form">
  <label>
    Title <span class="required">*</span>
    <input type="text" bind:value={title} required disabled={submitting} />
  </label>

  <label>
    Type <span class="required">*</span>
    <select bind:value={type} required disabled={submitting}>
      <option value="">— select type —</option>
      {#each data.types as t}
        <option value={t.id}>{t.readable}</option>
      {/each}
    </select>
  </label>

  <label>
    Due date
    <input type="datetime-local" bind:value={due} disabled={submitting} />
  </label>

  <label>
    Length (mins)
    <input type="number" bind:value={length} min="0" disabled={submitting} />
  </label>

  <label>
    Summary
    <textarea bind:value={summary} rows="12" disabled={submitting}></textarea>
  </label>

  <label>
    URI
    <input type="text" bind:value={uri} disabled={submitting} />
  </label>

  <label>
    Parent ID
    <input type="text" bind:value={parentId} disabled={submitting} placeholder="UUID of parent item" />
  </label>

  <label>
    Labels
    <select
      multiple
      size={data.labels.length ? Math.min(10, Math.max(3, Math.ceil(data.labels.length / 3))) : 10}
      disabled={submitting}
      onchange={(e) => {
        selectedLabels = [...e.currentTarget.selectedOptions].map(o => o.value);
      }}
    >
      {#each data.labels as l}
        <option value={l.id}>{l.readable}</option>
      {/each}
    </select>
    <span class="hint">Hold Ctrl/Cmd to select multiple</span>
  </label>

  {#if showSkylight}
    <label class="checkbox-label">
      <input type="checkbox" bind:checked={sendToSkylight} disabled={submitting} />
      Also send to Skylight
    </label>
  {/if}

  {#if error}
    <p class="error">{error}</p>
  {/if}

  <div class="form-actions">
    <button type="submit" disabled={submitting || !title.trim() || !type}>
      {submitting ? 'Adding…' : 'Add Item'}
    </button>
    <a href="/">Cancel</a>
  </div>
</form>

<style>
  h1 {
    margin-top: 0;
  }

  .add-form {
    display: flex;
    flex-direction: column;
    gap: 0.75em;
    max-width: 520px;
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
  .add-form select,
  .add-form textarea {
    font-size: 1em;
    font-weight: normal;
    padding: 0.3em 0.5em;
    border: 1px solid var(--border);
    border-radius: 3px;
  }

  .add-form textarea {
    resize: vertical;
  }

  .add-form .checkbox-label {
    flex-direction: row;
    align-items: center;
    gap: 0.4em;
  }

  .hint {
    font-size: 0.8em;
    font-weight: normal;
    color: var(--hint);
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

  .form-actions a {
    color: var(--muted);
    font-size: 0.9em;
  }

  .error {
    color: var(--danger);
    margin: 0;
  }
</style>
