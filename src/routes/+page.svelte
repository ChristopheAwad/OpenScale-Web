<script lang="ts">
	import { onMount } from 'svelte';
	import { loadData, sortedEntries, latestEntry, isLoading, preferences, activeGoal } from '$lib/stores';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import ProgressRing from '$lib/components/ProgressRing.svelte';

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

<div class="p-4 md:p-6 space-y-4 md:space-y-6 max-w-4xl mx-auto">
	<header class="flex items-center justify-between">
		<h1 class="text-2xl md:text-3xl font-bold tracking-tight">OpenWeight</h1>
	</header>

	{#if $isLoading}
		<div class="flex justify-center py-12">
			<div class="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
		</div>
	{:else if $latestEntry}
		<div class="card md:p-6">
			<div class="label mb-1">Current Weight</div>
			<div class="value-main md:text-4xl">
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
			{@const startWeight = $sortedEntries[$sortedEntries.length - 1]?.weight || entry.weight}
			{@const progress = Math.min(100, Math.max(0, ((startWeight - entry.weight) / (startWeight - goal.targetWeight)) * 100))}
			<div class="card md:p-6">
				<div class="flex justify-between items-center mb-4">
					<span class="text-white/80 font-medium">Goal Progress</span>
					<span class="text-sm text-white/50">{goal.targetWeight} {goal.weightUnit}</span>
				</div>
				<div class="flex items-center gap-6">
					<ProgressRing progress={progress} size={100} strokeWidth={8} />
					<div class="flex-1 space-y-2">
						<div class="text-sm text-white/60">Remaining</div>
						<div class="{remaining > 0 ? 'text-success-500' : 'text-error-500'} text-lg font-semibold">
							{remaining > 0 ? `${remaining.toFixed(1)}` : 'Goal reached!'}
						</div>
						<div class="text-xs text-white/40">
							Target: {goal.targetWeight} {goal.weightUnit}
						</div>
					</div>
				</div>
			</div>
		{/if}

		<div class="card md:p-6">
			<div class="flex justify-between items-center mb-3">
				<h2 class="section-title mb-0">Recent Entries</h2>
				<a href="/chart" class="text-sm text-primary-400 hover:text-primary-300 transition-colors">View all</a>
			</div>
			<div class="space-y-1 md:space-y-2">
				{#each $sortedEntries.slice(0, 5) as entry}
					<a href="/entry/{entry.id}" class="flex justify-between items-center py-3 -mx-2 px-2 rounded-[var(--radius)] hover:bg-white/5 transition-all md:-mx-4 md:px-4">
						<div>
							<div class="font-medium md:text-lg">{entry.weight} <span class="text-white/50 text-sm">{entry.weightUnit}</span></div>
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
		<EmptyState
			icon="scale"
			title="No entries yet"
			description="Start tracking your weight journey today"
			actionText="Add First Entry"
			actionHref="/add"
		/>
	{/if}
</div>