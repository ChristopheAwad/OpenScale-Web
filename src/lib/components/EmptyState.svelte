<script lang="ts">
	let { 
		icon = 'scale', 
		title = 'No items yet', 
		description = '', 
		actionText = '', 
		actionHref = '', 
		onAction = undefined 
	} = $props();
	
	const icons: Record<string, string> = {
		scale: 'M3 6l6-3 6 3v2a6 6 0 01-12 0V6zm6 8a2 2 0 100-4 2 2 0 000 4z',
		chart: 'M7 12l3-3m0 0l3 3m-3-3v8m0-13.94A1 1 0 0121.83 1.06L18.17 6a1 1 0 01-.7 1.7h-2.5a6 6 0 00-6 6v2.5a1 1 0 01-1 1zm6 6a2 2 0 104 0',
		target: 'M13 10V3L4 14h7v7l9-11h-7z',
		entries: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
	};
</script>

<div class="card text-center py-12 md:py-16">
	<div class="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
		<svg class="w-8 h-8 md:w-10 md:h-10 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={icons[icon]} />
		</svg>
	</div>
	<div class="text-white/60 text-lg md:text-xl font-medium mb-2">{title}</div>
	{#if description}
		<p class="text-white/40 text-sm mb-6 max-w-sm mx-auto">{description}</p>
	{/if}
	{#if actionText && (actionHref || onAction)}
		{#if actionHref}
			<a href={actionHref} class="btn-custom btn-primary-custom inline-block">
				{actionText}
			</a>
		{:else if onAction}
			<button onclick={onAction} class="btn-custom btn-primary-custom">
				{actionText}
			</button>
		{/if}
	{/if}
</div>
