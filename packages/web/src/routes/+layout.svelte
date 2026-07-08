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
  :global(:root) {
    color-scheme: light dark;
    --bg: #ffffff;
    --text: #111111;
    --surface: #f3f3f3;
    --surface-alt: #f7f7f7;
    --border: #dddddd;
    --border-strong: #bbbbbb;
    --border-subtle: #eeeeee;
    --muted: #666666;
    --muted-strong: #444444;
    --hint: #888888;
    --nav-bg: #222222;
    --nav-border: #444444;
    --nav-link: #eeeeee;
    --danger: #cc0000;
  }

  @media (prefers-color-scheme: dark) {
    :global(:root) {
      --bg: #121416;
      --text: #e8eaed;
      --surface: #1b2026;
      --surface-alt: #171b20;
      --border: #3b444f;
      --border-strong: #566273;
      --border-subtle: #2f3740;
      --muted: #b3bdc8;
      --muted-strong: #c8d0da;
      --hint: #9aa7b5;
      --nav-bg: #0f1215;
      --nav-border: #313944;
      --nav-link: #f2f4f6;
      --danger: #ff7f7f;
    }
  }

  :global(*, *::before, *::after) {
    box-sizing: border-box;
  }

  :global(body) {
    margin: 0;
    font-family: system-ui, sans-serif;
    font-size: 15px;
    background: var(--bg);
    color: var(--text);
  }

  nav {
    display: flex;
    gap: 1.5em;
    padding: 0.6em 1em;
    background: var(--nav-bg);
    border-bottom: 2px solid var(--nav-border);
  }

  nav a {
    color: var(--nav-link);
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
