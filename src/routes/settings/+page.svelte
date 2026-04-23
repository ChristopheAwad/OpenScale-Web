<script lang="ts">
	import { preferences, updatePreferences, isLoading } from '$lib/stores';
	import type { UserPreferences } from '$lib/models';

	let weightUnit = $state<'kg' | 'lb'>('kg');
	let measurementUnit = $state<'cm' | 'in'>('cm');

	$effect(() => {
		if (!$isLoading && $preferences) {
			weightUnit = $preferences.weightUnit;
			measurementUnit = $preferences.measurementUnit;
		}
	});

	async function handleSave() {
		await updatePreferences({ weightUnit, measurementUnit });
	}
</script>

<div class="p-4 space-y-4">
	<h1 class="text-2xl font-bold tracking-tight">Settings</h1>

	<div class="card space-y-4">
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

	<div class="card space-y-3">
		<h2 class="section-title">About</h2>
		<div class="text-white/60 text-sm">
			<p>OpenWeight is an open source weight tracking app.</p>
			<p class="mt-2">Your data is stored locally in your browser.</p>
		</div>
	</div>
</div>