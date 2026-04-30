<script lang="ts">
	import { onMount } from 'svelte';
	import { Chart, registerables } from 'chart.js';
	import { sortedEntries, isLoading } from '$lib/stores';
	
	let canvas: HTMLCanvasElement;
	let chart: Chart | null = null;
	let dateRange = $state('1M');

	onMount(() => {
		Chart.register(...registerables);
	});

	function getFilteredEntries() {
		if ($sortedEntries.length === 0) return [];
		
		const now = new Date();
		const msAgo = {
			'1W': 7 * 24 * 60 * 60 * 1000,
			'1M': 30 * 24 * 60 * 60 * 1000,
			'3M': 90 * 24 * 60 * 60 * 1000,
			'6M': 180 * 24 * 60 * 60 * 1000,
			'1Y': 365 * 24 * 60 * 60 * 1000,
			'All': Infinity
		};
		
		const cutoff = new Date(now.getTime() - msAgo[dateRange]);
		return $sortedEntries.filter(e => new Date(e.date) >= cutoff);
	}

	function calculateMovingAverage(entries: any[], window: number = 7) {
		const result = [];
		for (let i = 0; i < entries.length; i++) {
			const start = Math.max(0, i - window + 1);
			const slice = entries.slice(start, i + 1);
			const avg = slice.reduce((sum, e) => sum + e.weight, 0) / slice.length;
			result.push(avg);
		}
		return result;
	}

	$effect(() => {
		const filtered = getFilteredEntries();
		if (filtered.length && canvas) {
			if (chart) chart.destroy();

			const entries = [...filtered].reverse();
			const labels = entries.map(e => new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
			const data = entries.map(e => e.weight);
			const movingAvg = calculateMovingAverage(entries, 7);

			chart = new Chart(canvas, {
				type: 'line',
				data: {
					labels,
					datasets: [
						{
							label: 'Weight',
							data,
							borderColor: 'rgb(56, 189, 248)',
							backgroundColor: 'rgba(56, 189, 248, 0.1)',
							fill: true,
							tension: 0.3,
							pointRadius: 3,
							pointHoverRadius: 6
						},
						{
							label: '7-Day Average',
							data: movingAvg,
							borderColor: 'rgb(168, 85, 247)',
							borderWidth: 2,
							fill: false,
							tension: 0.3,
							pointRadius: 0,
							borderDash: [5, 5]
						}
					]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					interaction: {
						intersect: false,
						mode: 'index'
					},
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
						},
						tooltip: {
							callbacks: {
								label: function(context) {
									return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}`;
								}
							}
						}
					}
				}
			});
		}
	});

</script>

<div class="p-4 md:p-6 space-y-4 md:space-y-6 max-w-4xl mx-auto">
	<h1 class="text-2xl md:text-3xl font-bold tracking-tight">Progress Chart</h1>

	{#if $sortedEntries.length > 0}
		<div class="card md:p-6">
			<div class="flex gap-2 mb-4 overflow-x-auto pb-2">
				{#each ['1W', '1M', '3M', '6M', '1Y', 'All'] as range}
					<button
						onclick={() => dateRange = range}
						class="px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all {dateRange === range ? 'bg-primary-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}"
					>
						{range}
					</button>
				{/each}
			</div>
			<div class="h-72 md:h-96">
				<canvas bind:this={canvas}></canvas>
			</div>
		</div>
	{/if}

	{#if $isLoading}
		<div class="flex justify-center py-12">
			<div class="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
		</div>
	{:else if $sortedEntries.length === 0}
		<EmptyState
			icon="chart"
			title="No entries to display yet"
			description="Add weight entries to see your progress chart"
			actionText="Add Entry"
			actionHref="/add"
		/>
	{:else}
		<div class="card md:p-6">
			<div class="h-72 md:h-96">
				<canvas bind:this={canvas}></canvas>
			</div>
		</div>

		<div class="card md:p-6">
			<h2 class="section-title">Statistics</h2>
			<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
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

		<div class="card md:p-6">
			<h2 class="section-title">All Entries</h2>
			<div class="space-y-1 md:space-y-2">
				{#each $sortedEntries as entry}
					<a href="/entry/{entry.id}" class="flex justify-between items-center py-3 -mx-2 px-2 rounded-[var(--radius)] hover:bg-white/5 transition-all md:-mx-4 md:px-4">
						<div>
							<div class="font-medium md:text-lg">{entry.weight} <span class="text-white/50 text-sm">{entry.weightUnit}</span></div>
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