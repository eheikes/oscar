<script lang="ts">
  import { untrack } from 'svelte';
  import type { PageData } from './$types';
  import MarkdownText from '$lib/MarkdownText.svelte';
  import type { Item } from '$lib/types.js';

  let { data }: { data: PageData } = $props();

  let items = $derived(data.items ?? []);

  let formDays = $state(untrack(() => data.selectedDays));
  let formType = $state(untrack(() => data.selectedType));
  let formLabels = $state(untrack(() => data.selectedLabels ?? []));

  $effect(() => {
    formDays = data.selectedDays;
    formType = data.selectedType;
    formLabels = data.selectedLabels ?? [];
  });

  const UNCATEGORIZED = '';

  interface Group {
    id: string;
    name: string;
    items: Item[];
  }

  // Group items by label (category). An item with several labels appears in each
  // matching group; items with no labels go into "Uncategorized".
  let groups = $derived.by((): Group[] => {
    const selected = data.selectedLabels ?? [];
    const byLabel = new Map<string, Item[]>();
    for (const item of items) {
      const itemLabels = selected.length > 0
        ? item.labels.filter(l => selected.includes(l))
        : item.labels;
      const keys = itemLabels.length > 0 ? itemLabels : [UNCATEGORIZED];
      for (const key of keys) {
        byLabel.set(key, [...(byLabel.get(key) ?? []), item]);
      }
    }
    return [...byLabel.entries()]
      .map(([id, groupItems]) => ({
        id,
        name: id === UNCATEGORIZED ? 'Uncategorized' : getLabelReadable(id),
        items: groupItems
      }))
      .sort((a, b) => {
        if (a.id === UNCATEGORIZED) return 1;
        if (b.id === UNCATEGORIZED) return -1;
        return a.name.localeCompare(b.name);
      });
  });

  function getLabelReadable(id: string): string {
    return data.labels.find(l => l.id === id)?.readable ?? id;
  }

  function getTypeReadable(id: string): string {
    return data.types.find(t => t.id === id)?.readable ?? id;
  }

  function formatDateTime(iso: string | null): string {
    if (!iso) return '';
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  }

  function handleFormSubmit(e: SubmitEvent) {
    e.preventDefault();
    const qs = new URLSearchParams();
    if (formDays > 0) qs.set('days', String(formDays));
    if (formType) qs.set('type', formType);
    formLabels.forEach(label => qs.append('label', label));
    window.location.search = qs.toString();
  }
</script>

<h1>Retrospective</h1>

<form onsubmit={handleFormSubmit} class="retro-form">
  <label>
    Past days
    <input type="number" min="1" max="3650" bind:value={formDays} />
  </label>

  <label>
    Type
    <select bind:value={formType}>
      <option value="">All types</option>
      {#each data.types as t}
        <option value={t.id}>{t.readable}</option>
      {/each}
    </select>
  </label>

  <label>
    Categories
    <select
      multiple
      size={data.labels.length ? Math.min(10, Math.max(3, Math.ceil(data.labels.length / 3))) : 10}
      onchange={(e) => {
        formLabels = [...e.currentTarget.selectedOptions].map(o => o.value);
      }}
    >
      {#each data.labels as l}
        <option value={l.id} selected={formLabels.includes(l.id)}>
          {l.readable}
        </option>
      {/each}
    </select>
    <span class="hint">None selected = all categories</span>
  </label>

  <button type="submit">Apply</button>
</form>

{#if data.itemsError}
  <p class="error">{data.itemsError}</p>
{:else if items.length === 0}
  <p class="status">No items completed in the past {data.selectedDays} day{data.selectedDays === 1 ? '' : 's'}.</p>
{:else}
  <p class="status">
    {items.length} item{items.length === 1 ? '' : 's'} completed in the past {data.selectedDays} day{data.selectedDays === 1 ? '' : 's'}
  </p>
  {#each groups as group (group.id)}
    <section class="group">
      <h2>{group.name} <span class="group-count">({group.items.length})</span></h2>
      <ul class="item-list">
        {#each group.items as item (item.id)}
          <li>
            <div class="item-title-row">
              <span class="item-title"><MarkdownText value={item.title} mode="inline" /></span>
              {#if item.uri}
                <a class="item-link" href={item.uri} target="_blank" rel="noopener noreferrer">[link]</a>
              {/if}
            </div>
            <div class="item-meta-row">
              <span class="item-meta">({getTypeReadable(item.type)})</span>
              {#if item.deletedAt}<span class="item-meta">✓ {formatDateTime(item.deletedAt)}</span>{/if}
              {#if item.labels.length}
                <span class="item-meta">labels: {item.labels.map(getLabelReadable).join(', ')}</span>
              {/if}
              {#if item.parent}
                <span class="item-meta">
                  ⮤
                  <span class:completed-task={item.parent.deletedAt !== null}>
                    <MarkdownText value={item.parent.title} mode="inline" />
                  </span>
                </span>
              {/if}
            </div>
            {#if item.children.length > 0}
              <div class="item-meta">
                ⤷
                {#each item.children as child, i (child.id)}
                  <span class:completed-task={child.deletedAt !== null}>
                    <MarkdownText value={child.title} mode="inline" />
                  </span>{#if i < item.children.length - 1},{' '}{/if}
                {/each}
              </div>
            {/if}
          </li>
        {/each}
      </ul>
    </section>
  {/each}
{/if}

<style>
  h1 {
    margin-top: 0;
  }

  .retro-form {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75em 1.25em;
    align-items: flex-end;
    padding: 0.75em;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 4px;
    margin-bottom: 1.5em;
  }

  .retro-form label {
    display: flex;
    flex-direction: column;
    gap: 0.2em;
    font-size: 0.85em;
    font-weight: 600;
    color: var(--muted-strong);
  }

  .retro-form input,
  .retro-form select {
    font-size: 1em;
    padding: 0.25em 0.4em;
    border: 1px solid var(--border);
    border-radius: 3px;
    min-width: 8em;
  }

  .group h2 {
    font-size: 1.1em;
    margin: 1.25em 0 0.4em;
    padding-bottom: 0.2em;
    border-bottom: 1px solid var(--border);
  }

  .group-count {
    font-weight: normal;
    color: var(--muted);
    font-size: 0.85em;
  }

  .item-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .item-list li {
    padding: 0.35em 0;
    border-bottom: 1px solid var(--border-subtle);
  }

  .item-list li:last-child {
    border-bottom: none;
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

  .item-link {
    font-size: 0.85em;
    color: var(--muted);
  }

  .item-meta-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4em;
    margin-top: 0.2em;
  }

  .item-meta {
    color: var(--muted);
    font-size: 0.85em;
  }

  .completed-task {
    text-decoration: line-through;
  }

  .status {
    color: var(--muted);
    font-size: 0.9em;
  }

  .error {
    color: var(--danger);
  }

  .hint {
    font-size: 0.75em;
    font-weight: normal;
    color: var(--muted);
  }
</style>
