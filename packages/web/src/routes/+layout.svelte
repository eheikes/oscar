<script lang="ts">
  import { onMount } from 'svelte';
  import type { Snippet } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore, initializeAuth0, logout } from '$lib/auth.js';

  let { children }: { children: Snippet } = $props();
  let isBootstrapped = $state(false);

  onMount(async () => {
    await initializeAuth0();
    isBootstrapped = true;

    if (!$authStore.isAuthenticated && window.location.pathname !== '/login') {
      await goto('/login');
    }
  });

  $effect(() => {
    if (!isBootstrapped) return;
    if (!$authStore.isAuthenticated && window.location.pathname !== '/login') {
      void goto('/login');
    }
  });

  async function handleLogout() {
    await logout();
  }
</script>

{#if isBootstrapped && ($authStore.isAuthenticated || typeof window !== 'undefined' && window.location.pathname === '/login')}
  <nav>
    <div class="nav-links">
      <a href="/">Home</a>
      <a href="/choose">Choose</a>
      <a href="/add">Add Item</a>
    </div>
    {#if $authStore.isAuthenticated}
      <div class="nav-user">
        <span class="user-email">{$authStore.user?.email ?? 'User'}</span>
        <button class="logout-btn" onclick={handleLogout}>Logout</button>
      </div>
    {/if}
  </nav>

  <main>
    {@render children()}
  </main>
{:else}
  <main class="loading">Checking session...</main>
{/if}

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
    justify-content: space-between;
    align-items: center;
    gap: 1.5em;
    padding: 0.6em 1em;
    background: var(--nav-bg);
    border-bottom: 2px solid var(--nav-border);
  }

  .nav-links {
    display: flex;
    gap: 1.5em;
  }

  nav a {
    color: var(--nav-link);
    text-decoration: none;
    font-weight: 500;
  }

  nav a:hover {
    text-decoration: underline;
  }

  .nav-user {
    display: flex;
    align-items: center;
    gap: 1em;
  }

  .user-email {
    color: var(--nav-link);
    font-size: 0.9em;
  }

  .logout-btn {
    padding: 0.4em 0.8em;
    background: transparent;
    border: 1px solid var(--nav-link);
    color: var(--nav-link);
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9em;
    transition: all 0.2s;
  }

  .logout-btn:hover {
    background: var(--danger);
    border-color: var(--danger);
  }

  main {
    padding: 1em 1.5em;
    max-width: 1000px;
    margin: 0 auto;
  }

  .loading {
    color: var(--muted);
  }
</style>
