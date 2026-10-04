<script lang="ts">
  import { untrack } from 'svelte';
  import ItemRow from '$lib/ItemRow.svelte';
  import type { PageData } from './$types';
  import type { Item, ItemType, Label } from '$lib/types.js';

  let { data }: { data: PageData } = $props();

  let item = $state<Item | null>(untrack(() => data.item));
  let types = $state<ItemType[]>(untrack(() => data.types ?? []));
  let labels = $state<Label[]>(untrack(() => data.labels ?? []));
  let error = $state(untrack(() => data.itemError ?? ''));

  $effect(() => {
    item = data.item;
    types = data.types ?? [];
    labels = data.labels ?? [];
    error = data.itemError ?? '';
  });

  function updateItem(updated: Item) {
    item = updated;
  }
</script>

<h1>Items</h1>

{#if error}
  <p class="error">{error}</p>
{:else if item === null}
  <p class="status">Item not found.</p>
{:else}
  <ul class="item-list">
    <li>
      <ItemRow
        {item}
        {types}
        {labels}
        onUpdate={updateItem}
      />
    </li>
  </ul>
{/if}

<style>
  h1 {
    margin-top: 0;
  }

  .item-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .item-list li {
    padding: 0.35em 0;
  }

  .status {
    color: var(--muted);
    font-size: 0.9em;
  }

  .error {
    color: var(--danger);
  }
</style>
