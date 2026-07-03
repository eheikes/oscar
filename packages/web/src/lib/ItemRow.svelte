<script lang="ts">
  import type { Item, ItemType, Label } from './types.js';
  import { updateItem } from './api.js';

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
        due: editDue ? new Date(editDue).toISOString() : null,
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
  <span class="item-display" class:deleted={item.deletedAt !== null}>
    <input
      type="checkbox"
      checked={item.deletedAt !== null}
      disabled={saving}
      title={item.deletedAt !== null ? 'Restore item' : 'Mark as done'}
      onchange={(e) => toggleDelete(e.currentTarget.checked)}
    />
    <span class="item-title">{item.title}</span>
    <span class="item-meta">({getTypeReadable(item.type)})</span>
    {#if item.due}<span class="item-meta">due: {formatDate(item.due)}</span>{/if}
    {#if item.labels.length}
      <span class="item-meta">labels: {item.labels.map(getLabelReadable).join(', ')}</span>
    {/if}
    {#if item.length != null}<span class="item-meta">{item.length} min</span>{/if}
    {#if item.summary}<span class="item-summary">— {item.summary}</span>{/if}
    {#if item.uri}
      <a href={item.uri} target="_blank" rel="noopener noreferrer">[link]</a>
    {/if}
    {#if error}<span class="error">{error}</span>{/if}
    <button class="edit-btn" onclick={startEdit} disabled={saving}>Edit</button>
  </span>
{/if}

<style>
  .item-display {
    display: flex;
    align-items: baseline;
    gap: 0.4em;
    flex-wrap: wrap;
    width: 100%;
  }

  .deleted .item-title {
    text-decoration: line-through;
    opacity: 0.55;
  }

  .item-title {
    font-weight: 500;
  }

  .item-meta {
    color: #666;
    font-size: 0.85em;
  }

  .item-summary {
    font-style: italic;
    font-size: 0.85em;
    color: #555;
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
    border: 1px solid #bbb;
    background: #f7f7f7;
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
    border: 1px solid #ccc;
    border-radius: 3px;
  }

  .edit-actions {
    display: flex;
    gap: 0.5em;
    grid-column: 1 / -1;
  }

  .error {
    color: #c00;
    font-size: 0.85em;
  }
</style>
