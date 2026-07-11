<script lang="ts">
  import { untrack } from 'svelte';
  import type { PageData } from './$types';
  import ItemRow from '$lib/ItemRow.svelte';
  import type { Item, NextItemResult } from '$lib/types.js';

  let { data }: { data: PageData } = $props();

  // Keep a mutable copy of results so edits/soft-deletes are reflected immediately.
  // untrack suppresses the "only captures initial value" warning; $effect handles sync.
  let results = $state<NextItemResult[]>(untrack(() => data.results ?? []));

  $effect(() => {
    results = data.results ?? [];
  });

  let formType = $state(untrack(() => data.selectedType));
  let formCount = $state(untrack(() => data.selectedCount));
  let formLabels = $state(untrack(() => data.selectedLabels ?? []));

  $effect(() => {
    formType = data.selectedType;
    formCount = data.selectedCount;
    formLabels = data.selectedLabels ?? [];
  });

  function updateItem(updated: Item) {
    results = results.map(r =>
      r.item.id === updated.id ? { ...r, item: updated } : r
    );
  }

  function handleFormSubmit(e: SubmitEvent) {
    e.preventDefault();
    const qs = new URLSearchParams();
    if (formType) qs.set('type', formType);
    if (formCount) qs.set('count', String(formCount));
    formLabels.forEach(label => qs.append('label', label));
    window.location.search = qs.toString();
  }
</script>

<h1>Choose Next Item</h1>

<form onsubmit={handleFormSubmit} class="choose-form">
  <label>
    Type <span class="required">*</span>
    <select required bind:value={formType}>
      <option value="">— select type —</option>
      {#each data.types as t}
        <option value={t.id}>{t.readable}</option>
      {/each}
    </select>
  </label>

  <label>
    Count
    <input type="number" min="1" max="100" bind:value={formCount} />
  </label>

  <label>
    Label
    <select
      multiple
      size="4"
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
    <span class="hint">Hold Ctrl/Cmd to select multiple</span>
  </label>

  <button type="submit">Get Items</button>
</form>

{#if data.resultsError}
  <p class="error">{data.resultsError}</p>
{:else if data.results !== null}
  {#if results.length}
    <h2>Results</h2>
    <ul class="item-list">
      {#each results as result (result.item.id)}
        <li>
          <ItemRow item={result.item} types={data.types} labels={data.labels} onUpdate={updateItem} />
          {#if result.reason}
            <div class="reason">✧ {result.reason}</div>
          {/if}
        </li>
      {/each}
    </ul>
  {:else}
    <p class="status">No items found for the selected criteria.</p>
  {/if}
{/if}

<style>
  h1 {
    margin-top: 0;
  }

  .choose-form {
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

  .choose-form label {
    display: flex;
    flex-direction: column;
    gap: 0.2em;
    font-size: 0.85em;
    font-weight: 600;
    color: var(--muted-strong);
  }

  .choose-form input,
  .choose-form select {
    font-size: 1em;
    padding: 0.25em 0.4em;
    border: 1px solid var(--border);
    border-radius: 3px;
    min-width: 8em;
  }

  .required {
    color: var(--danger);
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

  .reason {
    font-size: 0.8em;
    color: var(--hint);
    font-style: italic;
    margin-left: 1.5em;
    margin-top: 0.1em;
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
