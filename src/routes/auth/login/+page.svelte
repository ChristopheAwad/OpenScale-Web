<script lang="ts">
	import { goto } from '$app/navigation';
	import { addToast } from '$lib/stores/toast';

	let username = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function handleLogin(e: Event) {
		e.preventDefault();
		error = '';
		loading = true;

		try {
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, password })
			});

			const data = await res.json();

			if (!res.ok) {
				error = data.error || 'Login failed';
				addToast(error, 'error');
			} else {
				addToast('Login successful!', 'success');
				goto('/');
			}
		} catch {
			error = 'Network error';
			addToast('Network error. Please try again.', 'error');
		} finally {
			loading = false;
		}
	}
</script>

<div class="auth-container">
	<h1 class="text-2xl font-bold text-center mb-6">Login</h1>

	{#if error}
		<div class="alert alert-error">
			{error}
		</div>
	{/if}

	<form onsubmit={handleLogin} class="card space-y-4">
		<div>
			<label class="label block mb-2" for="username">Username</label>
			<input
				id="username"
				type="text"
				bind:value={username}
				class="input-custom"
				required
				autocomplete="username"
			/>
		</div>

		<div>
			<label class="label block mb-2" for="password">Password</label>
			<input
				id="password"
				type="password"
				bind:value={password}
				class="input-custom"
				required
				autocomplete="current-password"
			/>
		</div>

		<button type="submit" class="btn-custom btn-primary-custom w-full" disabled={loading}>
			{loading ? 'Logging in...' : 'Login'}
		</button>
	</form>

	<p class="text-center mt-4">
		Don't have an account? <a href="/auth/register" class="link">Register</a>
	</p>
</div>