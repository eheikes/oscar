<script lang="ts">
  import { untrack } from 'svelte';
  import ItemRow from '$lib/ItemRow.svelte';
  import type { PageData } from './$types';
  import type { Item, ItemType, Label } from '$lib/types.js';

  let { data }: { data: PageData } = $props();

  let items = $state<Item[]>(untrack(() => data.items ?? []));
  let types = $state<ItemType[]>(untrack(() => data.types ?? []));
  let labels = $state<Label[]>(untrack(() => data.labels ?? []));
  let error = $state(untrack(() => data.itemsError ?? ''));
  let showFilters = $state(untrack(() => data.hasFilters ?? false));

  // Filter state with defaults
  let filterType = $state(untrack(() => data.selectedType ?? ''));
  let filterLabels = $state<string[]>(untrack(() => data.selectedLabels ?? []));
  let filterSearch = $state(untrack(() => data.selectedSearch ?? ''));
  let filterIncludeDeleted = $state(untrack(() => data.selectedIncludeDeleted ?? false));
  let filterOrderBy = $state<'due' | 'createdAt'>(untrack(() => data.selectedOrderBy ?? 'due'));
  let filterOrderDir = $state<'asc' | 'desc'>(untrack(() => data.selectedOrderDir ?? 'asc'));
  let filterCount = $state(untrack(() => data.selectedCount ?? 25));

  $effect(() => {
    items = data.items ?? [];
    types = data.types ?? [];
    labels = data.labels ?? [];
    error = data.itemsError ?? '';
    showFilters = data.hasFilters ?? false;

    filterType = data.selectedType ?? '';
    filterLabels = data.selectedLabels ?? [];
    filterSearch = data.selectedSearch ?? '';
    filterIncludeDeleted = data.selectedIncludeDeleted ?? false;
    filterOrderBy = data.selectedOrderBy ?? 'due';
    filterOrderDir = data.selectedOrderDir ?? 'asc';
    filterCount = data.selectedCount ?? 25;
  });

  function applyFilters(e?: SubmitEvent) {
    if (e) e.preventDefault();

    const qs = new URLSearchParams();
    if (filterType) qs.set('type', filterType);
    if (filterCount > 0) qs.set('count', String(filterCount));
    if (filterOrderBy !== 'due') qs.set('orderBy', filterOrderBy);
    if (filterOrderDir !== 'asc') qs.set('orderDir', filterOrderDir);
    if (filterSearch.trim() !== '') qs.set('search', filterSearch.trim());
    if (filterIncludeDeleted) qs.set('includeDeleted', 'true');
    filterLabels.forEach(label => qs.append('label', label));

    window.location.search = qs.toString();
  }

  function updateItem(updated: Item) {
    items = items.map(i => (i.id === updated.id ? updated : i));
  }
</script>

<h1>Items</h1>

<div class="toolbar">
  <button onclick={() => (showFilters = !showFilters)}>
    {showFilters ? '▲ Hide Filters' : '▼ Show Filters'}
  </button>
  <button onclick={() => applyFilters()}>↺ Refresh</button>
</div>

{#if showFilters}
  <form class="filters" onsubmit={applyFilters}>
    <label>
      Type
      <select bind:value={filterType}>
        <option value="">All types</option>
        {#each types as t}
          <option value={t.id}>{t.readable}</option>
        {/each}
      </select>
    </label>

    <label>
      Label
      <select
        multiple
        size="4"
        onchange={(e) => {
          filterLabels = [...e.currentTarget.selectedOptions].map(o => o.value);
        }}
      >
        {#each labels as l}
          <option value={l.id} selected={filterLabels.includes(l.id)}>
            {l.readable}
          </option>
        {/each}
      </select>
      <span class="hint">Hold Ctrl/Cmd to select multiple</span>
    </label>

    <label>
      Search
      <input type="text" bind:value={filterSearch} placeholder="Search titles…" />
    </label>

    <label class="checkbox-label">
      <input type="checkbox" bind:checked={filterIncludeDeleted} />
      Include deleted
    </label>

    <label>
      Order by
      <select bind:value={filterOrderBy}>
        <option value="due">Due date</option>
        <option value="createdAt">Created</option>
      </select>
    </label>

    <label>
      Direction
      <select bind:value={filterOrderDir}>
        <option value="asc">Ascending</option>
        <option value="desc">Descending</option>
      </select>
    </label>

    <label>
      Count
      <input type="number" bind:value={filterCount} min="1" max="100" />
    </label>

    <button type="submit">Apply Filters</button>
  </form>
{/if}

{#if error}
  <p class="error">{error}</p>
{:else if items.length === 0}
  <p class="status">No items found.</p>
{:else}
  <p class="status">{items.length} item{items.length === 1 ? '' : 's'}</p>
  <ul class="item-list">
    {#each items as item (item.id)}
      <li>
        <ItemRow {item} {types} {labels} onUpdate={updateItem} />
      </li>
    {/each}
  </ul>
{/if}

<style>
  h1 {
    margin-top: 0;
  }

  .toolbar {
    display: flex;
    gap: 0.5em;
    margin-bottom: 0.75em;
  }

  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75em 1.25em;
    align-items: flex-end;
    padding: 0.75em;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 4px;
    margin-bottom: 1em;
  }

  .filters label {
    display: flex;
    flex-direction: column;
    gap: 0.2em;
    font-size: 0.85em;
    font-weight: 600;
    color: var(--muted-strong);
  }

  .filters input,
  .filters select {
    font-size: 1em;
    padding: 0.25em 0.4em;
    border: 1px solid var(--border);
    border-radius: 3px;
  }

  .checkbox-label {
    flex-direction: row !important;
    align-items: center !important;
    gap: 0.4em !important;
    font-size: 0.9em !important;
    font-weight: normal !important;
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
