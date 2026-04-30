<script lang="ts">
	import { preferences, updatePreferences, isLoading, entries, goals } from '$lib/stores';
	import { addToast } from '$lib/stores/toast';
	import type { UserPreferences, WeightEntry, Goal } from '$lib/models';
	import { onMount } from 'svelte';

	let weightUnit = $state<'kg' | 'lb'>('kg');
	let measurementUnit = $state<'cm' | 'in'>('cm');
	let showDeleteConfirm = $state(false);

	$effect(() => {
		if (!$isLoading && $preferences) {
			weightUnit = $preferences.weightUnit;
			measurementUnit = $preferences.measurementUnit;
		}
	});

	async function handleSave() {
		try {
			await updatePreferences({ weightUnit, measurementUnit });
			addToast('Preferences saved successfully!', 'success');
		} catch (err) {
			addToast('Failed to save preferences. Please try again.', 'error');
		}
	}

	function exportData() {
		const data = {
			entries: $entries,
			goals: $goals,
			preferences: $preferences,
			exportedAt: new Date().toISOString()
		};
		const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `openweight-backup-${new Date().toISOString().split('T')[0]}.json`;
		a.click();
		URL.revokeObjectURL(url);
		addToast('Data exported successfully!', 'success');
	}

	async function importData() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = 'application/json';
		input.onchange = async (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (!file) return;
			
			try {
				const text = await file.text();
				const data = JSON.parse(text);
				addToast('Data import feature coming soon!', 'info');
			} catch (err) {
				addToast('Failed to import data. Invalid file format.', 'error');
			}
		};
		input.click();
	}

	async function deleteAccount() {
		if (!confirm('This will permanently delete all your data. This action cannot be undone. Are you sure?')) {
			return;
		}
		addToast('Account deletion feature coming soon!', 'info');
		showDeleteConfirm = false;
	}
</script>

<div class="p-4 md:p-6 space-y-4 md:space-y-6 max-w-4xl mx-auto">
	<h1 class="text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>

	<div class="card md:p-6 space-y-4">
		<h2 class="section-title">Units</h2>
		
		<div>
			<label class="label block mb-2">Weight Unit</label>
			<select bind:value={weightUnit} onchange={handleSave} class="input-custom appearance-none cursor-pointer">
				<option value="kg">Kilograms (kg)</option>
				<option value="lb">Pounds (lb)</option>
			</select>
		</div>
		
		<div>
			<label class="label block mb-2">Measurement Unit</label>
			<select bind:value={measurementUnit} onchange={handleSave} class="input-custom appearance-none cursor-pointer">
				<option value="cm">Centimeters (cm)</option>
				<option value="in">Inches (in)</option>
			</select>
		</div>
	</div>

	<div class="card md:p-6 space-y-4">
		<h2 class="section-title">Data Management</h2>
		<div class="flex gap-2">
			<button onclick={exportData} class="btn-custom btn-outline-custom flex-1">
				Export Data
			</button>
			<button onclick={importData} class="btn-custom btn-outline-custom flex-1">
				Import Data
			</button>
		</div>
	</div>

	<div class="card md:p-6 space-y-4">
		<h2 class="section-title text-error-500">Danger Zone</h2>
		{#if showDeleteConfirm}
			<div class="bg-error-500/10 border border-error-500/30 rounded-[var(--radius)] p-4">
				<p class="text-sm text-white/80 mb-3">This will permanently delete all your data including entries, goals, and preferences. This action cannot be undone.</p>
				<div class="flex gap-2">
					<button onclick={() => showDeleteConfirm = false} class="btn-custom btn-outline-custom flex-1">
						Cancel
					</button>
					<button onclick={deleteAccount} class="btn-custom bg-error-500 hover:bg-error-500/80 text-white flex-1">
						Delete Everything
					</button>
				</div>
			</div>
		{:else}
			<button onclick={() => showDeleteConfirm = true} class="btn-custom btn-outline-custom text-error-500 border-error-500/30 hover:bg-error-500/10 w-full">
				Delete Account
			</button>
		{/if}
	</div>

	<div class="card md:p-6 space-y-3">
		<h2 class="section-title">About</h2>
		<div class="text-white/60 text-sm">
			<p>OpenWeight is an open source weight tracking app.</p>
			<p class="mt-2">Your data is stored locally in your browser.</p>
		</div>
	</div>
</div>