<script lang="ts">
	let { progress = 0, size = 120, strokeWidth = 8 } = $props();
	
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;
	const offset = circumference - (progress / 100) * circumference;
</script>

<div class="relative inline-flex items-center justify-center">
	<svg width={size} height={size} class="transform -rotate-90">
		<circle
			cx={size / 2}
			cy={size / 2}
			r={radius}
			fill="none"
			stroke="rgba(255,255,255,0.1)"
			stroke-width={strokeWidth}
		/>
		<circle
			cx={size / 2}
			cy={size / 2}
			r={radius}
			fill="none"
			stroke="rgb(56, 189, 248)"
			stroke-width={strokeWidth}
			stroke-linecap="round"
			stroke-dasharray={circumference}
			stroke-dashoffset={offset}
			class="transition-all duration-500"
		/>
	</svg>
	<div class="absolute text-center">
		<div class="text-2xl font-bold">{Math.round(progress)}%</div>
	</div>
</div>
