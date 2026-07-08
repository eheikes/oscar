<script lang="ts">
  import type { Item, ItemType, Label } from './types.js';
  import { updateItem } from './api.js';
  import { localDateTimeToISO } from './utils.js';
  import MarkdownText from './MarkdownText.svelte';

  let {
    item,
    types,
    labels,
    onUpdate,
  }: {
    item: Item;
    types: ItemType[];
    labels: Label[];
    onUpdate: (updated: Item) => void;
  } = $props();

  let editing = $state(false);
  let saving = $state(false);
  let error = $state('');

  // Edit form fields
  let editTitle = $state('');
  let editType = $state('');
  let editDue = $state('');
  let editLength = $state('');
  let editSummary = $state('');
  let editUri = $state('');
  let editParentId = $state('');
  let editLabels = $state<string[]>([]);

  function startEdit() {
    editTitle = item.title;
    editType = item.type;
    editDue = item.due ? item.due.slice(0, 16) : '';
    editLength = item.length != null ? String(item.length) : '';
    editSummary = item.summary ?? '';
    editUri = item.uri ?? '';
    editParentId = item.parentId ?? '';
    editLabels = [...item.labels];
    error = '';
    editing = true;
  }

  function cancelEdit() {
    editing = false;
  }

  async function saveEdit() {
    saving = true;
    error = '';
    try {
      const updated = await updateItem(item.id, {
        title: editTitle,
        type: editType,
        due: localDateTimeToISO(editDue),
        length: editLength !== '' ? Number(editLength) : null,
        summary: editSummary || null,
        uri: editUri || null,
        parentId: editParentId || null,
        labels: editLabels,
      });
      onUpdate(updated);
      editing = false;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Save failed';
    } finally {
      saving = false;
    }
  }

  async function toggleDelete(checked: boolean) {
    saving = true;
    error = '';
    try {
      const updated = await updateItem(item.id, {
        deletedAt: checked ? new Date().toISOString() : null,
      });
      onUpdate(updated);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Update failed';
    } finally {
      saving = false;
    }
  }

  function formatDate(iso: string | null): string {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString();
  }

  function getLabelReadable(id: string): string {
    return labels.find(l => l.id === id)?.readable ?? id;
  }

  function getTypeReadable(id: string): string {
    return types.find(t => t.id === id)?.readable ?? id;
  }
</script>

{#if editing}
  <div class="item-edit">
    <label>Title: <input type="text" bind:value={editTitle} disabled={saving} /></label>
    <label>
      Type:
      <select bind:value={editType} disabled={saving}>
        {#each types as t}
          <option value={t.id}>{t.readable}</option>
        {/each}
      </select>
    </label>
    <label>Due: <input type="datetime-local" bind:value={editDue} disabled={saving} /></label>
    <label>Length (mins): <input type="number" bind:value={editLength} min="0" disabled={saving} /></label>
    <label>Summary: <textarea bind:value={editSummary} rows="3" disabled={saving}></textarea></label>
    <label>URI: <input type="text" bind:value={editUri} disabled={saving} /></label>
    <label>Parent ID: <input type="text" bind:value={editParentId} disabled={saving} /></label>
    <label>
      Labels:
      <select
        multiple
        size="4"
        disabled={saving}
        onchange={(e) => {
          editLabels = [...e.currentTarget.selectedOptions].map(o => o.value);
        }}
      >
        {#each labels as label}
          <option value={label.id} selected={editLabels.includes(label.id)}>
            {label.readable}
          </option>
        {/each}
      </select>
    </label>
    {#if error}<span class="error">{error}</span>{/if}
    <div class="edit-actions">
      <button onclick={saveEdit} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
      <button onclick={cancelEdit} disabled={saving}>Cancel</button>
    </div>
  </div>
{:else}
  <div class="item-display" class:deleted={item.deletedAt !== null}>
    <input
      type="checkbox"
      checked={item.deletedAt !== null}
      disabled={saving}
      title={item.deletedAt !== null ? 'Restore item' : 'Mark as done'}
      onchange={(e) => toggleDelete(e.currentTarget.checked)}
    />
    <div class="item-content">
      <div class="item-title-row">
        <span class="item-title"><MarkdownText value={item.title} mode="inline" /></span>
        {#if item.uri}
          <a class="item-link" href={item.uri} target="_blank" rel="noopener noreferrer">[link]</a>
        {/if}
      </div>
      <div class="item-meta-row">
        <span class="item-meta">({getTypeReadable(item.type)})</span>
        {#if item.due}<span class="item-meta">due: {formatDate(item.due)}</span>{/if}
        {#if item.labels.length}
          <span class="item-meta">labels: {item.labels.map(getLabelReadable).join(', ')}</span>
        {/if}
        {#if item.length != null}<span class="item-meta">{item.length} min</span>{/if}
      </div>
      {#if item.summary}
        <div class="item-summary">
          <MarkdownText value={item.summary} mode="block" />
        </div>
      {/if}
    </div>
    {#if error}<span class="error">{error}</span>{/if}
    <button class="edit-btn" onclick={startEdit} disabled={saving}>Edit</button>
  </div>
{/if}

<style>
  .item-display {
    display: flex;
    align-items: flex-start;
    gap: 0.4em;
    width: 100%;
  }

  .item-content {
    display: flex;
    flex: 1;
    min-width: 0;
    flex-direction: column;
    gap: 0.2em;
  }

  .deleted .item-title {
    text-decoration: line-through;
    opacity: 0.55;
  }

  .item-title-row {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 0.35em;
  }

  .item-title {
    font-weight: 500;
  }

  .item-link {
    font-size: 0.85em;
    color: var(--muted);
  }

  .item-title :global(a) {
    color: inherit;
  }

  .item-title :global(code) {
    font-size: 0.9em;
    padding: 0.05em 0.25em;
    border-radius: 3px;
    background: var(--surface);
    border: 1px solid var(--border);
  }

  .item-meta {
    color: var(--muted);
    font-size: 0.85em;
  }

  .item-meta-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4em;
  }

  .item-summary {
    display: inline-flex;
    align-items: baseline;
    gap: 0.3em;
    font-size: 0.85em;
    color: var(--muted);
  }

  .item-summary :global(p) {
    margin: 0;
  }

  .item-summary :global(p + p) {
    margin-top: 0.4em;
  }

  .item-summary :global(ul),
  .item-summary :global(ol) {
    margin: 0.2em 0 0 1.25em;
    padding: 0;
  }

  .item-summary :global(code) {
    font-size: 0.95em;
    padding: 0.05em 0.25em;
    border-radius: 3px;
    background: var(--surface);
    border: 1px solid var(--border);
  }

  .item-summary :global(a) {
    color: inherit;
  }

  .edit-btn {
    margin-left: auto;
    font-size: 0.8em;
    padding: 0.1em 0.5em;
  }

  .item-edit {
    display: flex;
    flex-direction: column;
    gap: 0.5em;
    padding: 0.6em 0.8em;
    border: 1px solid var(--border-strong);
    background: var(--surface-alt);
    border-radius: 4px;
  }

  .item-edit label {
    display: grid;
    grid-template-columns: 8em 1fr;
    gap: 0.4em;
    align-items: center;
    font-size: 0.9em;
  }

  .item-edit input,
  .item-edit select,
  .item-edit textarea {
    font-size: 1em;
    padding: 0.2em 0.4em;
    border: 1px solid var(--border);
    border-radius: 3px;
  }

  .edit-actions {
    display: flex;
    gap: 0.5em;
    grid-column: 1 / -1;
  }

  .error {
    color: var(--danger);
    font-size: 0.85em;
  }
</style>
