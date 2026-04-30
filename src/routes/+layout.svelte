<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { checkAuth, isLoggedIn, loadData } from '$lib/stores';
	import Toast from '$lib/components/Toast.svelte';
	import QuickAdd from '$lib/components/QuickAdd.svelte';

	let { children } = $props();

	const navItems = [
		{ href: '/', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
		{ href: '/chart', label: 'Chart', icon: 'M7 12l3-3m0 0l3 3m-3-3v8m0-13.94A1 1 0 0121.83 1.06L18.17 6a1 1 0 01-.7 1.7h-2.5a6 6 0 00-6 6v2.5a1 1 0 01-1 1zm6 6a2 2 0 104 0' },
		{ href: '/goals', label: 'Goals', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
		{ href: '/settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573 1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
	];

	const publicRoutes = ['/auth/register', '/auth/login'];

	onMount(async () => {
		const loggedIn = await checkAuth();
		const currentPath = $page.url.pathname;
		
		if (!loggedIn && !publicRoutes.includes(currentPath)) {
			goto('/auth/login');
		} else if (loggedIn) {
			await loadData();
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>OpenWeight</title>
</svelte:head>

<a href="#main-content" class="skip-nav">Skip to main content</a>

<div class="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
	<main id="main-content" class="flex-1 pb-24 md:pb-8 md:pt-4 max-w-4xl mx-auto w-full">
		{@render children()}
	</main>

	<Toast />

	<nav class="fixed bottom-0 left-0 right-0 bg-surface-100/80 backdrop-blur-xl border-t border-white/5 flex justify-around items-center py-3 px-4 z-50 shadow-2xl shadow-black/50 md:relative md:border-t-0 md:border-b md:bg-transparent md:shadow-none md:max-w-4xl md:mx-auto md:py-4">
		{#each navItems as item}
			{@const isActive = $page.url.pathname === item.href}
			<a
				href={item.href}
				class="flex flex-col items-center gap-1 p-2 rounded-[var(--radius)] transition-all {isActive ? 'text-primary-400 bg-primary-500/10' : 'text-white/50 hover:text-white hover:bg-white/5'} md:flex-row md:gap-2 md:px-4 md:py-2"
				aria-current={isActive ? 'page' : undefined}
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.icon} />
				</svg>
				<span class="text-[10px] font-medium md:text-sm">{item.label}</span>
			</a>
		{/each}
		<QuickAdd />
	</nav>
</div>