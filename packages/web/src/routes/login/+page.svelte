<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore, initializeAuth0, login } from '$lib/auth.js';
  import { goto } from '$app/navigation';

  let isLoading = $state(false);
  let error = $state($authStore.error ?? '');

  $effect(() => {
    if ($authStore.error) {
      error = $authStore.error;
    }
  });

  onMount(async () => {
    await initializeAuth0();

    if ($authStore.error) {
      error = $authStore.error;
    }

    // If already authenticated, redirect to home
    if ($authStore.isAuthenticated) {
      await goto('/');
    }
  });

  async function handleLogin() {
    isLoading = true;
    error = '';
    authStore.update(state => ({ ...state, error: null }));
    try {
      await login();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Login failed';
      isLoading = false;
    }
  }
</script>

<div class="login-container">
  <div class="login-box">
    <h1>Welcome to OSCAR</h1>
    <p>Your personal productivity assistant</p>

    {#if error}
      <div class="error">{error}</div>
    {/if}

    <button
      class="login-btn"
      onclick={handleLogin}
      disabled={isLoading}
    >
      {isLoading ? 'Logging in...' : 'Login with Auth0'}
    </button>
  </div>
</div>

<style>
  .login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 80vh;
    padding: 1em;
  }

  .login-box {
    background: var(--surface);
    padding: 2em;
    border-radius: 8px;
    border: 1px solid var(--border);
    text-align: center;
    max-width: 400px;
    width: 100%;
  }

  h1 {
    margin: 0 0 0.5em 0;
    font-size: 1.8em;
  }

  p {
    color: var(--muted);
    margin: 0 0 2em 0;
  }

  .error {
    background: var(--danger);
    color: white;
    padding: 1em;
    border-radius: 4px;
    margin-bottom: 1em;
    font-size: 0.9em;
  }

  .login-btn {
    width: 100%;
    padding: 0.8em 1.5em;
    background: #0073e6;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1em;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
  }

  .login-btn:hover:not(:disabled) {
    background: #0052cc;
  }

  .login-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
