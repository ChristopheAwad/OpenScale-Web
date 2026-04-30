<script lang="ts">
	import { toasts, removeToast } from '$lib/stores/toast';

	const typeStyles: Record<string, string> = {
		success: 'bg-green-500/20 border-green-500/30 text-green-100',
		error: 'bg-red-500/20 border-red-500/30 text-red-100',
		info: 'bg-blue-500/20 border-blue-500/30 text-blue-100',
		warning: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-100'
	};

	const typeIcons: Record<string, string> = {
		success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
		error: 'M10 14l2-2m0 0l2 2m-2-2v8m0-13.94A1 1 0 0121.83 1.06L18.17 6a1 1 0 01-.7 1.7h-2.5a6 6 0 00-6 6v2.5a1 1 0 01-1 1zm6 6a2 2 0 104 0',
		info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
		warning: 'M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
	};
</script>

{#if $toasts.length > 0}
	<div class="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
		{#each $toasts as toast (toast.id)}
			<div
				class="p-4 rounded-lg border backdrop-blur-sm shadow-lg {typeStyles[toast.type]} flex items-start gap-3 animate-slide-in"
				role="alert"
			>
				<svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={typeIcons[toast.type]} />
				</svg>
				<span class="flex-1 text-sm font-medium">{toast.message}</span>
				<button
					class="flex-shrink-0 hover:opacity-70 transition-opacity"
					onclick={() => removeToast(toast.id)}
					aria-label="Dismiss notification"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
		{/each}
	</div>
{/if}
