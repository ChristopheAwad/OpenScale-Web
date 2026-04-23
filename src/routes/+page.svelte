<script lang="ts">
	import { onMount } from 'svelte';
	import { loadData, sortedEntries, latestEntry, isLoading, preferences, activeGoal } from '$lib/stores';

	onMount(() => {
		loadData();
	});

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		});
	}

	function getWeightDiff(): string {
		const entries = $sortedEntries;
		if (entries.length < 2) return '';
		const diff = entries[0].weight - entries[1].weight;
		const sign = diff > 0 ? '+' : '';
		return `${sign}${diff.toFixed(1)} ${entries[0].weightUnit}`;
	}
</script>

<div class="p-4 space-y-4">
	<header class="flex items-center justify-between">
		<h1 class="text-2xl font-bold tracking-tight">OpenWeight</h1>
	</header>

	{#if $isLoading}
		<div class="flex justify-center py-12">
			<div class="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
		</div>
	{:else if $latestEntry}
		<div class="card">
			<div class="label mb-1">Current Weight</div>
			<div class="value-main">
				{$latestEntry.weight}
				<span class="value-unit">{$latestEntry.weightUnit}</span>
			</div>
			{#if $sortedEntries.length >= 2}
				<div class="text-sm mt-2 {($sortedEntries[0].weight - $sortedEntries[1].weight) > 0 ? 'text-error-500' : 'text-success-500'}">
					{getWeightDiff()} from last entry
				</div>
			{/if}
			<div class="date-muted mt-2">
				{formatDate($latestEntry.date)}
			</div>
		</div>

		{#if $activeGoal}
			{@const goal = $activeGoal}
			{@const entry = $latestEntry}
			{@const remaining = entry.weight - goal.targetWeight}
			<div class="card">
				<div class="flex justify-between items-center">
					<span class="text-white/80 font-medium">Goal Progress</span>
					<span class="text-sm text-white/50">{goal.targetWeight} {goal.weightUnit}</span>
				</div>
				<div class="mt-3">
					<div class="h-2 bg-white/10 rounded-full overflow-hidden">
						<div
							class="h-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all duration-500"
							style="width: {Math.min(100, Math.max(0, (1 - remaining / (entry.weight - goal.targetWeight)) * 100))}%"
						></div>
					</div>
				</div>
				<div class="text-sm mt-2 flex justify-between">
					<span class="{remaining > 0 ? 'text-success-500' : 'text-error-500'}">
						{remaining > 0 ? `${remaining.toFixed(1)} to go` : 'Goal reached!'}
					</span>
				</div>
			</div>
		{/if}

		<div class="card">
			<div class="flex justify-between items-center mb-3">
				<h2 class="section-title mb-0">Recent Entries</h2>
				<a href="/chart" class="text-sm text-primary-400 hover:text-primary-300 transition-colors">View all</a>
			</div>
			<div class="space-y-1">
				{#each $sortedEntries.slice(0, 5) as entry}
					<a href="/entry/{entry.id}" class="flex justify-between items-center py-3 -mx-2 px-2 rounded-[var(--radius)] hover:bg-white/5 transition-all">
						<div>
							<div class="font-medium">{entry.weight} <span class="text-white/50 text-sm">{entry.weightUnit}</span></div>
							<div class="date-muted">{formatDate(entry.date)}</div>
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
	{:else}
		<div class="card text-center py-12">
			<div class="text-white/40 mb-4">No entries yet</div>
			<a href="/add" class="btn-custom btn-primary-custom">Add First Entry</a>
		</div>
	{/if}
</div>