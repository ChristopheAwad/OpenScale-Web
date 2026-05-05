<script lang="ts">
  import { dev } from '$app/environment';
  let { error, status } = $props();
</script>

<div class="p-4 md:p-6 max-w-4xl mx-auto">
  <div class="card p-6 space-y-4">
    <h1 class="text-xl font-bold text-error-500">Failed to Save Entry</h1>    
    
    <p class="text-white/60">
      There was a problem saving your weight entry. Please try again.
    </p>

    {#if dev && error?.message}
      <div class="bg-error-500/10 border border-error-500/30 rounded-[var(--radius)] p-4">
        <p class="text-sm font-mono text-error-400">{error.message}</p>
      </div>
    {/if}

    <a href="/add" class="btn-custom btn-primary-custom inline-block">
      Try Again
    </a>
  </div>
</div>
