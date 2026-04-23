<script lang="ts">
	import { createWeightEntry } from '$lib/models';
	import { addEntry } from '$lib/stores';
	import { goto } from '$app/navigation';
	import type { MeasurementType } from '$lib/models';

	let weight = $state(70);
	let weightUnit = $state<'kg' | 'lb'>('kg');
	let date = $state(new Date().toISOString().split('T')[0]);
	let notes = $state('');
	let photoData = $state<string | null>(null);
	let measurements = $state<{ type: MeasurementType; value: number }[]>([]);

	const measurementTypes: MeasurementType[] = ['waist', 'chest', 'hips', 'arms', 'thighs'];

	function addMeasurement() {
		measurements = [...measurements, { type: 'waist', value: 0 }];
	}

	function removeMeasurement(index: number) {
		measurements = measurements.filter((_, i) => i !== index);
	}

	function handlePhotoSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files && input.files[0]) {
			const file = input.files[0];
			const reader = new FileReader();
			reader.onload = () => {
				photoData = reader.result as string;
			};
			reader.readAsDataURL(file);
		}
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		const entry = createWeightEntry(
			weight,
			weightUnit,
			date,
			notes || undefined,
			measurements.map(m => ({ ...m, unit: 'cm' as const })),
			photoData || undefined
		);
		await addEntry(entry);
		goto('/');
	}
</script>

<div class="p-4 space-y-4">
	<h1 class="text-2xl font-bold tracking-tight">Add Entry</h1>

	<form onsubmit={handleSubmit} class="space-y-4">
		<div class="card space-y-4">
			<h2 class="section-title">Weight</h2>
			<div class="flex gap-2">
				<input
					type="number"
					step="0.1"
					bind:value={weight}
					class="input-custom"
					required
				/>
				<select bind:value={weightUnit} class="input-custom w-24 text-center appearance-none cursor-pointer">
					<option value="kg">kg</option>
					<option value="lb">lb</option>
				</select>
			</div>
			<div>
				<label class="label block mb-2">Date</label>
				<input
					type="date"
					bind:value={date}
					class="input-custom"
					required
				/>
			</div>
		</div>

		<div class="card space-y-4">
			<h2 class="section-title">Measurements <span class="text-white/30">(optional)</span></h2>
			{#each measurements as m, i}
				<div class="flex gap-2 items-center">
					<select bind:value={m.type} class="input-custom flex-1">
						{#each measurementTypes as type}
							<option value={type}>{type}</option>
						{/each}
					</select>
					<input
						type="number"
						step="0.1"
						bind:value={m.value}
						class="input-custom w-24"
						placeholder="0"
					/>
					<span class="text-white/40 w-8">cm</span>
					<button type="button" onclick={() => removeMeasurement(i)} class="btn-icon text-white/40 hover:text-error-500" aria-label="Remove">
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			{/each}
			<button type="button" onclick={addMeasurement} class="btn-custom btn-outline-custom text-sm">
				+ Add Measurement
			</button>
		</div>

		<div class="card space-y-4">
			<h2 class="section-title">Photo <span class="text-white/30">(optional)</span></h2>
			<div class="flex gap-3">
				<label class="btn-custom btn-outline-custom cursor-pointer">
					<input type="file" accept="image/*" onchange={handlePhotoSelect} class="hidden" />
					{photoData ? 'Change' : 'Add'}
				</label>
				{#if photoData}
					<button type="button" onclick={() => photoData = null} class="btn-icon text-white/40 hover:text-error-500">
						Remove
					</button>
				{/if}
			</div>
			{#if photoData}
				<img src={photoData} alt="Preview" class="w-full max-h-48 object-contain rounded-[var(--radius)] bg-white/5" />
			{/if}
		</div>

		<div class="card space-y-3">
			<label class="section-title mb-0">Notes <span class="text-white/30">(optional)</span></label>
			<textarea
				bind:value={notes}
				class="input-custom resize-none"
				rows="3"
				placeholder="How are you feeling?"
			></textarea>
		</div>

		<button type="submit" class="btn-custom btn-primary-custom w-full">
			Save Entry
		</button>
	</form>
</div>