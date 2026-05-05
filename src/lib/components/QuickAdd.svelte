<script lang="ts">
	import { createWeightEntry } from '$lib/models';
	import { addEntry, sortedEntries, preferences } from '$lib/stores';
	import { addToast } from '$lib/stores/toast';
	import { goto } from '$app/navigation';

	let showQuickAdd = $state(false);
	let weight = $state(0);
	let weightUnit = $state<'kg' | 'lb'>('kg');

	$effect(() => {
		if ($sortedEntries.length > 0) {
			weight = $sortedEntries[0].weight;
			weightUnit = $sortedEntries[0].weightUnit;
		} else {
			weight = $preferences?.weightUnit === 'lb' ? 154 : 70;
			weightUnit = $preferences?.weightUnit || 'kg';
		}
	});

	async function handleQuickAdd() {
		console.log('[openweight] CLIENT - QuickAdd handleQuickAdd called');
		try {
			console.log('[openweight] CLIENT - QuickAdd creating entry');
			const entry = createWeightEntry(
				weight,
				weightUnit,
				new Date().toISOString().split('T')[0]
			);
			console.log('[openweight] CLIENT - QuickAdd entry created:', entry);
			await addEntry(entry);
			addToast('Weight entry saved!', 'success');
			showQuickAdd = false;
		} catch (err) {
			const requestId = (err as any)?.requestId;
			const message = requestId 
				? `Failed to save entry. Request ID: ${requestId}` 
				: 'Failed to save entry';
			addToast(message, 'error');
		}
	}
</script>

{#if showQuickAdd}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div class="fixed inset-0 bg-black/50 z-50 flex items-end" onclick={() => showQuickAdd = false} role="dialog" aria-label="Quick add entry" tabindex="-1">
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div class="bg-[#1a1a1e] w-full rounded-t-2xl p-6 space-y-4 border-t border-white/10" onclick={(e) => e.stopPropagation()}>
			<div class="w-12 h-1 bg-white/20 rounded-full mx-auto mb-2"></div>
			<h2 class="text-xl font-bold">Quick Add Entry</h2>
			<div class="flex gap-2">
				<input
					type="number"
					step="0.1"
					bind:value={weight}
					class="input-custom flex-1"
				/>
				<select bind:value={weightUnit} class="input-custom w-24 text-center appearance-none cursor-pointer">
					<option value="kg">kg</option>
					<option value="lb">lb</option>
				</select>
			</div>
			<div class="flex gap-2">
				<button onclick={() => showQuickAdd = false} class="btn-custom btn-outline-custom flex-1">
					Cancel
				</button>
				<button onclick={handleQuickAdd} class="btn-custom btn-primary-custom flex-1">
					Save
				</button>
			</div>
		</div>
	</div>
{/if}

<button
	onclick={() => showQuickAdd = true}
	class="flex flex-col items-center gap-1 p-2 rounded-[var(--radius)] transition-all text-white/50 hover:text-white hover:bg-white/5 md:flex-row md:gap-2 md:px-4 md:py-2"
	aria-label="Quick add entry"
>
	<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
		<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
	</svg>
	<span class="text-[10px] font-medium md:text-sm">Quick</span>
</button>
