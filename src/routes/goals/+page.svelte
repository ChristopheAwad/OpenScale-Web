<script lang="ts">
	import { onMount } from 'svelte';
	import { createGoal } from '$lib/models';
	import { addGoal, goals, setActiveGoal, deleteGoal } from '$lib/stores';
	import { addToast } from '$lib/stores/toast';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import type { Goal } from '$lib/models';

	let showAddForm = $state(false);
	let targetWeight = $state(70);
	let weightUnit = $state<'kg' | 'lb'>('kg');
	let targetDate = $state('');

	onMount(() => {
		if ($goals.length === 0) showAddForm = true;
	});

	async function handleSubmit(e: Event) {
		console.log('[openweight] CLIENT - goals handleSubmit called');
		e.preventDefault();
		try {
			console.log('[openweight] CLIENT - creating goal object');
			const goal = createGoal(targetWeight, weightUnit, targetDate || undefined);
			console.log('[openweight] CLIENT - goal created:', goal);
			await addGoal(goal);
			showAddForm = false;
			addToast('Goal created successfully!', 'success');
		} catch (err) {
			console.error('[openweight] CLIENT - goals handleSubmit error:', err);
			addToast('Failed to create goal. Please try again.', 'error');
		}
	}

	async function handleSetActive(id: string) {
		try {
			await setActiveGoal(id);
			addToast('Goal set as active!', 'success');
		} catch (err) {
			addToast('Failed to update goal. Please try again.', 'error');
		}
	}

	async function handleDelete(id: string) {
		try {
			await deleteGoal(id);
			addToast('Goal deleted successfully', 'success');
		} catch (err) {
			addToast('Failed to delete goal. Please try again.', 'error');
		}
	}
</script>

<div class="p-4 space-y-4">
	<h1 class="text-2xl font-bold tracking-tight">Goals</h1>

	{#if showAddForm}
		<form onsubmit={(e) => handleSubmit(e)} class="card space-y-4">
			<h2 class="section-title">Set New Goal</h2>
			<div class="flex gap-2">
				<input
					type="number"
					step="0.1"
					bind:value={targetWeight}
					class="input-custom"
					required
				/>
				<select bind:value={weightUnit} class="input-custom w-24 text-center appearance-none cursor-pointer">
					<option value="kg">kg</option>
					<option value="lb">lb</option>
				</select>
			</div>
			<input
				type="date"
				bind:value={targetDate}
				class="input-custom"
				placeholder="Target date (optional)"
			/>
			<div class="flex gap-2">
				<button type="submit" class="btn-custom btn-primary-custom flex-1">Save Goal</button>
				<button type="button" onclick={() => showAddForm = false} class="btn-custom btn-outline-custom">Cancel</button>
			</div>
		</form>
	{:else}
		<button onclick={() => showAddForm = true} class="btn-custom btn-outline-custom w-full">
			+ Set New Goal
		</button>
	{/if}

	<div class="space-y-3">
		{#each $goals as goal}
			<div class="card {goal.isActive ? 'ring-2 ring-primary-500' : ''}">
				<div class="flex justify-between items-start">
					<div>
						<div class="text-lg font-semibold">
							{goal.targetWeight} <span class="text-white/50 font-normal">{goal.weightUnit}</span>
						</div>
						{#if goal.targetDate}
							<div class="text-sm text-white/60">
								Target: {new Date(goal.targetDate).toLocaleDateString()}
							</div>
						{/if}
						<div class="text-xs text-white/30 mt-1">
							Created: {new Date(goal.createdAt).toLocaleDateString()}
						</div>
					</div>
					<div class="flex gap-2">
						{#if !goal.isActive}
							<button onclick={() => handleSetActive(goal.id)} class="btn-custom btn-primary-custom text-sm py-2">
								Set Active
							</button>
						{:else}
							<span class="badge badge-photo">Active</span>
						{/if}
						<button onclick={() => handleDelete(goal.id)} class="btn-icon text-white/40 hover:text-error-500" aria-label="Delete goal">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
							</svg>
						</button>
					</div>
				</div>
			</div>
		{/each}
	</div>

	{#if $goals.length === 0 && !showAddForm}
		<EmptyState
			icon="target"
			title="No goals set yet"
			description="Set a target weight to track your progress"
			actionText="Set First Goal"
			onAction={() => showAddForm = true}
		/>
	{/if}
</div>