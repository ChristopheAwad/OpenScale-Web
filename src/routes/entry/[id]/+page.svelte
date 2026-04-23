<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { deleteEntry } from '$lib/stores';
	import type { MeasurementType } from '$lib/models';

	let { data }: { data: PageData } = $props();

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric',
		});
	}

	function formatMeasurementType(type: MeasurementType): string {
		return type.charAt(0).toUpperCase() + type.slice(1);
	}

	async function handleDelete() {
		if (confirm('Are you sure you want to delete this entry?')) {
			await deleteEntry(data.entry.id);
			goto('/');
		}
	}
</script>

<div class="p-4 space-y-4">
	<div class="flex items-center gap-2">
		<a href="/" class="btn-icon" aria-label="Go back">
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
		</a>
		<h1 class="text-xl font-bold tracking-tight">Entry Details</h1>
	</div>

	<div class="card">
		<div class="value-main mb-2">
			{data.entry.weight}
			<span class="value-unit">{data.entry.weightUnit}</span>
		</div>
		<div class="date-muted">
			{formatDate(data.entry.date)}
		</div>
	</div>

	{#if data.entry.measurements && data.entry.measurements.length > 0}
		<div class="card">
			<h2 class="section-title">Measurements</h2>
			<div class="grid grid-cols-2 gap-3">
				{#each data.entry.measurements as m}
					<div class="flex justify-between items-center py-2 border-b border-white/5">
						<span class="text-white/60 capitalize">{formatMeasurementType(m.type)}</span>
						<span class="font-medium">{m.value} <span class="text-white/40 text-sm">{m.unit}</span></span>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	{#if data.entry.photoPath}
		<div class="card">
			<h2 class="section-title">Photo</h2>
			<img src={data.entry.photoPath} alt="Progress" class="w-full rounded-[var(--radius)]" />
		</div>
	{/if}

	{#if data.entry.notes}
		<div class="card">
			<h2 class="section-title">Notes</h2>
			<p class="text-white/60 whitespace-pre-wrap">{data.entry.notes}</p>
		</div>
	{/if}

	<button onclick={handleDelete} class="btn-custom bg-error-500 text-white w-full hover:bg-error-600">
		Delete Entry
	</button>
</div>