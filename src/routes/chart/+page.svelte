<script lang="ts">
	import { onMount } from 'svelte';
	import { Chart, registerables } from 'chart.js';
	import { sortedEntries, isLoading } from '$lib/stores';

	let canvas: HTMLCanvasElement;
	let chart: Chart | null = null;

	onMount(() => {
		Chart.register(...registerables);
	});

	$effect(() => {
		if ($sortedEntries.length && canvas) {
			if (chart) chart.destroy();

			const entries = [...$sortedEntries].reverse();
			const labels = entries.map(e => new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
			const data = entries.map(e => e.weight);

			chart = new Chart(canvas, {
				type: 'line',
				data: {
					labels,
					datasets: [{
						label: 'Weight',
						data,
						borderColor: 'rgb(56, 189, 248)',
						backgroundColor: 'rgba(56, 189, 248, 0.1)',
						fill: true,
						tension: 0.3,
					}]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					scales: {
						x: {
							ticks: { color: '#9ca3af' },
							grid: { color: '#374151' }
						},
						y: {
							ticks: { color: '#9ca3af' },
							grid: { color: '#374151' }
						}
					},
					plugins: {
						legend: {
							labels: { color: '#d1d5db' }
						}
					}
				}
			});
		}
	});
</script>

<div class="p-4 space-y-4">
	<h1 class="text-2xl font-bold tracking-tight">Progress Chart</h1>

	{#if $isLoading}
		<div class="flex justify-center py-12">
			<div class="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
		</div>
	{:else if $sortedEntries.length === 0}
		<div class="card text-center py-8 text-white/40">
			No entries to display yet
		</div>
	{:else}
		<div class="card">
			<div class="h-72">
				<canvas bind:this={canvas}></canvas>
			</div>
		</div>

		<div class="card">
			<h2 class="section-title">Statistics</h2>
			<div class="grid grid-cols-2 gap-4">
				<div>
					<div class="text-white/40 text-xs uppercase tracking-wider">Starting</div>
					<div class="text-lg font-medium">{$sortedEntries[$sortedEntries.length - 1]?.weight} <span class="text-white/50 text-sm">{$sortedEntries[$sortedEntries.length - 1]?.weightUnit}</span></div>
				</div>
				<div>
					<div class="text-white/40 text-xs uppercase tracking-wider">Current</div>
					<div class="text-lg font-medium">{$sortedEntries[0]?.weight} <span class="text-white/50 text-sm">{$sortedEntries[0]?.weightUnit}</span></div>
				</div>
				<div>
					<div class="text-white/40 text-xs uppercase tracking-wider">Total Change</div>
					<div class="text-lg font-medium {$sortedEntries[0].weight - $sortedEntries[$sortedEntries.length - 1].weight > 0 ? 'text-error-500' : 'text-success-500'}">
						{($sortedEntries[0].weight - $sortedEntries[$sortedEntries.length - 1].weight).toFixed(1)}
					</div>
				</div>
				<div>
					<div class="text-white/40 text-xs uppercase tracking-wider">Entries</div>
					<div class="text-lg font-medium">{$sortedEntries.length}</div>
				</div>
			</div>
		</div>

		<div class="card">
			<h2 class="section-title">All Entries</h2>
			<div class="space-y-1">
				{#each $sortedEntries as entry}
					<a href="/entry/{entry.id}" class="flex justify-between items-center py-3 -mx-2 px-2 rounded-[var(--radius)] hover:bg-white/5 transition-all">
						<div>
							<div class="font-medium">{entry.weight} <span class="text-white/50 text-sm">{entry.weightUnit}</span></div>
							<div class="date-muted">{new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
						</div>
						<div class="flex gap-2">
							{#if entry.photoPath}
								<span class="badge badge-photo">📷</span>
							{/if}
							{#if entry.measurements?.length}
								<span class="badge badge-measurement">{entry.measurements.length}</span>
							{/if}
						</div>
					</a>
				{/each}
			</div>
		</div>
	{/if}
</div>