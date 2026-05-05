<script lang="ts">
  import { page } from '$app/stores';
  import { dev } from '$app/environment';
  
  let { error, status } = $props();
</script>

<div class="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4">
  <div class="max-w-lg w-full space-y-4">
    <div class="card p-6 space-y-4">
      <h1 class="text-2xl font-bold text-error-500">
        {status === 404 ? 'Page Not Found' : 'Something Went Wrong'}
      </h1>
      
      <p class="text-white/60">
        {status === 404 
          ? "The page you're looking for doesn't exist." 
          : "An unexpected error occurred."}
      </p>

      {#if dev && error}
        <div class="bg-error-500/10 border border-error-500/30 rounded-[var(--radius)] p-4 space-y-2">
          <p class="text-sm font-mono text-error-400">{error.message}</p>
          {#if error.stack}
            <details class="text-xs text-white/40">
              <summary class="cursor-pointer hover:text-white/60">Stack trace</summary>
              <pre class="mt-2 whitespace-pre-wrap overflow-x-auto">{error.stack}</pre>
            </details>
          {/if}
        </div>
      {/if}

      <div class="flex gap-2">
        <a href="/" class="btn-custom btn-primary-custom">Go Home</a>
        <button onclick={() => history.back()} class="btn-custom btn-outline-custom">
          Go Back
        </button>
      </div>
    </div>    
    
    {#if $page.url.searchParams.get('requestId')}
      <div class="text-xs text-white/30 text-center">
        Request ID: {$page.url.searchParams.get('requestId')}
      </div>
    {/if}
  </div>
</div>
