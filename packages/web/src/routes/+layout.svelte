<script lang="ts">
  import { onMount } from 'svelte';
  import type { Snippet } from 'svelte';
  import { afterNavigate, goto } from '$app/navigation';
  import { page } from '$app/state';
  import { authStore, consumeReturnTo, initializeAuth0, logout, redirectToLogin } from '$lib/auth.js';
  import QuickAddOverlay from '$lib/QuickAddOverlay.svelte';
  import Toasts from '$lib/Toasts.svelte';

  let { children }: { children: Snippet } = $props();
  let isBootstrapped = $state(false);
  let navEl: HTMLElement | undefined = $state();
  let quickAddOpen = $state(false);
  let quickAddTop = $state(0);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/choose', label: 'Choose' },
    { href: '/retro', label: 'Retrospective' },
    { href: '/add', label: 'Add Item' },
  ];

  onMount(async () => {
    await initializeAuth0();
    isBootstrapped = true;
  });

  $effect(() => {
    if (!isBootstrapped) return;
    if (!$authStore.isAuthenticated) {
      if (page.url.pathname !== '/login') {
        redirectToLogin();
      }
      return;
    }
    // Once logged in, go back to the page (and filters) the user was on
    // before being sent to the login page.
    const returnTo = consumeReturnTo();
    if (returnTo !== null) {
      void goto(returnTo, { replaceState: true });
    } else if (page.url.pathname === '/login') {
      void goto('/', { replaceState: true });
    }
  });

  afterNavigate(() => {
    quickAddOpen = false;
  });

  function handleAddClick(e: MouseEvent) {
    // Let modified clicks (new tab, etc.) and the /add page itself behave normally.
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (page.url.pathname === '/add') return;
    e.preventDefault();
    if (!quickAddOpen) {
      // Drop down from just under the nav, or from the top of the viewport if the nav is scrolled away.
      quickAddTop = Math.max(0, navEl?.getBoundingClientRect().bottom ?? 0);
    }
    quickAddOpen = !quickAddOpen;
  }

  async function handleLogout() {
    await logout();
  }
</script>

{#if isBootstrapped && ($authStore.isAuthenticated || page.url.pathname === '/login')}
  <nav bind:this={navEl}>
    <div class="nav-links">
      {#each navLinks as link (link.href)}
        <a
          href={link.href}
          aria-current={page.url.pathname === link.href ? 'page' : undefined}
          aria-expanded={link.href === '/add' && page.url.pathname !== '/add' ? quickAddOpen : undefined}
          onclick={link.href === '/add' ? handleAddClick : undefined}
        >{link.label}</a>
      {/each}
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

  {#if quickAddOpen}
    <QuickAddOverlay top={quickAddTop} onclose={() => { quickAddOpen = false; }} />
  {/if}
  <Toasts />
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
    --nav-active-bg: #444444;
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
    --nav-active-bg: #262d35;
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

  .nav-links a {
    padding: 0.3em 0.6em;
    border-radius: 4px;
  }

  .nav-links a[aria-current='page'],
  .nav-links a[aria-expanded='true'] {
    background: var(--nav-active-bg);
    box-shadow: inset 0 -2px 0 var(--nav-link);
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
