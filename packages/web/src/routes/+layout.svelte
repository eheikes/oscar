<script lang="ts">
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();
</script>

<nav>
  <a href="/">Home</a>
  <a href="/choose">Choose</a>
  <a href="/add">Add Item</a>
</nav>

<main>
  {@render children()}
</main>

<style>
  :global(*, *::before, *::after) {
    box-sizing: border-box;
  }

  :global(body) {
    margin: 0;
    font-family: system-ui, sans-serif;
    font-size: 15px;
    background: #fff;
    color: #111;
  }

  nav {
    display: flex;
    gap: 1.5em;
    padding: 0.6em 1em;
    background: #222;
    border-bottom: 2px solid #444;
  }

  nav a {
    color: #eee;
    text-decoration: none;
    font-weight: 500;
  }

  nav a:hover {
    text-decoration: underline;
  }

  main {
    padding: 1em 1.5em;
    max-width: 1000px;
    margin: 0 auto;
  }
</style>
