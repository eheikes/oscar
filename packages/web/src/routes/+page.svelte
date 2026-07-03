<script lang="ts">
  import { onMount } from 'svelte';
  import { getItems, getTypes, getLabels } from '$lib/api.js';
  import ItemRow from '$lib/ItemRow.svelte';
  import type { Item, ItemType, Label } from '$lib/types.js';

  let items = $state<Item[]>([]);
  let types = $state<ItemType[]>([]);
  let labels = $state<Label[]>([]);
  let loading = $state(false);
  let error = $state('');
  let showFilters = $state(false);

  // Filter state with defaults
  let filterType = $state('');
  let filterLabels = $state<string[]>([]);
  let filterSearch = $state('');
  let filterIncludeDeleted = $state(false);
  let filterOrderBy = $state<'due' | 'createdAt'>('due');
  let filterOrderDir = $state<'asc' | 'desc'>('asc');
  let filterCount = $state(25);

  async function fetchItems() {
    loading = true;
    error = '';
    try {
      items = await getItems({
        count: filterCount,
        orderBy: filterOrderBy,
        orderDir: filterOrderDir,
        type: filterType || undefined,
        label: filterLabels.length > 0 ? filterLabels : undefined,
        search: filterSearch || undefined,
        includeDeleted: filterIncludeDeleted,
      });
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load items';
    } finally {
      loading = false;
    }
  }

  onMount(async () => {
    try {
      [types, labels] = await Promise.all([getTypes(), getLabels()]);
    } catch {
      // non-fatal; filters still work without option lists
    }
    await fetchItems();
  });

  function updateItem(updated: Item) {
    items = items.map(i => (i.id === updated.id ? updated : i));
  }
</script>

<h1>Items</h1>

<div class="toolbar">
  <button onclick={() => (showFilters = !showFilters)}>
    {showFilters ? '▲ Hide Filters' : '▼ Show Filters'}
  </button>
  <button onclick={fetchItems} disabled={loading}>↺ Refresh</button>
</div>

{#if showFilters}
  <div class="filters">
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

    <button onclick={fetchItems}>Apply Filters</button>
  </div>
{/if}

{#if loading}
  <p class="status">Loading…</p>
{:else if error}
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
    background: #f3f3f3;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin-bottom: 1em;
  }

  .filters label {
    display: flex;
    flex-direction: column;
    gap: 0.2em;
    font-size: 0.85em;
    font-weight: 600;
    color: #444;
  }

  .filters input,
  .filters select {
    font-size: 1em;
    padding: 0.25em 0.4em;
    border: 1px solid #ccc;
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
    border-bottom: 1px solid #eee;
  }

  .item-list li:last-child {
    border-bottom: none;
  }

  .status {
    color: #666;
    font-size: 0.9em;
  }

  .error {
    color: #c00;
  }

  .hint {
    font-size: 0.75em;
    font-weight: normal;
    color: #666;
  }
</style>
